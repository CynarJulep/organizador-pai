const express = require('express');
const multer = require('multer');
const path = require('path');
const { esOperador, agregarUsuario } = require('../middleware/auth');
const reclamoController = require('../controllers/reclamoController');

const router = express.Router();

// Configurar multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        // Generar nombre único: timestamp_nombre-original
        const timestamp = Date.now();
        const nombreOriginal = file.originalname.replace(/\s+/g, '_');
        cb(null, `${timestamp}_${nombreOriginal}`);
    }
});

// Filtro para solo permitir PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 16777216 // 16MB por defecto
    }
});

// Todas las rutas requieren autenticación de operador
router.use(esOperador);
router.use(agregarUsuario);

/**
 * POST /api/operador/upload
 * Subir un PDF de reclamo
 */
router.post('/upload', upload.single('pdf'), reclamoController.cargarReclamo);

/**
 * GET /api/operador/reclamos
 * Obtener reclamos del operador actual
 */
router.get('/reclamos', reclamoController.obtenerMisReclamos);

/**
 * GET /api/operador/estadisticas
 * Obtener estadísticas del operador
 */
router.get('/estadisticas', reclamoController.obtenerEstadisticas);

// Manejador de errores de multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Archivo muy grande',
                mensaje: 'El archivo no puede superar los 16MB'
            });
        }
        return res.status(400).json({
            error: 'Error al subir archivo',
            mensaje: err.message
        });
    } else if (err) {
        return res.status(400).json({
            error: 'Error',
            mensaje: err.message
        });
    }
    next();
});

module.exports = router;
