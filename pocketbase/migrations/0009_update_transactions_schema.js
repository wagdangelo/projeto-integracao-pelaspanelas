migrate(
  (app) => {
    try {
      const existing = app.findCollectionByNameOrId('transactions')
      app.delete(existing)
    } catch (e) {}

    const usersCol = app.findCollectionByNameOrId('users')
    const banksCol = app.findCollectionByNameOrId('banks')
    const pmCol = app.findCollectionByNameOrId('payment_methods')
    const catCol = app.findCollectionByNameOrId('transaction_categories')
    const payeeCol = app.findCollectionByNameOrId('payees')

    const collection = new Collection({
      name: 'transactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: usersCol.id,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          values: ['entrada', 'saída'],
          maxSelect: 1,
          required: true,
        },
        { name: 'launch_date', type: 'date', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'bank', type: 'relation', collectionId: banksCol.id, required: true, maxSelect: 1 },
        { name: 'description', type: 'text', required: true },
        { name: 'due_date', type: 'date' },
        { name: 'payment_date', type: 'date' },
        { name: 'payment_method', type: 'relation', collectionId: pmCol.id, maxSelect: 1 },
        { name: 'category', type: 'relation', collectionId: catCol.id, maxSelect: 1 },
        { name: 'payee', type: 'relation', collectionId: payeeCol.id, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['Liquidado', 'Atrasado', 'À Vencer'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('transactions')
      app.delete(col)
    } catch (e) {}
  },
)
