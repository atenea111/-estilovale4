"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Edit, ImagePlus, Loader2, PlusCircle, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { AdminLayout } from "@/components/admin-layout"

interface Testimonial {
  id: string
  nombre: string
  comentario: string
  imagen: string
  fecha: Date
}

export default function TestimoniosAdmin() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    comentario: "",
    imagen: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      const testimonialsCollection = collection(db, "testimonios")
      const testimonialsSnapshot = await getDocs(testimonialsCollection)
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
    } catch (error) {
      console.error("Error fetching testimonials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestimonial = () => {
    setSelectedTestimonial(null)
    setFormData({
      nombre: "",
      comentario: "",
      imagen: "",
    })
    setImageFile(null)
    setImagePreview(null)
    setIsAddDialogOpen(true)
  }

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial)
    setFormData({
      nombre: testimonial.nombre,
      comentario: testimonial.comentario,
      imagen: testimonial.imagen,
    })
    setImagePreview(testimonial.imagen)
    setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!testimonialToDelete) return

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      // Delete testimonial from Firestore
      await deleteDoc(doc(db, "testimonios", testimonialToDelete.id))

      // Delete image from Storage if it exists
      if (testimonialToDelete.imagen && !testimonialToDelete.imagen.includes("placeholder")) {
        try {
          const imageRef = ref(storage, `testimonios/${testimonialToDelete.id}`)
          await deleteObject(imageRef)
        } catch (error) {
          console.error("Error deleting image:", error)
        }
      }

      // Update local state
      setTestimonials(testimonials.filter((t) => t.id !== testimonialToDelete.id))
      setIsDeleteDialogOpen(false)
      setTestimonialToDelete(null)
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      alert("Error al eliminar el testimonio. Intente nuevamente.")
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

    if (!formData.nombre || !formData.comentario) {
      alert("Por favor complete todos los campos obligatorios")
      return
    }

    try {
      setIsSubmitting(true)
      const { db, storage } = await initializeFirebase()

      let imageUrl = formData.imagen

      // Upload image if a new one was selected
      if (imageFile) {
        const testimonialId = selectedTestimonial?.id || `new_${Date.now()}`
        const storageRef = ref(storage, `testimonios/${testimonialId}`)
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      const testimonialData = {
        nombre: formData.nombre,
        comentario: formData.comentario,
        imagen: imageUrl,
        fecha: serverTimestamp(),
      }

      if (selectedTestimonial) {
        // Update existing testimonial
        await updateDoc(doc(db, "testimonios", selectedTestimonial.id), testimonialData)

        // Update local state
        setTestimonials(
          testimonials.map((t) =>
            t.id === selectedTestimonial.id
              ? ({
                  ...testimonialData,
                  id: selectedTestimonial.id,
                  fecha: new Date(),
                } as Testimonial)
              : t,
          ),
        )
      } else {
        // Add new testimonial
        const docRef = await addDoc(collection(db, "testimonios"), testimonialData)

        // If we uploaded an image with a temporary ID, update the storage reference
        if (imageFile && imageUrl.includes("new_")) {
          const newStorageRef = ref(storage, `testimonios/${docRef.id}`)
          await uploadBytes(newStorageRef, imageFile)
          const finalImageUrl = await getDownloadURL(newStorageRef)

          // Update the testimonial with the final image URL
          await updateDoc(doc(db, "testimonios", docRef.id), {
            imagen: finalImageUrl,
          })

          testimonialData.imagen = finalImageUrl
        }

        // Update local state
        setTestimonials([
          ...testimonials,
          {
            ...testimonialData,
            id: docRef.id,
            fecha: new Date(),
          } as Testimonial,
        ])
      }

      setIsAddDialogOpen(false)
      setSelectedTestimonial(null)
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error saving testimonial:", error)
      alert("Error al guardar el testimonio. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter testimonials based on search term
  const filteredTestimonials = testimonials.filter(
    (testimonial) =>
      testimonial.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.comentario.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout activeSection="testimonials">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Testimonios</h2>
            <p className="text-gray-500">Administra los testimonios de clientes felices</p>
          </div>
          <Button onClick={handleAddTestimonial} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Testimonio
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <Label htmlFor="search">Buscar testimonios</Label>
              <Input
                id="search"
                placeholder="Buscar por nombre o comentario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTestimonials.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay testimonios disponibles.</p>
                <Button onClick={handleAddTestimonial} variant="outline" className="mt-4">
                  Agregar un testimonio
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTestimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 mr-4">
                          <img
                            src={testimonial.imagen || "/placeholder.svg?height=48&width=48"}
                            alt={testimonial.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-black">{testimonial.nombre}</h3>
                          <p className="text-xs text-gray-500">{testimonial.fecha.toLocaleDateString("es-AR")}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-3">{testimonial.comentario}</p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTestimonial(testimonial)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDeleteClick(testimonial)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Testimonial Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTestimonial ? "Editar Testimonio" : "Agregar Nuevo Testimonio"}</DialogTitle>
            <DialogDescription>Complete los detalles del testimonio a continuación.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-right">
                  Nombre del Cliente *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentario" className="text-right">
                  Comentario *
                </Label>
                <Textarea
                  id="comentario"
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Comentario del cliente"
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right">Imagen</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
              ¿Estás seguro de que deseas eliminar el testimonio de "{testimonialToDelete?.nombre}"? Esta acción no se
              puede deshacer.
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
