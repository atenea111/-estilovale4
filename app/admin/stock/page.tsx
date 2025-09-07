"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Edit, Loader2, Package, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/admin-layout"
import { StockService } from "@/lib/stock-service"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import type { Product, StockMovement } from "@/lib/types"

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newStock, setNewStock] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockStats, setStockStats] = useState({
    totalProducts: 0,
    productsInStock: 0,
    productsOutOfStock: 0,
    lowStockProducts: 0,
    totalStockValue: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener productos
      const { db } = await initializeFirebase()
      const productsSnapshot = await getDocs(collection(db, "productos"))
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
      
      setProducts(productsData)
      
      // Obtener movimientos de stock
      const movements = await StockService.getAllStockMovements(50)
      setStockMovements(movements)
      
      // Obtener estadísticas
      const stats = await StockService.getStockStats()
      setStockStats(stats)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditStock = (product: Product) => {
    setSelectedProduct(product)
    setNewStock(product.cantidadStock.toString())
    setIsEditDialogOpen(true)
  }

  const handleUpdateStock = async () => {
    if (!selectedProduct || !newStock) return

    try {
      setIsSubmitting(true)
      const success = await StockService.updateProductStock(
        selectedProduct.id,
        parseInt(newStock),
        'ajuste',
        'admin'
      )

      if (success) {
        // Actualizar la lista de productos
        await fetchData()
        setIsEditDialogOpen(false)
        setSelectedProduct(null)
        setNewStock("")
      } else {
        alert("Error al actualizar el stock")
      }
    } catch (error) {
      console.error("Error updating stock:", error)
      alert("Error al actualizar el stock")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStockStatusBadge = (product: Product) => {
    if (!product.stock || product.cantidadStock === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>
    } else if (product.cantidadStock <= 5) {
      return <Badge variant="secondary">Stock Bajo</Badge>
    } else {
      return <Badge variant="default">En Stock</Badge>
    }
  }

  if (loading) {
    return (
      <AdminLayout activeSection="stock">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout activeSection="stock">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Stock</h2>
          <p className="text-gray-500">Administra el inventario de productos</p>
        </div>

        {/* Estadísticas de Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockStats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">En Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stockStats.productsInStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sin Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stockStats.productsOutOfStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Stock Bajo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stockStats.lowStockProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stockStats.totalStockValue.toLocaleString("es-AR")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>Gestiona el stock de cada producto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor en Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 mr-4">
                            <img
                              src={product.imagen || "/placeholder.svg?height=40&width=40"}
                              alt={product.nombre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                            <div className="text-sm text-gray-500">ID: {product.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.cantidadStock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStockStatusBadge(product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.precio.toLocaleString("es-AR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${((product.cantidadStock || 0) * product.precio).toLocaleString("es-AR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStock(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar Stock
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>Últimos movimientos de stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockMovements.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay movimientos de stock registrados</p>
              ) : (
                stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-4 ${
                        movement.tipo === 'venta' ? 'bg-red-100 text-red-600' :
                        movement.tipo === 'entrada' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {movement.tipo === 'venta' ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {movement.tipo === 'venta' ? 'Venta' : 
                           movement.tipo === 'entrada' ? 'Entrada' : 'Ajuste'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Producto ID: {movement.productId.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {movement.cantidad > 0 ? '+' : ''}{movement.cantidad}
                      </div>
                      <div className="text-sm text-gray-500">
                        {movement.stockAnterior} → {movement.stockNuevo}
                      </div>
                      <div className="text-xs text-gray-400">
                        {movement.fecha.toLocaleDateString('es-AR')} {movement.fecha.toLocaleTimeString('es-AR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar stock */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Stock</DialogTitle>
            <DialogDescription>
              Actualiza la cantidad de stock para {selectedProduct?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Nueva cantidad de stock</Label>
              <Input
                id="stock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                min="0"
                placeholder="0"
              />
            </div>
            <div className="text-sm text-gray-500">
              Stock actual: {selectedProduct?.cantidadStock || 0}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStock} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
