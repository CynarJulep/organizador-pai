const { db } = require('../config/database');
const { procesarPDF } = require('../services/pdfParser');
const path = require('path');
const fs = require('fs');

/**
 * Carga un nuevo reclamo desde un PDF
 */
async function cargarReclamo(req, res) {
    try {
        // Verificar que se subió un archivo
        if (!req.file) {
            return res.status(400).json({
                error: 'No se subió ningún archivo',
                mensaje: 'Debes subir un archivo PDF'
            });
        }

        console.log('Archivo recibido:', req.file.filename);

        // Ruta completa del PDF
        const rutaPDF = path.join(__dirname, '../../uploads', req.file.filename);

        // Procesar PDF
        const resultado = await procesarPDF(rutaPDF);

        if (!resultado.exito) {
            return res.status(400).json({
                error: 'Error al procesar PDF',
                mensaje: 'No se pudieron extraer los datos del PDF',
                errores: resultado.errores,
                datos: resultado.datos // Enviar datos parciales si los hay
            });
        }

        const datos = resultado.datos;

        // Verificar si ya existe un reclamo con este número
        const reclamoExistente = db.prepare('SELECT id FROM reclamos WHERE solicitud_nro = ?').get(datos.solicitud_nro);

        if (reclamoExistente) {
            return res.status(400).json({
                error: 'Reclamo duplicado',
                mensaje: `Ya existe un reclamo con el número ${datos.solicitud_nro}`,
                datos
            });
        }

        // Insertar reclamo en la base de datos
        const stmt = db.prepare(`
            INSERT INTO reclamos (
                solicitud_nro, tipo, subtipo, ubicacion, distrito, vecinal,
                area_destino, descripcion, prioridad, fecha_reclamo,
                solicitante, telefono, email, pdf_path, pdf_nombre_original,
                estado, operador_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)
        `);

        const info = stmt.run(
            datos.solicitud_nro,
            datos.tipo,
            datos.subtipo,
            datos.ubicacion,
            datos.distrito,
            datos.vecinal,
            datos.area_destino,
            datos.descripcion,
            datos.prioridad,
            datos.fecha_reclamo,
            datos.solicitante,
            datos.telefono,
            datos.email,
            req.file.filename,
            req.file.originalname,
            req.usuario.id
        );

        console.log(`✓ Reclamo cargado: ${datos.solicitud_nro} por ${req.usuario.username}`);

        res.json({
            exito: true,
            mensaje: 'Reclamo cargado exitosamente',
            reclamo: {
                id: info.lastInsertRowid,
                ...datos,
                estado: 'PENDIENTE'
            }
        });

    } catch (error) {
        console.error('Error al cargar reclamo:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al procesar el reclamo',
            detalle: error.message
        });
    }
}

/**
 * Obtiene los reclamos del operador actual
 */
function obtenerMisReclamos(req, res) {
    try {
        const reclamos = db.prepare(`
            SELECT
                id, solicitud_nro, tipo, subtipo, ubicacion, area_destino,
                prioridad, estado, fecha_carga, fecha_revision
            FROM reclamos
            WHERE operador_id = ?
            ORDER BY fecha_carga DESC
        `).all(req.usuario.id);

        res.json({
            exito: true,
            reclamos
        });

    } catch (error) {
        console.error('Error al obtener reclamos:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'No se pudieron obtener los reclamos'
        });
    }
}

/**
 * Obtiene estadísticas del operador
 */
function obtenerEstadisticas(req, res) {
    try {
        // Contar reclamos por estado
        const stats = db.prepare(`
            SELECT
                estado,
                COUNT(*) as cantidad
            FROM reclamos
            WHERE operador_id = ?
            GROUP BY estado
        `).all(req.usuario.id);

        // Formatear estadísticas
        const estadisticas = {
            pendientes: 0,
            aprobados: 0,
            rechazados: 0,
            total: 0
        };

        stats.forEach(stat => {
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

module.exports = {
    cargarReclamo,
    obtenerMisReclamos,
    obtenerEstadisticas
};
