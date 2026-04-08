migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('entities')

    const e1 = new Record(collection)
    e1.set('name', 'Supermercado Extra')
    e1.set('type', 'Fornecedor')
    app.save(e1)

    const e2 = new Record(collection)
    e2.set('name', 'João Silva')
    e2.set('type', 'Cliente')
    app.save(e2)

    const e3 = new Record(collection)
    e3.set('name', 'Maria Oliveira')
    e3.set('type', 'Funcionário')
    app.save(e3)
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('entities', '1=1', '', 100, 0)
      for (let r of records) {
        app.delete(r)
      }
    } catch (e) {}
  },
)
