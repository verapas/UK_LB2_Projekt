import { Request, Response, Express } from 'express'
import { db } from '../database'

export class API {
  app: Express

  constructor(app: Express) {
    this.app = app

    // Test route
    this.app.get('/hello', this.sayHello)

    this.app.post('/api/posts', this.createPost.bind(this))
    this.app.get('/api/posts', this.getAllPosts.bind(this))
    this.app.put('/api/posts/:id', this.updatePost.bind(this))
    this.app.delete('/api/posts/:id', this.deletePost.bind(this))
  }

  private sayHello(req: Request, res: Response) {
    res.send('Hello There!')
  }

  private createPost = async (req: Request, res: Response) => {
    const { content, userId } = req.body

    if (!content || !userId) {
      return res.status(400).json({ error: 'Content and userId are required' })
    }

    try {
      const result = await db.executeSQL(
        'INSERT INTO post (content, userId) VALUES (?, ?)',
        [content, userId]
      )
      res.status(201).json({ message: 'Post created', result })
    } catch (err) {
      console.error('Error creating post:', err)
      res.status(500).json({ error: 'An error occurred while creating the post' })
    }
  }

  private getAllPosts = async (req: Request, res: Response) => {
    try {
      const result = await db.executeSQL('SELECT * FROM post ORDER BY createdAt DESC')
      res.status(200).json(result)
    } catch (err) {
      console.error('Error loading posts:', err)
      res.status(500).json({ error: 'An error occurred while loading the posts' })
    }
  }

  private updatePost = async (req: Request, res: Response) => {
    const postId = req.params.id
    const { content, userId } = req.body

    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }

    try {
      const post = await db.executeSQL('SELECT * FROM post WHERE id = ?', [postId])

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // You can add logic here to check user permissions

      const result = await db.executeSQL(
        'UPDATE post SET content = ? WHERE id = ?',
        [content, postId]
      )

      res.status(200).json({ message: 'Post updated', result })
    } catch (err) {
      console.error('Error updating post:', err)
      res.status(500).json({ error: 'An error occurred while updating the post' })
    }
  }

  private deletePost = async (req: Request, res: Response) => {
    const postId = req.params.id

    try {
      const post = await db.executeSQL('SELECT * FROM post WHERE id = ?', [postId])

      if (!post || (Array.isArray(post) && post.length === 0)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // You can add logic here to check user permissions

      const result = await db.executeSQL(
        'DELETE FROM post WHERE id = ?',
        [postId]
      )

      res.status(200).json({ message: 'Post deleted', result })
    } catch (err) {
      console.error('Error deleting post:', err)
      res.status(500).json({ error: 'An error occurred while deleting the post' })
    }
  }
}
