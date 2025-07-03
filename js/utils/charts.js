/**
 * Utilidades para generar gráficos y reportes visuales
 */
const ChartUtils = {
    /**
     * Colores para usar en los gráficos
     */
    chartColors: [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 205, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(201, 203, 207, 0.7)',
        'rgba(255, 99, 71, 0.7)',
        'rgba(50, 205, 50, 0.7)',
        'rgba(138, 43, 226, 0.7)'
    ],
    
    /**
     * Formatea números con el formato solicitado:
     * 10 → 10,00
     * 100 → 100,00
     * 1000 → 1.000,00
     * 100000 → 100.000,00
     * 1000000 → 1'000.000,00
     * 1000000000 → 1.000'000.000,00
     * 
     * @param {number} number Número a formatear
     * @param {number} decimals Cantidad de decimales (default: 2)
     * @returns {string} Número formateado
     */
    formatNumber(number, decimals = 2) {
        // Paso 1: Convertir el número a string con los decimales requeridos
        let numStr = number.toFixed(decimals);
        
        // Paso 2: Separar la parte entera y decimal
        const [integerStr, decimalStr] = numStr.split('.');
        
        // Paso 3: Si el número es menor que 1000, no necesitamos separadores
        if (integerStr.length <= 3) {
            return `${integerStr},${decimalStr || '00'}`;
        }
        
        // Paso 4: Para números mayores, procesamos la parte entera
        let result = '';
        const len = integerStr.length;
        
        // Procesamos cada dígito de derecha a izquierda
        for (let i = len - 1; i >= 0; i--) {
            // Añadimos el dígito al inicio
            result = integerStr[i] + result;
            
            // Calculamos la posición desde la derecha (empezando desde 0)
            const posFromRight = len - 1 - i;
            
            // Si no es el último dígito y estamos en una posición que requiere separador
            if (i > 0 && (posFromRight + 1) % 3 === 0) {
                // Posición 6 desde la derecha = posición de millones
                if (posFromRight === 5) {
                    result = "'" + result;
                } else {
                    result = "." + result;
                }
            }
        }
        
        // Paso 5: Unir la parte entera formateada con la parte decimal
        return `${result},${decimalStr || '00'}`;
    },
    
    /**
     * Crea o actualiza un gráfico de barras
     * @param {string} canvasId ID del elemento canvas
     * @param {Object} reportData Datos del reporte
     * @param {Object} customConfig Configuración personalizada (opcional)
     * @returns {Chart} Instancia del gráfico
     */
    createBarChart(canvasId, chartTitle, axisLabels, datasets, labels) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return null;
        }

        // Destruir gráfico anterior si existe
        if (canvas.chart) {
            canvas.chart.destroy();
        }

        // Asignar colores si no están definidos en los datasets
        datasets.forEach((dataset, index) => {
            if (!dataset.backgroundColor) {
                // Si backgroundColor es un array (para barras individuales), no lo sobrescribas.
                if (!Array.isArray(dataset.data) || !Array.isArray(dataset.backgroundColor) || dataset.backgroundColor.length !== dataset.data.length) {
                    dataset.backgroundColor = this.chartColors[index % this.chartColors.length];
                }
            }
            if (!dataset.borderColor) {
                 if (!Array.isArray(dataset.data) || !Array.isArray(dataset.borderColor) || dataset.borderColor.length !== dataset.data.length) {
                    const bgColor = dataset.backgroundColor; // Puede ser un array si se asignó arriba o vino así
                    if (typeof bgColor === 'string' && bgColor.startsWith('rgba')) {
                        dataset.borderColor = bgColor.replace(/, ?0\.\d+\)$/, ', 1)');
                    } else if (Array.isArray(bgColor)) {
                         // Si backgroundColor es un array, borderColor también debería serlo o un color único.
                         // Por simplicidad, si bgColor es un array, borderColor también lo será, con cada color aclarado.
                         // Esto puede no ser ideal si se quiere un borde único para todas las barras.
                         dataset.borderColor = bgColor.map(color => typeof color === 'string' && color.startsWith('rgba') ? color.replace(/, ?0\.\d+\)$/, ', 1)') : color);
                    } else {
                        dataset.borderColor = this.chartColors[(index + Math.floor(this.chartColors.length / 2)) % this.chartColors.length].replace('0.7', '1');
                    }
                 }
            }
            dataset.borderWidth = dataset.borderWidth || 1;
        });

        const options = {
            responsive: true,
            maintainAspectRatio: false, // Permitir que la altura se ajuste mejor
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: !!chartTitle,
                    text: chartTitle
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = this.formatNumber(context.raw);
                            return `${context.dataset.label || ''}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: !!(axisLabels && axisLabels.x),
                        text: (axisLabels && axisLabels.x) || ''
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: !!(axisLabels && axisLabels.y),
                        text: (axisLabels && axisLabels.y) || ''
                    },
                    ticks: {
                        callback: (value) => {
                            return ChartUtils.formatNumber(value);
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels, // Usar el parámetro labels_array aquí
                datasets: datasets
            },
            options: options
        });

        canvas.chart = chart;
        return chart;
    },

    /**
     * Crea o actualiza un gráfico de líneas.
     * @param {string} canvasId ID del elemento canvas.
     * @param {string} chartTitle Título del gráfico.
     * @param {object} axisLabels Etiquetas para los ejes (e.g., {x: 'X-axis Label', y: 'Y-axis Label'}).
     * @param {Array<object>} datasets Array de objetos de dataset de Chart.js.
     * @returns {Chart|null} Instancia del gráfico o null si falla.
     */
    createLineChart(canvasId, chartTitle, axisLabels, datasets) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return null;
        }

        if (canvas.chart) {
            canvas.chart.destroy();
        }

        datasets.forEach((dataset, index) => {
            dataset.borderColor = dataset.borderColor || this.chartColors[index % this.chartColors.length];
            dataset.fill = dataset.fill !== undefined ? dataset.fill : false; // Default fill to false for line charts
            dataset.tension = dataset.tension || 0.1; // Slight curve
        });

        const options = {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: !!chartTitle, text: chartTitle },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label || ''}: ${this.formatNumber(context.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: !!(axisLabels && axisLabels.x),
                        text: (axisLabels && axisLabels.x) || ''
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: !!(axisLabels && axisLabels.y),
                        text: (axisLabels && axisLabels.y) || ''
                    },
                    ticks: { callback: (value) => ChartUtils.formatNumber(value) }
                }
            }
        };

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                 labels: datasets.length > 0 && datasets[0].labels ? datasets[0].labels : (datasets.labels || []),
                 datasets: datasets
            },
            options: options
        });

        canvas.chart = chart;
        return chart;
    },

    /**
     * Crea o actualiza un gráfico de pastel (pie) o dona (doughnut).
     * @param {string} canvasId ID del elemento canvas.
     * @param {string} chartTitle Título del gráfico.
     * @param {Array<string>} labels Etiquetas para cada segmento del pastel.
     * @param {object} seriesData Objeto de dataset de Chart.js para pie/doughnut.
     * @returns {Chart|null} Instancia del gráfico o null si falla.
     */
    createPieChart(canvasId, chartTitle, labels, seriesData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with ID '${canvasId}' not found.`);
            return null;
        }

        if (canvas.chart) {
            canvas.chart.destroy();
        }

        // Asignar colores si no están definidos en seriesData
        if (!seriesData.backgroundColor) {
            seriesData.backgroundColor = labels.map((_, index) => this.chartColors[index % this.chartColors.length]);
        }
        // Asegurar que borderColor también se genere si es necesario o se defina
        if (!seriesData.borderColor) {
           seriesData.borderColor = seriesData.backgroundColor.map(bgColor =>
             (typeof bgColor === 'string' && bgColor.startsWith('rgba')) ? bgColor.replace(/, ?0\.\d+\)$/, ', 1)') : '#fff'
           );
        }
        seriesData.borderWidth = seriesData.borderWidth || 1;


        const options = {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: !!chartTitle, text: chartTitle },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = this.formatNumber(context.raw);
                            const percentage = context.chart.data.datasets[0].data.length > 0 ?
                                (context.raw / context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0) * 100).toFixed(2) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        const chart = new Chart(canvas, {
            type: 'pie', // o 'doughnut'
            data: {
                labels: labels,
                datasets: [seriesData] // Pie/Doughnut charts typically have one dataset object
            },
            options: options
        });

        canvas.chart = chart;
        return chart;
    },
    
    /**
     * Fusiona recursivamente dos objetos
     * @param {Object} target Objeto destino
     * @param {Object} source Objeto fuente
     * @returns {Object} Objeto fusionado
     */
    mergeDeep(target, source) {
        const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
        
        if (!source) return target;
        
        let output = Object.assign({}, target);
        
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.mergeDeep(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    },
    
    /**
     * Genera una tabla resumen para el reporte
     * @param {Object} reportData Datos del reporte
     * @returns {string} HTML de la tabla
     */
    createSummaryTable(reportData) {
        // Ordenar entidades alfabéticamente por nombre para consistencia con el gráfico
        const sortedEntities = [...reportData.entities].sort((a, b) => a.name.localeCompare(b.name));

        const rows = sortedEntities.map(entity => {
            const formattedValue = this.formatNumber(entity.value);
            return `
                <tr>
                    <td>${entity.name}</td>
                    <td class="text-end">${formattedValue}</td>
                    <td class="text-end">${this.formatNumber(entity.count, 0)}</td>
                </tr>
            `;
        });
        
        // Calcular total general
        const totalValue = sortedEntities.reduce((sum, entity) => sum + entity.value, 0); // Suma sobre las entidades (ordenadas o no, el total es el mismo)
        const totalCount = sortedEntities.reduce((sum, entity) => sum + entity.count, 0);
        
        // Determinar el título de la primera columna
        const entityHeaderTitle = reportData.horizontalField ? reportData.horizontalField : 'Entidad';
        
        // Obtener el nombre personalizado para "Registro"
        const config = StorageService.getConfig();
        const recordName = config.recordName || 'Registro';
        
        return `
            <table class="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>${entityHeaderTitle}</th>
                        <th class="text-end">${reportData.aggregation === 'sum' ? 'Total' : 'Promedio'}</th>
                        <th class="text-end">${recordName}s</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.join('')}
                </tbody>
                <tfoot>
                    <tr class="table-primary">
                        <th>TOTAL</th>
                        <th class="text-end">${this.formatNumber(totalValue)}</th>
                        <th class="text-end">${this.formatNumber(totalCount, 0)}</th>
                    </tr>
                </tfoot>
            </table>
        `;
    }
};