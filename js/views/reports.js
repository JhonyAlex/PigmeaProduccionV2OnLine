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
            
            // Reiniciar estado al inicializar. Esto should happen when the view is being set up.
            this.pagination = { currentPage: 1, itemsPerPage: 20 };
            this.sorting = { column: 'timestamp', direction: 'desc' };
            this.selectedColumns = { field1: '', field2: '', field3: '' };
            this.filteredRecords = null;
            this.searchedRecords = null;

            // The main render() call is expected to be handled by the Router.
            // this.render() is removed from here to prevent double rendering.

            // Generar automáticamente el reporte al cargar la página.
            // This can be part of init, assuming render() has already been called by the router.
            // A timeout ensures it runs after the current execution stack,
            // giving DOM a chance to be ready from router's render call.
            setTimeout(() => {
                // Verify mainContent exists, as autoGenerateReport might depend on it.
                const mainContent = document.querySelector('.main-content');
                if (!mainContent || mainContent.innerHTML.trim() === '') {
                    console.warn("ReportsView.init: main-content not found or empty. autoGenerateReport might be affected.");
                }
                this.autoGenerateReport();
            }, 100); // Delay to allow router's render and its internal setTimeout(0) to complete.

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
    renderCalendarMonth(container, dateToRender) { // Added dateToRender parameter
        // Ensure this.currentCalendarDate is updated if dateToRender is provided
        if (dateToRender) {
            this.currentCalendarDate = dateToRender;
        }

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
        
        // Limpiar listeners existentes para evitar duplicaciones
        // Ensure this.removeCalendarEventListeners is correctly implemented and possibly takes container
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
     * Elimina los event listeners del calendario para evitar fugas de memoria
     */
    removeCalendarEventListeners(container) {
        // If specific handlers are stored on 'this', remove them from the specific container or document
        if (container && this.handleCalendarElementClick) {
            container.removeEventListener('click', this.handleCalendarElementClick);
            // this.handleCalendarElementClick = null; // Optional: nullify if re-created each time
        }
        if (container && this.handleCalendarMouseDown) {
            container.removeEventListener('mousedown', this.handleCalendarMouseDown);
            // this.handleCalendarMouseDown = null;
        }
        if (container && this.handleCalendarMouseOver) {
            container.removeEventListener('mouseover', this.handleCalendarMouseOver);
            // this.handleCalendarMouseOver = null;
        }
        // mouseup is on document
        if (this.handleCalendarMouseUp) {
            document.removeEventListener('mouseup', this.handleCalendarMouseUp);
            // this.handleCalendarMouseUp = null; 
        }

        // If using a general container reference like this.currentCalendarContainer
        const calContainer = container || this.currentCalendarContainer;
        if (calContainer && calContainer._calendarClickHandler) {
             calContainer.removeEventListener('click', calContainer._calendarClickHandler);
             calContainer._calendarClickHandler = null;
        }
        // Add similar for mousedown, mouseover if they were attached that way

        console.log("🧹 Listeners del calendario eliminados/preparados para limpieza.");
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
        
        // Limpiar listeners existentes para evitar duplicaciones
        // Ensure this.removeCalendarEventListeners is correctly implemented and posiblemente takes container
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
     * Elimina los event listeners del calendario para evitar fugas de memoria
     */
    removeCalendarEventListeners(container) {
        // If specific handlers are stored on 'this', remove them from the specific container or document
        if (container && this.handleCalendarElementClick) {
            container.removeEventListener('click', this.handleCalendarElementClick);
            // this.handleCalendarElementClick = null; // Optional: nullify if re-created each time
        }
        if (container && this.handleCalendarMouseDown) {
            container.removeEventListener('mousedown', this.handleCalendarMouseDown);
            // this.handleCalendarMouseDown = null;
        }
        if (container && this.handleCalendarMouseOver) {
            container.removeEventListener('mouseover', this.handleCalendarMouseOver);
            // this.handleCalendarMouseOver = null;
        }
        // mouseup is on document
        if (this.handleCalendarMouseUp) {
            document.removeEventListener('mouseup', this.handleCalendarMouseUp);
            // this.handleCalendarMouseUp = null; 
        }

        // If using a general container reference like this.currentCalendarContainer
        const calContainer = container || this.currentCalendarContainer;
        if (calContainer && calContainer._calendarClickHandler) {
             calContainer.removeEventListener('click', calContainer._calendarClickHandler);
             calContainer._calendarClickHandler = null;
        }
        // Add similar for mousedown, mouseover if they were attached that way

        console.log("🧹 Listeners del calendario eliminados/preparados para limpieza.");
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
        
        // Limpiar listeners existentes para evitar duplicaciones
        // Ensure this.removeCalendarEventListeners is correctly implemented and posiblemente takes container
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
        
        // Limpiar listeners existentes para evitar duplicaciones
        // Ensure this.removeCalendarEventListeners is correctly implemented and posiblemente takes container
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
    }, // Esta coma es correcta si applyFilters es el siguiente método

    /**
     * Aplica los filtros seleccionados a los registros (stub para evitar error)
     */
    applyFilters() {
        // Implementa aquí la lógica real de filtrado de registros.
        // Por ahora, solo muestra un log para evitar el error.
        console.log("applyFilters() llamado (stub). Implementa la lógica real aquí.");
    } // No debe haber coma aquí si este es el último método del objeto ReportsView
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