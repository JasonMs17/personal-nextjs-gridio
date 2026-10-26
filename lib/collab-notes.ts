import * as Y from 'yjs'

// Must stay in sync with the trigger in supabase/migrations/*_create_yjs_documents.sql
export const entryRoom = (categoryId: string, entryDate: string) =>
  `gridio:entry:${categoryId}:${entryDate}`

export const TITLE_FIELD = 'title'
export const CONTENT_FIELD = 'content'

// Transaction origins that must not trigger an autosave to the `entries` table
export const SEED_ORIGIN = 'gridio-seed'
export const CLEAR_ORIGIN = 'gridio-clear'

const textOf = (node: Y.XmlText | Y.XmlElement): string => {
  if (node instanceof Y.XmlText) {
    return node
      .toDelta()
      .map((d: { insert?: unknown }) => (typeof d.insert === 'string' ? d.insert : ''))
      .join('')
  }
  return node.nodeName === 'hardBreak' ? '\n' : ''
}

// Flattens a y-prosemirror fragment into one line per text block
const collectLines = (node: Y.XmlFragment | Y.XmlElement, lines: string[]) => {
  const children = node.toArray() as (Y.XmlText | Y.XmlElement)[]
  const isTextBlock =
    children.some((c) => c instanceof Y.XmlText) ||
    (node instanceof Y.XmlElement && children.length === 0)

  if (isTextBlock) {
    lines.push(children.map(textOf).join(''))
    return
  }
  children.forEach((c) => {
    if (c instanceof Y.XmlElement) collectLines(c, lines)
  })
}

const fragmentLines = (fragment: Y.XmlFragment) => {
  const lines: string[] = []
  collectLines(fragment, lines)
  return lines
}

/** Plain-text snapshot of the note, used to keep the `entries` table (List View) in sync. */
export const readNote = (doc: Y.Doc) => ({
  title: fragmentLines(doc.getXmlFragment(TITLE_FIELD)).join(' '),
  content: fragmentLines(doc.getXmlFragment(CONTENT_FIELD)).join('\n')
})

export const isNoteEmpty = (doc: Y.Doc) =>
  doc.getXmlFragment(TITLE_FIELD).length === 0 && doc.getXmlFragment(CONTENT_FIELD).length === 0

const paragraph = (text: string) => {
  const p = new Y.XmlElement('paragraph')
  if (text) p.insert(0, [new Y.XmlText(text)])
  return p
}

/**
 * Imports a pre-Yjs entry into the document.
 * The update is built in a scratch doc with a fixed clientID, so two clients seeding the
 * same legacy entry at once produce identical items that Yjs merges instead of duplicating.
 */
export const seedLegacyNote = (doc: Y.Doc, title: string, content: string) => {
  const scratch = new Y.Doc()
  scratch.clientID = 0
  scratch.transact(() => {
    if (title) scratch.getXmlFragment(TITLE_FIELD).insert(0, [paragraph(title)])
    if (content) scratch.getXmlFragment(CONTENT_FIELD).insert(0, content.split('\n').map(paragraph))
  })
  Y.applyUpdate(doc, Y.encodeStateAsUpdate(scratch), SEED_ORIGIN)
  scratch.destroy()
}

export const clearNote = (doc: Y.Doc) => {
  doc.transact(() => {
    const title = doc.getXmlFragment(TITLE_FIELD)
    const content = doc.getXmlFragment(CONTENT_FIELD)
    title.delete(0, title.length)
    content.delete(0, content.length)
  }, CLEAR_ORIGIN)
}
