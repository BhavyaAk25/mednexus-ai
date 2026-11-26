import * as T from "three";

export function buildCampus(scene: T.Scene) {
  const world = new T.Group();
  scene.add(world);
  const block = new T.BoxGeometry(1, 1, 1);
  const cone = new T.ConeGeometry(0.5, 1, 7);
  const tree = new T.IcosahedronGeometry(0.5, 1);
  const cylinder = new T.CylinderGeometry(0.5, 0.5, 1, 16);
  const materials = new Map<string, T.MeshStandardMaterial>();
  const batches = new Map<string, { geometry: T.BufferGeometry; material: T.Material; transforms: T.Matrix4[]; shadows: boolean }>();
  function shape(color: string, x: number, y: number, z: number, w: number, h: number, d: number, geometry: T.BufferGeometry = block, turn = 0, target?: T.Group, shadows = true) {
    let material = materials.get(color);
    if (!material) {
      material = new T.MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, material);
    }
    const object = new T.Object3D();
    object.position.set(x, y, z);
    object.rotation.y = turn;
    object.scale.set(w, h, d);
    if (target) {
      const part = new T.Mesh(geometry, material);
      part.position.copy(object.position);
      part.rotation.copy(object.rotation);
      part.scale.copy(object.scale);
      part.castShadow = shadows;
      part.receiveShadow = true;
      target.add(part);
      return;
    }
    object.updateMatrix();
    const key = `${geometry.id}-${color}-${shadows}`;
    if (!batches.has(key)) batches.set(key, { geometry, material, transforms: [], shadows });
    batches.get(key)!.transforms.push(object.matrix);
  }

  const p = { grass: "#a7ad81", grass2: "#b9bb94", ivory: "#eee9d6", stone: "#d6d0b8", deep: "#243b35", verge: "#899a78",
    glass: "#536d63", lightGlass: "#88a197", pine: "#496b52", moss: "#718f58", leaf: "#9fac69", red: "#a74b3b", road: "#5d6760",
    concrete: "#d8d2bd", line: "#ece3c6", dark: "#374942" };

  shape("#777f63", 0, -0.40, 0, 13.75, 0.48, 12.4);
  shape("#c5bc9e", 0, -0.14, 0, 13.82, 0.17, 12.47);
  shape(p.grass, 0, 0.005, 0, 13.62, 0.15, 12.28);
  shape(p.road, 0, 0.091, 0, 1.38, 0.035, 12.28, block, 0, undefined, false);
  shape(p.road, 0, 0.092, 4.55, 13.62, 0.035, 1.27, block, 0, undefined, false);
  shape(p.road, 5.65, 0.093, -0.85, 1.02, 0.035, 9.5, block, 0, undefined, false);
  for (const x of [-0.83, 0.83]) shape(p.concrete, x, 0.113, 0, 0.27, 0.06, 12.28);
  for (const z of [3.8, 5.28]) shape(p.concrete, 0, 0.115, z, 13.62, 0.06, 0.23);
  for (let i = -5; i <= 5; i++) {
    if (i !== 4 && i !== 5) shape(p.line, 0, 0.117, i * 0.95, 0.025, 0.009, 0.39, block, 0, undefined, false);
    if (i !== 0) shape(p.line, i * 1.07, 0.116, 4.55, 0.36, 0.009, 0.025, block, 0, undefined, false);
  }
  for (let i = 0; i < 7; i++) {
    shape(p.line, -0.53 + i * 0.178, 0.121, 3.51, 0.09, 0.007, 0.39, block, 0, undefined, false);
    shape(p.line, 0.94, 0.121, 4.02 + i * 0.175, 0.41, 0.007, 0.09, block, 0, undefined, false);
  }
  for (const [x, z, w, d] of [[-3.75, -2.61, 5.05, 5.3], [3.14, -3.43, 4, 3.9], [3.22, 1.83, 4, 3.68], [-3.75, 2.36, 5.05, 2.53]]) {
    shape(p.grass2, x, 0.088, z, w, 0.035, d, block, 0, undefined, false);
  }

  function label(text: string, x: number, y: number, z: number, width: number, dark = false) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 88;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = dark ? p.deep : p.ivory;
    ctx.fillRect(0, 0, 512, 88);
    ctx.fillStyle = dark ? p.ivory : p.deep;
    ctx.font = "bold 46px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 47);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(new T.PlaneGeometry(width, width * 88 / 512), new T.MeshBasicMaterial({ map: texture }));
    mesh.position.set(x, y, z);
    world.add(mesh);
  }

  function building(x: number, z: number, w: number, d: number, floors: number, tint: string, top: string, name: string) {
    const st = 0.59;
    const h = floors * st + 0.39;
    shape(p.concrete, x, 0.155, z, w + 0.55, 0.11, d + 0.61);
    shape(tint, x, 0.19 + h / 2, z, w, h, d);
    shape(p.stone, x, 0.29, z, w + 0.095, 0.22, d + 0.095);
    shape(top, x, h + 0.23, z, w + 0.16, 0.13, d + 0.16);
    const roof = h + 0.35;
    for (const sign of [-1, 1]) {
      shape(p.ivory, x + sign * (w / 2 - 0.015), roof, z, 0.085, 0.13, d + 0.13);
      shape(p.ivory, x, roof, z + sign * (d / 2 - 0.015), w + 0.085, 0.13, 0.085);
    }
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.61 + floor * st;
      const columns = Math.floor(w / 0.45);
      const side = Math.floor(d / 0.46);
      for (let col = 0; col < columns; col++) {
        const dx = (col - (columns - 1) / 2) * 0.45;
        const glass = (floor * 3 + col) % 5 < 2 ? p.lightGlass : p.glass;
        if (floor > 0 || Math.abs(dx) > 0.57) shape(glass, x + dx, y, z + d / 2 + 0.005, 0.30, 0.33, 0.027);
        shape(glass, x + dx, y, z - d / 2 - 0.005, 0.30, 0.34, 0.027);
      }
      for (let col = 0; col < side; col++) {
        const dz = (col - (side - 1) / 2) * 0.46;
        const glass = (floor + col * 3) % 4 === 0 ? p.lightGlass : p.glass;
        for (const sideSign of [-1, 1]) shape(glass, x + sideSign * (w / 2 + 0.005), y, z + dz, 0.026, 0.34, 0.31);
      }
      if (floor > 0) {
        shape(p.ivory, x, y - 0.248, z + d / 2 + 0.006, w + 0.04, 0.052, 0.039);
        shape(p.ivory, x + w / 2 + 0.006, y - 0.248, z, 0.04, 0.052, d + 0.03);
      }
    }
    shape(p.deep, x, 0.60, z + d / 2 + 0.012, 0.93, 0.75, 0.035);
    for (const dx of [-0.23, 0.23]) shape(p.lightGlass, x + dx, 0.61, z + d / 2 + 0.035, 0.38, 0.68, 0.026);
    shape(top, x, 1.04, z + d / 2 + 0.22, 1.5, 0.11, 0.5);
    label(name, x, 1.23 + (floors > 3 ? 0.57 : 0), z + d / 2 + 0.039, Math.min(w * 0.75, 2.0), top === p.deep);
    shape(p.stone, x - w * 0.22, roof + 0.12, z - d * 0.22, 0.53, 0.24, 0.61);
    shape(p.glass, x - w * 0.22, roof + 0.255, z - d * 0.22, 0.44, 0.05, 0.50);
    for (let i = -1; i <= 1; i++) shape(p.ivory, x - w * 0.22 + i * 0.12, roof + 0.285, z - d * 0.22, 0.025, 0.017, 0.47);
    return roof;
  }

  const hospitalRoof = building(-3.57, -2.65, 3.73, 3.60, 6, "#dddec8", "#81947e", "MEDICAL CENTER");
  building(-1.85, -2.94, 1.28, 2.52, 4, "#b9c6ac", p.deep, "");
  building(-3.72, 2.22, 3.45, 1.98, 2, "#ded7bd", p.red, "CLINIC");
  building(3.17, -3.52, 3.35, 2.38, 4, "#d8cab2", "#a17863", "SPECIALISTS");
  const labRoof = building(3.15, 1.77, 3.36, 2.22, 3, "#c9d4bb", p.deep, "DIAGNOSTICS");

  // Rooftop helipad and its painted H.
  shape(p.dark, -3.86, hospitalRoof + 0.022, -2.28, 1.51, 0.09, 1.51, cylinder);
  shape(p.ivory, -3.86, hospitalRoof + 0.070, -2.28, 1.32, 0.007, 1.32, cylinder);
  shape(p.dark, -3.86, hospitalRoof + 0.075, -2.28, 1.23, 0.01, 1.23, cylinder);
  for (const dx of [-0.20, 0.20]) shape(p.ivory, -3.86 + dx, hospitalRoof + 0.09, -2.28, 0.085, 0.02, 0.64);
  shape(p.ivory, -3.86, hospitalRoof + 0.09, -2.28, 0.41, 0.02, 0.08);
  shape(p.ivory, -3.08, 3.45, -0.829, 0.78, 0.80, 0.06);
  shape(p.red, -3.08, 3.45, -0.79, 0.14, 0.47, 0.025);
  shape(p.red, -3.08, 3.45, -0.781, 0.47, 0.14, 0.025);

  for (let x = 2.48; x < 4.28; x += 0.35) {
    shape("#517268", x, labRoof + 0.05, 1.84, 0.31, 0.06, 0.51);
    shape("#63867a", x, labRoof + 0.05, 2.45, 0.31, 0.06, 0.51);
  }
  shape(p.ivory, -0.77, 0.24, -0.22, 1.27, 0.17, 0.37);
  shape(p.stone, -3.66, 0.123, 1.1, 5.05, 0.025, 0.26);
  shape(p.stone, 3.45, 0.129, -1.86, 4.88, 0.05, 0.44);
  shape(p.stone, 1.58, 0.134, -0.72, 1.67, 0.06, 0.54);
  shape(p.stone, -3.45, 0.145, 0.61, 3.0, 0.11, 0.47);
  for (const z of [0.28, 1.22, 3.29]) for (const x of [-5.45, -1.67, 1.24, 4.88]) {
    shape(p.deep, x, 0.39, z, 0.048, 0.64, 0.049);
    shape(p.ivory, x, 0.72, z, 0.16, 0.06, 0.13);
  }
  for (let i = 0; i < 5; i++) {
    const z = -0.9 + i * 0.47;
    shape(p.road, 5.08, 0.117, z, 0.65, 0.04, 0.45, block, 0, undefined, false);
    shape(p.ivory, 5.09, 0.146, z + 0.23, 0.58, 0.012, 0.02, block, 0, undefined, false);
  }
  shape("#748e79", 5.03, 0.25, -0.41, 0.46, 0.21, 0.23);
  shape("#c69f73", 5.03, 0.25, 0.59, 0.46, 0.20, 0.23);
  for (const [x, z] of [[-5.76, 0.39], [-4.83, 0.68], [-2.1, 0.57], [1.53, -1.55], [4.14, -1.56]]) {
    shape("#8c6e4d", x, 0.32, z, 0.46, 0.08, 0.17);
    for (const sign of [-1, 1]) shape(p.deep, x + sign * 0.16, 0.21, z, 0.05, 0.2, 0.12);
  }

  let seed = 17;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
  function plant(x: number, z: number, size: number, evergreen = false) {
    const trunk = size * 0.40;
    shape("#806c4f", x, 0.10 + trunk / 2, z, size * 0.09, trunk, size * 0.09, cylinder);
    if (evergreen) {
      shape(p.pine, x, 0.17 + size * 0.47, z, size * 0.64, size * 0.86, size * 0.64, cone, random());
      shape(p.moss, x, 0.21 + size * 0.68, z, size * 0.46, size * 0.75, size * 0.46, cone, random());
      return;
    }
    const tone = [p.pine, p.moss, p.leaf, "#829460"][Math.floor(random() * 4)];
    shape(tone, x, 0.20 + size * 0.58, z, size * 0.70, size * 0.97, size * 0.66, tree, random());
    shape(p.leaf, x - size * 0.16, 0.31 + size * 0.55, z + size * 0.13, size * 0.45, size * 0.62, size * 0.45, tree, random());
  }
  for (let i = 0; i < 13; i++) {
    const z = -5.53 + i * 0.66;
    plant(-6.32 + random() * 0.29, z, 0.61 + random() * 0.55, i % 3 === 0);
    if (i < 10) plant(6.34 + random() * 0.13, z, 0.49 + random() * 0.41, i % 3 === 0);
  }
  for (let i = 0; i < 17; i++) {
    const x = -6.27 + i * 0.76;
    if (Math.abs(x) > 1 && x < 5.1) {
      plant(x, -5.68 + random() * 0.21, 0.48 + random() * 0.40, i % 2 === 0);
      plant(x, 5.69 + random() * 0.16, 0.39 + random() * 0.44, i % 4 === 0);
    }
  }
  for (const [x, z, s] of [[-5.75, 0.1, 0.72], [-5.31, 0.56, 0.63], [-2.05, 1.17, 0.65], [1.39, -1.07, 0.83], [4.75, -1.38, 0.65], [4.64, 3.26, 0.59], [-1.45, 3.07, 0.64], [1.37, 3.27, 0.71]]) plant(x, z, s);
  for (let i = 0; i < 35; i++) {
    const x = 1.2 + random() * 3.7;
    const z = -1.45 + random() * 0.18;
    shape(i % 3 ? p.verge : p.leaf, x, 0.19, z, 0.23, 0.22, 0.21, tree, random());
  }

  for (const { geometry, material, transforms, shadows } of batches.values()) {
    const mesh = new T.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    world.add(mesh);
  }

  function vehicle(color: string, ambulance = false) {
    const car = new T.Group();
    world.add(car);
    shape(color, 0, 0.18, 0, 0.36, 0.24, ambulance ? 0.75 : 0.64, block, 0, car);
    shape(ambulance ? p.ivory : color, 0, 0.29, -0.06, 0.32, ambulance ? 0.29 : 0.20, 0.41, block, 0, car);
    shape(p.deep, 0, 0.30, 0.161, 0.28, 0.14, 0.023, block, 0, car);
    for (const x of [-0.18, 0.18]) for (const z of [-0.22, 0.23]) shape(p.deep, x, 0.096, z, 0.062, 0.13, 0.13, block, 0, car);
    if (ambulance) {
      shape(p.red, 0, 0.448, 0.02, 0.27, 0.049, 0.085, block, 0, car);
      for (const x of [-0.184, 0.184]) {
        shape(p.red, x, 0.278, -0.09, 0.027, 0.18, 0.046, block, 0, car);
        shape(p.red, x, 0.278, -0.09, 0.026, 0.046, 0.18, block, 0, car);
      }
    }
    return car;
  }
  const ambulance = vehicle("#f3e9d1", true);
  const taxi = vehicle("#b39861");
  const shuttle = vehicle("#839c87");
  const people = Array.from({ length: 7 }, (_, i) => {
    const person = new T.Group();
    world.add(person);
    shape(i % 3 === 0 ? p.red : i % 2 === 0 ? p.glass : p.ivory, 0, 0.13, 0, 0.105, 0.16, 0.095, cylinder, 0, person);
    shape("#766853", 0, 0.238, 0, 0.075, 0.08, 0.075, tree, 0, person);
    for (const x of [-0.028, 0.028]) shape(p.deep, x, 0.04, 0, 0.035, 0.09, 0.048, block, 0, person);
    return person;
  });
  function move(time: number) {
    ambulance.position.set(0.29, 0.11, 5.78 - ((time * 0.63 + 3.3) % 11.75));
    ambulance.rotation.y = Math.PI;
    taxi.position.set(((time * 0.46 + 3.2) % 12.9) - 6.45, 0.11, 4.83);
    taxi.rotation.y = Math.PI / 2;
    shuttle.position.set(6.56 - ((time * 0.37 + 4.5) % 13.1), 0.11, 4.27);
    shuttle.rotation.y = -Math.PI / 2;
    people.forEach((person, i) => {
      const offset = Math.sin(time * (0.35 + i * 0.021) + i * 2) * (0.48 + (i % 4) * 0.15);
      const x = [-3.74, -4.27, -1.03, 1.05, 3.21, 4.11, 5.02][i];
      const z = [0.68, 3.78, 2.23, -1.80, 3.09, -1.88, 3.78][i];
      person.position.set(x + (i % 2 ? 0 : offset), 0.139 + Math.abs(Math.sin(time * 6 + i)) * 0.014, z + (i % 2 ? offset : 0));
      person.rotation.y = offset * 2;
    });
  }
  move(0);
  return { world, move };
}
