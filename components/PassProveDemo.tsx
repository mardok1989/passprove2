"use client"

import { useState, useEffect } from "react"
import PassProveVerificationModal from "./PassProveVerificationModal"

export default function PassProveDemo() {
  const [showModal, setShowModal] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch the API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        // In a real application, you would have a way to identify the shop
        // For demo purposes, we'll use a fetch request to a server endpoint
        const response = await fetch("/api/get-shop-api-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // This could be a domain, shop ID, or other identifier
            identifier: window.location.hostname,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch API key")
        }

        const data = await response.json()
        setApiKey(data.apiKey)
      } catch (err) {
        console.error("Error fetching API key:", err)
        setError("Nepodařilo se načíst API klíč")
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiKey()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !apiKey) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h2 className="text-xl font-semibold mb-2">Chyba</h2>
        <p>{error || "Nepodařilo se načíst API klíč pro ověření věku."}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">PassProve Demo</h1>

      <p className="mb-6 text-gray-600">
        Toto je ukázková implementace ověření věku pomocí služby PassProve. Kliknutím na tlačítko níže otevřete modální
        okno pro ověření.
      </p>

      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Ověřit věk
        </button>
      </div>

      {verificationResult && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Výsledek ověření:</h2>
          <pre className="bg-white p-4 rounded border overflow-auto">{JSON.stringify(verificationResult, null, 2)}</pre>
        </div>
      )}

      {showModal && (
        <PassProveVerificationModal
          apiKey={apiKey}
          onClose={() => setShowModal(false)}
          onVerified={(result) => {
            setVerificationResult(result)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

