import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiException implements Exception {
  final int status;
  final String message;
  ApiException(this.status, this.message);
  @override
  String toString() => message;
}

/// Render a short, user-friendly message from any error our API surface emits.
/// Avoids dumping multi-line stack traces into UI cards.
String describeError(Object error) {
  if (error is ApiException) return error.message;
  if (error is DioException) {
    final base = error.requestOptions.uri.toString();
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
        return "Couldn't reach the server in time.\nCheck your connection and try again.";
      case DioExceptionType.receiveTimeout:
        return 'The server took too long to reply.\nGive it another shot in a moment.';
      case DioExceptionType.connectionError:
        return "Can't connect to $base.\nIs the API up and on the same network?";
      case DioExceptionType.badCertificate:
        return 'The server certificate looks off.';
      case DioExceptionType.cancel:
        return 'Request cancelled.';
      case DioExceptionType.badResponse:
        final code = error.response?.statusCode;
        return 'Server responded with ${code ?? "an error"}.';
      case DioExceptionType.unknown:
        return error.message ?? 'Something went sideways.';
    }
  }
  return error.toString();
}

class ApiClient {
  ApiClient({String? baseUrl})
      : dio = Dio(BaseOptions(
          baseUrl: _normalizeBaseUrl(baseUrl ?? _defaultBaseUrl),
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(minutes: 5),
          sendTimeout: const Duration(minutes: 30),
          contentType: 'application/json',
          responseType: ResponseType.json,
          validateStatus: (_) => true,
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: _tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ));
  }

  static const _tokenKey = 'translify_jwt';
  static const _storage = FlutterSecureStorage();

  // Android emulator → host: 10.0.2.2; iOS simulator → localhost.
  // Override: --dart-define=API_URL=https://translify.app/api
  static String get _defaultBaseUrl {
    const fromEnv = String.fromEnvironment('API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }

  /// Dio merges paths with [Uri.resolve]: a path starting with `/` would
  /// replace the whole URL path. We always use a trailing slash on the base
  /// and strip a leading `/` from request paths so `/books` and `books` both work.
  static String _normalizeBaseUrl(String url) {
    final u = url.trim();
    if (u.isEmpty) return 'http://localhost:8000/';
    return u.endsWith('/') ? u : '$u/';
  }

  static String _dioPath(String path) =>
      path.startsWith('/') ? path.substring(1) : path;

  final Dio dio;

  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<void> writeToken(String? token) async {
    if (token == null) {
      await _storage.delete(key: _tokenKey);
    } else {
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async =>
      _unwrap(await dio.get(_dioPath(path), queryParameters: query));

  Future<T> post<T>(String path,
      {Object? body, Map<String, dynamic>? query, Options? options}) async =>
      _unwrap(await dio.post(_dioPath(path),
          data: body, queryParameters: query, options: options));

  Future<T> delete<T>(String path) async =>
      _unwrap(await dio.delete(_dioPath(path)));

  Future<T> patch<T>(String path,
          {Object? body, Map<String, dynamic>? query}) async =>
      _unwrap(await dio.patch(_dioPath(path),
          data: body, queryParameters: query));

  Future<T> postForm<T>(String path, Map<String, String> form) async => _unwrap(
        await dio.post(
          _dioPath(path),
          data: form.entries
              .map((e) =>
                  '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
              .join('&'),
          options: Options(
            contentType: 'application/x-www-form-urlencoded',
          ),
        ),
      );

  T _unwrap<T>(Response res) {
    final code = res.statusCode ?? 0;
    if (code >= 200 && code < 300) {
      return res.data as T;
    }
    String msg = 'Request failed ($code)';
    final data = res.data;
    if (data is Map && data['detail'] is String) {
      msg = data['detail'] as String;
    } else if (data is Map && data['detail'] is List && (data['detail'] as List).isNotEmpty) {
      final first = (data['detail'] as List).first;
      if (first is Map && first['msg'] is String) msg = first['msg'] as String;
    }
    throw ApiException(code, msg);
  }
}
