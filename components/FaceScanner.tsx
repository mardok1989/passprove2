"use client"

import { useState, useRef, useEffect } from "react"

interface FaceScannerProps {
  sessionId: string
  apiKey: string
  apiBaseUrl: string
  onSuccess: (result: any) => void
  onError: (error: string) => void
  onBack: () => void
}

export default function FaceScanner({ sessionId, apiKey, apiBaseUrl, onSuccess, onError, onBack }: FaceScannerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Inicializace kamery
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      onError("Nepodařilo se získat přístup ke kameře")
    }
  }

  // Ukončení kamery
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setIsCameraActive(false)
    }
  }

  // Pořízení snímku
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = canvas.toDataURL("image/jpeg")
        setImage(imageData)
        stopCamera()
      }
    }
  }

  // Odeslání snímku k ověření
  const handleSubmit = async () => {
    if (!image) return

    setIsLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/verify-facescan`, {
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

      const data = await response.json()

      if (data.error) {
        onError(data.error)
        setIsLoading(false)
        return
      }

      if (!data.isValid) {
        onError(data.error || "Ověření obličeje selhalo")
        setIsLoading(false)
        return
      }

      onSuccess(data)
      setIsLoading(false)
    } catch (err) {
      onError("Nepodařilo se odeslat snímek k ověření")
      setIsLoading(false)
    }
  }

  // Čištění při odmontování komponenty
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium mb-4">Ověření pomocí selfie</h3>

      <p className="mb-4 text-gray-600">
        Pořiďte fotografii svého obličeje pro ověření věku. Ujistěte se, že je váš obličej dobře viditelný a osvětlený.
      </p>

      <canvas ref={canvasRef} className="hidden"></canvas>

      {!image && !isCameraActive && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={startCamera}
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
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
          <p className="text-gray-600">Klikněte pro aktivaci kamery</p>
        </div>
      )}

      {isCameraActive && (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg"></video>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={captureImage}
              className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-8 h-8 text-indigo-600"
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
            </button>
          </div>
        </div>
      )}

      {image && (
        <div className="mb-4">
          <img
            src={image || "/placeholder.svg"}
            alt="Pořízené selfie"
            className="max-w-full h-auto rounded-lg mx-auto mb-2"
          />
          <div className="flex justify-center">
            <button
              onClick={() => {
                setImage(null)
                startCamera()
              }}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Pořídit nový snímek
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

