const ReportsEvents = {
    setupEventListeners(reportsView) {
        try {
            // Generate report button
            const generateReportBtn = document.getElementById('generate-report-btn');
            if (generateReportBtn) {
                generateReportBtn.addEventListener('click', () => {
                    reportsView.generateReport();
                });
            }
            
            // Field selection
            const reportField = document.getElementById('report-field');
            if (reportField) {
                reportField.addEventListener('change', () => {
                    reportsView.generateReport();
                });
            }
            
            // Date range filters
            const startDate = document.getElementById('start-date');
            const endDate = document.getElementById('end-date');
            
            if (startDate) {
                startDate.addEventListener('change', () => {
                    reportsView.applyFilters();
                });
            }
            
            if (endDate) {
                endDate.addEventListener('change', () => {
                    reportsView.applyFilters();
                });
            }
            
            // Search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('keyup', debounce(() => {
                    reportsView.applyFilters();
                }, 300));
            }
            
            // Date shortcuts
            this.setupDateShortcuts(reportsView);
            
            // Export buttons
            const exportCsvBtn = document.getElementById('export-csv-btn');
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', () => {
                    reportsView.exportToCSV();
                });
            }
            
            const exportPdfBtn = document.getElementById('export-pdf-btn');
            if (exportPdfBtn) {
                exportPdfBtn.addEventListener('click', () => {
                    reportsView.exportToPDF();
                });
            }
            
            // Column selection
            this.setupColumnSelectors(reportsView);
            
        } catch (error) {
            console.error("Error al configurar event listeners:", error);
        }
    },
    
    setupDateShortcuts(reportsView) {
        const today = new Date();
        
        // Today
        const todayBtn = document.getElementById('today-btn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                const todayStr = reportsView.formatDateForInput(today);
                document.getElementById('start-date').value = todayStr;
                document.getElementById('end-date').value = todayStr;
                reportsView.applyFilters();
            });
        }
        
        // Yesterday
        const yesterdayBtn = document.getElementById('yesterday-btn');
        if (yesterdayBtn) {
            yesterdayBtn.addEventListener('click', () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = reportsView.formatDateForInput(yesterday);
                
                document.getElementById('start-date').value = yesterdayStr;
                document.getElementById('end-date').value = yesterdayStr;
                reportsView.applyFilters();
            });
        }
        
        // Last 7 days
        const last7DaysBtn = document.getElementById('last-7-days-btn');
        if (last7DaysBtn) {
            last7DaysBtn.addEventListener('click', () => {
                const last7Days = new Date();
                last7Days.setDate(last7Days.getDate() - 6);
                
                document.getElementById('start-date').value = reportsView.formatDateForInput(last7Days);
                document.getElementById('end-date').value = reportsView.formatDateForInput(today);
                reportsView.applyFilters();
            });
        }
        
        // Last 30 days
        const last30DaysBtn = document.getElementById('last-30-days-btn');
        if (last30DaysBtn) {
            last30DaysBtn.addEventListener('click', () => {
                const last30Days = new Date();
                last30Days.setDate(last30Days.getDate() - 29);
                
                document.getElementById('start-date').value = reportsView.formatDateForInput(last30Days);
                document.getElementById('end-date').value = reportsView.formatDateForInput(today);
                reportsView.applyFilters();
            });
        }
        
        // This month
        const thisMonthBtn = document.getElementById('this-month-btn');
        if (thisMonthBtn) {
            thisMonthBtn.addEventListener('click', () => {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                
                document.getElementById('start-date').value = reportsView.formatDateForInput(firstDay);
                document.getElementById('end-date').value = reportsView.formatDateForInput(today);
                reportsView.applyFilters();
            });
        }
        
        // Last month
        const lastMonthBtn = document.getElementById('last-month-btn');
        if (lastMonthBtn) {
            lastMonthBtn.addEventListener('click', () => {
                const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                
                document.getElementById('start-date').value = reportsView.formatDateForInput(firstDayLastMonth);
                document.getElementById('end-date').value = reportsView.formatDateForInput(lastDayLastMonth);
                reportsView.applyFilters();
            });
        }
    },
    
    setupColumnSelectors(reportsView) {
        const columnSelectors = {
            'column-field1-select': 'field1',
            'column-field2-select': 'field2',
            'column-field3-select': 'field3'
        };
        
        Object.entries(columnSelectors).forEach(([selectId, fieldKey]) => {
            const select = document.getElementById(selectId);
            if (select) {
                select.addEventListener('change', () => {
                    const selectedField = select.value;
                    reportsView.updateSelectedColumns(selectedField, fieldKey);
                });
            }
        });
    }
};

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

window.ReportsEvents = ReportsEvents;