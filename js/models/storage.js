/**
 * Servicio de almacenamiento que gestiona todas las operaciones con Firebase
 */
const StorageService = {
    // Clave para la base de datos
    DB_PATH: 'pigmeaData',
    
    // Variables para manejar el estado de Firebase
    _cachedData: null,
    _initialized: false,
    _initPromise: null,
    _dataSubscribers: [],
    
    /**
     * Inicializa el almacenamiento con datos predeterminados si no existe
     */
    initializeStorage() {
        if (this._initPromise) {
            return this._initPromise;
        }
        
        console.log("Inicializando Firebase...");
        this._initPromise = new Promise((resolve, reject) => {
            try {
                // Obtener referencia a la base de datos
                this.dbRef = firebase.database().ref(this.DB_PATH);
                
                // Verificar si hay datos y crear datos iniciales si es necesario
                this.dbRef.once('value')
                    .then(snapshot => {
                        if (!snapshot.exists()) {
                            // No hay datos, inicializar con datos predeterminados
                            const initialData = {
                                config: {
                                    title: "Sistema de Registro de Datos",
                                    description: "Registre sus datos de manera flexible y personalizada",
                                    entityName: "Entidad",
                                    navbarTitle: "Sistema de Registro Flexible",
                                    kpiFields: []
                                },
                                entities: [],
                                fields: [],
                                records: []
                            };
                            return this.dbRef.set(initialData).then(() => initialData);
                        } else {
                            // Ya existen datos
                            return snapshot.val();
                        }
                    })
                    .then(data => {
                        this._cachedData = data;
                        
                        // Verificar y actualizar kpiFields si no existe
                        if (!data.config.kpiFields) {
                            data.config.kpiFields = [];
                            return this.saveData(data).then(() => data);
                        }
                        return data;
                    })
                    .then(data => {
                        // Configurar listener para cambios en tiempo real
                        this._setupRealtimeListener();
                        this._initialized = true;
                        console.log("Firebase inicializado correctamente");
                        resolve(data);
                    })
                    .catch(err => {
                        console.error("Error al inicializar Firebase:", err);
                        reject(err);
                    });
            } catch (err) {
                console.error("Error en la configuración de Firebase:", err);
                reject(err);
            }
        });
        
        return this._initPromise;
    },
    
    /**
     * Configura la escucha en tiempo real de cambios en Firebase
     */
    _setupRealtimeListener() {
        this.dbRef.on('value', snapshot => {
            const newData = snapshot.val();
            this._cachedData = newData;
            
            // Notificar a todos los suscriptores sobre el cambio
            this._notifyDataChange();
            
            // Disparar un evento global para que los componentes puedan reaccionar
            const event = new CustomEvent('firebase-data-changed', {
                detail: { data: newData }
            });
            document.dispatchEvent(event);
        });
    },
    
    /**
     * Suscribe un callback para recibir actualizaciones cuando cambian los datos
     * @param {Function} callback Función a llamar cuando cambian los datos
     * @returns {Function} Función para cancelar la suscripción
     */
    subscribeToDataChanges(callback) {
        this._dataSubscribers.push(callback);
        
        // Si ya tenemos datos, notificar inmediatamente
        if (this._cachedData) {
            callback(this._cachedData);
        }
        
        // Devolver función para cancelar la suscripción
        return () => {
            this._dataSubscribers = this._dataSubscribers.filter(cb => cb !== callback);
        };
    },
    
    /**
     * Notifica a todos los suscriptores sobre cambios en los datos
     */
    _notifyDataChange() {
        this._dataSubscribers.forEach(callback => {
            try {
                callback(this._cachedData);
            } catch (err) {
                console.error("Error en callback de suscripción:", err);
            }
        });
    },
    
    /**
     * Se asegura de que el servicio esté inicializado antes de realizar operaciones
     */
    _ensureInitialized() {
        if (this._initialized && this._cachedData) {
            return Promise.resolve();
        }
        return this.initializeStorage();
    },
    
    /**
     * Obtiene todos los datos del almacenamiento (compatible con código existente)
     * @returns {Object} Datos completos de la aplicación
     */
    getData() {
        // Si no estamos inicializados, devolvemos los datos en caché o un objeto vacío
        if (!this._initialized) {
            return this._cachedData || { 
                config: {
                    title: "Sistema de Registro de Datos",
                    description: "Registre sus datos de manera flexible y personalizada",
                    entityName: "Entidad",
                    navbarTitle: "Sistema de Registro Flexible",
                    kpiFields: []
                },
                entities: [],
                fields: [],
                records: []
            };
        }
        return this._cachedData;
    },
    
    /**
     * Guarda los datos en el almacenamiento
     * @param {Object} data Datos completos a guardar
     */
    saveData(data) {
        // Actualizar caché inmediatamente para operaciones rápidas
        this._cachedData = data;
        
        if (!this._initialized) {
            console.warn("Firebase aún no está inicializado. Los datos se guardarán cuando se complete la inicialización.");
            this._initPromise = this._initPromise.then(() => this.dbRef.set(data));
            return;
        }
        
        // Guardar en Firebase
        return this.dbRef.set(data);
    },
    
    /**
     * Actualiza la configuración general
     * @param {Object} config Objeto con la configuración
     */
    updateConfig(config) {
        const data = this.getData();
        data.config = { ...data.config, ...config };
        return this.saveData(data);
    },
    
    /**
     * Obtiene la configuración actual
     * @returns {Object} Configuración de la aplicación
     */
    getConfig() {
        return this.getData().config;
    },
    
    /**
     * Exporta todos los datos como cadena JSON
     * @returns {string} Datos en formato JSON
     */
    exportData() {
        return JSON.stringify(this.getData(), null, 2);
    },
    
    /**
     * Importa datos desde una cadena JSON
     * @param {string} jsonData Datos en formato JSON
     * @returns {Promise<boolean>} Promesa con el éxito de la importación
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validar estructura básica de datos
            if (!data.config || !data.entities || !data.fields || !data.records) {
                throw new Error("Estructura de datos inválida");
            }
            
            // Guardar datos importados
            return this.saveData(data).then(() => true);
        } catch (e) {
            console.error("Error al importar datos:", e);
            return Promise.resolve(false);
        }
    }
};