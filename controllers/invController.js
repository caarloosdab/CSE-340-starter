const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory management view
 * ************************** */
invCont.buildManagement = async function (_req, res) {
  const nav = await utilities.getNav()
  res.render("./inventory/management", {
    title: "Inventory Management",
    nav,
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
    return res.status(201).render("./inventory/management", {
      title: "Inventory Management",
      nav,
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
    return res.status(201).render("./inventory/management", {
      title: "Inventory Management",
      nav,
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
  const inventory_id = req.params.inventoryId
  const vehicleData = await invModel.getInventoryById(inventory_id)
  if (!vehicleData) {
    const error = new Error("We could not find that vehicle.")
    error.status = 404
    throw error
  }

  const nav = await utilities.getNav()
  const vehicleName = `${vehicleData.inv_make} ${vehicleData.inv_model}`
  const detail = utilities.buildVehicleDetail(vehicleData)

  res.render("./inventory/detail", {
    title: `${vehicleData.inv_year} ${vehicleName}`,
    nav,
    detail,
  })
}

module.exports = invCont
