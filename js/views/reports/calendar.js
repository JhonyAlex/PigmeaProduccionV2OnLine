/**
 * Módulo para la funcionalidad del calendario en la vista de reportes
 */

/**
 * Configura las funciones de calendario en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupCalendarFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con el calendario al objeto ReportsView
    
    /**
     * Carga estilos de calendario localmente para evitar problemas con CDN
     */
    ReportsView.loadLocalCalendarStyles = function() {
        // Insertar estilos mínimos para calendario directamente
        const calendarStyles = document.createElement('style');
        calendarStyles.textContent = `
            /* Estilos mínimos para calendario local */
            .simple-calendar {
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background-color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .simple-calendar .calendar-header {
                background-color: #f8f9fa;
                padding: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #ddd;
            }
            .simple-calendar .calendar-header .month-title {
                font-size: 1.1rem;
                font-weight: 500;
                color: #333;
                margin: 0;
            }
            .simple-calendar .calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                text-align: center;
            }
            .simple-calendar .calendar-days .day-name {
                background-color: #f5f5f5;
                padding: 10px 0;
                font-weight: 500;
                font-size: 0.9em;
                border-bottom: 1px solid #eee;
            }
            .simple-calendar .calendar-days .day {
                padding: 10px 5px;
                height: 42px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                border: 1px solid #f0f0f0;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .simple-calendar .calendar-days .day:hover {
                background-color: #f5f9ff;
                box-shadow: inset 0 0 0 1px #d5e6ff;
            }
            .simple-calendar .calendar-days .day.today {
                background-color: #ecf4fe;
                font-weight: bold;
                color: #3788d8;
                position: relative;
            }
            .simple-calendar .calendar-days .day.today:after {
                content: '';
                position: absolute;
                bottom: 4px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: #3788d8;
            }
            .simple-calendar .calendar-days .day.selected {
                background-color: #e4efff;
                box-shadow: inset 0 0 0 2px #3788d8;
            }
            .simple-calendar .calendar-days .day.other-month {
                color: #aaa;
                background-color: #f8f8f8;
            }
            .simple-calendar .btn {
                transition: all 0.2s ease;
            }
            .simple-calendar .btn:active {
                transform: scale(0.95);
            }
            .simple-calendar .btn:focus {
                box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
            }
            /* Rangos de selección */
            .simple-calendar .calendar-days .day.in-range {
                background-color: #e9f2ff;
            }
            .simple-calendar .calendar-days .day.range-start {
                background-color: #3788d8;
                color: white;
                border-radius: 4px 0 0 4px;
            }
            .simple-calendar .calendar-days .day.range-end {
                background-color: #3788d8;
                color: white;
                border-radius: 0 4px 4px 0;
            }
            /* Botones de navegación */
            .simple-calendar .navigation-buttons {
                display: flex;
                gap: 5px;
            }
            .simple-calendar .navigation-buttons .today-btn {
                margin-right: 10px;
            }
            /* Selectores de vista */
            .simple-calendar .view-selectors {
                display: flex;
                margin-left: auto;
                gap: 5px;
            }
        `;
        document.head.appendChild(calendarStyles);
    };

    /**
     * Configura el calendario al inicializar
     */
    ReportsView.setupCalendar = function() {
        console.log("Configurando calendario local");
        try {
            const calendarEl = document.getElementById('date-calendar');
            if (!calendarEl) {
                console.error("Elemento 'date-calendar' no encontrado");
                return;
            }
            
            // Limpiar contenido existente
            calendarEl.innerHTML = '<div class="text-center p-3"><i class="bi bi-hourglass-split me-2"></i>Cargando calendario...</div>';
            
            // Verificar si ya existe un calendario y limpiarlo
            if (this.currentCalendarContainer) {
                this.removeCalendarEventListeners(this.currentCalendarContainer);
            }
            
            // Inicializar el calendario con la fecha actual
            this.currentCalendarDate = new Date();
            
            // Usar setTimeout para asegurar que el DOM esté listo
            setTimeout(() => {
                // Diagnosticar el DOM antes de intentar renderizar
                this.diagnoseCalendarDOM(calendarEl);
                
                // Renderizar el calendario
                this.renderLocalCalendar();
            }, 50);
        } catch (error) {
            console.error("Error al configurar el calendario:", error);
            // Intentar mostrar un mensaje de error en el elemento del calendario
            const calendarEl = document.getElementById('date-calendar');
            if (calendarEl) {
                calendarEl.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Error al cargar el calendario: ${error.message}
                    </div>
                `;
            }
        }
    };

    /**
     * Diagnostica el estado del DOM relacionado con el calendario
     */
    ReportsView.diagnoseCalendarDOM = function(container) {
        console.log("=== DIAGNÓSTICO DEL CALENDARIO ===");
        console.log("Contenedor del calendario:", container);
        console.log("ID del contenedor:", container.id);
        console.log("Visible:", container.offsetWidth > 0 && container.offsetHeight > 0);
        console.log("Dimensiones:", container.offsetWidth, "x", container.offsetHeight);
        console.log("Padres:", this.getParentChain(container));
        console.log("================================");
    };
    
    /**
     * Obtiene la cadena de elementos padre para diagnóstico
     */
    ReportsView.getParentChain = function(element) {
        let chain = [];
        let current = element;
        
        while (current && current !== document.body) {
            let id = current.id ? `#${current.id}` : '';
            let classes = current.className ? `.${current.className.replace(/\s+/g, '.')}` : '';
            let tag = current.tagName.toLowerCase();
            
            chain.push(`${tag}${id}${classes}`);
            current = current.parentElement;
        }
        
        return chain.join(' > ');
    };

    /**
     * Renderiza un calendario local completo
     */
    ReportsView.renderLocalCalendar = function() {
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
    };
    
    /**
     * Verifica que los botones del calendario se hayan creado correctamente
     */
    ReportsView.verifyCalendarButtons = function(container) {
        const prevBtn = container.querySelector('.prev-month');
        const nextBtn = container.querySelector('.next-month');
        const todayBtn = container.querySelector('.today-btn');
        
        console.log("=== VERIFICACIÓN DE BOTONES DEL CALENDARIO ===");
        console.log("Botón prev-month:", prevBtn ? "Encontrado" : "NO ENCONTRADO");
        console.log("Botón next-month:", nextBtn ? "Encontrado" : "NO ENCONTRADO");
        console.log("Botón today-btn:", todayBtn ? "Encontrado" : "NO ENCONTRADO");
        
        if (prevBtn) {
            console.log("Eventos en prev-month:", this.getEventListeners(prevBtn));
        }
        if (nextBtn) {
            console.log("Eventos en next-month:", this.getEventListeners(nextBtn));
        }
        if (todayBtn) {
            console.log("Eventos en today-btn:", this.getEventListeners(todayBtn));
        }
        console.log("==========================================");
        
        // Si faltan botones, intentar reparar
        if (!prevBtn || !nextBtn || !todayBtn) {
            console.warn("Faltan botones de navegación, intentando reparar...");
            this.renderCalendarMonth(container, this.currentCalendarDate);
        }
    };
    
    /**
     * Intenta obtener información sobre los event listeners (limitado en navegadores)
     */
    ReportsView.getEventListeners = function(element) {
        // Esta es una aproximación simple ya que no podemos acceder directamente a los listeners
        if (!element) return "Elemento no existe";
        
        const clickable = element.getAttribute('onclick') || 
                        element.getAttribute('data-bs-toggle') || 
                        element.classList.contains('btn');
        
        const visible = element.offsetWidth > 0 && element.offsetHeight > 0;
        const enabled = !element.disabled && !element.classList.contains('disabled');
        
        return {
            esClickable: clickable,
            visible: visible,
            habilitado: enabled,
            clases: element.className
        };
    };

    /**
     * Renderiza el mes actual en el calendario
     */
    ReportsView.renderCalendarMonth = function(container, date) {
        console.log("Renderizando calendario para", date);
        
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
                setTimeout(() => this.renderCalendarMonth(container, date), 350);
                return;
            }
        }
        
        if (!date) {
            date = this.currentCalendarDate || new Date();
            console.warn("No se proporcionó fecha, usando", date);
        }
        
        // Asegurarse de que date sea un objeto Date válido
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.warn("Fecha inválida proporcionada, usando fecha actual");
            date = new Date();
        }
        
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
        
        // Guardar la fecha actual para referencia futura
        this.currentCalendarDate = new Date(date);
        
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
        
        // Insertar calendario en el elemento
        console.log("Actualizando HTML del calendario");
        
        // Importante: Limpiar listeners antiguos antes de actualizar el HTML
        this.removeCalendarEventListeners(container);
        
        // Actualizar el HTML
        container.innerHTML = calendarHTML;
        
        // Añadir event listeners al nuevo contenido
        console.log("Agregando event listeners al nuevo contenido del calendario");
        this.addCalendarEventListeners(container);
        
        // Verificar después del renderizado que todo está correcto
        setTimeout(() => {
            this.verifyCalendarButtons(container);
        }, 50);
    };
    
    /**
     * Encuentra el elemento colapsable padre más cercano
     */
    ReportsView.findCollapseParent = function(element) {
        let current = element;
        while (current && current !== document.body) {
            if (current.classList.contains('collapse')) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    };

    /**
     * Verifica si una fecha está dentro de un rango
     */
    ReportsView.isDateInRange = function(date, rangeStart, rangeEnd) {
        if (!rangeStart || !rangeEnd) return false;
        
        // Normalizar fechas para comparación
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
        const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
        
        return day >= start && day <= end;
    };

    /**
     * Obtiene las clases CSS para los puntos de inicio y fin de rango
     */
    ReportsView.getRangeClasses = function(date, rangeStart, rangeEnd) {
        if (!rangeStart || !rangeEnd) return '';
        
        // Normalizar fechas para comparación
        const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
        const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());
        
        if (day.getTime() === start.getTime()) return 'range-start';
        if (day.getTime() === end.getTime()) return 'range-end';
        return '';
    };

    /**
     * Añade los event listeners al calendario
     */
    ReportsView.addCalendarEventListeners = function(container) {
        console.log("Agregando event listeners al calendario");
        
        // ¡IMPORTANTE! Eliminar listeners existentes para evitar duplicación
        this.removeCalendarEventListeners(container);
        
        // Usaremos delegación de eventos en vez de asignarlos directamente a cada botón
        // Esto funciona incluso si los elementos son reemplazados
        container.addEventListener('click', this.handleCalendarClick = (e) => {
            // Encontrar el elemento más cercano que coincida con uno de nuestros selectores
            const prevMonthBtn = e.target.closest('.prev-month');
            const nextMonthBtn = e.target.closest('.next-month');
            const todayBtn = e.target.closest('.today-btn');
            const monthViewBtn = e.target.closest('#month-view-btn');
            const weekViewBtn = e.target.closest('#week-view-btn');
            
            // Navegar al mes anterior
            if (prevMonthBtn) {
                console.log("Click en botón prev-month");
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.currentCalendarDate) {
                    this.currentCalendarDate = new Date();
                }
                
                const date = new Date(this.currentCalendarDate);
                date.setMonth(date.getMonth() - 1);
                this.currentCalendarDate = date;
                
                // Renderizar con un pequeño retraso para asegurar que el evento actual termine
                setTimeout(() => {
                    this.renderCalendarMonth(container, date);
                }, 10);
                
                return false;
            }
            
            // Navegar al mes siguiente
            if (nextMonthBtn) {
                console.log("Click en botón next-month");
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.currentCalendarDate) {
                    this.currentCalendarDate = new Date();
                }
                
                const date = new Date(this.currentCalendarDate);
                date.setMonth(date.getMonth() + 1);
                this.currentCalendarDate = date;
                
                // Renderizar con un pequeño retraso para asegurar que el evento actual termine
                setTimeout(() => {
                    this.renderCalendarMonth(container, date);
                }, 10);
                
                return false;
            }
            
            // Ir a hoy
            if (todayBtn) {
                console.log("Click en botón today-btn");
                e.preventDefault();
                e.stopPropagation();
                
                this.currentCalendarDate = new Date();
                
                // Renderizar con un pequeño retraso para asegurar que el evento actual termine
                setTimeout(() => {
                    this.renderCalendarMonth(container, this.currentCalendarDate);
                }, 10);
                
                return false;
            }
            
            // Cambiar a vista mensual
            if (monthViewBtn) {
                e.preventDefault();
                
                // Actualizar clases para reflejar la selección
                const weekViewBtnElement = container.querySelector('#week-view-btn');
                if (weekViewBtnElement) weekViewBtnElement.classList.remove('active');
                monthViewBtn.classList.add('active');
                
                // Renderizar con un pequeño retraso
                setTimeout(() => {
                    this.renderCalendarMonth(container, this.currentCalendarDate);
                }, 10);
                
                return false;
            }
            
            // Cambiar a vista semanal
            if (weekViewBtn) {
                e.preventDefault();
                
                // Actualizar clases para reflejar la selección
                const monthViewBtnElement = container.querySelector('#month-view-btn');
                if (monthViewBtnElement) monthViewBtnElement.classList.remove('active');
                weekViewBtn.classList.add('active');
                
                // Aquí podríamos implementar una vista semanal si fuera necesario
                // Por ahora, mostramos un mensaje
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
                
                // Volver a añadir listeners
                this.addCalendarEventListeners(container);
                return false;
            }
        });
        
        // Eventos para los días
        const days = container.querySelectorAll('.day');
        let isDragging = false;
        let dragStartDate = null;
        let lastHoveredDate = null;
        
        // Delegación de eventos para los días también
        container.addEventListener('click', this.handleDayClick = (e) => {
            const day = e.target.closest('.day');
            if (!day) return; // No es un clic en un día
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr || isDragging) return;
            
            // Marcar día seleccionado
            container.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            day.classList.add('selected');
            
            // Actualizar inputs de fecha
            const fromDateInput = document.getElementById('filter-from-date');
            const toDateInput = document.getElementById('filter-to-date');
            
            if (fromDateInput && toDateInput) {
                fromDateInput.value = dateStr;
                toDateInput.value = dateStr;
                
                // Aplicar filtros automáticamente
                const filterForm = document.getElementById('filter-form');
                if (filterForm) {
                    filterForm.dispatchEvent(new Event('submit'));
                }
            }
        });
        
        container.addEventListener('mousedown', this.handleDayMouseDown = (e) => {
            const day = e.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            // Iniciar arrastre
            isDragging = true;
            dragStartDate = new Date(dateStr);
            lastHoveredDate = dragStartDate;
            
            // Evitar selección de texto durante el arrastre
            e.preventDefault();
        });
        
        container.addEventListener('mouseover', this.handleDayMouseOver = (e) => {
            if (!isDragging || !dragStartDate) return;
            
            const day = e.target.closest('.day');
            if (!day) return;
            
            const dateStr = day.getAttribute('data-date');
            if (!dateStr) return;
            
            const currentDate = new Date(dateStr);
            lastHoveredDate = currentDate;
            
            // Actualizar visualización de rango
            this.updateRangeSelection(container.querySelectorAll('.day'), dragStartDate, currentDate);
        });
        
        // Manejo del fin del arrastre - almacenamos referencia para poder eliminarla después
        this.mouseUpHandler = (e) => {
            if (isDragging && dragStartDate && lastHoveredDate) {
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
                        filterForm.dispatchEvent(new Event('submit'));
                    }
                }
                
                // Actualizar la visualización del calendario para reflejar el rango seleccionado
                this.renderCalendarMonth(container, this.currentCalendarDate);
            }
            
            // Resetear estado de arrastre
            isDragging = false;
            dragStartDate = null;
            lastHoveredDate = null;
        };
        
        document.addEventListener('mouseup', this.mouseUpHandler);
        
        // Guardar referencia al contenedor para limpiar listeners después
        this.currentCalendarContainer = container;
    };

    /**
     * Elimina los event listeners actuales del calendario para evitar duplicaciones
     */
    ReportsView.removeCalendarEventListeners = function(container) {
        // Limpiar listener global de mouseup
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
            this.mouseUpHandler = null;
        }
        
        // Limpiar listeners de delegación
        if (container) {
            if (this.handleCalendarClick) container.removeEventListener('click', this.handleCalendarClick);
            if (this.handleDayClick) container.removeEventListener('click', this.handleDayClick);
            if (this.handleDayMouseDown) container.removeEventListener('mousedown', this.handleDayMouseDown);
            if (this.handleDayMouseOver) container.removeEventListener('mouseover', this.handleDayMouseOver);
        }
    };

    /**
     * Actualiza la visualización de selección de rango durante el arrastre
     */
    ReportsView.updateRangeSelection = function(days, startDate, endDate) {
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
    };

    /**
     * Establece un rango de fechas predefinido
     */
    ReportsView.setDateRange = function(range) {
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
    };
} 