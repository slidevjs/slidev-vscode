import { Position, Range, window } from 'vscode'
import type { TextDocument, TextEditor } from 'vscode'
import type { SlideInfo } from '@slidev/types'
import { ctx } from './ctx'

const dividerDecoration = window.createTextEditorDecorationType({
  color: '#8884',
  isWholeLine: true,
})
const frontmatterDecoration = window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: '#8881',
  borderColor: '#8882',
  border: '1px',
})

export function updateAnnotaions(doc: TextDocument, editor: TextEditor) {
  const dividerRanges: Range[] = []
  const frontmetterRanges: Range[] = []

  const text = doc.getText()

  if (ctx.data) {
    const max = doc.lineCount - 1
    ctx.data.slides.forEach((i) => {
      const item = i.inline as SlideInfo || i

      if (item?.start == null)
        return

      const line = [
        doc.lineAt(Math.max(0, Math.min(max, item.start))),
        doc.lineAt(Math.max(0, Math.min(max, item.start - 1))),
        doc.lineAt(Math.max(0, Math.min(max, item.start + 1))),
      ].find(i => i.text.startsWith('---'))
      if (!line)
        return null
      const start = new Position(line.lineNumber, 0)
      dividerRanges.push(
        new Range(start, new Position(line.lineNumber, line.text.length)),
      )

      const hasFrontmatter = Object.keys(i.frontmatter).length > 0
      if (!hasFrontmatter) {
        frontmetterRanges.push(new Range(start, start))
      }
      else {
        const range = text.slice(doc.offsetAt(start))
        const match = range.match(/^---[\s\S]*?\n---/)
        if (match && match.index != null) {
          const endLine = doc.positionAt(doc.offsetAt(start) + match.index + match[0].length).line
          frontmetterRanges.push(new Range(start, new Position(endLine, 0)))
          if (endLine !== start.line)
            dividerRanges.push(new Range(new Position(endLine, 0), new Position(endLine, 0)))
        }
      }
    })
  }

  editor?.setDecorations(
    dividerDecoration,
    dividerRanges,
  )
  editor.setDecorations(
    frontmatterDecoration,
    frontmetterRanges,
  )
}
