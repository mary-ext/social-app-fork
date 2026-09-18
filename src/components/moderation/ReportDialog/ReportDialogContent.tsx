import { type ReactNode, useId, useMemo, useState } from 'react';

import type { AppBskyLabelerDefs } from '@atcute/bluesky';

import { profileDisplayName } from '#/lib/display-names';
import { BSKY_LABELER_DID } from '#/lib/moderation/labelers';
import { trimText } from '#/lib/utils/text';

import { useMyLabelersQuery } from '#/state/queries/preferences/moderation';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import * as Menu from '#/components/Menu';
import { BackOrCloseButton, createNavigator } from '#/components/Navigator';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { UserAvatar } from '#/components/UserAvatar';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import PaperPlaneIcon from '#/icons/central/PaperPlane_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useSubmitReportMutation } from './action';
import {
	BSKY_LABELER_ONLY_REPORT_REASONS,
	BSKY_LABELER_ONLY_SUBJECT_TYPES,
	NEW_TO_OLD_REASONS_MAP,
} from './const';
import { useCopyForSubject } from './copy';
import { reportErrorMessage } from './errors';
import * as styles from './index.css';
import type { ParsedReportSubject, ReportSubject } from './types';
import { parseReportSubject } from './utils/parseReportSubject';
import { type ReportCategoryConfig, type ReportOption, useReportOptions } from './utils/useReportOptions';

/** Caps the free-text context; submission is blocked past this and the counter turns negative. */
const MAX_DETAILS_LENGTH = 300;

type ReportRoutes = {
	categories: undefined;
	form: { reason: ReportOption };
	reasons: { category: ReportCategoryConfig };
};

const ReportNavigator = createNavigator<ReportRoutes>();

export function Content({
	close,
	onAfterSubmit,
	subject,
}: {
	close: () => void;
	onAfterSubmit?: () => void;
	subject?: ReportSubject;
}) {
	const parsed = subject ? parseReportSubject(subject) : undefined;
	if (!parsed) {
		return <Invalid />;
	}
	return (
		<ReportNavigator.Provider initialRoute={{ name: 'categories' }}>
			<Inner close={close} onAfterSubmit={onAfterSubmit} subject={parsed} />
		</ReportNavigator.Provider>
	);
}

/** graceful fallback shown when the dialog receives an unrecognizable subject. */
function Invalid() {
	return (
		<>
			<Header navButton={<Dialog.Header.Close />} title={m['common.action.report']()} />
			<Dialog.Body>
				<div className={styles.body}>
					<Text size="lg" weight="bold">
						{m['components.moderation.report.error.invalidSubject']()}
					</Text>
					<Text color="textContrastMedium">{m['components.moderation.report.error.dataInvalid']()}</Text>
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
	const {
		data: allLabelers,
		error: labelersError,
		isLoading: labelersLoading,
		refetch,
	} = useMyLabelersQuery();
	const copy = useCopyForSubject(subject);
	const { categories } = useReportOptions();
	const { push, route } = ReportNavigator.useNavigator();
	const { mutateAsync: submitReport } = useSubmitReportMutation();
	// preserve details when changing the report reason.
	const [details, setDetails] = useState('');
	const [error, setError] = useState<string>();
	const [labelerOverride, setLabelerOverride] = useState<AppBskyLabelerDefs.LabelerViewDetailed>();
	const [isPending, setIsPending] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const reason = route.name === 'form' ? route.params.reason : undefined;

	// some reasons and some subjects route exclusively to Bluesky's moderation service
	const isBskyOnly =
		(reason ? BSKY_LABELER_ONLY_REPORT_REASONS.has(reason.reason) : false) ||
		BSKY_LABELER_ONLY_SUBJECT_TYPES.has(subject.type);

	/** Labelers that accept this subject, its collection, and the selected reason. */
	const supportedLabelers = useMemo(() => {
		if (!allLabelers || !reason) {
			return [];
		}
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
				return (
					reasonTypes.includes(reason.reason) || reasonTypes.includes(NEW_TO_OLD_REASONS_MAP[reason.reason]!)
				);
			});
	}, [allLabelers, isBskyOnly, reason, subject]);

	// default to the first supported labeler; honour an explicit override only while it stays supported
	const selectedLabeler = useMemo(() => {
		if (
			labelerOverride &&
			supportedLabelers.some((labeler) => labeler.creator.did === labelerOverride.creator.did)
		) {
			return labelerOverride;
		}
		return supportedLabelers[0];
	}, [labelerOverride, supportedLabelers]);

	const overLimit = details.length > MAX_DETAILS_LENGTH;
	const canSubmit = !!reason && !!selectedLabeler && !overLimit && !isPending && !isSuccess;

	const onSelectReason = (option: ReportOption) => {
		setLabelerOverride(undefined);
		push({ name: 'form', params: { reason: option } });
	};

	const onSelectCategory = (category: ReportCategoryConfig) => {
		// `other` has one reason, so skip the reason picker.
		if (category.key === 'other') {
			onSelectReason(category.options[0]!);
			return;
		}
		push({ name: 'reasons', params: { category } });
	};

	const onSubmit = async () => {
		if (!reason || !selectedLabeler) {
			return;
		}
		setError(undefined);
		try {
			setIsPending(true);
			await submitReport({
				details: trimText(details) || undefined,
				labeler: selectedLabeler,
				reason: reason.reason,
				subject,
			});
			setIsSuccess(true);
			onAfterSubmit?.();
			close();
		} catch (e) {
			console.error('Failed to submit report', e);
			setError(reportErrorMessage(e) ?? m['common.error.generic']());
		}
		setIsPending(false);
	};

	return (
		<>
			<Header navButton={<BackOrCloseButton />} title={copy.title} />

			{route.name === 'categories' && (
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
									onSelect={() => onSelectCategory(category)}
								/>
							))}
						</div>
					</div>
				</Dialog.Body>
			)}

			{route.name === 'reasons' && (
				<Dialog.Body>
					<div className={styles.body}>
						<Text className={styles.prompt} weight="semiBold">
							{route.params.category.title}
						</Text>
						<div className={styles.options}>
							{route.params.category.options.map((option) => (
								<OptionCard key={option.reason} onSelect={() => onSelectReason(option)} option={option} />
							))}
						</div>
					</div>
				</Dialog.Body>
			)}

			{route.name === 'form' && (
				<>
					<Dialog.Body>
						<div className={styles.body}>
							<div className={styles.summary}>
								<Text color="textContrastMedium" size="sm">
									{m['components.moderation.report.reportingFor']()}
								</Text>
								<Text weight="semiBold">{route.params.reason.title}</Text>
							</div>
							{labelersLoading ? (
								<div className={styles.center}>
									<Spinner color="default" label={m['common.status.loading']()} size="xl" />
								</div>
							) : labelersError || !allLabelers ? (
								<>
									<Admonition type="error">{m['components.moderation.service.loadError']()}</Admonition>
									<Button
										color="secondary"
										label={m['components.moderation.service.retry']()}
										onClick={() => void refetch()}
										size="small"
										variant="solid"
									>
										<ButtonText>{m['common.action.retry']()}</ButtonText>
									</Button>
								</>
							) : !selectedLabeler ? (
								<Admonition type="warning">
									{m['components.moderation.report.error.noLabelerSupport']()}
								</Admonition>
							) : (
								<>
									<Recipient
										labeler={selectedLabeler}
										onChange={setLabelerOverride}
										options={supportedLabelers}
									/>
									<Details onChange={setDetails} value={details} />
								</>
							)}
							{error && <Admonition type="error">{error}</Admonition>}
						</div>
					</Dialog.Body>
					<Dialog.Footer>
						<Button
							color="primary"
							className={styles.doneButton}
							disabled={!canSubmit}
							label={m['components.moderation.report.submit']()}
							onClick={() => void onSubmit()}
							size="large"
							variant="solid"
						>
							<ButtonText>
								{isSuccess
									? m['components.moderation.report.sentToast']()
									: m['components.moderation.report.submit']()}
							</ButtonText>
							{isPending ? (
								<ButtonSpinner color="white" label={m['common.status.saving']()} />
							) : (
								<ButtonIcon icon={isSuccess ? CheckIcon : PaperPlaneIcon} />
							)}
						</Button>
					</Dialog.Footer>
				</>
			)}
		</>
	);
}

