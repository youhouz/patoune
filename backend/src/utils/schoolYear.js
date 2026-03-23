/**
 * Calcule l'année scolaire à partir d'une date.
 * En France, l'année scolaire va de septembre à juillet.
 * - Sept-Déc → "2025/2026"
 * - Jan-Août → "2024/2025"
 *
 * @param {Date} [date=new Date()] - La date pour laquelle calculer l'année scolaire
 * @returns {string} L'année scolaire au format "YYYY/YYYY"
 */
function getSchoolYear(date = new Date()) {
  const month = date.getMonth(); // 0 = Jan, 8 = Sept
  const year = date.getFullYear();

  if (month >= 8) {
    // Septembre (8) à Décembre (11)
    return `${year}/${year + 1}`;
  }
  // Janvier (0) à Août (7)
  return `${year - 1}/${year}`;
}

module.exports = { getSchoolYear };
