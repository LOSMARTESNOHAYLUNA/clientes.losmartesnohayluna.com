// ════════════════════════════════════════════════════════════════════════
//  svdExtract — lee un reporte (PDF, Excel, CSV, imagen o texto) y devuelve
//  las métricas que corresponden a cada fase del SVD del cliente.
//
//  Despliegue (desde la carpeta firebase_svd):
//     firebase functions:secrets:set ANTHROPIC_API_KEY
//     firebase deploy --only functions:svdExtract
//  La URL que imprime el despliegue va en firebase-config.js → svdExtractFn
// ════════════════════════════════════════════════════════════════════════
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const XLSX = require("xlsx");

admin.initializeApp();
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const ORIGENES = ["https://clientes.losmartesnohayluna.com"];
const CLIENTES = ["cleanup", "docrys", "englishwithlydia", "fisiodomicili", "gardensolution", "kawi", "lorenzo", "segui"];
const MAX_BYTES = 25 * 1024 * 1024;
const MODEL = "claude-sonnet-5-5";

const FASES_SVD = [
  ["1", "Alcance", "personas que ven el anuncio / impresiones / alcance / búsquedas"],
  ["2", "Interés", "clics, visitas a la landing o a la web, sesiones, usuarios"],
  ["3", "Contacto", "leads, formularios, llamadas, mensajes, registros, conversiones de contacto"],
  ["4a", "Propuesta comercial (1ª compra o reserva)", "demos reservadas, presupuestos solicitados, primeras compras de producto de entrada"],
  ["4b", "Propuesta comercial (2ª)", "asistencia a demo, segunda compra o upgrade"],
  ["5", "Producto estrella", "clientes a los que se presenta la propuesta principal"],
  ["6", "Negociación", "clientes interesados en negociación"],
  ["7", "Sistema P10-15-15", "acuerdos cerrados pendientes de reserva"],
  ["8", "Resolución: € o motivo", "pagos de reserva / compras / pedidos / ventas cerradas"],
  ["9", "Entrega", "proyectos en entrega"],
  ["10", "Post-venta", "encuestas o sesiones post-venta"],
];

const herramienta = {
  name: "registrar_metricas_svd",
  description: "Registra las métricas encontradas en el reporte, asignadas a las fases del SVD del cliente.",
  input_schema: {
    type: "object",
    properties: {
      sugerencias: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fase: { type: "string", enum: ["1", "2", "3", "4a", "4b", "5", "6", "7", "8", "9", "10", "gastos"] },
            valor: { type: "number", description: "Valor numérico total del periodo que cubre el reporte. Para 'gastos', importe en euros." },
            concepto: { type: "string", description: "Nombre de la métrica tal como aparece en el reporte (p. ej. 'Alcance', 'Clics en el enlace', 'Importe gastado')." },
            motivo: { type: "string", description: "Una frase: por qué esta métrica corresponde a esa fase." },
            confianza: { type: "string", enum: ["alta", "media", "baja"] },
          },
          required: ["fase", "valor", "concepto", "motivo", "confianza"],
        },
      },
      periodo: { type: "string", description: "Periodo que cubre el reporte, si se indica (p. ej. 'Septiembre 2026' o '01/09/2026 – 30/09/2026'). Vacío si no consta." },
      resumen: { type: "string", description: "Dos frases en español con lo más relevante del reporte para el cliente." },
    },
    required: ["sugerencias", "periodo", "resumen"],
  },
};

