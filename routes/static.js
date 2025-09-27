const express = require("express")
const path = require("path")
const router = express.Router()

// Static Routes
// Set up "public" folder / subfolders for static files
const publicDir = path.join(__dirname, "..", "public")
router.use(express.static(publicDir))
router.use("/css", express.static(path.join(publicDir, "css")))
router.use("/js", express.static(path.join(publicDir, "js")))
router.use("/images", express.static(path.join(publicDir, "images")))

module.exports = router



