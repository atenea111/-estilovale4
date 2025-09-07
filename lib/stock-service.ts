import { initializeFirebase } from './firebase'
import { collection, addDoc, getDocs, query, orderBy, limit, where, doc, updateDoc, getDoc } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore'
import type { StockMovement, Product } from './types'

export class StockService {
  /**
   * Registra un movimiento de stock
   */
  static async recordStockMovement(
    productId: string,
    cantidad: number,
    tipo: 'venta' | 'ajuste' | 'entrada',
    stockAnterior: number,
    stockNuevo: number,
    usuario: string = 'sistema',
    ventaId?: string
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
        usuario,
        ventaId
      })
    } catch (error) {
      console.error('Error recording stock movement:', error)
      throw error
    }
  }

  /**
   * Obtiene el historial de movimientos de stock para un producto
   */
  static async getProductStockHistory(productId: string, limitCount: number = 50): Promise<StockMovement[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(
        collection(db, 'stockMovimientos'),
        where('productId', '==', productId),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date()
      })) as StockMovement[]
    } catch (error) {
      console.error('Error getting product stock history:', error)
      return []
    }
  }

  /**
   * Obtiene todos los movimientos de stock recientes
   */
  static async getAllStockMovements(limitCount: number = 100): Promise<StockMovement[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(
        collection(db, 'stockMovimientos'),
        orderBy('fecha', 'desc'),
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date()
      })) as StockMovement[]
    } catch (error) {
      console.error('Error getting all stock movements:', error)
      return []
    }
  }

  /**
   * Actualiza el stock de un producto
   */
  static async updateProductStock(
    productId: string,
    nuevaCantidad: number,
    tipo: 'venta' | 'ajuste' | 'entrada' = 'ajuste',
    usuario: string = 'admin'
  ): Promise<boolean> {
    try {
      const { db } = await initializeFirebase()
      
      const productRef = doc(db, 'productos', productId)
      const productDoc = await getDoc(productRef)
      
      if (!productDoc.exists()) {
        throw new Error('Product not found')
      }
      
      const productData = productDoc.data()
      const stockAnterior = productData.cantidadStock || 0
      const stockNuevo = Math.max(0, nuevaCantidad)
      
      // Actualizar el producto
      await updateDoc(productRef, {
        cantidadStock: stockNuevo,
        stock: stockNuevo > 0
      })
      
      // Registrar el movimiento
      await this.recordStockMovement(
        productId,
        stockNuevo - stockAnterior,
        tipo,
        stockAnterior,
        stockNuevo,
        usuario
      )
      
      return true
    } catch (error) {
      console.error('Error updating product stock:', error)
      return false
    }
  }

  /**
   * Obtiene productos con stock bajo
   */
  static async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(
        collection(db, 'productos'),
        where('cantidadStock', '<=', threshold),
        where('stock', '==', true)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
    } catch (error) {
      console.error('Error getting low stock products:', error)
      return []
    }
  }

  /**
   * Obtiene estadísticas de stock
   */
  static async getStockStats(): Promise<{
    totalProducts: number
    productsInStock: number
    productsOutOfStock: number
    lowStockProducts: number
    totalStockValue: number
  }> {
    try {
      const { db } = await initializeFirebase()
      
      const productsSnapshot = await getDocs(collection(db, 'productos'))
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      
      const totalProducts = products.length
      const productsInStock = products.filter(p => p.stock && p.cantidadStock > 0).length
      const productsOutOfStock = products.filter(p => !p.stock || p.cantidadStock === 0).length
      const lowStockProducts = products.filter(p => p.stock && p.cantidadStock <= 5).length
      const totalStockValue = products.reduce((sum, p) => sum + (p.precio * p.cantidadStock), 0)
      
      return {
        totalProducts,
        productsInStock,
        productsOutOfStock,
        lowStockProducts,
        totalStockValue
      }
    } catch (error) {
      console.error('Error getting stock stats:', error)
      return {
        totalProducts: 0,
        productsInStock: 0,
        productsOutOfStock: 0,
        lowStockProducts: 0,
        totalStockValue: 0
      }
    }
  }

  /**
   * Obtiene movimientos de stock por período
   */
  static async getStockMovementsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<StockMovement[]> {
    try {
      const { db } = await initializeFirebase()
      
      const q = query(
        collection(db, 'stockMovimientos'),
        where('fecha', '>=', startDate),
        where('fecha', '<=', endDate),
        orderBy('fecha', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate() || new Date()
      })) as StockMovement[]
    } catch (error) {
      console.error('Error getting stock movements by period:', error)
      return []
    }
  }
}
