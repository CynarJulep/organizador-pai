const express = require('express');
const { db } = require('../config/database');
const { esSupervisor } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación de supervisor
router.use(esSupervisor);

/**
 * GET /api/areas
 * Obtener todas las áreas
 */
router.get('/', (req, res) => {
    try {
        const areas = db.prepare(`
            SELECT id, nombre, telefono_whatsapp, activo, fecha_creacion, fecha_modificacion
            FROM areas
            ORDER BY nombre ASC
        `).all();

        res.json({
            exito: true,
            areas
        });

    } catch (error) {
        console.error('Error al obtener áreas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'No se pudieron obtener las áreas'
        });
    }
});

/**
 * GET /api/areas/:id
 * Obtener un área específica
 */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const area = db.prepare(`
            SELECT id, nombre, telefono_whatsapp, activo, fecha_creacion, fecha_modificacion
            FROM areas
            WHERE id = ?
        `).get(id);

        if (!area) {
            return res.status(404).json({
                error: 'Área no encontrada'
            });
        }

        res.json({
            exito: true,
            area
        });

    } catch (error) {
        console.error('Error al obtener área:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

/**
 * POST /api/areas
 * Crear una nueva área
 */
router.post('/', (req, res) => {
    try {
        const { nombre, telefono_whatsapp } = req.body;

        // Validar datos
        if (!nombre || !telefono_whatsapp) {
            return res.status(400).json({
                error: 'Datos incompletos',
                mensaje: 'Debes proporcionar nombre y teléfono de WhatsApp'
            });
        }

        // Validar formato de teléfono (solo números)
        if (!/^\d+$/.test(telefono_whatsapp)) {
            return res.status(400).json({
                error: 'Formato inválido',
                mensaje: 'El teléfono debe contener solo números (código país + código área + número)'
            });
        }

        // Verificar que no exista un área con el mismo nombre
        const existente = db.prepare('SELECT id FROM areas WHERE nombre = ?').get(nombre);

        if (existente) {
            return res.status(400).json({
                error: 'Área duplicada',
                mensaje: `Ya existe un área con el nombre "${nombre}"`
            });
        }

        // Insertar área
        const stmt = db.prepare(`
            INSERT INTO areas (nombre, telefono_whatsapp)
            VALUES (?, ?)
        `);

        const info = stmt.run(nombre.toUpperCase(), telefono_whatsapp);

        console.log(`✓ Área creada: ${nombre} - ${telefono_whatsapp}`);

        res.json({
            exito: true,
            mensaje: 'Área creada exitosamente',
            area: {
                id: info.lastInsertRowid,
                nombre: nombre.toUpperCase(),
                telefono_whatsapp,
                activo: 1
            }
        });

    } catch (error) {
        console.error('Error al crear área:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al crear el área'
        });
    }
});

/**
 * PUT /api/areas/:id
 * Actualizar un área existente
 */
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono_whatsapp, activo } = req.body;

        // Verificar que el área exista
        const areaExistente = db.prepare('SELECT id FROM areas WHERE id = ?').get(id);

        if (!areaExistente) {
            return res.status(404).json({
                error: 'Área no encontrada'
            });
        }

        // Validar datos
        if (!nombre || !telefono_whatsapp) {
            return res.status(400).json({
                error: 'Datos incompletos',
                mensaje: 'Debes proporcionar nombre y teléfono de WhatsApp'
            });
        }

        // Validar formato de teléfono
        if (!/^\d+$/.test(telefono_whatsapp)) {
            return res.status(400).json({
                error: 'Formato inválido',
                mensaje: 'El teléfono debe contener solo números'
            });
        }

        // Verificar que no haya otro área con el mismo nombre
        const duplicado = db.prepare('SELECT id FROM areas WHERE nombre = ? AND id != ?').get(nombre, id);

        if (duplicado) {
            return res.status(400).json({
                error: 'Área duplicada',
                mensaje: `Ya existe otra área con el nombre "${nombre}"`
            });
        }

        // Actualizar área
        const stmt = db.prepare(`
            UPDATE areas
            SET nombre = ?,
                telefono_whatsapp = ?,
                activo = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(nombre.toUpperCase(), telefono_whatsapp, activo ? 1 : 0, id);

        console.log(`✓ Área actualizada: ${nombre} - ${telefono_whatsapp}`);

        res.json({
            exito: true,
            mensaje: 'Área actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar área:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al actualizar el área'
        });
    }
});

/**
 * DELETE /api/areas/:id
 * Eliminar un área
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el área exista
        const area = db.prepare('SELECT nombre FROM areas WHERE id = ?').get(id);

        if (!area) {
            return res.status(404).json({
                error: 'Área no encontrada'
            });
        }

        // Verificar si hay reclamos asociados
        const reclamosAsociados = db.prepare('SELECT COUNT(*) as cantidad FROM reclamos WHERE area_destino = ?').get(area.nombre);

        if (reclamosAsociados.cantidad > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar',
                mensaje: `Esta área tiene ${reclamosAsociados.cantidad} reclamos asociados. Mejor desactívala en lugar de eliminarla.`
            });
        }

        // Eliminar área
        db.prepare('DELETE FROM areas WHERE id = ?').run(id);

        console.log(`✓ Área eliminada: ${area.nombre}`);

        res.json({
            exito: true,
            mensaje: 'Área eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar área:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al eliminar el área'
        });
    }
});

/**
 * PATCH /api/areas/:id/toggle
 * Activar/desactivar un área
 */
router.patch('/:id/toggle', (req, res) => {
    try {
        const { id } = req.params;

        // Obtener área actual
        const area = db.prepare('SELECT nombre, activo FROM areas WHERE id = ?').get(id);

        if (!area) {
            return res.status(404).json({
                error: 'Área no encontrada'
            });
        }

        // Cambiar estado
        const nuevoEstado = area.activo ? 0 : 1;

        db.prepare(`
            UPDATE areas
            SET activo = ?,
                fecha_modificacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nuevoEstado, id);

        console.log(`✓ Área ${area.nombre} ${nuevoEstado ? 'activada' : 'desactivada'}`);

        res.json({
            exito: true,
            mensaje: `Área ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            activo: nuevoEstado
        });

    } catch (error) {
        console.error('Error al cambiar estado del área:', error);
        res.status(500).json({
            error: 'Error del servidor'
        });
    }
});

module.exports = router;
