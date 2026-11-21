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
".inspector-help{color:#506d8d;font-size:12px;line-height:1.5;margin:10px 18px 10px}"+
".inspector-credit{color:#5b748c;font-size:11px;margin:0 18px 17px;line-height:1.45}.inspector-credit a{color:#1b589e;text-decoration:underline}"+
".inspector-head-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.inspector-model-label{display:flex;flex-direction:column;gap:3px;color:#d6ecff;font-size:11px;font-weight:700}.inspector-model-label select{min-height:35px;max-width:190px;border:1px solid #9bb9d7;border-radius:8px;padding:6px 9px;background:#f1f8ff;color:#142e4d;font-size:13px;font-weight:700}.inspector-canvas iframe{display:block;width:100%;height:100%;border:0}.inspector-render-target{width:100%;height:100%}.inspector-actions[hidden]{display:none!important}"+
"@media(max-width:600px){.inspector-overlay{padding:0;align-items:stretch}.inspector-dialog{width:100%;max-height:100dvh;height:100dvh;border-radius:0;display:flex;flex-direction:column}.inspector-head{padding:11px 14px;gap:8px;flex-wrap:wrap}.inspector-head h2{font-size:17px}.inspector-head-controls{width:100%;justify-content:space-between}.inspector-model-label{flex:1}.inspector-model-label select{max-width:none;width:100%}.inspector-canvas{height:auto;min-height:260px;flex:1 1 47dvh}.inspector-actions{padding:10px 12px 3px}.inspector-detail{margin:8px 12px}.inspector-status,.inspector-help{margin:8px 12px}}";
document.head.append(styles);

