"use client"

import { AlertTriangle, Database, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DatabaseAlert() {
  const handleIncreaseData = () => {
    // Abrir Firebase Console en una nueva pestaña
    window.open("https://console.firebase.google.com/project/bartest-ea852/firestore", "_blank")
  }

  return (
    <div className="mb-6">
      <Alert className="border-red-500 bg-red-50 border-2">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-red-800">
                  BASES DE DATOS AL 100% DE DATOS
                </h3>
                <p className="text-red-700 font-medium">
                  Por favor renovar o aumentar los datos
                </p>
              </div>
            </div>
            <Button 
              onClick={handleIncreaseData}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 text-lg"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              AUMENTAR DATOS
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
