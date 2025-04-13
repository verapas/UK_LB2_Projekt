const API_POSTS_URL = '/api/posts'
const postsContainer = document.getElementById('postsContainer')
const postButton = document.getElementById('postButton')
const postContent = document.getElementById('postContent')
const usernameSpan = document.getElementById('username')
const editModal = document.getElementById('editModal')
const closeButton = document.getElementById('closeEditModal')
const editPostContent = document.getElementById('editPostContent')
const editPostId = document.getElementById('editPostId')
const saveEditButton = document.getElementById('saveEditButton')
const logoutButton = document.getElementById('logoutButton')
const editCommentModal = document.getElementById('editCommentModal')
const closeCommentModal = document.getElementById('closeCommentModal')
const editCommentContent = document.getElementById('editCommentContent')
const editCommentId = document.getElementById('editCommentId')
const editCommentPostId = document.getElementById('editCommentPostId')
const saveCommentButton = document.getElementById('saveCommentButton')
const openUserModalButton = document.getElementById('deleteButton')

// Load user from LocalStorage or redirect to login
let currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  // If no user is logged in, redirect to the login page
  window.location.href = 'index.html'
} else {
  // If a user is logged in, display the username
  usernameSpan.textContent = currentUser.username
}

// Modal functions for posts
closeButton.addEventListener('click', () => {
  editModal.style.display = 'none'
})

window.addEventListener('click', (event) => {
  if (event.target === editModal) {
    editModal.style.display = 'none'
  }
  if (event.target === editCommentModal) {
    editCommentModal.style.display = 'none'
  }
})

// Modal functions for comments
closeCommentModal.addEventListener('click', () => {
  editCommentModal.style.display = 'none'
})

saveCommentButton.addEventListener('click', saveCommentEdit)

