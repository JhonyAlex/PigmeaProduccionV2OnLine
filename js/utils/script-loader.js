/**
 * Utilidad para cargar scripts de forma dinámica
 */
const ScriptLoader = {
    /**
     * Scripts cargados con éxito
     */
    loadedScripts: {},
    
    /**
     * Carga un script en la página
     * @param {string} url URL del script
     * @param {function} callback Función a ejecutar cuando el script esté cargado
     */
    loadScript(url, callback) {
        // Si ya está cargado, ejecuta callback inmediatamente
        if (this.loadedScripts[url]) {
            console.log(`Script ${url} already loaded`);
            if (callback) callback();
            return;
        }
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        
        // Cuando el script está cargado
        script.onload = () => {
            console.log(`Script ${url} loaded successfully`);
            this.loadedScripts[url] = true;
            if (callback) callback();
        };
        
        // Si hay error al cargar
        script.onerror = (error) => {
            console.error(`Error loading script ${url}:`, error);
            if (callback) callback(new Error(`Failed to load script: ${url}`));
        };
        
        document.head.appendChild(script);
    },
    
    /**
     * Carga múltiples scripts en secuencia
     * @param {Array<string>} urls Lista de URLs de scripts
     * @param {function} finalCallback Función a ejecutar cuando todos los scripts estén cargados
     */
    loadScripts(urls, finalCallback) {
        const loadNext = (index) => {
            if (index >= urls.length) {
                if (finalCallback) finalCallback();
                return;
            }
            
            this.loadScript(urls[index], (error) => {
                if (error) {
                    console.error(`Error in script loading sequence:`, error);
                    if (finalCallback) finalCallback(error);
                    return;
                }
                
                loadNext(index + 1);
            });
        };
        
        loadNext(0);
    },
    
    /**
     * Carga los scripts necesarios para la vista de reportes
     * @param {function} callback Función a ejecutar cuando todos los scripts estén cargados
     */
    loadReportsScripts(callback) {
        const scripts = [
            'js/utils/reports.table.js',
            'js/utils/reports.chart.js',
            'js/views/reports.events.js'
        ];
        
        // Verificar si Chart.js está cargado, si no, agregarlo a la lista
        if (typeof Chart === 'undefined') {
            scripts.unshift('https://cdn.jsdelivr.net/npm/chart.js');
        }
        
        this.loadScripts(scripts, callback);
    }
};

window.ScriptLoader = ScriptLoader;
