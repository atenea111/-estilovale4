import { initializeFirebase } from './firebase'
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore'
import type { Coupon, CouponUsage } from './types'

export class CouponService {
  /**
   * Obtiene todos los cupones
   */
  static async getAllCoupons(): Promise<Coupon[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(collection(db, 'cupones'), orderBy('fechaCreacion', 'desc'))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
        fechaVencimiento: doc.data().fechaVencimiento?.toDate() || undefined,
      })) as Coupon[]
    } catch (error) {
      console.error('Error getting coupons:', error)
      return []
    }
  }

  /**
   * Obtiene un cupón por su nombre/código
   */
  static async getCouponByCode(couponCode: string): Promise<Coupon | null> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(collection(db, 'cupones'), where('nombre', '==', couponCode.toUpperCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }
      
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
        fechaVencimiento: doc.data().fechaVencimiento?.toDate() || undefined,
      } as Coupon
    } catch (error) {
      console.error('Error getting coupon by code:', error)
      return null
    }
  }

  /**
   * Valida si un cupón es válido para usar
   */
  static async validateCoupon(couponCode: string): Promise<{
    valid: boolean
    coupon?: Coupon
    error?: string
  }> {
    try {
      const coupon = await this.getCouponByCode(couponCode)
      
      if (!coupon) {
        return {
          valid: false,
          error: 'Cupón no encontrado'
        }
      }
      
      if (!coupon.activo) {
        return {
          valid: false,
          error: 'Cupón inactivo'
        }
      }
      
      // Los cupones no tienen vencimiento - comentado para futuras implementaciones
      // if (coupon.fechaVencimiento && coupon.fechaVencimiento < new Date()) {
      //   return {
      //     valid: false,
      //     error: 'Cupón vencido'
      //   }
      // }
      
      if (coupon.limiteUsos && coupon.usosActuales >= coupon.limiteUsos) {
        return {
          valid: false,
          error: 'Cupón agotado'
        }
      }
      
      return {
        valid: true,
        coupon
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      return {
        valid: false,
        error: 'Error al validar el cupón'
      }
    }
  }

  /**
   * Aplica un cupón y registra su uso
   */
  static async applyCoupon(
    couponCode: string, 
    saleId: string, 
    cliente: string, 
    montoOriginal: number
  ): Promise<{
    success: boolean
    descuento?: number
    montoDescuento?: number
    montoFinal?: number
    error?: string
  }> {
    try {
      const validation = await this.validateCoupon(couponCode)
      
      if (!validation.valid || !validation.coupon) {
        return {
          success: false,
          error: validation.error
        }
      }
      
      const coupon = validation.coupon
      const montoDescuento = (montoOriginal * coupon.descuento) / 100
      const montoFinal = montoOriginal - montoDescuento
      
      // Registrar el uso del cupón
      await this.recordCouponUsage({
        couponId: coupon.id,
        saleId,
        cliente,
        fechaUso: new Date(),
        descuentoAplicado: coupon.descuento,
        montoOriginal,
        montoDescuento
      })
      
      // Actualizar el contador de usos del cupón
      await this.incrementCouponUsage(coupon.id)
      
      return {
        success: true,
        descuento: coupon.descuento,
        montoDescuento,
        montoFinal
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      return {
        success: false,
        error: 'Error al aplicar el cupón'
      }
    }
  }

  /**
   * Registra el uso de un cupón
   */
  static async recordCouponUsage(usage: Omit<CouponUsage, 'id'>): Promise<void> {
    try {
      const { db } = await initializeFirebase()
      
      await addDoc(collection(db, 'couponUsages'), {
        ...usage,
        fechaUso: serverTimestamp()
      })
    } catch (error) {
      console.error('Error recording coupon usage:', error)
      throw error
    }
  }

  /**
   * Incrementa el contador de usos de un cupón
   */
  static async incrementCouponUsage(couponId: string): Promise<void> {
    try {
      const { db } = await initializeFirebase()
      const couponRef = doc(db, 'cupones', couponId)
      
      await updateDoc(couponRef, {
        usosActuales: serverTimestamp() // Esto se manejará mejor con una transacción
      })
    } catch (error) {
      console.error('Error incrementing coupon usage:', error)
      throw error
    }
  }

  /**
   * Obtiene el historial de uso de un cupón
   */
  static async getCouponUsageHistory(couponId: string): Promise<CouponUsage[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(
        collection(db, 'couponUsages'),
        where('couponId', '==', couponId),
        orderBy('fechaUso', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaUso: doc.data().fechaUso?.toDate() || new Date()
      })) as CouponUsage[]
    } catch (error) {
      console.error('Error getting coupon usage history:', error)
      return []
    }
  }

  /**
   * Obtiene estadísticas de cupones
   */
  static async getCouponStats(): Promise<{
    totalCoupons: number
    activeCoupons: number
    expiredCoupons: number
    totalUsages: number
    totalDiscountGiven: number
  }> {
    try {
      const { db } = await initializeFirebase()
      
      // Obtener todos los cupones
      const couponsSnapshot = await getDocs(collection(db, 'cupones'))
      const coupons = couponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
        fechaVencimiento: doc.data().fechaVencimiento?.toDate() || undefined,
      })) as Coupon[]
      
      // Obtener todos los usos
      const usagesSnapshot = await getDocs(collection(db, 'couponUsages'))
      const usages = usagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaUso: doc.data().fechaUso?.toDate() || new Date()
      })) as CouponUsage[]
      
      const totalCoupons = coupons.length
      const activeCoupons = coupons.filter(c => c.activo).length
      const expiredCoupons = 0 // Los cupones no tienen vencimiento
      const totalUsages = usages.length
      const totalDiscountGiven = usages.reduce((sum, usage) => sum + usage.montoDescuento, 0)
      
      return {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsages,
        totalDiscountGiven
      }
    } catch (error) {
      console.error('Error getting coupon stats:', error)
      return {
        totalCoupons: 0,
        activeCoupons: 0,
        expiredCoupons: 0,
        totalUsages: 0,
        totalDiscountGiven: 0
      }
    }
  }

  /**
   * Crea un nuevo cupón
   */
  static async createCoupon(couponData: Omit<Coupon, 'id' | 'fechaCreacion' | 'usosActuales'>): Promise<string | null> {
    try {
      const { db } = await initializeFirebase()
      
      const docRef = await addDoc(collection(db, 'cupones'), {
        ...couponData,
        nombre: couponData.nombre.toUpperCase(), // Normalizar a mayúsculas
        fechaCreacion: serverTimestamp(),
        usosActuales: 0
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error creating coupon:', error)
      return null
    }
  }

  /**
   * Actualiza un cupón existente
   */
  static async updateCoupon(couponId: string, updateData: Partial<Coupon>): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      const couponRef = doc(db, 'cupones', couponId)
      
      const dataToUpdate = { ...updateData }
      if (dataToUpdate.nombre) {
        dataToUpdate.nombre = dataToUpdate.nombre.toUpperCase()
      }
      
      await updateDoc(couponRef, dataToUpdate)
      return true
    } catch (error) {
      console.error('Error updating coupon:', error)
      return false
    }
  }

  /**
   * Elimina un cupón completamente
   */
  static async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      const couponRef = doc(db, 'cupones', couponId)
      
      // Eliminar completamente el cupón
      await deleteDoc(couponRef)
      
      return true
    } catch (error) {
      console.error('Error deleting coupon:', error)
      return false
    }
  }
}
