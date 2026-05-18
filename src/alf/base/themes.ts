import {atoms} from './atoms'
import {type ShadowStyle} from './atoms/types'
import {
  DEFAULT_PALETTE,
  DEFAULT_SUBDUED_PALETTE,
  invertPalette,
  type Palette,
} from './palette'
import {alpha} from './utils/alpha'

export const themes = createThemes({
  defaultPalette: DEFAULT_PALETTE,
  subduedPalette: DEFAULT_SUBDUED_PALETTE,
})

export type ThemeAtoms = {
  text: {
    color: string
  }
  text_contrast_low: {
    color: string
  }
  text_contrast_medium: {
    color: string
  }
  text_contrast_high: {
    color: string
  }
  text_inverted: {
    color: string
  }
  bg: {
    backgroundColor: string
  }
  bg_contrast_25: {
    backgroundColor: string
  }
  bg_contrast_50: {
    backgroundColor: string
  }
  bg_contrast_100: {
    backgroundColor: string
  }
  bg_contrast_200: {
    backgroundColor: string
  }
  bg_contrast_300: {
    backgroundColor: string
  }
  bg_contrast_400: {
    backgroundColor: string
  }
  bg_contrast_500: {
    backgroundColor: string
  }
  bg_contrast_600: {
    backgroundColor: string
  }
  bg_contrast_700: {
    backgroundColor: string
  }
  bg_contrast_800: {
    backgroundColor: string
  }
  bg_contrast_900: {
    backgroundColor: string
  }
  bg_contrast_950: {
    backgroundColor: string
  }
  bg_contrast_975: {
    backgroundColor: string
  }
  border_contrast_low: {
    borderColor: string
  }
  border_contrast_medium: {
    borderColor: string
  }
  border_contrast_high: {
    borderColor: string
  }
  shadow_xs: ShadowStyle
  shadow_sm: ShadowStyle
  shadow_md: ShadowStyle
  shadow_lg: ShadowStyle
}

/**
 * Categorical representation of the theme
 */
export type ThemeScheme = 'light' | 'dark'

/**
 * Specific theme name, including low-contrast variants
 */
export type ThemeName = 'light' | 'dark' | 'dim'

/**
 * A theme object, containing the color palette and atoms for the theme
 */
export type Theme = {
  scheme: ThemeScheme
  name: ThemeName
  palette: Palette
  atoms: ThemeAtoms
}

export function createTheme({
  scheme,
  name,
  palette,
  options = {},
}: {
  scheme: ThemeScheme
  name: ThemeName
  palette: Palette
  options?: {
    shadowOpacity?: number
  }
}): Theme {
  const shadowOpacity = options.shadowOpacity ?? 0.1
  const shadowColor = alpha(palette.black, shadowOpacity)
  return {
    scheme,
    name,
    palette,
    atoms: {
      text: {
        color: palette.contrast_1000,
      },
      text_contrast_low: {
        color: palette.contrast_400,
      },
      text_contrast_medium: {
        color: palette.contrast_700,
      },
      text_contrast_high: {
        color: palette.contrast_900,
      },
      text_inverted: {
        color: palette.contrast_0,
      },
      bg: {
        backgroundColor: palette.contrast_0,
      },
      bg_contrast_25: {
        backgroundColor: palette.contrast_25,
      },
      bg_contrast_50: {
        backgroundColor: palette.contrast_50,
      },
      bg_contrast_100: {
        backgroundColor: palette.contrast_100,
      },
      bg_contrast_200: {
        backgroundColor: palette.contrast_200,
      },
      bg_contrast_300: {
        backgroundColor: palette.contrast_300,
      },
      bg_contrast_400: {
        backgroundColor: palette.contrast_400,
      },
      bg_contrast_500: {
        backgroundColor: palette.contrast_500,
      },
      bg_contrast_600: {
        backgroundColor: palette.contrast_600,
      },
      bg_contrast_700: {
        backgroundColor: palette.contrast_700,
      },
      bg_contrast_800: {
        backgroundColor: palette.contrast_800,
      },
      bg_contrast_900: {
        backgroundColor: palette.contrast_900,
      },
      bg_contrast_950: {
        backgroundColor: palette.contrast_950,
      },
      bg_contrast_975: {
        backgroundColor: palette.contrast_975,
      },
      border_contrast_low: {
        borderColor: palette.contrast_100,
      },
      border_contrast_medium: {
        borderColor: palette.contrast_200,
      },
      border_contrast_high: {
        borderColor: palette.contrast_300,
      },
      shadow_xs: {
        ...atoms.shadow_xs,
        shadowColor: palette.black,
        boxShadow: `0 2px 8px 0 ${shadowColor}`,
      },
      shadow_sm: {
        ...atoms.shadow_sm,
        shadowColor: palette.black,
        boxShadow: `0 4px 6px -1px ${shadowColor}, 0 2px 4px -2px ${shadowColor}`,
      },
      shadow_md: {
        ...atoms.shadow_md,
        shadowColor: palette.black,
        boxShadow: `0 10px 15px -3px ${shadowColor}, 0 4px 6px -4px ${shadowColor}`,
      },
      shadow_lg: {
        ...atoms.shadow_lg,
        shadowColor: palette.black,
        boxShadow: `0 20px 25px -5px ${shadowColor}, 0 8px 10px -6px ${shadowColor}`,
      },
    },
  }
}

export function createThemes({
  defaultPalette,
  subduedPalette,
}: {
  defaultPalette: Palette
  subduedPalette: Palette
}): {
  light: Theme
  dark: Theme
  dim: Theme
} {
  const light = createTheme({
    scheme: 'light',
    name: 'light',
    palette: defaultPalette,
  })
  const dark = createTheme({
    scheme: 'dark',
    name: 'dark',
    palette: invertPalette(defaultPalette),
    options: {
      shadowOpacity: 0.4,
    },
  })
  const dim = createTheme({
    scheme: 'dark',
    name: 'dim',
    palette: invertPalette(subduedPalette),
    options: {
      shadowOpacity: 0.4,
    },
  })

  return {
    light,
    dark,
    dim,
  }
}
