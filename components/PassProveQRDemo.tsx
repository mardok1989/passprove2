"use client"

import { useState, useEffect } from "react"
import QRCodeDisplay from "./QRCodeDisplay"

export default function PassProveQRDemo() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const apiKey = "demo_api_key" // V produkci by byl skutečný API klíč
  const sessionId = "demo-session-id" // V produkci by bylo skutečné ID relace

  useEffect(() => {
    const createQrCode = async () => {
      try {
        // Simulace API volání pro vytvoření QR kódu
        // V reálné aplikaci by zde bylo skutečné API volání
        setTimeout(() => {
          setQrUrl("https://app.passprove.com/verify/qr/demo-token")
          setIsLoading(false)
        }, 1000)
      } catch (err) {
        setError("Nepodařilo se vytvořit QR kód")
        setIsLoading(false)
      }
    }

    createQrCode()
  }, [apiKey, sessionId])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PassProve QR Demo</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-gray-600">Načítání QR kódu...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Chyba</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : qrUrl ? (
          <QRCodeDisplay
            qrUrl={qrUrl}
            onBack={() => {
              // V reálné aplikaci by zde byl návrat na předchozí krok
              console.log("Zpět")
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

