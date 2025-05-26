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
     * NUEVO: Asegura que un elemento existe, si no lo crea
     * @param {string} selector Selector CSS del elemento
     * @param {string} tagName Nombre del tag a crear si no existe
     * @param {Object} attributes Atributos para el nuevo elemento
     * @param {Element} parent Elemento padre donde crear el nuevo elemento
     * @returns {Element} El elemento encontrado o creado
     */
    ensureElement(selector, tagName = 'div', attributes = {}, parent = document.body) {
        let element = document.querySelector(selector);
        
        if (!element) {
            element = document.createElement(tagName);
            
            // Aplicar atributos
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            parent.appendChild(element);
        }
        
        return element;
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
    },

    /**
     * NUEVO: Verifica si un elemento está visible en el viewport
     * @param {Element} element Elemento a verificar
     * @returns {boolean} true si está visible
     */
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * NUEVO: Scroll suave a un elemento
     * @param {string|Element} target Selector CSS o elemento
     * @param {Object} options Opciones de scroll
     */
    scrollToElement(target, options = {}) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };

        element.scrollIntoView({ ...defaultOptions, ...options });
    }
};
