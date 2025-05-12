/**
 * Enrutador simple para navegación entre vistas
 */
const Router = {
    // Ruta actual
    currentRoute: null,
    
    // Rutas disponibles
    routes: {
        'register': RegisterView,
        'reports': ReportsView,
        'kpis': KPIsView,
        'admin': AdminView
    },
    
    /**
     * Inicializa el enrutador
     */
    init() {
        try {
            // Asegurarse de que el contenedor principal existe
            const mainContent = DOMUtils.ensureElement('.main-content', 'div', 'main-content mt-4', document.querySelector('.container') || document.body);
            
            // Configurar listener para los links de navegación
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const route = e.target.getAttribute('data-route');
                    this.navigateTo(route);
                });
            });
            
            // Determinar la ruta inicial
            const initialRoute = window.location.hash.substring(1) || 'register';
            
            // Pequeño retraso para asegurar que el DOM esté listo
            setTimeout(() => {
                this.navigateTo(initialRoute);
            }, 100);
        } catch (error) {
            console.error("Error al inicializar Router:", error);
            UIUtils.showAlert('Error al inicializar la navegación. Por favor recarga la página.', 'danger');
        }
    },

    /**
     * Navega a la ruta especificada
     * @param {string} route Nombre de la ruta
     */
    navigateTo(route) {
        try {
            if (!this.routes[route]) {
                console.error(`Ruta no encontrada: ${route}`);
                route = 'register'; // Ruta por defecto
            }
            
            // Verificar que el contenedor principal existe
            let mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.warn("Elemento .main-content no encontrado en navigateTo, creándolo...");
                const container = document.querySelector('.container') || document.body;
                mainContent = document.createElement('div');
                mainContent.className = 'main-content mt-4';
                container.appendChild(mainContent);
            }

            // IMPORTANTE: Limpiar completamente el contenedor principal antes de cargar la nueva vista
            mainContent.innerHTML = '';
            
            // Eliminar cualquier posible vista residual que pueda estar fuera del contenedor principal
            document.querySelectorAll('.view-container').forEach(el => {
                el.remove();
            });

            // Actualizar estado de la aplicación
            this.currentRoute = route;
            window.location.hash = route;
            
            // Actualizar estado de navegación
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`.nav-link[data-route="${route}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            
            // Crear un nuevo contenedor específico para esta vista
            const viewContainer = document.createElement('div');
            viewContainer.className = 'view-container';
            viewContainer.id = `${route}-view`;
            mainContent.appendChild(viewContainer);
            
            // Establecer este contenedor como el contenedor activo
            this.activeViewContainer = viewContainer;
            
            // Cargar scripts específicos si estamos navegando a la vista de reportes
            if (route === 'reports') {
                mainContent.innerHTML = '<div class="alert alert-info">Cargando módulos de reportes...</div>';
                
                if (typeof ScriptLoader !== 'undefined') {
                    ScriptLoader.loadReportsScripts((error) => {
                        if (error) {
                            console.error("Error loading report scripts:", error);
                            mainContent.innerHTML = `
                                <div class="alert alert-danger">
                                    Error al cargar los módulos de reportes: ${error.message}
                                </div>
                            `;
                            return;
                        }
                        
                        // Check dependencies again after scripts are loaded
                        const dependencies = [
                            { name: 'ReportsTable', obj: window.ReportsTable },
                            { name: 'ReportsChart', obj: window.ReportsChart },
                            { name: 'ReportsEvents', obj: window.ReportsEvents }
                        ];
                        
                        const missing = dependencies.filter(d => !d.obj);
                        if (missing.length > 0) {
                            const missingNames = missing.map(m => m.name).join(', ');
                            console.error(`Missing dependencies for reports view: ${missingNames}`);
                            mainContent.innerHTML = `
                                <div class="alert alert-danger">
                                    Error al cargar la vista de reportes: Módulos faltantes (${missingNames}).
                                    <br>Verifique que todos los scripts necesarios están incluidos en el HTML.
                                </div>
                            `;
                            return;
                        }
                        
                        // Initialize view after scripts are loaded
                        try {
                            this.routes[route].init();
                        } catch (error) {
                            console.error(`Error initializing ${route} view:`, error);
                            mainContent.innerHTML = `
                                <div class="alert alert-danger">
                                    Error al inicializar la vista ${route}: ${error.message}
                                </div>
                            `;
                        }
                    });
                } else {
                    console.error("ScriptLoader is not defined");
                    mainContent.innerHTML = `
                        <div class="alert alert-danger">
                            Error al cargar la vista de reportes: ScriptLoader no está disponible.
                        </div>
                    `;
                }
            } else {
                // Inicializar vista normal (no es reports)
                setTimeout(() => {
                    try {
                        this.routes[route].init();
                    } catch (error) {
                        console.error(`Error initializing ${route} view:`, error);
                        mainContent.innerHTML = `
                            <div class="alert alert-danger">
                                Error al inicializar la vista ${route}: ${error.message}
                            </div>
                        `;
                    }
                }, 10);
            }
        } catch (error) {
            console.error(`Error al navegar a ${route}:`, error);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        Error al cargar la vista ${route}: ${error.message}
                    </div>
                `;
            }
        }
    },
    
    /**
     * Obtiene el contenedor de la vista activa
     * @returns {HTMLElement} Contenedor de la vista activa
     */
    getActiveViewContainer() {
        if (this.activeViewContainer && document.body.contains(this.activeViewContainer)) {
            return this.activeViewContainer;
        }
        
        return document.querySelector('.main-content');
    }
};

/**
 * Maneja el cambio de ruta
 * This function seems redundant as routing is already handled by the navigateTo method.
 */
function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        Router.navigateTo(hash);
    }
}