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
  estado: 'pending' | 'approved' | 'rejected' | 'cancelled'
  paymentId?: string
  externalReference?: string
  webhookProcessed?: boolean
  webhookProcessedAt?: Date
  fechaAprobacion?: Date
  fechaRechazo?: Date
  fechaPendiente?: Date
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
