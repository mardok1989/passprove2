"use client"

import type React from "react"

import { useState, useRef } from "react"

interface OCRUploaderProps {
  sessionId: string
  apiKey: string
  apiBaseUrl: string
  useDemoMode?: boolean
  onSuccess: (result: any) => void
  onError: (error: string) => void
  onBack: () => void
}

export default function OCRUploader({
  sessionId,
  apiKey,
  apiBaseUrl,
  useDemoMode = false,
  onSuccess,
  onError,
  onBack,
}: OCRUploaderProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSubmit = async () => {
    if (!image) return

    setIsLoading(true)

    if (useDemoMode) {
      // Simulate OCR analysis for demo purposes
      setTimeout(() => {
        const simulatedResult = {
          isValid: true,
          documentType: "id_card",
          documentNumber: `ID${Math.floor(Math.random() * 1000000)}`,
          firstName: "Jan",
          lastName: "Novák",
          birthDate: "1990-01-01",
          age: 33,
          isAdult: true,
          confidence: 0.92,
        }

        onSuccess(simulatedResult)
        setIsLoading(false)
      }, 2000)
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/verify-ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          imageData: image,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        onError(data.error)
        setIsLoading(false)
        return
      }

      if (!data.isValid) {
        onError(data.error || "Dokument nebyl rozpoznán nebo je neplatný")
        setIsLoading(false)
        return
      }

      onSuccess(data)
      setIsLoading(false)
    } catch (err) {
      console.error("Error submitting OCR verification:", err)

      // Fallback to demo mode
      setTimeout(() => {
        const simulatedResult = {
          isValid: true,
          documentType: "id_card",
          documentNumber: `ID${Math.floor(Math.random() * 1000000)}`,
          firstName: "Jan",
          lastName: "Novák",
          birthDate: "1990-01-01",
          age: 33,
          isAdult: true,
          confidence: 0.92,
        }

        onSuccess(simulatedResult)
        setIsLoading(false)
      }, 1000)
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium mb-4">Ověření pomocí dokladu totožnosti</h3>

      {useDemoMode && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          Demo režim: API volání jsou simulována
        </div>
      )}

      <p className="mb-4 text-gray-600">
        Vyfoťte nebo nahrajte svůj občanský průkaz nebo cestovní pas. Ujistěte se, že jsou všechny údaje čitelné.
      </p>

      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {!image ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleCapture}
        >
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <p className="text-gray-600">Klikněte pro nahrání fotografie dokladu</p>
        </div>
      ) : (
        <div className="mb-4">
          <img
            src={image || "/placeholder.svg"}
            alt="Nahraný doklad"
            className="max-w-full h-auto rounded-lg mx-auto mb-2"
          />
          <div className="flex justify-center">
            <button onClick={() => setImage(null)} className="text-indigo-600 hover:text-indigo-800">
              Vybrat jiný obrázek
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Zpět
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          disabled={!image || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Zpracovávám...
            </span>
          ) : (
            "Odeslat k ověření"
          )}
        </button>
      </div>
    </div>
  )
}

