/**
 * KPIs Admin Panel Controller
 * Handles configuration modal functionality for the new KPIs dashboard
 */
class KPIAdminPanel {
    constructor() {
        this.config = {
            fields: {
                available: [],
                configured: []
            },
            categories: {
                metrics: [],
                dimensions: [],
                time: [],
                custom: []
            },
            layout: {
                columns: 2,
                spacing: 'normal',
                showIcons: true,
                enableGrouping: true
            },
            advanced: {
                autoRefresh: 60,
                defaultPeriod: 'week',
                defaultComparison: 'previous',
                enableCaching: true,
                export: {
                    csv: true,
                    excel: true,
                    pdf: true,
                    includeCharts: true,
                    includeFilters: true,
                    includeTimestamp: true
                }
            }
        };
        
        this.isDirty = false;
        this.modal = null;
        this.sortableInstances = [];
    }

    /**
     * Initialize the admin panel
     */
    async init() {
        await this.loadModal();
        this.loadConfiguration();
        this.setupEventListeners();
        this.loadAvailableFields();
    }

    /**
     * Load the modal HTML into the page
     */
    async loadModal() {
        try {
            const response = await fetch('/components/kpi-admin-modal.html');
            const modalHTML = await response.text();
            
            // Insert modal into page if not already present
            if (!document.getElementById('kpiAdminModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            this.modal = new bootstrap.Modal(document.getElementById('kpiAdminModal'));
        } catch (error) {
            console.error('Error loading admin modal:', error);
            // Fallback: create minimal modal structure
            this.createFallbackModal();
        }
    }

    /**
     * Create a fallback modal if HTML loading fails
     */
    createFallbackModal() {
        const modalHTML = `
            <div class="modal fade" id="kpiAdminModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Configuración de KPIs</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Configuración básica de KPIs disponible.</p>
                            <div id="basicConfig"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveKPIConfig">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('kpiAdminModal'));
    }

    /**
     * Load configuration from storage
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('kpi-admin-config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('Error loading KPI configuration:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('kpi-admin-config', JSON.stringify(this.config));
            this.isDirty = false;
            this.showToast('Configuración guardada exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showToast('Error al guardar la configuración', 'error');
            return false;
        }
    }

    /**
     * Setup event listeners for the modal
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('#kpiAdminTabs button[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.onTabChanged(e.target.dataset.bsTarget);
            });
        });

        // Fields panel listeners
        this.setupFieldsPanel();
        
        // Categories panel listeners  
        this.setupCategoriesPanel();
        
        // Layout panel listeners
        this.setupLayoutPanel();
        
        // Advanced panel listeners
        this.setupAdvancedPanel();

        // Save button
        const saveBtn = document.getElementById('saveKPIConfig');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.validateConfiguration()) {
                    if (this.saveConfiguration()) {
                        this.modal.hide();
                        // Trigger update of main KPIs view
                        this.triggerMainViewUpdate();
                    }
                }
            });
        }

        // Preview button
        const previewBtn = document.getElementById('previewChanges');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewConfiguration();
            });
        }
    }

    /**
     * Setup fields panel event listeners
     */
    setupFieldsPanel() {
        // Search available fields
        const searchInput = document.getElementById('searchAvailableFields');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAvailableFields(e.target.value);
            });
        }

        // Select all fields
        const selectAllBtn = document.getElementById('selectAllFields');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllAvailableFields();
            });
        }

        // Clear all fields
        const clearAllBtn = document.getElementById('clearAllFields');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllConfiguredFields();
            });
        }
    }

    /**
     * Setup categories panel event listeners
     */
    setupCategoriesPanel() {
        // Category tab switching
        document.querySelectorAll('#categoryTabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#categoryTabs button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showCategoryContent(btn.dataset.category);
            });
        });
    }

    /**
     * Setup layout panel event listeners
     */
    setupLayoutPanel() {
        // Layout options
        const layoutColumns = document.getElementById('layoutColumns');
        if (layoutColumns) {
            layoutColumns.addEventListener('change', (e) => {
                this.config.layout.columns = parseInt(e.target.value);
                this.updateLayoutPreview();
                this.markDirty();
            });
        }

        const layoutSpacing = document.getElementById('layoutSpacing');
        if (layoutSpacing) {
            layoutSpacing.addEventListener('change', (e) => {
                this.config.layout.spacing = e.target.value;
                this.updateLayoutPreview();
                this.markDirty();
            });
        }

        const showIcons = document.getElementById('showFieldIcons');
        if (showIcons) {
            showIcons.addEventListener('change', (e) => {
                this.config.layout.showIcons = e.target.checked;
                this.updateLayoutPreview();
                this.markDirty();
            });
        }

        const enableGrouping = document.getElementById('enableGrouping');
        if (enableGrouping) {
            enableGrouping.addEventListener('change', (e) => {
                this.config.layout.enableGrouping = e.target.checked;
                this.updateLayoutPreview();
                this.markDirty();
            });
        }

        // Reset layout button
        const resetBtn = document.getElementById('resetLayout');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetLayout();
            });
        }

        // Preview layout button
        const previewBtn = document.getElementById('previewLayout');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewLayout();
            });
        }
    }

    /**
     * Setup advanced panel event listeners
     */
    setupAdvancedPanel() {
        // Auto refresh interval
        const autoRefresh = document.getElementById('autoRefreshInterval');
        if (autoRefresh) {
            autoRefresh.addEventListener('change', (e) => {
                this.config.advanced.autoRefresh = parseInt(e.target.value);
                this.markDirty();
            });
        }

        // Default data period
        const defaultPeriod = document.getElementById('defaultDataPeriod');
        if (defaultPeriod) {
            defaultPeriod.addEventListener('change', (e) => {
                this.config.advanced.defaultPeriod = e.target.value;
                this.markDirty();
            });
        }

        // Default comparison
        const defaultComparison = document.getElementById('defaultComparison');
        if (defaultComparison) {
            defaultComparison.addEventListener('change', (e) => {
                this.config.advanced.defaultComparison = e.target.value;
                this.markDirty();
            });
        }

        // Export options
        ['enableCSV', 'enableExcel', 'enablePDF', 'includeCharts', 'includeFilters', 'includeTimestamp'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const key = id.replace('enable', '').replace('include', '').toLowerCase();
                    if (id.startsWith('enable')) {
                        this.config.advanced.export[key] = e.target.checked;
                    } else {
                        this.config.advanced.export[id] = e.target.checked;
                    }
                    this.markDirty();
                });
            }
        });

        // Export/Import config
        const exportBtn = document.getElementById('exportConfig');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportConfiguration();
            });
        }

        const importBtn = document.getElementById('importConfig');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('configFileInput').click();
            });
        }

        const fileInput = document.getElementById('configFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.importConfiguration(e.target.files[0]);
            });
        }
    }

    /**
     * Load available fields from the system
     */
    async loadAvailableFields() {
        try {
            // Get fields from FieldModel if available
            if (typeof FieldModel !== 'undefined') {
                const fields = FieldModel.getAll();
                this.config.fields.available = fields.map(field => ({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    category: this.getFieldCategory(field),
                    icon: this.getFieldIcon(field)
                }));
            } else {
                // Fallback: generate sample fields
                this.generateSampleFields();
            }
            
            this.renderAvailableFields();
            this.renderConfiguredFields();
        } catch (error) {
            console.error('Error loading fields:', error);
            this.generateSampleFields();
        }
    }

    /**
     * Generate sample fields for demo purposes
     */
    generateSampleFields() {
        this.config.fields.available = [
            { id: 'sales', name: 'Ventas', type: 'number', category: 'metrics', icon: 'currency-dollar' },
            { id: 'quantity', name: 'Cantidad', type: 'number', category: 'metrics', icon: 'hash' },
            { id: 'region', name: 'Región', type: 'select', category: 'dimensions', icon: 'geo-alt' },
            { id: 'product', name: 'Producto', type: 'select', category: 'dimensions', icon: 'box' },
            { id: 'date', name: 'Fecha', type: 'date', category: 'time', icon: 'calendar' },
            { id: 'month', name: 'Mes', type: 'select', category: 'time', icon: 'calendar-month' },
            { id: 'customer', name: 'Cliente', type: 'text', category: 'custom', icon: 'person' },
            { id: 'status', name: 'Estado', type: 'select', category: 'custom', icon: 'check-circle' }
        ];
    }

    /**
     * Get field category based on field properties
     */
    getFieldCategory(field) {
        if (field.type === 'number') return 'metrics';
        if (field.type === 'date' || field.name.toLowerCase().includes('fecha')) return 'time';
        if (field.type === 'select') return 'dimensions';
        return 'custom';
    }

    /**
     * Get Bootstrap icon for field
     */
    getFieldIcon(field) {
        const iconMap = {
            'number': 'hash',
            'text': 'text-left',
            'select': 'list',
            'date': 'calendar',
            'checkbox': 'check-square'
        };
        return iconMap[field.type] || 'question-circle';
    }

    /**
     * Render available fields list
     */
    renderAvailableFields() {
        const container = document.getElementById('availableFieldsList');
        if (!container) return;

        const html = this.config.fields.available.map(field => `
            <div class="field-item p-2 mb-2 border rounded ${this.isFieldConfigured(field.id) ? 'd-none' : ''}" 
                 data-field-id="${field.id}" style="cursor: pointer;">
                <div class="d-flex align-items-center">
                    <i class="bi bi-${field.icon} me-2 text-primary"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${field.name}</div>
                        <small class="text-muted">${field.type} • ${field.category}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary add-field-btn">
                        <i class="bi bi-plus"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // Add click listeners
        container.querySelectorAll('.add-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fieldId = e.target.closest('.field-item').dataset.fieldId;
                this.addFieldToConfiguration(fieldId);
            });
        });
    }

    /**
     * Render configured fields list
     */
    renderConfiguredFields() {
        const container = document.getElementById('configuredFieldsList');
        if (!container) return;

        const html = this.config.fields.configured.map(field => `
            <div class="field-item p-2 mb-2 border rounded bg-light" data-field-id="${field.id}">
                <div class="d-flex align-items-center">
                    <i class="bi bi-grip-vertical me-2 text-muted" style="cursor: grab;"></i>
                    <i class="bi bi-${field.icon} me-2 text-success"></i>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${field.name}</div>
                        <small class="text-muted">${field.type} • ${field.category}</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-field-btn">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // Add remove listeners
        container.querySelectorAll('.remove-field-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fieldId = e.target.closest('.field-item').dataset.fieldId;
                this.removeFieldFromConfiguration(fieldId);
            });
        });

        // Setup sortable if library is available
        this.setupSortable(container);
    }

    /**
     * Setup sortable functionality for drag & drop
     */
    setupSortable(container) {
        if (typeof Sortable !== 'undefined') {
            const sortable = Sortable.create(container, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    this.reorderConfiguredFields(evt.oldIndex, evt.newIndex);
                }
            });
            this.sortableInstances.push(sortable);
        }
    }

    /**
     * Check if field is already configured
     */
    isFieldConfigured(fieldId) {
        return this.config.fields.configured.some(f => f.id === fieldId);
    }

    /**
     * Add field to configuration
     */
    addFieldToConfiguration(fieldId) {
        const field = this.config.fields.available.find(f => f.id === fieldId);
        if (field && !this.isFieldConfigured(fieldId)) {
            this.config.fields.configured.push(field);
            this.renderAvailableFields();
            this.renderConfiguredFields();
            this.markDirty();
        }
    }

    /**
     * Remove field from configuration
     */
    removeFieldFromConfiguration(fieldId) {
        const index = this.config.fields.configured.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            this.config.fields.configured.splice(index, 1);
            this.renderAvailableFields();
            this.renderConfiguredFields();
            this.markDirty();
        }
    }

    /**
     * Reorder configured fields
     */
    reorderConfiguredFields(oldIndex, newIndex) {
        const field = this.config.fields.configured.splice(oldIndex, 1)[0];
        this.config.fields.configured.splice(newIndex, 0, field);
        this.markDirty();
    }

    /**
     * Filter available fields based on search term
     */
    filterAvailableFields(searchTerm) {
        const items = document.querySelectorAll('#availableFieldsList .field-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.fw-bold').textContent.toLowerCase();
            const type = item.querySelector('.text-muted').textContent.toLowerCase();
            if (name.includes(term) || type.includes(term)) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }

    /**
     * Mark configuration as dirty
     */
    markDirty() {
        this.isDirty = true;
        // Update save button state or show indicator
        const saveBtn = document.getElementById('saveKPIConfig');
        if (saveBtn) {
            saveBtn.classList.add('btn-warning');
            saveBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Guardar Cambios';
        }
    }

    /**
     * Validate configuration before saving
     */
    validateConfiguration() {
        if (this.config.fields.configured.length === 0) {
            this.showToast('Debe configurar al menos un campo', 'warning');
            return false;
        }
        return true;
    }

    /**
     * Show configuration preview
     */
    previewConfiguration() {
        // Create a preview of how the KPIs will look
        console.log('Preview configuration:', this.config);
        this.showToast('Vista previa generada en consola', 'info');
    }

    /**
     * Export configuration to JSON file
     */
    exportConfiguration() {
        const dataStr = JSON.stringify(this.config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `kpi-config-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showToast('Configuración exportada exitosamente', 'success');
    }

    /**
     * Import configuration from JSON file
     */
    async importConfiguration(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const importedConfig = JSON.parse(text);
            
            // Validate imported config structure
            if (this.validateImportedConfig(importedConfig)) {
                this.config = { ...this.config, ...importedConfig };
                this.refreshAllPanels();
                this.markDirty();
                this.showToast('Configuración importada exitosamente', 'success');
            } else {
                this.showToast('Archivo de configuración inválido', 'error');
            }
        } catch (error) {
            console.error('Error importing configuration:', error);
            this.showToast('Error al importar configuración', 'error');
        }
    }

    /**
     * Validate imported configuration
     */
    validateImportedConfig(config) {
        return config && 
               typeof config === 'object' &&
               config.fields &&
               Array.isArray(config.fields.configured);
    }

    /**
     * Refresh all panels with current configuration
     */
    refreshAllPanels() {
        this.renderAvailableFields();
        this.renderConfiguredFields();
        this.updateLayoutPreview();
        this.updateAdvancedSettings();
    }

    /**
     * Update advanced settings display
     */
    updateAdvancedSettings() {
        const elements = {
            'autoRefreshInterval': this.config.advanced.autoRefresh,
            'defaultDataPeriod': this.config.advanced.defaultPeriod,
            'defaultComparison': this.config.advanced.defaultComparison
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
    }

    /**
     * Trigger update of main KPIs view
     */
    triggerMainViewUpdate() {
        // Dispatch custom event to notify main view of configuration changes
        const event = new CustomEvent('kpiConfigUpdated', {
            detail: { config: this.config }
        });
        document.dispatchEvent(event);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('kpiConfigToast');
        if (toast) {
            const toastBody = toast.querySelector('.toast-body');
            toastBody.textContent = message;
            
            // Update toast styling based on type
            const toastHeader = toast.querySelector('.toast-header i');
            const iconMap = {
                'success': 'check-circle-fill text-success',
                'error': 'exclamation-triangle-fill text-danger',
                'warning': 'exclamation-triangle-fill text-warning',
                'info': 'info-circle-fill text-primary'
            };
            
            if (toastHeader) {
                toastHeader.className = `bi ${iconMap[type] || iconMap.info} me-2`;
            }
            
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }

    /**
     * Show the admin modal
     */
    show() {
        if (this.modal) {
            this.modal.show();
        }
    }

    /**
     * Hide the admin modal
     */
    hide() {
        if (this.modal) {
            this.modal.hide();
        }
    }

    /**
     * Get current configuration
     */
    getConfiguration() {
        return { ...this.config };
    }

    /**
     * Destroy the admin panel and cleanup
     */
    destroy() {
        // Cleanup sortable instances
        this.sortableInstances.forEach(instance => {
            if (instance.destroy) instance.destroy();
        });
        this.sortableInstances = [];

        // Hide modal if open
        if (this.modal) {
            this.modal.hide();
        }
    }
}

// Export for global usage
window.KPIAdminPanel = KPIAdminPanel;