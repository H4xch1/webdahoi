"use client";

import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect,
  useMemo, useRef, useState, startTransition, type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { GURU_MOTION } from "./config";
import "./guru-motion.css";

export interface MotionPoint { x: number; y: number }
interface MotionContextValue { open(href: string, point: MotionPoint | null, scroll?: boolean): boolean }
interface NativeTransition {
  ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>;
  skipTransition(): void;
}
interface NativeDocument {
  startViewTransition?: (update: () => Promise<void>) => NativeTransition;
}
interface Pending {
  transition: NativeTransition | null;
  resolve: (() => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
  skipped: boolean;
}
const MotionContext = createContext<MotionContextValue | null>(null);
export function useGuruMotion() { return useContext(MotionContext); }
const isGuruPath = (path: string) => path === "/guru" || path.startsWith("/guru/");
const isReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function getPage() { return document.querySelector<HTMLElement>("[data-guru-motion-page]"); }

function LivingBackground() {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    const visibility = () => setHidden(document.hidden);
    change(); visibility();
    try { setPaused(sessionStorage.getItem("guru-background-paused") === "1"); } catch { /* storage is optional */ }
    query.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      query.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const moving = !paused && !reduced && !hidden;
  const videoSource: string = GURU_MOTION.backgroundVideo;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (moving) void element.play().catch(() => setVideoFailed(true));
    else element.pause();
  }, [moving, videoSource, videoFailed]);
  if (!GURU_MOTION.backgroundEnabled || failed) return null;
  return <>
    <div className="gm-living-scene" aria-hidden="true">
      {videoSource && !videoFailed ? <video ref={video} muted loop playsInline preload="metadata"
        poster={GURU_MOTION.backgroundPoster} onError={() => setVideoFailed(true)}>
        <source src={videoSource} />
      </video> : /* Animated decorative artwork, not application content. */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={moving ? GURU_MOTION.backgroundLoop : GURU_MOTION.backgroundPoster}
          alt="" draggable={false} decoding="async" onError={() => setFailed(true)} />}
    </div>
    <button type="button" className="gm-background-toggle" disabled={reduced}
      aria-pressed={paused || reduced}
      aria-label={reduced ? "Animasi latar nonaktif sesuai preferensi perangkat" : paused ? "Putar animasi latar" : "Jeda animasi latar"}
      onClick={() => setPaused((current) => {
        const next = !current;
        try { sessionStorage.setItem("guru-background-paused", next ? "1" : "0"); } catch { /* optional */ }
        return next;
      })}>
      {reduced ? "Latar diam" : paused ? "Putar latar" : "Jeda latar"}
    </button>
  </>;
}

function ActiveGuruMotion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<Pending | null>(null);
  const fallback = useRef<Animation | null>(null);
  const previousPath = useRef<string | null>(null);
  const alive = useRef(true);

  const clear = useCallback((job: Pending) => {
    if (job.timer) clearTimeout(job.timer);
    job.timer = null;
    job.resolve?.(); job.resolve = null;
    if (pending.current === job) {
      pending.current = null;
      delete document.documentElement.dataset.guruNativeTransition;
      document.documentElement.style.removeProperty("--gm-origin");
    }
  }, []);
  const cancel = useCallback(() => {
    const job = pending.current;
    if (!job) return;
    job.skipped = true;
    job.transition?.skipTransition();
    clear(job);
  }, [clear]);

  useEffect(() => {
    alive.current = true;
    document.documentElement.dataset.guruMotionEnabled = "true";
    document.documentElement.style.setProperty("--gm-duration", `${GURU_MOTION.durationMs}ms`);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preferenceChanged = () => { if (query.matches) { cancel(); fallback.current?.cancel(); } };
    const visibilityChanged = () => { if (document.hidden) cancel(); };
    query.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      alive.current = false; cancel(); fallback.current?.cancel();
      delete document.documentElement.dataset.guruMotionEnabled;
      document.documentElement.style.removeProperty("--gm-duration");
      query.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [cancel]);

  // Layout effects run after the route's DOM commit. Never keep the old snapshot
  // waiting indefinitely for a slow server-component navigation.
  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    fallback.current?.cancel();
    const job = pending.current;
    if (job && !job.skipped) {
      if (job.timer) clearTimeout(job.timer);
      job.timer = null;
      job.resolve?.(); job.resolve = null;
      return;
    }
    const page = getPage();
    if (document.documentElement.hasAttribute("data-route-motion-active") || !page || isReduced() || typeof page.animate !== "function") return;
    fallback.current = page.animate([
      { opacity: .2, transform: "translateY(22px) scale(.9)", filter: "blur(5px)", offset: 0 },
      { opacity: 1, transform: "translateY(-1px) scale(1.008)", filter: "blur(0px)", offset: .7 },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)", offset: 1 },
    ], { duration: GURU_MOTION.durationMs, easing: "cubic-bezier(.2,.75,.25,1)", fill: "none" });
  }, [pathname]);

  const open = useCallback((href: string, point: MotionPoint | null, scroll?: boolean) => {
    const nativeDocument = document as unknown as NativeDocument;
    if (!alive.current || !isGuruPath(pathname) || isReduced() || document.hidden ||
        typeof nativeDocument.startViewTransition !== "function" || !getPage()) return false;
    let url: URL;
    try { url = new URL(href, window.location.href); } catch { return false; }
    // Query/hash-only navigation and navigation outside Guru keep normal Link behavior.
    if (url.origin !== window.location.origin || !isGuruPath(url.pathname) ||
        url.pathname === pathname || url.hash) return false;
    if (pending.current) { cancel(); return false; }
    fallback.current?.cancel();
    const rect = getPage()!.getBoundingClientRect();
    const x = point ? Math.max(0, Math.min(rect.width, point.x - rect.left)) : rect.width / 2;
    const y = point ? Math.max(0, Math.min(window.innerHeight, point.y - rect.top)) : Math.min(rect.height, window.innerHeight) / 3;
    const html = document.documentElement;
    html.dataset.guruNativeTransition = "true";
    html.style.setProperty("--gm-origin", `${x}px ${y}px`);
    const job: Pending = { transition: null, resolve: null, timer: null, skipped: false };
    pending.current = job;
    try {
      const transition = nativeDocument.startViewTransition.call(document, () => new Promise<void>((resolve) => {
        if (!alive.current || pending.current !== job) { resolve(); return; }
        job.resolve = resolve;
        job.timer = setTimeout(() => {
          job.skipped = true;
          job.transition?.skipTransition();
          clear(job);
        }, GURU_MOTION.maxSnapshotWaitMs);
        startTransition(() => router.push(`${url.pathname}${url.search}`, scroll === undefined ? {} : { scroll }));
      }));
      job.transition = transition;
      void transition.ready.catch(() => { job.skipped = true; });
      void transition.updateCallbackDone.catch(() => { job.skipped = true; clear(job); });
      void transition.finished.then(() => clear(job), () => clear(job));
      return true;
    } catch {
      // Starting the API failed before it took ownership: let Next Link navigate.
      clear(job); return false;
    }
  }, [pathname, router, cancel, clear]);
  const value = useMemo(() => ({ open }), [open]);
  return <MotionContext.Provider value={value}><LivingBackground />{children}</MotionContext.Provider>;
}

/** Shared dashboard wrapper: mounts motion only for the authenticated Guru role. */
export default function GuruMotionBoundary({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return enabled ? <ActiveGuruMotion>{children}</ActiveGuruMotion> : <>{children}</>;
}
