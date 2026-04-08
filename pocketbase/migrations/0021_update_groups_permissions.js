migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('groups')
    collection.listRule = "@request.auth.role = 'Admin'"
    collection.viewRule = "@request.auth.role = 'Admin'"
    collection.createRule = "@request.auth.role = 'Admin'"
    collection.updateRule = "@request.auth.role = 'Admin'"
    collection.deleteRule = "@request.auth.role = 'Admin'"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('groups')
    collection.listRule = null
    collection.viewRule = null
    collection.createRule = null
    collection.updateRule = null
    collection.deleteRule = null
    app.save(collection)
  },
)
