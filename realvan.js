import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mountVan3D as mountBasicVan } from "./van3d.js";

// Authentic 2020 Ford Transit from the uploaded file.
// Original artist: tonielpro520 on Sketchfab, Creative Commons Attribution (CC BY).
// https://sketchfab.com/3d-models/2020-ford-transit-9801fbf49bfc456497495e45efa6df0c
// Dark blue body finish is embedded in the custom GLB; Prime decals are drawn in this code.
const MODEL_URL = new URL("./assets/ford-transit-prime.glb", import.meta.url).href;
const MODEL_TIMEOUT_MS = 28000;

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
  // Smiling arrow with the distinctive upward-pointing tip at the right.
  ctx.moveTo(286, 269);
  ctx.quadraticCurveTo(521, 388, 744, 254);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(684, 259);
  ctx.lineTo(755, 241);
  ctx.lineTo(731, 311);
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
   const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 1.09), sideMaterial);
   mesh.rotation.y = side * Math.PI / 2;
   mesh.position.set(side * 1.078, 1.87, -1.15);
   mesh.renderOrder = 2;
   van.add(mesh);
   decals.push(mesh);
  }
 }
 if (rearMaterial) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 0.69), rearMaterial);
  mesh.rotation.y = Math.PI;
  mesh.position.set(0, 1.89, -3.302);
  mesh.renderOrder = 2;
  van.add(mesh);
  decals.push(mesh);
 }
 return decals;
}

// ────────────────────────────────────────────────────────────────
// 2. NATIVE FORD LIGHTS — NO FAKE BOXES OR FLOATING GEOMETRY
// ────────────────────────────────────────────────────────────────
// The actual GLB contains separate lamps, but part of their geometry sits
// behind opaque bodywork. We preserve those exact meshes and render them as
// a controlled overlay only when looking toward the relevant end of the van.
// At side-on angles they fade away to prevent "floating" red / white strips.
function revealOriginalLights(root) {
 const frontNames=new Set(["headlight_l","headlight_r","indicator_lf","indicator_rf","extralight_1","extralight_2"]);
 const rearNames=new Set(["taillight_l","taillight_r","brakelight_l","brakelight_r","brakelight_m","reversinglight_l","reversinglight_r","indicator_lr","indicator_rr"]);
 const front=[],rear=[];
 root.traverse(obj=>{
  if(!obj.isMesh||!obj.material)return;
  const name=(obj.name||"").toLowerCase().replace(/\.\d+$/,"");
  const isFront=frontNames.has(name),isRear=rearNames.has(name);
  if(!isFront&&!isRear)return;
  const mats=(Array.isArray(obj.material)?obj.material:[obj.material]).map(material=>{
   const clone=material.clone();
   clone.transparent=true;
   clone.depthWrite=false;
   clone.depthTest=false; // Genuine recessed lenses, not separate large panels
   clone.opacity=1;
   clone.side=THREE.DoubleSide;
   clone.needsUpdate=true;
   return clone;
  });
  obj.material=Array.isArray(obj.material)?mats:mats[0];
  obj.renderOrder=name.startsWith("indicator_")||name.startsWith("reversinglight")?8:7;
  // +X corresponds to the model's left lights, -X to right lights.
  // Keep the distant side from showing through opaque body panels.
  const side=/(_l$|_lf$|_lr$|_1$)/.test(name)?1:
             /(_r$|_rf$|_rr$|_2$)/.test(name)?-1:0;
  (isFront?front:rear).push({mesh:obj,materials:mats,side});
 });
 const smooth=(v,min,max)=>{
  const t=THREE.MathUtils.clamp((v-min)/(max-min),0,1);
  return t*t*(3-2*t);
 };
 function update(cameraX,cameraZ) {
  const distance=Math.max(0.001,Math.hypot(cameraX,cameraZ));
  const frontness=cameraZ/distance, sideness=cameraX/distance;
  const frontOpacity=smooth(frontness,0.35,0.82);
  const rearOpacity=smooth(-frontness,0.35,0.82);
  function apply(entries,endOpacity) {
   for (const entry of entries) {
    const sideOpacity=entry.side===0?1:smooth(entry.side*sideness,-0.55,0.05);
    const opacity=endOpacity*sideOpacity;
    entry.mesh.visible=opacity>0.015;
    entry.materials.forEach(mat=>{mat.opacity=opacity;});
   }
  }
  apply(front,frontOpacity);
  apply(rear,rearOpacity);
 }
 return {frontCount:front.length,rearCount:rear.length,update};
}

