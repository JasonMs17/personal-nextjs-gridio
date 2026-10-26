'use client'

import { useRef } from 'react'
import * as Y from 'yjs'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Collaboration from '@tiptap/extension-collaboration'
import { Placeholder } from '@tiptap/extensions'
import { CONTENT_FIELD, TITLE_FIELD } from '@/lib/collab-notes'

interface NoteEditorProps {
  doc: Y.Doc
}

const SingleLineDocument = Document.extend({ content: 'paragraph' })

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      heading: e.isActive('heading', { level: 3 }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote')
    })
  })

  const buttons = [
    { key: 'bold', label: 'B', title: 'Bold', className: 'font-bold', run: () => editor.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'I', title: 'Italic', className: 'italic font-serif', run: () => editor.chain().focus().toggleItalic().run() },
    { key: 'strike', label: 'S', title: 'Strikethrough', className: 'line-through', run: () => editor.chain().focus().toggleStrike().run() },
    { key: 'heading', label: 'H', title: 'Heading', className: 'font-bold', run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'bulletList', label: '•', title: 'Bullet list', className: 'text-base leading-none', run: () => editor.chain().focus().toggleBulletList().run() },
    { key: 'orderedList', label: '1.', title: 'Numbered list', className: '', run: () => editor.chain().focus().toggleOrderedList().run() },
    { key: 'blockquote', label: '❝', title: 'Quote', className: '', run: () => editor.chain().focus().toggleBlockquote().run() }
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {buttons.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={b.run}
          className={`grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-xs transition ${b.className} ${
            state[b.key] ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}

export default function NoteEditor({ doc }: NoteEditorProps) {
  const contentEditorRef = useRef<Editor | null>(null)

  const titleEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      SingleLineDocument,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder: 'Untitled' }),
      Collaboration.configure({ document: doc, field: TITLE_FIELD }),
      Extension.create({
        name: 'titleEnterToContent',
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              contentEditorRef.current?.commands.focus('start')
              return true
            }
          }
        }
      })
    ],
    editorProps: {
      attributes: { class: 'note-title outline-none' }
    }
  })

  const contentEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Collaboration ships its own Yjs-aware undo
        heading: { levels: [3] },
        link: { openOnClick: false }
      }),
      Placeholder.configure({ placeholder: 'Write something… changes save automatically' }),
      Collaboration.configure({ document: doc, field: CONTENT_FIELD })
    ],
    editorProps: {
      attributes: { class: 'note-content outline-none' }
    },
    onCreate: ({ editor }) => {
      contentEditorRef.current = editor
    },
    onDestroy: () => {
      contentEditorRef.current = null
    }
  })

  return (
    <div className="space-y-2">
      <div className="rounded-xl px-1 py-1">
        <EditorContent editor={titleEditor} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
        {contentEditor && (
          <div className="border-b border-slate-100 px-1.5 py-1">
            <Toolbar editor={contentEditor} />
          </div>
        )}
        <EditorContent editor={contentEditor} className="max-h-72 min-h-28 overflow-y-auto px-3.5 py-2.5" />
      </div>
    </div>
  )
}
