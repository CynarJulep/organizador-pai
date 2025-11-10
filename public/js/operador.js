// Verificar autenticación al cargar
verificarAutenticacion();

// Configurar Dropzone
Dropzone.autoDiscover = false;

const dropzone = new Dropzone("#pdfDropzone", {
    url: "/api/operador/upload",
    paramName: "pdf",
    maxFilesize: 16, // MB
    acceptedFiles: "application/pdf,.pdf",
    addRemoveLinks: true,
    dictDefaultMessage: "📄 Arrastra un PDF aquí o haz clic para seleccionar",
    dictFallbackMessage: "Tu navegador no soporta drag & drop de archivos",
    dictFileTooBig: "El archivo es muy grande ({{filesize}}MB). Máximo: {{maxFilesize}}MB",
    dictInvalidFileType: "Solo se permiten archivos PDF",
    dictRemoveFile: "Eliminar",
    dictCancelUpload: "Cancelar",
    maxFiles: 1,
    timeout: 180000, // 3 minutos

    headers: {
        'Cache-Control': null,
        'X-Requested-With': null
    }
});

// Cuando se agrega un archivo
dropzone.on("addedfile", function(file) {
    console.log("Archivo agregado:", file.name);
});

// Cuando la subida es exitosa
dropzone.on("success", function(file, response) {
    console.log("Respuesta del servidor:", response);

    if (response.exito) {
        // Mostrar mensaje de éxito
        mostrarMensaje('success', `Reclamo ${response.reclamo.solicitud_nro} cargado exitosamente`);

        // Recargar estadísticas y tabla
        cargarEstadisticas();
        cargarReclamos();

        // Remover el archivo después de 2 segundos
        setTimeout(() => {
            dropzone.removeFile(file);
        }, 2000);
    } else {
        mostrarMensaje('error', response.mensaje || 'Error al cargar el reclamo');
    }
});

// Cuando hay un error en la subida
dropzone.on("error", function(file, errorMessage, xhr) {
    console.error("Error:", errorMessage);

    let mensaje = 'Error al cargar el archivo';

    if (typeof errorMessage === 'object' && errorMessage.mensaje) {
        mensaje = errorMessage.mensaje;
    } else if (typeof errorMessage === 'string') {
        mensaje = errorMessage;
    }

    mostrarMensaje('error', mensaje);

    // Remover el archivo después de 3 segundos
    setTimeout(() => {
        dropzone.removeFile(file);
    }, 3000);
});

// Cuando se está subiendo
dropzone.on("uploadprogress", function(file, progress, bytesSent) {
    console.log(`Progreso: ${progress}%`);
});

// Botón de logout
document.getElementById('btnLogout').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });

        if (response.ok) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});

// Cargar datos iniciales
cargarEstadisticas();
cargarReclamos();

// Recargar reclamos cada 30 segundos
setInterval(cargarReclamos, 30000);

/**
 * Verifica que el usuario esté autenticado
 */
async function verificarAutenticacion() {
    try {
        const response = await fetch('/api/auth/verificar');
        const data = await response.json();

        if (!data.autenticado) {
            window.location.href = '/index.html';
            return;
        }

        // Verificar que sea operador
        if (data.usuario.rol !== 'operador' && data.usuario.rol !== 'admin') {
            window.location.href = '/supervisor.html';
            return;
        }

        // Mostrar nombre del usuario
        document.getElementById('userName').textContent = data.usuario.nombreCompleto || data.usuario.username;

    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/index.html';
    }
}

/**
 * Carga las estadísticas del operador
 */
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/operador/estadisticas');
        const data = await response.json();

        if (data.exito) {
            document.getElementById('statPendientes').textContent = data.estadisticas.pendientes;
            document.getElementById('statAprobados').textContent = data.estadisticas.aprobados;
            document.getElementById('statRechazados').textContent = data.estadisticas.rechazados;
            document.getElementById('statTotal').textContent = data.estadisticas.total;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Carga los reclamos del operador
 */
async function cargarReclamos() {
    try {
        const response = await fetch('/api/operador/reclamos');
        const data = await response.json();

        const tbody = document.getElementById('reclamosBody');

        if (!data.exito || data.reclamos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="icon">📋</div>
                        <div>No has cargado ningún reclamo todavía</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Generar filas de la tabla
        tbody.innerHTML = data.reclamos.map(reclamo => `
            <tr>
                <td><strong>${reclamo.solicitud_nro}</strong></td>
                <td>${reclamo.subtipo || '-'}</td>
                <td>${reclamo.ubicacion || '-'}</td>
                <td>${reclamo.area_destino || '-'}</td>
                <td>
                    <span class="badge-prioridad ${getBadgePrioridadClass(reclamo.prioridad)}">
                        ${reclamo.prioridad || 'NORMAL'}
                    </span>
                </td>
                <td>
                    <span class="badge-status ${getBadgeEstadoClass(reclamo.estado)}">
                        ${reclamo.estado}
                    </span>
                </td>
                <td>${formatearFecha(reclamo.fecha_carga)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar reclamos:', error);
        document.getElementById('reclamosBody').innerHTML = `
            <tr>
                <td colspan="7" class="error-message">
                    Error al cargar los reclamos
                </td>
            </tr>
        `;
    }
}

/**
 * Obtiene la clase CSS para el badge de estado
 */
function getBadgeEstadoClass(estado) {
    switch (estado) {
        case 'PENDIENTE': return 'badge-pendiente';
        case 'APROBADO': return 'badge-aprobado';
        case 'RECHAZADO': return 'badge-rechazado';
        default: return '';
    }
}

/**
 * Obtiene la clase CSS para el badge de prioridad
 */
function getBadgePrioridadClass(prioridad) {
    if (!prioridad) return 'badge-normal';

    const p = prioridad.toUpperCase();
    if (p.includes('CRÍTICA') || p.includes('CRITICA')) return 'badge-critica';
    if (p.includes('ALTA')) return 'badge-alta';
    return 'badge-normal';
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';

    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diff = ahora - fecha;

    // Si fue hoy
    if (diff < 86400000 && fecha.getDate() === ahora.getDate()) {
        return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    // Si fue hace menos de 7 días
    if (diff < 604800000) {
        const dias = Math.floor(diff / 86400000);
        return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
    }

    // Fecha completa
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Muestra un mensaje temporal
 */
function mostrarMensaje(tipo, texto) {
    // Crear elemento de mensaje
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.textContent = texto;
    mensaje.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 6px;
        background-color: ${tipo === 'success' ? '#16a34a' : '#dc2626'};
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(mensaje);

    // Remover después de 4 segundos
    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(mensaje);
        }, 300);
    }, 4000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
