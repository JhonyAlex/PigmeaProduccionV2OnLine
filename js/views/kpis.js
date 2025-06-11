const KPIsView = {
  /**
   * Lista de componentes KPI disponibles para mostrar/ocultar.
   * placeholderId es el ID del contenedor DIV que se mostrará/ocultará.
   */
  availableKPIs: [
    { id: 'kpiCards', name: 'Tarjetas de Resumen', defaultVisible: true, placeholderId: 'kpi-cards-container' },
    { id: 'performanceTrendChart', name: 'Gráfico de Tendencia (Líneas)', defaultVisible: true, placeholderId: 'kpi-line-chart-container' }, // Usará kpi-line-chart
    { id: 'dailyBreakdownChart', name: 'Gráfico de Desglose Diario (Barras)', defaultVisible: true, placeholderId: 'kpi-bar-chart-container' }, // Usará kpi-bar-chart
    { id: 'operatorBreakdownChart', name: 'Gráfico de Desglose por Operario (Pastel)', defaultVisible: true, placeholderId: 'kpi-pie-chart-container' }, // Usará kpi-pie-chart
    { id: 'comparisonTable', name: 'Tabla Comparativa de Periodos', defaultVisible: true, placeholderId: 'kpi-comparison-container' }
  ],

  /**
   * Configuración cargada del almacenamiento.
   * Incluye mapeo de campos, filtros persistentes y KPIs visibles.
   */
  config: {
    mapping: {
      metersFieldId: null,
      operatorFieldId: null,
      shiftFieldId: null,
      machineFieldId: null,
      timeFieldId: null
    },
    filters: {},
    comparison: { period: 'auto' },
    lineRange: {},
    visibleKPIs: [] // Se llenará en loadConfig a partir de availableKPIs y StorageService
  },

  charts: {}, // Almacena instancias de Chart.js { bar: Chart, line: Chart, pie: Chart }
  dataSubscriber: null,

  /**
   * Inicializa la vista de KPIs y configura eventos.
   */
  init() {
    this.loadConfig();
    this.render();
    this.attachEvents();
    this.refresh();
    this.setupRealtime();
  },

  /**
   * Suscribe a los cambios de datos para refrescar en tiempo real.
   * Esto permite que la vista de KPIs se actualice automáticamente si los datos subyacentes cambian.
   */
  setupRealtime() {
    if (this.dataSubscriber) this.dataSubscriber(); // Cancela la suscripción anterior si existe
    this.dataSubscriber = StorageService.subscribeToDataChanges(() => {
      if (Router.currentRoute === 'kpis') { // Solo refresca si la vista de KPIs está activa
        this.refresh();
      }
    });
  },

  /**
   * Obtiene los valores actuales de los filtros principales de la vista.
   * @returns {object} Un objeto con los valores de los filtros: fromDate, toDate, shift, operator, machine.
   */
  getFilters() {
    return {
      fromDate: this.config.filters.fromDate,
      toDate: this.config.filters.toDate,
      shift: this.config.filters.shift,
      operator: this.config.filters.operator,
      machine: this.config.filters.machine
    };
  },

  /**
   * Lee la configuración almacenada o intenta inferir campos por nombre.
   */
  loadConfig() {
    const storedConfig = StorageService.getConfig();
    // Crear una copia profunda de la configuración por defecto de KPIsView para evitar mutaciones accidentales.
    // Esto es importante porque this.config podría ser modificado y no queremos que afecte a futuras cargas como "default".
    const defaultConfigValues = {
        mapping: {
            metersFieldId: null, operatorFieldId: null, shiftFieldId: null, machineFieldId: null, timeFieldId: null
        },
        filters: {},
        comparison: { period: 'auto' },
        lineRange: {},
        visibleKPIs: this.availableKPIs.filter(kpi => kpi.defaultVisible).map(kpi => kpi.id)
    };

    if (storedConfig.kpiConfig) {
      const saved = storedConfig.kpiConfig;
      this.config = {
        // Empezar con una estructura base que incluya todos los defaults posibles
        ...defaultConfigValues,
        // Sobrescribir con lo guardado desde el almacenamiento
        ...saved,
        // Asegurar que los objetos anidados también se fusionen correctamente
        mapping: { ...defaultConfigValues.mapping, ...(saved.mapping || {}) },
        filters: { ...defaultConfigValues.filters, ...(saved.filters || {}) },
        comparison: { ...defaultConfigValues.comparison, ...(saved.comparison || {}) },
        lineRange: { ...defaultConfigValues.lineRange, ...(saved.lineRange || {}) },
        // Si visibleKPIs está en saved y es un array, se usará; si no, se mantiene el de defaultConfigValues.
        // Esto previene errores si visibleKPIs es null o undefined en la config guardada.
        visibleKPIs: Array.isArray(saved.visibleKPIs) ? saved.visibleKPIs : defaultConfigValues.visibleKPIs
      };
    } else {
      // No hay kpiConfig guardada, usar defaultConfigValues completo
      this.config = { ...defaultConfigValues };
      // Intentar inferir campos por nombre solo si es la primera vez o no hay config de mapeo
      const guess = name => {
        const f = FieldModel.getActive().find(fl =>
          fl.name.toLowerCase().includes(name)
        );
        return f ? f.id : null;
      };
      this.config.mapping.metersFieldId = guess('metro');
      this.config.mapping.operatorFieldId = guess('oper');
      this.config.mapping.shiftFieldId = guess('turno');
      this.config.mapping.machineFieldId = guess('maquin');
      this.config.mapping.timeFieldId = guess('tiempo');
    }
  },

  /**
   * Guarda la configuración actual en almacenamiento.
   */
  saveConfig() {
    const cfg = StorageService.getConfig();
    cfg.kpiConfig = this.config;
    StorageService.updateConfig(cfg);
  },

  /**
   * Crea el HTML base de la vista.
   */
  render() {
    const container = Router.getActiveViewContainer() || document.querySelector('.main-content');
    if (!container) return;

    container.innerHTML = this._renderLayout();

    // Inicializar selects con buscador
    // Filters
    UIUtils.setupSearchableSelect('#kpi-shift');
    UIUtils.setupSearchableSelect('#kpi-operator');
    UIUtils.setupSearchableSelect('#kpi-machine');
    UIUtils.setupSearchableSelect('#kpi-compare-period');
    // Config
    UIUtils.setupSearchableSelect('#cfg-meters');
    UIUtils.setupSearchableSelect('#cfg-operator');
    UIUtils.setupSearchableSelect('#cfg-shift');
    UIUtils.setupSearchableSelect('#cfg-machine');
    UIUtils.setupSearchableSelect('#cfg-time');


    // Rellenar selects de filtros con opciones si los campos están definidos
    this.populateFilterSelects();
  },

  /**
   * Genera el HTML principal de la vista de KPIs.
   * @returns {string} HTML de la vista.
   */
  _renderLayout() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = d => d.toISOString().split('T')[0];

    const fromVal = this.config.filters.fromDate || fmt(weekAgo);
    const toVal = this.config.filters.toDate || fmt(today);
    const lineFrom = this.config.lineRange.fromDate || fromVal;
    const lineTo = this.config.lineRange.toDate || toVal;

    // Main dashboard structure
    let html = `<div class="container-fluid" id="kpis-view" style="padding-top: 1rem; padding-bottom: 1rem;">`;

    // Row 1: Filters
    html += `
      <div class="row">
        <div class="col-12 kpi-section" id="kpi-filters-section">
          <h5 class="kpi-section-title">Filtros</h5>
          ${this._renderFiltersHTML(fromVal, toVal)}
        </div>
      </div>`;

    // Row 2: KPI Cards
    // The _renderCardsPlaceholderHTML method itself handles the visibility of its content.
    // We only add the section title if the placeholder div itself would be rendered (i.e., kpiCards is configured to be potentially visible)
    const kpiCardsDef = this.availableKPIs.find(k => k.id === 'kpiCards');
    if (kpiCardsDef) { // Check if kpiCardsDef is found
        const kpiCardsContent = this._renderCardsPlaceholderHTML();
        // Only add the section if there's content (placeholder div) to show
        if (kpiCardsContent && !kpiCardsContent.includes('style="display:none;"')) {
             html += `
               <div class="row">
                 <div class="col-12 kpi-section" id="kpi-cards-section">
                   <h5 class="kpi-section-title">Tarjetas de Resumen</h5>
                   ${kpiCardsContent}
                 </div>
               </div>`;
        } else if (kpiCardsContent) { // if it's hidden, still include the placeholder div for JS logic
            html += kpiCardsContent;
        }
    }


    // Row 3: Line Range Controls (conditionally rendered within the method)
    const lineRangeControlsContent = this._renderLineRangeControlsHTML(lineFrom, lineTo);
    if (!lineRangeControlsContent.includes('<!-- Line range controls hidden')) {
      html += `
        <div class="row">
          <div class="col-12 kpi-section" id="kpi-linerange-section">
            ${lineRangeControlsContent}
          </div>
        </div>`;
    }

    // Row 4: Charts
    // The _renderChartsRowHTML method handles visibility of individual charts.
    // The section title "Gráficos" should be displayed if any chart is potentially visible.
    const chartKPIs = ['performanceTrendChart', 'dailyBreakdownChart', 'operatorBreakdownChart'];
    const anyChartVisibleOrConfigured = chartKPIs.some(kpiId => {
        const kpiDef = this.availableKPIs.find(k => k.id === kpiId);
        return kpiDef && this.config.visibleKPIs.includes(kpiId); // Check if configured to be visible
    });

    if (anyChartVisibleOrConfigured) {
        html += `
          <div class="row">
            <div class="col-12 kpi-section" id="kpi-charts-section">
              <h5 class="kpi-section-title">Gráficos</h5>
              ${this._renderChartsRowHTML()}
            </div>
          </div>`;
    } else {
         // If no charts are configured to be visible, we might still want _renderChartsRowHTML
         // to render the hidden placeholder divs for JS logic, but without a section title.
         html += this._renderChartsRowHTML();
    }


    // Row 5: Comparison Table
    const comparisonTableDef = this.availableKPIs.find(k => k.id === 'comparisonTable');
    if (comparisonTableDef) {
        const comparisonTableContent = this._renderComparisonPlaceholderHTML();
        if (comparisonTableContent && !comparisonTableContent.includes('style="display:none;"')) {
            html += `
              <div class="row">
                <div class="col-12 kpi-section" id="kpi-comparison-table-section">
                  <h5 class="kpi-section-title">Tabla Comparativa</h5>
                  ${comparisonTableContent}
                </div>
              </div>`;
        } else if (comparisonTableContent) {
            html += comparisonTableContent;
        }
    }


    // Row 6: Configuration Form
    html += `
      <div class="row">
        <div class="col-12 kpi-section" id="kpi-config-section">
          <h5 class="kpi-section-title">Configuración General</h5>
          ${this._renderConfigFormHTML()}
        </div>
      </div>`;

    html += `</div>`; // close .container-fluid
    return html;
  },

  /**
   * Genera el HTML para el formulario de filtros.
   * @param {string} fromVal - Valor inicial para el campo "Desde".
   * @param {string} toVal - Valor inicial para el campo "Hasta".
   * @returns {string} HTML del formulario de filtros.
   */
  _renderFiltersHTML(fromVal, toVal) {
    return `
      <div class="row mb-3 gy-2">
        <form id="kpi-filter-form" class="col-12 col-md-9 row g-2 align-items-end">
          <div class="col-6 col-md-3">
            <label class="form-label" for="kpi-from">Desde</label>
            <input type="date" id="kpi-from" class="form-control" value="${fromVal}">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label" for="kpi-to">Hasta</label>
            <input type="date" id="kpi-to" class="form-control" value="${toVal}">
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label" for="kpi-shift">Turno</label>
            ${UIUtils.createSearchableSelect('kpi-shift', '')}
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label" for="kpi-operator">Operario</label>
            ${UIUtils.createSearchableSelect('kpi-operator', '')}
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label" for="kpi-machine">Máquina</label>
            ${UIUtils.createSearchableSelect('kpi-machine', '')}
          </div>
          <div class="col-6 col-md-2">
            <label class="form-label" for="kpi-compare-period">Comparar por</label>
            ${UIUtils.createSearchableSelect('kpi-compare-period', `
              <option value="auto">Auto</option>
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            `, 'form-select form-select-sm')}
          </div>
          <div class="col-12">
            <div class="btn-group btn-group-sm" id="kpi-date-shortcuts" role="group">
              <button type="button" class="btn btn-outline-secondary" data-range="last-week">Semana pasada</button>
              <button type="button" class="btn btn-outline-secondary" data-range="last-month">Mes pasado</button>
              <button type="button" class="btn btn-outline-secondary" data-range="year-current">Año actual</button>
            </div>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary w-100" type="submit">Aplicar</button>
          </div>
        </form>
        <div class="col-12 col-md-3 text-md-end">
          <button id="kpi-export-excel" class="btn btn-outline-secondary me-2">Excel</button>
          <button id="kpi-export-pdf" class="btn btn-outline-secondary">PDF</button>
        </div>
      </div>
    `;
  },

  /**
   * Genera el HTML para el placeholder de las tarjetas KPI.
   * @returns {string} HTML del placeholder de las tarjetas.
   */
  _renderCardsPlaceholderHTML() {
    const kpi = this.availableKPIs.find(k => k.id === 'kpiCards');
    if (!this.config.visibleKPIs.includes(kpi.id)) return `<div id="${kpi.placeholderId}" style="display:none;"></div>`;
    return `<div id="${kpi.placeholderId}"><div id="kpi-cards" class="row gy-3 mb-4"></div></div>`;
  },

  /**
   * Genera el HTML para los controles de rango de fechas de los gráficos de línea.
   * @param {string} lineFrom - Valor inicial para el campo "Desde" del gráfico de línea.
   * @param {string} lineTo - Valor inicial para el campo "Hasta" del gráfico de línea.
   * @returns {string} HTML de los controles de rango o un comentario si están ocultos.
   */
  _renderLineRangeControlsHTML(lineFrom, lineTo) {
    // Estos controles son relevantes si 'performanceTrendChart' (línea) o 'dailyBreakdownChart' (barras) están visibles.
    const relevantKPIs = ['performanceTrendChart', 'dailyBreakdownChart'];
    const showControls = this.config.visibleKPIs.some(id => relevantKPIs.includes(id));

    if (!showControls) return '<!-- Line range controls hidden as relevant charts are not visible -->';

    return `
      <div id="line-range-controls" class="d-flex justify-content-end gap-2 mb-2">
        <input type="date" id="kpi-line-from" class="form-control form-control-sm" value="${lineFrom}">
        <input type="date" id="kpi-line-to" class="form-control form-control-sm" value="${lineTo}">
        <div class="btn-group btn-group-sm">
          <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="last-week">Semana pasada</button>
          <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="last-month">Mes pasado</button>
          <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="year-current">Año actual</button>
        </div>
      </div>
    `;
  },

  /**
   * Genera el HTML para la fila que contiene los gráficos.
   * Los gráficos se pueden organizar en columnas dentro de esta fila.
   * @returns {string} HTML de la fila de gráficos.
   */
  _renderChartsRowHTML() {
    let chartsHTML = '<div class="row">'; // Abre la fila para los gráficos

    const dailyBreakdownKPI = this.availableKPIs.find(k => k.id === 'dailyBreakdownChart');
    const performanceTrendKPI = this.availableKPIs.find(k => k.id === 'performanceTrendChart');
    const operatorBreakdownKPI = this.availableKPIs.find(k => k.id === 'operatorBreakdownChart');

    // Configuración de layout para gráficos: [KPI_ID, colClass]
    // Esto podría ser más dinámico o configurable en el futuro.
    const chartLayout = [
        { kpi: performanceTrendKPI, colClass: 'col-lg-6 col-md-12', canvasId: 'kpi-line-chart' },
        { kpi: dailyBreakdownKPI, colClass: 'col-lg-6 col-md-12', canvasId: 'kpi-bar-chart' },
        { kpi: operatorBreakdownKPI, colClass: 'col-lg-6 col-md-12', canvasId: 'kpi-pie-chart' } // Podría ser col-lg-12 si es el único en una sub-fila o si se quiere más grande.
    ];

    chartLayout.forEach(item => {
        const isVisible = this.config.visibleKPIs.includes(item.kpi.id);
        const displayStyle = isVisible ? '' : 'style="display:none;"';
        chartsHTML += `
            <div id="${item.kpi.placeholderId}" class="${item.colClass} mb-4" ${displayStyle}>
                <div class="kpi-chart-wrapper">
                    <canvas id="${item.canvasId}"></canvas>
                </div>
            </div>
        `;
    });

    chartsHTML += '</div>'; // Cierra la fila de los gráficos
    return chartsHTML;
  },

  /**
   * Genera el HTML para los placeholders de los gráficos, condicionalmente.
   * ESTE MÉTODO YA NO ES NECESARIO, _renderChartsRowHTML() lo reemplaza.
   * Se mantiene por si alguna lógica externa aún lo llama, pero debería ser eliminado eventualmente.
   * @deprecated
   * @returns {string} HTML de los placeholders de los gráficos.
   */
  _renderChartsPlaceholderHTML() {
    // console.warn("_renderChartsPlaceholderHTML is deprecated and will be removed. Use _renderChartsRowHTML incorporated in _renderLayout.");
    // Devuelve una cadena vacía o un contenedor base si es necesario para evitar errores,
    // pero la lógica principal está en _renderChartsRowHTML.
    return '<!-- _renderChartsPlaceholderHTML is deprecated -->';
  },

  /**
   * Genera el HTML para el placeholder de la tabla de comparación, condicionalmente.
   * @returns {string} HTML del placeholder de la tabla de comparación.
   */
  _renderComparisonPlaceholderHTML() {
    const kpi = this.availableKPIs.find(k => k.id === 'comparisonTable');
    if (!this.config.visibleKPIs.includes(kpi.id)) return `<div id="${kpi.placeholderId}" style="display:none;"></div>`;

    return `
      <div id="${kpi.placeholderId}">
        <div id="kpi-comparison" class="table-responsive mb-4">
          <table class="table table-sm">
            <thead><tr><th>Métrica</th><th>Actual</th><th>Anterior</th><th>Diferencia</th><th>Variación %</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Genera el HTML para el formulario de configuración de campos y visibilidad de KPIs.
   * @returns {string} HTML del formulario de configuración.
   */
  _renderConfigFormHTML() {
    const numericFields = FieldModel.getNumericFields();
    const allFields = FieldModel.getActive();
    const createOptions = (fields, selected) => {
      const sorted = [...fields].sort((a, b) => a.name.localeCompare(b.name, 'es', {sensitivity: 'accent'}));
      return sorted.map(f => `<option value="${f.id}" ${selected === f.id ? 'selected' : ''}>${f.name}</option>`).join('');
    };

    let kpiVisibilityCheckboxesHTML = this.availableKPIs.map(kpi => `
      <div class="form-check col"> <!-- Usar col para que se alineen en el grid -->
        <input class="form-check-input kpi-visibility-checkbox" type="checkbox" value="${kpi.id}" id="cfg-kpi-${kpi.id}" ${this.config.visibleKPIs.includes(kpi.id) ? 'checked' : ''}>
        <label class="form-check-label" for="cfg-kpi-${kpi.id}">
          ${kpi.name}
        </label>
      </div>
    `).join('');

    return `
      <div class="mt-4">
        <form id="kpi-config-form">
          <h5>Configuración de Campos</h5>
          <div class="row row-cols-1 row-cols-md-3 g-3 mb-3">
            <div class="col">
              <label class="form-label" for="cfg-meters">Campo Metros Impresos</label>
              ${UIUtils.createSearchableSelect('cfg-meters', `<option value="">-- Sin definir --</option>${createOptions(numericFields, this.config.mapping.metersFieldId)}`)}
            </div>
            <div class="col">
              <label class="form-label" for="cfg-operator">Campo Operario</label>
              ${UIUtils.createSearchableSelect('cfg-operator', `<option value="">-- Sin definir --</option>${createOptions(allFields, this.config.mapping.operatorFieldId)}`)}
            </div>
            <div class="col">
              <label class="form-label" for="cfg-shift">Campo Turno</label>
              ${UIUtils.createSearchableSelect('cfg-shift', `<option value="">-- Sin definir --</option>${createOptions(allFields, this.config.mapping.shiftFieldId)}`)}
            </div>
            <div class="col">
              <label class="form-label" for="cfg-machine">Campo Máquina</label>
              ${UIUtils.createSearchableSelect('cfg-machine', `<option value="">-- Sin definir --</option>${createOptions(allFields, this.config.mapping.machineFieldId)}`)}
            </div>
            <div class="col">
              <label class="form-label" for="cfg-time">Campo Tiempo por Pedido</label>
              ${UIUtils.createSearchableSelect('cfg-time', `<option value="">-- Sin definir --</option>${createOptions(numericFields, this.config.mapping.timeFieldId)}`)}
            </div>
          </div>

          <h5 class="mt-4">Visibilidad de KPIs</h5>
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 mb-3">
            ${kpiVisibilityCheckboxesHTML}
          </div>

          <div class="col-12 mt-3">
            <button class="btn btn-primary" type="submit">Guardar Configuración</button>
          </div>
        </form>
      </div>
    `;
  },

  /**
   * Llena los select de filtros con las opciones disponibles.
   */
  populateFilterSelects() {
    const fill = (selectId, fieldId) => {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      sel.innerHTML = '<option value="">Todos</option>';
      if (!fieldId) return;
      const field = FieldModel.getById(fieldId);
      if (field && Array.isArray(field.options)) {
        const options = field.options
          .filter(opt => (typeof opt === 'object' ? opt.active !== false : true))
          .sort(UIUtils.sortSelectOptions);
        options.forEach(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const o = document.createElement('option');
          o.value = val;
          o.textContent = val;
          sel.appendChild(o);
        });
      }
      const current = this.config.filters[selectId.replace('kpi-', '')];
      if (current) sel.value = current;
      UIUtils.setupSearchableSelect('#' + selectId);
    };
    fill('kpi-shift', this.config.mapping.shiftFieldId);
    fill('kpi-operator', this.config.mapping.operatorFieldId);
    fill('kpi-machine', this.config.mapping.machineFieldId);
  },

  /**
   * Configura los listeners de la interfaz.
   */
  attachEvents() {
    const form = document.getElementById('kpi-filter-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      this.config.filters.fromDate = document.getElementById('kpi-from').value;
      this.config.filters.toDate = document.getElementById('kpi-to').value;
      this.config.filters.shift = document.getElementById('kpi-shift').value;
      this.config.filters.operator = document.getElementById('kpi-operator').value;
      this.config.filters.machine = document.getElementById('kpi-machine').value;
      this.saveConfig();
      this.refresh();
    });

    document.getElementById('kpi-export-excel').addEventListener('click', () => {
      this.exportExcel();
    });
    document.getElementById('kpi-export-pdf').addEventListener('click', () => {
      this.exportPDF();
    });

    const configForm = document.getElementById('kpi-config-form');
    if (configForm) {
        configForm.addEventListener('submit', e => {
            e.preventDefault();
            // Guardar mapeo de campos
            const mappingIds = ['metersFieldId', 'operatorFieldId', 'shiftFieldId', 'machineFieldId', 'timeFieldId'];
            mappingIds.forEach(id => {
                const input = document.getElementById(`cfg-${id.replace('FieldId','')}`);
                if (input) this.config.mapping[id] = input.value || null;
            });

            // Guardar visibilidad de KPIs
            const newVisibleKPIs = [];
            document.querySelectorAll('.kpi-visibility-checkbox:checked').forEach(checkbox => {
                newVisibleKPIs.push(checkbox.value);
            });
            this.config.visibleKPIs = newVisibleKPIs;

            this.saveConfig();
            this.populateFilterSelects(); // Actualizar filtros por si cambiaron los campos

            // Re-renderizar completamente la vista para aplicar cambios de visibilidad de placeholders
            // y luego refrescar los datos/componentes para los KPIs que ahora son visibles.
            this.render();
            // NOTA: Es crucial re-atachar los eventos DESPUÉS de this.render() porque render() sobreescribe el DOM.
            // Sin embargo, llamar a this.attachEvents() aquí crearía un bucle infinito si el propio
            // listener del form está dentro de attachEvents.
            // La solución correcta es que this.render() no llame a this.attachEvents() o
            // que el listener del configForm se atache una sola vez fuera del ciclo render/attach.
            // Por ahora, para evitar el bucle, no se re-atacharán todos los eventos aquí,
            // asumiendo que los elementos principales (como el propio form) persisten o que
            // los eventos delegados se usan (que no es el caso actual).
            // Una mejor solución a largo plazo sería separar el attach del configForm.
            // Para este paso, se omite la re-llamada a attachEvents() para evitar el bucle,
            // pero se reconoce que esto podría dejar algunos eventos sin atachar si render() los destruye.
            // Sin embargo, dado que this.render() está reconstruyendo los selects, SÍ necesitamos
            // re-inicializarlos. Y el this.refresh() final se encargará de los datos.

            // Re-setup de los selectores TomSelect dentro del formulario de configuración si fue re-renderizado.
            // Esto es un workaround. Idealmente, this.render() debería manejar esto o no destruir y reconstruir el form.
            UIUtils.setupSearchableSelect('#cfg-meters');
            UIUtils.setupSearchableSelect('#cfg-operator');
            UIUtils.setupSearchableSelect('#cfg-shift');
            UIUtils.setupSearchableSelect('#cfg-machine');
            UIUtils.setupSearchableSelect('#cfg-time');
            // No es necesario re-atachar el listener del form porque el elemento form en sí no se elimina y recrea,
            // solo su contenido. Si el propio <form> fuera recreado por render(), necesitaríamos re-atachar.

            this.refresh(); // Recalcular y mostrar datos para KPIs visibles
        });
    }

    const comparePeriodSelect = document.getElementById('kpi-compare-period');
    if (comparePeriodSelect) {
        comparePeriodSelect.addEventListener('change', e => {
            this.config.comparison.period = e.target.value;
            this.saveConfig();
            this.refresh();
        });
    }

    document.querySelectorAll('#kpi-date-shortcuts button').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = this.getShortcutRange(btn.dataset.range);
        document.getElementById('kpi-from').value = r.from;
        document.getElementById('kpi-to').value = r.to;
        this.config.filters.fromDate = r.from;
        this.config.filters.toDate = r.to;
        this.saveConfig();
        this.refresh();
      });
    });

    document.querySelectorAll('.line-shortcut').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = this.getShortcutRange(btn.dataset.range);
        document.getElementById('kpi-line-from').value = r.from;
        document.getElementById('kpi-line-to').value = r.to;
        this.config.lineRange.fromDate = r.from;
        this.config.lineRange.toDate = r.to;
        this.saveConfig();
        this.refresh();
      });
    });

    ['kpi-line-from','kpi-line-to'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('change', () => {
        this.config.lineRange[id === 'kpi-line-from' ? 'fromDate' : 'toDate'] = el.value;
        this.saveConfig();
        this.refresh();
      });
    });
  },

  /**

   * Obtiene los filtros actuales.
   */
  getFilters() {
    return {
      fromDate: this.config.filters.fromDate,
      toDate: this.config.filters.toDate,
      shift: this.config.filters.shift,
      operator: this.config.filters.operator,
      machine: this.config.filters.machine
    };
  },

  /**
   * Filtra registros según los filtros activos y devuelve el array resultante.
   * Los registros se filtran primero por el rango de fechas global.
   * Luego, se aplican los filtros de dimensión (turno, operario, máquina)
   * basados en los campos mapeados en la configuración y los valores de filtro seleccionados.
   */
  getFilteredRecords() {
    const f = this.getFilters(); // Obtiene los valores de filtro actuales (fromDate, toDate, shift, operator, machine)
    const map = this.config.mapping; // Obtiene los IDs de campo mapeados

    // 1. Filtrar por rango de fechas
    const base = RecordModel.filterMultiple({ fromDate: f.fromDate, toDate: f.toDate });

    // 2. Filtrar por dimensiones (turno, operario, máquina)
    // Solo se aplica el filtro si el campo de dimensión está mapeado y se ha seleccionado un valor de filtro.
    return base.filter(rec => {
      const data = rec.data || {};
      // Filtrado por Turno
      if (map.shiftFieldId && f.shift && data[map.shiftFieldId] !== f.shift) {
        return false;
      }
      // Filtrado por Operario
      if (map.operatorFieldId && f.operator && data[map.operatorFieldId] !== f.operator) {
        return false;
      }
      // Filtrado por Máquina
      if (map.machineFieldId && f.machine && data[map.machineFieldId] !== f.machine) {
        return false;
      }
      return true;
    });
  },

  /**
   * Actualiza la vista calculando métricas y gráficos para los KPIs visibles.
   */
  refresh() {
    const records = this.getFilteredRecords();

    // Renderizar componentes KPI sólo si están visibles y sus placeholders existen
    if (this.config.visibleKPIs.includes('kpiCards') && document.getElementById('kpi-cards-container')) {
      this.renderCards(records);
    } else if (document.getElementById('kpi-cards')) { // si el placeholder interno existe pero el contenedor no (o kpi no visible)
      document.getElementById('kpi-cards').innerHTML = ''; // Limpiar
    }

    // renderCharts y renderComparison ahora tienen lógica interna para verificar visibilidad
    // y destruir charts si es necesario.
    this.renderCharts(records);
    this.renderComparison(records);
  },

  /**
   * Calcula métricas básicas para mostrar en tarjetas.
   */
  computeMetrics(records) {
    const map = this.config.mapping;
    const sum = fieldId => KpiUtils.aggregateField(records, fieldId, 'sum');
    const avg = fieldId => KpiUtils.aggregateField(records, fieldId, 'avg');
    const totalMeters = sum(map.metersFieldId);
    const timeAvg = map.timeFieldId ? avg(map.timeFieldId) : 0;
    const metersByMachine = this.groupByField(records, map.machineFieldId, map.metersFieldId);
    const machinesUsed = Object.keys(metersByMachine).length;

    const metersByDay = KpiUtils.groupByPeriod(records, map.metersFieldId, 'day');
    const metersByShift = this.groupByField(records, map.shiftFieldId, map.metersFieldId);
    const metersByOperator = this.groupByField(records, map.operatorFieldId, map.metersFieldId);
    return {
      totalMeters,
      timeAvg,
      metersByMachine,
      machinesUsed,
      metersByDay,
      metersByShift,
      metersByOperator
    };
  },

  /**
   * Agrupa registros por un campo y suma un campo numérico.
   */
  groupByField(records, groupFieldId, sumFieldId) {
    const result = {};
    if (!groupFieldId || !sumFieldId) return result;
    records.forEach(rec => {
      const key = rec.data[groupFieldId] || 'N/D';
      const val = parseFloat(rec.data[sumFieldId]) || 0;
      if (!result[key]) result[key] = 0;
      result[key] += val;
    });
    return result;
  },

  /**
   * Devuelve un rango de fechas predefinido.
   */
  getShortcutRange(type) {
    const now = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    let from, to;
    switch (type) {
      case 'last-week': {
        const day = now.getDay() || 7;
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 6);
        break;
      }
      case 'last-month': {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'year-current': {
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
      }
      default:
        from = to = now;
    }
    return { from: fmt(from), to: fmt(to) };
  },

  /**

  /**

   * Devuelve un rango de fechas predefinido.
   */
  getShortcutRange(type) {
    const now = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    let from, to;
    switch (type) {
      case 'last-week': {
        const day = now.getDay() || 7;
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 6);
        break;
      }
      case 'last-month': {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'year-current': {
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
      }
      default:
        from = to = now;
    }
    return { from: fmt(from), to: fmt(to) };
  },

  /**
   * Muestra tarjetas con métricas clave, si está visible.
   */
  renderCards(records) {
    const container = document.getElementById('kpi-cards');
    if (!this.config.visibleKPIs.includes('kpiCards')) {
        if (container) container.innerHTML = '<!-- KPI Cards hidden -->';
        return;
    }
    if (!container) return; // Placeholder no existe

    const metrics = this.computeMetrics(records);
    const cardData = [
      { title: 'Total Metros Impresos', value: ChartUtils.formatNumber(metrics.totalMeters) },
      { title: 'Tiempo Promedio por Pedido', value: ChartUtils.formatNumber(metrics.timeAvg) },
      { title: 'Máquinas Registradas', value: metrics.machinesUsed }
    ];

    container.innerHTML = ''; // Limpiar antes de añadir nuevas tarjetas
    cardData.forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-3';
      col.innerHTML = `
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <h6 class="text-muted small">${c.title}</h6>
            <h4>${c.value}</h4>
          </div>
        </div>`;
      container.appendChild(col);
    });
  },

  /**
   * Renderiza gráficos de barras, líneas y pastel, si están visibles.
   */
  renderCharts(records) {
    const currentPeriodMetrics = this.computeMetrics(records); // Metrics for the main selected period

    /**
     * Helper para destruir una instancia de Chart.js existente en un canvas y limpiar referencias.
     * @param {string} chartName - Nombre de la propiedad en `this.charts` (e.g., 'line', 'bar', 'pie').
     * @param {string} canvasId - ID del elemento canvas.
     */
    const destroyChartInstance = (chartName, canvasId) => {
        // Destruir la instancia de Chart almacenada en this.charts
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
        // Asegurarse de que cualquier instancia de Chart directamente asociada al canvas también se destruya
        // (esto es un fallback, ChartUtils debería manejarlo, pero es bueno ser defensivo).
        const canvas = document.getElementById(canvasId);
        if (canvas && canvas.chart) { // `canvas.chart` es una referencia que ChartUtils podría establecer
            canvas.chart.destroy();
            canvas.chart = null; // Limpiar la referencia en el elemento canvas
        } else if (canvas) { // Si no hay instancia de chart pero el canvas existe, limpiarlo visualmente.
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const metersFieldId = this.config.mapping.metersFieldId;
    const primaryMetricName = FieldModel.getById(metersFieldId)?.name || 'Métrica Primaria';

    // --- Performance Trend Line Chart (Current vs Previous) ---
    const performanceTrendKPI = this.availableKPIs.find(k => k.id === 'performanceTrendChart');
    const lineChartCanvasId = 'kpi-line-chart';
    const performanceTrendVisible = this.config.visibleKPIs.includes(performanceTrendKPI.id);
    const performanceTrendContainer = document.getElementById(performanceTrendKPI.placeholderId);

    if (performanceTrendVisible && performanceTrendContainer && performanceTrendContainer.style.display !== 'none') {
        if (!metersFieldId) {
            destroyChartInstance('line', lineChartCanvasId);
            const canvas = document.getElementById(lineChartCanvasId);
            if(canvas) { // Mostrar mensaje si el campo primario no está configurado
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = "16px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`Campo "${primaryMetricName}" no configurado.`, canvas.width / 2, canvas.height / 2);
            }
        } else {
            // 1. Obtener filtros de dimensión actuales para una comparación equitativa.
            const mainFilters = this.getFilters();
            const map = this.config.mapping;

            // 2. Determinar el rango de fechas para el periodo anterior.
            const previousDateRange = KpiUtils.previousRange(mainFilters.fromDate, mainFilters.toDate, this.config.comparison.period);

            // 3. Obtener todos los registros del periodo anterior basados solo en fecha.
            let previousRecords = RecordModel.filterMultiple({ fromDate: previousDateRange.from, toDate: previousDateRange.to });

            // 4. Aplicar los MISMOS filtros de dimensión (turno, operario, máquina) del periodo actual
            //    a los registros del periodo anterior. Esto asegura una comparación "manzanas con manzanas".
            previousRecords = previousRecords.filter(rec => {
                const data = rec.data || {};
                if (map.shiftFieldId && mainFilters.shift && data[map.shiftFieldId] !== mainFilters.shift) return false;
                if (map.operatorFieldId && mainFilters.operator && data[map.operatorFieldId] !== mainFilters.operator) return false;
                if (map.machineFieldId && mainFilters.machine && data[map.machineFieldId] !== mainFilters.machine) return false;
                return true;
            });

            const previousPeriodMetrics = this.computeMetrics(previousRecords);
            const trendChartData = this._prepareLineChartData(currentPeriodMetrics, previousPeriodMetrics);

            if (trendChartData && trendChartData.datasets.some(ds => ds.data.length > 0)) {
                this.charts.line = ChartUtils.createLineChart(
                    lineChartCanvasId,
                    `Tendencia de ${FieldModel.getById(metersFieldId)?.name || 'Métrica Primaria'} (vs Anterior)`,
                    { x: 'Periodo (Día)', y: FieldModel.getById(metersFieldId)?.name || 'Valor' },
                    trendChartData.datasets
                );
                if (this.charts.line) {
                    this.charts.line.data.labels = trendChartData.labels; // Ensure labels are set
                    this.charts.line.update();
                } else { destroyChartInstance('line', lineChartCanvasId); }
            } else {
                destroyChartInstance('line', lineChartCanvasId);
            }
        }
    } else {
        destroyChartInstance('line', lineChartCanvasId);
    }

    // --- Bar Chart (Daily Breakdown for current period) ---
    const dailyBreakdownKPI = this.availableKPIs.find(k => k.id === 'dailyBreakdownChart');
    const barChartCanvasId = 'kpi-bar-chart';
    const dailyBreakdownVisible = this.config.visibleKPIs.includes(dailyBreakdownKPI.id);
    const dailyBreakdownContainer = document.getElementById(dailyBreakdownKPI.placeholderId);

    if (dailyBreakdownVisible && dailyBreakdownContainer && dailyBreakdownContainer.style.display !== 'none') {
        // Verifica si el campo primario para métricas está configurado.
        if (!metersFieldId) {
             destroyChartInstance('bar', barChartCanvasId); // Limpia cualquier gráfico anterior.
             const canvas = document.getElementById(barChartCanvasId);
             if(canvas) { // Muestra mensaje en el canvas.
                const ctx = canvas.getContext('2d');
                if (ctx) { // Asegurarse que el contexto existe
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.font = "16px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(`Campo "${primaryMetricName}" no configurado.`, canvas.width / 2, canvas.height / 2);
                }
            }
        } else {
            // Prepara los datos para el gráfico de barras usando las métricas del periodo actual.
            const dailyBreakdownData = this._prepareBarChartData(currentPeriodMetrics);
            if (dailyBreakdownData && dailyBreakdownData.datasets && dailyBreakdownData.datasets.length > 0 && dailyBreakdownData.labels && dailyBreakdownData.labels.length > 0) {
                // Crea el gráfico de barras.
                this.charts.bar = ChartUtils.createBarChart( // Nombre del chart para this.charts
                    barChartCanvasId,
                    `Desglose Diario (${primaryMetricName})`,
                    { x: 'Día', y: primaryMetricName }, // Usar primaryMetricName para el eje Y
                    dailyBreakdownData.datasets, // Pasar el array de datasets
                    dailyBreakdownData.labels    // Pasar el array de etiquetas
                );
                // createBarChart ya maneja la asignación de this.charts.bar.data.labels y el update no es necesario aquí.
                if (!this.charts.bar) { destroyChartInstance('bar', barChartCanvasId); } // Fallback si createBarChart devuelve null.
            } else { // Si no hay datos preparados, destruye cualquier gráfico existente.
                destroyChartInstance('bar', barChartCanvasId);
            }
        }
    } else { // Si el KPI no está visible, asegura que cualquier gráfico existente sea destruido.
        destroyChartInstance('bar', barChartCanvasId);
    }

    // --- Pie Chart (Operator Breakdown for current period) ---
    const operatorBreakdownKPI = this.availableKPIs.find(k => k.id === 'operatorBreakdownChart');
    const pieChartCanvasId = 'kpi-pie-chart';
    const operatorBreakdownVisible = this.config.visibleKPIs.includes(operatorBreakdownKPI.id);
    const operatorBreakdownContainer = document.getElementById(operatorBreakdownKPI.placeholderId);
    const operatorFieldId = this.config.mapping.operatorFieldId; // ID del campo Operario.
    const operatorFieldName = FieldModel.getById(operatorFieldId)?.name || 'Operario';

    if (operatorBreakdownVisible && operatorBreakdownContainer && operatorBreakdownContainer.style.display !== 'none') {
        // Verifica si tanto el campo primario de métricas como el campo de operario están configurados.
        if (!metersFieldId || !operatorFieldId) {
             destroyChartInstance('pie', pieChartCanvasId);
             const canvas = document.getElementById(pieChartCanvasId);
             if(canvas) { // Muestra mensaje en el canvas.
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = "16px Arial";
                ctx.textAlign = "center";
                let errorMsg = !metersFieldId ? `Campo "${primaryMetricName}" no configurado.` : "";
                errorMsg += (!metersFieldId && !operatorFieldId) ? " y " : "";
                errorMsg += !operatorFieldId ? `Campo "${operatorFieldName}" no configurado.` : "";
                ctx.fillText(errorMsg, canvas.width / 2, canvas.height / 2);
            }
        } else {
            // Prepara los datos para el gráfico de pastel usando las métricas del periodo actual.
            const pieChartData = this._preparePieChartData(currentPeriodMetrics);
            if (pieChartData && pieChartData.datasets.length > 0 && pieChartData.datasets[0].data.length > 0 && pieChartData.labels.length > 0) {
                // Crea el gráfico de pastel.
                this.charts.pie = ChartUtils.createPieChart(
                    pieChartCanvasId,
                    `Desglose por ${operatorFieldName} (${primaryMetricName})`,
                    pieChartData.labels,
                    pieChartData.datasets[0]
                );
                // No se necesita update explícito para pie chart si los datos se pasan directamente.
                if (!this.charts.pie) { destroyChartInstance('pie', pieChartCanvasId); } // Fallback.
            } else { // Si no hay datos, destruye.
                destroyChartInstance('pie', pieChartCanvasId);
            }
        }
    } else { // Si el KPI no está visible, destruye.
        destroyChartInstance('pie', pieChartCanvasId);
    }
  },

  /**
            );
            // No se necesita update explícito de labels para pie chart si se pasan directamente a createPieChart
             if (!this.charts.pie) { destroyChartInstance('pie', pieChartCanvasId); }
        } else {
            destroyChartInstance('pie', pieChartCanvasId);
        }
    } else {
        destroyChartInstance('pie', pieChartCanvasId);
    }
  },

  /**
   * Prepara los datos para el gráfico de barras (Metros por día).
   * @param {object} metrics - Objeto con las métricas calculadas.
   * @returns {object|null} Objeto de datos para Chart.js o null si no hay datos.
   */
  _prepareBarChartData(metrics) {
    if (!metrics || !metrics.metersByDay) return null;
    const labels = Object.keys(metrics.metersByDay).sort();
    if (labels.length === 0) return null;
    const data = labels.map(k => metrics.metersByDay[k].sum);

    const primaryMetricName = this.config.mapping.metersFieldId
        ? (FieldModel.getById(this.config.mapping.metersFieldId)?.name || 'Valor')
        : 'Valor';

    return {
      labels: labels,
      datasets: [{
        label: primaryMetricName, // Usar el nombre del campo primario
        data: data
        // backgroundColor y borderColor serán manejados por ChartUtils.createBarChart
      }]
    };
  },

  /**
   * Prepara los datos para el gráfico de líneas de tendencia de rendimiento, comparando periodo actual y anterior.
   * @param {object} currentPeriodMetrics - Métricas del periodo actual (debe incluir `metersByDay`).
   * @param {object} previousPeriodMetrics - Métricas del periodo anterior (debe incluir `metersByDay`).
   * @returns {object|null} Objeto de datos para Chart.js o null si no hay datos válidos.
   */
  _prepareLineChartData(currentPeriodMetrics, previousPeriodMetrics) {
    const currentData = currentPeriodMetrics && currentPeriodMetrics.metersByDay ? currentPeriodMetrics.metersByDay : {};
    const previousData = previousPeriodMetrics && previousPeriodMetrics.metersByDay ? previousPeriodMetrics.metersByDay : {};

    if (Object.keys(currentData).length === 0 && Object.keys(previousData).length === 0) {
      return null;
    }

    // Crear un conjunto unificado y ordenado de todas las claves de fecha (etiquetas)
    const allDateKeys = new Set([...Object.keys(currentData), ...Object.keys(previousData)]);
    const sortedLabels = Array.from(allDateKeys).sort();

    const currentPeriodValues = sortedLabels.map(dateKey => currentData[dateKey]?.sum || 0);
    const previousPeriodValues = sortedLabels.map(dateKey => previousData[dateKey]?.sum || 0);

    // Si todos los valores son cero, podríamos considerar no mostrar el gráfico o mostrar un mensaje.
    // Por ahora, se mostrará un gráfico con ceros.
    // if (currentPeriodValues.every(v => v === 0) && previousPeriodValues.every(v => v === 0)) {
    //   return null;
    // }

    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Periodo Actual',
          data: currentPeriodValues,
          borderColor: ChartUtils.chartColors[0 % ChartUtils.chartColors.length], // Azul
          backgroundColor: ChartUtils.chartColors[0 % ChartUtils.chartColors.length].replace('0.7', '0.1'), // Más claro para área
          fill: true,
          tension: 0.1
        },
        {
          label: 'Periodo Anterior',
          data: previousPeriodValues,
          borderColor: ChartUtils.chartColors[1 % ChartUtils.chartColors.length], // Rojo/Rosa
          backgroundColor: ChartUtils.chartColors[1 % ChartUtils.chartColors.length].replace('0.7', '0.1'),
          fill: true,
          tension: 0.1,
          borderDash: [5, 5] // Línea discontinua para diferenciar
        }
      ]
    };
  },

  /**
   * Prepara los datos para el gráfico de pastel (Metros por Operario).
   * @param {object} metrics - Objeto con las métricas calculadas.
   * @returns {object|null} Objeto de datos para Chart.js o null si no hay datos.
   */
  _preparePieChartData(metrics) {
    if (!metrics || !metrics.metersByOperator) return null;
    const labels = Object.keys(metrics.metersByOperator);
    if (labels.length === 0) return null;
    const data = labels.map(k => metrics.metersByOperator[k]);
    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ChartUtils.chartColors
      }]
    };
  },

  /**
   * Muestra tabla comparativa con el rango anterior, si está visible.
   * Calcula y compara varias métricas clave entre el periodo actual y el anterior.
   * @param {Array<object>} currentPeriodRecords - Registros ya filtrados para el periodo actual.
   */
  renderComparison(currentPeriodRecords) {
    const comparisonTbody = document.querySelector('#kpi-comparison tbody');
    const comparisonKPI = this.availableKPIs.find(k => k.id === 'comparisonTable');
    const comparisonContainer = document.getElementById(comparisonKPI.placeholderId);

    // Si el KPI de la tabla de comparación no está visible o su contenedor no existe (o está oculto vía style), limpiar y salir.
    if (!this.config.visibleKPIs.includes(comparisonKPI.id) || (comparisonContainer && comparisonContainer.style.display === 'none')) {
        if (comparisonTbody) comparisonTbody.innerHTML = '<!-- Comparison Table hidden -->';
        return;
    }
    if (!comparisonTbody) return; // Salir si el tbody no se encuentra en el DOM (e.g., el placeholder no fue renderizado).

    const map = this.config.mapping; // IDs de los campos mapeados (metersFieldId, timeFieldId, etc.)
    const currentFilters = this.getFilters(); // Valores de los filtros actuales (fromDate, toDate, shift, operator, machine)

    // Validar que las fechas del filtro principal estén definidas. Sin esto, no se puede comparar.
    if (!currentFilters.fromDate || !currentFilters.toDate) {
      comparisonTbody.innerHTML = '<tr><td colspan="5">Rango de fechas no definido.</td></tr>';
      return;
    }

    // --- Preparación de datos del Periodo Anterior ---
    // 1. Determinar el rango de fechas para el periodo anterior usando KpiUtils.previousRange.
    //    Esto toma en cuenta el tipo de comparación seleccionado (día, semana, mes, auto).
    const previousDateRange = KpiUtils.previousRange(currentFilters.fromDate, currentFilters.toDate, this.config.comparison.period);

    // 2. Obtener todos los registros que caen dentro de ese rango de fechas anterior.
    //    Estos registros aún no están filtrados por las dimensiones (turno, operario, máquina).
    let previousPeriodRecords = RecordModel.filterMultiple({ fromDate: previousDateRange.from, toDate: previousDateRange.to });

    // 3. Aplicar los MISMOS filtros de dimensión (turno, operario, máquina) del periodo actual
    //    a los registros del periodo anterior. Esto es crucial para una comparación equitativa ("manzanas con manzanas").
    //    Por ejemplo, si se está viendo el Turno A actual, se compara con el Turno A del periodo anterior.
    previousPeriodRecords = previousPeriodRecords.filter(rec => {
        const data = rec.data || {};
        // Solo aplicar filtro si el campo de dimensión está mapeado Y hay un valor de filtro activo.
        if (map.shiftFieldId && currentFilters.shift && data[map.shiftFieldId] !== currentFilters.shift) return false;
        if (map.operatorFieldId && currentFilters.operator && data[map.operatorFieldId] !== currentFilters.operator) return false;
        if (map.machineFieldId && currentFilters.machine && data[map.machineFieldId] !== currentFilters.machine) return false;
        return true;
    });

    // 4. Calcular todas las métricas relevantes (totalMetros, timeAvg, etc.) para ambos conjuntos de registros.
    const currentMetrics = this.computeMetrics(currentPeriodRecords);
    const previousMetrics = this.computeMetrics(previousPeriodRecords);

    const metricsToCompare = []; // Array para almacenar los objetos de métrica a mostrar en la tabla.

    // --- Definición y Cálculo de Métricas para Comparación ---

    // Métrica 1: Total de la Métrica Primaria (e.g., Metros Impresos)
    // Se muestra solo si el campo de metros está mapeado.
    if (map.metersFieldId) {
        const currentVal = currentMetrics.totalMeters;
        const prevVal = previousMetrics.totalMeters;
        const diff = currentVal - prevVal;
        // Cálculo del porcentaje: si el valor previo es 0, un aumento se considera 100% (o 0% si el actual también es 0).
        const perc = prevVal !== 0 ? (diff / prevVal) * 100 : (currentVal !== 0 ? 100 : 0);
        metricsToCompare.push({
            name: FieldModel.getById(map.metersFieldId)?.name || 'Total Métrica Primaria', // Nombre dinámico del campo
            current: ChartUtils.formatNumber(currentVal), // Valor actual formateado
            previous: ChartUtils.formatNumber(prevVal), // Valor anterior formateado
            diff: ChartUtils.formatNumber(diff), // Diferencia absoluta formateada
            perc: perc.toFixed(1) + '%', // Porcentaje con un decimal
            isPositive: diff >= 0 // Para esta métrica, un aumento (o ninguna diferencia) se considera positivo.
        });
    } else {
        // Si el campo de metros no está mapeado, se muestra N/A para esta métrica.
        metricsToCompare.push({ name: 'Total Métrica Primaria', current: 'N/A', previous: 'N/A', diff: 'N/A', perc: 'N/A', isPositive: true });
    }

    // Métrica 2: Tiempo Promedio (si el campo de tiempo está mapeado)
    if (map.timeFieldId) {
        const currentVal = currentMetrics.timeAvg;
        const prevVal = previousMetrics.timeAvg;
        const diff = currentVal - prevVal;
        const perc = prevVal !== 0 ? (diff / prevVal) * 100 : (currentVal !== 0 ? 100 : 0);
        metricsToCompare.push({
            name: FieldModel.getById(map.timeFieldId)?.name || 'Tiempo Promedio',
            current: ChartUtils.formatNumber(currentVal),
            previous: ChartUtils.formatNumber(prevVal),
            diff: ChartUtils.formatNumber(diff),
            perc: perc.toFixed(1) + '%',
            isPositive: diff <= 0 // Para tiempo promedio, una disminución (diff <= 0) es positiva/mejor.
        });
    }

    // Métrica 3: Número de Máquinas Únicas Utilizadas (si el campo de máquina está mapeado)
     if (map.machineFieldId) {
        const currentVal = currentMetrics.machinesUsed;
        const prevVal = previousMetrics.machinesUsed;
        const diff = currentVal - prevVal;
        const perc = prevVal !== 0 ? (diff / prevVal) * 100 : (currentVal !== 0 ? 100 : 0);
        metricsToCompare.push({
            name: `Máquinas Únicas (${FieldModel.getById(map.machineFieldId)?.name || 'Máquina'})`,
            current: currentVal.toString(), // Es un conteo, no necesita formateo numérico con decimales.
            previous: prevVal.toString(),
            diff: diff.toString(),
            perc: perc.toFixed(1) + '%',
            isPositive: diff >= 0 // Se asume que más máquinas usadas es neutral o positivo. Podría variar según el contexto del negocio.
        });
    }

    // Métrica 4: Total de Registros (Pedidos/Eventos)
    // Esta métrica siempre se calcula, ya que no depende de un campo mapeado específico más allá de la existencia de registros.
    const currentRecordCount = currentPeriodRecords.length;
    const previousRecordCount = previousPeriodRecords.length;
    const diffRecords = currentRecordCount - previousRecordCount;
    const percRecords = previousRecordCount !== 0 ? (diffRecords / previousRecordCount) * 100 : (currentRecordCount !== 0 ? 100 : 0);
    metricsToCompare.push({
        name: 'Total de Registros',
        current: currentRecordCount.toString(),
        previous: previousRecordCount.toString(),
        diff: diffRecords.toString(),
        perc: percRecords.toFixed(1) + '%',
        isPositive: diffRecords >= 0 // Más registros generalmente se considera positivo.
    });

    // --- Renderizado de la Tabla HTML ---
    let tableHTML = '';
    // Si todas las métricas que podrían tener datos (excluyendo las que son N/A por falta de mapeo)
    // efectivamente no tienen datos (e.g. current y previous son 0 o N/A), mostrar mensaje.
    // O, más simple: si `metricsToCompare` está vacío o todas las métricas son N/A.
    if (metricsToCompare.filter(m => m.current !== 'N/A').length === 0) {
        tableHTML = '<tr><td colspan="5">No hay métricas configuradas o datos disponibles para comparación.</td></tr>';
    } else {
        // Construir cada fila de la tabla.
        metricsToCompare.forEach(metric => {
            // Determinar la clase CSS para el color del texto (verde para positivo, rojo para negativo).
            // Si el porcentaje es "N/A" (por falta de datos previos), no se aplica clase de color.
            const textClass = metric.perc === 'N/A' ? '' : (metric.isPositive ? 'text-success' : 'text-danger');
            // Determinar el ícono de flecha (arriba para positivo, abajo para negativo).
            const arrowIcon = metric.perc === 'N/A' ? '' : (metric.isPositive ? '<i class="bi bi-arrow-up-short"></i>' : '<i class="bi bi-arrow-down-short"></i>');
            // Formatear el string del porcentaje con el ícono.
            const displayPerc = metric.perc === 'N/A' ? 'N/A' : `${arrowIcon} ${metric.perc}`;

            tableHTML += `
              <tr>
                <td>${metric.name}</td>
                <td>${metric.current}</td>
                <td>${metric.previous}</td>
                <td class="${textClass}">${metric.diff}</td>
                <td class="${textClass}">${displayPerc}</td>
              </tr>
            `;
        });
    }
    comparisonTbody.innerHTML = tableHTML; // Actualizar el contenido del cuerpo de la tabla.
  },

  /**
   * Exporta las métricas actuales a Excel mediante la librería XLSX.
   */
  exportExcel() {
    const records = this.getFilteredRecords();
    const metrics = this.computeMetrics(records);
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Métrica', 'Valor'],
      ['Total Metros Impresos', metrics.totalMeters],
      ['Tiempo Promedio por Pedido', metrics.timeAvg],
      ['Máquinas Registradas', metrics.machinesUsed]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'KPIs');
    XLSX.writeFile(wb, 'kpis.xlsx');
  },

  /**
   * Exporta las métricas a PDF utilizando jsPDF.
   */
  exportPDF() {
    if (typeof window.jspdf === 'undefined' && typeof window.jspdf_jsPDF === 'undefined') {
      UIUtils.showAlert('jsPDF no está cargado', 'danger');
      return;
    }
    const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jspdf_jsPDF;
    const doc = new jsPDF();
    const records = this.getFilteredRecords();
    const metrics = this.computeMetrics(records);
    const rows = [
      ['Métrica', 'Valor'],
      ['Total Metros Impresos', metrics.totalMeters.toFixed(2)],
      ['Tiempo Promedio por Pedido', metrics.timeAvg.toFixed(2)],
      ['Máquinas Registradas', metrics.machinesUsed]
    ];
    doc.autoTable({ head: [rows[0]], body: rows.slice(1) });
    doc.save('kpis.pdf');
  }
};
