migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('banks')
    collection.fields.add(new NumberField({ name: 'current_balance', required: false }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('banks')
    collection.fields.removeByName('current_balance')
    app.save(collection)
  },
)
