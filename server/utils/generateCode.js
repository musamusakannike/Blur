/**
 * Generate a unique 6-character alphanumeric code
 */
export const generateUniqueCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return code
}

/**
 * Generate a unique code and check against existing codes in the database
 */
export const generateUniqueCodeWithCheck = async (Model) => {
  let code
  let exists = true

  while (exists) {
    code = generateUniqueCode()
    const existing = await Model.findOne({ code })
    if (!existing) {
      exists = false
    }
  }

  return code
}
