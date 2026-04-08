migrate(
  (app) => {
    let col = app.findCollectionByNameOrId('transactions')

    // Rename existing fields to avoid "collectionId cannot be changed" error
    const payeeField = col.fields.getByName('payee')
    if (payeeField) payeeField.name = 'payee_old'

    const catField = col.fields.getByName('category')
    if (catField) catField.name = 'category_old'

    const accField = col.fields.getByName('account_id')
    if (accField) accField.name = 'account_id_old'

    app.save(col)

    col = app.findCollectionByNameOrId('transactions')
    const clientsCol = app.findCollectionByNameOrId('clients')
    const chartCol = app.findCollectionByNameOrId('chart_of_accounts')

    col.fields.add(
      new RelationField({
        name: 'payee',
        collectionId: clientsCol.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    col.fields.add(
      new RelationField({
        name: 'account_id',
        collectionId: chartCol.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )

    // Update status field options
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Liquidado', 'À Vencer', 'Atrasado']
    }

    app.save(col)

    // Now clean up the old renamed fields
    col = app.findCollectionByNameOrId('transactions')
    const oldPayee = col.fields.getByName('payee_old')
    if (oldPayee) col.fields.removeById(oldPayee.id)

    const oldCat = col.fields.getByName('category_old')
    if (oldCat) col.fields.removeById(oldCat.id)

    const oldAcc = col.fields.getByName('account_id_old')
    if (oldAcc) col.fields.removeById(oldAcc.id)

    app.save(col)
  },
  (app) => {
    let col = app.findCollectionByNameOrId('transactions')

    const payeeField = col.fields.getByName('payee')
    if (payeeField) payeeField.name = 'payee_old'

    const accField = col.fields.getByName('account_id')
    if (accField) accField.name = 'account_id_old'

    app.save(col)

    col = app.findCollectionByNameOrId('transactions')
    const payeesCol = app.findCollectionByNameOrId('payees')
    const catCol = app.findCollectionByNameOrId('transaction_categories')

    col.fields.add(
      new RelationField({
        name: 'payee',
        collectionId: payeesCol.id,
        maxSelect: 1,
      }),
    )

    col.fields.add(
      new RelationField({
        name: 'category',
        collectionId: catCol.id,
        maxSelect: 1,
      }),
    )

    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Liquidado', 'Atrasado', 'À Vencer']
    }

    app.save(col)

    col = app.findCollectionByNameOrId('transactions')
    const oldPayee = col.fields.getByName('payee_old')
    if (oldPayee) col.fields.removeById(oldPayee.id)

    const oldAcc = col.fields.getByName('account_id_old')
    if (oldAcc) col.fields.removeById(oldAcc.id)

    app.save(col)
  },
)
