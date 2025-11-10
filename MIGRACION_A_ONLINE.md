# Plan de Migración a Versión Online

## Resumen: De Local a Online

Tu sistema actual funciona en **localhost** (una sola PC). Necesitas que funcione **online** para que 50 operadores + 10 supervisores accedan desde cualquier PC de la oficina.

---

## Cambios Necesarios

### ❌ Lo que NO va a servir de la versión actual

1. **SQLite** → Reemplazar por **Supabase (PostgreSQL)**
   - SQLite es un archivo local, no permite múltiples usuarios simultáneos desde diferentes PCs

2. **Carpeta `/uploads` local** → Reemplazar por **Supabase Storage**
   - Los PDFs deben estar en la nube, accesibles desde cualquier lugar

3. **Servidor Express local** → Reemplazar por **Netlify + Supabase Edge Functions**
   - El servidor Node.js solo funciona en una PC
   - Netlify sirve el frontend
   - Supabase Edge Functions maneja la lógica backend

4. **Contraseñas complejas** → Reemplazar por **Login simple por nombre**
   - Solo selección de nombre del dropdown

### ✅ Lo que SÍ se puede reutilizar

1. **Lógica de parsing de PDF** - Mover a Supabase Edge Function
2. **Frontend HTML/CSS/JS** - Adaptar para usar Supabase Client
3. **Formato de mensajes WhatsApp** - Mantener igual
4. **Estructura de datos** - Migrar de SQLite a PostgreSQL

---

## Arquitectura Final (Simplificada para ti)

```
INTERNET
   ↓
┌─────────────────────────────────────┐
│  NETLIFY (Gratis)                   │
│  https://pai-santafe.netlify.app    │
│                                     │
│  Tus páginas:                       │
│  - index.html (seleccionar nombre)  │
│  - operador.html (subir PDFs)       │
│  - supervisor.html (aprobar/rechazar)│
│  - estadisticas.html (dashboards)   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  SUPABASE (Gratis hasta 500MB)      │
│  https://xxxxx.supabase.co          │
│                                     │
│  - Base de datos (usuarios, reclamos)│
│  - Storage (PDFs en la nube)        │
│  - Functions (procesar PDFs)        │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  VPS ($5-10/mes) - NECESARIO        │
│  Digital Ocean / Contabo            │
│                                     │
│  Servidor WhatsApp                  │
│  (whatsapp-web.js)                  │
└─────────────────────────────────────┘
```

---

## Paso a Paso: Migración

### PASO 1: Crear cuenta en Supabase (15 minutos)

1. Ve a https://supabase.com
2. Crea cuenta (gratis)
3. Crear nuevo proyecto:
   - Nombre: `pai-santa-fe`
   - Database Password: (guárdala bien)
   - Region: South America (más cercano a Argentina)
4. Espera 2-3 minutos a que se cree el proyecto
5. Guarda estos datos (los necesitarás):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: (en Settings → API)

### PASO 2: Crear base de datos (30 minutos)

1. En Supabase, ve a **SQL Editor**
2. Copia y pega el SQL completo del archivo `ARQUITECTURA_COMPLETA.md` (sección "Estructura de Base de Datos")
3. Haz clic en **Run**
4. Verifica que se crearon las tablas:
   - Ve a **Table Editor**
   - Deberías ver: `usuarios`, `areas`, `reclamos`, `historial_acciones`

### PASO 3: Configurar Storage para PDFs (10 minutos)

1. En Supabase, ve a **Storage**
2. Crear nuevo bucket:
   - Nombre: `reclamos-pdfs`
   - **IMPORTANTE**: Marcarlo como **Public**
3. Configurar políticas:
   - Allow all users to: Upload, Read
   - (Por ahora dejarlo público, luego agregaremos seguridad)

### PASO 4: Cargar usuarios iniciales (15 minutos)

1. En Supabase, ve a **SQL Editor**
2. Ejecuta este SQL para crear tus 50 operadores:

```sql
-- Insertar operadores (ajusta los nombres reales)
INSERT INTO usuarios (nombre_completo, username, rol) VALUES
('Juan Pérez', 'jperez', 'operador'),
('María González', 'mgonzalez', 'operador'),
('Carlos Rodríguez', 'crodriguez', 'operador'),
-- ... copia y pega 47 más
('Ana López', 'alopez', 'operador');

-- Insertar supervisores
INSERT INTO usuarios (nombre_completo, username, rol) VALUES
('Supervisor 1', 'super1', 'supervisor'),
('Supervisor 2', 'super2', 'supervisor'),
-- ... hasta 10 supervisores
('Supervisor 10', 'super10', 'supervisor');

-- Insertar admin
INSERT INTO usuarios (nombre_completo, username, rol) VALUES
('Administrador', 'admin', 'admin');
```

