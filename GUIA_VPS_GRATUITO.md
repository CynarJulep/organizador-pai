# Guía: Configurar VPS Gratuito para WhatsApp

## 🎯 Opciones Gratuitas Disponibles

### ✅ OPCIÓN 1: Oracle Cloud Free Tier (RECOMENDADO)

**Ventajas:**
- ✅ **100% GRATIS** para siempre (no es trial)
- ✅ 2 instancias ARM con 1 CPU y 1GB RAM cada una (o 1 instancia con 2 CPU y 2GB RAM)
- ✅ 200GB de almacenamiento
- ✅ 10TB de transferencia de datos al mes
- ✅ Sin sleep automático (siempre activo)
- ✅ Ideal para WhatsApp que necesita conexión persistente

**Desventajas:**
- ⚠️ Requiere tarjeta de crédito (pero NO cobra nada si usas solo recursos gratuitos)
- ⚠️ Proceso de registro puede tardar 1-2 días en aprobarse

**Link:** https://www.oracle.com/cloud/free/

---

### ⚠️ OPCIÓN 2: Railway.app (Tier Gratuito)

**Ventajas:**
- ✅ Fácil de usar
- ✅ Deploy rápido
- ✅ $5 créditos gratis al mes

**Desventajas:**
- ⚠️ Después de usar los $5, cobra por uso
- ⚠️ Puede tener sleep después de inactividad
- ⚠️ No es realmente "gratis para siempre"

**Link:** https://railway.app

---

### ⚠️ OPCIÓN 3: Render.com (Tier Gratuito)

**Ventajas:**
- ✅ Muy fácil de usar
- ✅ Deploy automático desde GitHub

**Desventajas:**
- ❌ **SLEEP AUTOMÁTICO** después de 15 minutos de inactividad
- ❌ **NO SIRVE para WhatsApp** (necesita conexión persistente)
- ❌ Se despierta solo cuando recibe una petición (lento)

**Link:** https://render.com

---

## 🚀 GUÍA PASO A PASO: Oracle Cloud Free Tier

### PASO 1: Crear Cuenta en Oracle Cloud (15 minutos)

1. Ve a: https://www.oracle.com/cloud/free/
2. Haz clic en **"Start for Free"**
3. Completa el formulario:
   - Nombre, email, teléfono
   - País: Argentina
   - **IMPORTANTE**: Necesitarás una tarjeta de crédito (pero NO te cobrará si solo usas recursos gratuitos)
4. Verifica tu email
5. Espera aprobación (puede tardar 1-2 días)

### PASO 2: Crear Instancia Compute (20 minutos)

Una vez aprobada tu cuenta:

1. Ve al **Dashboard** de Oracle Cloud
2. Menú → **Compute** → **Instances**
3. Haz clic en **"Create Instance"**

**Configuración:**

- **Name**: `whatsapp-pai-server`
- **Image**: **Canonical Ubuntu 22.04** (gratis)
- **Shape**: **VM.Standard.A1.Flex** (ARM - GRATIS)
  - OCPU: **1** (o 2 si quieres más potencia)
  - Memory: **1GB** (o 2GB)
- **Networking**: 
  - VCN: Crear nueva VCN (Virtual Cloud Network)
  - Subnet: Crear nueva subnet pública
  - **IMPORTANTE**: Marcar **"Assign a public IPv4 address"**
- **SSH Keys**: 
  - Generar nueva clave SSH o subir una existente
  - **GUARDA LA CLAVE PRIVADA** (la necesitarás para conectarte)

4. Haz clic en **"Create"**
5. Espera 2-3 minutos a que se cree

### PASO 3: Configurar Firewall (5 minutos)

**IMPORTANTE**: Por defecto, Oracle Cloud bloquea todos los puertos. Necesitas abrir el puerto 3000.

1. Ve a **Networking** → **Virtual Cloud Networks**
2. Selecciona tu VCN
3. Ve a **Security Lists** → **Default Security List**
4. Haz clic en **"Add Ingress Rules"**
5. Configura:
   - **Source Type**: CIDR
   - **Source CIDR**: `0.0.0.0/0` (permite desde cualquier IP)
   - **IP Protocol**: TCP
   - **Destination Port Range**: `3000`
   - **Description**: "WhatsApp Server"
6. Haz clic en **"Add Ingress Rules"**

### PASO 4: Conectarse por SSH (5 minutos)

**En Windows (PowerShell):**

```powershell
# Si tienes la clave privada guardada como "oracle-key.pem"
ssh -i "ruta\a\oracle-key.pem" ubuntu@TU_IP_PUBLICA
```

**O usar PuTTY** (más fácil en Windows):
1. Descarga PuTTY: https://www.putty.org/
2. Conecta con:
   - Host: `TU_IP_PUBLICA`
   - Port: `22`
   - Connection Type: SSH
   - Auth: Cargar tu clave privada (.ppk)

**Obtener IP pública:**
- En Oracle Cloud Dashboard → Compute → Instances
- Verás la **Public IP** de tu instancia

### PASO 5: Instalar Node.js y Dependencias (10 minutos)

Una vez conectado por SSH:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version

# Instalar PM2 (process manager)
sudo npm install -g pm2

