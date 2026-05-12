"use client";

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";
import { TranslifyIcon } from "@/components/translify-mark";

// ─── Book page data ────────────────────────────────────────────────────────────
const BOOK_PAGES = [
  { text: "読む喜びを、あなたの言語で。",                lang: "日本語",   accent: "#E0A450", rtl: false },
  { text: "كل كتاب بلغتك",                               lang: "العربية",  accent: "#7BA17C", rtl: true  },
  { text: "Chaque livre dans votre langue.",              lang: "Français", accent: "#E0A450", rtl: false },
  { text: "Cada libro en tu idioma.",                     lang: "Español",  accent: "#C17A68", rtl: false },
  { text: "Jedes Buch in deiner Sprache.",                lang: "Deutsch",  accent: "#7BA17C", rtl: false },
  { text: "Todos os livros no seu idioma.",               lang: "Português",accent: "#E0A450", rtl: false },
  { text: "모든 책을 당신의 언어로.",                     lang: "한국어",   accent: "#C17A68", rtl: false },
  { text: "Every book. In your language.",                lang: "English",  accent: "#F8F4EE", rtl: false },
] as const;

// ─── Canvas texture for each floating page ────────────────────────────────────
function makePageTexture(page: (typeof BOOK_PAGES)[number]): THREE.CanvasTexture {
  const W = 640, H = 380;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  // Dark glass background
  ctx.fillStyle = "#08081A";
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 12);
  ctx.fill();

  // Subtle border
  ctx.globalAlpha = 1;
  ctx.strokeStyle = page.accent + "45";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(12, 12, W - 24, H - 24, 8);
  ctx.stroke();

  // Top-left accent bar
  ctx.fillStyle = page.accent;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(36, 46, 48, 2);

  // Language label
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = page.accent;
  ctx.font = "700 11px 'Hanken Grotesk', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(page.lang.toUpperCase(), 36, 38);

  // Main text — word-wrap into the card
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#F8F4EE";
  ctx.font = "italic 28px 'Fraunces', Georgia, serif";
  const maxW = W - 72;
  if (page.rtl) {
    ctx.textAlign = "right";
    ctx.fillText(page.text, W - 36, 170);
  } else {
    ctx.textAlign = "left";
    const words = page.text.split(" ");
    let line = "", y = 155;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trimEnd(), 36, y);
        line = word + " ";
        y += 44;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trimEnd(), 36, y);
  }

  // Bottom decorative dot
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = page.accent;
  ctx.beginPath();
  ctx.arc(36, H - 36, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(52, H - 36, 3.5, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(c);
}

// ─── Three.js scene ───────────────────────────────────────────────────────────
function initScene(canvas: HTMLCanvasElement): () => void {
  let animId = 0;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070714);
  scene.fog = new THREE.FogExp2(0x070714, 0.014);

  // Camera
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 15);

  // ── Central glow sprite (additive, no post-processing needed) ──────────────
  const glowCvs = document.createElement("canvas");
  glowCvs.width = glowCvs.height = 256;
  const gc = glowCvs.getContext("2d")!;
  const grd = gc.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0,   "rgba(224,164,80,0.85)");
  grd.addColorStop(0.25,"rgba(224,164,80,0.35)");
  grd.addColorStop(0.6, "rgba(193,122,64,0.08)");
  grd.addColorStop(1,   "transparent");
  gc.fillStyle = grd;
  gc.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCvs);
  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glowSprite.scale.set(14, 14, 1);
  glowSprite.position.set(0, 0, -1);
  scene.add(glowSprite);

  // ── Particle field ─────────────────────────────────────────────────────────
  const PARTICLE_COUNT = window.innerWidth < 768 ? 1800 : 4000;
  const pPos = new Float32Array(PARTICLE_COUNT * 3);
  const pCol = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute in a thick spherical shell
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 7 + Math.random() * 14;
    pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
    // Warm amber → saffron, slight variance
    pCol[i * 3]     = 0.78 + Math.random() * 0.22;
    pCol[i * 3 + 1] = 0.38 + Math.random() * 0.38;
    pCol[i * 3 + 2] = 0.02 + Math.random() * 0.14;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color",    new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.052,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  scene.add(particles);

  // ── Floating book pages ────────────────────────────────────────────────────
  type PageState = {
    mesh: THREE.Mesh;
    rotDir: number;
    floatAmp: number;
    floatSpeed: number;
    floatPhase: number;
    baseY: number;
  };

  const pageStates: PageState[] = BOOK_PAGES.map((data, i) => {
    const tex = makePageTexture(data);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 3.1),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.70,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );

    // Place in a ring around the scene, varying depth
    const angle = (i / BOOK_PAGES.length) * Math.PI * 2;
    const ring  = 7.5 + (i % 3) * 1.4;
    mesh.position.set(
      Math.cos(angle) * ring,
      (Math.random() - 0.5) * 7,
      Math.sin(angle) * ring * 0.55 - 3
    );
    // Face slightly inward, with a random tilt
    mesh.rotation.y = angle + Math.PI * 0.55;
    mesh.rotation.x = (Math.random() - 0.5) * 0.28;
    mesh.rotation.z = (Math.random() - 0.5) * 0.18;

    scene.add(mesh);
    return {
      mesh,
      rotDir:     i % 2 === 0 ? 1 : -1,
      floatAmp:   0.18 + Math.random() * 0.14,
      floatSpeed: 0.28 + Math.random() * 0.32,
      floatPhase: Math.random() * Math.PI * 2,
      baseY:      mesh.position.y,
    };
  });

  // ── Lights ─────────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1a1840, 3));
  const warmLight = new THREE.PointLight(0xE0A450, 4, 28);
  warmLight.position.set(0, 2, 6);
  scene.add(warmLight);

  // ── Mouse parallax ─────────────────────────────────────────────────────────
  let mx = 0, my = 0, camX = 0, camY = 0;
  const onMouse = (e: MouseEvent) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener("mousemove", onMouse, { passive: true });

  // ── Resize ─────────────────────────────────────────────────────────────────
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", onResize);

  // ── Animation ──────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  const animate = () => {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Particle field drifts
    particles.rotation.y = t * 0.022;
    particles.rotation.x = t * 0.007;

    // Pages float and slowly yaw
    for (const ps of pageStates) {
      ps.mesh.rotation.y += 0.0007 * ps.rotDir;
      ps.mesh.position.y = ps.baseY + Math.sin(t * ps.floatSpeed + ps.floatPhase) * ps.floatAmp;
    }

    // Central glow pulse
    const pulse = 1 + Math.sin(t * 1.4) * 0.12;
    glowSprite.scale.set(14 * pulse, 14 * pulse, 1);
    (glowSprite.material as THREE.SpriteMaterial).opacity = 0.55 + Math.sin(t * 1.4) * 0.12;

    // Camera parallax — smooth lerp
    camX += (mx * 2.2 - camX) * 0.028;
    camY += (-my * 1.4 - camY) * 0.028;
    camera.position.x = camX;
    camera.position.y = camY;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animate();

  // ── Cleanup ────────────────────────────────────────────────────────────────
  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("mousemove", onMouse);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    pGeo.dispose();
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function JoinClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router    = useRouter();

  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initScene(canvasRef.current);
    return cleanup;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name || undefined);
      setSuccess(true);
      setTimeout(() => router.push("/library?welcome=1"), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#070714" }}>
      {/* Three.js canvas — full bleed */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Edge vignette — focuses the eye on center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 10%, rgba(7,7,20,0.55) 75%, rgba(7,7,20,0.92) 100%)",
        }}
      />

      {/* ─ Top nav ─ */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 opacity-90 transition-opacity hover:opacity-100">
          <TranslifyIcon size={30} />
          <span
            className="font-[family-name:var(--font-display)] text-[1.1rem] font-semibold tracking-tight"
            style={{ color: "#F8F4EE" }}
          >
            Translify
          </span>
        </Link>
        <Link
          href="/login"
          className="text-[0.82rem] font-medium transition-colors"
          style={{ color: "rgba(248,244,238,0.45)" }}
        >
          Already a reader?{" "}
          <span
            className="underline underline-offset-4"
            style={{ color: "rgba(248,244,238,0.70)", textDecorationColor: "rgba(224,164,80,0.5)" }}
          >
            Sign in
          </span>
        </Link>
      </header>

      {/* ─ Main content ─ */}
      <main className="relative z-20 flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px]">

          {/* Pill badge */}
          <div className="mb-7 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.22em]"
              style={{
                background: "rgba(224,164,80,0.10)",
                border: "1px solid rgba(224,164,80,0.25)",
                color: "rgba(224,164,80,0.90)",
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "#E0A450" }}
              />
              Free forever · no card needed
            </span>
          </div>

          {/* Headline */}
          <div className="mb-8 text-center">
            <h1
              className="font-[family-name:var(--font-display)] font-semibold leading-[1.04] tracking-tight"
              style={{
                fontSize: "clamp(2.6rem,7vw,4rem)",
                color: "#F8F4EE",
              }}
            >
              Read any book.
              <br />
              <em style={{ color: "#E0A450" }}>Finally</em> in your{" "}
              <br className="hidden sm:block" />language.
            </h1>
            <p
              className="mx-auto mt-4 max-w-[340px] text-[0.97rem] leading-relaxed"
              style={{ color: "rgba(248,244,238,0.48)" }}
            >
              Upload any PDF or EPUB. We rebuild it in your language — layout intact. Then chat with it.
            </p>
          </div>

          {/* Glass form card */}
          <div
            className="overflow-hidden rounded-[1.6rem] p-7"
            style={{
              background: "rgba(8, 8, 26, 0.74)",
              backdropFilter: "blur(32px) saturate(160%)",
              WebkitBackdropFilter: "blur(32px) saturate(160%)",
              border: "1px solid rgba(224,164,80,0.18)",
              boxShadow:
                "0 0 0 1px rgba(248,244,238,0.04) inset, 0 0 80px rgba(224,164,80,0.07), 0 40px 80px rgba(0,0,0,0.55)",
            }}
          >
            {success ? (
              // Success state
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <span
                  className="grid h-14 w-14 place-items-center rounded-full text-2xl animate-pop-in"
                  style={{ background: "rgba(224,164,80,0.15)", color: "#E0A450" }}
                >
                  ✦
                </span>
                <p
                  className="font-[family-name:var(--font-display)] text-[1.3rem] font-semibold"
                  style={{ color: "#F8F4EE" }}
                >
                  Your shelf is ready.
                </p>
                <p className="text-sm" style={{ color: "rgba(248,244,238,0.5)" }}>
                  Taking you there now…
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <GlassInput
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
                <GlassInput
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />
                <GlassInput
                  type="password"
                  placeholder="Password (8+ characters)"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                {error && (
                  <p
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: "rgba(220,38,38,0.12)",
                      border: "1px solid rgba(220,38,38,0.25)",
                      color: "#FCA5A5",
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={submitting || !email || !password}
                  className="group relative mt-1 h-[3.4rem] w-full overflow-hidden rounded-full font-[family-name:var(--font-display)] text-[1rem] font-semibold transition-all hover:-translate-y-[2px] hover:shadow-[0_14px_40px_-8px_rgba(224,164,80,0.55)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{
                    background: "linear-gradient(135deg, #E0A450 0%, #C17840 100%)",
                    color: "#070714",
                    boxShadow: "0 4px 0 rgba(0,0,0,0.35), 0 10px 30px -8px rgba(224,164,80,0.4)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting
                      ? "Creating your shelf…"
                      : "Start reading for free →"}
                  </span>
                  {/* Shimmer sweep on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                </button>

                <p
                  className="text-center text-[0.7rem]"
                  style={{ color: "rgba(248,244,238,0.28)" }}
                >
                  No credit card · Cancel anytime · 30-day money-back guarantee
                </p>
              </form>
            )}
          </div>

          {/* Social proof strip */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex -space-x-2">
              {["L", "A", "K", "M", "R"].map((init, i) => (
                <span
                  key={i}
                  className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] text-[0.65rem] font-bold"
                  style={{
                    borderColor: "rgba(7,7,20,0.9)",
                    background: ["#E0A450","#7BA17C","#C17A68","#6B5B95","#4A7B6A"][i],
                    color: "#F8F4EE",
                  }}
                >
                  {init}
                </span>
              ))}
            </div>
            <p
              className="text-[0.78rem]"
              style={{ color: "rgba(248,244,238,0.38)" }}
            >
              <span style={{ color: "rgba(248,244,238,0.65)", fontWeight: 600 }}>42,000+</span>{" "}
              readers · 60+ countries
            </p>
          </div>

          {/* Fine print */}
          <p
            className="mt-5 text-center text-[0.68rem]"
            style={{ color: "rgba(248,244,238,0.22)" }}
          >
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4" style={{ textDecorationColor: "rgba(224,164,80,0.35)" }}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4" style={{ textDecorationColor: "rgba(224,164,80,0.35)" }}>
              Privacy Policy
            </Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Glass input ──────────────────────────────────────────────────────────────
function GlassInput({
  type, placeholder, value, onChange, autoComplete, required, minLength,
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: "rgba(248,244,238,0.05)",
        border: focused
          ? "1.5px solid rgba(224,164,80,0.65)"
          : "1.5px solid rgba(248,244,238,0.10)",
        boxShadow: focused ? "0 0 0 4px rgba(224,164,80,0.12)" : "none",
      }}
    >
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent px-4 py-3.5 text-[0.95rem] outline-none"
        style={{
          color: "#F8F4EE",
          caretColor: "#E0A450",
        }}
      />
    </div>
  );
}
