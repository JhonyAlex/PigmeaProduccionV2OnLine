/**
 * Módulo para la funcionalidad de generación de reportes en la vista de reportes
 */

/**
 * Configura las funciones de generación de reportes en el objeto ReportsView
 * @param {Object} ReportsView - El objeto principal de la vista de reportes
 */
export function setupReportGenerationFunctions(ReportsView) {
    // Añadir funcionalidades relacionadas con generación de reportes al objeto ReportsView

    /**
     * Genera reportes comparativos basados en los filtros seleccionados
     */
    ReportsView.generateReport = function() {
        try {
            // Obtener los campos seleccionados (ahora puede ser múltiple)
            const reportFieldSelect = document.getElementById('report-field');
            const selectedFields = reportFieldSelect ? Array.from(reportFieldSelect.selectedOptions).map(option => option.value) : [];
            const horizontalFieldId = document.getElementById('report-horizontal-field')?.value;
            const aggregation = document.getElementById('report-aggregation')?.value;
            const reportForm = document.getElementById('report-form'); // Para mostrar alertas cerca
    
            if (selectedFields.length === 0) {
                // Verificar que reportForm existe antes de mostrar la alerta
                if (reportForm) {
                    UIUtils.showAlert('Seleccione al menos un campo para generar el reporte', 'warning', reportForm);
                } else {
                    console.warn('No se pudo mostrar alerta: El formulario de reporte no existe');
                }
                return;
            }
    
            // Obtener filtros actuales
            const entityFilterSelect = document.getElementById('filter-entity');
            
            // Verificar si el selector de entidad existe antes de acceder a sus propiedades
            let entityFilter = [];
            if (entityFilterSelect) {
                const selectedEntities = Array.from(entityFilterSelect.selectedOptions || [])
                    .map(option => option.value);
    
                // Si se selecciona "Todas las entidades" o no se selecciona ninguna, no aplicamos filtro de entidad
                entityFilter = selectedEntities.includes('') || selectedEntities.length === 0
                    ? []
                    : selectedEntities;
            }
    
            const fromDateFilter = document.getElementById('filter-from-date')?.value;
            const toDateFilter = document.getElementById('filter-to-date')?.value;
    
            const filters = {
                entityIds: entityFilter.length > 0 ? entityFilter : undefined,
                fromDate: fromDateFilter || undefined,
                toDate: toDateFilter || undefined
            };
    
            // Mostrar contenedor del reporte
            const reportContainer = document.getElementById('report-container');
            if (!reportContainer) {
                console.error("No se encontró el contenedor del reporte (#report-container)");
                return; // Salir si no existe el contenedor
            }
            
            // Limpiar el contenedor de reportes para los nuevos gráficos
            reportContainer.innerHTML = '';
            
            // Variable para almacenar todos los datos de los reportes
            const allReportsData = [];
            
            // Generar un reporte para cada campo seleccionado
            for (const fieldId of selectedFields) {
                // Generar datos del reporte para este campo
                const reportData = RecordModel.generateReportMultiple(fieldId, aggregation, filters, horizontalFieldId);
                
                if (reportData.error) {
                    console.error(`Error al generar reporte para campo ${fieldId}:`, reportData.error);
                    continue; // Continuar con el siguiente campo
                }
                
                // Guardar los datos para el resumen final
                allReportsData.push(reportData);
                
                // Crear un div para este reporte específico
                const reportDiv = document.createElement('div');
                reportDiv.className = 'report-item mb-4';
                reportDiv.innerHTML = `
                    <h5 class="mb-3">${reportData.field || 'Reporte'}</h5>
                    <div class="row">
                        <div class="col-md-8">
                            <div class="chart-container">
                                <canvas id="report-chart-${fieldId}"></canvas>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div id="report-summary-${fieldId}"></div>
                        </div>
                    </div>
                `;
                
                // Añadir al contenedor principal
                reportContainer.appendChild(reportDiv);
                
                // Crear gráfico para este campo
                if (ChartUtils) {
                    ChartUtils.createBarChart(`report-chart-${fieldId}`, reportData);
                    
                    // Crear tabla resumen para este campo
                    const summaryDiv = document.getElementById(`report-summary-${fieldId}`);
                    if (summaryDiv) {
                        summaryDiv.innerHTML = `
                            <h6 class="mb-2">Resumen</h6>
                            ${ChartUtils.createSummaryTable(reportData)}
                        `;
                        
                        // Si es un campo de tipo select, añadir el desglose por opciones
                        if (reportData.fieldType === 'select') {
                            const field = FieldModel.getById(fieldId);
                            
                            // Crear un objeto para almacenar el total de cada opción
                            const optionTotals = {};
                            
                            // Recorrer todas las entidades para sumar los conteos por opción
                            reportData.entities.forEach(entity => {
                                if (entity.optionCounts) {
                                    Object.entries(entity.optionCounts).forEach(([option, count]) => {
                                        optionTotals[option] = (optionTotals[option] || 0) + count;
                                    });
                                }
                            });
                            
                            // Crear tabla HTML con el desglose por opciones
                            let optionsTableHTML = `
                                <h6 class="mt-4 mb-2">Desglose por opciones</h6>
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Opción</th>
                                            <th>Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                            `;
                            
                            // Ordenar opciones por cantidad descendente
                            const sortedOptions = Object.entries(optionTotals)
                                .sort(([, countA], [, countB]) => countB - countA);
                                
                            // Añadir filas para cada opción
                            sortedOptions.forEach(([option, count]) => {
                                optionsTableHTML += `
                                    <tr>
                                        <td>${option}</td>
                                        <td>${count}</td>
                                    </tr>
                                `;
                            });
                            
                            optionsTableHTML += `
                                    </tbody>
                                </table>
                            `;
                            
                            // Añadir la tabla al resumen
                            summaryDiv.innerHTML += optionsTableHTML;
                        }
                    }
                }
            }
            
            // Mostrar el contenedor principal si hay al menos un reporte generado
            if (allReportsData.length > 0) {
                reportContainer.style.display = 'block';
            } else {
                reportContainer.style.display = 'none';
                if (reportForm) {
                    UIUtils.showAlert('No se pudo generar ningún reporte con los campos seleccionados', 'warning', reportForm);
                }
            }
        } catch (error) {
            console.error("Error al generar el reporte:", error);
            // Intentar mostrar un mensaje de error en un contenedor que debe existir
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = 'Error al generar el reporte. Por favor, intente de nuevo.';
                
                // Buscar un lugar adecuado para mostrar el error
                const targetContainer = mainContent.querySelector('#report-form') || mainContent;
                targetContainer.prepend(errorDiv);
                
                // Eliminar después de unos segundos
                setTimeout(() => errorDiv.remove(), 5000);
            }
        }
    };
} 