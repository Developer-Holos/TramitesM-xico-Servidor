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

    console.log('🔍 Buscando contacto existente con teléfono:', telefono);

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
              console.log('✅ Contacto encontrado, ID:', finalContactId);
              break;
            }
          }
        }
        if (finalContactId) break;
      }
    }

    // Si no existe, crear el contacto
    if (!finalContactId) {
      console.log('📝 Creando nuevo contacto:', nombre || 'Sin nombre');
      
      // Filtrar solo campos de contacto que no estén vacíos
      const contactCustomFields = [];
      
      if (telefono) {
        contactCustomFields.push({
          field_id: config.customFields.contact.phone,
          values: [{ value: telefono }],
        });
      }
      
      if (email) {
        contactCustomFields.push({
          field_id: config.customFields.contact.email,
          values: [{ value: email }],
        });
      }

      const contactData = [{
        name: nombre || 'Sin nombre',
        custom_fields_values: contactCustomFields,
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

      if (createContactResponse.status !== 200) {
        console.error('❌ Error al crear contacto:', createContactResponse.data);
        return;
      }

      const contactResponseData = createContactResponse.data;
      finalContactId = contactResponseData?._embedded?.contacts?.[0]?.id;
      console.log('✅ Contacto creado, ID:', finalContactId);
    }

    if (!finalContactId) {
      console.log('❌ No se pudo crear ni encontrar el contacto.');
      return;
    }

    // 3️⃣ Crear el lead usando el contacto encontrado/creado
    console.log('📝 Creando lead para:', nombre, '| Etapa:', idEtapa);

    // Filtrar campos vacíos, undefined o null
    const customFieldsValues = [];
    
    if (fechaISO) {
      customFieldsValues.push({ field_id: config.customFields.lead.fechaCita, values: [{ value: fechaISO }] });
    }
    if (linkMeet) {
      customFieldsValues.push({ field_id: config.customFields.lead.linkMeet, values: [{ value: linkMeet }] });
    }
    if (tema) {
      customFieldsValues.push({ field_id: config.customFields.lead.tema, values: [{ value: tema }] });
    }
    if (telefono) {
      customFieldsValues.push({ field_id: config.customFields.lead.telefono, values: [{ value: telefono }] });
    }
    if (email) {
      customFieldsValues.push({ field_id: config.customFields.lead.email, values: [{ value: email }] });
    }
    if (nombre) {
      customFieldsValues.push({ field_id: config.customFields.lead.nombre, values: [{ value: nombre }] });
    }
    if (nameAsegurado) {
      customFieldsValues.push({ field_id: config.customFields.lead.nombreAsegurado, values: [{ value: nameAsegurado }] });
    }
    if (phoneAsegurado) {
      customFieldsValues.push({ field_id: config.customFields.lead.telefonoAsegurado, values: [{ value: phoneAsegurado }] });
    }

    const leadPayload = [{
      name: `Asesoría - ${nombre || 'Sin nombre'}`,
      status_id: idEtapa,
      _embedded: {
        contacts: [{ id: finalContactId }]
      },
      ...(customFieldsValues.length > 0 && { custom_fields_values: customFieldsValues })
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

    if (response.status === 200) {
      const leadId = response.data?._embedded?.leads?.[0]?.id;
      console.log('🆕 ✅ Lead creado exitosamente, ID:', leadId);
    } else {
      console.error('❌ Error al crear lead. Status:', response.status);
      console.error('📋 Respuesta:', response.data);
    }
  } catch (err) {
    console.error('❌ Error en crearLeadNuevo:', err.message);
    if (err.response?.data) {
      console.error('📋 Detalles del error:', err.response.data);
    }
  }
}

/**
 * ✏️ Actualiza un lead existente
 */
async function patchLead(leadId, nombre, email, telefono, tema, fechaISO, linkMeet, idEtapa, nameAsegurado, phoneAsegurado) {
  try {
    console.log('📝 Actualizando lead ID:', leadId, '| Nombre:', nombre, '| Etapa:', idEtapa);

    // Filtrar campos vacíos, undefined o null
    const customFieldsValues = [];
    
    if (fechaISO) {
      customFieldsValues.push({ field_id: config.customFields.lead.fechaCita, values: [{ value: fechaISO }] });
    }
    if (linkMeet) {
      customFieldsValues.push({ field_id: config.customFields.lead.linkMeet, values: [{ value: linkMeet }] });
    }
    if (tema) {
      customFieldsValues.push({ field_id: config.customFields.lead.tema, values: [{ value: tema }] });
    }
    if (telefono) {
      customFieldsValues.push({ field_id: config.customFields.lead.telefono, values: [{ value: telefono }] });
    }
    if (email) {
      customFieldsValues.push({ field_id: config.customFields.lead.email, values: [{ value: email }] });
    }
    if (nombre) {
      customFieldsValues.push({ field_id: config.customFields.lead.nombre, values: [{ value: nombre }] });
    }
    if (nameAsegurado) {
      customFieldsValues.push({ field_id: config.customFields.lead.nombreAsegurado, values: [{ value: nameAsegurado }] });
    }
    if (phoneAsegurado) {
      customFieldsValues.push({ field_id: config.customFields.lead.telefonoAsegurado, values: [{ value: phoneAsegurado }] });
    }

    const leadPayload = [{
      id: leadId,
      name: `Asesoría - ${nombre || 'Sin nombre'}`,
      status_id: idEtapa,
      ...(customFieldsValues.length > 0 && { custom_fields_values: customFieldsValues })
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

    if (response.status === 200) {
      console.log('✅ Lead actualizado exitosamente');
    } else {
      console.error('❌ Error al actualizar lead. Status:', response.status);
      console.error('📋 Respuesta:', response.data);
    }
  } catch (err) {
    console.error('❌ Error en patchLead:', err.message);
    if (err.response) {
      console.error('📋 Detalles del error:', JSON.stringify(err.response.data, null, 2));
    }
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
