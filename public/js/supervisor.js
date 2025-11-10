// Verificar autenticación al cargar
verificarAutenticacion();

// Variables globales
let reclamoActual = null;

// Event listeners
document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
document.getElementById('btnAreas').addEventListener('click', () => {
    window.location.href = '/areas.html';
});

// Modal
document.getElementById('modalClose').addEventListener('click', cerrarModal);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
document.getElementById('btnAprobar').addEventListener('click', aprobarReclamo);
document.getElementById('btnRechazar').addEventListener('click', rechazarReclamo);

// Cargar datos iniciales
cargarEstadisticas();
cargarReclamosPendientes();

// Recargar cada 30 segundos
setInterval(cargarReclamosPendientes, 30000);
setInterval(cargarEstadisticas, 30000);

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

        // Verificar que sea supervisor o admin
        if (data.usuario.rol !== 'supervisor' && data.usuario.rol !== 'admin') {
            window.location.href = '/operador.html';
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
 * Cierra la sesión del usuario
 */
async function cerrarSesion() {
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
}

/**
 * Carga las estadísticas generales
 */
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/supervisor/estadisticas');
        const data = await response.json();

        if (data.exito) {
            document.getElementById('statPendientes').textContent = data.estadisticas.pendientes;
            document.getElementById('statAprobados').textContent = data.estadisticas.aprobados;
            document.getElementById('statRechazados').textContent = data.estadisticas.rechazados;
            document.getElementById('statHoy').textContent = data.estadisticas.hoy;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Carga los reclamos pendientes
 */
async function cargarReclamosPendientes() {
    try {
        const response = await fetch('/api/supervisor/pendientes');
        const data = await response.json();

        const tbody = document.getElementById('reclamosBody');

        if (!data.exito || data.reclamos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <div class="icon">✅</div>
                        <div>No hay reclamos pendientes de aprobación</div>
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
                <td>${reclamo.operador_nombre || reclamo.operador_username || '-'}</td>
                <td>${formatearFecha(reclamo.fecha_carga)}</td>
                <td>
                    <button
                        class="btn btn-primary"
                        style="padding: 6px 12px; font-size: 0.85rem;"
                        onclick="verDetalleReclamo(${reclamo.id})">
                        Revisar
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar reclamos:', error);
        document.getElementById('reclamosBody').innerHTML = `
            <tr>
                <td colspan="8" class="error-message">
                    Error al cargar los reclamos
                </td>
            </tr>
        `;
    }
}

/**
 * Muestra el detalle de un reclamo en el modal
 */
async function verDetalleReclamo(id) {
    try {
        const response = await fetch(`/api/supervisor/reclamos/${id}`);
        const data = await response.json();

        if (!data.exito) {
            mostrarMensaje('error', 'Error al cargar el reclamo');
            return;
        }

        reclamoActual = data.reclamo;

        // Llenar el modal con los datos
        document.getElementById('reclamoDetalle').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3 style="color: #2563eb; margin-bottom: 15px;">Información del Reclamo</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div>
                            <strong>Solicitud Nro:</strong> ${reclamoActual.solicitud_nro}
                        </div>
                        <div>
                            <strong>Tipo:</strong> ${reclamoActual.tipo || '-'}
                        </div>
                        <div>
                            <strong>Subtipo:</strong> ${reclamoActual.subtipo || '-'}
                        </div>
                        <div>
                            <strong>Ubicación:</strong> ${reclamoActual.ubicacion || '-'}
                        </div>
                        ${reclamoActual.distrito ? `<div><strong>Distrito:</strong> ${reclamoActual.distrito}</div>` : ''}
                        ${reclamoActual.vecinal ? `<div><strong>Vecinal:</strong> ${reclamoActual.vecinal}</div>` : ''}
                        <div>
                            <strong>Área Destino:</strong> ${reclamoActual.area_destino || '-'}
                        </div>
                        <div>
                            <strong>Prioridad:</strong>
                            <span class="badge-prioridad ${getBadgePrioridadClass(reclamoActual.prioridad)}">
                                ${reclamoActual.prioridad || 'NORMAL'}
                            </span>
                        </div>
                        <div>
                            <strong>Fecha Reclamo:</strong> ${reclamoActual.fecha_reclamo || '-'}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style="color: #2563eb; margin-bottom: 15px;">Solicitante</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div>
                            <strong>Nombre:</strong> ${reclamoActual.solicitante || '-'}
                        </div>
                        ${reclamoActual.telefono ? `<div><strong>Teléfono:</strong> ${reclamoActual.telefono}</div>` : ''}
                        ${reclamoActual.email ? `<div><strong>Email:</strong> ${reclamoActual.email}</div>` : ''}
                    </div>

                    <h3 style="color: #2563eb; margin: 20px 0 15px;">Cargado por</h3>
                    <div>
                        <strong>Operador:</strong> ${reclamoActual.operador_nombre || reclamoActual.operador_username || '-'}
                        <br>
                        <strong>Fecha de carga:</strong> ${formatearFecha(reclamoActual.fecha_carga)}
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h3 style="color: #2563eb; margin-bottom: 10px;">Descripción</h3>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
                    ${reclamoActual.descripcion || 'Sin descripción'}
                </div>
            </div>
        `;

        // Cargar PDF en el iframe
        document.getElementById('pdfViewer').src = `/uploads/${reclamoActual.pdf_path}`;

        // Limpiar observaciones
        document.getElementById('observaciones').value = '';

        // Mostrar modal
        document.getElementById('modalReclamo').classList.add('active');

    } catch (error) {
        console.error('Error al cargar detalle:', error);
        mostrarMensaje('error', 'Error al cargar el detalle del reclamo');
    }
}

/**
 * Cierra el modal
 */
function cerrarModal() {
    document.getElementById('modalReclamo').classList.remove('active');
    reclamoActual = null;
}

/**
 * Aprueba el reclamo actual
 */
async function aprobarReclamo() {
    if (!reclamoActual) return;

    if (!confirm(`¿Estás seguro de aprobar el reclamo ${reclamoActual.solicitud_nro}?\n\nSe enviará automáticamente por WhatsApp al área ${reclamoActual.area_destino}.`)) {
        return;
    }

    const observaciones = document.getElementById('observaciones').value.trim();

    // Deshabilitar botones
    document.getElementById('btnAprobar').disabled = true;
    document.getElementById('btnRechazar').disabled = true;
    document.getElementById('btnAprobar').textContent = 'Aprobando y enviando...';

    try {
        const response = await fetch(`/api/supervisor/reclamos/${reclamoActual.id}/aprobar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ observaciones })
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', data.mensaje || 'Reclamo aprobado y enviado por WhatsApp');
            cerrarModal();
            cargarReclamosPendientes();
            cargarEstadisticas();
        } else {
            mostrarMensaje('error', data.mensaje || 'Error al aprobar el reclamo');
        }

    } catch (error) {
        console.error('Error al aprobar:', error);
        mostrarMensaje('error', 'Error de conexión al aprobar el reclamo');
    } finally {
        document.getElementById('btnAprobar').disabled = false;
        document.getElementById('btnRechazar').disabled = false;
        document.getElementById('btnAprobar').textContent = '✓ Aprobar y Enviar por WhatsApp';
    }
}

