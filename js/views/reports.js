/**
 * Vista de reportes para visualizar datos
 */
const ReportsView = {
    // ... (otras propiedades y métodos) ...
    pagination: {
        currentPage: 1,
        itemsPerPage: 20, // O el valor por defecto que prefieras
    },
    sorting: {
        column: 'timestamp', // Columna inicial para ordenar (o null)
        direction: 'desc',   // Dirección inicial ('asc' o 'desc')
    },
    selectedColumns: {
        field1: '', // O '', dependiendo de cómo manejes la ausencia de selección
        field2: '',
        field3: '',
    },
    filteredRecords: null,
    searchedRecords: null,
    entityName: 'Entidad',
    recordName: 'Registro',
    // ---------------------------------

    /**
     * Inicializa la vista de reportes
     */
    init() {
        try {
            // Obtener nombres personalizados desde la configuración
            const config = StorageService.getConfig();
            this.entityName = config.entityName || 'Entidad';
            this.recordName = config.recordName || 'Registro';
            
            // Esperar a que el DOM esté completamente cargado
            setTimeout(() => {
                // Verificar que el contenedor principal existe
                const mainContent = document.querySelector('.main-content');
                if (!mainContent) {
                    console.error("Elemento .main-content no encontrado");
                    return;
                }

                // Reiniciar estado al inicializar (opcional pero recomendado)
                this.pagination = { currentPage: 1, itemsPerPage: 20 }; // Simplificado
                this.sorting = { column: 'timestamp', direction: 'desc' };
                this.selectedColumns = { field1: '', field2: '', field3: '' };
                this.filteredRecords = null;
                this.searchedRecords = null;

                this.render(); // Ahora 'this.selectedColumns' existe
                this.setupEventListeners();

                // Generar automáticamente el reporte al cargar la página
                this.autoGenerateReport();
            }, 100); // Dar tiempo para que el DOM esté listo
        } catch (error) {
            console.error("Error al inicializar vista de reportes:", error);
            UIUtils.showAlert('Error al inicializar la vista de reportes', 'danger');
        }
    },

    /**
     * Genera automáticamente un informe al cargar la página si hay datos disponibles
     */
    autoGenerateReport() {
        // Verificar si hay campos disponibles para generar un reporte
        const sharedNumericFields = FieldModel.getSharedNumericFields();
        if (sharedNumericFields.length === 0) {
            return; // No hay campos para generar reporte
        }

        // Esperar a que el DOM esté completamente cargado
        setTimeout(() => {
            const reportField = document.getElementById('report-field');
            if (!reportField) {
                console.warn("Elemento 'report-field' no encontrado en el DOM");
                return;
            }

            // Obtener campos marcados para reportes comparativos
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            if (compareField) {
                // Si hay un campo marcado para comparar, usarlo
                reportField.value = compareField.id;
            } else {
                // Si no hay campo marcado, usar el primer campo numérico disponible
                reportField.value = sharedNumericFields[0].id;
            }

            // Generar el reporte usando los valores predeterminados o los que están en el formulario
            this.generateReport();
        }, 200); // Dar más tiempo para que el DOM esté listo
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

            const entities = EntityModel.getAll();
            const sharedNumericFields = FieldModel.getSharedNumericFields();
            const sharedFields = FieldModel.getAll();

            // Formatear fechas
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStr = this.formatDateForInput(lastMonth);
            const today = this.formatDateForInput(new Date());

            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';

            const column3Field = FieldModel.getAll().find(field => field.isColumn3);
            const column4Field = FieldModel.getAll().find(field => field.isColumn4);
            const column5Field = FieldModel.getAll().find(field => field.isColumn5);

            // Actualiza SelectedColumns al cargar si hay campos marcados
            this.selectedColumns.field1 = column3Field ? column3Field.id : '';
            this.selectedColumns.field2 = column4Field ? column4Field.id : '';
            this.selectedColumns.field3 = column5Field ? column5Field.id : '';

            const horizontalAxisField = FieldModel.getAll().find(field => field.isHorizontalAxis);
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            // --- HTML Template Reorganizado ---
            const template = `
                <div class="container mt-4">
                    <h2>Reportes y Análisis</h2>

                    <!-- Filtros -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Filtros</h5>
                        </div>
                        <div class="card-body">
                            <form id="filter-form" class="row g-3">
                                <div class="col-md-4">
                                    <label for="filter-entity" class="form-label">${entityName}(es)</label>
                                    <select class="form-select" id="filter-entity" multiple size="4">
                                        <option value="">Todas las ${entityName.toLowerCase()}s</option>
                                        ${entities.map(entity =>
                                            `<option value="${entity.id}">${entity.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="form-text">Mantenga presionado Ctrl (⌘ en Mac) para seleccionar múltiples ${entityName.toLowerCase()}s</div>
                                </div>
                                <div class="col-md-4">
                                    <label for="filter-from-date" class="form-label">Desde</label>
                                    <input type="date" class="form-control" id="filter-from-date" value="${lastMonthStr}">
                                </div>
                                <div class="col-md-4">
                                    <label for="filter-to-date" class="form-label">Hasta</label>
                                    <input type="date" class="form-control" id="filter-to-date" value="${today}">
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">Aplicar Filtros</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Atajos de fecha -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Atajos de fecha</h5>
                        </div>
                        <div class="card-body text-center">
                            <div class="btn-group mb-3" role="group" aria-label="Atajos de fecha">
                                <button type="button" class="btn btn-outline-primary date-shortcut" data-range="yesterday">Ayer</button>
                                <button type="button" class="btn btn-outline-primary date-shortcut" data-range="thisWeek">Esta semana</button>
                                <button type="button" class="btn btn-outline-primary date-shortcut" data-range="lastWeek">Semana pasada</button>
                                <button type="button" class="btn btn-outline-primary date-shortcut" data-range="thisMonth">Mes actual</button>
                                <button type="button" class="btn btn-outline-primary date-shortcut" data-range="lastMonth">Mes pasado</button>
                            </div>

                            <h6 class="mt-3 mb-2">Última semana</h6>
                            <div class="btn-group flex-wrap" role="group" aria-label="Días última semana">
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastMonday">Lunes</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastTuesday">Martes</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastWednesday">Miércoles</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastThursday">Jueves</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastFriday">Viernes</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastSaturday">Sábado</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut" data-range="lastSunday">Domingo</button>
                            </div>
                            
                            ${(() => {
                                // Obtener todos los grupos de entidades
                                const groups = EntityModel.getAllGroups();
                                if (groups.length === 0) return ''; // No mostrar sección si no hay grupos
                                
                                return `
                                    <h6 class="mt-4 mb-2">Filtrar por grupos de ${entityName.toLowerCase()}s</h6>
                                    <div class="btn-group flex-wrap" role="group" aria-label="Grupos de entidades">
                                        ${groups.map(group => 
                                            `<button type="button" class="btn btn-sm btn-outline-info entity-group-filter" data-group="${group}">${group}</button>`
                                        ).join('')}
                                    </div>
                                `;
                            })()}
                        </div>
                    </div>

                    <!-- Reportes Comparativos -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Reportes Comparativos</h5>
                        </div>
                        <div class="card-body">
                            ${sharedNumericFields.length === 0 ? `
                                <div class="alert alert-info">
                                    No hay campos numéricos compartidos entre ${entityName.toLowerCase()}s para generar reportes comparativos.
                                    <hr>
                                    <p class="mb-0">Para generar reportes comparativos, debe crear campos numéricos y asignarlos a múltiples ${entityName.toLowerCase()}s.</p>
                                </div>
                            ` : `
                                <form id="report-form" class="row g-3 mb-4">
                                    <div class="col-md-4">
                                        <label for="report-horizontal-field" class="form-label">Eje Horizontal</label>
                                        <select class="form-select" id="report-horizontal-field">
                                            <option value="">${entityName} Principal</option>
                                            ${sharedFields.map(field =>
                                                `<option value="${field.id}" ${(horizontalAxisField && horizontalAxisField.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="report-field" class="form-label">Campo a Comparar</label>
                                        <select class="form-select" id="report-field" required>
                                            <option value="">Seleccione un campo</option>
                                            ${sharedNumericFields.map(field =>
                                                `<option value="${field.id}" ${(compareField && compareField.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="report-aggregation" class="form-label">Tipo de Agregación</label>
                                        <select class="form-select" id="report-aggregation">
                                            <option value="sum">Suma</option>
                                            <option value="average">Promedio</option>
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-primary">Generar Reporte</button>
                                    </div>
                                </form>

                                <div id="report-container" style="display: none;">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <div class="chart-container">
                                                <canvas id="report-chart"></canvas>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div id="report-summary"></div>
                                        </div>
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Registros -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${this.recordName}s</h5>
                            <div>
                                <button id="export-csv-btn" class="btn btn-outline-light btn-sm me-2">
                                    <i class="bi bi-file-earmark-spreadsheet"></i> Exportar a CSV
                                </button>
                                <span id="records-count" class="badge bg-light text-dark">0 ${this.recordName.toLowerCase()}s</span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <!-- Búsqueda -->
                            <div class="p-3 bg-light border-bottom">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" id="search-records" class="form-control" placeholder="Buscar en registros...">
                                </div>
                            </div>
                            <!-- Selectores de Columna -->
                            <div class="p-3 bg-light border-bottom">
                                <div class="row g-3 align-items-end">
                                    <div class="col-md-4">
                                        <label for="column-selector-1" class="form-label">Columna 3:</label>
                                        <select class="form-select form-select-sm column-selector" id="column-selector-1">
                                            <option value="">Seleccione un campo</option>
                                            ${sharedFields.map(field =>
                                                `<option value="${field.id}" ${(column3Field && column3Field.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="column-selector-2" class="form-label">Columna 4:</label>
                                        <select class="form-select form-select-sm column-selector" id="column-selector-2">
                                            <option value="">Seleccione un campo</option>
                                            ${sharedFields.map(field =>
                                                `<option value="${field.id}" ${(column4Field && column4Field.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="column-selector-3" class="form-label">Columna 5:</label>
                                        <select class="form-select form-select-sm column-selector" id="column-selector-3">
                                            <option value="">Seleccione un campo</option>
                                            ${sharedFields.map(field =>
                                                `<option value="${field.id}" ${(column5Field && column5Field.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <!-- Tabla de Registros -->
                            <div class="table-responsive">
                                <table class="table table-hover mb-0" id="records-table">
                                    <thead class="table-light">
                                        <tr>
                                            <th>
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="select-all-records">
                                                </div>
                                            </th>
                                            <th class="sortable" data-sort="entity">${entityName} <i class="bi"></i></th>
                                            <th class="sortable" data-sort="timestamp">Fecha y Hora <i class="bi"></i></th>
                                            <th class="sortable column-1" data-sort="field1">Columna 3 <i class="bi"></i></th>
                                            <th class="sortable column-2" data-sort="field2">Columna 4 <i class="bi"></i></th>
                                            <th class="sortable column-3" data-sort="field3">Columna 5 <i class="bi"></i></th>
                                            <th></th> <!-- Columna para acciones -->
                                        </tr>
                                    </thead>
                                    <tbody id="records-list">
                                        <!-- Las filas se insertarán aquí -->
                                    </tbody>
                                </table>
                            </div>
                            <!-- Mensaje si no hay registros -->
                            <div id="no-filtered-records" class="text-center py-4" style="display: none;">
                                <p class="text-muted">No hay ${this.recordName.toLowerCase()}s que coincidan con los filtros.</p>
                            </div>
                            <!-- Paginación -->
                            <div class="d-flex justify-content-between align-items-center mt-3 p-2 bg-light border-top">
                                <div class="d-flex align-items-center">
                                    <label class="me-2 mb-0">${this.recordName}s por página:</label>
                                    <select id="items-per-page" class="form-select form-select-sm" style="width: auto;">
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <div class="pagination-container">
                                    <nav aria-label="Navegación de página">
                                        <ul class="pagination pagination-sm mb-0" id="pagination-controls">
                                            <!-- Controles de paginación se insertarán aquí -->
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            mainContent.innerHTML = template;

            // Esperar a que el DOM se actualice
            setTimeout(() => {
                try {
                    this.updateColumnHeaders();
                    this.applyFilters();
                } catch (error) {
                    console.error("Error al actualizar cabeceras o aplicar filtros iniciales:", error);
                }
            }, 0);

        } catch (error) {
            console.error("Error al renderizar vista de reportes:", error);
        }
    },

    // ... (resto de métodos: updateColumnHeaders, setupEventListeners, applyFilters, etc.) ...

    /**
     * Actualiza los encabezados de columna en la tabla según los campos seleccionados
     */
    updateColumnHeaders() {
        // Actualizar encabezados de columna basados en los campos seleccionados
        const column1Header = document.querySelector('th.column-1');
        const column2Header = document.querySelector('th.column-2');
        const column3Header = document.querySelector('th.column-3');

        // Función auxiliar para actualizar un encabezado
        const updateHeader = (headerElement, fieldId) => {
            if (headerElement) {
                const field = fieldId ? FieldModel.getById(fieldId) : null;
                // Usar el nombre del campo o el texto por defecto si no hay campo seleccionado
                const headerText = field ? field.name : headerElement.getAttribute('data-sort').replace('field', 'Columna '); // Ej: Columna 3
                headerElement.innerHTML = `${headerText} <i class="bi"></i>`;
            }
        };

        updateHeader(column1Header, this.selectedColumns.field1);
        updateHeader(column2Header, this.selectedColumns.field2);
        updateHeader(column3Header, this.selectedColumns.field3);
    },


    setupEventListeners() {
        // Esperar a que el DOM esté completamente cargado
        setTimeout(() => {
            // Event listener para "Seleccionar todos"
            const selectAllCheckbox = document.getElementById('select-all-records');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    document.querySelectorAll('.record-checkbox').forEach(checkbox => {
                        checkbox.checked = isChecked;
                    });
                    // Actualizar visibilidad del botón de edición masiva
                    const bulkEditBtn = document.getElementById('bulk-edit-btn');
                    if (bulkEditBtn) {
                        bulkEditBtn.style.display = isChecked ? 'inline-block' : 'none';
                    }
                });
            }

            // Escuchar clics en registros
            const recordsListContainer = document.getElementById('records-list');
            if (recordsListContainer) {
                recordsListContainer.addEventListener('click', (e) => {
                    // Busca si el clic ocurrió dentro de un botón con la clase '.view-record'
                    const viewButton = e.target.closest('.view-record');
                    if (viewButton) {
                        // Si se encontró el botón, obtén el ID y llama a la función
                        const recordId = viewButton.dataset.recordId;
                        this.showRecordDetails(recordId);
                    }
                });
            }

            // Aplicar filtros
            const filterForm = document.getElementById('filter-form');
            if (filterForm) {
                filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.applyFilters();

                    // Si hay un reporte generado, actualizarlo con los nuevos filtros
                    const reportContainer = document.getElementById('report-container');
                    if (reportContainer && reportContainer.style.display === 'block') {
                        this.generateReport();
                    }
                });
            }

            // Generar reporte comparativo
            const reportForm = document.getElementById('report-form');
            if (reportForm) {
                reportForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.generateReport();
                });
            }

            // Exportar a CSV
            const exportCsvBtn = document.getElementById('export-csv-btn');
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', () => {
                    // Código existente para exportar a CSV
                    const entityFilterSelect = document.getElementById('filter-entity');
                    const selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);

                    const entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                        ? []
                        : selectedEntities;

                    const fromDateFilter = document.getElementById('filter-from-date').value;
                    const toDateFilter = document.getElementById('filter-to-date').value;

                    const filters = {
                        entityIds: entityFilter.length > 0 ? entityFilter : undefined,
                        fromDate: fromDateFilter || undefined,
                        toDate: toDateFilter || undefined
                    };

                    const recordsToExport = this.searchedRecords || this.filteredRecords || RecordModel.filterMultiple(filters);
                    let sortedRecords = [...recordsToExport];
                    
                    if (!this.sorting.column || this.sorting.column === 'timestamp') {
                        sortedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    } else {
                        sortedRecords = this.searchedRecords ? [...this.searchedRecords] : sortedRecords;
                    }

                    ExportUtils.exportToCSV(
                        sortedRecords,
                        this.selectedColumns.field1,
                        this.selectedColumns.field2,
                        this.selectedColumns.field3
                    );
                });
            }

            // Buscador en la tabla de registros
            const searchInput = document.getElementById('search-records');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    this.filterRecordsBySearch();
                });
            }

            // Añadir event listener para el selector de registros por página
            const itemsPerPageSelect = document.getElementById('items-per-page');
            if (itemsPerPageSelect) {
                itemsPerPageSelect.value = this.pagination.itemsPerPage; // Asegurar valor inicial
                itemsPerPageSelect.addEventListener('change', () => {
                    this.pagination.itemsPerPage = parseInt(itemsPerPageSelect.value);
                    this.pagination.currentPage = 1; // Volver a la primera página al cambiar
                    this.filterRecordsBySearch(); // Actualizar la visualización
                });
            }

            // Atajos de fecha
            document.querySelectorAll('.date-shortcut').forEach(button => {
                button.addEventListener('click', (e) => {
                    const range = e.target.getAttribute('data-range');
                    this.setDateRange(range);
                    // Aplicar filtros automáticamente
                    document.getElementById('filter-form').dispatchEvent(new Event('submit'));
                });
            });

            // Filtros de grupo de entidades
            document.querySelectorAll('.entity-group-filter').forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.getAttribute('data-group');
                    this.filterByEntityGroup(group);
                    // Aplicar filtros automáticamente
                    document.getElementById('filter-form').dispatchEvent(new Event('submit'));
                });
            });

            // Event listeners para selectores de columnas
            document.querySelectorAll('.column-selector').forEach((select, index) => {
                select.addEventListener('change', () => {
                    const fieldNumber = index + 1; // 1, 2, or 3
                    const columnKey = `field${fieldNumber}`; // field1, field2, field3
                    const newValue = select.value; // ID del campo seleccionado o ""

                    // Actualizar el estado interno
                    this.selectedColumns[columnKey] = newValue;

                    // Actualizar el encabezado de la columna inmediatamente
                    this.updateColumnHeaders();

                    // Actualizar la tabla con los nuevos datos de la columna
                    this.filterRecordsBySearch(); // Esto reordena y repagina si es necesario
                });
            });

            // Event listeners para ordenar las columnas
            document.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.getAttribute('data-sort');

                    // Si ya estamos ordenando por esta columna, invertir dirección
                    if (this.sorting.column === column) {
                        this.sorting.direction = this.sorting.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        // Nueva columna seleccionada, establecer ordenación ascendente por defecto
                        this.sorting.column = column;
                        this.sorting.direction = 'asc';
                    }

                    // Actualizar íconos de ordenación en todas las columnas
                    document.querySelectorAll('th.sortable i.bi').forEach(icon => {
                        icon.className = 'bi'; // Resetear clase
                    });

                    // Actualizar ícono de la columna seleccionada
                    const icon = th.querySelector('i.bi');
                    if (icon) { // Asegurarse que el icono existe
                       icon.className = `bi bi-sort-${this.sorting.direction === 'asc' ? 'up' : 'down'}`;
                    }

                    // Actualizar la tabla
                    this.filterRecordsBySearch(); // Esto ya llama a sortRecords y displayPaginatedRecords
                });
            });
        }, 100); // Dar tiempo para que el DOM esté completamente cargado
    },

    applyFilters() {
        const entityFilterSelect = document.getElementById('filter-entity');
        const selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);
        // Obtener nombre personalizado de la entidad
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
        const entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
            ? []
            : selectedEntities;

        const fromDateFilter = document.getElementById('filter-from-date').value;
        const toDateFilter = document.getElementById('filter-to-date').value;

        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };

        // Obtener registros filtrados
        const filteredRecords = RecordModel.filterMultiple(filters);

        // Actualizar contador (antes de la búsqueda)
        // document.getElementById('records-count').textContent = `${filteredRecords.length} registros`; // Movido a filterRecordsBySearch

        // Guardar los registros filtrados para usarlos en la búsqueda
        this.filteredRecords = filteredRecords;

        // Reiniciar la página actual al aplicar nuevos filtros
        this.pagination.currentPage = 1;

        // Mostrar registros (aplicando también el filtro de búsqueda si existe)
        this.filterRecordsBySearch(); // Llama a sort y display
    },
    filterRecordsBySearch() {
        const searchInput = document.getElementById('search-records');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';


        // Si no hay texto de búsqueda, usar todos los registros filtrados
        let searchedRecords = this.filteredRecords || []; // Asegurarse de que sea un array

        if (searchText && this.filteredRecords) {
            // Filtrar registros que contengan el texto de búsqueda
            searchedRecords = this.filteredRecords.filter(record => {
                // Obtener la entidad
                const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

                // Verificar si el nombre de la entidad coincide
                if (entity.name.toLowerCase().includes(searchText)) return true;

                // Verificar en la fecha
                const formattedDate = UIUtils.formatDate(record.timestamp).toLowerCase();
                if (formattedDate.includes(searchText)) return true;

                // Verificar en los datos del registro (incluyendo campos de columnas seleccionadas)
                const fields = FieldModel.getAll(); // Obtener todos para buscar por nombre

                // Comprobar valores de las columnas seleccionadas
                const col1Value = this.getFieldValue(record, this.selectedColumns.field1, fields);
                const col2Value = this.getFieldValue(record, this.selectedColumns.field2, fields);
                const col3Value = this.getFieldValue(record, this.selectedColumns.field3, fields);

                if (String(col1Value).toLowerCase().includes(searchText)) return true;
                if (String(col2Value).toLowerCase().includes(searchText)) return true;
                if (String(col3Value).toLowerCase().includes(searchText)) return true;


                // Verificar en todos los datos del registro (por si no están en las columnas)
                for (const fieldId in record.data) {
                    // Evitar comprobar de nuevo si ya está en una columna seleccionada
                    if (fieldId === this.selectedColumns.field1 ||
                        fieldId === this.selectedColumns.field2 ||
                        fieldId === this.selectedColumns.field3) {
                        continue;
                    }

                    const field = fields.find(f => f.id === fieldId) || { name: fieldId };
                    const value = String(record.data[fieldId]).toLowerCase();

                    // Verificar si el nombre del campo o su valor coincide
                    if (field.name.toLowerCase().includes(searchText) || value.includes(searchText)) {
                        return true;
                    }
                }

                return false;
            });
        }

        // Guardar los resultados de la búsqueda/filtrado
        this.searchedRecords = searchedRecords;

        // Actualizar contador con el número de registros después de la búsqueda
        const recordsCountSpan = document.getElementById('records-count');
         if (recordsCountSpan) {
            recordsCountSpan.textContent = `${searchedRecords.length} ${this.recordName.toLowerCase()}s`;
         }


        // Ordenar registros según la columna seleccionada y dirección
        const sortedRecords = this.sortRecords(searchedRecords);

        // Actualizar registros con ordenación aplicada
        this.searchedRecords = sortedRecords; // Guardar los ordenados

        // Mostrar registros paginados
        this.displayPaginatedRecords();
    },
    sortRecords(records) {
        if (!records) return []; // Devolver array vacío si no hay registros

        const { column, direction } = this.sorting;
        const multiplier = direction === 'asc' ? 1 : -1;

        // Obtener todos los campos una vez para optimizar
        const allFields = FieldModel.getAll();

        return [...records].sort((a, b) => {
            let valueA, valueB;

            switch (column) {
                case 'entity':
                    // Ordenar por nombre de entidad
                    const entityA = EntityModel.getById(a.entityId) || { name: '' };
                    const entityB = EntityModel.getById(b.entityId) || { name: '' };
                    valueA = entityA.name.toLowerCase();
                    valueB = entityB.name.toLowerCase();
                    break;

                case 'timestamp':
                    // Ordenar por fecha
                    valueA = new Date(a.timestamp).getTime();
                    valueB = new Date(b.timestamp).getTime();
                    break;

                case 'field1':
                case 'field2':
                case 'field3':
                    // Ordenar por campos personalizados de las columnas
                    const fieldId = this.selectedColumns[column]; // column es 'field1', 'field2', o 'field3'

                    // Obtener valores usando la función auxiliar, pasando allFields
                    valueA = this.getFieldValue(a, fieldId, allFields);
                    valueB = this.getFieldValue(b, fieldId, allFields);

                    // Si no hay campo seleccionado o el valor es vacío/nulo, tratar como string vacío para consistencia
                    valueA = valueA === null || valueA === undefined ? '' : valueA;
                    valueB = valueB === null || valueB === undefined ? '' : valueB;


                    // Intentar comparación numérica si ambos son números válidos
                    const numA = Number(valueA);
                    const numB = Number(valueB);

                    if (!isNaN(numA) && !isNaN(numB) && String(valueA).trim() !== '' && String(valueB).trim() !== '') {
                        valueA = numA;
                        valueB = numB;
                    } else {
                        // Comparación como strings (ignorando mayúsculas/minúsculas)
                        valueA = String(valueA).toLowerCase();
                        valueB = String(valueB).toLowerCase();
                    }
                    break;

                default:
                     // Por defecto, si no hay columna de ordenación, usar fecha descendente
                     valueA = new Date(a.timestamp).getTime();
                     valueB = new Date(b.timestamp).getTime();
                     // No necesitamos multiplier aquí, la comparación directa lo hará descendente
                     // return valueB - valueA; // Directamente descendente
                     // O mantener la lógica del multiplier:
                     if (valueA < valueB) return 1; // b viene antes que a (desc)
                     if (valueA > valueB) return -1; // a viene antes que b (desc)
                     return 0;
            }

            // Comparar valores (aplicando multiplier)
            if (valueA < valueB) return -1 * multiplier;
            if (valueA > valueB) return 1 * multiplier;
            return 0;
        });
    },
    displayPaginatedRecords() {
        const { currentPage, itemsPerPage } = this.pagination;
        const records = this.searchedRecords || []; // Usar los registros buscados/ordenados
        const totalRecords = records.length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        // Validar currentPage
        if (currentPage > totalPages && totalPages > 0) {
            this.pagination.currentPage = totalPages; // Ir a la última página si la actual es inválida
        } else if (currentPage < 1) {
            this.pagination.currentPage = 1; // Asegurar que sea al menos 1
        }


        // Calcular índices de registros a mostrar (usando el currentPage potencialmente corregido)
        const startIndex = (this.pagination.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
        const recordsToShow = records.slice(startIndex, endIndex);

        // Mostrar registros paginados
        this.displayFilteredRecords(recordsToShow);

        // Actualizar controles de paginación
        this.updatePaginationControls(totalPages);
    },
    updatePaginationControls(totalPages) {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;

        const { currentPage } = this.pagination;

        // Limpiar controles existentes
        paginationControls.innerHTML = '';

        // No mostrar paginación si hay una sola página o ninguna
        if (totalPages <= 1) return;

        // --- Lógica de paginación mejorada ---
        const maxPagesToShow = 5; // Máximo de botones numéricos a mostrar
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            // Mostrar todas las páginas si son pocas
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calcular páginas a mostrar alrededor de la actual
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrent) {
                // Cerca del inicio
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                // Cerca del final
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                // En el medio
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        // Función auxiliar para crear un item de paginación
        const createPageItem = (page, text = page, isDisabled = false, isActive = false, isEllipsis = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.innerHTML = text;
            if (isEllipsis) {
                 a.setAttribute('aria-disabled', 'true');
            } else if (!isDisabled && !isActive) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.goToPage(page);
                });
            }
             if (isActive) {
                 a.setAttribute('aria-current', 'page');
             }
            li.appendChild(a);
            return li;
        };

        // Botón Anterior
        paginationControls.appendChild(createPageItem(currentPage - 1, '<span aria-hidden="true">&laquo;</span>', currentPage === 1));


        // Primera página y elipsis si es necesario
        if (startPage > 1) {
            paginationControls.appendChild(createPageItem(1));
            if (startPage > 2) {
                paginationControls.appendChild(createPageItem(0, '...', true, false, true)); // Ellipsis
            }
        }

        // Páginas numeradas
        for (let i = startPage; i <= endPage; i++) {
            paginationControls.appendChild(createPageItem(i, i, false, i === currentPage));
        }

        // Elipsis y última página si es necesario
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                 paginationControls.appendChild(createPageItem(0, '...', true, false, true)); // Ellipsis
            }
            paginationControls.appendChild(createPageItem(totalPages));
        }

        // Botón Siguiente
        paginationControls.appendChild(createPageItem(currentPage + 1, '<span aria-hidden="true">&raquo;</span>', currentPage === totalPages));

    },
    goToPage(pageNumber) {
        const { itemsPerPage } = this.pagination;
        const totalRecords = (this.searchedRecords || []).length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        // Validar número de página
        if (pageNumber < 1 || pageNumber > totalPages) {
            return; // No hacer nada si la página es inválida
        }

        this.pagination.currentPage = pageNumber;
        this.displayPaginatedRecords();

        // Desplazar al inicio de la tabla (opcional, pero útil)
        const tableElement = document.getElementById('records-table');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    displayFilteredRecords(records) {
        const recordsList = document.getElementById('records-list');
        const noFilteredRecordsDiv = document.getElementById('no-filtered-records');
        const recordsTable = document.getElementById('records-table');
        const paginationControls = document.getElementById('pagination-controls')?.closest('.d-flex');
        const itemsPerPageSelector = document.getElementById('items-per-page')?.closest('.d-flex');

        if (!recordsList || !noFilteredRecordsDiv || !recordsTable) {
            console.error("Elementos de la tabla no encontrados en el DOM.");
            return;
        }

        // Resetear el checkbox "Seleccionar todos"
        const selectAllCheckbox = document.getElementById('select-all-records');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

        // Añadir botón de edición masiva si no existe
        const bulkEditBtn = document.getElementById('bulk-edit-btn');
        if (!bulkEditBtn) {
            const newBulkEditBtn = document.createElement('button');
            newBulkEditBtn.id = 'bulk-edit-btn';
            newBulkEditBtn.className = 'btn btn-warning btn-sm ms-2';
            newBulkEditBtn.innerHTML = '<i class="bi bi-clock"></i> Editar Fechas Seleccionadas';
            newBulkEditBtn.style.display = 'none';
            newBulkEditBtn.addEventListener('click', () => this.showBulkEditModal());
            
            // Buscar el contenedor correcto para el botón
            const headerDiv = document.querySelector('.card-header.bg-primary.text-white.d-flex');
            if (headerDiv && headerDiv.querySelector('div')) {
                headerDiv.querySelector('div').appendChild(newBulkEditBtn);
            }
        } else {
            // Si ya existe el botón, solo ocultar
            bulkEditBtn.style.display = 'none';
        }

        // Mostrar/ocultar elementos según si hay registros
        const hasRecords = records.length > 0;
        noFilteredRecordsDiv.style.display = hasRecords ? 'none' : 'block';
        recordsTable.style.display = hasRecords ? 'table' : 'none';
        
        // Verificar que los elementos existan antes de modificar su visibilidad
        if (paginationControls) {
            paginationControls.style.visibility = hasRecords ? 'visible' : 'hidden';
        }
        if (itemsPerPageSelector) {
            itemsPerPageSelector.style.visibility = hasRecords ? 'visible' : 'hidden';
        }

        // Limpiar lista
        recordsList.innerHTML = '';

        // Si no hay registros, salir
        if (!hasRecords) return;

        // Obtener todos los campos una vez para optimizar
        const allFields = FieldModel.getAll();

        // Renderizar cada registro
        records.forEach(record => {
            const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

            const fieldColumns = {
                field1: this.getFieldValue(record, this.selectedColumns.field1, allFields),
                field2: this.getFieldValue(record, this.selectedColumns.field2, allFields),
                field3: this.getFieldValue(record, this.selectedColumns.field3, allFields)
            };

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="form-check">
                        <input class="form-check-input record-checkbox" type="checkbox" value="${record.id}" id="record-${record.id}">
                    </div>
                </td>
                <td>${entity.name}</td>
                <td>${UIUtils.formatDate(record.timestamp)}</td>
                <td>${fieldColumns.field1}</td>
                <td>${fieldColumns.field2}</td>
                <td>${fieldColumns.field3}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-record" data-record-id="${record.id}" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;

            recordsList.appendChild(row);
        });

        // Añadir event listeners para los checkboxes
        document.querySelectorAll('.record-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.record-checkbox:checked').length;
                const bulkEditBtn = document.getElementById('bulk-edit-btn');
                if (bulkEditBtn) {
                    bulkEditBtn.style.display = selectedCount > 0 ? 'inline-block' : 'none';
                }
            });
        });

        // Disparar evento personalizado para actualizar el índice
        document.dispatchEvent(new CustomEvent('records-loaded', { detail: { count: records.length } }));
        
        // Si no hay registros, mostrar mensaje
        if (records.length === 0) {
            noFilteredRecordsDiv.style.display = 'block';
            recordsTable.style.display = 'none';
            
            // Ocultar paginación y selector de registros por página
            if (paginationControls) paginationControls.style.visibility = 'hidden';
            if (itemsPerPageSelector) itemsPerPageSelector.style.visibility = 'hidden';
            return;
        }
    },
    getFieldValue(record, fieldId, fields) {
        // Si no hay fieldId, o no hay datos, o el campo específico no existe en los datos, devolver vacío
        if (!fieldId || !record.data || record.data[fieldId] === undefined || record.data[fieldId] === null) {
            return ''; // Devolver string vacío para consistencia
        }

        // No necesitamos buscar el 'field' aquí si solo queremos el valor.
        // La formateo específico (si es necesario) se puede hacer en otro lugar o añadir aquí si se requiere.
        // Por ejemplo, si quisiéramos formatear números o fechas de forma especial.

        // Devolver el valor directamente
        return record.data[fieldId];
    },
    showRecordDetails(recordId) {
        const record = RecordModel.getById(recordId);
        if (!record) return;

        const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };
        const fields = FieldModel.getByIds(Object.keys(record.data)); // Campos usados en este registro
        const allFields = FieldModel.getAll(); // Todos los campos para el selector de tipo
        // Obtener nombre personalizado de la entidad
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';

        // Usar UIUtils para obtener o crear el modal
        const modalElement = document.getElementById('viewRecordModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement); // Usar getOrCreateInstance

        const recordDetails = document.getElementById('record-details');
        const modalTitle = modalElement.querySelector('.modal-title');
        modalTitle.textContent = `Detalles del ${this.recordName} - ${entity.name}`; // Título más específico

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
                            // Ordenar campos alfabéticamente por nombre
                            const fieldA = fields.find(f => f.id === fieldIdA) || { name: fieldIdA };
                            const fieldB = fields.find(f => f.id === fieldIdB) || { name: fieldIdB };
                            return fieldA.name.localeCompare(fieldB.name);
                        }).map(([fieldId, value]) => {
                            const field = fields.find(f => f.id === fieldId) || { name: fieldId, type: 'text' }; // Default a text si no se encuentra
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
        this.setupModalFooter(recordId, modal, record);


        modal.show();
    },
    /**
     * Configura los botones y listeners del footer del modal de detalles/edición.
     */
    setupModalFooter(recordId, modalInstance, record) {
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
    },

    /**
     * Cambia entre el modo de visualización y edición en el modal.
     */
    toggleEditMode(recordId, modalInstance, record) {
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
    },

    /**
     * Genera el HTML para un input de edición.
     */
    generateInputHTMLFallback(fieldId, fieldType, currentValue, fieldDefinition) {
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
    },

    /**
     * Restaura el modal al modo de visualización.
     */
    resetEditMode(modalInstance, recordId = null) {
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
    },

    // ... (resto de métodos: confirmDeleteRecord, saveRecordChanges, etc.) ...
    /**
     * Muestra confirmación antes de eliminar un registro.
     */
    confirmDeleteRecord(recordId, viewModalInstance) {
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
    },
    saveRecordChanges(recordId, modal) {
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
    },
    removeModalBackdrop() {
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
    },
    generateReport() {
        const fieldId = document.getElementById('report-field')?.value;
        const horizontalFieldId = document.getElementById('report-horizontal-field')?.value;
        const aggregation = document.getElementById('report-aggregation')?.value;
        const reportForm = document.getElementById('report-form'); // Para mostrar alertas cerca

        if (!fieldId) {
            UIUtils.showAlert('Seleccione un campo para generar el reporte', 'warning', reportForm);
            return;
        }

        // Obtener filtros actuales
        const entityFilterSelect = document.getElementById('filter-entity');
        
        // Verificar si el selector de entidad existe antes de acceder a sus propiedades
        let entityFilter = [];
        if (entityFilterSelect) {
            const selectedEntities = Array.from(entityFilterSelect.selectedOptions || [])
                .map(option => option.value);

            // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
            entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                ? []
                : selectedEntities;
        }

        const fromDateFilter = document.getElementById('filter-from-date')?.value;
        const toDateFilter = document.getElementById('filter-to-date')?.value;

        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };

        // Generar datos del reporte
        const reportData = RecordModel.generateReportMultiple(fieldId, aggregation, filters, horizontalFieldId);

        if (reportData.error) {
            UIUtils.showAlert(reportData.error, 'danger', reportForm);
             // Ocultar contenedor del reporte si hubo error
             const reportContainer = document.getElementById('report-container');
             if (reportContainer) reportContainer.style.display = 'none';
            return;
        }

        // Mostrar contenedor del reporte
        const reportContainer = document.getElementById('report-container');
        if (!reportContainer) return; // Salir si no existe el contenedor
        reportContainer.style.display = 'block';

        // Crear gráfico (asegurándose de que ChartUtils y el canvas existen)
        const chartCanvas = document.getElementById('report-chart');
        if (ChartUtils && chartCanvas) {
             ChartUtils.createBarChart('report-chart', reportData);
        } else {
            console.error("ChartUtils o el canvas 'report-chart' no están disponibles.");
        }


        // Crear tabla resumen
        const reportSummaryDiv = document.getElementById('report-summary');
        if (reportSummaryDiv && ChartUtils) {
            reportSummaryDiv.innerHTML = `
                <h6 class="mb-3">Resumen del Reporte</h6>
                ${ChartUtils.createSummaryTable(reportData)}
            `;
        } else {
             console.error("El div 'report-summary' o ChartUtils no están disponibles.");
        }

        // Desplazar a la vista del reporte (opcional)
        reportContainer.scrollIntoView({ behavior: 'smooth' });
    },
    setDateRange(range) {
        // ... (código de setDateRange sin cambios, ya estaba correcto) ...
        const fromDateInput = document.getElementById('filter-from-date');
        const toDateInput = document.getElementById('filter-to-date');

        if (!fromDateInput || !toDateInput) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate, toDate;

        switch (range) {
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                toDate = new Date(fromDate);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                const firstDayOfWeek = 1; // Lunes
                const dayOfWeek = today.getDay() || 7; // 1=Lunes..7=Domingo
                fromDate.setDate(today.getDate() - (dayOfWeek - firstDayOfWeek));
                toDate = new Date(today);
                break;
            case 'lastWeek':
                 fromDate = new Date(today);
                 const firstDayOfPrevWeek = 1; // Lunes
                 const currentDayOfWeekForLast = today.getDay() || 7; // 1=Lunes..7=Domingo
                 fromDate.setDate(today.getDate() - (currentDayOfWeekForLast - firstDayOfPrevWeek) - 7);
                 toDate = new Date(fromDate);
                 toDate.setDate(fromDate.getDate() + 6); // Domingo de la semana pasada
                break;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
                case 'lastMonday':
                    case 'lastTuesday':
                    case 'lastWednesday':
                    case 'lastThursday':
                    case 'lastFriday':
                    case 'lastSaturday':
                    case 'lastSunday':
                        fromDate = new Date(today); // Empezamos desde hoy
                        const dayMap = {
                            'lastSunday': 0, 'lastMonday': 1, 'lastTuesday': 2, 'lastWednesday': 3,
                            'lastThursday': 4, 'lastFriday': 5, 'lastSaturday': 6
                        };
                        const targetDay = dayMap[range]; // El día de la semana que buscamos (0-6)
                        const currentDay = today.getDay(); // El día de la semana actual (0-6)
        
                        // Calcula cuántos días hay que retroceder para llegar al 'targetDay' de la semana pasada SIEMPRE
                        const daysToSubtract = 7 + (currentDay - targetDay);
        
                        fromDate.setDate(today.getDate() - daysToSubtract);
                        toDate = new Date(fromDate); // El día seleccionado es tanto el inicio como el fin del rango
                        break;
        
            default:
                console.warn(`Rango de fecha desconocido: ${range}`);
                return;
        }

        fromDateInput.value = this.formatDateForInput(fromDate);
        toDateInput.value = this.formatDateForInput(toDate);
    },

    formatDateForInput(date) {
        // ... (código de formatDateForInput sin cambios) ...
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        try {
            // Recargar la tabla de registros sin perder los filtros actuales
            this.generateReport();
        } catch (error) {
            console.error("Error al actualizar la vista de reportes:", error);
        }
    },

    /**
     * Muestra el modal para editar fechas de registros seleccionados
     */
    showBulkEditModal() {
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
    },

    /**
     * Guarda los cambios de edición masiva de fechas
     */
    saveBulkEdit() {
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
    },

    /**
     * Filtra las entidades por grupo
     * @param {string} groupName Nombre del grupo a filtrar
     */
    filterByEntityGroup(groupName) {
        if (!groupName) return;
        
        // Obtener el selector de entidades
        const entityFilterSelect = document.getElementById('filter-entity');
        if (!entityFilterSelect) return;
        
        // Obtener las entidades del grupo especificado
        const entitiesInGroup = EntityModel.getByGroup(groupName);
        if (entitiesInGroup.length === 0) return;
        
        // Deseleccionar todas las opciones primero
        Array.from(entityFilterSelect.options).forEach(option => {
            option.selected = false;
        });
        
        // Seleccionar solo las entidades del grupo
        entitiesInGroup.forEach(entity => {
            const option = Array.from(entityFilterSelect.options).find(opt => opt.value === entity.id);
            if (option) option.selected = true;
        });
    },
}; // Fin del objeto ReportsView
