"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Instagram, Minus, Plus, ShoppingBag, Trash2, User, AlertTriangle, ShoppingCart, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { initializeFirebase } from "@/lib/firebase"
import { PaymentService } from "@/lib/payment-service"
import { CustomerForm } from "@/components/customer-form"
import { CouponForm } from "@/components/coupon-form"
import type { CartItem, StockValidationError, CustomerFormData, Coupon } from "@/lib/types"

export default function Carrito() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stockErrors, setStockErrors] = useState<StockValidationError[]>([])
  const [isValidatingStock, setIsValidatingStock] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [customerData, setCustomerData] = useState<CustomerFormData | null>(null)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  useEffect(() => {
    // Get cart items from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCartItems(cart)
    setLoading(false)
    
    // Validar stock al cargar el carrito
    if (cart.length > 0) {
      validateStock()
    }
  }, [])

  // Efecto para mostrar el formulario cuando hay productos y no hay datos del cliente
  useEffect(() => {
    if (cartItems.length > 0 && !customerData && !showCustomerForm) {
      setShowCustomerForm(true)
    }
  }, [cartItems.length, customerData, showCustomerForm])

  const validateStock = async () => {
    if (cartItems.length === 0) return
    
    setIsValidatingStock(true)
    try {
      const validation = await PaymentService.validateStock(
        cartItems.map(item => ({ id: item.id, cantidad: item.quantity }))
      )
      setStockErrors(validation.errors)
    } catch (error) {
      console.error('Error validating stock:', error)
    } finally {
      setIsValidatingStock(false)
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))

    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    
    // Validar stock después del cambio
    setTimeout(() => {
      validateStock()
    }, 100)
  }

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== id)
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
    
    // Validar stock después de eliminar
    setTimeout(() => {
      validateStock()
    }, 100)
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.setItem("cart", JSON.stringify([]))
    setStockErrors([])
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.quantity, 0)
  }

  const getTotalShipping = () => {
    return cartItems.reduce((total, item) => total + (item.costoEnvio || 0) * item.quantity, 0)
  }

  const getGrandTotal = () => {
    const total = getTotalPrice() + getTotalShipping()
    return total - discountAmount
  }

  const handleCustomerFormSubmit = (data: CustomerFormData) => {
    setCustomerData(data)
    setShowCustomerForm(false)
    // No proceder automáticamente, esperar que el usuario haga clic en el botón principal
  }

  const handleFormChange = (isValid: boolean, data: CustomerFormData) => {
    setIsFormValid(isValid)
    if (isValid) {
      setCustomerData(data)
    }
  }

  const handleCouponApplied = (coupon: Coupon, discount: number) => {
    setAppliedCoupon(coupon)
    setDiscountAmount(discount)
  }

  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
  }

  const handleCheckout = async (customerFormData?: CustomerFormData) => {
    if (cartItems.length === 0) {
      alert("El carrito está vacío")
      return
    }

    // Si no hay datos del cliente, mostrar el formulario
    if (!customerFormData && !customerData) {
      setShowCustomerForm(true)
      return
    }

    // Usar los datos del cliente del parámetro o del estado
    const clientData = customerFormData || customerData
    if (!clientData) {
      alert("Error: No se encontraron los datos del cliente")
      return
    }

    // Validar stock antes de proceder
    if (stockErrors.length > 0) {
      alert("Hay productos sin stock suficiente. Por favor revisa tu carrito.")
      return
    }

    setIsProcessingPayment(true)
    console.log("Iniciando checkout con MercadoPago...")
    console.log("Productos en carrito:", cartItems)
    console.log("Datos del cliente:", clientData)

    try {
      // Crear preferencia de pago
      const paymentItems = cartItems.map(item => ({
        id: item.id,
        title: item.nombre,
        quantity: item.quantity,
        unit_price: item.precio + (item.costoEnvio || 0), // Incluir costo de envío en el precio unitario
        currency_id: 'ARS' as const
      }))

      console.log("Items para MercadoPago:", paymentItems)

      const preference = await PaymentService.createPaymentPreference({
        items: paymentItems,
        payer: {
          email: clientData.email,
          name: clientData.nombre.split(' ')[0] || clientData.nombre,
          surname: clientData.nombre.split(' ').slice(1).join(' ') || 'Cliente',
          phone: {
            area_code: clientData.telefono.replace(/\D/g, '').substring(0, 4),
            number: clientData.telefono.replace(/\D/g, '').substring(4)
          }
        },
        auto_return: 'approved',
        external_reference: `sale_${Date.now()}`
      })

      console.log("Respuesta de MercadoPago:", preference)

      if (preference.success && preference.paymentId) {
        // Registrar la venta como pendiente
        const saleId = await PaymentService.registerSale({
          cliente: clientData.nombre,
          email: clientData.email,
          telefono: clientData.telefono,
          direccion: clientData.direccion,
          opcionEntrega: clientData.opcionEntrega,
          horarioEntrega: clientData.horarioEntrega,
          comentarios: clientData.comentarios,
          total: getGrandTotal(), // Usar el total con descuento aplicado
          costoEnvioTotal: getTotalShipping(),
          productos: cartItems.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.quantity,
            subtotal: item.precio * item.quantity,
            costoEnvio: item.costoEnvio || 0
          })),
          // Información del cupón si fue aplicado
          cuponAplicado: appliedCoupon ? {
            codigo: appliedCoupon.nombre,
            descuento: appliedCoupon.descuento,
            montoDescuento: discountAmount,
            montoOriginal: getTotalPrice() + getTotalShipping()
          } : undefined,
          estadoPago: 'pending',
          estadoEnvio: 'pendiente_envio',
          paymentId: preference.paymentId, // Usar el paymentId de la respuesta
          externalReference: `sale_${Date.now()}`
        })

        console.log("Venta registrada con ID:", saleId)

        if (saleId) {
          // Redirigir a MercadoPago usando el paymentId como pref_id
          console.log("Redirigiendo a MercadoPago...")
          window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preference.paymentId}`
        } else {
          alert("Error al registrar la venta. Intenta nuevamente.")
        }
      } else {
        console.error("Error en preferencia de MercadoPago:", preference.error)
        alert(`Error al crear el pago: ${preference.error}`)
      }
    } catch (error) {
      console.error("Error en checkout:", error)
      alert("Error al procesar el pago. Intenta nuevamente.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Cargando carrito...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5D3EF]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F5D3EF] shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Estilo Vale 4" className="h-12 md:h-16" />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-black hover:text-gray-700 font-medium">
              Inicio
            </Link>
            <Link href="/catalogo" className="text-black hover:text-gray-700 font-medium">
              Catálogo
            </Link>
            <Link href="/quienes-somos" className="text-black hover:text-gray-700 font-medium">
              Quiénes Somos
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              href="https://www.instagram.com/estilovale4/?igsh=eWF5eW5rMTBtZXd1#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-700"
            >
              <Instagram className="h-6 w-6" />
            </Link>
            <Link href="/carrito" className="relative">
              <ShoppingBag className="h-6 w-6 text-black" />
              <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </Link>
            <Link href="/admin-login" className="text-black hover:text-gray-700">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Back to Catalog */}
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/catalogo")}
          className="flex items-center text-black hover:bg-white/20"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Continuar comprando
        </Button>
      </div>

      {/* Cart Content */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-black mb-8">Carrito de Compras</h1>

        {cartItems.length === 0 ? (
          <Card className="bg-white p-8 text-center">
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-6">Agrega productos desde nuestro catálogo</p>
              <Button onClick={() => router.push("/catalogo")} className="bg-black text-white hover:bg-gray-800">
                Ver Catálogo
              </Button>
            </div>
          </Card>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header del Carrito */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
              <p className="text-gray-600 mt-2">Revisa tus productos antes de proceder al pago</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna Principal - Formulario y Productos */}
              <div className="lg:col-span-2 space-y-6">
                {/* Formulario del Cliente */}
                {showCustomerForm && (
                  <Card className="bg-white shadow-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm">📝</span>
                        </div>
                        Completa tus datos de entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-600 mb-6">
                        Para continuar con tu compra, necesitamos algunos datos para la entrega de tu pedido.
                      </p>
                      <CustomerForm 
                        onSubmit={handleCustomerFormSubmit}
                        loading={isProcessingPayment}
                        onFormChange={handleFormChange}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Datos del Cliente Confirmados */}
                {customerData && !showCustomerForm && (
                  <Card className="bg-white shadow-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 text-sm">✅</span>
                        </div>
                        Datos de Entrega Confirmados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Cliente</p>
                            <p className="text-lg font-semibold text-gray-900">{customerData.nombre}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</p>
                            <p className="text-lg font-semibold text-gray-900">{customerData.email}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Teléfono</p>
                            <p className="text-lg font-semibold text-gray-900">{customerData.telefono}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Opción de Entrega</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {customerData.opcionEntrega === 'domicilio' ? 'Entrega a domicilio' : 'Retiro en local'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Dirección</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {customerData.opcionEntrega === 'retiro' 
                                ? 'Manuel García 1867, Piso 01, Dep 08 (Retiro en local)'
                                : customerData.direccion
                              }
                            </p>
                          </div>
                          {customerData.horarioEntrega && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Horario</p>
                              <p className="text-lg font-semibold text-gray-900">{customerData.horarioEntrega}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {customerData.comentarios && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Comentarios</p>
                          <p className="text-lg font-semibold text-gray-900 mt-2">{customerData.comentarios}</p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCustomerForm(true)}
                        className="mt-6 w-full"
                      >
                        Modificar datos
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Cupón de Descuento */}
                <CouponForm
                  onCouponApplied={handleCouponApplied}
                  onCouponRemoved={handleCouponRemoved}
                  appliedCoupon={appliedCoupon}
                  discountAmount={discountAmount}
                  totalAmount={getTotalPrice() + getTotalShipping()}
                />

                {/* Productos del Carrito */}
                <Card className="bg-white shadow-sm border-0">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <ShoppingCart className="h-4 w-4 text-gray-600" />
                        </div>
                        Productos ({cartItems.length})
                      </CardTitle>
                      <Button
                        variant="ghost"
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Vaciar carrito
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-6">
                            {/* Imagen del Producto */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.imagen || "/placeholder.svg?height=96&width=96"}
                                alt={item.nombre}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            {/* Información del Producto */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.nombre}</h3>
                              <div className="flex items-center space-x-6 text-sm text-gray-600">
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                  <span className="font-medium">Precio unitario:</span>
                                  <span className="ml-2 font-bold text-gray-900">${item.precio.toLocaleString("es-AR")}</span>
                                </div>
                                {item.costoEnvio > 0 && (
                                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                                    <span className="font-medium">Envío:</span>
                                    <span className="ml-2 font-bold text-gray-900">${item.costoEnvio.toLocaleString("es-AR")}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Controles de Cantidad */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center border border-gray-200 rounded-lg">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="h-10 w-10 hover:bg-gray-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="px-4 py-2 text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="h-10 w-10 hover:bg-gray-100"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Precio Total y Acciones */}
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900 mb-2">
                                ${(item.precio * item.quantity).toLocaleString("es-AR")}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Columna Lateral - Resumen del Pedido */}
              <div className="lg:col-span-1">
                <Card className="bg-white shadow-sm border-0 sticky top-6">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Receipt className="h-4 w-4 text-gray-600" />
                      </div>
                      Resumen del Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Subtotal productos</span>
                        <span className="font-semibold text-gray-900">${getTotalPrice().toLocaleString("es-AR")}</span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Costo de envío</span>
                        <span className="font-semibold text-gray-900">${getTotalShipping().toLocaleString("es-AR")}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Descuento ({appliedCoupon.nombre})</span>
                          <span className="font-semibold text-green-600">-${discountAmount.toLocaleString("es-AR")}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Cantidad de productos</span>
                        <span className="font-semibold text-gray-900">{getTotalItems()}</span>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">${getGrandTotal().toLocaleString("es-AR")}</span>
                      </div>
                    </div>

                    {/* Mostrar errores de stock */}
                    {stockErrors.length > 0 && (
                      <Alert className="mt-6 border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <div className="font-semibold mb-2">Productos sin stock suficiente:</div>
                          {stockErrors.map((error, index) => (
                            <div key={index} className="text-sm">
                              • {error.productName}: solicitado {error.requested}, disponible {error.available}
                            </div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={() => handleCheckout()} 
                      className="w-full mt-6 bg-black text-white hover:bg-gray-800 h-12 text-lg font-semibold"
                      disabled={stockErrors.length > 0 || isValidatingStock || isProcessingPayment || (showCustomerForm && !isFormValid)}
                    >
                      {isProcessingPayment ? 'Procesando pago...' : 
                       isValidatingStock ? 'Validando stock...' :
                       showCustomerForm ? (isFormValid ? 'Completar datos y proceder al pago' : 'Completa el formulario para continuar') :
                       'Finalizar compra con MercadoPago'}
                    </Button>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      {showCustomerForm ? 
                        (isFormValid ? 'Formulario completo. Puedes proceder al pago.' : 'Completa todos los campos obligatorios para continuar.') : 
                        'Los datos están completos. Puedes proceder al pago.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-10 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center md:items-start">
              <img src="/images/logo.png" alt="Estilo Vale 4" className="h-20 mb-4" />
              <p className="text-gray-300">Tu tienda de moda favorita con los mejores productos y precios.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Enlaces</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/catalogo" className="text-gray-300 hover:text-white">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/quienes-somos" className="text-gray-300 hover:text-white">
                    Quiénes Somos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <p className="text-gray-300">WhatsApp: +54 9 3415 49-6064</p>
              <p className="text-gray-300 mt-2">Email: info@estilovale4.com</p>
              <div className="flex mt-4">
                <Link
                  href="https://www.instagram.com/estilovale4/?igsh=eWF5eW5rMTBtZXd1#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#F5D3EF] transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Estilo Vale 4. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

