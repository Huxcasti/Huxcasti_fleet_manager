# Huxcasti_fleet_manager

## Modelo 3D Ford Transit 2020
La inspección 3D de WILX Logistics está preparada para utilizar el modelo auténtico Ford Transit 2020, suministrado por el usuario.

**Ruta esperada del archivo:** `assets/ford-transit-prime.glb`

El archivo es binario (~11.6 MB). Para activarlo en GitHub Pages hay que subir ese GLB al directorio `assets` del repositorio. El visor `realvan.js` lo carga desde el mismo dominio, y mantiene `van3d.js` como modelo de respaldo si no está disponible.

### Créditos / Licencia
- **Título original:** [2020 Ford Transit](https://sketchfab.com/3d-models/2020-ford-transit-9801fbf49bfc456497495e45efa6df0c)
- **Autor:** [tonielpro520](https://sketchfab.com/tonielpro520)
- **Origen:** Sketchfab
- **Licencia:** Creative Commons Attribution (CC BY)
- **Adaptaciones:** pintura de carrocería azul grisáceo, logotipos estilo Amazon/Prime generados en el visor y marcadores interactivos de averías.

El modelo y la marca Amazon/Prime se utilizan como demostración visual, sin implicar afiliación o aprobación de Amazon.

### Nota
Las fichas todavía incluyen vehículos Ford Transit, Ram ProMaster y Mercedes Sprinter; hasta que haya modelos propios para cada una, el visor usa la Ford Transit como referencia visual. Los datos del sistema siguen guardándose en el navegador.

## Rivian EDV Amazon Prime · modelo 3D gratuito y local
En **Flota → Ver ficha → Inspeccionar guagua en 3D** se puede seleccionar entre Ford Transit y Rivian EDV. La unidad ilustrativa `RIV-DEMO` de la lista inicia con Rivian automáticamente.

- **Rivian:** el módulo local `rivian3d.js` construye una recreación original con Three.js, inspirada en la silueta de la Rivian EDV. Incluye carrocería azul oscuro, distintivos estilo Amazon Prime, banda negra del frontal, faros redondos y puerta trasera azul.
- **Costo de modelo:** $0. No descarga ni depende de un modelo comercial de terceros ni del iframe de Sketchfab.
- **Interacción:** girar, acercar, marcar puntos de avería y consultar marcadores previamente guardados. Las coordenadas se guardan como parte de los registros de la demo del navegador.
- **Ford Transit:** sigue utilizando `assets/ford-transit-prime.glb` y el inspector de daños original.
- **Limitación:** Rivian es una **interpretación estilizada**, no un archivo CAD ni una réplica exacta autorizada por el fabricante. La marca Amazon se muestra con fines de demostración, sin afiliación.
- No cambia la información real de vehículos guardada en el navegador. `RIV-DEMO` es una unidad de demostración, no un activo de WILX.
