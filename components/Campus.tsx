"use client";

import type { WebGLRenderer } from "three";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LocateFixed, Pause, Play } from "lucide-react";
import { stops } from "./campus-stops";

export default function Campus() {
  const stage = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLButtonElement | null)[]>([]);
  const activeMotion = useRef(true);
  const [moving, setMoving] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let cleanup = () => {};
    let stopped = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      activeMotion.current = !reduced.matches;
      setMoving(!reduced.matches);
    };
    updatePreference();
    reduced.addEventListener("change", updatePreference);
    async function mount(el: HTMLDivElement) {
      const [T, { buildCampus }] = await Promise.all([import("three"), import("./campus-model")]);
      if (stopped) return;
      let renderer: WebGLRenderer;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.17;
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.prepend(renderer.domElement);

      const scene = new T.Scene();
      scene.add(new T.HemisphereLight("#fff1d6", "#6a7660", 2.15));
      const sun = new T.DirectionalLight("#fff1d8", 3.06);
      sun.position.set(-6, 13, 8);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1536, 1536);
      Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 0.5, far: 33 });
      sun.shadow.normalBias = 0.035;
      sun.shadow.bias = -0.0003;
      scene.add(sun);
      const fill = new T.DirectionalLight("#b5d4c8", 0.65);
      fill.position.set(9, 6, -5);
      scene.add(fill);
      const { world, move } = buildCampus(scene);
      const shadow = new T.Mesh(new T.PlaneGeometry(34, 34), new T.ShadowMaterial({ color: "#495346", opacity: 0.20 }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -0.65;
      shadow.receiveShadow = true;
      scene.add(shadow);

      const camera = new T.OrthographicCamera();
      const projector = new T.Vector3();
      let width = 1, height = 1, time = 0, last = 0, frame = 0;
      let visible = true, dirty = true;
      let tiltX = 0, tiltY = 0;
      const resize = new ResizeObserver(() => {
        width = el.clientWidth || 1;
        height = el.clientHeight || 1;
        const view = Math.max(width / height * 12.9, width < 520 ? 19.8 : 20.1);
        camera.left = -view / 2;
        camera.right = view / 2;
        camera.top = view * height / width / 2;
        camera.bottom = -camera.top;
        camera.near = 0.1;
        camera.far = 90;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        dirty = true;
      });
      resize.observe(el);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      intersection.observe(el);
      function draw(ms: number) {
        frame = requestAnimationFrame(draw);
        const delta = Math.min((ms - last) / 1000, 0.04);
        last = ms;
        if (!visible || document.hidden || (!activeMotion.current && !dirty)) return;
        if (activeMotion.current) {
          time += delta;
          tiltX += (pointer.current.x - tiltX) * 0.026;
          tiltY += (pointer.current.y - tiltY) * 0.026;
        }
        const angle = 0.69 + Math.sin(time * 0.29) * 0.050 + tiltX * 0.07;
        camera.position.set(Math.sin(angle) * 25, 17.4 - tiltY * 1.15, Math.cos(angle) * 25);
        camera.lookAt(0, 0.65, 0);
        move(time);
        renderer.render(scene, camera);
        stops.forEach(({ location }, i) => {
          const tag = tags.current[i];
          if (!tag) return;
          projector.set(location[0], location[1], location[2]);
          world.localToWorld(projector);
          projector.project(camera);
          tag.style.left = `${(projector.x * 0.5 + 0.5) * 100}%`;
          tag.style.top = `${(0.5 - projector.y * 0.5) * 100}%`;
        });
        dirty = false;
      }
      frame = requestAnimationFrame(draw);
      setReady(true);
      cleanup = () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        intersection.disconnect();
        scene.traverse(object => {
          if (object instanceof T.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) { if ("map" in material) material.map?.dispose(); material.dispose(); }
          }
        });
        sun.shadow.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    void mount(element).catch(() => { if (!stopped) setReady(false); });
    return () => { stopped = true; reduced.removeEventListener("change", updatePreference); cleanup(); };
  }, []);

  return <figure className="campus-frame">
    <div className="campus-heading"><LocateFixed size={15} /> <span>MEDNEXUS CAMPUS</span></div>
    <div className="campus-stage" ref={stage} onPointerMove={e => {
      const bounds = e.currentTarget.getBoundingClientRect();
      pointer.current = { x: (e.clientX - bounds.left) / bounds.width * 2 - 1, y: (e.clientY - bounds.top) / bounds.height * 2 - 1 };
    }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}>
      {!ready && <div className="campus-fallback" role="img" aria-label="Isometric illustration of the MedNexus hospital campus" />}
      <div className={`campus-labels ${ready ? "is-ready" : ""}`}>
        {stops.map((stop, index) => <button key={stop.name} ref={element => { tags.current[index] = element; }}
          className={`campus-pin pin-${index} ${selected === index ? "is-selected" : ""}`}
          aria-pressed={selected === index} onClick={() => setSelected(selected === index ? null : index)}>
          <i />{stop.name}<ArrowUpRight size={11} />
        </button>)}
      </div>
    </div>
    <figcaption className="campus-caption" aria-live="polite">
      {selected === null ? <><span className="signal-dot" /> <span>Explore the campus</span></> :
        <><span className="signal-dot" /> <span><strong>{stops[selected].title}</strong><small>{stops[selected].detail}</small></span></>}
    </figcaption>
    {ready && <button type="button" className="motion-button" aria-label={moving ? "Pause campus animation" : "Play campus animation"}
      title={moving ? "Pause animation" : "Play animation"} onClick={() => { activeMotion.current = !moving; setMoving(!moving); }}>
      {moving ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
    </button>}
  </figure>;
}
