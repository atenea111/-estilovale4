// Función para probar el webhook manualmente
// Ejecutar esta función para simular una notificación de MercadoPago

async function testWebhook() {
  const paymentId = '124668076923' // El ID del pago que viste en los logs
  
  console.log('Probando webhook para paymentId:', paymentId)
  
  // Simular la notificación que envía MercadoPago
  const notificationData = {
    type: 'payment',
    data: {
      id: paymentId
    }
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    })
    
    const result = await response.json()
    console.log('Respuesta del webhook:', result)
    
  } catch (error) {
    console.error('Error probando webhook:', error)
  }
}

// Ejecutar la prueba
testWebhook()
