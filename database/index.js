const { Pool } = require("pg")
require("dotenv").config()
const { cleanEnvString } = require("../utilities/env")
/* ***************
 * Connection Pool
 * SSL Object needed for local testing of app
 * But will cause problems in production environment
 * If - else will make determination which to use
 * *************** */
/*let pool
if (process.env.NODE_ENV == "development") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
})*/

// Added for troubleshooting queries
// during development
const isDevelopment = process.env.NODE_ENV === "development"

const poolConfig = {
   connectionString: cleanEnvString(process.env.DATABASE_URL),
  ssl: {
    rejectUnauthorized: false,
  },
}

if (!poolConfig.connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is missing or empty. " +
      "Verify your Render service has the correct connection string configured."
  )
}

const pool = new Pool(poolConfig)
module.exports = {
  async query(configOrText, params) {
    const isConfigObject =
      configOrText && typeof configOrText === "object" && "text" in configOrText

    const queryText = isConfigObject ? configOrText.text : configOrText

    try {
      const res = isConfigObject
        ? await pool.query(configOrText)
        : await pool.query(configOrText, params)

      if (isDevelopment) {
        console.log("executed query", { text: queryText })
      }

      return res
    } catch (error) {
      console.error("error in query", { text: queryText })
      throw error
    }
  },
}
/*} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  module.exports = pool
}*/