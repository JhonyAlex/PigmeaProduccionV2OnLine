/**
 * Vista de registro para capturar datos
 */
const RegisterView = {
    /**
     * Nombre personalizado para "Entidad"
     */
    entityName: 'Entidad',
    
    /**
     * Inicializa la vista de registro
     */
    init() {
        try {
            // Obtener el nombre personalizado para "Entidad"
            const config = StorageService.getConfig();
            if (config && config.entityName) {
                this.entityName = config.entityName;
            }
            
            // Verificar que el elemento principal existe
            let mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.warn("Elemento .main-content no encontrado en RegisterView, creándolo...");
                const container = document.querySelector('.container') || document.body;
                mainContent = document.createElement('div');
                mainContent.className = 'main-content mt-4';
                container.appendChild(mainContent);
            }
            
            this.render();
            this.setupEventListeners();
            this.loadRecentRecords();
        } catch (error) {
            console.error("Error al inicializar RegisterView:", error);
            UIUtils.showAlert('Error al inicializar la vista de registros', 'danger');
        }
    },
    
    /**
     * Renderiza el contenido de la vista
     */
    render() {
        try {
            // Usar el contenedor de vista activa del Router
            const mainContent = Router.getActiveViewContainer() || document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento contenedor no encontrado en render()");
                return;
            }
            
            const entities = EntityModel.getAll() || [];
            
            const entityButtons = entities.map(entity => 
                `<button class="btn btn-outline-primary entity-btn mb-2 me-2" data-entity-id="${entity.id}">${entity.name}</button>`
            ).join('');
            
            const noEntitiesMessage = entities.length === 0 ? 
                `<div class="alert alert-warning">No hay ${this.entityName.toLowerCase()}s configuradas. Cree algunas en la sección de Administración.</div>` : '';
            
            mainContent.innerHTML = `
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>Nuevo registro</h5>
                            </div>
                            <div class="card-body">
                                <form id="register-form">
                                    <div class="mb-3">
                                        <label class="form-label">Seleccione ${this.entityName}</label>
                                        <div class="d-flex flex-wrap">
                                            ${entityButtons}
                                        </div>
                                        ${noEntitiesMessage}
                                        <input type="hidden" id="selected-entity-id" value="">
                                    </div>
                                    
                                    <div id="dynamic-fields-container">
                                        <!-- Los campos se cargan dinámicamente -->
                                    </div>
                                    
                                    <div id="submit-container" style="display: none;">
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="yesterday-check">
                                            <label class="form-check-label" for="yesterday-check">
                                                Registrar como de ayer
                                            </label>
                                        </div>
                                        <button type="submit" class="btn btn-primary">Guardar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>Registros recientes</h5>
                            </div>
                            <div class="card-body">
                                <div id="no-records-message" style="display: none;">
                                    <p class="text-muted">No hay registros recientes.</p>
                                </div>
                                
                                <table id="recent-records-table" class="table table-striped table-hover" style="display: none;">
                                    <thead>
                                        <tr>
                                            <th>${this.entityName}</th>
                                            <th>Fecha</th>
                                            <th>Datos</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="recent-records-list"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Error al renderizar RegisterView:", error);
            // Mostrar mensaje de error en algún lugar visible
            const errorContainer = document.querySelector('.container') || document.body;
            errorContainer.innerHTML += `
                <div class="alert alert-danger mt-3">
                    Error al cargar la vista. Por favor recarga la página.
                </div>
            `;
        }
    },
    
    /**
     * Establece los event listeners para la vista
     */
    setupEventListeners() {
        // Verificar que los elementos necesarios existen
        const form = document.getElementById('register-form');
        if (!form) {
            console.error("Formulario de registro no encontrado");
            return;
        }
        
        // Botones de entidad
        document.querySelectorAll('.entity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const clickedButton = e.target;
                const entityId = clickedButton.getAttribute('data-entity-id');
                const selectedEntityIdInput = document.getElementById('selected-entity-id');
                
                if (!selectedEntityIdInput) {
                    console.error("Elemento selected-entity-id no encontrado");
                    return;
                }
                
                const currentEntityId = selectedEntityIdInput.value;
                const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
                
                if (!dynamicFieldsContainer) {
                    console.error("Contenedor de campos dinámicos no encontrado");
                    return;
                }
                
                const isToggle = entityId === currentEntityId && dynamicFieldsContainer.innerHTML !== '';
                
                // Si es toggle, deseleccionar el botón y limpiar campos
                if (isToggle) {
                    clickedButton.classList.remove('btn-primary');
                    clickedButton.classList.add('btn-outline-primary');
                    selectedEntityIdInput.value = '';
                    this.loadDynamicFields(''); // Pasamos string vacío para limpiar
                } else {
                    // Quitar clase activa de todos los botones
                    document.querySelectorAll('.entity-btn').forEach(btn => {
                        btn.classList.remove('btn-primary');
                        btn.classList.add('btn-outline-primary');
                    });
                    
                    // Agregar clase activa al botón seleccionado
                    clickedButton.classList.remove('btn-outline-primary');
                    clickedButton.classList.add('btn-primary');
                    
                    // Guardar ID de entidad seleccionada
                    selectedEntityIdInput.value = entityId;
                    
                    // Cargar campos dinámicos
                    this.loadDynamicFields(entityId);
                }
            });
        });
        
        // Envío del formulario
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });
    },
    
    /**
     * Carga los campos dinámicos basados en la entidad seleccionada
     * @param {string} entityId ID de la entidad seleccionada
     */
    loadDynamicFields(entityId) {
        // Obtener el contenedor de campos dinámicos
        const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
        if (!dynamicFieldsContainer) {
            console.error('Contenedor de campos dinámicos no encontrado');
            return;
        }
        
        // Limpiar contenedor
        dynamicFieldsContainer.innerHTML = '';
        
        // Si no hay entidad seleccionada, ocultar el botón de envío
        const submitContainer = document.getElementById('submit-container');
        if (submitContainer) {
            submitContainer.style.display = entityId ? 'block' : 'none';
        }
        
        if (!entityId) return;
        
        // Obtener entidad y sus campos
        const entity = EntityModel.getById(entityId);
        if (!entity) {
            console.error('Entidad no encontrada:', entityId);
            return;
        }
        
        // Asegurarse de que entity.fields existe
        if (!entity.fields || !Array.isArray(entity.fields)) {
            console.warn('La entidad no tiene campos asignados');
            entity.fields = [];
        }
        
        // Obtener campos asignados a la entidad
        const fields = FieldModel.getByIds(entity.fields);
        if (!fields || fields.length === 0) {
            dynamicFieldsContainer.innerHTML = `
                <div class="alert alert-info">
                    No hay campos configurados para esta ${this.entityName.toLowerCase()}.
                    Configure algunos en la sección de Administración.
                </div>
            `;
            return;
        }
        
        // Array para guardar funciones de limpieza (para selects buscables)
        const cleanupFunctions = [];
        
        // Renderizar cada campo
        fields.forEach(field => {
            if (!field) return; // Saltarse campos nulos o indefinidos
            
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'mb-3';
            
            let fieldHTML = '';
            
            // Crear etiqueta (con asterisco si es requerido)
            fieldHTML += `<label for="${field.id}" class="form-label">
                ${field.name}${field.required ? ' <span class="text-danger">*</span>' : ''}
            </label>`;
            
            // Crear input según el tipo
            switch (field.type) {
                case 'text':
                    fieldHTML += `<input type="text" class="form-control" id="${field.id}" 
                        name="${field.id}" ${field.required ? 'required' : ''}>`;
                    break;
                    
                case 'number':
                    fieldHTML += `<input type="number" class="form-control" id="${field.id}" 
                        name="${field.id}" ${field.required ? 'required' : ''}>`;
                    break;
                    
                case 'select':
                    // Para selects, utilizamos la utilidad SearchableSelect
                    fieldHTML += `<select class="form-select" id="${field.id}" 
                        name="${field.id}" style="visibility: hidden" ${field.required ? 'required' : ''}>
                        <option value="">Seleccione...</option>`;
                        
                    // Agregar opciones
                    if (field.options && Array.isArray(field.options)) {
                        field.options.forEach(option => {
                            fieldHTML += `<option value="${option}">${option}</option>`;
                        });
                    }
                    
                    fieldHTML += `</select>`;
                    break;
                    
                default:
                    fieldHTML += `<input type="text" class="form-control" id="${field.id}" 
                        name="${field.id}" ${field.required ? 'required' : ''}>`;
            }
            
            fieldContainer.innerHTML = fieldHTML;
            dynamicFieldsContainer.appendChild(fieldContainer);
            
            // Configurar SearchableSelect para campos tipo select
            if (field.type === 'select') {
                // CORRECCIÓN: Almacenar la función de limpieza devuelta por setupSearchableSelect
                const cleanup = UIUtils.setupSearchableSelect(`#${field.id}`);
                if (typeof cleanup === 'function') {
                    cleanupFunctions.push(cleanup);
                }
                
                // Hacer visible el select una vez inicializado
                const selectElement = document.getElementById(field.id);
                if (selectElement) {
                    selectElement.style.visibility = 'visible';
                }
            }
        });
        
        // CORRECCIÓN: Agregar una función de limpieza al contenedor para eliminar listeners
        if (cleanupFunctions.length > 0) {
            dynamicFieldsContainer.addEventListener('DOMNodeRemoved', function handler() {
                // Limpiar listeners cuando se elimine el contenedor
                cleanupFunctions.forEach(cleanup => cleanup());
                dynamicFieldsContainer.removeEventListener('DOMNodeRemoved', handler);
            });
        }
    },
    
    /**
     * Guarda un nuevo registro
     */
    saveRecord() {
        const form = document.getElementById('register-form');
        const entityId = document.getElementById('selected-entity-id').value;

        if (!form || !entityId) {
            console.error("Formulario o ID de entidad no encontrado");
            UIUtils.showAlert(`Debe seleccionar una ${this.entityName.toLowerCase()}`, 'warning', document.querySelector('.card-body'));
            return;
        }

        // Obtener entidad y sus campos
        const entity = EntityModel.getById(entityId);
        if (!entity) return;

        const fields = FieldModel.getByIds(entity.fields);

        // Validar el formulario
        const validation = ValidationUtils.validateForm(form, fields);

        if (!validation.isValid) {
            UIUtils.showAlert('Por favor complete correctamente todos los campos requeridos', 'warning', document.querySelector('.card-body'));
            return;
        }

        // Verificar si el checkbox "Ayer" está marcado
        const yesterdayCheck = document.getElementById('yesterday-check');
        const useYesterdayDate = yesterdayCheck && yesterdayCheck.checked;

        // Guardar registro
        const newRecord = RecordModel.create(entityId, validation.data);

        if (newRecord) {
            // Si el checkbox de ayer está marcado, actualizar la fecha
            if (useYesterdayDate) {
                // Obtener la fecha actual del registro
                const currentDate = new Date(newRecord.timestamp);

                // Restar un día manteniendo la misma hora
                currentDate.setDate(currentDate.getDate() - 1);

                // Actualizar la fecha del registro
                RecordModel.updateDate(newRecord.id, currentDate.toISOString());
            }

            // --- INICIO: Modificación ---
            // Comentamos o eliminamos las líneas que limpian el formulario
            // para que los datos persistan después de guardar.

            // // Disparar un evento personalizado antes de limpiar el formulario
            // // para que los componentes puedan prepararse para la eliminación
            // const cleanupEvent = new CustomEvent('prepareFormReset', {
            //     bubbles: true, detail: { formId: form.id }
            // });
            // form.dispatchEvent(cleanupEvent);

            // // Limpiar formulario
            // form.reset(); // <--- NO resetear el formulario

            // // Limpiar el contenedor de campos correctamente
            // const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
            // if (dynamicFieldsContainer) {
            //     // Antes de limpiar, disparar evento para que los listeners puedan limpiarse
            //     dynamicFieldsContainer.dispatchEvent(new Event('DOMNodeRemoved', { bubbles: true }));
            //     dynamicFieldsContainer.innerHTML = ''; // <--- NO limpiar los campos dinámicos
            // }

            // // Opcional: Si quieres que el checkbox "Ayer" se desmarque, puedes añadir:
            if (yesterdayCheck) {
                yesterdayCheck.checked = false;
            }

            // // Opcional: Si quieres que la entidad se deseleccione y se oculten los campos/botón de guardar
            // // después de cada registro, mantén estas líneas. Si prefieres que todo se quede
            // // exactamente igual para el siguiente registro, coméntalas también.
            // document.getElementById('submit-container').style.display = 'none';
            // document.querySelectorAll('.entity-btn').forEach(btn => {
            //     btn.classList.remove('btn-primary');
            //     btn.classList.add('btn-outline-primary');
            // });
            // document.getElementById('selected-entity-id').value = '';

            // --- FIN: Modificación ---


            // Recargar registros recientes (esto se mantiene)
            this.loadRecentRecords();

            // Mostrar mensaje (esto se mantiene)
            UIUtils.showAlert('Registro guardado correctamente', 'success', document.querySelector('.card-body'));
        } else {
            UIUtils.showAlert('Error al guardar el registro', 'danger', document.querySelector('.card-body'));
        }
    },,
    
    /**
     * Carga y muestra los registros recientes
     */
    loadRecentRecords() {
        // Verificar elementos necesarios del DOM
        const recentRecordsList = document.getElementById('recent-records-list');
        const noRecordsMessage = document.getElementById('no-records-message');
        const recentRecordsTable = document.getElementById('recent-records-table');
        
        // Si no encontramos los elementos, intentamos recrearlos
        if (!recentRecordsList || !noRecordsMessage || !recentRecordsTable) {
            console.warn('Elementos DOM no encontrados para mostrar registros recientes, recreando...');
            
            // Buscar el contenedor de la columna derecha o crearlo
            const container = document.querySelector('.main-content');
            if (!container) {
                console.error('No se encontró el contenedor principal para recrear la tabla de registros');
                return;
            }
            
            // Buscar si existe la columna derecha
            let rightColumn = container.querySelector('.col-md-6:last-child');
            if (!rightColumn) {
                console.warn('Recreando la estructura completa de registros recientes');
                // Crear elementos si no existen
                this.render();
                return;
            }
            
            // Recrear la tabla y mensajes
            const cardBody = rightColumn.querySelector('.card-body');
            if (cardBody) {
                cardBody.innerHTML = `
                    <div id="no-records-message" style="display: none;">
                        <p class="text-muted">No hay registros recientes.</p>
                    </div>
                    
                    <table id="recent-records-table" class="table table-striped table-hover" style="display: none;">
                        <thead>
                            <tr>
                                <th>${this.entityName}</th>
                                <th>Fecha</th>
                                <th>Datos</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="recent-records-list"></tbody>
                    </table>
                `;
            }
        }
        
        // Intentar obtener los elementos nuevamente
        const refreshedRecentRecordsList = document.getElementById('recent-records-list');
        const refreshedNoRecordsMessage = document.getElementById('no-records-message');
        const refreshedRecentRecordsTable = document.getElementById('recent-records-table');
        
        if (!refreshedRecentRecordsList || !refreshedNoRecordsMessage || !refreshedRecentRecordsTable) {
            console.error('No se pudieron recrear los elementos necesarios para mostrar registros recientes');
            return;
        }
        
        const recentRecords = RecordModel.getRecent(10) || [];
        
        // Mostrar mensaje si no hay registros
        if (recentRecords.length === 0) {
            refreshedNoRecordsMessage.style.display = 'block';
            refreshedRecentRecordsTable.style.display = 'none';
            return;
        }
        
        // Mostrar tabla si hay registros
        refreshedNoRecordsMessage.style.display = 'none';
        refreshedRecentRecordsTable.style.display = 'table';
        
        // Limpiar lista
        refreshedRecentRecordsList.innerHTML = '';
        
        // Renderizar cada registro
        recentRecords.forEach(record => {
            const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };
            const fieldIds = record.data ? Object.keys(record.data) : [];
            const fields = FieldModel.getByIds(fieldIds);
            
            // Crear fila para el registro
            const row = document.createElement('tr');
            
            // Preparar datos para mostrar (limitados a 3 campos)
            const dataFields = [];
            for (const fieldId in record.data) {
                const field = fields.find(f => f && f.id === fieldId);
                if (field) {
                    dataFields.push(`${field.name}: ${record.data[fieldId]}`);
                }
            }
            
            // Limitar a 3 campos y agregar elipsis si hay más
            let displayData = dataFields.slice(0, 3).join(', ');
            if (dataFields.length > 3) {
                displayData += '...';
            }
            
            row.innerHTML = `
                <td>${entity.name}</td>
                <td>${UIUtils.formatDate(record.timestamp)}</td>
                <td>${displayData}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-record" data-record-id="${record.id}">
                        Ver
                    </button>
                </td>
            `;
            
            // Aplicar efecto de highlight si es un nuevo registro
            const isNew = Date.now() - new Date(record.timestamp).getTime() < 10000; // 10 segundos
            if (isNew) {
                UIUtils.highlightNewElement(row);
            }
            
            refreshedRecentRecordsList.appendChild(row);
        });
        
        // Configurar event listeners para ver detalles
        refreshedRecentRecordsList.querySelectorAll('.view-record').forEach(button => {
            button.addEventListener('click', (e) => {
                const recordId = e.target.getAttribute('data-record-id');
                this.showRecordDetails(recordId);
            });
        });
    },
    
    /**
     * Muestra los detalles de un registro
     * @param {string} recordId ID del registro
     */
    showRecordDetails(recordId) {
        const record = RecordModel.getById(recordId);
        if (!record) return;
        
        const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };
        const fields = FieldModel.getByIds(Object.keys(record.data));
        
        const modal = UIUtils.initModal('viewRecordModal');
        const recordDetails = document.getElementById('record-details');
        
        if (!modal || !recordDetails) {
            console.error("Elementos DOM necesarios para mostrar detalles del registro no encontrados");
            return;
        }
        
        // Preparar contenido del modal
        const detailsHTML = `
            <div class="mb-3">
                <strong>${this.entityName}:</strong> ${entity.name}
            </div>
            <div class="mb-3">
                <strong>Fecha y Hora:</strong> <span id="record-timestamp">${UIUtils.formatDate(record.timestamp)}</span>
            </div>
            <div class="mb-3">
                <strong>Datos:</strong>
                <table class="table table-sm table-bordered mt-2">
                    <thead class="table-light">
                        <tr>
                            <th>Campo</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(record.data).map(([fieldId, value]) => {
                            const field = fields.find(f => f.id === fieldId) || { name: fieldId };
                            return `
                                <tr>
                                    <td>${field.name}</td>
                                    <td>${value}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        recordDetails.innerHTML = detailsHTML;
        
        // Añadir botones y sus listeners
        const footerDiv = document.querySelector('#viewRecordModal .modal-footer');
        if (!footerDiv) {
            console.error("Elemento footer del modal no encontrado");
            return;
        }
        
        footerDiv.innerHTML = `
            <button type="button" class="btn btn-danger me-auto" id="deleteRecordBtn">Eliminar registro</button>
            <button type="button" class="btn btn-warning" id="editDateBtn">Editar fecha</button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        `;
        
        // Listener para el botón de eliminar registro
        const deleteRecordBtn = document.getElementById('deleteRecordBtn');
        if (deleteRecordBtn) {
            deleteRecordBtn.addEventListener('click', () => {
                // Configurar el modal de confirmación
                const confirmModal = UIUtils.initModal('confirmModal');
                const confirmMessage = document.getElementById('confirm-message');
                const confirmActionBtn = document.getElementById('confirmActionBtn');
                
                if (!confirmModal || !confirmMessage || !confirmActionBtn) {
                    console.error("Elementos del modal de confirmación no encontrados");
                    return;
                }
                
                confirmMessage.textContent = 
                    '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.';
                    
                // Limpiar listeners anteriores
                const newConfirmBtn = confirmActionBtn.cloneNode(true);
                confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
                
                // Añadir nuevo listener
                newConfirmBtn.addEventListener('click', () => {
                    const deleted = RecordModel.delete(recordId);
                    confirmModal.hide();
                    modal.hide();
                    
                    if (deleted) {
                        this.loadRecentRecords();
                        UIUtils.showAlert('Registro eliminado correctamente', 'success', document.querySelector('.card-body'));
                    } else {
                        UIUtils.showAlert('Error al eliminar el registro', 'danger', document.querySelector('.card-body'));
                    }
                });
                
                // Mostrar modal de confirmación
                confirmModal.show();
            });
        }
        
        // Listener para el botón de editar fecha
        const editDateBtn = document.getElementById('editDateBtn');
        if (editDateBtn) {
            editDateBtn.addEventListener('click', () => {
                // Crear un input para la fecha y hora
                const timestampSpan = document.getElementById('record-timestamp');
                const currentTimestamp = new Date(record.timestamp);
                
                if (!timestampSpan) {
                    console.error("Elemento record-timestamp no encontrado");
                    return;
                }
                
                // Formatear la fecha para el input datetime-local
                const formattedDate = currentTimestamp.toISOString().slice(0, 16);
                
                // Reemplazar el texto por un input
                timestampSpan.innerHTML = `
                    <div class="input-group">
                        <input type="datetime-local" id="new-timestamp" class="form-control form-control-sm" value="${formattedDate}">
                        <button class="btn btn-sm btn-primary" id="save-timestamp">Guardar</button>
                        <button class="btn btn-sm btn-secondary" id="cancel-timestamp">Cancelar</button>
                    </div>
                `;
                
                // Listener para guardar la nueva fecha
                const saveTimestampBtn = document.getElementById('save-timestamp');
                if (saveTimestampBtn) {
                    saveTimestampBtn.addEventListener('click', () => {
                        const newTimestampInput = document.getElementById('new-timestamp');
                        if (!newTimestampInput) {
                            console.error("Elemento new-timestamp no encontrado");
                            return;
                        }
                        
                        const newTimestamp = newTimestampInput.value;
                        
                        if (!newTimestamp) {
                            UIUtils.showAlert('Debe seleccionar una fecha válida', 'warning', recordDetails);
                            return;
                        }
                        
                        // Convertir a formato ISO
                        const newDate = new Date(newTimestamp).toISOString();
                        const updatedRecord = RecordModel.updateDate(recordId, newDate);
                        
                        if (updatedRecord) {
                            // Actualizar la vista
                            timestampSpan.textContent = UIUtils.formatDate(newDate);
                            this.loadRecentRecords(); // Actualizar lista de registros
                            UIUtils.showAlert('Fecha actualizada correctamente', 'success', recordDetails);
                        } else {
                            UIUtils.showAlert('Error al actualizar la fecha', 'danger', recordDetails);
                        }
                    });
                }
                
                // Listener para cancelar la edición
                const cancelTimestampBtn = document.getElementById('cancel-timestamp');
                if (cancelTimestampBtn) {
                    cancelTimestampBtn.addEventListener('click', () => {
                        timestampSpan.textContent = UIUtils.formatDate(record.timestamp);
                    });
                }
            });
        }
        
        modal.show();
    },
    
    /**
     * Actualiza las referencias visibles a "Entidad" en esta vista
     * @param {string} newEntityName Nombre personalizado para "Entidad"
     */
    updateEntityNameReferences(newEntityName) {
        // Actualizar la propiedad del objeto
        this.entityName = newEntityName;
        
        console.log("Actualizando referencias a Entidad en vista de registro con:", newEntityName);
        
        // Actualizar etiquetas y textos
        document.querySelectorAll('label, th, strong').forEach(el => {
            if (el.textContent === "Entidad:") {
                el.textContent = `${newEntityName}:`;
            }
            if (el.textContent === "Entidad") {
                el.textContent = newEntityName;
            }
        });
        
        // Actualizar mensajes de alert que pueden contener la palabra "entidad"
        document.querySelectorAll('.alert').forEach(alert => {
            if (alert.textContent.includes("entidad")) {
                alert.textContent = alert.textContent.replace(/entidad/g, newEntityName.toLowerCase());
            }
        });
    },
    
    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        try {
            // Solo intentar actualizar si estamos en la vista activa
            if (Router.currentRoute !== 'register') {
                return;
            }
            
            // Recargar elementos dinámicos sin recargar toda la vista
            const selectedEntityIdInput = document.getElementById('selected-entity-id');
            if (selectedEntityIdInput) {
                const entityId = selectedEntityIdInput.value;
                if (entityId) {
                    this.loadDynamicFields(entityId);
                }
            }
            this.loadRecentRecords();
        } catch (error) {
            console.error("Error al actualizar la vista de registros:", error);
        }
    }
};