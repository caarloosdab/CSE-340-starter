const normalizeQuotes = (value) => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const unquoted = trimmed.replace(/^['"`]+|['"`]+$/g, "")
  return unquoted.trim() || undefined
}

const cleanEnvString = (value) => normalizeQuotes(value)

const getEnvString = (name) => cleanEnvString(process.env[name])

const requireEnvString = (name) => {
  const value = getEnvString(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

module.exports = {
  cleanEnvString,
  getEnvString,
  requireEnvString,
}