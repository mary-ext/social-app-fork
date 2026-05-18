export function alpha(color: string, opacity: number) {
  if (color.startsWith('hsl(')) {
    return 'hsla(' + color.slice('hsl('.length, -1) + `, ${opacity})`
  } else if (color.startsWith('rgb(')) {
    return 'rgba(' + color.slice('rgb('.length, -1) + `, ${opacity})`
  } else if (color.startsWith('#')) {
    if (color.length === 7) {
      const alphaHex = Math.round(opacity * 255).toString(16)
      // Per MDN: If there is only one number, it is duplicated: e means ee
      // https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color
      return color.slice(0, 7) + alphaHex.padStart(2, alphaHex)
    } else if (color.length === 4) {
      // convert to 6-digit hex before adding opacity
      const [r, g, b] = color.slice(1).split('')
      const alphaHex = Math.round(opacity * 255).toString(16)
      return `#${r.repeat(2)}${g.repeat(2)}${b.repeat(2)}${alphaHex.padStart(
        2,
        alphaHex,
      )}`
    }
  }
  return color
}
