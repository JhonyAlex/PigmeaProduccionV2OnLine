/**
 * Vista de reportes para visualizar datos
 * 
 * NOTA: Este archivo sigue siendo grande porque contiene toda la lógica de la vista de reportes.
 * Si ya creaste archivos como reports.events.js, reports.table.js, reports.modal.js, etc.,
 * puedes migrar los métodos correspondientes a esos archivos y dejar aquí solo la inicialización y el "pegamento".
 * 
 * Sugerencia para modularizar:
 * - Deja aquí solo el objeto ReportsView con las propiedades de estado y los métodos init, render, update.
 * - Mueve:
 *   - setupEventListeners y métodos relacionados a reports.events.js
 *   - displayFilteredRecords, displayPaginatedRecords, updatePaginationControls, sortRecords, etc. a reports.table.js
 *   - showEditDateSelectedModal, setupModalFooter, toggleEditMode, generateInputHTMLFallback, resetEditMode, confirmDeleteRecord, saveRecordChanges, etc. a reports.modal.js
 *   - getFieldValue, formatDateForInput, setDateRange, etc. a reports.utils.js
 * - Importa esos módulos aquí y llama a sus métodos desde ReportsView.
 * 
 * Ejemplo de estructura mínima para este archivo:
 * 
 * const ReportsView = {
 *   ...estado...
 *   init() {
 *     this.render();
 *     ReportsEvents.setupEventListeners(this);
 *     this.autoGenerateReport();
 *   },
 *   render() {
 *     ...render principal...
 *     ReportsTable.renderTable(this);
 *   },
 *   update() {
 *     ReportsTable.updateTable(this);
 *   }
 * }
 * 
 * Así el archivo será pequeño y fácil de mantener.
 * 
 * Si necesitas ayuda para migrar métodos a los archivos nuevos, dímelo y te hago el desglose exacto.
 */

/**
 * Vista de reportes para visualizar datos
 */
const ReportsView = {
    selectedRecordIds: new Set(), // <--- NUEVO para selección múltiple
    pagination: {
        currentPage: 1,
        itemsPerPage: 20, // O el valor por defecto que prefieras
    },
    sorting: {
        column: 'timestamp', // Columna inicial para ordenar (o null)
        direction: 'desc',   // Dirección inicial ('asc' o 'desc')
    },
    selectedColumns: {
        field1: null, // O '', dependiendo de cómo manejes la ausencia de selección
        field2: null,
        field3: null,
    },
    filteredRecords: [], // Inicializar como array vacío
    searchedRecords: [], // Inicializar como array vacío
    // ---------------------------------

    /**
     * Inicializa la vista de reportes
     */
    init() {
        try {
            // Verificar que el contenedor principal existe
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento .main-content no encontrado");
                return;
            }

            // Reiniciar estado al inicializar (opcional pero recomendado)
            this.pagination = { currentPage: 1, itemsPerPage: 20 }; // Simplificado
            this.sorting = { column: 'timestamp', direction: 'desc' };
            this.selectedColumns = { field1: null, field2: null, field3: null };
            this.filteredRecords = [];
            this.searchedRecords = [];

            this.render(); // Ahora 'this.selectedColumns' existe
            ReportsEvents.setupEventListeners(this);

            // Generar automáticamente el reporte al cargar la página
            this.autoGenerateReport();
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

        // Esperar a que el DOM esté completamente cargado (por si acaso)
        setTimeout(() => {
            // Obtener campos marcados para reportes comparativos
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            if (compareField) {
                // Si hay un campo marcado para comparar, usarlo
                document.getElementById('report-field').value = compareField.id;
            } else {
                // Si no hay campo marcado, usar el primer campo numérico disponible
                document.getElementById('report-field').value = sharedNumericFields[0].id;
            }

            // Generar el reporte usando los valores predeterminados o los que están en el formulario
            this.generateReport();
        }, 100);
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
            const lastMonthStr = ReportsUtils.formatDateForInput(lastMonth); // Usar función propia
            const today = ReportsUtils.formatDateForInput(new Date());      // Usar función propia

            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';

            const column3Field = FieldModel.getAll().find(field => field.isColumn3);
            const column4Field = FieldModel.getAll().find(field => field.isColumn4);
            const column5Field = FieldModel.getAll().find(field => field.isColumn5);

            // Actualiza SelectedColumns al cargar si hay campos marcados
            this.selectedColumns.field1 = column3Field ? column3Field.id : null;
            this.selectedColumns.field2 = column4Field ? column4Field.id : null;
            this.selectedColumns.field3 = column5Field ? column5Field.id : null;

            const horizontalAxisField = FieldModel.getAll().find(field => field.isHorizontalAxis);
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

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
                            <h5 class="mb-0">Registros</h5>
                            <div>
                                <button id="edit-date-selected-btn" class="btn btn-outline-light btn-sm me-2" style="display:none;">
                                    <i class="bi bi-calendar-event"></i> Editar fecha seleccionados
                                </button>
                                <button id="export-csv-btn" class="btn btn-outline-light btn-sm me-2">
                                    <i class="bi bi-file-earmark-spreadsheet"></i> Exportar a CSV
                                </button>
                                <span id="records-count" class="badge bg-light text-dark">0 registros</span>
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
                                            <th class="sortable" data-sort="entity">${entityName} <i class="bi"></i></th>
                                            <th class="sortable" data-sort="timestamp">Fecha y Hora <i class="bi"></i></th>
                                            <th class="sortable column-1" data-sort="field1">Columna 3 <i class="bi"></i></th>
                                            <th class="sortable column-2" data-sort="field2">Columna 4 <i class="bi"></i></th>
                                            <th class="sortable column-3" data-sort="field3">Columna 5 <i class="bi"></i></th>
                                            <th>
                                                <input type="checkbox" id="select-all-records" title="Seleccionar todos">
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody id="records-list">
                                        <!-- Las filas se insertarán aquí -->
                                    </tbody>
                                </table>
                            </div>
                            <!-- Mensaje si no hay registros -->
                            <div id="no-filtered-records" class="text-center py-4" style="display: none;">
                                <p class="text-muted">No hay registros que coincidan con los filtros.</p>
                            </div>
                            <!-- Paginación -->
                            <div class="d-flex justify-content-between align-items-center mt-3 p-2 bg-light border-top">
                                <div class="d-flex align-items-center">
                                    <label class="me-2 mb-0">Registros por página:</label>
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
                        </div> <!-- Fin card-body p-0 -->
                    </div> <!-- Fin card Registros -->

                </div> <!-- Fin container -->
            `;

            mainContent.innerHTML = template;

            try {
                ReportsTable.updateColumnHeaders(this);
                ReportsTable.applyFilters(this);
            } catch (error) {
                console.error("Error al actualizar cabeceras o aplicar filtros iniciales:", error);
                mainContent.innerHTML = `<div class="alert alert-danger">Error al inicializar la vista de reportes. Revise la consola para más detalles.</div>`;
            }
        } catch (error) {
            console.error("Error al renderizar vista de reportes:", error);
        }
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        try {
            this.generateReport();
        } catch (error) {
            console.error("Error al actualizar la vista de reportes:", error);
        }
    }
};

window.ReportsView = ReportsView;
