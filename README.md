# Servidor Node.js - Webhook Calendly → Kommo CRM

Servidor Express que recibe webhooks de Calendly y sincroniza automáticamente las citas agendadas con Kommo CRM.

## 📋 Características

- ✅ Recepción de webhooks de Calendly
- 🔄 Sincronización automática con Kommo CRM
- 🔍 Búsqueda inteligente de leads existentes
- 🆕 Creación automática de leads y contactos
- ✏️ Actualización de leads existentes
- 🕐 Conversión de fechas a zona horaria local
- 🛡️ Manejo robusto de errores
- 📝 Logging detallado

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd TramitesM-xico-Servidor
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
PORT=3000
KOMMO_ACCESS_TOKEN=tu_token_aqui
KOMMO_BASE_URL=https://isabelchavez.kommo.com/api/v4
ID_EMBUDO_VENTAS=12372452
ID_EMBUDO_PENSION=12372372
ID_ETAPA_CITA_VENTAS=95603560
ID_ETAPA_CITA_INVESTIGACION_RECHAZADA=95602916
TIMEZONE_OFFSET=-6
```

## 🎯 Uso

### Iniciar el servidor

**Modo producción:**
```bash
npm start
```

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Probar el webhook localmente

```bash
npm test
```

Este comando ejecuta un script que simula el envío de un webhook de Calendly.

## 📡 Endpoints

### `GET /`
Health check del servidor.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Servidor de webhooks Calendly -> Kommo funcionando",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

### `POST /webhook/calendly`
Endpoint para recibir webhooks de Calendly.

**Headers:**
```
Content-Type: application/json
```

**Body (ejemplo):**
```json
{
  "event": "invitee.created",
  "payload": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "questions_and_answers": [
      { "question": "Numero Telefonico", "answer": "+52 123 456 7890" },
      { "question": "Tema principal de la asesoría", "answer": "Poder Notarial" }
    ],
    "scheduled_event": {
      "name": "Orientación con el Lic. Enrique Hernández 30min. DEMO",
      "start_time": "2025-11-13T17:20:00.000000Z",
      "location": {
        "join_url": "https://meet.google.com/xyz"
      }
    }
  }
}
```

## 📂 Estructura del proyecto

```
TramitesM-xico-Servidor/
├── src/
│   ├── config.js                    # Configuración central
│   ├── index.js                     # Servidor Express principal
│   ├── controllers/
│   │   └── webhookController.js     # Lógica de procesamiento de webhooks
│   ├── services/
│   │   └── kommoService.js          # Interacción con API de Kommo
│   └── utils/
│       └── dateUtils.js             # Utilidades para fechas
├── test/
│   └── test-webhook.js              # Script de prueba
├── .env.example                     # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Configuración de Calendly

1. Ve a tu cuenta de Calendly
2. Navega a **Integraciones** > **Webhooks**
3. Crea un nuevo webhook con la URL de tu servidor:
   - URL: `https://tu-servidor.com/webhook/calendly`
   - Evento: `invitee.created`

## 🔐 Seguridad

- El token de acceso de Kommo se almacena en variables de entorno
- Usa HTTPS en producción
- El servidor siempre responde 200 OK a Calendly para evitar deshabilitación del webhook
- Se implementa procesamiento asíncrono para no bloquear respuestas

## 📊 Eventos soportados

### Eventos de Ventas
- "Orientación con el Lic. Enrique Hernández 30min. DEMO"
- "Orientación con el Lic. Enrique Hernández 30min. $55.00"
- "Horario Especial. con el Lic. Enrique Hernández. $85.00"

### Eventos de Pensión
- "PROBLEMAS CON EL SEGURO SOCIAL"

## 🐛 Debugging

Los logs se muestran en la consola con emojis para facilitar el seguimiento:

- 📩 Webhook recibido
- 🔍 Buscando lead
- ✅ Lead encontrado/actualizado
- 🆕 Lead creado
- ⚠️ Advertencias
- ❌ Errores

## 🌐 Despliegue

### Recomendaciones para producción:

1. **Usar un servicio de hosting:**
   - Railway
   - Heroku
   - DigitalOcean
   - AWS EC2

2. **Configurar HTTPS**

3. **Usar PM2 para gestión de procesos:**
```bash
npm install -g pm2
pm2 start src/index.js --name calendly-webhook
pm2 save
```

4. **Configurar logs persistentes**

## 📝 Notas adicionales

- La zona horaria por defecto es GMT-6 (México/Lima)
- Los números de teléfono se normalizan automáticamente
- El servidor valida si un contacto ya existe antes de crear uno nuevo
- Se mantiene un registro de todas las citas en los logs

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

MIT
