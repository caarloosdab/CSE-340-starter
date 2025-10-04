const utilities = require(".")

const validate = {}

/**
 * Escape HTML entities before we send sanitized values back to the form.
 */
function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function isAlphaNumericNoSpaces(value = "") {
  return /^[A-Za-z0-9]+$/.test(value)
}

function isValidYear(value) {
  const year = Number.parseInt(value, 10)
  if (!Number.isInteger(year)) return false
  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear + 1
}

function toCurrencyNumber(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : NaN
}

validate.classificationRules = () => {
  return [
    (req, _res, next) => {
      const errors = []
      const rawValue =
        typeof req.body.classification_name === "string"
          ? req.body.classification_name
          : ""

      const trimmed = rawValue.trim()

      if (!trimmed) {
        errors.push({ msg: "Please provide a classification name." })
      } else if (!isAlphaNumericNoSpaces(trimmed)) {
        errors.push({
          msg: "Classification names must contain only letters and numbers (no spaces or symbols).",
        })
      }

      req.sanitizedClassification = {
        classification_name: escapeHtml(trimmed),
      }

      req.body.classification_name = trimmed
      req.validationErrors = errors

      next()
    },
  ]
}

validate.checkClassificationData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    return res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: {
        array: () => errors,
      },
      classification_name:
        (req.sanitizedClassification || {}).classification_name || "",
    })
  }

  next()
}

validate.inventoryRules = () => {
  return [
    (req, _res, next) => {
      const errors = []

      const raw = {
        inv_make:
          typeof req.body.inv_make === "string" ? req.body.inv_make : "",
        inv_model:
          typeof req.body.inv_model === "string" ? req.body.inv_model : "",
        inv_year:
          typeof req.body.inv_year === "string" ? req.body.inv_year : "",
        inv_description:
          typeof req.body.inv_description === "string"
            ? req.body.inv_description
            : "",
        inv_image:
          typeof req.body.inv_image === "string" ? req.body.inv_image : "",
        inv_thumbnail:
          typeof req.body.inv_thumbnail === "string"
            ? req.body.inv_thumbnail
            : "",
        inv_price:
          typeof req.body.inv_price === "string" ? req.body.inv_price : "",
        inv_miles:
          typeof req.body.inv_miles === "string" ? req.body.inv_miles : "",
        inv_color:
          typeof req.body.inv_color === "string" ? req.body.inv_color : "",
        classification_id:
          typeof req.body.classification_id === "string"
            ? req.body.classification_id
            : "",
      }

      const trimmed = {
        inv_make: raw.inv_make.trim(),
        inv_model: raw.inv_model.trim(),
        inv_year: raw.inv_year.trim(),
        inv_description: raw.inv_description.trim(),
        inv_image: raw.inv_image.trim(),
        inv_thumbnail: raw.inv_thumbnail.trim(),
        inv_price: raw.inv_price.trim(),
        inv_miles: raw.inv_miles.trim(),
        inv_color: raw.inv_color.trim(),
        classification_id: raw.classification_id.trim(),
      }

      if (!trimmed.inv_make) {
        errors.push({ msg: "Please provide the vehicle make." })
      }

      if (!trimmed.inv_model) {
        errors.push({ msg: "Please provide the vehicle model." })
      }

      if (!isValidYear(trimmed.inv_year)) {
        errors.push({ msg: "Please provide a valid model year." })
      }

      if (!trimmed.inv_description || trimmed.inv_description.length < 10) {
        errors.push({
          msg: "Please provide a description of at least 10 characters.",
        })
      }

      if (!trimmed.inv_image) {
        errors.push({ msg: "Please provide an image path." })
      }

      if (!trimmed.inv_thumbnail) {
        errors.push({ msg: "Please provide a thumbnail image path." })
      }

      const priceNumber = toCurrencyNumber(trimmed.inv_price)
      if (Number.isNaN(priceNumber)) {
        errors.push({ msg: "Please provide a price greater than 0." })
      }

      const milesNumber = toPositiveInteger(trimmed.inv_miles)
      if (Number.isNaN(milesNumber)) {
        errors.push({ msg: "Mileage must be a positive whole number." })
      }

      if (!trimmed.inv_color) {
        errors.push({ msg: "Please provide the exterior color." })
      }

      const classificationId = Number.parseInt(trimmed.classification_id, 10)
      if (!Number.isInteger(classificationId) || classificationId <= 0) {
        errors.push({ msg: "Please choose a vehicle classification." })
      }

      req.sanitizedInventory = {
        inv_make: escapeHtml(trimmed.inv_make),
        inv_model: escapeHtml(trimmed.inv_model),
        inv_year: escapeHtml(trimmed.inv_year),
        inv_description: escapeHtml(trimmed.inv_description),
        inv_image: escapeHtml(trimmed.inv_image),
        inv_thumbnail: escapeHtml(trimmed.inv_thumbnail),
        inv_price: escapeHtml(trimmed.inv_price),
        inv_miles: escapeHtml(trimmed.inv_miles),
        inv_color: escapeHtml(trimmed.inv_color),
        classification_id: classificationId || "",
      }

      req.body.inv_make = trimmed.inv_make
      req.body.inv_model = trimmed.inv_model
      req.body.inv_year = Number.parseInt(trimmed.inv_year, 10)
      req.body.inv_description = trimmed.inv_description
      req.body.inv_image = trimmed.inv_image
      req.body.inv_thumbnail = trimmed.inv_thumbnail
      req.body.inv_price = priceNumber
      req.body.inv_miles = milesNumber
      req.body.inv_color = trimmed.inv_color
      req.body.classification_id = classificationId

      req.validationErrors = errors

      next()
    },
  ]
}

validate.newInventoryRules = validate.inventoryRules

validate.checkInventoryData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList(
      req.body.classification_id
    )

    return res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors: {
        array: () => errors,
      },
      ...(req.sanitizedInventory || {}),
    })
  }

  next()
}

validate.checkUpdateData = async (req, res, next) => {
  const errors = req.validationErrors || []

  if (errors.length) {
    const nav = await utilities.getNav()
    const classificationSelect = await utilities.buildClassificationList(
      req.body.classification_id
    )

    const sanitized = req.sanitizedInventory || {}
    const itemName = `${sanitized.inv_make || ""} ${sanitized.inv_model || ""}`.trim()

    return res.render("inventory/edit-inventory", {
      title: itemName ? `Edit ${itemName}` : "Edit Inventory Item",
      nav,
      classificationSelect,
      errors: {
        array: () => errors,
      },
      inv_id: req.body.inv_id,
      ...sanitized,
    })
  }

  next()
}

module.exports = validate