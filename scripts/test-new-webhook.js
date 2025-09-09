#!/usr/bin/env node

/**
 * Script de prueba para verificar que el webhook funciona con los nuevos estados
 * Uso: node scripts/test-new-webhook.js
 */

const fetch = require('node-fetch');

async function testWebhook() {
  console.log('🧪 Probando webhook con los nuevos estados...');
  console.log('');

  // Simular notificación de MercadoPago para una venta nueva
  const webhookData = {
    type: 'payment',
    data: {
      id: '125544770948' // ID del pago que está fallando
    }
  };

  try {
    console.log('📤 Enviando notificación de prueba...');
    console.log('Datos:', JSON.stringify(webhookData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    console.log('');
    console.log('📥 Respuesta del webhook:');
    console.log('Status:', response.status);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('');
      console.log('✅ Webhook procesado exitosamente!');
    } else {
      console.log('');
      console.log('❌ Error en el webhook');
    }
    
  } catch (error) {
    console.error('❌ Error al probar webhook:', error.message);
  }
}

// Ejecutar la prueba
testWebhook();
