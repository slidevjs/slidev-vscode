import type { SlideInfo, SlideInfoWithPath } from '@slidev/types'
import { Position, Range, Selection, TextEditorRevealType, Uri, window, workspace } from 'vscode'
import { ctx } from './ctx'

export function getCurrentSlideIndex(editor = window.activeTextEditor) {
  if (!editor)
    return
  const line = editor.selection.start.line + 1
  return ctx.data?.slides.findIndex(i => i.start <= line && i.end >= line)
}

export async function revealSlide(idx: number, editor = window.activeTextEditor) {
  if (idx < 0)
    return
  // @ts-expect-error casting
  let slide: SlideInfoWithPath & SlideInfo = ctx.data?.slides[idx]
  // @ts-expect-error casting
  slide = slide?.source || slide
  if (!slide)
    return

  if (slide.filepath)
    editor = await window.showTextDocument(await workspace.openTextDocument(Uri.file(slide.filepath)))
  else if (ctx.doc)
    editor = await window.showTextDocument(ctx.doc)

  if (!editor)
    return

  const pos = new Position(slide.start || 0, 0)
  const range = new Range(pos, pos)
  editor.selection = new Selection(pos, pos)
  editor.revealRange(range, TextEditorRevealType.AtTop)
}
