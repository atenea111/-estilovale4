// Script para limpiar el carrito y permitir que se recargue con costoEnvio correcto
// Ejecutar en la consola del navegador

console.log('🧹 Limpiando carrito para recargar con costoEnvio correcto...')

// Limpiar el carrito del localStorage
localStorage.removeItem('cart')

console.log('✅ Carrito limpiado exitosamente')
console.log('📝 Ahora puedes agregar productos nuevamente y verás el costo de envío correcto')

// Opcional: recargar la página para ver el carrito vacío
// window.location.reload()
