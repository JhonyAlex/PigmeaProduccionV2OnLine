/**
 * Módulo para gestionar filtros y atajos de fecha en reportes
 * Este módulo encapsula la funcionalidad de filtros para mantener el código principal más limpio
 */
const ReportFilters = {
    // Mantener referencia al ReportsView para poder interactuar con él
    reportsView: null,
    
    /**
     * Inicializa el módulo de filtros
     * @param {Object} reportsViewInstance Referencia al objeto ReportsView
     */
    init(reportsViewInstance) {
        this.reportsView = reportsViewInstance;
        this.setupEventListeners();
        return this;
    },
    
    /**
     * Configura todos los event listeners relacionados con filtros
     */
    setupEventListeners() {
        // Esperar a que el DOM esté completamente cargado
        setTimeout(() => {
            // Aplicar filtros cuando se envía el formulario
            const filterForm = document.getElementById('filter-form');
            if (filterForm) {
                filterForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.applyFilters();
                    
                    // Si hay un reporte generado, actualizarlo con los nuevos filtros
                    const reportContainer = document.getElementById('report-container');
                    if (reportContainer && reportContainer.style.display === 'block' && this.reportsView) {
                        this.reportsView.generateReport();
                    }
                });
            }
            
            // Atajos de fecha
            document.querySelectorAll('.date-shortcut').forEach(button => {
                button.addEventListener('click', (e) => {
                    const range = e.target.getAttribute('data-range') || e.target.parentElement.getAttribute('data-range');
                    if (range) {
                        this.setDateRange(range);
                        // Aplicar filtros automáticamente
                        if (filterForm) filterForm.dispatchEvent(new Event('submit'));
                    }
                });
            });
            
            // Filtros de grupo de entidades
            document.querySelectorAll('.entity-group-filter').forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.getAttribute('data-group') || e.target.parentElement.getAttribute('data-group');
                    if (group) {
                        this.filterByEntityGroup(group);
                        // Aplicar filtros automáticamente
                        if (filterForm) filterForm.dispatchEvent(new Event('submit'));
                    }
                });
            });
        }, 100);
    },
    
    /**
     * Aplica los filtros seleccionados y actualiza la vista
     */
    applyFilters() {
        if (!this.reportsView) {
            console.error("No hay instancia de ReportsView disponible");
            return;
        }
        
        const entityFilterSelect = document.getElementById('filter-entity');
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        
        let selectedEntities = [];
        if (entityFilterSelect) {
            selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);
        }
        
        // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
        const entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
            ? []
            : selectedEntities;
            
        const fromDateFilter = document.getElementById('filter-from-date')?.value;
        const toDateFilter = document.getElementById('filter-to-date')?.value;
        
        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };
        
        // Obtener registros filtrados
        const filteredRecords = RecordModel.filterMultiple(filters);
        
        // Guardar los registros filtrados en el ReportsView
        this.reportsView.filteredRecords = filteredRecords;
        
        // Reiniciar la página actual al aplicar nuevos filtros
        this.reportsView.pagination.currentPage = 1;
        
        // Mostrar registros (aplicando también el filtro de búsqueda si existe)
        this.reportsView.filterRecordsBySearch();
    },
    
    /**
     * Establece un rango de fechas predefinido
     * @param {string} range Identificador del rango ('yesterday', 'thisWeek', etc.)
     */
    setDateRange(range) {
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
    
    /**
     * Formatea una fecha para uso en inputs de tipo date
     * @param {Date} date Fecha a formatear
     * @returns {string} Fecha formateada en formato YYYY-MM-DD
     */
    formatDateForInput(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Filtra entidades por grupo
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
    
    /**
     * Renderiza la sección de filtros y atajos
     * @param {HTMLElement} container Contenedor donde se renderizará la sección de filtros
     * @returns {string} HTML generado para la sección de filtros
     */
    renderFiltersSection(container) {
        if (!this.reportsView) {
            console.warn("No hay instancia de ReportsView disponible para renderizar filtros - usando configuración por defecto");
            // En lugar de fallar, continuar con valores por defecto
            // Esto permitirá que la renderización funcione incluso si todavía no se ha inicializado completamente
        }
        
        // Formatear fechas
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = this.formatDateForInput(lastMonth);
        const today = this.formatDateForInput(new Date());
        
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        const entities = EntityModel.getAll();
        
        const filtersHTML = `
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
        
        if (container) {
            container.innerHTML = filtersHTML;
        }
        
        return filtersHTML;
    }
}; 