/**
 * Vista de KPIs para mostrar métricas clave
 */
const KPIsView = {
    /**
     * Campos seleccionados para los KPIs
     */
    selectedFields: [],
    
    /**
     * Inicializa la vista de KPIs
     */
    init() {
        // Cargar campos seleccionados guardados
        this.loadSelectedFields();
        
        // Renderizar la vista
        this.render();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Generar KPIs iniciales
        this.generateKPIs();
    },
    
    /**
     * Carga los campos seleccionados para KPIs desde la configuración
     */
    loadSelectedFields() {
        const config = StorageService.getConfig();
        this.selectedFields = config.kpiFields || [];
    },
    
    /**
     * Guarda los campos seleccionados para KPIs en la configuración
     */
    saveSelectedFields() {
        const config = StorageService.getConfig();
        config.kpiFields = this.selectedFields;
        StorageService.updateConfig(config);
    },
    
    /**
     * Renderiza el contenido principal de la vista
     */
    render() {
        try {
            // Usar el contenedor de vista activa del Router
            const mainContent = Router.getActiveViewContainer() || document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento contenedor no encontrado en render()");
                return;
            }
            
            // Obtener nombre personalizado
            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';
            const recordName = config.recordName || 'Registro';
            
            // Obtener campos numéricos para KPIs
            const numericFields = FieldModel.getNumericFields();
            
            // Formatear fechas
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            const lastYearStr = this.formatDateForInput(lastYear);
            const today = this.formatDateForInput(new Date());
            
            const template = `
                <div class="container mt-4">
                    <h2>KPIs y Métricas</h2>
                    
                    <div class="row mb-4">
                        <div class="col-md-8">
                            <!-- Filtros -->
                            <div class="card mb-0">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0">Filtros</h5>
                                </div>
                                <div class="card-body">
                                    <form id="kpi-filter-form" class="row g-3">
                                        <div class="col-md-4">
                                            <label for="kpi-filter-entity" class="form-label">${entityName}(s)</label>
                                            <select class="form-select" id="kpi-filter-entity" multiple size="2">
                                                <option value="">Todas</option>
                                                ${EntityModel.getAll().map(entity =>
                                                    `<option value="${entity.id}">${entity.name}</option>`
                                                ).join('')}
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label for="kpi-filter-from-date" class="form-label">Desde</label>
                                            <input type="date" class="form-control" id="kpi-filter-from-date" value="${lastYearStr}">
                                        </div>
                                        <div class="col-md-4">
                                            <label for="kpi-filter-to-date" class="form-label">Hasta</label>
                                            <input type="date" class="form-control" id="kpi-filter-to-date" value="${today}">
                                        </div>
                                        <div class="col-12">
                                            <button type="submit" class="btn btn-primary">Aplicar Filtros</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <!-- Atajos de fecha -->
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Atajos de fecha</h6>
                                </div>
                                <div class="card-body">
                                    <div class="btn-group d-flex flex-wrap" role="group">
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="yesterday">Ayer</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="thisWeek">Esta semana</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="lastWeek">Semana pasada</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="thisMonth">Mes actual</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="lastMonth">Mes pasado</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="thisYear">Año actual</button>
                                        <button type="button" class="btn btn-sm btn-outline-primary date-shortcut" data-range="lastYear">Año pasado</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Campos para KPIs</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-12">
                                    <p class="mb-2">Seleccione los campos numéricos que desea incluir en los KPIs:</p>
                                    <button id="select-all-kpi-fields" class="btn btn-sm btn-outline-primary mb-2">Seleccionar Todos</button>
                                </div>
                            </div>
                            <div class="row">
                                ${numericFields.map(field => `
                                    <div class="col-md-4 mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input kpi-field-check" type="checkbox" value="${field.id}" id="kpi-field-${field.id}" ${this.selectedFields.includes(field.id) ? 'checked' : ''}>
                                            <label class="form-check-label" for="kpi-field-${field.id}">
                                                ${field.name}
                                            </label>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <hr>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6>Opciones de Visualización</h6>
                                    <div class="mb-3">
                                        <label class="form-label">Estilo de KPI</label>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="kpi-style" id="kpi-style-classic" value="classic" ${this.kpiStyle === 'classic' ? 'checked' : ''}>
                                            <label class="form-check-label" for="kpi-style-classic">
                                                Clásico
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="kpi-style" id="kpi-style-modern" value="modern" ${this.kpiStyle === 'modern' ? 'checked' : ''}>
                                            <label class="form-check-label" for="kpi-style-modern">
                                                Moderno
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="decimal-places" class="form-label">Lugares Decimales</label>
                                        <select class="form-select form-select-sm" id="decimal-places">
                                            <option value="0" ${this.kpiDecimalPlaces === 0 ? 'selected' : ''}>0</option>
                                            <option value="1" ${this.kpiDecimalPlaces === 1 ? 'selected' : ''}>1</option>
                                            <option value="2" ${this.kpiDecimalPlaces === 2 ? 'selected' : ''}>2</option>
                                            <option value="3" ${this.kpiDecimalPlaces === 3 ? 'selected' : ''}>3</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="default-aggregation" class="form-label">Agregación Predeterminada</label>
                                        <select class="form-select form-select-sm" id="default-aggregation">
                                            <option value="sum" ${this.kpiDefaultAggregation === 'sum' ? 'selected' : ''}>Suma</option>
                                            <option value="avg" ${this.kpiDefaultAggregation === 'avg' ? 'selected' : ''}>Promedio</option>
                                            <option value="max" ${this.kpiDefaultAggregation === 'max' ? 'selected' : ''}>Máximo</option>
                                            <option value="min" ${this.kpiDefaultAggregation === 'min' ? 'selected' : ''}>Mínimo</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Métricas Adicionales</h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-count" ${this.kpiMetrics.showCount ? 'checked' : ''}>
                                                <label class="form-check-label" for="show-count">
                                                    Mostrar conteo total
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-daily-avg" ${this.kpiMetrics.showDailyAvg ? 'checked' : ''}>
                                                <label class="form-check-label" for="show-daily-avg">
                                                    Mostrar promedio diario
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-entities-count" ${this.kpiMetrics.showEntitiesCount ? 'checked' : ''}>
                                                <label class="form-check-label" for="show-entities-count">
                                                    Mostrar conteo de ${entityName}s
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-growth-rate" ${this.kpiMetrics.showGrowthRate ? 'checked' : ''}>
                                                <label class="form-check-label" for="show-growth-rate">
                                                    Mostrar tasa de crecimiento
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-predictions">
                                                <label class="form-check-label" for="show-predictions">
                                                    Mostrar predicciones simples
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-4 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="show-percent-change">
                                                <label class="form-check-label" for="show-percent-change">
                                                    Mostrar cambio porcentual
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-end">
                                <button id="save-kpi-config-btn" class="btn btn-primary">Guardar Configuración de KPIs</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row" id="kpi-metrics-container">
                        <!-- Aquí se mostrarán las tarjetas de KPIs -->
                        <div class="col-md-4 mb-4">
                            <div class="card border-0 shadow-sm h-100 bg-primary text-white">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase">Total de ${recordName}s</h6>
                                    <h1 class="display-4" id="total-records-kpi">0</h1>
                                    <p class="small mb-0">${recordName}s en el sistema</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-4">
                            <div class="card border-0 shadow-sm h-100 bg-success text-white">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase">Promedio Diario</h6>
                                    <h1 class="display-4" id="avg-records-kpi">0</h1>
                                    <p class="small mb-0">${recordName}s por día</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-4">
                            <div class="card border-0 shadow-sm h-100 bg-info text-white">
                                <div class="card-body text-center">
                                    <h6 class="text-uppercase">${entityName}s</h6>
                                    <h1 class="display-4" id="total-entities-kpi">0</h1>
                                    <p class="small mb-0">${entityName}s registradas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row" id="kpi-fields-container">
                        <!-- Aquí se mostrarán los KPIs de campos específicos -->
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Gráficos de KPIs</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="chart-type" class="form-label">Tipo de Gráfico</label>
                                    <select class="form-select" id="chart-type">
                                        <option value="bar">Barras</option>
                                        <option value="line">Línea</option>
                                        <option value="pie">Circular</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="chart-field" class="form-label">Campo a Graficar</label>
                                    <select class="form-select" id="chart-field">
                                        <option value="">Seleccione un campo</option>
                                        ${numericFields.map(field => `
                                            <option value="${field.id}" ${this.selectedFields.includes(field.id) ? '' : 'disabled'}>
                                                ${field.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="chart-grouping" class="form-label">Agrupar Por</label>
                                    <select class="form-select" id="chart-grouping">
                                        <option value="entity">${entityName}</option>
                                        <option value="day">Día</option>
                                        <option value="week">Semana</option>
                                        <option value="month">Mes</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="chart-container">
                                <canvas id="kpi-chart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tendencias y Comparativas -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Tendencias y Comparativas</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="trend-field" class="form-label">Campo para Tendencia</label>
                                    <select class="form-select" id="trend-field">
                                        <option value="">Seleccione un campo</option>
                                        ${numericFields.map(field => `
                                            <option value="${field.id}" ${this.selectedFields.includes(field.id) ? '' : 'disabled'}>
                                                ${field.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="trend-period" class="form-label">Período</label>
                                    <select class="form-select" id="trend-period">
                                        <option value="custom">Personalizado (usar fechas de filtros)</option>
                                        <option value="day">Diario</option>
                                        <option value="week">Semanal</option>
                                        <option value="month" selected>Mensual</option>
                                        <option value="quarter">Trimestral</option>
                                        <option value="year">Anual</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="comparison-mode" class="form-label">Modo de Comparación</label>
                                    <select class="form-select" id="comparison-mode">
                                        <option value="period">Período Anterior</option>
                                        <option value="year">Mismo Período Año Anterior</option>
                                        <option value="custom">Rango Personalizado</option>
                                        <option value="none">Sin Comparación</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div id="custom-comparison-range" class="row mb-3" style="display: none;">
                                <div class="col-md-6">
                                    <label for="comparison-from-date" class="form-label">Desde</label>
                                    <input type="date" class="form-control" id="comparison-from-date">
                                </div>
                                <div class="col-md-6">
                                    <label for="comparison-to-date" class="form-label">Hasta</label>
                                    <input type="date" class="form-control" id="comparison-to-date">
                                </div>
                            </div>
                            
                            <div class="chart-container">
                                <canvas id="trend-chart"></canvas>
                            </div>
                            
                            <div class="mt-4">
                                <h6>Comparación del Período</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered table-hover">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Métrica</th>
                                                <th>Período Actual</th>
                                                <th>Período Anterior</th>
                                                <th>Diferencia</th>
                                                <th>Variación %</th>
                                            </tr>
                                        </thead>
                                        <tbody id="comparison-table-body">
                                            <tr>
                                                <td colspan="5" class="text-center">Seleccione un campo y un período para ver la comparación</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.innerHTML = template;
        } catch (error) {
            console.error("Error al renderizar KPIsView:", error);
        }
    },
    
    /**
     * Configura los event listeners para la vista
     */
    setupEventListeners() {
        // Listener para el formulario de filtros
        const kpiFilterForm = document.getElementById('kpi-filter-form');
        if (kpiFilterForm) {
            kpiFilterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
                this.generateKPIs();
                this.updateCharts();
            });
        }
        
        // Listener para guardado de configuración de KPIs
        const saveConfigBtn = document.getElementById('save-kpi-config-btn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                this.saveKPIConfiguration();
            });
        }
        
        // Listener para seleccionar todos los campos KPI
        const selectAllBtn = document.getElementById('select-all-kpi-fields');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.kpi-field-check').forEach(checkbox => {
                    checkbox.checked = true;
                });
                this.updateSelectedFields();
                this.generateKPIs();
                this.updateFieldSelects();
            });
        }
        
        // Listeners para los checkboxes de campos
        const kpiFieldChecks = document.querySelectorAll('.kpi-field-check');
        if (kpiFieldChecks && kpiFieldChecks.length > 0) {
            kpiFieldChecks.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateSelectedFields();
                    this.generateKPIs();
                    this.updateFieldSelects();
                });
            });
        }
        
        // Listener para atajos de fecha
        const dateShortcuts = document.querySelectorAll('.date-shortcut');
        if (dateShortcuts && dateShortcuts.length > 0) {
            dateShortcuts.forEach(button => {
                button.addEventListener('click', (e) => {
                    const range = e.target.getAttribute('data-range');
                    this.setDateRange(range);
                    // Aplicar filtros automáticamente
                    const filterForm = document.getElementById('kpi-filter-form');
                    if (filterForm) {
                        filterForm.dispatchEvent(new Event('submit'));
                    }
                });
            });
        }
        
        // Listeners para los cambios de gráfico
        const chartField = document.getElementById('chart-field');
        const chartType = document.getElementById('chart-type');
        const chartGrouping = document.getElementById('chart-grouping');
        
        if (chartField && chartType && chartGrouping) {
            [chartField, chartType, chartGrouping].forEach(select => {
                select.addEventListener('change', () => {
                    this.updateCharts();
                });
            });
        }
        
        // Listeners para tendencias y comparación
        const trendField = document.getElementById('trend-field');
        const trendPeriod = document.getElementById('trend-period');
        const comparisonMode = document.getElementById('comparison-mode');
        const comparisonFromDate = document.getElementById('comparison-from-date');
        const comparisonToDate = document.getElementById('comparison-to-date');
        const customComparisonRange = document.getElementById('custom-comparison-range');
        
        // Listener para mostrar/ocultar el rango personalizado
        if (comparisonMode) {
            comparisonMode.addEventListener('change', () => {
                if (customComparisonRange) {
                    customComparisonRange.style.display = 
                        comparisonMode.value === 'custom' ? 'flex' : 'none';
                }
                this.updateTrendChart();
            });
        }
        
        // Listeners para actualizar el gráfico al cambiar parámetros
        if (trendField && trendPeriod) {
            [trendField, trendPeriod].forEach(select => {
                select.addEventListener('change', () => {
                    this.updateTrendChart();
                });
            });
        }
        
        // Listeners para fechas de comparación personalizadas
        if (comparisonFromDate && comparisonToDate && comparisonMode) {
            [comparisonFromDate, comparisonToDate].forEach(input => {
                input.addEventListener('change', () => {
                    if (comparisonMode.value === 'custom') {
                        this.updateTrendChart();
                    }
                });
            });
        }
        
        // Listeners para opciones de visualización
        const decimalPlaces = document.getElementById('decimal-places');
        const defaultAggregation = document.getElementById('default-aggregation');
        const kpiStyleOptions = document.querySelectorAll('input[name="kpi-style"]');
        
        if (decimalPlaces) {
            decimalPlaces.addEventListener('change', () => {
                this.updateTrendChart();
            });
        }
        
        if (defaultAggregation) {
            defaultAggregation.addEventListener('change', () => {
                this.generateKPIs();
            });
        }
        
        if (kpiStyleOptions && kpiStyleOptions.length > 0) {
            kpiStyleOptions.forEach(option => {
                option.addEventListener('change', () => {
                    this.generateKPIs();
                });
            });
        }
        
        // Listeners para métricas adicionales
        const metricCheckboxes = [
            'show-count',
            'show-daily-avg',
            'show-entities-count',
            'show-growth-rate',
            'show-predictions',
            'show-percent-change'
        ];
        
        metricCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.generateKPIs();
                });
            }
        });
    },
    
    /**
     * Actualiza los campos seleccionados para KPIs
     */
    updateSelectedFields() {
        this.selectedFields = [];
        document.querySelectorAll('.kpi-field-check:checked').forEach(checkbox => {
            this.selectedFields.push(checkbox.value);
        });
    },
    
    /**
     * Actualiza los selects de campos basados en los campos seleccionados
     */
    updateFieldSelects() {
        const chartField = document.getElementById('chart-field');
        const trendField = document.getElementById('trend-field');
        
        [chartField, trendField].forEach(select => {
            if (!select) return;
            
            // Habilitar o deshabilitar opciones según los campos seleccionados
            Array.from(select.options).forEach(option => {
                if (option.value) {
                    option.disabled = !this.selectedFields.includes(option.value);
                }
            });
            
            // Si la opción seleccionada está deshabilitada, seleccionar la primera disponible
            if (select.selectedIndex > 0 && select.options[select.selectedIndex].disabled) {
                const enabledOption = Array.from(select.options).find(opt => opt.value && !opt.disabled);
                if (enabledOption) {
                    select.value = enabledOption.value;
                } else {
                    select.selectedIndex = 0;
                }
            }
        });
        
        // Actualizar los gráficos
        this.updateCharts();
        this.updateTrendChart();
    },
    
    /**
     * Guarda la configuración de KPIs
     */
    saveKPIConfiguration() {
        // Actualizar campos seleccionados
        this.updateSelectedFields();
        
        // Obtener la configuración actual
        const config = StorageService.getConfig();
        
        // Guardar campos seleccionados
        config.kpiFields = this.selectedFields;
        
        // Guardar estilo de KPI
        const kpiStyleModern = document.getElementById('kpi-style-modern');
        config.kpiStyle = kpiStyleModern && kpiStyleModern.checked ? 'modern' : 'classic';
        
        // Guardar configuración de decimales
        const decimalPlaces = document.getElementById('decimal-places');
        config.kpiDecimalPlaces = decimalPlaces ? parseInt(decimalPlaces.value) : 2;
        
        // Guardar agregación por defecto
        const defaultAggregation = document.getElementById('default-aggregation');
        config.kpiDefaultAggregation = defaultAggregation ? defaultAggregation.value : 'sum';
        
        // Guardar métricas adicionales
        config.kpiMetrics = {
            showCount: document.getElementById('show-count')?.checked || false,
            showDailyAvg: document.getElementById('show-daily-avg')?.checked || false,
            showEntitiesCount: document.getElementById('show-entities-count')?.checked || false,
            showGrowthRate: document.getElementById('show-growth-rate')?.checked || false,
            showPredictions: document.getElementById('show-predictions')?.checked || false,
            showPercentChange: document.getElementById('show-percent-change')?.checked || false
        };
        
        // Guardar configuración de visualización
        config.kpiVisualization = {
            defaultChartType: document.getElementById('chart-type')?.value || 'bar',
            defaultPeriod: document.getElementById('trend-period')?.value || 'month',
            defaultComparison: document.getElementById('comparison-mode')?.value || 'period'
        };
        
        // Guardar en el almacenamiento
        StorageService.updateConfig(config);
        
        UIUtils.showAlert('Configuración de KPIs guardada correctamente', 'success');
    },
    
    /**
     * Aplica los filtros seleccionados
     * @returns {Object} Filtros aplicados
     */
    applyFilters() {
        const entityFilterSelect = document.getElementById('kpi-filter-entity');
        
        // Verificar si el selector de entidad existe antes de acceder a sus propiedades
        let entityFilter = [];
        if (entityFilterSelect) {
            const selectedEntities = Array.from(entityFilterSelect.selectedOptions || [])
                .map(option => option.value);
            
            // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
            entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                ? []
                : selectedEntities;
        }
            
        const fromDateInput = document.getElementById('kpi-filter-from-date');
        const toDateInput = document.getElementById('kpi-filter-to-date');
        
        const fromDateFilter = fromDateInput ? fromDateInput.value : '';
        const toDateFilter = toDateInput ? toDateInput.value : '';
        
        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };
        
        return filters;
    },
    
    /**
     * Configura el rango de fecha según el atajo seleccionado
     * @param {string} range Tipo de rango (yesterday, thisWeek, lastWeek, thisMonth, lastMonth)
     */
    setDateRange(range) {
        const fromDateInput = document.getElementById('kpi-filter-from-date');
        const toDateInput = document.getElementById('kpi-filter-to-date');
        
        // Fecha actual
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate, toDate;
        
        // Calcular rango según selección
        switch (range) {
            case 'yesterday':
                // Ayer (solo un día)
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                toDate = new Date(fromDate);
                break;
                
            case 'thisWeek':
                // Esta semana (desde lunes hasta hoy)
                fromDate = new Date(today);
                // Obtener el primer día de la semana (0 = domingo, 1 = lunes)
                const firstDayOfWeek = 1; // Usando lunes como primer día
                const day = today.getDay();
                const diff = (day >= firstDayOfWeek) ? day - firstDayOfWeek : 6;
                fromDate.setDate(today.getDate() - diff);
                toDate = new Date(today);
                break;
                
            case 'lastWeek':
                // Semana pasada
                fromDate = new Date(today);
                const firstDayLastWeek = 1; // Lunes
                const dayLastWeek = today.getDay();
                // Retroceder al lunes de la semana pasada
                fromDate.setDate(today.getDate() - dayLastWeek - 6);
                // Fin de semana pasada (domingo)
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 6);
                break;
                
            case 'thisMonth':
                // Mes actual
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today);
                break;
                
            case 'lastMonth':
                // Mes pasado
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
                
            default:
                return; // No hacer nada si no coincide
        }
        
        // Formatear fechas para los inputs
        fromDateInput.value = this.formatDateForInput(fromDate);
        toDateInput.value = this.formatDateForInput(toDate);
    },
    
    /**
     * Formatea una fecha para usar en input type="date"
     * @param {Date} date Objeto Date a formatear
     * @returns {string} Fecha formateada YYYY-MM-DD
     */
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Genera los KPIs basados en los datos y configuración
     */
    generateKPIs() {
        // Obtener configuración
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        const recordName = config.recordName || 'Registro';
        
        // Aplicar filtros para obtener datos
        const filters = this.applyFilters();
        const records = RecordModel.filterMultiple(filters);
        
        // Actualizar KPIs básicos
        const totalRecordsKPI = document.getElementById('total-records-kpi');
        const avgRecordsKPI = document.getElementById('avg-records-kpi');
        const totalEntitiesKPI = document.getElementById('total-entities-kpi');
        
        if (totalRecordsKPI) {
            totalRecordsKPI.textContent = records.length.toLocaleString();
        }
        
        if (avgRecordsKPI) {
            // Calcular promedio diario solo si hay registros
            let avgPerDay = 0;
            if (records.length > 0) {
                // Obtener fechas únicas
                const uniqueDates = new Set();
                records.forEach(record => {
                    const date = new Date(record.timestamp).toLocaleDateString();
                    uniqueDates.add(date);
                });
                const daysCount = uniqueDates.size || 1; // Evitar división por cero
                avgPerDay = records.length / daysCount;
            }
            
            avgRecordsKPI.textContent = avgPerDay.toLocaleString(undefined, { maximumFractionDigits: 1 });
        }
        
        if (totalEntitiesKPI) {
            // Contar entidades únicas
            const uniqueEntities = new Set();
            records.forEach(record => uniqueEntities.add(record.entityId));
            totalEntitiesKPI.textContent = uniqueEntities.size.toLocaleString();
        }
        
        // Generar KPIs para campos seleccionados
        this.generateFieldKPIs(records);
    },
    
    /**
     * Genera tarjetas KPI para cada campo
     * @param {Array} records Registros filtrados
     * @param {String} recordName Nombre personalizado para "Registro"
     */
    generateFieldKPIs(records) {
        // Obtener configuraciones
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        const recordName = config.recordName || 'Registro';
        
        // Obtener opciones de la interfaz
        const kpiStyle = document.querySelector('input[name="kpi-style"]:checked')?.value || 'modern';
        const defaultAggregation = document.getElementById('default-aggregation')?.value || 'sum';
        const kpiDecimalPlaces = parseInt(document.getElementById('decimal-places')?.value || '2');
        
        // Métricas adicionales
        const showCount = document.getElementById('show-count')?.checked || false;
        const showDailyAvg = document.getElementById('show-daily-avg')?.checked || false;
        const showEntitiesCount = document.getElementById('show-entities-count')?.checked || false;
        const showGrowthRate = document.getElementById('show-growth-rate')?.checked || false;
        const showPredictions = document.getElementById('show-predictions')?.checked || false;
        const showPercentChange = document.getElementById('show-percent-change')?.checked || false;
        
        // Contenedor para los KPIs de campos
        const fieldsContainer = document.getElementById('kpi-fields-container');
        if (!fieldsContainer) return;
        
        // Limpiar contenedor
        fieldsContainer.innerHTML = '';
        
        // Verificar si hay campos seleccionados
        if (this.selectedFields.length === 0) {
            fieldsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        Seleccione campos numéricos para visualizar KPIs adicionales
                    </div>
                </div>
            `;
            return;
        }
        
        // Generar KPIs específicos según la configuración
        
        // KPI: Conteo total
        if (showCount) {
            const countCard = document.createElement('div');
            countCard.className = 'col-md-4 mb-4';
            
            // Usar estilo según configuración
            countCard.innerHTML = `
                <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? 'bg-info text-white' : ''}">
                    <div class="card-body text-center">
                        <h6 class="text-uppercase">Total de ${recordName}s</h6>
                        <h1 class="display-4">${records.length}</h1>
                        <p class="small mb-0">${recordName}s en el período</p>
                    </div>
                </div>
            `;
            
            fieldsContainer.appendChild(countCard);
        }
        
        // KPI: Promedio por día
        if (showDailyAvg) {
            let avgRecordsPerDay = 0;
            if (records.length > 0) {
                // Agrupar por fecha
                const recordsByDate = {};
                records.forEach(record => {
                    const date = new Date(record.timestamp).toISOString().split('T')[0];
                    if (!recordsByDate[date]) {
                        recordsByDate[date] = [];
                    }
                    recordsByDate[date].push(record);
                });
                
                // Calcular promedio por día
                const totalDays = Object.keys(recordsByDate).length;
                if (totalDays > 0) {
                    avgRecordsPerDay = Math.round((records.length / totalDays) * Math.pow(10, kpiDecimalPlaces)) / Math.pow(10, kpiDecimalPlaces);
                }
            }
            
            const avgCard = document.createElement('div');
            avgCard.className = 'col-md-4 mb-4';
            
            avgCard.innerHTML = `
                <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? 'bg-success text-white' : ''}">
                    <div class="card-body text-center">
                        <h6 class="text-uppercase">Promedio por Día</h6>
                        <h1 class="display-4">${avgRecordsPerDay.toLocaleString(undefined, { maximumFractionDigits: kpiDecimalPlaces })}</h1>
                        <p class="small mb-0">${recordName}s por día en el período</p>
                    </div>
                </div>
            `;
            
            fieldsContainer.appendChild(avgCard);
        }
        
        // KPI: Tasa de crecimiento
        if (showGrowthRate && records.length > 0) {
            // Calcular tasa de crecimiento
            const growthRate = this.calculateGrowthRate(records);
            
            const growthCard = document.createElement('div');
            growthCard.className = 'col-md-4 mb-4';
            
            const isPositive = growthRate >= 0;
            const iconClass = isPositive ? 'bi-graph-up-arrow text-success' : 'bi-graph-down-arrow text-danger';
            
            growthCard.innerHTML = `
                <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? 'bg-warning text-dark' : ''}">
                    <div class="card-body text-center">
                        <h6 class="text-uppercase">Tasa de Crecimiento</h6>
                        <h1 class="display-4">
                            <i class="bi ${iconClass}"></i>
                            ${Math.abs(growthRate).toLocaleString(undefined, { maximumFractionDigits: kpiDecimalPlaces })}%
                        </h1>
                        <p class="small mb-0">Comparado con período anterior</p>
                    </div>
                </div>
            `;
            
            fieldsContainer.appendChild(growthCard);
        }
        
        // KPI: Predicción simple
        if (showPredictions && records.length > 0) {
            // Calcular predicción para el próximo período
            const prediction = this.calculateSimplePrediction(records);
            
            const predictionCard = document.createElement('div');
            predictionCard.className = 'col-md-4 mb-4';
            
            predictionCard.innerHTML = `
                <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? 'bg-secondary text-white' : ''}">
                    <div class="card-body text-center">
                        <h6 class="text-uppercase">Predicción</h6>
                        <h1 class="display-4">${prediction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h1>
                        <p class="small mb-0">${recordName}s esperados próximo período</p>
                    </div>
                </div>
            `;
            
            fieldsContainer.appendChild(predictionCard);
        }
        
        // Generar KPIs para campos seleccionados
        this.generateFieldSpecificKPIs(records, recordName, fieldsContainer, kpiStyle, defaultAggregation, kpiDecimalPlaces);
    },
    
    /**
     * Genera KPIs específicos para cada campo seleccionado
     * @param {Array} records Registros filtrados
     * @param {String} recordName Nombre personalizado para "Registro"
     * @param {HTMLElement} fieldsContainer Contenedor para las tarjetas KPI
     * @param {String} kpiStyle Estilo de las tarjetas ('modern' o 'classic')
     * @param {String} defaultAggregation Tipo de agregación predeterminado
     * @param {Number} kpiDecimalPlaces Número de decimales a mostrar
     */
    generateFieldSpecificKPIs(records, recordName, fieldsContainer, kpiStyle, defaultAggregation, kpiDecimalPlaces) {
        // KPI: Cambio porcentual
        const showPercentChange = document.getElementById('show-percent-change')?.checked || false;
        
        if (showPercentChange && this.selectedFields.length > 0) {
            for (const fieldId of this.selectedFields) {
                const field = FieldModel.getById(fieldId);
                
                if (field && field.type === 'number') {
                    // Calcular cambio porcentual entre períodos
                    const percentChange = this.calculatePercentChange(records, fieldId);
                    
                    const changeCard = document.createElement('div');
                    changeCard.className = 'col-md-4 mb-4';
                    
                    // Añadir icono según si es positivo o negativo
                    const isPositive = percentChange >= 0;
                    const changeIcon = isPositive ? 'bi-arrow-up-circle-fill text-success' : 'bi-arrow-down-circle-fill text-danger';
                    const changeText = isPositive ? 'aumento' : 'disminución';
                    
                    changeCard.innerHTML = `
                        <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? 'bg-light' : ''}">
                            <div class="card-body text-center">
                                <h6 class="text-uppercase">Variación ${field.name}</h6>
                                <h1 class="display-4">
                                    <i class="bi ${changeIcon}"></i>
                                    ${Math.abs(percentChange).toLocaleString(undefined, { maximumFractionDigits: kpiDecimalPlaces })}%
                                </h1>
                                <p class="small mb-0">${changeText} respecto al período anterior</p>
                            </div>
                        </div>
                    `;
                    
                    fieldsContainer.appendChild(changeCard);
                }
            }
        }
        
        // Generar KPIs para cada campo seleccionado
        for (const fieldId of this.selectedFields) {
            const field = FieldModel.getById(fieldId);
            if (!field || field.type !== 'number') continue;
            
            // Obtener valores para este campo
            const values = records
                .filter(record => record.data[fieldId] !== undefined)
                .map(record => parseFloat(record.data[fieldId]) || 0);
            
            // Si no hay valores para este campo, saltar al siguiente
            if (values.length === 0) continue;
            
            // Opciones de agregación y visualización
            const aggregationType = defaultAggregation;
            
            // Calcular el valor según el tipo de agregación
            let aggregatedValue = 0;
            switch (aggregationType) {
                case 'sum':
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                    break;
                case 'avg':
                    aggregatedValue = values.length > 0 ? 
                        values.reduce((sum, val) => sum + val, 0) / values.length : 0;
                    break;
                case 'max':
                    aggregatedValue = Math.max(...values);
                    break;
                case 'min':
                    aggregatedValue = Math.min(...values);
                    break;
                default:
                    aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            }
            
            // Redondear según decimales configurados
            if (kpiDecimalPlaces === 0) {
                aggregatedValue = Math.round(aggregatedValue);
            } else {
                const factor = Math.pow(10, kpiDecimalPlaces);
                aggregatedValue = Math.round(aggregatedValue * factor) / factor;
            }
            
            // Crear tarjeta KPI
            const kpiCard = document.createElement('div');
            kpiCard.className = 'col-md-4 mb-4';
            
            // Título según el tipo de agregación
            let kpiTitle = field.name;
            if (aggregationType === 'sum') kpiTitle = `Suma de ${field.name}`;
            if (aggregationType === 'avg') kpiTitle = `Promedio de ${field.name}`;
            if (aggregationType === 'max') kpiTitle = `Máximo de ${field.name}`;
            if (aggregationType === 'min') kpiTitle = `Mínimo de ${field.name}`;
            
            // Crear HTML de la tarjeta
            kpiCard.innerHTML = `
                <div class="card border-0 shadow-sm h-100 ${kpiStyle === 'modern' ? this.getRandomColor() : ''}">
                    <div class="card-body text-center">
                        <h6 class="text-uppercase">${kpiTitle}</h6>
                        <h1 class="display-4">${aggregatedValue.toLocaleString(undefined, { maximumFractionDigits: kpiDecimalPlaces })}</h1>
                        <p class="small mb-0">De un total de ${values.length} ${recordName}s con datos</p>
                    </div>
                </div>
            `;
            
            // Añadir al contenedor
            fieldsContainer.appendChild(kpiCard);
        }
    },
    
    /**
     * Obtiene un color aleatorio para tarjetas KPI
     * @returns {string} Clase CSS con color
     */
    getRandomColor() {
        const colors = [
            'bg-primary text-white',
            'bg-success text-white',
            'bg-info text-white', 
            'bg-warning text-dark',
            'bg-danger text-white',
            'bg-secondary text-white'
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    /**
     * Calcula la tasa de crecimiento entre períodos
     * @param {Array} records Registros filtrados
     * @returns {number} Tasa de crecimiento en porcentaje
     */
    calculateGrowthRate(records) {
        // Ordenar registros por fecha
        records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (records.length < 2) return 0;
        
        // Obtener el rango de fechas
        const firstDate = new Date(records[0].timestamp);
        const lastDate = new Date(records[records.length - 1].timestamp);
        
        // Calcular duración total en días
        const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
        
        if (totalDays <= 1) return 0;
        
        // Dividir en dos períodos
        const middleDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 2);
        
        // Contar registros en cada período
        const firstPeriodCount = records.filter(r => new Date(r.timestamp) < middleDate).length;
        const secondPeriodCount = records.filter(r => new Date(r.timestamp) >= middleDate).length;
        
        // Calcular tasa de crecimiento
        if (firstPeriodCount === 0) return 100; // Si no había registros antes, es 100% de crecimiento
        
        return ((secondPeriodCount - firstPeriodCount) / firstPeriodCount) * 100;
    },

    /**
     * Calcula una predicción simple para el próximo período
     * @param {Array} records Registros filtrados
     * @returns {number} Número de registros predichos
     */
    calculateSimplePrediction(records) {
        // Ordenar registros por fecha
        records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        if (records.length < 2) return records.length;
        
        // Obtener el rango de fechas
        const firstDate = new Date(records[0].timestamp);
        const lastDate = new Date(records[records.length - 1].timestamp);
        
        // Calcular duración total en días
        const totalDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) || 1;
        
        // Calcular registros por día
        const recordsPerDay = records.length / totalDays;
        
        // Predicción simple: mantener la misma tasa para el siguiente período
        return Math.round(recordsPerDay * totalDays);
    },

    /**
     * Calcula el cambio porcentual en un campo entre períodos
     * @param {Array} records Registros filtrados
     * @param {string} fieldId ID del campo a analizar
     * @returns {number} Cambio porcentual
     */
    calculatePercentChange(records, fieldId) {
        // Ordenar registros por fecha
        records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Filtrar registros que contengan el campo
        const recordsWithField = records.filter(r => r.data[fieldId] !== undefined);
        
        if (recordsWithField.length < 2) return 0;
        
        // Obtener el rango de fechas
        const firstDate = new Date(recordsWithField[0].timestamp);
        const lastDate = new Date(recordsWithField[recordsWithField.length - 1].timestamp);
        
        // Dividir en dos períodos
        const middleDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 2);
        
        // Obtener valores para cada período
        const firstPeriodValues = recordsWithField
            .filter(r => new Date(r.timestamp) < middleDate)
            .map(r => parseFloat(r.data[fieldId]) || 0);
            
        const secondPeriodValues = recordsWithField
            .filter(r => new Date(r.timestamp) >= middleDate)
            .map(r => parseFloat(r.data[fieldId]) || 0);
        
        if (firstPeriodValues.length === 0 || secondPeriodValues.length === 0) return 0;
        
        // Calcular sumas
        const firstPeriodSum = firstPeriodValues.reduce((a, b) => a + b, 0);
        const secondPeriodSum = secondPeriodValues.reduce((a, b) => a + b, 0);
        
        // Calcular cambio porcentual
        if (firstPeriodSum === 0) return 100; // Si no había valor antes, es 100% de crecimiento
        
        return ((secondPeriodSum - firstPeriodSum) / firstPeriodSum) * 100;
    },
    
    /**
     * Actualiza los gráficos de KPIs
     */
    updateCharts() {
        const chartField = document.getElementById('chart-field');
        const chartType = document.getElementById('chart-type');
        const chartGrouping = document.getElementById('chart-grouping');
        
        if (!chartField || !chartType || !chartGrouping) return;
        if (!chartField.value) return;
        
        const fieldId = chartField.value;
        const chartTypeValue = chartType.value;
        const groupingType = chartGrouping.value;
        
        const field = FieldModel.getById(fieldId);
        if (!field) return;
        
        const filters = this.applyFilters();
        const filteredRecords = RecordModel.filterMultiple(filters);
        
        // Filtrar registros que tengan el campo seleccionado
        const recordsWithField = filteredRecords.filter(record => record.data[fieldId] !== undefined);
        
        if (recordsWithField.length === 0) {
            // No hay datos para mostrar
            this.showNoDataChart('kpi-chart');
            return;
        }
        
        // Agrupar datos según el tipo de agrupación
        let groupedData = {};
        
        if (groupingType === 'entity') {
            // Agrupar por entidad
            recordsWithField.forEach(record => {
                const entity = EntityModel.getById(record.entityId);
                const entityName = entity ? entity.name : 'Desconocido';
                
                if (!groupedData[entityName]) {
                    groupedData[entityName] = {
                        count: 0,
                        sum: 0,
                        values: []
                    };
                }
                
                const value = parseFloat(record.data[fieldId]) || 0;
                groupedData[entityName].count++;
                groupedData[entityName].sum += value;
                groupedData[entityName].values.push(value);
            });
        } else {
            // Agrupar por período de tiempo
            recordsWithField.forEach(record => {
                const date = new Date(record.timestamp);
                let groupKey;
                
                if (groupingType === 'day') {
                    groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                } else if (groupingType === 'week') {
                    // Calcular semana (tomando lunes como día 1)
                    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                    const dayOfYear = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
                    const weekNumber = Math.ceil((dayOfYear + firstDayOfYear.getDay()) / 7);
                    groupKey = `Semana ${weekNumber}, ${date.getFullYear()}`;
                } else if (groupingType === 'month') {
                    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    groupKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
                }
                
                if (!groupedData[groupKey]) {
                    groupedData[groupKey] = {
                        count: 0,
                        sum: 0,
                        values: []
                    };
                }
                
                const value = parseFloat(record.data[fieldId]) || 0;
                groupedData[groupKey].count++;
                groupedData[groupKey].sum += value;
                groupedData[groupKey].values.push(value);
            });
        }
        
        // Calcular promedios
        Object.keys(groupedData).forEach(key => {
            groupedData[key].avg = groupedData[key].sum / groupedData[key].count;
        });
        
        // Preparar datos para el gráfico
        const labels = Object.keys(groupedData);
        const datasets = [{
            label: field.name,
            data: labels.map(label => groupedData[label].sum),
            backgroundColor: ChartUtils.chartColors.slice(0, labels.length),
            borderColor: ChartUtils.chartColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
        }];
        
        // Dibujar gráfico
        this.drawChart('kpi-chart', chartTypeValue, labels, datasets, field.name);
    },
    
    /**
     * Actualiza el gráfico de tendencia con comparación de períodos
     */
    updateTrendChart() {
        const trendField = document.getElementById('trend-field');
        const trendPeriod = document.getElementById('trend-period');
        const comparisonMode = document.getElementById('comparison-mode');
        
        if (!trendField || !trendPeriod || !comparisonMode) return;
        if (!trendField.value) return;
        
        const fieldId = trendField.value;
        const periodType = trendPeriod.value;
        const compareMode = comparisonMode.value;
        
        const field = FieldModel.getById(fieldId);
        if (!field) return;
        
        // Obtener filtros actuales
        const filters = this.applyFilters();
        const currentPeriodRecords = RecordModel.filterMultiple(filters);
        
        // Filtrar registros que tengan el campo seleccionado
        const recordsWithField = currentPeriodRecords.filter(record => record.data[fieldId] !== undefined);
        
        if (recordsWithField.length === 0) {
            // No hay datos para mostrar
            this.showNoDataChart('trend-chart');
            this.clearComparisonTable();
            return;
        }
        
        // Calcular fechas para el período anterior basado en el modo de comparación
        const previousPeriodDates = this.calculatePreviousPeriodDates(filters.fromDate, filters.toDate, compareMode);
        
        // Si se seleccionó un modo de comparación diferente a "none"
        let previousPeriodRecords = [];
        if (compareMode !== 'none') {
            // Obtener registros del período anterior
            const previousFilters = {
                ...filters,
                fromDate: previousPeriodDates.fromDate,
                toDate: previousPeriodDates.toDate
            };
            
            previousPeriodRecords = RecordModel.filterMultiple(previousFilters)
                .filter(record => record.data[fieldId] !== undefined);
        }
        
        // Procesar datos según el tipo de período
        const currentPeriodData = this.aggregateRecordsByPeriod(recordsWithField, fieldId, periodType);
        const previousPeriodData = compareMode !== 'none' ? 
            this.aggregateRecordsByPeriod(previousPeriodRecords, fieldId, periodType) : null;
        
        // Generar etiquetas y series para el gráfico
        const { labels, datasets } = this.prepareComparisonChartData(
            currentPeriodData, 
            previousPeriodData, 
            field.name, 
            periodType,
            compareMode
        );
        
        // Dibujar gráfico de línea para tendencias
        this.drawChart('trend-chart', 'line', labels, datasets, `Tendencia de ${field.name} por ${this.getPeriodLabel(periodType)}`);
        
        // Actualizar tabla de comparación
        this.updateComparisonTable(currentPeriodData, previousPeriodData, field.name);
    },

    /**
     * Calcula las fechas para el período anterior basado en el modo de comparación
     * @param {string} fromDate Fecha inicial del período actual
     * @param {string} toDate Fecha final del período actual
     * @param {string} compareMode Modo de comparación ('period', 'year', 'custom', 'none')
     * @returns {Object} Fechas del período anterior
     */
    calculatePreviousPeriodDates(fromDate, toDate, compareMode) {
        // Si no hay fechas, usar últimos 30 días por defecto
        if (!fromDate || !toDate) {
            const today = new Date();
            toDate = today.toISOString().split('T')[0];
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        }
        
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        // Duración del período en milisegundos
        const periodDuration = to.getTime() - from.getTime();
        
        let previousFromDate, previousToDate;
        
        switch (compareMode) {
            case 'period':
                // Período inmediatamente anterior de la misma duración
                previousToDate = new Date(from);
                previousToDate.setDate(previousToDate.getDate() - 1);
                
                previousFromDate = new Date(previousToDate);
                previousFromDate.setTime(previousToDate.getTime() - periodDuration);
                break;
                
            case 'year':
                // Mismo período del año anterior
                previousFromDate = new Date(from);
                previousFromDate.setFullYear(previousFromDate.getFullYear() - 1);
                
                previousToDate = new Date(to);
                previousToDate.setFullYear(previousToDate.getFullYear() - 1);
                break;
                
            case 'custom':
                // Usar fechas personalizadas (se manejan en UI)
                const customFromInput = document.getElementById('comparison-from-date');
                const customToInput = document.getElementById('comparison-to-date');
                
                if (customFromInput && customToInput && 
                    customFromInput.value && customToInput.value) {
                    previousFromDate = new Date(customFromInput.value);
                    previousToDate = new Date(customToInput.value);
                } else {
                    // Si no hay fechas personalizadas, usar período anterior
                    previousToDate = new Date(from);
                    previousToDate.setDate(previousToDate.getDate() - 1);
                    
                    previousFromDate = new Date(previousToDate);
                    previousFromDate.setTime(previousToDate.getTime() - periodDuration);
                }
                break;
                
            default:
                // Por defecto usar período anterior
                previousToDate = new Date(from);
                previousToDate.setDate(previousToDate.getDate() - 1);
                
                previousFromDate = new Date(previousToDate);
                previousFromDate.setTime(previousToDate.getTime() - periodDuration);
        }
        
        return {
            fromDate: previousFromDate.toISOString().split('T')[0],
            toDate: previousToDate.toISOString().split('T')[0]
        };
    },

    /**
     * Agrupa registros por período y calcula métricas
     * @param {Array} records Registros a agrupar
     * @param {string} fieldId ID del campo para las métricas
     * @param {string} periodType Tipo de período ('day', 'week', 'month', 'quarter', 'year', 'custom')
     * @returns {Object} Datos agrupados
     */
    aggregateRecordsByPeriod(records, fieldId, periodType) {
        // Ordenar registros por fecha
        records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Agrupar por período
        const groupedData = {};
        let totalSum = 0;
        let totalCount = 0;
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        records.forEach(record => {
            const date = new Date(record.timestamp);
            let groupKey;
            
            switch (periodType) {
                case 'day':
                    groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                    
                case 'week':
                    // Calcular semana (tomando lunes como día 1)
                    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                    const dayOfYear = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
                    const weekNumber = Math.ceil((dayOfYear + firstDayOfYear.getDay()) / 7);
                    groupKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
                    break;
                    
                case 'month':
                    groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
                    
                case 'quarter':
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    groupKey = `${date.getFullYear()}-Q${quarter}`;
                    break;
                    
                case 'year':
                    groupKey = date.getFullYear().toString();
                    break;
                    
                default: // custom o cualquier otro
                    // Para personalizados o no especificados, usar todo el período como un solo grupo
                    groupKey = 'all';
            }
            
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    count: 0,
                    sum: 0,
                    values: []
                };
            }
            
            const value = parseFloat(record.data[fieldId]) || 0;
            groupedData[groupKey].count++;
            groupedData[groupKey].sum += value;
            groupedData[groupKey].values.push(value);
            
            // Actualizar estadísticas globales
            totalSum += value;
            totalCount++;
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
        });
        
        // Calcular promedios y otras métricas para cada grupo
        Object.keys(groupedData).forEach(key => {
            const group = groupedData[key];
            group.avg = group.sum / group.count;
            group.min = Math.min(...group.values);
            group.max = Math.max(...group.values);
        });
        
        // Métricas globales
        const averageValue = totalCount > 0 ? totalSum / totalCount : 0;
        
        return {
            groups: groupedData,
            total: {
                count: totalCount,
                sum: totalSum,
                avg: averageValue,
                min: totalCount > 0 ? minValue : 0,
                max: totalCount > 0 ? maxValue : 0
            }
        };
    },

    /**
     * Prepara los datos para el gráfico de comparación
     * @param {Object} currentPeriodData Datos del período actual
     * @param {Object} previousPeriodData Datos del período anterior (opcional)
     * @param {string} fieldName Nombre del campo
     * @param {string} periodType Tipo de período
     * @param {string} compareMode Modo de comparación
     * @returns {Object} Datos preparados para el gráfico
     */
    prepareComparisonChartData(currentPeriodData, previousPeriodData, fieldName, periodType, compareMode) {
        // Si no hay período anterior, mostrar solo el actual
        if (!previousPeriodData || compareMode === 'none') {
            const currentGroups = currentPeriodData.groups;
            const sortedKeys = Object.keys(currentGroups).sort();
            
            const labels = sortedKeys.map(key => this.formatPeriodLabel(key, periodType));
            const datasets = [{
                label: `${fieldName} (Período Actual)`,
                data: sortedKeys.map(key => currentGroups[key].sum),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false
            }];
            
            return { labels, datasets };
        }
        
        // Combinar claves de ambos períodos
        const currentGroups = currentPeriodData.groups;
        const previousGroups = previousPeriodData.groups;
        
        // Obtener todas las claves únicas
        const allKeys = new Set([
            ...Object.keys(currentGroups),
            ...Object.keys(previousGroups)
        ]);
        
        // Ordenar las claves
        const sortedKeys = Array.from(allKeys).sort();
        
        // Preparar etiquetas y datos
        const labels = sortedKeys.map(key => this.formatPeriodLabel(key, periodType));
        
        // Preparar conjuntos de datos
        const currentData = sortedKeys.map(key => 
            currentGroups[key] ? currentGroups[key].sum : null
        );
        
        const previousData = sortedKeys.map(key => 
            previousGroups[key] ? previousGroups[key].sum : null
        );
        
        const datasets = [
            {
                label: `${fieldName} (Período Actual)`,
                data: currentData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false
            },
            {
                label: `${fieldName} (Período Anterior)`,
                data: previousData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                borderDash: [5, 5]
            }
        ];
        
        return { labels, datasets };
    },

    /**
     * Formatea una etiqueta de período para mostrar
     * @param {string} key Clave del período
     * @param {string} periodType Tipo de período
     * @returns {string} Etiqueta formateada
     */
    formatPeriodLabel(key, periodType) {
        if (key === 'all') return 'Todo el período';
        
        switch (periodType) {
            case 'day':
                // Formato YYYY-MM-DD a DD/MM/YYYY
                const [year, month, day] = key.split('-');
                return `${day}/${month}/${year}`;
                
            case 'week':
                // Formato YYYY-Wnn
                const [weekYear, weekNum] = key.split('-W');
                return `Semana ${weekNum}, ${weekYear}`;
                
            case 'month':
                // Formato YYYY-MM
                const [monthYear, monthNum] = key.split('-');
                const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return `${months[parseInt(monthNum) - 1]} ${monthYear}`;
                
            case 'quarter':
                // Formato YYYY-Qn
                const [quarterYear, quarterNum] = key.split('-Q');
                return `Q${quarterNum} ${quarterYear}`;
                
            case 'year':
                // Formato YYYY
                return key;
                
            default:
                return key;
        }
    },

    /**
     * Obtiene la etiqueta descriptiva para un tipo de período
     * @param {string} periodType Tipo de período
     * @returns {string} Etiqueta del período
     */
    getPeriodLabel(periodType) {
        switch (periodType) {
            case 'day': return 'día';
            case 'week': return 'semana';
            case 'month': return 'mes';
            case 'quarter': return 'trimestre';
            case 'year': return 'año';
            case 'custom': return 'período personalizado';
            default: return 'período';
        }
    },

    /**
     * Actualiza la tabla de comparación entre períodos
     * @param {Object} currentPeriodData Datos del período actual
     * @param {Object} previousPeriodData Datos del período anterior (opcional)
     * @param {string} fieldName Nombre del campo
     */
    updateComparisonTable(currentPeriodData, previousPeriodData, fieldName) {
        const tableBody = document.getElementById('comparison-table-body');
        if (!tableBody) return;
        
        const decimals = document.getElementById('decimal-places')?.value || 2;
        const current = currentPeriodData.total;
        
        // Si no hay período anterior, mostrar solo estadísticas del período actual
        if (!previousPeriodData) {
            tableBody.innerHTML = `
                <tr>
                    <td>Suma de ${fieldName}</td>
                    <td>${ChartUtils.formatNumber(current.sum, decimals)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Promedio de ${fieldName}</td>
                    <td>${ChartUtils.formatNumber(current.avg, decimals)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Máximo de ${fieldName}</td>
                    <td>${ChartUtils.formatNumber(current.max, decimals)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Mínimo de ${fieldName}</td>
                    <td>${ChartUtils.formatNumber(current.min, decimals)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Número de registros</td>
                    <td>${current.count}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
            return;
        }
        
        // Datos del período anterior
        const previous = previousPeriodData.total;
        
        // Calcular diferencias y porcentajes
        const sumDiff = current.sum - previous.sum;
        const sumPercent = previous.sum !== 0 ? (sumDiff / previous.sum) * 100 : 0;
        
        const avgDiff = current.avg - previous.avg;
        const avgPercent = previous.avg !== 0 ? (avgDiff / previous.avg) * 100 : 0;
        
        const maxDiff = current.max - previous.max;
        const maxPercent = previous.max !== 0 ? (maxDiff / previous.max) * 100 : 0;
        
        const minDiff = current.min - previous.min;
        const minPercent = previous.min !== 0 ? (minDiff / previous.min) * 100 : 0;
        
        const countDiff = current.count - previous.count;
        const countPercent = previous.count !== 0 ? (countDiff / previous.count) * 100 : 0;
        
        // Crear filas con clases para colores según si aumentó o disminuyó
        tableBody.innerHTML = `
            <tr>
                <td>Suma de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.sum, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.sum, decimals)}</td>
                <td class="${sumDiff >= 0 ? 'text-success' : 'text-danger'}">${sumDiff >= 0 ? '+' : ''}${ChartUtils.formatNumber(sumDiff, decimals)}</td>
                <td class="${sumDiff >= 0 ? 'text-success' : 'text-danger'}">${sumDiff >= 0 ? '+' : ''}${sumPercent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Promedio de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.avg, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.avg, decimals)}</td>
                <td class="${avgDiff >= 0 ? 'text-success' : 'text-danger'}">${avgDiff >= 0 ? '+' : ''}${ChartUtils.formatNumber(avgDiff, decimals)}</td>
                <td class="${avgDiff >= 0 ? 'text-success' : 'text-danger'}">${avgDiff >= 0 ? '+' : ''}${avgPercent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Máximo de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.max, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.max, decimals)}</td>
                <td class="${maxDiff >= 0 ? 'text-success' : 'text-danger'}">${maxDiff >= 0 ? '+' : ''}${ChartUtils.formatNumber(maxDiff, decimals)}</td>
                <td class="${maxDiff >= 0 ? 'text-success' : 'text-danger'}">${maxDiff >= 0 ? '+' : ''}${maxPercent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Mínimo de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.min, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.min, decimals)}</td>
                <td class="${minDiff >= 0 ? 'text-success' : 'text-danger'}">${minDiff >= 0 ? '+' : ''}${ChartUtils.formatNumber(minDiff, decimals)}</td>
                <td class="${minDiff >= 0 ? 'text-success' : 'text-danger'}">${minDiff >= 0 ? '+' : ''}${minPercent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Número de registros</td>
                <td>${current.count}</td>
                <td>${previous.count}</td>
                <td class="${countDiff >= 0 ? 'text-success' : 'text-danger'}">${countDiff >= 0 ? '+' : ''}${countDiff}</td>
                <td class="${countDiff >= 0 ? 'text-success' : 'text-danger'}">${countDiff >= 0 ? '+' : ''}${countPercent.toFixed(2)}%</td>
            </tr>
        `;
    },

    /**
     * Limpia la tabla de comparación
     */
    clearComparisonTable() {
        const tableBody = document.getElementById('comparison-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Seleccione un campo y un período para ver la comparación</td>
                </tr>
            `;
        }
    },
    
    /**
     * Dibuja un gráfico en el canvas especificado
     * @param {string} canvasId ID del elemento canvas
     * @param {string} type Tipo de gráfico ('bar', 'line', 'pie', etc.)
     * @param {Array} labels Etiquetas para el eje X
     * @param {Array} datasets Conjuntos de datos
     * @param {string} title Título del gráfico
     */
    drawChart(canvasId, type, labels, datasets, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Destruir gráfico anterior si existe
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        // Crear opciones del gráfico
        const options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = ChartUtils.formatNumber(context.raw);
                            return `${context.dataset.label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            return ChartUtils.formatNumber(value);
                        }
                    }
                }
            }
        };
        
        // Ajustes específicos según tipo de gráfico
        if (type === 'pie' || type === 'doughnut') {
            // Eliminar escalas para gráficos circulares
            delete options.scales;
        }
        
        // Crear el gráfico
        const chart = new Chart(canvas, {
            type: type,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: options
        });
        
        // Guardar referencia al gráfico en el canvas
        canvas.chart = chart;
    },
    
    /**
     * Muestra un gráfico de "No hay datos disponibles"
     * @param {string} canvasId ID del elemento canvas
     */
    showNoDataChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Destruir gráfico anterior si existe
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        // Crear un gráfico vacío con mensaje
        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['No hay datos disponibles'],
                datasets: [{
                    label: '',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.2)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'No hay datos disponibles para mostrar'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Guardar referencia al gráfico en el canvas
        canvas.chart = chart;
    },

    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        // Recargar datos de KPIs
        this.loadData();
    }
};