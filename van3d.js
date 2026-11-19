import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Procedural Ford Transit-inspired, Amazon Prime-style illustrative van. No exact replica.
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

  // Reference: high-roof Amazon Prime Ford Transit. All dimensions are
  // approximate and intentionally keep the old demo's coordinate system so
  // already-saved damage positions remain usable.
  const paint = new THREE.MeshStandardMaterial({ color: 0x273b4d, metalness: 0.45, roughness: 0.38 });
  const roofPaint = new THREE.MeshStandardMaterial({ color: 0x32485b, metalness: 0.35, roughness: 0.43 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a929c, metalness: 0.7, roughness: 0.28 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x202b34, metalness: 0.16, roughness: 0.76 });
  const bumper = new THREE.MeshStandardMaterial({ color: 0x171f28, metalness: 0.1, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x122c40, metalness: 0.3, roughness: 0.22, side: THREE.DoubleSide });
  const glassGlint = new THREE.MeshBasicMaterial({ color: 0x9bc3dd, transparent: true, opacity: 0.19, side: THREE.DoubleSide, depthWrite: false });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x131a1e, metalness: 0.0, roughness: 0.98 });
  const lamps = new THREE.MeshStandardMaterial({ color: 0xe6f2f9, emissive: 0x7f91aa, emissiveIntensity: 0.28, roughness: 0.27 });
  const signals = new THREE.MeshStandardMaterial({ color: 0xeea34c, emissive: 0x7f3c04, emissiveIntensity: 0.16 });
  const tailLamps = new THREE.MeshStandardMaterial({ color: 0xd3263f, emissive: 0x801223, emissiveIntensity: 0.26 });
  const linePaint = new THREE.MeshStandardMaterial({ color: 0x101e2b, roughness: 0.83 });
  const white = new THREE.MeshBasicMaterial({ color: 0xf8fbff, side: THREE.DoubleSide });

  function add(mesh, selectable = false) {
    van.add(mesh);
    if (selectable) pickable.push(mesh);
    return mesh;
  }
  function box(x, y, z, w, h, d, material, selectable = false) {
    const item = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    item.position.set(x, y, z);
    return add(item, selectable);
  }
  function sphere(x, y, z, sx, sy, sz, material) {
    const item = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material);
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    return add(item);
  }
  // Shaped high roof and sloping cab, extruded across its width rather than
  // overlapping boxes. Positive Z is the front; the vehicle points toward +Z.
  const outline = new THREE.Shape();
  outline.moveTo(-2.52, 0.73);
  outline.lineTo(2.51, 0.73);
  outline.lineTo(2.51, 2.54);
  outline.quadraticCurveTo(2.51, 2.81, 2.31, 2.87);
  outline.quadraticCurveTo(1.95, 2.93, 1.63, 2.92);
  outline.lineTo(-1.10, 2.92);
  outline.quadraticCurveTo(-1.30, 2.90, -1.45, 2.64);
  outline.lineTo(-2.08, 2.35);
  outline.quadraticCurveTo(-2.24, 2.25, -2.34, 1.88);
  outline.lineTo(-2.52, 1.34);
  outline.closePath();
  const transitBody = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outline, {
      depth: 1.91, steps: 1, curveSegments: 12, bevelEnabled: true,
      bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2
    }), paint
  );
  transitBody.rotation.y = Math.PI / 2;
  transitBody.position.x = -0.955;
  add(transitBody, true);

  // Distinct high-roof crown and stamped side roof strip.
  box(0, 2.879, -0.54, 1.91, 0.055, 3.61, roofPaint);
  for (const side of [-1, 1]) {
    box(side * 1.03, 2.66, -0.45, 0.032, 0.037, 3.68, roofPaint);
  }

  // Windows are polygons sloping with the windshield / cab.
  function quad(points, material, selectable = false) {
    const coords = [];
    for (const point of points) coords.push(...point);
    const mesh = new THREE.Mesh(
      new THREE.BufferGeometry(), material
    );
    mesh.geometry.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
    mesh.geometry.setIndex([0, 1, 2, 0, 2, 3]);
    mesh.geometry.computeVertexNormals();
    return add(mesh, selectable);
  }
  function frontGlass(y1, y2, z1, z2, width, material) {
    return quad([
      [-width, y2, z2], [-width, y1, z1],
      [width, y1, z1], [width, y2, z2]
    ], material);
  }
  frontGlass(1.51, 2.47, 2.435, 1.77, 0.90, bumper);
  frontGlass(1.59, 2.40, 2.455, 1.784, 0.855, glass);
  // Sunlight reflection across windshield (visual only).
  quad([
    [-0.82,2.35,1.839],[-0.77,2.19,1.970],
    [0.17,2.19,1.970],[0.08,2.35,1.839]
  ], glassGlint);
  // Windshield wipers; vertical dark strokes visible in front-quarter view.
  for (const side of [-1,1]) {
    const blade = box(side * 0.41,1.66,2.40,0.68,0.024,0.028,bumper);
    blade.rotation.z = side * 0.08;
  }
  // Hood edge, Transit-style black grille and inset oval badge.
  box(0,1.49,2.42,1.65,0.085,0.11,paint);
  box(0,1.075,2.514,1.47,0.39,0.045,bumper);
  box(0,1.075,2.538,1.26,0.29,0.026,linePaint);
  for (let j=0;j<5;j++) box(0,0.98+j*0.054,2.558,1.11,0.012,0.019,darkMetal);
  const oval = new THREE.Mesh(new THREE.SphereGeometry(1,24,12),metal);
  oval.scale.set(0.23,0.115,0.025);
  oval.position.set(0,1.195,2.565);
  add(oval);
  const ovalCenter = new THREE.Mesh(new THREE.SphereGeometry(1,24,12),
    new THREE.MeshBasicMaterial({color:0x153f6b}));
  ovalCenter.scale.set(0.206,0.09,0.027);
  ovalCenter.position.set(0,1.195,2.589);
  add(ovalCenter);
  box(0,0.67,2.53,2.08,0.27,0.20,bumper);
  box(0,0.51,2.55,1.24,0.10,0.12,darkMetal);
  // Low floor, realistic sliding step and rear rubber bumper.
  box(0,0.51,-0.06,1.80,0.16,4.66,bumper);
  box(0,0.64,-2.51,2.03,0.25,0.22,bumper);
  box(0,0.48,-2.63,1.65,0.055,0.42,darkMetal);

  function sideShape(points, x, material) {
    const path = new THREE.Shape();
    points.forEach((p,i)=>i ? path.lineTo(-p[0],p[1]) : path.moveTo(-p[0],p[1]));
    path.closePath();
    const panel = new THREE.Mesh(new THREE.ShapeGeometry(path, 6), material);
    panel.rotation.y = Math.PI / 2;
    panel.position.x = x;
    add(panel);
    return panel;
  }
  for (const side of [-1,1]) {
    const x = side * 1.045;
    // Cab door window; the cargo section intentionally has no glass.
    const windowPts = [[2.07,1.75],[1.69,2.32],[0.76,2.33],[0.76,1.73]];
    sideShape(windowPts,x+side*0.008,bumper);
    sideShape([[2.01,1.77],[1.66,2.27],[0.82,2.27],[0.82,1.77]],x+side*0.018,glass);
    // Top-down flare reflection.
    sideShape([[1.70,2.21],[1.55,2.26],[0.89,2.26],[0.92,2.17]],x+side*0.023,glassGlint);
    // Cabin and sliding door outlines / side trims.
    box(x+side*0.012,1.36,0.70,0.016,1.26,0.027,linePaint);
    box(x+side*0.012,1.59,-0.84,0.015,1.72,0.027,linePaint);
    box(x+side*0.018,1.14,-1.82,0.026,0.05,1.10,roofPaint);
    box(x+side*0.020,1.06,-0.28,0.026,0.12,1.80,bumper);
    box(x+side*0.020,0.77,-0.43,0.036,0.17,2.00,darkMetal);
    box(x+side*0.020,1.64,0.30,0.038,0.075,0.19,metal);
    box(x+side*0.02,1.39,-0.60,0.042,0.08,0.21,metal);
    box(x+side*0.06,1.32,2.06,0.18,0.22,0.25,bumper);
    sphere(x+side*0.18,1.38,2.06,0.20,0.17,0.23,bumper);
    // Subtle stamp lines and side reflectors.
    box(x+side*0.020,1.53,-1.08,0.021,0.017,2.37,roofPaint);
    box(x+side*0.019,1.13,1.96,0.045,0.11,0.15,signals);
    box(x+side*0.020,0.77,-2.30,0.04,0.12,0.12,tailLamps);
    // Wheel arches from raised body-colored rings.
    for (const z of [1.48,-1.51]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.52,0.048,7,28,Math.PI),bumper);
      arch.rotation.y = Math.PI / 2;
      arch.position.set(side*1.067,0.49,z);
      add(arch);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.475,0.475,0.27,32),rubber);
      wheel.rotation.z = Math.PI/2;
      wheel.position.set(side*1.06,0.46,z);
      add(wheel,true);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.278,0.278,0.278,24),metal);
      hub.rotation.z = Math.PI/2;
      hub.position.set(side*1.065,0.46,z);
      add(hub);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.148,0.148,0.283,22),darkMetal);
      cap.rotation.z = Math.PI/2;
      cap.position.set(side*1.068,0.46,z);
      add(cap);
      for(let bolt=0;bolt<6;bolt++) {
        const a=bolt*Math.PI/3;
        sphere(side*1.212,0.46+Math.cos(a)*0.21,z+Math.sin(a)*0.21,0.024,0.024,0.024,darkMetal);
      }
    }
  }
  // Rear double cargo doors, hinges, long taillights and step bumper.
  box(0,1.8,-2.545,0.022,1.99,0.033,bumper);
  box(0,2.64,-2.548,1.71,0.035,0.031,roofPaint);
  for(const side of [-1,1]){
    box(side*0.89,1.63,-2.54,0.06,2.07,0.06,tailLamps);
    box(side*0.89,1.28,-2.578,0.055,0.36,0.04,lamps);
    for(const h of [1.18,2.34])box(side*0.94,h,-2.555,0.14,0.11,0.16,metal);
    box(side*0.36,1.35,-2.565,0.22,0.10,0.042,bumper);
  }
  box(0,1.12,-2.570,0.12,0.17,0.05,bumper);
  box(0,0.71,-2.650,0.75,0.21,0.045,darkMetal);
  // High roof marker lamps.
  for(const x of [-0.72,0,0.72])sphere(x,2.88,1.02,0.08,0.037,0.08,lamps);

  // Prime-style decals are drawn from scratch as textures, not taken from any photo.
  function makeLogo(width,height,sideLogo){
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");
    if(!ctx)return null;
    ctx.clearRect(0,0,width,height);
    ctx.lineCap="round";
    if(sideLogo){
      // Long blue smile-and-arrow and small white "prime".
      ctx.beginPath();
      ctx.moveTo(56,188);
      ctx.bezierCurveTo(230,340,550,365,820,166);
      ctx.strokeStyle="#04a7ee";ctx.lineWidth=40;ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(755,172);ctx.lineTo(850,130);ctx.lineTo(816,236);
      ctx.strokeStyle="#04a7ee";ctx.lineWidth=25;ctx.lineJoin="round";ctx.stroke();
      ctx.fillStyle="#f7fcff";
      ctx.font="bold 111px Arial,sans-serif";
      ctx.fillText("prime",680,115);
    }else{
      ctx.fillStyle="#ffffff";
      ctx.font="bold 104px Arial,sans-serif";
      ctx.textAlign="center";
      ctx.fillText("amazon",width/2,height/2+8);
      ctx.beginPath();
      ctx.moveTo(width*0.29,height*0.65);
      ctx.quadraticCurveTo(width*0.53,height*0.82,width*0.73,height*0.63);
      ctx.strokeStyle="#ffffff";ctx.lineWidth=10;ctx.stroke();
    }
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  }
  const sideLogo=makeLogo(1024,430,true);
  if(sideLogo){
    for(const side of [-1,1]){
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.94,0.88),sideLogo);
      mesh.rotation.y=side*Math.PI/2;
      mesh.position.set(side*1.071,2.03,-0.95);
      add(mesh);
    }
  }
  const rearLogo=makeLogo(640,290,false);
  if(rearLogo){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.74,0.79),rearLogo);
    mesh.rotation.y=Math.PI;
    mesh.position.set(0,1.96,-2.589);
    add(mesh);
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
    setMarkMode(false);
    preview = marker(new THREE.Vector3(location.x, location.y, location.z), 0xffc93d, 0.14);
    if (typeof options.onPick === "function") options.onPick(location);
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
