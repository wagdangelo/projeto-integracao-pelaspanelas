import { useEffect, useState } from 'react'
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
import { createClient, updateClient, type Client } from '@/services/clients'
import { toast } from 'sonner'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client
}

const applyCpfMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const applyCnpjMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

const applyPhoneMask = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length > 10) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1)$2-$3')
  } else if (digits.length > 6) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1)$2-$3')
  } else if (digits.length > 2) {
    return digits.replace(/^(\d{2})(\d{0,5})/, '($1)$2')
  } else if (digits.length > 0) {
    return digits.replace(/^(\d{0,2})/, '($1')
  }
  return digits
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Client>>({
    type: 'Pessoa Física',
    favorecido_type: 'Clientes',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { user } = useAuth()

  useEffect(() => {
    if (open) {
      setFormData(
        client || {
          type: 'Pessoa Física',
          favorecido_type: 'Clientes',
        },
      )
      setFieldErrors({})
    }
  }, [open, client])

  const handleChange = (field: keyof Client, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleTaxIdChange = (value: string, type: string) => {
    const masked = type === 'Pessoa Física' ? applyCpfMask(value) : applyCnpjMask(value)
    handleChange('tax_id', masked)
  }

  const handlePhoneChange = (value: string) => {
    handleChange('phone', applyPhoneMask(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    try {
      const submitData = { ...formData }
      if (!client?.id) {
        submitData.registration_date = new Date().toISOString()
        submitData.created_by = user?.id
      }

      if (client?.id) {
        await updateClient(client.id, submitData)
        toast.success('Favorecido atualizado com sucesso')
      } else {
        await createClient(submitData)
        toast.success('Favorecido criado com sucesso')
      }
      onOpenChange(false)
    } catch (error) {
      setFieldErrors(extractFieldErrors(error))
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Favorecido' : 'Novo Favorecido'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                required
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="favorecido_type">Tipo de Favorecido *</Label>
              <Select
                required
                value={formData.favorecido_type}
                onValueChange={(v) => handleChange('favorecido_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clientes">Clientes</SelectItem>
                  <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                  <SelectItem value="Colaboradores">Colaboradores</SelectItem>
                  <SelectItem value="Prestadores de Serviço">Prestadores de Serviço</SelectItem>
                  <SelectItem value="Bancos">Bancos</SelectItem>
                  <SelectItem value="Transf. Entre Contas">Transf. Entre Contas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Pessoa *</Label>
              <Select
                required
                value={formData.type}
                onValueChange={(v) => {
                  handleChange('type', v)
                  handleChange('tax_id', '')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">
                {formData.type === 'Pessoa Física' ? 'CPF *' : 'CNPJ *'}
              </Label>
              <Input
                id="tax_id"
                required
                value={formData.tax_id || ''}
                onChange={(e) =>
                  handleTaxIdChange(e.target.value, formData.type || 'Pessoa Física')
                }
                placeholder={
                  formData.type === 'Pessoa Física' ? '000.000.000-00' : '00.000.000/0000-00'
                }
                maxLength={formData.type === 'Pessoa Física' ? 14 : 18}
              />
              {fieldErrors.tax_id && (
                <p className="text-sm text-destructive">{fieldErrors.tax_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00)00000-0000"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date?.substring(0, 10) || ''}
                onChange={(e) =>
                  handleChange(
                    'birth_date',
                    e.target.value ? e.target.value + ' 12:00:00.000Z' : '',
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                value={formData.gender || ''}
                onValueChange={(v) => handleChange('gender', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 mt-4 font-semibold text-sm border-b pb-2">Endereço</div>

            <div className="space-y-2">
              <Label htmlFor="zip">CEP</Label>
              <Input
                id="zip"
                value={formData.address_zip_code || ''}
                onChange={(e) => handleChange('address_zip_code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.address_street || ''}
                onChange={(e) => handleChange('address_street', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.address_number || ''}
                onChange={(e) => handleChange('address_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.address_complement || ''}
                onChange={(e) => handleChange('address_complement', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.address_city || ''}
                onChange={(e) => handleChange('address_city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.address_state || ''}
                onChange={(e) => handleChange('address_state', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
