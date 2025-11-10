const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { estaAutenticado } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validar datos
    if (!username || !password) {
        return res.status(400).json({
            error: 'Datos incompletos',
            mensaje: 'Debes proporcionar usuario y contraseña'
        });
    }

    try {
        // Buscar usuario en la base de datos
        const usuario = db.prepare(`
            SELECT id, username, password, rol, nombre_completo, activo
            FROM usuarios
            WHERE username = ?
        `).get(username);

        // Verificar si existe el usuario
        if (!usuario) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(403).json({
                error: 'Usuario desactivado',
                mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }

        // Verificar contraseña
        const passwordValida = bcrypt.compareSync(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({
                error: 'Credenciales inválidas',
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        // Crear sesión
        req.session.userId = usuario.id;
        req.session.username = usuario.username;
        req.session.rol = usuario.rol;
        req.session.nombreCompleto = usuario.nombre_completo;

        // Log de inicio de sesión
        console.log(`✓ Usuario autenticado: ${usuario.username} (${usuario.rol})`);

        // Responder con datos del usuario (sin la contraseña)
        res.json({
            exito: true,
            mensaje: 'Sesión iniciada correctamente',
            usuario: {
                id: usuario.id,
                username: usuario.username,
                rol: usuario.rol,
                nombreCompleto: usuario.nombre_completo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al procesar tu solicitud'
        });
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', estaAutenticado, (req, res) => {
    const username = req.session.username;

    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({
                error: 'Error al cerrar sesión'
            });
        }

        console.log(`✓ Sesión cerrada: ${username}`);

        res.json({
            exito: true,
            mensaje: 'Sesión cerrada correctamente'
        });
    });
});

/**
 * GET /api/auth/verificar
 * Verificar si la sesión está activa
 */
router.get('/verificar', (req, res) => {
    if (req.session && req.session.userId) {
        // Obtener datos actualizados del usuario
        const usuario = db.prepare(`
            SELECT id, username, rol, nombre_completo, activo
            FROM usuarios
            WHERE id = ?
        `).get(req.session.userId);

        if (!usuario || !usuario.activo) {
            // Usuario no existe o está desactivado
            req.session.destroy();
            return res.json({
                autenticado: false
            });
        }

        res.json({
            autenticado: true,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                rol: usuario.rol,
                nombreCompleto: usuario.nombre_completo
            }
        });
    } else {
        res.json({
            autenticado: false
        });
    }
});

/**
 * POST /api/auth/cambiar-password
 * Cambiar contraseña del usuario actual
 */
router.post('/cambiar-password', estaAutenticado, (req, res) => {
    const { passwordActual, passwordNueva } = req.body;

    // Validar datos
    if (!passwordActual || !passwordNueva) {
        return res.status(400).json({
            error: 'Datos incompletos',
            mensaje: 'Debes proporcionar la contraseña actual y la nueva'
        });
    }

    if (passwordNueva.length < 6) {
        return res.status(400).json({
            error: 'Contraseña débil',
            mensaje: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
    }

    try {
        // Obtener usuario actual
        const usuario = db.prepare(`
            SELECT id, password
            FROM usuarios
            WHERE id = ?
        `).get(req.session.userId);

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordValida = bcrypt.compareSync(passwordActual, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({
                error: 'Contraseña incorrecta',
                mensaje: 'La contraseña actual no es correcta'
            });
        }

        // Hashear nueva contraseña
        const passwordHash = bcrypt.hashSync(passwordNueva, 10);

        // Actualizar contraseña
        db.prepare(`
            UPDATE usuarios
            SET password = ?
            WHERE id = ?
        `).run(passwordHash, req.session.userId);

        console.log(`✓ Contraseña cambiada: usuario ${req.session.username}`);

        res.json({
            exito: true,
            mensaje: 'Contraseña cambiada correctamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error del servidor',
            mensaje: 'Ocurrió un error al cambiar la contraseña'
        });
    }
});

module.exports = router;
