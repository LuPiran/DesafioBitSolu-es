import { useState } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { LuPencil, LuTrash2 } from "react-icons/lu"
import { useLocation, useNavigate } from "react-router-dom"
import { notice } from "@/components/feedback/notice"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/auth-provider"
import { useRequests } from "@/providers/requests-provider"
import type { Solicitation } from "@/types/domain"

export function RequestActionsMenu({ item }: { item: Solicitation }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { remove } = useRequests()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const manager = user?.role === "admin" || user?.id === item.requesterId
  const editable = manager && item.status === "ABERTO"

  function edit() {
    if (!editable) {
      notice.warning(
        manager
          ? "A edição fica disponível enquanto o status é Aberto."
          : "Só o autor pode editar esta solicitação.",
      )
      return
    }
    navigate(`/solicitacoes/${item.id}/editar`)
  }

  function askDelete() {
    if (!editable) {
      notice.warning(
        manager
          ? "Só é possível excluir uma solicitação aberta."
          : "Só o autor pode excluir esta solicitação.",
      )
      return
    }
    setConfirmDelete(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Ações de ${item.code}`}
          >
            <BsThreeDotsVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={edit}>
            <LuPencil />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={askDelete}>
            <LuTrash2 />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {item.code}</DialogTitle>
            <DialogDescription>
              A solicitação sai da lista. Essa ação não volta atrás neste ambiente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Manter
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                void remove(item.id).then((result) => {
                  if (!result.ok) {
                    notice.error(result.message)
                    return
                  }
                  notice.success(`${item.code} excluída.`)
                  if (pathname.startsWith(`/solicitacoes/${item.id}`)) {
                    navigate("/solicitacoes")
                  }
                })
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
