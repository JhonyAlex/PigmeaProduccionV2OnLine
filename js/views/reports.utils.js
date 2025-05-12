/**
 * Utility functions for ReportsView
 */
const ReportsUtils = {
    /**
     * Gets the value of a field from a record.
     * @param {Object} record - The record object.
     * @param {string} fieldId - The field ID.
     * @param {Array} fields - Array of field definitions.
     * @returns {string} - The field value.
     */
    getFieldValue(record, fieldId, fields) {
        if (!fieldId || !record.data || record.data[fieldId] === undefined || record.data[fieldId] === null) {
            return '';
        }
        return record.data[fieldId];
    },

    /**
     * Formats a date for input fields.
     * @param {Date} date - The date object.
     * @returns {string} - The formatted date string.
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
     * Sets the date range based on a predefined range.
     * @param {string} range - The range identifier.
     * @param {HTMLInputElement} fromDateInput - The "from" date input element.
     * @param {HTMLInputElement} toDateInput - The "to" date input element.
     */
    setDateRange(range, fromDateInput, toDateInput) {
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
                const firstDayOfWeek = 1; // Monday
                const dayOfWeek = today.getDay() || 7; // 1=Monday..7=Sunday
                fromDate.setDate(today.getDate() - (dayOfWeek - firstDayOfWeek));
                toDate = new Date(today);
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                const firstDayOfPrevWeek = 1; // Monday
                const currentDayOfWeekForLast = today.getDay() || 7; // 1=Monday..7=Sunday
                fromDate.setDate(today.getDate() - (currentDayOfWeekForLast - firstDayOfPrevWeek) - 7);
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 6); // Sunday of last week
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
                fromDate = new Date(today);
                const dayMap = {
                    'lastSunday': 0, 'lastMonday': 1, 'lastTuesday': 2, 'lastWednesday': 3,
                    'lastThursday': 4, 'lastFriday': 5, 'lastSaturday': 6
                };
                const targetDay = dayMap[range];
                const currentDay = today.getDay();

                const daysToSubtract = 7 + (currentDay - targetDay);

                fromDate.setDate(today.getDate() - daysToSubtract);
                toDate = new Date(fromDate);
                break;
            default:
                console.warn(`Unknown date range: ${range}`);
                return;
        }

        fromDateInput.value = this.formatDateForInput(fromDate);
        toDateInput.value = this.formatDateForInput(toDate);
    }
};