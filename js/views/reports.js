/**
 * ReportsView: Main controller for the reports section.
 * Responsibilities:
 * - Managing the overall state (pagination, sorting, selections, filters).
 * - Rendering the main layout (filters, report config, placeholders for table/chart).
 * - Coordinating interactions between different report components.
 * - Delegating specific tasks to specialized modules (Events, Table, Chart, Utils, Modal).
 */
const ReportsView = {
    // --- State Properties ---
    selectedRecordIds: new Set(),                     // Set of IDs for selected table rows
    pagination: { currentPage: 1, itemsPerPage: 20 }, // Table pagination state
    sorting: { column: 'timestamp', direction: 'desc' }, // Table sorting state
    selectedColumns: { field1: null, field2: null, field3: null }, // IDs of fields selected for dynamic columns 3, 4, 5
    filterSettings: {                                // Current filter values
        entities: [],
        fromDate: null,
        toDate: null,
        searchTerm: ''
    },
    filteredRecords: [],                              // Records after date/entity filters (before search)
    displayRecords: [],                               // Records currently displayed in the table (after search and sort)
    currentChart: null,                               // Reference to the active Chart.js instance

    /**
     * Initializes the Reports view.
     * Sets up initial state, renders the main structure, attaches event listeners,
     * and triggers the initial data load/report generation.
     */
    init() {
        console.log("Initializing ReportsView...");
        try {
            // Basic dependency check (expand as needed)
            if (typeof Router === 'undefined' || typeof RecordModel === 'undefined' || typeof FieldModel === 'undefined' || typeof ReportsEvents === 'undefined' || typeof ReportsTable === 'undefined' || typeof ReportsChart === 'undefined' || typeof ReportsUtils === 'undefined' || typeof UIUtils === 'undefined') {
                throw new Error("One or more required modules are missing.");
            }

            // Reset state to defaults
            this.selectedRecordIds = new Set();
            this.pagination = { currentPage: 1, itemsPerPage: 20 };
            this.sorting = { column: 'timestamp', direction: 'desc' };
            this.selectedColumns = { field1: null, field2: null, field3: null };
            this.filterSettings = { entities: [], fromDate: null, toDate: null, searchTerm: '' };
            this.filteredRecords = [];
            this.displayRecords = [];
            if (this.currentChart) {
                this.currentChart.destroy();
                this.currentChart = null;
            }

            // Fetch initial settings (like pre-selected columns, default dates)
            this._loadInitialConfiguration();

            // Render the main HTML structure
            this.render(); // Render needs initial config like selectedColumns

            // Setup event listeners for the entire reports view
            ReportsEvents.setupEventListeners(this);

            // Trigger initial data load and display based on default filters
            this.applyFiltersAndDisplayData();

            console.log("ReportsView initialized successfully.");

        } catch (error) {
            console.error("Error initializing ReportsView:", error);
            const mainContent = Router.getActiveViewContainer ? Router.getActiveViewContainer() : document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `<div class="alert alert-danger">Error fatal al inicializar la vista de reportes: ${error.message}. Verifique la consola e inténtelo de nuevo.</div>`;
            }
            if (typeof UIUtils !== 'undefined' && typeof UIUtils.showAlert === 'function') {
                UIUtils.showAlert('Error grave al iniciar Reportes. Consulte la consola.', 'danger', 5000);
            }
        }
    },

    /**
     * Loads initial configuration like default dates and pre-selected columns.
     * @private
     */
    _loadInitialConfiguration() {
        // Load default dates
        const { lastMonth, today } = ReportsUtils.getDefaultDates();
        this.filterSettings.fromDate = lastMonth;
        this.filterSettings.toDate = today;

        // Load pre-configured column selections
        const fields = FieldModel.getAll();
        this.selectedColumns.field1 = fields.find(f => f.isColumn3)?.id || null;
        this.selectedColumns.field2 = fields.find(f => f.isColumn4)?.id || null;
        this.selectedColumns.field3 = fields.find(f => f.isColumn5)?.id || null;
        console.log("Initial configuration loaded:", this.filterSettings, this.selectedColumns);
    },


    /**
     * Renders the main HTML structure of the reports view.
     * Delegates table header updates to ReportsTable.
     */
    render() {
        console.log("Rendering ReportsView structure...");
        try {
            const mainContent = Router.getActiveViewContainer();
            if (!mainContent) {
                throw new Error("Router did not provide an active view container.");
            }

            const entities = EntityModel.getAll();
            const sharedNumericFields = FieldModel.getSharedNumericFields();
            const allFields = FieldModel.getAll();
            const config = StorageService.getConfig();
            const entityName = config?.entityName || 'Entidad';

            // Use formatted dates from state for input values
            const fromDateStr = ReportsUtils.formatDateForInput(this.filterSettings.fromDate);
            const toDateStr = ReportsUtils.formatDateForInput(this.filterSettings.toDate);

            // Get pre-selected field IDs for report dropdowns
            const horizontalAxisFieldId = allFields.find(f => f.isHorizontalAxis)?.id;
            const compareFieldId = allFields.find(f => f.isCompareField)?.id;

            // --- HTML Template (simplified for brevity, similar to previous example) ---
            const template = `
                <div class="container mt-4">
                    <h2><i class="bi bi-clipboard-data me-2"></i>Reportes y Análisis</h2>

                    <div class="card mb-4 shadow-sm">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0"><i class="bi bi-funnel-fill me-2"></i>Filtros Principales</h5>
                        </div>
                        <div class="card-body">
                            <form id="filter-form" class="row g-3">
                                <div class="col-md-4">
                                    <label for="filter-entity" class="form-label fw-bold">${entityName}(es)</label>
                                    <select class="form-select" id="filter-entity" multiple size="4">
                                        <option value="">-- Todas --</option>
                                        ${entities.map(entity =>
                                            `<option value="${entity.id}">${entity.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="form-text text-muted small">Ctrl/Cmd + clic para múltiple selección.</div>
                                </div>
                                <div class="col-md-4">
                                    <label for="filter-from-date" class="form-label fw-bold">Desde</label>
                                    <input type="date" class="form-control" id="filter-from-date" value="${fromDateStr}">
                                </div>
                                <div class="col-md-4">
                                    <label for="filter-to-date" class="form-label fw-bold">Hasta</label>
                                    <input type="date" class="form-control" id="filter-to-date" value="${toDateStr}">
                                </div>
                                <div class="col-12 text-end mt-3">
                                    <button type="button" id="reset-filters-btn" class="btn btn-outline-secondary me-2">
                                        <i class="bi bi-arrow-counterclockwise me-1"></i>Limpiar Filtros
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-check-lg me-1"></i>Aplicar y Actualizar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="card mb-4 shadow-sm">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0"><i class="bi bi-calendar-event me-2"></i>Atajos de Fecha</h5>
                        </div>
                        <div class="card-body text-center pt-3 pb-1">
                            <div class="btn-group mb-3 flex-wrap" role="group" aria-label="Atajos principales">
                                ${['yesterday', 'today', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'].map(range => `
                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut m-1" data-range="${range}">${ReportsUtils.getDateRangeLabel(range)}</button>
                                `).join('')}
                           </div>
                            <h6 class="mt-2 mb-2 text-muted small">Días de la Semana Pasada</h6>
                             <div class="btn-group flex-wrap mb-2" role="group" aria-label="Días semana pasada">
                                 ${['lastMonday', 'lastTuesday', 'lastWednesday', 'lastThursday', 'lastFriday', 'lastSaturday', 'lastSunday'].map(range => `
                                     <button type="button" class="btn btn-sm btn-outline-secondary date-shortcut m-1" data-range="${range}">${ReportsUtils.getDateRangeLabel(range)}</button>
                                 `).join('')}
                             </div>
                        </div>
                    </div>

                    <div class="card mb-4 shadow-sm">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0"><i class="bi bi-bar-chart-line-fill me-2"></i>Reportes Comparativos</h5>
                        </div>
                        <div class="card-body">
                            ${sharedNumericFields.length === 0 ? `
                                <div class="alert alert-info d-flex align-items-center">
                                    <i class="bi bi-info-circle-fill me-3 fs-4"></i>
                                    <div>
                                        No hay campos numéricos compartidos entre ${entityName.toLowerCase()}s para generar reportes.
                                        <hr class="my-2">
                                        <p class="mb-0 small">Para habilitar esta función, cree campos numéricos y asígnelos a múltiples ${entityName.toLowerCase()}s en la configuración.</p>
                                    </div>
                                </div>
                            ` : `
                                <form id="report-form" class="row g-3 mb-4 align-items-end">
                                    <div class="col-md-4">
                                        <label for="report-horizontal-field" class="form-label">Eje Horizontal (Agrupar por)</label>
                                        <select class="form-select" id="report-horizontal-field">
                                            <option value="">${entityName} Principal</option>
                                            ${allFields.map(field =>
                                                `<option value="${field.id}" ${horizontalAxisFieldId === field.id ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <label for="report-field" class="form-label">Campo a Comparar</label>
                                        <select class="form-select" id="report-field" required>
                                            <option value="">Seleccione...</option>
                                            ${sharedNumericFields.map(field =>
                                                `<option value="${field.id}" ${compareFieldId === field.id ? 'selected' : ''}>${field.name} ${field.unit ? '('+field.unit+')' : ''}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                     <div class="col-md-3">
                                        <label for="report-aggregation" class="form-label">Agregación</label>
                                        <select class="form-select" id="report-aggregation">
                                            <option value="sum">Suma Total</option>
                                            <option value="average">Promedio</option>
                                            <option value="count">Conteo Registros</option>
                                            <option value="min">Valor Mínimo</option>
                                            <option value="max">Valor Máximo</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <button type="submit" class="btn btn-success w-100">
                                            <i class="bi bi-arrow-repeat me-1"></i>Generar
                                        </button>
                                    </div>
                                </form>
                                <div id="report-error" class="alert alert-warning" style="display: none;"></div>
                                <div id="report-container" style="display: none;">
                                    <div class="chart-container mb-3 border rounded p-2" style="position: relative; height:300px; width:100%;">
                                        <canvas id="report-chart"></canvas>
                                    </div>
                                    <div id="report-summary" class="mt-3 small text-muted border-top pt-2"></div>
                                </div>
                            `}
                        </div>
                    </div>

                    <div class="card mb-4 shadow-sm">
                        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 class="mb-0 me-3"><i class="bi bi-table me-2"></i>Registros Detallados</h5>
                            <div class="d-flex align-items-center flex-wrap gap-2">
                                <button id="edit-date-selected-btn" class="btn btn-outline-light btn-sm" style="display:none;" title="Editar fecha de los registros seleccionados">
                                    <i class="bi bi-calendar-event"></i> <span class="d-none d-md-inline ms-1">Editar Fecha</span>
                                </button>
                                <button id="delete-selected-btn" class="btn btn-outline-danger btn-sm" style="display:none;" title="Eliminar registros seleccionados">
                                     <i class="bi bi-trash"></i> <span class="d-none d-md-inline ms-1">Eliminar</span>
                                </button>
                                <button id="export-csv-btn" class="btn btn-outline-info btn-sm" title="Exportar vista actual a CSV">
                                    <i class="bi bi-file-earmark-spreadsheet"></i> <span class="d-none d-md-inline ms-1">Exportar CSV</span>
                                </button>
                                <span id="records-count" class="badge bg-light text-dark">0 registros</span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                             <div class="p-3 bg-light border-bottom">
                                 <div class="row g-3 align-items-end">
                                     <div class="col-md-12 mb-2">
                                         <div class="input-group">
                                             <span class="input-group-text"><i class="bi bi-search"></i></span>
                                             <input type="search" id="search-records" class="form-control" placeholder="Buscar en registros visibles..." value="${this.filterSettings.searchTerm}">
                                             <button class="btn btn-outline-secondary" type="button" id="clear-search-btn" title="Limpiar búsqueda">
                                                 <i class="bi bi-x-lg"></i>
                                             </button>
                                         </div>
                                     </div>
                                     ${[1, 2, 3].map(colNum => `
                                        <div class="col-md-4">
                                            <label for="column-selector-${colNum}" class="form-label small fw-bold">Columna ${colNum + 2}:</label>
                                            <select class="form-select form-select-sm column-selector" id="column-selector-${colNum}" data-column-index="${colNum}">
                                                <option value="">-- Ninguno --</option>
                                                ${allFields.map(field =>
                                                    `<option value="${field.id}" ${this.selectedColumns[`field${colNum}`] === field.id ? 'selected' : ''}>${field.name}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                    `).join('')}
                                 </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-hover table-striped table-sm mb-0" id="records-table">
                                    <thead class="table-light sticky-top" style="top: -1px; z-index: 1;">
                                        <tr>
                                            <th class="sortable text-nowrap" data-sort="entity">${entityName} <i class="bi bi-arrow-down-up small"></i></th>
                                            <th class="sortable text-nowrap" data-sort="timestamp">Fecha <i class="bi bi-arrow-down-up small"></i></th>
                                            <th class="sortable text-nowrap dynamic-column" data-column-index="1" data-sort="field1">Col 3 <i class="bi bi-arrow-down-up small"></i></th>
                                            <th class="sortable text-nowrap dynamic-column" data-column-index="2" data-sort="field2">Col 4 <i class="bi bi-arrow-down-up small"></i></th>
                                            <th class="sortable text-nowrap dynamic-column" data-column-index="3" data-sort="field3">Col 5 <i class="bi bi-arrow-down-up small"></i></th>
                                            <th class="text-center px-2" style="width: 1%;">
                                                <input class="form-check-input" type="checkbox" id="select-all-records" title="Seleccionar/Deseleccionar Todos">
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody id="records-list">
                                        <tr><td colspan="6" class="text-center p-5 text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando registros...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                             <div id="no-records-message" class="text-center py-5" style="display: none;">
                                </div>
                            <div class="d-flex justify-content-between align-items-center p-3 bg-light border-top flex-wrap gap-2">
                                <div class="d-flex align-items-center">
                                    <label for="items-per-page" class="me-2 mb-0 small text-nowrap">Mostrar:</label>
                                    <select id="items-per-page" class="form-select form-select-sm" style="width: auto;">
                                        ${[20, 50, 100, 200].map(num => `<option value="${num}" ${this.pagination.itemsPerPage === num ? 'selected' : ''}>${num}</option>`).join('')}
                                    </select>
                                    <span class="ms-3 small text-muted text-nowrap" id="pagination-info"></span>
                                </div>
                                <div class="pagination-container">
                                    <nav aria-label="Navegación de página">
                                        <ul class="pagination pagination-sm mb-0" id="pagination-controls">
                                            </ul>
                                    </nav>
                                </div>
                            </div>
                        </div> </div> </div> ${ReportsModal && typeof ReportsModal.getModalHtmlStructure === 'function' ? ReportsModal.getModalHtmlStructure() : ''}
            `;
            // --- End HTML Template ---

            mainContent.innerHTML = template;
            console.log("ReportsView structure rendered.");

            // Now that the structure exists, update dynamic parts like table headers
            ReportsTable.updateColumnHeaders(this); // Update based on current this.selectedColumns

        } catch (error) {
            console.error("Error rendering ReportsView:", error);
            const mainContent = Router.getActiveViewContainer ? Router.getActiveViewContainer() : document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `<div class="alert alert-danger">Error al renderizar la vista de reportes: ${error.message}. Revise la consola.</div>`;
            }
        }
    },

    /**
    * Reads filter values from the DOM, fetches/filters data, and updates the display.
    */
   applyFiltersAndDisplayData() {
       console.log("Applying filters and updating display...");
       UIUtils.showLoadingOverlay("Actualizando datos..."); // Use a generic message

       try {
           // 1. Read Filters from DOM and update state
           this.filterSettings = ReportsUtils.getCurrentFiltersFromDOM();
           this.pagination.currentPage = 1; // Reset page on new filter application
           this.selectedRecordIds.clear(); // Clear selection

           // 2. Fetch Records based on date/entity filters
           this.filteredRecords = RecordModel.getFilteredRecords(
               this.filterSettings.entities,
               this.filterSettings.fromDate,
               this.filterSettings.toDate
           );
            console.log(`Workspaceed ${this.filteredRecords.length} records based on date/entity filters.`);

           // 3. Apply Search Term (if any)
           this.applySearch(); // Uses this.filterSettings.searchTerm internally

           // 4. Apply Sorting
           this.applySort(); // Uses this.sorting state internally

           // 5. Update Table Display (handles pagination)
           ReportsTable.displayData(this); // Displays data from this.displayRecords

           // 6. Update Comparative Report/Chart (using filtered data before search/sort)
           this.generateReport();

           UIUtils.hideLoadingOverlay();
           console.log("Data update complete.");

       } catch (error) {
           console.error("Error applying filters and displaying data:", error);
           UIUtils.hideLoadingOverlay();
           UIUtils.showAlert(`Error al actualizar los datos: ${error.message}`, 'danger');
           ReportsTable.displayError(this, "Error al cargar datos.");
       }
   },

   /**
    * Filters `filteredRecords` based on `filterSettings.searchTerm`
    * and updates `displayRecords`.
    */
   applySearch() {
       const searchTerm = this.filterSettings.searchTerm.toLowerCase().trim();
       if (!searchTerm) {
           this.displayRecords = [...this.filteredRecords]; // No search term
           console.log("Search term empty, using all filtered records.");
       } else {
           console.log(`Applying search term: "${searchTerm}"`);
           // Delegate search logic to a utility or table function
           this.displayRecords = ReportsTable.searchRecords(
               this.filteredRecords,
               searchTerm,
               this.selectedColumns // Pass selected columns for targeted search
           );
           console.log(`${this.displayRecords.length} records after search.`);
       }
       // Note: Sorting needs to be re-applied after search
   },

   /**
    * Sorts the `displayRecords` array based on the current `sorting` state.
    * @param {boolean} [updateDisplay=false] - Whether to immediately update the table display.
    */
   applySort(updateDisplay = false) {
       if (!this.sorting.column) return; // No column specified

       console.log(`Applying sort: column=${this.sorting.column}, direction=${this.sorting.direction}`);
       ReportsTable.sortRecords(
           this.displayRecords, // Sort the records intended for display
           this.sorting.column,
           this.sorting.direction,
           this.selectedColumns // Needed for sorting dynamic field columns
       );

       if (updateDisplay) {
           this.pagination.currentPage = 1; // Reset to first page when sort changes interactively
           ReportsTable.displayData(this);
           ReportsTable.updateSortIndicators(this); // Update UI arrows
       }
   },

    /**
     * Generates or updates the comparative report (chart and summary).
     * Uses data appropriate for the report (typically `filteredRecords` before search).
     */
    generateReport() {
        console.log("Generating/Updating comparative report...");
        const reportForm = document.getElementById('report-form');
        const reportContainer = document.getElementById('report-container');
        const reportErrorEl = document.getElementById('report-error'); // Renamed element ID
        const sharedNumericFields = FieldModel.getSharedNumericFields();

        // Clear previous errors/chart and hide container initially
        if (reportErrorEl) { reportErrorEl.style.display = 'none'; reportErrorEl.textContent = ''; }
        if (reportContainer) reportContainer.style.display = 'none';
        if (this.currentChart) { this.currentChart.destroy(); this.currentChart = null; }


        if (!reportForm || sharedNumericFields.length === 0) {
            console.warn("Report form not found or no numeric fields available. Skipping report generation.");
            return;
        }

        try {
            const horizontalFieldId = document.getElementById('report-horizontal-field')?.value;
            const compareFieldId = document.getElementById('report-field')?.value;
            const aggregationType = document.getElementById('report-aggregation')?.value;

            if (!compareFieldId) {
                // Don't show error if user hasn't selected a field yet, just don't generate.
                console.log("No comparison field selected for report.");
                return;
            }

            // Use the records filtered by date/entity for the report,
            // as search term usually applies only to the table view.
            const dataForReport = this.filteredRecords;

            if (dataForReport.length === 0) {
                 throw new Error("No hay datos que coincidan con los filtros de fecha/entidad seleccionados para generar el reporte.");
            }

            const chartData = ReportsChart.prepareChartData(
                dataForReport,
                horizontalFieldId,
                compareFieldId,
                aggregationType
            );

            if (!chartData || chartData.labels.length === 0) {
                throw new Error("No se pudieron generar datos agrupados para el reporte con la configuración actual.");
            }

            // Render chart & summary using the ReportsChart module
            this.currentChart = ReportsChart.renderChart(chartData, this.currentChart);
            ReportsChart.displaySummary(chartData, document.getElementById('report-summary'), aggregationType);

            reportContainer.style.display = 'block'; // Show container
            console.log("Comparative report generated successfully.");

        } catch (error) {
            console.error("Error generating comparative report:", error);
            reportErrorEl.textContent = `Error al generar el reporte: ${error.message}`;
            reportErrorEl.style.display = 'block';
            // Don't necessarily show a global alert for this, the inline error is often sufficient.
            // UIUtils.showAlert('Error al generar el reporte comparativo.', 'warning');
        }
    },

    /**
     * Refreshes the view when underlying data might have changed (e.g., after record edits).
     * Re-applies current filters and redraws necessary components.
     */
    update() {
        console.log("Updating ReportsView due to external data change...");
        try {
             // Re-run the main data loading and display process
             this.applyFiltersAndDisplayData();

             // Optionally, show a confirmation
             // UIUtils.showAlert('Vista actualizada.', 'success', 1500);

        } catch (error) {
            console.error("Error updating ReportsView:", error);
            UIUtils.showAlert('Error al actualizar la vista de reportes.', 'danger');
        }
    }
};

// Make ReportsView globally accessible or export if using ES Modules
window.ReportsView = ReportsView;

// Example placeholder for a utility function mentioned
// You would have this in your actual ReportsUtils.js file
/*
const ReportsUtils = {
    // ... other utils
    getDateRangeLabel(rangeKey) {
        const labels = {
            yesterday: 'Ayer', today: 'Hoy', thisWeek: 'Esta Semana', lastWeek: 'Semana Pasada',
            thisMonth: 'Este Mes', lastMonth: 'Mes Pasado', lastMonday: 'Lu', lastTuesday: 'Ma',
            lastWednesday: 'Mi', lastThursday: 'Ju', lastFriday: 'Vi', lastSaturday: 'Sá', lastSunday: 'Do'
        };
        return labels[rangeKey] || rangeKey;
    },
    formatDateForInput(date) {
        if (!date) return '';
        // Implementation to format Date object to 'YYYY-MM-DD' string
        return date.toISOString().split('T')[0];
    },
     getDefaultDates() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1); // Start from the 1st of last month
        return { today, lastMonth };
    },
    getCurrentFiltersFromDOM() {
        // Implementation to read values from #filter-entity, #filter-from-date, etc.
        // and return an object like { entities: [], fromDate: Date, toDate: Date, searchTerm: '' }
        return { entities: [], fromDate: new Date(), toDate: new Date(), searchTerm: document.getElementById('search-records')?.value || '' };
    }
    // ... other utils
};
*/