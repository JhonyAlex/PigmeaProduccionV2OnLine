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

        // Use a short timeout to allow the browser to process DOM changes from render()
        // before calling setupEventListeners and init.
        setTimeout(() => {
            try {
                const view = this.routes[route];
                if (typeof view.render === 'function') {
                    view.render(); // This should populate .main-content
                }

                // Check if .main-content was populated by render()
                const mainContentCheck = this.getActiveViewContainer();
                if (!mainContentCheck || mainContentCheck.innerHTML.trim() === '') {
                    console.warn(`Router.navigateTo: .main-content is empty after ${route}.render() call. The view's render() method might not have populated the content correctly.`);
                    // Proceeding, but the view's init() should also be robust.
                }

                if (typeof view.setupEventListeners === 'function') {
                    view.setupEventListeners();
                }

                if (typeof view.init === 'function') {
                    view.init();
                }
                
            } catch (error) {
                console.error(`Error al cargar la ruta ${route}:`, error);
                this.showErrorView(error);
            }
        }, 50); // 50ms delay, consistent with original outer delay. Can be reduced to 0 or 10 if issues persist with other views.
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