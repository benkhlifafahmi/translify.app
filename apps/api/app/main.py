"""FastAPI app entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth.schemas import UserCreate, UserRead, UserUpdate
from app.auth.users import auth_backend, fastapi_users, google_oauth_client
from app.config import settings
from app.routes.billing import router as billing_router
from app.routes.books import router as books_router
from app.routes.chats import router as chats_router
from app.routes.garden import router as garden_router
from app.routes.folders import router as folders_router
from app.routes.highlights import router as highlights_router
from app.routes.magic_link import router as magic_link_router
from app.routes.onboarding import router as onboarding_router
from app.routes.profiles import router as profiles_router
from app.routes.quizzes import router as quizzes_router
from app.routes.seeds import router as seeds_router
from app.routes.social_auth import router as social_auth_router
from app.routes.translations import router as translations_router


log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Translify API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)

# Catch-all must be registered BEFORE CORS so that it sits *inside* the CORS
# middleware in the stack — that way CORS headers are still present on 500s.
class _CatchAllMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            log.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(_CatchAllMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


# Auth routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Google OAuth routes (no-ops when GOOGLE_CLIENT_ID is empty)
app.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backend,
        settings.jwt_secret,
        redirect_url="https://translify.app/auth/google/callback",
        associate_by_email=True,
        is_verified_by_default=True,
    ),
    prefix="/auth/google",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_oauth_associate_router(
        google_oauth_client,
        UserRead,
        settings.jwt_secret,
    ),
    prefix="/auth/associate/google",
    tags=["auth"],
)

# Domain routes
app.include_router(books_router)
app.include_router(translations_router)
app.include_router(chats_router)
app.include_router(highlights_router)
app.include_router(profiles_router)
app.include_router(quizzes_router)
app.include_router(garden_router)
app.include_router(billing_router)
app.include_router(onboarding_router)
app.include_router(magic_link_router)
app.include_router(seeds_router)
app.include_router(folders_router)
app.include_router(social_auth_router)
