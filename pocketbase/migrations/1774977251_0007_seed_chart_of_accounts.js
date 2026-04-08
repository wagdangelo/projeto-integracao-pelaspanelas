migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('chart_of_accounts')

      const accounts = [
        { name: 'Receitas', type: 'revenue' },
        { name: 'Despesas', type: 'expense' },
        { name: 'Ativos', type: 'asset' },
        { name: 'Passivos', type: 'liability' },
      ]

      accounts.forEach((acc) => {
        try {
          const record = new Record(col)
          record.set('name', acc.name)

          if (col.fields.getByName('type')) {
            record.set('type', acc.type)
          }

          if (col.fields.getByName('initial_balance')) {
            record.set('initial_balance', 0)
          }

          if (col.fields.getByName('balance')) {
            record.set('balance', 0)
          }

          app.save(record)
        } catch (err) {
          console.log('Error seeding account', acc.name, err)
        }
      })
    } catch (err) {
      console.log('Collection chart_of_accounts not found or other error', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('chart_of_accounts')
      app.truncateCollection(col)
    } catch (err) {
      console.log(err)
    }
  },
)
