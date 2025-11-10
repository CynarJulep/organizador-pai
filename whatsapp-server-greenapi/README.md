# Servidor WhatsApp PAI con GREEN-API

Este servidor usa GREEN-API para enviar mensajes por WhatsApp sin necesidad de whatsapp-web.js.

## Configuración

### 1. Obtener Credenciales de GREEN-API

1. Ve a: https://console.green-api.com
2. Ve a **"API"** → **"Settings"**
3. Copia:
   - **idInstance**: Tu ID de instancia
   - **apiTokenInstance**: Tu token de API

### 2. Configurar Variables de Entorno

**Localmente (crear archivo .env):**
```
GREEN_API_ID=tu_id_instance
GREEN_API_TOKEN=tu_api_token
PORT=3000
```

**En Railway (o cualquier plataforma):**
- Ve a Settings → Variables
- Agrega:
  - `GREEN_API_ID` = tu_id_instance
  - `GREEN_API_TOKEN` = tu_api_token

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar Servidor

```bash
npm start
```

## Endpoints

- `GET /` - Health check
- `GET /api/status` - Ver estado de conexión
- `POST /api/send` - Enviar mensaje + PDF
- `POST /api/send-text` - Enviar solo texto

## Ejemplo de Uso

```javascript
// Enviar mensaje con PDF
const response = await fetch('https://tu-url.railway.app/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        numero: '543424123456',
        mensaje: 'Mensaje de prueba',
        pdf_url: 'https://url-del-pdf.com/reclamo.pdf'
    })
});
```

