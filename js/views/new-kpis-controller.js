/**
 * New KPIs Controller - Modern, Modular Implementation
 * Replaces the monolithic KPIsView with a clean, maintainable architecture
 */
class NewKPIsController {
    constructor() {
        this.config = {
            fields: [],
            dateRange: {
                from: null,
                to: null
            },
            comparison: 'previous',
            grouping: 'week',
            filters: {}
        };
        
        this.data = {
            current: [],
            previous: [],
            insights: [],
            table: []
        };
        
        this.charts = {};
        this.adminPanel = null;
        this.container = null;
        this.isLoading = false;
        
        // Pagination state
        this.pagination = {
            currentPage: 1,
            pageSize: 25,
            totalRecords: 0,
            sortColumn: null,
            sortDirection: 'asc'
        };
        
        // Debounce timeout for search
        this.searchTimeout = null;
        
        // Auto-refresh interval
        this.refreshInterval = null;
    }

    /**
     * Initialize the new KPIs view
     */
    async init() {
        await this.loadTemplate();
        await this.loadStyles();
        this.setupAdminPanel();
        this.setupEventListeners();
        this.loadConfiguration();
        await this.generateSampleData();
        this.setDefaultDateRange();
        await this.refreshData();
        this.setupAutoRefresh();
    }

    /**
     * Load the main view template
     */
    async loadTemplate() {
        try {
            // Get the container from router
            this.container = Router.getActiveViewContainer() || document.querySelector('.main-content');
            if (!this.container) {
                throw new Error('No container found for KPIs view');
            }

            // Load template
            const response = await fetch('/components/new-kpis-view.html');
            const templateHTML = await response.text();
            this.container.innerHTML = templateHTML;
            
        } catch (error) {
            console.error('Error loading KPIs template:', error);
            this.loadFallbackTemplate();
        }
    }

    /**
     * Load fallback template if HTML loading fails
     */
    loadFallbackTemplate() {
        const fallbackHTML = `
            <div class="new-kpis-container">
                <div class="container-fluid">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Panel de KPIs</h2>
                        <button type="button" class="btn btn-primary" id="openKPIAdmin">
                            <i class="bi bi-gear-fill me-2"></i>Configurar
                        </button>
                    </div>
                    <div id="insightsSection" class="mb-4"></div>
                    <div id="filtersSection" class="mb-4"></div>
                    <div id="chartsSection" class="mb-4"></div>
                    <div id="tableSection"></div>
                </div>
            </div>
        `;
        this.container.innerHTML = fallbackHTML;
    }

