const axios = require('axios');
const config = require('../config');

/**
 * 🔍 Busca un lead por teléfono y etapa
 */
async function buscarLeadPorTelefono(telefono, pipelineId) {
  const url = `${config.kommo.baseUrl}/leads?with=contacts&query=${telefono}&filter[pipeline_id][]=${pipelineId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.kommo.accessToken}`,
      },
      validateStatus: () => true, // No lanzar error en status !== 200
    });

    const data = response.data;

    // Verificar si la respuesta está vacía o no tiene leads
    if (!data || !data._embedded || !data._embedded.leads) {
      console.log('⚠️ No se encontró ningún lead. Respuesta vacía.');
      return null;
    }

    // Buscar en los leads devueltos
    for (let lead of data._embedded.leads) {
      if (!lead._embedded || !lead._embedded.contacts) continue;

      const contacto = lead._embedded.contacts[0];
      if (!contacto) continue;

      const contactId = contacto.id;
      const contactData = await obtenerContactoPorId(contactId);

      if (contactData && contactData.custom_fields_values) {
        const telefonoCampo = contactData.custom_fields_values.find(f => f.field_code === 'PHONE');
        const telefonoContacto = telefonoCampo?.values?.[0]?.value;

        if (telefonoContacto && normalizePhone(telefonoContacto) === normalizePhone(telefono)) {
          return lead.id;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('❌ Error en buscarLeadPorTelefono:', err.message);
    return null;
  }
}

/**
 * 📞 Obtiene un contacto por ID
 */
async function obtenerContactoPorId(contactId) {
  const url = `${config.kommo.baseUrl}/contacts/${contactId}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${config.kommo.accessToken}`,
      },
      validateStatus: () => true,
    });

    return response.data;
  } catch (err) {
    console.error('❌ Error en obtenerContactoPorId:', err.message);
    return null;
  }
}

/**
 * 🆕 Crea un nuevo lead con contacto asociado
 */
