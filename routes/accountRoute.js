// Account routes
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")

// Login route
router.get(
    "/login",
  utilities.handleErrors(accountController.buildLogin)
)

module.exports = router