function cors(req, res) {
  const origin = req.get("origin") || "";
  if (ORIGENES.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
  return ORIGENES.includes(origin);
}

async function leerArchivo(body) {
  // Opción 1: archivo ya subido a Storage (preferida)
  if (body.path) {
    const prefijo = `portales/${body.clientId}/reportes/`;
    if (!body.path.startsWith(prefijo) || body.path.includes("..")) throw new Error("Ruta no permitida");
    const file = admin.storage().bucket().file(body.path);
    const [meta] = await file.getMetadata();
    if (Number(meta.size) > MAX_BYTES) throw new Error("El archivo supera 25 MB");
    const [buf] = await file.download();
    return { buf, mime: meta.contentType || "application/octet-stream", name: body.path.split("/").pop() };
  }
  // Opción 2: archivo enviado en la petición (cuando Storage no está disponible)
  if (body.data) {
    const buf = Buffer.from(body.data, "base64");
    if (buf.length > MAX_BYTES) throw new Error("El archivo supera 25 MB");
    return { buf, mime: body.mime || "application/octet-stream", name: body.name || "reporte" };
  }
  throw new Error("Falta el archivo");
}

function bloquesContenido({ buf, mime, name }) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const m = (mime || "").toLowerCase();
  if (m === "application/pdf" || ext === "pdf") {
    return [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") } }];
  }
  if (/^image\/(png|jpeg|webp|gif)$/.test(m) || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    const media = ext === "jpg" ? "image/jpeg" : m.startsWith("image/") ? m : `image/${ext}`;
    return [{ type: "image", source: { type: "base64", media_type: media, data: buf.toString("base64") } }];
  }
  if (["xlsx", "xls", "csv", "tsv"].includes(ext) || /spreadsheet|excel|csv/.test(m)) {
    const wb = XLSX.read(buf, { type: "buffer", raw: false });
    let texto = "";
    wb.SheetNames.forEach((sn) => {
      texto += `\n### Hoja: ${sn}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[sn], { FS: ";", blankrows: false }).slice(0, 60000);
    });
    return [{ type: "text", text: "Contenido del reporte (tabla exportada a CSV con ';'):\n" + texto.slice(0, 120000) }];
  }
  // Texto plano / otros
  return [{ type: "text", text: "Contenido del reporte:\n" + buf.toString("utf8").slice(0, 120000) }];
}

exports.svdExtract = onRequest(
  { region: "europe-west1", secrets: [ANTHROPIC_API_KEY], memory: "1GiB", timeoutSeconds: 120, cors: false },
  async (req, res) => {
    const permitido = cors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (!permitido) return res.status(403).json({ error: "Origen no permitido" });
    if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
    try {
      const body = req.body || {};
      if (!CLIENTES.includes(body.clientId)) return res.status(400).json({ error: "Cliente no reconocido" });
      const archivo = await leerArchivo(body);
      const fases = Array.isArray(body.fases) ? body.fases : [];
      const descFases = FASES_SVD.map(([id, nombre, pista]) => {
        const propia = fases.find((f) => f && f.id === id && f.crit);
        return `- Fase ${id} · ${nombre}: ${propia ? "criterio del cliente: «" + String(propia.crit).slice(0, 300) + "»" : "p. ej. " + pista}`;
      }).join("\n");

      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
      const respuesta = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: `Eres analista de marketing digital en una agencia española. Lees reportes de campañas (Meta Ads, Google Ads, Search Console, Analytics, CRM, informes propios) y extraes las cifras que alimentan el embudo "Sistema Definitivo de Ventas" (SVD) de un cliente.
Reglas:
- Devuelve solo cifras que estén en el reporte. No inventes ni estimes. Si una métrica no aparece, no la incluyas.
- Usa totales del periodo completo del reporte (fila "Total" si existe; si no, suma las filas). Números en formato español: "1.234,56" es mil doscientos treinta y cuatro con cincuenta y seis.
- Asigna cada métrica a UNA fase según el criterio del cliente. Alcance/impresiones → 1; clics/visitas/sesiones → 2; leads/formularios/llamadas/mensajes → 3; compras/ventas/pedidos → 8 salvo que el criterio del cliente diga otra cosa; coste/importe gastado/inversión → gastos.
- Si hay varias métricas candidatas para una misma fase (p. ej. alcance e impresiones), incluye las dos con su confianza; la más fiel al criterio del cliente con confianza "alta".
- Responde únicamente llamando a la herramienta registrar_metricas_svd.`,
        tools: [herramienta],
        tool_choice: { type: "tool", name: "registrar_metricas_svd" },
        messages: [{
          role: "user",
          content: [
            ...bloquesContenido(archivo),
            { type: "text", text: `Fases del SVD de este cliente:\n${descFases}\n\nArchivo: ${archivo.name}. Extrae las métricas y asígnalas a las fases.` },
          ],
        }],
      });
      const uso = respuesta.content.find((c) => c.type === "tool_use");
      if (!uso) return res.status(502).json({ error: "No se obtuvo una respuesta estructurada" });
      const out = uso.input;
      out.sugerencias = (out.sugerencias || []).filter((s) => typeof s.valor === "number" && isFinite(s.valor));
      return res.json(out);
    } catch (e) {
      console.error("[svdExtract]", e);
      return res.status(500).json({ error: e.message || "Error al leer el reporte" });
    }
  }
);
