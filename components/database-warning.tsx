"use client"

import { AlertTriangle, Database, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DatabaseWarning() {
  const handleIncreaseData = () => {
    // Abrir Firebase Console en una nueva pestaña
    window.open("https://console.firebase.google.com/project/bartest-ea852/firestore", "_blank")
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg">
      <Alert className="border-0 bg-red-600 text-white">
        <AlertTriangle className="h-6 w-6 text-white" />
        <AlertDescription className="text-white">
          <div className="flex items-center justify-between py-2 px-4">
            <div className="flex items-center space-x-4">
              <Database className="h-8 w-8 text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  ⚠️ BASE DE DATOS LLENA - AUMENTAR CUPO URGENTE
                </h3>
                <p className="text-red-100 font-medium">
                  La tienda puede funcionar lentamente. Contacte al administrador inmediatamente.
                </p>
              </div>
            </div>
            <Button 
              onClick={handleIncreaseData}
              className="bg-white hover:bg-gray-100 text-red-600 font-bold px-6 py-2 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              AUMENTAR CUPO
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
