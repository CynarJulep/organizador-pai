// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const { db } = require('./config/database');

// Importar servicios
const whatsappService = require('./services/whatsappService');

// Importar rutas
const authRoutes = require('./routes/auth');
const operadorRoutes = require('./routes/operador');
const supervisorRoutes = require('./routes/supervisor');
const areasRoutes = require('./routes/areas');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN DE MIDDLEWARES
// ============================================

// Parsear JSON y URL-encoded
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'cambiar-este-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        httpOnly: true,
        secure: false // Cambiar a true si usas HTTPS
    }
}));

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Servir archivos subidos (PDFs) - solo para usuarios autenticados
app.use('/uploads', (req, res, next) => {
    if (req.session && req.session.userId) {
        express.static(path.join(__dirname, '../uploads'))(req, res, next);
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
});

// Log de todas las peticiones (útil para debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({
        mensaje: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        whatsapp_conectado: whatsappService.estaConectado()
    });
});

// Ruta de estado del servidor
app.get('/api/status', (req, res) => {
    res.json({
        servidor: 'online',
        database: 'conectada',
        whatsapp: whatsappService.estaConectado() ? 'conectado' : 'desconectado',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Importar y usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/operador', operadorRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/areas', areasRoutes);

// ============================================
// RUTA PRINCIPAL - Redirigir a login
// ============================================
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        // Si ya está logueado, redirigir según su rol
        const usuario = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(req.session.userId);
        if (usuario) {
            if (usuario.rol === 'operador') {
                res.redirect('/operador.html');
            } else if (usuario.rol === 'supervisor' || usuario.rol === 'admin') {
                res.redirect('/supervisor.html');
            }
        } else {
            res.redirect('/index.html');
        }
    } else {
        res.redirect('/index.html');
    }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Inicializar WhatsApp
whatsappService.inicializar();

// Iniciar servidor Express
const server = app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 Servidor PAI iniciado correctamente`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-AR')}`);
    console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Usuarios de prueba creados:');
    console.log('  👤 Admin:      username: admin       password: admin123');
    console.log('  👤 Operador:   username: operador1   password: operador123');
    console.log('  👤 Supervisor: username: supervisor1 password: supervisor123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambiar contraseñas en producción');
    console.log('');
    console.log('📱 Esperando conexión de WhatsApp...');
    console.log('   Si es la primera vez, escanea el código QR que aparecerá abajo');
    console.log('='.repeat(60));
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n\nCerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        require('./config/database').cerrarDB();
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\nCerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado');
        require('./config/database').cerrarDB();
        process.exit(0);
    });
});

module.exports = app;
