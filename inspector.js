const api = window.WILX3D;
if (!api) throw new Error("Fleet integration not ready");
const en = api.language === "en";
const t = (es, eng) => en ? eng : es;
const styles = document.createElement("style");
styles.textContent =
".inspector-overlay{position:fixed;inset:0;z-index:2000;background:#071429dd;display:flex;align-items:center;justify-content:center;padding:15px;overscroll-behavior:contain}"+
".inspector-overlay[hidden]{display:none!important}.inspector-dialog{width:min(960px,100%);max-height:96dvh;overflow-y:auto;border-radius:16px;background:#f8fbff;border:1px solid #90b6dc;box-shadow:0 25px 75px #0009}"+
".inspector-head{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:17px 19px;background:linear-gradient(120deg,#112944,#245e93);color:white}.inspector-head h2{color:white;margin:0 0 4px;font-size:20px}.inspector-head p{margin:0;color:#c9e3fa;font-size:12px}"+
".inspector-close{border:1px solid #a3c9ec99;border-radius:9px;min-width:42px;min-height:42px;background:#ffffff1b;color:white;font-size:20px}"+
".inspector-canvas{width:100%;height:clamp(330px,51vh,530px);background:#eaf3fd;overflow:hidden;touch-action:none}.inspector-canvas canvas{display:block;touch-action:none}"+
".inspector-actions{display:flex;gap:8px;flex-wrap:wrap;padding:13px 18px 5px}.inspector-actions .btn{flex:1 1 145px}"+
".inspector-status{color:#315578;font-size:13px;line-height:1.5;margin:8px 18px 12px}.inspector-detail{margin:9px 18px;padding:12px;background:#eaf5ff;border:1px solid #c2ddf5;border-radius:10px;line-height:1.5;font-size:13px;overflow-wrap:anywhere}"+
".inspector-help{color:#506d8d;font-size:12px;line-height:1.5;margin:10px 18px 17px}"+
"@media(max-width:600px){.inspector-overlay{padding:0;align-items:stretch}.inspector-dialog{width:100%;max-height:100dvh;height:100dvh;border-radius:0;display:flex;flex-direction:column}.inspector-head{padding:11px 14px}.inspector-canvas{height:auto;min-height:260px;flex:1 1 47dvh}.inspector-actions{padding:10px 12px 3px}.inspector-detail{margin:8px 12px}.inspector-status,.inspector-help{margin:8px 12px}}";
document.head.append(styles);

const overlay = document.createElement("div");
overlay.className = "inspector-overlay";
overlay.hidden = true;
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.setAttribute("aria-labelledby", "inspectorTitle");
overlay.innerHTML =
'<div class="inspector-dialog"><div class="inspector-head"><div><h2 id="inspectorTitle"></h2><p id="inspectorSubtitle"></p></div>'+
'<button type="button" id="inspectorClose" class="inspector-close" aria-label="'+t("Cerrar","Close")+'">✕</button></div>'+
'<div id="inspectorStage" class="inspector-canvas"></div>'+
'<div class="inspector-actions"><button type="button" class="btn" id="inspectorMark" disabled>'+t("Marcar daño","Mark damage")+'</button>'+
'<button type="button" class="btn secondary" id="inspectorView" disabled>'+t("Restablecer vista","Reset view")+'</button>'+
'<button type="button" class="btn secondary" id="inspectorReport" disabled>'+t("Registrar avería aquí","Report damage here")+'</button></div>'+
'<p id="inspectorStatus" class="inspector-status" role="status"></p>'+
'<div id="inspectorDetail" class="inspector-detail" hidden></div>'+
'<div id="inspectorSelection" class="inspector-detail" hidden></div>'+
'<p class="inspector-help">'+t("Desliza un dedo para girar, pellizca para acercar y toca Marcar daño para colocar un punto sobre la guagua.","Drag to rotate, pinch to zoom, and select Mark damage to place a point on the van.")+'</p></div>';
document.body.append(overlay);

