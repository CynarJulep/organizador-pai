# Sistema Organizador PAI

Sistema web de gestión y automatización del **Protocolo de Acción Inmediata (PAI)** para la Municipalidad de Santa Fe.

Automatiza la derivación de reclamos urgentes a áreas municipales mediante WhatsApp, con trazabilidad completa y estadísticas detalladas.

---

## 🚨 ESTADO ACTUAL DEL PROYECTO

**Versión Local (localhost)** - Funciona en UNA sola PC

**NECESITA MIGRACIÓN A ONLINE** para soportar:
- ✅ 50 operadores simultáneos
- ✅ 10 supervisores
- ✅ Acceso desde cualquier PC de la oficina
- ✅ PDFs en la nube
- ✅ Historial y auditoría completa
- ✅ Estadísticas detalladas

---

## 📚 DOCUMENTACIÓN COMPLETA

### **PARA IA/CURSOR - LEER EN ESTE ORDEN:**

#### 1. **[ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)** ← **⭐ EMPEZAR AQUÍ ⭐**

**Lee este archivo COMPLETO antes de tocar cualquier código**

Contiene:
- ✅ Todo el propósito y contexto del sistema
- ✅ Arquitectura actual vs arquitectura objetivo (online)
- ✅ Flujo de trabajo detallado paso a paso
- ✅ Base de datos completa con triggers y funciones
- ✅ Stack tecnológico explicado
- ✅ Estructura de todos los componentes
- ✅ APIs y endpoints
- ✅ Formato de PDFs y parsing
- ✅ Integración WhatsApp
- ✅ Instrucciones para desarrolladores
- ✅ Troubleshooting común

**Este archivo tiene TODO lo que necesitas saber para trabajar en el proyecto**

#### 2. **[MIGRACION_A_ONLINE.md](MIGRACION_A_ONLINE.md)**

Guía paso a paso para migrar de local a online:
- Configurar Supabase (base de datos + storage en la nube)
- Adaptar frontend para multiusuario
- Crear Edge Functions serverless
- Deploy en Netlify (gratis)
- Configurar servidor WhatsApp en VPS ($5-10/mes)
- Costos finales y siguientes pasos

#### 3. **[MANUAL_USUARIO.md](MANUAL_USUARIO.md)**

Manual completo para operadores y supervisores:
- Cómo usar cada pantalla
- Cargar reclamos (operadores)
- Aprobar/rechazar reclamos (supervisores)
- Gestionar áreas y números de WhatsApp
- Ver estadísticas
- Solución de problemas comunes

---

## 🎯 RESUMEN DEL SISTEMA

### ¿Qué hace?

1. **Operadores** suben PDFs de solicitudes (drag & drop)
2. Sistema **extrae datos automáticamente** del PDF
3. **Supervisores** ven la lista en tiempo real y revisan
4. Al **aprobar**, se envía automáticamente por **WhatsApp** al área con PDF adjunto
5. **Todo queda registrado** para auditoría y estadísticas

### Características Principales

- ✅ Drag & drop de PDFs
- ✅ Extracción automática de datos (solicitud, subtipo, ubicación, área, etc.)
- ✅ Aprobación/rechazo con observaciones
- ✅ Envío automático por WhatsApp con PDF adjunto
- ✅ Historial completo (quién hizo qué y cuándo)
- ✅ Estadísticas por área, subtipo, día, hora, supervisor, operador
- ✅ Búsqueda avanzada de reclamos
- ✅ Gestión de áreas con números de WhatsApp

### Usuarios

- **50 Operadores**: Cargan PDFs de reclamos
- **10 Supervisores**: Aprueban/rechazan y gestionan áreas
- **1 Admin**: Acceso completo

### Lo que NECESITAS Cambiar para Producción

La versión actual es **localhost** (una sola PC). Para que funcione online:

| Actual (Local) | Necesario (Online) |
|----------------|-------------------|
| SQLite (archivo local) | Supabase PostgreSQL |
| Carpeta /uploads local | Supabase Storage (nube) |
| Servidor Express local | Netlify + Edge Functions |
| Login con contraseña | Login simple por nombre |
| Un solo usuario a la vez | 60+ usuarios simultáneos |

**Costo**: $5-10/mes (solo el VPS para WhatsApp)

---

## 🚀 INICIO RÁPIDO (Versión Local)

### Requisitos

- Node.js 20+
- Windows 10/11
- Número de WhatsApp dedicado

### Instalación

```bash
# 1. Instalar dependencias
cd "d:\Renzo\Trabajo\Proyectos\Organizador PAI"
npm install

# 2. Iniciar servidor
npm start

# 3. Abrir navegador
http://localhost:3000

# 4. Primera vez: Escanear QR de WhatsApp en la consola
```

### Usuarios de Prueba

- **Operador**: `operador1` / `operador123`
- **Supervisor**: `supervisor1` / `supervisor123`
- **Admin**: `admin` / `admin123`

---

## 🏗️ ESTRUCTURA DEL PROYECTO

