import { commands, languages, window, workspace } from 'vscode'
// @ts-expect-error
import * as parser from '@slidev/parser/fs'
import Markdown from 'markdown-it'
import { ctx } from './ctx'
import { SlideItem } from './view/SlideItem'
import { SlidesProvider } from './view/SlidesProvider'
import { FoldingProvider } from './view/FoldingProvider'
import { PreviewProvider } from './view/PreviewProvider'
import { getCurrentSlideIndex, revealSlide } from './slides'

export function configEditor() {
  const previewProvider = new PreviewProvider()
  let previousSlideIndex = -1

  async function update() {
    const editor = window.activeTextEditor
    const doc = editor?.document
    if (!editor || !doc || doc.languageId !== 'markdown')
      return
    const path = doc.uri.fsPath

    // ignore for sub entries
    if (ctx.data?.entries?.includes(path) && ctx.data.filepath !== path)
      return

    ctx.doc = doc
    ctx.data = await parser.load(path, {}, doc.getText())
  }

  function updateCurrentSlide() {
    if (!previewProvider.view?.visible)
      return

    const current = getCurrentSlideIndex()
    if (current != null && current !== previousSlideIndex) {
      previousSlideIndex = current
      previewProvider.updateSlide(current)
    }
  }

  workspace.createFileSystemWatcher('**/*.md', true, false)
    .onDidChange(async(uri) => {
      if (uri.fsPath === ctx.doc?.uri.fsPath)
        ctx.data = await parser.load(uri.fsPath)
    })

  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument(update),
    window.onDidChangeActiveTextEditor(update),
    window.registerWebviewViewProvider(
      PreviewProvider.viewId,
      previewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
    window.onDidChangeTextEditorSelection(updateCurrentSlide),
  )

  const provider = new SlidesProvider()
  window.createTreeView('slidev-slides', {
    treeDataProvider: provider,
    showCollapseAll: true,
  })

  commands.registerCommand('slidev.goto', async(idx: number) => {
    revealSlide(idx)
    previewProvider.updateSlide(idx)
  })

  commands.registerCommand('slidev.next', async() => {
    const editor = window.activeTextEditor
    if (!editor || editor.document !== ctx.doc)
      return
    const index = getCurrentSlideIndex(editor)
    if (index != null)
      revealSlide(index + 1)
  })

  commands.registerCommand('slidev.prev', async() => {
    const editor = window.activeTextEditor
    if (!editor || editor.document !== ctx.doc)
      return
    const index = getCurrentSlideIndex(editor) || 0
    revealSlide(index - 1)
  })

  function move<T>(arr: T[], from: number, to: number) {
    arr.splice(to, 0, arr.splice(from, 1)[0])
    return arr
  }

  commands.registerCommand('slidev.move-up', async(item: SlideItem) => {
    if (!ctx.data?.slides || item.info.index <= 0)
      return
    move(ctx.data.slides, item.info.index, item.info.index - 1)
    parser.save(ctx.data)
  })

  commands.registerCommand('slidev.move-down', async(item: SlideItem) => {
    if (!ctx.data?.slides || item.info.index >= ctx.data.slides.length)
      return
    move(ctx.data.slides, item.info.index, item.info.index + 1)
    parser.save(ctx.data)
  })

  commands.registerCommand('slidev.preview-refresh', previewProvider.refresh.bind(previewProvider))

  commands.registerCommand('slidev.markdown-to-html', async() => {
    const editor = window.activeTextEditor
    const doc = editor?.document
    if (!editor || !doc)
      return

    const range = editor.selection
    const md = doc.getText(range)
    const html = new Markdown({
      html: true,
      linkify: true,
      xhtmlOut: true,
    }).render(md)

    editor.edit((edit) => {
      edit.replace(range, html)
    })
  })

  languages.registerFoldingRangeProvider({ language: 'markdown' }, new FoldingProvider())

  ctx.onDataUpdate(() => provider.refresh())

  update()
}