const $ = id => document.getElementById(id);
let viewer=null, current=null, loadToken=0, oldScroll=null;
function clearPin(){
 api.pendingPin=null;
 const note=$("damagePinNotice");
 if(note){note.hidden=true;note.textContent="";}
}
function close(retainPin=false){
 loadToken++;
 if(viewer){viewer.destroy();viewer=null;}
 overlay.hidden=true;
 current=null;
 $("inspectorStage").replaceChildren();
 $("inspectorSelection").hidden=true;
 $("inspectorDetail").hidden=true;
 document.body.style.overflow=oldScroll??"";
 oldScroll=null;
 if(!retainPin)clearPin();
}
async function open(id){
 const vehicle=api.getData().vehicles.find(v=>v.id===id);
 if(!vehicle)return;
 if(!overlay.hidden)close();
 const token=++loadToken;
 current=id;
 oldScroll=document.body.style.overflow;
 document.body.style.overflow="hidden";
 overlay.hidden=false;
 $("inspectorTitle").textContent=t("Inspección 3D","3D inspection")+" · "+id;
 $("inspectorSubtitle").textContent=vehicle.name+" · "+vehicle.year+" — "+t("Modelo ilustrativo, no réplica exacta","Illustrative model, not an exact replica");
 $("inspectorStatus").textContent=t("Cargando guagua 3D…","Loading 3D van…");
 $("inspectorDetail").hidden=true;
 $("inspectorSelection").hidden=true;
 $("inspectorMark").disabled=true;
 $("inspectorView").disabled=true;
 $("inspectorReport").disabled=true;
 $("inspectorClose").focus();
 try{
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const {mountVan3D}=await import("./van3d.js");
  if(token!==loadToken)return;
  viewer=mountVan3D($("inspectorStage"),{
   language:api.language,
   damages:api.getData().damages.filter(d=>d.vehicle===id),
   onMarker(damage){
    if(token!==loadToken)return;
    $("inspectorDetail").hidden=false;
    $("inspectorDetail").textContent=t("Avería: ","Damage: ")+damage.part+" · "+
      (damage.repaired?t("Arreglado","Fixed"):t("Pendiente","Pending"))+
      (damage.details?" · "+damage.details:"");
   },
   onPick(pin){
    if(token!==loadToken)return;
    api.pendingPin={vehicleId:id,pin};
    $("inspectorSelection").textContent=t(
     "Ubicación seleccionada. Presiona Registrar avería aquí para continuar.",
     "Location selected. Select Report damage here to continue.");
    $("inspectorSelection").hidden=false;
    $("inspectorStatus").textContent=t("Punto seleccionado","Point selected");
    $("inspectorReport").disabled=false;
   }
  });
  $("inspectorMark").disabled=false;
  $("inspectorView").disabled=false;
  $("inspectorStatus").textContent=t("Modelo listo. Rojo: daño pendiente; verde: reparado.","Model ready. Red: pending damage; green: repaired.");
 }catch(error){
  if(token!==loadToken)return;
  console.error("3D inspection failed",error);
  $("inspectorStatus").textContent=t("No se pudo cargar el modelo. Comprueba tu conexión o el navegador.","Could not load the model. Check your connection or browser.");
 }
}
$("inspectorClose").addEventListener("click",()=>close());
overlay.addEventListener("click",event=>{if(event.target===overlay)close();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!overlay.hidden)close();});
$("inspectorMark").addEventListener("click",()=>{
 if(!viewer)return;
 clearPin();
 $("inspectorSelection").hidden=true;
 $("inspectorDetail").hidden=true;
 $("inspectorReport").disabled=true;
 viewer.setMarkMode(true);
 $("inspectorStatus").textContent=t("Toca sobre la guagua para marcar el daño.","Tap the van to mark the damage.");
});
$("inspectorView").addEventListener("click",()=>viewer?.resetView());
$("inspectorReport").addEventListener("click",()=>{
 const pending=api.pendingPin;
 if(!pending||pending.vehicleId!==current)return;
 const id=current;
 close(true);
 api.openPage("averias");
 $("damageVehicle").value=id;
 $("damagePinNotice").hidden=false;
 $("damagePinNotice").textContent=t("Ubicación 3D seleccionada para "+id+". Describe la avería y guarda el reporte.","3D location selected for "+id+". Describe the damage and save the report.");
 $("damagePart").focus();
 $("damageForm").scrollIntoView({behavior:"smooth",block:"nearest"});
});
$("damageVehicle").addEventListener("change",()=>{
 if(api.pendingPin&&api.pendingPin.vehicleId!==$("damageVehicle").value)clearPin();
});
document.addEventListener("click",event=>{
 const btn=event.target.closest("[data-3d-open]");
 if(btn)open(btn.getAttribute("data-3d-open"));
});
api.onDamageSaved=damage=>{if(api.pendingPin?.vehicleId===damage.vehicle)clearPin();};
api.onVehicleDeleted=id=>{if(id===current)close();if(api.pendingPin?.vehicleId===id)clearPin();};
api.onReset=()=>close();
