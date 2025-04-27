"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Heart, Home, LogOut, Package, ShoppingBag, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
  activeSection: string
}

interface AdminAuth {
  isAdmin: boolean
  email: string
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection }) => {
  const router = useRouter()
  const [adminAuth, setAdminAuth] = useState<AdminAuth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated as admin
    const checkAuth = () => {
      const auth = localStorage.getItem("adminAuth")
      if (!auth) {
        router.push("/admin-login")
        return
      }

      try {
        const parsedAuth = JSON.parse(auth) as AdminAuth
        if (!parsedAuth.isAdmin) {
          router.push("/admin-login")
          return
        }

        setAdminAuth(parsedAuth)
        setLoading(false)
      } catch (error) {
        console.error("Error parsing auth data:", error)
        router.push("/admin-login")
        return
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin-login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5D3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F5D3EF] flex">
        {/* Sidebar */}
        <Sidebar className="bg-white border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center">
              <img src="/images/logo.png" alt="Estilo Vale 4" className="h-8 mr-2" />
              <h1 className="text-xl font-bold">Estilo Vale 4</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Panel de Administración</p>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/admin")} isActive={activeSection === "dashboard"}>
                  <BarChart3 className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/admin/productos")}
                  isActive={activeSection === "products"}
                >
                  <Package className="h-5 w-5" />
                  <span>Productos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/admin/categorias")}
                  isActive={activeSection === "categories"}
                >
                  <Tag className="h-5 w-5" />
                  <span>Categorías</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/admin/ventas")} isActive={activeSection === "orders"}>
                  <ShoppingBag className="h-5 w-5" />
                  <span>Ventas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/admin/testimonios")}
                  isActive={activeSection === "testimonials"}
                >
                  <Heart className="h-5 w-5" />
                  <span>Testimonios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push("/")}>
                  <Home className="h-5 w-5" />
                  <span>Ver Tienda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{adminAuth?.email}</p>
                <p className="text-sm text-gray-500">Administrador</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-bold">
                {activeSection === "dashboard" && "Dashboard"}
                {activeSection === "products" && "Gestión de Productos"}
                {activeSection === "categories" && "Gestión de Categorías"}
                {activeSection === "orders" && "Gestión de Ventas"}
                {activeSection === "testimonials" && "Gestión de Testimonios"}
              </h1>
            </div>
            <div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
