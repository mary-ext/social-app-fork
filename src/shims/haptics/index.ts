export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Rigid = 'rigid',
  Soft = 'soft',
}

export async function impactAsync(
  _style: ImpactFeedbackStyle = ImpactFeedbackStyle.Light,
): Promise<void> {}
