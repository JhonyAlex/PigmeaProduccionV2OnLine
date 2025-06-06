const KPIsView = {
  /**
   * Configuración cargada del almacenamiento.
   * Incluye mapeo de campos y filtros persistentes.
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
    lineRange: {}
  },

  charts: {},
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
   * Lee la configuración almacenada o intenta inferir campos por nombre.
   */
  loadConfig() {
    const cfg = StorageService.getConfig();
    if (cfg.kpiConfig) {
      this.config = cfg.kpiConfig;
    } else {
      // Intentar inferir campos por nombre
      const guess = name => {
        const f = FieldModel.getAll().find(fl =>
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
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = d => d.toISOString().split('T')[0];

    const fromVal = this.config.filters.fromDate || fmt(weekAgo);
    const toVal = this.config.filters.toDate || fmt(today);
    const lineFrom = this.config.lineRange.fromDate || fromVal;
    const lineTo = this.config.lineRange.toDate || toVal;

    const numericFields = FieldModel.getNumericFields();
    const allFields = FieldModel.getAll();

    const createOptions = (fields, selected) =>
      fields.map(f => `<option value="${f.id}" ${selected === f.id ? 'selected' : ''}>${f.name}</option>`).join('');

    container.innerHTML = `
      <div class="container-fluid" id="kpis-view">
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
              <select id="kpi-shift" class="form-select"></select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label" for="kpi-operator">Operario</label>
              <select id="kpi-operator" class="form-select"></select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label" for="kpi-machine">Máquina</label>
              <select id="kpi-machine" class="form-select"></select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label" for="kpi-compare-period">Comparar por</label>
              <select id="kpi-compare-period" class="form-select form-select-sm">
                <option value="auto">Auto</option>
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
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

        <div id="kpi-cards" class="row gy-3 mb-4"></div>

        <div id="line-range-controls" class="d-flex justify-content-end gap-2 mb-2">
          <input type="date" id="kpi-line-from" class="form-control form-control-sm" value="${lineFrom}">
          <input type="date" id="kpi-line-to" class="form-control form-control-sm" value="${lineTo}">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="last-week">Semana pasada</button>
            <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="last-month">Mes pasado</button>
            <button type="button" class="btn btn-outline-secondary line-shortcut" data-range="year-current">Año actual</button>
          </div>
        </div>

        <div id="kpi-charts" class="mb-4">
          <canvas id="kpi-bar-chart" class="mb-4" height="120"></canvas>
          <canvas id="kpi-line-chart" class="mb-4" height="120"></canvas>
          <canvas id="kpi-pie-chart" height="120" style="max-width:400px;margin:0 auto;"></canvas>
        </div>

        <div id="kpi-comparison" class="table-responsive mb-4">
          <table class="table table-sm">
            <thead><tr><th>Métrica</th><th>Actual</th><th>Anterior</th><th>Diferencia</th><th>Variación %</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>

        <div class="mt-4">
          <h5>Configuración de Campos</h5>
          <form id="kpi-config-form" class="row row-cols-1 row-cols-md-3 g-3">
            <div class="col">
              <label class="form-label" for="cfg-meters">Campo Metros Impresos</label>
              <select id="cfg-meters" class="form-select">
                <option value="">-- Sin definir --</option>
                ${createOptions(numericFields, this.config.mapping.metersFieldId)}
              </select>
            </div>
            <div class="col">
              <label class="form-label" for="cfg-operator">Campo Operario</label>
              <select id="cfg-operator" class="form-select">
                <option value="">-- Sin definir --</option>
                ${createOptions(allFields, this.config.mapping.operatorFieldId)}
              </select>
            </div>
            <div class="col">
              <label class="form-label" for="cfg-shift">Campo Turno</label>
              <select id="cfg-shift" class="form-select">
                <option value="">-- Sin definir --</option>
                ${createOptions(allFields, this.config.mapping.shiftFieldId)}
              </select>
            </div>
            <div class="col">
              <label class="form-label" for="cfg-machine">Campo Máquina</label>
              <select id="cfg-machine" class="form-select">
                <option value="">-- Sin definir --</option>
                ${createOptions(allFields, this.config.mapping.machineFieldId)}
              </select>
            </div>
            <div class="col">
              <label class="form-label" for="cfg-time">Campo Tiempo por Pedido</label>
              <select id="cfg-time" class="form-select">
                <option value="">-- Sin definir --</option>
                ${createOptions(numericFields, this.config.mapping.timeFieldId)}
              </select>
            </div>
            <div class="col-12">
              <button class="btn btn-outline-primary" type="submit">Guardar Configuración</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Rellenar selects de filtros con opciones si los campos están definidos
    this.populateFilterSelects();
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
        field.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        });
      }
      const current = this.config.filters[selectId.replace('kpi-', '')];
      if (current) sel.value = current;
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

    document.getElementById('kpi-config-form').addEventListener('submit', e => {
      e.preventDefault();
      const ids = [
        'metersFieldId',
        'operatorFieldId',
        'shiftFieldId',
        'machineFieldId',
        'timeFieldId'
      ];
      ids.forEach(id => {
        const input = document.getElementById(`cfg-${id.replace('FieldId','')}`);
        if (input) this.config.mapping[id] = input.value || null;
      });
      this.saveConfig();
      this.populateFilterSelects();
      this.refresh();
    });

    document.getElementById('kpi-compare-period').addEventListener('change', e => {
      this.config.comparison.period = e.target.value;
      this.saveConfig();
      this.refresh();
    });

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
   * Suscribe a los cambios de datos para refrescar en tiempo real.
   */
  setupRealtime() {
    if (this.dataSubscriber) this.dataSubscriber();
    this.dataSubscriber = StorageService.subscribeToDataChanges(() => {
      if (Router.currentRoute === 'kpis') {
        this.refresh();
      }
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
   */
  getFilteredRecords() {
    const f = this.getFilters();
    const base = RecordModel.filterMultiple({ fromDate: f.fromDate, toDate: f.toDate });
    return base.filter(rec => {
      const data = rec.data || {};
      if (f.shift && data[this.config.mapping.shiftFieldId] !== f.shift) return false;
      if (f.operator && data[this.config.mapping.operatorFieldId] !== f.operator) return false;
      if (f.machine && data[this.config.mapping.machineFieldId] !== f.machine) return false;
      return true;
    });
  },

  /**
   * Actualiza la vista calculando métricas y gráficos.
   */
  refresh() {
    const records = this.getFilteredRecords();
    this.renderCards(records);
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
   * Muestra tarjetas con métricas clave.
   */
  renderCards(records) {
    const metrics = this.computeMetrics(records);
    const cardData = [
      { title: 'Total Metros Impresos', value: ChartUtils.formatNumber(metrics.totalMeters) },

      { title: 'Tiempo Promedio por Pedido', value: ChartUtils.formatNumber(metrics.timeAvg) },
      { title: 'Máquinas Registradas', value: metrics.machinesUsed }
    ];

    const container = document.getElementById('kpi-cards');
    container.innerHTML = '';
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
   * Renderiza gráficos de barras, líneas y pastel.
   */
  renderCharts(records) {
    const m = this.computeMetrics(records);

    const lineRecords = RecordModel.filterMultiple({
      fromDate: this.config.lineRange.fromDate || this.config.filters.fromDate,
      toDate: this.config.lineRange.toDate || this.config.filters.toDate
    });
    const mLine = this.computeMetrics(lineRecords);
    const destroy = id => { if (this.charts[id]) { this.charts[id].destroy(); delete this.charts[id]; } };
    destroy('bar'); destroy('line'); destroy('pie');

    const ctxBar = document.getElementById('kpi-bar-chart').getContext('2d');
    const labelsBar = Object.keys(m.metersByDay).sort();
    const dataBar = labelsBar.map(k => m.metersByDay[k].sum);
    this.charts.bar = new Chart(ctxBar, {
      type: 'bar',
      data: { labels: labelsBar, datasets: [{ label: 'Metros por día', data: dataBar, backgroundColor: 'rgba(54,162,235,0.6)' }] },
      options: { responsive: true }
    });

    const ctxLine = document.getElementById('kpi-line-chart').getContext('2d');

    const labelsLine = Object.keys(mLine.metersByDay).sort();
    const dataLine = labelsLine.map(k => mLine.metersByDay[k].sum);
    this.charts.line = new Chart(ctxLine, {
      type: 'line',
      data: { labels: labelsLine, datasets: [{ label: 'Evolución', data: dataLine, borderColor: 'rgb(75,192,192)', fill: false }] },
      options: { responsive: true }
    });

    const ctxPie = document.getElementById('kpi-pie-chart').getContext('2d');
    const labelsPie = Object.keys(m.metersByOperator);
    const dataPie = labelsPie.map(k => m.metersByOperator[k]);
    this.charts.pie = new Chart(ctxPie, {
      type: 'pie',
      data: { labels: labelsPie, datasets: [{ data: dataPie, backgroundColor: ChartUtils.chartColors }] },
      options: { responsive: true }
    });
  },

  /**
   * Muestra tabla comparativa con el rango anterior.
   */
  renderComparison(records) {
    const map = this.config.mapping;
    const from = this.config.filters.fromDate;
    const to = this.config.filters.toDate;
    if (!from || !to || !map.metersFieldId) return;
    const prev = KpiUtils.previousRange(from, to, this.config.comparison.period);
    const prevRecords = RecordModel.filterMultiple({ fromDate: prev.from, toDate: prev.to });
    const currentVal = KpiUtils.aggregateField(records, map.metersFieldId, 'sum');
    const prevVal = KpiUtils.aggregateField(prevRecords, map.metersFieldId, 'sum');
    const diff = currentVal - prevVal;
    const perc = prevVal ? (diff / prevVal) * 100 : 0;
    const tbody = document.querySelector('#kpi-comparison tbody');
    tbody.innerHTML = `<tr>
      <td>Metros Impresos</td>
      <td>${ChartUtils.formatNumber(currentVal)}</td>
      <td>${ChartUtils.formatNumber(prevVal)}</td>
      <td class="${diff >= 0 ? 'text-success' : 'text-danger'}">${ChartUtils.formatNumber(diff)}</td>
      <td class="${diff >= 0 ? 'text-success' : 'text-danger'}">${perc.toFixed(2)}%</td>
    </tr>`;
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
