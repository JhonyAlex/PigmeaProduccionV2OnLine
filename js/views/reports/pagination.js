/**
 * Módulo para la funcionalidad de paginación en la vista de reportes
 */

/**
 * Configura las funciones de paginación en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupPaginationFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con paginación al objeto ReportsView

    /**
     * Muestra los registros paginados
     */
    ReportsView.displayPaginatedRecords = function() {
        const { currentPage, itemsPerPage } = this.pagination;
        const records = this.searchedRecords || []; // Usar los registros buscados/ordenados
        const totalRecords = records.length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        // Validar currentPage
        if (currentPage > totalPages && totalPages > 0) {
            this.pagination.currentPage = totalPages; // Ir a la última página si la actual es inválida
        } else if (currentPage < 1) {
            this.pagination.currentPage = 1; // Asegurar que sea al menos 1
        }


        // Calcular índices de registros a mostrar (usando el currentPage potencialmente corregido)
        const startIndex = (this.pagination.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
        const recordsToShow = records.slice(startIndex, endIndex);

        // Mostrar registros paginados
        this.displayFilteredRecords(recordsToShow);

        // Actualizar controles de paginación
        this.updatePaginationControls(totalPages);
    };

    /**
     * Actualiza los controles de paginación
     * @param {number} totalPages - Número total de páginas
     */
    ReportsView.updatePaginationControls = function(totalPages) {
        const paginationControls = document.getElementById('pagination-controls');
        if (!paginationControls) return;

        const { currentPage } = this.pagination;

        // Limpiar controles existentes
        paginationControls.innerHTML = '';

        // No mostrar paginación si hay una sola página o ninguna
        if (totalPages <= 1) return;

        // --- Lógica de paginación mejorada ---
        const maxPagesToShow = 5; // Máximo de botones numéricos a mostrar
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            // Mostrar todas las páginas si son pocas
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calcular páginas a mostrar alrededor de la actual
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrent) {
                // Cerca del inicio
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                // Cerca del final
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                // En el medio
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        // Función auxiliar para crear un item de paginación
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
                    this.goToPage(page);
                });
            }
             if (isActive) {
                 a.setAttribute('aria-current', 'page');
             }
            li.appendChild(a);
            return li;
        };

        // Botón Anterior
        paginationControls.appendChild(createPageItem(currentPage - 1, '<span aria-hidden="true">&laquo;</span>', currentPage === 1));


        // Primera página y elipsis si es necesario
        if (startPage > 1) {
            paginationControls.appendChild(createPageItem(1));
            if (startPage > 2) {
                paginationControls.appendChild(createPageItem(0, '...', true, false, true)); // Ellipsis
            }
        }

        // Páginas numeradas
        for (let i = startPage; i <= endPage; i++) {
            paginationControls.appendChild(createPageItem(i, i, false, i === currentPage));
        }

        // Elipsis y última página si es necesario
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                 paginationControls.appendChild(createPageItem(0, '...', true, false, true)); // Ellipsis
            }
            paginationControls.appendChild(createPageItem(totalPages));
        }

        // Botón Siguiente
        paginationControls.appendChild(createPageItem(currentPage + 1, '<span aria-hidden="true">&raquo;</span>', currentPage === totalPages));
    };

    /**
     * Navega a una página específica
     * @param {number} pageNumber - Número de página a la que ir
     */
    ReportsView.goToPage = function(pageNumber) {
        const { itemsPerPage } = this.pagination;
        const totalRecords = (this.searchedRecords || []).length;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        // Validar número de página
        if (pageNumber < 1 || pageNumber > totalPages) {
            return; // No hacer nada si la página es inválida
        }

        this.pagination.currentPage = pageNumber;
        this.displayPaginatedRecords();

        // Desactivar el desplazamiento automático al cambiar de página
        // const tableElement = document.getElementById('records-table');
        // if (tableElement) {
        //     tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // }
    };
} 