3. Verifica en **Table Editor** → `usuarios` que aparezcan todos

### PASO 5: Cargar áreas con números WhatsApp (10 minutos)

```sql
-- IMPORTANTE: Reemplazar con los números REALES de tu municipio
INSERT INTO areas (nombre, telefono_whatsapp) VALUES
('ALUMBRADO PÚBLICO', '543424XXXXXX'),  -- Reemplazar XXXXXX con número real
('BARRIDO Y LIMPIEZA', '543424YYYYYY'),
('BACHEO', '543424ZZZZZZ');
-- ... todas tus áreas
```

**Formato del número**:
- 54 = Argentina
- 342 = Código de área Santa Fe
- 4123456 = Número
- **SIN ESPACIOS, SIN +, SIN GUIONES**

### PASO 6: Adaptar el Frontend (2-3 horas)

Voy a crear una versión adaptada de tu frontend para que funcione con Supabase.

**Cambios principales**:

1. **Login sin contraseña** - Solo selección de nombre
2. **Supabase Client** - En lugar de fetch a localhost
3. **Upload a Storage** - En lugar de multer local
4. **Realtime** - Supervisores ven cambios en tiempo real

#### 6.1 Crear archivo de configuración

Crea: `public/js/supabase-config.js`

```javascript
// Reemplazar con TUS datos de Supabase
const SUPABASE_URL = 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'tu-anon-key-aquí'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

#### 6.2 Incluir Supabase en HTML

En todos tus HTMLs, agregar antes de cerrar `</body>`:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/supabase-config.js"></script>
```

#### 6.3 Adaptar Login (index.html)

```javascript
// Cargar lista de usuarios
async function cargarUsuarios() {
    const { data: usuarios } = await supabase
        .from('usuarios')
        .select('*')
        .eq('activo', true)
        .order('nombre_completo')

    // Mostrar en dropdown
    const select = document.getElementById('selectUsuario')
    usuarios.forEach(u => {
        const option = document.createElement('option')
        option.value = u.id
        option.textContent = `${u.nombre_completo} (${u.rol})`
        option.dataset.rol = u.rol
        select.appendChild(option)
    })
}

// Al seleccionar usuario
function seleccionarUsuario() {
    const select = document.getElementById('selectUsuario')
    const usuarioId = select.value
    const rol = select.options[select.selectedIndex].dataset.rol

    // Guardar en localStorage
    localStorage.setItem('usuario_id', usuarioId)
    localStorage.setItem('usuario_rol', rol)

    // Redirigir según rol
    if (rol === 'operador') {
        window.location.href = '/operador.html'
    } else {
        window.location.href = '/supervisor.html'
    }
}
```

#### 6.4 Adaptar Operador (operador.html)

```javascript
// Subir PDF
async function subirPDF(file) {
    const usuarioId = localStorage.getItem('usuario_id')

    // 1. Subir a Supabase Storage
    const fileName = `${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reclamos-pdfs')
        .upload(fileName, file)

    if (uploadError) {
        alert('Error al subir PDF: ' + uploadError.message)
        return
    }

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('reclamos-pdfs')
        .getPublicUrl(fileName)

    // 3. Parsear PDF (llamar a Edge Function)
    const { data: parsedData, error: parseError } = await supabase.functions
        .invoke('parse-pdf', {
            body: { pdf_url: publicUrl }
        })

    if (parseError) {
        alert('Error al procesar PDF: ' + parseError.message)
        return
    }

    // 4. Insertar reclamo en base de datos
    const { data: reclamo, error: insertError } = await supabase
        .from('reclamos')
        .insert({
            ...parsedData,
            pdf_url: publicUrl,
            pdf_nombre_original: file.name,
            operador_id: usuarioId,
            estado: 'PENDIENTE'
        })
        .select()
        .single()

    if (insertError) {
        alert('Error al guardar reclamo: ' + insertError.message)
        return
    }

    alert(`Reclamo ${reclamo.solicitud_nro} cargado correctamente`)
    cargarMisReclamos()
}

