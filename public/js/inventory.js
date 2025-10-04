'use strict'

// Get a list of items in inventory based on the classification_id
const classificationList = document.querySelector('#classificationList')

if (classificationList) {
  classificationList.addEventListener('change', () => {
    const classification_id = classificationList.value
    const classIdURL = `/inv/getInventory/${classification_id}`

    fetch(classIdURL)
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Network response was not OK')
      })
      .then((data) => {
        buildInventoryList(data)
      })
      .catch((error) => {
        console.error('There was a problem: ', error.message)
      })
  })
}

// Build inventory items into HTML table components and inject into DOM
function buildInventoryList(data) {
  const inventoryDisplay = document.getElementById('inventoryDisplay')

  if (!inventoryDisplay) return

  if (!data || data.length === 0) {
    inventoryDisplay.innerHTML =
      '<caption role="alert">No inventory items were found for this classification.</caption>'
    return
  }

  let dataTable = '<thead>'
  dataTable +=
    '<tr><th scope="col">Vehicle</th><th scope="col">Modify</th><th scope="col">Delete</th></tr>'
  dataTable += '</thead>'

  dataTable += '<tbody>'

  data.forEach((element) => {
    dataTable += `<tr>`
    dataTable += `<td data-label="Vehicle">${element.inv_make} ${element.inv_model}</td>`
    dataTable += `<td data-label="Modify"><a class="table-link" href='/inv/edit/${element.inv_id}' title='Click to update'>Modify</a></td>`
    dataTable += `<td data-label="Delete"><a class="table-link table-link--danger" href='/inv/delete/${element.inv_id}' title='Click to delete'>Delete</a></td>`
    dataTable += `</tr>`
  })

  dataTable += '</tbody>'

  inventoryDisplay.innerHTML = dataTable
}