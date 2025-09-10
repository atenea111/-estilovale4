"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User, Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react"
import type { CustomerFormData, CustomerFormErrors } from "@/lib/types"

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void
  loading?: boolean
  initialData?: Partial<CustomerFormData>
  onFormChange?: (isValid: boolean, data: CustomerFormData) => void
}

export function CustomerForm({ onSubmit, loading = false, initialData, onFormChange }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    nombre: initialData?.nombre || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    direccion: initialData?.direccion || "",
    opcionEntrega: initialData?.opcionEntrega || "domicilio",
    horarioEntrega: initialData?.horarioEntrega || "",
    comentarios: initialData?.comentarios || ""
  })

  const [errors, setErrors] = useState<CustomerFormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: CustomerFormErrors = {}

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres"
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    // Validar teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio"
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono no es válido"
    }

    // Validar dirección (solo obligatoria si es entrega a domicilio)
    if (formData.opcionEntrega === "domicilio") {
      if (!formData.direccion.trim()) {
        newErrors.direccion = "La dirección es obligatoria para entrega a domicilio"
      } else if (formData.direccion.trim().length < 10) {
        newErrors.direccion = "La dirección debe ser más específica"
      }
    }

    // Validar horario si es entrega a domicilio
    if (formData.opcionEntrega === "domicilio" && !formData.horarioEntrega) {
      newErrors.horarioEntrega = "Debe seleccionar un horario de entrega"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    const newData = { ...formData, [field]: value }
    
    // Si cambia la opción de entrega a "retiro", establecer la dirección del local
    if (field === "opcionEntrega" && value === "retiro") {
      newData.direccion = "Manuel García 1867, Piso 01, Dep 08"
    }
    
    setFormData(newData)
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as keyof CustomerFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Validar formulario en tiempo real y notificar al componente padre
  useEffect(() => {
    const isValid = validateForm()
    if (onFormChange) {
      onFormChange(isValid, formData)
    }
  }, [formData, onFormChange])

  const horariosDisponibles = [
    "Lunes 9:00 - 12:00 hs",
    "Lunes 14:00 - 18:00 hs",
    "Martes 9:00 - 12:00 hs",
    "Martes 14:00 - 18:00 hs",
    "Miércoles 9:00 - 12:00 hs",
    "Miércoles 14:00 - 18:00 hs",
    "Jueves 9:00 - 12:00 hs",
    "Jueves 14:00 - 18:00 hs",
    "Viernes 9:00 - 12:00 hs",
    "Viernes 14:00 - 18:00 hs",
    "Viernes 18:00 - 20:00 hs",
    "Sábado 9:00 - 13:00 hs"
  ]

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center text-black">
          <User className="h-5 w-5 mr-2" />
          Datos de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-black font-medium">
              Nombre completo *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="nombre"
                type="text"
                placeholder="Ingresa tu nombre completo"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                className={`pl-10 ${errors.nombre ? "border-red-500" : ""}`}
                disabled={loading}
              />
            </div>
            {errors.nombre && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.nombre}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-black font-medium">
              Email *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.email}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-black font-medium">
              Teléfono *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="telefono"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                className={`pl-10 ${errors.telefono ? "border-red-500" : ""}`}
                disabled={loading}
              />
            </div>
            {errors.telefono && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.telefono}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-black font-medium">
              {formData.opcionEntrega === "domicilio" ? "Dirección completa *" : "Dirección de entrega"}
            </Label>
            {formData.opcionEntrega === "retiro" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">Retiro en local</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Manuel García 1867, Piso 01, Dep 08
                    </p>
                    <p className="text-blue-600 text-xs mt-2">
                      Te contactaremos para coordinar el retiro
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="direccion"
                  placeholder="Calle, número, barrio, ciudad, código postal"
                  value={formData.direccion}
                  onChange={(e) => handleInputChange("direccion", e.target.value)}
                  className={`pl-10 min-h-[80px] ${errors.direccion ? "border-red-500" : ""}`}
                  disabled={loading}
                />
              </div>
            )}
            {errors.direccion && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {errors.direccion}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Opción de entrega */}
          <div className="space-y-3">
            <Label className="text-black font-medium">Opción de entrega *</Label>
            <RadioGroup
              value={formData.opcionEntrega}
              onValueChange={(value) => handleInputChange("opcionEntrega", value)}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="domicilio" id="domicilio" />
                <Label htmlFor="domicilio" className="text-black">Entrega a domicilio</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="retiro" id="retiro" />
                <Label htmlFor="retiro" className="text-black">Retiro en local</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Horario de entrega (solo si es domicilio) */}
          {formData.opcionEntrega === "domicilio" && (
            <div className="space-y-2">
              <Label htmlFor="horarioEntrega" className="text-black font-medium">
                Horario de entrega *
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.horarioEntrega}
                  onValueChange={(value) => handleInputChange("horarioEntrega", value)}
                  disabled={loading}
                >
                  <SelectTrigger className={`pl-10 ${errors.horarioEntrega ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponibles.map((horario) => (
                      <SelectItem key={horario} value={horario}>
                        {horario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.horarioEntrega && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {errors.horarioEntrega}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Comentarios */}
          <div className="space-y-2">
            <Label htmlFor="comentarios" className="text-black font-medium">
              Comentarios adicionales
            </Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="comentarios"
                placeholder="Instrucciones especiales, referencias, etc. (opcional)"
                value={formData.comentarios}
                onChange={(e) => handleInputChange("comentarios", e.target.value)}
                className="pl-10 min-h-[80px]"
                disabled={loading}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
