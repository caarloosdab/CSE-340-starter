const invModel = require("../models/inventory-model")
const Util = {}
const jwt = require("jsonwebtoken")
require("dotenv").config()

/**
 * Normalize an asset path so all image URLs resolve correctly on every OS.
 */
function resolveAssetPath(assetPath) {
  if (!assetPath) {
    return ""
  }

  // Trim whitespace and convert Windows style paths to use forward slashes.
  let normalized = assetPath.trim().replace(/\\/g, "/")

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`
  }

  normalized = normalized.replace(/\/+/g, "/")
  normalized = normalized.replace(/\/images\/vehicles(?!\/)/, "/images/vehicles/")

  return normalized
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})
const numberFormatter = new Intl.NumberFormat("en-US")

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  const data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* ************************
 * Build a <select> element filled with classifications
 * Optional parameter keeps the selection "sticky" after validation errors
 ************************** */
Util.buildClassificationList = async function (classification_id = null) {
  const data = await invModel.getClassifications()
  let classificationList =
    '<select name="classification_id" id="classificationList" required>'
  classificationList += "<option value=''>Choose a Classification</option>"
  data.rows.forEach((row) => {
    classificationList += '<option value="' + row.classification_id + '"'
    if (
      classification_id != null &&
      Number.parseInt(classification_id, 10) === row.classification_id
    ) {
      classificationList += " selected"
    }
    classificationList += ">" + row.classification_name + "</option>"
  })
  classificationList += "</select>"
  return classificationList
}


/* ************************
 * Build the classification view grid
 ************************** */
Util.buildClassificationGrid = function (data) {
  if (!data || !data.length) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }

  let grid = '<ul class="inv-display">'

  data.forEach((vehicle) => {
    const vehicleName = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
    const imageUrl = resolveAssetPath(vehicle.inv_thumbnail)

    grid += `<li class="inv-card">
      <a class="inv-card__link" href="/inv/detail/${vehicle.inv_id}" aria-label="View details for the ${vehicleName}">
        <figure class="inv-card__figure">
          <img src="${imageUrl}" alt="Thumbnail of ${vehicleName}">
          <figcaption>${vehicleName}</figcaption>
        </figure>
      </a>
      <div class="inv-card__details">
        <p class="inv-card__price">${usdFormatter.format(vehicle.inv_price)}</p>
      </div>
    </li>`
  })

  grid += "</ul>"
  return grid
}

/* ************************
 * Build vehicle detail HTML
 ************************** */
Util.buildVehicleDetail = function (vehicle) {
  if (!vehicle) {
    return '<p class="notice">Vehicle details are currently unavailable.</p>'
  }

  const vehicleName = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`
  const formattedPrice = usdFormatter.format(vehicle.inv_price)
  const formattedMiles = numberFormatter.format(vehicle.inv_miles)
  const imageUrl = resolveAssetPath(vehicle.inv_image)


  return `<article class="vehicle-detail" aria-labelledby="vehicle-detail-title">
    <figure class="vehicle-detail__media">
      <img src="${imageUrl}" alt="Image of ${vehicleName}" loading="lazy">
      <figcaption class="visually-hidden">${vehicleName}</figcaption>
    </figure>
    <div class="vehicle-detail__content">
      <h2 id="vehicle-detail-title">${vehicleName}</h2>
      <p class="vehicle-detail__price"><span class="label">Price:</span> ${formattedPrice}</p>
      <p class="vehicle-detail__miles"><span class="label">Mileage:</span> ${formattedMiles} miles</p>
      <p class="vehicle-detail__year"><span class="label">Model Year:</span> ${vehicle.inv_year}</p>
      <p class="vehicle-detail__color"><span class="label">Exterior Color:</span> ${vehicle.inv_color}</p>
      <p class="vehicle-detail__classification"><span class="label">Classification:</span> ${vehicle.classification_name}</p>
      <p class="vehicle-detail__description">${vehicle.inv_description}</p>
    </div>
  </article>`
}

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("Please log in")
     res.clearCookie("jwt")
     return res.redirect("/account/login")
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
   })
 } else {
  next()
 }
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next)

/* ****************************************
 *  Check Login
 * ************************************ */
 Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
 }

/* ****************************************
 *  Check for employee or admin access
 * ************************************ */
Util.checkEmployeeOrAdmin = async (req, res, next) => {
  const accountType = res.locals.accountData?.account_type
  if (res.locals.loggedin && ["Employee", "Admin"].includes(accountType)) {
    return next()
  }

  req.flash("notice", "You do not have permission to access that page.")
  const nav = await Util.getNav()
  return res.status(403).render("account/login", {
    title: "Login",
    nav,
    errors: null,
  })
}

module.exports = Util