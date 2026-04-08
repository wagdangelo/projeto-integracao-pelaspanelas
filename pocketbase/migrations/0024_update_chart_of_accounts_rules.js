migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('chart_of_accounts')
    collection.listRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    collection.viewRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('chart_of_accounts')
    collection.listRule = "@request.auth.role = 'Admin'"
    collection.viewRule = "@request.auth.role = 'Admin'"
    app.save(collection)
  },
)
