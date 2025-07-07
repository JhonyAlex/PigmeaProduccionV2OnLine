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
        const nowIso = new Date().toISOString();
        const newRecord = {
            id: 'record_' + Date.now(),
            entityId: entityId,
            timestamp: nowIso,              // Fecha del registro (puede modificarse)
            createdAt: nowIso,               // Fecha real de creación
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
        let records = this.getAll();
        
        // Filtrar por entidades (múltiples)
        if (filters.entityIds && filters.entityIds.length > 0) {
            records = records.filter(record => filters.entityIds.includes(record.entityId));
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
        
        // Filtrar por opción específica de campo horizontal (si está presente)
        if (filters.horizontalFieldId && filters.horizontalFieldOption) {
            records = records.filter(record => 
                record.data[filters.horizontalFieldId] === filters.horizontalFieldOption
            );
        }
        
        // Filtrar por operario (para análisis detallado)
        if (filters.operarioFieldId && filters.operarioOption) {
            records = records.filter(record => 
                record.data[filters.operarioFieldId] === filters.operarioOption
            );
        }
        
        // Aplicar filtro personalizado si existe (para análisis detallado avanzado)
        if (typeof filters.customFilter === 'function') {
            records = records.filter(filters.customFilter);
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
            .sort((a, b) => {
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.timestamp);
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.timestamp);
                return dateB - dateA;
            })
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
        // Obtenemos el campo
        const field = FieldModel.getById(fieldId);
        // if (!field) { // Original check
        //     return { error: 'El campo seleccionado no existe' };
        // }

        if (!field || field.active === false) {
            console.warn(`RecordModel.generateReportMultiple: Main field ${fieldId} is inactive or not found. Skipping.`);
            return { field: field ? field.name : fieldId, error: 'Field is inactive or not found', entities: [] };
        }
        
        // Verificar si es un campo soportado (numérico o select)
        const isNumeric = field.type === 'number';
        const isSelect = field.type === 'select';
        
        if (!isNumeric && !isSelect) {
            return { error: 'El campo debe ser numérico o de selección para generar reportes' };
        }
        
        // Para campos select, usamos 'count' como agregación
        const effectiveAggregation = isSelect ? 'count' : aggregation;
        
        // Obtenemos las entidades que usan este campo
        // let entities = EntityModel.getAll().filter(entity => // Original line
        let entities = EntityModel.getActive().filter(entity =>
            entity.fields.includes(fieldId)
        );
        
        // Si hay un filtro de entidades específicas, filtramos aún más
        if (filters.entityIds && filters.entityIds.length > 0) {
            entities = entities.filter(entity => filters.entityIds.includes(entity.id));
        }
        
        // Si no hay entidades, no podemos generar el reporte
        if (entities.length === 0) {
            return { error: 'No hay entidades que coincidan con los filtros y usen este campo' };
        }
        
        // Filtramos los registros
        const filteredRecords = this.filterMultiple(filters);
        
        // Si se proporciona un campo para el eje horizontal, lo usamos
        if (horizontalFieldId) {
            // Caso especial: cuando horizontalFieldId es una cadena vacía, significa que estamos agrupando por entidad principal
            if (horizontalFieldId === '') {
                // Este es el caso de "Entidad Principal" como eje horizontal
                console.log("Generando reporte con Entidad Principal como eje horizontal");
                
                // Si hay una entidad específica seleccionada, usar solo esa
                if (filters.specificEntityId) {
                    console.log(`Filtrando por entidad específica: ${filters.specificEntityId}`);
                    const specificEntity = EntityModel.getById(filters.specificEntityId);
                    
                    // if (!specificEntity) { // Original check
                    //     return { error: 'La entidad específica seleccionada no existe' };
                    // }

                    if (!specificEntity || specificEntity.active === false) {
                        console.warn(`RecordModel.generateReportMultiple: Specified entity ${filters.specificEntityId} is inactive or not found.`);
                        return { field: field ? field.name : fieldId, aggregation: effectiveAggregation, entities: [] };
                    }
                    
                    // El resto del procesamiento se hará normalmente, ya que ya filtramos por entityIds
                }
                
                // Seguir con la generación normal ya que el eje horizontal será manejado automáticamente en la sección de entidades
                return this.generateReportByEntities(field, effectiveAggregation, filteredRecords, entities);
            }
            
            // Caso normal: usar un campo como eje horizontal
            let horizontalField = null; // Declare with let to allow modification
            const foundHorizontalField = FieldModel.getById(horizontalFieldId);

            if (foundHorizontalField && foundHorizontalField.active !== false) {
                horizontalField = foundHorizontalField;
            } else if (foundHorizontalField && foundHorizontalField.active === false) {
                console.warn(`RecordModel.generateReportMultiple: Horizontal field ${foundHorizontalField.name} is inactive. It will not be used for grouping.`);
                horizontalField = null; // Explicitly set to null, report will not use it for grouping
            } else {
                // Field not found by ID, original code would have errored earlier if we didn't catch it.
                // For safety, ensure it's null if not found.
                horizontalField = null;
            }

            // If horizontalField is null (not found or inactive), we might not want to proceed with horizontal grouping.
            // The original code had a check: if (!horizontalField) return { error: ... }
            // Now, if it's inactive, we set it to null. The report should then not group by it.

            if (!horizontalField) {
                // If the horizontal field is crucial and not found/inactive, error out.
                // Or, if the report can be generated without it (e.g. by entities), then proceed differently.
                // The original logic returned an error. Let's stick to that if it's not found.
                // If it was found but inactive, we've nulled it, and the reportData.horizontalField will be an issue.
                // The instructions imply that if inactive, it shouldn't be used for grouping.
                // This means the report should still be generated, but not grouped horizontally.
                // This part of the logic might need rethinking based on desired behavior for inactive horizontal field.
                // For now, if `foundHorizontalField` was null from the start:
                if (!foundHorizontalField) {
                     return { error: `El campo seleccionado para el eje horizontal con ID '${horizontalFieldId}' no existe.` };
                }
                // If it was found but inactive, horizontalField is now null.
                // The reportData below will try to access horizontalField.name which will error.
            }
            
            // Agrupar por el valor del campo horizontal
            const reportData = {
                field: field.name,
                fieldType: field.type,
                // horizontalField: horizontalField ? horizontalField.name : null, // Adjust here
                horizontalField: horizontalField ? horizontalField.name : undefined, // Use undefined or handle in UI
                aggregation: effectiveAggregation,
                entities: []
            };
            
            // If horizontalField is null (because it's inactive or not found), skip horizontal grouping
            if (!horizontalField) {
                // If no active horizontal field, fall back to generating report by entities
                console.log("Horizontal field is inactive or not found, generating report by entities instead.");
                return this.generateReportByEntities(field, effectiveAggregation, filteredRecords, entities);
            }

            // Obtener valores únicos del campo horizontal
            const uniqueValues = new Set();
            
            // This block only runs if horizontalField is active and valid.
            // Si hay una opción específica seleccionada, usar solo esa
            if (filters.horizontalFieldOption) {
                uniqueValues.add(filters.horizontalFieldOption);
            } else {
                // Si no hay opción específica, obtener todos los valores únicos
                filteredRecords.forEach(record => {
                    // Use horizontalField.id here because horizontalFieldId is the string ID,
                    // and horizontalField is the actual field object.
                    if (record.data[horizontalField.id] !== undefined) {
                        uniqueValues.add(record.data[horizontalField.id]);
                    }
                });
            }
            
            // Para cada valor único, calcular la agregación
            Array.from(uniqueValues).forEach(value => {
                // Filtrar registros para este valor
                const valueRecords = filteredRecords.filter(record => 
                    record.data[horizontalField.id] === value &&
                    record.data[fieldId] !== undefined
                );
                
                if (valueRecords.length === 0) {
                    reportData.entities.push({
                        id: value,
                        name: value,
                        value: 0,
                        count: 0
                    });
                    return;
                }
                
                // Para campos select, agrupar por valores del campo
                if (isSelect) {
                    // Para campos de selección, contamos las ocurrencias de cada valor
                    const optionCounts = {};
                    valueRecords.forEach(record => {
                        const optionValue = record.data[fieldId];
                        optionCounts[optionValue] = (optionCounts[optionValue] || 0) + 1;
                    });
                    
                    reportData.entities.push({
                        id: value,
                        name: value,
                        value: valueRecords.length, // Número total de registros
                        count: valueRecords.length,
                        optionCounts // Añadir conteo por opción
                    });
                } else {
                    // Para campos numéricos, calcular agregación como antes
                    const values = valueRecords.map(record => 
                        parseFloat(record.data[fieldId]) || 0
                    );
                    
                    // Calcular valor según agregación
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
            });
            
            return reportData;
        }
        
        // Si no hay campo horizontal, usamos las entidades como siempre
        return this.generateReportByEntities(field, effectiveAggregation, filteredRecords, entities);
    },
    
    /**
     * Genera un reporte agrupado por entidades
     * Función auxiliar para generar reportes cuando se usa la entidad como eje horizontal
     * @param {Object} field El campo a analizar
     * @param {string} effectiveAggregation Tipo de agregación ('sum', 'average', 'count')
     * @param {Array} filteredRecords Registros ya filtrados
     * @param {Array} entities Entidades a incluir en el reporte
     * @returns {Object} Datos del reporte
     */
    generateReportByEntities(field, effectiveAggregation, filteredRecords, entities) {
        const fieldId = field.id;
        const isSelect = field.type === 'select';
        
        const reportData = {
            field: field.name,
            fieldType: field.type,
            aggregation: effectiveAggregation,
            entities: []
        };
        
        // Para cada entidad (ya filtradas si hay filtro de entidad), calculamos los valores
        entities.forEach(entity => {
            // Filtrar registros para esta entidad
            const entityRecords = filteredRecords.filter(record => 
                record.entityId === entity.id && 
                record.data[fieldId] !== undefined
            );
            
            if (entityRecords.length === 0) {
                reportData.entities.push({
                    id: entity.id,
                    name: entity.name,
                    value: 0,
                    count: 0
                });
                return;
            }
            
            if (isSelect) {
                // Para campos de selección, contamos las ocurrencias de cada valor
                const optionCounts = {};
                entityRecords.forEach(record => {
                    const optionValue = record.data[fieldId];
                    optionCounts[optionValue] = (optionCounts[optionValue] || 0) + 1;
                });
                
                reportData.entities.push({
                    id: entity.id,
                    name: entity.name,
                    value: entityRecords.length, // Número total de registros
                    count: entityRecords.length,
                    optionCounts // Añadir conteo por opción
                });
            } else {
                // Para campos numéricos, como estaba implementado antes
                // Convertir valores a números
                const values = entityRecords.map(record => 
                    parseFloat(record.data[fieldId]) || 0
                );
                
                // Calcular valor según agregación
                let value = 0;
                if (effectiveAggregation === 'sum') {
                    value = values.reduce((sum, val) => sum + val, 0);
                } else if (effectiveAggregation === 'average') {
                    value = values.reduce((sum, val) => sum + val, 0) / values.length;
                }
                
                reportData.entities.push({
                    id: entity.id,
                    name: entity.name,
                    value: value,
                    count: entityRecords.length
                });
            }
        });
        
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
        
        // Solo actualizamos la fecha del registro sin modificar la de creación
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
    update(id, newData, newDate, newEntityId = null) {
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

        // Actualizar la entidad si se proporciona
        if (newEntityId) {
            data.records[recordIndex].entityId = newEntityId;
        }
        
        // Guardar los cambios
        StorageService.saveData(data);

        return true;
    },

    /**
     * Calcula la suma diaria para un campo numérico
     * @param {string} fieldId ID del campo
     * @param {Date} date Fecha a considerar
     * @returns {number} Suma del día
     */
    getDailySum(fieldId, date) {
        const records = this.getAll();
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        let total = 0;
        records.forEach(rec => {
            const recDate = new Date(rec.timestamp);
            if (recDate >= start && recDate <= end) {
                const val = parseFloat(rec.data[fieldId]);
                if (!isNaN(val)) total += val;
            }
        });
        return total;
    },

    /**
     * Calcula la suma diaria filtrando por referencia
     * @param {string} fieldId ID del campo numérico
     * @param {Date} date Fecha a considerar
     * @param {Object} ref Objeto con tipo y valor de referencia
     * @returns {number} Suma del día
     */
    getDailySumFor(fieldId, date, ref) {
        const records = this.getAll();
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        let total = 0;
        records.forEach(rec => {
            const recDate = new Date(rec.timestamp);
            if (recDate >= start && recDate <= end) {
                if (ref) {
                    if (ref.type === 'entity' && rec.entityId !== ref.id) return;
                    if (ref.type === 'field' && rec.data[ref.id] !== ref.value) return;
                }
                const val = parseFloat(rec.data[fieldId]);
                if (!isNaN(val)) total += val;
            }
        });
        return total;
    }
};