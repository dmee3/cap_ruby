import React, { createContext, useContext } from 'react'

/**
 * Design-system §4.6. The pieces style a real <table> and its mobile
 * card-list fallback; each screen still composes its own columns and cards,
 * because no two of them put the same fields first.
 *
 * Desktop: <Table> › <thead><tr><Th/></tr></thead> › <tbody><Tr><Td/></Tr></tbody>
 * Mobile:  <TableCards> › <TableCard> … <TableCardActions/>
 * Both hide at the same `breakpoint`, so pass the same value to each.
 */

type Density = 'default' | 'compact'
type Breakpoint = 'sm' | 'md' | 'lg'
type Align = 'left' | 'center' | 'right'

type TableContextValue = { density: Density; stickyHeader: boolean }
const TableContext = createContext<TableContextValue>({ density: 'default', stickyHeader: true })

const PAD: Record<Density, string> = {
  default: 'px-4 py-2.5',
  compact: 'px-2.5 py-2',
}

const ALIGN: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

// Spelled out rather than built from the breakpoint, so Tailwind sees each class.
const TABLE_FROM: Record<Breakpoint, string> = {
  sm: 'hidden sm:table',
  md: 'hidden md:table',
  lg: 'hidden lg:table',
}
const CARDS_UNTIL: Record<Breakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
}

type TableProps = {
  density?: Density
  /** Below this the table hides and the screen's <TableCards> takes over. */
  breakpoint?: Breakpoint
  /** `table-layout: fixed`, for a <colgroup> that sets the widths. */
  fixed?: boolean
  /**
   * Header cells stick to the top of the window while the body scrolls past.
   * Off for a multi-row header, where every row would stick to the same spot.
   * Only works when no ancestor clips with overflow-hidden/auto — frame the
   * table with Card variant="list" or `overflow-clip`.
   */
  stickyHeader?: boolean
  className?: string
  children: React.ReactNode
}

