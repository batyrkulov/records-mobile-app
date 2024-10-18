import {
  SQLiteDatabase,
  enablePromise,
  openDatabase,
} from "react-native-sqlite-storage";

import { Comment, CommentBase, User, UserFull } from "../type";
import { itemsPerPage } from "../screens/Home";

enablePromise(true)

export const connectToDatabase = async () => {
  return openDatabase(
    { name: "mydata.db", location: "default" },
    () => { },
    (error) => {
      console.error(error)
      throw Error("Could not connect to database")
    }
  )
}

export const createTables = async (db: SQLiteDatabase) => {
  const userQuery = `
    CREATE TABLE IF NOT EXISTS User (
        id INTEGER DEFAULT 1,
        email TEXT,
        name TEXT,
        PRIMARY KEY(id)
    )
  `
  const commentsQuery = `
  CREATE TABLE IF NOT EXISTS Comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER DEFAULT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES posts(id)
   )
  `

  await db.executeSql(commentsQuery);
  const count = await getCommentsCount(db);
  if (!count) {
    // fill example data
    for (let i = 1; i <= 51; i++) {
      await db.executeSql(`INSERT INTO Comments (user_id, content) VALUES (1, 'comment ${52 - i}');`);
    }
  }
  try {
    await db.executeSql(userQuery)
  } catch (error) {
    console.error(error)
    throw Error(`Failed to create tables`)
  }
}

export const addUser = async (db: SQLiteDatabase, user: User) => {
  const insertQuery = `
   INSERT INTO User (email, name)
   VALUES (?, ?)
 `
  const values = [
    user.email,
    user.name,
  ]
  try {
    return db.executeSql(insertQuery, values)
  } catch (error) {
    console.error(error)
    throw Error("Failed to add user")
  }
}

export const getUsers = async (db: SQLiteDatabase): Promise<UserFull[]> => {
  try {
    const users: UserFull[] = []
    const results = await db.executeSql("SELECT * FROM User")
    results?.forEach((result) => {
      for (let index = 0; index < result.rows.length; index++) {
        users.push(result.rows.item(index))
      }
    })
    return users
  } catch (error) {
    console.error(error)
    throw Error("Failed to get Users")
  }
}

export const getComments = async (
  db: SQLiteDatabase,
  offset = 0,
  limit = itemsPerPage,
  parent_id: number,
): Promise<Comment[]> => {
  try {
    const comments: Comment[] = []
    const results = await db.executeSql(`
      SELECT 
          id, 
          parent_id, 
          user_id, 
          content,
          created_at
      FROM Comments
      WHERE 
      ${parent_id ? `parent_id = ${parent_id}` : 'parent_id IS NULL'}
      ORDER BY created_at DESC
      ${parent_id ? '' : `LIMIT ${limit} OFFSET ${offset};`}
    `);
    results?.forEach((result) => {
      for (let index = 0; index < result.rows.length; index++) {
        comments.push(result.rows.item(index))
      }
    })
    return comments
  } catch (error) {
    console.error(error)
    throw Error("Failed to get Comments")
  }
}

export const getCommentsCount = async (db: SQLiteDatabase,): Promise<number> => {
  try {
    const results = await db.executeSql(
      'SELECT COUNT(*) AS count FROM Comments WHERE parent_id IS NULL;',
    );
    const count = results[0].rows.item(0).count;
    return count;
  } catch (error) {
    console.error(error)
    throw Error("Failed to get count")
  }
}

export const addComment = async (db: SQLiteDatabase, comment: CommentBase) => {
  const insertQuery = `
   INSERT INTO Comments (parent_id, user_id, content)
   VALUES (?, ?, ?)
 `
  const values = [
    comment.parent_id || null,
    comment.user_id,
    comment.content,
  ]
  try {
    return db.executeSql(insertQuery, values)
  } catch (error) {
    console.error(error)
    throw Error("Failed to add user")
  }
}