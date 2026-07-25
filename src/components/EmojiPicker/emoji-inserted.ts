import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import type { Emoji } from '#/components/EmojiPicker/types';

/** The user picked an emoji from the picker; the active web text input inserts it. */
export const emojiInserted = new SimpleEventEmitter<[Emoji]>();
