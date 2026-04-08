migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('birth_date')) {
      col.fields.add(
        new DateField({
          name: 'birth_date',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('gender')) {
      col.fields.add(
        new SelectField({
          name: 'gender',
          required: false,
          values: ['Masculino', 'Feminino', 'Outro'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('birth_date')
    col.fields.removeByName('gender')
    app.save(col)
  },
)
