import { ContentState, type ContentStateProps } from './ContentState';

export type BlankStateProps = Omit<ContentStateProps, 'onRetry'>;

/**
 * displays a valid content region that has nothing to show.
 *
 * @param props content and actions for the blank state
 * @returns a blank content state
 */
export function BlankState(props: BlankStateProps) {
	return <ContentState {...props} />;
}