/**
 * Rechaza el reclamo actual
 */
async function rechazarReclamo() {
    if (!reclamoActual) return;

    const observaciones = document.getElementById('observaciones').value.trim();

    if (!observaciones) {
        alert('Por favor ingresa un motivo de rechazo en las observaciones');
        return;
    }

    if (!confirm(`¿Estás seguro de rechazar el reclamo ${reclamoActual.solicitud_nro}?`)) {
        return;
    }

    // Deshabilitar botones
    document.getElementById('btnAprobar').disabled = true;
    document.getElementById('btnRechazar').disabled = true;
    document.getElementById('btnRechazar').textContent = 'Rechazando...';

    try {
        const response = await fetch(`/api/supervisor/reclamos/${reclamoActual.id}/rechazar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ observaciones })
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', 'Reclamo rechazado');
            cerrarModal();
            cargarReclamosPendientes();
            cargarEstadisticas();
        } else {
            mostrarMensaje('error', data.mensaje || 'Error al rechazar el reclamo');
        }

    } catch (error) {
        console.error('Error al rechazar:', error);
        mostrarMensaje('error', 'Error de conexión al rechazar el reclamo');
    } finally {
        document.getElementById('btnAprobar').disabled = false;
        document.getElementById('btnRechazar').disabled = false;
        document.getElementById('btnRechazar').textContent = '✗ Rechazar';
    }
}

// Funciones auxiliares (las mismas que en operador.js)

function getBadgePrioridadClass(prioridad) {
    if (!prioridad) return 'badge-normal';
    const p = prioridad.toUpperCase();
    if (p.includes('CRÍTICA') || p.includes('CRITICA')) return 'badge-critica';
    if (p.includes('ALTA')) return 'badge-alta';
    return 'badge-normal';
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diff = ahora - fecha;

    if (diff < 86400000 && fecha.getDate() === ahora.getDate()) {
        return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }

    if (diff < 604800000) {
        const dias = Math.floor(diff / 86400000);
        return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
    }

    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function mostrarMensaje(tipo, texto) {
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
        max-width: 400px;
    `;

    document.body.appendChild(mensaje);

    setTimeout(() => {
        mensaje.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (mensaje.parentNode) {
                document.body.removeChild(mensaje);
            }
        }, 300);
    }, 5000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Hacer la función global para que funcione desde el HTML
window.verDetalleReclamo = verDetalleReclamo;
