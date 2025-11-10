const express = require('express');
const app = express();
app.use(express.json());

// Credenciales de GREEN-API (configurar como variables de entorno)
const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const GREEN_API_BASE_URL = `https://api.green-api.com/waInstance${GREEN_API_ID}`;

// Validar que las credenciales estén configuradas
if (!GREEN_API_ID || !GREEN_API_TOKEN) {
    console.error('❌ ERROR: GREEN_API_ID y GREEN_API_TOKEN deben estar configurados');
    console.error('Configúralos como variables de entorno o en .env');
    process.exit(1);
}

console.log('='.repeat(60));
console.log('🚀 Servidor WhatsApp PAI con GREEN-API iniciado');
console.log(`📍 GREEN-API ID: ${GREEN_API_ID}`);
console.log(`🌐 Base URL: ${GREEN_API_BASE_URL}`);
console.log('='.repeat(60));

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/status - Ver estado de conexión
app.get('/api/status', async (req, res) => {
    try {
        const response = await fetch(`${GREEN_API_BASE_URL}/getStateInstance/${GREEN_API_TOKEN}`);
        
        if (!response.ok) {
            throw new Error(`Error al obtener estado: ${response.statusText}`);
        }

        const data = await response.json();
        const isConnected = data.stateInstance === 'authorized';

        res.json({
            connected: isConnected,
            state: data.stateInstance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al obtener estado:', error);
        res.status(500).json({
            error: error.message,
            connected: false
        });
    }
});

// POST /api/send - Enviar mensaje + PDF
app.post('/api/send', async (req, res) => {
    try {
        const { numero, mensaje, pdf_url } = req.body;

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

        // Si hay PDF, enviarlo con caption
        if (pdf_url) {
            console.log(`📤 Enviando PDF a ${chatId}...`);

            const response = await fetch(`${GREEN_API_BASE_URL}/sendFileByUrl/${GREEN_API_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    urlFile: pdf_url,
                    fileName: 'reclamo.pdf',
                    caption: mensaje
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al enviar: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Mensaje con PDF enviado a ${chatId}`);

            return res.json({
                success: true,
                message: 'Mensaje con PDF enviado correctamente',
                chatId: chatId,
                data: data,
                timestamp: new Date().toISOString()
            });
        } else {
            // Solo enviar mensaje de texto
            console.log(`📤 Enviando mensaje a ${chatId}...`);

            const response = await fetch(`${GREEN_API_BASE_URL}/sendMessage/${GREEN_API_TOKEN}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    message: mensaje
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al enviar: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ Mensaje enviado a ${chatId}`);

            return res.json({
                success: true,
                message: 'Mensaje enviado correctamente',
                chatId: chatId,
                data: data,
                timestamp: new Date().toISOString()
            });
        }

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

        if (!numero || !mensaje) {
            return res.status(400).json({
                error: 'numero y mensaje son requeridos'
            });
        }

        const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;

        const response = await fetch(`${GREEN_API_BASE_URL}/sendMessage/${GREEN_API_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: chatId,
                message: mensaje
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error al enviar: ${response.statusText}`);
        }

        const data = await response.json();

        res.json({
            success: true,
            chatId: chatId,
            data: data
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp PAI Server (GREEN-API)',
        status: 'running',
        greenApiId: GREEN_API_ID,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('\nEndpoints disponibles:');
    console.log('  GET  /              - Health check');
    console.log('  GET  /api/status     - Ver estado de conexión');
    console.log('  POST /api/send       - Enviar mensaje + PDF');
    console.log('  POST /api/send-text  - Enviar solo texto\n');
    console.log(`📍 Servidor escuchando en puerto ${PORT}\n`);
});

