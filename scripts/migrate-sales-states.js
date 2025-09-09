#!/usr/bin/env node

/**
 * Script de migración para separar estados de pago y envío
 * Uso: node scripts/migrate-sales-states.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Función para mapear el estado antiguo a los nuevos estados
function mapOldStateToNewStates(oldEstado) {
  switch (oldEstado) {
    case 'pending':
      return {
        estadoPago: 'pending',
        estadoEnvio: 'pendiente_envio'
      }
    case 'approved':
      return {
        estadoPago: 'approved',
        estadoEnvio: 'pendiente_envio'
      }
    case 'rejected':
      return {
        estadoPago: 'rejected',
        estadoEnvio: 'cancelled'
      }
    case 'cancelled':
      return {
        estadoPago: 'cancelled',
        estadoEnvio: 'cancelled'
      }
    case 'en_preparacion':
      return {
        estadoPago: 'approved',
        estadoEnvio: 'en_preparacion'
      }
    case 'listo_entrega':
      return {
        estadoPago: 'approved',
        estadoEnvio: 'listo_entrega'
      }
    case 'en_camino':
      return {
        estadoPago: 'approved',
        estadoEnvio: 'en_camino'
      }
    case 'entregado':
      return {
        estadoPago: 'approved',
        estadoEnvio: 'entregado'
      }
    default:
      return {
        estadoPago: 'pending',
        estadoEnvio: 'pendiente_envio'
      }
  }
}

// Función principal de migración
async function migrateSalesStates() {
  console.log('🔄 Iniciando migración de estados de ventas...');
  console.log('');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Obtener todas las ventas
    const salesRef = collection(db, 'ventas');
    const salesSnapshot = await getDocs(salesRef);
    
    console.log(`📊 Encontradas ${salesSnapshot.size} ventas para migrar`);
    console.log('');
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const saleDoc of salesSnapshot.docs) {
      const data = saleDoc.data();
      
      // Verificar si ya tiene los nuevos campos
      if (data.estadoPago && data.estadoEnvio) {
        console.log(`⏭️  Saltando venta ${saleDoc.id} - ya migrada`);
        skippedCount++;
        continue;
      }
      
      // Mapear el estado antiguo a los nuevos estados
      const oldEstado = data.estado || 'pending';
      const newStates = mapOldStateToNewStates(oldEstado);
      
      console.log(`🔄 Migrando venta ${saleDoc.id}:`);
      console.log(`   Estado anterior: ${oldEstado}`);
      console.log(`   Nuevo estado de pago: ${newStates.estadoPago}`);
      console.log(`   Nuevo estado de envío: ${newStates.estadoEnvio}`);
      
      // Actualizar el documento
      await updateDoc(doc(db, 'ventas', saleDoc.id), {
        estadoPago: newStates.estadoPago,
        estadoEnvio: newStates.estadoEnvio
      });
      
      console.log(`   ✅ Migrada exitosamente`);
      console.log('');
      
      migratedCount++;
    }
    
    console.log('📈 Resumen de migración:');
    console.log(`   ✅ Ventas migradas: ${migratedCount}`);
    console.log(`   ⏭️  Ventas saltadas: ${skippedCount}`);
    console.log(`   📊 Total procesadas: ${migratedCount + skippedCount}`);
    console.log('');
    console.log('🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
  }
}

// Ejecutar la migración
migrateSalesStates();
