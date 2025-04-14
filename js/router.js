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
                // Crear el elemento si no existe
                const container = document.querySelector('.container') || document.body;
                const newMainContent = document.createElement('div');
                newMainContent.className = 'main-content mt-4';
                container.appendChild(newMainContent);
                console.log("Elemento .main-content creado dinámicamente");
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
            let mainContent = DOMUtils.ensureElement('.main-content', 'div', 'main-content mt-4', document.querySelector('.container') || document.body);
            
            // Limpia el contenido actual antes de cargar la nueva vista
            mainContent.innerHTML = '';
            
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
            
            // Inicializar la vista después de un pequeño retraso
            // para asegurar que el DOM está actualizado
            setTimeout(() => {
                this.routes[route].init();
            }, 10);
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