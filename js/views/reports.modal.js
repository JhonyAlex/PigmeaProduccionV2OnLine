/**
 * Gestiona los modales de la vista de reportes
 */
const ReportsModal = {
    /**
     * Muestra el modal para editar la fecha de varios registros seleccionados
     * @param {Object} view Vista de reportes
     */
    showEditDateSelectedModal(view) {
        let modalEl = document.getElementById('editDateSelectedModal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.className = 'modal fade';
            modalEl.id = 'editDateSelectedModal';
            modalEl.tabIndex = -1;
            modalEl.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar fecha de registros seleccionados</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="new-date-selected" class="form-label">Nueva fecha y hora</label>
                                <input type="datetime-local" class="form-control" id="new-date-selected">
                            </div>
                            <div id="edit-date-selected-alert"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="confirm-edit-date-selected-btn">Actualizar fecha</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
        }
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();

        document.getElementById('edit-date-selected-alert').innerHTML = '';

        const confirmBtn = document.getElementById('confirm-edit-date-selected-btn');
        confirmBtn.onclick = () => {
            const newDateInput = document.getElementById('new-date-selected');
            const alertDiv = document.getElementById('edit-date-selected-alert');
            if (!newDateInput.value) {
                alertDiv.innerHTML = `<div class="alert alert-warning">Debe seleccionar una fecha y hora.</div>`;
                return;
            }
            const newDateISO = new Date(newDateInput.value).toISOString();
            let updatedCount = 0;
            view.selectedRecordIds.forEach(recordId => {
                const updated = RecordModel.updateDate(recordId, newDateISO);
                if (updated) updatedCount++;
            });
            modal.hide();
            ReportsTable.applyFilters(view);
            view.selectedRecordIds.clear();
            view.updateEditDateSelectedBtn();
            view.updateSelectAllCheckbox();
            UIUtils.showAlert(`Fecha actualizada en ${updatedCount} registro(s)`, 'success', document.querySelector('.container.mt-4'));
        };
    },

    /**
     * Muestra los detalles de un registro en un modal
     * @param {string} recordId ID del registro
     * @param {Object} view Vista de reportes
     */
    showRecordDetails(recordId, view) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };
        const fields = FieldModel.getByIds(Object.keys(record.data));
        const allFields = FieldModel.getAll();
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';

        // Crear el modal si no existe
        let modalElement = document.getElementById('viewRecordModal');
        if (!modalElement) {
            modalElement = document.createElement('div');
            modalElement.className = 'modal fade';
            modalElement.id = 'viewRecordModal';
            modalElement.tabIndex = -1;
            modalElement.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalles del Registro</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <div id="record-details"></div>
                        </div>
                        <div class="modal-footer">
                            <!-- Botones se añaden dinámicamente -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalElement);
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        const recordDetails = modalElement.querySelector('#record-details');
        const modalTitle = modalElement.querySelector('.modal-title');
        modalTitle.textContent = `Detalles del Registro - ${entity.name}`;

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
                            const fieldA = fields.find(f => f.id === fieldIdA) || { name: fieldIdA };
                            const fieldB = fields.find(f => f.id === fieldIdB) || { name: fieldIdB };
                            return fieldA.name.localeCompare(fieldB.name);
                        }).map(([fieldId, value]) => {
                            const field = fields.find(f => f.id === fieldId) || { name: fieldId, type: 'text' };
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
        this.setupModalFooter(recordId, modal, record, view);

        modal.show();
    },

    /**
     * Configura los botones del footer en el modal de detalles
     * @param {string} recordId ID del registro
     * @param {Object} modalInstance Instancia del modal
     * @param {Object} record Datos del registro
     * @param {Object} view Vista de reportes
     */
    setupModalFooter(recordId, modalInstance, record, view) {
        const footerDiv = modalInstance._element.querySelector('.modal-footer');
        footerDiv.innerHTML = '';

        // Botón Eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger me-auto';
        deleteBtn.id = 'deleteRecordBtn';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
        deleteBtn.addEventListener('click', () => this.confirmDeleteRecord(recordId, modalInstance, view));
        footerDiv.appendChild(deleteBtn);

        // Botón Editar/Guardar
        const editSaveBtn = document.createElement('button');
        editSaveBtn.type = 'button';
        editSaveBtn.className = 'btn btn-warning';
        editSaveBtn.id = 'editRecordBtn';
        editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
        editSaveBtn.addEventListener('click', () => this.toggleEditMode(recordId, modalInstance, record, view));
        footerDiv.appendChild(editSaveBtn);

        // Botón Cerrar
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn btn-secondary';
        closeBtn.setAttribute('data-bs-dismiss', 'modal');
        closeBtn.textContent = 'Cerrar';
        footerDiv.appendChild(closeBtn);

        // Listener para resetear el modo al cerrar el modal
        modalInstance._element.addEventListener('hidden.bs.modal', () => {
            this.resetEditMode(modalInstance);
        }, { once: true }); // Ejecutar solo una vez por cierre
    },

    /**
     * Cambia entre modo visualización y edición en el modal de detalles
     * @param {string} recordId ID del registro
     * @param {Object} modalInstance Instancia del modal
     * @param {Object} record Datos del registro
     * @param {Object} view Vista de reportes
     */
    toggleEditMode(recordId, modalInstance, record, view) {
        const editSaveBtn = document.getElementById('editRecordBtn');
        if (!editSaveBtn) {
            console.error("toggleEditMode: Botón 'editRecordBtn' no encontrado.");
            return;
        }

        const isEditing = editSaveBtn.classList.contains('btn-success');

        if (isEditing) {
            // Guardar Cambios
            this.saveRecordChanges(recordId, modalInstance, view);
        } else {
            // Entrar en Modo Edición
            editSaveBtn.classList.remove('btn-warning');
            editSaveBtn.classList.add('btn-success');
            editSaveBtn.innerHTML = '<i class="bi bi-save"></i> Guardar';

            const footerDiv = editSaveBtn.closest('.modal-footer');
            if (!footerDiv) {
                console.error("toggleEditMode: No se pudo encontrar el footer del modal.");
                return;
            }

            // Añadir botón Cancelar
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-outline-secondary';
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => this.resetEditMode(modalInstance, recordId, view));

            const closeBtn = footerDiv.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
                footerDiv.insertBefore(cancelBtn, closeBtn);
            } else {
                footerDiv.appendChild(cancelBtn);
            }

            // Ocultar display, mostrar edit
            const modalElement = modalInstance._element;
            const timestampDisplay = modalElement.querySelector('#record-timestamp-display');
            const timestampEdit = modalElement.querySelector('#record-timestamp-edit');
            if (timestampDisplay) timestampDisplay.style.display = 'none';
            if (timestampEdit) timestampEdit.style.display = 'block';

            const allFields = FieldModel.getAll();

            modalElement.querySelectorAll('#record-fields-container tbody tr').forEach(row => {
                const displayCell = row.querySelector('.field-value-display');
                const editCell = row.querySelector('.field-value-edit');
                const fieldId = row.dataset.fieldId;
                const fieldType = row.dataset.fieldType;
                const currentValue = record.data[fieldId] ?? '';
                const fieldDefinition = allFields.find(f => f.id === fieldId);

                if (displayCell) displayCell.style.display = 'none';
                if (editCell) {
                    editCell.style.display = 'table-cell';
                    editCell.innerHTML = this.generateInputHTML(fieldId, fieldType, currentValue, fieldDefinition);
                }
            });
        }
    },

    /**
     * Genera el HTML para el campo de edición según su tipo
     * @param {string} fieldId ID del campo
     * @param {string} fieldType Tipo de campo
     * @param {*} currentValue Valor actual
     * @param {Object} fieldDefinition Definición del campo
     * @returns {string} HTML del input
     */
    generateInputHTML(fieldId, fieldType, currentValue, fieldDefinition) {
        switch (fieldType) {
            case 'number':
                return `<input type="number" step="any" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
            case 'select':
                if (fieldDefinition?.options?.length > 0) {
                    const optionsHTML = fieldDefinition.options.map(option =>
                        `<option value="${option}" ${String(currentValue) === String(option) ? 'selected' : ''}>${option}</option>`
                    ).join('');
                    return `<select class="form-select form-select-sm edit-field" data-field-id="${fieldId}">${optionsHTML}</select>`;
                }
                return `<input type="text" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
            case 'text':
            default:
                return `<input type="text" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
        }
    },

    /**
     * Restaura el modal al modo visualización
     * @param {Object} modalInstance Instancia del modal
     * @param {string} recordId ID del registro (opcional)
     * @param {Object} view Vista de reportes
     */
    resetEditMode(modalInstance, recordId = null, view) {
        const modalElement = modalInstance._element;
        const editSaveBtn = modalElement.querySelector('#editRecordBtn');
        if (editSaveBtn) {
            editSaveBtn.classList.remove('btn-success');
            editSaveBtn.classList.add('btn-warning');
            editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
        }

        modalElement.querySelector('#cancelEditBtn')?.remove();

        if (recordId && view) {
            this.showRecordDetails(recordId, view);
        } else {
            const timestampDisplay = modalElement.querySelector('#record-timestamp-display');
            const timestampEdit = modalElement.querySelector('#record-timestamp-edit');
            if(timestampDisplay) timestampDisplay.style.display = 'inline';
            if(timestampEdit) timestampEdit.style.display = 'none';

            modalElement.querySelectorAll('#record-fields-container tbody tr').forEach(row => {
                const displayCell = row.querySelector('.field-value-display');
                const editCell = row.querySelector('.field-value-edit');
                if(displayCell) displayCell.style.display = 'table-cell';
                if(editCell) {
                    editCell.style.display = 'none';
                    editCell.innerHTML = '';
                }
            });
        }
    },

    /**
     * Muestra un modal de confirmación para eliminar un registro
     * @param {string} recordId ID del registro
     * @param {Object} viewModalInstance Instancia del modal de detalles
     * @param {Object} view Vista de reportes
     */
    confirmDeleteRecord(recordId, viewModalInstance, view) {
        // Crear modal de confirmación si no existe
        let confirmModalElement = document.getElementById('confirmModal');
        if (!confirmModalElement) {
            confirmModalElement = document.createElement('div');
            confirmModalElement.className = 'modal fade';
            confirmModalElement.id = 'confirmModal';
            confirmModalElement.tabIndex = -1;
            confirmModalElement.innerHTML = `
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Confirmar Acción</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <p id="confirm-message">¿Está seguro?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="confirmActionBtn">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModalElement);
        }

        const confirmModal = bootstrap.Modal.getOrCreateInstance(confirmModalElement);
        document.getElementById('confirm-message').textContent =
            '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.';

        const confirmBtn = document.getElementById('confirmActionBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
            const deleted = RecordModel.delete(recordId);
            confirmModal.hide();
            viewModalInstance.hide();

            if (deleted) {
                ReportsTable.applyFilters(view);
                UIUtils.showAlert('Registro eliminado correctamente', 'success', document.querySelector('.container.mt-4'));
            } else {
                UIUtils.showAlert('Error al eliminar el registro', 'danger', document.querySelector('.container.mt-4'));
            }
        };

        confirmModal.show();
    },

    /**
     * Guarda los cambios en un registro
     * @param {string} recordId ID del registro
     * @param {Object} modal Instancia del modal
     * @param {Object} view Vista de reportes
     */
    saveRecordChanges(recordId, modal, view) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        // Obtener todos los datos editados
        const fieldsData = {};
        let validationError = false;
        document.querySelectorAll('.edit-field').forEach(input => {
            const fieldId = input.getAttribute('data-field-id');
            const value = input.value;
            // Validación básica
            if (input.required && !value.trim()) {
                input.classList.add('is-invalid');
                validationError = true;
            } else {
                input.classList.remove('is-invalid');
            }
            fieldsData[fieldId] = value;
        });

        // Obtener la nueva fecha
        const newTimestampInput = document.getElementById('new-timestamp');
        const newTimestamp = newTimestampInput.value;
        if (!newTimestamp) {
            newTimestampInput.classList.add('is-invalid');
            validationError = true;
        } else {
            newTimestampInput.classList.remove('is-invalid');
        }

        if (validationError) {
            UIUtils.showAlert('Por favor, corrija los campos marcados.', 'warning', document.getElementById('record-details'));
            return;
        }

        // Convertir a formato ISO
        const newDate = new Date(newTimestamp).toISOString();

        // Actualizar el registro
        const success = RecordModel.update(recordId, fieldsData, newDate);

        if (success) {
            this.resetEditMode(modal, recordId, view);
            ReportsTable.applyFilters(view);
            UIUtils.showAlert('Registro actualizado correctamente', 'success', document.getElementById('record-details'));
        } else {
            UIUtils.showAlert('Error al actualizar el registro', 'danger', document.getElementById('record-details'));
        }
    }
};