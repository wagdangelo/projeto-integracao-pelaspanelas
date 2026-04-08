migrate(
  (app) => {
    const chartOfAccounts = app.findCollectionByNameOrId('chart_of_accounts')
    if (!chartOfAccounts.fields.getByName('code')) {
      chartOfAccounts.fields.add(new TextField({ name: 'code' }))
      app.save(chartOfAccounts)
    }

    let transactions = app.findCollectionByNameOrId('transactions')
    const clientsId = app.findCollectionByNameOrId('clients').id
    const accountsId = app.findCollectionByNameOrId('chart_of_accounts').id

    let needsSave = false

    // Rename old fields first to avoid PocketBase matching them by name and
    // throwing "The relation collection cannot be changed"
    const oldPayee = transactions.fields.getByName('payee')
    if (oldPayee && oldPayee.type === 'relation' && oldPayee.collectionId !== clientsId) {
      oldPayee.name = 'payee_old'
      needsSave = true
    }

    const oldAccountId = transactions.fields.getByName('account_id')
    if (
      oldAccountId &&
      oldAccountId.type === 'relation' &&
      oldAccountId.collectionId !== accountsId
    ) {
      oldAccountId.name = 'account_id_old'
      needsSave = true
    }

    if (needsSave) {
      app.save(transactions)
      transactions = app.findCollectionByNameOrId('transactions')
    }

    let needsSave2 = false

    // Now safely add the new fields with the correct collectionIds
    if (!transactions.fields.getByName('payee')) {
      transactions.fields.add(
        new RelationField({
          name: 'payee',
          collectionId: clientsId,
          maxSelect: 1,
        }),
      )
      needsSave2 = true
    }

    if (!transactions.fields.getByName('account_id')) {
      transactions.fields.add(
        new RelationField({
          name: 'account_id',
          collectionId: accountsId,
          maxSelect: 1,
        }),
      )
      needsSave2 = true
    }

    if (needsSave2) {
      app.save(transactions)
      transactions = app.findCollectionByNameOrId('transactions')
    }

    // Cleanup the old renamed fields
    let needsSave3 = false
    if (transactions.fields.getByName('payee_old')) {
      transactions.fields.removeByName('payee_old')
      needsSave3 = true
    }
    if (transactions.fields.getByName('account_id_old')) {
      transactions.fields.removeByName('account_id_old')
      needsSave3 = true
    }

    if (needsSave3) {
      app.save(transactions)
    }
  },
  (app) => {
    const chartOfAccounts = app.findCollectionByNameOrId('chart_of_accounts')
    if (chartOfAccounts.fields.getByName('code')) {
      chartOfAccounts.fields.removeByName('code')
      app.save(chartOfAccounts)
    }

    let transactions = app.findCollectionByNameOrId('transactions')
    let needsSave = false

    const currentPayee = transactions.fields.getByName('payee')
    if (currentPayee) {
      currentPayee.name = 'payee_old'
      needsSave = true
    }

    const currentAccountId = transactions.fields.getByName('account_id')
    if (currentAccountId) {
      currentAccountId.name = 'account_id_old'
      needsSave = true
    }

    if (needsSave) {
      app.save(transactions)
      transactions = app.findCollectionByNameOrId('transactions')
    }

    let needsSave2 = false
    try {
      const payeesCol = app.findCollectionByNameOrId('payees')
      if (!transactions.fields.getByName('payee')) {
        transactions.fields.add(
          new RelationField({
            name: 'payee',
            collectionId: payeesCol.id,
            maxSelect: 1,
          }),
        )
        needsSave2 = true
      }
    } catch (e) {}

    if (needsSave2) {
      app.save(transactions)
      transactions = app.findCollectionByNameOrId('transactions')
    }

    let needsSave3 = false
    if (transactions.fields.getByName('payee_old')) {
      transactions.fields.removeByName('payee_old')
      needsSave3 = true
    }
    if (transactions.fields.getByName('account_id_old')) {
      transactions.fields.removeByName('account_id_old')
      needsSave3 = true
    }

    if (needsSave3) {
      app.save(transactions)
    }
  },
)
