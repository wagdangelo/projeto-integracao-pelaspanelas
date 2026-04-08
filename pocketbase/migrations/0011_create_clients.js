migrate(
  (app) => {
    const collection = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.role = 'Admin'",
      viewRule: "@request.auth.role = 'Admin'",
      createRule: "@request.auth.role = 'Admin'",
      updateRule: "@request.auth.role = 'Admin'",
      deleteRule: "@request.auth.role = 'Admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Pessoa Física', 'Pessoa Jurídica'],
        },
        { name: 'tax_id', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'address_street', type: 'text' },
        { name: 'address_number', type: 'text' },
        { name: 'address_complement', type: 'text' },
        { name: 'address_city', type: 'text' },
        { name: 'address_state', type: 'text' },
        { name: 'address_zip_code', type: 'text' },
        { name: 'registration_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    app.delete(collection)
  },
)
