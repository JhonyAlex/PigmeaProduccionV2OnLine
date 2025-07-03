/**
 * Vista de registro para capturar datos
 */
const RegisterView = {
    /**
     * Nombre personalizado para "Entidad"
     */
    entityName: 'Entidad',

    /**
     * Nombre personalizado para "Registro"
     */
    recordName: 'Registro',

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
            // Obtener nombres personalizados desde la configuración
            const config = StorageService.getConfig();
            this.entityName = config.entityName || 'Entidad';
            this.recordName = config.recordName || 'Registro';

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

            const entities = EntityModel.getActive() || [];

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
                                <h5>Nuevo ${this.recordName.toLowerCase()}</h5>
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
                                    <div id="daily-sum-indicator" class="alert alert-info mt-2" style="display:none;"></div>

                                    <div id="submit-container" style="display: none;">
                                        <button type="submit" class="btn btn-primary">Guardar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5>${this.recordName}s recientes</h5>
                            </div>
                            <div class="card-body">
                                <div id="no-records-message" style="display: none;">
                                    <p class="text-muted">No hay ${this.recordName.toLowerCase()}s recientes.</p>
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
        const mainContent = Router.getActiveViewContainer() || document.querySelector('.main-content');
        if (!mainContent) {
            console.error("Contenedor principal no encontrado en setupEventListeners");
            return;
        }

        // --- Listener para el Formulario (sin cambios) ---
        const form = mainContent.querySelector('#register-form');
        if (form) {
            // Remover listener anterior explícitamente si existe
            if (form._submitHandler) {
                form.removeEventListener('submit', form._submitHandler);
            }
            // Definir el nuevo handler (guardarlo para poder removerlo después)
            form._submitHandler = (e) => {
                e.preventDefault();
                this.saveRecord();
            };
            // Añadir el listener
            form.addEventListener('submit', form._submitHandler);

            // Añadir listener para tecla Enter en cualquier campo del formulario
            if (form._keydownHandler) {
                form.removeEventListener('keydown', form._keydownHandler);
            }
            form._keydownHandler = (e) => {
                // Si se presiona Enter en un input del formulario
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
                    // Prevenir comportamiento por defecto
                    e.preventDefault();
                    
                    // Obtener el ID de la entidad seleccionada
                    const entityIdField = document.getElementById('selected-entity-id');
                    const entityId = entityIdField ? entityIdField.value : null;
                    
                    // Solo guardar si hay una entidad seleccionada
                    if (entityId) {
                        this.saveRecord();
                    }
                }
            };
            form.addEventListener('keydown', form._keydownHandler);

        } else {
            console.error("Formulario de registro #register-form no encontrado dentro del contenedor principal.");
        }

        // --- INICIO: NUEVO Listener para la tabla de registros recientes (Delegación) ---
        const recentRecordsList = mainContent.querySelector('#recent-records-list');
        if (recentRecordsList) {
            // Remover listener anterior si ya existe (buena práctica por si setupEventListeners se llamara más de una vez)
            if (recentRecordsList._viewRecordHandler) {
                recentRecordsList.removeEventListener('click', recentRecordsList._viewRecordHandler);
            }
            // Definir el handler
            recentRecordsList._viewRecordHandler = (e) => {
                // Verificar si el clic fue en un botón 'view-record' o dentro de él
                const viewButton = e.target.closest('.view-record');
                if (viewButton) {
                    const recordId = viewButton.getAttribute('data-record-id');
                    // Asegúrate de que 'this' se refiere a RegisterView
                    this.showRecordDetails(recordId);
                }
            };
            // Añadir el listener
            recentRecordsList.addEventListener('click', recentRecordsList._viewRecordHandler);
        } else {
            // Este mensaje puede aparecer la primera vez si la tabla aún no existe, es normal.
            console.warn("Tabla de registros recientes #recent-records-list no encontrada al configurar listeners.");
        }
        // --- FIN: NUEVO Listener ---

        // --- Listener para los Botones de Entidad (Delegación) ---
        const entityButtonContainer = mainContent.querySelector('.d-flex.flex-wrap'); // Buscar DENTRO de mainContent
        if (entityButtonContainer) {
            // Remover listener anterior explícitamente si existe
            if (entityButtonContainer._entityClickHandler) {
                entityButtonContainer.removeEventListener('click', entityButtonContainer._entityClickHandler);
            }

            // Definir el nuevo handler (guardarlo para poder removerlo después)
            entityButtonContainer._entityClickHandler = (e) => {
                // Solo procesar si el click fue en un botón de entidad dentro de este contenedor
                if (e.target.matches('.entity-btn')) {
                    const clickedButton = e.target;
                    const entityId = clickedButton.getAttribute('data-entity-id');

                    // Buscar elementos relativos al contenedor o al formulario si es necesario
                    const formElement = clickedButton.closest('form'); // O mainContent si está fuera
                    const selectedEntityIdInput = formElement ? formElement.querySelector('#selected-entity-id') : mainContent.querySelector('#selected-entity-id');
                    const dynamicFieldsContainer = formElement ? formElement.querySelector('#dynamic-fields-container') : mainContent.querySelector('#dynamic-fields-container');

                    if (!selectedEntityIdInput) {
                        console.error("Elemento #selected-entity-id no encontrado.");
                        return;
                    }
                    if (!dynamicFieldsContainer) {
                        console.error("Elemento #dynamic-fields-container no encontrado.");
                        return;
                    }

                    const currentEntityId = selectedEntityIdInput.value;
                    const isToggle = entityId === currentEntityId && dynamicFieldsContainer.innerHTML.trim() !== '';

                    // Si es toggle, deseleccionar el botón y limpiar campos
                    if (isToggle) {
                        clickedButton.classList.remove('btn-primary');
                        clickedButton.classList.add('btn-outline-primary');
                        selectedEntityIdInput.value = '';
                        this.loadDynamicFields(''); // Limpiar campos
                    } else {
                        // Quitar clase activa de todos los botones DENTRO de este contenedor
                        entityButtonContainer.querySelectorAll('.entity-btn').forEach(btn => {
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

            // Añadir el listener al contenedor de botones
            entityButtonContainer.addEventListener('click', entityButtonContainer._entityClickHandler);
        } else {
            // Si render() funcionó, este error debería ser menos probable ahora
            console.warn("Contenedor de botones de entidad (.d-flex.flex-wrap) no encontrado dentro del contenedor principal.");
            // Puedes decidir si esto es un error crítico o no.
            // Si no hay entidades configuradas, este contenedor podría no existir o estar vacío.
            const entities = EntityModel.getActive() || [];
            if (entities.length > 0) {
                // Si hay entidades pero no se encontró el contenedor, es un problema de renderizado
                console.error("Error crítico: Hay entidades pero no se encontró su contenedor en el DOM renderizado.");
            }
        }
    },

    /**
     * Valida y prepara los campos de una entidad.
     * Remueve de la entidad los IDs que ya no existen.
     * @param {Object} entity Entidad a procesar
     * @returns {Object} Datos de campos procesados
     */
    _processEntityFields(entity) {
        const allFields = FieldModel.getByIds(entity.fields);
        const activeFields = allFields.filter(f => f && f.active !== false);
        const missingFieldIds = entity.fields.filter(id => !allFields.some(f => f && f.id === id));
        const inactiveFieldNames = allFields.filter(f => f && f.active === false).map(f => f.name);

        if (missingFieldIds.length) {
            const cleaned = entity.fields.filter(id => !missingFieldIds.includes(id));
            EntityModel.update(entity.id, { fields: cleaned });
            entity.fields = cleaned;
        }

        return { activeFields, missingFieldIds, inactiveFieldNames };
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

        // Limpiar contenedor y ejecutar limpieza previa si existe
        if (typeof dynamicFieldsContainer._eventCleanupFn === 'function') {
            dynamicFieldsContainer._eventCleanupFn();
        }
        dynamicFieldsContainer.innerHTML = '';

        // Eliminar evento keydown previo si existe
        if (dynamicFieldsContainer._keydownHandler) {
            dynamicFieldsContainer.removeEventListener('keydown', dynamicFieldsContainer._keydownHandler);
        }

        // Si no hay entidad seleccionada, ocultar el botón de envío
        const submitContainer = document.getElementById('submit-container');
        if (submitContainer) {
            submitContainer.style.display = entityId ? 'block' : 'none';
        }

        if (!entityId) return;

        // Añadir evento keydown al contenedor para capturar la tecla Enter en cualquier campo
        dynamicFieldsContainer._keydownHandler = (e) => {
            if (e.key === 'Enter' && dynamicFieldsContainer.contains(e.target)) {
                // Prevenir el comportamiento predeterminado del Enter
                e.preventDefault();
                
                // Solo guardar si hay una entidad seleccionada
                if (entityId) {
                    this.saveRecord();
                }
            }
        };
        
        // Añadir el listener al contenedor de campos
        dynamicFieldsContainer.addEventListener('keydown', dynamicFieldsContainer._keydownHandler);

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

        // Validar los campos de la entidad y limpiarlos si es necesario
        const { activeFields, missingFieldIds, inactiveFieldNames } = this._processEntityFields(entity);

        // Si no hay campos activos, mostrar mensaje de ayuda
        if (!activeFields || activeFields.length === 0) {
            dynamicFieldsContainer.innerHTML = `
                <div class="alert alert-info">
                    No hay campos configurados para esta ${this.entityName.toLowerCase()}.
                    Configure algunos en la sección de Administración.
                </div>
            `;
            submitContainer.style.display = 'none';
            return;
        }

        // Mostrar advertencias si hay campos faltantes o inactivos
        if (missingFieldIds.length || inactiveFieldNames.length) {
            const warnings = [];
            if (missingFieldIds.length) {
                warnings.push(`IDs no encontrados: ${missingFieldIds.join(', ')}`);
            }
            if (inactiveFieldNames.length) {
                warnings.push(`Campos inactivos: ${inactiveFieldNames.join(', ')}`);
            }
            console.warn('Advertencia en campos asignados:', warnings.join(' | '));

            const warnDiv = document.createElement('div');
            warnDiv.className = 'alert alert-warning';
            warnDiv.textContent = `Algunos campos no se pueden mostrar: ${warnings.join(' | ')}`;
            dynamicFieldsContainer.appendChild(warnDiv);
        }

        // Array para guardar funciones de limpieza (para selects buscables)
        const cleanupFunctions = [];

        // Ordenar los campos según el orden en entity.fields (esto asegura que se respete el orden definido)
        const orderedFields = [];
        
        // Añadir más información de registro para depuración
        console.log('Entity fields order:', JSON.stringify(entity.fields));
        console.log('Available fields:', activeFields.map(f => f ? `${f.id}:${f.name}` : 'undefined').join(', '));
        
        entity.fields.forEach(fieldId => {
            const field = activeFields.find(f => f && f.id === fieldId);
            if (field) {
                orderedFields.push(field);
            } else {
                console.warn(`Campo con ID ${fieldId} asignado a la entidad pero no encontrado`);
            }
        });
        
        console.log('Ordered fields for rendering:', orderedFields.map(f => f.name).join(', '));

        // Renderizar cada campo en el orden correcto
        orderedFields.forEach(field => {
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
                    // Opciones ordenadas alfabética o numéricamente
                    const sortedOpts = (field.options || [])
                        .filter(opt => (typeof opt === 'object' ? opt.active !== false : true))
                        .slice()
                        .sort(UIUtils.sortSelectOptions);
                    const optionsHTML = [`<option value="">Seleccione...</option>`,
                        ...sortedOpts.map(opt => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            return `<option value="${val}">${val}</option>`;
                        })].join('');

                    // Utilizar el componente de select con buscador sin ícono
                    fieldHTML += UIUtils.createSearchableSelect(field.id, optionsHTML, 'form-select', field.required ? 'required' : '');
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
            // Crear o reemplazar la función de limpieza
            dynamicFieldsContainer._eventCleanupFn = function() {
                cleanupFunctions.forEach(cleanup => cleanup());

                // Limpiar también el evento keydown
                if (dynamicFieldsContainer._keydownHandler) {
                    dynamicFieldsContainer.removeEventListener('keydown', dynamicFieldsContainer._keydownHandler);
                    dynamicFieldsContainer._keydownHandler = null;
                }

                console.log("Limpiando listeners de selects y keydown para:", entityId);
            };
        }

        // Añadir campo de fecha/hora personalizada
        const dateContainer = document.createElement('div');
        dateContainer.className = 'mb-3';
        dateContainer.innerHTML = `
            <label for="custom-date" class="form-label">Fecha y hora del registro</label>
            <div class="input-group">
                <input type="datetime-local" id="custom-date" class="form-control" name="custom-date">
                <button type="button" class="btn btn-outline-secondary" id="reset-date">Usar fecha actual</button>
                <button type="button" class="btn btn-outline-secondary" id="yesterday-date">Usar fecha de ayer</button>
            </div>
            <div class="form-text">Si no se especifica, se usará la fecha y hora actual.</div>
        `;
        dynamicFieldsContainer.appendChild(dateContainer);

        // Establecer la fecha actual como valor predeterminado
        const customDateInput = document.getElementById('custom-date');
        if (customDateInput) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            customDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            // Agregar event listener para el botón de restablecer a fecha actual
            const resetDateBtn = document.getElementById('reset-date');
            if (resetDateBtn) {
                resetDateBtn.addEventListener('click', () => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    
                    customDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                });
            }
            
            // Agregar event listener para el botón de fecha de ayer
            const yesterdayDateBtn = document.getElementById('yesterday-date');
            if (yesterdayDateBtn) {
                yesterdayDateBtn.addEventListener('click', () => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    const year = yesterday.getFullYear();
                    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
                    const day = String(yesterday.getDate()).padStart(2, '0');
                    const hours = String(yesterday.getHours()).padStart(2, '0');
                    const minutes = String(yesterday.getMinutes()).padStart(2, '0');
                    
                    customDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                });
            }
        }

        // Pre-rellenar campos con los últimos datos guardados para esta entidad (si existen)
        setTimeout(() => {
            if (this.lastEnteredData[entityId]) {
                const lastData = this.lastEnteredData[entityId];
                
                // Manejar el campo de fecha personalizada
                const customDateInput = document.getElementById('custom-date');
                if (customDateInput && lastData['custom-date']) {
                    // Verificar si la fecha guardada es "actual" o una fecha específica
                    if (lastData['custom-date'] === 'current') {
                        // Si es "actual", actualizar al momento presente
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        
                        customDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    } else {
                        // Si es una fecha específica, usar esa
                        customDateInput.value = lastData['custom-date'];
                    }
                }
                
                orderedFields.forEach(field => {
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

            const fields = FieldModel.getActiveByIds(entity.fields || []);

            // Validar el formulario
            const validation = ValidationUtils.validateForm(form, fields);

            if (!validation.isValid) {
                UIUtils.showAlert('Por favor complete correctamente todos los campos requeridos', 'warning', document.querySelector('.card-body'));
                return;
            }

            // Guardar los datos validados en nuestra variable temporal ANTES de crear el registro
            this.lastEnteredData[entityId] = { ...validation.data };

            // Obtener el valor del campo de fecha personalizada
            const customDateInput = document.getElementById('custom-date');
            let useCustomDate = false;
            let customDate = null;

            if (customDateInput && customDateInput.value) {
                // Verificar si la fecha seleccionada es diferente a la actual (con margen de 1 minuto)
                const selectedDate = new Date(customDateInput.value);
                const currentDate = new Date();
                const diffMinutes = Math.abs((selectedDate - currentDate) / (1000 * 60));
                
                if (diffMinutes > 1) {
                    // Si hay más de 1 minuto de diferencia, considerarla como fecha personalizada
                    useCustomDate = true;
                    customDate = selectedDate;
                    
                    // Guardar en lastEnteredData para mantenerla entre registros
                    this.lastEnteredData[entityId]['custom-date'] = customDateInput.value;
                } else {
                    // Es aproximadamente la fecha actual, marcarla como "current" para que se actualice
                    this.lastEnteredData[entityId]['custom-date'] = 'current';
                }
            } else {
                // No hay fecha personalizada, usar la actual
                this.lastEnteredData[entityId]['custom-date'] = 'current';
            }

            // Guardar registro
            const newRecord = RecordModel.create(entityId, validation.data);

            if (newRecord) {
                // Si hay una fecha personalizada, actualizarla
                if (useCustomDate) {
                    RecordModel.updateDate(newRecord.id, customDate.toISOString());
                }

                // Disparar un evento personalizado antes de limpiar el formulario
                const cleanupEvent = new CustomEvent('prepareFormReset', { 
                    bubbles: true, detail: { formId: form.id } 
                });
                form.dispatchEvent(cleanupEvent);

                // Limpiar formulario y sus eventos
                form.reset();
                
                // Limpiar el evento keydown del formulario si existe
                if (form._keydownHandler) {
                    form.removeEventListener('keydown', form._keydownHandler);
                    form._keydownHandler = null;
                }

                // Limpiar el contenedor de campos dinámicos
                const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
                if (dynamicFieldsContainer) {
                    if (typeof dynamicFieldsContainer._eventCleanupFn === 'function') {
                        dynamicFieldsContainer._eventCleanupFn();
                    }
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

                // Actualizar indicador de suma diaria
                this.showDailySumProgress(useCustomDate ? customDate : new Date(), newRecord);

                // Mostrar mensaje
                UIUtils.showAlert(`${this.recordName} guardado correctamente`, 'success', document.querySelector('.card-body'));
            } else {
                UIUtils.showAlert(`Error al guardar el ${this.recordName.toLowerCase()}`, 'danger', document.querySelector('.card-body'));
            }
        } catch (error) {
            console.error("Error al guardar registro:", error);
            UIUtils.showAlert(`Error inesperado al guardar el ${this.recordName.toLowerCase()}`, 'danger', document.querySelector('.card-body'));
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
            const referenceDate = record.createdAt ? new Date(record.createdAt) : new Date(record.timestamp);
            const isNew = Date.now() - referenceDate.getTime() < 10000; // 10 segundos
            if (isNew) {
                UIUtils.highlightNewElement(row);
            }

            refreshedRecentRecordsList.appendChild(row);
        });

        // Configurar event listeners para ver detalles

    },

    /**
     * Muestra el progreso diario del campo configurado
     * @param {Date} date Fecha para calcular la suma

     * @param {Object} record Registro recién guardado para obtener la referencia
     */
    showDailySumProgress(date, record) {
        const indicator = document.getElementById('daily-sum-indicator');
        if (!indicator) return;
        const dailyField = FieldModel.getDailySumField();
        if (!dailyField || dailyField.type !== 'number') {
            indicator.style.display = 'none';
            return;
        }

        let ref = null;
        let refText = '';
        const entityRef = EntityModel.getDailyProgressRefEntity();
        const fieldRef = FieldModel.getDailyProgressRefField();
        if (entityRef) {
            ref = { type: 'entity', id: entityRef.id };
            refText = ` para ${entityRef.name}`;
        } else if (fieldRef) {
            const val = record.data[fieldRef.id];
            ref = { type: 'field', id: fieldRef.id, value: val };
            refText = ` para ${fieldRef.name}: ${val}`;
        }

        const total = RecordModel.getDailySumFor(dailyField.id, date, ref);
        const dateText = date.toISOString().split('T')[0];
        indicator.textContent = `Progreso diario de ${dailyField.name}${refText} (${dateText}): ${total}`;
        indicator.style.display = 'block';
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
                        UIUtils.showAlert(`${this.recordName} eliminado correctamente`, 'success', document.querySelector('.card-body'));
                    } else {
                        UIUtils.showAlert(`Error al eliminar el ${this.recordName.toLowerCase()}`, 'danger', document.querySelector('.modal-body'));
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

        // Mostrar modal con los detalles
        const modalTitle = document.getElementById('recordModalTitle');
        if (modalTitle) {
            const entityName = entity ? entity.name : this.entityName;
            modalTitle.textContent = `Detalles del ${this.recordName} - ${entityName}`;
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
            const entities = EntityModel.getActive() || [];
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
