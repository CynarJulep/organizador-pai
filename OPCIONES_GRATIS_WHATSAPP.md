# Opciones 100% GRATIS para WhatsApp (Sin Pagar Nada)

## 🎯 OPCIONES REALES Y GRATIS

### ✅ OPCIÓN 1: WhatsApp Cloud API (Meta Oficial) - GRATIS

**Ventajas:**
- ✅ **100% GRATIS** (oficial de Meta)
- ✅ Sin servidor propio necesario
- ✅ Sin límites de tiempo
- ✅ API oficial y estable
- ✅ No requiere whatsapp-web.js

**Desventajas:**
- ⚠️ Requiere aprobación de Meta (puede tardar días/semanas)
- ⚠️ Solo para uso empresarial (no personal)
- ⚠️ Requiere número de teléfono empresarial verificado
- ⚠️ Restricciones: Solo para atención al cliente, reservas, pedidos (no chatbots genéricos)

**Link:** https://developers.facebook.com/docs/whatsapp/cloud-api

**Costo:** $0/mes (gratis)

---

### ✅ OPCIÓN 2: GREEN-API - Tier Gratuito

**Ventajas:**
- ✅ **Tier gratuito** para desarrolladores
- ✅ API estable y confiable
- ✅ No requiere servidor propio
- ✅ Fácil de integrar
- ✅ Permite enviar mensajes, archivos, etc.

**Desventajas:**
- ⚠️ Límites en tier gratuito (número de mensajes)
- ⚠️ Requiere número de WhatsApp verificado
- ⚠️ Puede tener límites de velocidad

**Link:** https://green-api.com/es

**Costo:** $0/mes (tier gratuito con límites)

---

### ✅ OPCIÓN 3: Oracle Cloud Free Tier (Self-Hosted)

**Ventajas:**
- ✅ **100% GRATIS** para siempre
- ✅ Sin límites de mensajes
- ✅ Control total
- ✅ Sin sleep automático
- ✅ Usa whatsapp-web.js (tu código actual)

**Desventajas:**
- ⚠️ Requiere configuración manual (1-2 horas)
- ⚠️ Requiere tarjeta de crédito (pero NO cobra)
- ⚠️ Aprobación puede tardar 1-2 días

**Link:** https://www.oracle.com/cloud/free/

**Costo:** $0/mes (gratis para siempre)

---

### ⚠️ OPCIÓN 4: Evolution API (Self-Hosted en Oracle Cloud)

**Ventajas:**
- ✅ API moderna y potente
- ✅ Gratis si se self-hosta en Oracle Cloud
- ✅ Mejor que whatsapp-web.js
- ✅ Soporte para múltiples números

**Desventajas:**
- ⚠️ Requiere más configuración
- ⚠️ Necesita Oracle Cloud (gratis pero requiere setup)

**Link:** https://evolution-api.com

**Costo:** $0/mes (si se self-hosta en Oracle Cloud)

---

## 🎯 RECOMENDACIÓN POR CASO DE USO

### Si necesitas algo RÁPIDO y FÁCIL:
**→ GREEN-API (Tier Gratuito)**
- Setup en 15 minutos
- API lista para usar
- Límites pero suficientes para empezar

### Si quieres 100% GRATIS para siempre y control total:
**→ Oracle Cloud Free Tier + whatsapp-web.js**
- Ya tienes el código listo
- Solo necesitas configurar Oracle Cloud
- Gratis para siempre

### Si es para uso empresarial oficial:
**→ WhatsApp Cloud API (Meta)**
- Oficial y gratis
- Pero requiere aprobación de Meta

---

## 🚀 GUÍA RÁPIDA: GREEN-API (La Más Fácil)

### PASO 1: Crear Cuenta en GREEN-API (5 minutos)

1. Ve a: https://green-api.com/es
2. Haz clic en **"Registrarse"**
3. Completa el formulario
4. Verifica tu email
5. ¡Listo! Tienes cuenta gratuita

### PASO 2: Obtener Credenciales (5 minutos)

1. En el dashboard de GREEN-API
2. Ve a **"API"** → **"Settings"**
3. Copia:
   - **idInstance**: Tu ID de instancia
   - **apiTokenInstance**: Tu token de API

