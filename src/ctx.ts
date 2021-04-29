import { ExtensionContext } from 'vscode'
import type { PackageJson } from 'types-package-json'

export interface Context {
  ext: ExtensionContext
  packageJSON?: Partial<PackageJson>
}

export const ctx = {} as Context
