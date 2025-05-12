const ReportsChart = {
    currentChart: null,
    
    renderChart(reportsView, fieldId) {
        try {
            const chartContainer = document.getElementById('chart-container');
            if (!chartContainer) return;
            
            // Clear previous chart if exists
            if (this.currentChart) {
                this.currentChart.destroy();
                this.currentChart = null;
            }
            
            if (!fieldId || reportsView.searchedRecords.length === 0) {
                chartContainer.innerHTML = '<div class="alert alert-info">Seleccione un campo para generar un gráfico</div>';
                return;
            }
            
            const field = FieldModel.getById(fieldId);
            if (!field) {
                chartContainer.innerHTML = '<div class="alert alert-warning">Campo no encontrado</div>';
                return;
            }
            
            const horizontalAxisField = FieldModel.getAll().find(f => f.isHorizontalAxis);
            
            // Prepare canvas
            chartContainer.innerHTML = '<canvas id="reports-chart"></canvas>';
            const ctx = document.getElementById('reports-chart').getContext('2d');
            
            // Process data
            const records = [...reportsView.searchedRecords];
            
            // Sort by date
            records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Group by date (or by horizontal axis field if specified)
            const groupedData = this.groupDataForChart(records, fieldId, horizontalAxisField?.id);
            
            // Create chart
            this.currentChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: groupedData.labels,
                    datasets: [{
                        label: field.name,
                        data: groupedData.values,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: field.name
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: horizontalAxisField ? horizontalAxisField.name : 'Fecha'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${field.name}: ${context.parsed.y}`;
                                }
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error("Error al renderizar gráfico:", error);
            const chartContainer = document.getElementById('chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="alert alert-danger">Error al generar el gráfico</div>';
            }
        }
    },
    
    groupDataForChart(records, fieldId, horizontalAxisId) {
        const result = {
            labels: [],
            values: []
        };
        
        // If we have a horizontal axis field defined, use it
        if (horizontalAxisId) {
            const uniqueValues = new Set();
            records.forEach(record => {
                const value = record.data[horizontalAxisId];
                if (value !== undefined && value !== null) {
                    uniqueValues.add(value);
                }
            });
            
            // Sort values if they're numeric
            const sortedValues = [...uniqueValues].sort((a, b) => {
                if (!isNaN(Number(a)) && !isNaN(Number(b))) {
                    return Number(a) - Number(b);
                }
                return String(a).localeCompare(String(b));
            });
            
            // For each unique value, calculate average of the field
            sortedValues.forEach(value => {
                const matchingRecords = records.filter(r => r.data[horizontalAxisId] === value);
                const fieldValues = matchingRecords
                    .map(r => Number(r.data[fieldId]))
                    .filter(v => !isNaN(v));
                
                if (fieldValues.length > 0) {
                    const average = fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length;
                    result.labels.push(value);
                    result.values.push(average.toFixed(2));
                }
            });
            
            return result;
        }
        
        // Default: group by date
        const dateGroups = {};
        
        records.forEach(record => {
            const date = new Date(record.timestamp).toISOString().split('T')[0];
            const value = Number(record.data[fieldId]);
            
            if (!isNaN(value)) {
                if (!dateGroups[date]) {
                    dateGroups[date] = {
                        sum: value,
                        count: 1
                    };
                } else {
                    dateGroups[date].sum += value;
                    dateGroups[date].count++;
                }
            }
        });
        
        // Sort dates
        const sortedDates = Object.keys(dateGroups).sort();
        
        result.labels = sortedDates;
        result.values = sortedDates.map(date => {
            const avg = dateGroups[date].sum / dateGroups[date].count;
            return avg.toFixed(2);
        });
        
        return result;
    }
};

window.ReportsChart = ReportsChart;
