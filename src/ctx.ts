import type { ExtensionContext, TextDocument } from 'vscode'
import { EventEmitter } from 'vscode'
import type { SlidevMarkdown } from '@slidev/types'

export class Context {
  private _onDataUpdate = new EventEmitter<SlidevMarkdown | undefined>()
  private _data: SlidevMarkdown | undefined

  onDataUpdate = this._onDataUpdate.event

  ext: ExtensionContext = undefined!
  doc: TextDocument | undefined

  get data() {
    return this._data
  }

  set data(data: SlidevMarkdown | undefined) {
    this._data = data
    this._onDataUpdate.fire(data)
  }

  get subscriptions() {
    return this.ext.subscriptions
  }
}

export const ctx = new Context()
