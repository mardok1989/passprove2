;(() => {
  // Konfigurace
  const config = {
    apiBaseUrl: "https://hrtfjvhtpdxupcuyvutw.supabase.co/functions/v1",
    modalContainerId: "passprove-modal-container",
    verifyPageUrl: "https://passprove2.vercel.app/verify", // Toto bude URL vaší nasazené aplikace
    defaultOptions: {
      minAge: 18,
      allowedMethods: ["ocr", "facescan", "qr", "reverification"],
    },
  }

  // Získání identifikátoru obchodu z data atributu skriptu
  const getShopIdentifier = () => {
    const scripts = document.getElementsByTagName("script")
    const currentScript = scripts[scripts.length - 1]
    return currentScript.getAttribute("data-shop-identifier")
  }

  // Získání API klíče z databáze
  const getApiKey = async (shopIdentifier) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/get-shop-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: shopIdentifier }),
      })

      if (!response.ok) {
        console.error("Nepodařilo se získat API klíč:", response.statusText)
        return null
      }

      const data = await response.json()
      return data.api_key
    } catch (error) {
      console.error("Chyba při získávání API klíče:", error)
      return null
    }
  }

  // Vytvoření modálního okna
  const createModalContainer = () => {
    let container = document.getElementById(config.modalContainerId)
    if (!container) {
      container = document.createElement("div")
      container.id = config.modalContainerId
      container.style.display = "none"
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "0"
      container.style.width = "100%"
      container.style.height = "100%"
      container.style.backgroundColor = "rgba(0, 0, 0, 0.5)"
      container.style.zIndex = "9999"
      container.style.justifyContent = "center"
      container.style.alignItems = "center"
      document.body.appendChild(container)
    }
    return container
  }

  // Vytvoření iframe pro PassProve
  const createIframe = (sessionId, apiKey) => {
    const iframe = document.createElement("iframe")
    iframe.style.width = "90%"
    iframe.style.maxWidth = "500px"
    iframe.style.height = "600px"
    iframe.style.border = "none"
    iframe.style.borderRadius = "8px"
    iframe.style.backgroundColor = "white"
    iframe.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"

    // Nastavení URL pro iframe s parametry
    iframe.src = `${config.verifyPageUrl}?sessionId=${sessionId}&apiKey=${apiKey}`

    return iframe
  }

  // Vytvoření relace pro ověření
  const createSession = async (apiKey, options) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/create-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          minAge: options.minAge || config.defaultOptions.minAge,
          allowedMethods: options.allowedMethods || config.defaultOptions.allowedMethods,
          redirectUrl: options.redirectUrl || window.location.href,
        }),
      })

      if (!response.ok) {
        throw new Error(`Nepodařilo se vytvořit relaci: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Chyba při vytváření relace:", error)
      return null
    }
  }

  // Kontrola stavu ověření
  const checkVerificationStatus = async (sessionId, apiKey) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/check-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error(`Nepodařilo se zkontrolovat stav: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Chyba při kontrole stavu:", error)
      return { status: "error", error: error.message }
    }
  }

  // Hlavní funkce pro ověření věku
  const verify = async (options = {}, apiKey) => {
    options = { ...config.defaultOptions, ...options }

    // Vytvoření relace
    const sessionData = await createSession(apiKey, options)
    if (!sessionData || !sessionData.sessionId) {
      console.error("Nepodařilo se vytvořit relaci pro ověření věku")
      return
    }

    const sessionId = sessionData.sessionId

    // Vytvoření a zobrazení modálního okna
    const modalContainer = createModalContainer()
    const iframe = createIframe(sessionId, apiKey)

    modalContainer.innerHTML = ""
    modalContainer.appendChild(iframe)
    modalContainer.style.display = "flex"

    // Nastavení posluchače zpráv z iframe
    const messageListener = async (event) => {
      // Ověření, že zpráva pochází z našeho iframe
      if (event.source !== iframe.contentWindow) return

      const { type, data } = event.data

      if (type === "VERIFICATION_COMPLETE") {
        // Kontrola stavu ověření
        const statusResult = await checkVerificationStatus(sessionId, apiKey)

        // Zavření modálního okna
        modalContainer.style.display = "none"

        // Odstranění posluchače zpráv
        window.removeEventListener("message", messageListener)

        // Volání callback funkce podle výsledku
        if (statusResult.status === "verified" && typeof options.onVerified === "function") {
          options.onVerified(statusResult)
        } else if (typeof options.onFailed === "function") {
          options.onFailed(statusResult)
        }
      } else if (type === "CLOSE_MODAL") {
        // Zavření modálního okna na žádost uživatele
        modalContainer.style.display = "none"

        // Odstranění posluchače zpráv
        window.removeEventListener("message", messageListener)

        // Volání callback funkce pro zavření
        if (typeof options.onClose === "function") {
          options.onClose()
        }
      }
    }

    // Přidání posluchače zpráv
    window.addEventListener("message", messageListener)
  }

  // Inicializace PassProve
  const init = async (options = {}) => {
    const shopIdentifier = getShopIdentifier()
    if (!shopIdentifier) {
      console.error("Chybí identifikátor obchodu (data-shop-identifier)")
      return
    }

    // Získání API klíče
    const apiKey = await getApiKey(shopIdentifier)
    if (!apiKey) {
      console.error("Nepodařilo se získat API klíč pro obchod:", shopIdentifier)
      return
    }

    // Uložení API klíče pro pozdější použití
    window.passproveApiKey = apiKey

    console.log("PassProve inicializován pro obchod:", shopIdentifier)
  }

  // Vytvoření globálního objektu PassProve
  const createPassProveObject = () => {
    // Zpracování fronty příkazů
    const processQueue = (queue) => {
      if (!queue || !Array.isArray(queue)) return

      queue.forEach((cmd) => {
        if (!Array.isArray(cmd) || cmd.length < 1) return

        const [method, ...args] = cmd

        if (method === "init") {
          init(...args)
        } else if (method === "verify") {
          verify(...args, window.passproveApiKey)
        }
      })
    }

    // Vytvoření proxy funkce
    const passproveProxy = (method, ...args) => {
      if (method === "init") {
        init(...args)
      } else if (method === "verify") {
        verify(...args, window.passproveApiKey)
      }
    }

    // Zpracování existující fronty
    if (window.passprove && window.passprove.q) {
      processQueue(window.passprove.q)
    }

    // Nahrazení objektu proxy funkcí
    window.passprove = passproveProxy
  }

  // Spuštění inicializace po načtení DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createPassProveObject)
  } else {
    createPassProveObject()
  }
})()

