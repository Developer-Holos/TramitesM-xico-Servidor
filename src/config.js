require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  kommo: {
    accessToken: process.env.KOMMO_ACCESS_TOKEN,
    baseUrl: process.env.KOMMO_BASE_URL || 'https://isabelchavez.kommo.com/api/v4',
  },
  pipelines: {
    idEmbudoVentas: parseInt('12372452'),
    idEmbudoPension: parseInt('12372372'),
    idEtapaCitaVentas: parseInt('95603560'),
    idEtapaCitaInvestigacionRechazada: parseInt('95602916'),
    idEtapaAnalisisCalculo: parseInt('95602924'),
  },
  timezone: {
    offset: parseInt(process.env.TIMEZONE_OFFSET || '-6'),
  },
  // IDs de campos personalizados de Kommo
  customFields: {
    contact: {
      phone: 817778,
      email: 817780,
    },
    lead: {
      fechaCita: 1041261,
      linkMeet: 1041263,
      tema: 1041079,
      telefono: 1041259,
      email: 1041257,
      nombre: 1041077,
      nombreAsegurado: 1041676,
      telefonoAsegurado: 1041678,
    }
  }
};
