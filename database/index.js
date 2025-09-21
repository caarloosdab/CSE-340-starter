const { Pool } = require("pg")
require("dotenv").config()

const isProduction = process.env.NODE_ENV === "production"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
})

// Export a consistent interface for all environments
module.exports = {
  query: async (text, params) => {
    try {
      const res = await pool.query(text, params)
      if (!isProduction) console.log("executed query:", text)
      return res
    } catch (err) {
      console.error("Error executing query:", text, err.message)
      throw err
    }
  },
}