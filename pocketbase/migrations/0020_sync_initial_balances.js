migrate(
  (app) => {
    const records = app.findRecordsByFilter('banks', '1=1', '', 0, 0)
    for (let record of records) {
      record.set('current_balance', record.get('initial_balance') || 0)
      app.saveNoValidate(record)
    }

    const collection = app.findCollectionByNameOrId('banks')
    const field = collection.fields.getByName('current_balance')
    if (field) {
      field.required = true
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('banks')
    const field = collection.fields.getByName('current_balance')
    if (field) {
      field.required = false
      app.save(collection)
    }
  },
)
