import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const GridIcon = (p: IconProps) => (
  <Base {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Base>
)

export const ListIcon = (p: IconProps) => (
  <Base {...p}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth={2.6} /></Base>
)

export const TagIcon = (p: IconProps) => (
  <Base {...p}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><path d="M7.5 7.5h.01" strokeWidth={2.6} /></Base>
)

export const WalletIcon = (p: IconProps) => (
  <Base {...p}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" /><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" /><path d="M21 12h-4a2 2 0 0 0 0 4h4v-4Z" /></Base>
)

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Base>
)

export const FolderIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></Base>
)

export const MenuIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 6h16M4 12h16M4 18h10" /></Base>
)

export const CloseIcon = (p: IconProps) => (
  <Base {...p}><path d="M18 6 6 18M6 6l12 12" /></Base>
)

export const HomeIcon = (p: IconProps) => (
  <Base {...p}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></Base>
)

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Base>
)

export const PlusIcon = (p: IconProps) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}><path d="m15 18-6-6 6-6" /></Base>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}><path d="m9 18 6-6-6-6" /></Base>
)

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}><rect x="3" y="4" width="18" height="18" rx="2.5" /><path d="M16 2v4M8 2v4M3 10h18" /></Base>
)

export const TrashIcon = (p: IconProps) => (
  <Base {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></Base>
)

export const PencilIcon = (p: IconProps) => (
  <Base {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Base>
)

export const ArrowDownLeftIcon = (p: IconProps) => (
  <Base {...p}><path d="M17 7 7 17M17 17H7V7" /></Base>
)

export const ArrowUpRightIcon = (p: IconProps) => (
  <Base {...p}><path d="M7 17 17 7M7 7h10v10" /></Base>
)

export const TransferIcon = (p: IconProps) => (
  <Base {...p}><path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" /></Base>
)

export const ScaleIcon = (p: IconProps) => (
  <Base {...p}><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-6" /></Base>
)

export const SlashIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></Base>
)

export const SendIcon = (p: IconProps) => (
  <Base {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></Base>
)

export const ZapIcon = (p: IconProps) => (
  <Base {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></Base>
)

export const CheckIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
)

export const NoteIcon = (p: IconProps) => (
  <Base {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Base>
)

export const InfoIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Base>
)

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-float">
        <GridIcon width={18} height={18} strokeWidth={2.2} />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">Gridio</span>
    </div>
  )
}
