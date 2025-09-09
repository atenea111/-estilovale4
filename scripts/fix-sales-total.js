#!/usr/bin/env node

/**
 * Script para corregir el total de ventas existentes
 * Uso: node scripts/fix-sales-total.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvQZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q",
  authDomain: "estilovale4.firebaseapp.com",
  projectId: "estilovale4",
  storageBucket: "estilovale4.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};

// Función para calcular el total correcto
function calculateCorrectTotal(productos, costoEnvioTotal) {
  const subtotalProductos = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)
  return subtotalProductos + costoEnvioTotal
}

// Función principal
async function fixSalesTotal() {
  console.log('🔧 Iniciando corrección de totales de ventas...');
  console.log('');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Obtener todas las ventas
    const salesRef = collection(db, 'ventas');
    const salesSnapshot = await getDocs(salesRef);
    
    console.log(`📊 Encontradas ${salesSnapshot.size} ventas para revisar`);
    console.log('');
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const saleDoc of salesSnapshot.docs) {
      const data = saleDoc.data();
      
      // Calcular el total correcto
      const correctTotal = calculateCorrectTotal(data.productos || [], data.costoEnvioTotal || 0)
      const currentTotal = data.total || 0
      
      // Si el total actual es diferente al correcto, corregirlo
      if (currentTotal !== correctTotal) {
        console.log(`🔧 Corrigiendo venta ${saleDoc.id}:`);
        console.log(`   Total actual: $${currentTotal}`);
        console.log(`   Total correcto: $${correctTotal}`);
        console.log(`   Subtotal productos: $${data.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)}`);
        console.log(`   Costo envío: $${data.costoEnvioTotal || 0}`);
        
        // Actualizar el documento
        await updateDoc(doc(db, 'ventas', saleDoc.id), {
          total: correctTotal
        });
        
        console.log(`   ✅ Corregido exitosamente`);
        console.log('');
        
        fixedCount++;
      } else {
        console.log(`⏭️  Saltando venta ${saleDoc.id} - total ya correcto ($${currentTotal})`);
        skippedCount++;
      }
    }
    
    console.log('📈 Resumen de corrección:');
    console.log(`   ✅ Ventas corregidas: ${fixedCount}`);
    console.log(`   ⏭️  Ventas saltadas: ${skippedCount}`);
    console.log(`   📊 Total procesadas: ${fixedCount + skippedCount}`);
    console.log('');
    console.log('🎉 Corrección completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
    console.error('Detalles:', error);
  }
}

// Ejecutar la corrección
fixSalesTotal();
