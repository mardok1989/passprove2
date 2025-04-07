"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import PassProveVerificationModal from "@/components/PassProveVerificationModal"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const apiKey = searchParams.get("apiKey")

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError("Chybí ID relace")
    }

    if (!apiKey) {
      setError("Chybí API klíč")
    }

    // Informujeme rodičovské okno, že jsme připraveni
    window.parent.postMessage({ type: "VERIFICATION_READY" }, "*")
  }, [sessionId, apiKey])

  // Funkce pro odeslání zprávy o dokončení ověření
  const handleVerificationComplete = (result: any) => {
    window.parent.postMessage(
      {
        type: "VERIFICATION_COMPLETE",
        data: result,
      },
      "*",
    )
  }

  // Funkce pro zavření modálního okna
  const handleClose = () => {
    window.parent.postMessage({ type: "CLOSE_MODAL" }, "*")
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Chyba</h2>
          <p>{error}</p>
          <button onClick={handleClose} className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Zavřít
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {sessionId && apiKey && (
        <PassProveVerificationModal
          sessionId={sessionId}
          apiKey={apiKey}
          onVerificationComplete={handleVerificationComplete}
          onClose={handleClose}
          isOpen={true}
        />
      )}
    </div>
  )
}

