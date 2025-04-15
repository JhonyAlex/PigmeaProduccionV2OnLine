/**
 * Vista de registro para capturar datos
 */
const RegisterView = {
    /**
     * Nombre personalizado para "Entidad"
     */
    entityName: 'Entidad',

    /**
     * Almacena los últimos datos ingresados por entidad durante la sesión actual.
     * La clave es el entityId, el valor es un objeto con los datos del formulario.
     * @type {Object<string, Object>}
     */
    lastEnteredData: {}, // <--- AÑADIDO: Para guardar datos temporalmente

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
        // Remover listeners previos para evitar duplicados
        const form = document.getElementById('register-form');
        if (form) {
            // Guardar el valor del campo hidden antes de clonar
            const selectedEntityId = document.getElementById('selected-entity-id')?.value || '';
            
            // Remover listener anterior para evitar duplicados (en lugar de clonar todo el formulario)
            const oldForm = form.cloneNode(false); // Clonar solo el elemento form sin sus hijos
            form.parentNode.replaceChild(oldForm, form);
            
            // Recuperar el formulario original y sus contenidos
            const newForm = document.getElementById('register-form');
            if (newForm) {
                // Restaurar el valor del campo hidden
                const hiddenField = document.getElementById('selected-entity-id');
                if (hiddenField) {
                    hiddenField.value = selectedEntityId;
                }
                
                // Agregar el listener al formulario
                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveRecord();
                });
            }
        } else {
            console.error("Formulario de registro no encontrado");
            return;
        }

        // Para los botones de entidad, usar delegación de eventos en lugar de asignar a cada botón
        const container = document.querySelector('.d-flex.flex-wrap');
        if (container) {
            // Eliminar listener anterior si existe
            if (container._entityClickHandler) {
                container.removeEventListener('click', container._entityClickHandler);
            }
            
            // Crear nueva función manejadora
            container._entityClickHandler = (e) => {
                // Solo procesar si el click fue en un botón
                if (e.target.matches('.entity-btn')) {
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
                }
            };
            
            // Añadir el nuevo listener
            container.addEventListener('click', container._entityClickHandler);
        } else {
            console.error("Contenedor de botones de entidad no encontrado");
        }
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
            submitContainer.style.display = 'none'; // Ocultar si la entidad no existe
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
            submitContainer.style.display = 'none'; // Ocultar si no hay campos
            return;
        }

        // Array para guardar funciones de limpieza (para selects buscables)
        const cleanupFunctions = [];

        // Renderizar cada campo
        fields.forEach(field => {
            if (!field) return; // Saltarse campos nulos o indefinidos

            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'mb-3 dynamic-field';

            let fieldHTML = '';

            // Crear etiqueta (con asterisco si es requerido)
            fieldHTML += `<label for="${field.id}" class="form-label ${field.required ? 'required-field' : ''}">
                ${field.name}
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

                default: // Incluye checkbox, date, etc. si se añaden en el futuro
                    fieldHTML += `<input type="text" class="form-control" id="${field.id}"
                        name="${field.id}" ${field.required ? 'required' : ''}>`;
            }

            fieldContainer.innerHTML = fieldHTML;
            dynamicFieldsContainer.appendChild(fieldContainer);

            // Configurar SearchableSelect para campos tipo select
            if (field.type === 'select') {
                // Almacenar la función de limpieza devuelta por setupSearchableSelect
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

        // Agregar una función de limpieza al contenedor para eliminar listeners
        if (cleanupFunctions.length > 0) {
            // Limpiar listeners anteriores
            if (dynamicFieldsContainer._eventCleanupFn) {
                dynamicFieldsContainer.removeEventListener('DOMNodeRemovedFromDocument', dynamicFieldsContainer._eventCleanupFn);
            }
            
            // Crear una nueva función de limpieza
            dynamicFieldsContainer._eventCleanupFn = function() {
                cleanupFunctions.forEach(cleanup => cleanup());
                console.log("Limpiando listeners de selects para:", entityId);
            };
            
            dynamicFieldsContainer.addEventListener('DOMNodeRemovedFromDocument', dynamicFieldsContainer._eventCleanupFn);
        }

        // Pre-rellenar campos con los últimos datos guardados para esta entidad (si existen)
        setTimeout(() => {
            if (this.lastEnteredData[entityId]) {
                const lastData = this.lastEnteredData[entityId];
                fields.forEach(field => {
                    const fieldElement = document.getElementById(field.id);
                    if (fieldElement && lastData[field.id] !== undefined) {
                        // Manejar diferentes tipos de input
                        if (fieldElement.type === 'checkbox') {
                            fieldElement.checked = lastData[field.id] === true || lastData[field.id] === 'true';
                        } else {
                            fieldElement.value = lastData[field.id];

                            // Si es un select con búsqueda
                            if (field.type === 'select' && fieldElement.classList.contains('select2-hidden-accessible')) {
                                try {
                                    $(fieldElement).val(lastData[field.id]).trigger('change');
                                } catch (e) {
                                    console.warn(`Error al establecer valor en select ${field.id}:`, e);
                                }
                            }
                        }
                    }
                });
            }
        }, 10); // Pequeño delay para asegurar que el DOM se actualiza primero
    },

    /**
     * Guarda un nuevo registro
     */
    saveRecord() {
        try {
            const form = document.getElementById('register-form');
            if (!form) {
                console.error("Formulario no encontrado");
                UIUtils.showAlert('Error al enviar el formulario', 'danger', document.querySelector('.card-body'));
                return;
            }
            
            const entityIdField = document.getElementById('selected-entity-id');
            const entityId = entityIdField ? entityIdField.value : null;

            if (!entityId) {
                console.error("ID de entidad no encontrado o vacío");
                UIUtils.showAlert(`Debe seleccionar una ${this.entityName.toLowerCase()}`, 'warning', document.querySelector('.card-body'));
                return;
            }

            // Obtener entidad y sus campos
            const entity = EntityModel.getById(entityId);
            if (!entity) {
                console.error("Entidad no encontrada:", entityId);
                return;
            }

            const fields = FieldModel.getByIds(entity.fields || []);

            // Validar el formulario
            const validation = ValidationUtils.validateForm(form, fields);

            if (!validation.isValid) {
                UIUtils.showAlert('Por favor complete correctamente todos los campos requeridos', 'warning', document.querySelector('.card-body'));
                return;
            }

            // Guardar los datos validados en nuestra variable temporal ANTES de crear el registro
            this.lastEnteredData[entityId] = { ...validation.data };

            // Verificar si el checkbox "Ayer" está marcado
            const yesterdayCheck = document.getElementById('yesterday-check');
            const useYesterdayDate = yesterdayCheck && yesterdayCheck.checked;

            // Guardar registro
            const newRecord = RecordModel.create(entityId, validation.data);

            if (newRecord) {
                // Si el checkbox de ayer está marcado, actualizar la fecha
                if (useYesterdayDate) {
                    const currentDate = new Date(newRecord.timestamp);
                    currentDate.setDate(currentDate.getDate() - 1);
                    RecordModel.updateDate(newRecord.id, currentDate.toISOString());
                }

                // Disparar un evento personalizado antes de limpiar el formulario
                const cleanupEvent = new CustomEvent('prepareFormReset', { 
                    bubbles: true, detail: { formId: form.id } 
                });
                form.dispatchEvent(cleanupEvent);

                // Limpiar formulario
                form.reset();

                // Limpiar el contenedor de campos dinámicos
                const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
                if (dynamicFieldsContainer) {
                    // Disparar evento para que los listeners puedan limpiarse
                    dynamicFieldsContainer.dispatchEvent(new Event('DOMNodeRemovedFromDocument', { bubbles: true }));
                    dynamicFieldsContainer.innerHTML = '';
                }

                // Ocultar el contenedor del botón y checkbox
                const submitContainer = document.getElementById('submit-container');
                if (submitContainer) {
                    submitContainer.style.display = 'none';
                }

                // Deseleccionar el botón de entidad
                document.querySelectorAll('.entity-btn.btn-primary').forEach(btn => {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                });
                
                // Limpiar el ID de entidad seleccionada
                const selectedEntityIdInput = document.getElementById('selected-entity-id');
                if (selectedEntityIdInput) {
                    selectedEntityIdInput.value = '';
                }

                // Recargar registros recientes
                this.loadRecentRecords();

                // Mostrar mensaje
                UIUtils.showAlert('Registro guardado correctamente', 'success', document.querySelector('.card-body'));
            } else {
                UIUtils.showAlert('Error al guardar el registro', 'danger', document.querySelector('.card-body'));
            }
        } catch (error) {
            console.error("Error al guardar registro:", error);
            UIUtils.showAlert('Error inesperado al guardar el registro', 'danger', document.querySelector('.card-body'));
        }
    },

    /**
     * Carga y muestra los registros recientes
     */
    loadRecentRecords() {
        // Verificar elementos necesarios del DOM
        const recentRecordsList = document.getElementById('recent-records-list');
        const noRecordsMessage = document.getElementById('no-records-message');
        const recentRecordsTable = document.getElementById('recent-records-table');

        // Si no encontramos los elementos, intentamos recrearlos (código robusto existente)
        if (!recentRecordsList || !noRecordsMessage || !recentRecordsTable) {
            console.warn('Elementos DOM no encontrados para mostrar registros recientes, recreando...');
            const container = document.querySelector('.main-content');
            if (!container) {
                console.error('No se encontró el contenedor principal para recrear la tabla de registros');
                return;
            }
            let rightColumn = container.querySelector('.col-md-6:last-child');
            if (!rightColumn) {
                console.warn('Recreando la estructura completa de registros recientes');
                this.render(); // Re-renderizar si falta la estructura
                // Intentar obtener los elementos de nuevo después de re-renderizar
                this.loadRecentRecords(); // Llamada recursiva simple, cuidado con bucles infinitos
                return;
            }
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
            refreshedRecentRecordsList.innerHTML = ''; // Asegurar que esté vacío
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
                // Asegurarse de que el campo existe antes de intentar acceder a 'name'
                const field = fields.find(f => f && f.id === fieldId);
                if (field) {
                    dataFields.push(`${field.name}: ${record.data[fieldId]}`);
                } else {
                     // Si el campo ya no existe, mostrar ID y valor
                     dataFields.push(`${fieldId}: ${record.data[fieldId]}`);
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
                <td>${displayData || 'Sin datos'}</td>
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
            // Remover listener anterior si existe para evitar duplicados
            button.replaceWith(button.cloneNode(true));
        });
        refreshedRecentRecordsList.addEventListener('click', (e) => {
             if (e.target && e.target.classList.contains('view-record')) {
                 const recordId = e.target.getAttribute('data-record-id');
                 this.showRecordDetails(recordId);
             }
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
        const fields = FieldModel.getByIds(Object.keys(record.data || {})); // Manejar data nula

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
                        ${record.data ? Object.entries(record.data).map(([fieldId, value]) => {
                            const field = fields.find(f => f && f.id === fieldId) || { name: fieldId }; // Mostrar ID si el campo no existe
                            return `
                                <tr>
                                    <td>${field.name}</td>
                                    <td>${value !== null && value !== undefined ? value : ''}</td>
                                </tr>
                            `;
                        }).join('') : '<tr><td colspan="2">Sin datos</td></tr>'}
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

        // --- Listener para eliminar (con clonación para evitar duplicados) ---
        const deleteRecordBtn = document.getElementById('deleteRecordBtn');
        if (deleteRecordBtn) {
            const newDeleteBtn = deleteRecordBtn.cloneNode(true);
            deleteRecordBtn.parentNode.replaceChild(newDeleteBtn, deleteRecordBtn);
            newDeleteBtn.addEventListener('click', () => {
                const confirmModal = UIUtils.initModal('confirmModal');
                const confirmMessage = document.getElementById('confirm-message');
                const confirmActionBtn = document.getElementById('confirmActionBtn');

                if (!confirmModal || !confirmMessage || !confirmActionBtn) {
                    console.error("Elementos del modal de confirmación no encontrados");
                    return;
                }

                confirmMessage.textContent =
                    '¿Está seguro de que desea eliminar este registro? Esta acción no se puede deshacer.';

                const newConfirmBtn = confirmActionBtn.cloneNode(true);
                confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);

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
                }, { once: true }); // Asegurar que solo se ejecute una vez

                confirmModal.show();
            });
        }

        // --- Listener para editar fecha (con clonación) ---
        const editDateBtn = document.getElementById('editDateBtn');
        if (editDateBtn) {
            const newEditBtn = editDateBtn.cloneNode(true);
            editDateBtn.parentNode.replaceChild(newEditBtn, editDateBtn);
            newEditBtn.addEventListener('click', () => {
                const timestampSpan = document.getElementById('record-timestamp');
                if (!timestampSpan) {
                    console.error("Elemento record-timestamp no encontrado");
                    return;
                }
                const currentTimestamp = new Date(record.timestamp);
                const formattedDate = currentTimestamp.toISOString().slice(0, 16);

                timestampSpan.innerHTML = `
                    <div class="input-group">
                        <input type="datetime-local" id="new-timestamp" class="form-control form-control-sm" value="${formattedDate}">
                        <button class="btn btn-sm btn-primary" id="save-timestamp">Guardar</button>
                        <button class="btn btn-sm btn-secondary" id="cancel-timestamp">Cancelar</button>
                    </div>
                `;

                const saveTimestampBtn = document.getElementById('save-timestamp');
                const cancelTimestampBtn = document.getElementById('cancel-timestamp');

                if (saveTimestampBtn) {
                     const newSaveTimestampBtn = saveTimestampBtn.cloneNode(true);
                     saveTimestampBtn.parentNode.replaceChild(newSaveTimestampBtn, saveTimestampBtn);
                     newSaveTimestampBtn.addEventListener('click', () => {
                        const newTimestampInput = document.getElementById('new-timestamp');
                        if (!newTimestampInput) return;
                        const newTimestamp = newTimestampInput.value;
                        if (!newTimestamp) {
                            UIUtils.showAlert('Debe seleccionar una fecha válida', 'warning', recordDetails);
                            return;
                        }
                        const newDate = new Date(newTimestamp).toISOString();
                        const updatedRecord = RecordModel.updateDate(recordId, newDate);
                        if (updatedRecord) {
                            record.timestamp = newDate; // Actualizar el timestamp en el objeto local
                            timestampSpan.textContent = UIUtils.formatDate(newDate);
                            this.loadRecentRecords();
                            UIUtils.showAlert('Fecha actualizada correctamente', 'success', recordDetails);
                        } else {
                            UIUtils.showAlert('Error al actualizar la fecha', 'danger', recordDetails);
                        }
                    }, { once: true });
                }

                if (cancelTimestampBtn) {
                    const newCancelTimestampBtn = cancelTimestampBtn.cloneNode(true);
                    cancelTimestampBtn.parentNode.replaceChild(newCancelTimestampBtn, cancelTimestampBtn);
                    newCancelTimestampBtn.addEventListener('click', () => {
                        timestampSpan.textContent = UIUtils.formatDate(record.timestamp);
                    }, { once: true });
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

        // Actualizar etiquetas y textos (más específico para evitar sobreescritura)
        const labelElement = document.querySelector('#register-form label.form-label');
        if (labelElement && labelElement.textContent.startsWith('Seleccione')) {
             labelElement.textContent = `Seleccione ${this.entityName}`;
        }
        document.querySelectorAll('#recent-records-table th').forEach(th => {
            if (th.textContent === 'Entidad') { // Asumiendo que el valor inicial es 'Entidad'
                th.textContent = newEntityName;
            }
        });
         document.querySelectorAll('#viewRecordModal strong').forEach(strong => {
            if (strong.textContent === 'Entidad:') { // Asumiendo que el valor inicial es 'Entidad:'
                strong.textContent = `${newEntityName}:`;
            }
        });

        // Actualizar mensajes de alert que pueden contener la palabra "entidad" (genérico)
        document.querySelectorAll('.alert').forEach(alert => {
            if (alert.textContent.includes("entidad")) {
                // Reemplazo cuidadoso para no afectar otras palabras
                alert.textContent = alert.textContent.replace(/una entidad/g, `una ${newEntityName.toLowerCase()}`);
                alert.textContent = alert.textContent.replace(/la entidad/g, `la ${newEntityName.toLowerCase()}`);
                alert.textContent = alert.textContent.replace(/entidades/g, `${newEntityName.toLowerCase()}s`); // Plural simple
                alert.textContent = alert.textContent.replace(/entidad/g, newEntityName.toLowerCase()); // Singular al final
            }
             if (alert.textContent.includes("Entidad")) {
                 alert.textContent = alert.textContent.replace(/Esta Entidad/g, `Esta ${newEntityName}`);
                 alert.textContent = alert.textContent.replace(/Entidad/g, newEntityName);
             }
        });
         // Actualizar mensajes de no registros
         const noRecordsMsg = document.getElementById('no-records-message');
         if (noRecordsMsg && noRecordsMsg.textContent.includes('entidad')) {
             noRecordsMsg.innerHTML = `<p class="text-muted">No hay ${this.entityName.toLowerCase()}s configuradas. Cree algunas en la sección de Administración.</p>`;
         }
         const noEntitiesMsgDiv = document.querySelector('.alert.alert-warning');
         if (noEntitiesMsgDiv && noEntitiesMsgDiv.textContent.includes('entidad')) {
             noEntitiesMsgDiv.textContent = `No hay ${this.entityName.toLowerCase()}s configuradas. Cree algunas en la sección de Administración.`;
         }
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos (ej. desde Admin)
     */
    update() {
        try {
            // Solo intentar actualizar si estamos en la vista activa
            if (Router.currentRoute !== 'register') {
                return;
            }

            console.log("Actualizando RegisterView...");

            // 1. Actualizar el nombre de la entidad si cambió en config
            const config = StorageService.getConfig();
            const newEntityName = (config && config.entityName) ? config.entityName : 'Entidad';
            if (this.entityName !== newEntityName) {
                this.updateEntityNameReferences(newEntityName);
            }

            // 2. Recargar botones de entidad (por si se añadieron/eliminaron/renombraron entidades)
            const entitySelector = document.querySelector('.d-flex.flex-wrap'); // Contenedor de botones
            const entities = EntityModel.getAll() || [];
            if (entitySelector) {
                 const entityButtons = entities.map(entity =>
                    `<button class="btn btn-outline-primary entity-btn mb-2 me-2" data-entity-id="${entity.id}">${entity.name}</button>`
                 ).join('');
                 entitySelector.innerHTML = entityButtons;
                 // Volver a añadir listeners a los nuevos botones
                 this.setupEventListeners(); // Esto podría ser problemático si añade listeners duplicados al form. Refinar si es necesario.
            }


            // 3. Limpiar campos dinámicos y estado si la entidad seleccionada ya no existe o cambió
            const selectedEntityIdInput = document.getElementById('selected-entity-id');
            let currentEntityId = null;
            if (selectedEntityIdInput) {
                currentEntityId = selectedEntityIdInput.value;
                const entityExists = entities.some(e => e.id === currentEntityId);
                if (currentEntityId && !entityExists) {
                    console.log(`Entidad seleccionada ${currentEntityId} ya no existe. Limpiando.`);
                    selectedEntityIdInput.value = '';
                    this.loadDynamicFields(''); // Limpiar campos
                    // Limpiar datos guardados para esa entidad si se desea
                    // delete this.lastEnteredData[currentEntityId];
                } else if (currentEntityId) {
                    // Si la entidad aún existe, recargar sus campos por si cambiaron
                    this.loadDynamicFields(currentEntityId);
                }
            }

            // 4. Recargar registros recientes
            this.loadRecentRecords();

        } catch (error) {
            console.error("Error al actualizar la vista de registros:", error);
        }
    }
};
