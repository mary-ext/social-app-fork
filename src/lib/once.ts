import { useRef } from 'react';

type Cb = () => void;

export function useCallOnce(cb: Cb): () => void;
export function useCallOnce(cb?: undefined): (cb: Cb) => void;
export function useCallOnce(cb?: Cb) {
	const ran = useRef(false);
	return (icb: Cb) => {
		if (ran.current) {
			return;
		}
		ran.current = true;
		if (icb) {
			icb();
		} else if (cb) {
			cb();
		}
	};
}
