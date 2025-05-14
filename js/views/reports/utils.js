/**
 * Módulo para funciones de utilidad en la vista de reportes
 */

/**
 * Configura las funciones de utilidad en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupUtilFunctions(ReportsView) {
    // Añadir funcionalidades de utilidad al objeto ReportsView
    
    /**
     * Configura los event listeners de la vista
     */
    ReportsView.setupEventListeners = function() {
        // Esperar a que el DOM esté completamente cargado
        setTimeout(() => {
            // Agregar evento al panel colapsable para inicializar el calendario cuando se abre
            const fechasCollapse = document.getElementById('fechasCollapse');
            if (fechasCollapse) {
                // Limpiar listeners anteriores para evitar duplicación
                const newFechasCollapse = fechasCollapse.cloneNode(true);
                fechasCollapse.parentNode.replaceChild(newFechasCollapse, fechasCollapse);
                
                // Agregar listener para cuando se abre el panel
                newFechasCollapse.addEventListener('shown.bs.collapse', () => {
                    console.log("Panel de fechas abierto, inicializando calendario");
                    // Re-inicializar el calendario al hacer visible el panel
                    this.setupCalendar();
                });
            }
            
            // Inicializar el calendario local solo si el panel está visible
            if (fechasCollapse && fechasCollapse.classList.contains('show')) {
                this.setupCalendar();
            } else {
                console.log("Panel de fechas cerrado, el calendario se inicializará al abrirlo");
            }
            
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
    };
} 