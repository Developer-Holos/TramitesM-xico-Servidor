/**
 * Script de prueba para el webhook de Calendly
 * Simula el envío de datos desde Calendly
 */

const mockPayload = {
  created_at: "2025-11-10T01:01:41.000000Z",
  created_by: "https://api.calendly.com/users/e0e46e9d-08eb-40d7-98a9-442823b730bc",
  event: "invitee.created",
  payload: {
    email: "anoel@holos.ec",
    first_name: "Alex",
    last_name: "Demo",
    name: "Alex Demo",
    text_reminder_number: "+51 923 676 740",
    timezone: "America/Lima",
    questions_and_answers: [
      { question: "Numero Telefonico", answer: "+51 923 676 740" },
      { question: "Aviso de SMS de TTEM", answer: "Acepto recibir SMS de TTEM" },
      { question: "Tema principal de la asesoría", answer: "Poder Notarial" }
    ],
    scheduled_event: {
      name: "Orientación con el Lic. Enrique Hernández 30min. DEMO",
      start_time: "2025-11-13T17:20:00.000000Z",
      end_time: "2025-11-13T17:50:00.000000Z",
      event_memberships: [
        {
          user_name: "Lic.Enrique Hernandez",
          user_email: "enriquehernandez@tustramitesenmexico.com"
        }
      ],
      location: {
        type: "google_conference",
        join_url: "https://calendly.com/events/7bc71744-c210-40bc-bb93-b39718de5bbb/google_meet"
      }
    }
  }
};

const axios = require('axios');

// Configuración del servidor
const SERVER_URL = 'http://localhost:3000/webhook/calendly';

async function testWebhook() {
  try {
    console.log('🧪 Iniciando prueba del webhook...');
    console.log('📡 Enviando a:', SERVER_URL);

    const response = await axios.post(SERVER_URL, mockPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Respuesta del servidor:', response.status);
    console.log('📦 Datos:', response.data);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: No se pudo conectar al servidor.');
      console.error('   Asegúrate de que el servidor esté corriendo en el puerto 3000');
      console.error('   Ejecuta: npm start');
    } else {
      console.error('❌ Error al enviar webhook:', error.message);
    }
  }
}

// Ejecutar la prueba
testWebhook();
