import { Position, Range, Selection, TextEditorRevealType, window } from 'vscode'
import { ctx } from './ctx'

export function getCurrentSlideIndex(editor = window.activeTextEditor) {
  if (!editor)
    return
  const line = editor.selection.start.line + 1
  return ctx.data?.slides.findIndex(i => i.start <= line && i.end >= line)
}

export function revealSlide(idx: number, editor = window.activeTextEditor) {
  if (idx < 0 || !editor)
    return
  const slide = ctx.data?.slides[idx]
  if (!slide)
    return
  const pos = new Position(slide.start, 0)
  const range = new Range(pos, pos)
  editor.selection = new Selection(pos, pos)
  editor.revealRange(range, TextEditorRevealType.AtTop)
}
