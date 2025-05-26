/**
 * Router para manejar la navegación entre vistas
 */
const Router = {
    currentRoute: 'register',
    routes: {
        register: RegisterView,
        reports: ReportsView,
        admin: AdminView,
        kpis: KPIsView
    },

    /**
     * Inicializa el router
     */
    init() {
        try {
            // CORREGIDO: Usar ensureBasicStructure
            DOMUtils.ensureBasicStructure();
            
            this.setupNavigation();
            
            // Cargar ruta inicial desde hash o usar 'register' por defecto
            const initialRoute = window.location.hash.replace('#', '') || 'register';
            this.navigateTo(initialRoute);
        } catch (error) {
            console.error("Error al inicializar Router:", error);
        }
    },

    /**
     * Configura la navegación
     */
    setupNavigation() {
        // Event listener para links de navegación
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigateTo(route);
                
                // Actualizar hash de URL
                window.location.hash = route;
            });
        });

        // Listener para cambios en el hash de la URL
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.replace('#', '') || 'register';
            this.navigateTo(route);
        });
    },

    /**
     * Navega a una ruta específica
     * @param {string} route Nombre de la ruta
     */
    navigateTo(route) {
        // MEJORA: Evitar navegación si ya estamos en la ruta Y la vista está renderizada
        if (this.currentRoute === route) {
            const container = this.getActiveViewContainer();
            if (container && container.innerHTML.trim() !== '') {
                console.log(`Ya estamos en la ruta ${route} con vista renderizada, omitiendo navegación`);
                return;
            }
            // Si estamos en la misma ruta pero no está renderizada, continuar
        }

        if (!this.routes[route]) {
            console.error(`Ruta '${route}' no encontrada`);
            return;
        }

        // Limpiar vista anterior para evitar memory leaks
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

        // Usar timeout más corto para mejor UX
        setTimeout(() => {
            try {
                // Renderizar la vista
                if (typeof this.routes[route].render === 'function') {
                    this.routes[route].render();
                }

                // MEJORA: Usar timeout adicional para setupEventListeners e init
                setTimeout(() => {
                    // Configurar event listeners
                    if (typeof this.routes[route].setupEventListeners === 'function') {
                        this.routes[route].setupEventListeners();
                    }

                    // Inicializar la vista si tiene método init
                    if (typeof this.routes[route].init === 'function') {
                        this.routes[route].init();
                    }
                }, 10);
                
            } catch (error) {
                console.error(`Error al cargar la ruta ${route}:`, error);
                this.showErrorView(error);
            }
        }, 50);
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
     * Obtiene el contenedor activo para renderizar vistas
     * @returns {Element} Elemento contenedor
     */
    getActiveViewContainer() {
        return document.querySelector('.main-content') || document.querySelector('#main-content');
    }
};