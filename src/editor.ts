import { Command, env, Uri, commands, EventEmitter, WebviewView, WebviewViewProvider, FoldingRange, FoldingRangeKind, FoldingRangeProvider, languages, Position, ProviderResult, Range, Selection, TextDocument, TextEditorRevealType, ThemeIcon, TreeDataProvider, TreeItem, window, workspace } from 'vscode'
import got from 'got'
// @ts-expect-error
import * as parser from '@slidev/parser/fs'
import { SlideInfo } from '@slidev/types'
import Markdown from 'markdown-it'
import { ctx } from './ctx'

export function configEditor() {
  const previewProvider = new PreviewProvider()
  function update() {
    const editor = window.activeTextEditor
    const doc = editor?.document
    if (!editor || !doc || doc.languageId !== 'markdown')
      return

    ctx.doc = doc
    ctx.data = parser.parse(doc.getText(), doc.uri.fsPath)

    // update webview
    if (previewProvider.view?.visible) {
      console.log('update update', previewProvider.view?.visible)
      previewProvider.update()
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
  )

  const provider = new SlidesProvider()
  window.createTreeView('slidev-slides', {
    treeDataProvider: provider,
    showCollapseAll: true,
  })

  commands.registerCommand('slidev.goto', async(idx: number) => {
    if (ctx.doc) {
      const editor = await window.showTextDocument(ctx.doc)
      revealSlide(idx, editor)
    }
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

function getCurrentSlideIndex(editor = window.activeTextEditor) {
  if (!editor)
    return
  const line = editor.selection.start.line + 1
  return ctx.data?.slides.findIndex(i => i.start <= line && i.end >= line)
}

function revealSlide(idx: number, editor = window.activeTextEditor) {
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

export class FoldingProvider implements FoldingRangeProvider {
  private _onDidChangeFoldingRanges = new EventEmitter<void>()
  readonly onDidChangeFoldingRanges = this._onDidChangeFoldingRanges.event

  provideFoldingRanges(document: TextDocument): FoldingRange[] {
    if (document === ctx.doc && ctx.data)
      return ctx.data.slides.map(i => new FoldingRange(i.start - 1, i.end - 1, FoldingRangeKind.Region))
    return []
  }
}

export class SlideItem implements TreeItem {
  label: string
  description?: string
  iconPath?: string | ThemeIcon
  command?: Command

  constructor(public readonly info: SlideInfo) {
    this.label = `${info.index + 1} - ${info.title || ''}`
    if (!info.title)
      this.description = '(Untitled)'

    this.command = {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [info.index],
    }

    if (info.index === 0)
      info.frontmatter.layout ||= 'cover'

    switch (info.frontmatter.layout) {
      case 'cover':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-home.svg')
        break
      case 'section':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-align-box-middle-left.svg')
        break
      case 'center':
      case 'centered':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-align-box-middle-center.svg')
        break
      case 'image':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-image.svg')
        break
      case 'image-left':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-open-panel-filled-left.svg')
        break
      case 'image-right':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-open-panel-filled-right.svg')
        break
      case 'intro':
        this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-identification.svg')
        break
    }

    if (info.frontmatter.disabled) {
      this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-view-off.svg')
      this.description = this.label
      this.label = ''
    }
  }
}

export class SlidesProvider implements TreeDataProvider<SlideItem> {
  private _onDidChangeTreeData = new EventEmitter<SlideItem | undefined>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined)
  }

  getTreeItem(element: SlideItem): SlideItem | Thenable<SlideItem> {
    return element
  }

  getChildren(element?: SlideItem): ProviderResult<SlideItem[]> {
    if (!element)
      return ctx.data?.slides.map(i => new SlideItem(i))
    return []
  }
}

export class PreviewProvider implements WebviewViewProvider {
  public static readonly viewId = 'slidev-preview'
  public view: WebviewView | undefined

  public async refresh() {
    console.log('refresh')
    const editor = window.activeTextEditor
    if (!editor || editor.document !== ctx.doc)
      return

    if (!this.view)
      return

    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [ctx.ext.extensionUri],
    }

    // TODO: get port from process info
    const serverAddr = 'http://127.0.0.1:3030/'

    const defaultHTML = await got.get(`${serverAddr}index.html`, { responseType: 'text', resolveBodyOnly: true }).catch(() => {
      // error html
      return Promise.resolve('<div style="text-align: center"><p>Sorry, the preview server not start</p><p>please run <code style="color: red">slide dev</code> first</p></div>')
    })

    const fullWebServerUri = await env.asExternalUri(
      Uri.parse(serverAddr),
    )

    const cspSource = this.view.webview.cspSource
    // solve CSP
    const html = defaultHTML?.replace('<head>', `
    <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${fullWebServerUri} ${cspSource} https: http:; script-src ${fullWebServerUri} ${cspSource} unsafe-inline; style-src ${fullWebServerUri} ${cspSource} 'unsafe-inline';"
    />
    <base href="${serverAddr}" target="_blank">
    `)

    this.view.webview.html = html
  }

  public async resolveWebviewView(webviewView: WebviewView) {
    this.view = webviewView
    this.refresh()
  }
}
