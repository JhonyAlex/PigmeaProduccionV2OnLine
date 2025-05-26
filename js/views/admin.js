/**
 * Vista de administración para gestionar entidades y campos
 */
const AdminView = {

    importData: null,
    /**
     * Inicializa la vista de administración asegurando que los datos estén sincronizados con Firebase/localStorage.
     * Se suscribe a los cambios de datos y actualiza la vista automáticamente.
     */
    init() {
        StorageService.initializeStorage().then(() => {
            // Suscribirse a cambios en los datos
            StorageService.subscribeToDataChanges(() => {
                AdminView.update();
            });
            // Cargar la vista inicial
            AdminView.update();
        });
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
            
            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';
            const entities = EntityModel.getAll();
            
            const template = `
                <div class="container mt-4">
                    <h2>Administración del Sistema</h2>
    
                    <!-- Configuración General -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Configuración General</h5>
                        </div>
                        <div class="card-body">
                            <form id="config-form">
                                <div class="mb-3">
                                    <label for="app-title" class="form-label">Título</label>
                                    <input type="text" class="form-control" id="app-title" value="${config.title}" required>
                                    <small class="text-muted">Este será el título del sitio</small>
                                </div>
                                <div class="mb-3">
                                    <label for="app-description" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="app-description" rows="2">${config.description}</textarea>
                                    <small class="text-muted">Este es la descripción general</small>
                                </div>
                                <div class="mb-3">
                                    <label for="entity-name-config" class="form-label">Nombre de Entidad</label>
                                    <input type="text" class="form-control" id="entity-name-config" value="${config.entityName || 'Entidad'}" required>
                                    <small class="text-muted">Este nombre reemplazará la palabra "Entidad" en todo el sistema</small>
                                </div>
                                <div class="mb-3">
                                    <label for="record-name-config" class="form-label">Nombre de Registro</label>
                                    <input type="text" class="form-control" id="record-name-config" value="${config.recordName || 'Registro'}" required>
                                    <small class="text-muted">Este nombre reemplazará la palabra "Registro" en todo el sistema</small>
                                </div>
                                <div class="mb-3">
                                    <label for="navbar-title" class="form-label">Título del Sistema</label>
                                    <input type="text" class="form-control" id="navbar-title" value="${config.navbarTitle || 'Sistema de Registro Flexible'}" required>
                                    <small class="text-muted">Este título aparecerá en la barra de navegación</small>
                                </div>
                                <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                            </form>
                        </div>
                    </div>
    
                    <!-- Entidades Principales -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${entityName}s Principales</h5>
                            <button class="btn btn-light btn-sm" id="add-entity-btn">
                                <i class="bi bi-plus-circle"></i> Agregar ${entityName}
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="entities-container">
                                <div class="text-center py-4" id="no-entities-message">
                                    <p class="text-muted">No hay ${entityName.toLowerCase()}s registradas. Agregue una nueva ${entityName.toLowerCase()}.</p>
                                </div>
                                <div class="table-responsive" id="entities-table-container" style="display: none;">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Campos Asignados</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="entities-list">
                                            <!-- Entidades se cargarán aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- Campos Personalizados -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Importación Masiva de Registros</h5>
                        </div>
                        <div class="card-body">
                            <p class="mb-3">Desde aquí puede importar registros masivamente a través de archivos CSV o Excel.</p>
    
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Descargar Plantilla</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="small text-muted">Descargue una plantilla con los campos de la entidad seleccionada:</p>
    
                                            <div class="mb-3">
                                                <label for="template-entity" class="form-label">Entidad para plantilla</label>
                                                <select class="form-select" id="template-entity">
                                                    <option value="">Todas las entidades</option>
                                                    ${entities.map(entity =>
                                                        `<option value="${entity.id}">${entity.name}</option>`
                                                    ).join('')}
                                                </select>
                                            </div>
    
                                            <button type="button" class="btn btn-outline-primary" id="download-template-btn">
                                                <i class="bi bi-download"></i> Descargar Plantilla
                                            </button>
                                        </div>
                                    </div>
                                </div>
    
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Importar Datos</h6>
                                        </div>
                                        <div class="card-body">
                                            <p class="small text-muted">Seleccione un archivo CSV o Excel con los datos a importar:</p>
    
                                            <div class="mb-3">
                                                <label for="import-file" class="form-label">Archivo a importar</label>
                                                <input class="form-control" type="file" id="import-file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel">
                                                <div class="form-text">Formatos soportados: CSV, Excel (.xlsx, .xls)</div>
                                            </div>
    
                                            <button type="button" class="btn btn-primary" id="process-import-btn" disabled>
                                                <i class="bi bi-upload"></i> Procesar Archivo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- Campos Personalizados -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Campos Personalizados</h5>
                            <button class="btn btn-light btn-sm" id="add-field-btn">
                                <i class="bi bi-plus-circle"></i> Agregar Campo
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="fields-container">
                                <div class="text-center py-4" id="no-fields-message">
                                    <p class="text-muted">No hay campos personalizados. Agregue campos para personalizar sus formularios.</p>
                                </div>
                                <div class="table-responsive" id="fields-table-container" style="display: none;">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Tipo</th>
                                                <th>Requerido</th>
                                                <th>Opciones</th>
                                                <th>Para Reportes</th>
                                                <th>Para Tabla</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="fields-list">
                                            <!-- Los campos se cargarán aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = template;
            
            // Cargar datos iniciales
            this.loadEntities();
            this.loadFields();
        } catch (error) {
            console.error("Error al renderizar AdminView:", error);
        }
    },
    
    /**
     * Establece los event listeners para la vista
     */
    setupEventListeners() {
        const configForm = document.getElementById('config-form');
        const addEntityBtn = document.getElementById('add-entity-btn');
        const addFieldBtn = document.getElementById('add-field-btn');
        const saveEntityBtn = document.getElementById('saveEntityBtn');
        const saveFieldBtn = document.getElementById('saveFieldBtn');
        const fieldType = document.getElementById('field-type');
        const addOptionBtn = document.getElementById('add-option-btn');
        const saveAssignFieldsBtn = document.getElementById('saveAssignFieldsBtn');
        const optionsContainer = document.getElementById('options-container');
        const templateEntitySelect = document.getElementById('template-entity');
        const downloadTemplateBtn = document.getElementById('download-template-btn');
        const importFileInput = document.getElementById('import-file');
        const processImportBtn = document.getElementById('process-import-btn');
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => {
                const entityId = templateEntitySelect.value;
                this.downloadImportTemplate(entityId);
            });
        }
        
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                processImportBtn.disabled = !file;
            });
        }
        
        if (processImportBtn) {
            processImportBtn.addEventListener('click', () => {
                const file = importFileInput.files[0];
                if (file) {
                    this.processImportFile(file);
                }
            });
        }
        
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => {
                this.confirmImport();
            });
        }


        // Configuración del formulario
        if (configForm) {
            console.log("Configurando listener para el formulario de configuración");
            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log("Formulario de configuración enviado");
                this.saveConfig();
            });
        } else {
            console.error("Formulario de configuración no encontrado");
        }
    
        // Entidades
        if (addEntityBtn) {
            addEntityBtn.addEventListener('click', () => {
                this.showEntityModal();
            });
        }
    
        // Campos
        if (addFieldBtn) {
            addFieldBtn.addEventListener('click', () => {
                this.showFieldModal();
            });
        }
    
        // Modal de entidad
        if (saveEntityBtn) {
            saveEntityBtn.addEventListener('click', () => {
                this.saveEntity();
            });
        }
    
        // Modal de campo
        if (saveFieldBtn) {
            saveFieldBtn.addEventListener('click', () => {
                this.saveField();
            });
        }
    
        // Mostrar/ocultar opciones al cambiar tipo de campo
        if (fieldType) {
            fieldType.addEventListener('change', (e) => {
                if (optionsContainer) {
                    optionsContainer.style.display = e.target.value === 'select' ? 'block' : 'none';
                }
            });
        }
    
        // Agregar opción
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', () => {
                this.addOptionInput();
            });
        }
    
        // Modal de asignación de campos
        if (saveAssignFieldsBtn) {
            saveAssignFieldsBtn.addEventListener('click', () => {
                this.saveAssignedFields();
            });
        }
    },
    
    /**
     * Carga y muestra las entidades
     */
    loadEntities() {
        const entities = EntityModel.getAll();
        const entitiesContainer = document.getElementById('entities-container');
        const noEntitiesMessage = document.getElementById('no-entities-message');
        const entitiesTableContainer = document.getElementById('entities-table-container');
        const entitiesList = document.getElementById('entities-list');
        
        // Mostrar mensaje si no hay entidades
        if (entities.length === 0) {
            noEntitiesMessage.style.display = 'block';
            entitiesTableContainer.style.display = 'none';
            return;
        }
        
        // Mostrar tabla si hay entidades
        noEntitiesMessage.style.display = 'none';
        entitiesTableContainer.style.display = 'block';
        
        // Limpiar lista
        entitiesList.innerHTML = '';
        
        // Renderizar cada entidad
        entities.forEach(entity => {
            // Obtener campos asignados
            const fields = FieldModel.getByIds(entity.fields);
            const fieldNames = fields.map(field => field.name).join(', ') || 'Ninguno';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entity.name}</td>
                <td>${fieldNames}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary assign-fields" data-entity-id="${entity.id}">
                        Asignar Campos
                    </button>
                    <button class="btn btn-sm btn-outline-primary edit-entity" data-entity-id="${entity.id}">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-entity" data-entity-id="${entity.id}">
                        Eliminar
                    </button>
                </td>
            `;
            
            entitiesList.appendChild(row);
        });
        
        // Agregar event listeners para los botones de acción
        entitiesList.querySelectorAll('.edit-entity').forEach(button => {
            button.addEventListener('click', (e) => {
                const entityId = e.target.getAttribute('data-entity-id');
                this.showEntityModal(entityId);
            });
        });
        
        entitiesList.querySelectorAll('.delete-entity').forEach(button => {
            button.addEventListener('click', (e) => {
                const entityId = e.target.getAttribute('data-entity-id');
                this.confirmDeleteEntity(entityId);
            });
        });
        
        entitiesList.querySelectorAll('.assign-fields').forEach(button => {
            button.addEventListener('click', (e) => {
                const entityId = e.target.getAttribute('data-entity-id');
                this.showAssignFieldsModal(entityId);
            });
        });
    },
    
    /**
     * Carga y muestra los campos personalizados
     */
    loadFields() {
        const fields = FieldModel.getAll();
        const fieldsContainer = document.getElementById('fields-container');
        const noFieldsMessage = document.getElementById('no-fields-message');
        const fieldsTableContainer = document.getElementById('fields-table-container');
        const fieldsList = document.getElementById('fields-list');
        
        // Mostrar mensaje si no hay campos
        if (fields.length === 0) {
            noFieldsMessage.style.display = 'block';
            fieldsTableContainer.style.display = 'none';
            return;
        }
        
        // Mostrar tabla si hay campos
        noFieldsMessage.style.display = 'none';
        fieldsTableContainer.style.display = 'block';
        
        // Limpiar lista
        fieldsList.innerHTML = '';
        
        // Renderizar cada campo
        fields.forEach(field => {
            const row = document.createElement('tr');
            
            // Formatear tipo de campo
            let fieldType = '';
            switch (field.type) {
                case 'text': fieldType = 'Texto'; break;
                case 'number': fieldType = 'Número'; break;
                case 'select': fieldType = 'Selección'; break;
                default: fieldType = field.type;
            }
            
            // Formatear opciones (solo para tipo selección)
            let options = '';
            if (field.type === 'select') {
                options = field.options.join(', ');
            } else {
                options = '-';
            }
            
            // Crear indicadores para uso en reportes y tabla
            let reportIndicator = '';
            if (field.useForComparativeReports) {
                if (field.isHorizontalAxis) {
                    reportIndicator = '<span class="badge bg-info">Eje horizontal</span>';
                } else if (field.isCompareField) {
                    reportIndicator = '<span class="badge bg-success">Campo a comparar</span>';
                } else {
                    reportIndicator = '<span class="badge bg-secondary">Sí</span>';
                }
            }
            
            let tableIndicator = '';
            if (field.useForRecordsTable) {
                if (field.isColumn3) {
                    tableIndicator = '<span class="badge bg-info">Columna 3</span>';
                } else if (field.isColumn4) {
                    tableIndicator = '<span class="badge bg-success">Columna 4</span>';
                } else if (field.isColumn5) {
                    tableIndicator = '<span class="badge bg-warning text-dark">Columna 5</span>';
                } else {
                    tableIndicator = '<span class="badge bg-secondary">Sí</span>';
                }
            }
            
            row.innerHTML = `
                <td>${field.name}</td>
                <td>${fieldType}</td>
                <td>${field.required ? 'Sí' : 'No'}</td>
                <td class="small">${options}</td>
                <td class="text-center">${reportIndicator}</td>
                <td class="text-center">${tableIndicator}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-field" data-field-id="${field.id}">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-field" data-field-id="${field.id}">
                        Eliminar
                    </button>
                </td>
            `;
            
            fieldsList.appendChild(row);
        });
        
        // Agregar event listeners para los botones de acción
        fieldsList.querySelectorAll('.edit-field').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldId = e.target.getAttribute('data-field-id');
                this.showFieldModal(fieldId);
            });
        });
        
        fieldsList.querySelectorAll('.delete-field').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldId = e.target.getAttribute('data-field-id');
                this.confirmDeleteField(fieldId);
            });
        });
    },
    
    /**
     * Guarda la configuración general
     */
    saveConfig() {
        console.log("Guardando configuración...");
        const title = document.getElementById('app-title').value;
        const description = document.getElementById('app-description').value;
        const entityName = document.getElementById('entity-name-config').value;
        const recordName = document.getElementById('record-name-config').value;
        const navbarTitle = document.getElementById('navbar-title').value;
        
        const config = {
            title: title,
            description: description,
            entityName: entityName,
            recordName: recordName,
            navbarTitle: navbarTitle
        };
        
        StorageService.updateConfig(config);
        UIUtils.showAlert('Configuración guardada correctamente', 'success', document.querySelector('.container'));
        
        // Actualizar navbar-brand inmediatamente
        document.querySelector('.navbar-brand').textContent = navbarTitle;
        
        // Actualizar menciones de "Entidad" visibles en la página actual
        this.updateEntityNameReferences(entityName);
        
        // Actualizar menciones de "Registro" visibles en la página actual
        this.updateRecordNameReferences(recordName);
        
        console.log("Configuración guardada:", config);
    },
    
    /**
     * Muestra el modal para crear/editar una entidad
     * @param {string} entityId ID de la entidad (vacío para crear nueva)
     */
    showEntityModal(entityId = null) {
        const modal = UIUtils.initModal('entityModal');
        const modalTitle = document.getElementById('entityModalTitle');
        const entityIdInput = document.getElementById('entity-id');
        const entityNameInput = document.getElementById('entity-name');
        const entityGroupInput = document.getElementById('entity-group');
        const groupsDatalist = document.getElementById('existing-groups');
        
        // Obtener nombre personalizado
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        
        // Limpiar formulario
        document.getElementById('entityForm').reset();
        
        // Cargar grupos existentes
        groupsDatalist.innerHTML = '';
        const groups = EntityModel.getAllGroups();
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            groupsDatalist.appendChild(option);
        });
        
        if (entityId) {
            // Modo edición
            const entity = EntityModel.getById(entityId);
            if (!entity) return;
            
            modalTitle.textContent = `Editar ${entityName} Principal`;
            entityIdInput.value = entity.id;
            entityNameInput.value = entity.name;
            entityGroupInput.value = entity.group || '';
        } else {
            // Modo creación
            modalTitle.textContent = `Nueva ${entityName} Principal`;
            entityIdInput.value = '';
            entityGroupInput.value = '';
        }
        
        modal.show();
    },
    
    /**
     * Limpia correctamente un modal para evitar problemas con aria-hidden
     * @param {string} modalId ID del modal a limpiar
     */
    cleanupModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
                // Dar tiempo para que se complete la animación
                setTimeout(() => {
                    // Remover aria-hidden del modal
                    modalElement.removeAttribute('aria-hidden');
                    // Quitar backdrop si existe
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    // Restaurar scroll y desbloquear el cuerpo
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 300);
            }
        }
    },
    
    /**
     * Guarda una entidad (nueva o existente)
     */
    saveEntity() {
        const entityForm = document.getElementById('entityForm');
        if (!entityForm.checkValidity()) {
            entityForm.reportValidity();
            return;
        }
        
        const entityId = document.getElementById('entity-id').value;
        const entityName = document.getElementById('entity-name').value;
        const entityGroup = document.getElementById('entity-group').value.trim();
        
        // Obtener el nombre personalizado para entidad
        const config = StorageService.getConfig();
        const entityTypeName = config.entityName || 'Entidad';
        
        let result;
        if (entityId) {
            // Actualizar entidad existente
            result = EntityModel.update(entityId, { 
                name: entityName,
                group: entityGroup
            }); 
        } else {
            // Crear nueva entidad
            result = EntityModel.create(entityName, entityGroup);
        }
        
        if (result) {
            // Cerrar modal usando nuestro método mejorado
            this.cleanupModal('entityModal');
            
            // Recargar lista
            this.loadEntities();
            
            // Mostrar mensaje con el nombre personalizado
            const message = entityId ? 
                entityTypeName + ' actualizada correctamente' : 
                entityTypeName + ' creada correctamente';
            UIUtils.showAlert(message, 'success', document.querySelector('.container'));
        } else {
            UIUtils.showAlert('Error al guardar la ' + entityTypeName.toLowerCase(), 'danger', document.querySelector('.container'));
        }
    },
    
    /**
     * Confirma la eliminación de una entidad
     * @param {string} entityId ID de la entidad a eliminar
     */
    confirmDeleteEntity(entityId) {
        const entity = EntityModel.getById(entityId);
    if (!entity) return;
    
    const config = StorageService.getConfig();
    const entityName = config.entityName || 'Entidad';
    
    const confirmModal = UIUtils.initModal('confirmModal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    
    confirmMessage.textContent = `¿Está seguro de eliminar la ${entityName.toLowerCase()} "${entity.name}"? Esta acción no se puede deshacer y eliminará todos los registros asociados.`;
        
        // Eliminar listeners anteriores
        const newConfirmBtn = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
        
        // Agregar nuevo listener
        newConfirmBtn.addEventListener('click', () => {
            const deleted = EntityModel.delete(entityId);
            
            if (deleted) {
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
                
                // Recargar lista
                this.loadEntities();
                
                // Mostrar mensaje
                const config = StorageService.getConfig();
                const entityTypeName = config.entityName || 'Entidad';
                UIUtils.showAlert(entityTypeName + ' eliminada correctamente', 'success', document.querySelector('.container'));
            } else {
                UIUtils.showAlert('Error al eliminar la ' + entityTypeName.toLowerCase(), 'danger', document.querySelector('.container'));
            }
        });
        
        confirmModal.show();
    },
    
    /**
     * Muestra el modal para crear/editar un campo
     * @param {string} fieldId ID del campo (vacío para crear nuevo)
     */
    showFieldModal(fieldId = null) {
        const modal = UIUtils.initModal('fieldModal');
        const modalTitle = document.getElementById('fieldModalTitle');
        const fieldIdInput = document.getElementById('field-id');
        const fieldNameInput = document.getElementById('field-name');
        const fieldTypeSelect = document.getElementById('field-type');
        const fieldRequiredCheck = document.getElementById('field-required');
        const optionsContainer = document.getElementById('options-container');
        const optionsList = document.getElementById('options-list');
        
        // Nuevos elementos
        const useForRecordsTableCheck = document.getElementById('field-use-for-records-table');
        const isColumn3Check = document.getElementById('field-is-column-3');
        const isColumn4Check = document.getElementById('field-is-column-4');
        const isColumn5Check = document.getElementById('field-is-column-5');
        const useForComparativeReportsCheck = document.getElementById('field-use-for-comparative-reports');
        const isHorizontalAxisCheck = document.getElementById('field-is-horizontal-axis');
        const isCompareFieldCheck = document.getElementById('field-is-compare-field');
        
        // Limpiar formulario
        document.getElementById('fieldForm').reset();
        optionsList.innerHTML = `
            <div class="input-group mb-2">
                <input type="text" class="form-control field-option" placeholder="Opción">
                <button type="button" class="btn btn-outline-danger remove-option">×</button>
            </div>
        `;
        
        // Configurar listener para remover opción
        this.setupOptionRemovalListeners();
        
        // Configurar listeners para los nuevos checkboxes
        if (useForRecordsTableCheck) {
            useForRecordsTableCheck.addEventListener('change', () => {
                this.updateTableColumnChecks();
            });
        }
        
        if (useForComparativeReportsCheck) {
            useForComparativeReportsCheck.addEventListener('change', () => {
                this.updateReportChecks();
            });
        }
        
        // Listeners para exclusividad de columnas
        [isColumn3Check, isColumn4Check, isColumn5Check].forEach(check => {
            if (check) {
                check.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        // Deshabilitar otros checks de columna si se selecciona este
                        [isColumn3Check, isColumn4Check, isColumn5Check].forEach(otherCheck => {
                            if (otherCheck !== e.target) otherCheck.checked = false;
                        });
                    }
                });
            }
        });
        
        // Listeners para exclusividad de reportes
        [isHorizontalAxisCheck, isCompareFieldCheck].forEach(check => {
            if (check) {
                check.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        // Deshabilitar otros checks de reporte si se selecciona este
                        [isHorizontalAxisCheck, isCompareFieldCheck].forEach(otherCheck => {
                            if (otherCheck !== e.target) otherCheck.checked = false;
                        });
                    }
                });
            }
        });
        
        if (fieldId) {
            // Modo edición
            const field = FieldModel.getById(fieldId);
            if (!field) return;
            
            modalTitle.textContent = 'Editar Campo Personalizado';
            fieldIdInput.value = field.id;
            fieldNameInput.value = field.name;
            fieldTypeSelect.value = field.type;
            fieldRequiredCheck.checked = field.required;
            
            // Mostrar contenedor de opciones si es tipo selección
            optionsContainer.style.display = field.type === 'select' ? 'block' : 'none';
            
            // Cargar opciones existentes
            if (field.type === 'select' && field.options.length > 0) {
                optionsList.innerHTML = '';
                field.options.forEach(option => {
                    this.addOptionInput(option);
                });
            }
            
            // Cargar nuevas propiedades
            if (useForRecordsTableCheck) {
                useForRecordsTableCheck.checked = field.useForRecordsTable || false;
                isColumn3Check.checked = field.isColumn3 || false;
                isColumn4Check.checked = field.isColumn4 || false;
                isColumn5Check.checked = field.isColumn5 || false;
                this.updateTableColumnChecks();
            }
            
            if (useForComparativeReportsCheck) {
                useForComparativeReportsCheck.checked = field.useForComparativeReports || false;
                isHorizontalAxisCheck.checked = field.isHorizontalAxis || false;
                isCompareFieldCheck.checked = field.isCompareField || false;
                this.updateReportChecks();
            }
        } else {
            // Modo creación
            modalTitle.textContent = 'Nuevo Campo Personalizado';
            fieldIdInput.value = '';
            optionsContainer.style.display = 'none';
        }
        
        modal.show();
    },

    // Agregar estas nuevas funciones
    updateTableColumnChecks() {
        const useForRecordsTableCheck = document.getElementById('field-use-for-records-table');
        const isColumn3Check = document.getElementById('field-is-column-3');
        const isColumn4Check = document.getElementById('field-is-column-4');
        const isColumn5Check = document.getElementById('field-is-column-5');
        
        // Habilitar/deshabilitar checks de columna según el estado del check principal
        const enabled = useForRecordsTableCheck.checked;
        isColumn3Check.disabled = !enabled;
        isColumn4Check.disabled = !enabled;
        isColumn5Check.disabled = !enabled;
        
        // Si se deshabilita el check principal, desmarcar los checks de columna
        if (!enabled) {
            isColumn3Check.checked = false;
            isColumn4Check.checked = false;
            isColumn5Check.checked = false;
        }
    },
    
    updateReportChecks() {
        const useForComparativeReportsCheck = document.getElementById('field-use-for-comparative-reports');
        const isHorizontalAxisCheck = document.getElementById('field-is-horizontal-axis');
        const isCompareFieldCheck = document.getElementById('field-is-compare-field');
        
        // Habilitar/deshabilitar checks de reporte según el estado del check principal
        const enabled = useForComparativeReportsCheck.checked;
        isHorizontalAxisCheck.disabled = !enabled;
        isCompareFieldCheck.disabled = !enabled;
        
        // Si se deshabilita el check principal, desmarcar los checks de reporte
        if (!enabled) {
            isHorizontalAxisCheck.checked = false;
            isCompareFieldCheck.checked = false;
        }
    },

    /**
     * Agrega un input para una opción en el modal de campo
     * @param {string} value Valor inicial (opcional)
     */
    addOptionInput(value = '') {
        const optionsList = document.getElementById('options-list');
        const optionDiv = document.createElement('div');
        optionDiv.className = 'input-group mb-2';
        optionDiv.innerHTML = `
            <input type="text" class="form-control field-option" placeholder="Opción" value="${value}">
            <button type="button" class="btn btn-outline-danger remove-option">×</button>
        `;
        
        optionsList.appendChild(optionDiv);
        
        // Configurar listener para el nuevo botón de eliminar
        this.setupOptionRemovalListeners();
    },
    
    /**
     * Configura los listeners para los botones de eliminar opción
     */
    setupOptionRemovalListeners() {
        document.querySelectorAll('.remove-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const optionDiv = e.target.parentNode;
                const optionsList = optionDiv.parentNode;
                
                // No eliminar si es el único
                if (optionsList.children.length > 1) {
                    optionsList.removeChild(optionDiv);
                }
            });
        });
    },
    
    /**
     * Guarda un campo (nuevo o existente)
     */
    saveField() {
        const fieldForm = document.getElementById('fieldForm');
        if (!fieldForm.checkValidity()) {
            fieldForm.reportValidity();
            return;
        }
    
        const fieldId = document.getElementById('field-id').value;
        const fieldName = document.getElementById('field-name').value;
        const fieldType = document.getElementById('field-type').value;
        const fieldRequired = document.getElementById('field-required').checked;
    
        // Obtener valores de los nuevos checkboxes
        const useForRecordsTable = document.getElementById('field-use-for-records-table').checked;
        const isColumn3 = document.getElementById('field-is-column-3').checked;
        const isColumn4 = document.getElementById('field-is-column-4').checked;
        const isColumn5 = document.getElementById('field-is-column-5').checked;
        const useForComparativeReports = document.getElementById('field-use-for-comparative-reports').checked;
        const isHorizontalAxis = document.getElementById('field-is-horizontal-axis').checked;
        const isCompareField = document.getElementById('field-is-compare-field').checked;
    
        // Recolectar opciones si es tipo selección
        let options = [];
        if (fieldType === 'select') {
            const optionInputs = document.querySelectorAll('.field-option');
            optionInputs.forEach(input => {
                const value = input.value.trim();
                if (value) options.push(value);
            });
    
            // Validar que haya al menos una opción
            if (options.length === 0) {
                UIUtils.showAlert('Debe agregar al menos una opción para el tipo Selección', 'warning', document.querySelector('.modal-body'));
                return;
            }
        }
    
        // Validar exclusividad en otras entidades si se marca alguna columna o reporte
        // --- IMPORTANTE: Esta lógica de exclusividad debe ejecutarse ANTES de guardar el campo actual ---
        if (isColumn3 || isColumn4 || isColumn5 || isHorizontalAxis || isCompareField) {
            const fields = FieldModel.getAll();
    
            // Para cada campo existente (excepto el actual)
            fields.forEach(existingField => {
                if (existingField.id !== fieldId) {
                    let updated = false; // Bandera para saber si se actualizó el campo existente
    
                    // Para columnas
                    if (isColumn3 && existingField.isColumn3) {
                        existingField.isColumn3 = false;
                        updated = true;
                    }
                    if (isColumn4 && existingField.isColumn4) {
                        existingField.isColumn4 = false;
                        updated = true;
                    }
                    if (isColumn5 && existingField.isColumn5) {
                        existingField.isColumn5 = false;
                        updated = true;
                    }
    
                    // Para reportes
                    if (isHorizontalAxis && existingField.isHorizontalAxis) {
                        existingField.isHorizontalAxis = false;
                        updated = true;
                    }
                    if (isCompareField && existingField.isCompareField) {
                        existingField.isCompareField = false;
                        updated = true;
                    }
    
                    // Si se modificó algún flag del campo existente, guardarlo
                    if (updated) {
                        FieldModel.update(existingField.id, existingField);
                        // NOTA: Considera cómo manejar errores aquí si la actualización falla.
                        // Por simplicidad, se omite el manejo de errores para estas actualizaciones secundarias.
                    }
                }
            });
        }
    
        const fieldData = {
            name: fieldName,
            type: fieldType,
            required: fieldRequired,
            options: options,
            // Nuevas propiedades
            useForRecordsTable: useForRecordsTable,
            isColumn3: isColumn3,
            isColumn4: isColumn4,
            isColumn5: isColumn5,
            useForComparativeReports: useForComparativeReports,
            isHorizontalAxis: isHorizontalAxis,
            isCompareField: isCompareField
        };
    
        let result;
        if (fieldId) {
            // Actualizar campo existente
            result = FieldModel.update(fieldId, fieldData);
        } else {
            // Crear nuevo campo
            result = FieldModel.create(fieldData);
        }
    
        // --- INICIO DEL BLOQUE MODIFICADO ---
        if (result) {
            // Cerrar modal usando nuestro método mejorado
            this.cleanupModal('fieldModal');
    
            // Recargar lista de campos (en la vista de administración)
            this.loadFields(); // Asegúrate que 'this' se refiere al contexto correcto o llama al método adecuado
    
            // Actualizar los encabezados de columna en la vista de reportes si está visible
            // Asumiendo que tienes un objeto Router y UIUtils globales o accesibles
            if (typeof Router !== 'undefined' && Router.currentRoute === 'reports') {
                // Si la vista de reportes está activa, actualízala
                if (Router.routes && Router.routes.reports && typeof Router.routes.reports.init === 'function') {
                    Router.routes.reports.init(); // Llama al método para refrescar la vista de reportes
                    UIUtils.showAlert('Campo guardado y vista de reportes actualizada', 'success', document.querySelector('.container'));
                } else {
                     // Si no se puede refrescar la vista de reportes, muestra un mensaje estándar o de advertencia
                     const message = fieldId ? 'Campo actualizado correctamente' : 'Campo creado correctamente';
                     UIUtils.showAlert(message + '. No se pudo actualizar la vista de reportes automáticamente.', 'warning', document.querySelector('.container'));
                }
            } else if (isColumn3 || isColumn4 || isColumn5) {
                // Si se modificó una columna pero no estamos en reportes, notificar al usuario
                UIUtils.showAlert('Campo guardado. Para ver los cambios en las columnas de reportes, cambie a la vista de Reportes', 'info', document.querySelector('.container'));
            } else {
                // Mensaje normal si no se afectaron columnas de reportes o no estamos en la vista de reportes
                const message = fieldId ? 'Campo actualizado correctamente' : 'Campo creado correctamente';
                UIUtils.showAlert(message, 'success', document.querySelector('.container'));
            }
        } else {
            // Si hubo un error al guardar (result es false o undefined)
            UIUtils.showAlert('Error al guardar el campo', 'danger', document.querySelector('.modal-body')); // Mostrar error dentro del modal es a menudo mejor UX
        }
        // --- FIN DEL BLOQUE MODIFICADO ---
    },
    
    /**
     * Confirma la eliminación de un campo
     * @param {string} fieldId ID del campo a eliminar
     */
    confirmDeleteField(fieldId) {
        const field = FieldModel.getById(fieldId);
        if (!field) return;
        
        const confirmModal = UIUtils.initModal('confirmModal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmActionBtn = document.getElementById('confirmActionBtn');
        
        confirmMessage.textContent = `¿Está seguro de eliminar el campo "${field.name}"? Esta acción no se puede deshacer y afectará a todas las entidades que lo utilizan.`;
        
        // Eliminar listeners anteriores
        const newConfirmBtn = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
        
        // Agregar nuevo listener
        newConfirmBtn.addEventListener('click', () => {
            const deleted = FieldModel.delete(fieldId);
            
            if (deleted) {
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
                
                // Recargar lista
                this.loadFields();
                
                // Mostrar mensaje
                UIUtils.showAlert('Campo eliminado correctamente', 'success', document.querySelector('.container'));
            } else {
                UIUtils.showAlert('Error al eliminar el campo', 'danger', document.querySelector('.container'));
            }
        });
        
        confirmModal.show();
    },
    
    /**
     * Muestra el modal para asignar campos a una entidad
     * @param {string} entityId ID de la entidad
     */
    showAssignFieldsModal(entityId) {
        const entity = EntityModel.getById(entityId);
        if (!entity) {
            console.error('Entidad no encontrada:', entityId);
            return;
        }
        
        // Obtener todos los campos disponibles
        const allFields = FieldModel.getAll() || [];
        
        // Inicializar arrays si no existen
        if (!entity.fields) {
            entity.fields = [];
        }
        
        // Separar campos disponibles y asignados
        const availableFields = allFields.filter(field => field && !entity.fields.includes(field.id));
        // Asegurar el orden correcto de los campos asignados según entity.fields
        const assignedFields = entity.fields
            .map(fieldId => allFields.find(field => field && field.id === fieldId))
            .filter(Boolean);
        
        // Actualizar listas en el modal
        const availableFieldsList = document.getElementById('available-fields-list');
        const assignedFieldsList = document.getElementById('assigned-fields-list');
        
        if (!availableFieldsList || !assignedFieldsList) {
            console.error('Listas de campos no encontradas en el DOM');
            return;
        }
        
        // Limpiar listas
        availableFieldsList.innerHTML = '';
        assignedFieldsList.innerHTML = '';
        
        // Añadir mensaje informativo sobre la función de arrastrar y ordenar
        const assignedFieldsHeader = assignedFieldsList.closest('.col-md-6').querySelector('h6');
        if (assignedFieldsHeader) {
            // Eliminar mensajes informativos existentes para evitar duplicación
            const existingHelpTexts = assignedFieldsHeader.parentNode.querySelectorAll('small.text-muted');
            existingHelpTexts.forEach(helpText => helpText.remove());
            
            // Añadir mensaje informativo una vez limpiado
            const helpText = document.createElement('small');
            helpText.className = 'text-muted d-block mt-1 mb-2';
            helpText.innerHTML = '<i class="bi bi-info-circle"></i> Puede arrastrar los campos para reordenarlos. El orden se respetará en el formulario de registro.';
            assignedFieldsHeader.insertAdjacentElement('afterend', helpText);
        }
        
        // Renderizar campos disponibles
        if (availableFields.length === 0) {
            availableFieldsList.innerHTML = '<div class="text-center text-muted">No hay campos disponibles</div>';
        } else {
            availableFields.forEach(field => {
                const item = this._createFieldListItem(field);
                availableFieldsList.appendChild(item);
                
                item.addEventListener('click', () => {
                    this.toggleFieldSelection(item, 'available');
                });
            });
        }
        
        // Renderizar campos asignados
        if (assignedFields.length === 0) {
            assignedFieldsList.innerHTML = '<div class="text-center text-muted">No hay campos asignados</div>';
        } else {
            assignedFields.forEach(field => {
                const item = this._createFieldListItem(field);
                assignedFieldsList.appendChild(item);
                
                item.addEventListener('click', () => {
                    this.toggleFieldSelection(item, 'assigned');
                });
            });
        }
        
        // Configurar botón de guardar
        const saveBtn = document.getElementById('saveAssignFieldsBtn');
        if (saveBtn) {
            saveBtn.setAttribute('data-entity-id', entityId);
        }
        
        // Mostrar título de la entidad
        const entityNameEl = document.getElementById('entity-name-title');
        if (entityNameEl) {
            entityNameEl.textContent = entity.name;
        }
        
        // Inicializar la funcionalidad de arrastrar y ordenar en la lista de campos asignados
        if (window.Sortable && assignedFieldsList) {
            // Destruir instancia previa si existe
            if (this.assignedFieldsSortable) {
                this.assignedFieldsSortable.destroy();
            }
            
            // Crear nueva instancia de Sortable
            this.assignedFieldsSortable = new Sortable(assignedFieldsList, {
                animation: 150,
                handle: '.badge',  // Usar el badge como mango para arrastrar
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    // Opcional: Actualizar clases visuales o realizar otras acciones después de ordenar
                    console.log('Campo reordenado:', evt.item.getAttribute('data-field-id'));
                }
            });
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('assignFieldsModal'));
        modal.show();
    },
    
    /**
     * Crea un elemento de lista para un campo
     * @param {Object} field Campo a mostrar
     * @returns {HTMLElement} Elemento de lista
     */
    _createFieldListItem(field) {
        const item = document.createElement('div');
        item.className = 'list-group-item field-item';
        item.setAttribute('data-field-id', field.id);
        item.setAttribute('title', 'Haga clic para mover entre listas. En la lista de campos asignados, puede arrastrar para reordenar.');
        
        // Mostrar tipo de campo formateado
        let fieldType = this._getFieldTypeLabel(field.type);
        
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${field.name}</strong>
                    <small class="text-muted ms-2">${fieldType}</small>
                </div>
                <span class="badge bg-primary rounded-pill drag-handle" title="Arrastrar para reordenar">
                    <i class="bi bi-grip-vertical"></i>
                </span>
            </div>
        `;
        
        return item;
    },

    /**
     * Obtiene la etiqueta legible para un tipo de campo
     * @param {string} type Tipo de campo
     * @returns {string} Etiqueta del tipo
     */
    _getFieldTypeLabel(type) {
        switch (type) {
            case 'text': return 'Texto';
            case 'number': return 'Número';
            case 'select': return 'Selección';
            default: return type;
        }
    },

    /**
     * Alterna la selección de un campo en el modal de asignación
     * @param {HTMLElement} item Elemento del campo
     * @param {string} listType Tipo de lista ('available' o 'assigned')
     */
    toggleFieldSelection(item, listType) {
        const fieldId = item.getAttribute('data-field-id');
        const targetList = listType === 'available' ? 'assigned-fields-list' : 'available-fields-list';
        const targetContainer = document.getElementById(targetList);
        
        if (!targetContainer) {
            console.error('Contenedor de lista no encontrado:', targetList);
            return;
        }
        
        // Mover elemento a la lista opuesta
        targetContainer.appendChild(item);
        
        // Actualizar clases
        item.classList.toggle('selected');
        
        // Si movemos un campo a la lista de asignados, asegurarse de que Sortable siga funcionando
        if (listType === 'available' && window.Sortable && this.assignedFieldsSortable) {
            // Refrescar la instancia de Sortable para reconocer el nuevo elemento
            this.assignedFieldsSortable.option("disabled", false);
        }
    },

    /**
     * Actualiza las referencias visibles a "Entidad" con el nuevo nombre
     * @param {string} newEntityName El nuevo nombre para "Entidad"
     */
    updateEntityNameReferences(newEntityName) {
        console.log("Actualizando referencias a Entidad con:", newEntityName);
        
        // Actualizar encabezado "Entidades Principales"
        const entitiesHeader = document.querySelector('.card-header h5');
        if (entitiesHeader && entitiesHeader.textContent.includes("Entidades")) {
            entitiesHeader.textContent = entitiesHeader.textContent.replace("Entidades", newEntityName + "s");
        }
        
        // Actualizar botón "Agregar Entidad"
        const addEntityBtn = document.getElementById('add-entity-btn');
        if (addEntityBtn) {
            const btnHTML = addEntityBtn.innerHTML;
            if (btnHTML.includes("Agregar Entidad")) {
                addEntityBtn.innerHTML = btnHTML.replace("Agregar Entidad", "Agregar " + newEntityName);
            }
        }
        
        // Actualizar mensaje "No hay entidades registradas"
        const noEntitiesMessage = document.getElementById('no-entities-message');
        if (noEntitiesMessage) {
            const messageText = noEntitiesMessage.querySelector('p');
            if (messageText && messageText.textContent.includes("entidades")) {
                messageText.textContent = messageText.textContent
                    .replace("entidades", newEntityName.toLowerCase() + "s")
                    .replace("nueva entidad", "nueva " + newEntityName.toLowerCase());
            }
        }
        
        // Actualizar modal de entidad
        const entityModalTitle = document.getElementById('entityModalTitle');
        if (entityModalTitle) {
            if (entityModalTitle.textContent === "Entidad Principal") {
                entityModalTitle.textContent = newEntityName + " Principal";
            } else if (entityModalTitle.textContent === "Nueva Entidad Principal") {
                entityModalTitle.textContent = "Nueva " + newEntityName + " Principal";
            } else if (entityModalTitle.textContent === "Editar Entidad Principal") {
                entityModalTitle.textContent = "Editar " + newEntityName + " Principal";
            }
        }
    },

    /**
     * Actualiza las referencias visibles a "Registro" con el nuevo nombre
     * @param {string} newRecordName El nuevo nombre para "Registro"
     */
    updateRecordNameReferences(newRecordName) {
        console.log("Actualizando referencias a Registro con:", newRecordName);
        
        // Actualizar encabezado "Importación Masiva de Registros"
        const importHeader = document.querySelector('.card-header h5');
        if (importHeader && importHeader.textContent.includes("Registros")) {
            importHeader.textContent = importHeader.textContent.replace("Registros", newRecordName + "s");
        }
        
        // No hay referencias directas a "Registro" en la vista de administración
        // que necesiten ser actualizadas en tiempo real
        
        // Si se implementa vista de registro en esta sección, añadir aquí
    },

    /**
     * Descarga una plantilla para importación masiva
     * @param {string} entityId ID de la entidad seleccionada (opcional)
     */
    downloadImportTemplate(entityId = null) {
        MassImportUtils.generateSampleFile(entityId);
    },

    /**
     * Datos procesados de la importación actual
     */
    importData: null,

    /**
     * Procesa un archivo para importación masiva
     * @param {File} file Archivo a procesar
     */
    processImportFile(file) {
        if (!file) return;
        
        // Mostrar indicador de carga
        const processBtn = document.getElementById('process-import-btn');
        const originalText = processBtn.innerHTML;
        processBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
        processBtn.disabled = true;
        
        // Procesar el archivo
        MassImportUtils.parseImportFile(file)
            .then(result => {
                // Guardar resultado para uso posterior
                this.importData = result;
                
                // Mostrar previsualización
                this.showImportPreview(result);
                
                // Restaurar botón
                processBtn.innerHTML = originalText;
                processBtn.disabled = false;
            })
            .catch(error => {
                UIUtils.showAlert('Error al procesar el archivo: ' + error.message, 'danger');
                
                // Restaurar botón
                processBtn.innerHTML = originalText;
                processBtn.disabled = false;
            });
    },

    /**
     * Muestra la previsualización de los datos a importar
     * @param {Object} importData Datos procesados
     */
    showImportPreview(importData) {
        if (!importData) return;
        
        const modal = UIUtils.initModal('importPreviewModal');
        const importSummary = document.getElementById('import-summary');
        const importErrors = document.getElementById('import-errors');
        const errorList = document.getElementById('error-list');
        const previewTable = document.getElementById('import-preview-table');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        // Actualizar resumen
        importSummary.innerHTML = `
            <div class="alert ${importData.valid ? 'alert-success' : 'alert-warning'}">
                <p class="mb-0"><strong>Resumen:</strong> ${importData.validRows} de ${importData.totalRows} filas válidas para importar.</p>
            </div>
        `;
        
        // Mostrar errores si hay
        if (importData.errors && importData.errors.length > 0) {
            errorList.innerHTML = importData.errors.map(error => `<li>${error}</li>`).join('');
            importErrors.style.display = 'block';
        } else {
            importErrors.style.display = 'none';
        }
        
        // Habilitar/deshabilitar botón de confirmar
        confirmBtn.disabled = !importData.valid || importData.validRows === 0;
        
        // Crear tabla de previsualización
        if (importData.data && importData.data.length > 0) {
            // Obtener entidades para mostrar nombres
            const entities = EntityModel.getAll();
            
            // Cabeceras
            const theadHTML = `
                <tr>
                    <th>Entidad</th>
                    <th>Fecha y Hora</th>
                    <th>Campos</th>
                </tr>
            `;
            
            // Filas de datos (mostrar máximo 100 para no sobrecargar)
            const maxRows = Math.min(importData.data.length, 100);
            let tbodyHTML = '';
            
            for (let i = 0; i < maxRows; i++) {
                const item = importData.data[i];
                const entity = entities.find(e => e.id === item.entityId) || { name: 'Desconocido' };
                const formattedDate = new Date(item.timestamp).toLocaleString();
                
                // Formatear los campos en pares clave-valor
                const fieldsHTML = Object.keys(item.data)
                    .map(fieldId => {
                        const field = FieldModel.getById(fieldId);
                        return `<strong>${field ? field.name : fieldId}:</strong> ${item.data[fieldId]}`;
                    })
                    .join('<br>');
                
                tbodyHTML += `
                    <tr>
                        <td>${entity.name}</td>
                        <td>${formattedDate}</td>
                        <td>${fieldsHTML}</td>
                    </tr>
                `;
            }
            
            // Si hay más filas, mostrar indicador
            if (importData.data.length > maxRows) {
                tbodyHTML += `
                    <tr>
                        <td colspan="3" class="text-center text-muted">
                            ... y ${importData.data.length - maxRows} filas más
                        </td>
                    </tr>
                `;
            }
            
            // Actualizar tabla
            previewTable.querySelector('thead').innerHTML = theadHTML;
            previewTable.querySelector('tbody').innerHTML = tbodyHTML;
        }
        
        // Mostrar modal
        modal.show();
    },

    /**
     * Confirma la importación de los datos
     */
    confirmImport() {
        if (!this.importData || !this.importData.data) {
            UIUtils.showAlert('No hay datos para importar', 'warning');
            return;
        }
        
        // Confirmar importación
        const confirmModal = UIUtils.initModal('confirmModal');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmActionBtn = document.getElementById('confirmActionBtn');
        
        confirmMessage.textContent = `¿Está seguro de importar ${this.importData.data.length} registros? Esta acción añadirá los nuevos registros a los existentes.`;
        
        // Eliminar listeners anteriores
        const newConfirmBtn = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);
        
        // Agregar nuevo listener
        newConfirmBtn.addEventListener('click', () => {
            // Importar los datos
            const result = MassImportUtils.importRecords(this.importData.data);
            
            // Cerrar modales
            bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
            bootstrap.Modal.getInstance(document.getElementById('importPreviewModal')).hide();
            
            // Mostrar resultado
            if (result.success) {
                // Limpiar formulario
                document.getElementById('import-file').value = '';
                document.getElementById('process-import-btn').disabled = true;
                this.importData = null;
                
                UIUtils.showAlert(result.message, 'success');
            } else {
                UIUtils.showAlert(result.message, 'danger');
            }
        });
        
        // Mostrar modal
        confirmModal.show();
    },

    /**
     * Guarda la asignación de campos a una entidad
     */
    saveAssignedFields() {
        const saveBtn = document.getElementById('saveAssignFieldsBtn');
        const entityId = saveBtn.getAttribute('data-entity-id');
        
        // Obtener la entidad original SOLO para extraer el nombre
        const originalEntity = EntityModel.getById(entityId);
        if (!originalEntity) {
            console.error('Error: Entidad original no encontrada para guardar asignación:', entityId);
            UIUtils.showAlert('Error al guardar: Entidad no encontrada.', 'danger', document.querySelector('#assignFieldsModal .modal-body'));
            return;
        }

        // Extraer el nombre de la entidad de forma segura
        let entityName = '';
        console.log('Analizando entidad original para extraer nombre:', JSON.stringify(originalEntity));
        
        const extractName = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string') return obj;
            if (typeof obj.name === 'string') return obj.name;
            if (typeof obj.name === 'object') return extractName(obj.name); // Recursión
            return null;
        };

        entityName = extractName(originalEntity);
        
        if (!entityName) {
            console.warn('No se pudo extraer el nombre, usando fallback.');
            entityName = `Entidad ${entityId.split('_')[1] || 'desconocida'}`;
        }
        console.log('Nombre extraído:', entityName);

        // Recolectar los nuevos IDs de campos asignados desde el DOM EN EL ORDEN ACTUAL
        const assignedFieldsList = document.getElementById('assigned-fields-list');
        const assignedFieldItems = assignedFieldsList.querySelectorAll('.field-item');
        const assignedFieldIds = [];
        assignedFieldItems.forEach(item => {
            const fieldId = item.getAttribute('data-field-id');
            if (fieldId) {
                assignedFieldIds.push(fieldId);
            }
        });
        
        // Registrar el orden de forma clara para depuración
        console.log('---------------------------------------');
        console.log('GUARDANDO ORDEN DE CAMPOS:');
        assignedFieldIds.forEach((id, index) => {
            const fieldName = FieldModel.getById(id)?.name || 'Desconocido';
            console.log(`${index + 1}. ${id} (${fieldName})`);
        });
        console.log('---------------------------------------');

        // Crear un objeto COMPLETAMENTE NUEVO y LIMPIO para la actualización
        // Solo incluir las propiedades que queremos actualizar.
        const updateData = {
            fields: [...assignedFieldIds]  // Usamos spread operator para crear una copia nueva del array
        };
        
        // Si el nombre ha cambiado, también actualizarlo
        if (originalEntity.name !== entityName) {
            updateData.name = String(entityName);
        }
        
        console.log('Intentando actualizar entidad con datos y orden nuevo:', entityId, updateData);
        
        // Usar EntityModel.update con el objeto limpio
        const success = EntityModel.update(entityId, updateData);
        
        if (success) {
            console.log('Actualización exitosa reportada por EntityModel.update.');
            // Verificar el estado de la entidad DESPUÉS de la actualización
            const updatedEntity = EntityModel.getById(entityId);
            console.log('Entidad recuperada DESPUÉS de actualizar con orden nuevo:', JSON.stringify(updatedEntity));
            console.log('Campos en orden salvado:', JSON.stringify(updatedEntity.fields));

            // Cerrar el modal manualmente
            try {
                const modalElement = document.getElementById('assignFieldsModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Fallback manual si no podemos obtener la instancia
                    modalElement.classList.remove('show');
                    modalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                }
                
                // Mostrar alerta de éxito UNA SOLA VEZ
                const config = StorageService.getConfig();
                const entityTypeName = config.entityName || 'Entidad';
                UIUtils.showAlert(`Campos asignados a la ${entityTypeName.toLowerCase()} "${entityName}" guardados correctamente.`, 'success', document.querySelector('.container'));
                
            } catch (error) {
                console.error('Error al cerrar modal o mostrar mensaje:', error);
                // Intentar mostrar alerta de éxito de todos modos
                UIUtils.showAlert(`Campos asignados guardados correctamente.`, 'success', document.querySelector('.container'));
            }
        } else {
            console.error('Error reportado al guardar asignación de campos.');
            UIUtils.showAlert('Error al guardar la asignación de campos.', 'danger', document.querySelector('#assignFieldsModal .modal-body'));
        }
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        this.render();
        this.setupEventListeners();
    }
};