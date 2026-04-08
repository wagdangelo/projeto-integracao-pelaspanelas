migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const collection = new Collection({
      name: 'entregas_lojas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'",
      deleteRule: "@request.auth.role = 'Admin' || @request.auth.role = 'Gerente'",
      fields: [
        { name: 'data', type: 'date', required: true },
        { name: 'turno', type: 'select', required: true, values: ['Dia', 'Noite'], maxSelect: 1 },
        {
          name: 'loja',
          type: 'select',
          required: true,
          values: [
            'Pelas Panelas Delivery',
            'Pelas Panelas App',
            'Feijoada do Pelas',
            'Feijocas Ifood',
            'Feijocas 99Food',
            'Feijocas Keeta',
            'Balcão',
          ],
          maxSelect: 1,
        },
        { name: 'quantidade', type: 'number', required: true },
        { name: 'faturamento', type: 'number', required: true },
        { name: 'user_id', type: 'relation', required: true, collectionId: users.id, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('entregas_lojas')
    app.delete(collection)
  },
)
