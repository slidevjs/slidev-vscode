import type { ProviderResult, TreeDataProvider } from 'vscode'
import { EventEmitter } from 'vscode'
import { ctx } from '../ctx'
import { SlideItem } from './SlideItem'

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
      return ctx.data?.slides?.map(i => new SlideItem(i))
    return []
  }
}
