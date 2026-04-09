import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface EscalaDia {
  dia: string
  entrada: string
  saidaAlmoco: string
  retornoAlmoco: string
  saida: string
}

export const defaultEscala: EscalaDia[] = [
  { dia: 'Segunda-feira', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Terça-feira', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Quarta-feira', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Quinta-feira', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Sexta-feira', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Sábado', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
  { dia: 'Domingo', entrada: '', saidaAlmoco: '', retornoAlmoco: '', saida: '' },
]

export const initialFormData = {
  id: '',
  name: '',
  email: '',
  password: '',
  cpf: '',
  telefone: '',
  data_nascimento: '',
  role: 'Colaborador',
  cargo: '',
  turno: '',
  data_admissao: '',
  salario: '',
  vale_transporte: '',
  endereco: '',
  escala_turnos: defaultEscala,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: typeof initialFormData
  onSave: (data: typeof initialFormData) => void
  isSaving: boolean
}

export function EmployeeFormModal({ open, onOpenChange, initialData, onSave, isSaving }: Props) {
  const [formData, setFormData] = useState(initialData)

  useEffect(() => {
    if (open) setFormData(initialData)
  }, [open, initialData])

  const handleEscalaChange = (index: number, field: keyof EscalaDia, value: string) => {
    const novaEscala = [...formData.escala_turnos]
    novaEscala[index] = { ...novaEscala[index], [field]: value }
    setFormData({ ...formData, escala_turnos: novaEscala })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{formData.id ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs defaultValue="gerais" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="gerais">Dados Gerais</TabsTrigger>
              <TabsTrigger value="escala">Escala de Turnos</TabsTrigger>
            </TabsList>

            <TabsContent value="gerais" className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={formData.id ? 'Deixe em branco para não alterar' : ''}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Perfil de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Adm">Adm</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="RH">RH</SelectItem>
                      <SelectItem value="Cozinha">Cozinha</SelectItem>
                      <SelectItem value="Colaborador">Colaborador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="turno">Turno</Label>
                  <Input
                    id="turno"
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="data_admissao">Data de Admissão</Label>
                  <Input
                    id="data_admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="salario">Salário Base</Label>
                  <Input
                    id="salario"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vale_transporte">Vale Transporte</Label>
                  <Input
                    id="vale_transporte"
                    value={formData.vale_transporte}
                    onChange={(e) => setFormData({ ...formData, vale_transporte: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="escala" className="m-0 pb-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída Almoço</TableHead>
                      <TableHead>Ret. Almoço</TableHead>
                      <TableHead>Saída</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.escala_turnos.map((item, index) => (
                      <TableRow key={item.dia}>
                        <TableCell className="font-medium text-xs p-2">{item.dia}</TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={item.entrada}
                            onChange={(e) => handleEscalaChange(index, 'entrada', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={item.saidaAlmoco}
                            onChange={(e) =>
                              handleEscalaChange(index, 'saidaAlmoco', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={item.retornoAlmoco}
                            onChange={(e) =>
                              handleEscalaChange(index, 'retornoAlmoco', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={item.saida}
                            onChange={(e) => handleEscalaChange(index, 'saida', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-4 mt-auto border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(formData)} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Funcionário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
