import * as css from './index.css';
import { previewHeight } from './metrics';

export function TangledStringPlaceholder({ className }: { className?: string }) {
	return (
		<div className={className}>
			<div className={css.card}>
				<div className={css.header} />
				<div className={css.codeArea} style={{ height: previewHeight }} />
				<div className={css.footer} />
			</div>
		</div>
	);
}
