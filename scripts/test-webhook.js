#!/usr/bin/env node

/**
 * Script para probar el webhook de MercadoPago
 * Uso: node scripts/test-webhook.js
 */

const https = require('https');
const http = require('http');

// Configuración
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/payment/webhook';
const PAYMENT_ID = process.env.PAYMENT_ID || '1842406931-4b3983f6-14a3-40a4-b795-5467eb1df659';

// Datos de prueba para el webhook
const testNotificationData = {
  type: 'payment',
  data: {
    id: PAYMENT_ID
  }
};

// Función para hacer la petición HTTP
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// Función principal
async function testWebhook() {
  console.log('🧪 Iniciando prueba del webhook de MercadoPago...');
  console.log(`📍 URL del webhook: ${WEBHOOK_URL}`);
  console.log(`💳 Payment ID de prueba: ${PAYMENT_ID}`);
  console.log('📦 Datos de notificación:', JSON.stringify(testNotificationData, null, 2));
  console.log('');

  try {
    console.log('📤 Enviando notificación al webhook...');
    const response = await makeRequest(WEBHOOK_URL, testNotificationData);
    
    console.log('📥 Respuesta recibida:');
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Headers:`, response.headers);
    console.log(`   Body:`, JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Webhook procesado exitosamente!');
    } else {
      console.log('❌ Error en el webhook');
    }
    
  } catch (error) {
    console.error('❌ Error al probar el webhook:', error.message);
  }
}

// Ejecutar la prueba
testWebhook();