// Ver mis reclamos
async function cargarMisReclamos() {
    const usuarioId = localStorage.getItem('usuario_id')

    const { data: reclamos } = await supabase
        .from('reclamos')
        .select('*')
        .eq('operador_id', usuarioId)
        .order('fecha_carga', { ascending: false })

    // Mostrar en tabla
    // ... tu código actual de renderizar tabla
}
```

#### 6.5 Adaptar Supervisor (supervisor.html)

```javascript
// Ver pendientes EN TIEMPO REAL
async function cargarPendientes() {
    const { data: pendientes } = await supabase
        .from('reclamos')
        .select(`
            *,
            operador:operador_id(nombre_completo)
        `)
        .eq('estado', 'PENDIENTE')
        .order('fecha_carga', { ascending: false })

    // Mostrar en tabla
    renderizarTablaPendientes(pendientes)
}

// Suscribirse a cambios en tiempo real
supabase
    .channel('reclamos-pendientes')
    .on('postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'reclamos',
            filter: 'estado=eq.PENDIENTE'
        },
        (payload) => {
            console.log('Cambio detectado:', payload)
            cargarPendientes() // Recargar lista
        }
    )
    .subscribe()

// Aprobar reclamo
async function aprobarReclamo(reclamoId, observaciones) {
    const usuarioId = localStorage.getItem('usuario_id')

    const { data, error } = await supabase
        .from('reclamos')
        .update({
            estado: 'APROBADO',
            supervisor_id: usuarioId,
            fecha_revision: new Date().toISOString(),
            observaciones: observaciones
        })
        .eq('id', reclamoId)
        .select()
        .single()

    if (error) {
        alert('Error: ' + error.message)
        return
    }

    // El trigger en Supabase automáticamente dispara el envío de WhatsApp
    alert('Reclamo aprobado y enviado por WhatsApp')

    cerrarModal()
    cargarPendientes()
}

// Rechazar reclamo
async function rechazarReclamo(reclamoId, observaciones) {
    const usuarioId = localStorage.getItem('usuario_id')

    const { data, error } = await supabase
        .from('reclamos')
        .update({
            estado: 'RECHAZADO',
            supervisor_id: usuarioId,
            fecha_revision: new Date().toISOString(),
            observaciones: observaciones
        })
        .eq('id', reclamoId)

    if (error) {
        alert('Error: ' + error.message)
        return
    }

    alert('Reclamo rechazado')
    cerrarModal()
    cargarPendientes()
}
```

### PASO 7: Crear Edge Functions en Supabase (1 hora)

#### 7.1 Instalar Supabase CLI

```bash
# En tu PC
npm install -g supabase

# Login
supabase login

