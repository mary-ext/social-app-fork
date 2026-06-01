import { device, useStorage } from '#/storage';

export function useHiddenPosts() {
	const [hiddenPosts = []] = useStorage(device, ['hiddenPosts']);

	return hiddenPosts;
}

export function useHiddenPostsApi() {
	const [, setHiddenPosts] = useStorage(device, ['hiddenPosts']);

	return {
		hidePost: ({ uri }: { uri: string }) => {
			setHiddenPosts([...(device.get(['hiddenPosts']) ?? []), uri]);
		},
		unhidePost: ({ uri }: { uri: string }) => {
			setHiddenPosts((device.get(['hiddenPosts']) ?? []).filter((u) => u !== uri));
		},
	};
}
