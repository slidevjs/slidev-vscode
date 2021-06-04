import { workspace } from 'vscode'

export function isDarkTheme() {
  const theme = workspace.getConfiguration()
    .get('workbench.colorTheme', '')

  // must be dark
  if (theme.match(/dark|black/i) != null)
    return true

  // must be light
  if (theme.match(/light/i) != null)
    return false

  // IDK, maybe dark
  return true
}
