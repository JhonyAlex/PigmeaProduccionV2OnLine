/**
 * Vista principal de reportes y análisis
 * Contiene la estructura básica y métodos principales
 */

// Exportamos el objeto principal que será extendido por los otros módulos
export const ReportsView = {
    // Propiedades principales
    pagination: {
        currentPage: 1,
        itemsPerPage: 20,
    },
    sorting: {
        column: 'timestamp',
        direction: 'desc',
    },
    selectedColumns: {
        field1: '',
        field2: '',
        field3: '',
    },
    filteredRecords: null,
    searchedRecords: null,
    entityName: 'Entidad',
    recordName: 'Registro',
    
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

                // Reiniciar estado al inicializar
                this.pagination = { currentPage: 1, itemsPerPage: 20 };
                this.sorting = { column: 'timestamp', direction: 'desc' };
                this.selectedColumns = { field1: '', field2: '', field3: '' };
                this.filteredRecords = null;
                this.searchedRecords = null;

                // Cargar recursos de calendario localmente
                this.loadLocalCalendarStyles();

                this.render();
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
     * Configura los listeners de eventos
     */
    setupEventListeners() {
        // Esta función será implementada por los distintos módulos
        // que extenderán este objeto base
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
            // Mostrar todos los campos, no solo los numéricos
            const allFields = FieldModel.getAll();
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
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-calendar-event me-2"></i>Atajos de fecha</h5>
                            <button class="btn btn-sm btn-outline-light collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#fechasCollapse" aria-expanded="false" aria-controls="fechasCollapse">
                                <i class="bi bi-chevron-down"></i>
                            </button>
                        </div>
                        <div class="collapse" id="fechasCollapse">
                            <div class="card-body">
                                <div class="row g-2">
                                    <!-- Periodos comunes -->
                                    <div class="col-md-6">
                                        <div class="card h-100 border-light">
                                            <div class="card-header bg-light py-2">
                                                <h6 class="mb-0"><i class="bi bi-calendar-range me-1"></i>Periodos comunes</h6>
                                            </div>
                                            <div class="card-body p-2">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="yesterday">
                                                        <i class="bi bi-calendar-day"></i> Ayer
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="thisWeek">
                                                        <i class="bi bi-calendar-week"></i> Esta semana
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="lastWeek">
                                                        <i class="bi bi-calendar-week-fill"></i> Semana pasada
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="thisMonth">
                                                        <i class="bi bi-calendar-month"></i> Mes actual
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="lastMonth">
                                                        <i class="bi bi-calendar-month-fill"></i> Mes pasado
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Calendario interactivo -->
                                    <div class="col-md-6">
                                        <div class="card h-100 border-light">
                                            <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0"><i class="bi bi-calendar3 me-1"></i>Calendario</h6>
                                            </div>
                                            <div class="card-body p-2">
                                                <div id="date-calendar" style="min-height: 340px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Grupos de entidades (condicional) -->
                                    ${(() => {
                                        // Obtener todos los grupos de entidades
                                        const groups = EntityModel.getAllGroups();
                                        if (groups.length === 0) return ''; // No mostrar sección si no hay grupos
                                        
                                        return `
                                        <div class="col-12 mt-2">
                                            <div class="card border-light">
                                                <div class="card-header bg-light py-2">
                                                    <h6 class="mb-0"><i class="bi bi-filter me-1"></i>Filtrar por grupos de ${entityName.toLowerCase()}s</h6>
                                                </div>
                                                <div class="card-body p-2">
                                                    <div class="d-flex flex-wrap gap-1">
                                                        ${groups.map(group => 
                                                            `<button type="button" class="btn btn-sm btn-outline-info entity-group-filter" data-group="${group}">${group}</button>`
                                                        ).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        `;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Reportes Comparativos -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Reportes Comparativos</h5>
                        </div>
                        <div class="card-body">
                            ${allFields.length === 0 ? `
                                <div class="alert alert-info">
                                    No hay campos disponibles para generar reportes comparativos.
                                    <hr>
                                    <p class="mb-0">Para generar reportes comparativos, debe crear campos en sus ${entityName.toLowerCase()}s.</p>
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
                                        <label for="report-field" class="form-label">Campos a Comparar</label>
                                        <select class="form-select" id="report-field" required multiple size="4">
                                            <option value="">Seleccione uno o más campos</option>
                                            ${allFields.map(field =>
                                                `<option value="${field.id}" ${(compareField && compareField.id === field.id) ? 'selected' : ''}>${field.name}${field.type ? ` (${field.type})` : ''}</option>`
                                            ).join('')}
                                        </select>
                                        <div class="form-text">Mantenga presionado Ctrl (⌘ en Mac) para seleccionar múltiples campos</div>
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
                    // Inicializar el calendario después de renderizar
                    this.setupCalendar();
                } catch (error) {
                    console.error("Error al actualizar cabeceras o aplicar filtros iniciales:", error);
                }
            }, 0);

        } catch (error) {
            console.error("Error al renderizar vista de reportes:", error);
        }
    },

    /**
     * Actualiza los encabezados de columna en la tabla según los campos seleccionados
     */
    updateColumnHeaders() {
        // Esta función será implementada en el módulo recordDisplay.js
    },

    /**
     * Genera automáticamente un informe al cargar la página si hay datos disponibles
     */
    autoGenerateReport() {
        try {
            // Verificar si hay campos disponibles para generar un reporte
            const allFields = FieldModel.getAll();
            if (allFields.length === 0) {
                console.log("No hay campos para generar reporte automático");
                return; // No hay campos para generar reporte
            }

            // Esperar a que el DOM esté completamente cargado
            setTimeout(() => {
                const reportFieldSelect = document.getElementById('report-field');
                if (!reportFieldSelect) {
                    console.warn("Elemento 'report-field' no encontrado en el DOM");
                    return;
                }

                // Limpiar selecciones actuales
                Array.from(reportFieldSelect.options).forEach(option => {
                    option.selected = false;
                });
                
                // Obtener campos marcados para reportes comparativos
                const compareField = FieldModel.getAll().find(field => field.isCompareField);

                if (compareField) {
                    // Si hay un campo marcado para comparar, seleccionarlo
                    const option = Array.from(reportFieldSelect.options).find(opt => opt.value === compareField.id);
                    if (option) option.selected = true;
                } else {
                    // Si no hay campo marcado, seleccionar el primer campo disponible
                    // Preferimos campos numéricos o select para los reportes
                    const preferredField = allFields.find(field => field.type === 'number' || field.type === 'select');
                    
                    if (preferredField) {
                        const option = Array.from(reportFieldSelect.options).find(opt => opt.value === preferredField.id);
                        if (option) option.selected = true;
                    } else if (reportFieldSelect.options.length > 1) {
                        // Si no hay campos preferidos, seleccionar la primera opción que no sea vacía
                        const firstOption = Array.from(reportFieldSelect.options).find(opt => opt.value !== '');
                        if (firstOption) firstOption.selected = true;
                    }
                }

                // Generar el reporte usando los valores seleccionados
                this.generateReport();
            }, 200); // Dar más tiempo para que el DOM esté listo
        } catch (error) {
            console.error("Error en autoGenerateReport:", error);
        }
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        try {
            // Verificar si estamos en la vista de reportes antes de actualizar
            const mainContent = document.querySelector('.main-content');
            if (!mainContent || !mainContent.querySelector('#report-form')) {
                // No estamos en la vista de reportes, no hacer nada
                console.log("No se actualiza la vista de reportes porque no está activa");
                return;
            }

            // Verificar si hay un reporte ya generado
            const reportContainer = document.getElementById('report-container');
            if (reportContainer && reportContainer.style.display === 'block') {
                // Regenerar todos los reportes con los campos ya seleccionados
                this.generateReport();
            } else {
                console.log("No hay reporte generado para actualizar");
            }
        } catch (error) {
            console.error("Error al actualizar la vista de reportes:", error);
            // No usar UIUtils.showAlert aquí, ya que podría fallar si el contenedor no existe
        }
    },

    /**
     * Formatea una fecha para los campos de input
     */
    formatDateForInput(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}; 