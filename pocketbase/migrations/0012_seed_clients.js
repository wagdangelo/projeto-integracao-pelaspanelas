migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    try {
      app.findFirstRecordByData('clients', 'tax_id', '123.456.789-00')
    } catch (_) {
      const record = new Record(col)
      record.set('name', 'João Silva')
      record.set('type', 'Pessoa Física')
      record.set('tax_id', '123.456.789-00')
      record.set('email', 'joao@email.com')
      record.set('address_city', 'São Paulo')
      record.set('address_state', 'SP')
      app.save(record)
    }

    try {
      app.findFirstRecordByData('clients', 'tax_id', '12.345.678/0001-99')
    } catch (_) {
      const record = new Record(col)
      record.set('name', 'Empresa XPTO LTDA')
      record.set('type', 'Pessoa Jurídica')
      record.set('tax_id', '12.345.678/0001-99')
      record.set('email', 'contato@xpto.com')
      record.set('address_city', 'Rio de Janeiro')
      record.set('address_state', 'RJ')
      app.save(record)
    }
  },
  (app) => {
    try {
      const r1 = app.findFirstRecordByData('clients', 'tax_id', '123.456.789-00')
      app.delete(r1)
    } catch (_) {}
    try {
      const r2 = app.findFirstRecordByData('clients', 'tax_id', '12.345.678/0001-99')
      app.delete(r2)
    } catch (_) {}
  },
)
