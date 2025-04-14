/**
 * Punto de entrada principal de la aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Sincronizando datos...</p>
    `;
    document.body.appendChild(loadingIndicator);

    // Inicializar almacenamiento
    StorageService.initializeStorage()
        .then(() => {
            // Aplicar configuración personalizada
            const config = StorageService.getConfig();

            // Actualizar navbar-brand
            if (config.navbarTitle) {
                document.querySelector('.navbar-brand').textContent = config.navbarTitle;
            }

            // Actualizar referencias a "Entidad" en la página inicial
            if (config.entityName) {
                updateGlobalEntityReferences(config.entityName);
            }

            // Inicializar enrutador
            Router.init();

            // Configurar exportación de datos
            document.getElementById('export-data-btn').addEventListener('click', () => {
                ExportUtils.exportToFile();
            });

            // Configurar importación de datos
            document.getElementById('import-btn').addEventListener('click', () => {
                document.getElementById('import-file').click();
            });

            document.getElementById('import-file').addEventListener('change', (e) => {
                if (e.target.files.length === 0) return;

                const file = e.target.files[0];

                // Confirmar importación
                const confirmModal = UIUtils.initModal('confirmModal');
                const confirmMessage = document.getElementById('confirm-message');
                const confirmActionBtn = document.getElementById('confirmActionBtn');

                confirmMessage.textContent = `¿Está seguro de importar los datos desde "${file.name}"? Esta acción sobrescribirá todos los datos existentes.`;

                // Eliminar listeners anteriores
                const newConfirmBtn = confirmActionBtn.cloneNode(true);
                confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);

                // Agregar nuevo listener
                newConfirmBtn.addEventListener('click', () => {
                    ExportUtils.importFromFile(file)
                        .then(message => {
                            bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
                            UIUtils.showAlert('Datos importados correctamente. La página se recargará.', 'success');

                            // Recargar la página después de 2 segundos
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        })
                        .catch(error => {
                            bootstrap.Modal.getInstance(document.getElementById('confirmModal')).hide();
                            UIUtils.showAlert(`Error al importar datos: ${error}`, 'danger');
                        });
                });

                confirmModal.show();
            });
            
            // Configurar actualización en tiempo real de la UI
            document.addEventListener('firebase-data-changed', (event) => {
                // Solo recargaremos si estamos en una vista que necesita actualizarse
                // y si el cambio no fue originado por este cliente
                const currentRoute = Router.currentRoute;
                if (currentRoute && Router.routes[currentRoute] && 
                    typeof Router.routes[currentRoute].update === 'function') {
                    Router.routes[currentRoute].update();
                }
            });

            // Quitar indicador de carga
            document.body.removeChild(loadingIndicator);
        })
        .catch(error => {
            console.error("Error al inicializar la aplicación:", error);
            UIUtils.showAlert('Error al cargar datos: ' + error.message, 'danger');
            // Quitar indicador de carga
            document.body.removeChild(loadingIndicator);
        });
});

/**
 * Actualiza referencias globales a "Entidad" con el nombre personalizado
 * @param {string} entityName Nombre personalizado para "Entidad"
 */
function updateGlobalEntityReferences(entityName) {
    // Actualizar elementos con la clase 'entity-name-ref'
    document.querySelectorAll('.entity-name-ref').forEach(el => {
        el.textContent = entityName;
    });
    
    // También actualizar en el objeto RegisterView
    if (window.RegisterView) {
        RegisterView.entityName = entityName;
    }
}