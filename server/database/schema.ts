interface User {
  id: number
  username: string
  password: string
  role: string,
  isBlocked: boolean
}

const USER_TABLE = `
  CREATE TABLE IF NOT EXISTS users
  (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username  VARCHAR(50)  NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    role      VARCHAR(10)  NOT NULL,
    isBlocked BOOLEAN default false,
    PRIMARY KEY (id)
  );`

interface Post {
  id: number
  user_id: number
  content: string
  created_at: Date
}

const POST_TABLE = `
  CREATE TABLE IF NOT EXISTS posts
  (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED NOT NULL,
    content    MEDIUMTEXT   NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );`

interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: Date
}

const COMMENT_TABLE = `
  CREATE TABLE IF NOT EXISTS comments
  (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id    INT UNSIGNED NOT NULL,
    user_id    INT UNSIGNED NOT NULL,
    content    MEDIUMTEXT   NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );`

interface Like {
  id: number
  user_id: number
  post_id: number
  is_like: boolean
}

const LIKE_TABLE = `
  CREATE TABLE IF NOT EXISTS likes
  (
    id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    is_like BOOLEAN      NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  );`

export {
  User,
  USER_TABLE,
  Post,
  POST_TABLE,
  Comment,
  COMMENT_TABLE,
  Like,
  LIKE_TABLE,
}
