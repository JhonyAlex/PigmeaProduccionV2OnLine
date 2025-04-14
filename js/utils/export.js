/**
 * Utilidades para importación y exportación de datos
 */
const ExportUtils = {
    /**
     * Exporta los datos de la aplicación a un archivo JSON
     */
    exportToFile() {
        const data = StorageService.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
        a.download = `Datos para Web Actualizados (${formattedDate}).json`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    },
    
    /**
     * Exporta los registros filtrados a un archivo CSV
     * @param {Array} records Registros a exportar
     */
    exportToCSV(records) {
        if (!records || records.length === 0) {
            UIUtils.showAlert('No hay registros para exportar', 'warning');
            return;
        }
        
        // Obtener las entidades y los campos para cada registro
        const entities = EntityModel.getAll();
        const allFields = FieldModel.getAll();
        
        // Crear un Set para almacenar todos los IDs de campos utilizados en los registros
        const allFieldIds = new Set();
        records.forEach(record => {
            Object.keys(record.data).forEach(fieldId => {
                allFieldIds.add(fieldId);
            });
        });
        
        // Convertir el Set a un array y filtrar para obtener solo los campos que existen
        const usedFields = Array.from(allFieldIds)
            .map(fieldId => FieldModel.getById(fieldId))
            .filter(field => field !== null);
        
        // Crear cabeceras: primero la entidad, luego fecha y hora, después todos los campos personalizados
        let headers = ['Entidad', 'Fecha_y_Hora'];
        usedFields.forEach(field => {
            headers.push(field.name.replace(/,/g, ' ')); // Evitar comas en los nombres de campo
        });
        
        // Crear filas de datos
        const rows = [];
        records.forEach(record => {
            const entity = entities.find(e => e.id === record.entityId) || { name: 'Desconocido' };
            
            // Crear una fila con la entidad y la fecha
            const row = [
                entity.name.replace(/,/g, ' '),
                new Date(record.timestamp).toLocaleString()
            ];
            
            // Añadir valores para cada campo (o vacío si no existe)
            usedFields.forEach(field => {
                const value = record.data[field.id] !== undefined ? record.data[field.id] : '';
                row.push(String(value).replace(/,/g, ' ')); // Convertir a string y reemplazar comas
            });
            
            rows.push(row);
        });
        
        // Combinar cabeceras y filas
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Crear blob y descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `registros_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    },
    
    /**
     * Importa datos desde un archivo JSON seleccionado
     * @param {File} file Archivo a importar
     * @returns {Promise} Promesa con el resultado de la operación
     */
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = e.target.result;
                    
                    // Intentar importar los datos
                    StorageService.importData(jsonData).then(success => {
                        if (success) {
                            resolve('Datos importados correctamente');
                        } else {
                            reject('Error al importar los datos');
                        }
                    });
                } catch (error) {
                    reject(`Error al leer el archivo: ${error.message}`);
                }
            };
            
            reader.onerror = (e) => {
                reject('Error al leer el archivo');
            };
            
            reader.readAsText(file);
        });
    }
};