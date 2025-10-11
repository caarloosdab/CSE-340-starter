const invModel = require("../models/inventory-model")
const reviewModel = require("../models/review-model")
const utilities = require("../utilities/")

const invCont = {}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatReviewForView(review) {
  const firstName = (review.account_firstname || "").trim()
  const lastName = (review.account_lastname || "").trim()
  const displayNameBase = `${firstName} ${lastName}`.trim() || "Anonymous reviewer"

  const createdAt = review.created_at instanceof Date
    ? review.created_at
    : new Date(review.created_at)

  const createdAtValid = !Number.isNaN(createdAt.getTime())
  const submittedAtIso = createdAtValid ? createdAt.toISOString() : ""
  const submittedAtLabel = createdAtValid
    ? createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : ""

  const rating = Number.parseInt(review.rating, 10)
  const clampedRating = Number.isInteger(rating)
    ? Math.min(Math.max(rating, 0), 5)
    : 0
  const ratingStars = "★".repeat(clampedRating) + "☆".repeat(5 - clampedRating)

  return {
    id: review.review_id,
    rating: clampedRating,
    ratingStars,
    comment: escapeHtml(review.comment || ""),
    displayName: escapeHtml(displayNameBase),
    submittedAt: submittedAtLabel,
    submittedAtIso,
  }
}

function getReviewFormData(req) {
  const sanitized = req.sanitizedReview || {}
  const ratingValue =
    sanitized.rating !== undefined && sanitized.rating !== null
      ? String(sanitized.rating)
      : ""

  return {
    rating: ratingValue,
    comment: sanitized.comment || "",
  }
}

function getReviewErrors(req) {
  if (Array.isArray(req.reviewErrors) && req.reviewErrors.length) {
    return req.reviewErrors
  }

  if (Array.isArray(req.validationErrors) && req.validationErrors.length) {
    return req.validationErrors
  }

  return []
}

/* ***************************
 *  Build inventory management view
 * ************************** */
invCont.buildManagement = async function (_req, res, next) {
  let nav = await utilities.getNav()
  const classificationList = await utilities.buildClassificationList()
  res.render("./inventory/management", {
    title: "Inventory Management",
    nav,
    classificationList,
  })
}

/* ***************************
 *  Build add classification view
 * ************************** */
invCont.buildAddClassification = async function (req, res) {
  const nav = await utilities.getNav()
  res.render("./inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name:
      (req.sanitizedClassification || {}).classification_name || "",
  })
}

/* ***************************
 *  Process new classification
 * ************************** */
invCont.createClassification = async function (req, res) {
  const { classification_name } = req.body

  try {
    const newClassification = await invModel.createClassification(
      classification_name
    )

    req.flash(
      "notice",
      `Successfully added the ${newClassification.classification_name} classification.`
    )

    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList()
    return res.status(201).render("./inventory/management", {
      title: "Inventory Management",
      nav,
      classificationList
    })
  } catch (error) {
    console.error("createClassification controller error", error)
    req.flash(
      "notice",
      "Sorry, we could not add that classification. Please correct any issues and try again."
    )

    const nav = await utilities.getNav()
    return res.status(500).render("./inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: {
        array: () => [
          { msg: "We ran into a problem saving the classification." },
        ],
      },
      classification_name:
        (req.sanitizedClassification || {}).classification_name || "",
    })
  }
}

/* ***************************
 *  Build add inventory view
 * ************************** */
invCont.buildAddInventory = async function (req, res) {
  const nav = await utilities.getNav()
  const classificationList = await utilities.buildClassificationList(
    (req.sanitizedInventory || {}).classification_id
  )

  res.render("./inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    errors: null,
    ...(req.sanitizedInventory || {}),
  })
}

/* ***************************
 *  Process new inventory item
 * ************************** */
