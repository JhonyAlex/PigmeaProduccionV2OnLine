const ReportsTable = {
    updateColumnHeaders(reportsView) {
        try {
            const fields = FieldModel.getAll();
            const tableHeader = document.getElementById('reports-table-header');
            if (!tableHeader) return;
            
            // Base headers
            let headerHTML = `
                <th scope="col">ID</th>
                <th scope="col" data-column="timestamp">Fecha <i class="fas fa-sort"></i></th>
                <th scope="col">Hora</th>
            `;

            // Custom column headers based on selected fields
            Object.entries(reportsView.selectedColumns).forEach(([key, fieldId]) => {
                if (fieldId) {
                    const field = fields.find(f => f.id === fieldId);
                    if (field) {
                        headerHTML += `
                            <th scope="col" data-column="${field.id}">${field.name} <i class="fas fa-sort"></i></th>
                        `;
                    }
                }
            });
            
            tableHeader.innerHTML = headerHTML;
            
            // Set up sorting event listeners
            const sortableHeaders = tableHeader.querySelectorAll('th[data-column]');
            sortableHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.getAttribute('data-column');
                    reportsView.handleTableSorting(column);
                });
            });
        } catch (error) {
            console.error("Error al actualizar cabeceras de tabla:", error);
        }
    },

    renderTable(reportsView) {
        try {
            const tableBody = document.getElementById('reports-table-body');
            if (!tableBody) return;
            
            const stats = reportsView.getReportSummaryStats();
            const recordCount = document.getElementById('record-count');
            if (recordCount) recordCount.textContent = stats.count;
            
            const recordsAvg = document.getElementById('records-avg');
            if (recordsAvg) recordsAvg.textContent = stats.average;
            
            const recordsMin = document.getElementById('records-min');
            if (recordsMin) recordsMin.textContent = stats.min;
            
            const recordsMax = document.getElementById('records-max');
            if (recordsMax) recordsMax.textContent = stats.max;

            // Apply sorting
            const sortedRecords = this.sortRecords(reportsView.searchedRecords, reportsView.sorting);
            
            // Apply pagination
            const { currentPage, itemsPerPage } = reportsView.pagination;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);
            
            this.renderPagination(reportsView, sortedRecords.length);
            
            if (paginatedRecords.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="20" class="text-center">No se encontraron registros</td>
                    </tr>
                `;
                return;
            }
            
            let tableHTML = '';
            const fields = FieldModel.getAll();
            
            paginatedRecords.forEach(record => {
                const date = new Date(record.timestamp);
                const dateStr = date.toISOString().split('T')[0];
                const timeStr = date.toTimeString().split(' ')[0];
                
                let rowHTML = `
                    <td>${record.id}</td>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                `;
                
                // Add custom column data
                Object.values(reportsView.selectedColumns).forEach(fieldId => {
                    if (fieldId) {
                        const field = fields.find(f => f.id === fieldId);
                        if (field) {
                            const value = record.data[fieldId] || '--';
                            rowHTML += `<td>${value}</td>`;
                        }
                    }
                });
                
                tableHTML += `<tr>${rowHTML}</tr>`;
            });
            
            tableBody.innerHTML = tableHTML;
        } catch (error) {
            console.error("Error al renderizar tabla:", error);
        }
    },
    
    sortRecords(records, sorting) {
        const { column, direction } = sorting;
        
        return [...records].sort((a, b) => {
            let valueA, valueB;
            
            if (column === 'timestamp') {
                valueA = a.timestamp;
                valueB = b.timestamp;
            } else {
                valueA = a.data[column];
                valueB = b.data[column];
            }
            
            // Handle numeric values
            if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
                valueA = Number(valueA);
                valueB = Number(valueB);
            }
            
            // Handle string values
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            }
            
            // Handle other types
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    },
    
    renderPagination(reportsView, totalRecords) {
        try {
            const paginationContainer = document.getElementById('pagination-container');
            if (!paginationContainer) return;
            
            const { currentPage, itemsPerPage } = reportsView.pagination;
            const totalPages = Math.ceil(totalRecords / itemsPerPage);
            
            if (totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }
            
            let paginationHTML = `
                <nav aria-label="Navegación de páginas">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Anterior">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
            `;
            
            // Show max 5 page numbers with current page in the middle when possible
            const maxPages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
            let endPage = Math.min(totalPages, startPage + maxPages - 1);
            
            if (endPage - startPage + 1 < maxPages) {
                startPage = Math.max(1, endPage - maxPages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            paginationHTML += `
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Siguiente">
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            `;
            
            paginationContainer.innerHTML = paginationHTML;
            
            // Set up pagination event listeners
            const pageLinks = paginationContainer.querySelectorAll('.page-link');
            pageLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(link.getAttribute('data-page'));
                    if (!isNaN(page) && page > 0 && page <= totalPages) {
                        reportsView.pagination.currentPage = page;
                        this.renderTable(reportsView);
                    }
                });
            });
        } catch (error) {
            console.error("Error al renderizar paginación:", error);
        }
    },
    
    applyFilters(reportsView) {
        try {
            reportsView.applyFilters();
        } catch (error) {
            console.error("Error aplicando filtros:", error);
        }
    }
};

window.ReportsTable = ReportsTable;
