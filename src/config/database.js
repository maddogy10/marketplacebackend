import dotenv from "dotenv";
import pg from "pg";

// loads environment variables from .env file
dotenv.config();

// object destructuring, takes pook property from pg object and creates a variable Pool.
// Pool manages a pool of database connections, handles creating, reusing, closing
//
const { Pool } = pg;

// creates connection pool and exports so other files in ackend can use same connection manager
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // enables SSL encryption but doesn't verify the certificate
  ssl: { rejectUnauthorized: false },
});

export { pgPool };

// ADD IN AWS HERE
