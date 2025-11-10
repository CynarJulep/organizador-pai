# Solución: Error "You must specify a workspaceId to create a project"

## 🔧 Solución Rápida

Railway necesita que tengas un **Workspace** antes de crear proyectos.

### PASO 1: Crear Workspace en Railway

1. Ve a: https://railway.app/dashboard
2. En la barra lateral izquierda, verás **"Workspaces"**
3. Haz clic en **"New Workspace"** o **"Create Workspace"**
4. Configura:
   - **Name**: `PAI-Production` (o el nombre que prefieras)
   - **Plan**: Free (gratis)
5. Haz clic en **"Create"**

### PASO 2: Crear Proyecto dentro del Workspace

1. Una vez creado el workspace, haz clic en él
2. Ahora haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu GitHub (si te lo pide)
5. Selecciona el repositorio: `CynarJulep/organizador-pai`
6. Railway detectará automáticamente el proyecto

### PASO 3: Configurar el Servicio

Una vez que Railway haya detectado el proyecto:

1. Railway puede crear múltiples servicios. Necesitas configurar uno para `whatsapp-server`
2. Haz clic en el servicio que creó Railway
3. Ve a **"Settings"**
4. Configura:
   - **Root Directory**: `whatsapp-server`
   - **Start Command**: `npm start`
   - **Build Command**: (dejar vacío o `npm install`)
5. Haz clic en **"Save"**

### PASO 4: Generar URL Pública

1. En el servicio, ve a **"Settings"**
2. En la sección **"Domains"**, haz clic en **"Generate Domain"**
3. Railway generará una URL como: `whatsapp-pai-production.up.railway.app`
4. **Copia esta URL** (la necesitarás después)

### PASO 5: Ver Logs y Escanear QR

1. Ve a la pestaña **"Deployments"**
2. Haz clic en el deployment más reciente
3. Haz clic en **"View Logs"**
4. Espera a que aparezca el código QR en los logs
5. Escanea el QR con WhatsApp en tu teléfono

---

## 🎯 Resumen de Pasos

1. ✅ Crear Workspace en Railway
2. ✅ Crear Proyecto dentro del Workspace
3. ✅ Conectar con GitHub repo `CynarJulep/organizador-pai`
4. ✅ Configurar Root Directory: `whatsapp-server`
5. ✅ Generar URL pública
6. ✅ Escanear QR de WhatsApp

---

## ⚠️ Si Railway no detecta automáticamente el servicio

Si Railway no crea el servicio automáticamente:

1. En el proyecto, haz clic en **"New Service"**
2. Selecciona **"GitHub Repo"**
3. Selecciona: `CynarJulep/organizador-pai`
4. En **"Root Directory"**, escribe: `whatsapp-server`
5. Railway creará el servicio

---

¡Listo! Una vez que tengas el workspace creado, el error desaparecerá.

