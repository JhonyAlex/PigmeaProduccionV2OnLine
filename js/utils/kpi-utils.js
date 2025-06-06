const KpiUtils = {
  /**
   * Agrupa registros por periodo.
   * @param {Array} records - Registros filtrados.
   * @param {string} fieldId - ID del campo numérico.
   * @param {string} period - 'day', 'month', or 'year'.
   * @returns {Object} Mapa de periodo a valores agregados.
   */
  groupByPeriod(records, fieldId, period = 'day') {
    const groups = {};
    records.forEach((rec) => {
      const date = new Date(rec.timestamp);
      let key = '';
      switch (period) {
        case 'month':
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      if (!groups[key]) {
        groups[key] = { sum: 0, count: 0 };
      }
      const value = parseFloat(rec.data[fieldId]) || 0;
      groups[key].sum += value;
      groups[key].count += 1;
    });
    return groups;
  },

  /**
   * Calcula métricas básicas para un conjunto de registros.
   * @param {Array} records - Registros filtrados.
   * @returns {Object} Métricas calculadas.
   */
  basicMetrics(records) {
    const count = records.length;
    const uniqueDates = new Set(records.map(r => new Date(r.timestamp).toISOString().split('T')[0]));
    const dailyAvg = uniqueDates.size ? count / uniqueDates.size : 0;
    const uniqueEntities = new Set(records.map(r => r.entityId)).size;
    return { count, dailyAvg, uniqueEntities };
  },

  /**
   * Calcula agregados para un campo numérico.
   * @param {Array} records - Registros filtrados.
   * @param {string} fieldId - Campo a procesar.
   * @param {string} agg - Tipo de agregación (sum, avg, max, min).
   * @returns {number} Resultado de la agregación.
   */
  aggregateField(records, fieldId, agg = 'sum') {
    const values = records
      .filter(r => r.data[fieldId] !== undefined)
      .map(r => parseFloat(r.data[fieldId]) || 0);
    if (!values.length) return 0;
    switch (agg) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  },

  /**
   * Obtiene el rango anterior dada una fecha inicial y final.
   * @param {string} from - Fecha inicial YYYY-MM-DD.
   * @param {string} to - Fecha final YYYY-MM-DD.
   * @returns {Object} Rango anterior {from, to}.
   */
  previousRange(from, to) {
    const f = new Date(from);
    const t = new Date(to);
    const duration = t.getTime() - f.getTime();
    const prevTo = new Date(f.getTime() - 86400000);
    const prevFrom = new Date(prevTo.getTime() - duration);
    const format = d => d.toISOString().split('T')[0];
    return { from: format(prevFrom), to: format(prevTo) };
  }
};

if (typeof module !== 'undefined') {
  module.exports = KpiUtils;
}
