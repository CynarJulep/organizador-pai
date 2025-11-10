const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

// Cliente de WhatsApp
let client = null;
let clienteConectado = false;
let clienteInicializado = false;

/**
 * Inicializa el cliente de WhatsApp
 */
function inicializar() {
    if (clienteInicializado) {
        console.log('⚠️  Cliente de WhatsApp ya inicializado');
        return;
    }

    console.log('Inicializando cliente de WhatsApp...');

    // Configurar cliente con autenticación local persistente
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: path.join(__dirname, '../../whatsapp-session')
        }),
        puppeteer: {
            headless: false, // Mostrar navegador (útil para debugging)
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Evento: Código QR generado
    client.on('qr', (qr) => {
        console.log('\n' + '='.repeat(60));
        console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
        console.log('='.repeat(60));
        console.log('');

        // Mostrar QR en la consola
        qrcode.generate(qr, { small: true });

        console.log('');
        console.log('Instrucciones:');
        console.log('1. Abre WhatsApp en tu teléfono');
        console.log('2. Ve a Menú → Dispositivos vinculados');
        console.log('3. Toca en "Vincular un dispositivo"');
        console.log('4. Escanea el código QR de arriba');
        console.log('='.repeat(60));
        console.log('');
    });

    // Evento: Cliente listo
    client.on('ready', () => {
        clienteConectado = true;
        console.log('\n' + '='.repeat(60));
        console.log('✅ WhatsApp conectado y listo');
        console.log('='.repeat(60));
        console.log('');

        // Obtener información del número conectado
        client.info.then((info) => {
            console.log(`📱 Número conectado: ${info.pushname} (${info.wid.user})`);
        }).catch((err) => {
            console.log('⚠️  No se pudo obtener información del número');
        });
    });

    // Evento: Autenticación exitosa
    client.on('authenticated', () => {
        console.log('✅ Autenticación exitosa');
    });

    // Evento: Fallo de autenticación
    client.on('auth_failure', (msg) => {
        console.error('❌ Error de autenticación:', msg);
        clienteConectado = false;
    });

    // Evento: Cliente desconectado
    client.on('disconnected', (reason) => {
        console.log('⚠️  WhatsApp desconectado. Razón:', reason);
        clienteConectado = false;
    });

    // Evento: Cargando (muestra progreso)
    client.on('loading_screen', (percent, message) => {
        console.log(`Cargando WhatsApp: ${percent}% - ${message}`);
    });

    // Inicializar cliente
    client.initialize().catch((err) => {
        console.error('❌ Error al inicializar WhatsApp:', err);
        clienteConectado = false;
    });

    clienteInicializado = true;
}

/**
 * Verifica si el cliente está conectado
 * @returns {boolean}
 */
function estaConectado() {
    return clienteConectado;
}

/**
 * Envía un mensaje de texto a un número
 * @param {string} numero - Número en formato: código país + código área + número (ej: 543424123456)
 * @param {string} mensaje - Mensaje a enviar
 * @returns {Promise<object>} Resultado del envío
 */
async function enviarMensaje(numero, mensaje) {
    if (!clienteConectado) {
        throw new Error('WhatsApp no está conectado');
    }

    try {
        // Formato del chat ID: numero@c.us
        const chatId = `${numero}@c.us`;

        // Enviar mensaje
        const result = await client.sendMessage(chatId, mensaje);

        console.log(`✅ Mensaje enviado a ${numero}`);
        return {
            exito: true,
            id: result.id.id,
            timestamp: result.timestamp
        };
    } catch (error) {
        console.error(`❌ Error al enviar mensaje a ${numero}:`, error.message);
        throw error;
    }
}

/**
 * Envía un mensaje con un archivo adjunto (PDF)
 * @param {string} numero - Número en formato: código país + código área + número
 * @param {string} mensaje - Mensaje que acompaña al archivo (caption)
 * @param {string} rutaArchivo - Ruta completa al archivo PDF
 * @returns {Promise<object>} Resultado del envío
 */
async function enviarMensajeConArchivo(numero, mensaje, rutaArchivo) {
    if (!clienteConectado) {
        throw new Error('WhatsApp no está conectado');
    }

    try {
        // Formato del chat ID: numero@c.us
        const chatId = `${numero}@c.us`;

        // Crear media desde archivo
        const media = MessageMedia.fromFilePath(rutaArchivo);

        // Enviar mensaje con archivo
        const result = await client.sendMessage(chatId, media, {
            caption: mensaje
        });

        console.log(`✅ Mensaje con archivo enviado a ${numero}`);
        return {
            exito: true,
            id: result.id.id,
            timestamp: result.timestamp
        };
    } catch (error) {
        console.error(`❌ Error al enviar mensaje con archivo a ${numero}:`, error.message);
        throw error;
    }
}

/**
 * Envía un reclamo PAI por WhatsApp al área correspondiente
 * @param {object} reclamo - Objeto con los datos del reclamo
 * @param {string} telefonoArea - Número de WhatsApp del área
 * @param {string} rutaPDF - Ruta al archivo PDF del reclamo
 * @returns {Promise<object>} Resultado del envío
 */
async function enviarReclamoPAI(reclamo, telefonoArea, rutaPDF) {
    // Formatear mensaje
    const mensaje = `
*━━━━━━━━━━━━━━━━━━━━━*
*🚨 NUEVO RECLAMO PAI 🚨*
*━━━━━━━━━━━━━━━━━━━━━*

*📋 Solicitud:* ${reclamo.solicitud_nro}
*📌 Tipo:* ${reclamo.tipo || 'N/A'}
*🔖 Subtipo:* ${reclamo.subtipo || 'N/A'}

*📍 Ubicación:* ${reclamo.ubicacion || 'N/A'}
${reclamo.distrito ? `*🏘️ Distrito:* ${reclamo.distrito}` : ''}
${reclamo.vecinal ? `*🏠 Vecinal:* ${reclamo.vecinal}` : ''}

*⚠️ Prioridad:* ${reclamo.prioridad || 'N/A'}
*📅 Fecha:* ${reclamo.fecha_reclamo || 'N/A'}

*👤 Solicitante:* ${reclamo.solicitante || 'N/A'}
${reclamo.telefono ? `*📞 Teléfono:* ${reclamo.telefono}` : ''}

*📝 Descripción:*
${reclamo.descripcion || 'Sin descripción'}

*━━━━━━━━━━━━━━━━━━━━━*
_Enviado automáticamente por el Sistema PAI_
_${new Date().toLocaleString('es-AR')}_
`.trim();

    // Enviar mensaje con PDF adjunto
    return await enviarMensajeConArchivo(telefonoArea, mensaje, rutaPDF);
}

/**
 * Obtiene información del cliente (número conectado, etc.)
 * @returns {Promise<object>}
 */
async function obtenerInfo() {
    if (!clienteConectado) {
        return null;
    }
    return await client.info;
}

/**
 * Cierra la conexión de WhatsApp
 */
async function desconectar() {
    if (client) {
        await client.destroy();
        clienteConectado = false;
        clienteInicializado = false;
        console.log('WhatsApp desconectado');
    }
}

module.exports = {
    inicializar,
    estaConectado,
    enviarMensaje,
    enviarMensajeConArchivo,
    enviarReclamoPAI,
    obtenerInfo,
    desconectar
};
