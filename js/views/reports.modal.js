const ReportsModal = {
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
            view.applyFilters();
            view.selectedRecordIds.clear();
            view.updateEditDateSelectedBtn();
            view.updateSelectAllCheckbox();
            UIUtils.showAlert(`Fecha actualizada en ${updatedCount} registro(s)`, 'success', document.querySelector('.container.mt-4'));
        };
    },

    setupModalFooter(recordId, modalInstance, record, view) {
        const footerDiv = document.querySelector('#viewRecordModal .modal-footer');
        footerDiv.innerHTML = '';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger me-auto';
        deleteBtn.id = 'deleteRecordBtn';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
        deleteBtn.addEventListener('click', () => this.confirmDeleteRecord(recordId, modalInstance, view));
        footerDiv.appendChild(deleteBtn);

        const editSaveBtn = document.createElement('button');
        editSaveBtn.type = 'button';
        editSaveBtn.className = 'btn btn-warning';
        editSaveBtn.id = 'editRecordBtn';
        editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
        editSaveBtn.addEventListener('click', () => this.toggleEditMode(recordId, modalInstance, record, view));
        footerDiv.appendChild(editSaveBtn);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn btn-secondary';
        closeBtn.setAttribute('data-bs-dismiss', 'modal');
        closeBtn.textContent = 'Cerrar';
        footerDiv.appendChild(closeBtn);

        modalInstance._element.addEventListener('hidden.bs.modal', () => {
            this.resetEditMode(modalInstance, view);
        }, { once: true });
    },

    toggleEditMode(recordId, modalInstance, record, view) {
        const editSaveBtn = document.getElementById('editRecordBtn');
        if (!editSaveBtn) {
            console.error("toggleEditMode: Botón 'editRecordBtn' no encontrado.");
            return;
        }

        const isEditing = editSaveBtn.classList.contains('btn-success');

        if (isEditing) {
            this.saveRecordChanges(recordId, modalInstance, view);
        } else {
            editSaveBtn.classList.remove('btn-warning');
            editSaveBtn.classList.add('btn-success');
            editSaveBtn.innerHTML = '<i class="bi bi-save"></i> Guardar';

            const footerDiv = editSaveBtn.closest('.modal-footer');
            if (!footerDiv) {
                console.error("toggleEditMode: No se pudo encontrar el footer del modal.");
                return;
            }

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-outline-secondary';
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => this.resetEditMode(modalInstance, view, recordId));

            const closeBtn = footerDiv.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
                footerDiv.insertBefore(cancelBtn, closeBtn);
            } else {
                footerDiv.appendChild(cancelBtn);
            }

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
                    editCell.innerHTML = this.generateInputHTMLFallback(fieldId, fieldType, currentValue, fieldDefinition);
                }
            });
        }
    },

    generateInputHTMLFallback(fieldId, fieldType, currentValue, fieldDefinition) {
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

    resetEditMode(modalInstance, view, recordId = null) {
        const modalElement = modalInstance._element;
        const editSaveBtn = modalElement.querySelector('#editRecordBtn');
        if (editSaveBtn) {
            editSaveBtn.classList.remove('btn-success');
            editSaveBtn.classList.add('btn-warning');
            editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
        }

        modalElement.querySelector('#cancelEditBtn')?.remove();

        if (recordId) {
            view.showRecordDetails(recordId);
        } else {
            const timestampDisplay = modalElement.querySelector('#record-timestamp-display');
            const timestampEdit = modalElement.querySelector('#record-timestamp-edit');
            if (timestampDisplay) timestampDisplay.style.display = 'inline';
            if (timestampEdit) timestampEdit.style.display = 'none';

            modalElement.querySelectorAll('#record-fields-container tbody tr').forEach(row => {
                const displayCell = row.querySelector('.field-value-display');
                const editCell = row.querySelector('.field-value-edit');
                if (displayCell) displayCell.style.display = 'table-cell';
                if (editCell) {
                    editCell.style.display = 'none';
                    editCell.innerHTML = '';
                }
            });
        }
    },

    confirmDeleteRecord(recordId, viewModalInstance, view) {
        const confirmModalElement = document.getElementById('confirmModal');
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
                view.applyFilters();
                UIUtils.showAlert('Registro eliminado correctamente', 'success', document.querySelector('.container.mt-4'));
            } else {
                UIUtils.showAlert('Error al eliminar el registro', 'danger', document.querySelector('.container.mt-4'));
            }
        };

        confirmModal.show();
    },

    saveRecordChanges(recordId, modal, view) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        const fieldsData = {};
        let validationError = false;
        document.querySelectorAll('.edit-field').forEach(input => {
            const fieldId = input.getAttribute('data-field-id');
            const value = input.value;
            if (input.required && !value.trim()) {
                input.classList.add('is-invalid');
                validationError = true;
            } else {
                input.classList.remove('is-invalid');
            }
            fieldsData[fieldId] = value;
        });

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

        const newDate = new Date(newTimestamp).toISOString();

        const success = RecordModel.update(recordId, fieldsData, newDate);

        if (success) {
            this.resetEditMode(modal, view, recordId);
            view.applyFilters();
            UIUtils.showAlert('Registro actualizado correctamente', 'success', document.getElementById('record-details'));
        } else {
            UIUtils.showAlert('Error al actualizar el registro', 'danger', document.getElementById('record-details'));
        }
    }
};

export { ReportsModal };