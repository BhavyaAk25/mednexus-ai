"use client";

import { useEffect, useRef } from "react";

export default function CampusMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const figure = canvas?.parentElement;
    if (!canvas || !figure) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let busy = false;
    let stopped = false;
    let unavailable = false;
    let scene: ReturnType<typeof import("./campus-scene")["mountCampusScene"]> | undefined;

    async function update() {
      if (preference.matches) {
        scene?.dispose();
        scene = undefined;
        return;
      }
      if (!visible || busy || stopped || unavailable) return;
      if (scene) {
        scene.start();
        return;
      }

      busy = true;
      try {
        const { mountCampusScene } = await import("./campus-scene");
        if (!stopped && visible && !preference.matches) {
          scene = mountCampusScene(canvas!, figure!);
          scene.start();
        }
      } catch {
        // The eager campus image remains visible if the GPU renderer cannot start.
        unavailable = true;
      } finally {
        busy = false;
      }
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void update();
      else scene?.stop();
    }, { threshold: 0.2 });
    intersection.observe(figure);
    function handleVisibility() {
      if (document.hidden) scene?.stop();
      else void update();
    }
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      intersection.disconnect();
      preference.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", handleVisibility);
      scene?.dispose();
    };
  }, []);

  return <canvas className="campus-motion" ref={canvasRef} aria-hidden="true" />;
}
