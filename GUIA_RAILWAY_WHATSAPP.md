# Guía: Configurar WhatsApp en Railway (Gratis)

## 🎯 ¿Por qué Railway?

- ✅ **Muy fácil de usar** (sin configurar servidor manualmente)
- ✅ **$5 créditos gratis** al mes (suficiente para WhatsApp)
- ✅ **Deploy automático** desde GitHub
- ✅ **Sin necesidad de SSH** ni configuraciones complejas
- ✅ **Dashboard visual** para ver logs y estado

**Desventajas:**
- ⚠️ Después de $5/mes, cobra por uso (pero es muy barato: ~$0.01/hora)
- ⚠️ Puede tener sleep después de inactividad (pero menos que Render)

---

## 📋 PASO A PASO COMPLETO

### PASO 1: Crear Cuenta en Railway (5 minutos)

1. Ve a: https://railway.app
2. Haz clic en **"Start a New Project"**
3. Selecciona **"Login with GitHub"** (necesitas cuenta de GitHub)
4. Autoriza Railway para acceder a tu GitHub
5. ¡Listo! Ya tienes cuenta

**Si no tienes GitHub:**
- Crea cuenta en: https://github.com
- Es gratis y necesario para Railway

---

### PASO 2: Preparar Código del Servidor WhatsApp (10 minutos)

Vamos a crear un servidor simple que Railway pueda deployar automáticamente.

#### 2.1 Crear estructura de carpetas

En tu proyecto, crea una carpeta para el servidor WhatsApp:

```
Organizador PAI/
├── whatsapp-server/          ← NUEVA CARPETA
│   ├── index.js
│   ├── package.json
│   └── .gitignore
├── server/
├── public/
└── ...
```

#### 2.2 Crear package.json para el servidor WhatsApp

Crea: `whatsapp-server/package.json`

```json
{
  "name": "whatsapp-pai-server",
  "version": "1.0.0",
  "description": "Servidor WhatsApp para PAI",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "whatsapp-web.js": "^1.23.0",
    "qrcode-terminal": "^0.12.0"
  },
  "engines": {
    "node": "20.x"
  }
}
```

#### 2.3 Crear index.js del servidor

Crea: `whatsapp-server/index.js`

