"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Edit, ImagePlus, Loader2, PlusCircle, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { AdminLayout } from "@/components/admin-layout"

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

export default function ProductosAdmin() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    imagen: "",
    stock: true,
    categorias: [] as string[],
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      const productsCollection = collection(db, "productos")
      const productsSnapshot = await getDocs(productsCollection)
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { db } = await initializeFirebase()

      const categoriesCollection = collection(db, "categorias")
      const categoriesSnapshot = await getDocs(categoriesCollection)
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[]

      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setFormData({
      nombre: "",
      precio: "",
      descripcion: "",
      imagen: "",
      stock: true,
      categorias: [],
    })
    setImageFile(null)
    setImagePreview(null)
    setIsAddDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      nombre: product.nombre,
      precio: product.precio.toString(),
      descripcion: product.descripcion,
      imagen: product.imagen,
      stock: product.stock,
      categorias: product.categorias || [],
    })
    setImagePreview(product.imagen)
    setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      // Delete product from Firestore
      await deleteDoc(doc(db, "productos", productToDelete.id))

      // Delete image from Storage if it exists
      if (productToDelete.imagen && !productToDelete.imagen.includes("placeholder")) {
        try {
          const imageRef = ref(storage, `productos/${productToDelete.id}`)
          await deleteObject(imageRef)
        } catch (error) {
          console.error("Error deleting image:", error)
        }
      }

      // Update local state
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Error al eliminar el producto. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => {
      const categorias = prev.categorias.includes(categoryId)
        ? prev.categorias.filter((id) => id !== categoryId)
        : [...prev.categorias, categoryId]

      return { ...prev, categorias }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.precio || !formData.descripcion) {
      alert("Por favor complete todos los campos obligatorios")
      return
    }

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      let imageUrl = formData.imagen

      // Upload image if a new one was selected
      if (imageFile) {
        const productId = selectedProduct?.id || `new_${Date.now()}`
        const storageRef = ref(storage, `productos/${productId}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      const productData = {
        nombre: formData.nombre,
        precio: Number.parseFloat(formData.precio),
        descripcion: formData.descripcion,
        imagen: imageUrl,
        stock: formData.stock,
        categorias: formData.categorias,
      }

      if (selectedProduct) {
        // Update existing product
        await updateDoc(doc(db, "productos", selectedProduct.id), productData)

        // Update local state
        setProducts(
          products.map((p) =>
            p.id === selectedProduct.id ? ({ ...productData, id: selectedProduct.id } as Product) : p,
          ),
        )
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, "productos"), productData)

        // If we uploaded an image with a temporary ID, update the storage reference
        if (imageFile && imageUrl.includes("new_")) {
          const newStorageRef = ref(storage, `productos/${docRef.id}`)
          await uploadBytes(newStorageRef, imageFile)
          const finalImageUrl = await getDownloadURL(newStorageRef)

          // Update the product with the final image URL
          await updateDoc(doc(db, "productos", docRef.id), {
            imagen: finalImageUrl,
          })

          productData.imagen = finalImageUrl
        }

        // Update local state
        setProducts([...products, { ...productData, id: docRef.id } as Product])
      }

      setIsAddDialogOpen(false)
      setSelectedProduct(null)
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Error al guardar el producto. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout activeSection="products">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <p className="text-gray-500">Administra los productos de tu tienda</p>
          </div>
          <Button onClick={handleAddProduct} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <Label htmlFor="search">Buscar productos</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay productos disponibles.</p>
                <Button onClick={handleAddProduct} variant="outline" className="mt-4">
                  Agregar un producto
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imagen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorías
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={product.imagen || "/placeholder.svg?height=40&width=40"}
                              alt={product.nombre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${product.precio.toLocaleString("es-AR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock ? "En stock" : "Agotado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.categorias
                            ?.map((catId) => {
                              const category = categories.find((c) => c.id === catId)
                              return category ? category.nombre : ""
                            })
                            .filter(Boolean)
                            .join(", ") || "Sin categoría"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
            <DialogDescription>Complete los detalles del producto a continuación.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-right">
                    Nombre *
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio" className="text-right">
                    Precio *
                  </Label>
                  <Input
                    id="precio"
                    type="number"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-right">
                  Descripción *
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right">Imagen</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Seleccionar imagen
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-red-600 hover:text-red-800"
                        onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Formatos recomendados: JPG, PNG. Tamaño máximo: 5MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right">Disponibilidad</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.stock}
                    onCheckedChange={(checked) => setFormData({ ...formData, stock: checked })}
                  />
                  <span>{formData.stock ? "En stock" : "Agotado"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right">Categorías</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-2">
                      No hay categorías disponibles.
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          router.push("/admin/categorias")
                        }}
                      >
                        Agregar categorías
                      </Button>
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={formData.categorias.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm">
                          {category.nombre}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.nombre}"? Esta acción no se puede
              deshacer.
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
