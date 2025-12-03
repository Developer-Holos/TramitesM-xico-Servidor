const config = require('../config');
const { formatoFechaKommo } = require('../utils/dateUtils');
const { buscarLeadPorTelefono, crearLeadNuevo, patchLead } = require('../services/kommoService');

/**
 * 📝 Procesa el webhook de Calendly en segundo plano
 */
async function procesarWebhook(payload) {
  const eventName = payload.scheduled_event.name;

  console.log('📅 Procesando evento:', eventName);
  console.log('👤 Cliente:', payload.name, '|', payload.email);

  // Procesar eventos de ventas
  if (
    eventName === 'Orientación con el Lic. Enrique Hernández 30min. DEMO' ||
    eventName === 'Orientación con el Lic. Enrique Hernández 30min. $55.00' ||
    eventName === 'Horario Especial. con el Lic. Enrique Hernández. $85.00'
  ) {
    await procesarEventoVentas(payload);
  }

  // Procesar eventos de pensión
  if (eventName === 'PROBLEMAS CON EL SEGURO SOCIAL') {
    await procesarEventoPension(payload);
  }
}

/**
 * 💼 Procesa eventos de ventas
 */
async function procesarEventoVentas(payload) {
  const nombre = payload.name;
  const email = payload.email;
  const telefono = payload.questions_and_answers.find(q => q.question === 'Numero Telefonico')?.answer;
  const tema = payload.questions_and_answers.find(q => q.question === 'Tema principal de la asesoría')?.answer;
  const linkMeet = payload.scheduled_event.location?.join_url;
  const fecha = payload.scheduled_event.start_time;
  const fechaLocal = formatoFechaKommo(fecha);
  const idEtapa = config.pipelines.idEtapaCitaVentas;

  console.log('🔍 Buscando lead por teléfono:', telefono);

  // Buscar lead por teléfono en etapa específica
  const leadIdEncontrado = await buscarLeadPorTelefono(telefono, config.pipelines.idEmbudoVentas);

  if (leadIdEncontrado) {
    console.log('✅ Lead encontrado con ID:', leadIdEncontrado);
    await patchLead(leadIdEncontrado, nombre, email, telefono, tema, fechaLocal, linkMeet, idEtapa, '', '');
  } else {
    console.log('⚠️ No se encontró lead, creando uno nuevo...');
    await crearLeadNuevo(nombre, email, telefono, tema, fechaLocal, linkMeet, idEtapa, '', '');
  }
}

/**
 * 🏥 Procesa eventos de pensión/seguro social
 */
async function procesarEventoPension(payload) {
  const nombre = payload.name;
  const email = payload.email;
  const telefono = payload.questions_and_answers.find(q => q.question === 'Número de teléfono')?.answer;
  const nameAsegurado = payload.questions_and_answers.find(q => q.question === 'Nombre del asegurado')?.answer;
  const phoneAsegurado = payload.questions_and_answers.find(q => q.question === 'Telefono del asegurado')?.answer;
  const linkMeet = payload.scheduled_event.location?.join_url;
  const fecha = payload.scheduled_event.start_time;
  const fechaLocal = formatoFechaKommo(fecha);
  const idEtapa = config.pipelines.idEtapaCitaInvestigacionRechazada;

  console.log('🔍 Buscando lead por teléfono:', telefono);
  console.log('📋 Asegurado:', nameAsegurado, '|', phoneAsegurado);

  // Buscar lead por teléfono en etapa específica
  const leadIdEncontrado = await buscarLeadPorTelefono(telefono, config.pipelines.idEmbudoPension);

  if (leadIdEncontrado) {
    console.log('✅ Lead encontrado con ID:', leadIdEncontrado);
    await patchLead(leadIdEncontrado, nombre, email, telefono, '', fechaLocal, linkMeet, idEtapa, nameAsegurado, phoneAsegurado);
  } else {
    console.log('⚠️ No se encontró lead, creando uno nuevo...');
    await crearLeadNuevo(nombre, email, telefono, '', fechaLocal, linkMeet, idEtapa, nameAsegurado, phoneAsegurado);
  }
}

module.exports = {
  procesarWebhook,
};