invCont.createInventory = async function (req, res) {
  const inventoryData = {
    inv_make: req.body.inv_make,
    inv_model: req.body.inv_model,
    inv_year: req.body.inv_year,
    inv_description: req.body.inv_description,
    inv_image: req.body.inv_image,
    inv_thumbnail: req.body.inv_thumbnail,
    inv_price: req.body.inv_price,
    inv_miles: req.body.inv_miles,
    inv_color: req.body.inv_color,
    classification_id: req.body.classification_id,
  }

  try {
    const newVehicle = await invModel.createInventory(inventoryData)

    req.flash(
      "notice",
      `Successfully added the ${newVehicle.inv_year} ${newVehicle.inv_make} ${newVehicle.inv_model}.`
    )

    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList()
    return res.status(201).render("./inventory/management", {
      title: "Inventory Management",
      nav,
      classificationList,
    })
  } catch (error) {
    console.error("createInventory controller error", error)
    req.flash(
      "notice",
      "Sorry, we could not add that vehicle. Please correct any issues and try again."
    )

    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationList(
      req.body.classification_id
    )

    return res.status(500).render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors: {
        array: () => [
          { msg: "We ran into a problem saving the vehicle." },
        ],
      },
      ...(req.sanitizedInventory || {}),
    })
  }
}


/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  if (!data || !data.length) {
    const error = new Error("No data returned")
    error.status = 404
    throw error
  }
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* ***************************
 *  Build inventory detail view
 * ************************** */

invCont.buildByInventoryId = async function (req, res, next) {
  const inventoryId = Number.parseInt(req.params.inventoryId, 10)
  if (!Number.isInteger(inventoryId)) {
    const error = new Error("Invalid vehicle id provided.")
    error.status = 400
    return next(error)
  }

  try {
    const vehicleData = await invModel.getInventoryById(inventoryId)
    if (!vehicleData) {
      const error = new Error("We could not find that vehicle.")
      error.status = 404
      return next(error)
    }

    const [reviewsResult, averageResult] = await Promise.allSettled([
      reviewModel.getReviewsByInventoryId(inventoryId),
      reviewModel.getAverageRating(inventoryId),
    ])

    let reviewRows = []
    if (reviewsResult.status === "fulfilled") {
      reviewRows = reviewsResult.value
    } else {
      console.error(
        "buildByInventoryId failed to load reviews",
        reviewsResult.reason
      )
    }

    const reviews = reviewRows.map(formatReviewForView)

    let reviewAverageValue = null
    if (averageResult.status === "fulfilled") {
      const averageRatingValue = averageResult.value
      if (typeof averageRatingValue === "number") {
        reviewAverageValue = averageRatingValue
      }
    } else {
      console.error(
        "buildByInventoryId failed to load review average",
        averageResult.reason
      )
    }
    const reviewAverageDisplay =
      reviewAverageValue !== null ? reviewAverageValue.toFixed(1) : null

   const nav = await utilities.getNav()
    const vehicleName = `${vehicleData.inv_make} ${vehicleData.inv_model}`
    const detail = utilities.buildVehicleDetail(vehicleData)

    res.render("./inventory/detail", {
      title: `${vehicleData.inv_year} ${vehicleName}`,
      nav,
      detail,
      reviews,
      reviewAverage: reviewAverageDisplay,
      reviewAverageValue,
      reviewCount: reviews.length,
      inventoryId,
      reviewErrors: getReviewErrors(req),
      reviewFormData: getReviewFormData(req),
    })
  } catch (error) {
    return next(error)
  }
}

/* ***************************
 *  Create a new review
 * ************************** */
