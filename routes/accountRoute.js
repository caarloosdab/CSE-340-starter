//Resources
const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")

// Registration route
router.get(
    "/register",
    utilities.handleErrors(accountController.buildRegister)
)

router.get(
    "/login",
    utilities.handleErrors(accountController.buildLogin)
)

module.exports = router