const overlay = document.createElement("div");
overlay.className = "inspector-overlay";
overlay.hidden = true;
overlay.setAttribute("role", "dialog");
overlay.setAttribute("aria-modal", "true");
overlay.setAttribute("aria-labelledby", "inspectorTitle");
overlay.innerHTML =
'<div class="inspector-dialog"><div class="inspector-head"><div><h2 id="inspectorTitle"></h2><p id="inspectorSubtitle"></p></div>'+
'<div class="inspector-head-controls"><label class="inspector-model-label" for="inspectorModel">'+t("Modelo 3D","3D model")+'<select id="inspectorModel"><option value="ford">Ford Transit 2020</option><option value="rivian">Rivian EDV (Amazon)</option></select></label>'+
'<button type="button" id="inspectorClose" class="inspector-close" aria-label="'+t("Cerrar","Close")+'">✕</button></div></div>'+
'<div id="inspectorStage" class="inspector-canvas"></div>'+
'<div class="inspector-actions" id="inspectorActions"><button type="button" class="btn" id="inspectorMark" disabled>'+t("Marcar daño","Mark damage")+'</button>'+
'<button type="button" class="btn secondary" id="inspectorView" disabled>'+t("Restablecer vista","Reset view")+'</button>'+
'<button type="button" class="btn secondary" id="inspectorReport" disabled>'+t("Registrar avería aquí","Report damage here")+'</button></div>'+
'<p id="inspectorStatus" class="inspector-status" role="status"></p>'+
'<div id="inspectorDetail" class="inspector-detail" hidden></div>'+
'<div id="inspectorSelection" class="inspector-detail" hidden></div>'+
'<p id="inspectorHelp" class="inspector-help">'+t("Desliza un dedo para girar, pellizca para acercar y toca Marcar daño para colocar un punto sobre la guagua.","Drag to rotate, pinch to zoom, and select Mark damage to place a point on the van.")+'</p>'+
'<p id="inspectorCredit" class="inspector-credit">Ford Transit 2020 · 3D: <a href="https://sketchfab.com/3d-models/2020-ford-transit-9801fbf49bfc456497495e45efa6df0c" target="_blank" rel="noopener noreferrer">tonielpro520 (Sketchfab)</a> · CC BY · '+t("Color y gráficos modificados para la demostración.","Paint and graphics modified for this demo.")+'</p></div>';
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
async function loadSelectedModel(id){
  const vehicle=api.getData().vehicles.find(v=>v.id===id);
  if(!vehicle || overlay.hidden || current!==id)return;
  const token=++loadToken;
  if(viewer){viewer.destroy();viewer=null;}
  const stage=$("inspectorStage");
  stage.replaceChildren();
  $("inspectorDetail").hidden=true;
  $("inspectorSelection").hidden=true;
  $("inspectorMark").disabled=true;
  $("inspectorView").disabled=true;
  $("inspectorReport").disabled=true;
  const rivian=$("inspectorModel").value==="rivian";
  $("inspectorActions").hidden=rivian;
  $("inspectorSubtitle").textContent=vehicle.name+" · "+vehicle.year+" — "+
    (rivian ? t("Rivian EDV de referencia","Reference Rivian EDV") :
      t("Modelo Ford Transit 2020 de referencia; puede diferir de esta unidad",
        "Reference 2020 Ford Transit model; may differ from this unit"));
  if(rivian){
    $("inspectorHelp").textContent=t(
      "Gira el modelo con un dedo y utiliza dos dedos para acercar. Este visor externo permite explorar la Rivian, pero no marcar daños directamente.",
      "Drag to rotate and pinch to zoom. This external viewer lets you explore the Rivian but cannot place damage markers directly.");
    $("inspectorCredit").innerHTML=
      'Rivian Amazon Electric Delivery Van · 3D: <a href="https://sketchfab.com/3d-models/low-poly-car-rivians-amazon-electric-van-597d70bfcf7c43bba31ffffc51290624" target="_blank" rel="noopener noreferrer">ROH3D (Sketchfab)</a> · '+
      t("El color y las texturas del modelo son los originales del autor.",
        "Model colors and textures are the artist’s originals.");
    $("inspectorStatus").textContent=t(
      "Rivian 3D lista para explorar. Para marcar daños y ponerle logos Prime sobre la carrocería se necesita el archivo 3D editable.",
      "Rivian 3D ready to explore. An editable 3D file is needed for damage markers and Prime branding on the body.");
    const iframe=document.createElement("iframe");
    iframe.title="Rivian Amazon Electric Delivery Van · 3D · ROH3D";
    iframe.src="https://sketchfab.com/models/597d70bfcf7c43bba31ffffc51290624/embed?autostart=0&ui_theme=dark";
    iframe.setAttribute("allow","autoplay; fullscreen; xr-spatial-tracking");
    iframe.setAttribute("allowfullscreen","");
    iframe.referrerPolicy="strict-origin-when-cross-origin";
    stage.appendChild(iframe);
    return;
  }
  $("inspectorHelp").textContent=t(
    "Desliza un dedo para girar, pellizca para acercar y toca Marcar daño para colocar un punto sobre la guagua.",
    "Drag to rotate, pinch to zoom, and select Mark damage to place a point on the van.");
  $("inspectorCredit").innerHTML=
    'Ford Transit 2020 · 3D: <a href="https://sketchfab.com/3d-models/2020-ford-transit-9801fbf49bfc456497495e45efa6df0c" target="_blank" rel="noopener noreferrer">tonielpro520 (Sketchfab)</a> · CC BY · '+
    t("Color y gráficos modificados para la demostración.","Paint and graphics modified for this demo.");
  $("inspectorStatus").textContent=t("Cargando Ford Transit 3D…","Loading Ford Transit 3D…");
  try{
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const {mountVan3D}=await import("./realvan.js?v=prime-word-spacing-v9");
    if(token!==loadToken)return;
    const renderTarget=document.createElement("div");
    renderTarget.className="inspector-render-target";
    if(token!==loadToken)return;
    stage.replaceChildren(renderTarget);
    const loadedViewer=await mountVan3D(renderTarget,{
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
    if(token!==loadToken){loadedViewer.destroy();return;}
    viewer=loadedViewer;
    $("inspectorMark").disabled=false;
    $("inspectorView").disabled=false;
    const lightStatus=viewer.originalFrontLamps===6 && viewer.originalRearLamps===9
      ? t(" · Palabra Prime separada de la flecha · v9"," · Prime text clear of arrow · v9")
      : t(" · Versión anterior: recarga la página."," · Older version: reload the page.");
    $("inspectorStatus").textContent=viewer.quality==="basic"
      ? t("No se pudo cargar la Ford Transit; se muestra la versión de respaldo.","Ford Transit could not load; showing backup van.")
      : t("Ford Transit 2020 lista. Rojo: daño pendiente; verde: reparado.","2020 Ford Transit ready. Red: pending damage; green: repaired.")+lightStatus;
  }catch(error){
    if(token!==loadToken)return;
    console.error("3D inspection failed",error);
    $("inspectorStatus").textContent=t("No se pudo cargar el modelo. Comprueba tu conexión o el navegador.","Could not load the model. Check your connection or browser.");
  }
}
function open(id){
  const vehicle=api.getData().vehicles.find(v=>v.id===id);
  if(!vehicle)return;
  if(!overlay.hidden)close();
  current=id;
  oldScroll=document.body.style.overflow;
  document.body.style.overflow="hidden";
  overlay.hidden=false;
  $("inspectorTitle").textContent=t("Inspección 3D","3D inspection")+" · "+id;
  $("inspectorModel").value=/rivian|amazon electric|\bedv\b/i.test(vehicle.name)?"rivian":"ford";
  $("inspectorClose").focus();
  void loadSelectedModel(id);
}
$("inspectorModel").addEventListener("change",()=>{
  if(!current)return;
  clearPin();
  void loadSelectedModel(current);
});
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
