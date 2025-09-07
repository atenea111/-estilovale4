// Configuración de MercadoPago
// Copia este archivo como .env.local en la raíz del proyecto y configura tus tokens

export const MERCADOPAGO_CONFIG = {
  // Obtén estos valores desde tu panel de MercadoPago
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN || '',
  PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
  
  // URLs de retorno para el checkout
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
  FAILURE_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure`,
  PENDING_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/pending`,
  
  // URL del webhook (se configurará más adelante)
  WEBHOOK_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/webhook`
}

// Instrucciones para configurar MercadoPago:
// 1. Ve a https://www.mercadopago.com.ar/developers/panel/credentials
// 2. Crea una aplicación
// 3. Copia el Access Token y Public Key
// 4. Crea un archivo .env.local en la raíz del proyecto con:
//    NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
//    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
//    NEXT_PUBLIC_BASE_URL=https://tu-dominio.com (para producción)
