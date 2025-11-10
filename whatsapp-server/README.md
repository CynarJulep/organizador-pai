# Servidor WhatsApp para PAI

Este servidor se deploya en Railway y maneja el envío de mensajes por WhatsApp.

## Endpoints

- `GET /` - Health check
- `GET /api/status` - Ver estado de conexión WhatsApp
- `POST /api/send` - Enviar mensaje + PDF
- `POST /api/send-text` - Enviar solo texto

## Deploy en Railway

1. Sube este código a GitHub
2. En Railway, crea nuevo proyecto desde GitHub
3. Configura Root Directory: `whatsapp-server`
4. Railway deployará automáticamente

## Escanear QR

1. Ve a los logs de Railway
2. Verás un código QR impreso
3. Escanéalo con WhatsApp en tu teléfono
4. ¡Listo!

