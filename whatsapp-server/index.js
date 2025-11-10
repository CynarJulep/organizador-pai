const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// Configurar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer'
        ]
    }
});

// Eventos de WhatsApp
client.on('qr', (qr) => {
    console.log('\n=== CÓDIGO QR PARA WHATSAPP ===');
    qrcode.generate(qr, { small: true });
    console.log('\nEscanea este código QR con WhatsApp en tu teléfono');
    console.log('Ve a: WhatsApp → Configuración → Dispositivos vinculados → Vincular dispositivo\n');
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado correctamente');
    console.log('📱 Número: ' + client.info.wid.user);
});

client.on('authenticated', () => {
    console.log('✅ Autenticación exitosa');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
    console.log('Reiniciando en 5 segundos...');
    setTimeout(() => {
        client.initialize();
    }, 5000);
});

// Inicializar WhatsApp
client.initialize();

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/status - Ver estado de conexión
app.get('/api/status', (req, res) => {
    res.json({
        connected: client.info ? true : false,
        phone: client.info?.wid?.user || null,
        timestamp: new Date().toISOString()
    });
});

// POST /api/send - Enviar mensaje + PDF
app.post('/api/send', async (req, res) => {
    try {
        const { numero, mensaje, pdf_url } = req.body;

        // Validar que WhatsApp esté conectado
        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado',
                connected: false
            });
        }

        // Validar parámetros
        if (!numero || !mensaje) {
            return res.status(400).json({
                error: 'Faltan parámetros: numero y mensaje son requeridos'
            });
        }

        // Formatear número (debe ser: 543424123456@c.us)
        let chatId = numero;
        if (!chatId.includes('@c.us')) {
            chatId = `${numero}@c.us`;
        }

        // Si hay PDF, descargarlo y enviarlo
        if (pdf_url) {
            console.log(`📤 Enviando PDF a ${chatId}...`);
            
            // Descargar PDF
            const response = await fetch(pdf_url);
            if (!response.ok) {
                throw new Error(`Error al descargar PDF: ${response.statusText}`);
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const media = new MessageMedia(
                'application/pdf',
                buffer.toString('base64'),
                'reclamo.pdf'
            );

            // Enviar mensaje con PDF
            await client.sendMessage(chatId, media, { caption: mensaje });
        } else {
            // Solo enviar mensaje de texto
            await client.sendMessage(chatId, mensaje);
        }

        console.log(`✅ Mensaje enviado a ${chatId}`);

        res.json({
            success: true,
            message: 'Mensaje enviado correctamente',
            chatId: chatId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({
            error: error.message,
            success: false
        });
    }
});

// POST /api/send-text - Solo texto (sin PDF)
app.post('/api/send-text', async (req, res) => {
    try {
        const { numero, mensaje } = req.body;

        if (!client.info) {
            return res.status(503).json({
                error: 'WhatsApp no está conectado'
            });
        }

        if (!numero || !mensaje) {
            return res.status(400).json({
                error: 'numero y mensaje son requeridos'
            });
        }

        const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
        await client.sendMessage(chatId, mensaje);

        res.json({ success: true, chatId });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check (para Railway)
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp PAI Server',
        status: 'running',
        whatsapp: client.info ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Servidor WhatsApp PAI iniciado');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌐 URL: https://tu-proyecto.railway.app`);
    console.log('='.repeat(60));
    console.log('\nEndpoints disponibles:');
    console.log('  GET  /              - Health check');
    console.log('  GET  /api/status     - Ver estado de conexión');
    console.log('  POST /api/send       - Enviar mensaje + PDF');
    console.log('  POST /api/send-text  - Enviar solo texto\n');
});

