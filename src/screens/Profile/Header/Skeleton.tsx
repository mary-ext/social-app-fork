import { useConstant } from '#/lib/hooks/use-constant';

import { useBreakpoints } from '#/alf';

import * as Skele from '#/components/web/Skeleton';

import * as css from './Skeleton.css';

export function ProfileHeaderSkeleton(_props: {}): React.ReactNode {
	const { gtMobile } = useBreakpoints();
	// freeze the bio line count for the component's lifetime so the placeholder doesn't reshuffle.
	const bioLines = useConstant(() => Math.floor(Math.random() * 5));

	return (
		<div className={css.frame}>
			<div className={css.banner} />

			<div className={css.avatarAnchor}>
				<div className={css.avatarRing}>
					<Skele.Circle size={90} />
				</div>
			</div>

			<div className={css.body}>
				<div className={css.buttonRow}>
					<div className={css.actionPill} />
				</div>

				<div className={css.nameBlock}>
					<Skele.Text size={gtMobile ? '_4xl' : '_3xl'} width={160} />
					<Skele.Text size="md" width={120} />
				</div>

				<div className={css.section}>
					<div className={css.metricsRow}>
						<Skele.Text size="md" width={75} />
						<Skele.Text size="md" width={75} />
						<Skele.Text size="md" width={75} />
					</div>

					<Skele.Lines count={bioLines} lastWidth={60} size="md" />
				</div>
			</div>
		</div>
	);
}
