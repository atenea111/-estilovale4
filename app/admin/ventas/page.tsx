"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, Trash2, Clock, Package, Truck, CheckCircle, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PaymentService } from "@/lib/payment-service"
import { AdminLayout } from "@/components/admin-layout"
import type { Sale } from "@/lib/types"

export default function VentasAdmin() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchSales()
    
    // Configurar polling para refrescar datos cada 30 segundos
    const interval = setInterval(() => {
      fetchSales()
    }, 30000) // 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const salesData = await PaymentService.getAllSales()
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

  const handleStatusUpdate = async (saleId: string, newStatus: 'en_preparacion' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelled') => {
    try {
      setUpdatingStatus(saleId)
      const success = await PaymentService.updateOrderStatus(
        saleId,
        newStatus,
        'admin@estilovale4.com'
      )

      if (success) {
        // Actualizar el estado local
        setSales(prevSales => 
          prevSales.map(sale => 
            sale.id === saleId ? { ...sale, estadoEnvio: newStatus } : sale
          )
        )
      } else {
        alert("Error al actualizar el estado del pedido")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Error al actualizar el estado del pedido")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleViewOrderDetails = (saleId: string) => {
    router.push(`/admin/ventas/${saleId}`)
  }

  // Función para obtener el estado en español y los estilos
  const getEstadoDisplay = (sale: Sale) => {
    // Mostrar estado de envío por defecto, pero también mostrar estado de pago si es relevante
    const estadoEnvio = sale.estadoEnvio || 'pendiente_envio'
    const estadoPago = sale.estadoPago || 'pending'
    
    // Si el pago no está aprobado, mostrar estado de pago
    if (estadoPago !== 'approved') {
      switch (estadoPago) {
        case 'pending':
          return {
            text: 'Pago Pendiente',
            className: 'bg-yellow-100 text-yellow-800'
          }
        case 'rejected':
          return {
            text: 'Pago Rechazado',
            className: 'bg-red-100 text-red-800'
          }
        case 'cancelled':
          return {
            text: 'Pago Cancelado',
            className: 'bg-gray-100 text-gray-800'
          }
      }
    }
    
    // Si el pago está aprobado, mostrar estado de envío
    switch (estadoEnvio) {
      case 'pendiente_envio':
        return {
          text: 'Pendiente Envío',
          className: 'bg-blue-100 text-blue-800'
        }
      case 'en_preparacion':
        return {
          text: 'En Preparación',
          className: 'bg-orange-100 text-orange-800'
        }
      case 'listo_entrega':
        return {
          text: 'Listo para Entrega',
          className: 'bg-purple-100 text-purple-800'
        }
      case 'en_camino':
        return {
          text: 'En Camino',
          className: 'bg-indigo-100 text-indigo-800'
        }
      case 'entregado':
        return {
          text: 'Entregado',
          className: 'bg-green-100 text-green-800'
        }
      case 'cancelled':
        return {
          text: 'Cancelado',
          className: 'bg-gray-100 text-gray-800'
        }
      default:
        return {
          text: 'Desconocido',
          className: 'bg-gray-100 text-gray-800'
        }
    }
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
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoDisplay(sale).className}`}
                          >
                            {getEstadoDisplay(sale).text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewOrderDetails(sale.id)}
                                className="flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDetails(sale)}
                              >
                                Detalles
                              </Button>
                            </div>
                            
                            {/* Botones de gestión de estado */}
                            <div className="flex flex-wrap gap-1">
                              {/* Solo mostrar botones si el pago está aprobado */}
                              {sale.estadoPago === 'approved' && (
                                <>
                                  {sale.estadoEnvio === 'pendiente_envio' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(sale.id, 'en_preparacion')}
                                  disabled={updatingStatus === sale.id}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Prep.
                                </Button>
                              )}
                              
                                  {sale.estadoEnvio === 'en_preparacion' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(sale.id, 'listo_entrega')}
                                  disabled={updatingStatus === sale.id}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  Listo
                                </Button>
                              )}
                              
                                  {sale.estadoEnvio === 'listo_entrega' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(sale.id, 'en_camino')}
                                  disabled={updatingStatus === sale.id}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  Envío
                                </Button>
                              )}
                              
                                  {sale.estadoEnvio === 'en_camino' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(sale.id, 'entregado')}
                                  disabled={updatingStatus === sale.id}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Entregado
                                </Button>
                              )}
                              
                                  {/* Botón de cancelar */}
                                  {(sale.estadoEnvio === 'pendiente_envio' || sale.estadoEnvio === 'en_preparacion' || sale.estadoEnvio === 'listo_entrega') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(sale.id, 'cancelled')}
                                  disabled={updatingStatus === sale.id}
                                  className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-800"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancelar
                                </Button>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {updatingStatus === sale.id && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Actualizando...
                              </div>
                            )}
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
                <p className="text-sm text-gray-600">{selectedSale?.email}</p>
                <p className="text-sm text-gray-600">{selectedSale?.telefono}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedSale ? getEstadoDisplay(selectedSale).className : ''
                    }`}
                  >
                    {selectedSale ? getEstadoDisplay(selectedSale).text : ''}
                </span>
              </div>
            </div>

            {/* Información de entrega */}
            {selectedSale?.direccion && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Información de Entrega</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm"><strong>Dirección:</strong> {selectedSale.direccion}</p>
                  <p className="text-sm"><strong>Opción:</strong> {selectedSale.opcionEntrega === 'domicilio' ? 'Entrega a domicilio' : 'Retiro en local'}</p>
                  {selectedSale.horarioEntrega && (
                    <p className="text-sm"><strong>Horario:</strong> {selectedSale.horarioEntrega}</p>
                  )}
                  {selectedSale.comentarios && (
                    <p className="text-sm"><strong>Comentarios:</strong> {selectedSale.comentarios}</p>
                  )}
                </div>
              </div>
            )}

            {/* Información del cupón si fue aplicado */}
            {selectedSale?.cuponAplicado && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Cupón Aplicado</p>
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm"><strong>Código:</strong> {selectedSale.cuponAplicado.codigo}</p>
                  <p className="text-sm"><strong>Descuento:</strong> {selectedSale.cuponAplicado.descuento}%</p>
                  <p className="text-sm"><strong>Monto descontado:</strong> ${selectedSale.cuponAplicado.montoDescuento.toLocaleString("es-AR")}</p>
                  <p className="text-sm"><strong>Monto original:</strong> ${selectedSale.cuponAplicado.montoOriginal.toLocaleString("es-AR")}</p>
                </div>
              </div>
            )}

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
