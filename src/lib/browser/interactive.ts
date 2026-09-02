/** selector for elements that own their press */
export const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [role="link"], [data-no-row-link]';

/** props excluding a region from row navigation and parent press feedback */
export const noRowLink = { 'data-no-row-link': '' };

/** props adding press feedback to a non-interactive element */
export const pressable = { 'data-press': '' };
