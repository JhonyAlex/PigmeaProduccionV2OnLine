/**
 * Punto de entrada para el módulo de reportes
 * Este archivo importa y configura todos los submódulos
 */

// Importamos el objeto ReportsView principal y todos los componentes
import { ReportsView } from './ReportsView.js';
import { setupCalendarFunctions } from './calendar.js';
import { setupFilterFunctions } from './filters.js';
import { setupPaginationFunctions } from './pagination.js';
import { setupRecordDisplayFunctions } from './recordDisplay.js';
import { setupRecordEditingFunctions } from './recordEditing.js';
import { setupReportGenerationFunctions } from './reportGeneration.js';
import { setupUtilFunctions } from './utils.js';

// Configurar todos los componentes y vincularlos al objeto ReportsView
function initializeReportsComponents() {
  setupCalendarFunctions(ReportsView);
  setupFilterFunctions(ReportsView);
  setupPaginationFunctions(ReportsView);
  setupRecordDisplayFunctions(ReportsView);
  setupRecordEditingFunctions(ReportsView);
  setupReportGenerationFunctions(ReportsView);
  setupUtilFunctions(ReportsView);
}

// Inicializar todos los componentes
initializeReportsComponents();

// Exportar el objeto ReportsView completamente configurado
export default ReportsView; 