import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mountVan3D as mountBasicVan } from "./van3d.js";

// 3D asset: 3DAssets.dev "Large high-roof panel van", CC0 1.0.
// See https://3dassets.dev/assets/car-park-and-road-vehicle-fleet-high-roof-van-933a819a
// Original generic shape; the Prime-style decals below are drawn for this demo.
const MODEL_URL = "https://cdn.3dassets.dev/assets/32510/v1/model.glb";
const MODEL_TIMEOUT_MS = 14000;

function makeDecal(kind) {
 const canvas = document.createElement("canvas");
 canvas.width = 1024;
 canvas.height = 420;
 const ctx = canvas.getContext("2d");
 if (!ctx) return null;
 ctx.clearRect(0, 0, 1024, 420);
 if (kind === "side") {
  ctx.strokeStyle = "#05aafa";
  ctx.lineCap = "round";
  ctx.lineWidth = 39;
  ctx.beginPath();
  ctx.moveTo(55, 184);
  ctx.bezierCurveTo(280, 349, 539, 342, 783, 169);
  ctx.stroke();
  ctx.lineWidth = 23;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(719, 170);
  ctx.lineTo(832, 120);
  ctx.lineTo(799, 237);
  ctx.stroke();
  ctx.fillStyle = "#f6fbff";
  ctx.font = "bold 106px Arial, sans-serif";
  ctx.fillText("prime", 687, 106);
 } else {
  ctx.fillStyle = "#f7fbff";
  ctx.font = "bold 130px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("amazon", 512, 218);
  ctx.strokeStyle = "#f7fbff";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(286, 269);
  ctx.quadraticCurveTo(538, 378, 738, 263);
  ctx.stroke();
 }
 const texture = new THREE.CanvasTexture(canvas);
 texture.colorSpace = THREE.SRGBColorSpace;
 const material = new THREE.MeshBasicMaterial({
  map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide
 });
 return material;
}

function attachBranding(van, scene) {
 const sideMaterial = makeDecal("side");
 const rearMaterial = makeDecal("rear");
 const decals = [];
 if (sideMaterial) {
  for (const side of [-1, 1]) {
   const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 0.91), sideMaterial);
   mesh.rotation.y = side * Math.PI / 2;
   mesh.position.set(side * 1.125, 2.00, -0.65);
   mesh.renderOrder = 2;
   van.add(mesh);
   decals.push(mesh);
  }
 }
 if (rearMaterial) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.46, 0.64), rearMaterial);
  mesh.rotation.y = Math.PI;
  mesh.position.set(0, 1.84, -3.055);
  mesh.renderOrder = 2;
  van.add(mesh);
  decals.push(mesh);
 }
 return decals;
}

function tintBody(root) {
 const processed = new Map();
 root.traverse(obj => {
  if (!obj.isMesh || !obj.material) return;
  const existing = Array.isArray(obj.material) ? obj.material : [obj.material];
  const converted = existing.map(mat => {
   if (!mat || !mat.color) return mat;
   const name = (mat.name || "").toLowerCase();
   const meshName = (obj.name || "").toLowerCase();
   const match = /body.?paint|vehicle.?paint|car.?paint|bodywork|coachwork|exterior.?paint|paint.?blue/i;
   if (!(match.test(name) || match.test(meshName))) return mat;
   if (/(?:window|glass|lamp|tire|tyre|wheel|rubber)/.test(name+" "+meshName)) return mat;
   if (processed.has(mat)) return processed.get(mat);
   const clone = mat.clone();
   clone.color.set(0x273b4d);
   clone.metalness = 0.35;
   clone.roughness = 0.46;
   processed.set(mat,clone);
   return clone;
  });
  obj.material = Array.isArray(obj.material) ? converted : converted[0];
 });
}

