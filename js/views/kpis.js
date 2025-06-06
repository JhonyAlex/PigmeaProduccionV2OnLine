const KPIsView = {
  selectedFields: [],
  chart: null,

  init() {
    this.loadConfig();
    this.render();
    this.attachEvents();
    this.refresh();
  },

  loadConfig() {
    const cfg = StorageService.getConfig();
    this.selectedFields = cfg.kpiFields || [];
  },

  saveConfig() {
    const cfg = StorageService.getConfig();
    cfg.kpiFields = this.selectedFields;
    StorageService.updateConfig(cfg);
  },

  render() {
    const container = Router.getActiveViewContainer() || document.querySelector('.main-content');
    if (!container) return;
    const numericFields = FieldModel.getNumericFields();
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const fromStr = monthAgo.toISOString().split('T')[0];

    container.innerHTML = `
      <div class="container" id="kpis-view">
        <h2 class="mb-3">KPIs</h2>
        <form id="kpi-filter-form" class="row g-3">
          <div class="col-md-4">
            <label for="kpi-from" class="form-label">Desde</label>
            <input id="kpi-from" type="date" class="form-control" value="${fromStr}">
          </div>
          <div class="col-md-4">
            <label for="kpi-to" class="form-label">Hasta</label>
            <input id="kpi-to" type="date" class="form-control" value="${today}">
          </div>
          <div class="col-md-4 align-self-end">
            <button class="btn btn-primary" type="submit">Aplicar</button>
          </div>
        </form>

        <div class="mt-4" id="kpi-cards" class="row"></div>

        <div class="mt-4">
          <h5>Campos para KPIs</h5>
          <div id="kpi-field-list">
            ${numericFields.map(f => `
              <div class="form-check">
                <input class="form-check-input kpi-field" type="checkbox" value="${f.id}" id="field-${f.id}" ${this.selectedFields.includes(f.id) ? 'checked' : ''}>
                <label class="form-check-label" for="field-${f.id}">${f.name}</label>
              </div>`).join('')}
          </div>
          <button class="btn btn-sm btn-outline-primary mt-2" id="save-kpi-config">Guardar selección</button>
        </div>

        <div class="mt-4">
          <canvas id="kpi-chart"></canvas>
        </div>

        <div class="mt-4 table-responsive">
          <table class="table table-sm" id="comparison-table">
            <thead><tr><th>Métrica</th><th>Actual</th><th>Anterior</th><th>Diferencia</th><th>Variación %</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const form = document.getElementById('kpi-filter-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.refresh();
    });

    document.getElementById('save-kpi-config').addEventListener('click', () => {
      this.selectedFields = Array.from(document.querySelectorAll('.kpi-field'))
        .filter(chk => chk.checked)
        .map(chk => chk.value);
      this.saveConfig();
      this.refresh();
    });
  },

  getFilters() {
    return {
      fromDate: document.getElementById('kpi-from').value,
      toDate: document.getElementById('kpi-to').value
    };
  },

  refresh() {
    const filters = this.getFilters();
    const records = RecordModel.filterMultiple(filters);
    this.renderCards(records);
    this.updateChart(records, filters);
  },

  renderCards(records) {
    const metrics = KpiUtils.basicMetrics(records);
    const container = document.getElementById('kpi-cards');
    const cfg = StorageService.getConfig();
    const entityName = cfg.entityName || 'Entidad';
    const recordName = cfg.recordName || 'Registro';

    const cards = [
      { title: `Total de ${recordName}s`, value: metrics.count },
      { title: `${recordName}s por día`, value: metrics.dailyAvg.toFixed(1) },
      { title: `${entityName}s registradas`, value: metrics.uniqueEntities }
    ];

    this.selectedFields.forEach(fid => {
      const sum = KpiUtils.aggregateField(records, fid, 'sum');
      const field = FieldModel.getById(fid);
      cards.push({ title: `Suma de ${field.name}`, value: ChartUtils.formatNumber(sum) });
    });

    container.innerHTML = '<div class="row"></div>';
    const row = container.firstElementChild;
    cards.forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-3';
      col.innerHTML = `
        <div class="card shadow-sm h-100">
          <div class="card-body text-center">
            <h6 class="text-uppercase">${c.title}</h6>
            <h2>${c.value}</h2>
          </div>
        </div>`;
      row.appendChild(col);
    });
  },

  updateChart(records, filters) {
    const fieldId = this.selectedFields[0];
    if (!fieldId) return;
    const field = FieldModel.getById(fieldId);
    const groups = KpiUtils.groupByPeriod(records, fieldId, 'month');
    const labels = Object.keys(groups).sort();
    const data = labels.map(k => groups[k].sum);

    const ctx = document.getElementById('kpi-chart');
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: field.name, data, fill: false, borderColor: 'rgb(75,192,192)' }] },
      options: { responsive: true }
    });

    this.updateComparison(records, fieldId, filters);
  },

  updateComparison(records, fieldId, filters) {
    const field = FieldModel.getById(fieldId);
    const prev = KpiUtils.previousRange(filters.fromDate, filters.toDate);
    const currentVal = KpiUtils.aggregateField(records, fieldId, 'sum');
    const prevRecords = RecordModel.filterMultiple({ fromDate: prev.from, toDate: prev.to });
    const prevVal = KpiUtils.aggregateField(prevRecords, fieldId, 'sum');
    const diff = currentVal - prevVal;
    const percent = prevVal ? (diff / prevVal) * 100 : 0;

    const tbody = document.querySelector('#comparison-table tbody');
    tbody.innerHTML = `
      <tr>
        <td>Suma de ${field.name}</td>
        <td>${ChartUtils.formatNumber(currentVal)}</td>
        <td>${ChartUtils.formatNumber(prevVal)}</td>
        <td class="${diff >= 0 ? 'text-success' : 'text-danger'}">${ChartUtils.formatNumber(diff)}</td>
        <td class="${diff >= 0 ? 'text-success' : 'text-danger'}">${percent.toFixed(2)}%</td>
      </tr>`;
  },

  update() {
    if (Router.currentRoute === 'kpis') {
      this.refresh();
    }
  }
};
