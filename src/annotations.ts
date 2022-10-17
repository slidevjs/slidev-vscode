import { Position, Range, window } from 'vscode'
import type { DecorationOptions, TextDocument, TextEditor } from 'vscode'
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
  let slideCount = 0
  const dividerRanges: DecorationOptions[] = []
  const frontmetterRanges: DecorationOptions[] = []

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
      const slideIndexText = (++slideCount).toString()
      const startDividerRange = new Range(start, new Position(line.lineNumber, line.text.length))
      const slideIndexRenderOptions = {
        after: {
          contentText: `\u00A0<${slideIndexText}>\u00A0`,
          backgroundColor: '#006064',
          color: '#fff',
          fontWeight: 'bold',
        },
      }

      const hasFrontmatter = Object.keys(i.frontmatter).length > 0
      if (!hasFrontmatter) {
        const dividerOptions = {
          range: startDividerRange,
          renderOptions: slideIndexRenderOptions,
        }
        dividerRanges.push(
          dividerOptions,
        )

        const frontmatterOptions = {
          range: new Range(start, start),
        }
        frontmetterRanges.push(frontmatterOptions)
      }
      else {
        const dividerOptions = {
          range: startDividerRange,
        }
        dividerRanges.push(
          dividerOptions,
        )

        const range = text.slice(doc.offsetAt(start))
        const match = range.match(/^---[\s\S]*?\n---/)
        if (match && match.index != null) {
          const endLine = doc.positionAt(doc.offsetAt(start) + match.index + match[0].length).line
          const decoOptions = {
            range: new Range(start, new Position(endLine, 0)),
          }
          frontmetterRanges.push(decoOptions)
          if (endLine !== start.line) {
            const endDividerOptions = {
              range: new Range(new Position(endLine, 0), new Position(endLine, 0)),
              renderOptions: slideIndexRenderOptions,
            }
            dividerRanges.push(endDividerOptions)
          }
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
