document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Placeholder data for charts ---
    const barChartData = {
        labels: ['Máquina 1 / Turno Mañana', 'Máquina 1 / Turno Tarde', 'Máquina 2 / Turno Mañana', 'Máquina 2 / Turno Tarde', 'Máquina 3 / Turno Mañana'],
        datasets: [{
            label: 'Producción (unidades)',
            data: [120, 135, 110, 125, 90],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const pieChartData = {
        labels: ['Laminado Brillante', 'Laminado Mate', 'Laminado Especial'],
        datasets: [{
            label: 'Distribución de Laminado',
            data: [60, 30, 10], // Percentages
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
        }]
    };

    // --- Initialize Bar Chart ---
    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: barChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Unidades Producidas'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Máquina / Turno'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    } else {
        console.warn('Elemento canvas para barChart no encontrado');
    }

    // --- Initialize Pie Chart ---
    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'pie',
            data: pieChartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + '%';
                                }
                                return label;
                            }
                        }
                    },
                    title: {
                        display: false // Title is already in the card header
                    }
                }
            }
        });
    } else {
        console.warn('Elemento canvas para pieChart no encontrado');
    }

    // --- Placeholder for future dynamic data loading ---
    // function loadChartData() {
    //     console.log("Cargando datos para los gráficos...");
    //     // Aquí se haría la llamada al backend para obtener datos reales
    //     // y luego se actualizarían los gráficos con chartInstance.data = newData; chartInstance.update();
    // }

    // loadChartData(); // Cargar datos al iniciar (o según sea necesario)

    // --- Simulated Backend Data & API Calls ---
    const MOCK_DELAY = 500; // Simulate network latency

    const mockBackendData = {
        kpis: [
            { id: 'totalMetros', title: 'Total Metros', value: '1,480', unit: 'm', change: '+8%', changeType: 'positive', icon: 'bi-rulers' },
            { id: 'numPedidos', title: 'Nº Pedidos', value: '62', unit: '', change: '+3', changeType: 'positive', icon: 'bi-box-seam' },
            { id: 'prodMediaHora', title: 'Producción Media/Hora', value: '25.5', unit: 'u/hr', change: '-2%', changeType: 'negative', icon: 'bi-speedometer2' },
            { id: 'eficienciaGlobal', title: 'Eficiencia Global (OEE)', value: '78', unit: '%', change: '+1.5%', changeType: 'positive', icon: 'bi-graph-up-arrow'}
        ],
        laminadoDistribution: { // For pie chart
            labels: ['Laminado Brillante', 'Laminado Mate', 'Laminado Especial', 'Otro'],
            data: [55, 25, 15, 5]
        },
        produccionPorMaquinaTurno: { // For bar chart
            labels: ['Máquina 1 / Mañana', 'Máquina 1 / Tarde', 'Máquina 2 / Mañana', 'Máquina 2 / Tarde', 'Máquina 3 / Mañana', 'Máquina 3 / Tarde'],
            data: [130, 145, 115, 120, 95, 100]
        },
        entities: [
            { id: 'maquina', name: 'Máquina', icon: 'bi-gear-wide-connected', configurable: true },
            { id: 'operario', name: 'Operario', icon: 'bi-person-badge', configurable: true },
            { id: 'turno', name: 'Turno', icon: 'bi-clock-history', configurable: false },
            { id: 'producto', name: 'Producto', icon: 'bi-box-seam', configurable: true },
            { id: 'pedido', name: 'Pedido', icon: 'bi-journal-text', configurable: false }
        ],
        fields: [
            { id: 'prodTotal', name: 'Producción Total', entityId: 'maquina', type: 'number', unit: 'unidades' },
            { id: 'tiempoCiclo', name: 'Tiempo de Ciclo', entityId: 'maquina', type: 'number', unit: 'segundos' },
            { id: 'scrap', name: 'Scrap (Rechazo)', entityId: 'maquina', type: 'number', unit: 'unidades' },
            { id: 'horasTrabajadas', name: 'Horas Trabajadas', entityId: 'operario', type: 'number', unit: 'horas' },
            { id: 'tipoLaminado', name: 'Tipo de Laminado', entityId: 'producto', type: 'select', options: ['Brillante', 'Mate', 'Especial', 'Otro'] },
            { id: 'metrosLineales', name: 'Metros Lineales', entityId: 'producto', type: 'number', unit: 'm' },
            { id: 'velocidadMaquina', name: 'Velocidad Media', entityId: 'maquina', type: 'number', unit: 'm/min'}
        ],
        filterOptions: {
            machines: [ {id: 'm1', name: 'Máquina Alpha'}, {id: 'm2', name: 'Máquina Beta'}, {id: 'm3', name: 'Máquina Gamma'}],
            operators: [ {id: 'op1', name: 'Juan Pérez'}, {id: 'op2', name: 'Ana Gómez'}, {id: 'op3', name: 'Luis Rodríguez'}],
            shifts: [ {id: 't_morn', name: 'Mañana (06-14)'}, {id: 't_aft', name: 'Tarde (14-22)'}, {id: 't_night', name: 'Noche (22-06)'}]
        }
    };

    function fetchKpis() {
        console.log('API Call: Fetching KPIs...');
        return new Promise(resolve => setTimeout(() => resolve(mockBackendData.kpis), MOCK_DELAY));
    }

    function fetchChartData(chartType) {
        console.log(`API Call: Fetching data for ${chartType}...`);
        return new Promise(resolve => {
            if (chartType === 'laminadoDistribution') {
                setTimeout(() => resolve(mockBackendData.laminadoDistribution), MOCK_DELAY);
            } else if (chartType === 'produccionPorMaquinaTurno') {
                setTimeout(() => resolve(mockBackendData.produccionPorMaquinaTurno), MOCK_DELAY);
            } else {
                setTimeout(() => resolve(null), MOCK_DELAY); // Or reject
            }
        });
    }

    function fetchEntities() {
        console.log('API Call: Fetching Entities...');
        return new Promise(resolve => setTimeout(() => resolve(mockBackendData.entities), MOCK_DELAY));
    }

    function fetchFields() {
        console.log('API Call: Fetching Fields...');
        return new Promise(resolve => setTimeout(() => resolve(mockBackendData.fields), MOCK_DELAY));
    }

    function fetchFilterOptions() {
        console.log('API Call: Fetching Filter Options...');
        return new Promise(resolve => setTimeout(() => resolve(mockBackendData.filterOptions), MOCK_DELAY));
    }


    // --- Update KPI Cards ---
    const kpiSection = document.getElementById('kpi-section');
    function renderKpis(kpis) {
        const kpiContainer = kpiSection.querySelector('.grid');
        if (!kpiContainer) return;

        kpiContainer.innerHTML = ''; // Clear existing placeholders except "Add New"

        kpis.forEach(kpi => {
            const changeColor = kpi.changeType === 'positive' ? 'text-green-500' : 'text-red-500';
            const kpiCardHtml = `
                <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-semibold text-gray-700">${kpi.title}</h3>
                        <i class="bi ${kpi.icon || 'bi-bar-chart-line'} text-2xl text-blue-500"></i>
                    </div>
                    <p class="text-4xl font-bold text-blue-600">${kpi.value} <span class="text-xl">${kpi.unit || ''}</span></p>
                    ${kpi.change ? `<p class="text-sm ${changeColor} mt-1">${kpi.change}</p>` : '<p class="text-sm text-gray-400 mt-1">- sin cambios -</p>'}
                </div>
            `;
            kpiContainer.insertAdjacentHTML('beforeend', kpiCardHtml);
        });

        // Add the "Add New KPI" card back
        const addNewKpiCardHtml = `
            <div class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer group">
                <i class="bi bi-plus-lg text-4xl text-gray-400 group-hover:text-blue-500"></i>
                <span class="mt-2 text-sm font-medium text-gray-500 group-hover:text-blue-500">Añadir Nuevo KPI</span>
            </div>
        `;
        kpiContainer.insertAdjacentHTML('beforeend', addNewKpiCardHtml);
    }

    // --- Update Charts ---
    let barChartInstance, pieChartInstance;

    async function updateCharts() {
        const laminadoData = await fetchChartData('laminadoDistribution');
        if (pieChartInstance && laminadoData) {
            pieChartInstance.data.labels = laminadoData.labels;
            pieChartInstance.data.datasets[0].data = laminadoData.data;
            pieChartInstance.update();
        }

        const produccionData = await fetchChartData('produccionPorMaquinaTurno');
        if (barChartInstance && produccionData) {
            barChartInstance.data.labels = produccionData.labels;
            barChartInstance.data.datasets[0].data = produccionData.data;
            barChartInstance.update();
        }
    }


    // --- Dynamic Configuration Area Logic ---
    const entityListConfig = document.getElementById('entity-list-config');
    const kpiFieldSelect = document.getElementById('kpi-field-select');

    // Placeholder data for entities and fields - REMOVED as we will fetch now
    // const placeholderEntities = [ ... ];
    // const placeholderFields = [ ... ];

    async function loadConfigurationData() {
        const entities = await fetchEntities();
        const fields = await fetchFields();

        // Populate Entities
        if (entityListConfig && entities) {
            entityListConfig.innerHTML = entities.map(entity => `
                <li class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md shadow-sm transition-colors duration-150">
                    <div>
                        <i class="bi ${entity.icon || 'bi-hdd-stack'} mr-3 text-indigo-600 text-lg"></i>
                        <span class="text-gray-800 font-medium">${entity.name}</span>
                    </div>
                    ${entity.configurable ? `
                    <button class="text-sm text-indigo-600 hover:text-indigo-800 font-semibold focus:outline-none" data-entity-id="${entity.id}">
                        Configurar <i class="bi bi-chevron-right ml-1"></i>
                    </button>` : '<span class="text-xs text-gray-400">No configurable</span>'}
                </li>
            `).join('');
        } else {
            if(!entityListConfig) console.warn('Elemento entity-list-config no encontrado');
            if(!entities) console.warn('No se pudieron cargar las entidades');
        }

        // Populate KPI Field Select
        if (kpiFieldSelect && fields) {
            kpiFieldSelect.innerHTML = '<option value="">-- Seleccione un campo --</option>'; // Default option
            kpiFieldSelect.innerHTML += fields.map(field => {
                const entityName = entities.find(e => e.id === field.entityId)?.name || 'General';
                return `<option value="${field.id}" data-entity="${field.entityId}">${field.name} (${entityName} - ${field.unit || field.type})</option>`;
            }).join('');
        } else {
            if(!kpiFieldSelect) console.warn('Elemento kpi-field-select no encontrado');
            if(!fields) console.warn('No se pudieron cargar los campos');
        }
    }

    // Event listeners for config buttons (placeholders for now) - REMAINS THE SAME
    const addKpiFieldButton = document.getElementById('add-kpi-field-button');
    const addKpiFieldButton = document.getElementById('add-kpi-field-button');
    if (addKpiFieldButton) {
        addKpiFieldButton.addEventListener('click', () => {
            const selectedFieldId = kpiFieldSelect.value;
            const customName = document.getElementById('kpi-custom-name').value;
            if (selectedFieldId) {
                alert(`Campo "${selectedFieldId}" añadido como KPI con nombre "${customName || 'Por defecto'}". (Funcionalidad de guardado no implementada)`);
            } else {
                alert('Por favor, seleccione un campo.');
            }
        });
    }

    const createCalculatedKpiButton = document.getElementById('create-calculated-kpi-button');
    if (createCalculatedKpiButton) {
        createCalculatedKpiButton.addEventListener('click', () => {
            alert('Abrir modal/formulario para crear indicador calculado. (No implementado)');
        });
    }

    // Initial load of data for config section by fetching
    loadConfigurationData();

    // --- Advanced Filters Logic ---
    const advancedFiltersForm = document.getElementById('advanced-filters-form');
    const dateFromInput = document.getElementById('filter-date-from');
    const dateToInput = document.getElementById('filter-date-to');
    const machineFilterSelect = document.getElementById('filter-machine');
    const operatorFilterSelect = document.getElementById('filter-operator');
    const shiftFilterSelect = document.getElementById('filter-shift');
    const resetFiltersButton = document.getElementById('reset-filters-button');

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    // Populate filter dropdowns from fetched data
    async function loadFilterOptions() {
        const filterOpts = await fetchFilterOptions();
        if (!filterOpts) {
            console.error("No se pudieron cargar las opciones de filtro.");
            return;
        }

        const populateSelect = (selectElement, options, defaultText) => {
            if (selectElement) {
                selectElement.innerHTML = options && options.length > 0
                    ? options.map(opt => `<option value="${opt.id}">${opt.name}</option>`).join('')
                    : `<option value="">No hay ${defaultText}</option>`;
                // Add "Todas" option
                const allOption = document.createElement('option');
                allOption.value = "";
                allOption.textContent = `Todos/as los/as ${defaultText}`;
                allOption.selected = true; // Select by default
                selectElement.prepend(allOption);
            }
        };

        populateSelect(machineFilterSelect, filterOpts.machines, 'Máquinas');
        populateSelect(operatorFilterSelect, filterOpts.operators, 'Operarios');
        populateSelect(shiftFilterSelect, filterOpts.shifts, 'Turnos');

        // Set default dates: last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
        if(dateFromInput) dateFromInput.value = formatDate(thirtyDaysAgo);
        if(dateToInput) dateToInput.value = formatDate(today);
    }
    loadFilterOptions(); // Load filter options after other data might have loaded

    // Date shortcut buttons - REMAINS THE SAME
    document.querySelectorAll('.date-shortcut-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const range = e.target.dataset.range;
            let fromDate = new Date();
            let toDate = new Date();

            switch (range) {
                case 'today':
                    // fromDate and toDate are already today
                    break;
                case 'yesterday':
                    fromDate.setDate(fromDate.getDate() - 1);
                    toDate.setDate(toDate.getDate() - 1);
                    break;
                case 'thisWeek':
                    const firstDayOfWeek = fromDate.getDate() - fromDate.getDay() + (fromDate.getDay() === 0 ? -6 : 1); // Adjust for Sunday start
                    fromDate.setDate(firstDayOfWeek);
                    // toDate is today
                    break;
                case 'lastWeek':
                    const prevMonday = new Date();
                    prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7 - 7);
                    fromDate = new Date(prevMonday);
                    const prevSunday = new Date(prevMonday);
                    prevSunday.setDate(prevMonday.getDate() + 6);
                    toDate = prevSunday;
                    break;
                case 'thisMonth':
                    fromDate.setDate(1);
                    // toDate is today
                    break;
                case 'lastMonth':
                    fromDate = new Date(toDate.getFullYear(), toDate.getMonth() - 1, 1);
                    toDate = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
                    break;
            }
            if(dateFromInput) dateFromInput.value = formatDate(fromDate);
            if(dateToInput) dateToInput.value = formatDate(toDate);
        });
    });

    // Handle filter form submission
    if (advancedFiltersForm) {
        advancedFiltersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                dateFrom: dateFromInput.value,
                dateTo: dateToInput.value,
                machines: Array.from(machineFilterSelect.selectedOptions).map(opt => opt.value).filter(val => val !== ""),
                operators: Array.from(operatorFilterSelect.selectedOptions).map(opt => opt.value).filter(val => val !== ""),
                shifts: Array.from(shiftFilterSelect.selectedOptions).map(opt => opt.value).filter(val => val !== ""),
            };
            console.log('Filtros aplicados:', filters);
            alert('Filtros aplicados. Ver consola para detalles. (Lógica de filtrado de datos no implementada)');
            // Here, you would typically call a function to fetch/update data based on these filters
            // e.g., updateChartsWithFilters(filters);
        });
    }

    // Handle reset filters
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', () => {
            if(advancedFiltersForm) advancedFiltersForm.reset();

            // Repopulate and set defaults for filter options
            loadFilterOptions().then(() => {
                console.log('Filtros limpiados y opciones recargadas.');
                alert('Filtros limpiados. (Lógica de reseteo de datos no implementada aún)');
                // Potentially trigger a data reload with default/no filters
                // updateChartsWithFilters({}); // Example
            });
        });
    }

    // --- Initial Data Loading Sequence ---
    const kpiGrid = kpiSection.querySelector('.grid');
    const barChartCanvas = document.getElementById('barChart');
    const pieChartCanvas = document.getElementById('pieChart');

    function showLoader(element, message = "Cargando datos...") {
        if (element) {
            // For grid containers like KPIs
            if (element.classList.contains('grid')) {
                 element.innerHTML = `<div class="col-span-full text-center p-8">
                    <i class="bi bi-arrow-repeat text-3xl text-gray-500 animate-spin"></i>
                    <p class="text-gray-500 mt-2">${message}</p>
                </div>`;
            }
            // For chart canvas containers, you might show it on a parent or overlay
            // For simplicity, we'll log for canvas, actual loader would be on its parent div
            else if (element.tagName === 'CANVAS') {
                const parent = element.parentElement;
                if (parent) {
                    // Ensure parent is positioned relatively if it's not already
                    if (getComputedStyle(parent).position === 'static') {
                        parent.style.position = 'relative';
                    }
                    let loader = parent.querySelector('.chart-loader');
                    if (!loader) {
                        loader = document.createElement('div');
                        loader.className = 'chart-loader absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-10';
                        loader.innerHTML = `<i class="bi bi-arrow-repeat text-3xl text-gray-500 animate-spin"></i><p class="text-gray-500 mt-2">${message}</p>`;
                        parent.appendChild(loader);
                    }
                    loader.style.display = 'flex';
                }
            }
        }
    }

    function hideLoader(element) {
        if (element) {
            if (element.classList.contains('grid')) {
                // Content will be replaced by renderKpis, so no specific hide needed here if renderKpis clears it.
                // However, if renderKpis *appends*, then you'd clear the loader specifically.
            } else if (element.tagName === 'CANVAS') {
                const parent = element.parentElement;
                const loader = parent ? parent.querySelector('.chart-loader') : null;
                if (loader) {
                    loader.style.display = 'none';
                }
            }
        }
    }

    async function initializeDashboard() {
        if (kpiGrid) showLoader(kpiGrid, "Cargando KPIs...");
        if (barChartCanvas) showLoader(barChartCanvas, "Cargando gráfico de producción...");
        if (pieChartCanvas) showLoader(pieChartCanvas, "Cargando gráfico de laminados...");

        const kpis = await fetchKpis();
        if (kpis && kpiGrid) {
            renderKpis(kpis); // This function should clear the loader by replacing content
        } else if (kpiGrid) {
            kpiGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Error al cargar KPIs.</p>';
        }


        // Initialize charts with empty data or placeholders first, then update
        const barCtx = barChartCanvas?.getContext('2d');
        if (barCtx && !barChartInstance) {
            barChartInstance = new Chart(barCtx, {
                type: 'bar',
                data: { labels: [], datasets: [{ label: 'Producción (unidades)', data: [], backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, title: { display: true, text: 'Unidades Producidas'}}, x: {title: {display: true, text: 'Máquina / Turno'}}},
                    plugins: { legend: {display: true, position: 'top'}, tooltip: {mode: 'index', intersect: false}}
                }
            });
        }

        const pieCtx = pieChartCanvas?.getContext('2d');
        if (pieCtx && !pieChartInstance) {
            pieChartInstance = new Chart(pieCtx, {
                type: 'pie',
                data: { labels: [], datasets: [{ label: 'Distribución de Laminado', data: [], backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'] }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: {position: 'bottom'}, tooltip: {callbacks: {label: function(context) { let label = context.label || ''; if (label) {label += ': ';} if (context.parsed !== null) {label += context.parsed + '%';} return label;}}}}
                }
            });
        }

        await updateCharts();
        if (barChartCanvas) hideLoader(barChartCanvas);
        if (pieChartCanvas) hideLoader(pieChartCanvas);

        // For config and filters, loaders might be less critical or handled differently
        // as they are not typically long async operations for initial structure
        await loadConfigurationData();
        await loadFilterOptions();

        console.log("Dashboard inicializado con datos simulados del backend.");
    }

    initializeDashboard();


    // Mobile menu toggle (already implemented, just ensuring it's here)
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Export Functionality --- - REMAINS THE SAME
    const exportPdfButton = document.getElementById('export-pdf-button');
    const exportExcelButton = document.getElementById('export-excel-button');

    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', () => {
            // Placeholder: In a real scenario, this would generate a PDF of the current view
            // This might involve using a library like jsPDF and html2canvas to capture the dashboard
            alert('Funcionalidad "Exportar Vista a PDF" no implementada. Se generaría un PDF de la vista actual.');
            console.log('Intento de exportar vista a PDF.');

            // Example of how it might work with jsPDF (library needs to be included)
            // if (typeof jsPDF !== 'undefined' && typeof html2canvas !== 'undefined') {
            //     const mainContent = document.getElementById('main-content');
            //     html2canvas(mainContent).then(canvas => {
            //         const imgData = canvas.toDataURL('image/png');
            //         const pdf = new jsPDF('p', 'mm', 'a4');
            //         const imgProps= pdf.getImageProperties(imgData);
            //         const pdfWidth = pdf.internal.pageSize.getWidth();
            //         const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            //         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            //         pdf.save("dashboard_reportes.pdf");
            //     });
            // } else {
            //     console.warn('jsPDF y/o html2canvas no están disponibles.');
            // }
        });
    }

    if (exportExcelButton) {
        exportExcelButton.addEventListener('click', () => {
            // Placeholder: This would gather data (e.g., from charts, KPIs, or filtered records)
            // and format it for Excel export, possibly using a library like SheetJS (xlsx).
            alert('Funcionalidad "Exportar Datos a Excel" no implementada. Se exportarían los datos relevantes.');
            console.log('Intento de exportar datos a Excel.');

            // Example: If we had some data to export
            // const dataToExport = [
            //     { kpi: "Total Metros", valor: "1,234 m", variacion: "+5%" },
            //     { kpi: "Nº Pedidos", valor: "56", variacion: "-2%" },
            //     // ... más datos de KPIs, datos de gráficos, etc.
            // ];
            // if (typeof ExportUtils !== 'undefined' && ExportUtils.exportToCSV) { // Assuming ExportUtils has CSV for simplicity
            //     // Need to adapt ExportUtils or create a new method for more complex Excel structures
            //     const records = dataToExport.map(item => ({
            //         Indicador: item.kpi,
            //         Valor: item.valor,
            //         Variacion: item.variacion
            //     }));
            //     ExportUtils.exportToCSV(records, 'kpis_reporte.csv'); // Using CSV as a stand-in
            //     console.log("Usando ExportUtils.exportToCSV como placeholder para Excel.");
            // } else if (typeof XLSX !== 'undefined') { // If SheetJS/xlsx is directly available
            //     const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            //     const workbook = XLSX.utils.book_new();
            //     XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes");
            //     XLSX.writeFile(workbook, "reportes_dashboard.xlsx");
            // } else {
            //     console.warn('ExportUtils.exportToCSV o XLSX (SheetJS) no están disponibles.');
            // }
        });
    }
});
