const express = require('express');
const { esSupervisor, agregarUsuario } = require('../middleware/auth');
const supervisorController = require('../controllers/supervisorController');

const router = express.Router();

// Todas las rutas requieren autenticación de supervisor
router.use(esSupervisor);
router.use(agregarUsuario);

/**
 * GET /api/supervisor/pendientes
 * Obtener reclamos pendientes de aprobación
 */
router.get('/pendientes', supervisorController.obtenerReclamosPendientes);

/**
 * GET /api/supervisor/reclamos
 * Obtener todos los reclamos (con filtros opcionales)
 */
router.get('/reclamos', supervisorController.obtenerTodosLosReclamos);

/**
 * GET /api/supervisor/reclamos/:id
 * Obtener un reclamo específico
 */
router.get('/reclamos/:id', supervisorController.obtenerReclamo);

/**
 * POST /api/supervisor/reclamos/:id/aprobar
 * Aprobar un reclamo y enviarlo por WhatsApp
 */
router.post('/reclamos/:id/aprobar', supervisorController.aprobarReclamo);

/**
 * POST /api/supervisor/reclamos/:id/rechazar
 * Rechazar un reclamo
 */
router.post('/reclamos/:id/rechazar', supervisorController.rechazarReclamo);

/**
 * GET /api/supervisor/estadisticas
 * Obtener estadísticas generales
 */
router.get('/estadisticas', supervisorController.obtenerEstadisticas);

module.exports = router;
