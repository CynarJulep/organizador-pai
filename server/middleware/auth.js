const { db } = require('../config/database');

/**
 * Middleware para verificar si el usuario está autenticado
 */
function estaAutenticado(req, res, next) {
    if (req.session && req.session.userId) {
        // Usuario autenticado, continuar
        next();
    } else {
        // No autenticado
        res.status(401).json({
            error: 'No autenticado',
            mensaje: 'Debes iniciar sesión para acceder a este recurso'
        });
    }
}

/**
 * Middleware para verificar si el usuario es operador
 */
function esOperador(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            error: 'No autenticado',
            mensaje: 'Debes iniciar sesión'
        });
    }

    // Obtener usuario de la base de datos
    const usuario = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(req.session.userId);

    if (!usuario) {
        return res.status(401).json({
            error: 'Usuario no encontrado'
        });
    }

    if (usuario.rol === 'operador' || usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: 'Acceso denegado',
            mensaje: 'No tienes permisos de operador'
        });
    }
}

/**
 * Middleware para verificar si el usuario es supervisor
 */
function esSupervisor(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            error: 'No autenticado',
            mensaje: 'Debes iniciar sesión'
        });
    }

    // Obtener usuario de la base de datos
    const usuario = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(req.session.userId);

    if (!usuario) {
        return res.status(401).json({
            error: 'Usuario no encontrado'
        });
    }

    if (usuario.rol === 'supervisor' || usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: 'Acceso denegado',
            mensaje: 'No tienes permisos de supervisor'
        });
    }
}

/**
 * Middleware para verificar si el usuario es admin
 */
function esAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            error: 'No autenticado',
            mensaje: 'Debes iniciar sesión'
        });
    }

    // Obtener usuario de la base de datos
    const usuario = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(req.session.userId);

    if (!usuario) {
        return res.status(401).json({
            error: 'Usuario no encontrado'
        });
    }

    if (usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: 'Acceso denegado',
            mensaje: 'No tienes permisos de administrador'
        });
    }
}

/**
 * Middleware para agregar información del usuario a la request
 */
function agregarUsuario(req, res, next) {
    if (req.session && req.session.userId) {
        const usuario = db.prepare(`
            SELECT id, username, rol, nombre_completo
            FROM usuarios
            WHERE id = ?
        `).get(req.session.userId);

        if (usuario) {
            req.usuario = usuario;
        }
    }
    next();
}

module.exports = {
    estaAutenticado,
    esOperador,
    esSupervisor,
    esAdmin,
    agregarUsuario
};
