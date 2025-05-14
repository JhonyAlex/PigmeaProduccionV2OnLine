/**
 * Módulo para la funcionalidad de filtros y búsqueda en la vista de reportes
 */

/**
 * Configura las funciones de filtros en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupFilterFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con filtros al objeto ReportsView

    /**
     * Aplica los filtros seleccionados y actualiza la vista
     */
    ReportsView.applyFilters = function() {
        const entityFilterSelect = document.getElementById('filter-entity');
        const selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);
        // Obtener nombre personalizado de la entidad
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
        const entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
            ? []
            : selectedEntities;

        const fromDateFilter = document.getElementById('filter-from-date').value;
        const toDateFilter = document.getElementById('filter-to-date').value;

        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };

        // Obtener registros filtrados
        const filteredRecords = RecordModel.filterMultiple(filters);

        // Actualizar contador (antes de la búsqueda)
        // document.getElementById('records-count').textContent = `${filteredRecords.length} registros`; // Movido a filterRecordsBySearch

        // Guardar los registros filtrados para usarlos en la búsqueda
        this.filteredRecords = filteredRecords;

        // Reiniciar la página actual al aplicar nuevos filtros
        this.pagination.currentPage = 1;

        // Mostrar registros (aplicando también el filtro de búsqueda si existe)
        this.filterRecordsBySearch(); // Llama a sort y display
    };

    /**
     * Filtra los registros por texto de búsqueda
     */
    ReportsView.filterRecordsBySearch = function() {
        const searchInput = document.getElementById('search-records');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';


        // Si no hay texto de búsqueda, usar todos los registros filtrados
        let searchedRecords = this.filteredRecords || []; // Asegurarse de que sea un array

        if (searchText && this.filteredRecords) {
            // Filtrar registros que contengan el texto de búsqueda
            searchedRecords = this.filteredRecords.filter(record => {
                // Obtener la entidad
                const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

                // Verificar si el nombre de la entidad coincide
                if (entity.name.toLowerCase().includes(searchText)) return true;

                // Verificar en la fecha
                const formattedDate = UIUtils.formatDate(record.timestamp).toLowerCase();
                if (formattedDate.includes(searchText)) return true;

                // Verificar en los datos del registro (incluyendo campos de columnas seleccionadas)
                const fields = FieldModel.getAll(); // Obtener todos para buscar por nombre

                // Comprobar valores de las columnas seleccionadas
                const col1Value = this.getFieldValue(record, this.selectedColumns.field1, fields);
                const col2Value = this.getFieldValue(record, this.selectedColumns.field2, fields);
                const col3Value = this.getFieldValue(record, this.selectedColumns.field3, fields);

                if (String(col1Value).toLowerCase().includes(searchText)) return true;
                if (String(col2Value).toLowerCase().includes(searchText)) return true;
                if (String(col3Value).toLowerCase().includes(searchText)) return true;


                // Verificar en todos los datos del registro (por si no están en las columnas)
                for (const fieldId in record.data) {
                    // Evitar comprobar de nuevo si ya está en una columna seleccionada
                    if (fieldId === this.selectedColumns.field1 ||
                        fieldId === this.selectedColumns.field2 ||
                        fieldId === this.selectedColumns.field3) {
                        continue;
                    }

                    const field = fields.find(f => f.id === fieldId) || { name: fieldId };
                    const value = String(record.data[fieldId]).toLowerCase();

                    // Verificar si el nombre del campo o su valor coincide
                    if (field.name.toLowerCase().includes(searchText) || value.includes(searchText)) {
                        return true;
                    }
                }

                return false;
            });
        }

        // Guardar los resultados de la búsqueda/filtrado
        this.searchedRecords = searchedRecords;

        // Actualizar contador con el número de registros después de la búsqueda
        const recordsCountSpan = document.getElementById('records-count');
         if (recordsCountSpan) {
            recordsCountSpan.textContent = `${searchedRecords.length} ${this.recordName.toLowerCase()}s`;
         }


        // Ordenar registros según la columna seleccionada y dirección
        const sortedRecords = this.sortRecords(searchedRecords);

        // Actualizar registros con ordenación aplicada
        this.searchedRecords = sortedRecords; // Guardar los ordenados

        // Mostrar registros paginados
        this.displayPaginatedRecords();
    };

    /**
     * Ordena los registros según los criterios de ordenación actuales
     */
    ReportsView.sortRecords = function(records) {
        if (!records) return []; // Devolver array vacío si no hay registros

        const { column, direction } = this.sorting;
        const multiplier = direction === 'asc' ? 1 : -1;

        // Obtener todos los campos una vez para optimizar
        const allFields = FieldModel.getAll();

        return [...records].sort((a, b) => {
            let valueA, valueB;

            switch (column) {
                case 'entity':
                    // Ordenar por nombre de entidad
                    const entityA = EntityModel.getById(a.entityId) || { name: '' };
                    const entityB = EntityModel.getById(b.entityId) || { name: '' };
                    valueA = entityA.name.toLowerCase();
                    valueB = entityB.name.toLowerCase();
                    break;

                case 'timestamp':
                    // Ordenar por fecha
                    valueA = new Date(a.timestamp).getTime();
                    valueB = new Date(b.timestamp).getTime();
                    break;

                case 'field1':
                case 'field2':
                case 'field3':
                    // Ordenar por campos personalizados de las columnas
                    const fieldId = this.selectedColumns[column]; // column es 'field1', 'field2', o 'field3'

                    // Obtener valores usando la función auxiliar, pasando allFields
                    valueA = this.getFieldValue(a, fieldId, allFields);
                    valueB = this.getFieldValue(b, fieldId, allFields);

                    // Si no hay campo seleccionado o el valor es vacío/nulo, tratar como string vacío para consistencia
                    valueA = valueA === null || valueA === undefined ? '' : valueA;
                    valueB = valueB === null || valueB === undefined ? '' : valueB;


                    // Intentar comparación numérica si ambos son números válidos
                    const numA = Number(valueA);
                    const numB = Number(valueB);

                    if (!isNaN(numA) && !isNaN(numB) && String(valueA).trim() !== '' && String(valueB).trim() !== '') {
                        valueA = numA;
                        valueB = numB;
                    } else {
                        // Comparación como strings (ignorando mayúsculas/minúsculas)
                        valueA = String(valueA).toLowerCase();
                        valueB = String(valueB).toLowerCase();
                    }
                    break;

                default:
                     // Por defecto, si no hay columna de ordenación, usar fecha descendente
                     valueA = new Date(a.timestamp).getTime();
                     valueB = new Date(b.timestamp).getTime();
                     // No necesitamos multiplier aquí, la comparación directa lo hará descendente
                     // return valueB - valueA; // Directamente descendente
                     // O mantener la lógica del multiplier:
                     if (valueA < valueB) return 1; // b viene antes que a (desc)
                     if (valueA > valueB) return -1; // a viene antes que b (desc)
                     return 0;
            }

            // Comparar valores (aplicando multiplier)
            if (valueA < valueB) return -1 * multiplier;
            if (valueA > valueB) return 1 * multiplier;
            return 0;
        });
    };

    /**
     * Obtiene el valor de un campo de un registro
     */
    ReportsView.getFieldValue = function(record, fieldId, fields) {
        // Si no hay fieldId, o no hay datos, o el campo específico no existe en los datos, devolver vacío
        if (!fieldId || !record.data || record.data[fieldId] === undefined || record.data[fieldId] === null) {
            return ''; // Devolver string vacío para consistencia
        }

        // No necesitamos buscar el 'field' aquí si solo queremos el valor.
        // La formateo específico (si es necesario) se puede hacer en otro lugar o añadir aquí si se requiere.
        // Por ejemplo, si quisiéramos formatear números o fechas de forma especial.

        // Devolver el valor directamente
        return record.data[fieldId];
    };

    /**
     * Filtra las entidades por grupo
     * @param {string} groupName Nombre del grupo a filtrar
     */
    ReportsView.filterByEntityGroup = function(groupName) {
        if (!groupName) return;
        
        // Obtener el selector de entidades
        const entityFilterSelect = document.getElementById('filter-entity');
        if (!entityFilterSelect) return;
        
        // Obtener las entidades del grupo especificado
        const entitiesInGroup = EntityModel.getByGroup(groupName);
        if (entitiesInGroup.length === 0) return;
        
        // Deseleccionar todas las opciones primero
        Array.from(entityFilterSelect.options).forEach(option => {
            option.selected = false;
        });
        
        // Seleccionar solo las entidades del grupo
        entitiesInGroup.forEach(entity => {
            const option = Array.from(entityFilterSelect.options).find(opt => opt.value === entity.id);
            if (option) option.selected = true;
        });
    };
} 