export async function mountVan3D(stage, options = {}) {
 if (!stage) throw new Error("3D stage is missing");
 let timeoutId;
 let loaded;
 try {
  loaded = await Promise.race([
   new GLTFLoader().loadAsync(MODEL_URL),
   new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Model download timed out")), MODEL_TIMEOUT_MS);
   })
  ]);
 } catch (error) {
  console.warn("Realistic van unavailable; using previous 3D model", error);
  const fallback = mountBasicVan(stage, options);
  fallback.quality = "basic";
  return fallback;
 } finally {
  clearTimeout(timeoutId);
 }
 
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0xe6effa);
 const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
 const initialCamera = new THREE.Vector3(6.1, 3.55, 7.6);
 camera.position.copy(initialCamera);
 const renderer = new THREE.WebGLRenderer({
  antialias: true, powerPreference: "low-power", alpha: false
 });
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.3;
 renderer.shadowMap.enabled = false;
 renderer.domElement.style.width = "100%";
 renderer.domElement.style.height = "100%";
 renderer.domElement.style.display = "block";
 renderer.domElement.style.touchAction = "none";
 renderer.domElement.style.cursor = "grab";
 renderer.domElement.setAttribute("aria-label", options.language === "en"
  ? "Detailed, rotatable 3D delivery van"
  : "Guagua de entregas 3D más detallada y giratoria");
 stage.replaceChildren(renderer.domElement);

 const controls = new OrbitControls(camera, renderer.domElement);
 controls.enableDamping = true;
 controls.dampingFactor = 0.075;
 controls.enablePan = false;
 controls.minDistance = 3.65;
 controls.maxDistance = 15;
 controls.minPolarAngle = 0.06;
 controls.maxPolarAngle = Math.PI - 0.06;
 controls.target.set(0, 1.32, 0);
 controls.update();

 scene.add(new THREE.HemisphereLight(0xf9fdff, 0x8b9aaa, 2.3));
 const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
 keyLight.position.set(-6, 9, 8);
 scene.add(keyLight);
 const softLight = new THREE.DirectionalLight(0x8cc7ff, 1.65);
 softLight.position.set(6, 5, -7);
 scene.add(softLight);
 const fill = new THREE.DirectionalLight(0xffffff, 0.9);
 fill.position.set(0, 4, -9);
 scene.add(fill);

 const van = new THREE.Group();
 scene.add(van);
 const original = loaded.scene;
 // The CC0 asset is authored in metres, +Y up, +Z forward; wheels sit at ground.
 // Its extents are 2.202 x 2.733 x 6.042, matching our existing pin layout.
 tintBody(original);
 van.add(original);
 original.updateMatrixWorld(true);

 const floor = new THREE.Mesh(
  new THREE.CircleGeometry(4.15, 64),
  new THREE.MeshStandardMaterial({color:0xb4c8dc, roughness:0.9, transparent:true,opacity:0.32})
 );
 floor.rotation.x = -Math.PI / 2;
 floor.position.set(0,-0.11,0);
 scene.add(floor);

 const decals = attachBranding(van);
 const pickable = [];
 original.traverse(o => { if (o.isMesh && o.geometry) pickable.push(o); });
 const markers = [];
 const raycaster = new THREE.Raycaster();
 const pointer = new THREE.Vector2();
 let marking = false, preview = null, pressed = null, frame = 0, stopped = false;

 function pinVector(input) {
  if (!input || ![input.x,input.y,input.z].every(Number.isFinite)) return null;
  return new THREE.Vector3(
   THREE.MathUtils.clamp(input.x,-1.5,1.5),
   THREE.MathUtils.clamp(input.y,-0.2,3.1),
   THREE.MathUtils.clamp(input.z,-3.2,3.2)
  );
 }
 function makeMarker(position,color,radius) {
  const mesh = new THREE.Mesh(
   new THREE.SphereGeometry(radius,16,12),
   new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.42,roughness:0.35})
  );
  mesh.position.copy(position);
  van.add(mesh);
  return mesh;
 }
 function clearPreview() {
  if (!preview) return;
  van.remove(preview);
  preview.geometry.dispose();
  preview.material.dispose();
  preview=null;
 }
 for (const damage of options.damages || []) {
  const location=pinVector(damage.pin);
  if (!location) continue;
  const dot=makeMarker(location,damage.repaired===true ? 0x21b785 : 0xf13d50,0.12);
  dot.userData.damage=damage;
  markers.push(dot);
 }

 function setMarkMode(value) {
  marking=Boolean(value);
  renderer.domElement.style.cursor=marking ? "crosshair" : "grab";
  if(marking)clearPreview();
 }
 function onDown(e){pressed={x:e.clientX,y:e.clientY};}
 function onCancel(){pressed=null;}
 function onUp(e) {
  if(stopped||!pressed) return;
  const distance=Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y);
  pressed=null;
  if(distance>8)return;
  const rect=renderer.domElement.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pickable,true);
  const markerHits=raycaster.intersectObjects(markers,false);
  if(markerHits.length&&(!hits.length||markerHits[0].distance < hits[0].distance+0.10)){
   options.onMarker?.(markerHits[0].object.userData.damage);
   return;
  }
  if(!marking||!hits.length)return;
  const hit=hits[0];
  if(!hit.face)return;
  const surfaceNormal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const world=hit.point.clone().addScaledVector(surfaceNormal,0.085);
  const local=van.worldToLocal(world);
  const location={x:+local.x.toFixed(3),y:+local.y.toFixed(3),z:+local.z.toFixed(3)};
  setMarkMode(false);
  clearPreview();
  preview=makeMarker(new THREE.Vector3(location.x,location.y,location.z),0xfacc46,0.13);
  options.onPick?.(location);
 }
 renderer.domElement.addEventListener("pointerdown",onDown);
 renderer.domElement.addEventListener("pointerup",onUp);
 renderer.domElement.addEventListener("pointercancel",onCancel);

 function resize(){
  const width=Math.max(240,stage.clientWidth||600);
  const height=Math.max(260,stage.clientHeight||400);
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
 }
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
 observer?.observe(stage);
 window.addEventListener("resize",resize);
 resize();
 function animate(){
  if(stopped)return;
  frame=window.requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
 }
 animate();

 return {
  quality:"detailed",
  source:"3DAssets.dev — CC0 1.0",
  setMarkMode,
  resetView() {
   camera.position.copy(initialCamera);
   controls.target.set(0,1.32,0);
   controls.update();
  },
  destroy(){
   if(stopped)return;
   stopped=true;
   window.cancelAnimationFrame(frame);
   observer?.disconnect();
   window.removeEventListener("resize",resize);
   renderer.domElement.removeEventListener("pointerdown",onDown);
   renderer.domElement.removeEventListener("pointerup",onUp);
   renderer.domElement.removeEventListener("pointercancel",onCancel);
   controls.dispose();
   clearPreview();
   const geometries=new Set(),materials=new Set(),textures=new Set();
   scene.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){
     materials.add(m);
     for(const key of ["map","normalMap","roughnessMap","metalnessMap","emissiveMap"]){
      if(m[key])textures.add(m[key]);
     }
    }
   });
   geometries.forEach(g=>g.dispose());
   textures.forEach(t=>t.dispose());
   materials.forEach(m=>m.dispose());
   renderer.dispose();
   if(renderer.domElement.parentNode===stage)stage.replaceChildren();
  }
 };
}
