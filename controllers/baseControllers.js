const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async function(req, res){
  const nav = await utilities.getNav()
  res.render("index", {title: "Home", nav})
}

baseController.triggerError = async function(req, res){
  const error = new Error("This is a forced error.")
  error.status = 500
  throw error
}

module.exports = baseController