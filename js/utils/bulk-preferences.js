/**
 * Utilidad para manejar las preferencias del usuario en la vista de Carga Masiva
 */
const BulkPreferencesUtils = {
    // Clave para almacenar preferencias en localStorage
    STORAGE_KEY: 'pigmea_bulk_preferences',

    /**
     * Obtiene las preferencias guardadas del usuario
     * @returns {Object} Preferencias del usuario
     */
    getPreferences() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Error al leer preferencias de carga masiva:', error);
        }
        
        // Preferencias por defecto
        return {
            includeEntityInTabular: false,
            includeDateInTabular: false,
            includeCustomFieldsInTabular: {}, // fieldId: boolean
            lastEntitySelection: null,
            lastDateValue: null,
            lastPreTabularValues: {} // fieldId: value
        };
    },

    /**
     * Guarda las preferencias del usuario
     * @param {Object} preferences Preferencias a guardar
     */
    savePreferences(preferences) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
        } catch (error) {
            console.warn('Error al guardar preferencias de carga masiva:', error);
        }
    },

    /**
     * Actualiza una preferencia específica
     * @param {string} key Clave de la preferencia
     * @param {*} value Valor de la preferencia
     */
    updatePreference(key, value) {
        const preferences = this.getPreferences();
        preferences[key] = value;
        this.savePreferences(preferences);
    },

    /**
     * Actualiza el estado de inclusión de un campo personalizado
     * @param {string} fieldId ID del campo
     * @param {boolean} includeInTabular Si debe incluirse en datos tabulares
     */
    updateCustomFieldInclusion(fieldId, includeInTabular) {
        const preferences = this.getPreferences();
        if (!preferences.includeCustomFieldsInTabular) {
            preferences.includeCustomFieldsInTabular = {};
        }
        preferences.includeCustomFieldsInTabular[fieldId] = includeInTabular;
        this.savePreferences(preferences);
    },

    /**
     * Actualiza el valor de un campo pre-tabular
     * @param {string} fieldId ID del campo
     * @param {*} value Valor del campo
     */
    updatePreTabularValue(fieldId, value) {
        const preferences = this.getPreferences();
        if (!preferences.lastPreTabularValues) {
            preferences.lastPreTabularValues = {};
        }
        preferences.lastPreTabularValues[fieldId] = value;
        this.savePreferences(preferences);
    },

    /**
     * Obtiene el estado de inclusión de un campo personalizado
     * @param {string} fieldId ID del campo
     * @returns {boolean} Si debe incluirse en datos tabulares
     */
    getCustomFieldInclusion(fieldId) {
        const preferences = this.getPreferences();
        return preferences.includeCustomFieldsInTabular && 
               preferences.includeCustomFieldsInTabular[fieldId] === true;
    },

    /**
     * Obtiene el último valor de un campo pre-tabular
     * @param {string} fieldId ID del campo
     * @returns {*} Último valor guardado del campo
     */
    getPreTabularValue(fieldId) {
        const preferences = this.getPreferences();
        return preferences.lastPreTabularValues && 
               preferences.lastPreTabularValues[fieldId];
    },

    /**
     * Limpia las preferencias (útil para testing o reset)
     */
    clearPreferences() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.warn('Error al limpiar preferencias de carga masiva:', error);
        }
    }
};