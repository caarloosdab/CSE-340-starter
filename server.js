/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const cookieParser = require("cookie-parser")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
require("dotenv").config()
const app = express()
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseControllers")
const util = require("./utilities") // <-- needed for util.getNav()
const { cleanEnvString } = require("./utilities/env")
const account = require("./routes/accountRoute")

const session = require("express-session")
const pool = require('./database/')
const bodyParser = require("body-parser")


/* ***********************
 * Middleware
 * ************************/
 app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser())

// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // not at views root

/* ***********************
 * Routes
 *************************/
const inventoryRoute = require("./routes/inventoryRoute")
app.use(staticRoutes)

// Index route
app.get("/", util.handleErrors(baseController.buildHome))

// Intentional error route for testing middleware
app.get("/error", util.handleErrors(baseController.triggerError))

// Inventory routes
app.use("/inv", inventoryRoute)

// Account routes
app.use("/account", account)

/* ***********************
 * File Not Found Route - must be after all routes
 *************************/
app.use(async (req, res, next) => {
  try {
    const nav = await util.getNav()
    res.status(404).render("errors/error", {
      title: "404 - Not Found",
      message: "Sorry, we appear to have lost that page.",
      nav
    })
  } catch (e) {
    next(e)
  }
})

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  const nav = await util.getNav()
  const status = err.status || 500
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  const message = status === 404 && err.message
    ? err.message
    : "Oh no! There was a crash. Maybe try a different route?"

  res.status(status).render("errors/error", {
    title: status === 500 ? "500 - Server Error" : `${status} - ${err.name || "Error"}`,  
    message,
    nav,
  })
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/


const resolvePort = () => {
  const cleaned = cleanEnvString(process.env.PORT)
  if (!cleaned) return 5500

  const parsed = Number.parseInt(cleaned, 10)
  if (Number.isNaN(parsed)) {
    console.warn(`Invalid PORT value "${process.env.PORT}". Falling back to 5500.`)
    return 5500
  }

  return parsed
}

const resolveHost = () => {
  const cleaned = cleanEnvString(process.env.HOST)
  if (!cleaned) return "0.0.0.0"

  if (/^['"`]/.test(process.env.HOST || "")) {
    console.warn(`HOST contained quotes. Using sanitized value "${cleaned}".`)
  }

  if (/^(localhost|127\.0\.0\.1)$/i.test(cleaned)) {
    console.warn(
      `HOST value "${cleaned}" only binds to the loopback interface. Defaulting to 0.0.0.0 ` +
      "so Render and other hosts can reach the server."
    )
    return "0.0.0.0"
  }

  return cleaned
}

const port = resolvePort()
const host = resolveHost()



/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, host, () => {
  console.log(`app listening on ${host}:${port}`)
})