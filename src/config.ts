import { isString } from '@antfu/utils'
import { workspace } from 'vscode'

export function getConfig<T>(key: string, v?: T) {
  return workspace.getConfiguration().get(`vite.${key}`, v)
}

export interface Config {
  root: string
}

export const config = new Proxy(
  {
    get root() {
      return workspace.workspaceFolders?.[0]?.uri?.fsPath || ''
    },
  },
  {
    get(target, p, r) {
      if (p in target || !isString(p))
        return Reflect.get(target, p, r)
      return getConfig(p)
    },
  },
) as Readonly<Config>