```javascript
const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// Configurar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer'
        ]
    }
});

// Eventos de WhatsApp
client.on('qr', (qr) => {
    console.log('\n=== CÓDIGO QR PARA WHATSAPP ===');
    qrcode.generate(qr, { small: true });
    console.log('\nEscanea este código QR con WhatsApp en tu teléfono');
    console.log('Ve a: WhatsApp → Configuración → Dispositivos vinculados → Vincular dispositivo\n');
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado correctamente');
    console.log('📱 Número: ' + client.info.wid.user);
});

client.on('authenticated', () => {
    console.log('✅ Autenticación exitosa');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
    console.log('Reiniciando en 5 segundos...');
    setTimeout(() => {
        client.initialize();
    }, 5000);
});

// Inicializar WhatsApp
client.initialize();

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/status - Ver estado de conexión
app.get('/api/status', (req, res) => {
    res.json({
        connected: client.info ? true : false,
        phone: client.info?.wid?.user || null,
        timestamp: new Date().toISOString()
    });
});

// POST /api/send - Enviar mensaje + PDF
app.post('/api/send', async (req, res) => {
    try {
        const { numero, mensaje, pdf_url } = req.body;

        // Validar que WhatsApp esté conectado
        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado',
                connected: false
            });
        }

        // Validar parámetros
        if (!numero || !mensaje) {
            return res.status(400).json({
                error: 'Faltan parámetros: numero y mensaje son requeridos'
            });
        }

        // Formatear número (debe ser: 543424123456@c.us)
        let chatId = numero;
        if (!chatId.includes('@c.us')) {
            chatId = `${numero}@c.us`;
        }

        // Si hay PDF, descargarlo y enviarlo
        if (pdf_url) {
            console.log(`📤 Enviando PDF a ${chatId}...`);
            
            // Descargar PDF
            const response = await fetch(pdf_url);
            if (!response.ok) {
                throw new Error(`Error al descargar PDF: ${response.statusText}`);
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const media = new MessageMedia(
                'application/pdf',
                buffer.toString('base64'),
                'reclamo.pdf'
            );

            // Enviar mensaje con PDF
            await client.sendMessage(chatId, media, { caption: mensaje });
        } else {
            // Solo enviar mensaje de texto
            await client.sendMessage(chatId, mensaje);
        }

        console.log(`✅ Mensaje enviado a ${chatId}`);

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            chatId: chatId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({
            error: error.message,
            success: false
        });
    }
});

// POST /api/send-text - Solo texto (sin PDF)
app.post('/api/send-text', async (req, res) => {
    try {
        const { numero, mensaje } = req.body;

        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado'
            });
        }

        if (!numero || !mensaje) {
            return res.status(400).json({
                error: 'numero y mensaje son requeridos'
            });
        }

        const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
        await client.sendMessage(chatId, mensaje);

        res.json({ success: true, chatId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check (para Railway)
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp PAI Server',
        status: 'running',
        whatsapp: client.info ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Servidor WhatsApp PAI iniciado');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: https://tu-proyecto.railway.app`);
    console.log('='.repeat(60));
    console.log('\nEndpoints disponibles:');
    console.log('  GET  /              - Health check');
    console.log('  GET  /api/status    - Ver estado de conexión');
    console.log('  POST /api/send      - Enviar mensaje + PDF');
    console.log('  POST /api/send-text - Enviar solo texto\n');
});
```

#### 2.4 Crear .gitignore

Crea: `whatsapp-server/.gitignore`

```
node_modules/
whatsapp-session/
.env
*.log
```

---

### PASO 3: Subir Código a GitHub (10 minutos)

#### 3.1 Inicializar Git (si no lo has hecho)

```bash
# En la raíz del proyecto
cd organizador-pai
git init
```

#### 3.2 Crear repositorio en GitHub

1. Ve a: https://github.com
2. Haz clic en **"New repository"**
3. Nombre: `organizador-pai` (o el que prefieras)
4. **NO marques** "Initialize with README"
5. Haz clic en **"Create repository"**

#### 3.3 Subir código

```bash
# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: Sistema PAI con servidor WhatsApp"

# Agregar remoto (reemplazar TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/organizador-pai.git

# Subir código
git branch -M main
git push -u origin main
```

**Si te pide autenticación:**
- GitHub ya no acepta contraseñas, necesitas un **Personal Access Token**
- Ve a: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Genera nuevo token con permisos `repo`
- Úsalo como contraseña al hacer push

---

### PASO 4: Deploy en Railway (15 minutos)

#### 4.1 Crear nuevo proyecto en Railway

1. Ve a: https://railway.app/dashboard
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Selecciona tu repositorio `organizador-pai`
5. Railway detectará automáticamente el proyecto

#### 4.2 Configurar el servicio

Railway puede detectar múltiples servicios. Necesitas configurarlo para que use la carpeta `whatsapp-server`:

1. En el dashboard de Railway, haz clic en tu proyecto
2. Haz clic en **"Settings"**
3. En **"Root Directory"**, escribe: `whatsapp-server`
4. En **"Start Command"**, escribe: `npm start`
5. Haz clic en **"Save"**

#### 4.3 Configurar variables de entorno (opcional)

Si quieres agregar una API Key para seguridad:

1. En Railway, ve a tu servicio
2. Haz clic en **"Variables"**
3. Agrega:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Railway lo asigna automáticamente, pero puedes especificarlo)

#### 4.4 Deploy

1. Railway empezará a deployar automáticamente
2. Ve a la pestaña **"Deployments"** para ver el progreso
3. Espera 2-3 minutos a que termine

#### 4.5 Obtener URL pública

1. En Railway, ve a tu servicio
2. Haz clic en **"Settings"**
3. En **"Domains"**, haz clic en **"Generate Domain"**
4. Copia la URL (algo como: `whatsapp-pai-production.up.railway.app`)

---

### PASO 5: Ver Logs y Escanear QR (5 minutos)

#### 5.1 Ver logs en Railway

1. En Railway, ve a tu servicio
2. Haz clic en la pestaña **"Deployments"**
3. Haz clic en el deployment más reciente
4. Haz clic en **"View Logs"**

#### 5.2 Escanear código QR

1. En los logs verás un código QR impreso
2. Abre WhatsApp en tu teléfono
3. Ve a: **Configuración** → **Dispositivos vinculados** → **Vincular dispositivo**
4. Escanea el código QR
5. ¡Listo! WhatsApp quedará conectado

**Nota**: Si no ves el QR en los logs, puedes usar un servicio externo para generar el QR desde el texto, o esperar a que Railway muestre los logs completos.

---

### PASO 6: Probar el Servidor (5 minutos)

#### 6.1 Verificar estado

Abre en tu navegador:
```
https://TU_URL_RAILWAY.railway.app/api/status
```

Deberías ver:
```json
{
  "connected": true,
  "phone": "543424123456",
  "timestamp": "2025-01-11T..."
}
```

#### 6.2 Probar envío (desde PowerShell)

```powershell
# Reemplazar con tu URL de Railway
$url = "https://TU_URL_RAILWAY.railway.app/api/send-text"

