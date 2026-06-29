import { useEffect, useEffectEvent, useRef, useState } from 'react';

export function useThrottledValue<T>(value: T, time: number) {
	const pendingValueRef = useRef(value);
	const [throttledValue, setThrottledValue] = useState(value);

	useEffect(() => {
		pendingValueRef.current = value;
	}, [value]);

	const handleTick = useEffectEvent(() => {
		if (pendingValueRef.current !== throttledValue) {
			setThrottledValue(pendingValueRef.current);
		}
	});

	useEffect(() => {
		const id = setInterval(handleTick, time);
		return () => {
			clearInterval(id);
		};
	}, [time]);

	return throttledValue;
}
