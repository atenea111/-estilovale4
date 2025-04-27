"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Filter, Instagram, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

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
  imagen: string
}

export default function Catalogo() {
  const searchParams = useSearchParams()
  const categoriaParam = searchParams.get("categoria")

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoriaParam ? [categoriaParam] : [])
  const [searchTerm, setSearchTerm] = useState("")
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { db } = await initializeFirebase()

        // Fetch products
        const productsCollection = collection(db, "productos")
        const productsSnapshot = await getDocs(productsCollection)
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]

        // Fetch categories
        const categoriesCollection = collection(db, "categorias")
        const categoriesSnapshot = await getDocs(categoriesCollection)
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[]

        setProducts(productsData)
        setCategories(categoriesData)

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

  // Filter products based on selected categories and search term
  const filteredProducts = products.filter((product) => {
    const matchesCategories =
      selectedCategories.length === 0 || product.categorias?.some((cat) => selectedCategories.includes(cat))

    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategories && matchesSearch
  })

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Cargando productos...</p>
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
                {cartCount}
              </span>
            </Link>
            <Link href="/admin-login" className="text-black hover:text-gray-700">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>

      {/* Catalog Section */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">Catálogo de Productos</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar Productos
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Filtra los productos por categoría</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Categorías</h3>
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryChange(category.id)}
                        />
                        <Label htmlFor={`mobile-category-${category.id}`} className="flex items-center gap-2">
                          {category.imagen && (
                            <div className="h-6 w-6 rounded overflow-hidden">
                              <img
                                src={category.imagen || "/placeholder.svg"}
                                alt={category.nombre}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          {category.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24">
            <h2 className="text-xl font-semibold mb-4 text-black">Filtros</h2>

            <div className="mb-6">
              <h3 className="font-medium mb-2 text-black">Buscar</h3>
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <h3 className="font-medium mb-2 text-black">Categorías</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryChange(category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="flex items-center gap-2">
                      {category.imagen && (
                        <div className="h-6 w-6 rounded overflow-hidden">
                          <img
                            src={category.imagen || "/placeholder.svg"}
                            alt={category.nombre}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {category.nombre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <h3 className="text-xl font-medium text-gray-700">No se encontraron productos</h3>
                <p className="text-gray-500 mt-2">Intenta con otros filtros o categorías</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
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

function ProductCard({ product }: { product: Product }) {
  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cart.find((item: any) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
        quantity: 1,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cart))

    // Update cart count in UI
    const cartCountElement = document.querySelector(".cart-count")
    if (cartCountElement) {
      cartCountElement.textContent = cart.length.toString()
    }

    alert("Producto agregado al carrito")
  }

  return (
    <Card className="overflow-hidden transition-transform hover:scale-105">
      <Link href={`/producto/${product.id}`}>
        <div className="h-64 overflow-hidden bg-white p-4">
          <img
            src={product.imagen || "/placeholder.svg?height=300&width=300"}
            alt={product.nombre}
            className="w-full h-full object-contain"
          />
        </div>
      </Link>
      <CardContent className="p-4 bg-white">
        <Link href={`/producto/${product.id}`}>
          <h3 className="text-lg font-semibold text-black mb-2">{product.nombre}</h3>
        </Link>
        <p className="text-black font-bold mb-3">${product.precio.toLocaleString("es-AR")}</p>
        <div className="flex justify-between items-center">
          <span
            className={`text-xs px-2 py-1 rounded ${product.stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {product.stock ? "En stock" : "Agotado"}
          </span>
          <Button
            onClick={addToCart}
            disabled={!product.stock}
            size="sm"
            className="bg-black text-white hover:bg-gray-800"
          >
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