### PASO 3: Adaptar Tu Código (10 minutos)

En lugar de usar `whatsapp-web.js`, usarás la API de GREEN-API.

**Ejemplo de envío de mensaje:**

```javascript
// Enviar mensaje de texto
const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chatId: '543424123456@c.us',  // Número con formato
        message: 'Mensaje de prueba'
    })
});

// Enviar archivo (PDF)
const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/sendFileByUrl/${apiTokenInstance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chatId: '543424123456@c.us',
        urlFile: 'https://url-del-pdf.com/reclamo.pdf',
        fileName: 'reclamo.pdf',
        caption: 'Mensaje con PDF adjunto'
    })
});
```

### PASO 4: Crear Servidor Simple (15 minutos)

Puedes crear un servidor Express simple que use GREEN-API:

```javascript
// whatsapp-server-greenapi/index.js
const express = require('express');
const app = express();
app.use(express.json());

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const GREEN_API_URL = `https://api.green-api.com/waInstance${GREEN_API_ID}`;

// POST /api/send - Enviar mensaje + PDF
app.post('/api/send', async (req, res) => {
    try {
        const { numero, mensaje, pdf_url } = req.body;

        if (!numero || !mensaje) {
            return res.status(400).json({ error: 'numero y mensaje son requeridos' });
        }

        const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;

        // Si hay PDF, enviarlo con caption
        if (pdf_url) {
            const response = await fetch(`${GREEN_API_URL}/sendFileByUrl/${GREEN_API_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    urlFile: pdf_url,
                    fileName: 'reclamo.pdf',
                    caption: mensaje
                })
            });

            const data = await response.json();
            return res.json({ success: true, data });
        } else {
            // Solo texto
            const response = await fetch(`${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    message: mensaje
                })
            });

            const data = await response.json();
            return res.json({ success: true, data });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/status
app.get('/api/status', async (req, res) => {
    try {
        const response = await fetch(`${GREEN_API_URL}/getStateInstance/${GREEN_API_TOKEN}`);
        const data = await response.json();
        res.json({ connected: data.stateInstance === 'authorized', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor GREEN-API iniciado en puerto ${PORT}`);
});
```

### PASO 5: Deploy en Railway (o cualquier plataforma gratis)

1. Sube el código a GitHub
2. Deploy en Railway (con los $5 gratis)
3. O deploy en Render.com (gratis pero con sleep)
4. O deploy en Oracle Cloud (100% gratis)

---

## 🚀 GUÍA RÁPIDA: Oracle Cloud (100% Gratis Para Siempre)

Ya tienes la guía completa en: `GUIA_VPS_GRATUITO.md`

**Resumen:**
1. Crear cuenta en Oracle Cloud (gratis)
2. Crear instancia Compute (gratis)
3. Instalar Node.js y PM2
4. Subir tu código de `whatsapp-server/`
5. Escanear QR
6. ¡Listo! Gratis para siempre

---

## 📊 COMPARACIÓN RÁPIDA

| Opción | Costo | Facilidad | Setup | Límites |
|--------|-------|-----------|-------|---------|
| **GREEN-API** | $0/mes | ⭐⭐⭐⭐⭐ | 15 min | Límites en tier gratis |
| **Oracle Cloud** | $0/mes | ⭐⭐⭐ | 1-2 horas | Sin límites |
| **WhatsApp Cloud API** | $0/mes | ⭐⭐⭐⭐ | 1-2 días (aprobación) | Restricciones de uso |
| **Evolution API** | $0/mes | ⭐⭐⭐ | 2-3 horas | Sin límites |

---

## 💡 MI RECOMENDACIÓN

**Para empezar RÁPIDO:**
→ **GREEN-API** (15 minutos, gratis, fácil)

**Para producción y largo plazo:**
→ **Oracle Cloud Free Tier** (100% gratis para siempre, sin límites)

---

## 🎯 ¿QUÉ QUIERES HACER?

1. **Probar GREEN-API** (15 minutos, gratis) → Te guío paso a paso
2. **Configurar Oracle Cloud** (1-2 horas, gratis para siempre) → Te guío paso a paso
3. **Aplicar a WhatsApp Cloud API** (oficial, gratis, pero requiere aprobación) → Te guío paso a paso

**¿Cuál prefieres?**

