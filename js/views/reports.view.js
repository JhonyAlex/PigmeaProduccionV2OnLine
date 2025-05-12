const ReportsView = {
    selectedRecordIds: new Set(),
    pagination: {
        currentPage: 1,
        itemsPerPage: 20,
    },
    sorting: {
        column: 'timestamp',
        direction: 'desc',
    },
    selectedColumns: {
        field1: null,
        field2: null,
        field3: null,
    },
    filteredRecords: [],
    searchedRecords: [],

    init() {
        try {
            console.log("Initializing ReportsView...");
            
            // Check required dependencies
            const requiredDependencies = [
                { name: 'ReportsTable', obj: window.ReportsTable },
                { name: 'ReportsChart', obj: window.ReportsChart },
                { name: 'ReportsEvents', obj: window.ReportsEvents },
                { name: 'UIUtils', obj: window.UIUtils },
                { name: 'FieldModel', obj: window.FieldModel },
                { name: 'RecordModel', obj: window.RecordModel }
            ];
            
            const missing = requiredDependencies.filter(d => !d.obj);
            if (missing.length > 0) {
                const missingNames = missing.map(m => m.name).join(', ');
                throw new Error(`One or more required modules are missing: ${missingNames}`);
            }
            
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento .main-content no encontrado");
                throw new Error("Main content container not found");
            }

            this.pagination = { currentPage: 1, itemsPerPage: 20 };
            this.sorting = { column: 'timestamp', direction: 'desc' };
            this.selectedColumns = { field1: null, field2: null, field3: null };
            this.filteredRecords = [];
            this.searchedRecords = [];

            this.render();
            
            // Add a small delay to ensure everything is rendered
            setTimeout(() => {
                if (window.ReportsEvents) {
                    ReportsEvents.setupEventListeners(this);
                    this.autoGenerateReport();
                } else {
                    console.error("ReportsEvents module not found");
                }
            }, 300);
        } catch (error) {
            console.error("Error al inicializar vista de reportes:", error);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        Error al inicializar la vista de reportes: ${error.message}
                    </div>
                `;
            }
        }
    },

    autoGenerateReport() {
        try {
            const sharedNumericFields = FieldModel.getSharedNumericFields();
            if (sharedNumericFields.length === 0) {
                return;
            }

            setTimeout(() => {
                const reportField = document.getElementById('report-field');
                if (!reportField) {
                    console.warn("Element #report-field not found");
                    return;
                }
                
                const compareField = FieldModel.getAll().find(field => field.isCompareField);

                if (compareField) {
                    reportField.value = compareField.id;
                } else if (sharedNumericFields.length > 0) {
                    reportField.value = sharedNumericFields[0].id;
                }

                this.generateReport();
            }, 300);
        } catch (error) {
            console.error("Error in autoGenerateReport:", error);
        }
    },

    render() {
        try {
            const mainContent = Router.getActiveViewContainer() || document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento contenedor no encontrado en render()");
                return;
            }

            const entities = EntityModel.getAll();
            const sharedNumericFields = FieldModel.getSharedNumericFields();
            const sharedFields = FieldModel.getAll();

            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStr = this.formatDateForInput(lastMonth);
            const today = this.formatDateForInput(new Date());

            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';

            const column3Field = FieldModel.getAll().find(field => field.isColumn3);
            const column4Field = FieldModel.getAll().find(field => field.isColumn4);
            const column5Field = FieldModel.getAll().find(field => field.isColumn5);

            this.selectedColumns.field1 = column3Field ? column3Field.id : null;
            this.selectedColumns.field2 = column4Field ? column4Field.id : null;
            this.selectedColumns.field3 = column5Field ? column5Field.id : null;

            const horizontalAxisField = FieldModel.getAll().find(field => field.isHorizontalAxis);
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            // Complete HTML template with all form controls
            const template = `
                <div class="container mt-4">
                    <h2>Reportes y Análisis</h2>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Filtros y Opciones</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="report-field">Campo a reportar:</label>
                                        <select class="form-control" id="report-field">
                                            ${sharedNumericFields.map(field => 
                                                `<option value="${field.id}" ${compareField && compareField.id === field.id ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="start-date">Desde:</label>
                                                <input type="date" class="form-control" id="start-date" value="${lastMonthStr}">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="end-date">Hasta:</label>
                                                <input type="date" class="form-control" id="end-date" value="${today}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="search-input">Buscar:</label>
                                        <input type="text" class="form-control" id="search-input" placeholder="Buscar...">
                                    </div>
                                </div>
                                <div class="col-md-6 d-flex align-items-end">
                                    <button id="generate-report-btn" class="btn btn-primary">Generar Reporte</button>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button id="today-btn" type="button" class="btn btn-outline-secondary">Hoy</button>
                                        <button id="yesterday-btn" type="button" class="btn btn-outline-secondary">Ayer</button>
                                        <button id="last-7-days-btn" type="button" class="btn btn-outline-secondary">Últimos 7 días</button>
                                        <button id="last-30-days-btn" type="button" class="btn btn-outline-secondary">Últimos 30 días</button>
                                        <button id="this-month-btn" type="button" class="btn btn-outline-secondary">Este mes</button>
                                        <button id="last-month-btn" type="button" class="btn btn-outline-secondary">Mes anterior</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Gráfico</h5>
                            <div>
                                <button id="export-csv-btn" class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-file-csv"></i> CSV
                                </button>
                                <button id="export-pdf-btn" class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-file-pdf"></i> PDF
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div id="chart-container" style="height: 400px;"></div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">Estadísticas</div>
                                        <div class="card-body">
                                            <p><strong>Total registros:</strong> <span id="record-count">0</span></p>
                                            <p><strong>Promedio:</strong> <span id="records-avg">N/A</span></p>
                                            <p><strong>Mínimo:</strong> <span id="records-min">N/A</span></p>
                                            <p><strong>Máximo:</strong> <span id="records-max">N/A</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Registros</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="column-field1-select">Columna 1:</label>
                                        <select class="form-control" id="column-field1-select">
                                            <option value="">Ninguno</option>
                                            ${sharedFields.map(field => 
                                                `<option value="${field.id}" ${column3Field && column3Field.id === field.id ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="column-field2-select">Columna 2:</label>
                                        <select class="form-control" id="column-field2-select">
                                            <option value="">Ninguno</option>
                                            ${sharedFields.map(field => 
                                                `<option value="${field.id}" ${column4Field && column4Field.id === field.id ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="column-field3-select">Columna 3:</label>
                                        <select class="form-control" id="column-field3-select">
                                            <option value="">Ninguno</option>
                                            ${sharedFields.map(field => 
                                                `<option value="${field.id}" ${column5Field && column5Field.id === field.id ? 'selected' : ''}>${field.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr id="reports-table-header">
                                            <!-- Header will be populated by ReportsTable.updateColumnHeaders -->
                                        </tr>
                                    </thead>
                                    <tbody id="reports-table-body">
                                        <!-- Table body will be populated by ReportsTable.renderTable -->
                                    </tbody>
                                </table>
                            </div>
                            
                            <div id="pagination-container" class="mt-3">
                                <!-- Pagination will be populated by ReportsTable.renderPagination -->
                            </div>
                        </div>
                    </div>
                </div>
            `;

            mainContent.innerHTML = template;

            // Try to initialize table with error checking
            try {
                if (typeof ReportsTable !== 'undefined') {
                    ReportsTable.updateColumnHeaders(this);
                    ReportsTable.applyFilters(this);
                } else {
                    console.error("ReportsTable is not defined");
                    mainContent.innerHTML = `
                        <div class="alert alert-danger">
                            Error: El módulo ReportsTable no está disponible. 
                            Verifique que todos los scripts necesarios están incluidos en el HTML.
                        </div>
                    `;
                }
            } catch (error) {
                console.error("Error al actualizar cabeceras o aplicar filtros iniciales:", error);
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        Error al inicializar la vista de reportes: ${error.message}
                        <br>Revise la consola para más detalles.
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error al renderizar vista de reportes:", error);
        }
    },

    update() {
        try {
            this.generateReport();
        } catch (error) {
            console.error("Error al actualizar la vista de reportes:", error);
        }
    },

    formatDateForInput(date) {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "";
        }
    },

    generateReport() {
        try {
            // Find the report field and safely get its value
            const reportFieldElement = document.getElementById('report-field');
            if (!reportFieldElement) {
                console.error("Element #report-field not found");
                UIUtils.showAlert('Error: Campo de reporte no encontrado', 'danger');
                return;
            }
            
            const reportField = reportFieldElement.value;
            if (!reportField) {
                UIUtils.showAlert('Por favor seleccione un campo para el reporte', 'warning');
                return;
            }
            
            // Safely get date values
            const startDate = document.getElementById('start-date')?.value || '';
            const endDate = document.getElementById('end-date')?.value || '';
            
            const records = RecordModel.getFilteredByDateRange(startDate, endDate);
            this.filteredRecords = records;
            this.searchedRecords = records;
            
            if (typeof ReportsTable !== 'undefined') {
                ReportsTable.renderTable(this);
            } else {
                console.error("ReportsTable is not defined");
                UIUtils.showAlert('Error: El módulo ReportsTable no está disponible', 'danger');
            }
            
            if (typeof ReportsChart !== 'undefined') {
                ReportsChart.renderChart(this, reportField);
            } else {
                console.error("ReportsChart is not defined");
                UIUtils.showAlert('Error: El módulo ReportsChart no está disponible', 'danger');
            }
            
            UIUtils.showAlert('Reporte generado con éxito', 'success');
        } catch (error) {
            console.error("Error generating report:", error);
            UIUtils.showAlert('Error al generar el reporte', 'danger');
        }
    },

    exportToCSV() {
        try {
            if (this.searchedRecords.length === 0) {
                UIUtils.showAlert('No hay datos para exportar', 'warning');
                return;
            }

            const fields = FieldModel.getAll();
            const headers = ['ID', 'Fecha', 'Hora'];
            
            // Add selected custom columns
            Object.values(this.selectedColumns).forEach(fieldId => {
                if (fieldId) {
                    const field = fields.find(f => f.id === fieldId);
                    if (field) headers.push(field.name);
                }
            });
            
            const csvContent = ExportUtils.generateCSV(this.searchedRecords, headers, fields);
            ExportUtils.downloadCSV(csvContent, `reporte_${this.formatDateForInput(new Date())}.csv`);
            
            UIUtils.showAlert('Datos exportados con éxito', 'success');
        } catch (error) {
            console.error("Error al exportar datos:", error);
            UIUtils.showAlert('Error al exportar datos', 'danger');
        }
    },

    exportToPDF() {
        try {
            if (this.searchedRecords.length === 0) {
                UIUtils.showAlert('No hay datos para exportar', 'warning');
                return;
            }
            
            const config = StorageService.getConfig();
            const title = `Reporte - ${config.entityName || 'Entidad'}`;
            const startDate = document.getElementById('start-date')?.value;
            const endDate = document.getElementById('end-date')?.value;
            const dateRange = startDate && endDate ? `${startDate} al ${endDate}` : 'Todos los registros';
            
            ExportUtils.exportToPDF(
                this.searchedRecords, 
                title, 
                dateRange,
                this.selectedColumns,
                FieldModel.getAll()
            );
            UIUtils.showAlert('PDF generado con éxito', 'success');
        } catch (error) {
            console.error("Error al generar PDF:", error);
            UIUtils.showAlert('Error al generar PDF', 'danger');
        }
    },

    getReportSummaryStats() {
        try {
            if (this.searchedRecords.length === 0) {
                return { count: 0, average: 'N/A', min: 'N/A', max: 'N/A' };
            }
            
            const reportField = document.getElementById('report-field').value;
            if (!reportField) return { count: this.searchedRecords.length, average: 'N/A', min: 'N/A', max: 'N/A' };
            
            const field = FieldModel.getById(reportField);
            if (!field || field.type !== 'number') {
                return { count: this.searchedRecords.length, average: 'N/A', min: 'N/A', max: 'N/A' };
            }
            
            const values = this.searchedRecords
                .map(record => Number(record.data[reportField]))
                .filter(value => !isNaN(value));
                
            if (values.length === 0) {
                return { count: this.searchedRecords.length, average: 'N/A', min: 'N/A', max: 'N/A' };
            }
            
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = (sum / values.length).toFixed(2);
            const min = Math.min(...values).toFixed(2);
            const max = Math.max(...values).toFixed(2);
            
            return {
                count: this.searchedRecords.length,
                average: avg,
                min: min,
                max: max
            };
        } catch (error) {
            console.error("Error al calcular estadísticas:", error);
            return { count: 0, average: 'N/A', min: 'N/A', max: 'N/A' };
        }
    },
    
    applyFilters() {
        try {
            const startDate = document.getElementById('start-date')?.value;
            const endDate = document.getElementById('end-date')?.value;
            const searchText = document.getElementById('search-input')?.value || '';
            
            // Filter by date range
            this.filteredRecords = RecordModel.getFilteredByDateRange(startDate, endDate);
            
            // Search functionality
            if (searchText.trim()) {
                this.searchedRecords = this.filteredRecords.filter(record => 
                    Object.values(record.data).some(value => 
                        String(value).toLowerCase().includes(searchText.toLowerCase())
                    )
                );
            } else {
                this.searchedRecords = this.filteredRecords;
            }
            
            // Reset pagination to first page when filters change
            this.pagination.currentPage = 1;
            
            ReportsTable.renderTable(this);
        } catch (error) {
            console.error("Error al aplicar filtros:", error);
            UIUtils.showAlert('Error al aplicar filtros', 'danger');
        }
    },

    handleTableSorting(column) {
        if (this.sorting.column === column) {
            this.sorting.direction = this.sorting.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sorting.column = column;
            this.sorting.direction = 'asc';
        }
        
        ReportsTable.renderTable(this);
    },

    updateSelectedColumns(fieldId, columnType) {
        this.selectedColumns[columnType] = fieldId;
        ReportsTable.updateColumnHeaders(this);
        ReportsTable.renderTable(this);
    },
};

window.ReportsView = ReportsView;