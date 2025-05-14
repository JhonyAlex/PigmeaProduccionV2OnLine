/**
 * Módulo para la funcionalidad de edición de registros en la vista de reportes
 */

/**
 * Configura las funciones de edición de registros en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupRecordEditingFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con edición de registros al objeto ReportsView

    /**
     * Configura los botones y listeners del footer del modal de detalles/edición
     */
    ReportsView.setupModalFooter = function(recordId, modalInstance, record) {
        const footerDiv = document.querySelector('#viewRecordModal .modal-footer');
        footerDiv.innerHTML = ''; // Limpiar footer

        // Botón Eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn-danger me-auto';
        deleteBtn.id = 'deleteRecordBtn';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
        deleteBtn.addEventListener('click', () => this.confirmDeleteRecord(recordId, modalInstance));
        footerDiv.appendChild(deleteBtn);

        // Botón Editar/Guardar
        const editSaveBtn = document.createElement('button');
        editSaveBtn.type = 'button';
        editSaveBtn.className = 'btn btn-warning';
        editSaveBtn.id = 'editRecordBtn';
        editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
        editSaveBtn.addEventListener('click', () => this.toggleEditMode(recordId, modalInstance, record));
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
    };

    /**
     * Cambia entre el modo de visualización y edición en el modal
     */
    ReportsView.toggleEditMode = function(recordId, modalInstance, record) {
        // --- Obtener el botón Editar/Guardar ---
        const editSaveBtn = document.getElementById('editRecordBtn');
        // --- Añadir verificación por si no se encuentra ---
        if (!editSaveBtn) {
            console.error("toggleEditMode: Botón 'editRecordBtn' no encontrado.");
            return;
        }
        // -------------------------------------------------

        const isEditing = editSaveBtn.classList.contains('btn-success'); // Si ya está en modo guardar

        if (isEditing) {
            // Guardar Cambios
            this.saveRecordChanges(recordId, modalInstance);
        } else {
            // Entrar en Modo Edición
            editSaveBtn.classList.remove('btn-warning');
            editSaveBtn.classList.add('btn-success');
            editSaveBtn.innerHTML = '<i class="bi bi-save"></i> Guardar';

            // --- DEFINIR footerDiv AQUÍ ---
            const footerDiv = editSaveBtn.closest('.modal-footer'); // Buscar el ancestro más cercano
            // --- Añadir verificación ---
            if (!footerDiv) {
                console.error("toggleEditMode: No se pudo encontrar el footer del modal.");
                return; // Salir si no se encuentra el footer
            }
            // ---------------------------

            // Añadir botón Cancelar
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-outline-secondary';
            cancelBtn.id = 'cancelEditBtn';
            cancelBtn.textContent = 'Cancelar';
            cancelBtn.addEventListener('click', () => this.resetEditMode(modalInstance, recordId));

            // Insertar antes del botón de cerrar
            const closeBtn = footerDiv.querySelector('[data-bs-dismiss="modal"]');
            // --- Ahora footerDiv está definido ---
            if (closeBtn) {
                footerDiv.insertBefore(cancelBtn, closeBtn);
            } else {
                footerDiv.appendChild(cancelBtn);
            }
            // -----------------------------------

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
                    // --- CORRECCIÓN: Generar HTML una sola vez ---
                    // Usamos this.generateInputHTMLFallback directamente aquí
                    editCell.innerHTML = this.generateInputHTMLFallback(fieldId, fieldType, currentValue, fieldDefinition);
                    // --- FIN CORRECCIÓN ---
                }
            });
        }
    };

    /**
     * Genera el HTML para un input de edición
     */
    ReportsView.generateInputHTMLFallback = function(fieldId, fieldType, currentValue, fieldDefinition) {
        switch (fieldType) {
            case 'number':
                // Usar step="any" para permitir decimales si es necesario
                return `<input type="number" step="any" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
            case 'select':
                if (fieldDefinition?.options?.length > 0) {
                    const optionsHTML = fieldDefinition.options.map(option =>
                        // Comparar como strings por seguridad
                        `<option value="${option}" ${String(currentValue) === String(option) ? 'selected' : ''}>${option}</option>`
                    ).join('');
                    return `<select class="form-select form-select-sm edit-field" data-field-id="${fieldId}">${optionsHTML}</select>`;
                }
                // Fallback a texto si no hay opciones
                return `<input type="text" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
            case 'text':
            default:
                return `<input type="text" class="form-control form-control-sm edit-field" data-field-id="${fieldId}" value="${currentValue}">`;
        }
    };

    /**
     * Restaura el modal al modo de visualización
     */
    ReportsView.resetEditMode = function(modalInstance, recordId = null) {
        // ... (código de resetEditMode sin cambios) ...
         const modalElement = modalInstance._element; // Asegurarse de tener modalElement
         const editSaveBtn = modalElement.querySelector('#editRecordBtn'); // Buscar dentro del modal
         if (editSaveBtn) {
             editSaveBtn.classList.remove('btn-success');
             editSaveBtn.classList.add('btn-warning');
             editSaveBtn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
         }

         modalElement.querySelector('#cancelEditBtn')?.remove(); // Buscar dentro del modal

         if (recordId) {
              this.showRecordDetails(recordId);
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
    };

    /**
     * Muestra confirmación antes de eliminar un registro
     */
    ReportsView.confirmDeleteRecord = function(recordId, viewModalInstance) {
        const confirmModalElement = document.getElementById('confirmModal');
        const confirmModal = bootstrap.Modal.getOrCreateInstance(confirmModalElement);
        document.getElementById('confirm-message').textContent =
            '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.';

        const confirmBtn = document.getElementById('confirmActionBtn');
        // Clonar y reemplazar para evitar listeners duplicados
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => { // Usar onclick para simplicidad aquí
            const deleted = RecordModel.delete(recordId);
            confirmModal.hide();
            viewModalInstance.hide(); // Ocultar modal de detalles también

            if (deleted) {
                this.applyFilters(); // Actualizar lista de registros
                // Mostrar alerta en el contenedor principal de reportes
                UIUtils.showAlert(`${this.recordName} eliminado correctamente`, 'success', document.querySelector('.container.mt-4'));
            } else {
                 UIUtils.showAlert(`Error al eliminar el ${this.recordName.toLowerCase()}`, 'danger', document.querySelector('.modal-body'));
            }
        };

        confirmModal.show();
    };

    /**
     * Guarda los cambios realizados a un registro
     */
    ReportsView.saveRecordChanges = function(recordId, modal) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        // Obtener todos los datos editados
        const fieldsData = {};
        let validationError = false;
        document.querySelectorAll('.edit-field').forEach(input => {
            const fieldId = input.getAttribute('data-field-id');
            const value = input.value;
            // Validación básica (se podría expandir)
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
            // Salir del modo edición y mostrar los datos actualizados
            this.resetEditMode(modal, recordId); // Pasa recordId para recargar

            // Actualizar la lista de registros en segundo plano
            this.applyFilters();

            // Mostrar mensaje de éxito dentro del modal
            UIUtils.showAlert(`${this.recordName} actualizado correctamente`, 'success', document.getElementById('record-details'));
        } else {
            UIUtils.showAlert(`Error al actualizar el ${this.recordName.toLowerCase()}`, 'danger', document.getElementById('record-details'));
        }
    };

    /**
     * Muestra el modal para editar fechas de registros seleccionados
     */
    ReportsView.showBulkEditModal = function() {
        const modal = UIUtils.initModal('bulkEditModal');
        const modalTitle = document.getElementById('bulkEditModalLabel');
        
        if (modalTitle) {
            modalTitle.textContent = `Editar Fechas de ${this.recordName}s Seleccionados`;
        }
        
        const dateInput = document.getElementById('bulk-edit-date');
        if (dateInput) {
            // Establecer fecha actual por defecto
            dateInput.value = this.formatDateForInput(new Date());
        }
        
        // Configurar botón de guardar
        const saveBtn = document.getElementById('saveBulkEdit');
        if (saveBtn) {
            // Eliminar event listeners anteriores
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            
            // Añadir nuevo event listener
            newBtn.addEventListener('click', () => {
                this.saveBulkEdit();
            });
        }
        
        modal.show();
    };

    /**
     * Guarda los cambios de edición masiva de fechas
     */
    ReportsView.saveBulkEdit = function() {
        const selectedRecords = Array.from(document.querySelectorAll('.record-checkbox:checked'))
            .map(checkbox => checkbox.value);
            
        if (selectedRecords.length === 0) {
            UIUtils.showAlert(`No hay ${this.recordName.toLowerCase()}s seleccionados`, 'warning');
            return;
        }
        
        const dateInput = document.getElementById('bulk-edit-date');
        if (!dateInput || !dateInput.value) {
            UIUtils.showAlert('Seleccione una fecha válida', 'warning');
            return;
        }
        
        const newDate = new Date(dateInput.value);
        let success = true;
        let failedCount = 0;
        
        // Actualizar cada registro seleccionado
        selectedRecords.forEach(recordId => {
            const updateSuccess = RecordModel.updateDate(recordId, newDate.toISOString());
            if (!updateSuccess) {
                success = false;
                failedCount++;
            }
        });
        
        // Cerrar modal
        const modalElement = document.getElementById('bulkEditModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        // Mostrar mensaje de resultado
        if (success) {
            UIUtils.showAlert(
                `Fechas actualizadas correctamente para ${selectedRecords.length} ${this.recordName.toLowerCase()}s`, 
                'success', 
                document.querySelector('.container.mt-4')
            );
        } else {
            UIUtils.showAlert(
                `Hubo errores al actualizar ${failedCount} de ${selectedRecords.length} ${this.recordName.toLowerCase()}s`, 
                'warning', 
                document.querySelector('.container.mt-4')
            );
        }
        
        // Actualizar vista
        this.applyFilters();
    };

    /**
     * Elimina fondos modales que puedan haberse quedado
     */
    ReportsView.removeModalBackdrop = function() {
        // Esta función puede volverse compleja y propensa a errores al interactuar
        // directamente con el manejo de modales de Bootstrap.
        // Generalmente, es mejor dejar que Bootstrap maneje sus backdrops.
        // Si hay problemas persistentes, considera investigar por qué Bootstrap no los limpia.
        // Forzar la eliminación puede tener efectos secundarios inesperados.

        // Intento simple de cerrar todos los modales abiertos por Bootstrap:
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modalEl => {
            const instance = bootstrap.Modal.getInstance(modalEl);
            if (instance) {
                instance.hide();
            }
        });

        // Bootstrap debería eliminar los backdrops al llamar a hide().
        // Si aún quedan, podría ser un bug o una interacción inesperada.
        // Como último recurso (no recomendado):
        // setTimeout(() => {
        //     document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
        //     document.body.classList.remove('modal-open');
        //     document.body.style.overflow = '';
        //     document.body.style.paddingRight = '';
        // }, 500); // Esperar a que terminen las transiciones de Bootstrap
        console.warn("removeModalBackdrop: Se recomienda dejar que Bootstrap maneje los backdrops.");
    };
} 