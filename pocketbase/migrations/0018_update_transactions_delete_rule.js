migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')

    collection.deleteRule = "@request.auth.role = 'Admin'"

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')
    collection.deleteRule = "@request.auth.id != ''"

    app.save(collection)
  },
)
