// Funktion für den Registrierungs-Prozess
function setupRegister() {
  console.log("Registrierungs-Setup wird ausgeführt");
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("passwordConfirm"); // Note the ID difference
  const registerButton = document.getElementById("register");
  const errorText = document.getElementById("error");
  
  console.log("DOM-Elemente:", { 
    usernameInput, 
    passwordInput, 
    confirmPasswordInput, 
    registerButton, 
    errorText 
  });
  
  if (!usernameInput || !passwordInput || !confirmPasswordInput || !registerButton || !errorText) {
    console.error("Registrierungs-Elemente nicht gefunden!");
    return;
  }

  registerButton.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("Registrierungs-Button geklickt");
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    console.log("Eingaben:", { 
      username: username ? "Vorhanden (Länge: " + username.length + ")" : "Leer", 
      password: password ? "Vorhanden" : "Leer",
      confirmPassword: confirmPassword ? "Vorhanden" : "Leer"
    });

    // Reset error message
    errorText.innerText = "";

    // Validation
    if (!username || !password || !confirmPassword) {
      errorText.innerText = "Alle Felder müssen ausgefüllt werden.";
      return;
    }
    if (password !== confirmPassword) {
      errorText.innerText = "Passwörter stimmen nicht überein.";
      return;
    }

    try {
      console.log("Sende Registrierungs-Anfrage...");
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      console.log("Antwort erhalten:", response.status);
      const data = await response.json();
      console.log("Antwortdaten:", data);

      if (response.ok) {
        errorText.style.color = "lightgreen";
        errorText.innerText = "Registrierung erfolgreich! Sie werden weitergeleitet...";

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        errorText.style.color = "red";
        errorText.innerText = data.error || "Registrierung fehlgeschlagen.";
      }
    } catch (err) {
      errorText.style.color = "red";
      errorText.innerText = "Ein Fehler ist aufgetreten.";
      console.error("Registrierungsfehler:", err);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupRegister);
} else {
  setupRegister();
}
