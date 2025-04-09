import mysql from 'mysql2/promise'
import { USER_TABLE, POST_TABLE, COMMENT_TABLE, LIKE_TABLE } from './schema'

export class Database {
  private _pool: mysql.Pool

  constructor() {
    this._pool = mysql.createPool({
      database: process.env.DB_NAME || 'minitwitter',
      host: process.env.DB_HOST || 'mariadb',
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

  private initializeDBSchema = async () => {
    console.log('Initializing DB schema...')
    await this.executeSQL(USER_TABLE)
    await this.executeSQL(POST_TABLE)
    await this.executeSQL(COMMENT_TABLE)
    await this.executeSQL(LIKE_TABLE)
  }

  public executeSQL = async <T = any>(query: string, params: any[] = []): Promise<T[] | mysql.ResultSetHeader> => {
    try {
      const conn = await this._pool.getConnection();
      try {
        const [result] = await conn.query(query, params);
        return result as T[] | mysql.ResultSetHeader;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Error executing SQL query:');
      console.error(query);
      console.error('Parameters:', params);
      console.error(err);
      throw err;
    }
  }
}
