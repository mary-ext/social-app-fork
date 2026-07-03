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

/**
 * A pie chart: a bordered circle filled by a sector that grows clockwise from the top as `progress` goes 0 →
 * 1.
 */
export function ProgressPie({
	borderColor,
	borderWidth,
	color,
	progress,
	size,
}: {
	borderColor: string;
	borderWidth: number;
	color: string;
	progress: number;
	size: number;
}) {
	const center = size / 2;
	const radius = center - borderWidth;
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
			<path d={sectorPath(center, radius, clamp(progress))} fill={color} />
			<circle
				cx={center}
				cy={center}
				r={center - borderWidth / 2}
				fill="none"
				stroke={borderColor}
				strokeWidth={borderWidth}
			/>
		</svg>
	);
}

const sectorPath = (center: number, radius: number, progress: number) => {
	const top = center - radius;
	if (progress >= 1) {
		return `M ${center} ${top} A ${radius} ${radius} 0 1 1 ${center - 0.001} ${top} Z`;
	}
	const angle = progress * TAU;
	const endX = center + radius * Math.sin(angle);
	const endY = center - radius * Math.cos(angle);
	const largeArc = angle > Math.PI ? 1 : 0;
	return `M ${center} ${center} L ${center} ${top} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
};
