"use client";

import NextLink from "next/link";
import { useRef, type ComponentProps } from "react";
import { useGuruMotion, type MotionPoint } from "./GuruMotionBoundary";

type Props = ComponentProps<typeof NextLink>;

/** Keeps Next Link behavior unless a safe, same-origin Guru transition can run. */
export default function GuruMotionLink({ onClick, onNavigate, ...props }: Props) {
  const motion = useGuruMotion();
  const point = useRef<MotionPoint | null>(null);
  return <NextLink {...props}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const rect = event.currentTarget.getBoundingClientRect();
      point.current = {
        x: event.detail ? event.clientX : rect.left + rect.width / 2,
        y: event.detail ? event.clientY : rect.top + rect.height / 2,
      };
    }}
    onNavigate={(event) => {
      let cancelled = false;
      onNavigate?.({ ...event, preventDefault() { cancelled = true; event.preventDefault(); } });
      if (cancelled || props.replace || typeof props.href !== "string") return;
      if (motion?.open(props.href, point.current, props.scroll)) event.preventDefault();
    }} />;
}
