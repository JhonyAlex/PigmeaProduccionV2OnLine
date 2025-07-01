/**
 * Modelo para campos personalizados
 */
const FieldModel = {
    /**
     * Obtiene todos los campos
     * @returns {Array} Lista de campos
     */
    getAll() {
        const data = StorageService.getData();
        return data && data.fields ? data.fields : [];
    },

    /**
     * Obtiene todos los campos activos
     * @returns {Array} Lista de campos activos
     */
    getActive() {
        return this.getAll().filter(f => f.active !== false);
    },
    
    /**
     * Obtiene un campo por su ID
     * @param {string} id ID del campo
     * @returns {Object|null} Campo encontrado o null
     */
    getById(id) {
        const fields = this.getAll();
        return fields.find(field => field.id === id) || null;
    },
    
    /**
     * Obtiene varios campos por sus IDs
     * @param {Array} ids Array de IDs de campos
     * @returns {Array} Lista de campos encontrados
     */
    getByIds(ids) {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return [];
        }

        const fields = this.getAll();
        return fields.filter(field => field && ids.includes(field.id));
    },

    /**
     * Obtiene varios campos activos por sus IDs
     * @param {Array} ids Array de IDs de campos
     * @returns {Array} Lista de campos activos
     */
    getActiveByIds(ids) {
        return this.getByIds(ids).filter(f => f.active !== false);
    },

    /**
     * Normaliza la estructura de las opciones de un campo tipo select
     * @param {Array} options Opciones recibidas
     * @returns {Array} Opciones normalizadas
     */
    _normalizeOptions(options) {
        return (options || []).map(opt =>
            typeof opt === 'string'
                ? { value: opt, active: true }

                : { value: opt.value, active: opt.active !== false }

        );
    },
    
    /**
     * Crea un nuevo campo
     * @param {Object} fieldData Datos del campo
     * @returns {Object} Campo creado
     */
    create(fieldData) {
        const data = StorageService.getData();
        
        // Asegurarse de que data.fields existe
        if (!data.fields) {
            data.fields = [];
        }
        
        const newField = {
            id: 'field_' + Date.now(),
            ...fieldData,

            dailySum: !!fieldData.dailySum,
            dailyProgressRef: !!fieldData.dailyProgressRef,
            massEdit: !!fieldData.massEdit,
            active: fieldData.hasOwnProperty('active') ? !!fieldData.active : true,
            options: fieldData.type === 'select'
                ? this._normalizeOptions(fieldData.options)
                : []
        };
        
        data.fields.push(newField);
        StorageService.saveData(data);
        
        return newField;
    },
    
    /**
     * Actualiza un campo existente
     * @param {string} id ID del campo
     * @param {Object} fieldData Nuevos datos del campo
     * @returns {Object|null} Campo actualizado o null
     */
    update(id, fieldData) {
        const data = StorageService.getData();
        const fieldIndex = data.fields.findIndex(field => field.id === id);
        
        if (fieldIndex === -1) return null;
        
        data.fields[fieldIndex] = {
            ...data.fields[fieldIndex],
            name: fieldData.name,
            type: fieldData.type,
            required: !!fieldData.required,
            options: fieldData.type === 'select'

                ? this._normalizeOptions(fieldData.options)
                : [],
            // Nuevas propiedades
            useForRecordsTable: !!fieldData.useForRecordsTable,
            isColumn3: !!fieldData.isColumn3,
            isColumn4: !!fieldData.isColumn4,
            isColumn5: !!fieldData.isColumn5,
            useForComparativeReports: !!fieldData.useForComparativeReports,
            isHorizontalAxis: !!fieldData.isHorizontalAxis,
            isCompareField: !!fieldData.isCompareField,

            dailySum: !!fieldData.dailySum,
            dailyProgressRef: !!fieldData.dailyProgressRef,
            massEdit: !!fieldData.massEdit,
            active: fieldData.hasOwnProperty('active') ? !!fieldData.active : data.fields[fieldIndex].active !== false
        };
        
        StorageService.saveData(data);
        
        return data.fields[fieldIndex];
    },
    
    /**
     * Elimina un campo
     * @param {string} id ID del campo
     * @returns {boolean} Éxito de la eliminación
     */
    delete(id) {
        const data = StorageService.getData();
        const initialLength = data.fields.length;
        
        data.fields = data.fields.filter(field => field.id !== id);
        
        // Eliminamos el campo de todas las entidades que lo tengan asignado
        data.entities.forEach(entity => {
            entity.fields = entity.fields.filter(fieldId => fieldId !== id);
        });
        
        StorageService.saveData(data);
        
        return data.fields.length < initialLength;
    },
    
    /**
     * Obtiene campos numéricos que se pueden usar en reportes compartidos
     * @returns {Array} Lista de campos numéricos para reportes
     */
    getSharedNumericFields() {
        const fields = this.getAll() || [];
        return fields.filter(field => 
            field && 
            field.type === 'number' && 
            field.useForComparativeReports
        );
    },
    
    /**
     * Obtiene todos los campos numéricos
     * @returns {Array} Lista de todos los campos de tipo numérico
     */
    getNumericFields() {
        const fields = this.getAll() || [];
        return fields.filter(field =>
            field &&
            field.type === 'number' &&
            field.active !== false
        );
    },

    /**
     * Devuelve el campo marcado para mostrar suma diaria
     * @returns {Object|null} Campo con dailySum activo
     */
    getDailySumField() {
        const fields = this.getAll() || [];
        return fields.find(f => f.dailySum && f.active !== false) || null;
    },

    /**
     * Devuelve el campo usado como referencia para el progreso diario
     * @returns {Object|null} Campo con dailyProgressRef activo
     */
    getDailyProgressRefField() {
        const fields = this.getAll() || [];
        return fields.find(f => f.dailyProgressRef && f.active !== false) || null;
    },

    /**
     * Devuelve el campo habilitado para cambios masivos
     * @returns {Object|null} Campo con massEdit activo
     */
    getMassEditField() {
        const fields = this.getAll() || [];
        return fields.find(f => f.massEdit && f.active !== false) || null;

    }
};