import mysql from 'mysql2/promise'
import { COMMENT_TABLE, LIKE_TABLE, POST_TABLE, USER_TABLE } from './schema'
import bcrypt from 'bcrypt'

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

class Database {
  // Properties
  private _pool: mysql.Pool

  // Constructor
  constructor() {
    this._pool = mysql.createPool({
      database: process.env.DB_NAME || 'minitwitter',
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'minitwitter',
      password: process.env.DB_PASSWORD || 'supersecret123',
      connectionLimit: 5,
    })

    this.initializeDBSchema()
      .then(() => console.log('Database initialized'))
      .catch((err) => {
        console.error('Database initialization failed:', err)
      })
  }

  /**
   * Initializes the database schema by creating the necessary tables and seeding initial data.
   */
  private initializeDBSchema = async () => {
    // Drop tables if they exist
    await this.executeSQL('DROP TABLE IF EXISTS likes')
    await this.executeSQL('DROP TABLE IF EXISTS comments')
    await this.executeSQL('DROP TABLE IF EXISTS posts')
    await this.executeSQL('DROP TABLE IF EXISTS users')

    // Create tables
    await this.executeSQL(USER_TABLE)
    await this.executeSQL(POST_TABLE)
    await this.executeSQL(COMMENT_TABLE)
    await this.executeSQL(LIKE_TABLE)

    // Seed data
    // Create users
    const hashedPassword = await bcrypt.hash('123456', 10)
    await this.executeSQL(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['user', hashedPassword, UserRole.USER]
    )
    await this.executeSQL(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['moderator', hashedPassword, UserRole.MODERATOR]
    )
    await this.executeSQL(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, UserRole.ADMIN]
    )

    // Create posts
    await this.executeSQL(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [
        '1',
        'Hallo :) ich bin ein Benutzer mit der Rolle "user" und mache einen Post. und du so?',
      ]
    )
    await this.executeSQL(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      ['2', 'Ich bin ein Moderator und kann all euer Post bearbeiten!']
    )
    await this.executeSQL(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [
        '3',
        'Als Administrator kann ich nicht nur eure Kommentare löschen, sondern eure Profile sogar deaktivieren!',
      ]
    )

    // Create comments
    await this.executeSQL(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      ['3', '1', 'Da bin ich ja voll neidisch']
    )
    await this.executeSQL(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      ['2', '2', 'Interessanter Beitrag']
    )
    await this.executeSQL(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [
        '1',
        '3',
        'Hallo :) freut mich das du unsre Platform nutzt um diesen Kommentar zu schreiben',
      ]
    )
  }

  public executeSQL = async <T>(
    query: string,
    params: string[] = []
  ): Promise<T[] | mysql.ResultSetHeader> => {
    try {
      const conn = await this._pool.getConnection()
      try {
        const [result] = await conn.query(query, params)
        return result as T[] | mysql.ResultSetHeader
      } finally {
        conn.release()
      }
    } catch (err) {
      console.error('Error executing SQL query:')
      console.error(query)
      console.error('Parameters:', params)
      console.error(err)
      throw err
    }
  }
}

export const db = new Database()
