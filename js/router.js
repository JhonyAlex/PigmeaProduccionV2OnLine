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
     * Navega a una ruta específica
     * @param {string} route Nombre de la ruta
     */
    navigateTo(route) {
        // MEJORA: Evitar navegación si ya estamos en la ruta
        if (this.currentRoute === route) {
            console.log(`Ya estamos en la ruta ${route}, omitiendo navegación`);
            return;
        }

        if (!this.routes[route]) {
            console.error(`Ruta '${route}' no encontrada`);
            return;
        }

        // MEJORA: Limpiar vista anterior para evitar memory leaks
        if (this.currentRoute && this.routes[this.currentRoute] && 
            typeof this.routes[this.currentRoute].cleanup === 'function') {
            this.routes[this.currentRoute].cleanup();
        }

        this.currentRoute = route;

        // Actualizar clases activas en navbar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            }
        });

        // MEJORA: Usar timeout más corto para mejor UX
        setTimeout(() => {
            try {
                // Renderizar la vista
                if (typeof this.routes[route].render === 'function') {
                    this.routes[route].render();
                }

                // Configurar event listeners
                if (typeof this.routes[route].setupEventListeners === 'function') {
                    this.routes[route].setupEventListeners();
                }

                // Inicializar la vista si tiene método init
                if (typeof this.routes[route].init === 'function') {
                    this.routes[route].init();
                }
            } catch (error) {
                console.error(`Error al cargar la ruta ${route}:`, error);
                this.showErrorView(error);
            }
        }, 50); // Reducido de 100ms a 50ms
    },

    /**
     * NUEVO: Mostrar vista de error
     * @param {Error} error Error ocurrido
     */
    showErrorView(error) {
        const container = this.getActiveViewContainer();
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error al cargar la vista</h4>
                    <p>Ha ocurrido un error inesperado: ${error.message}</p>
                    <button class="btn btn-outline-danger" onclick="location.reload()">
                        Recargar página
                    </button>
                </div>
            `;
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