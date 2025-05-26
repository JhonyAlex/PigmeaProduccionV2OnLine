/**
 * Utilidades para manipulación del DOM
 */
const DOMUtils = {
    /**
     * Asegura que existe la estructura básica de contenedores necesaria
     */
    ensureBasicStructure() {
        // MEJORA: Verificación más eficiente y menos verbosa
        let mainContent = document.getElementById('main-content');
        
        if (!mainContent) {
            console.log('Creando contenedor principal...');
            mainContent = document.createElement('div');
            mainContent.id = 'main-content';
            mainContent.className = 'container-fluid mt-4';
            document.body.appendChild(mainContent);
        }

        // MEJORA: Solo crear si realmente no existe
        let viewContainer = mainContent.querySelector('.main-content');
        if (!viewContainer) {
            console.log('Creando contenedor de contenido principal...');
            viewContainer = document.createElement('div');
            viewContainer.className = 'main-content';
            mainContent.appendChild(viewContainer);
        }

        return {
            mainContent,
            viewContainer
        };
    },

    /**
     * NUEVO: Limpia event listeners duplicados de un elemento
     * @param {Element} element Elemento a limpiar
     */
    cleanupEventListeners(element) {
        if (!element) return;
        
        // Clonar el elemento para remover todos los listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        
        return newElement;
    },

    /**
     * NUEVO: Debounce para optimizar llamadas frecuentes
     * @param {Function} func Función a ejecutar
     * @param {number} wait Tiempo de espera en ms
     * @returns {Function} Función con debounce aplicado
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
