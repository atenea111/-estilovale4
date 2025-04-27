"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Minus, Plus, RotateCw, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { initializeFirebase } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"

interface Product {
  id: string
  nombre: string
  precio: number
  descripcion: string
  imagen: string
  stock: boolean
  categorias: string[]
}

interface Category {
  id: string
  nombre: string
}

export default function ProductoDetalle() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [rotation, setRotation] = useState(0)

  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { db } = await initializeFirebase()

        // Fetch product
        const productDoc = doc(db, "productos", id as string)
        const productSnapshot = await getDoc(productDoc)

        if (!productSnapshot.exists()) {
          router.push("/catalogo")
          return
        }

        const productData = {
          id: productSnapshot.id,
          ...productSnapshot.data(),
        } as Product

        // Fetch categories
        const categoriesCollection = collection(db, "categorias")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[]

        setProduct(productData)
        setCategories(categoriesData)

        // Get cart count from localStorage
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        setCartCount(cart.length)
      } catch (error) {
        console.error("Error fetching data:", error)
        router.push("/catalogo")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleQuantityChange = (value: number) => {
    if (value < 1) return
    setQuantity(value)
  }

  const addToCart = () => {
    if (!product) return

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItemIndex = cart.findIndex((item: any) => item.id === product.id)

    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity
    } else {
      cart.push({
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
        quantity: quantity,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    setCartCount(cart.length)

    alert(
      `${quantity} ${quantity === 1 ? "unidad" : "unidades"} de ${product.nombre} ${quantity === 1 ? "agregada" : "agregadas"} al carrito`,
    )
  }

  const rotateImage = () => {
    setRotation((prev) => prev + 90)
    if (imageRef.current) {
      imageRef.current.style.transform = `rotate(${rotation + 90}deg)`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-black font-medium">Producto no encontrado</p>
          <Button onClick={() => router.push("/catalogo")} className="mt-4 bg-black text-white hover:bg-gray-800">
            Volver al catálogo
          </Button>
        </div>
      </div>
    )
  }

  const productCategories = categories.filter((category) => product.categorias?.includes(category.id))

  return (
    <div className="min-h-screen bg-[#F5D3EF]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F5D3EF] shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-black">
            Estilo Vale 4
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

      {/* Back to Catalog */}
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/catalogo")}
          className="flex items-center text-black hover:bg-white/20"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="flex flex-col items-center">
              <div className="relative w-full h-80 md:h-96 bg-white rounded-lg overflow-hidden transition-all duration-300">
                <img
                  ref={imageRef}
                  src={product.imagen || "/placeholder.svg?height=400&width=400"}
                  alt={product.nombre}
                  className="w-full h-full object-contain transition-transform duration-500"
                  style={{ transformOrigin: "center" }}
                />
                <Button
                  onClick={rotateImage}
                  size="icon"
                  className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white rounded-full"
                  title="Rotar imagen"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Haz clic en el botón para rotar la imagen</p>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-black mb-2">{product.nombre}</h1>

              <div className="flex items-center mb-4">
                {productCategories.map((category, index) => (
                  <span key={category.id} className="text-sm bg-[#F5D3EF] text-black px-2 py-1 rounded mr-2">
                    {category.nombre}
                  </span>
                ))}
              </div>

              <p className="text-3xl font-bold text-black mb-6">${product.precio.toLocaleString("es-AR")}</p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <p className="text-gray-700">{product.descripcion}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Disponibilidad</h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    product.stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock ? "En stock" : "Agotado"}
                </span>
              </div>

              {product.stock && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Cantidad</h3>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="mx-4 text-lg font-medium w-8 text-center">{quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity + 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button onClick={addToCart} className="bg-black text-white hover:bg-gray-800 mt-auto">
                    Agregar al carrito
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-10 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Estilo Vale 4</h3>
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
              <p className="text-gray-300">WhatsApp: 3412714029</p>
              <p className="text-gray-300 mt-2">Email: info@estilovale4.com</p>
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
