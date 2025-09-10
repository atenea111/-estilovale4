const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJ",
  authDomain: "estilovale4.firebaseapp.com",
  projectId: "estilovale4",
  storageBucket: "estilovale4.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

async function clearWebhookLogs() {
  try {
    console.log('Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Obteniendo logs de webhook...');
    const webhookLogsRef = collection(db, 'webhook_logs');
    const snapshot = await getDocs(webhookLogsRef);

    console.log(`Encontrados ${snapshot.size} logs de webhook`);

    if (snapshot.size === 0) {
      console.log('No hay logs de webhook para limpiar');
      return;
    }

    console.log('Eliminando logs de webhook...');
    const deletePromises = [];
    
    snapshot.forEach((docSnapshot) => {
      console.log(`Eliminando log: ${docSnapshot.id}`);
      deletePromises.push(deleteDoc(doc(db, 'webhook_logs', docSnapshot.id)));
    });

    await Promise.all(deletePromises);
    console.log('✅ Todos los logs de webhook han sido eliminados');

  } catch (error) {
    console.error('Error limpiando logs de webhook:', error);
  }
}

// Ejecutar el script
clearWebhookLogs().then(() => {
  console.log('Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('Error ejecutando script:', error);
  process.exit(1);
});
