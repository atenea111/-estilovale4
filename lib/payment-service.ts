// Versión simplificada del PaymentService que funciona en el frontend
// Sin dependencias del SDK de MercadoPago que causan problemas

import { initializeFirebase } from './firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, where, getDocs, setDoc } from 'firebase/firestore'
import type { 
  PaymentItem, 
  PaymentPreference, 
  PaymentResult, 
  Sale, 
  StockMovement,
  StockValidationError,
  StockValidationResult,
  Coupon
} from './types'

// Configuración de MercadoPago desde variables de entorno
const MERCADOPAGO_CONFIG = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MERCADOPAGO_ACCESS_TOKEN || '',
  PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
  FAILURE_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure`,
  PENDING_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/pending`,
  WEBHOOK_URL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/webhook`
}

// Función para crear preferencia usando fetch directamente (compatible con frontend)
async function createMercadoPagoPreference(preferenceData: any): Promise<any> {
  console.log('Enviando datos a MercadoPago:', preferenceData)
  
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MERCADOPAGO_CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preferenceData)
  })

  console.log('Respuesta HTTP:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Error de MercadoPago:', errorText)
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Respuesta de MercadoPago:', result)
  return result
}

export class PaymentService {
  /**
   * Crea una preferencia de pago en MercadoPago
   */
  static async createPaymentPreference(preferenceData: PaymentPreference): Promise<PaymentResult> {
    try {
      // Verificar que esté configurado el token de MercadoPago
      if (!MERCADOPAGO_CONFIG.ACCESS_TOKEN) {
        console.error('MercadoPago ACCESS_TOKEN no configurado')
        return {
          success: false,
          error: 'MercadoPago no está configurado. Por favor configura las variables de entorno.'
        }
      }

      console.log('Creando preferencia de pago con MercadoPago...')
      console.log('Configuración:', {
        accessToken: MERCADOPAGO_CONFIG.ACCESS_TOKEN ? 'Configurado' : 'No configurado',
        successUrl: MERCADOPAGO_CONFIG.SUCCESS_URL,
        webhookUrl: MERCADOPAGO_CONFIG.WEBHOOK_URL
      })

      // Preparar datos para la API de MercadoPago
      const mpPreferenceData = {
        items: preferenceData.items,
        payer: preferenceData.payer,
        back_urls: {
          success: MERCADOPAGO_CONFIG.SUCCESS_URL,
          failure: MERCADOPAGO_CONFIG.FAILURE_URL,
          pending: MERCADOPAGO_CONFIG.PENDING_URL,
        },
        auto_return: preferenceData.auto_return,
        notification_url: MERCADOPAGO_CONFIG.WEBHOOK_URL,
        external_reference: preferenceData.external_reference,
      }

      console.log('Datos enviados a MercadoPago:', mpPreferenceData)

      const response = await createMercadoPagoPreference(mpPreferenceData)

      console.log('Preferencia creada exitosamente:', response)

      return {
        success: true,
        paymentId: response.id,
        status: 'created'
      }
    } catch (error) {
      console.error('Error creating payment preference:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Registra una venta en Firebase
   */
  static async registerSale(saleData: Omit<Sale, 'id' | 'fecha'>): Promise<string | null> {
    try {
      const { db } = await initializeFirebase()
      
      const saleDoc = await addDoc(collection(db, 'ventas'), {
        ...saleData,
        fecha: serverTimestamp(),
        paymentId: saleData.paymentId,
        externalReference: saleData.externalReference
      })

      return saleDoc.id
    } catch (error) {
      console.error('Error registering sale:', error)
      return null
    }
  }

  /**
   * Actualiza el stock de productos después de una venta
   */
  static async updateProductStock(productos: Array<{
    id: string
    cantidad: number
  }>): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      
      for (const producto of productos) {
        const productRef = doc(db, 'productos', producto.id)
        const productDoc = await getDoc(productRef)
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data().cantidadStock || 0
          const newStock = Math.max(0, currentStock - producto.cantidad)
          
          await updateDoc(productRef, {
            cantidadStock: newStock,
            stock: newStock > 0
          })

          // Registrar movimiento de stock
          await this.recordStockMovement(producto.id, producto.cantidad, 'venta', currentStock, newStock)
        }
      }

      return true
    } catch (error) {
      console.error('Error updating product stock:', error)
      return false
    }
  }

  /**
   * Registra un movimiento de stock para auditoría
   */
  static async recordStockMovement(
    productId: string,
    cantidad: number,
    tipo: 'venta' | 'ajuste' | 'entrada',
    stockAnterior: number,
    stockNuevo: number
  ): Promise<void> {
    try {
      const { db } = await initializeFirebase()
      
      await addDoc(collection(db, 'stockMovimientos'), {
        productId,
        cantidad,
        tipo,
        stockAnterior,
        stockNuevo,
        fecha: serverTimestamp(),
        usuario: 'sistema'
      })
    } catch (error) {
      console.error('Error recording stock movement:', error)
    }
  }

  /**
   * Valida que todos los productos tengan stock suficiente
   */
  static async validateStock(productos: Array<{
    id: string
    cantidad: number
  }>): Promise<StockValidationResult> {
    try {
      const { db } = await initializeFirebase()
      const errors: StockValidationError[] = []

      for (const producto of productos) {
        const productRef = doc(db, 'productos', producto.id)
        const productDoc = await getDoc(productRef)
        
        if (productDoc.exists()) {
          const productData = productDoc.data()
          const availableStock = productData.cantidadStock || 0
          
          if (availableStock < producto.cantidad) {
            errors.push({
              productId: producto.id,
              productName: productData.nombre,
              requested: producto.cantidad,
              available: availableStock
            })
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      }
    } catch (error) {
      console.error('Error validating stock:', error)
      return {
        valid: false,
        errors: []
      }
    }
  }

  /**
   * Procesa una notificación de webhook de MercadoPago
   */
  static async processWebhookNotification(notificationData: {
    type: string
    data: { id: string }
  }): Promise<boolean> {
    try {
      console.log('=== PROCESANDO WEBHOOK ===')
      console.log('Tipo de notificación:', notificationData.type)
      console.log('ID del pago:', notificationData.data.id)
      
      if (notificationData.type !== 'payment') {
        console.log('Tipo de notificación no es payment, ignorando')
        return false
      }

      const paymentId = notificationData.data.id
      
      // Primero obtener el estado real del pago desde MercadoPago
      const paymentStatus = await this.getRealPaymentStatus(paymentId)
      console.log('Estado del pago desde MercadoPago:', paymentStatus)
      
      // Solo procesar si el pago está realmente aprobado
      if (paymentStatus !== 'approved') {
        console.log(`Pago ${paymentId} no está aprobado (estado: ${paymentStatus}), ignorando`)
        return true // Retornar true para confirmar a MercadoPago
      }
      
      // Verificar si ya procesamos este webhook específico
      const { db } = await initializeFirebase()
      const webhookLogRef = collection(db, 'webhook_logs')
      const webhookQuery = query(webhookLogRef, where('paymentId', '==', paymentId), where('status', '==', 'completed'))
      const webhookSnapshot = await getDocs(webhookQuery)
      
      if (!webhookSnapshot.empty) {
        console.log(`⚠️ Webhook ya procesado completamente para payment ${paymentId}, ignorando duplicado`)
        
        // Confirmar notificación a MercadoPago para duplicados también
        await this.confirmNotificationToMercadoPago(paymentId)
        
        return true
      }

      // Crear un registro temporal para evitar race conditions
      const tempLogRef = doc(webhookLogRef)
      await setDoc(tempLogRef, {
        paymentId: paymentId,
        status: 'processing',
        processedAt: serverTimestamp(),
        tempLock: true
      })
      
      // Verificar nuevamente después de crear el lock temporal
      const webhookSnapshot2 = await getDocs(webhookQuery)
      if (webhookSnapshot2.size > 1) {
        console.log(`⚠️ Webhook duplicado detectado durante procesamiento para payment ${paymentId}, ignorando`)
        await this.confirmNotificationToMercadoPago(paymentId)
        return true
      }
      
      // Buscar la venta por paymentId
      const salesRef = collection(db, 'ventas')
      const q = query(salesRef, where('paymentId', '==', paymentId))
      const querySnapshot = await getDocs(q)
      
      console.log('Buscando venta con paymentId:', paymentId)
      console.log('Resultados encontrados:', querySnapshot.size)
      
      if (querySnapshot.empty) {
        console.log(`No sale found for payment ${paymentId}`)
        
        // Buscar todas las ventas pendientes para encontrar la que corresponde
        console.log('Buscando en ventas pendientes...')
        const pendingSalesQuery = query(salesRef, where('estadoPago', '==', 'pending'))
        const pendingSalesSnapshot = await getDocs(pendingSalesQuery)
        
        console.log(`Encontradas ${pendingSalesSnapshot.size} ventas pendientes`)
        
        // Buscar la venta más reciente que podría corresponder a este pago
        let foundSale = null
        for (const saleDoc of pendingSalesSnapshot.docs) {
          const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale
          console.log(`Revisando venta ${sale.id} con externalReference: ${sale.externalReference}`)
          
          // Si la venta no tiene paymentId o tiene un paymentId diferente, podría ser esta
          if (!sale.paymentId || sale.paymentId !== paymentId) {
            foundSale = sale
            console.log(`Venta candidata encontrada: ${sale.id}`)
            break
          }
        }
        
        if (foundSale) {
          console.log('Actualizando venta con paymentId real:', paymentId)
          
          // Actualizar el paymentId en la venta
          await updateDoc(doc(db, 'ventas', foundSale.id), {
            paymentId: paymentId
          })
          
          // Procesar el pago
          return await this.processPayment(foundSale, paymentId, db)
        }
        
        console.log('No se encontró venta correspondiente')
        return false
      }

      const saleDoc = querySnapshot.docs[0]
      const sale = { id: saleDoc.id, ...saleDoc.data() } as Sale
      
      console.log('Venta encontrada:', sale.id)
      console.log('Estado actual de pago:', sale.estadoPago)
      console.log('Estado actual de envío:', sale.estadoEnvio)
      
      return await this.processPayment(sale, paymentId, db)
    } catch (error) {
      console.error('Error processing webhook notification:', error)
      return false
    }
  }

  /**
   * Procesa el pago y actualiza el estado de la venta
   */
  private static async processPayment(sale: Sale, paymentId: string, db: any): Promise<boolean> {
    try {
      // Verificar si ya se procesó este webhook
      if (sale.webhookProcessed) {
        console.log(`Webhook ya procesado para venta ${sale.id}, ignorando`)
        return true
      }

      // Obtener el estado real del pago desde MercadoPago
      const paymentStatus = await this.getRealPaymentStatus(paymentId)
      console.log('Estado del pago desde MercadoPago:', paymentStatus)
      
      if (paymentStatus === 'approved') {
        // Actualizar estado de pago y estado de envío
        await updateDoc(doc(db, 'ventas', sale.id), {
          estadoPago: 'approved',
          estadoEnvio: 'pendiente_envio', // Estado inicial de envío
          fechaAprobacion: serverTimestamp(),
          webhookProcessed: true,
          webhookProcessedAt: serverTimestamp()
        })

        // Actualizar stock de productos
        await this.updateProductStock(
          sale.productos.map((p: any) => ({ id: p.id, cantidad: p.cantidad }))
        )

        // Procesar cupón si fue aplicado
        if (sale.cuponAplicado) {
          await this.processCouponUsage(
            sale.id,
            sale.cuponAplicado.codigo,
            sale.cliente,
            sale.cuponAplicado.montoOriginal,
            sale.cuponAplicado.montoDescuento
          )
        }

        // Actualizar el log del webhook como completado
        const webhookLogQuery = query(collection(db, 'webhook_logs'), where('paymentId', '==', paymentId))
        const webhookLogSnapshot = await getDocs(webhookLogQuery)
        if (!webhookLogSnapshot.empty) {
          // Actualizar todos los registros de este paymentId
          for (const webhookLogDoc of webhookLogSnapshot.docs) {
            await updateDoc(doc(db, 'webhook_logs', webhookLogDoc.id), {
              status: 'completed',
              completedAt: serverTimestamp(),
              saleId: sale.id
            })
          }
        }

        console.log(`✅ Payment ${paymentId} approved for sale ${sale.id} - Stock updated, Estado envío: pendiente_envio`)
        
        // Confirmar notificación a MercadoPago
        await this.confirmNotificationToMercadoPago(paymentId)
        
        return true
      } else if (paymentStatus === 'rejected') {
        // Actualizar estado de pago
        await updateDoc(doc(db, 'ventas', sale.id), {
          estadoPago: 'rejected',
          estadoEnvio: 'cancelled', // Cancelar envío si el pago es rechazado
          fechaRechazo: serverTimestamp(),
          webhookProcessed: true,
          webhookProcessedAt: serverTimestamp()
        })

        // Actualizar el log del webhook como completado
        const webhookLogQuery = query(collection(db, 'webhook_logs'), where('paymentId', '==', paymentId))
        const webhookLogSnapshot = await getDocs(webhookLogQuery)
        if (!webhookLogSnapshot.empty) {
          // Actualizar todos los registros de este paymentId
          for (const webhookLogDoc of webhookLogSnapshot.docs) {
            await updateDoc(doc(db, 'webhook_logs', webhookLogDoc.id), {
              status: 'completed',
              completedAt: serverTimestamp(),
              saleId: sale.id
            })
          }
        }

        console.log(`❌ Payment ${paymentId} rejected for sale ${sale.id}`)
        
        // Confirmar notificación a MercadoPago
        await this.confirmNotificationToMercadoPago(paymentId)
        
        return true
      } else if (paymentStatus === 'pending') {
        // Actualizar estado de pago
        await updateDoc(doc(db, 'ventas', sale.id), {
          estadoPago: 'pending',
          estadoEnvio: 'pendiente_envio', // Mantener pendiente hasta que se apruebe el pago
          fechaPendiente: serverTimestamp(),
          webhookProcessed: true,
          webhookProcessedAt: serverTimestamp()
        })

        // Actualizar el log del webhook como completado
        const webhookLogQuery = query(collection(db, 'webhook_logs'), where('paymentId', '==', paymentId))
        const webhookLogSnapshot = await getDocs(webhookLogQuery)
        if (!webhookLogSnapshot.empty) {
          // Actualizar todos los registros de este paymentId
          for (const webhookLogDoc of webhookLogSnapshot.docs) {
            await updateDoc(doc(db, 'webhook_logs', webhookLogDoc.id), {
              status: 'completed',
              completedAt: serverTimestamp(),
              saleId: sale.id
            })
          }
        }

        console.log(`⏳ Payment ${paymentId} pending for sale ${sale.id}`)
        
        // Confirmar notificación a MercadoPago
        await this.confirmNotificationToMercadoPago(paymentId)
        
        return true
      }

      return false
    } catch (error) {
      console.error('Error processing payment:', error)
      return false
    }
  }

  /**
   * Obtiene el estado real del pago desde MercadoPago
   */
  private static async getRealPaymentStatus(paymentId: string): Promise<string> {
    try {
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
        return 'pending' // Por defecto, asumir pendiente si hay error
      }

      const paymentData = await response.json()
      console.log('Datos del pago desde MercadoPago:', paymentData)
      
      return paymentData.status || 'pending'
    } catch (error) {
      console.error('Error obteniendo estado del pago:', error)
      return 'pending' // Por defecto, asumir pendiente si hay error
    }
  }

  /**
   * Actualiza el estado de un pedido
   */
  static async updateOrderStatus(
    saleId: string, 
    newStatus: 'en_preparacion' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelled',
    administrador?: string,
    mensajeAdmin?: string
  ): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      const saleRef = doc(db, 'ventas', saleId)
      
      const updateData: any = {
        estadoEnvio: newStatus
      }

      // Agregar fecha específica según el estado
      switch (newStatus) {
        case 'en_preparacion':
          updateData.fechaEnPreparacion = serverTimestamp()
          break
        case 'listo_entrega':
          updateData.fechaListoEntrega = serverTimestamp()
          break
        case 'en_camino':
          updateData.fechaEnCamino = serverTimestamp()
          break
        case 'entregado':
          updateData.fechaEntregado = serverTimestamp()
          break
      }

      // Agregar datos del administrador si se proporcionan
      if (administrador) {
        updateData.administrador = administrador
      }
      if (mensajeAdmin) {
        updateData.mensajeAdmin = mensajeAdmin
      }

      await updateDoc(saleRef, updateData)
      console.log(`Estado del pedido ${saleId} actualizado a: ${newStatus}`)
      return true
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error)
      return false
    }
  }

  /**
   * Obtiene los detalles completos de una venta
   */
  static async getSaleDetails(saleId: string): Promise<Sale | null> {
    try {
      const { db } = await initializeFirebase()
      const saleRef = doc(db, 'ventas', saleId)
      const saleDoc = await getDoc(saleRef)
      
      if (saleDoc.exists()) {
        const data = saleDoc.data()
        return {
          id: saleDoc.id,
          fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          cliente: data.cliente || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          opcionEntrega: data.opcionEntrega || 'domicilio',
          horarioEntrega: data.horarioEntrega || '',
          comentarios: data.comentarios || '',
          total: data.total || 0,
          costoEnvioTotal: data.costoEnvioTotal || 0,
          productos: data.productos || [],
          // Estados separados
          estadoPago: data.estadoPago || 'pending',
          estadoEnvio: data.estadoEnvio || 'pendiente_envio',
          paymentId: data.paymentId,
          externalReference: data.externalReference,
          webhookProcessed: data.webhookProcessed || false,
          webhookProcessedAt: data.webhookProcessedAt ? new Date(data.webhookProcessedAt.seconds * 1000) : undefined,
          // Fechas de estados de pago
          fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion.seconds * 1000) : undefined,
          fechaRechazo: data.fechaRechazo ? new Date(data.fechaRechazo.seconds * 1000) : undefined,
          fechaPendiente: data.fechaPendiente ? new Date(data.fechaPendiente.seconds * 1000) : undefined,
          // Fechas de estados de envío
          fechaEnPreparacion: data.fechaEnPreparacion ? new Date(data.fechaEnPreparacion.seconds * 1000) : undefined,
          fechaListoEntrega: data.fechaListoEntrega ? new Date(data.fechaListoEntrega.seconds * 1000) : undefined,
          fechaEnCamino: data.fechaEnCamino ? new Date(data.fechaEnCamino.seconds * 1000) : undefined,
          fechaEntregado: data.fechaEntregado ? new Date(data.fechaEntregado.seconds * 1000) : undefined,
          mensajeAdmin: data.mensajeAdmin || '',
          administrador: data.administrador || ''
        }
      }
      
      return null
    } catch (error) {
      console.error('Error obteniendo detalles de la venta:', error)
      return null
    }
  }

  /**
   * Obtiene todas las ventas con filtros opcionales
   */
  static async getAllSales(filters?: {
    estado?: string
    fechaDesde?: Date
    fechaHasta?: Date
  }): Promise<Sale[]> {
    try {
      const { db } = await initializeFirebase()
      let salesQuery = query(collection(db, 'ventas'))
      
      // Aplicar filtros si se proporcionan
      if (filters?.estado) {
        // Filtrar por estado de envío por defecto, pero también permitir estado de pago
        if (['en_preparacion', 'listo_entrega', 'en_camino', 'entregado', 'cancelled', 'pendiente_envio'].includes(filters.estado)) {
          salesQuery = query(salesQuery, where('estadoEnvio', '==', filters.estado))
        } else if (['pending', 'approved', 'rejected'].includes(filters.estado)) {
          salesQuery = query(salesQuery, where('estadoPago', '==', filters.estado))
        }
      }
      
      const salesSnapshot = await getDocs(salesQuery)
      const salesData = salesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          cliente: data.cliente || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          opcionEntrega: data.opcionEntrega || 'domicilio',
          horarioEntrega: data.horarioEntrega || '',
          comentarios: data.comentarios || '',
          total: data.total || 0,
          costoEnvioTotal: data.costoEnvioTotal || 0,
          productos: data.productos || [],
          // Estados separados
          estadoPago: data.estadoPago || 'pending',
          estadoEnvio: data.estadoEnvio || 'pendiente_envio',
          paymentId: data.paymentId,
          externalReference: data.externalReference,
          webhookProcessed: data.webhookProcessed || false,
          webhookProcessedAt: data.webhookProcessedAt ? new Date(data.webhookProcessedAt.seconds * 1000) : undefined,
          // Fechas de estados de pago
          fechaAprobacion: data.fechaAprobacion ? new Date(data.fechaAprobacion.seconds * 1000) : undefined,
          fechaRechazo: data.fechaRechazo ? new Date(data.fechaRechazo.seconds * 1000) : undefined,
          fechaPendiente: data.fechaPendiente ? new Date(data.fechaPendiente.seconds * 1000) : undefined,
          // Fechas de estados de envío
          fechaEnPreparacion: data.fechaEnPreparacion ? new Date(data.fechaEnPreparacion.seconds * 1000) : undefined,
          fechaListoEntrega: data.fechaListoEntrega ? new Date(data.fechaListoEntrega.seconds * 1000) : undefined,
          fechaEnCamino: data.fechaEnCamino ? new Date(data.fechaEnCamino.seconds * 1000) : undefined,
          fechaEntregado: data.fechaEntregado ? new Date(data.fechaEntregado.seconds * 1000) : undefined,
          mensajeAdmin: data.mensajeAdmin || '',
          administrador: data.administrador || ''
        }
      })

      // Aplicar filtros de fecha si se proporcionan
      let filteredSales = salesData
      if (filters?.fechaDesde) {
        filteredSales = filteredSales.filter(sale => sale.fecha >= filters.fechaDesde!)
      }
      if (filters?.fechaHasta) {
        filteredSales = filteredSales.filter(sale => sale.fecha <= filters.fechaHasta!)
      }

      return filteredSales.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    } catch (error) {
      console.error('Error obteniendo ventas:', error)
      return []
    }
  }

  /**
   * Procesa el uso de un cupón después de una venta exitosa
   */
  static async processCouponUsage(
    saleId: string,
    couponCode: string,
    cliente: string,
    montoOriginal: number,
    montoDescuento: number
  ): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      
      // Buscar el cupón por código
      const couponQuery = query(collection(db, 'cupones'), where('nombre', '==', couponCode.toUpperCase()))
      const couponSnapshot = await getDocs(couponQuery)
      
      if (couponSnapshot.empty) {
        console.error('Cupón no encontrado:', couponCode)
        return false
      }
      
      const couponDoc = couponSnapshot.docs[0]
      const couponData = couponDoc.data()
      
      // Registrar el uso del cupón
      await addDoc(collection(db, 'couponUsages'), {
        couponId: couponDoc.id,
        saleId: saleId,
        cliente: cliente,
        fechaUso: serverTimestamp(),
        descuentoAplicado: couponData.descuento,
        montoOriginal: montoOriginal,
        montoDescuento: montoDescuento
      })
      
      // Incrementar el contador de usos del cupón
      await updateDoc(doc(db, 'cupones', couponDoc.id), {
        usosActuales: (couponData.usosActuales || 0) + 1
      })
      
      console.log(`Cupón ${couponCode} procesado exitosamente para venta ${saleId}`)
      return true
    } catch (error) {
      console.error('Error procesando uso de cupón:', error)
      return false
    }
  }

  /**
   * Confirma a MercadoPago que procesamos la notificación
   */
  private static async confirmNotificationToMercadoPago(paymentId: string): Promise<void> {
    try {
      // MercadoPago no requiere confirmación explícita, pero podemos loggear para debugging
      console.log(`📤 Notificación confirmada a MercadoPago para payment ${paymentId}`)
      
      // En el futuro, si MercadoPago requiere confirmación explícita, se puede implementar aquí
      // const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   }
      // })
    } catch (error) {
      console.error('Error confirming notification to MercadoPago:', error)
    }
  }
}
