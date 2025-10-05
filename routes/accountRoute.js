// Account routes
const express = require("express")
const router = express.Router()
const utilities = require("../utilities")
const accountController = require("../controllers/accountController")
const regValidate = require("../utilities/account-validation")

// Account management route
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
)

// Account update view
router.get(
  "/update/:accountId",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountUpdate)
)

// Process account information update
router.post(
  "/update",
  utilities.checkLogin,
  regValidate.updateAccountRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccountInfo)
)

// Process password change
router.post(
  "/update/password",
  utilities.checkLogin,
  regValidate.passwordUpdateRules(),
  regValidate.checkPasswordData,
  utilities.handleErrors(accountController.updateAccountPassword)
)


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

// Process the login attempt
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// Logout route
router.get(
  "/logout",
  utilities.handleErrors(accountController.accountLogout)
)

module.exports = router