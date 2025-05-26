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
     * MEJORA: Formatea números con caché para mejor rendimiento
     * @param {number} number Número a formatear
     * @param {number} decimals Cantidad de decimales (default: 2)
     * @returns {string} Número formateado
     */
    formatNumber(number, decimals = 2) {
        // MEJORA: Cache para evitar recálculos en números repetidos
        const cacheKey = `${number}_${decimals}`;
        if (this._formatCache && this._formatCache[cacheKey]) {
            return this._formatCache[cacheKey];
        }
        
        // Inicializar cache si no existe
        if (!this._formatCache) {
            this._formatCache = {};
        }
        
        // MEJORA: Validación de entrada
        if (typeof number !== 'number' || isNaN(number)) {
            return '0,00';
        }
        
        // MEJORA: Usar Intl.NumberFormat para mejor soporte internacional
        let result;
        try {
            // Intentar usar formateo nativo del navegador
            const formatter = new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            
            result = formatter.format(number);
            
            // Ajustar el formato para cumplir con los requisitos específicos
            if (number >= 1000000) {
                // Para millones: usar apóstrofe
                result = result.replace(/(\d{1,3})\.(\d{3})\.(\d{3})/, "$1'$2.$3");
            }
        } catch (e) {
            // Fallback al método original si Intl no está disponible
            result = this._formatNumberFallback(number, decimals);
        }
        
        // Guardar en cache (limitamos el cache a 100 entradas para evitar memory leaks)
        if (Object.keys(this._formatCache).length < 100) {
            this._formatCache[cacheKey] = result;
        }
        
        return result;
    },
    
    /**
     * NUEVO: Método fallback para formateo de números
     * @param {number} number Número a formatear
     * @param {number} decimals Cantidad de decimales
     * @returns {string} Número formateado
     */
    _formatNumberFallback(number, decimals) {
        // Método original como fallback
        let numStr = number.toFixed(decimals);
        const [integerStr, decimalStr] = numStr.split('.');
        
        if (integerStr.length <= 3) {
            return `${integerStr},${decimalStr || '00'}`;
        }
        
        let result = '';
        const len = integerStr.length;
        
        for (let i = len - 1; i >= 0; i--) {
            result = integerStr[i] + result;
            const posFromRight = len - 1 - i;
            
            if (i > 0 && (posFromRight + 1) % 3 === 0) {
                if (posFromRight === 5) {
                    result = "'" + result;
                } else {
                    result = "." + result;
                }
            }
        }
        
        return `${result},${decimalStr || '00'}`;
    },
    
    /**
     * Crea o actualiza un gráfico de barras
     * @param {string} canvasId ID del elemento canvas
     * @param {Object} reportData Datos del reporte
     * @param {Object} customConfig Configuración personalizada (opcional)
     * @returns {Chart} Instancia del gráfico
     */
    createBarChart(canvasId, reportData, customConfig = null) {
        const canvas = document.getElementById(canvasId);
        
        // Destruir gráfico anterior si existe
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        // Preparar datos del gráfico
        const labels = reportData.entities.map(entity => entity.name);
        const values = reportData.entities.map(entity => entity.value);
        
        // Título según el tipo de agregación y campos (si no hay configuración personalizada)
        const horizontalFieldName = reportData.horizontalField ? reportData.horizontalField : 'Entidad';
        const title = reportData.aggregation === 'sum' 
            ? `Suma total de ${reportData.field} por ${horizontalFieldName}`
            : `Promedio de ${reportData.field} por ${horizontalFieldName}`;
        
        // Verificar si se proporciona configuración personalizada
        let type = 'bar';
        let options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = this.formatNumber(context.raw);
                            return `${context.dataset.label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            return this.formatNumber(value);
                        }
                    }
                }
            }
        };
        
        // Si hay configuración personalizada, combinarla con la configuración por defecto
        if (customConfig) {
            // Usar el tipo personalizado si está definido
            if (customConfig.type) {
                type = customConfig.type;
            }
            
            // Fusionar opciones personalizadas con las predeterminadas
            if (customConfig.options) {
                options = this.mergeDeep(options, customConfig.options);
            }
        }
        
        // Crear el gráfico
        const chart = new Chart(canvas, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: reportData.field,
                    data: values,
                    backgroundColor: this.chartColors.slice(0, labels.length),
                    borderColor: this.chartColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: options
        });
        
        // Guardar referencia al gráfico en el canvas
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
     * MEJORA: Crear tabla resumen optimizada
     * @param {Object} reportData Datos del reporte
     * @returns {string} HTML de la tabla
     */
    createSummaryTable(reportData) {
        // MEJORA: Cache para configuración
        const config = StorageService.getConfig();
        const recordName = config.recordName || 'Registro';
        const entityHeaderTitle = reportData.horizontalField || config.entityName || 'Entidad';
        
        // MEJORA: Pre-calcular totales una sola vez
        const totals = reportData.entities.reduce((acc, entity) => {
            acc.value += entity.value;
            acc.count += entity.count;
            return acc;
        }, { value: 0, count: 0 });
        
        // MEJORA: Usar template literals más eficientes
        const rows = reportData.entities.map(entity => `
            <tr>
                <td>${entity.name}</td>
                <td class="text-end">${this.formatNumber(entity.value)}</td>
                <td class="text-end">${this.formatNumber(entity.count, 0)}</td>
            </tr>
        `).join('');
        
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
                    ${rows}
                </tbody>
                <tfoot>
                    <tr class="table-primary">
                        <th>TOTAL</th>
                        <th class="text-end">${this.formatNumber(totals.value)}</th>
                        <th class="text-end">${this.formatNumber(totals.count, 0)}</th>
                    </tr>
                </tfoot>
            </table>
        `;
    }
};