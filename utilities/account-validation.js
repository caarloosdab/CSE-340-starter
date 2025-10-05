const utilities = require(".")
const accountModel = require("../models/account-model")
const validate = {}

/**
 * Escape HTML entities to avoid rendering issues when
 * we send the sanitized values back to the template.
 */
function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase()
}

function isStrongPassword(value = "") {
  if (value.length < 12) return false
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSymbol = /[^A-Za-z0-9]/.test(value)
  return hasLower && hasUpper && hasNumber && hasSymbol
}


/*  **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registationRules = () => {
  return [
    async (req, _res, next) => {
      const errors = []

      const firstnameRaw = typeof req.body.account_firstname === "string" ? req.body.account_firstname : ""
      const lastnameRaw = typeof req.body.account_lastname === "string" ? req.body.account_lastname : ""
      const emailRaw = typeof req.body.account_email === "string" ? req.body.account_email : ""
      const passwordRaw = typeof req.body.account_password === "string" ? req.body.account_password : ""

      const trimmedFirstname = firstnameRaw.trim()
      const trimmedLastname = lastnameRaw.trim()
      const normalizedEmail = normalizeEmail(emailRaw)
      const account_firstname = escapeHtml(trimmedFirstname)
      const account_lastname = escapeHtml(trimmedLastname)
      const account_email = escapeHtml(normalizedEmail)
      const account_password = passwordRaw.trim()

      if (!account_firstname) {
        errors.push({ msg: "Please provide a first name." })
      }

      if (!account_lastname || account_lastname.length < 2) {
        errors.push({ msg: "Please provide a last name." })
      }

      if (!account_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account_email)) {
        errors.push({ msg: "A valid email is required." })
    errors.push({ msg: "Please provide a last name." })
     } else {
        const emailExists = await accountModel.checkExistingEmail(normalizedEmail)
        if (typeof emailExists === "string") {
          errors.push({ msg: "An unexpected error occurred while checking the email." })
        } else if (emailExists) {
          errors.push({ msg: "Email exists. Please log in or use different email" })
        }
      }

      if (!account_password || !isStrongPassword(account_password)) {
        errors.push({ msg: "Password does not meet requirements." })
      }

      req.sanitizedRegistration = {
        account_firstname,
        account_lastname,
        account_email,
      }
      req.body.account_firstname = trimmedFirstname
      req.body.account_lastname = trimmedLastname
      req.body.account_email = normalizedEmail
      req.validationErrors = errors

      next()
    },

    ]
}

validate.loginRules = () => {
  return [
    async (req, _res, next) => {
      const errors = []

      const emailRaw = typeof req.body.account_email === "string" ? req.body.account_email : ""
      const passwordRaw = typeof req.body.account_password === "string" ? req.body.account_password : ""

      const normalizedEmail = normalizeEmail(emailRaw)
      const account_email = escapeHtml(normalizedEmail)
      const account_password = passwordRaw.trim()

      if (!account_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account_email)) {
        errors.push({ msg: "A valid email is required." })
      }

      if (!account_password) {
        errors.push({ msg: "Please provide a password." })
      }

      req.sanitizedLogin = {
        account_email,
      }

      req.body.account_email = normalizedEmail
      req.validationErrors = errors

      next()
    },


    ]
}

validate.updateAccountRules = () => {
  return [
    async (req, _res, next) => {
      const errors = []

      const firstnameRaw = typeof req.body.account_firstname === "string" ? req.body.account_firstname : ""
      const lastnameRaw = typeof req.body.account_lastname === "string" ? req.body.account_lastname : ""
      const emailRaw = typeof req.body.account_email === "string" ? req.body.account_email : ""
      const accountIdRaw = typeof req.body.account_id === "string" || typeof req.body.account_id === "number" ? req.body.account_id : ""

      const trimmedFirstname = firstnameRaw.trim()
      const trimmedLastname = lastnameRaw.trim()
      const normalizedEmail = normalizeEmail(emailRaw)
      const account_firstname = escapeHtml(trimmedFirstname)
      const account_lastname = escapeHtml(trimmedLastname)
      const account_email = escapeHtml(normalizedEmail)
      const account_id = Number.parseInt(accountIdRaw, 10)

      if (!account_firstname) {
        errors.push({ msg: "Please provide a first name." })
      }

      if (!account_lastname || account_lastname.length < 2) {
        errors.push({ msg: "Please provide a last name." })
      }

      if (!Number.isInteger(account_id)) {
        errors.push({ msg: "Account identifier is missing or invalid." })
      }

      if (!account_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account_email)) {
        errors.push({ msg: "A valid email is required." })
      } else if (Number.isInteger(account_id)) {
        const currentAccount = await accountModel.getAccountById(account_id)
        if (!currentAccount) {
          errors.push({ msg: "Unable to locate the specified account." })
        } else {
          const currentEmail = (currentAccount.account_email || "").toLowerCase()
          if (currentEmail !== normalizedEmail) {
            const emailExists = await accountModel.checkExistingEmail(normalizedEmail)
            if (typeof emailExists === "string") {
              errors.push({ msg: "An unexpected error occurred while checking the email." })
            } else if (emailExists) {
              errors.push({ msg: "Email exists. Please log in or use different email" })
            }
          }
        }
      }

      req.sanitizedUpdate = {
        account_firstname,
        account_lastname,
        account_email,
        account_id,
      }

      req.body.account_firstname = trimmedFirstname
      req.body.account_lastname = trimmedLastname
      req.body.account_email = normalizedEmail
      req.body.account_id = account_id
      req.validationErrors = errors

      next()
    },
    
  ]
}

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
    const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const { account_firstname = "", account_lastname = "", account_email = "" } = req.sanitizedRegistration || {}

    return res.render("account/register", {
        errors: {
            array: () => errors,
        },
        title: "Registration",
        nav,
        account_firstname,
        account_lastname,
        account_email,
    })
    
}
  next()
}

validate.checkLoginData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const { account_email = "" } = req.sanitizedLogin || {}

    return res.render("account/login", {
      errors: {
        array: () => errors,
      },
      title: "Login",
      nav,
      account_email,
    })
  }
   next()
}

validate.checkUpdateData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const {
      account_firstname = "",
      account_lastname = "",
      account_email = "",
      account_id = "",
    } = req.sanitizedUpdate || {}

    return res.render("account/update", {
      errors: {
        array: () => errors,
      },
      title: "Update Account",
      nav,
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    })
  }

  next()
}

validate.passwordUpdateRules = () => {
  return [
    async (req, _res, next) => {
      const errors = []

      const passwordRaw = typeof req.body.account_password === "string" ? req.body.account_password : ""
      const accountIdRaw = typeof req.body.account_id === "string" || typeof req.body.account_id === "number" ? req.body.account_id : ""

      const trimmedPassword = passwordRaw.trim()
      const account_id = Number.parseInt(accountIdRaw, 10)

      if (!Number.isInteger(account_id)) {
        errors.push({ msg: "Account identifier is missing or invalid." })
      }

      if (!trimmedPassword || !isStrongPassword(trimmedPassword)) {
        errors.push({ msg: "Password does not meet requirements." })
      }

      req.body.account_id = account_id
      req.body.account_password = trimmedPassword
      req.validationErrors = errors

      next()
    },
  ]
}

validate.checkPasswordData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const accountId = req.body.account_id
    let account_firstname = ""
    let account_lastname = ""
    let account_email = ""

    if (Number.isInteger(accountId)) {
      const account = await accountModel.getAccountById(accountId)
      if (account) {
        account_firstname = escapeHtml((account.account_firstname || "").trim())
        account_lastname = escapeHtml((account.account_lastname || "").trim())
        account_email = escapeHtml(normalizeEmail(account.account_email || ""))
      }
    }

    return res.render("account/update", {
      errors: {
        array: () => errors,
      },
      title: "Update Account",
      nav,
      account_firstname,
      account_lastname,
      account_email,
      account_id: accountId,
    })
  }

  next()
}


module.exports = validate
