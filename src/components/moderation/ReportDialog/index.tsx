import { useId, useMemo, useReducer, useState } from 'react';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { getLabelingServiceTitle } from '#/lib/moderation';
import { BSKY_LABELER_DID } from '#/lib/moderation/const';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useMyLabelersQuery } from '#/state/queries/preferences/moderation';

import { Logger } from '#/logger';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon } from '#/components/icons/Chevron';
import { PaperPlane_Stroke2_Corner0_Rounded as PaperPlaneIcon } from '#/components/icons/PaperPlane';
import { SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRightIcon } from '#/components/icons/SquareArrowTopRight';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { UserAvatar } from '#/components/UserAvatar';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { ExternalLink } from '#/components/web/Link';
import * as Menu from '#/components/web/Menu';

import { colors } from '#/styles/colors';

import { useSubmitReportMutation } from './action';
import {
	BSKY_LABELER_ONLY_REPORT_REASONS,
	BSKY_LABELER_ONLY_SUBJECT_TYPES,
	NEW_TO_OLD_REASONS_MAP,
	SUPPORT_PAGE,
} from './const';
import { useCopyForSubject } from './copy';
import * as styles from './index.css';
import { initialState, reducer, stepFor } from './state';
import type { ParsedReportSubject, ReportSubject } from './types';
import { parseReportSubject } from './utils/parseReportSubject';
import { type ReportCategoryConfig, type ReportOption, useReportOptions } from './utils/useReportOptions';

export { type ReportSubject } from './types';
export { useDialogHandle as useReportDialogControl } from '#/components/web/Dialog';

/** Caps the free-text context; submission is blocked past this and the counter turns negative. */
const MAX_DETAILS_LENGTH = 300;

export function useGlobalReportDialogControl() {
	return useGlobalDialogsControlContext().reportDialogControl;
}

