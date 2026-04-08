migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('chart_of_accounts')
    const field = col.fields.getByName('initial_balance')

    if (field && field.required) {
      field.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('chart_of_accounts')
    const field = col.fields.getByName('initial_balance')

    if (field && !field.required) {
      field.required = true
      app.save(col)
    }
  },
)
