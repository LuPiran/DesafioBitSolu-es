import { CATEGORIES, type Category, type SolicitationDraft } from "@/types/domain"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function SolicitationFields({
  draft,
  onChange,
}: {
  draft: SolicitationDraft
  onChange: (next: SolicitationDraft) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={draft.title}
          className="h-11 text-base md:h-9 md:text-sm"
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select
          value={draft.category}
          onValueChange={(value) => {
            if (!value) return
            onChange({ ...draft, category: value as Category })
          }}
        >
          <SelectTrigger className="h-11 w-full text-base md:h-9 md:text-sm">
            <SelectValue placeholder="Selecione a categoria">{draft.category}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={draft.description}
          rows={6}
          className="min-h-32 text-base md:text-sm"
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </div>
    </div>
  )
}
