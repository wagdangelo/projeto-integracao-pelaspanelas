migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.listRule = "id = @request.auth.id || @request.auth.role = 'Admin'"
    col.viewRule = "id = @request.auth.id || @request.auth.role = 'Admin'"
    col.updateRule = "id = @request.auth.id || @request.auth.role = 'Admin'"
    col.deleteRule = "@request.auth.role = 'Admin'"

    const roleField = col.fields.getByName('role')
    if (roleField) {
      try {
        app.db().newQuery("UPDATE users SET role = 'Colaborador' WHERE role = 'Operador'").execute()
      } catch (_) {}

      col.fields.removeByName('role')
      col.fields.add(
        new SelectField({
          id: roleField.id,
          name: 'role',
          maxSelect: 1,
          values: ['Admin', 'Gerente', 'Colaborador'],
        }),
      )
    } else {
      col.fields.add(
        new SelectField({
          name: 'role',
          maxSelect: 1,
          values: ['Admin', 'Gerente', 'Colaborador'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.listRule = 'id = @request.auth.id'
    col.viewRule = 'id = @request.auth.id'
    col.updateRule = 'id = @request.auth.id'
    col.deleteRule = 'id = @request.auth.id'

    const roleField = col.fields.getByName('role')
    if (roleField) {
      try {
        app.db().newQuery("UPDATE users SET role = 'Operador' WHERE role = 'Colaborador'").execute()
      } catch (_) {}

      col.fields.removeByName('role')
      col.fields.add(
        new SelectField({
          id: roleField.id,
          name: 'role',
          maxSelect: 1,
          values: ['Admin', 'Operador'],
        }),
      )
    }

    app.save(col)
  },
)
