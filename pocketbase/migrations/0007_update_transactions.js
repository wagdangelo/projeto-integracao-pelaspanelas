migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')

    collection.fields.add(new DateField({ name: 'due_date' }))
    collection.fields.add(new DateField({ name: 'payment_date' }))
    collection.fields.add(
      new SelectField({
        name: 'payment_method',
        values: ['Pix', 'Cartão', 'Transferência', 'Dinheiro', 'Cheque'],
        maxSelect: 1,
      }),
    )
    collection.fields.add(
      new SelectField({
        name: 'category',
        values: [
          'Entrada Operacional',
          'Investimento',
          'Saída Não Operacional',
          'Saída Operacional',
        ],
        maxSelect: 1,
      }),
    )
    collection.fields.add(
      new SelectField({
        name: 'status',
        values: ['Liquidado', 'Atrasado', 'À Vencer'],
        maxSelect: 1,
      }),
    )

    const entitiesCol = app.findCollectionByNameOrId('entities')
    collection.fields.add(
      new RelationField({ name: 'payee', collectionId: entitiesCol.id, maxSelect: 1 }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')
    collection.fields.removeByName('due_date')
    collection.fields.removeByName('payment_date')
    collection.fields.removeByName('payment_method')
    collection.fields.removeByName('category')
    collection.fields.removeByName('status')
    collection.fields.removeByName('payee')
    app.save(collection)
  },
)