// The source GLB has no embedded textures: 34 of its 36 materials default
// to a near-white 0.8 base color. Color every named part deliberately instead
// of recoloring just the two exterior paint materials. Preserve the original
// meshes so body panels and interactive damage coordinates remain unchanged.
function tintBody(root) {
 const looks = {
  "script_rt_dials_gen_taxi": {color:0x222b36},
  "caliper": {color:0x545f68,metalness:0.55},
  "vehicle_generic_smallspecmap__paint_1_": {color:0x30495f,metalness:0.33,roughness:0.40},
  "chrome86effect": {color:0x84949f,metalness:0.72,roughness:0.25},
  "plastic2": {color:0x1f2932,roughness:0.76},
  "grey2": {color:0x303a45,roughness:0.73},
  "exterior_diffuse": {color:0x252d36,roughness:0.72},
  "grayglass": {color:0x1a3448,metalness:0.08,roughness:0.21,opacity:0.84},
  "ford": {color:0x23496b,metalness:0.42},
  "vehicle_generic_smallspecmap__paint_2_": {color:0x30495f,metalness:0.33,roughness:0.40},
  "lightsglass": {color:0xadbcc9,metalness:0.10,roughness:0.21,opacity:0.90},
  "lights": {color:0xc0c9d1,roughness:0.30,emissive:0x313a43},
  "miror": {color:0x314656,metalness:0.44,roughness:0.23},
  "interior_diffuse": {color:0x2b343e,roughness:0.84},
  "license_frame": {color:0x1b232b},
  "headglass": {color:0xb8c5cf,metalness:0.15,roughness:0.20,opacity:0.93},
  "px2": {color:0x28333e},
  "notepad": {color:0x3b454e},
  "black": {color:0x171d24},
  "notepad_tex": {color:0x49525c},
  "cardboard_boxs_albedo": {color:0x77634c},
  "gz_v_ss_officejunk": {color:0x4e5863},
  "offwhite": {color:0xb1b9c2,roughness:0.85},
  "display": {color:0x172839,roughness:0.25},
  "orange": {color:0xc88231},
  "yellow": {color:0xd4a044},
  "lightglass": {color:0x657786,opacity:0.96,roughness:0.32},
  "hatch": {color:0x1b2530},
  "ext_metal_rim": {color:0x79848d,metalness:0.78,roughness:0.29},
  "protektor": {color:0x202830,roughness:0.78},
  "rezina": {color:0x14191e,roughness:0.96},
  "matte__ffb2b2b2__spec_": {color:0x838e98,metalness:0.56,roughness:0.40},
  "ext_metal_nuts_blots": {color:0x919da7,metalness:0.81,roughness:0.24},
  "matte__ffacacac__spec_": {color:0x68737e,metalness:0.36},
  "int_plastic_black": {color:0x1d242c,roughness:0.83},
  "int_red_indicator": {color:0xb3353e,roughness:0.47}
 };
 const lightParts = {
  // Front lamp assemblies: frosted glass with a soft metallic reflector.
  "headlight_l": {color:0xd3dfe6,metalness:0.16,roughness:0.22,emissive:0x536b80,emissiveIntensity:0.09},
  "headlight_r": {color:0xd3dfe6,metalness:0.16,roughness:0.22,emissive:0x536b80,emissiveIntensity:0.09},
  "extralight_1": {color:0x8c9fad,metalness:0.27,roughness:0.25,emissive:0x445d70,emissiveIntensity:0.07},
  "extralight_2": {color:0x8c9fad,metalness:0.27,roughness:0.25,emissive:0x445d70,emissiveIntensity:0.07},
  // Tall Ford Transit rear lenses and upper brake lamp.
  "taillight_l": {color:0xac1e31,roughness:0.24,emissive:0x670b19,emissiveIntensity:0.12},
  "taillight_r": {color:0xac1e31,roughness:0.24,emissive:0x670b19,emissiveIntensity:0.12},
  "brakelight_l": {color:0xd52d3e,roughness:0.16,emissive:0x941222,emissiveIntensity:0.27},
  "brakelight_r": {color:0xd52d3e,roughness:0.16,emissive:0x941222,emissiveIntensity:0.27},
  "brakelight_m": {color:0xe33648,roughness:0.16,emissive:0xb01526,emissiveIntensity:0.30},
  // Clear reverse lenses; turn signals are amber, not white.
  "reversinglight_l": {color:0xc5d1da,metalness:0.12,roughness:0.16,emissive:0x71879b,emissiveIntensity:0.12},
  "reversinglight_r": {color:0xc5d1da,metalness:0.12,roughness:0.16,emissive:0x71879b,emissiveIntensity:0.12},
  "indicator_lf": {color:0xc58b3b,roughness:0.24,emissive:0x7d3e0a,emissiveIntensity:0.10},
  "indicator_rf": {color:0xc58b3b,roughness:0.24,emissive:0x7d3e0a,emissiveIntensity:0.10},
  "indicator_lr": {color:0xe3a044,roughness:0.19,emissive:0x9b520e,emissiveIntensity:0.18},
  "indicator_rr": {color:0xe3a044,roughness:0.19,emissive:0x9b520e,emissiveIntensity:0.18}
 };
 // Source GLB reuses one "lights" material for brake, reverse, turn signals.
 // Apply overrides per *mesh* before considering shared-material cache.
 const processed = new Map();
 const matchedLights = new Set();
 root.traverse(obj => {
  if (!obj.isMesh || !obj.material) return;
  const original = Array.isArray(obj.material) ? obj.material : [obj.material];
  const converted = original.map(mat => {
   if (!mat || !mat.color) return mat;
   const key = (mat.name || "").toLowerCase().replace(/\.\d+$/, "");
   const meshName = (obj.name || "").toLowerCase().replace(/\.\d+$/, "");
   const specialLight = lightParts[meshName];
   if (specialLight) matchedLights.add(meshName);
   // Unrecognized materials are left alone, including user-added textures.
   const look = specialLight || looks[key];
   if (!look) return mat;
   if (!specialLight && processed.has(mat)) return processed.get(mat);
   const clone = mat.clone();
   clone.color.setHex(look.color);
   clone.metalness = look.metalness ?? 0.08;
   clone.roughness = look.roughness ?? 0.67;
   if (look.opacity !== undefined) {
    clone.transparent = true;
    clone.opacity = look.opacity;
    clone.depthWrite = false;
    clone.side = THREE.DoubleSide;
   }
   if (look.emissive && clone.emissive) {
    clone.emissive.setHex(look.emissive);
    clone.emissiveIntensity = look.emissiveIntensity ?? 0.08;
   }
   clone.needsUpdate = true;
   if (!specialLight) processed.set(mat, clone);
   return clone;
  });
  obj.material = Array.isArray(obj.material) ? converted : converted[0];
 });
 return { lightsApplied: matchedLights.size, lightNames: [...matchedLights].sort() };
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
  console.warn("Ford Transit GLB unavailable; using procedural demo fallback", error);
  const fallback = mountBasicVan(stage, options);
  fallback.quality = "basic";
  return fallback;
 } finally {
  clearTimeout(timeoutId);
 }
 
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0xe6effa);
 const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
 const initialCamera = new THREE.Vector3(5.45, 3.10, 6.85);
 camera.position.copy(initialCamera);
 const renderer = new THREE.WebGLRenderer({
  antialias: true, powerPreference: "low-power", alpha: false
 });
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.05;
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

 scene.add(new THREE.HemisphereLight(0xf9fdff, 0x8b9aaa, 1.75));
 const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
 keyLight.position.set(-6, 9, 8);
 scene.add(keyLight);
 const softLight = new THREE.DirectionalLight(0x8cc7ff, 0.95);
 softLight.position.set(6, 5, -7);
 scene.add(softLight);
 const fill = new THREE.DirectionalLight(0xffffff, 0.6);
 fill.position.set(0, 4, -9);
 scene.add(fill);

 const van = new THREE.Group();
 scene.add(van);
 const original = loaded.scene;
 // Real Ford Transit GLB: +Y up, +Z forward; approximately 2.56 x 2.71 x 6.64 m.
 // Old pins may appear offset, but new damage positions use this exact geometry.
 const lightDiagnostic = tintBody(original);
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
 const originalLamps = revealOriginalLights(original);
 originalLamps.update(camera.position.x-controls.target.x,camera.position.z-controls.target.z);
 const pickable = [];
 original.traverse(o => { if (o.isMesh && o.geometry) pickable.push(o); });
 const markers = [];
 const raycaster = new THREE.Raycaster();
 const pointer = new THREE.Vector2();
 let marking = false, preview = null, pressed = null, frame = 0, stopped = false;

 function pinVector(input) {
  if (!input || ![input.x,input.y,input.z].every(Number.isFinite)) return null;
  return new THREE.Vector3(
   THREE.MathUtils.clamp(input.x,-1.45,1.45),
   THREE.MathUtils.clamp(input.y,-0.2,2.9),
   THREE.MathUtils.clamp(input.z,-3.5,3.5)
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
  originalLamps.update(camera.position.x-controls.target.x,camera.position.z-controls.target.z);
  renderer.render(scene,camera);
 }
 animate();

 return {
  quality:"detailed",
  lightsApplied: lightDiagnostic.lightsApplied,
  lightNames: lightDiagnostic.lightNames,
  originalFrontLamps:originalLamps.frontCount,
  originalRearLamps:originalLamps.rearCount,
  rearAmazonArrow:true,
  source:"2020 Ford Transit by tonielpro520 — Sketchfab, CC Attribution",
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
