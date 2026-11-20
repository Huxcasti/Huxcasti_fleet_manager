import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Original, lightweight Rivian EDV-inspired delivery van for WILX's demonstration.
// Geometry and Prime-style markings are constructed locally; no external paid asset.
// Not a manufacturer CAD model or an official Amazon/Rivian 3D asset.
export function mountRivian3D(stage, options = {}) {
 if (!stage) throw new Error("Rivian stage is missing");
 const en = options.language === "en";
 const scene = new THREE.Scene();
 scene.background = new THREE.Color(0xe4effa);
 const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
 const start = new THREE.Vector3(7.3, 4.4, 8.5);
 camera.position.copy(start);
 const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.17;
 renderer.domElement.style.cssText="display:block;width:100%;height:100%;touch-action:none;cursor:grab";
 renderer.domElement.setAttribute("aria-label", en
  ? "Interactive Rivian-inspired Amazon electric delivery van"
  : "Guagua eléctrica de reparto inspirada en Rivian, giratoria en 3D");
 stage.replaceChildren(renderer.domElement);

 const controls = new OrbitControls(camera, renderer.domElement);
 controls.enableDamping = true;
 controls.dampingFactor = 0.075;
 controls.enablePan = false;
 controls.minDistance = 5.5;
 controls.maxDistance = 17;
 controls.maxPolarAngle = Math.PI-0.02;
 controls.target.set(0,1.6,0);
 controls.update();

 scene.add(new THREE.HemisphereLight(0xffffff,0x718ca5,2.1));
 const key = new THREE.DirectionalLight(0xffffff,3.1);
 key.position.set(-5,9,7);scene.add(key);
 const rim = new THREE.DirectionalLight(0x80cbff,1.4);
 rim.position.set(5,5,-7);scene.add(rim);

 const van = new THREE.Group();scene.add(van);
 const paint = new THREE.MeshStandardMaterial({color:0x1c354e,metalness:0.42,roughness:0.32,side:THREE.DoubleSide});
 const roof = new THREE.MeshStandardMaterial({color:0x29435a,metalness:0.32,roughness:0.41});
 const trim = new THREE.MeshStandardMaterial({color:0x101922,metalness:0.19,roughness:0.69});
 const fascia = new THREE.MeshStandardMaterial({color:0x101a22,metalness:0.20,roughness:0.32});
 const windowMat = new THREE.MeshStandardMaterial({color:0x071725,metalness:0.3,roughness:0.14,transparent:true,opacity:0.95,side:THREE.DoubleSide});
 const tint = new THREE.MeshStandardMaterial({color:0x40677e,transparent:true,opacity:0.24,depthWrite:false,side:THREE.DoubleSide});
 const glassEdge = new THREE.MeshStandardMaterial({color:0x06131e,roughness:0.4});
 const silver = new THREE.MeshStandardMaterial({color:0x7b8b98,metalness:0.74,roughness:0.26});
 const tire = new THREE.MeshStandardMaterial({color:0x0e1218,roughness:0.92});
 const hub = new THREE.MeshStandardMaterial({color:0x253b51,metalness:0.58,roughness:0.35});
 const blue = new THREE.MeshBasicMaterial({color:0x08a7f0});
 const rearBlue = new THREE.MeshStandardMaterial({color:0x028ad2,roughness:0.38,metalness:0.08});
 const white = new THREE.MeshBasicMaterial({color:0xf3fbff});
 const red = new THREE.MeshStandardMaterial({color:0xf2293e,emissive:0xa01a26,emissiveIntensity:0.32});
 const amber = new THREE.MeshStandardMaterial({color:0xf6a035,emissive:0x964309,emissiveIntensity:0.18});
 const pickable=[];const markers=[];
 function add(mesh,pick=false){
  van.add(mesh);if(pick)pickable.push(mesh);return mesh;
 }
 function cube(x,y,z,w,h,d,mat,pick=false){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);return add(m,pick);
 }
 function plate(w,h,mat,x,y,z,rotationY=0,pick=false){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  m.position.set(x,y,z);m.rotation.y=rotationY;return add(m,pick);
 }
 function disc(radius,thickness,mat,x,y,z,rotateX=Math.PI/2) {
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,thickness,28),mat);
  m.rotation.x=rotateX;m.position.set(x,y,z);return add(m);
 }
 function torus(radius,tube,mat,x,y,z,rotationX=Math.PI/2) {
  const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,40),mat);
  m.rotation.x=rotationX;m.position.set(x,y,z);return add(m);
 }
 // The extruded silhouette has a boxy high roof, curved upper corners and
 // short, rounded cab. Shape x=-z so van faces toward positive z.
 const outline=new THREE.Shape();
 outline.moveTo(3.15,0.66);
 outline.lineTo(-2.85,0.66);
 outline.quadraticCurveTo(-3.20,0.74,-3.23,1.03);
 outline.lineTo(-3.23,1.56);
 outline.quadraticCurveTo(-3.22,1.75,-3.11,1.94);
 outline.lineTo(-2.63,2.95);
 outline.quadraticCurveTo(-2.51,3.16,-2.31,3.19);
 outline.lineTo(2.69,3.19);
 outline.quadraticCurveTo(3.14,3.17,3.15,2.73);
 outline.closePath();
 const chassis=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{
  depth:2.16,steps:1,curveSegments:12,
  bevelEnabled:true,bevelSegments:2,bevelSize:0.06,bevelThickness:0.045
 }),paint);
 chassis.rotation.y=Math.PI/2;
 chassis.position.x=-1.08;
 add(chassis,true);
 // Roofline, lower valance, cargo section, seam lines and charging hardware.
 cube(0,3.13,-0.54,2.05,0.075,4.83,roof);
 cube(0,0.66,0,2.18,0.27,6.23,trim);
 for(const side of [-1,1]){
  cube(side*1.105,0.84,-0.78,0.052,0.24,4.56,trim);
  cube(side*1.128,2.23,-0.82,0.014,1.57,4.48,paint,true);
  // Cargo and sliding door seams.
  for(const z of [-2.72,-0.96,0.89]){
   cube(side*1.140,1.88,z,0.016,2.10,0.014,glassEdge);
  }
  cube(side*1.146,1.73,0.8,0.025,0.20,0.06,trim);
  cube(side*1.146,0.91,1.45,0.025,0.13,0.26,amber);
  // Side window and its sloping windshield-style bevel.
  const sideGlass=new THREE.Mesh(new THREE.PlaneGeometry(0.98,0.88),windowMat);
  sideGlass.position.set(side*1.158,2.42,1.92);
  sideGlass.rotation.y=side*Math.PI/2;
  add(sideGlass);
  const glint=new THREE.Mesh(new THREE.PlaneGeometry(0.17,0.68),tint);
  glint.position.set(side*1.166,2.42,1.73);
  glint.rotation.y=side*Math.PI/2;
  add(glint);
  // Side mirrors are attached on articulated black arms.
  cube(side*1.29,2.16,2.35,0.31,0.06,0.06,trim);
  const mirror=cube(side*1.44,2.20,2.32,0.16,0.30,0.26,trim);
  cube(side*1.525,2.20,2.32,0.02,0.22,0.19,silver);
 }
 // Large inclined windshield (front facing +z), split only by an understated pillar.
 const glassGeo=new THREE.BufferGeometry();
 const corners=[
  -1.025,1.98,3.12, 1.025,1.98,3.12, 1.007,2.99,2.64,
  -1.025,1.98,3.12, 1.007,2.99,2.64, -1.007,2.99,2.64
 ];
 glassGeo.setAttribute("position",new THREE.Float32BufferAttribute(corners,3));
 glassGeo.computeVertexNormals();
 const glass=new THREE.Mesh(glassGeo,windowMat);add(glass,true);
 const windshieldShine=new THREE.Mesh(new THREE.PlaneGeometry(0.18,0.69),tint);
 windshieldShine.position.set(-0.63,2.53,2.85);windshieldShine.rotation.x=-0.41;add(windshieldShine);
 cube(0,2.12,3.13,2.07,0.025,0.032,glassEdge);
 // Blunt Rivian EDV nose with oval headlight surrounds.
 cube(0,1.36,3.229,2.09,0.55,0.07,fascia,true);
 cube(0,0.97,3.255,2.00,0.18,0.11,trim);
 cube(0,0.82,3.30,1.88,0.08,0.07,glassEdge);
 for(const x of [-0.80,0.80]){
  disc(0.245,0.04,trim,x,1.48,3.28);
  disc(0.201,0.048,silver,x,1.48,3.307);
  disc(0.170,0.05,fascia,x,1.48,3.340);
  torus(0.17,0.036,white,x,1.48,3.371,0);
  disc(0.054,0.05,silver,x,1.48,3.382);
 }
 // Front grill slot and fascia separations.
 cube(0,1.095,3.295,1.22,0.058,0.045,glassEdge);
 cube(0,0.64,3.31,1.68,0.17,0.10,trim);
 // Rear roll-up door, black surround, roof light bar and side tail lamps.
 cube(0,1.77,-3.228,1.84,2.11,0.044,trim,true);
 cube(0,1.78,-3.265,1.56,1.85,0.048,rearBlue,true);
 for(const x of [-0.88,0.88]){
  cube(x,1.9,-3.282,0.078,2.07,0.072,red);
  cube(x,0.78,-3.28,0.10,0.16,0.077,white);
 }
 cube(0,2.98,-3.283,1.72,0.10,0.06,red);
 cube(0,0.75,-3.28,1.93,0.20,0.12,trim);
 // Wheels: twin wheel wells, sidewall, blue EV wheel rings and silver centers.
 for(const z of [-2.31,2.05]){
  for(const side of [-1,1]){
   const x=side*1.06;
   const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.50,0.50,0.23,36),tire);
   wheel.rotation.z=Math.PI/2;wheel.position.set(x,0.57,z);add(wheel);
   const exterior=side*1.19;
   const center=new THREE.Mesh(new THREE.CylinderGeometry(0.335,0.335,0.016,36),hub);
   center.rotation.z=Math.PI/2;center.position.set(exterior,0.57,z);add(center);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(0.345,0.026,9,48),blue);
   ring.rotation.y=Math.PI/2;ring.position.set(side*1.204,0.57,z);add(ring);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.135,0.135,0.025,28),silver);
   cap.rotation.z=Math.PI/2;cap.position.set(side*1.21,0.57,z);add(cap);
  }
 }
 function canvasLabel(w,h,painter){
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");if(!ctx)return null;
  ctx.clearRect(0,0,w,h);painter(ctx,w,h);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 }
 // Prime smile and lettering are placed on the actual exterior side panels.
 const prime=canvasLabel(1024,460,(ctx)=>{
  ctx.strokeStyle="#00a8ed";ctx.lineCap="round";ctx.lineJoin="round";
  ctx.lineWidth=38;ctx.beginPath();
  ctx.moveTo(68,165);ctx.bezierCurveTo(245,341,559,357,829,118);ctx.stroke();
  ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(753,113);ctx.lineTo(829,118);ctx.lineTo(809,211);ctx.stroke();
  ctx.font="bold 107px Arial,sans-serif";ctx.fillStyle="#f8fbff";ctx.fillText("prime",744,93);
 });
 if(prime){
  for(const side of [-1,1]){
   const m=plate(3.95,1.78,prime,side*1.168,2.08,-0.9,side*Math.PI/2);
   m.renderOrder=5;
  }
 }
 const amazon=canvasLabel(800,300,(ctx)=>{
  ctx.fillStyle="#f7fbff";ctx.textAlign="center";ctx.font="bold 108px Arial,sans-serif";
  ctx.fillText("amazon",400,125);
  ctx.strokeStyle="#f7fbff";ctx.lineCap="round";ctx.lineWidth=13;ctx.beginPath();
  ctx.moveTo(245,165);ctx.quadraticCurveTo(400,235,550,163);ctx.stroke();
  ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(503,163);ctx.lineTo(560,155);ctx.lineTo(545,204);ctx.stroke();
 });
 if(amazon){
  const back=plate(1.45,0.64,amazon,0,1.99,-3.305,Math.PI);
  back.renderOrder=5;
  const front=plate(0.69,0.27,amazon,0,1.37,3.322);
  front.renderOrder=5;
 }
 // Ground plane only. No fake fleet records or pre-recorded defect states.
 const ground=new THREE.Mesh(new THREE.CircleGeometry(4.7,64),
  new THREE.MeshStandardMaterial({color:0xa9c4de,transparent:true,opacity:0.25,roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-0.04;scene.add(ground);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let marking=false,preview=null,pressed=null,stopped=false,frame=0;
 function marker(location,color,size=0.13){
  const m=new THREE.Mesh(new THREE.SphereGeometry(size,16,12),
   new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.35}));
  m.position.copy(location);van.add(m);return m;
 }
 function validPin(pin){
  if(!pin||![pin.x,pin.y,pin.z].every(Number.isFinite))return null;
  return new THREE.Vector3(
   THREE.MathUtils.clamp(pin.x,-1.6,1.6),
   THREE.MathUtils.clamp(pin.y,0,3.4),
   THREE.MathUtils.clamp(pin.z,-3.4,3.5)
  );
 }
 for(const damage of options.damages||[]){
  const p=validPin(damage.pin);if(!p)continue;
  const m=marker(p,damage.repaired===true?0x24c08b:0xf0344e,0.13);
  m.userData.damage=damage;markers.push(m);
 }
 function clearPreview(){
  if(!preview)return;
  van.remove(preview);preview.geometry.dispose();preview.material.dispose();preview=null;
 }
 function setMarkMode(v) {
  marking=Boolean(v);clearPreview();renderer.domElement.style.cursor=marking?"crosshair":"grab";
 }
 const onDown=e=>{pressed={x:e.clientX,y:e.clientY}};
 const onCancel=()=>{pressed=null};
 function onUp(e){
  if(!pressed||stopped)return;
  const delta=Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y);pressed=null;
  if(delta>8)return;
  const bounds=renderer.domElement.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pickable,true);
  const markHits=raycaster.intersectObjects(markers,false);
  if(markHits.length&&(!hits.length||markHits[0].distance<hits[0].distance+0.1)){
   options.onMarker?.(markHits[0].object.userData.damage);return;
  }
  if(!marking||!hits.length)return;
  const hit=hits[0];if(!hit.face)return;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const point=van.worldToLocal(hit.point.clone().addScaledVector(normal,0.085));
  const pin={x:+point.x.toFixed(3),y:+point.y.toFixed(3),z:+point.z.toFixed(3)};
  setMarkMode(false);preview=marker(point,0xffc83d,0.14);options.onPick?.(pin);
 }
 renderer.domElement.addEventListener("pointerdown",onDown);
 renderer.domElement.addEventListener("pointerup",onUp);
 renderer.domElement.addEventListener("pointercancel",onCancel);
 function resize(){
  const width=Math.max(240,stage.clientWidth||600),height=Math.max(260,stage.clientHeight||400);
  camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
 }
 const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
 observer?.observe(stage);window.addEventListener("resize",resize);resize();
 function animate(){if(stopped)return;frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
 animate();
 return {
  quality:"procedural-rivian",source:"Original illustrative Rivian EDV-inspired van created for WILX",
  setMarkMode,resetView(){
   camera.position.copy(start);controls.target.set(0,1.6,0);controls.update();
  },
  destroy(){
   if(stopped)return;stopped=true;cancelAnimationFrame(frame);
   observer?.disconnect();window.removeEventListener("resize",resize);
   renderer.domElement.removeEventListener("pointerdown",onDown);
   renderer.domElement.removeEventListener("pointerup",onUp);
   renderer.domElement.removeEventListener("pointercancel",onCancel);
   controls.dispose();clearPreview();
   const geometries=new Set(),materials=new Set(),maps=new Set();
   scene.traverse(obj=>{
    if(obj.geometry)geometries.add(obj.geometry);
    for(const m of obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[]){
     materials.add(m);if(m.map)maps.add(m.map);
    }
   });
   geometries.forEach(g=>g.dispose());maps.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
   renderer.dispose();if(renderer.domElement.parentNode===stage)stage.replaceChildren();
  }
 };
}
