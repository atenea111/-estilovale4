"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Edit, Loader2, PlusCircle, Save, Trash2, X, Percent, Calendar, Users } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { AdminLayout } from "@/components/admin-layout"
import type { Coupon } from "@/lib/types"

export default function CuponesAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descuento: "",
    activo: true,
    limiteUsos: "",
    descripcion: "",
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      const couponsCollection = collection(db, "cupones")
      const couponsSnapshot = await getDocs(couponsCollection)
      const couponsData = couponsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          nombre: data.nombre || "",
          descuento: data.descuento || 0,
          activo: data.activo !== false,
          fechaCreacion: data.fechaCreacion ? new Date(data.fechaCreacion.seconds * 1000) : new Date(),
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento.seconds * 1000) : undefined,
          limiteUsos: data.limiteUsos || undefined,
          usosActuales: data.usosActuales || 0,
          descripcion: data.descripcion || "",
        }
      })

      setCoupons(couponsData)
    } catch (error) {
      console.error("Error fetching coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCoupon = () => {
    setSelectedCoupon(null)
    setFormData({
      nombre: "",
      descuento: "",
      activo: true,
      limiteUsos: "",
      descripcion: "",
    })
    setIsAddDialogOpen(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setFormData({
      nombre: coupon.nombre,
      descuento: coupon.descuento.toString(),
      activo: coupon.activo,
      limiteUsos: coupon.limiteUsos?.toString() || "",
      descripcion: coupon.descripcion || "",
    })
    setIsAddDialogOpen(true)
  }

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return

    try {
      setIsSubmitting(true)
      const { db } = await initializeFirebase()

      // Delete coupon completely from Firestore
      await deleteDoc(doc(db, "cupones", couponToDelete.id))

      // Update local state
      setCoupons(coupons.filter((c) => c.id !== couponToDelete.id))
      setIsDeleteDialogOpen(false)
      setCouponToDelete(null)
    } catch (error) {
      console.error("Error deleting coupon:", error)
      alert("Error al eliminar el cupón. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.descuento) {
      alert("Por favor complete todos los campos obligatorios")
      return
    }

    const descuento = parseFloat(formData.descuento)
    if (descuento < 0 || descuento > 100) {
      alert("El descuento debe estar entre 0 y 100")
      return
    }

    try {
      setIsSubmitting(true)
      const { db } = await initializeFirebase()

      const couponData = {
        nombre: formData.nombre.trim(),
        descuento: descuento,
        activo: formData.activo,
        // No incluir fechaVencimiento - los cupones no tienen vencimiento
        limiteUsos: formData.limiteUsos ? parseInt(formData.limiteUsos) : null,
        descripcion: formData.descripcion.trim(),
        fechaCreacion: selectedCoupon ? undefined : serverTimestamp(),
        usosActuales: selectedCoupon ? undefined : 0,
      }

      if (selectedCoupon) {
        // Update existing coupon
        await updateDoc(doc(db, "cupones", selectedCoupon.id), couponData)

        // Update local state
        setCoupons(
          coupons.map((c) =>
            c.id === selectedCoupon.id ? ({ ...c, ...couponData } as Coupon) : c,
          ),
        )
      } else {
        // Add new coupon
        const docRef = await addDoc(collection(db, "cupones"), couponData)

        // Update local state
        setCoupons([
          ...coupons,
          {
            ...couponData,
            id: docRef.id,
            fechaCreacion: new Date(),
            usosActuales: 0,
          } as Coupon,
        ])
      }

      setIsAddDialogOpen(false)
      setSelectedCoupon(null)
    } catch (error) {
      console.error("Error saving coupon:", error)
      alert("Error al guardar el cupón. Intente nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCouponStatusBadge = (coupon: Coupon) => {
    if (!coupon.activo) {
      return <Badge variant="secondary">Inactivo</Badge>
    }
    
    if (coupon.limiteUsos && coupon.usosActuales >= coupon.limiteUsos) {
      return <Badge variant="destructive">Agotado</Badge>
    }
    
    return <Badge variant="default">Activo</Badge>
  }

  // Filter coupons based on search term
  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AdminLayout activeSection="coupons">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Cupones</h2>
            <p className="text-gray-500">Administra los cupones de descuento</p>
          </div>
          <Button onClick={handleAddCoupon} className="bg-black text-white hover:bg-gray-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Cupón
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <Label htmlFor="search">Buscar cupones</Label>
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
            ) : filteredCoupons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay cupones disponibles.</p>
                <Button onClick={handleAddCoupon} variant="outline" className="mt-4">
                  Agregar un cupón
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descuento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{coupon.nombre}</div>
                            {coupon.descripcion && (
                              <div className="text-sm text-gray-500">{coupon.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 mr-1" />
                            {coupon.descuento}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCouponStatusBadge(coupon)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {coupon.usosActuales}
                            {coupon.limiteUsos && ` / ${coupon.limiteUsos}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {coupon.fechaCreacion.toLocaleDateString("es-AR")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCoupon(coupon)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleDeleteClick(coupon)}
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

      {/* Add/Edit Coupon Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? "Editar Cupón" : "Agregar Nuevo Cupón"}</DialogTitle>
            <DialogDescription>Complete los detalles del cupón de descuento.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-right">
                  Nombre del Cupón *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: DESCUENTO10"
                  required
                />
                <p className="text-xs text-gray-500">Este será el código que usarán los clientes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descuento" className="text-right">
                  Descuento (%) *
                </Label>
                <Input
                  id="descuento"
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-right">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del cupón..."
                  rows={2}
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="limiteUsos" className="text-right">
                  Límite de Usos
                </Label>
                <Input
                  id="limiteUsos"
                  type="number"
                  value={formData.limiteUsos}
                  onChange={(e) => setFormData({ ...formData, limiteUsos: e.target.value })}
                  placeholder="100"
                  min="1"
                />
                <p className="text-xs text-gray-500">Dejar vacío para uso ilimitado</p>
              </div>

              <div className="space-y-2">
                <Label className="text-right">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                  <span>{formData.activo ? "Activo" : "Inactivo"}</span>
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
              ¿Estás seguro de que deseas eliminar permanentemente el cupón "{couponToDelete?.nombre}"? 
              Esta acción no se puede deshacer y el cupón será eliminado completamente del sistema.
              {couponToDelete?.usosActuales > 0 && (
                <p className="mt-2 text-orange-600 font-medium">
                  ⚠️ Este cupón ha sido usado {couponToDelete.usosActuales} veces. 
                  El historial de usos se mantendrá pero el cupón ya no estará disponible.
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
                  Eliminar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
