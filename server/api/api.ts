import { Express, NextFunction, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db, Post, User } from '../database'

const secretKey = process.env.SECRET_KEY || 'fallback-secret-key'

interface MiniTwitterJwtPayload extends jwt.JwtPayload {
  id: number
  username: string
  role: string
}

interface AuthenticatedRequest extends Request {
  user?: MiniTwitterJwtPayload
}

/**
 * Guard for MiniTwitterJwtPayload
 * @param payload
 */
const verifyJetPayloadIsMiniTwitterPayload = (
  payload: string | jwt.JwtPayload
): payload is MiniTwitterJwtPayload =>
  typeof payload !== 'string' &&
  typeof payload['id'] === 'number' &&
  typeof payload['username'] === 'string' &&
  payload['username'].length > 0 &&
  typeof payload['role'] === 'string' &&
  payload['role'].length > 0

export class API {
  // Properties
  app: Express

  // Constructor
  constructor(app: Express) {
    this.app = app
    this.setupRoutes()
  }

  // Setup all routes
  private setupRoutes() {
    // Auth routes
    this.app.post(
      '/api/register',
      [
        body('username')
          .isLength({ min: 3 })
          .withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
        body('password')
          .isLength({ min: 6 })
          .withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
      ],
      this.register.bind(this)
    )
    this.app.post(
      '/api/login',
      [
        body('username')
          .notEmpty()
          .withMessage('Benutzername ist erforderlich'),
        body('password').notEmpty().withMessage('Passwort ist erforderlich'),
      ],
      this.login.bind(this)
    )

    // Protected routes
    this.app.post(
      '/api/posts',
      this.authenticateToken.bind(this),
      [body('content').notEmpty().withMessage('Inhalt darf nicht leer sein')],
      this.createPost.bind(this)
    )
    this.app.get(
      '/api/posts',
      this.authenticateToken.bind(this),
      this.getPosts.bind(this)
    )
    this.app.put(
      '/api/posts/:id',
      this.authenticateToken.bind(this),
      [body('content').notEmpty().withMessage('Inhalt darf nicht leer sein')],
      this.updatePost.bind(this)
    )
    this.app.delete(
      '/api/posts/:id',
      this.authenticateToken.bind(this),
      this.deletePost.bind(this)
    )
    this.app.post(
      '/api/posts/:id/comments',
      this.authenticateToken.bind(this),
      [body('content').notEmpty().withMessage('Kommentarinhalt darf nicht leer sein')],
      this.createComment.bind(this)
    );

    this.app.put(
      '/api/comments/:id',
      this.authenticateToken.bind(this),
      [body('content').notEmpty().withMessage('Kommentarinhalt darf nicht leer sein')],
      this.updateComment.bind(this)
    );

    this.app.delete(
      '/api/comments/:id',
      this.authenticateToken.bind(this),
      this.deleteComment.bind(this)
    );

    this.app.get(
      '/api/posts/:id/comments',
      this.authenticateToken.bind(this),
      this.getCommentsByPostId.bind(this)
    );

    this.app.post(
      '/api/posts/:id/dislike',
      this.authenticateToken.bind(this),
      this.dislikePost.bind(this)
    );
    this.app.post(
      '/api/posts/:id/like',
      this.authenticateToken.bind(this),
      this.likePost.bind(this)
    )

    this.app.put(
      '/api/users/:id',
      this.authenticateToken.bind(this),
      [
        body('username')
          .isLength({ min: 3 })
          .withMessage('Benutzername muss mindestens 3 Zeichen lang sein'),
        body('currentPassword')
          .notEmpty()
          .withMessage('Aktuelles Passwort ist erforderlich'),
      ],
      this.updateUser.bind(this)
    );
  }

