/**
 * Configuración de Firebase
 */
try {
    const firebaseConfig = {
        apiKey: "AIzaSyCiWtDTVTG3VTs6JfupUsFmL8S4JqpqCXA",
        authDomain: "pigmeaproduccion.firebaseapp.com",
        databaseURL: "https://pigmeaproduccion-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "pigmeaproduccion",
        storageBucket: "pigmeaproduccion.firebasestorage.app",
        messagingSenderId: "70067446729",
        appId: "1:70067446729:web:ef03131d039073dc49fe18"
    };

    // Initialize Firebase
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase configurado correctamente");
    } else {
        console.error("Firebase SDK no está cargado");
    }
} catch (error) {
    console.error("Error al inicializar Firebase:", error);
}
