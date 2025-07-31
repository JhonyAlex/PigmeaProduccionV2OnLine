// Nueva vista para importación masiva de datos desde tabla (Excel, CSV, copiar/pegar)
const BulkRegisterView = {
    entityName: 'Entidad',
    recordName: 'Registro',
    allFields: [],
    parsedData: null,

    /**
     * Inicializa la vista de carga masiva
     */
    init() {
        try {
            const config = StorageService.getConfig();
            this.entityName = config.entityName || 'Entidad';
            this.recordName = config.recordName || 'Registro';

            // Obtener todos los campos activos una sola vez
            this.allFields = FieldModel.getActive();

            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error al inicializar BulkRegisterView:', error);
            UIUtils.showAlert('Error al inicializar la vista de carga masiva', 'danger');
        }
    },

    /**
     * Renderiza la interfaz de importación
     */
    render() {
        const container = Router.getActiveViewContainer() || document.querySelector('.main-content');
        if (!container) return;

        const entities = EntityModel.getActive();
        const entityOptions = entities.map(ent => `<option value="${ent.id}">${ent.name.name || ent.name}</option>`).join('');
        
        // Obtener campos pre-tabulares globales (no dependientes de entidad)
        const preTabularFields = FieldModel.getPreTabularFields();

        container.innerHTML = `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-table"></i> Importación Masiva de Datos
                                </h5>
                                <small class="text-muted">Copie y pegue datos tabulares desde Excel o ingrese manualmente</small>
                            </div>
                            <div class="card-body">
                                <!-- Controles de configuración -->
                                <div class="row mb-4">
                                    <div class="col-md-3">
                                        <label for="bulk-entity-select" class="form-label">
                                            <i class="bi bi-building"></i> ${this.entityName} *
                                        </label>
                                        <select class="form-select" id="bulk-entity-select" required>
                                            <option value="">Seleccione una ${this.entityName.toLowerCase()}</option>
                                            ${entityOptions}
                                        </select>
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox" id="include-entity-in-tabular">
                                            <label class="form-check-label" for="include-entity-in-tabular">
                                                <small>Incluir ${this.entityName.toLowerCase()} en datos tabulares</small>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="bulk-date-input" class="form-label">
                                            <i class="bi bi-calendar"></i> Fecha y Hora (común)
                                        </label>
                                        <input type="datetime-local" class="form-control" id="bulk-date-input">
                                        <small class="text-muted">Se aplicará a todos los registros si no especifica fechas en los datos</small>
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox" id="include-date-in-tabular">
                                            <label class="form-check-label" for="include-date-in-tabular">
                                                <small>Incluir fecha en datos tabulares</small>
                                            </label>
                                        </div>
                                    </div>
                                    ${this.renderPreTabularFields(preTabularFields)}
                                    <div class="col-md-2">
                                        <label for="bulk-separator" class="form-label">
                                            <i class="bi bi-list"></i> Separador de datos
                                        </label>
                                        <select class="form-select" id="bulk-separator">
                                            <option value="tab">Tabulación (Tab)</option>
                                            <option value="comma">Coma (,)</option>
                                            <option value="semicolon">Punto y coma (;)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Área de datos -->
                                <div class="row">
                                    <div class="col-12">
                                        <label for="bulk-data-textarea" class="form-label">
                                            <i class="bi bi-clipboard-data"></i> Datos Tabulares *
                                        </label>
                                        <textarea 
                                            class="form-control font-monospace" 
                                            id="bulk-data-textarea" 
                                            rows="10"
                                            placeholder="Pegue aquí sus datos desde Excel. Ejemplo:

Pedido	Metros	Camisa	Tipo laminado
4098	74000	40840	Antivaho
3484	74000	47847	Antivaho
3487	42500	47945	Antivaho
3483	42500	47582	Antivaho

La primera fila debe contener los nombres de los campos."
                                        ></textarea>
                                        <small class="text-muted">
                                            <i class="bi bi-info-circle"></i> 
                                            Copie directamente desde Excel o ingrese datos separados por tabulaciones/comas. 
                                            La primera fila debe contener los nombres de los campos.
                                        </small>
                                    </div>
                                </div>

                                <!-- Botones de acción -->
                                <div class="row mt-4">
                                    <div class="col-12">
                                        <button type="button" class="btn btn-primary me-2" id="parse-data-btn">
                                            <i class="bi bi-search"></i> Previsualizar Datos
                                        </button>
                                        <button type="button" class="btn btn-success me-2" id="import-data-btn" disabled>
                                            <i class="bi bi-download"></i> Importar Registros
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" id="clear-data-btn">
                                            <i class="bi bi-trash"></i> Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Vista previa de datos -->
                <div class="row mt-4" id="preview-section" style="display: none;">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="card-title mb-0">
                                    <i class="bi bi-eye"></i> Vista Previa de Datos
                                </h6>
                            </div>
                            <div class="card-body">
                                <div id="preview-summary" class="mb-3">
                                    <!-- Resumen aquí -->
                                </div>
                                <div id="preview-errors" class="mb-3" style="display: none;">
                                    <!-- Errores aquí -->
                                </div>
                                <div class="table-responsive" style="max-height: 400px;">
                                    <table class="table table-sm table-striped" id="preview-table">
                                        <thead class="table-light sticky-top" id="preview-header">
                                            <!-- Headers aquí -->
                                        </thead>
                                        <tbody id="preview-body">
                                            <!-- Datos aquí -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Establecer fecha actual como valor por defecto
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('bulk-date-input').value = now.toISOString().slice(0, 16);
        
        // Configurar campos pre-tabulares después de renderizar
        this.setupPreTabularFields(preTabularFields);
        
        // Cargar preferencias guardadas
        this.loadSavedPreferences(preTabularFields);
    },

    /**
     * Renderiza los campos pre-tabulares dinámicamente
     * @param {Array} preTabularFields Lista de campos pre-tabulares
     * @returns {string} HTML de los campos pre-tabulares
     */
    renderPreTabularFields(preTabularFields) {
        if (!preTabularFields || preTabularFields.length === 0) {
            return '';
        }

        const fieldsHtml = preTabularFields.map(field => {
            const fieldId = `bulk-pretab-${field.id}`;
            const checkboxId = `include-${field.id}-in-tabular`;
            let inputHtml = '';

            switch (field.type) {
                case 'text':
                    inputHtml = `<input type="text" class="form-control" id="${fieldId}" name="${fieldId}">`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" class="form-control" id="${fieldId}" name="${fieldId}">`;
                    break;
                case 'select':
                    const options = (field.options || [])
                        .filter(opt => (typeof opt === 'object' ? opt.active !== false : true))
                        .map(opt => {
                            const value = typeof opt === 'object' ? opt.value : opt;
                            return `<option value="${value}">${value}</option>`;
                        }).join('');
                    inputHtml = `
                        <select class="form-select" id="${fieldId}" name="${fieldId}">
                            <option value="">Seleccionar ${field.name.toLowerCase()}</option>
                            ${options}
                        </select>
                    `;
                    break;
                default:
                    inputHtml = `<input type="text" class="form-control" id="${fieldId}" name="${fieldId}">`;
            }

            return `
                <div class="col-md-2">
                    <label for="${fieldId}" class="form-label">
                        <i class="bi bi-tag"></i> ${field.name}
                    </label>
                    ${inputHtml}
                    <small class="text-muted">Se aplicará a todos los registros</small>
                    <div class="form-check mt-2">
                        <input class="form-check-input" type="checkbox" id="${checkboxId}" data-field-id="${field.id}">
                        <label class="form-check-label" for="${checkboxId}">
                            <small>Incluir en datos tabulares</small>
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        return fieldsHtml;
    },

    /**
     * Configura los campos pre-tabulares después del renderizado
     * @param {Array} preTabularFields Lista de campos pre-tabulares
     */
    setupPreTabularFields(preTabularFields) {
        if (!preTabularFields || preTabularFields.length === 0) {
            return;
        }

        // Configurar selects con búsqueda para campos de tipo select
        preTabularFields.forEach(field => {
            if (field.type === 'select') {
                const fieldId = `bulk-pretab-${field.id}`;
                // Intentar configurar el select con búsqueda si está disponible
                if (typeof UIUtils !== 'undefined' && UIUtils.setupSearchableSelect) {
                    try {
                        UIUtils.setupSearchableSelect(`#${fieldId}`);
                    } catch (error) {
                        console.warn(`No se pudo configurar búsqueda para el campo ${field.name}:`, error);
                    }
                }
            }
        });
    },

    /**
     * Carga las preferencias guardadas del usuario
     * @param {Array} preTabularFields Lista de campos pre-tabulares
     */
    loadSavedPreferences(preTabularFields) {
        const preferences = BulkPreferencesUtils.getPreferences();
        
        // Cargar estado de inclusión para entidad
        const includeEntityCheckbox = document.getElementById('include-entity-in-tabular');
        if (includeEntityCheckbox) {
            includeEntityCheckbox.checked = preferences.includeEntityInTabular || false;
        }
        
        // Cargar estado de inclusión para fecha
        const includeDateCheckbox = document.getElementById('include-date-in-tabular');
        if (includeDateCheckbox) {
            includeDateCheckbox.checked = preferences.includeDateInTabular || false;
        }
        
        // Cargar última selección de entidad
        const entitySelect = document.getElementById('bulk-entity-select');
        if (entitySelect && preferences.lastEntitySelection) {
            entitySelect.value = preferences.lastEntitySelection;
        }
        
        // Cargar último valor de fecha
        const dateInput = document.getElementById('bulk-date-input');
        if (dateInput && preferences.lastDateValue) {
            dateInput.value = preferences.lastDateValue;
        }
        
        // Cargar preferencias de campos personalizados
        preTabularFields.forEach(field => {
            const checkboxId = `include-${field.id}-in-tabular`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = BulkPreferencesUtils.getCustomFieldInclusion(field.id);
            }
            
            // Cargar último valor del campo
            const fieldInput = document.getElementById(`bulk-pretab-${field.id}`);
            if (fieldInput) {
                const lastValue = BulkPreferencesUtils.getPreTabularValue(field.id);
                if (lastValue !== undefined && lastValue !== null) {
                    fieldInput.value = lastValue;
                }
            }
        });
        
        // Configurar visibilidad inicial basada en las preferencias
        this.updateFieldVisibility();
    },

    /**
     * Guarda las preferencias actuales del usuario
     */
    saveCurrentPreferences() {
        const preferences = BulkPreferencesUtils.getPreferences();
        
        // Guardar estado de inclusión para entidad
        const includeEntityCheckbox = document.getElementById('include-entity-in-tabular');
        if (includeEntityCheckbox) {
            preferences.includeEntityInTabular = includeEntityCheckbox.checked;
        }
        
        // Guardar estado de inclusión para fecha
        const includeDateCheckbox = document.getElementById('include-date-in-tabular');
        if (includeDateCheckbox) {
            preferences.includeDateInTabular = includeDateCheckbox.checked;
        }
        
        // Guardar selección de entidad
        const entitySelect = document.getElementById('bulk-entity-select');
        if (entitySelect && entitySelect.value) {
            preferences.lastEntitySelection = entitySelect.value;
        }
        
        // Guardar valor de fecha
        const dateInput = document.getElementById('bulk-date-input');
        if (dateInput && dateInput.value) {
            preferences.lastDateValue = dateInput.value;
        }
        
        // Guardar preferencias de campos personalizados
        const preTabularFields = FieldModel.getPreTabularFields();
        preTabularFields.forEach(field => {
            const checkboxId = `include-${field.id}-in-tabular`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                BulkPreferencesUtils.updateCustomFieldInclusion(field.id, checkbox.checked);
            }
            
            // Guardar valor del campo
            const fieldInput = document.getElementById(`bulk-pretab-${field.id}`);
            if (fieldInput && fieldInput.value) {
                BulkPreferencesUtils.updatePreTabularValue(field.id, fieldInput.value);
            }
        });
        
        BulkPreferencesUtils.savePreferences(preferences);
    },

    /**
     * Actualiza la visibilidad de los campos según las preferencias de inclusión
     */
    updateFieldVisibility() {
        // Actualizar visibilidad del campo entidad
        const includeEntityCheckbox = document.getElementById('include-entity-in-tabular');
        const entitySelect = document.getElementById('bulk-entity-select');
        if (includeEntityCheckbox && entitySelect) {
            entitySelect.style.display = includeEntityCheckbox.checked ? 'none' : 'block';
            const entityLabel = entitySelect.previousElementSibling;
            if (entityLabel && entityLabel.tagName === 'LABEL') {
                entityLabel.style.display = includeEntityCheckbox.checked ? 'none' : 'block';
            }
        }
        
        // Actualizar visibilidad del campo fecha
        const includeDateCheckbox = document.getElementById('include-date-in-tabular');
        const dateInput = document.getElementById('bulk-date-input');
        if (includeDateCheckbox && dateInput) {
            dateInput.style.display = includeDateCheckbox.checked ? 'none' : 'block';
            const dateLabel = dateInput.previousElementSibling;
            if (dateLabel && dateLabel.tagName === 'LABEL') {
                dateLabel.style.display = includeDateCheckbox.checked ? 'none' : 'block';
            }
            const dateHelp = dateInput.nextElementSibling;
            if (dateHelp && dateHelp.classList.contains('text-muted')) {
                dateHelp.style.display = includeDateCheckbox.checked ? 'none' : 'block';
            }
        }
        
        // Actualizar visibilidad de campos personalizados
        const preTabularFields = FieldModel.getPreTabularFields();
        preTabularFields.forEach(field => {
            const checkboxId = `include-${field.id}-in-tabular`;
            const checkbox = document.getElementById(checkboxId);
            const fieldInput = document.getElementById(`bulk-pretab-${field.id}`);
            
            if (checkbox && fieldInput) {
                fieldInput.style.display = checkbox.checked ? 'none' : 'block';
                const fieldLabel = fieldInput.previousElementSibling;
                if (fieldLabel && fieldLabel.tagName === 'LABEL') {
                    fieldLabel.style.display = checkbox.checked ? 'none' : 'block';
                }
                const fieldHelp = fieldInput.nextElementSibling;
                if (fieldHelp && fieldHelp.classList.contains('text-muted')) {
                    fieldHelp.style.display = checkbox.checked ? 'none' : 'block';
                }
            }
        });
    },

    /**
     * Obtiene los valores de los campos pre-tabulares
     * @returns {Object} Objeto con los valores de los campos pre-tabulares
     */
    getPreTabularValues() {
        const preTabularFields = FieldModel.getPreTabularFields();
        const values = {};

        preTabularFields.forEach(field => {
            // Solo incluir si NO está marcado para inclusión en datos tabulares
            const checkbox = document.getElementById(`include-${field.id}-in-tabular`);
            const shouldIncludeInTabular = checkbox && checkbox.checked;
            
            if (!shouldIncludeInTabular) {
                const fieldId = `bulk-pretab-${field.id}`;
                const element = document.getElementById(fieldId);
                if (element && element.value) {
                    values[field.id] = element.value;
                }
            }
        });

        return values;
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        document.getElementById('parse-data-btn').addEventListener('click', () => this.parseData());
        document.getElementById('import-data-btn').addEventListener('click', () => this.importData());
        document.getElementById('clear-data-btn').addEventListener('click', () => this.clearData());
        
        // Re-parsear cuando cambie el separador
        document.getElementById('bulk-separator').addEventListener('change', () => {
            if (document.getElementById('bulk-data-textarea').value.trim()) {
                this.parseData();
            }
        });

        // Event listeners para checkboxes de inclusión
        const includeEntityCheckbox = document.getElementById('include-entity-in-tabular');
        if (includeEntityCheckbox) {
            includeEntityCheckbox.addEventListener('change', () => {
                this.updateFieldVisibility();
                this.saveCurrentPreferences();
            });
        }

        const includeDateCheckbox = document.getElementById('include-date-in-tabular');
        if (includeDateCheckbox) {
            includeDateCheckbox.addEventListener('change', () => {
                this.updateFieldVisibility();
                this.saveCurrentPreferences();
            });
        }

        // Event listeners para campos personalizados
        const preTabularFields = FieldModel.getPreTabularFields();
        preTabularFields.forEach(field => {
            const checkboxId = `include-${field.id}-in-tabular`;
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateFieldVisibility();
                    this.saveCurrentPreferences();
                });
            }

            // Guardar valores cuando cambien
            const fieldInput = document.getElementById(`bulk-pretab-${field.id}`);
            if (fieldInput) {
                fieldInput.addEventListener('change', () => {
                    this.saveCurrentPreferences();
                });
            }
        });

        // Guardar preferencias cuando cambien los valores principales
        const entitySelect = document.getElementById('bulk-entity-select');
        if (entitySelect) {
            entitySelect.addEventListener('change', () => {
                this.saveCurrentPreferences();
            });
        }

        const dateInput = document.getElementById('bulk-date-input');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.saveCurrentPreferences();
            });
        }
    },

    /**
     * Parsea los datos ingresados en el textarea
     */
    parseData() {
        const entityIdElement = document.getElementById('bulk-entity-select');
        const includeEntityInTabular = document.getElementById('include-entity-in-tabular').checked;
        const entityId = entityIdElement ? entityIdElement.value : null;
        const dataText = document.getElementById('bulk-data-textarea').value.trim();
        const separator = document.getElementById('bulk-separator').value;

        // Validaciones básicas
        if (!includeEntityInTabular && !entityId) {
            UIUtils.showAlert('Por favor seleccione una entidad o márquela para inclusión en datos tabulares', 'warning');
            return;
        }

        if (!dataText) {
            UIUtils.showAlert('Por favor ingrese los datos a importar', 'warning');
            return;
        }

        try {
            // Dividir en líneas
            const lines = dataText.split(/\r?\n/).filter(line => line.trim());
            
            if (lines.length < 2) {
                UIUtils.showAlert('Debe ingresar al menos una fila de encabezados y una fila de datos', 'warning');
                return;
            }

            // Obtener separador real
            let sep;
            switch (separator) {
                case 'comma': sep = ','; break;
                case 'semicolon': sep = ';'; break;
                default: sep = '\t'; break;
            }

            // Parsear encabezados y datos
            const headers = lines[0].split(sep).map(h => h.trim());
            const dataRows = lines.slice(1).map(line => {
                const values = line.split(sep).map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                return row;
            });

            // Procesar y validar datos
            this.parsedData = this.processTableData(entityId, dataRows, headers, includeEntityInTabular);
            this.showPreview();

        } catch (error) {
            console.error('Error al parsear datos:', error);
            UIUtils.showAlert('Error al procesar los datos: ' + error.message, 'danger');
        }
    },

    /**
     * Procesa y valida los datos de la tabla
     */
    processTableData(entityId, dataRows, headers, includeEntityInTabular = false) {
        let entity = null;
        let entityFields = [];
        
        if (!includeEntityInTabular) {
            // Modo tradicional: entidad seleccionada previamente
            entity = EntityModel.getById(entityId);
            if (!entity) {
                throw new Error('Entidad no encontrada');
            }
            entityFields = FieldModel.getByIds(entity.fields || []);
        } else {
            // Modo nuevo: entidad incluida en datos tabulares
            // Necesitamos determinar las entidades desde los datos
            const entityHeader = this.findEntityHeaderInData(headers);
            if (!entityHeader) {
                throw new Error('No se encontró columna de entidad en los datos tabulares. Asegúrese de incluir una columna que contenga los nombres de las entidades.');
            }
            
            // Obtener todas las entidades únicas de los datos
            const entityNames = [...new Set(dataRows.map(row => row[entityHeader]).filter(name => name && name.trim()))];
            const entities = EntityModel.getActive();
            
            // Validar que todas las entidades existen
            const validEntities = [];
            const invalidEntities = [];
            
            entityNames.forEach(name => {
                const foundEntity = entities.find(e => e.name === name || e.name.name === name);
                if (foundEntity) {
                    validEntities.push(foundEntity);
                } else {
                    invalidEntities.push(name);
                }
            });
            
            if (invalidEntities.length > 0) {
                throw new Error(`Entidades no encontradas: ${invalidEntities.join(', ')}`);
            }
            
            // Para el procesamiento, usaremos todos los campos de todas las entidades válidas
            const allFieldIds = [...new Set(validEntities.flatMap(e => e.fields || []))];
            entityFields = FieldModel.getByIds(allFieldIds);
        }

        const errors = [];
        const processedData = [];
        
        // Obtener valores de campos pre-tabulares (solo los que NO están marcados para inclusión en tabular)
        const preTabularValues = this.getPreTabularValues();
        
        // Obtener preferencias de inclusión
        const includeDateInTabular = document.getElementById('include-date-in-tabular').checked;
        
        // Validar que los campos pre-tabulares requeridos tengan valores
        const preTabularFields = entityFields.filter(f => f.isPreTabular);
        preTabularFields.forEach(field => {
            // Solo validar si el campo NO está marcado para inclusión en tabular
            const isIncludedInTabular = BulkPreferencesUtils.getCustomFieldInclusion(field.id);
            if (field.required && !isIncludedInTabular && (!preTabularValues[field.id] || preTabularValues[field.id].trim() === '')) {
                errors.push(`El campo pre-tabular requerido "${field.name}" debe tener un valor`);
            }
        });

        dataRows.forEach((row, index) => {
            const rowNum = index + 2; // +2 porque empezamos desde 1 y saltamos header
            const fieldsData = {};
            let hasData = false;
            let rowEntityId = entityId; // Por defecto usar la entidad seleccionada

            // Si la entidad está incluida en tabular, determinar la entidad para esta fila
            if (includeEntityInTabular) {
                const entityHeader = this.findEntityHeaderInData(headers);
                const entityName = row[entityHeader];
                const entities = EntityModel.getActive();
                const rowEntity = entities.find(e => e.name === entityName || e.name.name === entityName);
                
                if (!rowEntity) {
                    errors.push(`Fila ${rowNum}: Entidad "${entityName}" no encontrada`);
                    return;
                }
                rowEntityId = rowEntity.id;
                
                // Actualizar campos para esta entidad específica
                entityFields = FieldModel.getByIds(rowEntity.fields || []);
            }

            // Si la fecha está incluida en tabular, buscarla en los datos
            let rowDate = null;
            if (includeDateInTabular) {
                const dateHeader = this.findDateHeaderInData(headers);
                if (dateHeader && row[dateHeader]) {
                    try {
                        rowDate = new Date(row[dateHeader]);
                        if (isNaN(rowDate.getTime())) {
                            errors.push(`Fila ${rowNum}: Fecha "${row[dateHeader]}" no es válida`);
                            return;
                        }
                    } catch (e) {
                        errors.push(`Fila ${rowNum}: Error al procesar fecha "${row[dateHeader]}"`);
                        return;
                    }
                }
            }

            // Mapear campos de la entidad con los headers
            entityFields.forEach(field => {
                // Buscar header que coincida con el nombre del campo
                const matchingHeader = headers.find(h => 
                    h.toLowerCase() === field.name.toLowerCase() ||
                    h.toLowerCase().includes(field.name.toLowerCase()) ||
                    field.name.toLowerCase().includes(h.toLowerCase())
                );

                if (matchingHeader && row[matchingHeader] !== undefined) {
                    let value = row[matchingHeader].trim();
                    
                    if (value) {
                        hasData = true;
                        
                        // Validar según tipo de campo
                        if (field.type === 'number') {
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) {
                                errors.push(`Fila ${rowNum}: "${value}" no es un número válido para ${field.name}`);
                                return;
                            }
                            value = numValue;
                        } else if (field.type === 'select') {
                            const options = field.options || [];
                            const validOptions = options.filter(opt => (typeof opt === 'object' ? opt.active !== false : true));
                            const optionValues = validOptions.map(opt => typeof opt === 'object' ? opt.value : opt);
                            
                            if (!optionValues.includes(value)) {
                                errors.push(`Fila ${rowNum}: "${value}" no es una opción válida para ${field.name}. Opciones: ${optionValues.join(', ')}`);
                                return;
                            }
                        }
                    } else if (field.required && !field.isPreTabular) {
                        // Solo mostrar error si el campo es requerido pero NO es pre-tabular
                        errors.push(`Fila ${rowNum}: El campo ${field.name} es requerido`);
                        return;
                    }

                    fieldsData[field.id] = value || null;
                } else if (field.required && !field.isPreTabular) {
                    // Solo mostrar error si el campo es requerido pero NO es pre-tabular
                    // Los campos pre-tabulares se llenarán automáticamente con los valores del formulario
                    errors.push(`Fila ${rowNum}: Falta el campo requerido ${field.name}`);
                    return;
                }
            });

            // Solo agregar si tiene al menos un dato
            if (hasData || Object.keys(fieldsData).length > 0) {
                processedData.push({
                    rowNumber: rowNum,
                    data: fieldsData,
                    original: row,
                    entityId: rowEntityId,
                    customDate: rowDate
                });
            }
        });

        return {
            entityId: includeEntityInTabular ? null : entityId, // null si entities son mixtas
            entity: includeEntityInTabular ? null : entity,
            headers,
            processedData,
            errors,
            totalRows: dataRows.length,
            validRows: processedData.length,
            includeEntityInTabular,
            includeDateInTabular
        };
    },

    /**
     * Busca el header que corresponde a la entidad en los datos tabulares
     * @param {Array} headers Lista de headers
     * @returns {string|null} Nombre del header de entidad
     */
    findEntityHeaderInData(headers) {
        const entityKeywords = ['entidad', 'entity', this.entityName.toLowerCase()];
        return headers.find(header => 
            entityKeywords.some(keyword => 
                header.toLowerCase().includes(keyword) || keyword.includes(header.toLowerCase())
            )
        );
    },

    /**
     * Busca el header que corresponde a la fecha en los datos tabulares
     * @param {Array} headers Lista de headers
     * @returns {string|null} Nombre del header de fecha
     */
    findDateHeaderInData(headers) {
        const dateKeywords = ['fecha', 'date', 'timestamp', 'time'];
        return headers.find(header => 
            dateKeywords.some(keyword => 
                header.toLowerCase().includes(keyword) || keyword.includes(header.toLowerCase())
            )
        );
    },

    /**
     * Muestra la vista previa de los datos procesados
     */
    showPreview() {
        if (!this.parsedData) return;

        const { headers, processedData, errors, totalRows, validRows, includeEntityInTabular, includeDateInTabular } = this.parsedData;
        
        // Determinar campos para mostrar
        let entityFields = [];
        if (includeEntityInTabular) {
            // Si hay entidades múltiples, obtener todos los campos únicos
            const allEntityIds = [...new Set(processedData.map(item => item.entityId))];
            const allFieldIds = [...new Set(allEntityIds.flatMap(entityId => {
                const entity = EntityModel.getById(entityId);
                return entity ? entity.fields || [] : [];
            }))];
            entityFields = FieldModel.getByIds(allFieldIds);
        } else {
            // Entidad única
            const entity = this.parsedData.entity;
            entityFields = FieldModel.getByIds(entity.fields || []);
        }

        // Mostrar sección de preview
        document.getElementById('preview-section').style.display = 'block';

        // Actualizar resumen
        const summaryHtml = `
            <div class="row">
                <div class="col-md-3">
                    <div class="text-center">
                        <h5 class="text-primary">${totalRows}</h5>
                        <small>Filas totales</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h5 class="text-success">${validRows}</h5>
                        <small>Filas válidas</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h5 class="text-danger">${errors.length}</h5>
                        <small>Errores</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h5 class="text-info">${entityFields.length}</h5>
                        <small>Campos mapeados</small>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('preview-summary').innerHTML = summaryHtml;

        // Mostrar errores si hay
        const errorsContainer = document.getElementById('preview-errors');
        if (errors.length > 0) {
            errorsContainer.style.display = 'block';
            errorsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-triangle"></i> Errores encontrados:</h6>
                    <ul class="mb-0">
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            errorsContainer.style.display = 'none';
        }

        // Crear tabla de preview
        let headerHtml = '<tr><th>#</th>';
        
        // Agregar columna de entidad si está incluida en tabular
        if (includeEntityInTabular) {
            headerHtml += `<th>${this.entityName}</th>`;
        }
        
        // Agregar columna de fecha si está incluida en tabular
        if (includeDateInTabular) {
            headerHtml += '<th>Fecha</th>';
        }
        
        // Agregar columnas de campos
        headerHtml += entityFields.map(field => `<th>${field.name}</th>`).join('');
        headerHtml += '<th>Estado</th></tr>';
        
        document.getElementById('preview-header').innerHTML = headerHtml;

        const bodyHtml = processedData.map(item => {
            let rowHtml = `<td>${item.rowNumber - 1}</td>`;
            
            // Agregar entidad si está incluida en tabular
            if (includeEntityInTabular) {
                const entity = EntityModel.getById(item.entityId);
                const entityName = entity ? (entity.name.name || entity.name) : 'Desconocida';
                rowHtml += `<td>${entityName}</td>`;
            }
            
            // Agregar fecha si está incluida en tabular
            if (includeDateInTabular) {
                const dateStr = item.customDate ? item.customDate.toLocaleString() : '<span class="text-muted">-</span>';
                rowHtml += `<td>${dateStr}</td>`;
            }
            
            // Agregar campos
            const fieldsHtml = entityFields.map(field => {
                const value = item.data[field.id];
                return `<td>${value !== null && value !== undefined ? value : '<span class="text-muted">-</span>'}</td>`;
            }).join('');
            
            rowHtml += fieldsHtml;
            rowHtml += '<td><span class="badge bg-success">Válido</span></td>';
            
            return `<tr>${rowHtml}</tr>`;
        }).join('');
        
        document.getElementById('preview-body').innerHTML = bodyHtml;

        // Habilitar botón de importar si no hay errores
        document.getElementById('import-data-btn').disabled = errors.length > 0 || validRows === 0;
    },

    /**
     * Importa los datos validados
     */
    importData() {
        if (!this.parsedData || this.parsedData.errors.length > 0) {
            UIUtils.showAlert('No se puede importar datos con errores', 'warning');
            return;
        }

        try {
            const { processedData, includeEntityInTabular, includeDateInTabular } = this.parsedData;
            const defaultDate = document.getElementById('bulk-date-input').value;
            const preTabularValues = this.getPreTabularValues();
            let importedCount = 0;

            processedData.forEach(item => {
                try {
                    // Usar la entidad de la fila si está incluida en tabular, o la seleccionada
                    const recordEntityId = includeEntityInTabular ? item.entityId : this.parsedData.entityId;
                    
                    // Crear copia de los datos del item para añadir valores pre-tabulares
                    const enhancedData = { ...item.data };
                    
                    // Aplicar valores de campos pre-tabulares
                    Object.keys(preTabularValues).forEach(fieldId => {
                        enhancedData[fieldId] = preTabularValues[fieldId];
                    });
                    
                    // Crear el registro con los datos mejorados
                    const newRecord = RecordModel.create(recordEntityId, enhancedData);
                    
                    if (newRecord) {
                        // Determinar qué fecha usar
                        let recordDate = null;
                        
                        if (includeDateInTabular && item.customDate) {
                            // Usar fecha de los datos tabulares
                            recordDate = item.customDate.toISOString();
                        } else if (!includeDateInTabular && defaultDate) {
                            // Usar fecha común especificada
                            recordDate = new Date(defaultDate).toISOString();
                        }
                        
                        if (recordDate) {
                            RecordModel.updateDate(newRecord.id, recordDate);
                        }
                    }
                    
                    importedCount++;
                } catch (error) {
                    console.error('Error al crear registro:', error);
                }
            });

            if (importedCount > 0) {
                // Crear texto informativo sobre los campos pre-tabulares aplicados
                const preTabularText = Object.keys(preTabularValues).length > 0 
                    ? ` con valores comunes aplicados` 
                    : '';
                    
                const entityText = includeEntityInTabular 
                    ? ' para múltiples entidades' 
                    : '';
                    
                const dateText = includeDateInTabular 
                    ? ' con fechas individuales' 
                    : '';
                    
                UIUtils.showAlert(`Se importaron correctamente ${importedCount} registros${entityText}${dateText}${preTabularText}`, 'success');
                this.clearData();
            } else {
                UIUtils.showAlert('No se pudo importar ningún registro', 'danger');
            }

        } catch (error) {
            console.error('Error al importar datos:', error);
            UIUtils.showAlert('Error al importar: ' + error.message, 'danger');
        }
    },

    /**
     * Limpia todos los datos y vuelve al estado inicial
     */
    clearData() {
        document.getElementById('bulk-data-textarea').value = '';
        
        // Limpiar campos pre-tabulares
        const preTabularFields = FieldModel.getPreTabularFields();
        preTabularFields.forEach(field => {
            const fieldId = `bulk-pretab-${field.id}`;
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = '';
                if (element.selectedIndex !== undefined) {
                    element.selectedIndex = 0;
                }
            }
        });
        
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('import-data-btn').disabled = true;
        this.parsedData = null;
    }
};


