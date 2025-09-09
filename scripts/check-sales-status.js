#!/usr/bin/env node

/**
 * Script para verificar el estado de las ventas en Firestore
 * Uso: node scripts/check-sales-status.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

// Configuración de Firebase (usar las mismas variables de entorno)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Función para formatear fecha
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString('es-AR');
  }
  return new Date(timestamp).toLocaleString('es-AR');
}

// Función principal
async function checkSalesStatus() {
  console.log('🔍 Verificando estado de las ventas en Firestore...');
  console.log('');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Obtener las últimas 10 ventas
    const salesRef = collection(db, 'ventas');
    const q = query(salesRef, orderBy('fecha', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    console.log(`📊 Encontradas ${querySnapshot.size} ventas:`);
    console.log('');
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`🆔 ID: ${doc.id}`);
      console.log(`👤 Cliente: ${data.cliente || 'N/A'}`);
      console.log(`📧 Email: ${data.email || 'N/A'}`);
      console.log(`💰 Total: $${data.total || 0}`);
      console.log(`📦 Estado: ${data.estado || 'N/A'}`);
      console.log(`💳 Payment ID: ${data.paymentId || 'N/A'}`);
      console.log(`🔗 External Reference: ${data.externalReference || 'N/A'}`);
      console.log(`📅 Fecha: ${formatDate(data.fecha)}`);
      console.log(`✅ Webhook Procesado: ${data.webhookProcessed ? 'Sí' : 'No'}`);
      if (data.webhookProcessedAt) {
        console.log(`⏰ Webhook Procesado en: ${formatDate(data.webhookProcessedAt)}`);
      }
      if (data.fechaAprobacion) {
        console.log(`✅ Fecha Aprobación: ${formatDate(data.fechaAprobacion)}`);
      }
      if (data.fechaRechazo) {
        console.log(`❌ Fecha Rechazo: ${formatDate(data.fechaRechazo)}`);
      }
      if (data.fechaPendiente) {
        console.log(`⏳ Fecha Pendiente: ${formatDate(data.fechaPendiente)}`);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error al verificar ventas:', error.message);
  }
}

// Ejecutar la verificación
checkSalesStatus();
