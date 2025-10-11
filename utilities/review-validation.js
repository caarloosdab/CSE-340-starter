const reviewValidation = {}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, "")
}

reviewValidation.reviewRules = () => {
  return [
    (req, _res, next) => {
      const errors = []

      const rawRating =
        typeof req.body.rating === "string" ? req.body.rating.trim() : ""
      const ratingNumber = Number.parseInt(rawRating, 10)
      const isValidRating =
        Number.isInteger(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 5

      if (!isValidRating) {
        errors.push({ msg: "Please provide a rating between 1 and 5 stars." })
      }

      const rawComment =
        typeof req.body.comment === "string" ? req.body.comment : ""
      const strippedComment = stripHtml(rawComment).trim()

      if (!strippedComment) {
        errors.push({ msg: "Please share a short comment about your experience." })
      } else if (strippedComment.length > 1000) {
        errors.push({
          msg: "Comments must be 1,000 characters or fewer.",
        })
      }

      const safeComment = strippedComment.slice(0, 1000)

      req.body.rating = isValidRating ? ratingNumber : null
      req.body.comment = safeComment

      req.sanitizedReview = {
        rating: isValidRating ? String(ratingNumber) : rawRating.replace(/[^0-9]/g, ""),
        comment: escapeHtml(safeComment),
      }

      req.validationErrors = errors

      next()
    },
  ]
}

reviewValidation.checkReviewData = (req, _res, next) => {
  if (!Array.isArray(req.validationErrors)) {
    req.validationErrors = []
  }

  req.reviewErrors = req.validationErrors
  next()
}

module.exports = reviewValidation