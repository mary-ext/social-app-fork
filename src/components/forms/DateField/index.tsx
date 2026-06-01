import { forwardRef, useCallback } from 'react';
import { StyleSheet, type TextInput, type TextInputProps } from 'react-native';
import { unstable_createElement } from 'react-native-web';

import type { DateFieldProps } from '#/components/forms/DateField/types';
import { toSimpleDateString } from '#/components/forms/DateField/utils';
import * as TextField from '#/components/forms/TextField';
import { CalendarDays_Stroke2_Corner0_Rounded as CalendarDays } from '#/components/icons/CalendarDays';

export * as utils from '#/components/forms/DateField/utils';
export const LabelText = TextField.LabelText;

const InputBase = forwardRef<HTMLInputElement, TextInputProps>(({ style, ...props }, ref) => {
	return unstable_createElement('input', {
		...props,
		ref,
		type: 'date',
		style: [
			StyleSheet.flatten(style),
			{
				background: 'transparent',
				border: 0,
			},
		],
	});
});

InputBase.displayName = 'InputBase';

const Input = TextField.createInput(InputBase as unknown as typeof TextInput);
const DateInput = Input as React.ComponentType<
	React.ComponentProps<typeof Input> & {
		max?: string;
	}
>;

export function DateField({
	value,
	inputRef,
	onChangeDate,
	label,
	isInvalid,
	testID,
	accessibilityHint,
	maximumDate,
}: DateFieldProps) {
	const handleOnChange = useCallback(
		(e: Parameters<NonNullable<TextInputProps['onChange']>>[0]) => {
			const target = e.target as unknown as HTMLInputElement;
			const date = target.valueAsDate || target.value;

			if (date) {
				const formatted = toSimpleDateString(date);
				onChangeDate(formatted);
			}
		},
		[onChangeDate],
	);

	return (
		<TextField.Root isInvalid={isInvalid}>
			<TextField.Icon icon={CalendarDays} />
			<DateInput
				value={toSimpleDateString(value)}
				inputRef={inputRef as React.Ref<TextInput>}
				label={label}
				onChange={handleOnChange}
				testID={testID}
				accessibilityHint={accessibilityHint}
				max={maximumDate ? toSimpleDateString(maximumDate) : undefined}
			/>
		</TextField.Root>
	);
}
