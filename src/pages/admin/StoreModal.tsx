import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Store } from './Stores'

interface StoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store | null
  onSaved: () => void
}

const PLATAFORMAS = [
  'iFood',
  'Saipos',
  'Delivery Direto',
  'Keeta',
  'Rappi',
  '99Food',
  'Venda Balcão',
  'Delivery Próprio',
]

export function StoreModal({ open, onOpenChange, store, onSaved }: StoreModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Store>>({
    nome_fantasia: '',
    cnpj: '',
    razao_social: '',
    telefone: '',
    endereco_cep: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    plataforma: '',
    codigo_integracao: '',
    senha_integracao: '',
  })

  useEffect(() => {
    if (store) setFormData(store)
    else
      setFormData({
        nome_fantasia: '',
        cnpj: '',
        razao_social: '',
        telefone: '',
        endereco_cep: '',
        endereco_rua: '',
        endereco_numero: '',
        endereco_complemento: '',
        endereco_bairro: '',
        endereco_cidade: '',
        endereco_estado: '',
        plataforma: '',
        codigo_integracao: '',
        senha_integracao: '',
      })
  }, [store])

  const formatCNPJ = (v: string) =>
    v
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  const formatCEP = (v: string) =>
    v
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)

  const handleCepChange = async (val: string) => {
    const formatted = formatCEP(val)
    setFormData((prev) => ({ ...prev, endereco_cep: formatted }))
    if (formatted.length === 9) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${formatted.replace('-', '')}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco_rua: data.logradouro || prev.endereco_rua,
            endereco_bairro: data.bairro || prev.endereco_bairro,
            endereco_cidade: data.localidade || prev.endereco_cidade,
            endereco_estado: data.uf || prev.endereco_estado,
          }))
        }
      } catch (e) {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome_fantasia || !formData.cnpj) {
      return toast({
        title: 'Erro',
        description: 'Nome fantasia e CNPJ são obrigatórios.',
        variant: 'destructive',
      })
    }

    try {
      setLoading(true)
      const dataToSave = { ...formData, updated_at: new Date().toISOString() }

      if (store?.id) {
        const { error } = await supabase.from('lojas').update(dataToSave).eq('id', store.id)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Loja atualizada com sucesso.' })
      } else {
        const { error } = await supabase.from('lojas').insert([dataToSave])
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Loja criada com sucesso.' })
      }
      onSaved()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>{store ? 'Editar Loja' : 'Nova Loja'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6 pt-4 pb-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Fantasia *</Label>
                  <Input
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wider">
                  Endereço
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={formData.endereco_cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Rua</Label>
                    <Input
                      value={formData.endereco_rua}
                      onChange={(e) => setFormData({ ...formData, endereco_rua: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={formData.endereco_numero}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_numero: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Complemento</Label>
                    <Input
                      value={formData.endereco_complemento}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_complemento: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      value={formData.endereco_bairro}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_bairro: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.endereco_cidade}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_cidade: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <Input
                      value={formData.endereco_estado}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_estado: e.target.value })
                      }
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wider">
                  Integração
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Plataforma</Label>
                    <Select
                      value={formData.plataforma}
                      onValueChange={(v) => setFormData({ ...formData, plataforma: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATAFORMAS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Código Integração</Label>
                    <Input
                      value={formData.codigo_integracao}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo_integracao: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha Integração</Label>
                    <Input
                      type="password"
                      value={formData.senha_integracao}
                      onChange={(e) =>
                        setFormData({ ...formData, senha_integracao: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 border-t mt-auto flex justify-end space-x-2 bg-muted/30">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Loja'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
