import {
  ACESFilmicToneMapping, DirectionalLight, HemisphereLight, Mesh,
  OrthographicCamera, PCFShadowMap, PlaneGeometry, Scene, ShadowMaterial, WebGLRenderer,
} from "three";
import type { BufferGeometry, Material, Texture } from "three";
import { buildCampus } from "./campus-model";

const motionDuration = 4600;
const cameraWidth = 20.1;
const cameraAngle = 0.69;

export function mountCampusScene(canvas: HTMLCanvasElement, figure: HTMLElement) {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
  if (!context) throw new Error("WebGL 2 is unavailable");
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.17;

  const scene = new Scene();
  scene.add(new HemisphereLight("#fff1d6", "#6a7660", 2.15));
  const sun = new DirectionalLight("#fff1d8", 3.06);
  sun.position.set(-6, 13, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 0.5, far: 33 });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const fill = new DirectionalLight("#b5d4c8", 0.65);
  fill.position.set(9, 6, -5);
  scene.add(fill);
  const { move } = buildCampus(scene);
  const shadow = new Mesh(new PlaneGeometry(34, 34), new ShadowMaterial({ color: "#495346", opacity: 0.20 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.65;
  shadow.receiveShadow = true;
  scene.add(shadow);

  const camera = new OrthographicCamera(-cameraWidth / 2, cameraWidth / 2, 1, -1, 0.1, 90);
  camera.position.set(Math.sin(cameraAngle) * 25, 17.4, Math.cos(cameraAngle) * 25);
  camera.lookAt(0, 0.65, 0);

  let raf = 0;
  let startTime = 0;
  let previousTime = 0;
  let sceneTime = 0;
  let shown = false;

  function resize() {
    const { width, height } = figure.getBoundingClientRect();
    if (!width || !height || context!.isContextLost()) return;
    const halfHeight = cameraWidth * (height / width) / 2;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
    canvas.dataset.ready = "true";
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function draw(now: number) {
    const time = Math.min(now, startTime + motionDuration);
    sceneTime += (time - previousTime) * 0.00165;
    previousTime = time;
    move(sceneTime);
    renderer.render(scene, camera);
    if (now - startTime < motionDuration) raf = requestAnimationFrame(draw);
    else raf = 0;
  }

  function play() {
    if (raf || document.hidden || context!.isContextLost()) return;
    startTime = previousTime = performance.now();
    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (shown || document.hidden || context!.isContextLost()) return;
    shown = true;
    play();
  }

  function replay(event: PointerEvent) {
    if (event.pointerType === "mouse" || event.pointerType === "pen") play();
  }

  function onContextLost() {
    stop();
    delete canvas.dataset.ready;
  }

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(figure);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", resize);
  figure.addEventListener("pointerenter", replay);

  return {
    start,
    stop,
    dispose() {
      stop();
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", resize);
      figure.removeEventListener("pointerenter", replay);
      delete canvas.dataset.ready;

      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of [object.material].flat()) {
          if ("map" in material && material.map) textures.add(material.map);
          materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
      sun.shadow.dispose();
      renderer.dispose();
    },
  };
}
