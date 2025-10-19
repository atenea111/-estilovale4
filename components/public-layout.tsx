"use client"

import { DatabaseWarning } from "@/components/database-warning"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <DatabaseWarning />
      <div className="pt-16"> {/* Espacio para el cartel fijo */}
        {children}
      </div>
    </>
  )
}
