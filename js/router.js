/**
 * Enrutador para la aplicación SPA
 */
const Router = {
    /**
     * Ruta actual
     */
    currentRoute: 'register',
    
    /**
     * Rutas disponibles y sus controladores
     */
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
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                console.error("Elemento .main-content no encontrado");
                UIUtils.showAlert('Error: No se encontró el contenedor principal.', 'danger');
                return;
            }

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
            this.navigateTo(initialRoute);
        } catch (error) {
            console.error("Error al inicializar Router:", error);
            UIUtils.showAlert('Error al inicializar la navegación. Por favor recarga la página.', 'danger');
        }
    },
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Listener para clicks en navegación
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                this.navigateTo(route);
            });
        });
        
        // Listener para cambios en el hash de la URL
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.routes[hash]) {
                this.navigateTo(hash);
            }
        });
    },
    
    /**
     * Navega a una ruta específica
     * @param {string} route Nombre de la ruta
     */
    navigateTo(route) {
        try {
            if (!this.routes[route]) {
                console.error(`Ruta no encontrada: ${route}`);
                route = 'register'; // Ruta por defecto
            }
            
            // Verificar que el contenedor principal existe
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                throw new Error("Elemento .main-content no encontrado");
            }

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
            
            // Inicializar la vista
            this.routes[route].init();
        } catch (error) {
            console.error(`Error al navegar a ${route}:`, error);
            UIUtils.showAlert(`Error al cargar la vista ${route}. Por favor intenta nuevamente.`, 'danger');
        }
    },
    
    /**
     * Actualiza el estado visual de la navegación
     */
    updateNavState() {
        // Eliminar clase active de todos los enlaces
        document.querySelectorAll('[data-route]').forEach(link => {
            link.classList.remove('active');
        });
        
        // Agregar clase active al enlace actual
        const activeLink = document.querySelector(`[data-route="${this.currentRoute}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
};