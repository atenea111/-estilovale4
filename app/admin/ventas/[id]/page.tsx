"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  X, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  Mail,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminLayout } from "@/components/admin-layout"
import { PaymentService } from "@/lib/payment-service"
import type { Sale } from "@/lib/types"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [adminMessage, setAdminMessage] = useState("")
  const [showMessageInput, setShowMessageInput] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  // Polling para actualizar automáticamente el estado del pago
  useEffect(() => {
    if (!order) return

    const interval = setInterval(() => {
      fetchOrderDetails()
    }, 10000) // Actualizar cada 10 segundos

    return () => clearInterval(interval)
  }, [order])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const orderData = await PaymentService.getSaleDetails(orderId)
      setOrder(orderData)
      if (orderData?.mensajeAdmin) {
        setAdminMessage(orderData.mensajeAdmin)
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'en_preparacion' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelled') => {
    if (!order) return

    try {
      setUpdatingStatus(true)
      const success = await PaymentService.updateOrderStatus(
        order.id,
        newStatus,
        'admin@estilovale4.com', // En una implementación real, esto vendría del contexto de autenticación
        adminMessage || undefined
      )

      if (success) {
        // Actualizar el estado local inmediatamente
        setOrder(prev => prev ? { ...prev, estadoEnvio: newStatus } : null)
        setShowMessageInput(false)
        setAdminMessage("")
      } else {
        alert("Error al actualizar el estado del pedido")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Error al actualizar el estado del pedido")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getPaymentStatusDisplay = (estadoPago: string) => {
    switch (estadoPago) {
      case 'pending':
        return {
          text: 'Pago Pendiente',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        }
      case 'approved':
        return {
          text: 'Pago Aprobado',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        }
      case 'rejected':
        return {
          text: 'Pago Rechazado',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: X
        }
      case 'cancelled':
        return {
          text: 'Pago Cancelado',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: X
        }
      default:
        return {
          text: 'Estado Desconocido',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock
        }
    }
  }

  const getStatusDisplay = (order: Sale) => {
    const estadoEnvio = order.estadoEnvio || 'pendiente_envio'
    const estadoPago = order.estadoPago || 'pending'
    
    // Si el pago no está aprobado, mostrar estado de pago
    if (estadoPago !== 'approved') {
      switch (estadoPago) {
        case 'pending':
          return { text: 'Pago Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock }
        case 'rejected':
          return { text: 'Pago Rechazado', className: 'bg-red-100 text-red-800', icon: X }
        case 'cancelled':
          return { text: 'Pago Cancelado', className: 'bg-gray-100 text-gray-800', icon: X }
      }
    }
    
    // Si el pago está aprobado, mostrar estado de envío
    switch (estadoEnvio) {
      case 'pendiente_envio':
        return { text: 'Pendiente Envío', className: 'bg-blue-100 text-blue-800', icon: Clock }
      case 'en_preparacion':
        return { text: 'En Preparación', className: 'bg-orange-100 text-orange-800', icon: Clock }
      case 'listo_entrega':
        return { text: 'Listo para Entrega', className: 'bg-purple-100 text-purple-800', icon: Package }
      case 'en_camino':
        return { text: 'En Camino', className: 'bg-indigo-100 text-indigo-800', icon: Truck }
      case 'entregado':
        return { text: 'Entregado', className: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'cancelled':
        return { text: 'Cancelado', className: 'bg-gray-100 text-gray-800', icon: X }
      default:
        return { text: 'Desconocido', className: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const getStatusIcon = (order: Sale) => {
    const statusInfo = getStatusDisplay(order)
    const IconComponent = statusInfo.icon
    return <IconComponent className="h-4 w-4" />
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWhatsAppLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  }

  if (loading) {
    return (
      <AdminLayout activeSection="orders">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout activeSection="orders">
        <div className="text-center py-12">
          <p className="text-gray-500">Pedido no encontrado.</p>
          <Button onClick={() => router.push('/admin/ventas')} className="mt-4">
            Volver a Ventas
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const statusInfo = getStatusDisplay(order)
  const StatusIcon = statusInfo.icon

  return (
    <AdminLayout activeSection="orders">
      <div className="space-y-6">
        {/* Header Mejorado */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/ventas')}
                  className="flex items-center bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Ventas
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Pedido #{order.id.substring(0, 8)}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <p className="text-gray-600 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {order.cliente}
                    </p>
                    <p className="text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(order.fecha)}
                    </p>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {order.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className={`${statusInfo.className} flex items-center space-x-1 text-sm px-3 py-1`}>
                  <StatusIcon className="h-4 w-4" />
                  <span>{statusInfo.text}</span>
                </Badge>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${(() => {
                    // Calcular el total correcto basado en los datos reales
                    const subtotalProductos = order.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)
                    const totalCalculado = subtotalProductos + order.costoEnvioTotal
                    return totalCalculado.toLocaleString("es-AR")
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos Mejorados */}
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Productos del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {order.productos.map((producto, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{producto.nombre}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cantidad</p>
                              <p className="text-lg font-bold text-gray-900">{producto.cantidad}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Precio Unitario</p>
                              <p className="text-lg font-bold text-gray-900">${producto.precio.toLocaleString("es-AR")}</p>
                            </div>
                            {producto.costoEnvio > 0 && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Envío</p>
                                <p className="text-lg font-bold text-gray-900">${producto.costoEnvio.toLocaleString("es-AR")}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            ${producto.subtotal.toLocaleString("es-AR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Resumen Mejorado */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Estado del Pago */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Estado del Pago:</span>
                      </div>
                      {(() => {
                        const paymentStatus = getPaymentStatusDisplay(order.estadoPago || 'pending')
                        const PaymentIcon = paymentStatus.icon
                        return (
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${paymentStatus.className}`}>
                            <PaymentIcon className="h-4 w-4 mr-1.5" />
                            {paymentStatus.text}
                          </span>
                        )
                      })()}
                    </div>
                    
                    {/* Desglose de Precios */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Subtotal productos:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            ${order.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0).toLocaleString("es-AR")}
                          </span>
                        </div>
                        {order.costoEnvioTotal > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Costo de envío:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              ${order.costoEnvioTotal.toLocaleString("es-AR")}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total:</span>
                            <span className="text-2xl font-bold text-gray-900">
                              ${(() => {
                                // Calcular el total correcto basado en los datos reales
                                const subtotalProductos = order.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0)
                                const totalCalculado = subtotalProductos + order.costoEnvioTotal
                                return totalCalculado.toLocaleString("es-AR")
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles de Entrega Mejorados */}
            <Card className="shadow-sm">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Información de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Dirección de Entrega
                      </Label>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">{order.direccion}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Contacto
                      </Label>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md flex-1">{order.telefono}</p>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            const message = `Hola! Te contacto desde Estilo Vale 4 sobre tu pedido #${order.id.substring(0, 8)}.`
                            window.open(getWhatsAppLink(order.telefono, message), '_blank')
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Tipo de Entrega</Label>
                      <div className="mt-1">
                        <Badge className={order.opcionEntrega === 'domicilio' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                          {order.opcionEntrega === 'domicilio' ? 'Entrega a domicilio' : 'Retiro en local'}
                        </Badge>
                      </div>
                    </div>
                    
                    {order.horarioEntrega && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Horario de Entrega
                        </Label>
                        <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">{order.horarioEntrega}</p>
                      </div>
                    )}
                    
                    {order.comentarios && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Comentarios del Cliente
                        </Label>
                        <p className="text-gray-900 mt-1 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                          {order.comentarios}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Control Mejorado */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <Card className="shadow-sm">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Datos del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-700">Nombre Completo</Label>
                  <p className="text-gray-900 font-medium mt-1">{order.cliente}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-700">Email</Label>
                  <p className="text-gray-900 font-medium mt-1">{order.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-700">Teléfono</Label>
                  <p className="text-gray-900 font-medium mt-1">{order.telefono}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actualizar Estado Mejorado */}
            <Card className="shadow-sm">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Gestión de Estado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Solo mostrar botones si el pago está aprobado */}
                  {order.estadoPago === 'approved' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={order.estadoEnvio === 'en_preparacion' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate('en_preparacion')}
                        disabled={updatingStatus}
                        className="flex items-center justify-center h-10"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        En preparación
                      </Button>
                      <Button
                        variant={order.estadoEnvio === 'listo_entrega' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate('listo_entrega')}
                        disabled={updatingStatus}
                        className="flex items-center justify-center h-10"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Listo para entrega
                      </Button>
                      <Button
                        variant={order.estadoEnvio === 'en_camino' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate('en_camino')}
                        disabled={updatingStatus}
                        className="flex items-center justify-center h-10"
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        En camino
                      </Button>
                      <Button
                        variant={order.estadoEnvio === 'entregado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate('entregado')}
                        disabled={updatingStatus}
                        className="flex items-center justify-center h-10"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Entregado
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        {order.estadoPago === 'pending' && 'Esperando confirmación de pago...'}
                        {order.estadoPago === 'rejected' && 'Pago rechazado - No se puede gestionar el envío'}
                        {order.estadoPago === 'cancelled' && 'Pago cancelado - Pedido cancelado'}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updatingStatus}
                    className="w-full flex items-center justify-center h-10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar Pedido
                  </Button>

                  {/* Mensaje del Administrador */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMessageInput(!showMessageInput)}
                      className="w-full flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {showMessageInput ? 'Ocultar mensaje' : 'Agregar mensaje'}
                    </Button>
                    
                    {showMessageInput && (
                      <div className="space-y-2">
                        <Label htmlFor="adminMessage" className="text-sm font-semibold">Mensaje para el cliente</Label>
                        <Textarea
                          id="adminMessage"
                          placeholder="Escribe un mensaje para el cliente..."
                          value={adminMessage}
                          onChange={(e) => setAdminMessage(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {updatingStatus && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center text-blue-800">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm font-medium">Actualizando estado del pedido...</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Historial de Estados Mejorado */}
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Historial del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pedido creado</p>
                      <p className="text-xs text-gray-600">{formatDate(order.fecha)}</p>
                    </div>
                  </div>
                  
                  {order.fechaAprobacion && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Pago aprobado</p>
                        <p className="text-xs text-gray-600">{formatDate(order.fechaAprobacion)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.fechaEnPreparacion && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">En preparación</p>
                        <p className="text-xs text-gray-600">{formatDate(order.fechaEnPreparacion)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.fechaListoEntrega && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Listo para entrega</p>
                        <p className="text-xs text-gray-600">{formatDate(order.fechaListoEntrega)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.fechaEnCamino && (
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">En camino</p>
                        <p className="text-xs text-gray-600">{formatDate(order.fechaEnCamino)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.fechaEntregado && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Entregado</p>
                        <p className="text-xs text-gray-600">{formatDate(order.fechaEntregado)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
