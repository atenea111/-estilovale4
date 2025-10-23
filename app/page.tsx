"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Instagram, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore"

interface Category {
  id: string
  nombre: string
  imagen: string
}

interface Product {
  id: string
  nombre: string
  precio: number
  descripcion: string
  imagen: string
  stock: boolean
  categorias: string[]
}

interface Testimonial {
  id: string
  nombre: string
  comentario: string
  imagen: string
  fecha: Date
}

export default function Home() {
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { db } = await initializeFirebase()

        // Fetch categories
        const categoriesCollection = collection(db, "categorias")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[]

        // Get up to 3 categories
        setFeaturedCategories(categoriesData.slice(0, 3))

        // Fetch featured products (limit to 4)
        const productsQuery = query(collection(db, "productos"), limit(4))
        const productsSnapshot = await getDocs(productsQuery)
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]

        setFeaturedProducts(productsData)

        // Fetch testimonials
        const testimonialsQuery = query(collection(db, "testimonios"), orderBy("fecha", "desc"), limit(3))
        const testimonialsSnapshot = await getDocs(testimonialsQuery)
        const testimonialsData = testimonialsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            nombre: data.nombre || "",
            comentario: data.comentario || "",
            imagen: data.imagen || "",
            fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          }
        })

        setTestimonials(testimonialsData)

        // Get cart count from localStorage
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")
        setCartCount(cart.length)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

      {/* Hero Section */}
      <section className="py-16 bg-[#F5D3EF]">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">Descubre tu estilo en Estilo Vale 4</h1>
            <p className="text-lg text-gray-800 mb-8">
              Encuentra las últimas tendencias y los mejores productos para expresar tu personalidad.
            </p>
            <Link href="/catalogo">
              <Button className="bg-black text-white hover:bg-gray-800">Ver Catálogo</Button>
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-80 h-80 bg-white rounded-full shadow-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/images/logo.png" alt="Estilo Vale 4" className="object-contain w-64 h-64" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Categorías Destacadas</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : featuredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay categorías disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  title={category.nombre}
                  image={category.imagen || "/placeholder.svg?height=200&width=300"}
                  link={`/catalogo?categoria=${category.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[#F5D3EF]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Productos Destacados</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay productos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.nombre}
                  price={product.precio}
                  image={product.imagen || "/placeholder.svg?height=300&width=300"}
                  id={product.id}
                />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/catalogo">
              <Button className="bg-black text-white hover:bg-gray-800">Ver Todos los Productos</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Clientes Felices</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay testimonios disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  name={testimonial.nombre}
                  comment={testimonial.comentario}
                  image={testimonial.imagen}
                />
              ))}
            </div>
          )}
        </div>
      </section>

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

function CategoryCard({ title, image, link }: { title: string; image: string; link: string }) {
  return (
    <Link href={link}>
      <Card className="overflow-hidden transition-transform hover:scale-105">
        <div className="h-48 overflow-hidden">
          <img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        </div>
        <CardContent className="p-4 bg-white">
          <h3 className="text-xl font-semibold text-center text-black">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}

function ProductCard({ name, price, image, id }: { name: string; price: number; image: string; id: string }) {
  return (
    <Link href={`/producto/${id}`}>
      <Card className="overflow-hidden transition-transform hover:scale-105">
        <div className="h-64 overflow-hidden bg-white p-4">
          <img src={image || "/placeholder.svg"} alt={name} className="w-full h-full object-contain" />
        </div>
        <CardContent className="p-4 bg-white">
          <h3 className="text-lg font-semibold text-black mb-2">{name}</h3>
          <p className="text-black font-bold">${price.toLocaleString("es-AR")}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function TestimonialCard({ name, comment, image }: { name: string; comment: string; image: string }) {
  return (
    <Card className="overflow-hidden transition-transform hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 mr-4">
            <img
              src={image || "/placeholder.svg?height=48&width=48"}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-semibold text-black">{name}</h3>
        </div>
        <p className="text-gray-700">{comment}</p>
      </CardContent>
    </Card>
  )
}
