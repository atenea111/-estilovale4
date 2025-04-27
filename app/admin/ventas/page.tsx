"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore"
import { AdminLayout } from "@/components/admin-layout"

interface Sale {
  id: string
  fecha: Date
  cliente: string
  total: number
  productos: {
    id: string
    nombre: string
    precio: number
    cantidad: number
    subtotal: number
  }[]
  estado: string
}

export default function VentasAdmin() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      const salesQuery = query(collection(db, "ventas"), orderBy("fecha", "desc"))
      const salesSnapshot = await getDocs(salesQuery)
      const salesData = salesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          cliente: data.cliente || "Cliente",
          total: data.total || 0,
          productos: data.productos || [],
          estado: data.estado || "Completado",
        }
      })

      setSales(salesData)
    } catch (error) {
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return

    try {
      setIsSubmitting(true)
      const { db } = await initializeFirebase()

      // Delete sale from Firestore
      await deleteDoc(doc(db, "ventas", saleToDelete.id))

      // Update local state
      setSales(sales.filter((s) => s.id !== saleToDelete.id))
      setIsDeleteDialogOpen(false)
      setSaleToDelete(null)
    } catch (error) {
      console.error("Error deleting sale:", error)
      alert("Error al eliminar la venta. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale)
    setIsDetailsDialogOpen(true)
  }

  // Filter sales based on search term
  const filteredSales = sales.filter(
    (sale) =>
      sale.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.productos.some((product) => product.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <AdminLayout activeSection="orders">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Ventas</h2>
            <p className="text-gray-500">Administra las ventas de tu tienda</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <Label htmlFor="search">Buscar ventas</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por cliente, ID o producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay ventas registradas.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.cliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.fecha.toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${sale.total.toLocaleString("es-AR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.estado === "Completado"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {sale.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(sale)}>
                              Ver detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteClick(sale)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta</DialogTitle>
            <DialogDescription>
              Venta #{selectedSale?.id.substring(0, 6)} - {selectedSale?.fecha.toLocaleDateString("es-AR")}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente</p>
                <p className="text-lg">{selectedSale?.cliente}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedSale?.estado === "Completado"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedSale?.estado}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Productos</p>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedSale?.productos.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.nombre}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          ${product.precio.toLocaleString("es-AR")}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.cantidad}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          ${product.subtotal.toLocaleString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${selectedSale?.total.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
