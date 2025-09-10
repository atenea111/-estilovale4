const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJ",
  authDomain: "estilovale4.firebaseapp.com",
  projectId: "estilovale4",
  storageBucket: "estilovale4.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

async function checkSaleStatus() {
  try {
    console.log('Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Obteniendo ventas...');
    const salesRef = collection(db, 'ventas');
    const snapshot = await getDocs(salesRef);

    console.log(`Encontradas ${snapshot.size} ventas`);

    snapshot.forEach((docSnapshot) => {
      const sale = { id: docSnapshot.id, ...docSnapshot.data() };
      console.log(`\nVenta ID: ${sale.id}`);
      console.log(`Cliente: ${sale.cliente}`);
      console.log(`Estado Pago: ${sale.estadoPago}`);
      console.log(`Estado Envío: ${sale.estadoEnvio}`);
      console.log(`Payment ID: ${sale.paymentId}`);
      console.log(`Total: $${sale.total}`);
      console.log(`Costo Envío: $${sale.costoEnvioTotal}`);
      console.log(`Opción Entrega: ${sale.opcionEntrega}`);
      console.log(`Dirección: ${sale.direccion}`);
    });

  } catch (error) {
    console.error('Error verificando ventas:', error);
  }
}

// Ejecutar el script
checkSaleStatus().then(() => {
  console.log('\nScript completado');
  process.exit(0);
}).catch((error) => {
  console.error('Error ejecutando script:', error);
  process.exit(1);
});
