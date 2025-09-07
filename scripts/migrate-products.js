// Script de migración para actualizar productos existentes
// Ejecutar este script una vez para agregar los campos de stock y costoEnvio a productos existentes

import { initializeFirebase } from './lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

async function migrateProducts() {
  try {
    console.log('Iniciando migración de productos...')
    
    const { db } = await initializeFirebase()
    const productsSnapshot = await getDocs(collection(db, 'productos'))
    
    let updatedCount = 0
    
    for (const productDoc of productsSnapshot.docs) {
      const productData = productDoc.data()
      
      // Verificar si el producto ya tiene los nuevos campos
      if (productData.cantidadStock === undefined || productData.costoEnvio === undefined) {
        console.log(`Actualizando producto: ${productData.nombre}`)
        
        await updateDoc(doc(db, 'productos', productDoc.id), {
          cantidadStock: productData.cantidadStock || 10, // Stock por defecto
          costoEnvio: productData.costoEnvio || 0, // Sin costo de envío por defecto
          stock: (productData.cantidadStock || 10) > 0 // Actualizar estado de stock
        })
        
        updatedCount++
      }
    }
    
    console.log(`Migración completada. ${updatedCount} productos actualizados.`)
    
  } catch (error) {
    console.error('Error durante la migración:', error)
  }
}

// Ejecutar la migración
migrateProducts()
