// Funktion für den Login-Prozess
function setupLogin() {
  console.log("Login-Setup wird ausgeführt");
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorText = document.getElementById("error");
  
  console.log("DOM-Elemente:", { usernameInput, passwordInput, loginButton, errorText });
  
  if (!usernameInput || !passwordInput || !loginButton || !errorText) {
    console.error("Login-Elemente nicht gefunden!");
    return;
  }

  loginButton.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("Login-Button geklickt");

    // Reset error message
    errorText.innerText = "";

    const username = usernameInput.value;
    const password = passwordInput.value;
    
    console.log("Eingaben:", { username: username ? "Vorhanden" : "Leer", password: password ? "Vorhanden" : "Leer" });

    // Basic validation
    if (!username || !password) {
      errorText.innerText = "Benutzername und Passwort müssen ausgefüllt werden.";
      return;
    }

    try {
      console.log("Sende Login-Anfrage...");
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("Antwort erhalten:", response.status);
      const data = await response.json();
      console.log("Antwortdaten:", data);

      if (data?.token) {
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("token", data.token);
        window.location.href = "home.html";
      } else if (data?.error) {
        errorText.style.color = "red";
        errorText.innerText = data.error;
      } else {
        errorText.style.color = "red";
        errorText.innerText = "Unbekannter Fehler";
      }
    } catch (err) {
      errorText.style.color = "red";
      errorText.innerText = "Ein Fehler ist aufgetreten.";
      console.error("Login-Fehler:", err);
    }
  });
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLogin);
} else {
  setupLogin();
}
