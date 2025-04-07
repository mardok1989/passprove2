"use client"

import { useState } from "react"

interface SaveReverificationMethodProps {
  sessionId: string
  apiKey: string
  apiBaseUrl: string
  onSuccess: (result: any) => void
  onError: (error: string) => void
  onBack: () => void
}

export default function SaveReverificationMethod({
  sessionId,
  apiKey,
  apiBaseUrl,
  onSuccess,
  onError,
  onBack,
}: SaveReverificationMethodProps) {
  const [method, setMethod] = useState<"email" | "phone">("email")
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"input" | "verify">("input")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    if (!identifier) return

    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/create-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          method,
          recipient: identifier,
        }),
      })

      const data = await response.json()

      if (data.error) {
        onError(data.error)
        setIsLoading(false)
        return
      }

      setStep("verify")
      setIsLoading(false)
    } catch (err) {
      onError("Nepodařilo se odeslat ověřovací kód")
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code) return

    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/validate-reverification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          code,
        }),
      })

      const data = await response.json()

      if (data.error) {
        onError(data.error)
        setIsLoading(false)
        return
      }

      // Uložení metody pro opakované ověření
      const saveResponse = await fetch(`${apiBaseUrl}/save-reverification-method`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          method,
          identifier,
        }),
      })

      const saveData = await saveResponse.json()

      if (saveData.error) {
        onError(saveData.error)
        setIsLoading(false)
        return
      }

      // Ověření pomocí uložené metody
      const verifyResponse = await fetch(`${apiBaseUrl}/verify-reverification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          method,
          identifier,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.error) {
        onError(verifyData.error)
        setIsLoading(false)
        return
      }

      onSuccess({
        isValid: true,
        isAdult: true,
        method,
        identifier,
      })
      setIsLoading(false)
    } catch (err) {
      onError("Nepodařilo se ověřit kód")
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium mb-4">Opakované ověření</h3>

      {step === "input" ? (
        <>
          <p className="mb-4 text-gray-600">
            Zadejte svůj e-mail nebo telefonní číslo pro ověření. Na tento kontakt vám zašleme ověřovací kód.
          </p>

          <div className="mb-4">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setMethod("email")}
                className={`flex-1 py-2 px-4 rounded-md ${
                  method === "email" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                E-mail
              </button>
              <button
                onClick={() => setMethod("phone")}
                className={`flex-1 py-2 px-4 rounded-md ${
                  method === "phone" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Telefon
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              {method === "email" ? "E-mailová adresa" : "Telefonní číslo"}
            </label>
            <input
              type={method === "email" ? "email" : "tel"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={method === "email" ? "vas@email.cz" : "+420 123 456 789"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Zpět
            </button>
            <button
              onClick={handleSendCode}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
              disabled={!identifier || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Odesílám...
                </span>
              ) : (
                "Odeslat ověřovací kód"
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-gray-600">
            Zadejte ověřovací kód, který jsme vám zaslali na {method === "email" ? "e-mail" : "telefon"} {identifier}.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ověřovací kód</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep("input")}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Zpět
            </button>
            <button
              onClick={handleVerifyCode}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
              disabled={!code || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Ověřuji...
                </span>
              ) : (
                "Ověřit kód"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

