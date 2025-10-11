const pool = require("../database")

const statements = {
  getReviewsByInventoryId: {
    name: "get_reviews_by_inventory_id",
    text: `
      SELECT
        r.review_id,
        r.inv_id,
        r.account_id,
        r.rating,
        r.comment,
        r.created_at,
        a.account_firstname,
        a.account_lastname
      FROM public.review AS r
      JOIN public.account AS a ON r.account_id = a.account_id
      WHERE r.inv_id = $1
      ORDER BY r.created_at DESC
    `,
  },
  createReview: {
    name: "create_review",
    text: `
      INSERT INTO public.review (inv_id, account_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING review_id, inv_id, account_id, rating, comment, created_at
    `,
  },
  getAverageRating: {
    name: "get_average_rating",
    text: `
      SELECT AVG(r.rating)::numeric(10, 2) AS average_rating
      FROM public.review AS r
      WHERE r.inv_id = $1
    `,
  },
}

async function getReviewsByInventoryId(invId) {
  const statement = {
    ...statements.getReviewsByInventoryId,
    values: [invId],
  }

  const result = await pool.query(statement)
  return result.rows
}

async function createReview({ inv_id, account_id, rating, comment }) {
  const statement = {
    ...statements.createReview,
    values: [inv_id, account_id, rating, comment],
  }

  const result = await pool.query(statement)
  return result.rows[0]
}

async function getAverageRating(invId) {
  const statement = {
    ...statements.getAverageRating,
    values: [invId],
  }

  const result = await pool.query(statement)
  if (!result.rows.length || result.rows[0].average_rating === null) {
    return null
  }

  return Number.parseFloat(result.rows[0].average_rating)
}

module.exports = {
  getReviewsByInventoryId,
  createReview,
  getAverageRating,
}