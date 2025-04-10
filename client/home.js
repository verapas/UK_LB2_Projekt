const API_POSTS_URL = '/api/posts'
const postsContainer = document.getElementById('postsContainer')
const postButton = document.getElementById('postButton')
const postContent = document.getElementById('postContent')
const usernameSpan = document.getElementById('username')
const editModal = document.getElementById('editModal')
const closeButton = document.querySelector('.close-button')
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

// Benutzer aus LocalStorage laden oder zum Login weiterleiten
let currentUser = JSON.parse(localStorage.getItem('user'))
if (!currentUser) {
  // Wenn kein Benutzer eingeloggt ist, auf die Login-Seite umleiten
  window.location.href = 'index.html'
} else {
  // Wenn ein Benutzer eingeloggt ist, den Benutzernamen anzeigen
  usernameSpan.textContent = currentUser.username
}

// Modal-Funktionen für Posts
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

// Modal-Funktionen für Kommentare
closeCommentModal.addEventListener('click', () => {
  editCommentModal.style.display = 'none'
})

// Kommentar speichern
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

// Beitrag erstellen
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

// Beitrag bearbeiten öffnen
function openEditModal(postId, content) {
  editPostId.value = postId
  editPostContent.value = content
  editModal.style.display = 'block'
}

// Beitrag speichern
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

// Beitrag löschen
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

