"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Instagram, Minus, Plus, ShoppingBag, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { initializeFirebase } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface CartItem {
  id: string
  nombre: string
  precio: number
  imagen: string
  quantity: number
}

export default function Carrito() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get cart items from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCartItems(cart)
    setLoading(false)
  }, [])

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))

    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
  }

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== id)
    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.setItem("cart", JSON.stringify([]))
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("El carrito está vacío")
      return
    }

    try {
      // Register the sale in Firebase
      const { db } = await initializeFirebase()

      const saleData = {
        fecha: serverTimestamp(),
        cliente: "Cliente WhatsApp",
        total: getTotalPrice(),
        productos: cartItems.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.quantity,
          subtotal: item.precio * item.quantity,
        })),
        estado: "Pendiente",
      }

      await addDoc(collection(db, "ventas"), saleData)

      // Format the order message for WhatsApp
      let message = "Hola! Quiero realizar el siguiente pedido:\n\n"

      cartItems.forEach((item) => {
        message += `• ${item.quantity}x ${item.nombre} - $${(item.precio * item.quantity).toLocaleString("es-AR")}\n`
      })

      message += `\nTotal: $${getTotalPrice().toLocaleString("es-AR")}`

      // Encode the message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message)

      // Clear the cart
      clearCart()

      // Open WhatsApp with the pre-filled message - Updated phone number
      window.open(`https://wa.me/5493415496064?text=${encodedMessage}`, "_blank")
    } catch (error) {
      console.error("Error registering sale:", error)
      alert("Hubo un error al procesar tu pedido. Por favor intenta nuevamente.")
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2">
              <Card className="bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-black">Productos ({getTotalItems()})</h2>
                    <Button
                      variant="ghost"
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      Vaciar carrito
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-white rounded overflow-hidden flex-shrink-0">
                            <img
                              src={item.imagen || "/placeholder.svg?height=80&width=80"}
                              alt={item.nombre}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-black">{item.nombre}</h3>
                            <p className="text-black font-bold mt-1">${item.precio.toLocaleString("es-AR")}</p>
                          </div>

                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="mx-3 text-black w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-black">
                              ${(item.precio * item.quantity).toLocaleString("es-AR")}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-transparent p-0 h-auto mt-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              <span className="text-xs">Eliminar</span>
                            </Button>
                          </div>
                        </div>
                        <Separator className="mt-6" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <Card className="bg-white overflow-hidden sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-black mb-6">Resumen del Pedido</h2>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-black">${getTotalPrice().toLocaleString("es-AR")}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Cantidad de productos</span>
                      <span className="font-medium text-black">{getTotalItems()}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${getTotalPrice().toLocaleString("es-AR")}</span>
                    </div>
                  </div>

                  <Button onClick={handleCheckout} className="w-full mt-6 bg-black text-white hover:bg-gray-800">
                    Finalizar compra por WhatsApp
                  </Button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Al finalizar la compra, serás redirigido a WhatsApp para completar tu pedido.
                  </p>
                </CardContent>
              </Card>
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