function sendAuthorizedApiRequest(url, method = 'GET', body) {
  const userData = JSON.parse(localStorage.getItem('user'))
  // todo maybe lock out user if token isn't present
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userData.token}`,
    },
    body,
  })
}

// Create Post
postButton.addEventListener('click', async () => {
  const content = postContent.value.trim()
  if (!content) return alert('Bitte Inhalt eingeben!')

  try {
    const response = await sendAuthorizedApiRequest(
      API_POSTS_URL,
      'POST',
      JSON.stringify({ content })
    )

    if (response.ok) {
      postContent.value = ''
      await loadPosts()
    } else {
      const error = await response.json()
      alert(`Fehler beim Erstellen: ${error.error || 'Unbekannter Fehler'}`)
    }
  } catch (error) {
    console.error('Fehler beim Erstellen:', error)
    alert(
      'Fehler beim Erstellen des Beitrags. Bitte versuche es später erneut.'
    )
  }
})

// Open edit post
function openEditModal(postId, content) {
  editPostId.value = postId
  editPostContent.value = unescapeHTMLForJS(content)
  editModal.style.display = 'flex'
}

// save post
saveEditButton.addEventListener('click', async () => {
  const postId = editPostId.value
  const content = editPostContent.value.trim()

  if (!content) return alert('Bitte Inhalt eingeben!')

  try {
    const response = await sendAuthorizedApiRequest(
      `${API_POSTS_URL}/${postId}`,
      'PUT',
      JSON.stringify({ content })
    )

    if (response.ok) {
      editModal.style.display = 'none'
      await loadPosts()
    } else {
      const error = await response.json()
      alert(`Fehler beim Bearbeiten: ${error.error || 'Unbekannter Fehler'}`)
    }
  } catch (error) {
    console.error('Fehler beim Bearbeiten:', error)
    alert(
      'Fehler beim Bearbeiten des Beitrags. Bitte versuche es später erneut.'
    )
  }
})

async function deletePost(postId) {
  if (!confirm('Möchtest du diesen Beitrag wirklich löschen?')) return

  try {
    const response = await sendAuthorizedApiRequest(
      `${API_POSTS_URL}/${postId}`,
      'DELETE'
    )

    if (response.ok) {
      await loadPosts()
    } else {
      const error = await response.json()
      alert(`Fehler beim Löschen: ${error.error || 'Unbekannter Fehler'}`)
    }
  } catch (error) {
    console.error('Fehler beim Löschen:', error)
    alert('Fehler beim Löschen des Beitrags. Bitte versuche es später erneut.')
  }
}

async function loadPosts() {
  try {
    postsContainer.innerHTML =
      '<div class="loading">Beiträge werden geladen...</div>'

    const res = await sendAuthorizedApiRequest(API_POSTS_URL)

    if (!res.ok) {
      throw new Error('Fehler beim Laden der Beiträge')
    }

    const posts = await res.json()

    postsContainer.innerHTML = ''

    if (posts.length === 0) {
      postsContainer.innerHTML =
        '<div class="no-posts">Keine Beiträge gefunden. Erstelle den ersten Beitrag!</div>'
      return
    }

    // create all posts
    const renderedPosts = await Promise.all(
      posts.map(async (post) => {
        const isOwner =
          post.user_id === currentUser.id ||
          currentUser.role === 'admin' ||
          currentUser.role === 'moderator'

        // load comments
        let commentCount = 0
        try {
          const commentsResponse = await sendAuthorizedApiRequest(
            `${API_POSTS_URL}/${post.id}/comments`
          )
          if (commentsResponse.ok) {
            const comments = await commentsResponse.json()
            commentCount = comments.length
          }
        } catch (error) {
          console.error(
            `Fehler beim Laden der Kommentaranzahl für Post ${post.id}:`,
            error
          )
        }

        const postEl = document.createElement('div')
        postEl.className = 'post box'
        postEl.innerHTML = `
    <div class="post-header">
      <span class="post-author">@${escapeForHTML(post.username) || 'Benutzer ' + post.user_id}</span>
      <small class="post-date">${escapeForHTML(formatDate(post.created_at || new Date()))}</small>
    </div>
    <div class="post-content">
      <p>${escapeForHTML(post.content)}</p>
    </div>
    <div class="post-actions">
      <div class="vote-buttons">
        <button onclick="vote(${post.id}, true)" class="vote-button">😸 <span id="likes-${post.id}">${post.likes || 0}</span></button>
        <button onclick="vote(${post.id}, false)" class="vote-button">😾 <span id="dislikes-${post.id}">${post.dislikes || 0}</span></button>
      </div>
      ${
        isOwner || currentUser.role === 'admin' || currentUser.role === 'moderator'
          ? `
      <div class="post-management">
        <button onclick="openEditModal(${post.id}, '${escapeForHTML(post.content)}')" class="icon-button edit-button">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deletePost(${post.id})" class="icon-button delete-button">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      `
          : ''
      }
    </div>
    
    <!-- add comment section -->
    <div class="comments-section">
      <div class="comments-toggle" onclick="toggleComments(${post.id})">
        <i class="fas fa-comment"></i> Kommentare (<span id="comment-count-${post.id}">${commentCount}</span>)
      </div>
      
      <div id="comments-container-${post.id}" class="comments-container" style="display: none;">
        <div class="comments-list" id="comments-list-${post.id}">
          <!-- comments will be loaded here dynammically -->
        </div>
        
        <div class="create-comment">
          <textarea id="comment-input-${post.id}" placeholder="Schreibe einen Kommentar..."></textarea>
          <button onclick="addComment(${post.id})" class="comment-button">Kommentieren</button>
        </div>
      </div>
    </div>
  `
        return postEl
      })
    )

    // add all posts to cotainer
    renderedPosts.forEach((postEl) => {
      postsContainer.appendChild(postEl)
    })
  } catch (error) {
    console.error('Fehler beim Laden der Beiträge:', error)
    postsContainer.innerHTML =
      '<div class="error">Fehler beim Laden der Beiträge. Bitte versuche es später erneut.</div>'
  }
}

// Like-/Dislike-function
async function vote(postId, isLike) {
  try {
    const response = await sendAuthorizedApiRequest(
      isLike
        ? `${API_POSTS_URL}/${postId}/like`
        : `${API_POSTS_URL}/${postId}/dislike`,
      'POST'
    )

    if (response.ok) {
      await loadPosts()
    } else {
      const error = await response.json()
      console.error('Fehler beim Abstimmen:', error)
    }
  } catch (error) {
    console.error('Fehler beim Abstimmen:', error)
  }
}

// toggle show-comments
function toggleComments(postId) {
  const commentsContainer = document.getElementById(
    `comments-container-${postId}`
  )
  if (commentsContainer.style.display === 'none') {
    commentsContainer.style.display = 'block'
    loadComments(postId)
  } else {
    commentsContainer.style.display = 'none'
  }
}

// load comments
async function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`)
  const commentCount = document.getElementById(`comment-count-${postId}`)

  commentsList.innerHTML =
    '<div class="loading">Kommentare werden geladen...</div>'

  try {
    const response = await sendAuthorizedApiRequest(
      `${API_POSTS_URL}/${postId}/comments`
    )

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Kommentare')
    }

    const comments = await response.json()
    commentsList.innerHTML = ''
    commentCount.textContent = comments.length

    if (comments.length === 0) {
      commentsList.innerHTML =
        '<div class="no-posts">Keine Kommentare vorhanden. Sei der Erste!</div>'
      return
    }

    comments.forEach((comment) => {
      const isCommentOwner =
        comment.user_id === currentUser.id ||
        currentUser.role === 'admin' ||
        currentUser.role === 'moderator'

      const commentEl = document.createElement('div')
      commentEl.className = 'comment'
      commentEl.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">@${escapeForHTML(comment.username)}</span>
          <span class="comment-date">${escapeForHTML(formatDate(comment.created_at))}</span>
        </div>
        <div class="comment-content">
          <p>${escapeForHTML(comment.content)}</p>
        </div>
        ${
          isCommentOwner || currentUser.role === 'admin' || currentUser.role === 'moderator'
            ? `
        <div class="comment-actions">
          <button onclick="openEditCommentModal(${comment.id}, '${escapeForHTML(comment.content)}', ${postId})" class="icon-button edit-button">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteComment(${comment.id}, ${postId})" class="icon-button delete-button">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        `
            : ''
        }
      `
      commentsList.appendChild(commentEl)
    })
  } catch (error) {
    console.error('Fehler beim Laden der Kommentare:', error)
    commentsList.innerHTML =
      '<div class="error">Fehler beim Laden der Kommentare.</div>'
  }
}

async function addComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`)
  const content = commentInput.value.trim()

  if (!content) {
    alert('Bitte gib einen Kommentar ein!')
    return
  }

  try {
    const response = await sendAuthorizedApiRequest(
      `${API_POSTS_URL}/${postId}/comments`,
      'POST',
      JSON.stringify({ content })
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Fehler beim Erstellen des Kommentars')
    }

    // reset comment-input
    commentInput.value = ''

    // Load-comment
    loadComments(postId)
  } catch (error) {
    console.error('Fehler beim Erstellen des Kommentars:', error)
    alert(error.message || 'Fehler beim Erstellen des Kommentars')
  }
}

