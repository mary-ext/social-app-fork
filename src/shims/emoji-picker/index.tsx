import {Pressable, View} from 'react-native'

import {Text} from '#/components/Typography'

type EmojiPickerProps = {
  children?: React.ReactNode
  onEmojiSelected: (emoji: string) => void
}

const COMMON_EMOJI = ['👍', '❤️', '😂', '🎉', '😮', '😢']

export function EmojiPicker({onEmojiSelected}: EmojiPickerProps) {
  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16}}>
      {COMMON_EMOJI.map(emoji => (
        <Pressable accessibilityRole="button" key={emoji} onPress={() => onEmojiSelected(emoji)}>
          <Text style={{fontSize: 28}} emoji>
            {emoji}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

export function EmojiPopup({children, onEmojiSelected}: EmojiPickerProps) {
  return (
    <Pressable accessibilityRole="button" onPress={() => onEmojiSelected(COMMON_EMOJI[0] ?? '👍')}>
      {children}
    </Pressable>
  )
}
