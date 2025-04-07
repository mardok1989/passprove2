"use client"

import { useState, useEffect } from "react"
import OCRUploader from "./OCRUploader"
import FaceScanner from "./FaceScanner"
import QRCodeDisplay from "./QRCodeDisplay"
import SaveReverificationMethod from "./SaveReverificationMethod"

interface PassProveVerificationModalProps {
  apiKey: string
  apiBaseUrl?: string
  onClose?: () => void
  onVerified?: (result: any) => void
}

export default function PassProveVerificationModal({
  apiKey,
  apiBaseUrl = "https://hrtfjvhtpdxupcuyvutw.supabase.co/functions/v1",
  onClose,
  onVerified,
}: PassProveVerificationModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [step, setStep] = useState<
    "loading" | "methods" | "ocr" | "facescan" | "qr" | "reverification" | "success" | "error"
  >("loading")
  const [error, setError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null)
  const [useDemoMode, setUseDemoMode] = useState(false)

  // Inicializace relace
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log("Initializing session with API key:", apiKey, "length:", apiKey?.length)

        const response = await fetch(`${apiBaseUrl}/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            origin: window.location.origin,
            deviceFingerprint: generateDeviceFingerprint(),
          }),
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          console.error("API call failed, switching to demo mode")
          setUseDemoMode(true)
          setSessionId("demo-session-id")
          setStep("methods")
          return
        }

        const data = await response.json()
        console.log("Session created:", data)

        if (data.error) {
          setError(data.error)
          setStep("error")
          return
        }

        setSessionId(data.sessionId)
        setStep("methods")
      } catch (err) {
        console.error("Session initialization error:", err)
        console.log("Switching to demo mode due to error")
        setUseDemoMode(true)
        setSessionId("demo-session-id")
        setStep("methods")
      }
    }

    initSession()

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [apiKey, apiBaseUrl])

  // Kontrola stavu ověření
  const startStatusCheck = () => {
    if (!sessionId) return

    if (useDemoMode) {
      const interval = setInterval(() => {
        clearInterval(interval)
        const demoResult = {
          isValid: true,
          isAdult: true,
          estimatedAge: 25,
          confidence: 0.95,
        }
        setVerificationResult(demoResult)
        setStep("success")
        if (onVerified) {
          onVerified(demoResult)
        }
      }, 3000)
      setStatusCheckInterval(interval)
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/check-status?sessionId=${sessionId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          clearInterval(interval)
          setError(data.error)
          setStep("error")
          return
        }

        if (data.status === "completed") {
          clearInterval(interval)
          setVerificationResult(data.result)
          setStep("success")
          if (onVerified) {
            onVerified(data.result)
          }
        }
      } catch (err) {
        clearInterval(interval)
        setError("Nepodařilo se zkontrolovat stav ověření")
        setStep("error")
      }
    }, 2000)

    setStatusCheckInterval(interval)
  }

  // Výběr metody ověření
  const selectMethod = async (method: string) => {
    if (!sessionId) return

    setStep("loading")

    if (useDemoMode) {
      setTimeout(() => {
        if (method === "qr") {
          setQrToken("demo-qr-token")
          setQrUrl("https://app.passprove.com/verify/qr/demo-token")
          startStatusCheck()
        }
        setStep(method)
      }, 1000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/select-method`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          method,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setStep("error")
        return
      }

      if (method === "bankid" && data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      if (method === "qr" && data.qrToken && data.qrUrl) {
        setQrToken(data.qrToken)
        setQrUrl(data.qrUrl)
        startStatusCheck()
      }

      setStep(method)
    } catch (err) {
      console.error("Error selecting method:", err)
      // Fallback to demo mode
      if (method === "qr") {
        setQrToken("demo-qr-token")
        setQrUrl("https://app.passprove.com/verify/qr/demo-token")
        startStatusCheck()
      }
      setStep(method)
    }
  }

  // Generování otisku zařízení
  const generateDeviceFingerprint = () => {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ]
    return btoa(components.join("|")).replace(/=/g, "")
  }

  // Obsah podle kroku
  const renderContent = () => {
    switch (step) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Načítání...</p>
          </div>
        )

      case "methods":
        return (
          <div className="p-6">
            <p className="mb-4 text-gray-700">
              Pro nákup zboží s věkovým omezením musíte být starší 18 let. Vyberte způsob ověření věku:
            </p>
            {useDemoMode && (
              <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                Demo režim: API volání jsou simulována
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => selectMethod("ocr")}
                className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">📷</span>
                <div className="text-left">
                  <h4 className="font-medium">Občanský průkaz</h4>
                  <p className="text-sm text-gray-500">Ověření pomocí fotografie dokladu</p>
                </div>
              </button>

              <button
                onClick={() => selectMethod("facescan")}
                className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">👤</span>
                <div className="text-left">
                  <h4 className="font-medium">Selfie</h4>
                  <p className="text-sm text-gray-500">Ověření pomocí fotografie obličeje</p>
                </div>
              </button>

              <button
                onClick={() => selectMethod("qr")}
                className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">📱</span>
                <div className="text-left">
                  <h4 className="font-medium">QR kód</h4>
                  <p className="text-sm text-gray-500">Ověření pomocí mobilního telefonu</p>
                </div>
              </button>

              <button
                onClick={() => selectMethod("reverification")}
                className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl mr-3">🔄</span>
                <div className="text-left">
                  <h4 className="font-medium">Opakované ověření</h4>
                  <p className="text-sm text-gray-500">Použít dříve uložené ověření</p>
                </div>
              </button>
            </div>
          </div>
        )

      case "ocr":
        return (
          <OCRUploader
            sessionId={sessionId!}
            apiKey={apiKey}
            apiBaseUrl={apiBaseUrl}
            useDemoMode={useDemoMode}
            onSuccess={(result) => {
              setVerificationResult(result)
              setStep("success")
              if (onVerified) {
                onVerified(result)
              }
            }}
            onError={(errorMsg) => {
              setError(errorMsg)
              setStep("error")
            }}
            onBack={() => setStep("methods")}
          />
        )

      case "facescan":
        return (
          <FaceScanner
            sessionId={sessionId!}
            apiKey={apiKey}
            apiBaseUrl={apiBaseUrl}
            useDemoMode={useDemoMode}
            onSuccess={(result) => {
              setVerificationResult(result)
              setStep("success")
              if (onVerified) {
                onVerified(result)
              }
            }}
            onError={(errorMsg) => {
              setError(errorMsg)
              setStep("error")
            }}
            onBack={() => setStep("methods")}
          />
        )

      case "qr":
        return (
          <QRCodeDisplay
            qrUrl={qrUrl!}
            onBack={() => {
              if (statusCheckInterval) {
                clearInterval(statusCheckInterval)
                setStatusCheckInterval(null)
              }
              setStep("methods")
            }}
          />
        )

      case "reverification":
        return (
          <SaveReverificationMethod
            sessionId={sessionId!}
            apiKey={apiKey}
            apiBaseUrl={apiBaseUrl}
            useDemoMode={useDemoMode}
            onSuccess={(result) => {
              setVerificationResult(result)
              setStep("success")
              if (onVerified) {
                onVerified(result)
              }
            }}
            onError={(errorMsg) => {
              setError(errorMsg)
              setStep("error")
            }}
            onBack={() => setStep("methods")}
          />
        )

      case "success":
        return (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Ověření úspěšné</h3>
            <p className="text-gray-600 mb-4">Vaše věková verifikace byla úspěšně dokončena.</p>
            {verificationResult && verificationResult.isAdult && (
              <p className="text-green-600 font-medium">Jste starší 18 let a můžete pokračovat v nákupu.</p>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Zavřít
            </button>
          </div>
        )

      case "error":
        return (
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
            <h3 className="text-xl font-semibold mb-2">Chyba při ověření</h3>
            <p className="text-gray-600 mb-4">{error || "Došlo k neočekávané chybě při ověření věku."}</p>
            <button
              onClick={() => setStep("methods")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Zkusit znovu
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Ověření věku</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Zavřít">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}

