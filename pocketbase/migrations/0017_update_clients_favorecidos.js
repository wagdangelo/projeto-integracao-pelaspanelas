migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')

    collection.fields.add(
      new SelectField({
        name: 'favorecido_type',
        values: [
          'Clientes',
          'Fornecedores',
          'Colaboradores',
          'Prestadores de Serviço',
          'Bancos',
          'Transf. Entre Contas',
        ],
        required: false,
      }),
    )

    collection.fields.add(
      new RelationField({
        name: 'created_by',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      }),
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')

    try {
      collection.fields.removeByName('favorecido_type')
    } catch (_) {}

    try {
      collection.fields.removeByName('created_by')
    } catch (_) {}

    app.save(collection)
  },
)