# Instalar dependencias del sistema para whatsapp-web.js
sudo apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libxshmfence1
```

### PASO 6: Crear Servidor WhatsApp (15 minutos)

```bash
# Crear directorio
mkdir -p /opt/whatsapp-pai
cd /opt/whatsapp-pai

# Crear package.json
cat > package.json << 'EOF'
{
  "name": "whatsapp-pai-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "whatsapp-web.js": "^1.23.0",
    "qrcode-terminal": "^0.12.0"
  }
}
EOF

# Instalar dependencias
npm install
```

### PASO 7: Crear Archivo del Servidor (10 minutos)

```bash
# Crear index.js
nano index.js
```

Pegar este código:

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
            '--disable-gpu'
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

// Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Servidor WhatsApp PAI iniciado');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://TU_IP_PUBLICA:${PORT}`);
    console.log('='.repeat(60));
    console.log('\nEndpoints disponibles:');
    console.log('  GET  /api/status     - Ver estado de conexión');
    console.log('  POST /api/send       - Enviar mensaje + PDF');
    console.log('  POST /api/send-text  - Enviar solo texto\n');
});
```

Guardar y salir: `Ctrl+X`, luego `Y`, luego `Enter`

### PASO 8: Iniciar Servidor con PM2 (5 minutos)

```bash
# Iniciar servidor
pm2 start index.js --name whatsapp-pai

# Ver logs (aquí verás el QR)
pm2 logs whatsapp-pai

# Configurar para que inicie automáticamente al reiniciar el servidor
pm2 save
pm2 startup
# Copiar y ejecutar el comando que te muestra
```

### PASO 9: Escanear Código QR (2 minutos)

1. En los logs verás un código QR
2. Abre WhatsApp en tu teléfono
3. Ve a: **Configuración** → **Dispositivos vinculados** → **Vincular dispositivo**
4. Escanea el código QR
5. ¡Listo! WhatsApp quedará conectado

### PASO 10: Probar el Servidor (5 minutos)

**Desde tu PC local:**

```powershell
# Ver estado
Invoke-WebRequest -Uri "http://TU_IP_PUBLICA:3000/api/status" -UseBasicParsing

# Probar envío (reemplazar con número real)
$body = @{
    numero = "543424123456"
    mensaje = "Prueba desde VPS"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://TU_IP_PUBLICA:3000/api/send-text" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🔒 Seguridad Adicional (Opcional pero Recomendado)

### Agregar API Key para proteger endpoints

Editar `index.js` y agregar middleware:

```javascript
// Al inicio del archivo
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error('Definí API_KEY en el entorno antes de iniciar el servidor');
}

// Middleware de autenticación
function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'API Key inválida' });
    }
    next();
}

// Aplicar a endpoints (excepto /api/status)
app.post('/api/send', requireApiKey, async (req, res) => {
    // ... código existente
});
```

Configurar variable de entorno:

```bash
# En el servidor
export API_KEY="replace-with-your-own-secret"
pm2 restart whatsapp-pai
```

---

## 📝 Notas Importantes

1. **IP Pública**: La IP puede cambiar si detienes la instancia. Considera usar un dominio dinámico o IP estática (cuesta extra).

2. **Backup de Sesión**: La carpeta `whatsapp-session` contiene la sesión. Haz backup periódico:
   ```bash
   tar -czf whatsapp-session-backup.tar.gz whatsapp-session/
   ```

3. **Monitoreo**: Ver logs en tiempo real:
   ```bash
   pm2 logs whatsapp-pai --lines 50
   ```

4. **Reiniciar**: Si WhatsApp se desconecta:
   ```bash
   pm2 restart whatsapp-pai
   ```

5. **Actualizar**: Para actualizar el servidor:
   ```bash
   cd /opt/whatsapp-pai
   git pull  # si usas git
   npm install
   pm2 restart whatsapp-pai
   ```

---

## 🆘 Troubleshooting

**"WhatsApp no se conecta"**
- Verificar que el QR se escaneó correctamente
- Revisar logs: `pm2 logs whatsapp-pai`
- Eliminar sesión y volver a escanear: `rm -rf whatsapp-session/`

**"No puedo conectarme por SSH"**
- Verificar que la IP pública sea correcta
- Verificar que el Security List tenga regla SSH (puerto 22)

**"El servidor no responde"**
- Verificar que PM2 esté corriendo: `pm2 list`
- Verificar logs: `pm2 logs whatsapp-pai`
- Reiniciar: `pm2 restart whatsapp-pai`

---

## ✅ Checklist Final

- [ ] Cuenta Oracle Cloud creada y aprobada
- [ ] Instancia Compute creada
- [ ] Firewall configurado (puerto 3000 abierto)
- [ ] Node.js y PM2 instalados
- [ ] Servidor WhatsApp creado y corriendo
- [ ] Código QR escaneado
- [ ] WhatsApp conectado
- [ ] Prueba de envío exitosa
- [ ] PM2 configurado para inicio automático

---

**¡Listo!** Tu servidor WhatsApp está funcionando en un VPS 100% gratuito.

**Siguiente paso**: Configurar Supabase para que llame a este servidor cuando se apruebe un reclamo.