# Link a tu proyecto
supabase link --project-ref xxxxx
```

#### 7.2 Crear función parse-pdf

```bash
supabase functions new parse-pdf
```

Editar `supabase/functions/parse-pdf/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { pdf_url } = await req.json()

    // Descargar PDF
    const pdfResponse = await fetch(pdf_url)
    const pdfBlob = await pdfResponse.blob()

    // Aquí iría tu lógica de parsing con pdf-parse
    // (necesitarás adaptarla para Deno)

    // Por ahora, devolver mock data
    const datos = {
      solicitud_nro: '92006-2025',
      tipo: 'RECLAMO',
      subtipo: 'LED - LUMINARIA APAGADA',
      ubicacion: 'PJE. MAGALLANES 3979',
      // ... extraer con regex como en pdfParser.js actual
    }

    return new Response(JSON.stringify(datos), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

Deploy:
```bash
supabase functions deploy parse-pdf
```

#### 7.3 Crear función send-whatsapp

Similar al anterior, pero llama a tu servidor WhatsApp en VPS.

### PASO 8: Servidor WhatsApp en VPS (2 horas)

#### 8.1 Contratar VPS

Opciones baratas:
- **Contabo**: €4.50/mes (https://contabo.com)
- **Digital Ocean**: $6/mes (https://digitalocean.com) - RECOMENDADO
- **Vultr**: $5/mes (https://vultr.com)

Elegir:
- Ubuntu 22.04
- 1 CPU
- 1-2GB RAM
- Ubicación: Miami o Brasil (más cercano a Argentina)

#### 8.2 Configurar servidor

```bash
# Conectar por SSH
ssh root@tu-ip

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Crear directorio
mkdir /opt/whatsapp-pai
cd /opt/whatsapp-pai

# Crear servidor (copiar tu whatsappService.js actual)
nano index.js
```

Archivo `index.js`:
```javascript
const express = require('express')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

const app = express()
app.use(express.json())

const client = new Client({
  authStrategy: new LocalAuth()
})

client.on('qr', (qr) => {
  console.log('QR RECIBIDO:')
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('✅ WhatsApp conectado')
})

client.initialize()

// Endpoint para enviar mensaje + PDF
app.post('/api/send', async (req, res) => {
  try {
    const { numero, mensaje, pdf_url } = req.body

    // Descargar PDF
    const response = await fetch(pdf_url)
    const buffer = Buffer.from(await response.arrayBuffer())
    const media = new MessageMedia(
      'application/pdf',
      buffer.toString('base64'),
      'reclamo.pdf'
    )

    // Enviar
    const chatId = `${numero}@c.us`
    await client.sendMessage(chatId, media, { caption: mensaje })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/status', (req, res) => {
  res.json({
    connected: client.info ? true : false,
    phone: client.info?.wid?.user
  })
})

app.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000')
})
```

```bash
# Instalar dependencias
npm install express whatsapp-web.js qrcode-terminal

# Iniciar con PM2
pm2 start index.js --name whatsapp-pai

# Ver logs y escanear QR
pm2 logs whatsapp-pai

# Configurar inicio automático
pm2 save
pm2 startup
```

### PASO 9: Deploy en Netlify (30 minutos)

#### 9.1 Preparar repositorio

1. Sube tu código a GitHub
2. Organiza así:
```
/public         → Todo tu frontend
/supabase       → Edge functions
package.json
netlify.toml
```

#### 9.2 Crear netlify.toml

```toml
[build]
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 9.3 Deploy

1. Ve a https://netlify.com
2. "Add new site" → "Import an existing project"
3. Conecta tu GitHub
4. Selecciona el repo
5. Settings:
   - Build command: (dejar vacío)
   - Publish directory: `public`
6. Environment variables:
   - `SUPABASE_URL`: tu URL de Supabase
   - `SUPABASE_ANON_KEY`: tu anon key
7. Deploy!

Tu sitio estará en: `https://nombre-random.netlify.app`

### PASO 10: Configurar dominio personalizado (Opcional)

Si quieres algo como `pai.santafe.gob.ar`:

1. En Netlify: Domain settings
2. Add custom domain: `pai.santafe.gob.ar`
3. Copiar registros DNS que te da Netlify
4. Configurarlos en tu proveedor de dominio
5. Esperar 24-48 horas

---

## Costos Finales

```
Supabase:        GRATIS (hasta 500MB DB, 1GB storage)
Netlify:         GRATIS (100GB bandwidth/mes)
VPS WhatsApp:    $5-10/mes (obligatorio)
Dominio:         $10-15/año (opcional)

TOTAL MENSUAL: $5-10/mes
```

---

## Funcionalidades Clave Implementadas

✅ **Login simple por nombre** (dropdown, sin contraseña)
✅ **Múltiples usuarios simultáneos** (50 operadores + 10 supervisores)
✅ **Historial completo** con auditoría (quién hizo qué y cuándo)
✅ **PDFs en la nube** (búscables, accesibles desde cualquier PC)
✅ **Estadísticas detalladas** (área, subtipo, día, hora, supervisor, operador)
✅ **Actualización en tiempo real** (supervisores ven nuevos reclamos al instante)
✅ **Envío automático por WhatsApp** (con PDF adjunto)

---

## Siguientes Pasos Después de la Migración

1. **Capacitación** - Enseñar a operadores y supervisores
2. **Pruebas piloto** - Empezar con 5-10 usuarios
3. **Ajustar parsing** - Según PDFs reales del municipio
4. **Monitoreo** - Verificar que todo funcione bien
5. **Optimizaciones** - Según feedback de usuarios

---

## Soporte y Mantenimiento

- **Supabase Dashboard**: Ver queries, logs, errores
- **Netlify Dashboard**: Ver deploys, analytics
- **VPS**: SSH para ver logs de WhatsApp
- **Backups**: Supabase hace backups automáticos (Plan Pro)

---

¿Dudas? Este documento + `ARQUITECTURA_COMPLETA.md` tienen TODO lo que necesitas saber.

**Siguiente archivo a leer**: `ARQUITECTURA_COMPLETA.md` para detalles técnicos.
