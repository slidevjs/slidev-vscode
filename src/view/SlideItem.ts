import { Command, ThemeIcon, TreeItem } from 'vscode'
import { SlideInfo } from '@slidev/types'
import { ctx } from '../ctx'

export class SlideItem implements TreeItem {
  label: string
  description?: string
  iconPath?: string | ThemeIcon
  command?: Command

  constructor(public readonly info: SlideInfo) {
    this.label = `${info.index + 1} - ${info.title || ''}`
    if (!info.title)
      this.description = '(Untitled)'

    this.command = {
      command: 'slidev.goto',
      title: 'Goto',
      arguments: [info.index],
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

    if (info.frontmatter.disabled) {
      this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-view-off.svg')
      this.description = this.label
      this.label = ''
    }

    if (info.source)
      this.iconPath = ctx.ext.asAbsolutePath('./res/icons/carbon-script-reference.svg')
  }
}
