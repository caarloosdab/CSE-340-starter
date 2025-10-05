const form = document.querySelector("#updateForm")

if (form) {
  const updateBtn = form.querySelector("button, input[type='submit']")

  const buildSnapshot = () => {
    const entries = Array.from(new FormData(form).entries())
    entries.sort((a, b) => {
      if (a[0] === b[0]) {
        return String(a[1]).localeCompare(String(b[1]))
      }
      return a[0].localeCompare(b[0])
    })
    return JSON.stringify(entries)
  }

  const initialSnapshot = buildSnapshot()

  const handleFormChange = () => {
    if (!updateBtn) return
    const currentSnapshot = buildSnapshot()
    const hasChanges = currentSnapshot !== initialSnapshot
    updateBtn.disabled = !hasChanges
  }

  if (updateBtn) {
    updateBtn.disabled = true
  }

  form.addEventListener("input", handleFormChange)
  form.addEventListener("change", handleFormChange)
}