function Header({ navButton, title }: { navButton: ReactNode; title: string }) {
	return (
		<Dialog.Header.Root border="scrolling">
			{navButton}
			<Dialog.Header.Title>{title}</Dialog.Header.Title>
		</Dialog.Header.Root>
	);
}

function CategoryCard({ category, onSelect }: { category: ReportCategoryConfig; onSelect: () => void }) {
	return (
		<button
			aria-label={m['components.moderation.report.forCategory']({ title: category.title })}
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
	return (
		<button
			aria-label={m['components.moderation.report.forCategory']({ title: option.title })}
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
	const title = profileDisplayName({
		displayName: labeler.creator.displayName,
		handle: labeler.creator.handle,
	});
	return (
		<Text leading="snug">
			<Trans
				inputs={{ title }}
				markup={{ t0: ({ children }) => <Text weight="semiBold">{children}</Text> }}
				message={m['components.moderation.appeal.reportSentTo']}
			/>{' '}
			{options.length > 1 && (
				<Menu.Root>
					<Menu.Trigger
						render={
							<button
								aria-label={m['components.moderation.service.change.a11yLabel']()}
								className={styles.changeLink}
								type="button"
							>
								<Text color="textLink">{m['components.moderation.service.change.label']()}</Text>
							</button>
						}
					/>
					<Menu.Popup align="end" label={m['components.moderation.service.choose']()} minWidth={240}>
						{options.map((option) => {
							const optionTitle = profileDisplayName({
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
											{`@${option.creator.handle}`}
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
	const counterId = useId();
	const length = value.length;
	const overLimit = length > MAX_DETAILS_LENGTH;
	const counterLabel = overLimit
		? m['components.moderation.report.details.charCountOver']({ length, max: MAX_DETAILS_LENGTH })
		: m['components.moderation.report.details.charCount']({ length, max: MAX_DETAILS_LENGTH });
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
				{m['components.moderation.report.details.labelOptional']()}
			</TextField.LabelText>
			<TextField.Input
				describedBy={counterId}
				isInvalid={overLimit}
				label={m['components.moderation.report.details.label']()}
				maxRows={8}
				multiline
				onChangeText={onChange}
				placeholder={m['components.moderation.report.details.placeholder']()}
				value={value}
			/>
			{/* announce only the crossing into over-limit while typing; a stable message avoids per-keystroke spam */}
			<div className={styles.srOnly} role="status">
				{overLimit ? m['components.moderation.report.error.detailsOverLimit']() : ''}
			</div>
		</TextField.Root>
	);
}
