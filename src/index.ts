
import { existsSync, promises as fs } from 'fs'
import { join } from 'path'
import { commands, ExtensionContext, workspace } from 'vscode'
import { ctx } from './ctx'
import { configEditor } from './editor'

export async function activate(ext: ExtensionContext) {
  ctx.ext = ext

  const userRoot = workspace.workspaceFolders?.[0].uri.fsPath

  if (!userRoot || !existsSync(join(userRoot, 'package.json')))
    return

  const json = JSON.parse(await fs.readFile(join(userRoot, 'package.json'), 'utf-8'))
  if (json?.dependencies?.['@slidev/cli'] || json?.devDependencies?.['@slidev/cli']) {
    commands.executeCommand('setContext', 'slidev-enabled', true)
    configEditor()
  }
}

export async function deactivate() {
}
