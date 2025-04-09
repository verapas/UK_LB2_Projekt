const API_URL = '/api'
const userPostsContainer = document.getElementById('userPostsContainer')
const usernameInput = document.getElementById('username')
const currentPasswordInput = document.getElementById('currentPassword')
const newPasswordInput = document.getElementById('newPassword')
const confirmPasswordInput = document.getElementById('confirmPassword')
const saveProfileButton = document.getElementById('saveProfileButton')
const errorMessage = document.getElementById('error-message')
const logoutButton = document.getElementById('logoutButton')

// Benutzer aus LocalStorage laden oder zum Login weiterleiten
let currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  window.location.href = 'index.html'
} else {
  usernameInput.value = currentUser.username
}

// Benutzerprofil speichern
saveProfileButton.addEventListener('click', async () => {
  errorMessage.textContent = ''

  const username = usernameInput.value.trim()
  const currentPassword = currentPasswordInput.value
  const newPassword = newPasswordInput.value
  const confirmPassword = confirmPasswordInput.value

  // Validierungen
  if (!username) {
    return showError('Benutzername darf nicht leer sein.')
  }

  if (!currentPassword) {
    return showError('Aktuelles Passwort wird benötigt.')
  }

  if (newPassword && newPassword.length < 6) {
    return showError('Neues Passwort muss mindestens 6 Zeichen lang sein.')
  }

  if (newPassword && newPassword !== confirmPassword) {
    return showError('Passwörter stimmen nicht überein.')
  }

  try {
    const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        username,
        currentPassword,
        newPassword: newPassword || undefined
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return showError(error.error || 'Fehler beim Aktualisieren des Profils.')
    }

    const data = await response.json()

    // Aktualisiere den Benutzer im LocalStorage
    currentUser.username = username
    localStorage.setItem('user', JSON.stringify(currentUser))

    // Passwortfelder zurücksetzen
    currentPasswordInput.value = ''
    newPasswordInput.value = ''
    confirmPasswordInput.value = ''

    showError('Profil erfolgreich aktualisiert!', false)

    // Nach 2 Sekunden zurück zur Hauptseite
    setTimeout(() => {
      window.location.href = 'home.html'
    }, 2000)

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error)
    showError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.')
  }
})

// Fehler anzeigen (oder Erfolgsmeldung)
function showError(message, isError = true) {
  errorMessage.textContent = message
  errorMessage.style.color = isError ? '#e0245e' : '#4BB543'
}

// Beiträge des Benutzers laden
async function loadUserPosts() {
  try {
    userPostsContainer.innerHTML = '<div class="loading">Beiträge werden geladen...</div>'

    const response = await fetch(`${API_URL}/posts?userId=${currentUser.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Beiträge')
    }

    const posts = await response.json()

    userPostsContainer.innerHTML = ''

    if (posts.length === 0) {
      userPostsContainer.innerHTML = '<p class="no-posts">Du hast noch keine Beiträge erstellt.</p>'
      return
    }

    posts.forEach(post => {
      const postEl = document.createElement('div')
      postEl.className = 'post'
      postEl.innerHTML = `
        <div class="post-content">
          <p>${post.content}</p>
        </div>
        <div class="post-footer">
          <small class="post-date">${formatDate(post.created_at || new Date())}</small>
          <div class="post-stats">
            <span title="Gefällt mir"><i class="fas fa-smile"></i> ${post.likes || 0}</span>
            <span title="Gefällt mir nicht"><i class="fas fa-frown"></i> ${post.dislikes || 0}</span>
          </div>
        </div>
      `
      userPostsContainer.appendChild(postEl)
    })
  } catch (error) {
    console.error('Fehler beim Laden der Beiträge:', error)
    userPostsContainer.innerHTML = '<p class="error">Fehler beim Laden der Beiträge.</p>'
  }
}

// Hilfsfunktion zum Formatieren des Datums
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Abmelden
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = 'index.html'
})

// Beiträge beim Laden der Seite anzeigen
document.addEventListener('DOMContentLoaded', () => {
  loadUserPosts()
})