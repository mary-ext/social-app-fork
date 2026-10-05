const TAU = Math.PI * 2;
const THICKNESS = 3;

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * circular progress ring: a full-circle track with an arc of the same thickness sweeping clockwise over it
 * from the top as `progress` goes 0 → 1.
 */
export function ProgressCircle({
	color,
	progress,
	size,
	trackColor,
}: {
	color: string;
	progress: number;
	size: number;
	trackColor: string;
}) {
	const center = size / 2;
	const radius = center - THICKNESS / 2;
	const circumference = TAU * radius;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={THICKNESS} />
			<circle
				cx={center}
				cy={center}
				r={radius}
				fill="none"
				stroke={color}
				strokeWidth={THICKNESS}
				strokeDasharray={circumference}
				strokeDashoffset={circumference * (1 - clamp(progress))}
				transform={`rotate(-90 ${center} ${center})`}
			/>
		</svg>
	);
}
