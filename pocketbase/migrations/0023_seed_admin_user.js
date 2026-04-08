migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const admin = app.findAuthRecordByEmail('users', 'wagner@pelaspanelas.com.br')
      admin.set('role', 'Admin')
      app.save(admin)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('wagner@pelaspanelas.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      record.set('role', 'Admin')
      app.save(record)
    }
  },
  (app) => {
    // Empty down migration as we don't necessarily want to delete the admin user on rollback
  },
)
