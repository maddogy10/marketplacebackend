// file handles HTTP requests like signup, login, logout, and fetching the current user
import admin from "../config/firebase.js";
import userRepository from "../repositories/userRepository.js";

const authController = {
  // creates a user in firebase auth and postgres database
  // req is request from client, contains everything the client sends to your server.
  // res is what server sends back to client
  async signup(req, res) {
    // reads input
    try {
      const { email, password, username, firstname, lastname } = req.body;
      // validate required fields
      if (!email || !password || !username) {
        // returns bad request/error
        return res.status(400).json({
          error: "Email, password, and username are required",
        });
      }

      // creates user in Firebase, returns userRecord.uid, global user identity key
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: username,
      });

      // creates user in database
      const user = await userRepository.createUser({
        uid: userRecord.uid,
        username,
        email,
        firstname,
        lastname,
      });

      // responds that user was created successfully
      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error) {
      // error handling: email already exists or duplicate username
      console.error("Signup error: ", error);
      if (error.code === "auth/email-already-exists") {
        return res.status(400).json({ error: "Email already in use" });
      }
      // 23505 is postgres and ER_DUP_ENTRY is mySQL
      if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // verifies firebase id token and creates a session cookie
  async login(req, res) {
    try {
      // get id token from frontend
      const { idToken } = req.body;

      // checks if token is valid
      if (!idToken) {
        return res.status(400).json({
          error: "Firebase ID token is required",
        });
      }

      // verifies token with firebase to make sure it's real, not expired, and issued by firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // sets session cookie
      // httpOnly -> JS in browser can't read it
      // secure -> only HTTPS in production
      // sameSite: 'strict' -> prevents CSRF (cross-site request forgery - tricks authenticated user into executing unwanted actions on trusted website)
      // maxAge -> 1 hour
      res.cookie("session", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
        path: "/",
      });

      // responds with successful login
      res.status(200).json({
        message: "Login successful",
        uid: decodedToken.id,
      });
    } catch (error) {
      console.error("Login error: ", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  },

  // returns current logged-in user
  async getMe(req, res) {
    try {
      // get token from cookie or header (supports cookie auth and bearer token auth)
      const token =
        req.cookies.session || req.headers.authorization?.split(" ")[1];

      // if token fails
      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // verify token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // lookup user in database
      const user = await userRepository.findByUid(decodedToken.uid);

      // return user, if not found, return fallback object
      return res.json(
        user || {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          username: decodedToken.email?.split("@")[0] || "user",
        },
      );
    } catch (error) {
      console.error("ME endpoint error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  },

  // deletes the session cookie and logs the user out on the client
  async logout(_req, res) {
    try {
      // deletes session cookie
      res.clearCookie("session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error: ", error);
      res.status(500).json({ error: "Logout failed" });
    }
  },

  // returns all users from the database, simple admin/debug endpoint
  async getAllUsers(_req, res) {
    try {
      const users = await userRepository.getAll();

      res.status(200).json(users);
    } catch (error) {
      console.error("Get all users error: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Called after Google OAuth (popup or redirect) to sync the Firebase user into the database
  async handleToken(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: "No ID token provided" });
      }

      // verifies token, google login provides email, name, uid
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // upsert user in DB, ensures new users are inserted and existing users are updated
      // decoded Token.name?... is username generation logic, if no name email prefix, if no email user_<uid>
      const user = await userRepository.upsertUser({
        uid: decodedToken.uid,
        username:
          decodedToken.name?.replace(/\s+/g, "_").toLowerCase() ||
          decodedToken.email?.split("@")[0] ||
          `user_${decodedToken.uid.substring(0, 8)}`,
        email: decodedToken.email,
        firstname: decodedToken.name?.split(" ")[0] || null,
        lastname: decodedToken.name?.split(" ").slice(1).join(" ") || null,
      });

      // set session cookie again, same as login
      res.cookie("session", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
        path: "/",
      });

      // responds
      res.json({ success: true, user });
    } catch (error) {
      console.error("Token handling error: ", error);
      if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ error: "Username already exists, please choose another" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

export default authController;
