# Guía Completa: Configurar GREEN-API para WhatsApp

## 🎯 PASO A PASO COMPLETO

### PASO 1: Obtener Credenciales de GREEN-API (5 minutos)

1. Ve a: https://console.green-api.com
2. Inicia sesión con tu cuenta
3. Ve a **"API"** → **"Settings"** (o **"Configuración"**)
4. Copia estos dos valores:
   - **idInstance**: Tu ID de instancia (ejemplo: `1101234567`)
   - **apiTokenInstance**: Tu token de API (ejemplo: `abc123def456...`)

**⚠️ IMPORTANTE**: Guarda estos valores, los necesitarás para configurar el servidor.

---

### PASO 2: Verificar Estado de la Instancia (2 minutos)

Antes de usar la API, necesitas verificar que tu instancia esté autorizada:

1. En GREEN-API, ve a **"API"** → **"Settings"**
2. Verifica que el estado sea **"authorized"** o **"autorizado"**
3. Si no está autorizado, necesitas escanear un código QR:
   - Ve a **"API"** → **"QR Code"**
   - Escanea el código QR con WhatsApp en tu teléfono
   - Espera a que el estado cambie a **"authorized"**

---

### PASO 3: Preparar Código para Railway (10 minutos)

Ya creé el código adaptado para GREEN-API en la carpeta `whatsapp-server-greenapi/`.

**Estructura:**
```
whatsapp-server-greenapi/
├── index.js          (servidor con GREEN-API)
├── package.json      (dependencias)
├── .gitignore
└── README.md
```

---

### PASO 4: Subir Código a GitHub (5 minutos)

```bash
# Agregar la nueva carpeta
git add whatsapp-server-greenapi/
git commit -m "Agregar servidor WhatsApp con GREEN-API"
git push origin main
```

---

### PASO 5: Deploy en Railway (15 minutos)

#### 5.1 Crear Nuevo Servicio en Railway

1. Ve a tu proyecto en Railway
2. Haz clic en **"New Service"**
3. Selecciona **"GitHub Repo"**
4. Selecciona: `CynarJulep/organizador-pai`
5. Railway detectará el repositorio

#### 5.2 Configurar el Servicio

1. Haz clic en el servicio que creó Railway
2. Ve a **"Settings"**
3. Configura:
   - **Root Directory**: `whatsapp-server-greenapi`
   - **Start Command**: `npm start`
   - **Build Command**: (dejar vacío o `npm install`)

#### 5.3 Configurar Variables de Entorno

1. En Settings, ve a **"Variables"**
2. Haz clic en **"New Variable"**
3. Agrega estas dos variables:

   **Variable 1:**
   - **Name**: `GREEN_API_ID`
   - **Value**: `tu_id_instance` (el que copiaste en PASO 1)

   **Variable 2:**
   - **Name**: `GREEN_API_TOKEN`
   - **Value**: `tu_api_token` (el que copiaste en PASO 1)

4. Haz clic en **"Save"** o **"Add"**

#### 5.4 Generar URL Pública

1. En Settings, ve a **"Domains"**
2. Haz clic en **"Generate Domain"**
3. Railway generará una URL como: `whatsapp-pai-production.up.railway.app`
4. **Copia esta URL** (la necesitarás después)

#### 5.5 Verificar Deploy

1. Ve a la pestaña **"Deployments"**
2. Espera a que el deployment termine (2-3 minutos)
3. Haz clic en **"View Logs"** para ver si hay errores
4. Deberías ver: `🚀 Servidor WhatsApp PAI con GREEN-API iniciado`

---

### PASO 6: Probar el Servidor (5 minutos)

#### 6.1 Verificar Estado

Abre en tu navegador:
```
https://TU_URL_RAILWAY.railway.app/api/status
```

Deberías ver:
```json
{
  "connected": true,
  "state": "authorized",
  "timestamp": "2025-01-11T..."
}
```

Si `connected` es `false`, necesitas autorizar la instancia en GREEN-API (PASO 2).

#### 6.2 Probar Envío de Mensaje

**Desde PowerShell:**

```powershell
# Reemplazar con tu URL de Railway
$url = "https://TU_URL_RAILWAY.railway.app/api/send-text"

$body = @{
    numero = "543424123456"  # Reemplazar con número real
    mensaje = "Prueba desde GREEN-API"
} | ConvertTo-Json

Invoke-WebRequest -Uri $url `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**O desde el navegador (usando una herramienta como Postman o curl):**

```bash
curl -X POST https://TU_URL_RAILWAY.railway.app/api/send-text \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "543424123456",
    "mensaje": "Prueba desde GREEN-API"
  }'
```

---

### PASO 7: Integrar con Supabase (Cuando lo configures)

Cuando configures Supabase, necesitarás que la Edge Function `send-whatsapp` llame a tu servidor Railway.

**En la Edge Function de Supabase:**

```typescript
// send-whatsapp.ts
const RAILWAY_URL = 'https://TU_URL_RAILWAY.railway.app';

const response = await fetch(`${RAILWAY_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        numero: reclamo.areas.telefono_whatsapp,
        mensaje: formatearMensajePAI(reclamo),
        pdf_url: reclamo.pdf_url
    })
});
```

---

## ✅ Checklist Final

- [ ] Credenciales de GREEN-API obtenidas (idInstance y apiTokenInstance)
- [ ] Instancia autorizada en GREEN-API (estado: "authorized")
- [ ] Código subido a GitHub
- [ ] Servicio creado en Railway
- [ ] Variables de entorno configuradas (GREEN_API_ID y GREEN_API_TOKEN)
- [ ] URL pública generada
- [ ] Deploy exitoso
- [ ] Prueba de envío exitosa

---

## 🆘 Troubleshooting

### "Error: GREEN_API_ID y GREEN_API_TOKEN deben estar configurados"

**Solución:**
- Verifica que las variables de entorno estén configuradas en Railway
- Verifica que los nombres sean exactamente: `GREEN_API_ID` y `GREEN_API_TOKEN`

### "Error al obtener estado: 401 Unauthorized"

**Solución:**
- Verifica que las credenciales sean correctas
- Verifica que la instancia esté autorizada en GREEN-API

### "Error al enviar: 400 Bad Request"

**Solución:**
- Verifica que el número tenga el formato correcto: `543424123456` (sin +, sin espacios)
- Verifica que el mensaje no esté vacío

### "connected: false"

**Solución:**
- Ve a GREEN-API → API → Settings
- Verifica que el estado sea "authorized"
- Si no está autorizado, escanea el código QR

---

## 🎯 Siguiente Paso

Una vez que tengas el servidor funcionando con GREEN-API:

1. **Guarda la URL de Railway** (la necesitarás para Supabase)
2. **Continúa con Supabase** (PASO 1 de MIGRACION_A_ONLINE.md)
3. **Cuando crees la Edge Function send-whatsapp**, úsala para llamar a tu servidor Railway

---

**¡Listo!** Tu servidor WhatsApp está funcionando con GREEN-API de forma gratuita.

**URL de tu servidor**: `https://TU_URL_RAILWAY.railway.app`