// Helper function to escape a string for use in HTML attributes
function escapeForHTML(originalString) {
  return originalString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function unescapeHTMLForJS(escapedString) {
  return escapedString
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

// Helper function to format a date in the format
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// logout
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = 'index.html'
})

async function deleteComment(commentId, postId) {
  if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return

  try {
    const response = await sendAuthorizedApiRequest(
      `/api/comments/${commentId}`,
      'DELETE'
    )

    if (response.ok) {
      loadComments(postId)
    } else {
      const error = await response.json()
      alert(`Fehler beim Löschen: ${error.error || 'Unbekannter Fehler'}`)
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error)
    alert(
      'Fehler beim Löschen des Kommentars. Bitte versuche es später erneut.'
    )
  }
}

// oppen comment modal
function openEditCommentModal(commentId, content, postId) {
  editCommentId.value = commentId
  editCommentContent.value = unescapeHTMLForJS(content)
  editCommentPostId.value = postId
  editCommentModal.style.display = 'flex'
}

async function saveCommentEdit() {
  const editCommentModal = document.getElementById('editCommentModal')
  const commentId = document.getElementById('editCommentId').value
  const content = document.getElementById('editCommentContent').value.trim()
  const postId = document.getElementById('editCommentPostId').value

  if (!content) {
    alert('Bitte Inhalt eingeben!')
    return
  }

  try {
    const response = await sendAuthorizedApiRequest(
      `/api/comments/${commentId}`,
      'PUT',
      JSON.stringify({ content })
    )

    if (response.ok) {
      editCommentModal.style.display = 'none'
      loadComments(postId)
    } else {
      const error = await response.json()
      alert(`Fehler beim Bearbeiten: ${error.error || 'Unbekannter Fehler'}`)
    }
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kommentars:', error)
    alert(
      'Fehler beim Bearbeiten des Kommentars. Bitte versuche es später erneut.'
    )
  }
}

