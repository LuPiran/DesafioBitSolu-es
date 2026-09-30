import { useState } from "react"
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import { Popover } from "radix-ui"
import { cn } from "cn"

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

const labelFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function monthCells(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - offset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function allowed(date: Date, min?: string, max?: string) {
  const key = toKey(date)
  if (min && key < min) return false
  if (max && key > max) return false
  return true
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Escolher data",
  min,
  max,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const selected = fromKey(value)
  const [view, setView] = useState(() => selected ?? new Date())
  const today = new Date()
  const cells = monthCells(view)

  function openChange(next: boolean) {
    if (next) setView(fromKey(value) ?? new Date())
    setOpen(next)
  }

  function pick(date: Date) {
    if (!allowed(date, min, max)) return
    onChange(toKey(date))
    setOpen(false)
  }

  function shiftMonth(amount: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  return (
    <Popover.Root open={open} onOpenChange={openChange}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-base outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 md:h-9 md:text-sm dark:bg-input/30"
        >
          <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground")}>
            {selected ? labelFormatter.format(selected) : placeholder}
          </span>
          <CalendarBlankIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[min(17.5rem,calc(100vw-1.5rem))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Mês anterior"
              onClick={() => shiftMonth(-1)}
            >
              <CaretLeftIcon className="size-4" />
            </button>
            <p className="text-sm font-medium capitalize">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Próximo mês"
              onClick={() => shiftMonth(1)}
            >
              <CaretRightIcon className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] tracking-wide text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <motion.div
            key={`${view.getFullYear()}-${view.getMonth()}`}
            className="grid grid-cols-7 gap-0.5"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {cells.map((date) => {
              const outside = date.getMonth() !== view.getMonth()
              const isSelected = selected ? sameDay(date, selected) : false
              const isToday = sameDay(date, today)
              const enabled = allowed(date, min, max)
              return (
                <button
                  key={toKey(date)}
                  type="button"
                  disabled={!enabled}
                  aria-pressed={isSelected}
                  className={cn(
                    "mx-auto flex size-8 items-center justify-center rounded-md text-xs",
                    outside && "text-muted-foreground/45",
                    !outside && "text-foreground",
                    isToday && !isSelected && "ring-1 ring-ring/70",
                    isSelected && "bg-primary text-primary-foreground",
                    enabled && !isSelected && "hover:bg-accent",
                    !enabled && "cursor-not-allowed opacity-30",
                  )}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </motion.div>

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-primary hover:bg-accent disabled:opacity-40"
              disabled={!allowed(today, min, max)}
              onClick={() => pick(today)}
            >
              Hoje
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Limpar
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
