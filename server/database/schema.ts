const USER_TABLE = `
  CREATE TABLE IF NOT EXISTS user (
                                    id INT NOT NULL AUTO_INCREMENT,
                                    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
    );`

const POST_TABLE = `
  CREATE TABLE IF NOT EXISTS post (
                                    id INT NOT NULL AUTO_INCREMENT,
                                    userId INT NOT NULL,
                                    content MEDIUMTEXT NOT NULL,
                                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    PRIMARY KEY (id),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
    );`

const COMMENT_TABLE = `
CREATE TABLE IF NOT EXISTS comment (
    id INT NOT NULL AUTO_INCREMENT,
    postId INT NOT NULL,
    userId INT NOT NULL,
    content MEDIUMTEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (postId) REFERENCES post(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);`

const LIKE_TABLE = `
CREATE TABLE IF NOT EXISTS likeDislike (
    id INT NOT NULL AUTO_INCREMENT,
    userId INT NOT NULL,
    postId INT NOT NULL,
    isLike BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (userId, postId),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (postId) REFERENCES post(id) ON DELETE CASCADE
);`



export { USER_TABLE, POST_TABLE, COMMENT_TABLE, LIKE_TABLE, }
