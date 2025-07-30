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
        const entityOptions = entities.map(ent => `<option value="${ent.id}">${ent.name}</option>`).join('');

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
                                    <div class="col-md-4">
                                        <label for="bulk-entity-select" class="form-label">
                                            <i class="bi bi-building"></i> ${this.entityName} *
                                        </label>
                                        <select class="form-select" id="bulk-entity-select" required>
                                            <option value="">Seleccione una ${this.entityName.toLowerCase()}</option>
                                            ${entityOptions}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="bulk-date-input" class="form-label">
                                            <i class="bi bi-calendar"></i> Fecha y Hora (común)
                                        </label>
                                        <input type="datetime-local" class="form-control" id="bulk-date-input">
                                        <small class="text-muted">Se aplicará a todos los registros si no especifica fechas en los datos</small>
                                    </div>
                                    <div class="col-md-4">
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
    },

    /**
     * Parsea los datos ingresados en el textarea
     */
    parseData() {
        const entityId = document.getElementById('bulk-entity-select').value;
        const dataText = document.getElementById('bulk-data-textarea').value.trim();
        const separator = document.getElementById('bulk-separator').value;

        // Validaciones básicas
        if (!entityId) {
            UIUtils.showAlert('Por favor seleccione una entidad', 'warning');
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
            this.parsedData = this.processTableData(entityId, dataRows, headers);
            this.showPreview();

        } catch (error) {
            console.error('Error al parsear datos:', error);
            UIUtils.showAlert('Error al procesar los datos: ' + error.message, 'danger');
        }
    },

    /**
     * Procesa y valida los datos de la tabla
     */
    processTableData(entityId, dataRows, headers) {
        const entity = EntityModel.getById(entityId);
        if (!entity) {
            throw new Error('Entidad no encontrada');
        }

        const entityFields = FieldModel.getByIds(entity.fields || []);
        const errors = [];
        const processedData = [];

        dataRows.forEach((row, index) => {
            const rowNum = index + 2; // +2 porque empezamos desde 1 y saltamos header
            const fieldsData = {};
            let hasData = false;

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
                    } else if (field.required) {
                        errors.push(`Fila ${rowNum}: El campo ${field.name} es requerido`);
                        return;
                    }

                    fieldsData[field.id] = value || null;
                } else if (field.required) {
                    errors.push(`Fila ${rowNum}: Falta el campo requerido ${field.name}`);
                    return;
                }
            });

            // Solo agregar si tiene al menos un dato
            if (hasData || Object.keys(fieldsData).length > 0) {
                processedData.push({
                    rowNumber: rowNum,
                    data: fieldsData,
                    original: row
                });
            }
        });

        return {
            entityId,
            entity,
            headers,
            processedData,
            errors,
            totalRows: dataRows.length,
            validRows: processedData.length
        };
    },

    /**
     * Muestra la vista previa de los datos procesados
     */
    showPreview() {
        if (!this.parsedData) return;

        const { entity, headers, processedData, errors, totalRows, validRows } = this.parsedData;
        const entityFields = FieldModel.getByIds(entity.fields || []);

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
        const headerHtml = `
            <tr>
                <th>#</th>
                ${entityFields.map(field => `<th>${field.name}</th>`).join('')}
                <th>Estado</th>
            </tr>
        `;
        document.getElementById('preview-header').innerHTML = headerHtml;

        const bodyHtml = processedData.map(item => {
            const fieldsHtml = entityFields.map(field => {
                const value = item.data[field.id];
                return `<td>${value !== null && value !== undefined ? value : '<span class="text-muted">-</span>'}</td>`;
            }).join('');
            
            return `
                <tr>
                    <td>${item.rowNumber - 1}</td>
                    ${fieldsHtml}
                    <td><span class="badge bg-success">Válido</span></td>
                </tr>
            `;
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
            const { entityId, processedData } = this.parsedData;
            const defaultDate = document.getElementById('bulk-date-input').value;
            let importedCount = 0;

            processedData.forEach(item => {
                try {
                    // Crear el registro
                    const newRecord = RecordModel.create(entityId, item.data);
                    
                    if (newRecord && defaultDate) {
                        // Actualizar fecha si se especificó
                        RecordModel.updateDate(newRecord.id, new Date(defaultDate).toISOString());
                    }
                    
                    importedCount++;
                } catch (error) {
                    console.error('Error al crear registro:', error);
                }
            });

            if (importedCount > 0) {
                UIUtils.showAlert(`Se importaron correctamente ${importedCount} registros`, 'success');
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
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('import-data-btn').disabled = true;
        this.parsedData = null;
    }
};


