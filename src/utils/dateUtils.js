const config = require('../config');

/**
 * 🕓 Convierte una fecha ISO de Calendly al formato requerido por Kommo
 * con la zona horaria especificada
 */
function formatoFechaKommo(fechaISO) {
  const fecha = new Date(fechaISO); // Calendly → "2025-11-09T11:20:00Z"

  // Obtenemos los componentes en hora local de GMT-6 (o la configurada)
  const zonaHoraria = config.timezone.offset;
  const fechaLocal = new Date(fecha.getTime() + zonaHoraria * 60 * 60 * 1000);

  // Componentes
  const year = fechaLocal.getUTCFullYear();
  const month = String(fechaLocal.getUTCMonth() + 1).padStart(2, '0');
  const day = String(fechaLocal.getUTCDate()).padStart(2, '0');
  const hours = String(fechaLocal.getUTCHours()).padStart(2, '0');
  const minutes = String(fechaLocal.getUTCMinutes()).padStart(2, '0');
  const seconds = String(fechaLocal.getUTCSeconds()).padStart(2, '0');

  // Formato del offset (ejemplo: -06:00)
  const offsetHours = String(Math.abs(zonaHoraria)).padStart(2, '0');
  const offsetSign = zonaHoraria >= 0 ? '+' : '-';

  // 🕓 Formato ISO con zona horaria explícita
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:00`;
}

module.exports = {
  formatoFechaKommo,
};
