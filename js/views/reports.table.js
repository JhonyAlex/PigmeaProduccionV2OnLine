/**
 * Funcionalidades de tabla para la vista de reportes
 */
const ReportsTable = {
    /**
     * Actualiza las cabeceras de las columnas personalizadas
     * @param {Object} view Vista de reportes
     */
    updateColumnHeaders(view) {
        const column1Header = document.querySelector('.column-1');
        const column2Header = document.querySelector('.column-2');
        const column3Header = document.querySelector('.column-3');

        if (column1Header && view.selectedColumns.field1) {
            const field = FieldModel.getById(view.selectedColumns.field1);
            if (field) column1Header.textContent = field.name;
        }

        if (column2Header && view.selectedColumns.field2) {
            const field = FieldModel.getById(view.selectedColumns.field2);
            if (field) column2Header.textContent = field.name;
        }

        if (column3Header && view.selectedColumns.field3) {
            const field = FieldModel.getById(view.selectedColumns.field3);
            if (field) column3Header.textContent = field.name;
        }
    },

    /**
     * Aplica los filtros de búsqueda y actualiza la tabla
     * @param {Object} view Vista de reportes
     */
    applyFilters(view) {
        const entityFilterSelect = document.getElementById('filter-entity');
        const selectedEntities = Array.from(entityFilterSelect.selectedOptions).map(option => option.value);
        const config = StorageService.getConfig();
        const entityName = config.entityName || 'Entidad';
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

        const filteredRecords = RecordModel.filterMultiple(filters);

        view.filteredRecords = filteredRecords;

        view.pagination.currentPage = 1;

        this.filterRecordsBySearch(view);
    },

    /**
     * Filtra los registros por la búsqueda y actualiza la tabla
     * @param {Object} view Vista de reportes
     */
    filterRecordsBySearch(view) {
        const searchInput = document.getElementById('search-records');
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let searchedRecords = view.filteredRecords || [];

        if (searchText && view.filteredRecords) {
            searchedRecords = view.filteredRecords.filter(record => {
                const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

                if (entity.name.toLowerCase().includes(searchText)) return true;

                const formattedDate = UIUtils.formatDate(record.timestamp).toLowerCase();
                if (formattedDate.includes(searchText)) return true;

                const fields = FieldModel.getAll();

                const col1Value = ReportsUtils.getFieldValue(record, view.selectedColumns.field1, fields);
                const col2Value = ReportsUtils.getFieldValue(record, view.selectedColumns.field2, fields);
                const col3Value = ReportsUtils.getFieldValue(record, view.selectedColumns.field3, fields);

                if (String(col1Value).toLowerCase().includes(searchText)) return true;
                if (String(col2Value).toLowerCase().includes(searchText)) return true;
                if (String(col3Value).toLowerCase().includes(searchText)) return true;

                for (const fieldId in record.data) {
                    if (fieldId === view.selectedColumns.field1 ||
                        fieldId === view.selectedColumns.field2 ||
                        fieldId === view.selectedColumns.field3) {
                        continue;
                    }

                    const field = fields.find(f => f.id === fieldId) || { name: fieldId };
                    const value = String(record.data[fieldId]).toLowerCase();

                    if (field.name.toLowerCase().includes(searchText) || value.includes(searchText)) {
                        return true;
                    }
                }

                return false;
            });
        }

        view.searchedRecords = searchedRecords;

        const recordsCountSpan = document.getElementById('records-count');
         if (recordsCountSpan) {
            recordsCountSpan.textContent = `${searchedRecords.length} registros`;
         }

        const sortedRecords = this.sortRecords(searchedRecords, view);

        view.searchedRecords = sortedRecords;

        this.displayPaginatedRecords(view);
    },

    /**
     * Ordena los registros según la columna y dirección seleccionadas
     * @param {Array} records Registros a ordenar
     * @param {Object} view Vista de reportes
     * @returns {Array} Registros ordenados
     */
    sortRecords(records, view) {
        if (!records) return [];

        const { column, direction } = view.sorting;
        const multiplier = direction === 'asc' ? 1 : -1;

        const allFields = FieldModel.getAll();

        return [...records].sort((a, b) => {
            let valueA, valueB;

            switch (column) {
                case 'entity':
                    const entityA = EntityModel.getById(a.entityId) || { name: '' };
                    const entityB = EntityModel.getById(b.entityId) || { name: '' };
                    valueA = entityA.name.toLowerCase();
                    valueB = entityB.name.toLowerCase();
                    break;

                case 'timestamp':
                    valueA = new Date(a.timestamp).getTime();
                    valueB = new Date(b.timestamp).getTime();
                    break;

                case 'field1':
                case 'field2':
                case 'field3':
                    const fieldId = view.selectedColumns[column];

                    valueA = ReportsUtils.getFieldValue(a, fieldId, allFields);
                    valueB = ReportsUtils.getFieldValue(b, fieldId, allFields);

                    valueA = valueA === null || valueA === undefined ? '' : valueA;
                    valueB = valueB === null || valueB === undefined ? '' : valueB;

                    const numA = Number(valueA);
                    const numB = Number(valueB);

                    if (!isNaN(numA) && !isNaN(numB) && String(valueA).trim() !== '' && String(valueB).trim() !== '') {
                        valueA = numA;
                        valueB = numB;
                    } else {
                        valueA = String(valueA).toLowerCase();
                        valueB = String(valueB).toLowerCase();
                    }
                    break;

                default:
                     valueA = new Date(a.timestamp).getTime();
                     valueB = new Date(b.timestamp).getTime();
                     if (valueA < valueB) return 1;
                     if (valueA > valueB) return -1;
                     return 0;
            }

            if (valueA < valueB) return -1 * multiplier;
            if (valueA > valueB) return 1 * multiplier;
            return 0;
        });
    },

    /**
     * Muestra los registros paginados
     * @param {Object} view Vista de reportes
     */
    displayPaginatedRecords(view) {
        const { currentPage, itemsPerPage } = view.pagination;
        const records = view.searchedRecords || [];
        const totalRecords = records.length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        if (currentPage > totalPages && totalPages > 0) {
            view.pagination.currentPage = totalPages;
        } else if (currentPage < 1) {
            view.pagination.currentPage = 1;
        }

        const startIndex = (view.pagination.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
        const recordsToShow = records.slice(startIndex, endIndex);

        this.displayFilteredRecords(recordsToShow, view);

        this.updatePaginationControls(totalPages, view);
    },

    /**
     * Actualiza los controles de paginación
     * @param {number} totalPages Total de páginas
     * @param {Object} view Vista de reportes
     */
    updatePaginationControls(totalPages, view) {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;

        const { currentPage } = view.pagination;

        paginationControls.innerHTML = '';

        if (totalPages <= 1) return;

        const maxPagesToShow = 5;
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrent) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        const createPageItem = (page, text = page, isDisabled = false, isActive = false, isEllipsis = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.innerHTML = text;
            if (isEllipsis) {
                 a.setAttribute('aria-disabled', 'true');
            } else if (!isDisabled && !isActive) {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.goToPage(page, view);
                });
            }
            if (isActive) {
                a.setAttribute('aria-current', 'page');
            }
            li.appendChild(a);
            return li;
        };

        paginationControls.appendChild(createPageItem(currentPage - 1, '<span aria-hidden="true">&laquo;</span>', currentPage === 1));

        if (startPage > 1) {
            paginationControls.appendChild(createPageItem(1));
            if (startPage > 2) {
                paginationControls.appendChild(createPageItem(0, '...', true, false, true));
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationControls.appendChild(createPageItem(i, i, false, i === currentPage));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationControls.appendChild(createPageItem(0, '...', true, false, true));
            }
            paginationControls.appendChild(createPageItem(totalPages));
        }

        paginationControls.appendChild(createPageItem(currentPage + 1, '<span aria-hidden="true">&raquo;</span>', currentPage === totalPages));
    },

    /**
     * Navega a la página especificada
     * @param {number} pageNumber Número de página
     * @param {Object} view Vista de reportes
     */
    goToPage(pageNumber, view) {
        const { itemsPerPage } = view.pagination;
        const totalRecords = (view.searchedRecords || []).length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        if (pageNumber < 1 || pageNumber > totalPages) {
            return;
        }

        view.pagination.currentPage = pageNumber;
        this.displayPaginatedRecords(view);

        const tableElement = document.getElementById('records-table');
        if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Muestra los registros filtrados en la tabla
     * @param {Array} records Registros a mostrar
     * @param {Object} view Vista de reportes
     */
    displayFilteredRecords(records, view) {
        const recordsList = document.getElementById('records-list');
        const noFilteredRecordsDiv = document.getElementById('no-filtered-records');
        const recordsTable = document.getElementById('records-table');
        const paginationControls = document.getElementById('pagination-controls').closest('.d-flex');
        const itemsPerPageSelector = document.getElementById('items-per-page').closest('.d-flex');

        if (!recordsList || !noFilteredRecordsDiv || !recordsTable || !paginationControls || !itemsPerPageSelector) {
            console.error("Elementos de la tabla o paginación no encontrados en el DOM.");
            return;
        }

        const hasRecords = records.length > 0;
        noFilteredRecordsDiv.style.display = hasRecords ? 'none' : 'block';
        recordsTable.style.display = hasRecords ? 'table' : 'none';
        paginationControls.style.visibility = hasRecords ? 'visible' : 'hidden';
        itemsPerPageSelector.style.visibility = hasRecords ? 'visible' : 'hidden';

        recordsList.innerHTML = '';

        if (!hasRecords) {
            view.selectedRecordIds.clear();
            view.updateEditDateSelectedBtn();
            view.updateSelectAllCheckbox();
            return;
        }

        const allFields = FieldModel.getAll();

        records.forEach(record => {
            const entity = EntityModel.getById(record.entityId) || { name: 'Desconocido' };

            const fieldColumns = {
                field1: ReportsUtils.getFieldValue(record, view.selectedColumns.field1, allFields),
                field2: ReportsUtils.getFieldValue(record, view.selectedColumns.field2, allFields),
                field3: ReportsUtils.getFieldValue(record, view.selectedColumns.field3, allFields)
            };

            const isChecked = view.selectedRecordIds.has(record.id) ? 'checked' : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entity.name}</td>
                <td>${UIUtils.formatDate(record.timestamp)}</td>
                <td>${fieldColumns.field1}</td>
                <td>${fieldColumns.field2}</td>
                <td>${fieldColumns.field3}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-record" data-record-id="${record.id}" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <input type="checkbox" class="form-check-input ms-2 select-record-checkbox" data-record-id="${record.id}" ${isChecked} title="Seleccionar registro">
                </td>
            `;

            recordsList.appendChild(row);
        });

        view.updateEditDateSelectedBtn();
        view.updateSelectAllCheckbox();
    }
};

window.ReportsTable = ReportsTable;