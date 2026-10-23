# Función `svdExtract` — lectura de reportes con IA para el SVD

Lee un reporte subido por el cliente (PDF, Excel, CSV, imagen o texto) y devuelve las métricas asignadas a las fases de su SVD. El SVD muestra las propuestas y el cliente decide cuáles aplica.

Es un **codebase separado** (`svd`) del de la función de emails, así que desplegarla no toca `sendEmail`.

## Despliegue (una vez, desde un terminal)

```bash
cd firebase_svd
firebase use lmnhl-portales
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY     # clave de https://platform.claude.com (Console → API keys)
firebase deploy --only functions:svdExtract
```

El terminal imprime la URL de la función. Pégala en `firebase-config.js` (raíz del repositorio), en el campo `svdExtractFn`, y sube el archivo. A partir de ahí el botón **Leer métricas** del SVD usa la IA para todos los formatos.

## Coste
Claude Sonnet 5.5: unos 2 $/millón de tokens de entrada. Un PDF de 10 páginas ronda los 10–15k tokens → menos de 0,05 € por reporte. Un aviso de presupuesto en Google Cloud y un límite de gasto en la consola de Anthropic bastan para dormir tranquila.

## Qué hace exactamente
1. Comprueba el origen (`clientes.losmartesnohayluna.com`) y que el cliente esté en la lista (la misma que `firestore.rules`; añadir los nuevos aquí también, en `CLIENTES`).
2. Descarga el archivo de Storage (`portales/{CLIENT_ID}/reportes/…`) o lo recibe en la petición si Storage no está disponible.
3. PDF e imágenes se envían al modelo tal cual; Excel y CSV se convierten a texto.
4. El modelo devuelve, en formato fijo, una lista de `{fase, valor, concepto, motivo, confianza}` más el periodo y un resumen. No inventa cifras: solo lo que está en el reporte.
