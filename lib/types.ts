// Tipos actualizados para el sistema de pagos y stock

export interface Product {
  id: string
  nombre: string
  precio: number
  descripcion: string
  imagen: string
  video?: string
  stock: boolean
  cantidadStock: number
  costoEnvio: number
  categorias: string[]
}

export interface Category {
  id: string
  nombre: string
  imagen: string
}

export interface CartItem {
  id: string
  nombre: string
  precio: number
  imagen: string
  cantidad: number
  costoEnvio: number
}

export interface Sale {
  id: string
  fecha: Date
  cliente: string
  email: string
  telefono: string
  direccion: string
  opcionEntrega: 'domicilio' | 'retiro'
  horarioEntrega?: string
  comentarios?: string
  total: number
  costoEnvioTotal: number
  productos: Array<{
    id: string
    nombre: string
    precio: number
    cantidad: number
    subtotal: number
    costoEnvio: number
  }>
  // Información del cupón aplicado
  cuponAplicado?: {
    codigo: string
    descuento: number
    montoDescuento: number
    montoOriginal: number
  }
  // Estados de pago (manejados por MercadoPago)
  estadoPago: 'pending' | 'approved' | 'rejected' | 'cancelled'
  // Estados de envío (manejados por el admin)
  estadoEnvio: 'pendiente_envio' | 'en_preparacion' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelled'
  paymentId?: string
  externalReference?: string
  webhookProcessed?: boolean
  webhookProcessedAt?: Date
  // Fechas de estados de pago
  fechaAprobacion?: Date
  fechaRechazo?: Date
  fechaPendiente?: Date
  // Fechas de estados de envío
  fechaEnPreparacion?: Date
  fechaListoEntrega?: Date
  fechaEnCamino?: Date
  fechaEntregado?: Date
  mensajeAdmin?: string
  administrador?: string
}

export interface StockMovement {
  id: string
  productId: string
  cantidad: number
  tipo: 'venta' | 'ajute' | 'entrada'
  stockAnterior: number
  stockNuevo: number
  fecha: Date
  usuario: string
  ventaId?: string
}

export interface Testimonial {
  id: string
  nombre: string
  comentario: string
  imagen: string
  fecha: Date
}

// Tipos para el sistema de pagos
export interface PaymentItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id: 'ARS'
}

export interface PaymentPreference {
  items: PaymentItem[]
  payer: {
    email: string
    name?: string
    surname?: string
    phone?: {
      area_code: string
      number: string
    }
  }
  auto_return: 'approved' | 'all'
  external_reference?: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  status?: string
  error?: string
}

// Tipos para validación de stock
export interface StockValidationError {
  productId: string
  productName: string
  requested: number
  available: number
}

export interface StockValidationResult {
  valid: boolean
  errors: StockValidationError[]
}

// Tipos para el formulario de datos del cliente
export interface CustomerFormData {
  nombre: string
  email: string
  telefono: string
  direccion: string
  opcionEntrega: 'domicilio' | 'retiro'
  horarioEntrega?: string
  comentarios?: string
}

export interface CustomerFormErrors {
  nombre?: string
  email?: string
  telefono?: string
  direccion?: string
  opcionEntrega?: string
  horarioEntrega?: string
}

// Tipos para cupones de descuento
export interface Coupon {
  id: string
  nombre: string
  descuento: number // Porcentaje de descuento (0-100)
  activo: boolean
  fechaCreacion: Date
  fechaVencimiento?: Date
  limiteUsos?: number
  usosActuales: number
  descripcion?: string
}

export interface CouponUsage {
  id: string
  couponId: string
  saleId: string
  cliente: string
  fechaUso: Date
  descuentoAplicado: number
  montoOriginal: number
  montoDescuento: number
}