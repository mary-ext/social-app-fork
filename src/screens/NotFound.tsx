import { GoHome } from '#/components/GoHome';
import { NotFoundState } from '#/components/NotFoundState';
import * as Layout from '#/components/web/Layout';

export const NotFoundScreen = () => {
	return (
		<Layout.Screen>
			<NotFoundState standalone actions={<GoHome />} />
		</Layout.Screen>
	);
};