    /**
     * Load responsive CSS styles
     */
    async loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/kpis-responsive.css';
        document.head.appendChild(link);
    }

    /**
     * Setup admin panel
     */
    async setupAdminPanel() {
        try {
            this.adminPanel = new KPIAdminPanel();
            await this.adminPanel.init();
        } catch (error) {
            console.warn('Admin panel not available:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Admin configuration button
        const adminBtn = document.getElementById('openKPIAdmin');
        if (adminBtn && this.adminPanel) {
            adminBtn.addEventListener('click', () => {
                this.adminPanel.show();
            });
        }

        // Date range filters
        this.setupDateFilters();
        
        // Quick filter buttons
        this.setupQuickFilters();
        
        // Table interactions
        this.setupTableInteractions();
        
        // Export buttons
        this.setupExportButtons();
        
        // Chart interactions
        this.setupChartInteractions();

        // Listen for admin config updates
        document.addEventListener('kpiConfigUpdated', (e) => {
            this.onConfigurationUpdated(e.detail.config);
        });

        // Window resize handler for responsive charts
        window.addEventListener('resize', () => {
            this.debounce(this.resizeCharts.bind(this), 250)();
        });
    }

    /**
     * Setup date filter event listeners
     */
    setupDateFilters() {
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const comparisonType = document.getElementById('comparisonType');
        const timeGrouping = document.getElementById('timeGrouping');

        if (dateFrom) {
            dateFrom.addEventListener('change', () => {
                this.config.dateRange.from = dateFrom.value;
                this.refreshData();
            });
        }

        if (dateTo) {
            dateTo.addEventListener('change', () => {
                this.config.dateRange.to = dateTo.value;
                this.refreshData();
            });
        }

        if (comparisonType) {
            comparisonType.addEventListener('change', () => {
                this.config.comparison = comparisonType.value;
                this.refreshData();
            });
        }

        if (timeGrouping) {
            timeGrouping.addEventListener('change', () => {
                this.config.grouping = timeGrouping.value;
                this.refreshData();
            });
        }

        // Reset filters button
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    /**
     * Setup quick filter buttons
     */
    setupQuickFilters() {
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Apply the period
                this.applyQuickFilter(e.target.dataset.period);
            });
        });
    }

    /**
     * Setup table interactions
     */
    setupTableInteractions() {
        // Search functionality
        const searchInput = document.getElementById('tableSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.filterTable(e.target.value);
                }, 300);
            });
        }

        // Pagination controls
        this.setupPaginationControls();
    }

    /**
     * Setup pagination controls
     */
    setupPaginationControls() {
        const firstPage = document.getElementById('firstPage');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        const lastPage = document.getElementById('lastPage');
        const currentPage = document.getElementById('currentPage');

        if (firstPage) {
            firstPage.addEventListener('click', () => this.goToPage(1));
        }

        if (prevPage) {
            prevPage.addEventListener('click', () => this.goToPage(this.pagination.currentPage - 1));
        }

        if (nextPage) {
            nextPage.addEventListener('click', () => this.goToPage(this.pagination.currentPage + 1));
        }

        if (lastPage) {
            lastPage.addEventListener('click', () => {
                const totalPages = Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
                this.goToPage(totalPages);
            });
        }

        if (currentPage) {
            currentPage.addEventListener('change', (e) => {
                const page = parseInt(e.target.value);
                if (page > 0) {
                    this.goToPage(page);
                }
            });
        }
    }

    /**
     * Setup export buttons
     */
    setupExportButtons() {
        const exportCSV = document.getElementById('exportCSV');
        const exportExcel = document.getElementById('exportExcel');
        const exportPDF = document.getElementById('exportPDF');

        if (exportCSV) {
            exportCSV.addEventListener('click', () => this.exportData('csv'));
        }

        if (exportExcel) {
            exportExcel.addEventListener('click', () => this.exportData('excel'));
        }

        if (exportPDF) {
            exportPDF.addEventListener('click', () => this.exportData('pdf'));
        }
    }

    /**
     * Setup chart interactions
     */
    setupChartInteractions() {
        // Full screen chart buttons
        document.querySelectorAll('[data-chart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.closest('[data-chart]').dataset.chart;
                this.showChartModal(chartType);
            });
        });
    }

    /**
     * Load configuration from storage or admin panel
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('new-kpis-config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('Error loading configuration:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('new-kpis-config', JSON.stringify(this.config));
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    }

    /**
     * Set default date range (current week)
     */
    setDefaultDateRange() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        this.config.dateRange.from = this.formatDate(startOfWeek);
        this.config.dateRange.to = this.formatDate(endOfWeek);

        // Update UI
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom) dateFrom.value = this.config.dateRange.from;
        if (dateTo) dateTo.value = this.config.dateRange.to;
    }

    /**
     * Generate sample data for demonstration
     */
    async generateSampleData() {
        this.sampleData = this.createSampleDataset();
    }

    /**
     * Create a realistic sample dataset
     */
    createSampleDataset() {
        const data = [];
        const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
        const products = ['Producto A', 'Producto B', 'Producto C', 'Producto D'];
        const statuses = ['Completado', 'En Proceso', 'Pendiente'];
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // 90 days ago

        for (let i = 0; i < 500; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + Math.floor(i / 5));
            
            data.push({
                id: i + 1,
                date: this.formatDate(date),
                sales: Math.floor(Math.random() * 10000) + 1000,
                quantity: Math.floor(Math.random() * 100) + 10,
                region: regions[Math.floor(Math.random() * regions.length)],
                product: products[Math.floor(Math.random() * products.length)],
                customer: `Cliente ${i + 1}`,
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }

        return data;
    }

    /**
     * Refresh all data and visualizations
     */
    async refreshData() {
        this.showLoading(true);
        
        try {
            // Filter data based on current configuration
            this.data.current = this.filterDataByDateRange(this.sampleData, this.config.dateRange);
            this.data.previous = this.getPreviousPeriodData();
            
            // Generate insights
            this.generateInsights();
            
            // Update all visualizations
            await Promise.all([
                this.renderInsights(),
                this.renderCharts(),
                this.renderTable()
            ]);
            
            this.saveConfiguration();
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Error al actualizar los datos');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Filter data by date range
     */
    filterDataByDateRange(data, dateRange) {
        if (!dateRange.from || !dateRange.to) return data;
        
        return data.filter(item => {
            const itemDate = item.date;
            return itemDate >= dateRange.from && itemDate <= dateRange.to;
        });
    }

    /**
     * Get previous period data for comparison
     */
    getPreviousPeriodData() {
        if (this.config.comparison === 'none') return [];
        
        const fromDate = new Date(this.config.dateRange.from);
        const toDate = new Date(this.config.dateRange.to);
        const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        const prevFromDate = new Date(fromDate);
        prevFromDate.setDate(fromDate.getDate() - daysDiff);
        const prevToDate = new Date(toDate);
        prevToDate.setDate(toDate.getDate() - daysDiff);
        
        return this.filterDataByDateRange(this.sampleData, {
            from: this.formatDate(prevFromDate),
            to: this.formatDate(prevToDate)
        });
    }

    /**
     * Generate insights from current data
     */
    generateInsights() {
        const current = this.data.current;
        const previous = this.data.previous;
        
        this.data.insights = [
            this.generateSalesInsight(current, previous),
            this.generateQuantityInsight(current, previous),
            this.generateRegionInsight(current, previous),
            this.generateTrendInsight(current, previous)
        ];
    }

    /**
     * Generate sales insight
     */
    generateSalesInsight(current, previous) {
        const currentTotal = current.reduce((sum, item) => sum + item.sales, 0);
        const previousTotal = previous.reduce((sum, item) => sum + item.sales, 0);
        const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        
        return {
            title: 'Ventas Totales',
            value: this.formatCurrency(currentTotal),
            change: change,
            trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
            description: `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs período anterior`
        };
    }

    /**
     * Generate quantity insight
     */
    generateQuantityInsight(current, previous) {
        const currentTotal = current.reduce((sum, item) => sum + item.quantity, 0);
        const previousTotal = previous.reduce((sum, item) => sum + item.quantity, 0);
        const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        
        return {
            title: 'Cantidad Total',
            value: this.formatNumber(currentTotal),
            change: change,
            trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
            description: `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs período anterior`
        };
    }

    /**
     * Generate region insight
     */
    generateRegionInsight(current, previous) {
        const regionSales = current.reduce((acc, item) => {
            acc[item.region] = (acc[item.region] || 0) + item.sales;
            return acc;
        }, {});
        
        const topRegion = Object.entries(regionSales).reduce((max, [region, sales]) => 
            sales > max.sales ? { region, sales } : max, { region: '', sales: 0 });
        
        return {
            title: 'Mejor Región',
            value: topRegion.region,
            change: 0,
            trend: 'stable',
            description: this.formatCurrency(topRegion.sales)
        };
    }

    /**
     * Generate trend insight
     */
    generateTrendInsight(current, previous) {
        const avgDaily = current.length > 0 ? 
            current.reduce((sum, item) => sum + item.sales, 0) / current.length : 0;
        const prevAvgDaily = previous.length > 0 ? 
            previous.reduce((sum, item) => sum + item.sales, 0) / previous.length : 0;
        
        const change = prevAvgDaily > 0 ? ((avgDaily - prevAvgDaily) / prevAvgDaily) * 100 : 0;
        
        return {
            title: 'Promedio Diario',
            value: this.formatCurrency(avgDaily),
            change: change,
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            description: 'Ventas promedio por día'
        };
    }

    /**
     * Render insights section
     */
    async renderInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const html = this.data.insights.map(insight => `
            <div class="col-lg-3 col-md-6">
                <div class="insight-card">
                    <h6 class="mb-2">${insight.title}</h6>
                    <div class="insight-value">${insight.value}</div>
                    <div class="insight-trend trend-${insight.trend}">
                        <i class="bi bi-${this.getTrendIcon(insight.trend)} me-1"></i>
                        ${insight.description}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Get trend icon based on trend type
     */
    getTrendIcon(trend) {
        const icons = {
            'up': 'arrow-up',
            'down': 'arrow-down',
            'stable': 'dash'
        };
        return icons[trend] || 'dash';
    }

    /**
     * Render charts section
     */
    async renderCharts() {
        await Promise.all([
            this.renderTrendChart(),
            this.renderDistributionChart(),
            this.renderComparisonChart(),
            this.renderPerformanceChart()
        ]);
    }

    /**
     * Render trend chart
     */
    async renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        // Group data by date
        const groupedData = this.groupDataByDate(this.data.current);
        const labels = Object.keys(groupedData).sort();
        const salesData = labels.map(date => groupedData[date].sales);
        const quantityData = labels.map(date => groupedData[date].quantity);

        this.charts.trend = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ventas',
                        data: salesData,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Cantidad',
                        data: quantityData,
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    /**
     * Render distribution chart
     */
    async renderDistributionChart() {
        const canvas = document.getElementById('distributionChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        // Group by region
        const regionData = this.data.current.reduce((acc, item) => {
            acc[item.region] = (acc[item.region] || 0) + item.sales;
            return acc;
        }, {});

        const labels = Object.keys(regionData);
        const data = Object.values(regionData);

        this.charts.distribution = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#0d6efd',
                        '#198754',
                        '#ffc107',
                        '#dc3545',
                        '#6f42c1'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Render comparison chart
     */
    async renderComparisonChart() {
        const canvas = document.getElementById('comparisonChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        // Calculate totals for comparison
        const currentTotal = this.data.current.reduce((sum, item) => sum + item.sales, 0);
        const previousTotal = this.data.previous.reduce((sum, item) => sum + item.sales, 0);

        this.charts.comparison = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Período Actual', 'Período Anterior'],
                datasets: [{
                    label: 'Ventas',
                    data: [currentTotal, previousTotal],
                    backgroundColor: ['#0d6efd', '#6c757d'],
                    borderColor: ['#0d6efd', '#6c757d'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Render performance chart
     */
    async renderPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }

        // Group by product
        const productData = this.data.current.reduce((acc, item) => {
            if (!acc[item.product]) {
                acc[item.product] = { sales: 0, quantity: 0 };
            }
            acc[item.product].sales += item.sales;
            acc[item.product].quantity += item.quantity;
            return acc;
        }, {});

        const labels = Object.keys(productData);
        const salesData = labels.map(product => productData[product].sales);

        this.charts.performance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas por Producto',
                    data: salesData,
                    backgroundColor: '#0d6efd',
                    borderColor: '#0d6efd',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Group data by date
     */
    groupDataByDate(data) {
        return data.reduce((acc, item) => {
            const date = item.date;
            if (!acc[date]) {
                acc[date] = { sales: 0, quantity: 0 };
            }
            acc[date].sales += item.sales;
            acc[date].quantity += item.quantity;
            return acc;
        }, {});
    }

    /**
     * Render data table
     */
    async renderTable() {
        this.renderTableHeaders();
        this.renderTableData();
        this.updatePagination();
    }

    /**
     * Render table headers
     */
    renderTableHeaders() {
        const container = document.getElementById('tableHeaders');
        if (!container) return;

        const headers = [
            { key: 'date', label: 'Fecha', sortable: true },
            { key: 'sales', label: 'Ventas', sortable: true },
            { key: 'quantity', label: 'Cantidad', sortable: true },
            { key: 'region', label: 'Región', sortable: true },
            { key: 'product', label: 'Producto', sortable: true },
            { key: 'customer', label: 'Cliente', sortable: true },
            { key: 'status', label: 'Estado', sortable: true }
        ];

        const html = headers.map(header => `
            <th class="${header.sortable ? 'sortable' : ''}" data-column="${header.key}">
                ${header.label}
            </th>
        `).join('');

        container.innerHTML = html;

        // Add sort listeners
        container.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                this.sortTable(th.dataset.column);
            });
        });
    }

    /**
     * Render table data with pagination
     */
    renderTableData() {
        const container = document.getElementById('tableBody');
        if (!container) return;

        // Apply search filter
        let filteredData = this.data.current;
        const searchTerm = document.getElementById('tableSearch')?.value?.toLowerCase();
        if (searchTerm) {
            filteredData = filteredData.filter(item => 
                Object.values(item).some(value => 
                    value.toString().toLowerCase().includes(searchTerm)
                )
            );
        }

        // Apply sorting
        if (this.pagination.sortColumn) {
            filteredData.sort((a, b) => {
                const aVal = a[this.pagination.sortColumn];
                const bVal = b[this.pagination.sortColumn];
                
                if (this.pagination.sortDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        // Update total records
        this.pagination.totalRecords = filteredData.length;

        // Apply pagination
        const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const endIndex = startIndex + this.pagination.pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);

        const html = pageData.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>${this.formatCurrency(item.sales)}</td>
                <td>${this.formatNumber(item.quantity)}</td>
                <td>${item.region}</td>
                <td>${item.product}</td>
                <td>${item.customer}</td>
                <td>
                    <span class="badge bg-${this.getStatusColor(item.status)}">
                        ${item.status}
                    </span>
                </td>
            </tr>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Get status color for badge
     */
    getStatusColor(status) {
        const colors = {
            'Completado': 'success',
            'En Proceso': 'warning',
            'Pendiente': 'secondary'
        };
        return colors[status] || 'secondary';
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const totalPages = Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
        
        // Update pagination info
        const startRecord = (this.pagination.currentPage - 1) * this.pagination.pageSize + 1;
        const endRecord = Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalRecords);
        
        const paginationInfo = document.getElementById('paginationInfo');
        if (paginationInfo) {
            paginationInfo.textContent = `Mostrando ${startRecord} - ${endRecord} de ${this.pagination.totalRecords} registros`;
        }

        // Update page input
        const currentPageInput = document.getElementById('currentPage');
        if (currentPageInput) {
            currentPageInput.value = this.pagination.currentPage;
            currentPageInput.max = totalPages;
        }

        const totalPagesSpan = document.getElementById('totalPages');
        if (totalPagesSpan) {
            totalPagesSpan.textContent = totalPages;
        }

        // Update button states
        const firstPage = document.getElementById('firstPage');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        const lastPage = document.getElementById('lastPage');

        if (firstPage) firstPage.disabled = this.pagination.currentPage === 1;
        if (prevPage) prevPage.disabled = this.pagination.currentPage === 1;
        if (nextPage) nextPage.disabled = this.pagination.currentPage === totalPages;
        if (lastPage) lastPage.disabled = this.pagination.currentPage === totalPages;
    }

    /**
     * Sort table by column
     */
    sortTable(column) {
        if (this.pagination.sortColumn === column) {
            this.pagination.sortDirection = this.pagination.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.pagination.sortColumn = column;
            this.pagination.sortDirection = 'asc';
        }

        // Update UI indicators
        document.querySelectorAll('#tableHeaders th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        const currentTh = document.querySelector(`#tableHeaders th[data-column="${column}"]`);
        if (currentTh) {
            currentTh.classList.add(`sort-${this.pagination.sortDirection}`);
        }

        this.renderTableData();
        this.updatePagination();
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.pagination.currentPage = page;
            this.renderTableData();
            this.updatePagination();
        }
    }

    /**
     * Filter table based on search term
     */
    filterTable(searchTerm) {
        this.pagination.currentPage = 1; // Reset to first page
        this.renderTableData();
        this.updatePagination();
    }

    /**
     * Apply quick filter period
     */
    applyQuickFilter(period) {
        const today = new Date();
        let fromDate, toDate;

        switch (period) {
            case 'today':
                fromDate = toDate = today;
                break;
            case 'yesterday':
                fromDate = toDate = new Date(today);
                fromDate.setDate(today.getDate() - 1);
                break;
            case 'thisWeek':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - today.getDay());
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 6);
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - today.getDay() - 7);
                toDate = new Date(fromDate);
                toDate.setDate(fromDate.getDate() + 6);
                break;
            case 'thisMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'thisYear':
                fromDate = new Date(today.getFullYear(), 0, 1);
                toDate = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                return;
        }

        this.config.dateRange.from = this.formatDate(fromDate);
        this.config.dateRange.to = this.formatDate(toDate);

        // Update UI
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        
        if (dateFromInput) dateFromInput.value = this.config.dateRange.from;
        if (dateToInput) dateToInput.value = this.config.dateRange.to;

        this.refreshData();
    }

    /**
     * Reset all filters to defaults
     */
    resetFilters() {
        this.setDefaultDateRange();
        this.config.comparison = 'previous';
        this.config.grouping = 'week';
        this.config.filters = {};

        // Update UI
        const comparisonSelect = document.getElementById('comparisonType');
        const groupingSelect = document.getElementById('timeGrouping');
        const searchInput = document.getElementById('tableSearch');

        if (comparisonSelect) comparisonSelect.value = 'previous';
        if (groupingSelect) groupingSelect.value = 'week';
        if (searchInput) searchInput.value = '';

        // Reset active quick filter
        document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.quick-filter-btn[data-period="thisWeek"]')?.classList.add('active');

        this.refreshData();
    }

    /**
     * Export data in specified format
     */
    exportData(format) {
        const data = this.data.current;
        const timestamp = new Date().toISOString().split('T')[0];

        switch (format) {
            case 'csv':
                this.exportCSV(data, `kpis-data-${timestamp}.csv`);
                break;
            case 'excel':
                this.exportExcel(data, `kpis-data-${timestamp}.xlsx`);
                break;
            case 'pdf':
                this.exportPDF(data, `kpis-report-${timestamp}.pdf`);
                break;
        }
    }

    /**
     * Export data as CSV
     */
    exportCSV(data, filename) {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
    }

    /**
     * Export data as Excel (basic CSV for now)
     */
    exportExcel(data, filename) {
        // For now, export as CSV with xlsx extension
        // In a real implementation, you would use a library like SheetJS
        this.exportCSV(data, filename.replace('.xlsx', '.csv'));
    }

    /**
     * Export data as PDF
     */
    exportPDF(data, filename) {
        // Basic PDF export using jsPDF if available
        if (typeof window.jsPDF !== 'undefined') {
            const doc = new window.jsPDF();
            
            doc.text('KPIs Report', 20, 20);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
            doc.text(`Records: ${data.length}`, 20, 40);
            
            // Add summary data
            const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
            const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
            
            doc.text(`Total Sales: ${this.formatCurrency(totalSales)}`, 20, 60);
            doc.text(`Total Quantity: ${this.formatNumber(totalQuantity)}`, 20, 70);
            
            doc.save(filename);
        } else {
            // Fallback: export as text
            const content = `KPIs Report\nGenerated: ${new Date().toLocaleDateString()}\nRecords: ${data.length}`;
            this.downloadFile(content, filename.replace('.pdf', '.txt'), 'text/plain');
        }
    }

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Show chart in modal
     */
    showChartModal(chartType) {
        const modal = document.getElementById('chartModal');
        if (!modal) return;

        const modalTitle = document.getElementById('chartModalTitle');
        const modalCanvas = document.getElementById('modalChart');
        
        if (modalTitle) {
            modalTitle.textContent = this.getChartTitle(chartType);
        }

        if (modalCanvas && this.charts[chartType]) {
            // Clone chart configuration for modal
            const originalChart = this.charts[chartType];
            const config = JSON.parse(JSON.stringify(originalChart.config));
            
            // Clear any existing chart
            if (modalCanvas.chart) {
                modalCanvas.chart.destroy();
            }
            
            modalCanvas.chart = new Chart(modalCanvas, config);
        }

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Get chart title for modal
     */
    getChartTitle(chartType) {
        const titles = {
            'trend': 'Tendencia Temporal',
            'distribution': 'Distribución por Región',
            'comparison': 'Comparación de Períodos',
            'performance': 'Rendimiento por Producto'
        };
        return titles[chartType] || 'Gráfico';
    }

    /**
     * Resize charts for responsive design
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    /**
     * Setup auto-refresh functionality
     */
    setupAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Get auto-refresh setting (default 60 seconds)
        const interval = this.config.autoRefresh || 60;
        
        if (interval > 0) {
            this.refreshInterval = setInterval(() => {
                this.refreshData();
            }, interval * 1000);
        }
    }

    /**
     * Handle configuration updates from admin panel
     */
    onConfigurationUpdated(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfiguration();
        this.refreshData();
    }

    /**
     * Show/hide loading state
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('d-none', !show);
        }
        this.isLoading = show;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        // You could integrate with a toast notification system here
    }

    /**
     * Utility: Format date as YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Utility: Format currency
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }

    /**
     * Utility: Format number
     */
    formatNumber(value) {
        return new Intl.NumberFormat('es-ES').format(value);
    }

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup and destroy the controller
     */
    destroy() {
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });

        // Destroy admin panel
        if (this.adminPanel) {
            this.adminPanel.destroy();
        }

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for global usage
window.NewKPIsController = NewKPIsController;