"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Instagram, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { initializeFirebase } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { PaymentService } from "@/lib/payment-service"

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')
  
  const [loading, setLoading] = useState(true)
  const [saleData, setSaleData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (paymentId && status === 'approved') {
      handlePaymentSuccess()
    } else {
      setLoading(false)
    }
  }, [paymentId, status])

  const handlePaymentSuccess = async () => {
    try {
      // Buscar la venta por external_reference
      if (externalReference) {
        const { db } = await initializeFirebase()
        const salesRef = collection(db, 'ventas')
        const q = query(salesRef, where('externalReference', '==', externalReference))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const saleDoc = querySnapshot.docs[0]
          const sale = { id: saleDoc.id, ...saleDoc.data() }
          
          // Actualizar estado de la venta
          await updateDoc(doc(db, 'ventas', sale.id), {
            estado: 'approved',
            paymentId: paymentId,
            fechaAprobacion: new Date()
          })

          // Actualizar stock de productos
          await PaymentService.updateProductStock(
            sale.productos.map((p: any) => ({ id: p.id, cantidad: p.cantidad }))
          )

          // Limpiar carrito
          localStorage.removeItem('cart')
          
          setSaleData(sale)
        } else {
          setError('No se encontró la venta correspondiente')
        }
      } else {
        setError('Referencia de venta no encontrada')
      }
    } catch (error) {
      console.error('Error processing payment success:', error)
      setError('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Procesando pago...</p>
        </div>
      </div>
    )
  }

  if (error) {
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
                  0
                </span>
              </Link>
              <Link href="/admin-login" className="text-black hover:text-gray-700">
                <User className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto bg-white">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black mb-4">Error en el Pago</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                  <Link href="/carrito">Volver al Carrito</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/catalogo">Continuar Comprando</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
                0
              </span>
            </Link>
            <Link href="/admin-login" className="text-black hover:text-gray-700">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto bg-white">
          <CardContent className="p-8 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-4">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-6">
              Tu pago ha sido procesado correctamente. Te enviaremos un email con los detalles de tu compra.
            </p>
            
            {saleData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-black mb-2">Resumen de tu compra:</h3>
                <p className="text-sm text-gray-600">ID de venta: #{saleData.id.substring(0, 8)}</p>
                <p className="text-sm text-gray-600">Total: ${(saleData.total + saleData.costoEnvioTotal).toLocaleString('es-AR')}</p>
                <p className="text-sm text-gray-600">Productos: {saleData.productos.length}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                <Link href="/catalogo">Continuar Comprando</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Volver al Inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
