# PigmeaProducciónV2

## Descripción

PigmeaProducciónV2 es una aplicación web de Registro de Datos Genérico y Flexible con persistencia en **Firebase Realtime Database**. Permite a los usuarios definir sus propias estructuras de datos, registrar información según esas estructuras y visualizar reportes estadísticos avanzados. La interfaz es moderna, responsiva, e intuitiva, con actualizaciones de UI en tiempo real sin recargar la página.

## Características

- **Administración de Entidades Principales**: Permite crear, ver, editar y eliminar categorías principales de lo que se registrará (ej., "Máquina de Coser", "Impresora 3D").
- **Gestión de Campos Personalizados**: Permite crear, ver, editar y eliminar campos que se usarán en los formularios de registro.
- **Asociación de Campos a Entidades**: Permite asignar/desasignar campos personalizados a cada entidad principal con **funcionalidad de reordenamiento por arrastre**.
- **Área de Registro**: Permite seleccionar una entidad principal y registrar datos dinámicamente según los campos asociados.
- **Visualización de Registros con Tabla Avanzada**: 
  - Tabla paginada con búsqueda en tiempo real
  - Ordenación por cualquier columna
  - Selección de columnas personalizadas para mostrar campos específicos
  - Filtros por entidad, fecha y grupos
- **Reportes Comparativos Avanzados**: 
  - Gráficos comparativos para campos numéricos y de selección
  - Configuración de ejes horizontal y vertical personalizables
  - Soporte para múltiples tipos de agregación (suma, promedio, conteo)
  - Exportación de gráficos y datos
- **Importación/Exportación Masiva**: 
  - Descarga de plantillas CSV/Excel personalizadas
  - Importación masiva con validación y previsualización
  - Exportación de datos filtrados a CSV
- **Calendario Interactivo**: Selección visual de rangos de fechas con arrastre
- **Eliminación y Edición de Registros**: Gestión completa del ciclo de vida de registros
- **Configuración Personalizable**: Nombres personalizados para entidades y registros en toda la aplicación
- **Persistencia en Firebase**: Sincronización en tiempo real con fallback a localStorage

## Tecnologías Utilizadas

- **HTML5**
- **CSS3** con **Bootstrap 5**
- **JavaScript (ES6+)**
- **Firebase Realtime Database**
- **Chart.js** para gráficos
- **SortableJS** para funcionalidad de arrastre

## Instalación y Uso

### Requisitos Previos
- Cuenta de Firebase configurada
- Proyecto Firebase con Realtime Database habilitado

### Configuración

1. Clona el repositorio:
    ```sh
    git clone https://github.com/tu-usuario/PigmeaProduccionV2.git
    ```

2. Navega al directorio del proyecto:
    ```sh
    cd PigmeaProduccionV2
    ```

3. Configura Firebase:
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Realtime Database
   - Copia la configuración de Firebase y actualiza `js/config/firebase-config.js`

4. Abre el archivo `index.html` en tu navegador web.

## Estructura de Archivos

```
/
├── index.html              # Página principal (SPA)
├── css/
│   └── styles.css          # Estilos personalizados
├── js/
│   ├── app.js              # Inicialización y lógica principal
│   ├── router.js           # Gestión de navegación SPA
│   ├── config/
│   │   └── firebase-config.js # Configuración de Firebase
│   ├── models/
│   │   ├── storage.js      # Gestión de Firebase/localStorage
│   │   ├── entity.js       # Modelo para entidades principales
│   │   ├── field.js        # Modelo para campos personalizados
│   │   └── record.js       # Modelo para los registros
│   ├── views/
│   │   ├── admin.js        # Vista de administración
│   │   ├── register.js     # Vista de registro
│   │   └── reports.js      # Vista de reportes
│   └── utils/
│       ├── validation.js   # Validación de formularios
│       ├── ui.js           # Utilidades de interfaz
│       ├── export.js       # Importación/exportación
│       ├── charts.js       # Generación de gráficos
│       └── mass-import.js  # Utilidades de importación masiva
└── lib/                    # Librerías externas
    ├── chart.min.js
    ├── firebase/
    └── sortable/
```

## Funcionalidades Detalladas

### Administración/Configuración

- **Gestión de Entidades Principales**:
  - Crear, ver, editar y eliminar entidades con agrupación opcional
  - Asignación de campos con reordenamiento visual por arrastre
- **Gestión de Campos Personalizados**:
  - Tipos: texto, número, selección
  - Configuración para uso en reportes y tablas
  - Definición de campos como ejes de gráficos
- **Configuración General**:
  - Personalización de nombres de entidades y registros
  - Configuración de títulos y descripciones

### Área de Registro

- **Formulario Dinámico**:
  - Campos generados automáticamente según la entidad seleccionada
  - Validación en tiempo real
  - Guardado automático en Firebase
- **Gestión de Registros**:
  - Tabla con paginación, búsqueda y ordenación
  - Edición individual y masiva
  - Eliminación con confirmación

### Área de Reportes

- **Filtros Avanzados**:
  - Múltiples entidades simultáneas
  - Rangos de fechas con calendario interactivo
  - Filtros por grupos de entidades
- **Visualización**:
  - Tabla configurable con columnas personalizables
  - Gráficos interactivos (barras, líneas, circular)
  - Resúmenes estadísticos automáticos
- **Exportación**:
  - CSV con datos filtrados
  - Plantillas de importación personalizadas

## Configuración de Firebase

El archivo `js/config/firebase-config.js` debe contener:

```javascript
const firebaseConfig = {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com/",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
};
```

## Características Técnicas

- **Arquitectura SPA** con enrutamiento del lado cliente
- **Patrón MVC** con modelos especializados
- **Persistencia híbrida** Firebase + localStorage
- **Responsive Design** compatible con móviles
- **Validación robusta** en frontend
- **Gestión de errores** con fallbacks automáticos

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT, hecho exclusivamente para PIGMEA S.L.

## Contacto

Si tienes alguna pregunta o sugerencia, no dudes en contactarme a través de [GitHub](https://github.com/JhonyAlex).
