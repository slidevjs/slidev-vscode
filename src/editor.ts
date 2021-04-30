import { Command, commands, EventEmitter, Position, ProviderResult, Range, TextEditorRevealType, ThemeIcon, TreeDataProvider, TreeItem, window, workspace } from 'vscode'
import * as parser from '@slidev/parser'
import { SlideInfo } from '@slidev/types'
import { ctx } from './ctx'

export function configEditor() {
  function update() {
    const editor = window.activeTextEditor
    const doc = editor?.document
    if (!editor || !doc || doc.languageId !== 'markdown')
      return

    ctx.doc = doc
    ctx.data = parser.parse(doc.getText(), doc.uri.fsPath)
  }

  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument(update),
    window.onDidChangeActiveTextEditor(update),
  )

  const provider = new SlidesProvider()
  window.createTreeView('slidev-slides', {
    treeDataProvider: provider,
    showCollapseAll: true,
  })

  commands.registerCommand('slidev.goto', async(range: Range) => {
    if (range && ctx.doc) {
      const editor = await window.showTextDocument(ctx.doc)
      editor.revealRange(range, TextEditorRevealType.AtTop)
    }
  })

  ctx.onDataUpdate(() => {
    provider.refresh()
  })

  update()
}

export class SlideItem implements TreeItem {
  label: string
  description?: string
  iconPath?: string | ThemeIcon
  command?: Command

  constructor(public readonly info: SlideInfo) {
    this.label = info.title || ''
    if (!info.title)
      this.description = '(Untitled)'

    const pos = new Position(info.start, 0)
    const range = new Range(pos, pos)
    this.command = {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [range],
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
