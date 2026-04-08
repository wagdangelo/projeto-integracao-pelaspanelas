migrate(
  (app) => {
    const pmCol = app.findCollectionByNameOrId('payment_methods')
    ;['Pix', 'Cartão', 'Transferência', 'Dinheiro', 'Cheque'].forEach((name) => {
      const record = new Record(pmCol)
      record.set('name', name)
      app.save(record)
    })

    const catCol = app.findCollectionByNameOrId('transaction_categories')
    const categories = [
      { name: 'Entrada Operacional', type: 'entrada' },
      { name: 'Investimento', type: 'entrada' },
      { name: 'Saída Não Operacional', type: 'saída' },
      { name: 'Saída Operacional', type: 'saída' },
    ]
    categories.forEach((c) => {
      const record = new Record(catCol)
      record.set('name', c.name)
      record.set('transaction_type', c.type)
      app.save(record)
    })
  },
  (app) => {
    try {
      const pmCol = app.findCollectionByNameOrId('payment_methods')
      app.truncateCollection(pmCol)
    } catch (e) {}

    try {
      const catCol = app.findCollectionByNameOrId('transaction_categories')
      app.truncateCollection(catCol)
    } catch (e) {}
  },
)
