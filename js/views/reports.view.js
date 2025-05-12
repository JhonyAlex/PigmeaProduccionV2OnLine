import { ReportsEvents } from './reports.events.js';
import { ReportsTable } from './reports.table.js';
import { ReportsModal } from './reports.modal.js';
import { ReportsUtils } from './reports.utils.js';

const ReportsView = {
    selectedRecordIds: new Set(),
    pagination: {
        currentPage: 1,
        itemsPerPage: 20,
    },
    sorting: {
        column: 'timestamp',
        direction: 'desc',
    },
    selectedColumns: {
        field1: null,
        field2: null,
        field3: null,
    },
    filteredRecords: [],
    searchedRecords: [],

    init() {
        try {
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento .main-content no encontrado");
                return;
            }

            this.pagination = { currentPage: 1, itemsPerPage: 20 };
            this.sorting = { column: 'timestamp', direction: 'desc' };
            this.selectedColumns = { field1: null, field2: null, field3: null };
            this.filteredRecords = [];
            this.searchedRecords = [];

            this.render();
            ReportsEvents.setupEventListeners(this);
            this.autoGenerateReport();
        } catch (error) {
            console.error("Error al inicializar vista de reportes:", error);
            UIUtils.showAlert('Error al inicializar la vista de reportes', 'danger');
        }
    },

    autoGenerateReport() {
        const sharedNumericFields = FieldModel.getSharedNumericFields();
        if (sharedNumericFields.length === 0) {
            return;
        }

        setTimeout(() => {
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            if (compareField) {
                document.getElementById('report-field').value = compareField.id;
            } else {
                document.getElementById('report-field').value = sharedNumericFields[0].id;
            }

            this.generateReport();
        }, 100);
    },

    render() {
        try {
            const mainContent = Router.getActiveViewContainer() || document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento contenedor no encontrado en render()");
                return;
            }

            const entities = EntityModel.getAll();
            const sharedNumericFields = FieldModel.getSharedNumericFields();
            const sharedFields = FieldModel.getAll();

            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthStr = this.formatDateForInput(lastMonth);
            const today = this.formatDateForInput(new Date());

            const config = StorageService.getConfig();
            const entityName = config.entityName || 'Entidad';

            const column3Field = FieldModel.getAll().find(field => field.isColumn3);
            const column4Field = FieldModel.getAll().find(field => field.isColumn4);
            const column5Field = FieldModel.getAll().find(field => field.isColumn5);

            this.selectedColumns.field1 = column3Field ? column3Field.id : null;
            this.selectedColumns.field2 = column4Field ? column4Field.id : null;
            this.selectedColumns.field3 = column5Field ? column5Field.id : null;

            const horizontalAxisField = FieldModel.getAll().find(field => field.isHorizontalAxis);
            const compareField = FieldModel.getAll().find(field => field.isCompareField);

            const template = `
                <div class="container mt-4">
                    <h2>Reportes y Análisis</h2>
                    <!-- Filtros, Atajos de fecha, Reportes Comparativos, Registros -->
                </div>
            `;

            mainContent.innerHTML = template;

            try {
                ReportsTable.updateColumnHeaders(this);
                ReportsTable.applyFilters(this);
            } catch (error) {
                console.error("Error al actualizar cabeceras o aplicar filtros iniciales:", error);
                mainContent.innerHTML = `<div class="alert alert-danger">Error al inicializar la vista de reportes. Revise la consola para más detalles.</div>`;
            }
        } catch (error) {
            console.error("Error al renderizar vista de reportes:", error);
        }
    },

    update() {
        try {
            this.generateReport();
        } catch (error) {
            console.error("Error al actualizar la vista de reportes:", error);
        }
    }
};

export { ReportsView };