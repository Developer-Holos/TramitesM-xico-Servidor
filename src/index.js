const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const config = require('./config');
const { procesarWebhook } = require('./controllers/webhookController');

const app = express();

// Middlewares de seguridad y logging
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de webhooks Calendly -> Kommo funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal para recibir webhooks de Calendly
app.post('/webhook/calendly', async (req, res) => {
  try {
    const data = req.body;
    const payload = data.payload;

    console.log('📩 Webhook recibido:', data.event);

    // ✅ Responde inmediatamente a Calendly con 200 OK
    res.status(200).json({ success: true });

    // ✅ Procesa la lógica en segundo plano
    // No bloqueamos la respuesta a Calendly
    setImmediate(async () => {
      try {
        await procesarWebhook(payload);
      } catch (processingError) {
        console.error('⚠️ Error en procesamiento (no afecta respuesta a Calendly):', processingError);
      }
    });

  } catch (err) {
    console.error('❌ Error crítico en webhook:', err);
    // Siempre retornar 200 OK para evitar que Calendly deshabilite el webhook
    res.status(200).json({ success: true });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📍 Endpoint de webhook: http://localhost:${PORT}/webhook/calendly`);
});

module.exports = app;
