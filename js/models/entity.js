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
     * @param {Object} updateData Objeto con las propiedades a actualizar (ej. { name: 'nuevoNombre', fields: [...], group: 'nuevoGrupo' })
     * @returns {Object|null} Entidad actualizada o null
     */
    update(id, updateData) {
        const data = StorageService.getData();
        const entityIndex = data.entities.findIndex(entity => entity.id === id);
        
        if (entityIndex === -1) {
            console.error(`EntityModel.update: Entidad con ID ${id} no encontrada.`);
            return null;
        }
        
        // Actualizar solo las propiedades proporcionadas en updateData
        const entityToUpdate = data.entities[entityIndex];
        
        if (updateData.hasOwnProperty('name')) {
            // Asegurarse de que el nombre sea un string
            entityToUpdate.name = String(updateData.name); 
        }
        if (updateData.hasOwnProperty('fields')) {
            // Asegurarse de que fields sea un array
            entityToUpdate.fields = Array.isArray(updateData.fields) ? [...updateData.fields] : []; 
        }
        if (updateData.hasOwnProperty('group')) {
            // Asegurarse de que group sea un string
            entityToUpdate.group = String(updateData.group);
        }
        // Se podrían añadir más propiedades aquí si fuera necesario en el futuro
        
        console.log(`EntityModel.update: Actualizando entidad ${id} con:`, entityToUpdate);
        
        StorageService.saveData(data);
        
        // Devolver una copia para evitar mutaciones accidentales fuera del modelo
        return { ...entityToUpdate }; 
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