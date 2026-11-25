"use client";
import { useEffect } from "react";

export default function LandingReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing-root]");
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;
    function showAll() {
      observer?.disconnect(); observer = null;
      for (const node of nodes) node.removeAttribute("data-reveal-state");
    }
    function start() {
      showAll();
      if (query.matches || !("IntersectionObserver" in window)) return;
      try {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) if (entry.isIntersecting) {
            const node = entry.target as HTMLElement;
            node.removeAttribute("data-reveal-state");
            observer?.unobserve(node);
          }
        }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
        for (const node of nodes) {
          // Never hide initially visible content. Without JS, everything is visible.
          if (node.getBoundingClientRect().top >= window.innerHeight) {
            node.dataset.revealState = "waiting";
            observer.observe(node);
          }
        }
      } catch { showAll(); }
    }
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const node = event.target.closest<HTMLElement>("[data-reveal]");
      if (node) { node.removeAttribute("data-reveal-state"); observer?.unobserve(node); }
    };
    start(); query.addEventListener("change", start); root.addEventListener("focusin", focus);
    return () => { showAll(); query.removeEventListener("change", start); root.removeEventListener("focusin", focus); };
  }, []);
  return null;
}
