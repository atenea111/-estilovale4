// Script para procesar manualmente una venta pendiente
// Ejecutar este script para actualizar el estado de una venta específica

import { initializeFirebase } from './lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { PaymentService } from './lib/payment-service'

async function processPendingSale(saleId: string) {
  try {
    console.log('Procesando venta:', saleId)
    
    const { db } = await initializeFirebase()
    
    // Obtener la venta
    const saleRef = doc(db, 'ventas', saleId)
    const saleDoc = await getDocs(query(collection(db, 'ventas'), where('__name__', '==', saleId)))
    
    if (saleDoc.empty) {
      console.log('Venta no encontrada')
      return
    }
    
    const sale = { id: saleDoc.docs[0].id, ...saleDoc.docs[0].data() }
    console.log('Venta encontrada:', sale)
    
    if (!sale.paymentId) {
      console.log('No hay paymentId en la venta')
      return
    }
    
    // Obtener el estado real del pago desde MercadoPago
    const paymentStatus = await PaymentService.getRealPaymentStatus(sale.paymentId)
    console.log('Estado del pago:', paymentStatus)
    
    // Actualizar el estado de la venta
    if (paymentStatus === 'approved') {
      await updateDoc(doc(db, 'ventas', sale.id), {
        estado: 'approved',
        fechaAprobacion: new Date()
      })
      
      // Actualizar stock
      await PaymentService.updateProductStock(
        sale.productos.map((p: any) => ({ id: p.id, cantidad: p.cantidad }))
      )
      
      console.log('Venta actualizada a aprobada y stock actualizado')
    } else if (paymentStatus === 'rejected') {
      await updateDoc(doc(db, 'ventas', sale.id), {
        estado: 'rejected',
        fechaRechazo: new Date()
      })
      
      console.log('Venta actualizada a rechazada')
    } else {
      await updateDoc(doc(db, 'ventas', sale.id), {
        estado: 'pending',
        fechaPendiente: new Date()
      })
      
      console.log('Venta actualizada a pendiente')
    }
    
  } catch (error) {
    console.error('Error procesando venta:', error)
  }
}

// Función para obtener el estado real del pago (copiada del PaymentService)
async function getRealPaymentStatus(paymentId: string): Promise<string> {
  try {
    const MERCADOPAGO_CONFIG = {
      ACCESS_TOKEN: process.env.NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN || ''
    }
    
    console.log('Obteniendo estado del pago desde MercadoPago:', paymentId)
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      console.error('Error obteniendo estado del pago:', response.status, response.statusText)
      return 'pending'
    }

    const paymentData = await response.json()
    console.log('Datos del pago desde MercadoPago:', paymentData)
    
    return paymentData.status || 'pending'
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error)
    return 'pending'
  }
}

// Ejecutar para la venta específica que viste en Firebase
// Reemplaza 'S1TDi0b51foQPw4tgLkp' con el ID real de tu venta
processPendingSale('S1TDi0b51foQPw4tgLkp')
