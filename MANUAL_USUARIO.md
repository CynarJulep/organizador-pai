# Manual de Usuario - Sistema PAI

## Índice
1. [Introducción](#introducción)
2. [Instalación Inicial](#instalación-inicial)
3. [Primer Uso](#primer-uso)
4. [Guía para Operadores](#guía-para-operadores)
5. [Guía para Supervisores](#guía-para-supervisores)
6. [Gestión de Áreas](#gestión-de-áreas)
7. [Preguntas Frecuentes](#preguntas-frecuentes)
8. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

El Sistema PAI (Protocolo de Acción Inmediata) es una herramienta que automatiza el proceso de derivación de reclamos urgentes a las áreas municipales mediante WhatsApp.

### Flujo del Sistema

```
OPERADOR carga PDF → Sistema extrae datos → SUPERVISOR revisa → Aprueba → WhatsApp automático
```

### Roles

- **Operador**: Carga PDFs de solicitudes al sistema
- **Supervisor**: Revisa y aprueba/rechaza reclamos, gestiona áreas
- **Admin**: Tiene todos los permisos

---

## Instalación Inicial

### Paso 1: Instalar Node.js

1. Ve a https://nodejs.org/
2. Descarga el instalador **LTS** para Windows
3. Ejecuta el instalador (dejar todas las opciones por defecto)
4. Verifica la instalación:
   ```cmd
   node --version
   npm --version
   ```
   Deberías ver los números de versión.

### Paso 2: Instalar Dependencias

1. Abre **CMD** o **PowerShell**
2. Navega a la carpeta del proyecto:
   ```cmd
   cd "d:\Renzo\Trabajo\Proyectos\Organizador PAI"
   ```
3. Instala las dependencias:
   ```cmd
   npm install
   ```
   Esto puede tardar 2-5 minutos. Descargará todas las librerías necesarias.

### Paso 3: Configurar Variables de Entorno

1. Abre el archivo `.env` con Notepad
2. Cambia `SESSION_SECRET` por una cadena aleatoria:
   ```
   SESSION_SECRET=MiClaveSecreta123ABC
   ```

### Paso 4: Iniciar el Servidor

```cmd
npm start
```

Verás un mensaje como:
```
🚀 Servidor PAI iniciado correctamente
📍 URL: http://localhost:3000
```

**IMPORTANTE**: Deja esta ventana abierta mientras uses el sistema.

---

## Primer Uso

### Configurar WhatsApp

La primera vez que inicies el servidor, aparecerá un código QR en la consola:

1. Abre WhatsApp en tu teléfono
2. Ve a **Menú (⋮) → Dispositivos vinculados**
3. Toca **"Vincular un dispositivo"**
4. Escanea el código QR de la consola
5. Espera el mensaje: `✅ WhatsApp conectado y listo`

**Notas:**
- Solo necesitas hacer esto una vez
- Usa un número de WhatsApp dedicado para PAI (no tu número personal)
- La sesión se guarda automáticamente

### Acceder al Sistema

1. Abre tu navegador (Chrome, Firefox, Edge)
2. Ve a: http://localhost:3000
3. Verás la pantalla de login

### Usuarios por Defecto

- **Operador**: `operador1` / `operador123`
- **Supervisor**: `supervisor1` / `supervisor123`
- **Admin**: `admin` / `admin123`

⚠️ **IMPORTANTE**: Cambiar estas contraseñas después del primer uso

---

## Guía para Operadores

### Cargar un Reclamo

1. **Iniciar Sesión**
   - Ingresa con tu usuario operador
   - Serás redirigido a tu panel

2. **Ver Estadísticas**
   - En la parte superior verás tus estadísticas:
     - Pendientes: Reclamos esperando aprobación
     - Aprobados: Reclamos ya enviados
     - Rechazados: Reclamos que no fueron aprobados
     - Total: Todos tus reclamos

3. **Cargar PDF**

   **Opción A - Drag & Drop (Arrastrar y Soltar)**:
   - Arrastra el PDF desde el explorador de archivos
   - Suéltalo en el área de carga

   **Opción B - Clic**:
   - Haz clic en el área de carga
   - Selecciona el archivo PDF
   - Haz clic en "Abrir"

4. **Proceso Automático**
   - El sistema extraerá automáticamente:
     - Número de solicitud
     - Tipo y subtipo
     - Ubicación (calle, número)
     - Área destino
     - Descripción
     - Prioridad
     - Datos del solicitante

5. **Confirmación**
   - Si todo está bien, verás: "Reclamo XXXXX cargado exitosamente"
   - El reclamo aparecerá en tu tabla con estado PENDIENTE
   - El supervisor podrá verlo para aprobarlo

### Mis Reclamos

En la tabla verás todos tus reclamos con:
- **Solicitud**: Número del reclamo
- **Subtipo**: Tipo de problema
- **Ubicación**: Dónde ocurre
- **Área**: A dónde se enviará
- **Prioridad**: Urgencia del reclamo
- **Estado**:
  - 🟡 PENDIENTE: Esperando aprobación
  - 🟢 APROBADO: Ya fue enviado por WhatsApp
  - 🔴 RECHAZADO: No fue aprobado
- **Fecha Carga**: Cuándo lo cargaste

### Errores Comunes

**"Error al procesar PDF"**
- El PDF debe ser de texto (no imagen escaneada)
- Verificar que sea el PDF correcto del sistema municipal

**"Reclamo duplicado"**
- Ya existe un reclamo con ese número
- Revisar si no fue cargado anteriormente

**"Archivo muy grande"**
- El PDF no puede superar 16MB
- Si es más grande, contactar al administrador

---

## Guía para Supervisores

### Panel de Supervisor

Al iniciar sesión como supervisor, verás:

1. **Estadísticas Generales**
   - Pendientes: Reclamos que debes revisar
   - Aprobados: Total de reclamos aprobados
   - Rechazados: Total de reclamos rechazados
   - Hoy: Reclamos cargados hoy

2. **Reclamos Pendientes**
   - Lista de todos los reclamos esperando tu aprobación
   - Ordenados del más reciente al más antiguo

### Revisar un Reclamo

1. **Hacer Clic en "Revisar"**
   - Se abrirá un modal con toda la información

2. **Verificar Datos**

   **Información del Reclamo**:
   - Solicitud Nro
   - Tipo y Subtipo
   - Ubicación completa
   - Área destino
   - Prioridad

   **Solicitante**:
   - Nombre completo
   - Teléfono (si tiene)
   - Email (si tiene)

   **Cargado por**:
   - Qué operador lo cargó
   - Cuándo fue cargado

3. **Ver el PDF**
   - Debajo de los datos verás el PDF original
   - Revísalo para confirmar que todo esté correcto

4. **Agregar Observaciones (Opcional)**
   - Puedes escribir comentarios
   - Útil para dejar registro de decisiones

### Aprobar un Reclamo

1. Haz clic en **"✓ Aprobar y Enviar por WhatsApp"**

2. Confirma la acción

3. **¿Qué Sucede?**
   - El reclamo cambia a estado APROBADO
   - Se busca el número de WhatsApp del área
   - Se envía automáticamente un mensaje con:
     - Todos los datos del reclamo
     - El PDF adjunto
   - Recibirás confirmación de envío

4. **Mensajes**
   - ✅ "Reclamo aprobado y enviado por WhatsApp": Todo OK
   - ⚠️ "Área no configurada": Falta configurar el número de WhatsApp
   - ⚠️ "WhatsApp no conectado": Debes escanear el QR

### Rechazar un Reclamo

1. Escribe el **motivo del rechazo** en observaciones (obligatorio)

2. Haz clic en **"✗ Rechazar"**

3. Confirma la acción

4. El reclamo cambia a estado RECHAZADO y NO se envía por WhatsApp

---

## Gestión de Áreas

### Acceder

1. Como supervisor, haz clic en **"Gestionar Áreas"**
2. Verás la página de configuración de áreas

### Agregar Nueva Área

1. **Nombre del Área**
   - Escribe el nombre en MAYÚSCULAS
   - Ejemplo: `ALUMBRADO PÚBLICO`

2. **Número de WhatsApp**
   - Formato: código país + código área + número
   - **Sin espacios, sin guiones, sin +**
   - Ejemplo Argentina: `543424123456`
     - 54 = código de país (Argentina)
     - 342 = código de área (Santa Fe)
     - 4123456 = número

3. Haz clic en **"+ Agregar Área"**

### Formato de Números

| País | Código | Ejemplo Completo |
|------|--------|------------------|
| Argentina | 54 | 543424123456 |
| Chile | 56 | 56912345678 |
| Uruguay | 598 | 59899123456 |

### Editar un Área

1. Haz clic en **"Editar"** en el área que quieres modificar
2. Cambia el nombre o teléfono
3. Puedes activar/desactivar el área
4. Haz clic en **"Guardar Cambios"**

### Activar/Desactivar

- **Desactivar**: El área seguirá en la lista pero no se podrán enviar mensajes
- **Activar**: Reactiva un área desactivada
- Útil para áreas temporalmente sin servicio

### Eliminar un Área

⚠️ **CUIDADO**: Esta acción no se puede deshacer

1. Haz clic en **"Eliminar"**
2. Confirma la acción
3. **Solo funciona si**:
   - El área no tiene reclamos asociados
   - Si tiene reclamos, mejor desactívala en lugar de eliminarla

---

## Preguntas Frecuentes

### ¿Cuántos operadores pueden usar el sistema?

Los que necesites. El supervisor puede crear nuevos usuarios.

### ¿Qué pasa si se cierra el navegador?

Puedes volver a abrir http://localhost:3000 y tu sesión seguirá activa.

### ¿Qué pasa si se cierra la consola (CMD)?

El servidor se detiene y el sistema deja de funcionar. Debes volver a ejecutar `npm start`.

### ¿El servidor debe estar siempre encendido?

Sí, mientras lo uses. Para uso permanente, considera:
- Dejar la PC encendida
- Usar un servicio como PM2 para mantenerlo activo

### ¿Se puede acceder desde otras computadoras?

Sí, pero requiere configuración de red. Por defecto solo funciona en localhost.

### ¿Los PDFs se guardan?

Sí, en la carpeta `uploads/`. Puedes hacer backups de esta carpeta.

### ¿Se pueden eliminar reclamos?

Por ahora no hay opción de eliminar (por seguridad). Solo aprobar o rechazar.

---

## Solución de Problemas

### El servidor no inicia

**Error: "Puerto 3000 ya en uso"**

Solución:
1. Cierra todos los CMD/PowerShell abiertos
2. O cambia el puerto en el archivo `.env`:
   ```
   PORT=3001
   ```

**Error: "node no se reconoce como comando"**

Solución:
1. Reinstala Node.js
2. Asegúrate de reiniciar CMD después de instalar

### WhatsApp no se conecta

**El QR no aparece**

Solución:
1. Verifica que el servidor esté ejecutándose
2. Revisa la consola para ver errores
3. Elimina la carpeta `whatsapp-session` e intenta de nuevo

**QR expiró**

Solución:
- Se regenera automáticamente cada 30-60 segundos
- Escanéalo rápido cuando aparezca

**"WhatsApp no conectado" al aprobar**

Solución:
1. Ve a la consola donde corre el servidor
2. Busca el mensaje de estado de WhatsApp
3. Si dice "desconectado", espera a que se reconecte
4. Si no se reconecta, reinicia el servidor

### Error al subir PDF

**"Error al procesar PDF"**

Causas posibles:
1. El PDF es una imagen escaneada (usa OCR o vuelve a generar)
2. El formato del PDF cambió (ajustar expresiones regulares)
3. El PDF está corrupto (volver a descargar)

**"Archivo muy grande"**

Solución:
- Comprimir el PDF
- O aumentar el límite en `.env`:
  ```
  MAX_FILE_SIZE=20000000
  ```

### Error al enviar WhatsApp

**"Área no configurada"**

Solución:
1. Ve a "Gestionar Áreas"
2. Busca el área que aparece en el reclamo
3. Si no existe, agrégala
4. Si existe, verifica que esté ACTIVA

**"Número inválido"**

Solución:
1. Ve a "Gestionar Áreas"
2. Edita el área problemática
3. Verifica el formato del número (solo números, sin +)

### Página en blanco o error 404

Solución:
1. Verifica que el servidor esté corriendo
2. Usa la URL correcta: http://localhost:3000
3. No uses https://
4. Prueba en modo incógnito del navegador

### Olvidé mi contraseña

Solución:
1. Pide al administrador que la cambie
2. O modifica directamente la base de datos:
   - Ubicación: `database/pai.db`
   - Usa un editor de SQLite
   - Tabla: `usuarios`

### Base de datos corrupta

Solución:
1. Hacer backup de `database/pai.db`
2. Eliminar el archivo `.db`
3. Reiniciar el servidor (creará una nueva base)
4. Reconfigurar áreas

---

## Contacto y Soporte

Para reportar problemas o sugerencias:
- Contacta al administrador del sistema
- Revisa los logs en la consola del servidor
- Guarda capturas de pantalla de los errores

## Actualizaciones

Para actualizar el sistema:
1. Hacer backup de la carpeta completa
2. Reemplazar archivos nuevos
3. Ejecutar `npm install` por si hay nuevas dependencias
4. Reiniciar el servidor

---

**Versión del Manual**: 1.0
**Última Actualización**: Noviembre 2025
