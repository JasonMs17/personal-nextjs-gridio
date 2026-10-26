'use client'

import { useState, useEffect } from 'react'
import ClientLayout from '@/components/ClientLayout'
import { GridIcon, InfoIcon } from '@/components/icons'

export default function SettingsPage() {
  const [gridColumns, setGridColumns] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem('gridColumns')
    if (saved) {
      setGridColumns(parseInt(saved))
    }
  }, [])

  const handleColumnChange = (value: number) => {
    setGridColumns(value)
    localStorage.setItem('gridColumns', value.toString())
  }

  return (
    <ClientLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Personalize how Gridio looks and works for you.</p>
        </div>

        <div className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-500">
              <GridIcon width={18} height={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Grid View Settings</h2>
              <p className="text-xs text-slate-500">Layout of the cards on the Overview page</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Number of Columns</label>
                <span className="badge bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{gridColumns}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={gridColumns}
                onChange={(e) => handleColumnChange(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              <InfoIcon width={16} height={16} className="mt-0.5 shrink-0 text-slate-400" />
              <p>Adjust the number of columns displayed in the grid view. Changes are saved automatically.</p>
            </div>
          </div>
        </div>

        <div className="card mt-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">About Gridio</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Version</dt>
              <dd className="font-medium text-slate-900">1.0.0</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Built with</dt>
              <dd className="font-medium text-slate-900">Next.js, Prisma & Supabase</dd>
            </div>
            <div className="flex justify-between gap-6 py-2.5">
              <dt className="shrink-0 text-slate-500">About</dt>
              <dd className="text-right font-medium text-slate-900">A simple daily note-taking app organized in grids</dd>
            </div>
          </dl>
        </div>
      </div>
    </ClientLayout>
  )
}
