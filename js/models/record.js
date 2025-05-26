/**
 * Modelo para la gestión de registros
 */
const RecordModel = {
    /**
     * Obtiene todos los registros
     * @returns {Array} Lista de registros
     */
    getAll() {
        const data = StorageService.getData();
        return data && data.records ? data.records : [];
    },
    
    /**
     * Obtiene un registro por su ID
     * @param {string} id ID del registro
     * @returns {Object|null} Registro encontrado o null
     */
    getById(id) {
        const records = this.getAll();
        return records.find(record => record.id === id) || null;
    },
    
    /**
     * Crea un nuevo registro
     * @param {string} entityId ID de la entidad
     * @param {Object} formData Datos del formulario
     * @returns {Object} Registro creado
     */
    create(entityId, formData) {
        const data = StorageService.getData();
        const newRecord = {
            id: 'record_' + Date.now(),
            entityId: entityId,
            timestamp: new Date().toISOString(),
            data: { ...formData }
        };
        
        data.records.push(newRecord);
        StorageService.saveData(data);
        
        return newRecord;
    },
    
    /**
     * Filtra registros según criterios (una sola entidad)
     * @param {Object} filters Criterios de filtrado
     * @returns {Array} Registros filtrados
     */
    filter(filters = {}) {
        let records = this.getAll();
        
        // Filtrar por entidad
        if (filters.entityId) {
            records = records.filter(record => record.entityId === filters.entityId);
        }
        
        // Filtrar por fecha
        if (filters.fromDate) {
            const fromDate = new Date(filters.fromDate);
            records = records.filter(record => new Date(record.timestamp) >= fromDate);
        }
        
        if (filters.toDate) {
            const toDate = new Date(filters.toDate);
            toDate.setHours(23, 59, 59); // Final del día
            records = records.filter(record => new Date(record.timestamp) <= toDate);
        }
        
        return records;
    },
    
    /**
     * Filtra registros según criterios (múltiples entidades)
     * @param {Object} filters Criterios de filtrado con entityIds como array
     * @returns {Array} Registros filtrados
     */
    filterMultiple(filters = {}) {
        // MEJORA: Cache para evitar recálculos
        const cacheKey = JSON.stringify(filters);
        if (this._filterCache && this._filterCache[cacheKey]) {
            return [...this._filterCache[cacheKey]]; // Devolver copia
        }
        
        let records = this.getAll();
        
        // MEJORA: Filtrar por entidades primero (suele ser el filtro más selectivo)
        if (filters.entityIds && filters.entityIds.length > 0) {
            const entitySet = new Set(filters.entityIds); // Set para búsqueda O(1)
            records = records.filter(record => entitySet.has(record.entityId));
        }
        
        // MEJORA: Pre-calcular fechas para evitar conversiones repetidas
        let fromDate = null, toDate = null;
        if (filters.fromDate) {
            fromDate = new Date(filters.fromDate);
        }
        if (filters.toDate) {
            toDate = new Date(filters.toDate);
            toDate.setHours(23, 59, 59); // Final del día
        }
        
        // Filtrar por fechas si están definidas
        if (fromDate || toDate) {
            records = records.filter(record => {
                const recordDate = new Date(record.timestamp);
                if (fromDate && recordDate < fromDate) return false;
                if (toDate && recordDate > toDate) return false;
                return true;
            });
        }
        
        // Aplicar filtros adicionales
        if (filters.horizontalFieldId && filters.horizontalFieldOption) {
            records = records.filter(record => 
                record.data[filters.horizontalFieldId] === filters.horizontalFieldOption
            );
        }
        
        if (filters.operarioFieldId && filters.operarioOption) {
            records = records.filter(record => 
                record.data[filters.operarioFieldId] === filters.operarioOption
            );
        }
        
        if (typeof filters.customFilter === 'function') {
            records = records.filter(filters.customFilter);
        }
        
        // MEJORA: Guardar en cache (limitado para evitar memory leaks)
        if (!this._filterCache) this._filterCache = {};
        if (Object.keys(this._filterCache).length < 50) {
            this._filterCache[cacheKey] = [...records];
        }
        
        return records;
    },
    
    /**
     * Obtiene los últimos N registros
     * @param {number} limit Número de registros a retornar
     * @returns {Array} Últimos registros
     */
    getRecent(limit = 10) {
        const records = this.getAll();
        return records
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    },
    
    /**
     * Genera datos para reportes comparativos (compatible con múltiples entidades)
     * @param {string} fieldId ID del campo a comparar
     * @param {string} aggregation Tipo de agregación ('sum' o 'average')
     * @param {Object} filters Filtros adicionales (puede incluir entityIds como array)
     * @param {string} horizontalFieldId ID del campo para el eje horizontal (opcional)
     * @returns {Object} Datos para el reporte
     */
    generateReportMultiple(fieldId, aggregation = 'sum', filters = {}, horizontalFieldId = '') {
        try {
            // MEJORA: Validaciones más robustas
            if (!fieldId) {
                return { error: 'ID de campo requerido' };
            }
            
            const field = FieldModel.getById(fieldId);
            if (!field) {
                return { error: 'El campo seleccionado no existe' };
            }
            
            const isNumeric = field.type === 'number';
            const isSelect = field.type === 'select';
            
            if (!isNumeric && !isSelect) {
                return { error: 'El campo debe ser numérico o de selección para generar reportes' };
            }
            
            // MEJORA: Cache para entidades válidas
            const entitiesKey = `entities_${fieldId}_${JSON.stringify(filters.entityIds || [])}`;
            let entities;
            
            if (this._entitiesCache && this._entitiesCache[entitiesKey]) {
                entities = this._entitiesCache[entitiesKey];
            } else {
                entities = EntityModel.getAll().filter(entity => 
                    entity.fields.includes(fieldId)
                );
                
                if (filters.entityIds && filters.entityIds.length > 0) {
                    const entitySet = new Set(filters.entityIds);
                    entities = entities.filter(entity => entitySet.has(entity.id));
                }
                
                // Guardar en cache
                if (!this._entitiesCache) this._entitiesCache = {};
                if (Object.keys(this._entitiesCache).length < 20) {
                    this._entitiesCache[entitiesKey] = entities;
                }
            }
            
            if (entities.length === 0) {
                return { error: 'No hay entidades que coincidan con los filtros y usen este campo' };
            }
            
            const effectiveAggregation = isSelect ? 'count' : aggregation;
            const filteredRecords = this.filterMultiple(filters);
            
            // MEJORA: Manejo optimizado del eje horizontal
            if (horizontalFieldId && horizontalFieldId !== '') {
                return this._generateHorizontalReport(field, effectiveAggregation, filteredRecords, horizontalFieldId, filters);
            }
            
            return this.generateReportByEntities(field, effectiveAggregation, filteredRecords, entities);
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            return { error: 'Error interno generando el reporte' };
        }
    },
    
    /**
     * NUEVO: Método auxiliar para reportes con eje horizontal
     * @private
     */
    _generateHorizontalReport(field, effectiveAggregation, filteredRecords, horizontalFieldId, filters) {
        const horizontalField = FieldModel.getById(horizontalFieldId);
        if (!horizontalField) {
            return { error: 'El campo seleccionado para el eje horizontal no existe' };
        }
        
        const reportData = {
            field: field.name,
            fieldType: field.type,
            horizontalField: horizontalField.name,
            aggregation: effectiveAggregation,
            entities: []
        };
        
        // MEJORA: Usar Set para valores únicos más eficiente
        const uniqueValues = filters.horizontalFieldOption 
            ? new Set([filters.horizontalFieldOption])
            : new Set(filteredRecords
                .map(record => record.data[horizontalFieldId])
                .filter(value => value !== undefined)
              );
        
        // Procesar cada valor único
        for (const value of uniqueValues) {
            const valueRecords = filteredRecords.filter(record => 
                record.data[horizontalFieldId] === value && 
                record.data[field.id] !== undefined
            );
            
            if (valueRecords.length === 0) {
                reportData.entities.push({
                    id: value,
                    name: value,
                    value: 0,
                    count: 0
                });
                continue;
            }
            
            if (field.type === 'select') {
                // Contar ocurrencias para campos de selección
                const optionCounts = {};
                valueRecords.forEach(record => {
                    const optionValue = record.data[field.id];
                    optionCounts[optionValue] = (optionCounts[optionValue] || 0) + 1;
                });
                
                reportData.entities.push({
                    id: value,
                    name: value,
                    value: valueRecords.length,
                    count: valueRecords.length,
                    optionCounts
                });
            } else {
                // Cálculos numéricos
                const values = valueRecords.map(record => 
                    parseFloat(record.data[field.id]) || 0
                );
                
                let aggregatedValue = 0;
                if (effectiveAggregation === 'sum') {
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                } else if (effectiveAggregation === 'average') {
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                }
                
                reportData.entities.push({
                    id: value,
                    name: value,
                    value: aggregatedValue,
                    count: valueRecords.length
                });
            }
        }
        
        return reportData;
    },

    /**
     * Actualiza la fecha de un registro
     * @param {string} id ID del registro
     * @param {string} newDate Nueva fecha (en formato ISO)
     * @returns {Object|null} Registro actualizado o null si no se encuentra
     */
    updateDate(id, newDate) {
        const data = StorageService.getData();
        const recordIndex = data.records.findIndex(record => record.id === id);
        
        if (recordIndex === -1) {
            return null;
        }
        
        data.records[recordIndex].timestamp = newDate;
        StorageService.saveData(data);
        
        return data.records[recordIndex];
    },

    /**
     * Elimina un registro por su ID
     * @param {string} id ID del registro a eliminar
     * @returns {boolean} true si se eliminó correctamente, false si no
     */
    delete(id) {
        const data = StorageService.getData();
        const initialLength = data.records.length;
        
        data.records = data.records.filter(record => record.id !== id);
        
        if (data.records.length !== initialLength) {
            StorageService.saveData(data);
            return true;
        }
        
        return false;
    },

    /**
     * Actualiza un registro completo
     * @param {string} id ID del registro
     * @param {Object} newData Nuevos valores para los campos del registro
     * @param {string} newDate Nueva fecha (en formato ISO)
     * @returns {boolean} true si se actualizó correctamente, false si no
     */
    update(id, newData, newDate) {
        const data = StorageService.getData();
        const recordIndex = data.records.findIndex(record => record.id === id);
        
        if (recordIndex === -1) {
            return false;
        }
        
        // Actualizar los datos del registro
        data.records[recordIndex].data = { ...data.records[recordIndex].data, ...newData };
        
        // Actualizar la fecha si se proporciona
        if (newDate) {
            data.records[recordIndex].timestamp = newDate;
        }
        
        // Guardar los cambios
        StorageService.saveData(data);
        
        return true;
    }
};