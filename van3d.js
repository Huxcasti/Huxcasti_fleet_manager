import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Procedural, illustrative delivery van. No licensed vehicle mesh or branding.
export function mountVan3D(stage, options) {
  if (!stage) throw new Error("3D stage missing");
  const en = options.language === "en";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf3fd);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(6.2, 3.8, 7.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.setAttribute("aria-label", en ? "Rotatable three-dimensional delivery van" : "Guagua de entregas tridimensional que puedes girar");
  stage.replaceChildren(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 3.8;
  controls.maxDistance = 13.5;
  controls.minPolarAngle = 0.06;
  controls.maxPolarAngle = Math.PI - 0.06;
  controls.target.set(0, 1.25, 0);
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2c4d9, 2.5));
  const sunlight = new THREE.DirectionalLight(0xffffff, 3.2);
  sunlight.position.set(-4, 8, 6);
  scene.add(sunlight);
  const rim = new THREE.DirectionalLight(0x76b6ff, 1.4);
  rim.position.set(5, 4, -6);
  scene.add(rim);

  const van = new THREE.Group();
  scene.add(van);
  const pickable = [];
  const markers = [];
  const navy = new THREE.MeshStandardMaterial({ color: 0x1e3d63, metalness: 0.25, roughness: 0.5 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x738ca5, metalness: 0.65, roughness: 0.38 });
  const deep = new THREE.MeshStandardMaterial({ color: 0x142333, metalness: 0.2, roughness: 0.55 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1b354c, metalness: 0.22, roughness: 0.16 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x131a24, roughness: 0.95 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x59c3ef, metalness: 0.3, roughness: 0.45 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe5f1fc, emissive: 0x314b64, emissiveIntensity: 0.15 });
  const red = new THREE.MeshStandardMaterial({ color: 0xec4352, emissive: 0xb91b2d, emissiveIntensity: 0.35 });
  function box(x, y, z, w, h, d, material, selectable) {
    const item = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    item.position.set(x, y, z);
    van.add(item);
    if (selectable !== false) pickable.push(item);
    return item;
  }
  // Body, cabin, roof and bumpers
  box(0, 1.67, -0.55, 2.04, 2.36, 3.72, navy);
  box(0, 1.35, 1.63, 2.02, 1.75, 1.58, navy);
  box(0, 2.84, -0.54, 1.99, 0.10, 3.64, navy);
  box(0, 2.26, 1.73, 1.94, 0.10, 1.46, navy);
  box(0, 0.49, 0, 1.92, 0.19, 4.8, deep);
  box(0, 0.64, 2.47, 2.11, 0.27, 0.24, deep);
  box(0, 0.64, -2.49, 2.1, 0.27, 0.25, deep);
  // Windshield, front grille, lamps, rear doors
  box(0, 1.83, 2.429, 1.76, 0.83, 0.026, glass, false);
  box(0, 0.95, 2.435, 1.15, 0.36, 0.036, deep, false);
  for (const side of [-1, 1]) {
    box(side * 0.81, 0.94, 2.445, 0.24, 0.22, 0.04, white, false);
    box(side * 0.86, 1.91, 1.82, 0.035, 0.73, 1.0, glass, false);
    box(side * 1.04, 1.68, 1.68, 0.06, 0.70, 1.13, glass, false);
    box(side * 1.06, 1.30, -0.80, 0.06, 0.045, 2.32, trim, false);
    box(side * 1.066, 1.63, -1.02, 0.045, 1.78, 0.035, deep, false);
    box(side * 1.063, 1.5, 0.16, 0.045, 1.5, 0.028, deep, false);
    box(side * 1.091, 1.47, 0.35, 0.06, 0.08, 0.28, metal, false);
    box(side * 1.10, 1.08, 1.91, 0.25, 0.12, 0.25, deep, false);
    box(side * 1.09, 0.63, -2.37, 0.13, 0.38, 0.1, red, false);
    box(side * 0.68, 0.95, -2.422, 0.10, 1.96, 0.03, deep, false);
    box(side * 0.73, 1.24, -2.452, 0.10, 0.10, 0.03, metal, false);
    // Four wheels, discs and axles
    for (const z of [-1.52, 1.54]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.24, 30), tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.09, 0.48, z);
      van.add(wheel);
      pickable.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.258, 24), metal);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(side * 1.105, 0.48, z);
      van.add(hub);
    }
  }
  box(0, 1.87, -2.425, 0.025, 1.85, 0.028, deep, false);
  box(0, 2.68, -2.426, 1.76, 0.26, 0.025, glass, false);
  box(0, 0.91, -2.465, 1.35, 0.13, 0.035, metal, false);
  // Stylized delivery-company graphics on both sides
  const decalCanvas = document.createElement("canvas");
  decalCanvas.width = 512;
  decalCanvas.height = 256;
  const ctx = decalCanvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = "#b0eaff";
    ctx.font = "bold 97px Arial";
    ctx.fillText("WILX", 33, 123);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 39px Arial";
    ctx.fillText("LOGISTICS", 35, 174);
    const decal = new THREE.CanvasTexture(decalCanvas);
    decal.colorSpace = THREE.SRGBColorSpace;
    const ink = new THREE.MeshBasicMaterial({ map: decal, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    for (const side of [-1, 1]) {
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.74), ink);
      tag.position.set(side * 1.05, 1.88, -0.61);
      tag.rotation.y = side * Math.PI / 2;
      van.add(tag);
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let marking = false;
  let preview = null;
  let pressed = null;
  let stopped = false;
  let frame = 0;

  function pinCoordinates(value) {
    if (!value || ![value.x, value.y, value.z].every(Number.isFinite)) return null;
    const x = Math.max(-1.6, Math.min(1.6, value.x));
    const y = Math.max(-0.25, Math.min(3.1, value.y));
    const z = Math.max(-2.7, Math.min(2.7, value.z));
    return new THREE.Vector3(x, y, z);
  }
  function marker(position, color, radius) {
    const material = new THREE.MeshStandardMaterial({
      color: color, emissive: color, emissiveIntensity: 0.46, roughness: 0.35
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
    mesh.position.copy(position);
    van.add(mesh);
    return mesh;
  }
  (options.damages || []).forEach(damage => {
    const position = pinCoordinates(damage.pin);
    if (!position) return;
    const item = marker(position, damage.repaired === true ? 0x2cbe85 : 0xff4052, 0.12);
    item.userData.damage = damage;
    markers.push(item);
  });
  function setMarkMode(value) {
    marking = Boolean(value);
    renderer.domElement.style.cursor = marking ? "crosshair" : "grab";
    if (!marking && preview) {
      van.remove(preview);
      preview.geometry.dispose();
      preview.material.dispose();
      preview = null;
    }
  }
  function pointerDown(e) {
    pressed = { x: e.clientX, y: e.clientY };
  }
  function pointerUp(e) {
    if (!pressed || stopped) return;
    const dx = Math.abs(e.clientX - pressed.x);
    const dy = Math.abs(e.clientY - pressed.y);
    pressed = null;
    if (dx > 8 || dy > 8) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1,
      -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const markerHits = raycaster.intersectObjects(markers, false);
    if (markerHits.length) {
      if (typeof options.onMarker === "function") options.onMarker(markerHits[0].object.userData.damage);
      return;
    }
    if (!marking) return;
    const hits = raycaster.intersectObjects(pickable, false);
    if (!hits.length) return;
    const hit = hits[0];
    const direction = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    const worldPoint = hit.point.clone().addScaledVector(direction, 0.10);
    const local = van.worldToLocal(worldPoint);
    const location = { x: Number(local.x.toFixed(3)), y: Number(local.y.toFixed(3)), z: Number(local.z.toFixed(3)) };
    if (preview) {
      van.remove(preview);
      preview.geometry.dispose();
      preview.material.dispose();
    }
    preview = marker(new THREE.Vector3(location.x, location.y, location.z), 0xffc93d, 0.14);
    if (typeof options.onPick === "function") options.onPick(location);
    setMarkMode(false);
    // Keep the selected yellow position visible until a new selection or close
    preview = marker(new THREE.Vector3(location.x, location.y, location.z), 0xffc93d, 0.14);
  }
  function resize() {
    const width = Math.max(240, stage.clientWidth || 600);
    const height = Math.max(260, stage.clientHeight || 400);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(stage);
  window.addEventListener("resize", resize);
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  renderer.domElement.addEventListener("pointercancel", () => { pressed = null; });
  resize();
  function animate() {
    if (stopped) return;
    frame = window.requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  return {
    setMarkMode,
    resetView() { camera.position.set(6.2, 3.8, 7.2); controls.target.set(0, 1.25, 0); controls.update(); },
    destroy() {
      if (stopped) return;
      stopped = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      controls.dispose();
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === stage) stage.replaceChildren();
    }
  };
}
