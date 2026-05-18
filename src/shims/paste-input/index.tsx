import {forwardRef} from 'react'
import {TextInput, type TextInputProps} from 'react-native'

export type PasteEventPayload = {
  type: 'text' | 'images' | 'unsupported'
  text?: string
  uris: string[]
  files?: File[]
}

type TextInputWrapperProps = TextInputProps & {
  onPaste?: (event: PasteEventPayload) => void
}

export const TextInputWrapper = forwardRef<TextInput, TextInputWrapperProps>(
  function TextInputWrapper({onPaste, ...props}, ref) {
    void onPaste
    return <TextInput ref={ref} {...props} />
  },
)
