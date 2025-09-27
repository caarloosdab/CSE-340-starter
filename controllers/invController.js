const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

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
    title: `$(vehicle.inv_year} ${vehicleName}`,
    nav,
    detail,
  })
}


module.exports = invCont
