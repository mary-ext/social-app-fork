import { useState } from 'react';

import { Alien_Stroke2_Corner0_Rounded as AlienIcon } from '#/components/icons/Alien';
import { BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon } from '#/components/icons/BubbleInfo';
import { CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon } from '#/components/icons/CircleQuestion';
import { Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon } from '#/components/icons/Envelope';
import { Explosion_Stroke2_Corner0_Rounded as ExplosionIcon } from '#/components/icons/Explosion';
import { Earth_Stroke2_Corner2_Rounded as EarthIcon } from '#/components/icons/Globe';
import { PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon } from '#/components/icons/PaintRoller';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon } from '#/components/icons/RaisingHand';
import { ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon } from '#/components/icons/Shield';
import { Window_Stroke2_Corner2_Rounded as WindowIcon } from '#/components/icons/Window';
import * as SettingsList from '#/components/SettingsList';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import * as styles from './Settings.css';

export function Settings() {
	const [hideBadges, setHideBadges] = useState(false);

	return (
		<div className={styles.wrap}>
			<Text className={styles.heading}>Settings</Text>
			<SettingsList.Container>
				<SettingsList.LinkItem label="Account" to="/settings">
					<SettingsList.ItemIcon icon={PersonIcon} />
					<SettingsList.ItemText>Account</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="Privacy and security" to="/settings">
					<SettingsList.ItemIcon icon={PaintRollerIcon} />
					<SettingsList.ItemText>Privacy and security</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="Moderation" to="/settings">
					<SettingsList.ItemIcon icon={HandIcon} />
					<SettingsList.ItemText>Moderation</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="Content and media" to="/settings">
					<SettingsList.ItemIcon icon={WindowIcon} />
					<SettingsList.ItemText>Content and media</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="Languages" to="/settings">
					<SettingsList.ItemIcon icon={EarthIcon} />
					<SettingsList.ItemText>Languages</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="Help" to="/settings">
					<SettingsList.ItemIcon icon={CircleQuestionIcon} />
					<SettingsList.ItemText>Help</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.LinkItem label="About" to="/settings">
					<SettingsList.ItemIcon icon={BubbleInfoIcon} />
					<SettingsList.ItemText>About</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.Divider />
				<SettingsList.PressableItem
					destructive
					label="Sign out"
					onPress={() => Toast.show('Sign out pressed')}
				>
					<SettingsList.ItemText>Sign out</SettingsList.ItemText>
				</SettingsList.PressableItem>
				<SettingsList.Item>
					<SettingsList.ItemIcon icon={AlienIcon} />
					<SettingsList.ItemText>Not pressable</SettingsList.ItemText>
				</SettingsList.Item>
				<SettingsList.PressableItem label="Pressable" onPress={() => Toast.show('Pressable pressed')}>
					<SettingsList.ItemIcon icon={AlienIcon} />
					<SettingsList.ItemText>Pressable</SettingsList.ItemText>
				</SettingsList.PressableItem>
				<SettingsList.LinkItem destructive label="Destructive link" to="/settings">
					<SettingsList.ItemIcon icon={ExplosionIcon} />
					<SettingsList.ItemText>Destructive link</SettingsList.ItemText>
				</SettingsList.LinkItem>
				<SettingsList.PressableItem label="Email" onPress={() => Toast.show('Email change dialog goes here')}>
					<SettingsList.ItemIcon icon={EnvelopeIcon} />
					<SettingsList.ItemText>Email</SettingsList.ItemText>
					<SettingsList.BadgeText>hello@example.com</SettingsList.BadgeText>
				</SettingsList.PressableItem>
				<SettingsList.CheckboxItem
					label="Hide verification badges"
					onChange={setHideBadges}
					value={hideBadges}
				>
					<SettingsList.ItemIcon icon={ShieldIcon} />
					<SettingsList.ItemText>Checkbox row</SettingsList.ItemText>
					<SettingsList.CheckboxBox />
				</SettingsList.CheckboxItem>
				<SettingsList.Divider />
				<SettingsList.LinkItem label="Long test" to="/settings">
					<SettingsList.ItemIcon icon={ExplosionIcon} />
					<SettingsList.ItemText>
						long long long long long long long long long long long long long long long long long long long
						long long long long long long long long long long long long long long long long long long
					</SettingsList.ItemText>
				</SettingsList.LinkItem>
			</SettingsList.Container>
		</div>
	);
}