  // Authentication middleware
  private authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Zugriff verweigert. Token fehlt.' })
    }

    jwt.verify(token, secretKey, (err, payload) => {
      if (err || !verifyJetPayloadIsMiniTwitterPayload(payload)) {
        return res
          .status(403)
          .json({ error: 'Ungültiges oder abgelaufenes Token.' })
      }
      req.user = payload
      next()
    })
  }

  // Register endpoint
  private async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg })
      }

      const { username, password } = req.body

      // Check if user exists
      const checkUserQuery = `SELECT *
                              FROM users
                              WHERE username = ?`
      const users = await db.executeSQL<User>(checkUserQuery, [username])

      // Check if users is an array and has items
      if (Array.isArray(users) && users.length > 0) {
        return res.status(400).json({ error: 'Benutzername bereits vergeben' })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert new user
      const insertQuery = `INSERT INTO users (username, password, role)
                           VALUES (?, ?, 'user')`
      await db.executeSQL(insertQuery, [username, hashedPassword])

      res.status(201).json({ status: 'registered' })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Interner Serverfehler' })
    }
  }

  // Login endpoint
  private async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg })
      }

      const { username, password } = req.body

      // Get user
      const query = `SELECT *
                     FROM users
                     WHERE username = ?`
      const users = await db.executeSQL<User>(query, [username])

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' })
      }

      const user = users[0]

      // Check password
      const passwordValid = await bcrypt.compare(password, user.password)
      if (!passwordValid) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' })
      }

      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        secretKey,
        { expiresIn: '1h' }
      )

      res.json({ token, username: user.username, id: user.id, role: user.role })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Interner Serverfehler' })
    }
  }

  // Get posts endpoint
  private async getPosts(_: AuthenticatedRequest, res: Response) {
    try {
      const query = `
        SELECT p.*, u.username,
               CAST((SELECT COUNT(*) FROM likes WHERE post_id = p.id AND is_like = true) AS CHAR) as likes,
               CAST((SELECT COUNT(*) FROM likes WHERE post_id = p.id AND is_like = false) AS CHAR) as dislikes
        FROM posts p
               JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `;

      const posts = await db.executeSQL<Post & { username: string; likes: number; dislikes: number }>(query);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private getAllPostsByUserId = async (_: Request, res: Response) => {
    try {
      const result = await db.executeSQL<Post>(
        'SELECT * FROM posts ORDER BY created_at DESC'
      )
      res.status(200).json(result)
    } catch (err) {
      console.error('Error loading posts:', err)
      res
        .status(500)
        .json({ error: 'An error occurred while loading the posts' })
    }
  }

  // Create post endpoint
  private async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg })
      }

      const { content } = req.body
      const user = req.user

      const query = `INSERT INTO posts (content, user_id, created_at)
                     VALUES (?, ?, NOW())`
      await db.executeSQL(query, [content, user.id])

      res.status(201).json({ status: 'created' })
    } catch (error) {
      console.error('Error creating post:', error)
      res.status(500).json({ error: 'Interner Serverfehler' })
    }
  }

  private updatePost = async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.id
    const { content } = req.body

    // todo make sure users can only update their own posts

    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }

    try {
      const post = await db.executeSQL<Post>(
        'SELECT * FROM posts WHERE id = ?',
        [postId]
      )

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // You can add logic here to check user permissions

      const result = await db.executeSQL(
        'UPDATE posts SET content = ? WHERE id = ?',
        [content, postId]
      )

      res.status(200).json({ message: 'Post updated', result })
    } catch (err) {
      console.error('Error updating post:', err)
      res
        .status(500)
        .json({ error: 'An error occurred while updating the post' })
    }
  }

  private deletePost = async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.id

    try {
      const post = await db.executeSQL<Post>(
        'SELECT * FROM posts WHERE id = ?',
        [postId]
      )

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // You can add logic here to check user permissions

      const result = await db.executeSQL('DELETE FROM posts WHERE id = ?', [
        postId,
      ])

      res.status(200).json({ message: 'Post deleted', result })
    } catch (err) {
      console.error('Error deleting post:', err)
      res
        .status(500)
        .json({ error: 'An error occurred while deleting the post' })
    }
  }

  private async createComment(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const postId = req.params.id;
      const { content } = req.body;
      const user = req.user;

      // Check if Post exists
      const post = await db.executeSQL<Post>(
        'SELECT * FROM posts WHERE id = ?',
        [postId]
      );

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Beitrag nicht gefunden' });
      }

      // create Comment
      const query = `INSERT INTO comments (content, user_id, post_id, created_at)
                     VALUES (?, ?, ?, NOW())`;
      const result = await db.executeSQL(query, [content, user.id, postId]);

      res.status(201).json({
        status: 'created',
        commentId: Array.isArray(result) ? null : result.insertId
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }

  private async updateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const commentId = req.params.id;
      const { content } = req.body;
      const user = req.user;

      // check if comment exists
      const comment = await db.executeSQL<{
        id: number,
        content: string,
        user_id: number,
        post_id: number,
        created_at: Date
      }>(
        'SELECT * FROM comments WHERE id = ?',
        [commentId]
      );

      if (!comment || (Array.isArray(comment) && comment.length === 0)) {
        return res.status(404).json({ error: 'Kommentar nicht gefunden' });
      }

      // role-based access control
      if (Array.isArray(comment) &&
        comment[0].user_id !== user.id &&
        user.role !== 'admin' &&
        user.role !== 'moderator') {
        return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten dieses Kommentars' });
      }

      // update comment
      const result = await db.executeSQL(
        'UPDATE comments SET content = ? WHERE id = ?',
        [content, commentId]
      );

      res.status(200).json({ message: 'Kommentar aktualisiert', result });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }

  }

  private async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const commentId = req.params.id;
      const user = req.user;

      // check if comment exist
      const comment = await db.executeSQL<{
        id: number,
        content: string,
        user_id: number,
        post_id: number,
        created_at: Date
      }>(
        'SELECT * FROM comments WHERE id = ?',
        [commentId]
      );

      if (!comment || (Array.isArray(comment) && comment.length === 0)) {
        return res.status(404).json({ error: 'Kommentar nicht gefunden' });
      }

      // role based validation
      if (Array.isArray(comment) &&
        comment[0].user_id !== user.id &&
        user.role !== 'admin' &&
        user.role !== 'moderator') {
        return res.status(403).json({ error: 'Keine Berechtigung zum Löschen dieses Kommentars' });
      }

      // delete comment
      const result = await db.executeSQL(
        'DELETE FROM comments WHERE id = ?',
        [commentId]
      );

      res.status(200).json({ message: 'Kommentar gelöscht', result });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }

  private async getCommentsByPostId(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = req.params.id;

      // check if post exists
      const post = await db.executeSQL<Post>(
        'SELECT * FROM posts WHERE id = ?',
        [postId]
      );

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Beitrag nicht gefunden' });
      }

      // get comments and related user-name
      const query = `
        SELECT c.*, u.username
        FROM comments c
               JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at
      `;

      const comments = await db.executeSQL(query, [postId]);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }

  private likePost = async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.id;
    const userId = req.user.id; // The logged-in user

    if (!postId || isNaN(Number(postId))) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      const sql = `
        INSERT INTO likes (user_id, post_id, is_like)
        VALUES (?, ?, true)
        ON DUPLICATE KEY UPDATE is_like = true
      `;
      await db.executeSQL(sql, [userId.toString(), postId]);

      res.status(200).json({ message: 'Post liked' });
    } catch (err) {
      console.error('Error when liking:', err);
      res.status(500).json({ error: 'Error when liking post' });
    }
  }
  private dislikePost = async (req: AuthenticatedRequest, res: Response) => {
    const postId = req.params.id;
    const userId = req.user.id; // The logged-in user

    if (!postId || isNaN(Number(postId))) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    try {
      const sql = `
        INSERT INTO likes (user_id, post_id, is_like)
        VALUES (?, ?, false)
        ON DUPLICATE KEY UPDATE is_like = false
      `;
      await db.executeSQL(sql, [userId.toString(), postId]);

      res.status(200).json({ message: 'Post disliked' });
    } catch (err) {
      console.error('Error when disliking:', err);
      res.status(500).json({ error: 'Error when disliking post' });
    }
  }

  private async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const userId = req.params.id;
      const { username, currentPassword, newPassword } = req.body;

      // Benutzer aus der Datenbank abrufen
      const userQuery = `SELECT *
                         FROM users
                         WHERE id = ?`;
      const users = await db.executeSQL<User>(userQuery, [userId]);

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      const user = users[0];

      // Überprüfe das aktuelle Passwort
      const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
      }

      // Prüfe, ob der neue Benutzername bereits vergeben ist
      if (username !== user.username) {
        const checkUsernameQuery = `SELECT *
                                    FROM users
                                    WHERE username = ?
                                      AND id != ?`;
        const existingUsers = await db.executeSQL<User>(checkUsernameQuery, [username, userId]);

        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          return res.status(400).json({ error: 'Benutzername bereits vergeben' });
        }
      }

      // Update ausführen
      let updateQuery: string, params: string[];
      if (newPassword) {
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Neues Passwort muss mindestens 6 Zeichen lang sein' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateQuery = `UPDATE users
                       SET username = ?,
                           password = ?
                       WHERE id = ?`;
        params = [username, hashedPassword, userId];
      } else {
        updateQuery = `UPDATE users
                       SET username = ?
                       WHERE id = ?`;
        params = [username, userId];
      }

      await db.executeSQL(updateQuery, params);

      // Neues Token erstellen
      const token = jwt.sign(
        { id: user.id, username: username, role: user.role },
        secretKey,
        { expiresIn: '1h' }
      );

      res.json({
        message: 'Profil erfolgreich aktualisiert',
        token,
        username,
        id: user.id,
        role: user.role
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
}