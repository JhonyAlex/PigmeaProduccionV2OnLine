/**
 * Utilidades para la vista de reportes
 */
const ReportsUtils = {
    /**
     * Formatea una fecha para los inputs de tipo date
     * @param {Date} date Fecha a formatear
     * @returns {string} Fecha formateada en formato YYYY-MM-DD
     */
    formatDateForInput(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Establece un rango de fecha predefinido
     * @param {string} range Tipo de rango: yesterday, thisWeek, lastWeek, etc.
     * @param {Object} view Vista de reportes
     */
    setDateRange(range, view) {
        const fromDateInput = document.getElementById('filter-from-date');
        const toDateInput = document.getElementById('filter-to-date');

        if (!fromDateInput || !toDateInput) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate, toDate;

        switch (range) {
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                toDate = new Date(fromDate);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                const firstDayOfWeek = 1; // Lunes
                const dayOfWeek = today.getDay() || 7; // 1=Lunes..7=Domingo
                fromDate.setDate(today.getDate() - (dayOfWeek - firstDayOfWeek));
                toDate = new Date(today);
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                const firstDayOfPrevWeek = 1; // Lunes
                const currentDayOfWeekForLast = today.getDay() || 7; // 1=Lunes..7=Domingo
                fromDate.setDate(today.getDate() - (currentDayOfWeekForLast - firstDayOfPrevWeek) - 7);
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 6); // Domingo de la semana pasada
                break;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'lastMonday':
            case 'lastTuesday':
            case 'lastWednesday':
            case 'lastThursday':
            case 'lastFriday':
            case 'lastSaturday':
            case 'lastSunday':
                fromDate = new Date(today); // Empezamos desde hoy
                const dayMap = {
                    'lastSunday': 0, 'lastMonday': 1, 'lastTuesday': 2, 'lastWednesday': 3,
                    'lastThursday': 4, 'lastFriday': 5, 'lastSaturday': 6
                };
                const targetDay = dayMap[range]; // El día de la semana que buscamos (0-6)
                const currentDay = today.getDay(); // El día de la semana actual (0-6)

                // Calcula cuántos días hay que retroceder para llegar al 'targetDay' de la semana pasada SIEMPRE
                const daysToSubtract = 7 + (currentDay - targetDay);

                fromDate.setDate(today.getDate() - daysToSubtract);
                toDate = new Date(fromDate); // El día seleccionado es tanto el inicio como el fin del rango
                break;
            default:
                console.warn(`Rango de fecha desconocido: ${range}`);
                return;
        }

        fromDateInput.value = this.formatDateForInput(fromDate);
        toDateInput.value = this.formatDateForInput(toDate);
    },

    /**
     * Obtiene el valor de un campo para un registro
     * @param {Object} record Registro
     * @param {string} fieldId ID del campo
     * @param {Array} fields Lista de campos disponibles
     * @returns {string} Valor del campo
     */
    getFieldValue(record, fieldId, fields) {
        if (!fieldId || !record.data || record.data[fieldId] === undefined || record.data[fieldId] === null) {
            return '';
        }

        return record.data[fieldId];
    }
};

window.ReportsUtils = ReportsUtils;