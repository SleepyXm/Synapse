"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/UI/UI.module.css";

type Pulse = {
  x: number;
  y: number;
  startedAt: number;
};

const GLYPHS = ["·", "∙", ":", "∴", "+", "×", "◇", "□", "▪", "■"] as const;
const FRAME_INTERVAL = 1000 / 40;
const MAX_DPR = 1.5;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const noise = (x: number, y: number) => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export default function NeuralGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const pointer = { x: -1000, y: -1000, active: false };
    const pulses: Pulse[] = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame = 0;
    let lastFrame = 0;
    let isVisible = !document.hidden;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      const compact = width < 700;
      const cellSize = compact ? 14 : 16;
      const radius = compact ? 118 : 180;
      const columns = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      const still = reduceMotion.matches;

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `${compact ? 8 : 9}px var(--font-mono), monospace`;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = column * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          const seed = noise(column, row);
          const motionTime = still ? 0 : time;
          const waveA =
            (Math.sin(column * 0.32 + row * 0.17 + motionTime * 0.00225) +
              1) /
            2;
          const waveB =
            (Math.sin(column * -0.16 + row * 0.48 - motionTime * 0.00155) +
              1) /
            2;
          const sweepPosition =
            (x + y * 0.7 + motionTime * 0.16) % 620;
          const sweepDistance = Math.min(
            sweepPosition,
            620 - sweepPosition,
          );
          const sweep = Math.pow(clamp(1 - sweepDistance / 118), 2);
          const shimmer = still
            ? 0
            : clamp(
                (Math.sin(seed * 31 + motionTime * 0.0035) - 0.48) / 0.52,
              );
          const base =
            0.115 +
            seed * 0.09 +
            waveA * 0.16 +
            waveB * 0.11 +
            sweep * 0.24 +
            shimmer * 0.16;

          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          const hover = pointer.active
            ? Math.pow(clamp(1 - distance / radius), 2.15)
            : 0;

          let ripple = 0;
          if (!still) {
            for (const pulse of pulses) {
              const age = time - pulse.startedAt;
              const ringRadius = age * 0.34;
              const ringDistance = Math.abs(
                Math.hypot(x - pulse.x, y - pulse.y) - ringRadius,
              );
              ripple = Math.max(
                ripple,
                clamp(1 - ringDistance / 34) * clamp(1 - age / 900),
              );
            }
          }

          const intensity = clamp(base + hover * 0.9 + ripple * 0.72);
          const glyphIndex = Math.min(
            GLYPHS.length - 1,
            Math.floor(intensity * GLYPHS.length * 1.08),
          );
          const coolTint = Math.round(212 + intensity * 40);
          const alpha = 0.22 + intensity * 0.76;

          context.fillStyle = `rgba(${coolTint}, ${coolTint + 2}, ${Math.min(
            255,
            coolTint + 5,
          )}, ${alpha})`;
          context.fillText(GLYPHS[glyphIndex], x, y);
        }
      }
    };

    const animate = (time: number) => {
      animationFrame = window.requestAnimationFrame(animate);
      if (!isVisible || time - lastFrame < FRAME_INTERVAL) return;

      lastFrame = time;
      for (let index = pulses.length - 1; index >= 0; index -= 1) {
        if (time - pulses[index].startedAt > 900) pulses.splice(index, 1);
      }
      draw(time);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      if (reduceMotion.matches) draw(performance.now());
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.active = false;
      if (reduceMotion.matches) draw(performance.now());
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (reduceMotion.matches) return;
      pulses.push({ x: event.clientX, y: event.clientY, startedAt: performance.now() });
      if (pulses.length > 4) pulses.shift();
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    const handleMotionPreference = () => draw(performance.now());
    const handleResize = () => {
      resize();
      draw(performance.now());
    };

    resize();
    draw(performance.now());
    animationFrame = window.requestAnimationFrame(animate);

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    reduceMotion.addEventListener("change", handleMotionPreference);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      reduceMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <div aria-hidden="true" className={styles.neuralBackground}>
      <div className={styles.neuralAmbient} />
      <canvas
        ref={canvasRef}
        className={styles.neuralCanvas}
      />
      <div className={styles.neuralScanlines} />
    </div>
  );
}
