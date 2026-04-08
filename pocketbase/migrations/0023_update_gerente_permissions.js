migrate(
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    clients.listRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    clients.viewRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    clients.createRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    clients.updateRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    clients.deleteRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    app.save(clients)

    const banks = app.findCollectionByNameOrId('banks')
    banks.createRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    banks.updateRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    banks.deleteRule = "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'"
    app.save(banks)
  },
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    clients.listRule = "@request.auth.role = 'Admin'"
    clients.viewRule = "@request.auth.role = 'Admin'"
    clients.createRule = "@request.auth.role = 'Admin'"
    clients.updateRule = "@request.auth.role = 'Admin'"
    clients.deleteRule = "@request.auth.role = 'Admin'"
    app.save(clients)

    const banks = app.findCollectionByNameOrId('banks')
    banks.createRule = "@request.auth.role = 'Admin'"
    banks.updateRule = "@request.auth.role = 'Admin'"
    banks.deleteRule = "@request.auth.role = 'Admin'"
    app.save(banks)
  },
)
