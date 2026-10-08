import * as css from './TangledStringEmbed.css';

export function TangledStringPlaceholder({ className }: { className?: string }) {
	return (
		<div className={className}>
			<div className={css.card}>
				<div className={css.header} />
				<div className={css.codeArea} />
				<div className={css.footer} />
			</div>
		</div>
	);
}