// Function to get references to the User Management elements
const userManagementModal = document.getElementById('userManagementModal')
const closeUserManagementModal = document.getElementById(
  'closeUserManagementModal'
)
const userSearchInput = document.getElementById('userSearchInput')
let users = []

// Open the User Management modal when the button is clicked
if (currentUser.role === 'admin') {
  openUserModalButton.addEventListener('click', () => {
    userManagementModal.style.display = 'flex'
    loadUsers()
  })
  openUserModalButton.style.display = 'block'
}

// Close the modal when the close icon is clicked
closeUserManagementModal.addEventListener('click', () => {
  userManagementModal.style.display = 'none'
})

// Close the modal when clicking outside of the modal
window.addEventListener('click', (event) => {
  if (event.target === userManagementModal) {
    userManagementModal.style.display = 'none'
  }
})

// Function to load the users
async function loadUsers() {
  try {
    const response = await sendAuthorizedApiRequest('/api/users') // Passe den Endpunkt ggf. an
    if (response.ok) {
      const responseBody = await response.json()
      users = responseBody.users
      displayUsers(responseBody.users)
    } else {
      console.error('Fehler beim Laden der Benutzer:', response.err)
      alert('Fehler beim Laden der Benutzer')
    }
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error)
    alert('Fehler beim Laden der Benutzer')
  }
}

// Event listener for the search bar - filters the already loaded users
userSearchInput.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase()
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm)
  )
  displayUsers(filteredUsers)
})

// Function to render the user list in the container
function displayUsers(users) {
  const container = document.getElementById('userListContainer')
  container.innerHTML = ''

  if (users.length === 0) {
    container.innerHTML = '<p>Keine Benutzer gefunden</p>'
    return
  }

  users.forEach((user) => {
    const userDiv = document.createElement('div')
    userDiv.className = 'user-item'
    userDiv.innerHTML = `
      <span>${user.username}</span>
      ${
        user.id !== currentUser.id ?
        (user.isBlocked
          ? `<button class="action-button" disabled >Gesperrt</button>`
          : `<button class="action-button" onClick="blockUser(${user.id})">
            Sperren
          </button>`) : ''
      }
    `
    container.appendChild(userDiv)
  })
}

// Function to block a user
async function blockUser(userId) {
  if (!confirm('Möchtest du diesen Benutzer wirklich sperren?')) return
  try {
    const response = await sendAuthorizedApiRequest(
      `/api/users/${userId}/block`,
      'POST'
    )
    if (response.ok) {
      loadUsers() // Reload the list to display the change
    } else {
      const errorData = await response.json()
      alert('Fehler beim Sperren: ' + (errorData.error || 'Unbekannter Fehler'))
    }
  } catch (error) {
    console.error('Fehler beim Sperren des Benutzers:', error)
    alert('Fehler beim Sperren des Benutzers')
  }
}

// Display posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadPosts()
})
