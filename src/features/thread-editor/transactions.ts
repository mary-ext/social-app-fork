import { history } from 'wordgard/history';

/** keeps structural and media edits in separate undo steps from typing. */
export const ISOLATE_HISTORY = history.isolate.of(true);
