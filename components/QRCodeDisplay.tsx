"use client"

interface QRCodeDisplayProps {
  qrUrl: string
  onBack: () => void
}

export default function QRCodeDisplay({ qrUrl, onBack }: QRCodeDisplayProps) {
  return (
    <div className="p-6 text-center">
      <h3 className="text-lg font-medium mb-4">Ověření pomocí QR kódu</h3>

      <p className="mb-6 text-gray-600">Naskenujte tento QR kód pomocí mobilního telefonu a dokončete ověření věku.</p>

      <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-6">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
          alt="QR kód pro ověření"
          className="w-48 h-48"
        />
      </div>

      <p className="text-sm text-gray-500 mb-6">Čekám na dokončení ověření... Toto okno nezavírejte.</p>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Zpět
        </button>
      </div>
    </div>
  )
}

