const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Ruta de la base de datos
const DB_PATH = path.join(__dirname, '../../database/pai.db');

// Crear conexión a la base de datos
const db = new Database(DB_PATH, { verbose: console.log });

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

/**
 * Inicializa la base de datos creando las tablas necesarias
 */
function inicializarDB() {
    console.log('Inicializando base de datos...');

    // Crear tabla de usuarios
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL CHECK(rol IN ('operador', 'supervisor', 'admin')),
            nombre_completo TEXT,
            activo BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Crear tabla de áreas
    db.exec(`
        CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            telefono_whatsapp TEXT NOT NULL,
            activo BOOLEAN DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Crear tabla de reclamos
    db.exec(`
        CREATE TABLE IF NOT EXISTS reclamos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            solicitud_nro TEXT UNIQUE NOT NULL,
            tipo TEXT,
            subtipo TEXT,
            ubicacion TEXT,
            distrito TEXT,
            vecinal TEXT,
            area_destino TEXT,
            descripcion TEXT,
            prioridad TEXT,
            fecha_reclamo TEXT,
            solicitante TEXT,
            telefono TEXT,
            email TEXT,
            pdf_path TEXT,
            pdf_nombre_original TEXT,
            estado TEXT DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
            operador_id INTEGER,
            supervisor_id INTEGER,
            fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_revision DATETIME,
            observaciones TEXT,
            mensaje_whatsapp_enviado BOOLEAN DEFAULT 0,
            fecha_envio_whatsapp DATETIME,
            FOREIGN KEY (operador_id) REFERENCES usuarios(id),
            FOREIGN KEY (supervisor_id) REFERENCES usuarios(id)
        )
    `);

    // Crear índices para mejorar el rendimiento
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_reclamos_estado ON reclamos(estado);
        CREATE INDEX IF NOT EXISTS idx_reclamos_fecha_carga ON reclamos(fecha_carga);
        CREATE INDEX IF NOT EXISTS idx_reclamos_operador ON reclamos(operador_id);
        CREATE INDEX IF NOT EXISTS idx_reclamos_area ON reclamos(area_destino);
    `);

    console.log('Tablas creadas correctamente');

    // Crear usuario administrador por defecto si no existe
    crearUsuarioAdminPorDefecto();

    // Crear algunas áreas de ejemplo
    crearAreasPorDefecto();
}

/**
 * Crea un usuario administrador por defecto
 */
function crearUsuarioAdminPorDefecto() {
    const checkAdmin = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('admin');

    if (!checkAdmin) {
        const passwordHash = bcrypt.hashSync('admin123', 10);
        const stmt = db.prepare(`
            INSERT INTO usuarios (username, password, rol, nombre_completo)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run('admin', passwordHash, 'admin', 'Administrador');
        console.log('✓ Usuario administrador creado (username: admin, password: admin123)');
        console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer inicio de sesión');
    }

    // Crear usuario operador de ejemplo
    const checkOperador = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('operador1');

    if (!checkOperador) {
        const passwordHash = bcrypt.hashSync('operador123', 10);
        const stmt = db.prepare(`
            INSERT INTO usuarios (username, password, rol, nombre_completo)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run('operador1', passwordHash, 'operador', 'Operador Ejemplo');
        console.log('✓ Usuario operador creado (username: operador1, password: operador123)');
    }

    // Crear usuario supervisor de ejemplo
    const checkSupervisor = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('supervisor1');

    if (!checkSupervisor) {
        const passwordHash = bcrypt.hashSync('supervisor123', 10);
        const stmt = db.prepare(`
            INSERT INTO usuarios (username, password, rol, nombre_completo)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run('supervisor1', passwordHash, 'supervisor', 'Supervisor Ejemplo');
        console.log('✓ Usuario supervisor creado (username: supervisor1, password: supervisor123)');
    }
}

/**
 * Crea áreas de ejemplo
 */
function crearAreasPorDefecto() {
    const checkArea = db.prepare('SELECT id FROM areas WHERE nombre = ?').get('ALUMBRADO PÚBLICO');

    if (!checkArea) {
        const stmt = db.prepare(`
            INSERT INTO areas (nombre, telefono_whatsapp)
            VALUES (?, ?)
        `);

        // Área de ejemplo - CAMBIAR ESTOS NÚMEROS POR LOS REALES
        stmt.run('ALUMBRADO PÚBLICO', '543424000000');
        console.log('✓ Área de ejemplo creada: ALUMBRADO PÚBLICO');
        console.log('⚠️  IMPORTANTE: Configurar los números de WhatsApp reales en la sección de Áreas');
    }
}

/**
 * Cierra la conexión a la base de datos
 */
function cerrarDB() {
    db.close();
    console.log('Conexión a la base de datos cerrada');
}

// Inicializar la base de datos al cargar el módulo
inicializarDB();

// Exportar la instancia de la base de datos y funciones útiles
module.exports = {
    db,
    cerrarDB,
    inicializarDB
};