export const Table = ({
  density = 'default',
  breakpoint,
  fixed = false,
  stickyHeader = true,
  className = '',
  children,
}: TableProps) => (
  <TableContext.Provider value={{ density, stickyHeader }}>
    <table
      className={[
        'w-full border-collapse text-body-sm',
        fixed ? 'table-fixed' : '',
        breakpoint ? TABLE_FROM[breakpoint] : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </table>
  </TableContext.Provider>
)

/** The column-header look, for <th>s that need more than <Th> (SortableTh). */
export const useHeaderCellClass = () => {
  const { density, stickyHeader } = useContext(TableContext)
  return [
    PAD[density],
    'border-b border-border-default bg-sunken text-label uppercase font-semibold text-secondary',
    stickyHeader ? 'sticky top-0 z-[1]' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

type ThProps = {
  align?: Align
  className?: string
  children?: React.ReactNode
} & Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'align'>

/** A column header. Use <RowTh> for the header cell that opens a body row. */
export const Th = ({ align = 'left', className = '', scope = 'col', children, ...rest }: ThProps) => {
  const base = useHeaderCellClass()
  return (
    <th scope={scope} {...rest} className={`${base} ${ALIGN[align]} ${className}`.trim()}>
      {children}
    </th>
  )
}

/** The cell that names its row (a date down the side of a matrix, "Total"). */
export const RowTh = ({ align = 'left', className = '', children, ...rest }: ThProps) => {
  const { density } = useContext(TableContext)
  return (
    <th scope="row" {...rest} className={`${PAD[density]} ${ALIGN[align]} ${className}`.trim()}>
      {children}
    </th>
  )
}

type TdProps = {
  align?: Align
  /** Mono, right-aligned — money and counts, so the digits line up. */
  numeric?: boolean
  className?: string
  children?: React.ReactNode
} & Omit<React.TdHTMLAttributes<HTMLTableCellElement>, 'align'>

export const Td = ({ align, numeric = false, className = '', children, ...rest }: TdProps) => {
  const { density } = useContext(TableContext)
  const alignment = ALIGN[align ?? (numeric ? 'right' : 'left')]
  return (
    <td {...rest} className={`${PAD[density]} ${alignment} ${numeric ? 'font-mono' : ''} ${className}`.trim()}>
      {children}
    </td>
  )
}

/**
 * `muted`   — still listed, no longer current (a removed member).
 * `deleted` — soft-deleted and restorable; pair it with strike-through and a
 *             "Deleted" pill, since the tint alone is colour-only.
 * `changed` — edited and not yet saved.
 */
type RowTone = 'default' | 'muted' | 'deleted' | 'changed'

const ROW_TONE: Record<RowTone, string> = {
  default: '',
  muted: 'opacity-60',
  deleted: 'bg-sunken text-secondary',
  changed: 'bg-warning-bg/30',
}

type TrProps = {
  tone?: RowTone
  /**
   * Makes the whole row open this detail page. The row still needs a real
   * link in it — this only widens the target for a pointer, so keyboard and
   * screen-reader users, and a modified or middle click, go through the link.
   */
  href?: string
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLTableRowElement>

const INTERACTIVE = 'a, button, input, select, textarea, label, summary'

export const Tr = ({ tone = 'default', href, className = '', onClick, children, ...rest }: TrProps) => {
  const open = (e: React.MouseEvent<HTMLTableRowElement>) => {
    onClick?.(e)
    if (!href || e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if ((e.target as Element).closest(INTERACTIVE)) return
    // A drag to select text in a cell is not a click on the row.
    if (window.getSelection()?.toString()) return
    window.location.assign(href)
  }

  return (
    <tr
      {...rest}
      onClick={href || onClick ? open : undefined}
      className={[
        'border-b border-border-default last:border-0',
        tone === 'deleted' ? '' : 'hover:bg-sunken',
        href ? 'cursor-pointer' : '',
        ROW_TONE[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </tr>
  )
}

const SHIMMER_WIDTHS = ['w-3/5', 'w-4/5', 'w-2/3', 'w-1/2', 'w-3/4']

/** 3–5 shimmer rows standing in for a body that hasn't loaded. */
export const TableSkeleton = ({ rows = 4, columns }: { rows?: number; columns: number }) => (
  <tbody aria-hidden="true">
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border-default last:border-0">
        <td colSpan={columns} className="px-4 py-3.5">
          <span className="flex items-center gap-3">
            <span className="h-3.5 w-16 rounded-sm bg-sunken" />
            <span className="flex-1">
              <span
                className={`block h-3.5 animate-pulse rounded-sm bg-sunken motion-reduce:animate-none ${SHIMMER_WIDTHS[i % SHIMMER_WIDTHS.length]}`}
              />
            </span>
            <span className="h-3.5 w-12 rounded-sm bg-sunken" />
          </span>
        </td>
      </tr>
    ))}
  </tbody>
)

type TableCardsProps = {
  /** At and above this the cards hide and the <Table> takes over. */
  breakpoint: Breakpoint
  className?: string
  children: React.ReactNode
}

export const TableCards = ({ breakpoint, className = '', children }: TableCardsProps) => (
  <ul className={`m-0 flex list-none flex-col p-0 ${CARDS_UNTIL[breakpoint]} ${className}`.trim()}>
    {children}
  </ul>
)

type TableCardProps = {
  tone?: RowTone
  className?: string
  children: React.ReactNode
}

/** One row as a stacked card: lead with the primary field, bold. */
export const TableCard = ({ tone = 'default', className = '', children }: TableCardProps) => (
  <li className={`flex flex-col gap-2.5 border-b border-border-default p-3.5 last:border-0 ${ROW_TONE[tone]} ${className}`.trim()}>
    {children}
  </li>
)

/** The card's row actions, full width and split evenly — pass size="lg" Buttons. */
export const TableCardActions = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 border-t border-border-default pt-2.5 [&>*]:flex-1">{children}</div>
)

/** "Showing 20 of 54" and the pager, under either view. */
export const TableFooter = ({ caption, children }: { caption: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-t border-border-default px-4 py-3">
    <span className="text-body-sm text-secondary">{caption}</span>
    {children && <span className="ml-auto shrink-0">{children}</span>}
  </div>
)
