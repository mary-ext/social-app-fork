import {logger} from '#/logger'
import {type Theme} from '#/alf/base'
import {IS_ANDROID} from '#/env'
import * as SystemUI from '#/shims/system-ui'

export function setSystemUITheme(themeType: 'theme' | 'lightbox', t: Theme) {
  if (IS_ANDROID) {
    try {
      if (themeType === 'theme') {
        SystemUI.setBackgroundColorAsync(t.atoms.bg.backgroundColor)
      } else {
        SystemUI.setBackgroundColorAsync('black')
      }
    } catch (error) {
      // Can reject with 'The current activity is no longer available' - no big deal
      logger.debug('Could not set system UI theme', {safeMessage: error})
    }
  }
}
