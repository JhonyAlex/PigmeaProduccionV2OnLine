/**
 * Gestiona los eventos de la vista de reportes
 */
const ReportsEvents = {
    /**
     * Configura todos los listeners de eventos para la vista
     * @param {Object} view Vista de reportes
     */
    setupEventListeners(view) {
        const recordsListContainer = document.getElementById('records-list');
        if (recordsListContainer) {
            recordsListContainer.addEventListener('click', (e) => {
                const viewButton = e.target.closest('.view-record');
                if (viewButton) {
                    const recordId = viewButton.dataset.recordId;
                    ReportsModal.showRecordDetails(recordId, view);
                }
            });

            recordsListContainer.addEventListener('change', (e) => {
                if (e.target.classList.contains('select-record-checkbox')) {
                    const recordId = e.target.dataset.recordId;
                    if (e.target.checked) {
                        view.selectedRecordIds.add(recordId);
                    } else {
                        view.selectedRecordIds.delete(recordId);
                    }
                    view.updateEditDateSelectedBtn();
                    view.updateSelectAllCheckbox();
                }
            });
        }

        const selectAllCheckbox = document.getElementById('select-all-records');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.select-record-checkbox');
                if (e.target.checked) {
                    checkboxes.forEach(cb => {
                        cb.checked = true;
                        view.selectedRecordIds.add(cb.dataset.recordId);
                    });
                } else {
                    checkboxes.forEach(cb => {
                        cb.checked = false;
                        view.selectedRecordIds.delete(cb.dataset.recordId);
                    });
                }
                view.updateEditDateSelectedBtn();
            });
        }

        const editDateSelectedBtn = document.getElementById('edit-date-selected-btn');
        if (editDateSelectedBtn) {
            editDateSelectedBtn.addEventListener('click', () => {
                ReportsModal.showEditDateSelectedModal(view);
            });
        }

        document.getElementById('filter-form').addEventListener('submit', (e) => {
            e.preventDefault();
            ReportsTable.applyFilters(view);

            const reportContainer = document.getElementById('report-container');
            if (reportContainer && reportContainer.style.display === 'block') {
                view.generateReport();
            }
        });

        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                view.generateReport();
            });
        }

        const exportCsvBtn = document.getElementById('export-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                const entityFilterSelect = document.getElementById('filter-entity');
                const selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);

                const entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                    ? []
                    : selectedEntities;

                const fromDateFilter = document.getElementById('filter-from-date').value;
                const toDateFilter = document.getElementById('filter-to-date').value;

                const filters = {
                    entityIds: entityFilter.length > 0 ? entityFilter : undefined,
                    fromDate: fromDateFilter || undefined,
                    toDate: toDateFilter || undefined
                };

                const recordsToExport = view.searchedRecords || view.filteredRecords || RecordModel.filterMultiple(filters);

                let sortedRecords = [...recordsToExport];
                if (!view.sorting.column || view.sorting.column === 'timestamp') {
                    sortedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                } else {
                    sortedRecords = view.searchedRecords ? [...view.searchedRecords] : sortedRecords;
                }

                ExportUtils.exportToCSV(
                    sortedRecords,
                    view.selectedColumns.field1,
                    view.selectedColumns.field2,
                    view.selectedColumns.field3
                );
            });
        }

        const searchInput = document.getElementById('search-records');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                ReportsTable.filterRecordsBySearch(view);
            });
        }

        const itemsPerPageSelect = document.getElementById('items-per-page');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.value = view.pagination.itemsPerPage;
            itemsPerPageSelect.addEventListener('change', () => {
                view.pagination.itemsPerPage = parseInt(itemsPerPageSelect.value);
                view.pagination.currentPage = 1;
                ReportsTable.filterRecordsBySearch(view);
            });
        }

        document.querySelectorAll('.date-shortcut').forEach(button => {
            button.addEventListener('click', (e) => {
                const range = e.target.getAttribute('data-range');
                ReportsUtils.setDateRange(range, view);
                document.getElementById('filter-form').dispatchEvent(new Event('submit'));
            });
        });

        document.querySelectorAll('.column-selector').forEach((select, index) => {
            select.addEventListener('change', () => {
                const fieldNumber = index + 1;
                const columnKey = `field${fieldNumber}`;
                const newValue = select.value;

                view.selectedColumns[columnKey] = newValue;

                ReportsTable.updateColumnHeaders(view);
                ReportsTable.filterRecordsBySearch(view);

                const allFields = FieldModel.getAll();
                const previousFieldId = allFields.find(f => {
                    if (fieldNumber === 1) return f.isColumn3 && f.id !== newValue;
                    if (fieldNumber === 2) return f.isColumn4 && f.id !== newValue;
                    if (fieldNumber === 3) return f.isColumn5 && f.id !== newValue;
                    return false;
                })?.id;

                if (previousFieldId) {
                    const prevField = FieldModel.getById(previousFieldId);
                    if (prevField) {
                        if (fieldNumber === 1) prevField.isColumn3 = false;
                        if (fieldNumber === 2) prevField.isColumn4 = false;
                        if (fieldNumber === 3) prevField.isColumn5 = false;
                        FieldModel.update(previousFieldId, prevField);
                    }
                }

                if (newValue) {
                    const selectedField = FieldModel.getById(newValue);
                    if (selectedField) {
                        if (fieldNumber === 1) selectedField.isColumn3 = true;
                        if (fieldNumber === 2) selectedField.isColumn4 = true;
                        if (fieldNumber === 3) selectedField.isColumn5 = true;
                        selectedField.useForRecordsTable = true;
                        FieldModel.update(newValue, selectedField);
                    }
                }
            });
        });

        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');

                if (view.sorting.column === column) {
                    view.sorting.direction = view.sorting.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    view.sorting.column = column;
                    view.sorting.direction = 'asc';
                }

                document.querySelectorAll('th.sortable i.bi').forEach(icon => {
                    icon.className = 'bi';
                });

                const icon = th.querySelector('i.bi');
                if (icon) {
                   icon.className = `bi bi-sort-${view.sorting.direction === 'asc' ? 'up' : 'down'}`;
                }

                ReportsTable.filterRecordsBySearch(view);
            });
        });

        document.addEventListener('fieldModelUpdated', (e) => {
            const field = e.detail;
            let shouldUpdateUI = false;

            if (field.id === view.selectedColumns.field1 || field.isColumn3) {
                view.selectedColumns.field1 = field.isColumn3 ? field.id : '';
                shouldUpdateUI = true;
            }
            if (field.id === view.selectedColumns.field2 || field.isColumn4) {
                view.selectedColumns.field2 = field.isColumn4 ? field.id : '';
                shouldUpdateUI = true;
            }
            if (field.id === view.selectedColumns.field3 || field.isColumn5) {
                view.selectedColumns.field3 = field.isColumn5 ? field.id : '';
                shouldUpdateUI = true;
            }

            if (shouldUpdateUI) {
                const column1Select = document.getElementById('column-selector-1');
                const column2Select = document.getElementById('column-selector-2');
                const column3Select = document.getElementById('column-selector-3');

                if (column1Select) column1Select.value = view.selectedColumns.field1;
                if (column2Select) column2Select.value = view.selectedColumns.field2;
                if (column3Select) column3Select.value = view.selectedColumns.field3;

                ReportsTable.updateColumnHeaders(view);
                ReportsTable.filterRecordsBySearch(view);
            }

            const horizontalSelect = document.getElementById('report-horizontal-field');
            const compareSelect = document.getElementById('report-field');

            if (horizontalSelect && (field.id === horizontalSelect.value || field.isHorizontalAxis)) {
                 const horizontalAxisField = FieldModel.getAll().find(f => f.isHorizontalAxis);
                 horizontalSelect.value = horizontalAxisField ? horizontalAxisField.id : '';
            }
            if (compareSelect && (field.id === compareSelect.value || field.isCompareField)) {
                 const compareField = FieldModel.getAll().find(f => f.isCompareField);
                 compareSelect.value = compareField ? compareField.id : '';
            }
        });
    }
};

window.ReportsEvents = ReportsEvents;