/** The app-wide report dialog, opened imperatively with `reportDialogControl.openWithPayload({ subject })`. */
export function GlobalReportDialog() {
	const { t: l } = useLingui();
	const control = useGlobalReportDialogControl();
	return (
		<Dialog.Root handle={control}>
			{({ payload }: { payload: { subject: ReportSubject } | undefined }) =>
				payload ? (
					<Dialog.Popup className={styles.popup} label={l`Report dialog`} scroll="body">
						<Content close={() => control.close()} subject={payload.subject} />
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}

export function ReportDialog({
	control,
	onAfterSubmit,
	onClose,
	subject,
}: {
	control: Dialog.DialogHandle;
	onAfterSubmit?: () => void;
	onClose?: () => void;
	subject?: ReportSubject;
}) {
	const { t: l } = useLingui();
	return (
		<Dialog.Root
			handle={control}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Popup className={styles.popup} label={l`Report dialog`} scroll="body">
				<Content close={() => control.close()} onAfterSubmit={onAfterSubmit} subject={subject} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Content({
	close,
	onAfterSubmit,
	subject,
}: {
	close: () => void;
	onAfterSubmit?: () => void;
	subject?: ReportSubject;
}) {
	const parsed = useMemo(() => (subject ? parseReportSubject(subject) : undefined), [subject]);
	if (!parsed) {
		return <Invalid close={close} />;
	}
	return <Inner close={close} onAfterSubmit={onAfterSubmit} subject={parsed} />;
}

/**
 * Shown only if a developer wired the dialog with an unrecognizable subject — a graceful fallback rather than
 * an empty sheet.
 */
function Invalid({ close }: { close: () => void }) {
	const { t: l } = useLingui();
	return (
		<>
			<Header close={close} title={l`Report`} />
			<Dialog.Body>
				<div className={styles.body}>
					<Text size="lg" weight="bold">
						<Trans>Invalid report subject</Trans>
					</Text>
					<Text color="textContrastMedium">
						<Trans>
							Something wasn't quite right with the data you're trying to report. Please contact support.
						</Trans>
					</Text>
				</div>
			</Dialog.Body>
		</>
	);
}

function Inner({
	close,
	onAfterSubmit,
	subject,
}: {
	close: () => void;
	onAfterSubmit?: () => void;
	subject: ParsedReportSubject;
}) {
	const { t: l } = useLingui();
	const logger = useMemo(() => Logger.create(Logger.Context.ReportDialog), []);
	const {
		data: allLabelers,
		error: labelersError,
		isLoading: labelersLoading,
		refetch,
	} = useMyLabelersQuery({
		excludeNonConfigurableLabelers: true,
	});
	const copy = useCopyForSubject(subject);
	const { categories, getCategory } = useReportOptions();
	const [state, dispatch] = useReducer(reducer, initialState);
	const { mutateAsync: submitReport } = useSubmitReportMutation();
	const [isPending, setIsPending] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const step = stepFor(state);

	// some reasons and some subjects route exclusively to Bluesky's moderation service
	const isBskyOnly =
		(state.reason ? BSKY_LABELER_ONLY_REPORT_REASONS.has(state.reason.reason) : false) ||
		BSKY_LABELER_ONLY_SUBJECT_TYPES.has(subject.type);

	/** Labelers that accept this subject, its collection, and the selected reason. */
	const supportedLabelers = useMemo(() => {
		if (!allLabelers || !state.reason) {
			return [];
		}
		const reason = state.reason.reason;
		return allLabelers
			.filter((labeler) => {
				const subjectTypes: string[] | undefined = labeler.subjectTypes;
				if (subjectTypes === undefined) {
					return true;
				}
				if (subject.type === 'account') {
					return subjectTypes.includes('account');
				} else if (subject.type === 'convo' || subject.type === 'convoMessage') {
					return subjectTypes.includes('chat');
				}
				return subjectTypes.includes('record');
			})
			.filter((labeler) => {
				const collections: string[] | undefined = labeler.subjectCollections;
				if (collections === undefined) {
					return true;
				}
				// all chat collections are accepted, since only Bluesky handles chats
				if (subject.type === 'convo' || subject.type === 'convoMessage') {
					return true;
				}
				return collections.includes(subject.nsid);
			})
			.filter((labeler) => {
				if (isBskyOnly) {
					return labeler.creator.did === BSKY_LABELER_DID;
				}
				const reasonTypes: string[] | undefined = labeler.reasonTypes;
				if (reasonTypes === undefined) {
					return true;
				}
				// accept either the new reason or its backwards-compatible old form
				return reasonTypes.includes(reason) || reasonTypes.includes(NEW_TO_OLD_REASONS_MAP[reason]!);
			});
	}, [allLabelers, isBskyOnly, state.reason, subject]);

	// default to the first supported labeler; honour an explicit override only while it stays supported
	const selectedLabeler = useMemo(() => {
		if (
			state.labeler &&
			supportedLabelers.some((labeler) => labeler.creator.did === state.labeler!.creator.did)
		) {
			return state.labeler;
		}
		return supportedLabelers[0];
	}, [state.labeler, supportedLabelers]);

	const overLimit = state.details.length > MAX_DETAILS_LENGTH;
	const canSubmit = !!state.reason && !!selectedLabeler && !overLimit && !isPending && !isSuccess;

	const onSubmit = async () => {
		if (!state.reason || !selectedLabeler) {
			return;
		}
		dispatch({ type: 'clearError' });
		logger.info('submitting');
		try {
			setIsPending(true);
			await submitReport({
				details: state.details.trim() || undefined,
				labeler: selectedLabeler,
				reason: state.reason.reason,
				subject,
			});
			setIsSuccess(true);
			onAfterSubmit?.();
			close();
		} catch (e) {
			logger.error(e instanceof Error ? e : String(e), { source: 'ReportDialog' });
			dispatch({ type: 'setError', error: l`Something went wrong. Please try again.` });
		} finally {
			setIsPending(false);
		}
	};

	let title = copy.title;
	let onBack: (() => void) | undefined;
	if (step === 'reasons') {
		onBack = () => dispatch({ type: 'clearCategory' });
	} else if (step === 'form') {
		// the `other` category skips the reason list, so its form steps back to the categories
		onBack = () => dispatch({ type: state.category?.key === 'other' ? 'clearCategory' : 'clearReason' });
	}

	return (
		<>
			<Header close={close} onBack={onBack} title={title} />

			{step === 'categories' && (
				<Dialog.Body>
					<div className={styles.body}>
						<Text className={styles.prompt} weight="semiBold">
							{copy.subtitle}
						</Text>
						<div className={styles.options}>
							{categories.map((category) => (
								<CategoryCard
									key={category.key}
									category={category}
									onSelect={() =>
										dispatch({
											type: 'selectCategory',
											category,
											otherOption: getCategory('other').options[0]!,
										})
									}
								/>
							))}
						</div>
						{(subject.type === 'account' || subject.type === 'post') && (
							<ExternalLink
								className={styles.legal}
								href={SUPPORT_PAGE}
								label={l`Report a copyright violation, legal request, or regulatory compliance issue`}
							>
								<Text className={styles.grow} color="textContrastMedium" leading="snug" size="sm">
									<Trans>
										Need to report a copyright violation, legal request, or regulatory compliance issue?
									</Trans>
								</Text>
								<SquareArrowTopRightIcon fill={colors.textContrastMedium} size="sm" />
							</ExternalLink>
						)}
					</div>
				</Dialog.Body>
			)}

			{step === 'reasons' && state.category && (
				<Dialog.Body>
					<div className={styles.body}>
						<Text className={styles.prompt} weight="semiBold">
							{state.category.title}
						</Text>
						<div className={styles.options}>
							{getCategory(state.category.key).options.map((option) => (
								<OptionCard
									key={option.reason}
									onSelect={() => dispatch({ type: 'selectReason', reason: option })}
									option={option}
								/>
							))}
						</div>
					</div>
				</Dialog.Body>
			)}

			{step === 'form' && (
				<>
					<Dialog.Body>
						<div className={styles.body}>
							{state.reason && (
								<div className={styles.summary}>
									<Text color="textContrastMedium" size="sm">
										<Trans>Reporting for</Trans>
									</Text>
									<Text weight="semiBold">{state.reason.title}</Text>
								</div>
							)}
							{labelersLoading ? (
								<div className={styles.center}>
									<Loader size="lg" />
								</div>
							) : labelersError || !allLabelers ? (
								<>
									<Admonition type="error">
										<Trans>Something went wrong loading the moderation services.</Trans>
									</Admonition>
									<Button
										color="secondary"
										label={l`Retry loading moderation services`}
										onClick={() => void refetch()}
										size="small"
										variant="solid"
									>
										<ButtonText>
											<Trans>Retry</Trans>
										</ButtonText>
									</Button>
								</>
							) : !selectedLabeler ? (
								<Admonition type="warning">
									<Trans>Unfortunately, none of your subscribed labelers supports this report type.</Trans>
								</Admonition>
							) : (
								<>
									<Recipient
										labeler={selectedLabeler}
										onChange={(labeler) => dispatch({ type: 'selectLabeler', labeler })}
										options={supportedLabelers}
									/>
									<Details
										onChange={(details) => dispatch({ type: 'setDetails', details })}
										value={state.details}
									/>
								</>
							)}
							{state.error && <Admonition type="error">{state.error}</Admonition>}
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Button
							color="primary"
							className={styles.doneButton}
							disabled={!canSubmit}
							label={l`Submit report`}
							onClick={() => void onSubmit()}
							size="large"
							variant="solid"
						>
							<ButtonText>{isSuccess ? <Trans>Report sent</Trans> : <Trans>Submit report</Trans>}</ButtonText>
							<ButtonIcon icon={isSuccess ? CheckIcon : isPending ? Loader : PaperPlaneIcon} />
						</Button>
					</Dialog.Footer>
				</>
			)}
		</>
	);
}

function Header({ close, onBack, title }: { close: () => void; onBack?: () => void; title: string }) {
	const { t: l } = useLingui();
	return (
		<Dialog.Header.Outer>
			<Dialog.Header.Slot>
				{onBack && (
					<Button
						color="secondary"
						label={l`Go back`}
						onClick={onBack}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={ChevronLeftIcon} />
					</Button>
				)}
			</Dialog.Header.Slot>
			<Dialog.Header.Content>
				<Dialog.Header.TitleText>{title}</Dialog.Header.TitleText>
			</Dialog.Header.Content>
			<Dialog.Header.Slot>
				<Button color="secondary" label={l`Close`} onClick={close} shape="round" size="small" variant="ghost">
					<ButtonIcon icon={TimesIcon} />
				</Button>
			</Dialog.Header.Slot>
		</Dialog.Header.Outer>
	);
}

function CategoryCard({ category, onSelect }: { category: ReportCategoryConfig; onSelect: () => void }) {
	const { t: l } = useLingui();
	return (
		<button
			aria-label={l`Report for ${category.title}`}
			className={styles.card}
			onClick={onSelect}
			type="button"
		>
			<Text leading="snug" size="md" weight="semiBold">
				{category.title}
			</Text>
			<Text color="textContrastMedium" leading="snug" size="sm">
				{category.description}
			</Text>
		</button>
	);
}

function OptionCard({ onSelect, option }: { onSelect: () => void; option: ReportOption }) {
	const { t: l } = useLingui();
	return (
		<button
			aria-label={l`Report for ${option.title}`}
			className={styles.card}
			onClick={onSelect}
			type="button"
		>
			<Text leading="snug" size="md" weight="semiBold">
				{option.title}
			</Text>
		</button>
	);
}

function Recipient({
	labeler,
	onChange,
	options,
}: {
	labeler: AppBskyLabelerDefs.LabelerViewDetailed;
	onChange: (labeler: AppBskyLabelerDefs.LabelerViewDetailed) => void;
	options: AppBskyLabelerDefs.LabelerViewDetailed[];
}) {
	const { t: l } = useLingui();
	const title = getLabelingServiceTitle({
		displayName: labeler.creator.displayName,
		handle: labeler.creator.handle,
	});
	return (
		<Text leading="snug">
			<Trans>
				Your report will be sent to <Text weight="semiBold">{title}</Text>.
			</Trans>{' '}
			{options.length > 1 && (
				<Menu.Root>
					<Menu.Trigger
						render={
							<button aria-label={l`Change moderation service`} className={styles.changeLink} type="button">
								<Text color="primary_500">
									<Trans>Change</Trans>
								</Text>
							</button>
						}
					/>
					<Menu.Popup align="end" label={l`Choose a moderation service`} minWidth={240}>
						{options.map((option) => {
							const optionTitle = getLabelingServiceTitle({
								displayName: option.creator.displayName,
								handle: option.creator.handle,
							});
							return (
								<Menu.Item key={option.creator.did} label={optionTitle} onClick={() => onChange(option)}>
									<UserAvatar avatar={option.creator.avatar} size={32} type="labeler" />
									<div className={styles.labelerOption}>
										<Text color="textContrastHigh" size="md_sub" weight="medium">
											{optionTitle}
										</Text>
										<Text color="textContrastMedium" size="sm">
											{sanitizeHandle(option.creator.handle, '@')}
										</Text>
									</div>
									<Menu.ItemRadio selected={option.creator.did === labeler.creator.did} />
								</Menu.Item>
							);
						})}
					</Menu.Popup>
				</Menu.Root>
			)}
		</Text>
	);
}

function Details({ onChange, value }: { onChange: (value: string) => void; value: string }) {
	const { t: l } = useLingui();
	const counterId = useId();
	const length = value.length;
	const overLimit = length > MAX_DETAILS_LENGTH;
	const counterLabel = overLimit
		? l`${length} of ${MAX_DETAILS_LENGTH} characters, over the limit`
		: l`${length} of ${MAX_DETAILS_LENGTH} characters`;
	return (
		<TextField.Root isInvalid={overLimit}>
			<TextField.LabelText
				accessory={
					<Text
						aria-label={counterLabel}
						className={styles.counter}
						color={overLimit ? 'negative_500' : 'textContrastMedium'}
						id={counterId}
						size="sm"
					>
						{length} / {MAX_DETAILS_LENGTH}
					</Text>
				}
			>
				<Trans>Additional details (optional)</Trans>
			</TextField.LabelText>
			<TextField.Input
				describedBy={counterId}
				isInvalid={overLimit}
				label={l`Additional details`}
				maxRows={8}
				multiline
				onChangeText={onChange}
				placeholder={l`Add any context that would help the moderators.`}
				value={value}
			/>
			{/* announce only the crossing into over-limit while typing; a stable message avoids per-keystroke spam */}
			<div className={styles.srOnly} role="status">
				{overLimit ? l`Details are over the character limit.` : ''}
			</div>
		</TextField.Root>
	);
}
