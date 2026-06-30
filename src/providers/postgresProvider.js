import { pgPool } from "../config/database.js";

// exports object of user functions
export default {
  // function accepts an object and pulls out these properties
  async createUser({ uid, username, email, firstname, lastname }) {
    // inserts a new row into users table. values are parameter placeholders, prevents SQL injection
    const sql = `INSERT INTO users (firebase_uid, username, email, firstname, lastname) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    // where placeholders get filled and runs the query, returning just the rows (row with id)
    const { rows } = await pgPool.query(sql, [
      uid,
      username,
      email,
      firstname,
      lastname,
    ]);
    // returns created user with id, uid, username, and email
    // rows[0].id takes id from first row and stores in object under key id
    return { id: rows[0].id, uid, username, email };
  },

  // inserts user if doesn't exist, updates if it already exists
  // useful for Firebase users
  async upsertUser({ uid, username, email, firstname, lastname }) {
    // ON CONFLICT says if firebase_uid already exists, don't create a duplicate, update email and name
    const sql = `
            INSERT INTO users (firebase_uid, username, email, firstname, lastname)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (firebase_uid) DO UPDATE SET
                email = EXCLUDED.email,
                firstname = EXCLUDED.firstname,
                lastname = EXCLUDED.lastname;
        `;
    await pgPool.query(sql, [uid, username, email, firstname, lastname]);
    // returns user record through uid
    return this.findByUid(uid);
  },

  // finds a user by their firebase id
  async findByUid(uid) {
    // gets user by uid, AS renames column to firebaseUid,
    const sql = `SELECT id, firebase_uid AS "firebaseUid", username, email, firstname, lastname FROM users WHERE firebase_uid = $1`;
    const { rows } = await pgPool.query(sql, [uid]);
    // returns row or says that user doesn't exist
    return rows[0] || null;
  },

  // gets every user
  async getAll() {
    const { rows } = await pgPool.query(
      `SELECT username, email, firstname, lastname FROM users ORDER BY username ASC`,
    );
    return rows;
  },
};
