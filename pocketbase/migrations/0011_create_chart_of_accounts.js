migrate(
  (app) => {
    const collection = new Collection({
      name: 'chart_of_accounts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['revenue', 'expense', 'asset', 'liability'],
          maxSelect: 1,
        },
        { name: 'initial_balance', type: 'number' },
        { name: 'balance', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('chart_of_accounts')
    app.delete(collection)
  },
)