async function crearLeadNuevo(nombre, email, telefono, tema, fechaISO, linkMeet, idEtapa, nameAsegurado, phoneAsegurado) {
  const telefonoLimpio = normalizePhone(telefono);

  try {
    // 1️⃣ Buscar contacto por teléfono
    const searchUrl = `${config.kommo.baseUrl}/contacts?query=${telefonoLimpio}`;
    let finalContactId = null;

    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'Authorization': `Bearer ${config.kommo.accessToken}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    });

    const searchData = searchResponse.data;

    // Si hay contactos, validar que el teléfono coincida
    if (searchData?._embedded?.contacts?.length > 0) {
      const contacts = searchData._embedded.contacts;

      for (let contact of contacts) {
        const phones = contact.custom_fields_values?.filter(f => f.field_code === 'PHONE');
        if (phones && phones.length > 0) {
          for (let value of phones[0].values) {
            const normalizedFieldPhone = normalizePhone(value.value);
            const normalizedInputPhone = normalizePhone(telefono);

            if (normalizedFieldPhone === normalizedInputPhone) {
              finalContactId = contact.id;
              break;
            }
          }
        }
        if (finalContactId) break;
      }
    }

    // Si no existe, crear el contacto
    if (!finalContactId) {
      const contactData = [{
        name: nombre,
        custom_fields_values: [
          {
            field_id: config.customFields.contact.phone,
            values: [{ value: telefono }],
          },
          {
            field_id: config.customFields.contact.email,
            values: [{ value: email }],
          }
        ],
      }];

      const createContactResponse = await axios.post(
        `${config.kommo.baseUrl}/contacts`,
        contactData,
        {
          headers: {
            'Authorization': `Bearer ${config.kommo.accessToken}`,
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        }
      );

      const contactResponseData = createContactResponse.data;
      finalContactId = contactResponseData?._embedded?.contacts?.[0]?.id;
    }

    if (!finalContactId) {
      console.log('❌ No se pudo crear ni encontrar el contacto.');
      return;
    }

    // 3️⃣ Crear el lead usando el contacto encontrado/creado
    const customFieldsValues = [
      ...(fechaISO ? [{ field_id: config.customFields.lead.fechaCita, values: [{ value: fechaISO }] }] : []),
      ...(linkMeet ? [{ field_id: config.customFields.lead.linkMeet, values: [{ value: linkMeet }] }] : []),
      ...(tema ? [{ field_id: config.customFields.lead.tema, values: [{ value: tema }] }] : []),
      ...(telefono ? [{ field_id: config.customFields.lead.telefono, values: [{ value: telefono }] }] : []),
      ...(email ? [{ field_id: config.customFields.lead.email, values: [{ value: email }] }] : []),
      ...(nombre ? [{ field_id: config.customFields.lead.nombre, values: [{ value: nombre }] }] : []),
      ...(nameAsegurado ? [{ field_id: config.customFields.lead.nombreAsegurado, values: [{ value: nameAsegurado }] }] : []),
      ...(phoneAsegurado ? [{ field_id: config.customFields.lead.telefonoAsegurado, values: [{ value: phoneAsegurado }] }] : []),
    ];

    const leadPayload = [{
      name: `Asesoría - ${nombre}`,
      status_id: idEtapa,
      _embedded: {
        contacts: [{ id: finalContactId }]
      },
      custom_fields_values: customFieldsValues
    }];

    const response = await axios.post(
      `${config.kommo.baseUrl}/leads/complex`,
      leadPayload,
      {
        headers: {
          'Authorization': `Bearer ${config.kommo.accessToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    console.log('🆕 Lead creado o vinculado:', response.data);
  } catch (err) {
    console.error('❌ Error en crearLeadNuevo:', err.message);
  }
}

/**
 * ✏️ Actualiza un lead existente
 */
async function patchLead(leadId, nombre, email, telefono, tema, fechaISO, linkMeet, idEtapa, nameAsegurado, phoneAsegurado) {
  try {
    const customFieldsValues = [
      ...(fechaISO ? [{ field_id: config.customFields.lead.fechaCita, values: [{ value: fechaISO }] }] : []),
      ...(linkMeet ? [{ field_id: config.customFields.lead.linkMeet, values: [{ value: linkMeet }] }] : []),
      ...(tema ? [{ field_id: config.customFields.lead.tema, values: [{ value: tema }] }] : []),
      ...(telefono ? [{ field_id: config.customFields.lead.telefono, values: [{ value: telefono }] }] : []),
      ...(email ? [{ field_id: config.customFields.lead.email, values: [{ value: email }] }] : []),
      ...(nombre ? [{ field_id: config.customFields.lead.nombre, values: [{ value: nombre }] }] : []),
      ...(nameAsegurado ? [{ field_id: config.customFields.lead.nombreAsegurado, values: [{ value: nameAsegurado }] }] : []),
      ...(phoneAsegurado ? [{ field_id: config.customFields.lead.telefonoAsegurado, values: [{ value: phoneAsegurado }] }] : []),
    ];

    const leadPayload = [{
      id: leadId,
      name: `Asesoría - ${nombre}`,
      status_id: idEtapa,
      custom_fields_values: customFieldsValues
    }];

    const response = await axios.patch(
      `${config.kommo.baseUrl}/leads`,
      leadPayload,
      {
        headers: {
          'Authorization': `Bearer ${config.kommo.accessToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    console.log('✅ Lead actualizado:', response.data);
  } catch (err) {
    console.error('❌ Error en patchLead:', err.message);
  }
}

/**
 * 🧹 Función auxiliar para normalizar números de teléfono
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, ''); // elimina espacios, +, -, etc.
}

module.exports = {
  buscarLeadPorTelefono,
  obtenerContactoPorId,
  crearLeadNuevo,
  patchLead,
  normalizePhone,
};
