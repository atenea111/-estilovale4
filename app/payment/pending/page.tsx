"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Clock, Instagram, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { initializeFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { PublicLayout } from "@/components/public-layout"

function PaymentPendingContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paymentId && externalReference) {
      handlePaymentPending()
    } else {
      setLoading(false)
    }
  }, [paymentId, externalReference])

  const handlePaymentPending = async () => {
    try {
      // Buscar la venta por external_reference y actualizar estado
      if (externalReference) {
        const { db } = await initializeFirebase()
        const salesRef = collection(db, 'ventas')
        const q = query(salesRef, where('externalReference', '==', externalReference))
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const saleDoc = querySnapshot.docs[0]
          
          // Actualizar estado de la venta a pendiente
          await updateDoc(doc(db, 'ventas', saleDoc.id), {
            estado: 'pending',
            paymentId: paymentId,
            fechaPendiente: serverTimestamp()
          })
        }
      }
    } catch (error) {
      console.error('Error processing payment pending:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Procesando...</p>
        </div>
      </div>
    )
  }

  return (
    <PublicLayout>
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
            <div className="text-yellow-500 mb-4">
              <Clock className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-4">Pago Pendiente</h1>
            <p className="text-gray-600 mb-6">
              Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos cuando se complete.
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-black mb-2">¿Qué significa esto?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tu pago está siendo verificado</li>
                <li>• Puede tomar hasta 24 horas</li>
                <li>• Te enviaremos un email cuando se complete</li>
                <li>• Tu pedido está reservado</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                <Link href="/catalogo">Continuar Comprando</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Volver al Inicio</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="https://wa.me/5493415496064" target="_blank">
                  Contactar por WhatsApp
                </Link>
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
    </PublicLayout>
  )
}

export default function PaymentPending() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  )
}
