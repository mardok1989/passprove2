"use client"

import { useState } from "react"
import OCRUploader from "./OCRUploader"

export default function PassProveOCRDemo() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const apiKey = "demo_api_key" // V produkci by byl skutečný API klíč
  const sessionId = "demo-session-id" // V produkci by bylo skutečné ID relace

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PassProve OCR Demo</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <OCRUploader
          sessionId={sessionId}
          apiKey={apiKey}
          apiBaseUrl="https://hrtfjvhtpdxupcuyvutw.supabase.co/functions/v1"
          onSuccess={(data) => {
            setResult(data)
            setError(null)
          }}
          onError={(errorMsg) => {
            setError(errorMsg)
            setResult(null)
          }}
          onBack={() => {
            // V reálné aplikaci by zde byl návrat na předchozí krok
            console.log("Zpět")
          }}
        />
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Chyba:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-700 mb-2">Výsledek ověření:</h2>
          <pre className="bg-white p-4 rounded border overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

