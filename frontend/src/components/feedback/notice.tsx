import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, XIcon } from "@phosphor-icons/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type NoticeKind = "success" | "error" | "warning" | "info"

type NoticeItem = {
  id: number
  kind: NoticeKind
  message: string
}

const listeners = new Set<(items: NoticeItem[]) => void>()
const timers = new Map<number, number>()
let notices: NoticeItem[] = []
let sequence = 0

const copy: Record<NoticeKind, { title: string; variant: "success" | "destructive" | "warning" | "info" }> = {
  success: { title: "Sucesso", variant: "success" },
  error: { title: "Erro", variant: "destructive" },
  warning: { title: "Alerta", variant: "warning" },
  info: { title: "Aviso", variant: "info" },
}

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: WarningIcon,
  info: InfoIcon,
}

function publish() {
  const snapshot = notices
  listeners.forEach((listener) => listener(snapshot))
}

function dismiss(id: number) {
  const timer = timers.get(id)
  if (timer) window.clearTimeout(timer)
  timers.delete(id)
  notices = notices.filter((item) => item.id !== id)
  publish()
}

function push(kind: NoticeKind, message: string) {
  const item: NoticeItem = { id: ++sequence, kind, message }
  const next = [...notices, item].slice(-3)
  const kept = new Set(next.map((entry) => entry.id))
  for (const id of timers.keys()) {
    if (!kept.has(id)) {
      const timer = timers.get(id)
      if (timer) window.clearTimeout(timer)
      timers.delete(id)
    }
  }
  notices = next
  timers.set(
    item.id,
    window.setTimeout(() => dismiss(item.id), 4500),
  )
  publish()
}

export const notice = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  warning: (message: string) => push("warning", message),
  info: (message: string) => push("info", message),
}

export function NoticeHost() {
  const [items, setItems] = useState<NoticeItem[]>(notices)
  const reduce = useReducedMotion()

  useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed top-16 right-0 left-0 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const Icon = icons[item.kind]
          const meta = copy[item.kind]
          return (
            <motion.div
              key={item.id}
              className="pointer-events-auto w-full max-w-md"
              initial={reduce ? false : { opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            >
              <Alert variant={meta.variant} className="pr-10 shadow-sm">
                <Icon />
                <AlertTitle>{meta.title}</AlertTitle>
                <AlertDescription>{item.message}</AlertDescription>
                <button
                  type="button"
                  className="absolute top-2 right-2 rounded-md p-1 opacity-70 hover:opacity-100"
                  aria-label="Fechar aviso"
                  onClick={() => dismiss(item.id)}
                >
                  <XIcon className="size-3.5" />
                </button>
              </Alert>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
