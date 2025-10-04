// Needed Resources
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidation = require("../utilities/inventory-validation")

// Management view
router.get(
  "/",
  utilities.handleErrors(invController.buildManagement)
)

// Route to deliver add classification view
router.get(
  "/add-classification",
  utilities.handleErrors(invController.buildAddClassification)
)

// Route to process add classification form
router.post(
  "/add-classification",
  invValidation.classificationRules(),
  invValidation.checkClassificationData,
  utilities.handleErrors(invController.createClassification)
)

// Route to deliver add inventory view
router.get(
  "/add-inventory",
  utilities.handleErrors(invController.buildAddInventory)
)

// Route to process add inventory form
router.post(
  "/add-inventory",
  invValidation.inventoryRules(),
  invValidation.checkInventoryData,
  utilities.handleErrors(invController.createInventory)
)

// Route to build inventory by classification view
router.get(
    "/type/:classificationId", 
  utilities.handleErrors(invController.buildByClassificationId)
)

// Route to build inventory by inventoryId view
router.get(
    "/detail/:inventoryId",
    utilities.handleErrors(invController.buildByInventoryId)
)

// Route to deliver edit inventory view
router.get(
  "/edit/:inv_id",
  utilities.handleErrors(invController.editInventoryView)
)

// Route to provide inventory data in JSON format
router.get(
  "/getInventory/:classification_id",
  utilities.handleErrors(invController.getInventoryJSON)
)

router.post(
  "/update",
  invValidation.newInventoryRules(),
  invValidation.checkUpdateData,
  utilities.handleErrors(invController.updateInventory)
)

module.exports = router