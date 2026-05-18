import {View} from 'react-native'
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie'

import {atoms as a, useTheme} from '#/alf'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
import {type ImagePickerAsset} from '#/shims/image-picker'
import {ExternalEmbedRemoveBtn} from '../ExternalEmbedRemoveBtn'
import {VideoTranscodeBackdrop} from './VideoTranscodeBackdrop'

export function VideoTranscodeProgress({
  asset,
  progress,
  clear,
}: {
  asset: ImagePickerAsset
  progress: number
  clear: () => void
}) {
  const t = useTheme()

  return null
}
