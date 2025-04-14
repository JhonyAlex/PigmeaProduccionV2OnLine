/**
 * Utilidades para operaciones con el DOM
 */
const DOMUtils = {
    /**
     * Verifica y establece la estructura básica de DOM requerida por la aplicación
     * @returns {Object} Referencias a los elementos principales del DOM
     */
    ensureBasicStructure() {
        // Verificar si existe el contenedor principal
        let container = document.querySelector('.container');
        if (!container) {
            console.warn("Creando contenedor principal...");
            container = document.createElement('div');
            container.className = 'container mt-4';
            document.body.appendChild(container);
        }
        
        // Verificar si existe el contenedor de contenido
        let mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            console.warn("Creando contenedor de contenido principal...");
            mainContent = document.createElement('div');
            mainContent.className = 'main-content mt-3';
            container.appendChild(mainContent);
        }
        
        return {
            container,
            mainContent
        };
    },
    
    /**
     * Inserta un mensaje de alerta en el DOM
     * @param {string} message Mensaje a mostrar
     * @param {string} type Tipo de alerta (success, danger, warning, info)
     * @param {HTMLElement} container Contenedor donde insertar la alerta (opcional)
     */
    showAlert(message, type, container = null) {
        const alertBox = document.createElement('div');
        alertBox.className = `alert alert-${type} alert-dismissible fade show`;
        alertBox.role = 'alert';
        alertBox.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        if (!container) {
            container = document.querySelector('.main-content') || document.querySelector('.container') || document.body;
        }
        
        container.prepend(alertBox);
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            alertBox.classList.remove('show');
            setTimeout(() => alertBox.remove(), 300);
        }, 5000);
    }
};
