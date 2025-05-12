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
            
            // Inicializar la vista después de un pequeño retraso
            setTimeout(() => {
                this.routes[route].init();
            }, 10);
        } catch (error) {
            console.error(`Error al navegar a ${route}:`, error);
            UIUtils.showAlert(`Error al cargar la vista ${route}. Por favor intenta nuevamente.`, 'danger');
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
 */
function handleRouteChange() {
    const path = window.location.pathname;

    if (path === '/reports') {
        ReportsView.init();
    }
}