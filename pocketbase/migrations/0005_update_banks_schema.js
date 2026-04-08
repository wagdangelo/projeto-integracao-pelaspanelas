migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('banks')

    if (!collection.fields.getByName('bank_code')) {
      collection.fields.add(new TextField({ name: 'bank_code' }))
    }
    if (!collection.fields.getByName('agency')) {
      collection.fields.add(new TextField({ name: 'agency' }))
    }
    if (!collection.fields.getByName('account_digit')) {
      collection.fields.add(new TextField({ name: 'account_digit' }))
    }
    if (!collection.fields.getByName('initial_balance')) {
      collection.fields.add(new NumberField({ name: 'initial_balance' }))
    }

    collection.createRule = "@request.auth.role = 'Admin'"
    collection.updateRule = "@request.auth.role = 'Admin'"
    collection.deleteRule = "@request.auth.role = 'Admin'"

    app.save(collection)

    // Set default values for existing records
    app
      .db()
      .newQuery(
        "UPDATE banks SET bank_code = '000', agency = '0000', account_digit = '0', initial_balance = 0 WHERE bank_code = '' OR bank_code IS NULL",
      )
      .execute()

    // Make them required
    collection.fields.getByName('bank_code').required = true
    collection.fields.getByName('agency').required = true
    collection.fields.getByName('account_digit').required = true
    collection.fields.getByName('initial_balance').required = true
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('banks')
    collection.fields.removeByName('bank_code')
    collection.fields.removeByName('agency')
    collection.fields.removeByName('account_digit')
    collection.fields.removeByName('initial_balance')

    collection.createRule = "@request.auth.id != ''"
    collection.updateRule = "@request.auth.id != ''"
    collection.deleteRule = "@request.auth.id != ''"

    app.save(collection)
  },
)
