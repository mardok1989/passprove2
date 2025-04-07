import PassProveDemo from "@/components/PassProveDemo"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">PassProve</h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl">
            Bezpečné a spolehlivé ověření věku pro váš e-shop
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <PassProveDemo />
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">Ověření dokladem</h2>
            <p className="text-gray-600">
              Rychlé ověření věku pomocí fotografie občanského průkazu nebo cestovního pasu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">👤</div>
            <h2 className="text-xl font-semibold mb-2">Ověření obličejem</h2>
            <p className="text-gray-600">Moderní ověření věku pomocí analýzy obličeje s využitím umělé inteligence.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl mb-4">🔄</div>
            <h2 className="text-xl font-semibold mb-2">Opakované ověření</h2>
            <p className="text-gray-600">
              Uložení výsledku ověření pro budoucí nákupy bez nutnosti opakovaného ověřování.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Jak integrovat PassProve do vašeho e-shopu</h2>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <pre className="overflow-auto text-sm">
              {`<script src="https://cdn.passprove.com/integration-loader.js" data-api-key="VÁŠ_API_KLÍČ"></script>
<script>
  window.passprove = window.passprove || { q: [] };
  passprove.q.push(['init', { /* volitelná konfigurace */ }]);
  
  function verifyAge() {
    passprove('verify', {
      onVerified: function(result) {
        console.log('Ověření úspěšné:', result);
        // Zde můžete pokračovat v procesu objednávky
      },
      onClose: function() {
        console.log('Ověření bylo zrušeno');
      }
    });
  }
</script>
<button onclick="verifyAge()">Ověřit věk</button>`}
            </pre>
          </div>

          <p className="text-gray-600">
            Integrace PassProve do vašeho e-shopu je jednoduchá. Stačí vložit výše uvedený kód do vašich stránek a
            nahradit "VÁŠ_API_KLÍČ" vaším API klíčem, který získáte po registraci.
          </p>
        </div>
      </div>
    </main>
  )
}