invCont.createReview = async function (req, res, next) {
  const inventoryId = Number.parseInt(req.params.inventoryId, 10)
  if (!Number.isInteger(inventoryId)) {
    const error = new Error("Invalid vehicle id provided.")
    error.status = 400
    return next(error)
  }

  const accountId = res.locals.accountData?.account_id
  if (!accountId) {
    req.flash("notice", "Please log in to leave a review.")
    return res.redirect("/account/login")
  }

  const validationErrors = Array.isArray(req.validationErrors)
    ? req.validationErrors
    : []

  if (validationErrors.length) {
    req.flash("notice", "Please correct the errors in your review and try again.")
    req.reviewErrors = validationErrors
    res.status(400)
    return invCont.buildByInventoryId(req, res, next)
  }

  try {
    await reviewModel.createReview({
      inv_id: inventoryId,
      account_id: accountId,
      rating: req.body.rating,
      comment: req.body.comment,
    })

    req.flash("notice", "Thank you for submitting your review!")
    return res.redirect(`/inv/detail/${inventoryId}#reviews`)
  } catch (error) {
    console.error("createReview controller error", error)
    req.flash(
      "notice",
      "We ran into a problem saving your review. Please try again."
    )

    req.reviewErrors = [
      {
        msg: "We ran into a problem saving your review. Please try again.",
      },
    ]

    if (!req.sanitizedReview) {
      req.sanitizedReview = {
        rating: String(req.body.rating || ""),
        comment: escapeHtml(req.body.comment || ""),
      }
    }

    res.status(500)
    return invCont.buildByInventoryId(req, res, next)
  }
}

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
}

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id, 10)
  const nav = await utilities.getNav()

  const itemData = await invModel.getInventoryById(inv_id)
  if (!itemData) {
    const error = new Error("We could not find that vehicle.")
    error.status = 404
    throw error
  }

  const classificationSelect = await utilities.buildClassificationList(
    itemData.classification_id
  )
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`

  res.render("./inventory/edit-inventory", {
    title: `Edit ${itemName}`,
    nav,
    classificationSelect,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id,
  })
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body
  const inventoryId = Number.parseInt(inv_id, 10)
  const updateResult = await invModel.updateInventory(
    inventoryId,
    inv_make,
    inv_model,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_year,
    inv_miles,
    inv_color,
    classification_id
  )

  if (updateResult) {
    const itemName = updateResult.inv_make + " " + updateResult.inv_model
    req.flash("notice", `The ${itemName} was successfully updated.`)
    res.redirect("/inv/")
  } else {
    const classificationSelect = await utilities.buildClassificationList(
      classification_id
    )
    const itemName = `${inv_make} ${inv_model}`
    req.flash("notice", "Sorry, the update failed.")
    res.status(501).render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect: classificationSelect,
      errors: null,
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    })
  }
}

/* ***************************
 *  Build delete inventory confirmation view
 * ************************** */
invCont.buildDeleteInventory = async function (req, res) {
  const inv_id = Number.parseInt(req.params.inv_id, 10)
  const nav = await utilities.getNav()

  const itemData = await invModel.getInventoryById(inv_id)
  if (!itemData) {
    const error = new Error("We could not find that vehicle.")
    error.status = 404
    throw error
  }

  const itemName = `${itemData.inv_make} ${itemData.inv_model}`

  res.render("./inventory/delete-confirm", {
    title: `Delete ${itemName}`,
    nav,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_price: itemData.inv_price,
  })
}

/* ***************************
 *  Delete inventory item
 * ************************** */
invCont.deleteInventoryItem = async function (req, res) {
  const inventoryId = Number.parseInt(req.body.inv_id, 10)
  const deleteResult = await invModel.deleteInventoryItem(inventoryId)

  if (deleteResult && deleteResult.rowCount) {
    const itemName = `${req.body.inv_make} ${req.body.inv_model}`.trim()
    req.flash("notice", `The ${itemName} was successfully deleted.`)
    res.redirect("/inv/")
  } else {
    const itemName = `${req.body.inv_make} ${req.body.inv_model}`.trim()
    req.flash("notice", `Sorry, the delete failed for the ${itemName}.`)
    res.redirect(`/inv/delete/${inventoryId}`)
  }
}


module.exports = invCont
