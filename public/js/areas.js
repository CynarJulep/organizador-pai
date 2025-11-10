// Event listeners
document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
document.getElementById('btnVolver').addEventListener('click', () => {
    window.location.href = '/supervisor.html';
});

document.getElementById('formNuevaArea').addEventListener('submit', crearArea);
document.getElementById('formEditarArea').addEventListener('submit', actualizarArea);
document.getElementById('modalClose').addEventListener('click', cerrarModal);
document.getElementById('btnCancelarEdit').addEventListener('click', cerrarModal);

// Cargar áreas al inicio
cargarAreas();

/**
 * Cierra la sesión
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
 * Carga todas las áreas
 */
async function cargarAreas() {
    try {
        const response = await fetch('/api/areas');
        const data = await response.json();

        const tbody = document.getElementById('areasBody');

        if (!data.exito || data.areas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div class="icon">📋</div>
                        <div>No hay áreas configuradas todavía</div>
                        <div style="color: #64748b; font-size: 0.9rem; margin-top: 10px;">
                            Agrega la primera área usando el formulario de arriba
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Generar filas de la tabla
        tbody.innerHTML = data.areas.map(area => `
            <tr>
                <td><strong>${area.nombre}</strong></td>
                <td>${formatearTelefono(area.telefono_whatsapp)}</td>
                <td>
                    <span class="badge-status ${area.activo ? 'badge-aprobado' : 'badge-rechazado'}">
                        ${area.activo ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                </td>
                <td>${formatearFecha(area.fecha_creacion)}</td>
                <td>
                    <div class="btn-group">
                        <button
                            class="btn btn-primary"
                            style="padding: 6px 12px; font-size: 0.85rem;"
                            onclick="abrirModalEditar(${area.id})">
                            Editar
                        </button>
                        <button
                            class="btn ${area.activo ? 'btn-secondary' : 'btn-success'}"
                            style="padding: 6px 12px; font-size: 0.85rem;"
                            onclick="toggleArea(${area.id}, ${area.activo})">
                            ${area.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                            class="btn btn-danger"
                            style="padding: 6px 12px; font-size: 0.85rem;"
                            onclick="eliminarArea(${area.id}, '${area.nombre}')">
                            Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar áreas:', error);
        document.getElementById('areasBody').innerHTML = `
            <tr>
                <td colspan="5" class="error-message">
                    Error al cargar las áreas
                </td>
            </tr>
        `;
    }
}

/**
 * Crea una nueva área
 */
async function crearArea(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreArea').value.trim().toUpperCase();
    const telefono = document.getElementById('telefonoArea').value.trim();

    // Validar que solo contenga números
    if (!/^\d+$/.test(telefono)) {
        mostrarMensaje('error', 'El teléfono debe contener solo números');
        return;
    }

    try {
        const response = await fetch('/api/areas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                telefono_whatsapp: telefono
            })
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', data.mensaje);
            document.getElementById('formNuevaArea').reset();
            cargarAreas();
        } else {
            mostrarMensaje('error', data.mensaje || 'Error al crear el área');
        }

    } catch (error) {
        console.error('Error al crear área:', error);
        mostrarMensaje('error', 'Error de conexión al crear el área');
    }
}

/**
 * Abre el modal para editar un área
 */
async function abrirModalEditar(id) {
    try {
        const response = await fetch(`/api/areas/${id}`);
        const data = await response.json();

        if (!data.exito) {
            mostrarMensaje('error', 'Error al cargar el área');
            return;
        }

        // Llenar formulario
        document.getElementById('editId').value = data.area.id;
        document.getElementById('editNombre').value = data.area.nombre;
        document.getElementById('editTelefono').value = data.area.telefono_whatsapp;
        document.getElementById('editActivo').checked = data.area.activo;

        // Mostrar modal
        document.getElementById('modalEditar').classList.add('active');

    } catch (error) {
        console.error('Error al cargar área:', error);
        mostrarMensaje('error', 'Error al cargar el área');
    }
}

/**
 * Actualiza un área existente
 */
async function actualizarArea(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const nombre = document.getElementById('editNombre').value.trim().toUpperCase();
    const telefono = document.getElementById('editTelefono').value.trim();
    const activo = document.getElementById('editActivo').checked;

    // Validar teléfono
    if (!/^\d+$/.test(telefono)) {
        mostrarMensaje('error', 'El teléfono debe contener solo números');
        return;
    }

    try {
        const response = await fetch(`/api/areas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                telefono_whatsapp: telefono,
                activo
            })
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', data.mensaje);
            cerrarModal();
            cargarAreas();
        } else {
            mostrarMensaje('error', data.mensaje || 'Error al actualizar el área');
        }

    } catch (error) {
        console.error('Error al actualizar área:', error);
        mostrarMensaje('error', 'Error de conexión al actualizar el área');
    }
}

/**
 * Activa o desactiva un área
 */
async function toggleArea(id, activoActual) {
    const accion = activoActual ? 'desactivar' : 'activar';

    if (!confirm(`¿Estás seguro de ${accion} esta área?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/areas/${id}/toggle`, {
            method: 'PATCH'
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', data.mensaje);
            cargarAreas();
        } else {
            mostrarMensaje('error', data.mensaje || `Error al ${accion} el área`);
        }

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        mostrarMensaje('error', 'Error de conexión');
    }
}

/**
 * Elimina un área
 */
async function eliminarArea(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar el área "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/areas/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok && data.exito) {
            mostrarMensaje('success', data.mensaje);
            cargarAreas();
        } else {
            mostrarMensaje('error', data.mensaje || 'Error al eliminar el área');
        }

    } catch (error) {
        console.error('Error al eliminar área:', error);
        mostrarMensaje('error', 'Error de conexión al eliminar el área');
    }
}

/**
 * Cierra el modal
 */
function cerrarModal() {
    document.getElementById('modalEditar').classList.remove('active');
}

/**
 * Formatea un número de teléfono para mostrarlo mejor
 */
function formatearTelefono(telefono) {
    if (!telefono) return '-';

    // Si tiene más de 10 dígitos, asume formato internacional
    if (telefono.length > 10) {
        // Ejemplo: 543424123456 -> +54 342 4123456
        const pais = telefono.slice(0, 2);
        const area = telefono.slice(2, 5);
        const numero = telefono.slice(5);
        return `+${pais} ${area} ${numero}`;
    }

    return telefono;
}

/**
 * Formatea una fecha
 */
function formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Muestra un mensaje temporal
 */
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
    }, 4000);
}

// Estilos de animación
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

// Hacer funciones globales para que funcionen desde el HTML
window.abrirModalEditar = abrirModalEditar;
window.toggleArea = toggleArea;
window.eliminarArea = eliminarArea;
