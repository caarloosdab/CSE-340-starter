// Account routes
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// Login route
router.get(
    "/login",
    utilities.handleErrors(accountController.buildLogin)
)

// Registration route
router.get(
    "/register",
    utilities.handleErrors(accountController.buildRegister)
)
// Process registration attempt
router.post(
  "/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

module.exports = router