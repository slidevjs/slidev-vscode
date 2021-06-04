
import { existsSync, promises as fs } from 'fs'
import { join } from 'path'
import { commands, ExtensionContext, workspace } from 'vscode'
import { config } from './config'
import { ctx } from './ctx'
import { configEditor } from './editor'

export async function activate(ext: ExtensionContext) {
  ctx.ext = ext

  const userRoot = workspace.workspaceFolders?.[0].uri.fsPath

  if (!userRoot || !existsSync(join(userRoot, 'package.json')))
    return

  let enabled = config.enabled

  if (!enabled) {
    const json = JSON.parse(await fs.readFile(join(userRoot, 'package.json'), 'utf-8'))
    enabled = json?.dependencies?.['@slidev/cli'] || json?.devDependencies?.['@slidev/cli']
  }

  if (enabled) {
    commands.executeCommand('setContext', 'slidev-enabled', true)
    configEditor()
  }
}

export async function deactivate() {
}
