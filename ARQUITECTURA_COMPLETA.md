# Arquitectura Completa del Sistema PAI
## Documentación para IA/Cursor - Toda la información necesaria

---

## 📋 ÍNDICE
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Propósito del Sistema](#propósito-del-sistema)
3. [Arquitectura Actual vs Arquitectura Objetivo](#arquitectura-actual-vs-arquitectura-objetivo)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Stack Tecnológico](#stack-tecnológico)
6. [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
7. [Componentes del Sistema](#componentes-del-sistema)
8. [APIs y Endpoints](#apis-y-endpoints)
9. [Formato de PDFs](#formato-de-pdfs)
10. [Integración WhatsApp](#integración-whatsapp)
11. [Roadmap de Migración](#roadmap-de-migración)
12. [Instrucciones para Desarrolladores](#instrucciones-para-desarrolladores)

---

## 🎯 RESUMEN EJECUTIVO

**Sistema PAI (Protocolo de Acción Inmediata)**

Sistema web para automatizar la derivación de reclamos municipales urgentes mediante WhatsApp.

### Contexto de Uso
- **Organización**: Municipalidad de Santa Fe, Argentina
- **Usuarios**: 50 operadores + 10 supervisores
- **Volumen**: ~100-200 reclamos diarios (estimado)
- **Horario**: 24/7 (potencialmente)

### Problema que Resuelve
Actualmente los operadores envían manualmente PDFs de reclamos por WhatsApp personal al número PAI, y desde ahí se reenvían a las áreas. Esto es:
- Lento
- Propenso a errores
- Sin trazabilidad
- Sin estadísticas
- Depende de personas específicas

### Solución
Sistema web donde:
1. Operadores suben PDFs → Sistema extrae datos automáticamente
2. Supervisores revisan en tiempo real → Aprueban/Rechazan
3. Sistema envía automáticamente por WhatsApp al área correspondiente
4. Todo queda registrado con auditoría completa

---

## 🎯 PROPÓSITO DEL SISTEMA

### Objetivos Principales
1. **Automatizar envío de reclamos** vía WhatsApp
2. **Trazabilidad completa**: Saber quién cargó qué, quién aprobó qué, cuándo, a dónde
3. **Estadísticas detalladas**: Por área, subtipo, día, hora, operador, supervisor
4. **Búsqueda de PDFs**: Encontrar reclamos históricos fácilmente
5. **Multiusuario**: 50 operadores + 10 supervisores desde cualquier PC

### Características Críticas (TRONCALES)
- ✅ **Historial completo** de todas las acciones
- ✅ **Almacenamiento de PDFs** en la nube
- ✅ **Auditoría**: Quién hizo qué y cuándo
- ✅ **Estadísticas granulares**
- ✅ **Búsqueda avanzada** de reclamos
- ✅ **Acceso simultáneo** de múltiples usuarios
- ✅ **Login simple** (solo nombre, sin contraseña compleja)

---

## 🏗️ ARQUITECTURA ACTUAL VS ARQUITECTURA OBJETIVO

### ARQUITECTURA ACTUAL (Local - No sirve para producción)

```
┌─────────────────────────────────────────────┐
│         LOCALHOST (Una PC)                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Frontend (HTML/CSS/JS)             │   │
│  │  - Servido por Express              │   │
│  └─────────────────────────────────────┘   │
│                   ↓                         │
│  ┌─────────────────────────────────────┐   │
│  │  Backend Node.js + Express          │   │
│  │  - Autenticación                    │   │
│  │  - Parsing PDF                      │   │
│  │  - Lógica de negocio                │   │
│  └─────────────────────────────────────┘   │
│                   ↓                         │
│  ┌─────────────────────────────────────┐   │
│  │  SQLite (archivo .db local)         │   │
│  │  - usuarios, reclamos, areas        │   │
│  └─────────────────────────────────────┘   │
│                   ↓                         │
│  ┌─────────────────────────────────────┐   │
│  │  WhatsApp Web.js                    │   │
│  │  - Chromium headless                │   │
│  │  - Sesión persistente               │   │
│  └─────────────────────────────────────┘   │
│                   ↓                         │
│  ┌─────────────────────────────────────┐   │
│  │  Carpeta /uploads (PDFs locales)    │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Limitaciones**:
- Solo funciona en una PC
- No accesible desde internet
- SQLite no soporta bien concurrencia
- Archivos almacenados localmente
- Requiere servidor siempre encendido

### ARQUITECTURA OBJETIVO (Online - Producción)

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│         NETLIFY (Frontend Hosting)                          │
│  https://pai-santa-fe.netlify.app                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Frontend Estático (React/Vue/Vanilla JS)             │ │
│  │  - operador.html → Subir PDFs                         │ │
│  │  - supervisor.html → Aprobar/Rechazar                 │ │
│  │  - estadisticas.html → Dashboards                     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│      SUPABASE (Backend as a Service)                        │
│  https://xxxxx.supabase.co                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                  │ │
│  │  - usuarios (operadores, supervisores)                │ │
│  │  - reclamos (todos los reclamos con auditoría)        │ │
│  │  - areas (áreas con números WhatsApp)                 │ │
│  │  - historial_acciones (log de TODAS las acciones)     │ │
│  │  - estadisticas (vistas materializadas)               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Supabase Storage                                     │ │
│  │  - Bucket: 'reclamos-pdfs'                            │ │
│  │  - Almacenamiento de PDFs en la nube                  │ │
│  │  - URLs públicas para descargas                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Supabase Auth (Simple)                               │ │
│  │  - Login por nombre (sin contraseña)                  │ │
│  │  - O lista desplegable de usuarios                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Supabase Edge Functions (Serverless)                 │ │
│  │  - parse-pdf: Procesa PDFs y extrae datos             │ │
│  │  - send-whatsapp: Envía mensajes vía API              │ │
│  │  - generate-stats: Genera estadísticas                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│   SERVIDOR WHATSAPP (VPS separado - necesario)             │
│   Digital Ocean / Contabo / Similar ($5-10/mes)             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Servicio Node.js con whatsapp-web.js                 │ │
│  │  - Mantiene conexión persistente con WhatsApp         │ │
│  │  - Expone API REST para enviar mensajes               │ │
│  │  - PM2 para mantenerlo siempre activo                 │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 FLUJO DE TRABAJO

### Flujo Completo Paso a Paso

```
1. OPERADOR SUBE PDF
   Usuario: operador1
   Acción: Arrastra PDF a dropzone
   ↓
   - Frontend sube PDF a Supabase Storage
   - Genera URL pública del PDF
   - Llama a Edge Function "parse-pdf"
   ↓
   - Edge Function descarga PDF temporal
   - Extrae datos con pdf-parse
   - Guarda en tabla "reclamos" con estado = 'PENDIENTE'
   - Registra en "historial_acciones": "Operador X cargó reclamo Y"
   ↓
   - Frontend muestra confirmación
   - Reclamo aparece en tabla del operador

2. SUPERVISOR VE PENDIENTES
   Usuario: supervisor1
   Acción: Entra a panel supervisor
   ↓
   - Frontend consulta: SELECT * FROM reclamos WHERE estado = 'PENDIENTE'
   - Muestra lista en tiempo real (con Supabase Realtime)

3. SUPERVISOR REVISA RECLAMO
   Acción: Hace clic en "Revisar"
   ↓
   - Modal se abre con todos los datos
   - PDF se muestra en iframe (desde Supabase Storage URL)
   - Puede agregar observaciones

4. SUPERVISOR APRUEBA
   Acción: Hace clic en "Aprobar"
   ↓
   - UPDATE reclamos SET estado = 'APROBADO', supervisor_id = X
   - INSERT historial_acciones: "Supervisor X aprobó reclamo Y"
   - Trigger en Supabase llama a Edge Function "send-whatsapp"
   ↓
   - Edge Function obtiene área y número WhatsApp
   - Hace POST a servidor WhatsApp: /api/send-message
   - Servidor WhatsApp envía mensaje + PDF
   ↓
   - UPDATE reclamos SET whatsapp_enviado = true, fecha_envio = NOW()
   - INSERT historial_acciones: "Reclamo Y enviado a área Z"
   - Frontend muestra confirmación

5. BÚSQUEDA Y ESTADÍSTICAS
   Usuario: supervisor/admin
   Acción: Busca reclamos o ve dashboard
   ↓
   - Query con filtros: área, fecha, subtipo, supervisor, operador
   - Generación de gráficos con datos agregados
   - Exportación a Excel/PDF si necesario
```

---

## 🛠️ STACK TECNOLÓGICO

### FRONTEND
```javascript
// Opción 1: Vanilla JavaScript (Actual, más simple)
- HTML5
- CSS3 (con variables CSS)
- JavaScript ES6+
- Dropzone.js (drag & drop de PDFs)
- Chart.js (para estadísticas)

// Opción 2: React (Recomendado para escalabilidad)
- React 18+
- Vite (build tool)
- TailwindCSS (styling)
- React Dropzone
- Recharts (gráficos)
- Supabase JS Client
```

### BACKEND
```javascript
// Supabase (BaaS)
- PostgreSQL 15+ (base de datos)
- Supabase Storage (archivos)
- Supabase Auth (autenticación simple)
- Supabase Edge Functions (Deno runtime)
- Supabase Realtime (actualizaciones en vivo)

// Servidor WhatsApp (VPS separado)
- Node.js 20+
- Express.js
- whatsapp-web.js
- PM2 (process manager)
```

### HOSTING
```
- Frontend: Netlify (gratis)
- Backend: Supabase (gratis hasta 500MB DB, 1GB storage)
- WhatsApp: Digital Ocean Droplet ($6/mes) o Contabo VPS ($5/mes)
```

### LIBRERÍAS CLAVE
```json
{
  "frontend": {
    "@supabase/supabase-js": "^2.38.0",
    "dropzone": "^6.0.0-beta.2",
    "chart.js": "^4.4.0"
  },
  "parsing": {
    "pdf-parse": "^1.1.1"
  },
  "whatsapp": {
    "whatsapp-web.js": "^1.23.0",
    "qrcode-terminal": "^0.12.0"
  }
}
```

---

## 🗄️ ESTRUCTURA DE LA BASE DE DATOS

### Esquema Completo (PostgreSQL en Supabase)

```sql
-- ============================================
-- TABLA: usuarios
-- Operadores y Supervisores
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('operador', 'supervisor', 'admin')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================
-- TABLA: areas
-- Áreas municipales con números de WhatsApp
-- ============================================
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    telefono_whatsapp TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_areas_nombre ON areas(nombre);

-- ============================================
-- TABLA: reclamos
-- TABLA PRINCIPAL - Todos los reclamos
-- ============================================
CREATE TABLE reclamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Datos extraídos del PDF
    solicitud_nro TEXT UNIQUE NOT NULL,
    tipo TEXT,
    subtipo TEXT,
    ubicacion TEXT,
    distrito TEXT,
    vecinal TEXT,
    area_destino TEXT,
    descripcion TEXT,
    prioridad TEXT,
    fecha_reclamo TEXT,
    solicitante TEXT,
    telefono TEXT,
    email TEXT,

    -- Archivos
    pdf_url TEXT NOT NULL, -- URL de Supabase Storage
    pdf_nombre_original TEXT,

    -- Estado y workflow
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),

    -- Auditoría
    operador_id UUID REFERENCES usuarios(id),
    supervisor_id UUID REFERENCES usuarios(id),
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    fecha_revision TIMESTAMPTZ,
    observaciones TEXT,

    -- WhatsApp
    whatsapp_enviado BOOLEAN DEFAULT false,
    fecha_envio_whatsapp TIMESTAMPTZ,
    whatsapp_error TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_reclamos_solicitud_nro ON reclamos(solicitud_nro);
CREATE INDEX idx_reclamos_estado ON reclamos(estado);
CREATE INDEX idx_reclamos_area_destino ON reclamos(area_destino);
CREATE INDEX idx_reclamos_subtipo ON reclamos(subtipo);
CREATE INDEX idx_reclamos_fecha_carga ON reclamos(fecha_carga DESC);
CREATE INDEX idx_reclamos_operador ON reclamos(operador_id);
CREATE INDEX idx_reclamos_supervisor ON reclamos(supervisor_id);

-- Índice compuesto para estadísticas
CREATE INDEX idx_reclamos_stats ON reclamos(area_destino, subtipo, estado, fecha_carga);

-- ============================================
-- TABLA: historial_acciones
-- LOG DE TODAS LAS ACCIONES (AUDITORÍA)
-- ============================================
CREATE TABLE historial_acciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Qué pasó
    accion TEXT NOT NULL, -- 'CARGA', 'APROBACION', 'RECHAZO', 'ENVIO_WHATSAPP', etc.
    descripcion TEXT NOT NULL, -- Texto descriptivo de la acción

    -- Quién
    usuario_id UUID REFERENCES usuarios(id),
    usuario_nombre TEXT, -- Desnormalizado para histórico

    -- Qué reclamo
    reclamo_id UUID REFERENCES reclamos(id),
    solicitud_nro TEXT, -- Desnormalizado

    -- Cuándo
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata adicional (JSON)
    metadata JSONB,

    -- Índices
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historial_timestamp ON historial_acciones(timestamp DESC);
CREATE INDEX idx_historial_usuario ON historial_acciones(usuario_id);
CREATE INDEX idx_historial_reclamo ON historial_acciones(reclamo_id);
CREATE INDEX idx_historial_accion ON historial_acciones(accion);

-- ============================================
-- VISTA: estadisticas_diarias
-- Estadísticas agregadas por día
-- ============================================
CREATE VIEW estadisticas_diarias AS
SELECT
    DATE(fecha_carga) as fecha,
    area_destino,
    subtipo,
    COUNT(*) as total_reclamos,
    COUNT(*) FILTER (WHERE estado = 'APROBADO') as aprobados,
    COUNT(*) FILTER (WHERE estado = 'RECHAZADO') as rechazados,
    COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
    COUNT(*) FILTER (WHERE whatsapp_enviado = true) as enviados_whatsapp
FROM reclamos
GROUP BY DATE(fecha_carga), area_destino, subtipo;

-- ============================================
-- VISTA: estadisticas_por_usuario
-- Performance de operadores y supervisores
-- ============================================
CREATE VIEW estadisticas_por_usuario AS
SELECT
    u.id,
    u.nombre_completo,
    u.rol,
    COUNT(r.id) as total_reclamos,
    COUNT(r.id) FILTER (WHERE r.estado = 'APROBADO') as aprobados,
    COUNT(r.id) FILTER (WHERE r.estado = 'RECHAZADO') as rechazados,
    AVG(EXTRACT(EPOCH FROM (r.fecha_revision - r.fecha_carga))/3600) as tiempo_promedio_revision_horas
FROM usuarios u
LEFT JOIN reclamos r ON (
    (u.rol = 'operador' AND r.operador_id = u.id) OR
    (u.rol = 'supervisor' AND r.supervisor_id = u.id)
)
WHERE u.activo = true
GROUP BY u.id, u.nombre_completo, u.rol;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Registrar en historial cuando se carga un reclamo
CREATE OR REPLACE FUNCTION log_reclamo_carga()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_acciones (
        accion,
        descripcion,
        usuario_id,
        usuario_nombre,
        reclamo_id,
        solicitud_nro,
        metadata
    ) VALUES (
        'CARGA',
        'Reclamo cargado por operador',
        NEW.operador_id,
        (SELECT nombre_completo FROM usuarios WHERE id = NEW.operador_id),
        NEW.id,
        NEW.solicitud_nro,
        jsonb_build_object(
            'area_destino', NEW.area_destino,
            'subtipo', NEW.subtipo,
            'prioridad', NEW.prioridad
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_carga
AFTER INSERT ON reclamos
FOR EACH ROW
EXECUTE FUNCTION log_reclamo_carga();

-- Trigger: Registrar aprobación/rechazo
CREATE OR REPLACE FUNCTION log_reclamo_revision()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado != OLD.estado AND NEW.estado IN ('APROBADO', 'RECHAZADO') THEN
        INSERT INTO historial_acciones (
            accion,
            descripcion,
            usuario_id,
            usuario_nombre,
            reclamo_id,
            solicitud_nro,
            metadata
        ) VALUES (
            CASE WHEN NEW.estado = 'APROBADO' THEN 'APROBACION' ELSE 'RECHAZO' END,
            'Reclamo ' || NEW.estado || ' por supervisor',
            NEW.supervisor_id,
            (SELECT nombre_completo FROM usuarios WHERE id = NEW.supervisor_id),
            NEW.id,
            NEW.solicitud_nro,
            jsonb_build_object(
                'observaciones', NEW.observaciones,
                'area_destino', NEW.area_destino
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_revision
AFTER UPDATE ON reclamos
FOR EACH ROW
EXECUTE FUNCTION log_reclamo_revision();

-- Trigger: Registrar envío WhatsApp
CREATE OR REPLACE FUNCTION log_whatsapp_envio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.whatsapp_enviado = true AND OLD.whatsapp_enviado = false THEN
        INSERT INTO historial_acciones (
            accion,
            descripcion,
            usuario_id,
            reclamo_id,
            solicitud_nro,
            metadata
        ) VALUES (
            'ENVIO_WHATSAPP',
            'Mensaje enviado por WhatsApp',
            NEW.supervisor_id,
            NEW.id,
            NEW.solicitud_nro,
            jsonb_build_object(
                'area_destino', NEW.area_destino,
                'fecha_envio', NEW.fecha_envio_whatsapp
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_whatsapp
AFTER UPDATE ON reclamos
FOR EACH ROW
EXECUTE FUNCTION log_whatsapp_envio();

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función: Buscar reclamos con filtros
CREATE OR REPLACE FUNCTION buscar_reclamos(
    p_area TEXT DEFAULT NULL,
    p_subtipo TEXT DEFAULT NULL,
    p_estado TEXT DEFAULT NULL,
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL,
    p_operador UUID DEFAULT NULL,
    p_supervisor UUID DEFAULT NULL,
    p_busqueda_texto TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    solicitud_nro TEXT,
    subtipo TEXT,
    ubicacion TEXT,
    area_destino TEXT,
    estado TEXT,
    fecha_carga TIMESTAMPTZ,
    operador_nombre TEXT,
    supervisor_nombre TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.solicitud_nro,
        r.subtipo,
        r.ubicacion,
        r.area_destino,
        r.estado,
        r.fecha_carga,
        uo.nombre_completo as operador_nombre,
        us.nombre_completo as supervisor_nombre
    FROM reclamos r
    LEFT JOIN usuarios uo ON r.operador_id = uo.id
    LEFT JOIN usuarios us ON r.supervisor_id = us.id
    WHERE
        (p_area IS NULL OR r.area_destino = p_area)
        AND (p_subtipo IS NULL OR r.subtipo = p_subtipo)
        AND (p_estado IS NULL OR r.estado = p_estado)
        AND (p_fecha_desde IS NULL OR DATE(r.fecha_carga) >= p_fecha_desde)
        AND (p_fecha_hasta IS NULL OR DATE(r.fecha_carga) <= p_fecha_hasta)
        AND (p_operador IS NULL OR r.operador_id = p_operador)
        AND (p_supervisor IS NULL OR r.supervisor_id = p_supervisor)
        AND (
            p_busqueda_texto IS NULL
            OR r.solicitud_nro ILIKE '%' || p_busqueda_texto || '%'
            OR r.descripcion ILIKE '%' || p_busqueda_texto || '%'
            OR r.ubicacion ILIKE '%' || p_busqueda_texto || '%'
        )
    ORDER BY r.fecha_carga DESC
    LIMIT 1000;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (Opcional para multi-tenant)
-- ============================================

-- Habilitar RLS en tablas
ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_acciones ENABLE ROW LEVEL SECURITY;

-- Política: Operadores solo ven sus reclamos
CREATE POLICY operadores_ven_sus_reclamos ON reclamos
    FOR SELECT
    USING (
        operador_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND rol IN ('supervisor', 'admin')
        )
    );

-- Política: Supervisores ven todo
CREATE POLICY supervisores_ven_todo ON reclamos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid()
            AND rol IN ('supervisor', 'admin')
        )
    );
```

---

## 🧩 COMPONENTES DEL SISTEMA

### 1. Frontend - Operador

**Archivo**: `operador.html` + `operador.js`

**Funcionalidades**:
- Dropzone para subir PDFs
- Selección de nombre (sin contraseña)
- Ver mis reclamos cargados
- Ver estado de cada reclamo
- Estadísticas personales

**Flujo**:
```javascript
// Pseudocódigo
1. Usuario selecciona su nombre del dropdown
2. localStorage.setItem('usuario_id', id)
3. Muestra panel de operador
4. Usuario arrastra PDF
   ↓
5. uploadPDF(file):
   - Upload a Supabase Storage
   - Obtener URL pública
   - Llamar a parsePDF(url)
   ↓
6. parsePDF(url):
   - POST a Edge Function /parse-pdf
   - Recibe datos extraídos
   - INSERT en tabla reclamos
   ↓
7. Actualizar UI
   - Mostrar confirmación
   - Agregar a tabla de "Mis reclamos"
```

### 2. Frontend - Supervisor

**Archivo**: `supervisor.html` + `supervisor.js`

**Funcionalidades**:
- Ver reclamos pendientes EN TIEMPO REAL
- Revisar detalles + PDF
- Aprobar o rechazar
- Ver historial completo
- Estadísticas generales
- Búsqueda avanzada
- Gestión de áreas

**Flujo Aprobación**:
```javascript
// Pseudocódigo
1. Cargar reclamos pendientes
   SELECT * FROM reclamos WHERE estado = 'PENDIENTE'

2. Supervisor hace clic en "Revisar"
   - Abrir modal
   - Mostrar PDF en iframe
   - Mostrar todos los datos

3. Supervisor hace clic en "Aprobar"
   ↓
4. aprobarReclamo(id):
   - UPDATE reclamos SET estado='APROBADO', supervisor_id=X
   - Trigger dispara envío WhatsApp
   ↓
5. enviarWhatsApp():
   - Edge Function llama a servidor WhatsApp
   - POST /api/send-message con datos + PDF URL
   ↓
6. Actualizar UI
   - Remover de pendientes
   - Mostrar confirmación
   - Actualizar estadísticas
```

### 3. Frontend - Estadísticas

**Archivo**: `estadisticas.html` + `estadisticas.js`

**Funcionalidades**:
- Dashboard con gráficos
- Filtros: fecha, área, subtipo, operador, supervisor
- Exportar a Excel/PDF
- Ver tendencias
- Top operadores/supervisores
- Tiempos promedio de aprobación

**Métricas Clave**:
- Reclamos por área
- Reclamos por subtipo
- Reclamos por día/hora
- Performance de operadores
- Performance de supervisores
- Tiempo promedio de revisión
- Tasa de aprobación vs rechazo

### 4. Backend - Supabase Edge Functions

**Función 1: parse-pdf**
```typescript
// parse-pdf.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import PDFParser from "pdf-parse"

serve(async (req) => {
  const { pdf_url } = await req.json()

  // Descargar PDF
  const pdfResponse = await fetch(pdf_url)
  const pdfBuffer = await pdfResponse.arrayBuffer()

  // Parsear PDF
  const data = await PDFParser(pdfBuffer)
  const texto = data.text

  // Extraer campos con regex
  const datos = {
    solicitud_nro: extractField(texto, /Solicitud Nro:\s*([^\n]+)/i),
    tipo: extractField(texto, /Tipo:\s*([^\n]+)/i),
    subtipo: extractField(texto, /Subtipo:\s*([^\n]+)/i),
    ubicacion: extractField(texto, /Ubicación:\s*([^\n]+)/i),
    area_destino: extractField(texto, /Area destino:\s*([^\n]+)/i),
    descripcion: extractDescription(texto),
    // ... más campos
  }

  return new Response(JSON.stringify(datos), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Función 2: send-whatsapp**
```typescript
// send-whatsapp.ts
serve(async (req) => {
  const { reclamo_id } = await req.json()

  // Obtener datos del reclamo
  const { data: reclamo } = await supabase
    .from('reclamos')
    .select('*, areas(*)')
    .eq('id', reclamo_id)
    .single()

  // Formatear mensaje
  const mensaje = formatearMensajePAI(reclamo)

  // Enviar a servidor WhatsApp
  const response = await fetch(WHATSAPP_SERVER_URL + '/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero: reclamo.areas.telefono_whatsapp,
      mensaje: mensaje,
      pdf_url: reclamo.pdf_url
    })
  })

  // Actualizar reclamo
  await supabase
    .from('reclamos')
    .update({
      whatsapp_enviado: true,
      fecha_envio_whatsapp: new Date()
    })
    .eq('id', reclamo_id)

  return new Response(JSON.stringify({ success: true }))
})
```

### 5. Servidor WhatsApp (VPS)

**Archivo**: `whatsapp-server/index.js`

```javascript
// Servidor Express en VPS
const express = require('express')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')

const app = express()
const client = new Client({
  authStrategy: new LocalAuth()
})

// Inicializar WhatsApp
client.initialize()

// Endpoint para enviar mensajes
app.post('/api/send', async (req, res) => {
  const { numero, mensaje, pdf_url } = req.body

  // Descargar PDF
  const response = await fetch(pdf_url)
  const buffer = await response.buffer()
  const media = new MessageMedia('application/pdf', buffer.toString('base64'), 'reclamo.pdf')

  // Enviar
  const chatId = `${numero}@c.us`
  await client.sendMessage(chatId, media, { caption: mensaje })

  res.json({ success: true })
})

app.listen(3000)
```

---

## 📡 APIs Y ENDPOINTS

### Supabase Client (Frontend)

```javascript
// Inicializar cliente
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xxxxx.supabase.co',
  'tu-anon-key-publica'
)

// === OPERADOR ===

// Subir PDF
const { data, error } = await supabase.storage
  .from('reclamos-pdfs')
  .upload(`${Date.now()}_${file.name}`, file)

const pdfUrl = supabase.storage
  .from('reclamos-pdfs')
  .getPublicUrl(data.path).data.publicUrl

// Parsear PDF (llamar edge function)
const { data: parsedData } = await supabase.functions
  .invoke('parse-pdf', {
    body: { pdf_url: pdfUrl }
  })

// Insertar reclamo
const { data: reclamo } = await supabase
  .from('reclamos')
  .insert({
    ...parsedData,
    pdf_url: pdfUrl,
    operador_id: usuarioActual.id,
    estado: 'PENDIENTE'
  })
  .select()
  .single()

// Ver mis reclamos
const { data: reclamos } = await supabase
  .from('reclamos')
  .select('*')
  .eq('operador_id', usuarioActual.id)
  .order('fecha_carga', { ascending: false })

// === SUPERVISOR ===

// Ver pendientes (con realtime)
const { data: pendientes } = await supabase
  .from('reclamos')
  .select(`
    *,
    operador:operador_id(nombre_completo)
  `)
  .eq('estado', 'PENDIENTE')
  .order('fecha_carga', { ascending: false })

// Suscribirse a cambios en tiempo real
supabase
  .channel('reclamos-pendientes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'reclamos', filter: 'estado=eq.PENDIENTE' },
    (payload) => {
      console.log('Cambio en reclamos:', payload)
      actualizarListaPendientes()
    }
  )
  .subscribe()

// Aprobar reclamo
const { data } = await supabase
  .from('reclamos')
  .update({
    estado: 'APROBADO',
    supervisor_id: usuarioActual.id,
    fecha_revision: new Date(),
    observaciones: observaciones
  })
  .eq('id', reclamoId)

// Trigger automático dispara envío WhatsApp

// Rechazar reclamo
const { data } = await supabase
  .from('reclamos')
  .update({
    estado: 'RECHAZADO',
    supervisor_id: usuarioActual.id,
    fecha_revision: new Date(),
    observaciones: observaciones
  })
  .eq('id', reclamoId)

// === BÚSQUEDA ===

// Buscar con filtros
const { data } = await supabase
  .rpc('buscar_reclamos', {
    p_area: 'ALUMBRADO PÚBLICO',
    p_fecha_desde: '2025-01-01',
    p_fecha_hasta: '2025-12-31'
  })

// === ESTADÍSTICAS ===

// Por área
const { data } = await supabase
  .from('estadisticas_diarias')
  .select('*')
  .gte('fecha', '2025-01-01')

// Por usuario
const { data } = await supabase
  .from('estadisticas_por_usuario')
  .select('*')

// Historial de acciones
const { data } = await supabase
  .from('historial_acciones')
  .select(`
    *,
    usuario:usuario_id(nombre_completo)
  `)
  .eq('reclamo_id', reclamoId)
  .order('timestamp', { ascending: false })
```

---

## 📄 FORMATO DE PDFS

### Ejemplo de PDF de Solicitud

```
Solicitud Nro: 10001-2025

Tipo: RECLAMO
Subtipo: LED - LUMINARIA APAGADA
Ubicación: CALLE EJEMPLO 123
Distrito: CENTRO
Vecinal: BARRIO DEMO

Descripción: Ejemplo ficticio. La luminaria de la esquina no enciende.

Fecha: 01/01/2025 09:00
Estado: Derivado
Prioridad: MEDIA
Area origen: ATENCIÓN CIUDADANA
Reiteraciones: 0

Solicitantes:
Apellido y Nombres: PEREZ JUAN DEMO
Doc: DNI 00000000
Teléfono: Cel: 543420000000
Email: juan.demo@example.com
Horario contacto: 09 a 12

Derivaciones:
Area destino: ALUMBRADO PÚBLICO
Fecha/Hora: 01/01/2025 09:05
Estado: Recibido
```

### Expresiones Regulares para Extracción

```javascript
const patterns = {
  solicitud_nro: /Solicitud\s+Nro[:\s]+([^\n]+)/i,
  tipo: /Tipo[:\s]+([^\n]+)/i,
  subtipo: /Subtipo[:\s]+([^\n]+)/i,
  ubicacion: /Ubicaci[oó]n[:\s]+([^\n]+)/i,
  distrito: /Distrito[:\s]+([^\n]+)/i,
  vecinal: /Vecinal[:\s]+([^\n]+)/i,
  descripcion: /Descripci[oó]n[:\s]+(.+?)(?=\n\s*(?:Fecha|Prioridad|Estado)[\s:])/is,
  fecha_reclamo: /Fecha[:\s]+([^\n]+)/i,
  prioridad: /Prioridad[:\s]+([^\n]+)/i,
  area_destino: /Area destino[:\s]+([^\n]+)/i,
  solicitante: /Apellido y Nombres[:\s]+([^\n(]+)/i,
  telefono: /Tel[eé]fono[:\s]+([^\n]+)/i,
  email: /Email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
}
```

---

## 📱 INTEGRACIÓN WHATSAPP

### Problema: WhatsApp Requiere Conexión Persistente

`whatsapp-web.js` requiere:
- Conexión persistente a WhatsApp
- Navegador Chromium ejecutándose
- No puede correr en serverless (Netlify Functions)

### Solución: Servidor Separado en VPS

**Opción 1: Digital Ocean Droplet ($6/mes)**
```bash
# Setup en Ubuntu 22.04
ssh root@tu-ip

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Clonar servidor WhatsApp
git clone tu-repo-whatsapp
cd whatsapp-server
npm install

# Iniciar con PM2
pm2 start index.js --name whatsapp-pai
pm2 save
pm2 startup

# Escanear QR (primera vez)
pm2 logs whatsapp-pai
# Verás el QR en los logs
```

**Opción 2: Render.com (Gratis con limitaciones)**
- Deploy como Web Service
- Mantiene el servidor vivo (pero con sleep después de inactividad)

**Opción 3: Railway.app ($5-10/mes)**
- Más estable que Render
- No tiene sleep

### API del Servidor WhatsApp

```javascript
// Endpoints necesarios

// POST /api/send-message
// Enviar mensaje de texto
{
  "numero": "543424123456",
  "mensaje": "Texto del mensaje"
}

// POST /api/send-file
// Enviar archivo con caption
{
  "numero": "543424123456",
  "mensaje": "Caption del archivo",
  "file_url": "https://url-del-archivo.com/file.pdf"
}

// GET /api/status
// Ver estado de conexión
Response: {
  "connected": true,
  "phone": "543424999999"
}

// POST /api/reconnect
// Forzar reconexión (si se desconecta)
```

---

## 🚀 ROADMAP DE MIGRACIÓN

### FASE 1: Setup Infraestructura (1-2 días)

**1.1 Crear proyecto Supabase**
- Ir a https://supabase.com
- Crear cuenta
- Crear nuevo proyecto
- Guardar: URL del proyecto + anon key

**1.2 Crear base de datos**
- Ejecutar todos los scripts SQL del apartado anterior
- Verificar tablas, triggers, funciones

**1.3 Configurar Storage**
- Crear bucket "reclamos-pdfs"
- Hacer público el bucket
- Configurar políticas de acceso

**1.4 Crear usuarios iniciales**
```sql
INSERT INTO usuarios (nombre_completo, username, rol) VALUES
('Juan Pérez', 'jperez', 'operador'),
('María González', 'mgonzalez', 'operador'),
-- ... más operadores
('Carlos Ruiz', 'cruiz', 'supervisor'),
-- ... más supervisores
('Admin Sistema', 'admin', 'admin');
```

**1.5 Crear áreas iniciales**
```sql
INSERT INTO areas (nombre, telefono_whatsapp) VALUES
('ALUMBRADO PÚBLICO', '543424000001'),
('BARRIDO Y LIMPIEZA', '543424000002'),
('BACHEO', '543424000003');
-- ... más áreas
```

### FASE 2: Migrar Frontend (2-3 días)

**2.1 Configurar Supabase Client**
```javascript
// config/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

**2.2 Adaptar Login (sin contraseñas)**
```javascript
// Mostrar lista de usuarios
const { data: usuarios } = await supabase
  .from('usuarios')
  .select('*')
  .eq('activo', true)
  .order('nombre_completo')

// Usuario selecciona su nombre del dropdown
// Guardar en localStorage
localStorage.setItem('usuario_actual', JSON.stringify(usuario))
```

**2.3 Adaptar Operador**
- Cambiar upload a Supabase Storage
- Integrar con Edge Function parse-pdf
- Actualizar consultas a Supabase

**2.4 Adaptar Supervisor**
- Cambiar consultas a Supabase
- Implementar Realtime para pendientes
- Adaptar aprobación/rechazo

**2.5 Crear módulo de Estadísticas**
- Dashboard con Chart.js
- Consultas a vistas materializadas
- Filtros avanzados

### FASE 3: Backend Serverless (2-3 días)

**3.1 Crear Edge Function: parse-pdf**
```bash
supabase functions new parse-pdf
# Editar parse-pdf/index.ts
supabase functions deploy parse-pdf
```

**3.2 Crear Edge Function: send-whatsapp**
```bash
supabase functions new send-whatsapp
# Editar send-whatsapp/index.ts
supabase functions deploy send-whatsapp
```

**3.3 Configurar secrets**
```bash
supabase secrets set WHATSAPP_SERVER_URL=https://tu-vps.com
```

### FASE 4: Servidor WhatsApp (1 día)

**4.1 Crear servidor separado**
- Usar el código actual de whatsappService.js
- Envolver en API REST Express
- Agregar endpoints necesarios

**4.2 Deploy en VPS**
- Digital Ocean / Contabo / Similar
- Ubuntu 22.04
- Node.js 20 + PM2
- Escanear QR

**4.3 Proteger con API Key**
```javascript
// Middleware
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
```

### FASE 5: Deploy y Pruebas (1-2 días)

**5.1 Deploy Frontend en Netlify**
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**5.2 Configurar variables de entorno en Netlify**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

**5.3 Pruebas integrales**
- Operador carga PDF → OK
- Supervisor aprueba → OK
- WhatsApp envía mensaje → OK
- Historial se registra → OK
- Estadísticas se actualizan → OK

**5.4 Capacitación usuarios**
- Manual de usuario
- Video tutorial
- Sesión en vivo

### FASE 6: Monitoreo y Optimización (Continuo)

**6.1 Configurar monitoreo**
- Supabase Dashboard (queries lentas)
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)

**6.2 Optimizaciones**
- Índices en queries lentas
- Caché de estadísticas
- Compresión de PDFs

---

## 👨‍💻 INSTRUCCIONES PARA DESARROLLADORES

### Para IA/Cursor: Cómo Trabajar con Este Proyecto

#### Al Abrir el Proyecto

1. **Leer este archivo completo** - Contiene TODA la información
2. **Verificar estructura** - ¿Estás en versión local o versión online?
3. **Identificar tarea** - ¿Qué feature/bug estás trabajando?

#### Comandos Frecuentes

```bash
# Versión local
cd organizador-pai
npm install
npm start

# Versión online
cd frontend
npm install
npm run dev

# Supabase
supabase start  # Local dev
supabase db reset  # Reset DB local
supabase functions serve  # Probar edge functions localmente
supabase functions deploy nombre-funcion  # Deploy function
```

#### Cómo Agregar Features

**Ejemplo: Agregar filtro por prioridad en estadísticas**

1. **Backend (Supabase)**
```sql
-- Agregar columna a vista si necesario
CREATE OR REPLACE VIEW estadisticas_diarias AS
SELECT
    DATE(fecha_carga) as fecha,
    area_destino,
    subtipo,
    prioridad,  -- NUEVA
    COUNT(*) as total_reclamos,
    -- ...
FROM reclamos
GROUP BY DATE(fecha_carga), area_destino, subtipo, prioridad;  -- AGREGAR prioridad
```

2. **Frontend**
```javascript
// estadisticas.js

// Agregar filtro en UI
<select id="filtroPrioridad">
  <option value="">Todas las prioridades</option>
  <option value="CRÍTICA">Crítica</option>
  <option value="ALTA">Alta</option>
  <option value="NORMAL">Normal</option>
</select>

// Actualizar query
const { data } = await supabase
  .from('estadisticas_diarias')
  .select('*')
  .eq('prioridad', prioridadSeleccionada)  // NUEVO
```

3. **Probar**
- Cargar reclamos con diferentes prioridades
- Verificar que filtro funcione
- Verificar que gráficos se actualicen

#### Debugging

**Frontend**
```javascript
// Siempre usar console.log para ver datos
console.log('Datos recibidos:', data)
console.log('Error:', error)

// Ver queries en Supabase
// Dashboard → SQL Editor → History
```

**Backend (Edge Functions)**
```typescript
// Deno.serve() automáticamente loggea
console.log('Request:', await req.json())

// Ver logs
supabase functions logs nombre-funcion --tail
```

**WhatsApp Server**
```bash
# Ver logs en VPS
pm2 logs whatsapp-pai

# Reiniciar si hay problemas
pm2 restart whatsapp-pai
```

#### Testing

**Casos de Prueba Importantes**

1. **Upload PDF**
   - PDF válido → OK
   - PDF escaneado → Error
   - PDF muy grande → Error
   - PDF corrupto → Error

2. **Parsing**
   - Todos los campos extraídos → OK
   - Campo faltante → Warning pero continúa
   - Formato diferente → Ajustar regex

3. **Aprobación**
   - Área configurada → Envía WhatsApp
   - Área sin configurar → Error, no envía
   - WhatsApp desconectado → Error, no marca como enviado

4. **Concurrencia**
   - 2 operadores subiendo al mismo tiempo → OK
   - 2 supervisores aprobando al mismo tiempo → OK
   - Mismo reclamo aprobado 2 veces → Prevenir con estado

#### Mejores Prácticas

1. **Siempre validar en backend** - No confiar en frontend
2. **Usar transacciones** para operaciones múltiples
3. **Loggear todo** en historial_acciones
4. **Índices** en columnas que se filtran frecuentemente
5. **Caché** para estadísticas (actualizar cada hora)

#### Troubleshooting Común

**"No se puede conectar a Supabase"**
- Verificar URL y anon key
- Ver Dashboard de Supabase → API
- Verificar CORS

**"PDF no se parsea correctamente"**
- Ver contenido del PDF con `console.log(texto)`
- Ajustar regex en parse-pdf/index.ts
- Probar regex en regex101.com

**"WhatsApp no envía"**
- Verificar estado: GET /api/status
- Ver logs: pm2 logs whatsapp-pai
- Verificar número formato correcto

**"Estadísticas lentas"**
- Agregar índices necesarios
- Usar vistas materializadas
- Implementar caché

---

## 📌 NOTAS FINALES

### Prioridades de Desarrollo

1. **CRÍTICO** (Debe funcionar SÍ o SÍ)
   - Upload de PDFs
   - Parsing de PDFs
   - Aprobación/Rechazo
   - Envío WhatsApp
   - Historial de acciones

2. **IMPORTANTE** (Para producción)
   - Estadísticas básicas
   - Búsqueda de reclamos
   - Gestión de áreas
   - Login por nombre

3. **DESEABLE** (Para mejorar)
   - Dashboard avanzado
   - Exportar Excel
   - Notificaciones en tiempo real
   - App móvil

### Limitaciones Conocidas

1. **WhatsApp no oficial** - Puede dejar de funcionar
2. **Supabase free tier** - 500MB DB, 1GB storage
3. **PDFs deben ser texto** - No soporta escaneados
4. **VPS necesario** - Para WhatsApp ($5-10/mes)

### Contacto y Soporte

- **Documentación Supabase**: https://supabase.com/docs
- **Documentación whatsapp-web.js**: https://wwebjs.dev
- **Comunidad**: Discord de Supabase

---

**Última actualización**: Noviembre 2025
**Versión**: 2.0 (Online con Supabase)
