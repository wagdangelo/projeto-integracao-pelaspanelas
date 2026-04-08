migrate(
  (app) => {
    const collection = new Collection({
      name: 'chart_of_accounts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'Admin'",
      updateRule: "@request.auth.role = 'Admin'",
      deleteRule: "@request.auth.role = 'Admin'",
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Ativo', 'Passivo', 'Receita', 'Despesa', 'Patrimônio'],
          maxSelect: 1,
        },
        { name: 'initial_balance', type: 'number', required: false },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_chart_of_accounts_code ON chart_of_accounts (code)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('chart_of_accounts')
    app.delete(collection)
  },
)
