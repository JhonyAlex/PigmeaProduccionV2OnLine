/**
 * Modelo para la gestión de entidades principales
 */
const EntityModel = {
    /**
     * Obtiene todas las entidades
     * @returns {Array} Lista de entidades
     */
    getAll() {
        const data = StorageService.getData();
        return data && data.entities ? data.entities : [];
    },
    
    /**
     * Obtiene una entidad por su ID
     * @param {string} id ID de la entidad
     * @returns {Object|null} Entidad encontrada o null
     */
    getById(id) {
        const entities = this.getAll();
        return entities.find(entity => entity.id === id) || null;
    },
    
    /**
     * Crea una nueva entidad
     * @param {string} name Nombre de la entidad
     * @param {string} group Nombre del grupo de la entidad (opcional)
     * @returns {Object} Entidad creada
     */
    create(name, group = '') {
        const data = StorageService.getData();
        
        // Asegurarse de que data.entities existe
        if (!data.entities) {
            data.entities = [];
        }
        
        const newEntity = {
            id: 'entity_' + Date.now(),
            name: name,
            group: group,
            fields: [] // IDs de campos asignados
        };
        
        data.entities.push(newEntity);
        StorageService.saveData(data);
        
        return newEntity;
    },
    
    /**
     * Actualiza una entidad existente
     * @param {string} id ID de la entidad
     * @param {Object} updateData Objeto con las propiedades a actualizar
     * @returns {Object|null} Entidad actualizada o null
     */
    update(id, updateData) {
        const data = StorageService.getData();
        const entityIndex = data.entities.findIndex(entity => entity.id === id);
        
        if (entityIndex === -1) {
            console.error(`EntityModel.update: Entidad con ID ${id} no encontrada.`);
            return null;
        }
        
        // MEJORA: Crear una copia profunda de la entidad para evitar mutaciones
        const entityToUpdate = JSON.parse(JSON.stringify(data.entities[entityIndex]));
        
        // MEJORA: Validación de datos de entrada
        if (updateData.hasOwnProperty('name')) {
            if (typeof updateData.name !== 'string' || updateData.name.trim() === '') {
                console.error('EntityModel.update: Nombre de entidad inválido');
                return null;
            }
            entityToUpdate.name = String(updateData.name).trim();
        }
        
        if (updateData.hasOwnProperty('fields')) {
            if (!Array.isArray(updateData.fields)) {
                console.error('EntityModel.update: Los campos deben ser un array');
                return null;
            }
            
            // MEJORA: Validar que todos los IDs de campos existan
            const allFields = FieldModel.getAll();
            const validFieldIds = updateData.fields.filter(fieldId => {
                const fieldExists = allFields.some(field => field.id === fieldId);
                if (!fieldExists) {
                    console.warn(`Campo con ID ${fieldId} no existe, se omitirá`);
                }
                return fieldExists;
            });
            
            // Crear array completamente nuevo para forzar detección de cambios
            entityToUpdate.fields = [...validFieldIds];
            
            console.log(`EntityModel.update: Orden final de campos para entidad ${id}:`, 
                       entityToUpdate.fields.map((fieldId, index) => 
                           `${index + 1}. ${fieldId} (${allFields.find(f => f.id === fieldId)?.name || 'Desconocido'})`
                       ));
        }
        
        if (updateData.hasOwnProperty('group')) {
            entityToUpdate.group = String(updateData.group || '').trim();
        }
        
        // MEJORA: Añadir timestamp de última modificación
        entityToUpdate.lastModified = new Date().toISOString();
        
        // Reemplazar la entidad en el array de datos
        data.entities[entityIndex] = entityToUpdate;
        
        console.log(`EntityModel.update: Actualizando entidad ${id}:`, 
                   JSON.stringify(entityToUpdate, null, 2));
        
        // MEJORA: Guardar datos con manejo de errores
        return StorageService.saveData(data).then(() => {
            console.log(`✅ Entidad ${id} actualizada exitosamente`);
            return { ...entityToUpdate };
        }).catch(error => {
            console.error(`❌ Error actualizando entidad ${id}:`, error);
            return null;
        });
    },
    
    /**
     * Elimina una entidad
     * @param {string} id ID de la entidad
     * @returns {boolean} Éxito de la eliminación
     */
    delete(id) {
        const data = StorageService.getData();
        const initialLength = data.entities.length;
        
        data.entities = data.entities.filter(entity => entity.id !== id);
        
        // También eliminamos los registros asociados
        data.records = data.records.filter(record => record.entityId !== id);
        
        StorageService.saveData(data);
        
        return data.entities.length < initialLength;
    },
    
    /**
     * Asigna campos a una entidad
     * @param {string} entityId ID de la entidad
     * @param {Array} fieldIds IDs de los campos a asignar
     * @returns {Object|null} Entidad actualizada o null
     */
    assignFields(entityId, fieldIds) {
        const data = StorageService.getData();
        const entityIndex = data.entities.findIndex(entity => entity.id === entityId);
        
        if (entityIndex === -1) return null;
        
        data.entities[entityIndex].fields = fieldIds;
        StorageService.saveData(data);
        
        return data.entities[entityIndex];
    },
    
    /**
     * Obtiene todos los grupos de entidades únicos
     * @returns {Array} Lista de nombres de grupos únicos
     */
    getAllGroups() {
        const entities = this.getAll();
        // Obtener todos los grupos únicos que no estén vacíos
        const uniqueGroups = [...new Set(entities.map(entity => entity.group).filter(group => group))];
        return uniqueGroups.sort();
    },
    
    /**
     * Obtiene entidades filtradas por grupo
     * @param {string} groupName Nombre del grupo
     * @returns {Array} Lista de entidades del grupo especificado
     */
    getByGroup(groupName) {
        const entities = this.getAll();
        return entities.filter(entity => entity.group === groupName);
    }
};