import { View } from 'react-native';

import { atoms as a } from '#/alf';

import { type Props, useCommonSVGProps } from '#/components/icons/common';
import { Loader_Stroke2_Corner0_Rounded as Icon } from '#/components/icons/Loader';

import { vars } from '#/styles/contract.css';

import * as css from './Loader.css';

export function Loader(props: Props) {
	const common = useCommonSVGProps(props);

	return (
		<View style={[a.relative, a.justify_center, a.align_center, { width: common.size, height: common.size }]}>
			{/* css rotation animation - src/style.css */}
			<div className="rotate-500ms">
				<Icon
					{...props}
					className={css.fill}
					fill={props.fill ?? vars.palette.contrast_900}
					style={props.style}
				/>
			</div>
		</View>
	);
}
