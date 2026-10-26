'use client'

import Dialog from '@/components/Dialog'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  children: React.ReactNode
  confirmLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel = 'Delete',
  isConfirming = false,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="space-y-2 text-sm text-slate-600">{children}</div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isConfirming} className="btn-danger">
            {isConfirming ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
