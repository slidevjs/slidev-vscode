import { EventEmitter, FoldingRange, FoldingRangeKind, FoldingRangeProvider, TextDocument } from 'vscode'
import { ctx } from '../ctx'

export class FoldingProvider implements FoldingRangeProvider {
  private _onDidChangeFoldingRanges = new EventEmitter<void>()
  readonly onDidChangeFoldingRanges = this._onDidChangeFoldingRanges.event

  provideFoldingRanges(document: TextDocument): FoldingRange[] {
    if (document === ctx.doc && ctx.data)
      return ctx.data?.slides?.map(i => new FoldingRange(i.start - 1, i.end - 1, FoldingRangeKind.Region)) || []
    return []
  }
}
