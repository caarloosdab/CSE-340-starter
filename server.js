/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
require("dotenv").config()
const app = express()
const staticRoutes = require("./routes/static")
const baseController = require("./controllers/baseControllers")
const util = require("./utilities") // <-- needed for util.getNav()

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
const port = process.env.PORT || 5500
const host = process.env.HOST || "0.0.0.0"

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, host, () => {
  console.log(`app listening on ${host}:${port}`)
})