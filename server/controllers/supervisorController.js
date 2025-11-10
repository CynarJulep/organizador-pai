const { db } = require('../config/database');
const whatsappService = require('../services/whatsappService');
const path = require('path');

/**
 * Obtiene todos los reclamos pendientes
 */
function obtenerReclamosPendientes(req, res) {
    try {
        const reclamos = db.prepare(`
            SELECT
                r.id, r.solicitud_nro, r.tipo, r.subtipo, r.ubicacion,
                r.distrito, r.vecinal, r.area_destino, r.descripcion,
                r.prioridad, r.fecha_reclamo, r.solicitante, r.telefono,
                r.pdf_path, r.fecha_carga,
                u.username as operador_username,
                u.nombre_completo as operador_nombre
            FROM reclamos r
            LEFT JOIN usuarios u ON r.operador_id = u.id
            WHERE r.estado = 'PENDIENTE'
            ORDER BY r.fecha_carga DESC
        `).all();

        res.json({
            exito: true,
            reclamos
        });

    } catch (error) {
        console.error('Error al obtener reclamos pendientes:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'No se pudieron obtener los reclamos pendientes'
        });
    }
}

/**
 * Obtiene un reclamo específico por ID
 */
function obtenerReclamo(req, res) {
    try {
        const { id } = req.params;

        const reclamo = db.prepare(`
            SELECT
                r.*,
                u.username as operador_username,
                u.nombre_completo as operador_nombre
            FROM reclamos r
            LEFT JOIN usuarios u ON r.operador_id = u.id
            WHERE r.id = ?
        `).get(id);

        if (!reclamo) {
            return res.status(404).json({
                error: 'Reclamo no encontrado'
            });
        }

        res.json({
            exito: true,
            reclamo
        });

    } catch (error) {
        console.error('Error al obtener reclamo:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
}

/**
 * Aprueba un reclamo y lo envía por WhatsApp
 */
async function aprobarReclamo(req, res) {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;

        // Obtener reclamo
        const reclamo = db.prepare(`
            SELECT * FROM reclamos WHERE id = ?
        `).get(id);

        if (!reclamo) {
            return res.status(404).json({
                error: 'Reclamo no encontrado'
            });
        }

        if (reclamo.estado !== 'PENDIENTE') {
            return res.status(400).json({
                error: 'Reclamo ya fue procesado',
                mensaje: `Este reclamo ya fue ${reclamo.estado.toLowerCase()}`
            });
        }

        // Buscar el área y su número de WhatsApp
        const area = db.prepare(`
            SELECT telefono_whatsapp, activo
            FROM areas
            WHERE nombre = ? AND activo = 1
        `).get(reclamo.area_destino);

        if (!area) {
            return res.status(400).json({
                error: 'Área no configurada',
                mensaje: `No se encontró configuración de WhatsApp para el área "${reclamo.area_destino}". Por favor, configúrala primero.`
            });
        }

        // Verificar que WhatsApp esté conectado
        if (!whatsappService.estaConectado()) {
            return res.status(503).json({
                error: 'WhatsApp no conectado',
                mensaje: 'WhatsApp no está conectado. Por favor, escanea el código QR en la consola del servidor.'
            });
        }

        // Actualizar estado del reclamo
        db.prepare(`
            UPDATE reclamos
            SET estado = 'APROBADO',
                supervisor_id = ?,
                fecha_revision = CURRENT_TIMESTAMP,
                observaciones = ?
            WHERE id = ?
        `).run(req.usuario.id, observaciones || null, id);

        console.log(`✓ Reclamo ${reclamo.solicitud_nro} aprobado por ${req.usuario.username}`);

        // Ruta completa al PDF
        const rutaPDF = path.join(__dirname, '../../uploads', reclamo.pdf_path);

        try {
            // Enviar por WhatsApp
            const resultadoEnvio = await whatsappService.enviarReclamoPAI(
                reclamo,
                area.telefono_whatsapp,
                rutaPDF
            );

            // Marcar como enviado
            db.prepare(`
                UPDATE reclamos
                SET mensaje_whatsapp_enviado = 1,
                    fecha_envio_whatsapp = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(id);

            console.log(`✓ Reclamo ${reclamo.solicitud_nro} enviado por WhatsApp a ${area.telefono_whatsapp}`);

            res.json({
                exito: true,
                mensaje: 'Reclamo aprobado y enviado por WhatsApp',
                resultadoEnvio
            });

        } catch (errorWhatsApp) {
            console.error('Error al enviar por WhatsApp:', errorWhatsApp);

            // El reclamo ya fue aprobado, pero falló el envío
            res.json({
                exito: true,
                advertencia: true,
                mensaje: 'Reclamo aprobado pero no se pudo enviar por WhatsApp',
                error: errorWhatsApp.message
            });
        }

    } catch (error) {
        console.error('Error al aprobar reclamo:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al aprobar el reclamo',
            detalle: error.message
        });
    }
}

/**
 * Rechaza un reclamo
 */
function rechazarReclamo(req, res) {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;

        // Obtener reclamo
        const reclamo = db.prepare(`
            SELECT * FROM reclamos WHERE id = ?
        `).get(id);

        if (!reclamo) {
            return res.status(404).json({
                error: 'Reclamo no encontrado'
            });
        }

        if (reclamo.estado !== 'PENDIENTE') {
            return res.status(400).json({
                error: 'Reclamo ya fue procesado',
                mensaje: `Este reclamo ya fue ${reclamo.estado.toLowerCase()}`
            });
        }

        // Actualizar estado del reclamo
        db.prepare(`
            UPDATE reclamos
            SET estado = 'RECHAZADO',
                supervisor_id = ?,
                fecha_revision = CURRENT_TIMESTAMP,
                observaciones = ?
            WHERE id = ?
        `).run(req.usuario.id, observaciones || 'Rechazado', id);

        console.log(`✓ Reclamo ${reclamo.solicitud_nro} rechazado por ${req.usuario.username}`);

        res.json({
            exito: true,
            mensaje: 'Reclamo rechazado'
        });

    } catch (error) {
        console.error('Error al rechazar reclamo:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al rechazar el reclamo'
        });
    }
}

/**
 * Obtiene estadísticas generales
 */
function obtenerEstadisticas(req, res) {
    try {
        // Estadísticas por estado
        const porEstado = db.prepare(`
            SELECT
                estado,
                COUNT(*) as cantidad
            FROM reclamos
            GROUP BY estado
        `).all();

        // Estadísticas por área
        const porArea = db.prepare(`
            SELECT
                area_destino,
                COUNT(*) as cantidad
            FROM reclamos
            WHERE area_destino IS NOT NULL
            GROUP BY area_destino
            ORDER BY cantidad DESC
            LIMIT 10
        `).all();

        // Reclamos de hoy
        const reclamosHoy = db.prepare(`
            SELECT COUNT(*) as cantidad
            FROM reclamos
            WHERE DATE(fecha_carga) = DATE('now')
        `).get();

        // Formatear estadísticas por estado
        const estadisticas = {
            pendientes: 0,
            aprobados: 0,
            rechazados: 0,
            total: 0,
            hoy: reclamosHoy.cantidad,
            porArea: porArea
        };

        porEstado.forEach(stat => {
            if (stat.estado === 'PENDIENTE') estadisticas.pendientes = stat.cantidad;
            if (stat.estado === 'APROBADO') estadisticas.aprobados = stat.cantidad;
            if (stat.estado === 'RECHAZADO') estadisticas.rechazados = stat.cantidad;
            estadisticas.total += stat.cantidad;
        });

        res.json({
            exito: true,
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
}

/**
 * Obtiene todos los reclamos (con filtros)
 */
function obtenerTodosLosReclamos(req, res) {
    try {
        const { estado, area, desde, hasta } = req.query;

        let sql = `
            SELECT
                r.id, r.solicitud_nro, r.tipo, r.subtipo, r.ubicacion,
                r.area_destino, r.prioridad, r.estado, r.fecha_carga,
                r.fecha_revision, r.mensaje_whatsapp_enviado,
                u.username as operador_username
            FROM reclamos r
            LEFT JOIN usuarios u ON r.operador_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (estado) {
            sql += ` AND r.estado = ?`;
            params.push(estado);
        }

        if (area) {
            sql += ` AND r.area_destino = ?`;
            params.push(area);
        }

        if (desde) {
            sql += ` AND DATE(r.fecha_carga) >= DATE(?)`;
            params.push(desde);
        }

        if (hasta) {
            sql += ` AND DATE(r.fecha_carga) <= DATE(?)`;
            params.push(hasta);
        }

        sql += ` ORDER BY r.fecha_carga DESC LIMIT 1000`;

        const reclamos = db.prepare(sql).all(...params);

        res.json({
            exito: true,
            reclamos
        });

    } catch (error) {
        console.error('Error al obtener reclamos:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
}

module.exports = {
    obtenerReclamosPendientes,
    obtenerReclamo,
    aprobarReclamo,
    rechazarReclamo,
    obtenerEstadisticas,
    obtenerTodosLosReclamos
};
