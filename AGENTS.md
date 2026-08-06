# AGENTS.md

## Cursor Cloud specific instructions

Este repo es el **Sistema Organizador PAI**: una app web Node.js/Express con SQLite (`better-sqlite3`)
que parsea PDFs de reclamos municipales y los deriva por WhatsApp. La app principal está en la raíz
(`server/` backend, `public/` frontend). Las carpetas `whatsapp-server/` y `whatsapp-server-greenapi/`
son microservicios alternativos para el despliegue online (Railway / GREEN-API) y NO hacen falta para
correr la app principal en local.

### Servicios

| Servicio | Ubicación | Cómo correrlo | Notas |
|----------|-----------|---------------|-------|
| App PAI (principal) | raíz | `npm start` (o `npm run dev`) | Express en `http://localhost:3000`. `start` y `dev` son idénticos (no hay hot-reload). |
| WhatsApp server (Railway) | `whatsapp-server/` | `npm install && npm start` dentro de la carpeta | Opcional. Requiere su propio `npm install`. |
| WhatsApp server (GREEN-API) | `whatsapp-server-greenapi/` | `npm install && npm start` dentro de la carpeta | Opcional. Usa la API HTTP de GREEN-API. |

### Arranque y caveats (app principal)

- El update script ya deja instaladas las dependencias y crea las carpetas runtime
  (`database/`, `uploads/`, `whatsapp-session/`), que están gitignoreadas y son necesarias:
  `better-sqlite3` y `multer` fallan si no existen.
- La base SQLite (`database/pai.db`) se crea sola al primer arranque y se siembran usuarios de prueba:
  `admin/admin123`, `operador1/operador123`, `supervisor1/supervisor123`, más el área de ejemplo
  `ALUMBRADO PÚBLICO`.
- **WhatsApp no se conecta en cloud**: `whatsappService` levanta Chromium (Puppeteer) con
  `headless:false` y muestra un QR en la consola que necesita un teléfono real para vincularse. El error
  de conexión se captura y **no** tumba el servidor Express; la app queda `whatsapp: desconectado`.
- Consecuencia: **aprobar** un reclamo requiere WhatsApp conectado y el área con teléfono configurado, así
  que en cloud devuelve 503 / "Área no configurada" (comportamiento esperado). El resto del flujo core
  (login, carga+parseo de PDF, listado, **rechazo** con auditoría, estadísticas) funciona sin WhatsApp.
- El parser usa `pdf-parse` (pdf.js 1.10.100, viejo). PDFs generados con `pdfkit` fallan con
  "bad XRef entry"; los PDFs impresos por Chrome/Puppeteer (`page.pdf()`) se parsean bien. El parser
  espera texto con campos tipo `Solicitud Nro:`, `Subtipo:`, `Descripcion:`, `Area destino:`.

### Endpoints útiles para smoke test

- `GET /api/status` y `GET /api/test` — estado del servidor y de WhatsApp.
- Flujo: `POST /api/auth/login` → `POST /api/operador/upload` (campo `pdf`) →
  `GET /api/supervisor/pendientes` → `POST /api/supervisor/reclamos/:id/rechazar`.
