/**
 * Vista de KPIs para mostrar métricas clave
 */
const KPIsView = {
    /**
     * Campos seleccionados para los KPIs
     */
    selectedFields: [],
    
    /**
     * Estilo de los KPIs (modern o classic)
     */
    kpiStyle: 'modern',
    
    /**
     * Número de decimales para mostrar
     */
    kpiDecimalPlaces: 2,
    
    /**
     * Tipo de agregación predeterminada
     */
    kpiDefaultAggregation: 'sum',
    
    /**
     * Métricas adicionales a mostrar
     */
    kpiMetrics: {
        showCount: false,
        showDailyAvg: false,
        showEntitiesCount: false,
        showGrowthRate: false,
        showPredictions: false,
        showPercentChange: false
    },

    /**
     * Cache de datos para mejorar rendimiento
     */
    dataCache: {
        lastUpdate: null,
        currentPeriodData: null,
        previousPeriodData: null,
        filters: null
    },
    
    /**
     * Inicializa la vista de KPIs
     */
    init() {
        // Inicializar propiedades desde la configuración
        const config = StorageService.getConfig();
        if (config) {
            this.kpiStyle = config.kpiStyle || 'modern';
            this.kpiDecimalPlaces = config.kpiDecimalPlaces || 2;
            this.kpiDefaultAggregation = config.kpiDefaultAggregation || 'sum';
            this.kpiMetrics = config.kpiMetrics || {
                showCount: false,
                showDailyAvg: false,
                showEntitiesCount: false,
                showGrowthRate: false,
                showPredictions: false,
                showPercentChange: false
            };
        }
        
        // Cargar campos seleccionados guardados
        this.loadSelectedFields();
        
        // Limpiar cache
        this.clearCache();
        
        // Renderizar la vista
        this.render();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Generar KPIs iniciales
        this.refreshAllData();
    },

    /**
     * Limpia el cache de datos
     */
    clearCache() {
        this.dataCache = {
            lastUpdate: null,
            currentPeriodData: null,
            previousPeriodData: null,
            filters: null
        };
    },

    /**
     * Verifica si el cache es válido
     */
    isCacheValid(currentFilters) {
        if (!this.dataCache.lastUpdate || !this.dataCache.filters) {
            return false;
        }

        // Verificar si los filtros han cambiado
        const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(this.dataCache.filters);
        
        // Verificar si han pasado más de 30 segundos
        const cacheAge = Date.now() - this.dataCache.lastUpdate;
        const cacheExpired = cacheAge > 30000; // 30 segundos

        return !filtersChanged && !cacheExpired;
    },

    /**
     * Actualiza el cache con nuevos datos
     */
    updateCache(filters, currentData, previousData) {
        this.dataCache = {
            lastUpdate: Date.now(),
            currentPeriodData: currentData,
            previousPeriodData: previousData,
            filters: JSON.parse(JSON.stringify(filters))
        };
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
                this.refreshAllData();
            });
        }

        // Listener para cambios en tiempo real en los filtros
        const filterInputs = [
            'kpi-filter-entity',
            'kpi-filter-from-date', 
            'kpi-filter-to-date'
        ];

        filterInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', () => {
                    // Usar debounce para evitar actualizaciones excesivas
                    clearTimeout(this.updateTimeout);
                    this.updateTimeout = setTimeout(() => {
                        this.refreshAllData();
                    }, 500);
                });
            }
        });
        
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
                this.refreshAllData();
            });
        }
        
        // Listeners para los checkboxes de campos
        const kpiFieldChecks = document.querySelectorAll('.kpi-field-check');
        if (kpiFieldChecks && kpiFieldChecks.length > 0) {
            kpiFieldChecks.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateSelectedFields();
                    this.refreshAllData();
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
                    this.refreshAllData();
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
                this.refreshAllData();
            });
        }
        
        if (defaultAggregation) {
            defaultAggregation.addEventListener('change', () => {
                this.refreshAllData();
            });
        }
        
        if (kpiStyleOptions && kpiStyleOptions.length > 0) {
            kpiStyleOptions.forEach(option => {
                option.addEventListener('change', () => {
                    this.refreshAllData();
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
                    this.refreshAllData();
                });
            });
        });
        
        // Listener para filtros de grupo de entidades
        const entityGroupFilters = document.querySelectorAll('.entity-group-filter');
        if (entityGroupFilters && entityGroupFilters.length > 0) {
            entityGroupFilters.forEach(button => {
                button.addEventListener('click', (e) => {
                    const group = e.target.getAttribute('data-group');
                    this.filterByEntityGroup(group);
                    this.refreshAllData();
                });
            });
        }
    },

    /**
     * Refresca todos los datos y actualiza la vista
     */
    refreshAllData() {
        try {
            // Limpiar timeout anterior
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }

            // Obtener filtros actuales
            const currentFilters = this.applyFilters();
            
            // Verificar cache
            if (this.isCacheValid(currentFilters)) {
                console.log('Usando datos del cache');
                this.generateKPIs();
                this.updateCharts();
                this.updateTrendChart();
                return;
            }

            console.log('Actualizando datos desde la fuente');
            
            // Obtener datos del período actual
            const currentPeriodRecords = this.getFilteredRecords(currentFilters);
            
            // Calcular período anterior para comparaciones
            const comparisonMode = document.getElementById('comparison-mode')?.value || 'period';
            const previousPeriodDates = this.calculatePreviousPeriodDates(
                currentFilters.fromDate, 
                currentFilters.toDate, 
                comparisonMode
            );
            
            // Obtener datos del período anterior
            const previousFilters = {
                ...currentFilters,
                fromDate: previousPeriodDates.fromDate,
                toDate: previousPeriodDates.toDate
            };
            const previousPeriodRecords = this.getFilteredRecords(previousFilters);
            
            // Actualizar cache
            this.updateCache(currentFilters, currentPeriodRecords, previousPeriodRecords);
            
            // Actualizar vista
            this.generateKPIs();
            this.updateCharts();
            this.updateTrendChart();
            
        } catch (error) {
            console.error('Error al refrescar datos de KPIs:', error);
            this.showErrorMessage('Error al actualizar los datos. Por favor, revise los filtros.');
        }
    },

    /**
     * Obtiene registros filtrados de manera más eficiente
     */
    getFilteredRecords(filters) {
        try {
            // Validar filtros
            if (!filters) {
                return RecordModel.getAll();
            }

            // Usar método de filtrado múltiple mejorado
            return RecordModel.filterMultiple({
                entityIds: filters.entityIds,
                fromDate: filters.fromDate,
                toDate: filters.toDate
            });
        } catch (error) {
            console.error('Error al filtrar registros:', error);
            return [];
        }
    },

    /**
     * Muestra mensaje de error
     */
    showErrorMessage(message) {
        const container = document.getElementById('kpi-metrics-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        ${message}
                    </div>
                </div>
            `;
        }
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
                .map(option => option.value)
                .filter(value => value && value !== ''); // Filtrar valores vacíos
            
            entityFilter = selectedEntities;
        }
            
        const fromDateInput = document.getElementById('kpi-filter-from-date');
        const toDateInput = document.getElementById('kpi-filter-to-date');
        
        let fromDateFilter = fromDateInput ? fromDateInput.value : '';
        let toDateFilter = toDateInput ? toDateInput.value : '';

        // Validar fechas
        if (fromDateFilter && toDateFilter) {
            const fromDate = new Date(fromDateFilter);
            const toDate = new Date(toDateFilter);
            
            // Si la fecha de inicio es posterior a la fecha final, intercambiarlas
            if (fromDate > toDate) {
                const temp = fromDateFilter;
                fromDateFilter = toDateFilter;
                toDateFilter = temp;
                
                // Actualizar los inputs
                if (fromDateInput) fromDateInput.value = fromDateFilter;
                if (toDateInput) toDateInput.value = toDateFilter;
                
                UIUtils.showAlert('Las fechas se han corregido automáticamente', 'warning');
            }
        }

        // Si no hay fechas, usar últimos 30 días
        if (!fromDateFilter || !toDateFilter) {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            if (!fromDateFilter) {
                fromDateFilter = this.formatDateForInput(thirtyDaysAgo);
                if (fromDateInput) fromDateInput.value = fromDateFilter;
            }
            
            if (!toDateFilter) {
                toDateFilter = this.formatDateForInput(today);
                if (toDateInput) toDateInput.value = toDateFilter;
            }
        }
        
        const filters = {
            entityIds: entityFilter.length > 0 ? entityFilter : undefined,
            fromDate: fromDateFilter || undefined,
            toDate: toDateFilter || undefined
        };
        
        return filters;
    },

    /**
     * Configura el rango de fecha según el atajo seleccionado
     * @param {string} range Tipo de rango (yesterday, thisWeek, lastWeek, thisMonth, lastMonth, thisYear, lastYear)
     */
    setDateRange(range) {
        const fromDateInput = document.getElementById('kpi-filter-from-date');
        const toDateInput = document.getElementById('kpi-filter-to-date');
        
        if (!fromDateInput || !toDateInput) return;
        
        // Fecha actual
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let fromDate, toDate;
        
        // Calcular rango según selección
        switch (range) {
            case 'yesterday':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                toDate = new Date(fromDate);
                break;
                
            case 'thisWeek':
                // Esta semana (desde lunes hasta hoy)
                fromDate = new Date(today);
                const day = today.getDay();
                const diff = day === 0 ? 6 : day - 1; // Si es domingo (0), retroceder 6 días
                fromDate.setDate(today.getDate() - diff);
                toDate = new Date(today);
                break;
                
            case 'lastWeek':
                // Semana pasada (lunes a domingo)
                const lastWeekEnd = new Date(today);
                const dayOfWeek = today.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
                lastWeekEnd.setDate(today.getDate() - daysToSubtract - 1);
                
                toDate = new Date(lastWeekEnd);
                fromDate = new Date(lastWeekEnd);
                fromDate.setDate(lastWeekEnd.getDate() - 6);
                break;
                
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today);
                break;
                
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;

            case 'thisYear':
                fromDate = new Date(today.getFullYear(), 0, 1);
                toDate = new Date(today);
                break;

            case 'lastYear':
                fromDate = new Date(today.getFullYear() - 1, 0, 1);
                toDate = new Date(today.getFullYear() - 1, 11, 31);
                break;
                
            default:
                return;
        }
        
        // Formatear fechas para los inputs
        fromDateInput.value = this.formatDateForInput(fromDate);
        toDateInput.value = this.formatDateForInput(toDate);
    },
    
    /**
     * Genera los KPIs basados en los datos y configuración
     */
    generateKPIs() {
        // Obtener configuración
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
        const recordName = config.recordName || 'Registro';
        
        // Usar datos del cache si están disponibles
        let records;
        if (this.dataCache.currentPeriodData) {
            records = this.dataCache.currentPeriodData;
        } else {
            // Aplicar filtros para obtener datos
            const filters = this.applyFilters();
            records = this.getFilteredRecords(filters);
        }
        
        // Actualizar KPIs básicos
        this.updateBasicKPIs(records, entityName, recordName);
        
        // Generar KPIs para campos seleccionados
        this.generateFieldKPIs(records);
    },

    /**
     * Actualiza los KPIs básicos
     */
    updateBasicKPIs(records, entityName, recordName) {
        const totalRecordsKPI = document.getElementById('total-records-kpi');
        const avgRecordsKPI = document.getElementById('avg-records-kpi');
        const totalEntitiesKPI = document.getElementById('total-entities-kpi');
        
        if (totalRecordsKPI) {
            totalRecordsKPI.textContent = records.length.toLocaleString();
        }
        
        if (avgRecordsKPI) {
            const avgPerDay = this.calculateAveragePerDay(records);
            avgRecordsKPI.textContent = avgPerDay.toLocaleString(undefined, { 
                maximumFractionDigits: this.kpiDecimalPlaces 
            });
        }
        
        if (totalEntitiesKPI) {
            const uniqueEntities = new Set();
            records.forEach(record => {
                if (record.entityId) uniqueEntities.add(record.entityId);
            });
            totalEntitiesKPI.textContent = uniqueEntities.size.toLocaleString();
        }
    },

    /**
     * Calcula el promedio de registros por día de manera más precisa
     */
    calculateAveragePerDay(records) {
        if (records.length === 0) return 0;

        // Obtener rango de fechas de los filtros
        const fromDateInput = document.getElementById('kpi-filter-from-date');
        const toDateInput = document.getElementById('kpi-filter-to-date');
        
        let fromDate, toDate;
        
        if (fromDateInput && toDateInput && fromDateInput.value && toDateInput.value) {
            fromDate = new Date(fromDateInput.value);
            toDate = new Date(toDateInput.value);
        } else {
            // Si no hay fechas en los filtros, usar el rango de fechas de los registros
            const dates = records.map(r => new Date(r.timestamp)).sort((a, b) => a - b);
            fromDate = dates[0];
            toDate = dates[dates.length - 1];
        }

        // Calcular días en el período
        const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
        
        return daysDiff > 0 ? records.length / daysDiff : 0;
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
            toDate = this.formatDateForInput(today);
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            fromDate = this.formatDateForInput(thirtyDaysAgo);
        }
        
        const from = new Date(fromDate);
        const to = new Date(toDate);
        
        // Validar que las fechas sean válidas
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            console.error('Fechas inválidas:', { fromDate, toDate });
            return { fromDate: '', toDate: '' };
        }
        
        // Duración del período en milisegundos
        const periodDuration = to.getTime() - from.getTime();
        
        let previousFromDate, previousToDate;
        
        switch (compareMode) {
            case 'period':
                // Período inmediatamente anterior de la misma duración
                previousToDate = new Date(from);
                previousToDate.setDate(previousToDate.getDate() - 1);
                
                previousFromDate = new Date(previousToDate.getTime() - periodDuration);
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
                    
                    previousFromDate = new Date(previousToDate.getTime() - periodDuration);
                }
                break;
                
            default:
                // Por defecto usar período anterior
                previousToDate = new Date(from);
                previousToDate.setDate(previousToDate.getDate() - 1);
                
                previousFromDate = new Date(previousToDate.getTime() - periodDuration);
        }
        
        // Validar fechas calculadas
        if (isNaN(previousFromDate.getTime()) || isNaN(previousToDate.getTime())) {
            console.error('Error al calcular fechas del período anterior');
            return { fromDate: '', toDate: '' };
        }
        
        return {
            fromDate: this.formatDateForInput(previousFromDate),
            toDate: this.formatDateForInput(previousToDate)
        };
    },

    /**
     * Actualiza el gráfico de tendencia con comparación de períodos
     */
    updateTrendChart() {
        const trendField = document.getElementById('trend-field');
        const trendPeriod = document.getElementById('trend-period');
        const comparisonMode = document.getElementById('comparison-mode');
        
        if (!trendField || !trendPeriod || !comparisonMode) return;
        if (!trendField.value) {
            this.clearComparisonTable();
            this.showNoDataChart('trend-chart');
            return;
        }
        
        const fieldId = trendField.value;
        const periodType = trendPeriod.value;
        const compareMode = comparisonMode.value;
        
        const field = FieldModel.getById(fieldId);
        if (!field) {
            this.clearComparisonTable();
            this.showNoDataChart('trend-chart');
            return;
        }
        
        try {
            // Usar datos del cache si están disponibles
            let currentPeriodRecords, previousPeriodRecords;
            
            if (this.dataCache.currentPeriodData && this.dataCache.previousPeriodData) {
                currentPeriodRecords = this.dataCache.currentPeriodData;
                previousPeriodRecords = compareMode !== 'none' ? this.dataCache.previousPeriodData : [];
            } else {
                // Obtener filtros actuales
                const filters = this.applyFilters();
                currentPeriodRecords = this.getFilteredRecords(filters);
                
                // Calcular fechas para el período anterior
                const previousPeriodDates = this.calculatePreviousPeriodDates(filters.fromDate, filters.toDate, compareMode);
                
                // Obtener registros del período anterior
                if (compareMode !== 'none') {
                    const previousFilters = {
                        ...filters,
                        fromDate: previousPeriodDates.fromDate,
                        toDate: previousPeriodDates.toDate
                    };
                    
                    previousPeriodRecords = this.getFilteredRecords(previousFilters);
                } else {
                    previousPeriodRecords = [];
                }
            }
            
            // Filtrar registros que tengan el campo seleccionado
            const recordsWithField = currentPeriodRecords.filter(record => 
                record.data && record.data[fieldId] !== undefined && record.data[fieldId] !== null
            );
            
            const previousRecordsWithField = previousPeriodRecords.filter(record => 
                record.data && record.data[fieldId] !== undefined && record.data[fieldId] !== null
            );
            
            if (recordsWithField.length === 0) {
                this.showNoDataChart('trend-chart');
                this.clearComparisonTable();
                return;
            }
            
            // Procesar datos según el tipo de período
            const currentPeriodData = this.aggregateRecordsByPeriod(recordsWithField, fieldId, periodType);
            const previousPeriodData = compareMode !== 'none' && previousRecordsWithField.length > 0 ? 
                this.aggregateRecordsByPeriod(previousRecordsWithField, fieldId, periodType) : null;
            
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
            
        } catch (error) {
            console.error('Error al actualizar gráfico de tendencia:', error);
            this.showNoDataChart('trend-chart');
            this.clearComparisonTable();
        }
    },

    /**
     * Agrupa registros por período y calcula métricas
     * @param {Array} records Registros a agrupar
     * @param {string} fieldId ID del campo para las métricas
     * @param {string} periodType Tipo de período ('day', 'week', 'month', 'quarter', 'year', 'custom')
     * @returns {Object} Datos agrupados
     */
    aggregateRecordsByPeriod(records, fieldId, periodType) {
        // Validar entrada
        if (!records || records.length === 0) {
            return {
                groups: {},
                total: { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
            };
        }
        
        // Ordenar registros por fecha
        records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Agrupar por período
        const groupedData = {};
        let totalSum = 0;
        let totalCount = 0;
        let minValue = Infinity;
        let maxValue = -Infinity;
        let validValues = [];
        
        records.forEach(record => {
            // Validar que el registro tenga fecha y campo válidos
            if (!record.timestamp || !record.data || record.data[fieldId] === undefined || record.data[fieldId] === null) {
                return;
            }
            
            const date = new Date(record.timestamp);
            if (isNaN(date.getTime())) {
                console.warn('Fecha inválida en registro:', record.timestamp);
                return;
            }
            
            let groupKey;
            
            try {
                switch (periodType) {
                    case 'day':
                        groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                        break;
                        
                    case 'week':
                        // Calcular semana del año
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
                        groupKey = 'all';
                }
            } catch (error) {
                console.warn('Error al generar clave de grupo:', error);
                groupKey = 'unknown';
            }
            
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    count: 0,
                    sum: 0,
                    values: []
                };
            }
            
            const value = parseFloat(record.data[fieldId]);
            if (isNaN(value)) {
                console.warn('Valor numérico inválido:', record.data[fieldId]);
                return;
            }
            
            groupedData[groupKey].count++;
            groupedData[groupKey].sum += value;
            groupedData[groupKey].values.push(value);
            
            // Actualizar estadísticas globales
            totalSum += value;
            totalCount++;
            minValue = Math.min(minValue, value);
            maxValue = Math.max(maxValue, value);
            validValues.push(value);
        });
        
        // Calcular promedios y otras métricas para cada grupo
        Object.keys(groupedData).forEach(key => {
            const group = groupedData[key];
            if (group.values.length > 0) {
                group.avg = group.sum / group.count;
                group.min = Math.min(...group.values);
                group.max = Math.max(...group.values);
            } else {
                group.avg = 0;
                group.min = 0;
                group.max = 0;
            }
        });
        
        // Métricas globales
        const averageValue = totalCount > 0 ? totalSum / totalCount : 0;
        const finalMinValue = validValues.length > 0 ? minValue : 0;
        const finalMaxValue = validValues.length > 0 ? maxValue : 0;
        
        return {
            groups: groupedData,
            total: {
                count: totalCount,
                sum: totalSum,
                avg: averageValue,
                min: finalMinValue,
                max: finalMaxValue
            }
        };
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
        
        const decimals = parseInt(document.getElementById('decimal-places')?.value || '2');
        const current = currentPeriodData.total;
        
        // Si no hay período anterior, mostrar solo estadísticas del período actual
        if (!previousPeriodData || previousPeriodData.total.count === 0) {
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
                    <td>${current.count.toLocaleString()}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
            return;
        }
        
        // Datos del período anterior
        const previous = previousPeriodData.total;
        
        // Función auxiliar para calcular diferencia y porcentaje
        const calculateChange = (currentVal, previousVal) => {
            const diff = currentVal - previousVal;
            const percent = previousVal !== 0 ? (diff / Math.abs(previousVal)) * 100 : 0;
            return { diff, percent };
        };
        
        // Calcular diferencias y porcentajes
        const sumChange = calculateChange(current.sum, previous.sum);
        const avgChange = calculateChange(current.avg, previous.avg);
        const maxChange = calculateChange(current.max, previous.max);
        const minChange = calculateChange(current.min, previous.min);
        const countChange = calculateChange(current.count, previous.count);
        
        // Función auxiliar para formatear celdas con color
        const formatChangeCell = (value, isPositiveGood = true) => {
            const isPositive = value >= 0;
            const shouldBeGreen = isPositiveGood ? isPositive : !isPositive;
            const colorClass = shouldBeGreen ? 'text-success' : 'text-danger';
            const prefix = isPositive ? '+' : '';
            return { colorClass, prefix };
        };
        
        // Crear filas con clases para colores según si aumentó o disminuyó
        tableBody.innerHTML = `
            <tr>
                <td>Suma de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.sum, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.sum, decimals)}</td>
                <td class="${formatChangeCell(sumChange.diff).colorClass}">${formatChangeCell(sumChange.diff).prefix}${ChartUtils.formatNumber(sumChange.diff, decimals)}</td>
                <td class="${formatChangeCell(sumChange.percent).colorClass}">${formatChangeCell(sumChange.percent).prefix}${sumChange.percent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Promedio de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.avg, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.avg, decimals)}</td>
                <td class="${formatChangeCell(avgChange.diff).colorClass}">${formatChangeCell(avgChange.diff).prefix}${ChartUtils.formatNumber(avgChange.diff, decimals)}</td>
                <td class="${formatChangeCell(avgChange.percent).colorClass}">${formatChangeCell(avgChange.percent).prefix}${avgChange.percent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Máximo de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.max, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.max, decimals)}</td>
                <td class="${formatChangeCell(maxChange.diff).colorClass}">${formatChangeCell(maxChange.diff).prefix}${ChartUtils.formatNumber(maxChange.diff, decimals)}</td>
                <td class="${formatChangeCell(maxChange.percent).colorClass}">${formatChangeCell(maxChange.percent).prefix}${maxChange.percent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Mínimo de ${fieldName}</td>
                <td>${ChartUtils.formatNumber(current.min, decimals)}</td>
                <td>${ChartUtils.formatNumber(previous.min, decimals)}</td>
                <td class="${formatChangeCell(minChange.diff, false).colorClass}">${formatChangeCell(minChange.diff, false).prefix}${ChartUtils.formatNumber(minChange.diff, decimals)}</td>
                <td class="${formatChangeCell(minChange.percent, false).colorClass}">${formatChangeCell(minChange.percent, false).prefix}${minChange.percent.toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Número de registros</td>
                <td>${current.count.toLocaleString()}</td>
                <td>${previous.count.toLocaleString()}</td>
                <td class="${formatChangeCell(countChange.diff).colorClass}">${formatChangeCell(countChange.diff).prefix}${countChange.diff}</td>
                <td class="${formatChangeCell(countChange.percent).colorClass}">${formatChangeCell(countChange.percent).prefix}${countChange.percent.toFixed(2)}%</td>
            </tr>
        `;
    },
    
    /**
     * Actualiza la vista cuando hay cambios en los datos
     */
    update() {
        // Limpiar cache para forzar actualización
        this.clearCache();
        
        // Recargar la configuración
        const config = StorageService.getConfig();
        if (config) {
            this.kpiStyle = config.kpiStyle || 'modern';
            this.kpiDecimalPlaces = config.kpiDecimalPlaces || 2;
            this.kpiDefaultAggregation = config.kpiDefaultAggregation || 'sum';
            this.kpiMetrics = config.kpiMetrics || {
                showCount: false,
                showDailyAvg: false,
                showEntitiesCount: false,
                showGrowthRate: false,
                showPredictions: false,
                showPercentChange: false
            };
            this.selectedFields = config.kpiFields || [];
        }
        
        // Actualizar KPIs con los nuevos datos
        if (Router.currentRoute === 'kpis') {
            try {
                this.refreshAllData();
            } catch (error) {
                console.error("Error al actualizar KPIs:", error);
                this.showErrorMessage('Error al actualizar los datos de KPIs');
            }
        }
    }
};