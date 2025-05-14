/**
 * Módulo para la visualización de registros en la vista de reportes
 */

/**
 * Configura las funciones de visualización de registros en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupRecordDisplayFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con visualización de registros al objeto ReportsView

    /**
     * Actualiza los encabezados de columna según los campos seleccionados
     */
    ReportsView.updateColumnHeaders = function() {
        const fields = FieldModel.getAll();
        
        // Actualizar encabezados de columnas personalizadas
        const column1Header = document.querySelector('th.column-1');
        const column2Header = document.querySelector('th.column-2');
        const column3Header = document.querySelector('th.column-3');
        
        if (column1Header) {
            const field1 = this.selectedColumns.field1 
                ? fields.find(f => f.id === this.selectedColumns.field1) 
                : null;
            column1Header.innerHTML = `${field1 ? field1.name : 'Columna 3'} <i class="bi"></i>`;
        }
        
        if (column2Header) {
            const field2 = this.selectedColumns.field2 
                ? fields.find(f => f.id === this.selectedColumns.field2) 
                : null;
            column2Header.innerHTML = `${field2 ? field2.name : 'Columna 4'} <i class="bi"></i>`;
        }
        
        if (column3Header) {
            const field3 = this.selectedColumns.field3 
                ? fields.find(f => f.id === this.selectedColumns.field3) 
                : null;
            column3Header.innerHTML = `${field3 ? field3.name : 'Columna 5'} <i class="bi"></i>`;
        }
    };

    /**
     * Muestra los registros filtrados en la tabla
     * @param {Array} records - Registros a mostrar
     */
    ReportsView.displayFilteredRecords = function(records) {
        const recordsList = document.getElementById('records-list');
        const noFilteredRecordsDiv = document.getElementById('no-filtered-records');
        const recordsTable = document.getElementById('records-table');
        const paginationControls = document.getElementById('pagination-controls')?.closest('.d-flex');
        const itemsPerPageSelector = document.getElementById('items-per-page')?.closest('.d-flex');

        if (!recordsList || !noFilteredRecordsDiv || !recordsTable) {
            console.error("Elementos de la tabla no encontrados en el DOM.");
            return;
        }

        // Resetear el checkbox "Seleccionar todos"
        const selectAllCheckbox = document.getElementById('select-all-records');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

        // Añadir botón de edición masiva si no existe
        const bulkEditBtn = document.getElementById('bulk-edit-btn');
        if (!bulkEditBtn) {
            const newBulkEditBtn = document.createElement('button');
            newBulkEditBtn.id = 'bulk-edit-btn';
            newBulkEditBtn.className = 'btn btn-warning btn-sm ms-2';
            newBulkEditBtn.innerHTML = '<i class="bi bi-clock"></i> Editar Fechas Seleccionadas';
            newBulkEditBtn.style.display = 'none';
            newBulkEditBtn.addEventListener('click', () => this.showBulkEditModal());
            
            // Buscar el contenedor correcto para el botón
            const headerDiv = document.querySelector('.card-header.bg-primary.text-white.d-flex');
            if (headerDiv && headerDiv.querySelector('div')) {
                headerDiv.querySelector('div').appendChild(newBulkEditBtn);
            }
        } else {
            // Si ya existe el botón, solo ocultar
            bulkEditBtn.style.display = 'none';
        }

        // Mostrar/ocultar elementos según si hay registros
        const hasRecords = records.length > 0;
        noFilteredRecordsDiv.style.display = hasRecords ? 'none' : 'block';
        recordsTable.style.display = hasRecords ? 'table' : 'none';
        
        // Verificar que los elementos existan antes de modificar su visibilidad
        if (paginationControls) {
            paginationControls.style.visibility = hasRecords ? 'visible' : 'hidden';
        }
        if (itemsPerPageSelector) {
            itemsPerPageSelector.style.visibility = hasRecords ? 'visible' : 'hidden';
        }

        // Limpiar lista
        recordsList.innerHTML = '';

        // Si no hay registros, salir
        if (!hasRecords) return;

        // Obtener todos los campos una vez para optimizar
        const allFields = FieldModel.getAll();

        // Renderizar cada registro
        records.forEach(record => {
            const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

            const fieldColumns = {
                field1: this.getFieldValue(record, this.selectedColumns.field1, allFields),
                field2: this.getFieldValue(record, this.selectedColumns.field2, allFields),
                field3: this.getFieldValue(record, this.selectedColumns.field3, allFields)
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="form-check">
                        <input class="form-check-input record-checkbox" type="checkbox" value="${record.id}" id="record-${record.id}">
                    </div>
                </td>
                <td>${entity.name}</td>
                <td>${UIUtils.formatDate(record.timestamp)}</td>
                <td>${fieldColumns.field1}</td>
                <td>${fieldColumns.field2}</td>
                <td>${fieldColumns.field3}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-record" data-record-id="${record.id}" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;

            recordsList.appendChild(row);
        });

        // Añadir event listeners para los checkboxes
        document.querySelectorAll('.record-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.record-checkbox:checked').length;
                const bulkEditBtn = document.getElementById('bulk-edit-btn');
                if (bulkEditBtn) {
                    bulkEditBtn.style.display = selectedCount > 0 ? 'inline-block' : 'none';
                }
            });
        });

        // Disparar evento personalizado para actualizar el índice
        document.dispatchEvent(new CustomEvent('records-loaded', { detail: { count: records.length } }));
        
        // Si no hay registros, mostrar mensaje
        if (records.length === 0) {
            noFilteredRecordsDiv.style.display = 'block';
            recordsTable.style.display = 'none';
            
            // Ocultar paginación y selector de registros por página
            if (paginationControls) paginationControls.style.visibility = 'hidden';
            if (itemsPerPageSelector) itemsPerPageSelector.style.visibility = 'hidden';
            return;
        }
    };

    /**
     * Muestra el modal con los detalles de un registro
     * @param {string} recordId - ID del registro a mostrar
     */
    ReportsView.showRecordDetails = function(recordId) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };
        const fields = FieldModel.getByIds(Object.keys(record.data)); // Campos usados en este registro
        const allFields = FieldModel.getAll(); // Todos los campos para el selector de tipo
        // Obtener nombre personalizado de la entidad
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';

        // Usar UIUtils para obtener o crear el modal
        const modalElement = document.getElementById('viewRecordModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement); // Usar getOrCreateInstance

        const recordDetails = document.getElementById('record-details');
        const modalTitle = modalElement.querySelector('.modal-title');
        modalTitle.textContent = `Detalles del ${this.recordName} - ${entity.name}`; // Título más específico

        // Preparar contenido del modal
        const detailsHTML = `
            <div class="mb-3 row">
                <strong class="col-sm-3 col-form-label">${entityName}:</strong>
                <div class="col-sm-9">
                    <input type="text" readonly class="form-control-plaintext" value="${entity.name}">
                </div>
            </div>
            <div class="mb-3 row">
                <strong class="col-sm-3 col-form-label">Fecha y Hora:</strong>
                <div class="col-sm-9">
                     <span id="record-timestamp-display">${UIUtils.formatDate(record.timestamp)}</span>
                     <div id="record-timestamp-edit" style="display: none;">
                         <input type="datetime-local" id="new-timestamp" class="form-control form-control-sm" value="${new Date(record.timestamp).toISOString().slice(0, 16)}">
                     </div>
                </div>
            </div>
            <hr>
            <h6>Datos Registrados:</h6>
            <div id="record-fields-container">
                <table class="table table-sm table-bordered mt-2">
                    <thead class="table-light">
                        <tr>
                            <th>Campo</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(record.data).sort(([fieldIdA], [fieldIdB]) => {
                            // Ordenar campos alfabéticamente por nombre
                            const fieldA = fields.find(f => f.id === fieldIdA) || { name: fieldIdA };
                            const fieldB = fields.find(f => f.id === fieldIdB) || { name: fieldIdB };
                            return fieldA.name.localeCompare(fieldB.name);
                        }).map(([fieldId, value]) => {
                            const field = fields.find(f => f.id === fieldId) || { name: fieldId, type: 'text' }; // Default a text si no se encuentra
                            return `
                                <tr data-field-id="${fieldId}" data-field-type="${field.type || 'text'}">
                                    <td>${field.name}</td>
                                    <td class="field-value-display">${value}</td>
                                    <td class="field-value-edit" style="display: none;">
                                        <!-- Input se generará dinámicamente al editar -->
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        recordDetails.innerHTML = detailsHTML;

        // Configurar botones del footer
        this.setupModalFooter(recordId, modal, record);

        modal.show();
    };
} 