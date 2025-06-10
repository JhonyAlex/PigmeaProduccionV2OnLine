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

                // Reiniciar estado al inicializar
                this.pagination = { currentPage: 1, itemsPerPage: 20 };
                this.sorting = { column: 'timestamp', direction: 'desc' };
                this.selectedColumns = { field1: '', field2: '', field3: '' };
                this.filteredRecords = null;
                this.searchedRecords = null;

                this.render(); // Renderizar vista principal
                
                // La inicialización del módulo de filtros se moverá después del render

                // Generar automáticamente el reporte al cargar la página
                this.autoGenerateReport();
            }, 100); // Dar tiempo para que el DOM esté listo
        } catch (error) {
            console.error("Error al inicializar vista de reportes:", error);
            UIUtils.showAlert('Error al inicializar la vista de reportes', 'danger');
        }
    },

    // El código del calendario interactivo ha sido eliminado

    /**
     * Función de reserva para evitar errores al eliminar el calendario
     */
    setupCalendar() {
        // Función vacía para evitar errores tras eliminar el calendario
        console.log("Función de calendario deshabilitada");
    },

    // Función de calendario eliminada

    // Se eliminaron funciones de diagnóstico que ya no son necesarias

    /**
     * Renderiza un calendario local completo
     */
    renderLocalCalendar() {
        console.log("Renderizando calendario local");
        const calendarEl = document.getElementById('date-calendar');
        if (!calendarEl) {
            console.error("Elemento 'date-calendar' no encontrado");
            return;
        }

        try {
            const today = new Date();
            if (!this.currentCalendarDate) {
                this.currentCalendarDate = today;
            }
            
            console.log("Usando fecha para el calendario:", this.currentCalendarDate);
            this.renderCalendarMonth(calendarEl, this.currentCalendarDate);
            
            // Verificar después del renderizado
            setTimeout(() => {
                this.verifyCalendarButtons(calendarEl);
            }, 100);
        } catch (error) {
            console.error("Error al renderizar calendario local:", error);
            calendarEl.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al renderizar el calendario: ${error.message}
                </div>
            `;
        }
    },
    
    // Se eliminaron funciones diagnósticas que ya no son necesarias

    /**
     * Renderiza el mes actual en el calendario
     */
    renderCalendarMonth(container) {
        console.log("Renderizando calendario para", this.currentCalendarDate);
        
        // Verificar si el contenedor está visible
        const isVisible = container.offsetWidth > 0 && container.offsetHeight > 0;
        if (!isVisible) {
            console.warn("El contenedor del calendario no es visible. Buscando panel colapsable para abrir...");
            // Intentar abrir el panel colapsable si está cerrado
            const collapseParent = this.findCollapseParent(container);
            if (collapseParent && !collapseParent.classList.contains('show')) {
                console.log("Abriendo panel colapsable para mostrar el calendario");
                const bsCollapse = new bootstrap.Collapse(collapseParent, { toggle: true });
                // Programar renderizado después de que se muestre el panel
                setTimeout(() => this.renderCalendarMonth(container), 350);
                return;
            }
        }
        
        // Asegurarse de que existe una fecha válida
        if (!this.currentCalendarDate || isNaN(this.currentCalendarDate.getTime())) {
            console.warn("Fecha inválida, usando fecha actual");
            this.currentCalendarDate = new Date();
        }
        
        const date = this.currentCalendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
                
        // Primer día del mes
        const firstDay = new Date(year, month, 1);
        // Último día del mes
        const lastDay = new Date(year, month + 1, 0);
        
        // Obtener día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
        let firstDayOfWeek = firstDay.getDay();
        // Ajustar para que la semana empiece en lunes (0 = Lunes, 6 = Domingo)
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        
        // Nombres de los meses
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        // Nombres de los días
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        // Verificar rango seleccionado actual
        const fromDateInput = document.getElementById('filter-from-date');
        const toDateInput = document.getElementById('filter-to-date');
        let rangeStart = null;
        let rangeEnd = null;
        
        if (fromDateInput && toDateInput) {
            if (fromDateInput.value) {
                rangeStart = new Date(fromDateInput.value);
                rangeStart.setHours(0, 0, 0, 0);
            }
            if (toDateInput.value) {
                rangeEnd = new Date(toDateInput.value);
                rangeEnd.setHours(0, 0, 0, 0);
            }
        }
        
        // Crear estructura HTML del calendario
        let calendarHTML = `
            <div class="simple-calendar">
                <div class="calendar-header">
                    <div class="navigation-buttons">
                        <button class="btn btn-sm btn-outline-primary today-btn" title="Ir a hoy">
                            Hoy
                        </button>
                        <button class="btn btn-sm btn-outline-secondary prev-month" title="Mes anterior">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary next-month" title="Mes siguiente">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                    <h5 class="month-title mb-0">${monthNames[month]} ${year}</h5>
                    <div class="view-selectors">
                        <button class="btn btn-sm btn-outline-secondary active" id="month-view-btn">Mes</button>
                        <button class="btn btn-sm btn-outline-secondary" id="week-view-btn">Semana</button>
                    </div>
                </div>
                <div class="calendar-days">
        `;
        
        // Añadir nombres de los días
        dayNames.forEach(day => {
            calendarHTML += `<div class="day-name">${day}</div>`;
        });
        
        // Añadir días del mes anterior para completar la primera semana
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevMonthDay = new Date(year, month, -firstDayOfWeek + i + 1);
            const dateStr = this.formatDateForInput(prevMonthDay);
            const isInRange = this.isDateInRange(prevMonthDay, rangeStart, rangeEnd);
            const rangeClasses = this.getRangeClasses(prevMonthDay, rangeStart, rangeEnd);
            
            calendarHTML += `<div class="day other-month ${isInRange ? 'in-range' : ''} ${rangeClasses}" 
                                data-date="${dateStr}">${prevMonthDay.getDate()}</div>`;
        }
        
        // Añadir días del mes actual
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = this.formatDateForInput(currentDate);
            const isToday = currentDate.getDate() === today.getDate() && 
                          currentDate.getMonth() === today.getMonth() && 
                          currentDate.getFullYear() === today.getFullYear();
            
            const isInRange = this.isDateInRange(currentDate, rangeStart, rangeEnd);
            const rangeClasses = this.getRangeClasses(currentDate, rangeStart, rangeEnd);
            
            calendarHTML += `<div class="day ${isToday ? 'today' : ''} ${isInRange ? 'in-range' : ''} ${rangeClasses}" 
                               data-date="${dateStr}">${day}</div>`;
        }
        
        // Añadir días del mes siguiente para completar la última semana
        const totalDaysShown = firstDayOfWeek + lastDay.getDate();
        const remainingCells = 7 - (totalDaysShown % 7);
        if (remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                const nextMonthDay = new Date(year, month + 1, i);
                const dateStr = this.formatDateForInput(nextMonthDay);
                const isInRange = this.isDateInRange(nextMonthDay, rangeStart, rangeEnd);
                const rangeClasses = this.getRangeClasses(nextMonthDay, rangeStart, rangeEnd);
                
                calendarHTML += `<div class="day other-month ${isInRange ? 'in-range' : ''} ${rangeClasses}" 
                                   data-date="${dateStr}">${i}</div>`;
            }
        }
        
        // Cerrar estructura HTML
        calendarHTML += `
                </div>
            </div>
        `;
        
        // IMPORTANTE: Limpiar listeners antiguos antes de actualizar el HTML
        this.removeCalendarEventListeners();
        
        // Actualizar el HTML
        container.innerHTML = calendarHTML;
        
        // Guardar referencia al contenedor actual para limpiar listeners después
        this.currentCalendarContainer = container;
        
        // Añadir event listeners al nuevo contenido
        console.log("Agregando event listeners al nuevo contenido del calendario");
        this.addCalendarEventListeners(container);
    },
    
    /**
     * Encuentra el elemento colapsable padre más cercano
     */
    findCollapseParent(element) {
        let current = element;
        while (current && current !== document.body) {
            if (current.classList.contains('collapse')) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    },

    /**
     * Verifica si una fecha está dentro de un rango
     */
    isDateInRange(date, rangeStart, rangeEnd) {
        if (!rangeStart || !rangeEnd) return false;
        
        // Normalizar fechas para comparación
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
        const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
        
        return day >= start && day <= end;
    },

    /**
     * Obtiene las clases CSS para los puntos de inicio y fin de rango
     */
    getRangeClasses(date, rangeStart, rangeEnd) {
        if (!rangeStart || !rangeEnd) return '';
        
        // Normalizar fechas para comparación
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
        const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
        
        if (day.getTime() === start.getTime()) return 'range-start';
        if (day.getTime() === end.getTime()) return 'range-end';
        return '';
    },

    /**
     * Añade los event listeners al calendario
     */
    addCalendarEventListeners(container) {
        console.log("🔍 Iniciando asignación de event listeners al calendario");
        
        // IMPORTANTE: Eliminar completamente los listeners existentes primero
        this.removeCalendarEventListeners();
        
        // Delegación de eventos - un solo listener para todo el contenedor
        this.handleCalendarClick = (e) => {
            const target = e.target;
            
            // Encontrar qué elemento fue clickeado usando closest
            if (target.closest('.prev-month')) {
                console.log("🔄 Click en botón prev-month");
                e.preventDefault();
                e.stopPropagation();
                
                // Actualizar la fecha del calendario (mes anterior)
                const newDate = new Date(this.currentCalendarDate || new Date());
                newDate.setMonth(newDate.getMonth() - 1);
                this.currentCalendarDate = newDate;
                
                // Renderizar inmediatamente con la nueva fecha
                this.renderCalendarMonth(container);
                return;
            }
            
            if (target.closest('.next-month')) {
                console.log("🔄 Click en botón next-month");
                e.preventDefault();
                e.stopPropagation();
                
                // Actualizar la fecha del calendario (mes siguiente)
                const newDate = new Date(this.currentCalendarDate || new Date());
                newDate.setMonth(newDate.getMonth() + 1);
                this.currentCalendarDate = newDate;
                
                // Renderizar inmediatamente con la nueva fecha
                this.renderCalendarMonth(container);
                return;
            }
            
            if (target.closest('.today-btn')) {
                console.log("🔄 Click en botón today-btn");
                e.preventDefault();
                e.stopPropagation();
                
                // Actualizar la fecha del calendario (hoy)
                this.currentCalendarDate = new Date();
                
                // Renderizar inmediatamente con la fecha actual
                this.renderCalendarMonth(container);
                return;
            }
            
            if (target.closest('#month-view-btn')) {
                console.log("🔄 Click en botón month-view-btn");
                e.preventDefault();
                
                // Cambiar clases activas
                const weekViewBtn = container.querySelector('#week-view-btn');
                const monthViewBtn = container.querySelector('#month-view-btn');
                
                if (weekViewBtn) weekViewBtn.classList.remove('active');
                if (monthViewBtn) monthViewBtn.classList.add('active');
                
                // Renderizar la vista mensual
                this.renderCalendarMonth(container);
                return;
            }
            
            if (target.closest('#week-view-btn')) {
                console.log("🔄 Click en botón week-view-btn");
                e.preventDefault();
                
                // Cambiar clases activas
                const monthViewBtn = container.querySelector('#month-view-btn');
                const weekViewBtn = container.querySelector('#week-view-btn');
                
                if (monthViewBtn) monthViewBtn.classList.remove('active');
                if (weekViewBtn) weekViewBtn.classList.add('active');
                
                // Mostrar mensaje de feature en desarrollo
                container.innerHTML = `
                    <div class="simple-calendar">
                        <div class="calendar-header">
                            <div class="navigation-buttons">
                                <button class="btn btn-sm btn-outline-primary today-btn" title="Ir a hoy">
                                    Hoy
                                </button>
                                <button class="btn btn-sm btn-outline-secondary prev-week" title="Semana anterior">
                                    <i class="bi bi-chevron-left"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary next-week" title="Semana siguiente">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                            <h5 class="month-title mb-0">Vista Semanal</h5>
                            <div class="view-selectors">
                                <button class="btn btn-sm btn-outline-secondary" id="month-view-btn">Mes</button>
                                <button class="btn btn-sm btn-outline-secondary active" id="week-view-btn">Semana</button>
                            </div>
                        </div>
                        <div class="p-3 text-center">
                            <div class="alert alert-info mb-0">
                                <i class="bi bi-info-circle"></i> Vista semanal en desarrollo. Por favor, utilice la vista mensual.
                            </div>
                        </div>
                    </div>
                `;
                
                // Volver a añadir listeners al nuevo contenido
                this.addCalendarEventListeners(container);
                return;
            }
            
            // Manejo de clics en los días
            const day = target.closest('.day');
            if (day) {
                const dateStr = day.getAttribute('data-date');
                if (!dateStr) return;
                
                console.log(`🔄 Click en día: ${dateStr}`);
                
                // Marcar este día como seleccionado
                container.querySelectorAll('.day').forEach(d => {
                    d.classList.remove('selected');
                });
                day.classList.add('selected');
                
                // Actualizar los inputs de fecha
                const fromDateInput = document.getElementById('filter-from-date');
                const toDateInput = document.getElementById('filter-to-date');
                
                if (fromDateInput && toDateInput) {
                    fromDateInput.value = dateStr;
                    toDateInput.value = dateStr;
                    
                    // Aplicar filtros automáticamente
                    const filterForm = document.getElementById('filter-form');
                    if (filterForm) {
                        console.log("🔄 Aplicando filtros con nueva fecha");
                        filterForm.dispatchEvent(new Event('submit'));
                    }
                }
            }
        };
        
        // Añadir el listener principal para la delegación de eventos
        container.addEventListener('click', this.handleCalendarClick);
        
        // Configuración para selección de rango por arrastre
        this.isDragging = false;
        this.dragStartDate = null;
        this.lastHoveredDate = null;
        
        // Iniciar arrastre
        this.handleMouseDown = (e) => {
            const day = e.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            this.isDragging = true;
            this.dragStartDate = new Date(dateStr);
            this.lastHoveredDate = this.dragStartDate;
            
            // Evitar selección de texto durante arrastre
            e.preventDefault();
        };
        
        // Durante arrastre
        this.handleMouseOver = (e) => {
            if (!this.isDragging || !this.dragStartDate) return;
            
            const day = e.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            this.lastHoveredDate = new Date(dateStr);
            
            // Actualizar visualización de rango
            this.updateRangeSelection(container.querySelectorAll('.day'), this.dragStartDate, this.lastHoveredDate);
        };
        
        // Fin de arrastre (a nivel de documento)
        this.handleMouseUp = (e) => {
            if (!this.isDragging || !this.dragStartDate || !this.lastHoveredDate) return;
            
            // Ordenar fechas
            let startDate, endDate;
            if (this.dragStartDate <= this.lastHoveredDate) {
                startDate = this.dragStartDate;
                endDate = this.lastHoveredDate;
            } else {
                startDate = this.lastHoveredDate;
                endDate = this.dragStartDate;
            }
            
            // Actualizar inputs de fecha
            const fromDateInput = document.getElementById('filter-from-date');
            const toDateInput = document.getElementById('filter-to-date');
            
            if (fromDateInput && toDateInput) {
                fromDateInput.value = this.formatDateForInput(startDate);
                toDateInput.value = this.formatDateForInput(endDate);
                
                // Aplicar filtros automáticamente
                const filterForm = document.getElementById('filter-form');
                if (filterForm) {
                    console.log("🔄 Aplicando filtros con rango de fechas");
                    filterForm.dispatchEvent(new Event('submit'));
                }
            }
            
            // Resetear estado
            this.isDragging = false;
            this.dragStartDate = null;
            this.lastHoveredDate = null;
        };
        
        // Añadir listeners para arrastre
        container.addEventListener('mousedown', this.handleMouseDown);
        container.addEventListener('mouseover', this.handleMouseOver);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        console.log("✅ Event listeners del calendario configurados correctamente");
    },
    
    /**
     * Elimina los event listeners para evitar duplicaciones
     */
    removeCalendarEventListeners() {
        // Limpiar listener global de mouseup
        if (this.handleMouseUp) {
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
        
        // Si hay un contenedor actual con listeners, limpiarlos
        if (this.currentCalendarContainer) {
            if (this.handleCalendarClick) {
                this.currentCalendarContainer.removeEventListener('click', this.handleCalendarClick);
            }
            if (this.handleMouseDown) {
                this.currentCalendarContainer.removeEventListener('mousedown', this.handleMouseDown);
            }
            if (this.handleMouseOver) {
                this.currentCalendarContainer.removeEventListener('mouseover', this.handleMouseOver);
            }
        }
        
        // Resetear variables de estado
        this.isDragging = false;
        this.dragStartDate = null;
        this.lastHoveredDate = null;
        
        console.log("🧹 Event listeners anteriores eliminados");
    },

    /**
     * Actualiza la visualización de selección de rango durante el arrastre
     */
    updateRangeSelection(days, startDate, endDate) {
        // Ordenar las fechas si es necesario
        let rangeStart, rangeEnd;
        if (startDate <= endDate) {
            rangeStart = startDate;
            rangeEnd = endDate;
        } else {
            rangeStart = endDate;
            rangeEnd = startDate;
        }
        
        // Convertir a timestamps para comparación
        const startTime = rangeStart.getTime();
        const endTime = rangeEnd.getTime();
        
        // Actualizar visualización
        days.forEach(day => {
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            const dayDate = new Date(dateStr);
            const dayTime = dayDate.getTime();
            
            // Eliminar todas las clases relacionadas con rangos
            day.classList.remove('in-range', 'range-start', 'range-end');
            
            // Añadir clases apropiadas
            if (dayTime >= startTime && dayTime <= endTime) {
                day.classList.add('in-range');
                
                if (dayTime === startTime) {
                    day.classList.add('range-start');
                }
                
                if (dayTime === endTime) {
                    day.classList.add('range-end');
                }
            }
        });
    },

    /**
     * Configura los listeners de eventos
     */
    setupEventListeners() {
        // Esperar a que el DOM esté completamente cargado
        setTimeout(() => {
            // El código del calendario ha sido eliminado
            
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
                console.log("🔍 Encontrado formulario de reporte, configurando listener");
                reportForm.addEventListener('submit', (e) => {
                    console.log("🔹 Evento submit capturado en formulario de reporte");
                    e.preventDefault();
                    this.generateReport();
                });
            } else {
                console.warn("⚠️ No se encontró el formulario de reporte (#report-form)");
            }
            
            // Añadir también un listener directo al botón de generar reporte
            const generateReportBtn = document.querySelector('#report-form button[type="submit"]');
            if (generateReportBtn) {
                console.log("🔍 Encontrado botón de generar reporte, configurando listener directo");
                generateReportBtn.addEventListener('click', (e) => {
                    console.log("🔹 Click directo en botón de generar reporte");
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
            
            // Manejar evento del botón de edición masiva
            const bulkEditBtn = document.getElementById('bulk-edit-btn');
            if (bulkEditBtn) {
                bulkEditBtn.addEventListener('click', () => {
                    this.showBulkEditModal();
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
        // Si el módulo ReportFilters está disponible, usar su método
        if (typeof ReportFilters !== 'undefined') {
            ReportFilters.applyFilters();
            return;
        }
        
        // Implementación de respaldo si el módulo no está disponible
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
                const fields = FieldModel.getActive(); // Obtener todos para buscar por nombre

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
        const allFields = FieldModel.getActive();

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

        // Desactivar el desplazamiento automático al cambiar de página
        // const tableElement = document.getElementById('records-table');
        // if (tableElement) {
        //     tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // }
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

        // Asegurarse que el botón de edición masiva esté oculto inicialmente
        const bulkEditBtn = document.getElementById('bulk-edit-btn');
        if (bulkEditBtn) {
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
        const allFields = FieldModel.getActive();

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
        const allFields = FieldModel.getActive(); // Todos los campos para el selector de tipo
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

            const allFields = FieldModel.getActive();

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
        console.log("⭐ Iniciando generación de reporte");
        try {
            // Obtener los campos seleccionados (ahora puede ser múltiple)
            const reportFieldSelect = document.getElementById('report-field');
            console.log("🔍 Selector de campos:", reportFieldSelect);
            
            const selectedFields = reportFieldSelect ? Array.from(reportFieldSelect.selectedOptions).map(option => option.value) : [];
            console.log("🔍 Campos seleccionados:", selectedFields);
            
            const horizontalFieldId = document.getElementById('report-horizontal-field')?.value;
            console.log("🔍 ID de campo horizontal:", horizontalFieldId);
            
            const horizontalFieldOptionsElement = document.getElementById('horizontal-field-options');
            const horizontalFieldOption = horizontalFieldOptionsElement?.value; 
            console.log("🔍 Opción de campo horizontal:", horizontalFieldOption);
            
            const aggregation = document.getElementById('report-aggregation')?.value;
            console.log("🔍 Tipo de agregación:", aggregation);
            
            const reportForm = document.getElementById('report-form'); // Para mostrar alertas cerca
            console.log("🔍 Formulario de reporte encontrado:", !!reportForm);
    
            if (selectedFields.length === 0) {
                console.log("⚠️ No hay campos seleccionados para el reporte");
                // Verificar que reportForm existe antes de mostrar la alerta
                if (reportForm) {
                    UIUtils.showAlert('Seleccione al menos un campo para generar el reporte', 'warning', reportForm);
                } else {
                    console.warn('No se pudo mostrar alerta: El formulario de reporte no existe');
                }
                return;
            }
            
            console.log("✅ Campos seleccionados correctamente, continuando con generación");
    
            // Obtener filtros actuales
            const entityFilterSelect = document.getElementById('filter-entity');
            console.log("🔍 Selector de entidades:", entityFilterSelect);
            
            // Verificar si el selector de entidad existe antes de acceder a sus propiedades
            let entityFilter = [];
            if (entityFilterSelect) {
                const selectedEntities = Array.from(entityFilterSelect.selectedOptions || [])
                    .map(option => option.value);
                console.log("🔍 Entidades seleccionadas:", selectedEntities);
    
                // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
                entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                    ? []
                    : selectedEntities;
                console.log("🔍 Filtro de entidades:", entityFilter);
            }
    
            const fromDateFilter = document.getElementById('filter-from-date')?.value;
            const toDateFilter = document.getElementById('filter-to-date')?.value;
    
                        // Validar si hay una opción específica seleccionada
            let horizontalFieldOptionValue = null;
            let operarioFieldId = null;
            let specificEntityId = null;
            
            // Caso 1: Campo horizontal seleccionado (no es la entidad principal)
            if (horizontalFieldId && horizontalFieldOption) {
                console.log(`Filtrando por opción específica: ${horizontalFieldOption} en campo ${horizontalFieldId}`);
                horizontalFieldOptionValue = horizontalFieldOption;
                operarioFieldId = horizontalFieldId; // Guardamos el campo de operario para filtrar por él
            } 
            // Caso 2: Entidad Principal como eje horizontal y entidad específica seleccionada
            else if (horizontalFieldId === '' && horizontalFieldOption) {
                console.log(`Filtrando por entidad específica: ${horizontalFieldOption}`);
                // Si se seleccionó la entidad principal y una opción específica, filtrar por esa entidad
                specificEntityId = horizontalFieldOption;
                
                // Si ya hay filtros de entidad, sobrescribimos con la entidad específica
                if (entityFilter.length === 0) {
                    entityFilter = [specificEntityId];
                }
            }

            // Obtener campos adicionales para análisis detallado
            const additionalFieldsSelect = document.getElementById('additional-fields');
            let additionalFields = [];
            if (additionalFieldsSelect && horizontalFieldOptionValue) {
                additionalFields = Array.from(additionalFieldsSelect.selectedOptions || [])
                    .map(option => option.value)
                    .filter(id => id !== '');
                
                if (additionalFields.length > 0) {
                    console.log(`Campos adicionales seleccionados: ${additionalFields.join(', ')}`);
                }
            }
            
            // Usar la entidad específica si se seleccionó la entidad principal como eje
            const entityIdsToUse = specificEntityId && entityFilter.length === 0 ? 
                [specificEntityId] : (entityFilter.length > 0 ? entityFilter : undefined);
                
            const filters = {
                entityIds: entityIdsToUse,
                fromDate: fromDateFilter || undefined,
                toDate: toDateFilter || undefined,
                operarioFieldId: operarioFieldId, // Guardamos el ID del campo de operario para filtrado posterior
                operarioOption: horizontalFieldOptionValue, // El operario seleccionado
                additionalFields: additionalFields.length > 0 ? additionalFields : undefined, // Campos adicionales
                specificEntityId: specificEntityId // Nueva propiedad para entidad específica cuando se usa entidad principal
            };
    
            // Mostrar contenedor del reporte
            const reportContainer = document.getElementById('report-container');
            console.log("🔍 Buscando contenedor del reporte:", reportContainer);
            
            if (!reportContainer) {
                console.error("No se encontró el contenedor del reporte (#report-container)");
                return; // Salir si no existe el contenedor
            }
            
            console.log("✅ Contenedor de reporte encontrado, preparando para renderizar");
            
            // Limpiar el contenedor de reportes para los nuevos gráficos
            reportContainer.innerHTML = '';
            console.log("🧹 Contenedor de reporte limpiado");
            
            // Variable para almacenar todos los datos de los reportes
            const allReportsData = [];
            
            // Generar un reporte para cada campo seleccionado
            for (const fieldId of selectedFields) {
                // Generar datos del reporte para este campo
                const reportData = RecordModel.generateReportMultiple(fieldId, aggregation, filters, horizontalFieldId);
                
                if (reportData.error) {
                    console.error(`Error al generar reporte para campo ${fieldId}:`, reportData.error);
                    continue; // Continuar con el siguiente campo
                }
                
                // Guardar los datos para el resumen final
                allReportsData.push(reportData);
                
                            // Crear un div para este reporte específico
            const reportDiv = document.createElement('div');
            reportDiv.className = 'report-item mb-4';
            reportDiv.innerHTML = `
                <h5 class="mb-3">${reportData.field || 'Reporte'}</h5>
                <div class="row">
                    <div class="col-md-8">
                        <div class="chart-container" style="min-height: 400px; overflow-x: auto;">
                            <canvas id="report-chart-${fieldId}"></canvas>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div id="report-summary-${fieldId}"></div>
                    </div>
                </div>
            `;
                
                // Añadir al contenedor principal
                reportContainer.appendChild(reportDiv);
                
                // Crear gráfico para este campo
                if (ChartUtils) {
                    ChartUtils.createBarChart(`report-chart-${fieldId}`, reportData);
                    
                    // Crear tabla resumen para este campo
                    const summaryDiv = document.getElementById(`report-summary-${fieldId}`);
                    if (summaryDiv) {
                        summaryDiv.innerHTML = `
                            <h6 class="mb-2">Resumen</h6>
                            ${ChartUtils.createSummaryTable(reportData)}
                        `;
                        
                        // Si es un campo de tipo select, añadir el desglose por opciones
                        if (reportData.fieldType === 'select') {
                            const field = FieldModel.getById(fieldId);
                            
                            // Crear un objeto para almacenar el total de cada opción
                            const optionTotals = {};
                            
                            // Recorrer todas las entidades para sumar los conteos por opción
                            reportData.entities.forEach(entity => {
                                if (entity.optionCounts) {
                                    Object.entries(entity.optionCounts).forEach(([option, count]) => {
                                        optionTotals[option] = (optionTotals[option] || 0) + count;
                                    });
                                }
                            });
                            
                            // Crear tabla HTML con el desglose por opciones
                            let optionsTableHTML = `
                                <h6 class="mt-4 mb-2">Desglose por opciones</h6>
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Opción</th>
                                            <th>Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                            `;
                            
                            // Ordenar opciones por cantidad descendente
                            const sortedOptions = Object.entries(optionTotals)
                                .sort(([, countA], [, countB]) => countB - countA);
                                
                            // Añadir filas para cada opción
                            sortedOptions.forEach(([option, count]) => {
                                optionsTableHTML += `
                                    <tr>
                                        <td>${option}</td>
                                        <td>${count}</td>
                                    </tr>
                                `;
                            });
                            
                            optionsTableHTML += `
                                    </tbody>
                                </table>
                            `;
                            
                            // Añadir la tabla al resumen
                            summaryDiv.innerHTML += optionsTableHTML;
                        }
                    }
                }
            }
            
            // Sistema mejorado y simplificado de análisis multidimensional
            if (additionalFieldsSelect) {
                const additionalFields = Array.from(additionalFieldsSelect.selectedOptions || [])
                    .map(option => option.value)
                    .filter(id => id !== '');
                    
                // Si hay un operario específico seleccionado + campos adicionales
                if (horizontalFieldOption && additionalFields.length > 0) {
                    // Crear un título para la sección de análisis detallado
                    const detailTitle = document.createElement('div');
                    detailTitle.className = 'mt-5 mb-4 border-top pt-4';
                    
                    // Obtener la configuración para nombres personalizados
                    const config = StorageService.getConfig();
                    
                    // Determinar el texto a mostrar basado en si es entidad principal u otro campo
                    let fieldDisplayName, optionDisplayName;
                    
                    if (horizontalFieldId === '') {
                        // Es una entidad principal
                        fieldDisplayName = config.entityName || 'Entidad';
                        
                        // Obtener el nombre real de la entidad
                        const entityObj = EntityModel.getById(horizontalFieldOption);
                        optionDisplayName = entityObj ? entityObj.name : horizontalFieldOption;
                    } else {
                        // Es un campo normal
                        fieldDisplayName = FieldModel.getById(horizontalFieldId)?.name || 'Campo';
                        optionDisplayName = horizontalFieldOption;
                    }
                    
                    detailTitle.innerHTML = `
                        <h4 class="d-flex align-items-center">
                            <i class="bi bi-graph-up me-2"></i>
                            Análisis detallado de ${fieldDisplayName}: <span class="badge bg-primary ms-2">${optionDisplayName}</span>
                        </h4>
                        <p class="text-muted">Las siguientes gráficas muestran diferentes dimensiones de análisis para ${fieldDisplayName} seleccionado.</p>
                    `;
                    reportContainer.appendChild(detailTitle);
                    
                    // Para cada campo adicional, vamos a usarlo como eje horizontal
                    for (const additionalFieldId of additionalFields) {
                        const additionalField = FieldModel.getById(additionalFieldId);
                        if (!additionalField) continue;
                        
                        console.log(`Usando campo '${additionalField.name}' como eje horizontal para ${horizontalFieldOption}`);
                        
                        // Para cada campo seleccionado (como metros), creamos un reporte
                        for (const fieldId of selectedFields) {
                            const mainField = FieldModel.getById(fieldId);
                            if (!mainField) continue;
                            
                            // Filtrar solo registros para el operario seleccionado
                            const operarioFilters = {
                                entityIds: entityFilter.length > 0 ? entityFilter : undefined,
                                fromDate: fromDateFilter || undefined,
                                toDate: toDateFilter || undefined,
                                operarioFieldId: horizontalFieldId,
                                operarioOption: horizontalFieldOption
                            };
                            
                            try {
                                // Generar el reporte con campo adicional como eje horizontal
                                const reportData = RecordModel.generateReportMultiple(
                                    fieldId,                 // Campo principal (como metros)
                                    aggregation,             // Tipo de agregación
                                    operarioFilters,         // Filtros con operario específico 
                                    additionalFieldId        // Eje horizontal (como turnos)
                                );
                                
                                if (!reportData || reportData.error) {
                                    console.error(`Error al generar reporte detallado: ${reportData?.error || 'Datos no disponibles'}`);
                                    continue;
                                }
                                
                                // Verificar que hay datos para mostrar
                                if (!reportData.entities || reportData.entities.length === 0) {
                                    console.log(`No hay datos para mostrar en el reporte ${mainField.name} por ${additionalField.name}`);
                                    continue;
                                }
                                
                                // Crear un reporte visual
                                const detailReport = document.createElement('div');
                                detailReport.className = 'report-item mb-4 detail-report';
                                detailReport.innerHTML = `
                                    <div class="card shadow-sm">
                                        <div class="card-header bg-light">
                                            <h5 class="mb-0">
                                                <span class="badge bg-primary me-2">${horizontalFieldId === '' ? 
                                                    (EntityModel.getById(horizontalFieldOption)?.name || horizontalFieldOption) : 
                                                    horizontalFieldOption}</span>
                                                ${mainField.name} por ${additionalField.name}
                                            </h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-8">
                                                    <div class="chart-container" style="min-height: 350px; overflow-x: auto;">
                                                        <canvas id="detail-chart-${fieldId}-${additionalFieldId}"></canvas>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div id="detail-summary-${fieldId}-${additionalFieldId}"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                // Añadir el reporte al contenedor
                                reportContainer.appendChild(detailReport);
                                
                                // Crear el gráfico con etiquetas claras
                                const chartConfig = {
                                    type: 'bar',
                                    options: {
                                        scales: {
                                            x: {
                                                title: {
                                                    display: true,
                                                    text: additionalField.name
                                                }
                                            },
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: mainField.name
                                                },
                                                beginAtZero: true
                                            }
                                        },
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: `${mainField.name} de ${horizontalFieldId === '' ? 
                                                    (StorageService.getConfig().entityName || 'Entidad') : 
                                                    (FieldModel.getById(horizontalFieldId)?.name || 'Campo')} "${horizontalFieldId === '' ? 
                                                        (EntityModel.getById(horizontalFieldOption)?.name || horizontalFieldOption) : 
                                                        horizontalFieldOption}" por ${additionalField.name}`
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    title: (tooltipItems) => {
                                                        return `${additionalField.name}: ${tooltipItems[0].label}`;
                                                    },
                                                    label: (context) => {
                                                        return `${mainField.name}: ${ChartUtils.formatNumber(context.raw)}`;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                };
                                
                                // Generar el gráfico
                                ChartUtils.createBarChart(
                                    `detail-chart-${fieldId}-${additionalFieldId}`, 
                                    reportData, 
                                    chartConfig
                                );
                                
                                // Crear la tabla de resumen
                                const summaryDiv = document.getElementById(`detail-summary-${fieldId}-${additionalFieldId}`);
                                if (summaryDiv) {
                                    summaryDiv.innerHTML = `
                                        <h6 class="mb-3">Resumen de datos</h6>
                                        <div class="small text-muted mb-3">
                                            <span class="d-block mb-1">
                                                <i class="bi bi-person-fill me-1"></i> 
                                                ${horizontalFieldId === '' ? 
                                                    (StorageService.getConfig().entityName || 'Entidad') : 
                                                    (FieldModel.getById(horizontalFieldId)?.name || 'Campo')}: 
                                                <strong>${horizontalFieldId === '' ? 
                                                    (EntityModel.getById(horizontalFieldOption)?.name || horizontalFieldOption) : 
                                                    horizontalFieldOption}</strong>
                                            </span>
                                            <span class="d-block mb-1"><i class="bi bi-bar-chart-fill me-1"></i> Valor: <strong>${mainField.name}</strong></span>
                                            <span class="d-block mb-1"><i class="bi bi-grid-3x3-gap-fill me-1"></i> Distribución: <strong>${additionalField.name}</strong></span>
                                        </div>
                                        ${ChartUtils.createSummaryTable(reportData)}
                                    `;
                                }
                            } catch (error) {
                                console.error("Error generando reporte detallado:", error);
                            }
                        }
                    }
                }
            }
            
            // Mostrar el contenedor principal si hay al menos un reporte generado
            if (allReportsData.length > 0) {
                reportContainer.style.display = 'block';
                console.log("✅ Reporte generado y mostrado correctamente:", allReportsData);
            } else {
                reportContainer.style.display = 'none';
                console.log("⚠️ No se generaron datos para el reporte");
                if (reportForm) {
                    UIUtils.showAlert('No se pudo generar ningún reporte con los campos seleccionados', 'warning', reportForm);
                }
            }
            
            console.log("🏁 Proceso de generación de reporte finalizado");
        } catch (error) {
            console.error("❌ Error al generar el reporte:", error);
            console.error("Stack trace:", error.stack);
            // Intentar mostrar un mensaje de error en un contenedor que debe existir
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = 'Error al generar el reporte. Por favor, intente de nuevo.';
                
                // Buscar un lugar adecuado para mostrar el error
                const targetContainer = mainContent.querySelector('#report-form') || mainContent;
                targetContainer.prepend(errorDiv);
                
                // Eliminar después de unos segundos
                setTimeout(() => errorDiv.remove(), 5000);
            }
        }
    },
    setDateRange(range) {
        // Si el módulo ReportFilters está disponible, usar su método
        if (typeof ReportFilters !== 'undefined') {
            return ReportFilters.setDateRange(range);
        }
        
        // Implementación de respaldo si el módulo no está disponible
        // ... (código de setDateRange sin cambios, ya estaba correcto) ...
        const fromDateInput = document.getElementById('filter-from-date');
        const toDateInput = document.getElementById('filter-to-date');

        if (!fromDateInput || !toDateInput) return;

        // Resto del código original...
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
        // Si el módulo ReportFilters está disponible, usar su método
        if (typeof ReportFilters !== 'undefined') {
            return ReportFilters.formatDateForInput(date);
        }
        
        // Implementación de respaldo si el módulo no está disponible
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
     * Muestra el modal para editar fechas de registros seleccionados
     */
    showBulkEditModal() {
        const modal = UIUtils.initModal('bulkEditModal');
        if (!modal) {
            UIUtils.showAlert('Error al abrir el modal de edición en lote. Compruebe la consola para más detalles.', 'danger');
            return;
        }
        
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
        
        // Mostrar el modal de forma segura
        try {
            modal.show();
        } catch (error) {
            console.error("Error al mostrar el modal:", error);
            UIUtils.showAlert('Error al mostrar el modal de edición en lote.', 'danger');
        }
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
        // Si el módulo ReportFilters está disponible, usar su método
        if (typeof ReportFilters !== 'undefined') {
            return ReportFilters.filterByEntityGroup(groupName);
        }
        
        // Implementación de respaldo si el módulo no está disponible
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

    // Funciones de calendario eliminadas




    

    
    /**
     * Añade los event listeners al calendario
     */
    addCalendarEventListeners(container) {
        console.log("🔍 Iniciando asignación de event listeners al calendario");
        
        // Limpiar listeners existentes para evitar duplicaciones
        this.removeCalendarEventListeners(container);
        
        // Usar delegación de eventos para mayor eficiencia y robustez
        container.addEventListener('click', this.handleCalendarElementClick = (event) => {
            // Identificar qué elemento fue clickeado
            const target = event.target;
            const closestBtn = target.closest('button');
            
            // === MANEJO DE BOTONES DE NAVEGACIÓN ===
            if (closestBtn) {
                // Botón de mes anterior
                if (closestBtn.classList.contains('prev-month')) {
                    console.log("🔄 Click en 'Mes anterior'");
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Asegurar que tenemos fecha actual inicializada
                    if (!this.currentCalendarDate) {
                        this.currentCalendarDate = new Date();
                    }
                    
                    // Ir al mes anterior
                    const date = new Date(this.currentCalendarDate);
                    date.setMonth(date.getMonth() - 1);
                    this.currentCalendarDate = date;
                    
                    // Renderizar con delay para evitar problemas
                    setTimeout(() => {
                        this.renderCalendarMonth(container, date);
                    }, 10);
                    return;
                }
                
                // Botón de mes siguiente
                if (closestBtn.classList.contains('next-month')) {
                    console.log("🔄 Click en 'Mes siguiente'");
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Asegurar que tenemos fecha actual inicializada
                    if (!this.currentCalendarDate) {
                        this.currentCalendarDate = new Date();
                    }
                    
                    // Ir al mes siguiente
                    const date = new Date(this.currentCalendarDate);
                    date.setMonth(date.getMonth() + 1);
                    this.currentCalendarDate = date;
                    
                    // Renderizar con delay para evitar problemas
                    setTimeout(() => {
                        this.renderCalendarMonth(container, date);
                    }, 10);
                    return;
                }
                
                // Botón de hoy
                if (closestBtn.classList.contains('today-btn')) {
                    console.log("🔄 Click en 'Hoy'");
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Ir al mes actual
                    this.currentCalendarDate = new Date();
                    
                    // Renderizar con delay para evitar problemas
                    setTimeout(() => {
                        this.renderCalendarMonth(container, this.currentCalendarDate);
                    }, 10);
                    return;
                }
                
                // Botón de vista mensual
                if (closestBtn.id === 'month-view-btn') {
                    console.log("🔄 Click en 'Vista Mensual'");
                    event.preventDefault();
                    
                    // Cambiar clases activas
                    const weekViewBtn = container.querySelector('#week-view-btn');
                    if (weekViewBtn) weekViewBtn.classList.remove('active');
                    closestBtn.classList.add('active');
                    
                    // Renderizar vista mensual
                    setTimeout(() => {
                        this.renderCalendarMonth(container, this.currentCalendarDate);
                    }, 10);
                    return;
                }
                
                // Botón de vista semanal
                if (closestBtn.id === 'week-view-btn') {
                    console.log("🔄 Click en 'Vista Semanal'");
                    event.preventDefault();
                    
                    // Cambiar clases activas
                    const monthViewBtn = container.querySelector('#month-view-btn');
                    if (monthViewBtn) monthViewBtn.classList.remove('active');
                    closestBtn.classList.add('active');
                    
                    // Mostrar mensaje de feature en desarrollo
                    container.innerHTML = `
                        <div class="simple-calendar">
                            <div class="calendar-header">
                                <div class="navigation-buttons">
                                    <button class="btn btn-sm btn-outline-primary today-btn" title="Ir a hoy">
                                        Hoy
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary prev-week" title="Semana anterior">
                                        <i class="bi bi-chevron-left"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary next-week" title="Semana siguiente">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                                <h5 class="month-title mb-0">Vista Semanal</h5>
                                <div class="view-selectors">
                                    <button class="btn btn-sm btn-outline-secondary" id="month-view-btn">Mes</button>
                                    <button class="btn btn-sm btn-outline-secondary active" id="week-view-btn">Semana</button>
                                </div>
                            </div>
                            <div class="p-3 text-center">
                                <div class="alert alert-info mb-0">
                                    <i class="bi bi-info-circle"></i> Vista semanal en desarrollo. Por favor, utilice la vista mensual.
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Volver a añadir listeners al nuevo contenido
                    setTimeout(() => {
                        this.addCalendarEventListeners(container);
                    }, 10);
                    return;
                }
            }
            
            // === MANEJO DE DÍAS DEL CALENDARIO ===
            const day = target.closest('.day');
            if (day) {
                const dateStr = day.getAttribute('data-date');
                if (!dateStr) return;
                
                console.log(`🔄 Click en día: ${dateStr}`);
                
                // Marcar este día como seleccionado
                container.querySelectorAll('.day').forEach(d => {
                    d.classList.remove('selected');
                });
                day.classList.add('selected');
                
                // Actualizar los inputs de fecha del filtro
                const fromDateInput = document.getElementById('filter-from-date');
                const toDateInput = document.getElementById('filter-to-date');
                
                if (fromDateInput && toDateInput) {
                    fromDateInput.value = dateStr;
                    toDateInput.value = dateStr;
                    
                    // Aplicar filtros automáticamente
                    const filterForm = document.getElementById('filter-form');
                    if (filterForm) {
                        console.log("🔄 Aplicando filtros con nueva fecha");
                        filterForm.dispatchEvent(new Event('submit'));
                    }
                }
            }
        });
        
        // === SOPORTE PARA SELECCIÓN DE RANGO POR ARRASTRE ===
        let isDragging = false;
        let dragStartDate = null;
        let lastHoveredDate = null;
        
        // Iniciar arrastre
        container.addEventListener('mousedown', this.handleCalendarMouseDown = (event) => {
            const day = event.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            isDragging = true;
            dragStartDate = new Date(dateStr);
            lastHoveredDate = dragStartDate;
            
            // Evitar selección de texto durante el arrastre
            event.preventDefault();
        });
        
        // Durante arrastre
        container.addEventListener('mouseover', this.handleCalendarMouseOver = (event) => {
            if (!isDragging || !dragStartDate) return;
            
            const day = event.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            const currentDate = new Date(dateStr);
            lastHoveredDate = currentDate;
            
            // Actualizar visualización de rango
            this.updateRangeSelection(container.querySelectorAll('.day'), dragStartDate, currentDate);
        });
        
        // Finalizar arrastre (a nivel de documento para capturar eventos fuera del calendario)
        this.handleCalendarMouseUp = (event) => {
            if (!isDragging || !dragStartDate || !lastHoveredDate) return;
            
            // Ordenar fechas
            let startDate, endDate;
            if (dragStartDate <= lastHoveredDate) {
                startDate = dragStartDate;
                endDate = lastHoveredDate;
            } else {
                startDate = lastHoveredDate;
                endDate = dragStartDate;
            }
            
            // Actualizar inputs de fecha
            const fromDateInput = document.getElementById('filter-from-date');
            const toDateInput = document.getElementById('filter-to-date');
            
            if (fromDateInput && toDateInput) {
                fromDateInput.value = this.formatDateForInput(startDate);
                toDateInput.value = this.formatDateForInput(endDate);
                
                // Aplicar filtros automáticamente
                const filterForm = document.getElementById('filter-form');
                if (filterForm) {
                    console.log("🔄 Aplicando filtros con rango de fechas");
                    filterForm.dispatchEvent(new Event('submit'));
                }
            }
            
            // Resetear estado
            isDragging = false;
            dragStartDate = null;
            lastHoveredDate = null;
        };
        document.addEventListener('mouseup', this.handleCalendarMouseUp);
        
        console.log("✅ Event listeners del calendario configurados correctamente");
    },
    
    /**
     * Actualiza la visualización de selección de rango durante el arrastre
     */
    updateRangeSelection(days, startDate, endDate) {
        // Ordenar las fechas si es necesario
        let rangeStart, rangeEnd;
        if (startDate <= endDate) {
            rangeStart = startDate;
            rangeEnd = endDate;
        } else {
            rangeStart = endDate;
            rangeEnd = startDate;
        }
        
        // Convertir a timestamps para comparación
        const startTime = rangeStart.getTime();
        const endTime = rangeEnd.getTime();
        
        // Actualizar visualización
        days.forEach(day => {
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            const dayDate = new Date(dateStr);
            const dayTime = dayDate.getTime();
            
            // Eliminar todas las clases relacionadas con rangos
            day.classList.remove('in-range', 'range-start', 'range-end');
            
            // Añadir clases apropiadas
            if (dayTime >= startTime && dayTime <= endTime) {
                day.classList.add('in-range');
                
                if (dayTime === startTime) {
                    day.classList.add('range-start');
                }
                
                if (dayTime === endTime) {
                    day.classList.add('range-end');
                }
            }
        });
    },
    
    // Reemplazar métodos relacionados con FullCalendar
    initCalendarInstance() {
        // Este método ya no se usa, nos aseguramos de que no cause problemas si se llama
        console.log("Método obsoleto, usando renderSimpleCalendar en su lugar");
        this.renderSimpleCalendar();
    },
    
    loadAlternativeCalendar() {
        // Este método ya no se usa, nos aseguramos de que no cause problemas si se llama
        console.log("Método obsoleto, usando renderSimpleCalendar en su lugar");
        this.renderSimpleCalendar();
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

            const entities = EntityModel.getActive();
            // Mostrar todos los campos, no solo los numéricos
            const allFields = FieldModel.getActive();
            const sharedFields = FieldModel.getActive();

            // Formatear fechas
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStr = this.formatDateForInput(lastMonth);
            const today = this.formatDateForInput(new Date());

            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';

            const activeFields = FieldModel.getActive();
            const column3Field = activeFields.find(field => field.isColumn3);
            const column4Field = activeFields.find(field => field.isColumn4);
            const column5Field = activeFields.find(field => field.isColumn5);

            // Actualiza SelectedColumns al cargar si hay campos marcados
            this.selectedColumns.field1 = column3Field ? column3Field.id : '';
            this.selectedColumns.field2 = column4Field ? column4Field.id : '';
            this.selectedColumns.field3 = column5Field ? column5Field.id : '';

            const horizontalAxisField = activeFields.find(field => field.isHorizontalAxis);
            const compareField = activeFields.find(field => field.isCompareField);

            // --- HTML Template Reorganizado ---
            let filtersHtml = '';
            // Si el módulo ReportFilters está disponible, usarlo para renderizar la sección de filtros
            if (typeof ReportFilters !== 'undefined') {
                const filtersContainer = document.createElement('div');
                // Pasar this como la instancia de ReportsView para evitar el mensaje de error
                ReportFilters.renderFiltersSection(filtersContainer, this);
                filtersHtml = filtersContainer.innerHTML;
            } else {
                // Plantilla fallback por si el módulo no está disponible
                filtersHtml = `
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-funnel me-2"></i>Filtros y atajos</h5>
                            <div>
                                <button class="btn btn-sm btn-outline-light" type="button" data-bs-toggle="collapse" data-bs-target="#filtersCollapse" aria-expanded="true" aria-controls="filtersCollapse">
                                    <i class="bi bi-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                        <div class="collapse show" id="filtersCollapse">
                            <div class="card-body">
                                <form id="filter-form" class="mb-3">
                                    <div class="row g-3">
                                        <!-- Fechas y atajos -->
                                        <div class="col-lg-6">
                                            <div class="card border-light h-100">
                                                <div class="card-header bg-light py-2">
                                                    <h6 class="mb-0"><i class="bi bi-calendar-range me-2"></i>Rango de fechas</h6>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row g-2 mb-3">
                                                        <div class="col-md-6">
                                                            <label for="filter-from-date" class="form-label">Desde</label>
                                                            <input type="date" class="form-control" id="filter-from-date" value="${lastMonthStr}">
                                                        </div>
                                                        <div class="col-md-6">
                                                            <label for="filter-to-date" class="form-label">Hasta</label>
                                                            <input type="date" class="form-control" id="filter-to-date" value="${today}">
                                                        </div>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="form-label fw-medium">Atajos rápidos</label>
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
                                        </div>
                                        
                                        <!-- Entidades -->
                                        <div class="col-lg-6">
                                            <div class="card border-light h-100">
                                                <div class="card-header bg-light py-2">
                                                    <h6 class="mb-0"><i class="bi bi-building me-2"></i>${entityName}s</h6>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <select class="form-select" id="filter-entity" multiple size="5">
                                                            <option value="">Todas las ${entityName.toLowerCase()}s</option>
                                                            ${entities.map(entity =>
                                                                `<option value="${entity.id}">${entity.name}</option>`
                                                            ).join('')}
                                                        </select>
                                                        <div class="form-text">Mantenga presionado Ctrl (⌘ en Mac) para seleccionar múltiples ${entityName.toLowerCase()}s</div>
                                                    </div>
                                                    
                                                    ${(() => {
                                                        // Obtener todos los grupos de entidades
                                                        const groups = EntityModel.getActiveGroups();
                                                        if (groups.length === 0) return ''; // No mostrar sección si no hay grupos
                                                        
                                                        return `
                                                        <div class="mb-2">
                                                            <label class="form-label fw-medium">Filtrar por grupos</label>
                                                            <div class="d-flex flex-wrap gap-1">
                                                                ${groups.map(group => 
                                                                    `<button type="button" class="btn btn-sm btn-outline-info entity-group-filter" data-group="${group}">${group}</button>`
                                                                ).join('')}
                                                            </div>
                                                        </div>
                                                        `;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Botón de aplicar filtros -->
                                        <div class="col-12 text-end">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-search me-1"></i> Aplicar filtros
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const template = `
                <div class="container mt-4">
                    <h2>Reportes y Análisis</h2>

                    <!-- Filtros y atajos de fecha -->
                    ${filtersHtml}

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
                                                                <form id="report-form" class="mb-4">
                                    <div class="row g-3">
                                        <!-- Primera fila -->
                                        <div class="col-md-4">
                                            <label for="report-horizontal-field" class="form-label">Eje Horizontal</label>
                                            <select class="form-select" id="report-horizontal-field">
                                                <option value="">${entityName} Principal</option>
                                                ${sharedFields.map(field =>
                                                `<option value="${field.id}" data-field-type="${field.type || ''}" ${(horizontalAxisField && horizontalAxisField.id === field.id) ? 'selected' : ''}>${field.name}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                        
                                        <!-- Selector para opciones específicas del campo select -->
                                        <div class="col-md-4" id="horizontal-field-options-container" style="display: none;">
                                            <label for="horizontal-field-options" class="form-label">
                                                <span class="text-primary">
                                                    <i class="bi bi-filter-square"></i> Opciones específicas
                                                </span>
                                            </label>
                                            <select class="form-select" id="horizontal-field-options">
                                                <option value="">Todas las opciones</option>
                                                <!-- Las opciones se cargarán dinámicamente -->
                                            </select>
                                        </div>
                                        
                                        <div class="col-md-4">
                                            <label for="report-aggregation" class="form-label">Tipo de Agregación</label>
                                            <select class="form-select" id="report-aggregation">
                                                <option value="sum">Suma</option>
                                                <option value="average">Promedio</option>
                                            </select>
                                        </div>
                                        
                                        <!-- Segunda fila -->
                                        <div class="col-md-4">
                                            <label for="report-field" class="form-label">
                                                Campos a Comparar
                                                <span class="text-danger">*</span>
                                            </label>
                                            <select class="form-select" id="report-field" required multiple size="4">
                                                <option value="">Seleccione uno o más campos</option>
                                                ${allFields.map(field =>
                                                    `<option value="${field.id}" ${(compareField && compareField.id === field.id) ? 'selected' : ''}>${field.name}${field.type ? ` (${field.type})` : ''}</option>`
                                                ).join('')}
                                            </select>
                                            <div class="form-text">Mantenga presionado Ctrl (⌘ en Mac) para seleccionar múltiples campos</div>
                                        </div>
                                    
                                        <!-- Selector para métricas adicionales -->
                                        <div class="col-md-8" id="additional-fields-container" style="display: none;">
                                            <label for="additional-fields" class="form-label">
                                                <span class="text-success">
                                                    <i class="bi bi-graph-up"></i> Métricas adicionales para análisis detallado
                                                </span>
                                            </label>
                                            <select class="form-select" id="additional-fields" multiple size="4">
                                                <option value="">Seleccione campos adicionales</option>
                                                <!-- Las opciones se cargarán dinámicamente -->
                                            </select>
                                            <div class="form-text">
                                                <i class="bi bi-info-circle text-info me-1"></i>
                                                Estos campos permiten análisis multidimensional cuando seleccionas una opción específica
                                            </div>
                                        </div>
                                        
                                        <!-- Botón de generación -->
                                        <div class="col-12 mt-2">
                                            <button type="submit" class="btn btn-primary">
                                                <i class="bi bi-bar-chart-line me-1"></i> Generar Reporte
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                                            <div id="report-container" style="display: none; overflow-x: auto;">
                                <!-- Se ha añadido overflow-x: auto para permitir desplazamiento horizontal -->
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="chart-container" style="min-height: 400px; overflow-x: auto;">
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
                                <button id="bulk-edit-btn" class="btn btn-outline-light btn-sm me-2">
                                    <i class="bi bi-calendar-event"></i> Editar Fechas Seleccionadas
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
                    // Inicializar el módulo de filtros ahora que el DOM está listo
                    if (typeof ReportFilters !== 'undefined') {
                        // Inicializar con referencia a esta instancia
                        ReportFilters.init(this);
                        console.log("Módulo de filtros inicializado");
                    } else {
                        console.warn("Módulo ReportFilters no encontrado, usando funcionalidad integrada");
                        // Usar la configuración de eventos integrada si el módulo no está disponible
                        this.setupEventListeners();
                    }
                    
                    this.updateColumnHeaders();
                    this.applyFilters();
                    // Inicializar el calendario después de renderizar
                    this.setupCalendar();
                    // Configurar evento para mostrar/ocultar el selector de opciones de campo select
                    this.setupHorizontalFieldOptionsSelector();
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
        // ... (código para actualizar encabezados de columna) ...
    },

    /**
     * Configura el selector de opciones para campos tipo select en el eje horizontal
     */
    setupHorizontalFieldOptionsSelector() {
        const horizontalFieldSelect = document.getElementById('report-horizontal-field');
        const optionsContainer = document.getElementById('horizontal-field-options-container');
        const optionsSelect = document.getElementById('horizontal-field-options');
        const additionalFieldsContainer = document.getElementById('additional-fields-container');
        const additionalFieldsSelect = document.getElementById('additional-fields');
        
        if (!horizontalFieldSelect || !optionsContainer || !optionsSelect) {
            console.warn("No se encontraron los elementos del selector de opciones de campo horizontal");
            return;
        }
        
        console.log("Configurando selector de opciones horizontales");
        
        // Función para cargar las opciones del campo select seleccionado
        const loadFieldOptions = (fieldId) => {
            console.log("Cargando opciones para campo:", fieldId);
            
            // Si fieldId está vacío, es la opción de "Entidad Principal"
            if (fieldId === '') {
                console.log("Cargando opciones para Entidad Principal");
                
                // Limpiar opciones actuales
                optionsSelect.innerHTML = '<option value="">Todas las entidades</option>';
                
                // Cargar todas las entidades disponibles
                const entities = EntityModel.getActive();
                console.log("Entidades disponibles:", entities.length);
                
                if (entities && entities.length > 0) {
                    entities.forEach(entity => {
                        const optElement = document.createElement('option');
                        optElement.value = entity.id;
                        optElement.textContent = entity.name;
                        optionsSelect.appendChild(optElement);
                    });
                    
                    // Mostrar el contenedor de opciones
                    optionsContainer.style.display = 'block';
                    console.log("Contenedor de opciones para entidades mostrado");
                    return;
                } else {
                    // No hay entidades
                    optionsContainer.style.display = 'none';
                    if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
                    return;
                }
            }
            
            // Si no es la entidad principal, continuar con la lógica original
            if (!fieldId) {
                optionsContainer.style.display = 'none';
                if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
                return;
            }
            
            const field = FieldModel.getById(fieldId);
            console.log("Campo seleccionado:", field);
            
            if (!field) {
                console.warn("No se encontró el campo con ID:", fieldId);
                optionsContainer.style.display = 'none';
                return;
            }
            
            if (field.type !== 'select') {
                console.log("El campo no es de tipo select:", field.type);
                optionsContainer.style.display = 'none';
                if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
                return;
            }
            
            if (!field.options || field.options.length === 0) {
                console.warn("El campo no tiene opciones definidas");
                optionsContainer.style.display = 'none';
                return;
            }
            
            // Limpiar opciones actuales
            optionsSelect.innerHTML = '<option value="">Todas las opciones</option>';
            
            console.log("Añadiendo opciones:", field.options);
            
            // Añadir las opciones del campo select
            field.options.forEach(option => {
                const opt = typeof option === 'object' ? option : { value: option, active: true };
                if (opt.active === false) return;
                const optElement = document.createElement('option');
                optElement.value = opt.value;
                optElement.textContent = opt.value;
                optionsSelect.appendChild(optElement);
            });
            
            // Mostrar el contenedor de opciones
            optionsContainer.style.display = 'block';
            console.log("Contenedor de opciones mostrado");
        };
        
        // Función para cargar los campos adicionales disponibles para una entidad específica
        const loadAdditionalFields = () => {
            if (!additionalFieldsSelect) return;
            
            // Limpiar opciones actuales
            additionalFieldsSelect.innerHTML = '';
            
            // Obtener todos los campos disponibles excepto el seleccionado en eje horizontal
            const horizontalFieldId = horizontalFieldSelect.value;
            const allFields = FieldModel.getActive();
            
            // Filtrar campos relevantes para análisis (numéricos, fechas, selects)
            const relevantFields = allFields.filter(field => 
                field.id !== horizontalFieldId && 
                (field.type === 'number' || field.type === 'date' || field.type === 'select')
            );
            
            if (relevantFields.length === 0) {
                if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
                return;
            }
            
            // Agrupar campos por tipo para mejor organización
            const numericFields = relevantFields.filter(field => field.type === 'number');
            const dateFields = relevantFields.filter(field => field.type === 'date');
            const selectFields = relevantFields.filter(field => field.type === 'select');
            
            // Añadir campos numéricos primero (suelen ser los más útiles para análisis)
            if (numericFields.length > 0) {
                const numericGroup = document.createElement('optgroup');
                numericGroup.label = "Campos Numéricos";
                
                numericFields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field.id;
                    option.textContent = field.name;
                    numericGroup.appendChild(option);
                });
                
                additionalFieldsSelect.appendChild(numericGroup);
            }
            
            // Añadir campos de selección
            if (selectFields.length > 0) {
                const selectGroup = document.createElement('optgroup');
                selectGroup.label = "Campos de Selección";
                
                selectFields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field.id;
                    option.textContent = field.name;
                    selectGroup.appendChild(option);
                });
                
                additionalFieldsSelect.appendChild(selectGroup);
            }
            
            // Añadir campos de fecha
            if (dateFields.length > 0) {
                const dateGroup = document.createElement('optgroup');
                dateGroup.label = "Campos de Fecha";
                
                dateFields.forEach(field => {
                    const option = document.createElement('option');
                    option.value = field.id;
                    option.textContent = field.name;
                    dateGroup.appendChild(option);
                });
                
                additionalFieldsSelect.appendChild(dateGroup);
            }
            
            // Mostrar contenedor
            if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'block';
            console.log("Contenedor de métricas adicionales mostrado");
        };
        
        // Evento para cuando cambia el campo horizontal
        horizontalFieldSelect.addEventListener('change', (e) => {
            console.log("Campo horizontal cambiado");
            
            const selectedIndex = horizontalFieldSelect.selectedIndex;
            if (selectedIndex < 0) return;
            
            const selectedOption = horizontalFieldSelect.options[selectedIndex];
            console.log("Opción seleccionada:", selectedOption.textContent);
            
            const fieldType = selectedOption.getAttribute('data-field-type');
            console.log("Tipo de campo:", fieldType);
            
            const fieldId = horizontalFieldSelect.value;
            console.log("ID de campo:", fieldId);
            
            // Caso especial: valor vacío significa "Entidad Principal"
            if (fieldId === '') {
                console.log("Entidad Principal seleccionada como eje horizontal");
                loadFieldOptions('');  // Llamar con cadena vacía para manejar el caso especial
            }
            else if (fieldType === 'select' && fieldId) {
                loadFieldOptions(fieldId);
            } else {
                optionsContainer.style.display = 'none';
                if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
            }
        });
        
        // Evento para cuando se selecciona una opción específica
        optionsSelect.addEventListener('change', () => {
            console.log("Opción específica seleccionada:", optionsSelect.value);
            
            if (optionsSelect.value && optionsSelect.value !== '') {
                // Si se seleccionó una opción específica, mostrar campos adicionales
                loadAdditionalFields();
            } else {
                // Si se seleccionó "Todas las opciones", ocultar campos adicionales
                if (additionalFieldsContainer) additionalFieldsContainer.style.display = 'none';
            }
        });
        
        // IMPORTANTE: Verificar inicialmente si ya hay un campo seleccionado para cargar sus opciones
        console.log("Verificando selección inicial");
        if (horizontalFieldSelect.selectedIndex >= 0) {
            const initialSelectedOption = horizontalFieldSelect.options[horizontalFieldSelect.selectedIndex];
            console.log("Opción inicial seleccionada:", initialSelectedOption.textContent);
            
            const fieldType = initialSelectedOption.getAttribute('data-field-type');
            console.log("Tipo de campo inicial:", fieldType);
            
            const fieldId = horizontalFieldSelect.value;
            console.log("ID de campo inicial:", fieldId);
            
            // Caso especial: si se selecciona "Entidad Principal" (valor vacío)
            if (fieldId === '') {
                console.log("Entidad Principal seleccionada inicialmente");
                // Forzar un pequeño delay para asegurar que los selectores existen
                setTimeout(() => {
                    loadFieldOptions('');
                    
                    // Si ya hay una opción seleccionada, cargar campos adicionales
                    if (optionsSelect.value && optionsSelect.value !== '') {
                        loadAdditionalFields();
                    }
                }, 50);
            }
            else if (fieldType === 'select' && fieldId) {
                // Forzar un pequeño delay para asegurar que los selectores existen
                setTimeout(() => {
                    loadFieldOptions(fieldId);
                    
                    // Si ya hay una opción seleccionada, cargar campos adicionales
                    if (optionsSelect.value && optionsSelect.value !== '') {
                        loadAdditionalFields();
                    }
                }, 50);
            }
        }
    },

    /**
     * Genera automáticamente un informe al cargar la página si hay datos disponibles
     */
    autoGenerateReport() {
        try {
            // Verificar si hay campos disponibles para generar un reporte
            const allFields = FieldModel.getActive();
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
                const compareField = FieldModel.getActive().find(field => field.isCompareField);

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
}; // Fin del objeto ReportsView

/**
 * Evita la duplicación de contenido al actualizar elementos del DOM
 * @param {string|Element} selector - Selector CSS o elemento DOM a actualizar
 * @param {string|Function} content - HTML para insertar o función que devuelve HTML
 * @param {boolean} append - Si es true, añade al final; si es false, reemplaza contenido
 */
function safeUpdateContent(selector, content, append = false) {
    // Obtener el elemento, ya sea por selector o directamente
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    
    // Verificar que el elemento existe
    if (!element) {
        console.warn(`Elemento no encontrado: ${typeof selector === 'string' ? selector : 'Elemento DOM'}`);
        return;
    }
    
    // Determinar el contenido a insertar
    const htmlContent = typeof content === 'function' ? content() : content;
    
    // Si no es modo append, limpiar el contenido existente
    if (!append) {
        element.innerHTML = '';
    }
    
    // Insertar el nuevo contenido
    element.insertAdjacentHTML(append ? 'beforeend' : 'afterbegin', htmlContent);
}

// Ejemplo de uso:
// safeUpdateContent('#info-message-container', '<div class="alert alert-info">Mensaje de información</div>');
// safeUpdateContent(document.getElementById('info-message-container'), () => `<div class="alert alert-info">Mensaje generado a las ${new Date().toLocaleTimeString()}</div>`);
