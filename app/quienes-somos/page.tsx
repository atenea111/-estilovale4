"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Instagram, ShoppingBag, User } from "lucide-react"

export default function QuienesSomos() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Get cart count from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    setCartCount(cart.length)
  }, [])

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
                {cartCount}
              </span>
            </Link>
            <Link href="/admin-login" className="text-black hover:text-gray-700">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* About Us Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-black mb-8 text-center">Quiénes Somos</h1>

          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <img src="/images/logo.png" alt="Estilo Vale 4" className="rounded-lg w-full h-auto max-w-xs mx-auto" />
              </div>
              <div className="md:w-1/2">
                <div className="prose max-w-none">
                  <p className="text-gray-700 mb-4">Hola soy valeria y soy creadora de ESTILOVALE4.</p>
                  <p className="text-gray-700 mb-4">
                    Hace 2 años decidí crear un espacio de ventas de carteras, bolsos y mucho más.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Amo las carteras, la convinacion y amo lo q hago. Brindo diseños únicos y de excelente calidad para
                    lucirte día a día.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Mi objetivo es seguir creciendo e innovando constantemente y adaptándome a un publico cada vez más
                    exigente que encuentre esta tienda online, el asesoramiento y variedad en producto.
                  </p>
                  <p className="text-gray-700 font-semibold">Gracias por confiar y ser parte de estilovale4</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <h3 className="text-xl font-semibold text-black mb-4">Síguenos en Instagram</h3>
              <Link
                href="https://www.instagram.com/estilovale4/?igsh=eWF5eW5rMTBtZXd1#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
              >
                <Instagram className="h-5 w-5" />
                @estilovale4
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-10">
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
