"use client"

import { useState } from "react"
import { Percent, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CouponService } from "@/lib/coupon-service"
import type { Coupon } from "@/lib/types"

interface CouponFormProps {
  onCouponApplied: (coupon: Coupon, discount: number) => void
  onCouponRemoved: () => void
  appliedCoupon?: Coupon
  discountAmount?: number
  totalAmount: number
}

export function CouponForm({ 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon, 
  discountAmount = 0,
  totalAmount 
}: CouponFormProps) {
  const [couponCode, setCouponCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Por favor ingresa un código de cupón")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      const validation = await CouponService.validateCoupon(couponCode.trim())
      
      if (!validation.valid) {
        setError(validation.error || "Cupón no válido")
        return
      }

      if (!validation.coupon) {
        setError("Cupón no encontrado")
        return
      }

      const discount = (totalAmount * validation.coupon.descuento) / 100
      onCouponApplied(validation.coupon, discount)
      setCouponCode("")
    } catch (error) {
      console.error("Error applying coupon:", error)
      setError("Error al aplicar el cupón")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved()
    setCouponCode("")
    setError("")
  }

  return (
    <Card className="bg-white shadow-sm border-0">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Percent className="h-4 w-4 text-purple-600" />
          </div>
          Cupón de Descuento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!appliedCoupon ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="coupon-code" className="text-sm font-medium text-gray-700">
                Código del cupón
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="coupon-code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ej: DESCUENTO10"
                  className="flex-1"
                  disabled={isValidating}
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !couponCode.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Aplicar"
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-gray-500">
              Ingresa el código de tu cupón para obtener un descuento en tu compra.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-semibold mb-1">¡Cupón aplicado exitosamente!</div>
                <div className="text-sm">
                  <strong>{appliedCoupon.nombre}</strong> - {appliedCoupon.descuento}% de descuento
                </div>
                {appliedCoupon.descripcion && (
                  <div className="text-sm mt-1">{appliedCoupon.descripcion}</div>
                )}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Descuento aplicado:</span>
                <span className="text-lg font-bold text-green-600">
                  -${discountAmount.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            <Button
              onClick={handleRemoveCoupon}
              variant="outline"
              className="w-full text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Quitar cupón
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
