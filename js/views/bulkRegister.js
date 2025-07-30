// Nueva vista para carga masiva de registros en formato tipo Excel
const BulkRegisterView = {
    entityName: 'Entidad',
    recordName: 'Registro',
    allFields: [],

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
     * Renderiza la tabla y los controles iniciales
     */
    render() {
        const container = Router.getActiveViewContainer() || document.querySelector('.main-content');
        if (!container) return;

        const fieldHeaders = this.allFields.map(f => `<th data-field-id="${f.id}">${f.name}</th>`).join('');

        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5>Carga masiva de ${this.recordName.toLowerCase()}s</h5>
                    <div>
                        <button id="add-bulk-row" class="btn btn-sm btn-outline-primary me-2">Añadir fila</button>
                        <button id="save-bulk-rows" class="btn btn-sm btn-primary">Guardar todo</button>
                    </div>
                </div>
                <div class="card-body table-responsive">
                    <table class="table table-bordered" id="bulk-table">
                        <thead>
                            <tr>
                                <th>${this.entityName}</th>
                                <th>Fecha</th>
                                ${fieldHeaders}
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="bulk-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Crear primera fila por defecto
        this.addRow();
    },

    /**
     * Configura los event listeners básicos
     */
    setupEventListeners() {
        document.getElementById('add-bulk-row').addEventListener('click', () => this.addRow());
        document.getElementById('save-bulk-rows').addEventListener('click', () => this.saveAll());
    },

    /**
     * Genera HTML de input para un campo específico (sin etiquetas)
     * @param {Object} field Definición del campo
     * @returns {string} HTML del input
     */
    getFieldInput(field) {
        const required = field.required ? 'required' : '';
        switch (field.type) {
            case 'number':
                return `<input type="number" class="form-control" name="${field.id}" step="any" ${required}>`;
            case 'select':
                const options = (field.options || [])
                    .filter(opt => (typeof opt === 'object' ? opt.active !== false : true))
                    .map(opt => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        return `<option value="${val}">${val}</option>`;
                    }).join('');
                return `<select class="form-select" name="${field.id}" ${required}>
                            <option value=""></option>
                            ${options}
                        </select>`;
            default:
                return `<input type="text" class="form-control" name="${field.id}" ${required}>`;
        }
    },

    /**
     * Añade una nueva fila a la tabla
     */
    addRow() {
        const tbody = document.getElementById('bulk-tbody');
        if (!tbody) return;

        const entities = EntityModel.getActive();
        const entityOptions = ['<option value=""></option>']
            .concat(entities.map(ent => `<option value="${ent.id}">${ent.name}</option>`))
            .join('');

        const fieldCells = this.allFields.map(f => `<td data-field-id="${f.id}">${this.getFieldInput(f)}</td>`).join('');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><select class="form-select entity-select">${entityOptions}</select></td>
            <td><input type="datetime-local" class="form-control date-input"></td>
            ${fieldCells}
            <td><button type="button" class="btn btn-sm btn-danger remove-row">&times;</button></td>
        `;

        tbody.appendChild(row);

        // Configurar listeners específicos de la fila
        row.querySelector('.entity-select').addEventListener('change', () => this.updateRowFields(row));
        row.querySelector('.remove-row').addEventListener('click', () => row.remove());
    },

    /**
     * Habilita o deshabilita los campos de la fila según la entidad seleccionada
     * @param {HTMLTableRowElement} row Fila a actualizar
     */
    updateRowFields(row) {
        const entityId = row.querySelector('.entity-select').value;
        const entity = EntityModel.getById(entityId);
        const activeFieldIds = entity ? (entity.fields || []) : [];

        row.querySelectorAll('[data-field-id]').forEach(cell => {
            const fieldId = cell.getAttribute('data-field-id');
            const input = cell.querySelector('input, select');
            if (activeFieldIds.includes(fieldId)) {
                input.disabled = false;
            } else {
                input.disabled = true;
                input.value = '';
            }
        });
    },

    /**
     * Valida y guarda todas las filas
     */
    saveAll() {
        const tbody = document.getElementById('bulk-tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        let savedCount = 0;
        for (const row of rows) {
            const entityId = row.querySelector('.entity-select').value;
            if (!entityId) {
                row.classList.add('table-danger');
                continue;
            }
            const entity = EntityModel.getById(entityId);
            const fieldIds = entity.fields || [];
            const fields = FieldModel.getActiveByIds(fieldIds);

            let isValid = true;
            const data = {};
            for (const field of fields) {
                const input = row.querySelector(`[data-field-id="${field.id}"] input, [data-field-id="${field.id}"] select`);
                if (!input) continue;
                let value = input.value.trim();
                if (field.type === 'number') {
                    if (value === '') {
                        value = null;
                    } else {
                        value = parseFloat(value);
                        if (isNaN(value)) {
                            isValid = false;
                            break;
                        }
                    }
                }
                if (field.required && (value === '' || value === null)) {
                    isValid = false;
                    break;
                }
                data[field.id] = value;
            }

            if (!isValid) {
                row.classList.add('table-danger');
                continue;
            }

            const record = RecordModel.create(entityId, data);
            const dateVal = row.querySelector('.date-input').value;
            if (dateVal) {
                RecordModel.updateDate(record.id, new Date(dateVal).toISOString());
            }
            row.remove();
            savedCount++;
        }

        if (savedCount > 0) {
            UIUtils.showAlert(`Se guardaron ${savedCount} ${this.recordName.toLowerCase()}s`, 'success');
            this.addRow();
        } else {
            UIUtils.showAlert('No se guardó ningún registro. Verifique los datos resaltados en rojo.', 'warning');
        }
    }
};


