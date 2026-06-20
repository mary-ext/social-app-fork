import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

/** Focus the search input. */
export const focusSearch = new SimpleEventEmitter<[]>();

/** The network came back after being lost. */
export const networkConfirmed = new SimpleEventEmitter<[]>();

/** The network connection was lost. */
export const networkLost = new SimpleEventEmitter<[]>();

/** A post was created by the user. */
export const postCreated = new SimpleEventEmitter<[]>();

/** The active session was dropped (e.g. failed token refresh). */
export const sessionDropped = new SimpleEventEmitter<[]>();

/** A "soft reset" — typically scroll to top and load latest, though the exact behavior depends on the screen. */
export const softReset = new SimpleEventEmitter<[]>();
