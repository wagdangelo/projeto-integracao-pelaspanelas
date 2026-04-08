migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('chart_of_accounts')

    const records = [
      { name: 'Vendas de Produtos', type: 'Receita', group: 'Entradas Operacionais' },
      { name: 'Prestação de Serviços', type: 'Receita', group: 'Entradas Operacionais' },
      { name: 'Rendimentos de Aplicação', type: 'Receita', group: 'Entradas Não Operacionais' },
      { name: 'Salários e Encargos', type: 'Despesa', group: 'Despesas com Pessoal' },
      { name: 'Aluguel e IPTU', type: 'Despesa', group: 'Despesas de Ocupação' },
      { name: 'Material de Escritório', type: 'Despesa', group: 'Despesas Administrativas' },
      { name: 'Aquisição de Máquinas', type: 'Despesa', group: 'Investimentos' },
      { name: 'Compra de Matéria-prima', type: 'Despesa', group: 'Despesas com Compras (CMV)' },
      { name: 'ICMS/ISS', type: 'Despesa', group: 'Impostos sobre Vendas' },
      { name: 'Tarifas Bancárias', type: 'Despesa', group: 'Despesas Financeiras' },
      { name: 'Comissões de Vendas', type: 'Despesa', group: 'Despesas com Vendas' },
      { name: 'Venda de Ativos', type: 'Receita', group: 'Entradas Não Operacionais' },
      { name: 'Devoluções de Vendas', type: 'Despesa', group: 'Saídas Não Operacionais' },
    ]

    for (const data of records) {
      try {
        app.findFirstRecordByData('chart_of_accounts', 'name', data.name)
      } catch (_) {
        const record = new Record(col)
        record.set('name', data.name)
        record.set('type', data.type)
        record.set('group', data.group)
        app.save(record)
      }
    }
  },
  (app) => {
    const records = [
      'Vendas de Produtos',
      'Prestação de Serviços',
      'Rendimentos de Aplicação',
      'Salários e Encargos',
      'Aluguel e IPTU',
      'Material de Escritório',
      'Aquisição de Máquinas',
      'Compra de Matéria-prima',
      'ICMS/ISS',
      'Tarifas Bancárias',
      'Comissões de Vendas',
      'Venda de Ativos',
      'Devoluções de Vendas',
    ]
    for (const name of records) {
      try {
        const record = app.findFirstRecordByData('chart_of_accounts', 'name', name)
        app.delete(record)
      } catch (_) {}
    }
  },
)
