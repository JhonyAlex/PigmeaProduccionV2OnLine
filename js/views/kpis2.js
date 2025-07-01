// Nueva vista de KPIs con interfaz simplificada
const KPIs2View = {
  config: {
    fromDate: '',
    toDate: '',
    fields: []
  },

  init() {
    this.loadConfig();
    this.render();
    this.attachEvents();
    this.refresh();
  },

  defaultDates() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const fmt = d => d.toISOString().split('T')[0];
    return { from: fmt(weekAgo), to: fmt(today) };
  },

  loadConfig() {
    const cfg = StorageService.getConfig();
    const defs = this.defaultDates();
    this.config.fromDate = cfg.kpi2_from || defs.from;
    this.config.toDate = cfg.kpi2_to || defs.to;
    this.config.fields = Array.isArray(cfg.kpi2_fields) ? cfg.kpi2_fields : [];
  },

  saveConfig() {
    const cfg = StorageService.getConfig();
    cfg.kpi2_from = this.config.fromDate;
    cfg.kpi2_to = this.config.toDate;
    cfg.kpi2_fields = this.config.fields;
    StorageService.updateConfig(cfg);
  },

  render() {
    const container = Router.getActiveViewContainer() || document.querySelector('.main-content');
    if (!container) return;
    container.innerHTML = this.template();
    UIUtils.setupSearchableSelect('#kpi2-fields-select');
    this.populateFieldSelect();
  },

  template() {
    const { fromDate, toDate } = this.config;
    return `
      <div class="container-fluid py-3">
        <div class="row mb-3">
          <div class="col-md-10">
            <div class="row g-2 align-items-end">
              <div class="col-6 col-md-3">
                <label class="form-label" for="kpi2-from">Desde</label>
                <input type="date" id="kpi2-from" class="form-control" value="${fromDate}">
              </div>
              <div class="col-6 col-md-3">
                <label class="form-label" for="kpi2-to">Hasta</label>
                <input type="date" id="kpi2-to" class="form-control" value="${toDate}">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="kpi2-fields-select">Campos a comparar</label>
                ${UIUtils.createSearchableSelect('kpi2-fields-select', '', 'form-select', true)}
              </div>
              <div class="col-12 col-md-2">
                <button class="btn btn-primary w-100" id="kpi2-apply">Aplicar</button>
              </div>
            </div>
          </div>
          <div class="col-md-2 text-end">
            <button class="btn btn-outline-secondary" id="kpi2-export">Excel</button>
          </div>
        </div>
        <div id="kpi2-results"></div>
      </div>`;
  },

  populateFieldSelect() {
    const select = document.getElementById('kpi2-fields-select');
    if (!select) return;
    select.innerHTML = '';
    FieldModel.getActive().forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      if (this.config.fields.includes(f.id)) opt.selected = true;
      select.appendChild(opt);
    });
    UIUtils.setupSearchableSelect('#kpi2-fields-select');
  },

  attachEvents() {
    document.getElementById('kpi2-apply').addEventListener('click', () => {
      this.config.fromDate = document.getElementById('kpi2-from').value;
      this.config.toDate = document.getElementById('kpi2-to').value;
      const select = document.getElementById('kpi2-fields-select');
      this.config.fields = Array.from(select.selectedOptions).map(o => o.value);
      this.saveConfig();
      this.refresh();
    });

    document.getElementById('kpi2-export').addEventListener('click', () => {
      ExportUtils.tableToExcel('kpi2-results', 'kpi2');
    });
  },

  refresh() {
    const filters = { fromDate: this.config.fromDate, toDate: this.config.toDate };
    const records = RecordModel.filterMultiple(filters);
    const prevRange = KpiUtils.previousRange(filters.fromDate, filters.toDate);
    const prevRecords = RecordModel.filterMultiple({ fromDate: prevRange.from, toDate: prevRange.to });

    const container = document.getElementById('kpi2-results');
    container.innerHTML = '';
    if (!this.config.fields.length) {
      container.innerHTML = '<p class="text-muted">Seleccione al menos un campo para comparar.</p>';
      return;
    }

    this.config.fields.forEach(fid => {
      const field = FieldModel.getById(fid);
      if (!field) return;
      const { html } = this.buildComparisonTable(field, records, prevRecords);
      container.insertAdjacentHTML('beforeend', html);
    });
  },

  buildComparisonTable(field, currentRecords, prevRecords) {
    const countValues = (recs) => {
      const r = {};
      recs.forEach(rec => {
        const val = rec.data[field.id] ?? 'N/D';
        r[val] = (r[val] || 0) + 1;
      });
      return r;
    };
    const curr = countValues(currentRecords);
    const prev = countValues(prevRecords);
    const rows = Array.from(new Set([...Object.keys(curr), ...Object.keys(prev)])).
      map(val => {
        const c = curr[val] || 0;
        const p = prev[val] || 0;
        const diff = c - p;
        const perc = p ? ((diff / p) * 100).toFixed(1) + '%' : 'N/A';
        return `<tr><td>${val}</td><td>${c}</td><td>${p}</td><td>${diff}</td><td>${perc}</td></tr>`;
      }).join('');
    const html = `
      <div class="mb-4">
        <h6>${field.name}</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead><tr><th>Valor</th><th>Actual</th><th>Anterior</th><th>Diferencia</th><th>Variación %</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    return { html };
  }
};

