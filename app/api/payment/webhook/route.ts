import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK RECIBIDO ===')
    console.log('URL:', request.url)
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    // Obtener datos del body
    const body = await request.json().catch(() => null)
    console.log('Body:', body)
    
    // Obtener datos de query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    console.log('Query params:', queryParams)
    
    let notificationData: any = null
    
    // MercadoPago puede enviar datos de diferentes maneras
    if (body && body.type && body.data) {
      // Formato JSON en el body
      notificationData = body
      console.log('Procesando notificación desde body:', notificationData)
    } else if (queryParams.type && queryParams['data.id']) {
      // Formato en query parameters
      notificationData = {
        type: queryParams.type,
        data: {
          id: queryParams['data.id']
        }
      }
      console.log('Procesando notificación desde query params:', notificationData)
    } else if (queryParams.topic && queryParams.id) {
      // Formato alternativo de MercadoPago
      if (queryParams.topic === 'payment') {
        notificationData = {
          type: 'payment',
          data: {
            id: queryParams.id
          }
        }
        console.log('Procesando notificación desde topic:', notificationData)
      } else if (queryParams.topic === 'merchant_order') {
        // Para merchant_order, necesitamos obtener el payment_id
        console.log('Notificación de merchant_order recibida, ignorando por ahora')
        return NextResponse.json({ success: true, message: 'merchant_order ignored' })
      }
    }
    
    if (!notificationData) {
      console.log('No se pudo extraer datos de notificación válidos')
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Procesar la notificación usando el servicio de pagos
    console.log('Procesando notificación:', notificationData)
    const success = await PaymentService.processWebhookNotification(notificationData)
    
    if (success) {
      console.log('✅ WEBHOOK PROCESADO EXITOSAMENTE - Notificación confirmada a MercadoPago')
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('❌ Error al procesar notificación')
      return NextResponse.json({ error: 'Failed to process notification' }, { status: 400 })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint is active' })
}