$body = @{
    numero = "543424123456"  # Reemplazar con número real
    mensaje = "Prueba desde Railway"
} | ConvertTo-Json

Invoke-WebRequest -Uri $url `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🔒 Seguridad (Opcional pero Recomendado)

### Agregar API Key

Editar `whatsapp-server/index.js` y agregar al inicio:

```javascript
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error('Definí API_KEY en el entorno antes de iniciar el servidor');
}

// Middleware de autenticación
function requireApiKey(req, res, next) {
    // Permitir /api/status sin autenticación
    if (req.path === '/api/status' || req.path === '/') {
        return next();
    }
    
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'API Key inválida' });
    }
    next();
}

// Aplicar middleware
app.use('/api/send', requireApiKey);
app.use('/api/send-text', requireApiKey);
```

Luego en Railway:
1. Ve a **Variables**
2. Agrega: `API_KEY` = una clave propia, generada por vos (no la dejes en el repositorio)
3. Railway reiniciará automáticamente

---

## 📊 Monitoreo y Costos

### Ver uso de créditos

1. En Railway, ve a tu cuenta
2. Haz clic en **"Usage"**
3. Verás cuántos créditos has usado

**Costos aproximados:**
- WhatsApp corriendo 24/7: ~$0.01/hora = ~$7.20/mes
- Con $5 créditos gratis: Solo pagas ~$2.20/mes extra
- **Total: ~$2-3/mes** (muy barato)

### Ver logs en tiempo real

1. En Railway, ve a tu servicio
2. Haz clic en **"Deployments"**
3. Haz clic en el deployment activo
4. Haz clic en **"View Logs"**

---

## 🆘 Troubleshooting

### "WhatsApp no se conecta"

1. Ver logs en Railway
2. Verificar que el QR se escaneó correctamente
3. Si hay error, eliminar sesión:
   - En Railway, ve a **Variables**
   - Agrega variable: `CLEAR_SESSION` = `true`
   - Railway reiniciará y mostrará nuevo QR

### "El servidor no responde"

1. Verificar que el deployment esté activo
2. Ver logs para errores
3. Verificar que la URL sea correcta

### "Error al enviar mensaje"

1. Verificar que WhatsApp esté conectado: `/api/status`
2. Verificar formato del número (debe ser: `543424123456`)
3. Ver logs para ver el error específico

---

## ✅ Checklist Final

- [ ] Cuenta Railway creada
- [ ] Código subido a GitHub
- [ ] Proyecto deployado en Railway
- [ ] URL pública obtenida
- [ ] Código QR escaneado
- [ ] WhatsApp conectado
- [ ] Prueba de envío exitosa
- [ ] API Key configurada (opcional)

---

## 🎯 Siguiente Paso

Una vez que tengas el servidor WhatsApp funcionando en Railway:

1. **Guarda la URL** de Railway (la necesitarás para Supabase)
2. **Prueba que funcione** enviando un mensaje de prueba
3. **Continúa con Supabase** (PASO 1 de MIGRACION_A_ONLINE.md)

---

**¡Listo!** Tu servidor WhatsApp está funcionando en Railway de forma gratuita (con $5 créditos al mes).

**URL de tu servidor**: `https://TU_URL_RAILWAY.railway.app`

**Guárdala**, la necesitarás cuando configures Supabase para que llame a este servidor cuando se apruebe un reclamo.

