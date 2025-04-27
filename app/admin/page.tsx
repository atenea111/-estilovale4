"use client"

import { useState, useEffect } from "react"
import { BarChart3, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { initializeFirebase } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { AdminLayout } from "@/components/admin-layout"
import { useRouter } from "next/navigation"

interface SalesData {
  id: string
  fecha: Date
  cliente: string
  total: number
  productos: any[]
  estado: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [recentSales, setRecentSales] = useState<SalesData[]>([])
  const [monthlySales, setMonthlySales] = useState<Record<string, { sales: number; revenue: number }>>({})

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { db } = await initializeFirebase()

      // Fetch products count
      const productsCollection = collection(db, "productos")
      const productsSnapshot = await getDocs(productsCollection)
      setTotalProducts(productsSnapshot.docs.length)

      // Fetch categories count
      const categoriesCollection = collection(db, "categorias")
      const categoriesSnapshot = await getDocs(categoriesCollection)
      setTotalCategories(categoriesSnapshot.docs.length)

      // Fetch sales data
      const salesCollection = collection(db, "ventas")
      const salesSnapshot = await getDocs(salesCollection)
      const salesData = salesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          cliente: data.cliente || "Cliente",
          total: data.total || 0,
          productos: data.productos || [],
          estado: data.estado || "Completado",
        }
      })

      // Calculate total sales and revenue
      const totalSalesCount = salesData.length
      const totalRevenueAmount = salesData.reduce((sum, sale) => sum + sale.total, 0)

      setTotalSales(totalSalesCount)
      setTotalRevenue(totalRevenueAmount)

      // Get recent sales
      const recentSalesQuery = query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(5))
      const recentSalesSnapshot = await getDocs(recentSalesQuery)
      const recentSalesData = recentSalesSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          fecha: data.fecha ? new Date(data.fecha.seconds * 1000) : new Date(),
          cliente: data.cliente || "Cliente",
          total: data.total || 0,
          productos: data.productos || [],
          estado: data.estado || "Completado",
        }
      })

      setRecentSales(recentSalesData)

      // Calculate monthly sales
      const monthlyData: Record<string, { sales: number; revenue: number }> = {}
      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]

      // Initialize all months with zero
      months.forEach((month) => {
        monthlyData[month] = { sales: 0, revenue: 0 }
      })

      // Populate with actual data
      salesData.forEach((sale) => {
        const month = months[sale.fecha.getMonth()]
        monthlyData[month].sales += 1
        monthlyData[month].revenue += sale.total
      })

      setMonthlySales(monthlyData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout activeSection="dashboard">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  // Convert monthly data to array for chart
  const salesDataArray = Object.entries(monthlySales).map(([month, data]) => ({
    month,
    sales: data.sales,
    revenue: data.revenue,
  }))

  return (
    <AdminLayout activeSection="dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
              <p className="text-xs text-gray-500">Ventas realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ingresos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString("es-AR")}</div>
              <p className="text-xs text-gray-500">Ingresos generados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-gray-500">Productos disponibles en la tienda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
              <p className="text-xs text-gray-500">Categorías disponibles en la tienda</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>Resumen de ventas e ingresos por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {totalSales > 0 ? (
                <SalesChart data={salesDataArray} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">No hay datos de ventas disponibles</p>
                  <p className="text-gray-400 text-sm text-center mt-2">
                    Las ventas se registrarán automáticamente cuando los clientes realicen pedidos por WhatsApp
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Ventas Recientes</CardTitle>
                <CardDescription>Los últimos pedidos realizados en la tienda</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/admin/ventas")} className="hidden sm:flex">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id.substring(0, 6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.cliente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.fecha.toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${sale.total.toLocaleString("es-AR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sale.estado === "Completado"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {sale.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No hay ventas registradas</h3>
                <p className="text-gray-500 mb-4">
                  Las ventas se registrarán automáticamente cuando los clientes realicen pedidos por WhatsApp
                </p>
                <Button variant="outline" onClick={() => router.push("/admin/productos")}>
                  Agregar productos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

function SalesChart({ data }: { data: { month: string; sales: number; revenue: number }[] }) {
  // Find the maximum revenue to scale the chart
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 10000)
  const maxSales = Math.max(...data.map((item) => item.sales), 10)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex">
        <div className="flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{Math.round(maxRevenue).toLocaleString("es-AR")}</span>
          <span>{Math.round(maxRevenue * 0.75).toLocaleString("es-AR")}</span>
          <span>{Math.round(maxRevenue * 0.5).toLocaleString("es-AR")}</span>
          <span>{Math.round(maxRevenue * 0.25).toLocaleString("es-AR")}</span>
          <span>0</span>
        </div>
        <div className="flex-1 flex items-end">
          {data.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex justify-center space-x-1">
                <div
                  className="w-5 bg-[#F5D3EF] rounded-t-sm"
                  style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                  title={`$${month.revenue.toLocaleString("es-AR")}`}
                ></div>
                <div
                  className="w-5 bg-black rounded-t-sm"
                  style={{ height: `${(month.sales / maxSales) * 100}%` }}
                  title={`${month.sales} ventas`}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-1">{month.month.substring(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#F5D3EF] rounded-sm mr-2"></div>
          <span className="text-sm">Ingresos (ARS)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-black rounded-sm mr-2"></div>
          <span className="text-sm">Ventas</span>
        </div>
      </div>
    </div>
  )
}

function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
