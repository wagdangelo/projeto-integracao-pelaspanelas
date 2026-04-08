import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

export const EditableValue = ({
  value,
  onSave,
}: {
  value: number
  onSave: (v: number) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value)
  useEffect(() => setVal(value), [value])

  if (isEditing) {
    return (
      <Input
        autoFocus
        type="number"
        step="0.01"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        onBlur={() => {
          onSave(val)
          setIsEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(val)
            setIsEditing(false)
          }
        }}
        className="w-24 h-8 px-2"
      />
    )
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-8 flex items-center"
    >
      R$ {value.toFixed(2)}
    </div>
  )
}

export const EditableSelect = ({
  value,
  options,
  onSave,
  displayValue,
}: {
  value: string
  options: any[]
  onSave: (v: string) => void
  displayValue: string
}) => {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <Select
        defaultOpen
        value={value}
        onValueChange={(val) => {
          onSave(val)
          setIsEditing(false)
        }}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false)
        }}
      >
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-8 flex items-center"
    >
      {displayValue || 'Selecione...'}
    </div>
  )
}

export const EditableText = ({
  value,
  onSave,
  placeholder,
}: {
  value?: string
  onSave: (v: string) => void
  placeholder?: string
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(value || '')

  useEffect(() => setVal(value || ''), [value])

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          onSave(val)
          setIsEditing(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(val)
            setIsEditing(false)
          }
        }}
        className="h-8 min-w-[120px] px-2"
      />
    )
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 px-2 rounded min-h-8 flex items-center min-w-[120px]"
    >
      <span className="truncate">
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    </div>
  )
}

export const EditableDate = ({
  value,
  onSave,
  placeholder,
}: {
  value?: string
  onSave: (v: string) => void
  placeholder?: string
}) => {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-[120px] justify-start text-left font-normal px-2"
          >
            {value ? format(new Date(value), 'dd/MM/yyyy') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date) => {
              if (date) onSave(format(date, 'yyyy-MM-dd'))
              else onSave('')
              setIsEditing(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 px-2 rounded min-h-8 flex items-center min-w-[120px]"
    >
      {value ? (
        format(new Date(value), 'dd/MM/yyyy')
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </div>
  )
}

export const EditableCombobox = ({
  value,
  options,
  onSave,
  placeholder,
}: {
  value?: string
  options: { value: string; label: string }[]
  onSave: (v: string) => void
  placeholder?: string
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label

  if (isEditing) {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-[120px] justify-between text-left font-normal px-2"
          >
            <span className="truncate">{selectedLabel || placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." autoFocus />
            <CommandList>
              <CommandEmpty>Nenhum encontrado.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-48">
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        onSave(opt.value)
                        setIsEditing(false)
                      }}
                    >
                      {opt.label}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 px-2 rounded min-h-8 flex items-center min-w-[120px]"
    >
      <span className="truncate">
        {selectedLabel || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    </div>
  )
}

export const EditableSelectGeneric = ({
  value,
  options,
  onSave,
  placeholder,
}: {
  value?: string
  options: { value: string; label: string }[]
  onSave: (v: string) => void
  placeholder?: string
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label

  if (isEditing) {
    return (
      <Select
        defaultOpen
        value={value}
        onValueChange={(val) => {
          onSave(val)
          setIsEditing(false)
        }}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false)
        }}
      >
        <SelectTrigger className="h-8 min-w-[120px] px-2">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 p-1 px-2 rounded min-h-8 flex items-center min-w-[120px]"
    >
      <span className="truncate">
        {selectedLabel || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    </div>
  )
}
