migrate(
  (app) => {
    const usersId = app.findCollectionByNameOrId('_pb_users_auth_').id
    const banksId = app.findCollectionByNameOrId('banks').id

    const transactions = new Collection({
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
          collectionId: usersId,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true, min: 0 },
        {
          name: 'type',
          type: 'select',
          values: ['entrada', 'saída'],
          required: true,
          maxSelect: 1,
        },
        { name: 'bank', type: 'relation', collectionId: banksId, required: true, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(transactions)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    app.delete(col)
  },
)
