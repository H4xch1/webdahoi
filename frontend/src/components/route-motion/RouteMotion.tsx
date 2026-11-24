"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./route-motion.module.css";
import "./native-accent.css";

function motionKind(previous: string | null, next: string) {
  if (!previous) return "open";
  const old = previous.replace(/\/$/, "");
  const current = next.replace(/\/$/, "");
  if (old.startsWith(current + "/")) return "back";
  if (current.startsWith(old + "/")) return "forward";
  return "switch";
}
export default function RouteMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealed = useRef<Element[]>([]);
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    surface.current?.removeAttribute("data-enter");
    for (const item of revealed.current) item.removeAttribute("data-rm-reveal");
    revealed.current = [];
  }
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-route-motion-active", "");
    if (previous.current === pathname) return;
    const kind = motionKind(previous.current, pathname);
    previous.current = pathname;
    reset();
    const node = surface.current;
    if (!node || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        html.hasAttribute("data-guru-native-transition") ||
        document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) return;
    // Restart CSS animation without remounting children or intercepting navigation.
    void node.offsetWidth;
    node.dataset.enter = kind;
    const candidates = node.querySelectorAll(':scope > main > section > article, :scope > div > section > article');
    revealed.current = Array.from(candidates).slice(0, 8);
    revealed.current.forEach((item, i) => item.setAttribute("data-rm-reveal", String(i)));
    timer.current = setTimeout(reset, 1200);
  }, [pathname]);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => { if (query.matches) reset(); };
    const hidden = () => { if (document.hidden) reset(); };
    query.addEventListener("change", changed);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      reset(); document.documentElement.removeAttribute("data-route-motion-active");
      query.removeEventListener("change", changed);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  return <div ref={surface} className={styles.surface} data-route-motion="">{children}</div>;
}
