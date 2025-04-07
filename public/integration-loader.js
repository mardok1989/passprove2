;(() => {
  // Získání API klíče z data atributu skriptu
  var scripts = document.getElementsByTagName("script")
  var currentScript = scripts[scripts.length - 1]
  var shopIdentifier = currentScript.getAttribute("data-shop-identifier")

  if (!shopIdentifier) {
    console.error("PassProve: Chybí identifikátor obchodu. Přidejte atribut data-shop-identifier do skriptu.")
    return
  }

  // Konfigurace
  var config = {
    shopIdentifier: shopIdentifier,
    apiKey: null,
    apiBaseUrl: "https://hrtfjvhtpdxupcuyvutw.supabase.co/functions/v1", // Přímá URL na Supabase Edge Functions
  }

  // Globální objekt PassProve
  var passprove = window.passprove
  var queue = passprove.q || []

  // Vytvoření kontejneru pro modální okno
  var container = document.createElement("div")
  container.id = "passprove-container"
  document.body.appendChild(container)

  // Načtení stylů
  var styles = document.createElement("link")
  styles.rel = "stylesheet"
  styles.href = "https://cdn.passprove.com/styles.css"
  document.head.appendChild(styles)

  // Funkce pro získání API klíče
  function fetchApiKey() {
    return fetch(config.apiBaseUrl + "/get-shop-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: config.shopIdentifier,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nepodařilo se získat API klíč")
        }
        return response.json()
      })
      .then((data) => {
        if (!data.apiKey) {
          throw new Error("API klíč nebyl nalezen")
        }
        config.apiKey = data.apiKey
        return data.apiKey
      })
  }

  // Funkce pro otevření modálního okna
  function openVerificationModal(options) {
    var modalContainer = document.getElementById("passprove-container")

    // Vyčištění kontejneru
    modalContainer.innerHTML = ""

    // Vytvoření modálního okna
    var modal = document.createElement("div")
    modal.className = "passprove-modal"
    modal.innerHTML = `
    <div class="passprove-modal-overlay"></div>
    <div class="passprove-modal-content">
      <div class="passprove-modal-header">
        <h3>Ověření věku</h3>
        <button class="passprove-modal-close">&times;</button>
      </div>
      <div class="passprove-modal-body">
        <div class="passprove-loading">
          <div class="passprove-spinner"></div>
          <p>Načítání...</p>
        </div>
      </div>
    </div>
  `

    modalContainer.appendChild(modal)

    // Zavření modálního okna
    var closeButton = modal.querySelector(".passprove-modal-close")
    var overlay = modal.querySelector(".passprove-modal-overlay")

    closeButton.addEventListener("click", () => {
      modalContainer.innerHTML = ""
      if (options.onClose) options.onClose()
    })

    overlay.addEventListener("click", () => {
      modalContainer.innerHTML = ""
      if (options.onClose) options.onClose()
    })

    // Získání API klíče a inicializace PassProve
    if (config.apiKey) {
      initVerification(modal, options)
    } else {
      fetchApiKey()
        .then(() => {
          initVerification(modal, options)
        })
        .catch((error) => {
          var modalBody = modal.querySelector(".passprove-modal-body")
          showError(modalBody, "Nepodařilo se získat API klíč: " + error.message)
        })
    }
  }

  // Funkce pro inicializaci ověření
  function initVerification(modal, options) {
    var modalBody = modal.querySelector(".passprove-modal-body")

    // Vytvoření relace
    fetch(config.apiBaseUrl + "/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        origin: window.location.origin,
        deviceFingerprint: generateDeviceFingerprint(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showError(modalBody, data.error)
          return
        }

        // Uložení ID relace
        var sessionId = data.sessionId

        // Zobrazení metod ověření
        showVerificationMethods(modalBody, sessionId, options)
      })
      .catch((error) => {
        showError(modalBody, error.message)
      })
  }

  // Funkce pro zobrazení metod ověření
  function showVerificationMethods(container, sessionId, options) {
    // Zde by byla implementace zobrazení metod ověření
    // Pro zjednodušení pouze zobrazíme základní rozhraní

    container.innerHTML = `
    <p>Pro nákup zboží s věkovým omezením musíte být starší 18 let. Vyberte způsob ověření věku:</p>
    <div class="passprove-methods">
      <button class="passprove-method" data-method="bankid">
        <span class="passprove-method-icon">🏦</span>
        <div>
          <h4>BankID</h4>
          <p>Ověření pomocí bankovní identity</p>
        </div>
      </button>
      <button class="passprove-method" data-method="ocr">
        <span class="passprove-method-icon">📷</span>
        <div>
          <h4>Občanský průkaz</h4>
          <p>Ověření pomocí fotografie dokladu</p>
        </div>
      </button>
      <button class="passprove-method" data-method="facescan">
        <span class="passprove-method-icon">👤</span>
        <div>
          <h4>Selfie</h4>
          <p>Ověření pomocí fotografie obličeje</p>
        </div>
      </button>
      <button class="passprove-method" data-method="qr">
        <span class="passprove-method-icon">📱</span>
        <div>
          <h4>QR kód</h4>
          <p>Ověření pomocí mobilního telefonu</p>
        </div>
      </button>
      <button class="passprove-method" data-method="reverification">
        <span class="passprove-method-icon">🔄</span>
        <div>
          <h4>Opakované ověření</h4>
          <p>Použít dříve uložené ověření</p>
        </div>
      </button>
    </div>
  `

    // Přidání event listenerů pro tlačítka metod
    var methodButtons = container.querySelectorAll(".passprove-method")
    methodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        var method = button.getAttribute("data-method")
        selectMethod(container, sessionId, method, options)
      })
    })
  }

  // Funkce pro výběr metody ověření
  function selectMethod(container, sessionId, method, options) {
    container.innerHTML = `
    <div class="passprove-loading">
      <div class="passprove-spinner"></div>
      <p>Načítání metody ověření...</p>
    </div>
  `

    fetch(config.apiBaseUrl + "/select-method", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        method: method,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showError(container, data.error)
          return
        }

        // Zpracování odpovědi podle metody
        if (method === "bankid" && data.redirectUrl) {
          window.location.href = data.redirectUrl
        } else if (method === "ocr") {
          showOCRUploader(container, sessionId, options)
        } else if (method === "facescan") {
          showFaceScanner(container, sessionId, options)
        } else if (method === "qr" && data.qrUrl) {
          showQRCode(container, sessionId, data.qrUrl, options)
        } else if (method === "reverification") {
          showReverificationForm(container, sessionId, options)
        } else {
          // Fallback pro neimplementované metody
          container.innerHTML = `
        <p>Vybrali jste metodu: ${method}</p>
        <p>Tato ukázková implementace nepodporuje plnou funkčnost.</p>
        <button class="passprove-button passprove-back">Zpět</button>
      `

          var backButton = container.querySelector(".passprove-back")
          backButton.addEventListener("click", () => {
            showVerificationMethods(container, sessionId, options)
          })
        }
      })
      .catch((error) => {
        showError(container, error.message)
      })
  }

  // Funkce pro zobrazení OCR uploaderu
  function showOCRUploader(container, sessionId, options) {
    container.innerHTML = `
    <h3>Ověření pomocí dokladu totožnosti</h3>
    <p>Vyfoťte nebo nahrajte svůj občanský průkaz nebo cestovní pas. Ujistěte se, že jsou všechny údaje čitelné.</p>
    <div class="passprove-file-upload">
      <input type="file" id="passprove-document-upload" accept="image/*" style="display: none;">
      <div class="passprove-upload-area" id="passprove-upload-area">
        <div class="passprove-upload-icon">📷</div>
        <p>Klikněte pro nahrání fotografie dokladu</p>
      </div>
      <div class="passprove-preview" id="passprove-preview" style="display: none;">
        <img id="passprove-preview-image">
        <button class="passprove-button passprove-change">Vybrat jiný obrázek</button>
      </div>
    </div>
    <div class="passprove-actions">
      <button class="passprove-button passprove-back">Zpět</button>
      <button class="passprove-button passprove-submit" disabled>Odeslat k ověření</button>
    </div>
  `

    var fileInput = container.querySelector("#passprove-document-upload")
    var uploadArea = container.querySelector("#passprove-upload-area")
    var preview = container.querySelector("#passprove-preview")
    var previewImage = container.querySelector("#passprove-preview-image")
    var changeButton = container.querySelector(".passprove-change")
    var backButton = container.querySelector(".passprove-back")
    var submitButton = container.querySelector(".passprove-submit")

    uploadArea.addEventListener("click", () => {
      fileInput.click()
    })

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader()
        reader.onload = (e) => {
          previewImage.src = e.target.result
          uploadArea.style.display = "none"
          preview.style.display = "block"
          submitButton.disabled = false
        }
        reader.readAsDataURL(fileInput.files[0])
      }
    })

    changeButton.addEventListener("click", () => {
      uploadArea.style.display = "block"
      preview.style.display = "none"
      fileInput.value = ""
      submitButton.disabled = true
    })

    backButton.addEventListener("click", () => {
      showVerificationMethods(container, sessionId, options)
    })

    submitButton.addEventListener("click", () => {
      if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader()
        reader.onload = (e) => {
          submitOCRVerification(container, sessionId, e.target.result, options)
        }
        reader.readAsDataURL(fileInput.files[0])
      }
    })
  }

  // Funkce pro odeslání OCR ověření
  function submitOCRVerification(container, sessionId, imageData, options) {
    container.innerHTML = `
    <div class="passprove-loading">
      <div class="passprove-spinner"></div>
      <p>Zpracovávám dokument...</p>
    </div>
  `

    fetch(config.apiBaseUrl + "/verify-ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        imageData: imageData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showError(container, data.error)
          return
        }

        if (!data.isValid) {
          showError(container, data.error || "Dokument nebyl rozpoznán nebo je neplatný")
          return
        }

        // Zobrazení úspěšného ověření
        showSuccess(container, data, options)

        // Volání callback funkce
        if (options.onVerified) {
          options.onVerified(data)
        }
      })
      .catch((error) => {
        showError(container, error.message)
      })
  }

  // Funkce pro zobrazení skeneru obličeje
  function showFaceScanner(container, sessionId, options) {
    container.innerHTML = `
    <h3>Ověření pomocí selfie</h3>
    <p>Pořiďte fotografii svého obličeje pro ověření věku. Ujistěte se, že je váš obličej dobře viditelný a osvětlený.</p>
    <div class="passprove-camera">
      <video id="passprove-video" autoplay playsinline></video>
      <canvas id="passprove-canvas" style="display: none;"></canvas>
      <div class="passprove-camera-overlay">
        <button id="passprove-capture" class="passprove-capture-button">
          <span class="passprove-capture-icon">📷</span>
        </button>
      </div>
      <div id="passprove-preview-container" style="display: none;">
        <img id="passprove-face-preview">
        <button class="passprove-button passprove-retake">Pořídit nový snímek</button>
      </div>
    </div>
    <div class="passprove-actions">
      <button class="passprove-button passprove-back">Zpět</button>
      <button class="passprove-button passprove-submit" disabled>Odeslat k ověření</button>
    </div>
  `

    var video = container.querySelector("#passprove-video")
    var canvas = container.querySelector("#passprove-canvas")
    var captureButton = container.querySelector("#passprove-capture")
    var previewContainer = container.querySelector("#passprove-preview-container")
    var facePreview = container.querySelector("#passprove-face-preview")
    var retakeButton = container.querySelector(".passprove-retake")
    var backButton = container.querySelector(".passprove-back")
    var submitButton = container.querySelector(".passprove-submit")

    var stream = null

    // Inicializace kamery
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((mediaStream) => {
        stream = mediaStream
        video.srcObject = mediaStream
      })
      .catch((error) => {
        showError(container, "Nepodařilo se získat přístup ke kameře: " + error.message)
      })

    captureButton.addEventListener("click", () => {
      var context = canvas.getContext("2d")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      var imageData = canvas.toDataURL("image/jpeg")
      facePreview.src = imageData

      video.style.display = "none"
      captureButton.style.display = "none"
      previewContainer.style.display = "block"
      submitButton.disabled = false
    })

    retakeButton.addEventListener("click", () => {
      video.style.display = "block"
      captureButton.style.display = "block"
      previewContainer.style.display = "none"
      submitButton.disabled = true
    })

    backButton.addEventListener("click", () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }
      showVerificationMethods(container, sessionId, options)
    })

    submitButton.addEventListener("click", () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }

      submitFaceScanVerification(container, sessionId, facePreview.src, options)
    })
  }

  // Funkce pro odeslání ověření obličeje
  function submitFaceScanVerification(container, sessionId, imageData, options) {
    container.innerHTML = `
    <div class="passprove-loading">
      <div class="passprove-spinner"></div>
      <p>Zpracovávám snímek...</p>
    </div>
  `

    fetch(config.apiBaseUrl + "/verify-facescan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        imageData: imageData,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          showError(container, data.error)
          return
        }

        if (!data.isValid) {
          showError(container, data.error || "Ověření obličeje selhalo")
          return
        }

        // Zobrazení úspěšného ověření
        showSuccess(container, data, options)

        // Volání callback funkce
        if (options.onVerified) {
          options.onVerified(data)
        }
      })
      .catch((error) => {
        showError(container, error.message)
      })
  }

  // Funkce pro zobrazení QR kódu
  function showQRCode(container, sessionId, qrUrl, options) {
    container.innerHTML = `
    <h3>Ověření pomocí QR kódu</h3>
    <p>Naskenujte tento QR kód pomocí mobilního telefonu a dokončete ověření věku.</p>
    <div class="passprove-qr-code">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}">
    </div>
    <p class="passprove-qr-note">Čekám na dokončení ověření... Toto okno nezavírejte.</p>
    <div class="passprove-actions">
      <button class="passprove-button passprove-back">Zpět</button>
    </div>
  `

    var backButton = container.querySelector(".passprove-back")

    backButton.addEventListener("click", () => {
      showVerificationMethods(container, sessionId, options)
    })

    // Kontrola stavu ověření
    var statusCheckInterval = setInterval(() => {
      fetch(config.apiBaseUrl + "/check-status?sessionId=" + sessionId, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + config.apiKey,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            clearInterval(statusCheckInterval)
            showError(container, data.error)
            return
          }

          if (data.status === "completed") {
            clearInterval(statusCheckInterval)
            showSuccess(container, data.result, options)

            // Volání callback funkce
            if (options.onVerified) {
              options.onVerified(data.result)
            }
          }
        })
        .catch((error) => {
          clearInterval(statusCheckInterval)
          showError(container, error.message)
        })
    }, 2000)
  }

  // Funkce pro zobrazení formuláře pro opakované ověření
  function showReverificationForm(container, sessionId, options) {
    container.innerHTML = `
    <h3>Opakované ověření</h3>
    <p>Zadejte svůj e-mail nebo telefonní číslo pro ověření. Na tento kontakt vám zašleme ověřovací kód.</p>
    <div class="passprove-reverification">
      <div class="passprove-method-selector">
        <button class="passprove-method-button passprove-active" data-method="email">E-mail</button>
        <button class="passprove-method-button" data-method="phone">Telefon</button>
      </div>
      <div class="passprove-input-group">
        <label for="passprove-identifier">E-mailová adresa</label>
        <input type="email" id="passprove-identifier" placeholder="vas@email.cz">
      </div>
    </div>
    <div class="passprove-actions">
      <button class="passprove-button passprove-back">Zpět</button>
      <button class="passprove-button passprove-submit" disabled>Odeslat ověřovací kód</button>
    </div>
  `

    var methodButtons = container.querySelectorAll(".passprove-method-button")
    var identifierInput = container.querySelector("#passprove-identifier")
    var identifierLabel = container.querySelector('label[for="passprove-identifier"]')
    var backButton = container.querySelector(".passprove-back")
    var submitButton = container.querySelector(".passprove-submit")

    var selectedMethod = "email"

    // Přepínání mezi metodami
    methodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        methodButtons.forEach((btn) => {
          btn.classList.remove("passprove-active")
        })

        button.classList.add("passprove-active")
        selectedMethod = button.getAttribute("data-method")

        if (selectedMethod === "email") {
          identifierLabel.textContent = "E-mailová adresa"
          identifierInput.type = "email"
          identifierInput.placeholder = "vas@email.cz"
        } else {
          identifierLabel.textContent = "Telefonní číslo"
          identifierInput.type = "tel"
          identifierInput.placeholder = "+420 123 456 789"
        }
      })
    })

    // Kontrola vstupu
    identifierInput.addEventListener("input", () => {
      submitButton.disabled = !identifierInput.value
    })

    backButton.addEventListener("click", () => {
      showVerificationMethods(container, sessionId, options)
    })

    submitButton.addEventListener("click", () => {
      sendVerificationCode(container, sessionId, selectedMethod, identifierInput.value, options)
    })
  }

  // Funkce pro odeslání ověřovacího kódu
  function sendVerificationCode(container, sessionId, method, identifier, options) {
    container.innerHTML = `
    <div class="passprove-loading">
      <div class="passprove-spinner"></div>
      <p>Odesílám ověřovací kód...</p>
    </div>
  `

    // Simulace odeslání kódu
    setTimeout(() => {
      showVerificationCodeInput(container, sessionId, method, identifier, options)
    }, 1500)
  }

  // Funkce pro zobrazení vstupu pro ověřovací kód
  function showVerificationCodeInput(container, sessionId, method, identifier, options) {
    container.innerHTML = `
    <h3>Zadejte ověřovací kód</h3>
    <p>Zadejte ověřovací kód, který jsme vám zaslali na ${method === "email" ? "e-mail" : "telefon"} ${identifier}.</p>
    <div class="passprove-code-input">
      <input type="text" id="passprove-code" placeholder="123456" maxlength="6">
    </div>
    <div class="passprove-actions">
      <button class="passprove-button passprove-back">Zpět</button>
      <button class="passprove-button passprove-submit" disabled>Ověřit kód</button>
    </div>
  `

    var codeInput = container.querySelector("#passprove-code")
    var backButton = container.querySelector(".passprove-back")
    var submitButton = container.querySelector(".passprove-submit")

    // Kontrola vstupu
    codeInput.addEventListener("input", () => {
      submitButton.disabled = codeInput.value.length < 6
    })

    backButton.addEventListener("click", () => {
      showReverificationForm(container, sessionId, options)
    })

    submitButton.addEventListener("click", () => {
      verifyCode(container, sessionId, method, identifier, codeInput.value, options)
    })
  }

  // Funkce pro ověření kódu
  function verifyCode(container, sessionId, method, identifier, code, options) {
    container.innerHTML = `
    <div class="passprove-loading">
      <div class="passprove-spinner"></div>
      <p>Ověřuji kód...</p>
    </div>
  `

    // Simulace ověření kódu
    setTimeout(() => {
      // Simulace úspěšného ověření
      var result = {
        isValid: true,
        isAdult: true,
        method: method,
        identifier: identifier,
      }

      showSuccess(container, result, options)

      // Volání callback funkce
      if (options.onVerified) {
        options.onVerified(result)
      }
    }, 1500)
  }

  // Funkce pro zobrazení úspěšného ověření
  function showSuccess(container, result, options) {
    container.innerHTML = `
    <div class="passprove-success">
      <div class="passprove-success-icon">✓</div>
      <h3>Ověření úspěšné</h3>
      <p>Vaše věková verifikace byla úspěšně dokončena.</p>
      ${result.isAdult ? '<p class="passprove-success-message">Jste starší 18 let a můžete pokračovat v nákupu.</p>' : ""}
      <button class="passprove-button passprove-close">Zavřít</button>
    </div>
  `

    var closeButton = container.querySelector(".passprove-close")

    closeButton.addEventListener("click", () => {
      var modalContainer = document.getElementById("passprove-container")
      modalContainer.innerHTML = ""

      if (options.onClose) {
        options.onClose()
      }
    })
  }

  // Funkce pro zobrazení chyby
  function showError(container, message) {
    container.innerHTML = `
    <div class="passprove-error">
      <div class="passprove-error-icon">✗</div>
      <h3>Chyba při ověření</h3>
      <p>${message || "Došlo k neočekávané chybě při ověření věku."}</p>
      <button class="passprove-button passprove-retry">Zkusit znovu</button>
    </div>
  `

    var retryButton = container.querySelector(".passprove-retry")

    retryButton.addEventListener("click", () => {
      var modal = container.closest(".passprove-modal-content")
      initVerification(modal, {})
    })
  }

  // Funkce pro generování otisku zařízení
  function generateDeviceFingerprint() {
    var components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ]
    return btoa(components.join("|")).replace(/=/g, "")
  }

  // Implementace API
  passprove = () => {
    var args = Array.prototype.slice.call(arguments)
    var command = args[0]
    var options = args[1] || {}

    if (command === "init") {
      // Inicializace již proběhla, pouze uložíme konfiguraci
      config = Object.assign(config, options)

      // Pokud nemáme API klíč, zkusíme ho získat
      if (!config.apiKey) {
        fetchApiKey().catch((error) => {
          console.error("Nepodařilo se získat API klíč:", error)
        })
      }
    } else if (command === "verify") {
      // Otevření modálního okna pro ověření
      openVerificationModal(options)
    }
  }

  // Zpracování fronty příkazů
  for (var i = 0; i < queue.length; i++) {
    passprove.apply(null, queue[i])
  }

  // Nahrazení globálního objektu
  window.passprove = passprove

  // Přidání CSS stylů
  var css = `
  .passprove-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
  }
  
  .passprove-modal-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .passprove-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;
  }
  
  .passprove-modal-header h3 {
    margin: 0;
    font-size: 18px;
  }
  
  .passprove-modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }
  
  .passprove-modal-body {
    padding: 16px;
  }
  
  .passprove-loading {
    text-align: center;
    padding: 24px 0;
  }
  
  .passprove-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4f46e5;
    border-radius: 50%;
    animation: passprove-spin 1s linear infinite;
  }
  
  @keyframes passprove-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .passprove-methods {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }
  
  .passprove-method {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: none;
    cursor: pointer;
    text-align: left;
  }
  
  .passprove-method:hover {
    background-color: #f9f9f9;
  }
  
  .passprove-method-icon {
    font-size: 24px;
    margin-right: 12px;
  }
  
  .passprove-method h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
  }
  
  .passprove-method p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  
  .passprove-button {
    background-color: #4f46e5;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .passprove-button:hover {
    background-color: #4338ca;
  }
  
  .passprove-button:disabled {
    background-color: #a5a5a5;
    cursor: not-allowed;
  }
  
  .passprove-back {
    background-color: #f3f4f6;
    color: #374151;
  }
  
  .passprove-back:hover {
    background-color: #e5e7eb;
  }
  
  .passprove-error {
    color: #e53e3e;
    text-align: center;
    padding: 16px;
  }
  
  .passprove-error-icon {
    font-size: 48px;
    color: #e53e3e;
    margin-bottom: 16px;
  }
  
  .passprove-success {
    text-align: center;
    padding: 16px;
  }
  
  .passprove-success-icon {
    font-size: 48px;
    color: #10b981;
    margin-bottom: 16px;
  }
  
  .passprove-success-message {
    color: #10b981;
    font-weight: 500;
    margin: 16px 0;
  }
  
  .passprove-file-upload {
    margin: 16px 0;
  }
  
  .passprove-upload-area {
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
  }
  
  .passprove-upload-area:hover {
    background-color: #f9f9f9;
  }
  
  .passprove-upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #a5a5a5;
  }
  
  .passprove-preview {
    text-align: center;
    margin: 16px 0;
  }
  
  .passprove-preview img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .passprove-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }
  
  .passprove-camera {
    position: relative;
    margin: 16px 0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .passprove-camera video {
    width: 100%;
    border-radius: 8px;
  }
  
  .passprove-camera-overlay {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }
  
  .passprove-capture-button {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .passprove-capture-icon {
    font-size: 24px;
  }
  
  .passprove-qr-code {
    text-align: center;
    margin: 24px 0;
  }
  
  .passprove-qr-note {
    text-align: center;
    color: #666;
    font-size: 14px;
    margin-bottom: 16px;
  }
  
  .passprove-method-selector {
    display: flex;
    margin-bottom: 16px;
  }
  
  .passprove-method-button {
    flex: 1;
    padding: 8px;
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    cursor: pointer;
  }
  
  .passprove-method-button:first-child {
    border-radius: 4px 0 0 4px;
  }
  
  .passprove-method-button:last-child {
    border-radius: 0 4px 4px 0;
  }
  
  .passprove-method-button.passprove-active {
    background-color: #4f46e5;
    color: white;
    border-color: #4f46e5;
  }
  
  .passprove-input-group {
    margin-bottom: 16px;
  }
  
  .passprove-input-group label {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    color: #374151;
  }
  
  .passprove-input-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
  
  .passprove-code-input {
    text-align: center;
    margin: 24px 0;
  }
  
  .passprove-code-input input {
    font-size: 24px;
    letter-spacing: 4px;
    text-align: center;
    width: 200px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
`

  var style = document.createElement("style")
  style.type = "text/css"
  style.appendChild(document.createTextNode(css))
  document.head.appendChild(style)
})()

