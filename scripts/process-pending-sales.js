// Script para procesar manualmente todas las ventas pendientes
// Ejecutar este script para actualizar el estado de las ventas pendientes

import { initializeFirebase } from './lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

async function processAllPendingSales() {
  try {
    console.log('Procesando todas las ventas pendientes...')
    
    const { db } = await initializeFirebase()
    const salesRef = collection(db, 'ventas')
    const pendingSalesQuery = query(salesRef, where('estado', '==', 'pending'))
    const pendingSalesSnapshot = await getDocs(pendingSalesQuery)
    
    console.log(`Encontradas ${pendingSalesSnapshot.size} ventas pendientes`)
    
    for (const saleDoc of pendingSalesSnapshot.docs) {
      const sale = { id: saleDoc.id, ...saleDoc.data() }
      console.log(`\nProcesando venta: ${sale.id}`)
      console.log(`PaymentId: ${sale.paymentId}`)
      console.log(`External Reference: ${sale.externalReference}`)
      
      if (sale.paymentId) {
        const paymentStatus = await getRealPaymentStatus(sale.paymentId)
        console.log(`Estado del pago: ${paymentStatus}`)
        
        if (paymentStatus === 'approved') {
          await updateDoc(doc(db, 'ventas', sale.id), {
            estado: 'approved',
            fechaAprobacion: new Date()
          })
          console.log(`✅ Venta ${sale.id} actualizada a aprobada`)
        } else if (paymentStatus === 'rejected') {
          await updateDoc(doc(db, 'ventas', sale.id), {
            estado: 'rejected',
            fechaRechazo: new Date()
          })
          console.log(`❌ Venta ${sale.id} actualizada a rechazada`)
        } else {
          console.log(`⏳ Venta ${sale.id} sigue pendiente`)
        }
      } else {
        console.log(`⚠️ Venta ${sale.id} no tiene paymentId`)
      }
    }
    
  } catch (error) {
    console.error('Error procesando ventas pendientes:', error)
  }
}

// Función para obtener el estado real del pago
async function getRealPaymentStatus(paymentId) {
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

// Ejecutar para procesar todas las ventas pendientes
processAllPendingSales()
