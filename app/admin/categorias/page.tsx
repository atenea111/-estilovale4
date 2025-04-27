"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Edit, ImagePlus, Loader2, PlusCircle, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface Category {
  id: string
  nombre: string
  imagen: string
}

export default function CategoriasAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    imagen: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      const categoriesCollection = collection(db, "categorias")
      const categoriesSnapshot = await getDocs(categoriesCollection)
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[]

      setCategories(categoriesData)

      // Fetch product counts for each category
      const productsCollection = collection(db, "productos")
      const productsSnapshot = await getDocs(productsCollection)
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const counts: Record<string, number> = {}
      categoriesData.forEach((category) => {
        counts[category.id] = products.filter(
          (product: any) => product.categorias && product.categorias.includes(category.id),
        ).length
      })

      setProductCounts(counts)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setFormData({
      nombre: "",
      imagen: "",
    })
    setImageFile(null)
    setImagePreview(null)
    setIsAddDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      nombre: category.nombre,
      imagen: category.imagen || "",
    })
    setImagePreview(category.imagen || null)
    setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      // Delete category from Firestore
      await deleteDoc(doc(db, "categorias", categoryToDelete.id))

      // Delete image from Storage if it exists
      if (categoryToDelete.imagen && !categoryToDelete.imagen.includes("placeholder")) {
        try {
          const imageRef = ref(storage, `categorias/${categoryToDelete.id}`)
          await deleteObject(imageRef)
        } catch (error) {
          console.error("Error deleting image:", error)
        }
      }

      // Update local state
      setCategories(categories.filter((c) => c.id !== categoryToDelete.id))
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)

      // Update product counts
      const newCounts = { ...productCounts }
      delete newCounts[categoryToDelete.id]
      setProductCounts(newCounts)

      // Note: In a real app, you might want to update all products that have this category
      // to remove the category from their categorias array
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Error al eliminar la categoría. Intente nuevamente.")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert("Por favor ingrese un nombre para la categoría")
      return
    }

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      let imageUrl = formData.imagen

      // Upload image if a new one was selected
      if (imageFile) {
        const categoryId = selectedCategory?.id || `new_${Date.now()}`
        const storageRef = ref(storage, `categorias/${categoryId}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      const categoryData = {
        nombre: formData.nombre,
        imagen: imageUrl,
      }

      if (selectedCategory) {
        // Update existing category
        await updateDoc(doc(db, "categorias", selectedCategory.id), categoryData)

        // Update local state
        setCategories(categories.map((c) => (c.id === selectedCategory.id ? { ...c, ...categoryData } : c)))
      } else {
        // Add new category
        const docRef = await addDoc(collection(db, "categorias"), categoryData)

        // If we uploaded an image with a temporary ID, update the storage reference
        if (imageFile && imageUrl.includes("new_")) {
          const newStorageRef = ref(storage, `categorias/${docRef.id}`)
          await uploadBytes(newStorageRef, imageFile)
          const finalImageUrl = await getDownloadURL(newStorageRef)

          // Update the category with the final image URL
          await updateDoc(doc(db, "categorias", docRef.id), {
            imagen: finalImageUrl,
          })

          categoryData.imagen = finalImageUrl
        }

        // Update local state
        setCategories([...categories, { id: docRef.id, ...categoryData }])

        // Initialize product count for this category
        setProductCounts({
          ...productCounts,
          [docRef.id]: 0,
        })
      }

      setIsAddDialogOpen(false)
      setSelectedCategory(null)
      setCategoryName("")
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Error al guardar la categoría. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // For backward compatibility with existing code
  const [categoryName, setCategoryName] = useState("")

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) =>
    category.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout activeSection="categories">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
            <p className="text-gray-500">Administra las categorías de productos</p>
          </div>

          <Button onClick={handleAddCategory} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <Label htmlFor="search">Buscar categorías</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay categorías disponibles.</p>
                <Button onClick={handleAddCategory} variant="outline" className="mt-4">
                  Agregar una categoría
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
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-12 w-16 rounded overflow-hidden bg-gray-100">
                            <img
                              src={category.imagen || "/placeholder.svg?height=48&width=64"}
                              alt={category.nombre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {productCounts[category.id] || 0} productos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteClick(category)}
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Editar Categoría" : "Agregar Nueva Categoría"}</DialogTitle>
            <DialogDescription>Complete los detalles de la categoría a continuación.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la categoría"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right">Imagen</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-32 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
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
                          setFormData({ ...formData, imagen: "" })
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
              ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete?.nombre}"? Esta acción no se puede
              deshacer.
              {productCounts[categoryToDelete?.id || ""] > 0 && (
                <p className="mt-2 text-red-500">
                  Advertencia: Esta categoría está asignada a {productCounts[categoryToDelete?.id || ""]} productos. Al
                  eliminarla, se quitará de todos esos productos.
                </p>
              )}
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
