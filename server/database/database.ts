import mysql from 'mysql2/promise'
import { COMMENT_TABLE, LIKE_TABLE, POST_TABLE, USER_TABLE } from './schema'

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

  // Methods
  private initializeDBSchema = async () => {
    console.log('Initializing DB schema...')
    await this.executeSQL(USER_TABLE)
    await this.executeSQL(POST_TABLE)
    await this.executeSQL(COMMENT_TABLE)
    await this.executeSQL(LIKE_TABLE)
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
