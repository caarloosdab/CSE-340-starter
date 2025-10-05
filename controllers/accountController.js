const bcrypt = require("bcryptjs")
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()

function buildJwtCookieOptions() {
  const options = { httpOnly: true, maxAge: 3600 * 1000 }
  if (process.env.NODE_ENV !== "development") {
    options.secure = true
  }
  return options
}

function createAccountPayload(accountData = {}) {
  if (!accountData) {
    return null
  }

  // Remove sensitive properties like the password hash before storing
  // the account data in locals or the JWT.
  const { account_password, ...safeAccount } = accountData
  return safeAccount
}

function setAuthCookie(res, accountData) {
  const payload = createAccountPayload(accountData)
  if (!payload) {
    return
  }

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: 3600 * 1000,
  })

  res.cookie("jwt", accessToken, buildJwtCookieOptions())
  res.locals.accountData = payload
  res.locals.loggedin = 1
}

/* ****************************************
*  Deliver account management view
* *************************************** */
async function buildAccountManagement(req, res) {
  const accountId = res.locals.accountData?.account_id
  const nav = await utilities.getNav()

  if (!accountId) {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }

  const account = await accountModel.getAccountById(accountId)

  if (!account) {
    req.flash("notice", "We could not locate your account information.")
    return res.redirect("/account/logout")
  }

  const safeAccount = createAccountPayload(account)
  res.locals.accountData = safeAccount

  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    account: safeAccount,
  })
}

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  const nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
  })
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null,
    })
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body


  // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hash(account_password, 10)
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing the registration.')
    return res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )


  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you're registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null,
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }
}

/* ****************************************
 *  Deliver account update view
 * *************************************** */
async function buildAccountUpdate(req, res) {
  const accountId = Number.parseInt(req.params.accountId, 10)
  const loggedInAccountId = res.locals.accountData?.account_id

  if (!Number.isInteger(accountId) || accountId !== loggedInAccountId) {
    req.flash("notice", "You are not authorized to update that account.")
    return res.redirect("/account/")
  }

  const nav = await utilities.getNav()
  const account = await accountModel.getAccountById(accountId)

  if (!account) {
    req.flash("notice", "We could not locate your account information.")
    return res.redirect("/account/")
  }

  const safeAccount = createAccountPayload(account)
  res.locals.accountData = safeAccount

  res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    account_firstname: safeAccount.account_firstname,
    account_lastname: safeAccount.account_lastname,
    account_email: safeAccount.account_email,
    account_id: safeAccount.account_id,
  })
}

/* ****************************************
 *  Process account information update
 * *************************************** */
async function updateAccountInfo(req, res) {
  const nav = await utilities.getNav()
  const accountId = Number.parseInt(req.body.account_id, 10)
  const loggedInAccountId = res.locals.accountData?.account_id

  if (!Number.isInteger(accountId) || accountId !== loggedInAccountId) {
    req.flash("notice", "You are not authorized to update that account.")
    return res.redirect("/account/")
  }

  const { account_firstname, account_lastname, account_email } = req.body

  try {
    const updatedAccount = await accountModel.updateAccount(
      account_firstname,
      account_lastname,
      account_email,
      accountId
    )

    if (!updatedAccount) {
      req.flash("notice", "We could not update your account information.")
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
        account_id: accountId,
      })
    }

    setAuthCookie(res, updatedAccount)
    req.flash("notice", "Your account information has been updated.")
    return res.redirect("/account/")
  } catch (error) {
    req.flash("notice", "We could not update your account information.")
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account_id: accountId,
    })
  }
}

/* ****************************************
 *  Process account password update
 * *************************************** */
async function updateAccountPassword(req, res) {
  const nav = await utilities.getNav()
  const accountId = Number.parseInt(req.body.account_id, 10)
  const loggedInAccountId = res.locals.accountData?.account_id

  if (!Number.isInteger(accountId) || accountId !== loggedInAccountId) {
    req.flash("notice", "You are not authorized to update that account.")
    return res.redirect("/account/")
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.account_password, 10)
    const updateResult = await accountModel.updateAccountPassword(
      accountId,
      hashedPassword
    )

    if (!updateResult) {
      req.flash("notice", "We could not update your password. Please try again.")
      const account = await accountModel.getAccountById(accountId)
      const safeAccount = createAccountPayload(account) || {}
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_firstname: safeAccount.account_firstname,
        account_lastname: safeAccount.account_lastname,
        account_email: safeAccount.account_email,
        account_id: safeAccount.account_id || accountId,
      })
    }

    const refreshedAccount = await accountModel.getAccountById(accountId)

    if (!refreshedAccount) {
      req.flash("notice", "We updated your password but could not refresh your session. Please log in again.")
      return res.redirect("/account/logout")
    }

    setAuthCookie(res, refreshedAccount)
    req.flash("notice", "Your password has been updated.")
    return res.redirect("/account/")
  } catch (error) {
    req.flash("notice", "We could not update your password. Please try again.")
    const account = await accountModel.getAccountById(accountId)
    const safeAccount = createAccountPayload(account) || {}
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_firstname: safeAccount.account_firstname,
      account_lastname: safeAccount.account_lastname,
      account_email: safeAccount.account_email,
      account_id: safeAccount.account_id || accountId,
    })
  }
}

/* ****************************************
 *  Log out and clear authentication cookie
 * *************************************** */
function accountLogout(_req, res) {
  res.clearCookie("jwt")
  res.locals.accountData = null
  res.locals.loggedin = 0
  return res.redirect("/")
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      setAuthCookie(res, accountData)
      return res.redirect("/account/")
    }
     req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })

  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildAccountUpdate,
  updateAccountInfo,
  updateAccountPassword,
  accountLogout,
}
