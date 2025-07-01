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
     * Obtiene todas las entidades activas
     * @returns {Array} Lista de entidades activas
     */
    getActive() {
        return this.getAll().filter(ent => ent.active !== false);
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
     * @param {boolean} [dailyProgressRef=false] Si la entidad es referencia para el progreso diario
     * @param {boolean} [active=true] Indica si la entidad inicia activa
     * @returns {Object} Entidad creada
     */
    create(name, group = '', dailyProgressRef = false, active = true, massEdit = false) {
        const data = StorageService.getData();
        
        // Asegurarse de que data.entities existe
        if (!data.entities) {
            data.entities = [];
        }
        
        const newEntity = {
            id: 'entity_' + Date.now(),
            name: name,
            group: group,
            fields: [], // IDs de campos asignados
            dailyProgressRef: !!dailyProgressRef,
            massEdit: !!massEdit,
            active: !!active
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
            // Asegurarse de que fields sea un array y preservar el orden exacto
            // Importante: creamos una nueva instancia del array para asegurar que se detecte el cambio
            entityToUpdate.fields = Array.isArray(updateData.fields) ? [...updateData.fields] : [];
            
            // Registrar el orden para depuración
            console.log(`EntityModel.update: Nuevo orden de campos para entidad ${id}:`, 
                         JSON.stringify(entityToUpdate.fields));
        }
        if (updateData.hasOwnProperty('group')) {
            // Asegurarse de que group sea un string
            entityToUpdate.group = String(updateData.group);
        }
        if (updateData.hasOwnProperty('dailyProgressRef')) {
            entityToUpdate.dailyProgressRef = !!updateData.dailyProgressRef;
        }
        if (updateData.hasOwnProperty('massEdit')) {
            entityToUpdate.massEdit = !!updateData.massEdit;
        }
        if (updateData.hasOwnProperty('active')) {
            entityToUpdate.active = !!updateData.active;
        }
        // Se podrían añadir más propiedades aquí si fuera necesario en el futuro
        
        console.log(`EntityModel.update: Actualizando entidad ${id} con:`, JSON.stringify(entityToUpdate, null, 2));
        
        // Guardar los datos actualizados
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
     * Obtiene grupos solo de entidades activas
     * @returns {Array} Lista de grupos
     */
    getActiveGroups() {
        const entities = this.getActive();
        const uniqueGroups = [...new Set(entities.map(e => e.group).filter(g => g))];
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
    },

    /**
     * Obtiene entidades activas de un grupo
     * @param {string} groupName Nombre del grupo
     * @returns {Array} Entidades activas del grupo
     */
    getActiveByGroup(groupName) {
        return this.getByGroup(groupName).filter(e => e.active !== false);
    },

    /**
     * Devuelve la entidad marcada como referencia del progreso diario
     * @returns {Object|null} Entidad con dailyProgressRef activo
     */
    getDailyProgressRefEntity() {
        const entities = this.getAll() || [];
        return entities.find(e => e.dailyProgressRef) || null;
    },

    /**
     * Devuelve la entidad habilitada para cambios masivos
     * @returns {Object|null} Entidad con massEdit activo
     */
    getMassEditEntity() {
        const entities = this.getAll() || [];
        return entities.find(e => e.massEdit) || null;

    }
};