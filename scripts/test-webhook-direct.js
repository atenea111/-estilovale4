const fetch = require('node-fetch');

async function testWebhook() {
  try {
    console.log('Probando webhook...');
    
    // Usar el payment ID del log que viste
    const paymentId = '125040164399';
    
    const webhookData = {
      type: 'payment',
      data: {
        id: paymentId
      }
    };
    
    console.log('Enviando datos:', webhookData);
    
    const response = await fetch('http://localhost:3000/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
    
    console.log('Respuesta del webhook:', response.status, response.statusText);
    const responseText = await response.text();
    console.log('Contenido de la respuesta:', responseText);
    
  } catch (error) {
    console.error('Error probando webhook:', error);
  }
}

// Ejecutar el script
testWebhook().then(() => {
  console.log('Script completado');
  process.exit(0);
}).catch((error) => {
  console.error('Error ejecutando script:', error);
  process.exit(1);
});
