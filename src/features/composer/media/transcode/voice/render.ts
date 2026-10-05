import { lobesAt, pulseAt, type PulseSchedule } from './pulse';
import {
	AVATAR_RADIUS,
	DESIGN_HEIGHT,
	DESIGN_WIDTH,
	FONT_SIZE,
	ICON_GAP,
	ICON_SIZE,
	ICON_TOP,
	INK_OPACITY,
	LOBE_OPACITY,
	MARGIN,
	TEXT_BASELINE,
} from './spec';

type Context2D = OffscreenCanvasRenderingContext2D;

export type CardScene = {
	/** avatar artwork, drawn cropped-to-cover inside the circle */
	avatar: ImageBitmap;
	/** CSS background color */
	background: string;
	/** length of the audio, in seconds */
	duration: number;
	/** text in the bottom-right corner */
	label: string;
	/** halo schedule from `createPulseSchedule` */
	pulse: PulseSchedule;
};

/** reusable frame renderer; close when done. */
export type Card = {
	/**
	 * draws one frame onto a 1280x720 canvas.
	 *
	 * @param context destination 2D context
	 * @param time seconds since the start of the clip
	 */
	draw(context: Context2D, time: number): void;
	/** releases rendering resources. */
	close(): void;
};

/** card text font family. */
export const FONT_FAMILY = 'Inter Variable';

const FONT_STACK = `"${FONT_FAMILY}", system-ui, sans-serif`;

const HALO_FILL = `rgba(255, 255, 255, ${LOBE_OPACITY})`;
const INK = `rgba(255, 255, 255, ${INK_OPACITY})`;

const CENTER_X = DESIGN_WIDTH / 2;
const CENTER_Y = DESIGN_HEIGHT / 2;
const AVATAR_SIZE = AVATAR_RADIUS * 2;

// VolumeFull from the central icon set, in its 24-unit viewBox.
const SPEAKER_VIEWBOX = 24;
const SPEAKER_INSET = 2;
const SPEAKER_PATH =
	'M19.071 4.92969C20.8807 6.73933 22 9.23933 22 12.0008C22 14.7622 20.8807 17.2622 19.071 19.0718M15.8891 8.11133C16.8844 9.10663 17.5 10.4816 17.5 12.0004C17.5 13.5192 16.8844 14.8942 15.8891 15.8895M3 8H5.69722C5.89465 8 6.08766 7.94156 6.25192 7.83205L12 4V20L6.25192 16.1679C6.08766 16.0584 5.89465 16 5.69722 16H3C2.44772 16 2 15.5523 2 15V9C2 8.44772 2.44772 8 3 8Z';

const formatDuration = (seconds: number): string => {
	const total = Math.max(0, Math.round(seconds));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const paint = (width: number, height: number, draw: (context: Context2D) => void): ImageBitmap => {
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error(`couldn't acquire a 2D context for rendering`);
	}
	draw(context);
	return canvas.transferToImageBitmap();
};

const drawSpeakerIcon = (context: Context2D, left: number): void => {
	const unit = ICON_SIZE / SPEAKER_VIEWBOX;

	context.save();
	// align the glyph's ink, not its viewBox, with `left`.
	context.translate(left - SPEAKER_INSET * unit, ICON_TOP);
	context.scale(unit, unit);
	context.strokeStyle = INK;
	context.lineWidth = 2;
	context.lineJoin = 'round';
	context.lineCap = 'round';
	context.stroke(new Path2D(SPEAKER_PATH));
	context.restore();
};

// the halo never reaches the overlay, so the background and overlay can share one layer.
const paintBackdrop = ({ background, duration, label }: CardScene): ImageBitmap =>
	paint(DESIGN_WIDTH, DESIGN_HEIGHT, (context) => {
		context.fillStyle = background;
		context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

		context.fillStyle = INK;
		context.textBaseline = 'alphabetic';
		context.textAlign = 'left';

		// compensate for the side bearing to align visible text with the margin.
		context.font = `400 ${FONT_SIZE}px ${FONT_STACK}`;
		const time = formatDuration(duration);
		const timeMetrics = context.measureText(time);
		const timePen = MARGIN + timeMetrics.actualBoundingBoxLeft;
		context.fillText(time, timePen, TEXT_BASELINE);

		const iconLeft = timePen + timeMetrics.width + ICON_GAP;
		drawSpeakerIcon(context, iconLeft);

		context.font = `500 ${FONT_SIZE}px ${FONT_STACK}`;
		const right = DESIGN_WIDTH - MARGIN;
		// squeeze long translations rather than overlapping the icon.
		const available = right - (iconLeft + ICON_SIZE + ICON_GAP);
		const labelWidth = Math.min(context.measureText(label).actualBoundingBoxRight, available);
		context.fillText(label, right - labelWidth, TEXT_BASELINE, available);
	});

const paintAvatar = ({ avatar, background }: CardScene): ImageBitmap =>
	paint(AVATAR_SIZE, AVATAR_SIZE, (context) => {
		context.beginPath();
		context.arc(AVATAR_RADIUS, AVATAR_RADIUS, AVATAR_RADIUS, 0, Math.PI * 2);
		// hide the halo through transparent avatar pixels.
		context.fillStyle = background;
		context.fill();
		context.clip();

		const cover = AVATAR_SIZE / Math.min(avatar.width, avatar.height);
		const width = avatar.width * cover;
		const height = avatar.height * cover;
		context.drawImage(avatar, AVATAR_RADIUS - width / 2, AVATAR_RADIUS - height / 2, width, height);
	});

/**
 * creates a voice clip frame renderer.
 *
 * load the font before calling.
 *
 * @param scene card content; the avatar may be closed after this returns
 * @returns a reusable renderer; close it when done
 * @throws if canvas rendering fails
 */
export const createCard = (scene: CardScene): Card => {
	const { pulse } = scene;
	const backdrop = paintBackdrop(scene);
	const disc = paintAvatar(scene);

	return {
		draw(context, time) {
			context.drawImage(backdrop, 0, 0);

			const reach = pulseAt(time) * AVATAR_RADIUS;
			if (reach > 0) {
				context.fillStyle = HALO_FILL;
				for (const lobe of lobesAt(pulse, time)) {
					context.beginPath();
					context.arc(CENTER_X + lobe.x * reach, CENTER_Y + lobe.y * reach, AVATAR_RADIUS, 0, Math.PI * 2);
					context.fill();
				}
			}

			context.drawImage(disc, CENTER_X - AVATAR_RADIUS, CENTER_Y - AVATAR_RADIUS);
		},
		close() {
			backdrop.close();
			disc.close();
		},
	};
};
