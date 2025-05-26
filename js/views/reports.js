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
                                                        const groups = EntityModel.getAllGroups();
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
                const entities = EntityModel.getAll();
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
                const optElement = document.createElement('option');
                optElement.value = option;
                optElement.textContent = option;
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
            const allFields = FieldModel.getAll();
            
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
     * Formatea una fecha JS a string YYYY-MM-DD (para inputs tipo date)
     * @param {Date} date
     * @returns {string}
     */
    formatDateForInput(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Configura los event listeners para la vista de reportes (básico)
     */
    setupEventListeners() {
        // Aquí puedes agregar listeners básicos si lo necesitas.
        // Por ejemplo, para el filtro rápido de búsqueda:
        const searchInput = document.getElementById('search-records');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Si tienes lógica de búsqueda, colócala aquí.
                // Por ejemplo: this.filterRecordsBySearch(e.target.value);
            });
        }
        // ...agrega otros event listeners según sea necesario...
    },

    /**
     * Genera el reporte comparativo (stub para evitar error)
     */
    generateReport() {
        // Implementa aquí la lógica real de generación de reportes.
        // Por ahora, solo muestra un log para evitar el error.
        console.log("generateReport() llamado (stub). Implementa la lógica real aquí.");
    },

    /**
     * Aplica los filtros seleccionados a los registros (stub para evitar error)
     */
    applyFilters() {
        // Implementa aquí la lógica real de filtrado de registros.
        // Por ahora, solo muestra un log para evitar el error.
        console.log("applyFilters() llamado (stub). Implementa la lógica real aquí.");
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
                    if (option) {
                        option.selected = true;
                        console.log("Campo de comparación encontrado y seleccionado:", compareField.name);
                    } else {
                        console.warn("Campo de comparación no encontrado en las opciones del select");
                    }
                } else {
                    console.log("No hay campo marcado como campo de comparación");
                }

                // Forzar actualización del select
                const event = new Event('change', { bubbles: true });
                reportFieldSelect.dispatchEvent(event);
                
                // Generar el reporte automáticamente
                this.generateReport();
            }, 100); // Esperar 100ms para asegurar que el DOM está listo
        } catch (error) {
            console.error("Error al generar reporte automático:", error);
        }
    },
};