```
organizador-pai/
│
├── 📄 ARQUITECTURA_COMPLETA.md    ← LEER PRIMERO (toda la info)
├── 📄 MIGRACION_A_ONLINE.md       ← Guía para pasar a online
├── 📄 MANUAL_USUARIO.md           ← Manual para usuarios finales
│
├── server/                         # Backend Node.js (versión local)
│   ├── index.js                    # Servidor Express
│   ├── config/database.js          # SQLite (cambiar a Supabase)
│   ├── routes/                     # API endpoints
│   ├── controllers/                # Lógica de negocio
│   ├── services/
│   │   ├── pdfParser.js            # Extracción de datos de PDFs
│   │   └── whatsappService.js      # Integración WhatsApp
│   └── middleware/auth.js          # Autenticación
│
├── public/                         # Frontend
│   ├── index.html                  # Login
│   ├── operador.html               # Panel operador
│   ├── supervisor.html             # Panel supervisor
│   ├── areas.html                  # Gestión de áreas
│   ├── css/styles.css              # Estilos
│   └── js/                         # JavaScript
│
├── uploads/                        # PDFs (local, cambiar a Storage)
├── database/                       # SQLite (cambiar a Supabase)
├── whatsapp-session/               # Sesión WhatsApp
│
├── package.json                    # Dependencias
├── .env                            # Configuración
└── .gitignore
```

---

## 🛠️ TECNOLOGÍAS

### Versión Actual (Local)

- Node.js + Express.js
- SQLite (better-sqlite3)
- pdf-parse (extracción de PDFs)
- whatsapp-web.js (envío WhatsApp)
- HTML/CSS/JavaScript + Dropzone.js

### Versión Objetivo (Online)

- **Frontend**: Netlify (gratis)
- **Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
- **WhatsApp**: VPS con whatsapp-web.js ($5-10/mes)

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### WhatsApp

- ⚠️ `whatsapp-web.js` **NO es oficial** (viola ToS de WhatsApp)
- Usar **número dedicado** exclusivamente para PAI
- **No usar tu número personal**
- WhatsApp puede **banear** si detecta uso excesivo
- Riesgo: WhatsApp puede cambiar y romper la funcionalidad

### Limitaciones Actuales

- ❌ Solo funciona en una PC (localhost)
- ❌ Un usuario a la vez (no multiusuario)
- ❌ PDFs almacenados localmente
- ❌ Sin historial en base de datos online
- ❌ Sin estadísticas avanzadas
- ❌ Requiere servidor siempre encendido

---

## 📊 CARACTERÍSTICAS TRONCALES (Críticas)

Estas funcionalidades son **obligatorias** y deben funcionar perfectamente:

1. **Historial completo** con auditoría
   - Quién cargó cada reclamo
   - Quién aprobó/rechazó
   - Cuándo se realizó cada acción
   - Observaciones registradas

2. **Almacenamiento de PDFs en la nube**
   - Accesibles desde cualquier PC
   - Búsqueda por número de solicitud
   - URLs permanentes

3. **Estadísticas detalladas**
   - Por área destino
   - Por subtipo de reclamo
   - Por día y hora
   - Por supervisor (performance)
   - Por operador (productividad)
   - Tiempos de aprobación

4. **Login simple**
   - Sin contraseñas complejas
   - Dropdown para seleccionar nombre
   - Recordar último usuario

5. **Actualización en tiempo real**
   - Supervisores ven nuevos reclamos al instante
   - Sin necesidad de refrescar página

---

## 🎓 PARA DESARROLLADORES / IA

### Antes de Empezar

1. **Lee [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)** de principio a fin
2. Entiende la diferencia entre versión local y online
3. Identifica qué estás desarrollando (feature, bugfix, migración)
4. Verifica el contexto del proyecto

### Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor (desarrollo local)
npm start

# Ver logs en tiempo real
# (la consola muestra logs de Express y WhatsApp)

# Reiniciar servidor
# Ctrl+C y luego npm start
```

### Cómo Agregar Features

Ver sección "Instrucciones para Desarrolladores" en [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)

### Debugging

- **Frontend**: DevTools del navegador (F12)
- **Backend**: Logs en consola donde corre `npm start`
- **WhatsApp**: Logs en consola (eventos qr, ready, disconnected)
- **Base de datos**: SQLite Browser o DB Browser for SQLite

### Testing

1. **Operador carga PDF** → Verificar que se extraigan todos los campos
2. **Supervisor aprueba** → Verificar que se envíe por WhatsApp
3. **Historial** → Verificar que se registren todas las acciones
4. **Múltiples PDFs** → Probar carga concurrente

---

## 📞 SOPORTE

Para dudas o problemas:

1. Revisar [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md) - Tiene troubleshooting
2. Revisar [MANUAL_USUARIO.md](MANUAL_USUARIO.md) - Para uso del sistema
3. Revisar logs de la consola
4. Revisar Supabase Dashboard (versión online)

---

## 🗺️ ROADMAP

### ✅ Fase 1: MVP Local (Completado)

- Sistema funcionando en localhost
- Upload de PDFs
- Parsing automático
- Aprobación/rechazo
- Envío WhatsApp
- Gestión de áreas

### 🚧 Fase 2: Migración a Online (En Progreso)

- Configurar Supabase
- Migrar frontend a Supabase Client
- Crear Edge Functions
- Deploy en Netlify
- Servidor WhatsApp en VPS
- Login simple por nombre

### 📋 Fase 3: Features Avanzadas (Futuro)

- Dashboard de estadísticas interactivo
- Exportar a Excel/PDF
- Notificaciones push
- App móvil
- OCR para PDFs escaneados
- Integraciones con otros sistemas

---

## 📄 LICENCIA

MIT

---

## 🤝 CONTRIBUIR

Este proyecto está en desarrollo activo. Para contribuir:

1. Lee **[ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)** completo
2. Identifica el área donde quieres contribuir
3. Crea un branch con nombre descriptivo
4. Hace tus cambios
5. Documenta lo que cambiaste
6. Crea pull request

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0 (Local) → 2.0 (Online en desarrollo)

---

Maintainer: [CynarJulep](https://github.com/CynarJulep)
