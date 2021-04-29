
import { ExtensionContext, window } from 'vscode'
import { ctx } from './ctx'

export async function activate(ext: ExtensionContext) {
  ctx.ext = ext
  window.showInformationMessage('Hi')
}

export async function deactivate() {
}
