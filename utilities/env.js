const normalizeQuotes = (value) => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const unquoted = trimmed.replace(/^['"`]+|['"`]+$/g, "")
  const noNewlines = unquoted.replace(/[\r\n]+/g, "")
  return noNewlines.trim() || undefined
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