// Beiträge vom Server laden
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

    // Alle Posts erstellen
    const renderedPosts = await Promise.all(posts.map(async (post) => {
      const isOwner =
        post.user_id === currentUser.id ||
        currentUser.role === 'admin' ||
        currentUser.role === 'moderator'
      
      // Kommentare im Voraus laden
      let commentCount = 0;
      try {
        const commentsResponse = await sendAuthorizedApiRequest(`${API_POSTS_URL}/${post.id}/comments`);
        if (commentsResponse.ok) {
          const comments = await commentsResponse.json();
          commentCount = comments.length;
        }
      } catch (error) {
        console.error(`Fehler beim Laden der Kommentaranzahl für Post ${post.id}:`, error);
      }
      
      const postEl = document.createElement('div')
      postEl.className = 'post box'
      postEl.innerHTML = `
    <div class="post-header">
      <span class="post-author">@${post.username || 'Benutzer ' + post.user_id}</span>
      <small class="post-date">${formatDate(post.created_at || new Date())}</small>
    </div>
    <div class="post-content">
      <p>${post.content}</p>
    </div>
    <div class="post-actions">
      <div class="vote-buttons">
        <button onclick="vote(${post.id}, true)" class="vote-button">😸 <span id="likes-${post.id}">${post.likes || 0}</span></button>
        <button onclick="vote(${post.id}, false)" class="vote-button">😾 <span id="dislikes-${post.id}">${post.dislikes || 0}</span></button>
      </div>
      ${
        isOwner
          ? `
      <div class="post-management">
        <button onclick="openEditModal(${post.id}, '${escapeJS(post.content)}')" class="icon-button edit-button">
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
    
    <!-- Kommentarbereich hinzufügen -->
    <div class="comments-section">
      <div class="comments-toggle" onclick="toggleComments(${post.id})">
        <i class="fas fa-comment"></i> Kommentare (<span id="comment-count-${post.id}">${commentCount}</span>)
      </div>
      
      <div id="comments-container-${post.id}" class="comments-container" style="display: none;">
        <div class="comments-list" id="comments-list-${post.id}">
          <!-- Kommentare werden hier dynamisch eingefügt -->
        </div>
        
        <div class="create-comment">
          <textarea id="comment-input-${post.id}" placeholder="Schreibe einen Kommentar..."></textarea>
          <button onclick="addComment(${post.id})" class="comment-button">Kommentieren</button>
        </div>
      </div>
    </div>
  `
      return postEl;
    }));
    
    // Alle Posts zum Container hinzufügen
    renderedPosts.forEach(postEl => {
      postsContainer.appendChild(postEl);
    });
    
  } catch (error) {
    console.error('Fehler beim Laden der Beiträge:', error)
    postsContainer.innerHTML =
      '<div class="error">Fehler beim Laden der Beiträge. Bitte versuche es später erneut.</div>'
  }
}

// Like-/Dislike-Funktion
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


// Kommentare ein-/ausblenden
function toggleComments(postId) {
  const commentsContainer = document.getElementById(`comments-container-${postId}`);
  if (commentsContainer.style.display === 'none') {
    commentsContainer.style.display = 'block';
    loadComments(postId);
  } else {
    commentsContainer.style.display = 'none';
  }
}

// Kommentare laden
async function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  const commentCount = document.getElementById(`comment-count-${postId}`);

  commentsList.innerHTML = '<div class="loading">Kommentare werden geladen...</div>';

  try {
    const response = await sendAuthorizedApiRequest(`${API_POSTS_URL}/${postId}/comments`);

    if (!response.ok) {
      throw new Error('Fehler beim Laden der Kommentare');
    }

    const comments = await response.json();
    commentsList.innerHTML = '';
    commentCount.textContent = comments.length;

    if (comments.length === 0) {
      commentsList.innerHTML = '<div class="no-posts">Keine Kommentare vorhanden. Sei der Erste!</div>';
      return;
    }

    comments.forEach(comment => {
      const isCommentOwner =
        comment.user_id === currentUser.id ||
        currentUser.role === 'admin' ||
        currentUser.role === 'moderator';

      const commentEl = document.createElement('div');
      commentEl.className = 'comment';
      commentEl.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">@${comment.username}</span>
          <span class="comment-date">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-content">
          <p>${comment.content}</p>
        </div>
        ${isCommentOwner ? `
        <div class="comment-actions">
          <button onclick="editComment(${comment.id}, '${escapeJS(comment.content)}', ${postId})" class="icon-button edit-button">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteComment(${comment.id}, ${postId})" class="icon-button delete-button">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ` : ''}
      `;
      commentsList.appendChild(commentEl);
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kommentare:', error);
    commentsList.innerHTML = '<div class="error">Fehler beim Laden der Kommentare.</div>';
  }
}

// Kommentar hinzufügen
async function addComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const content = commentInput.value.trim();

  if (!content) {
    alert('Bitte gib einen Kommentar ein!');
    return;
  }

  try {
    const response = await sendAuthorizedApiRequest(
      `${API_POSTS_URL}/${postId}/comments`,
      'POST',
      JSON.stringify({ content })
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Fehler beim Erstellen des Kommentars');
    }

    // Kommentarfeld zurücksetzen
    commentInput.value = '';

    // Kommentare neu laden
    loadComments(postId);
  } catch (error) {
    console.error('Fehler beim Erstellen des Kommentars:', error);
    alert(error.message || 'Fehler beim Erstellen des Kommentars');
  }
}

// Hilfsfunktion zum Escapen von JavaScript-Strings für HTML-Attribute
function escapeJS(string) {
  return string
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// Hilfsfunktion zum Formatieren des Datums
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

// Abmelden
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = 'index.html'
})

// Kommentar löschen
async function deleteComment(commentId, postId) {
  if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return;

  try {
    const response = await sendAuthorizedApiRequest(
      `/api/comments/${commentId}`,
      'DELETE'
    );

    if (response.ok) {
      // Kommentare neu laden
      loadComments(postId);
    } else {
      const error = await response.json();
      alert(`Fehler beim Löschen: ${error.error || 'Unbekannter Fehler'}`);
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    alert('Fehler beim Löschen des Kommentars. Bitte versuche es später erneut.');
  }
}

// Kommentar-Modal öffnen
function editComment(commentId, content, postId) {
  editCommentId.value = commentId;
  editCommentContent.value = content;
  editCommentPostId.value = postId;
  editCommentModal.style.display = 'block';
}

// Kommentar speichern
async function saveCommentEdit() {
  const editCommentModal = document.getElementById('editCommentModal');
  const commentId = document.getElementById('editCommentId').value;
  const content = document.getElementById('editCommentContent').value.trim();
  const postId = document.getElementById('editCommentPostId').value;

  if (!content) {
    alert('Bitte Inhalt eingeben!');
    return;
  }

  try {
    const response = await sendAuthorizedApiRequest(
      `/api/comments/${commentId}`,
      'PUT',
      JSON.stringify({ content })
    );

    if (response.ok) {
      editCommentModal.style.display = 'none';
      loadComments(postId);
    } else {
      const error = await response.json();
      alert(`Fehler beim Bearbeiten: ${error.error || 'Unbekannter Fehler'}`);
    }
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kommentars:', error);
    alert('Fehler beim Bearbeiten des Kommentars. Bitte versuche es später erneut.');
  }
}

// Beiträge beim Laden der Seite anzeigen
document.addEventListener('DOMContentLoaded', () => {
  loadPosts()
})
