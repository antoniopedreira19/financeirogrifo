import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCredoresFilter, type Credor } from '@/hooks/useCredoresQuery';

export interface CredorSelection {
  creditor_id: number | null;
  nome: string;
  documento: string;
  tipoDocumento: 'cnpj' | 'cpf';
}

interface CredorComboboxProps {
  value: CredorSelection;
  onChange: (selection: CredorSelection) => void;
  error?: string;
}

export function CredorCombobox({ value, onChange, error }: CredorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { credores, isLoading } = useCredoresFilter(searchTerm);

  // Initialize with value if editing
  useEffect(() => {
    if (value.nome && !searchTerm) {
      setSearchTerm(value.nome);
      setIsManualMode(value.creditor_id === null);
    }
  }, []);

  const handleSelect = (credor: Credor) => {
    const tipoDoc: 'cnpj' | 'cpf' = credor.tipo === 'F' ? 'cpf' : 'cnpj';
    
    onChange({
      creditor_id: credor.creditor_id,
      nome: credor.nome,
      documento: credor.doc || '',
      tipoDocumento: tipoDoc,
    });
    
    setSearchTerm(credor.nome);
    setIsManualMode(false);
    setOpen(false);
  };

  const handleManualInput = (newName: string) => {
    setSearchTerm(newName);
    setIsManualMode(true);
    
    // Clear creditor_id when typing manually
    onChange({
      creditor_id: null,
      nome: newName,
      documento: value.documento,
      tipoDocumento: value.tipoDocumento,
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsManualMode(false);
    onChange({
      creditor_id: null,
      nome: '',
      documento: '',
      tipoDocumento: 'cnpj',
    });
  };

  const formatDocument = (doc: string | null, tipo: string | null) => {
    if (!doc) return '';
    const numbers = doc.replace(/\D/g, '');
    
    if (tipo === 'F' || numbers.length === 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  return (
    <div className="space-y-4">
      {/* Credor Search/Select */}
      <div className="space-y-2">
        <Label>Nome do Credor</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => {
                  handleManualInput(e.target.value);
                  if (!open && e.target.value.length >= 2) {
                    setOpen(true);
                  }
                }}
                onFocus={() => {
                  if (searchTerm.length >= 2) {
                    setOpen(true);
                  }
                }}
                placeholder="Digite para buscar ou inserir manualmente..."
                className={cn(
                  "input-field pl-10 pr-10",
                  value.creditor_id && "border-primary"
                )}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : searchTerm.length < 2 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              ) : credores.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum credor encontrado para "{searchTerm}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode continuar digitando para usar um nome manual
                  </p>
                </div>
              ) : (
                <div className="p-1">
                  {credores.map((credor) => (
                    <button
                      key={credor.id}
                      type="button"
                      onClick={() => handleSelect(credor)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground",
                        value.creditor_id === credor.creditor_id && "bg-accent"
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0",
                          value.creditor_id === credor.creditor_id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{credor.nome}</p>
                        {credor.nome_fantasia && (
                          <p className="text-xs text-muted-foreground truncate">
                            {credor.nome_fantasia}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {credor.tipo === 'F' ? 'CPF' : 'CNPJ'}: {formatDocument(credor.doc, credor.tipo)}
                          </span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            ID: {credor.creditor_id}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {credores.length === 50 && (
                    <p className="text-xs text-muted-foreground text-center py-2 border-t">
                      Mostrando primeiros 50 resultados. Refine sua busca.
                    </p>
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {error && <p className="text-sm text-destructive">{error}</p>}
        
        {/* Status indicator */}
        {searchTerm && (
          <p className={cn(
            "text-xs",
            value.creditor_id ? "text-primary" : "text-muted-foreground"
          )}>
            {value.creditor_id 
              ? `✓ Credor selecionado da base (ID: ${value.creditor_id})`
              : "⚠ Modo manual - credor não vinculado à base"
            }
          </p>
        )}
      </div>

      {/* Creditor ID (read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>ID do Credor (Sienge)</Label>
          <Input
            value={value.creditor_id || ''}
            disabled
            placeholder="—"
            className="input-field bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de Documento</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={value.tipoDocumento === 'cnpj' ? 'default' : 'outline'}
              size="sm"
              disabled={!!value.creditor_id}
              onClick={() => onChange({ ...value, tipoDocumento: 'cnpj' })}
              className="flex-1"
            >
              CNPJ
            </Button>
            <Button
              type="button"
              variant={value.tipoDocumento === 'cpf' ? 'default' : 'outline'}
              size="sm"
              disabled={!!value.creditor_id}
              onClick={() => onChange({ ...value, tipoDocumento: 'cpf' })}
              className="flex-1"
            >
              CPF
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{value.tipoDocumento === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
          <Input
            value={value.documento}
            disabled={!!value.creditor_id}
            onChange={(e) => {
              const formatted = formatDocumentInput(e.target.value, value.tipoDocumento);
              onChange({ ...value, documento: formatted });
            }}
            placeholder={value.tipoDocumento === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
            className={cn("input-field", value.creditor_id && "bg-muted")}
          />
        </div>
      </div>
    </div>
  );
}

function formatDocumentInput(value: string, tipo: 'cnpj' | 'cpf'): string {
  const numbers = value.replace(/\D/g, '');
  
  if (tipo === 'cpf') {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  }
  
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18);
}
