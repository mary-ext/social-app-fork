import type { ComponentType, SVGProps } from 'react';

import BigCartel from '#/icons/brands/BigCartel.svg';
import Boosty from '#/icons/brands/Boosty.svg';
import BuyMeACoffee from '#/icons/brands/BuyMeACoffee.svg';
import CashApp from '#/icons/brands/CashApp.svg';
import Chuffed from '#/icons/brands/Chuffed.svg';
import Crowdfundr from '#/icons/brands/Crowdfundr.svg';
import Donorbox from '#/icons/brands/Donorbox.svg';
import Etsy from '#/icons/brands/Etsy.svg';
import Fourthwall from '#/icons/brands/Fourthwall.svg';
import Givebutter from '#/icons/brands/Givebutter.svg';
import GoFundMe from '#/icons/brands/GoFundMe.svg';
import Gumroad from '#/icons/brands/Gumroad.svg';
import Indiegogo from '#/icons/brands/Indiegogo.svg';
import Inprint from '#/icons/brands/Inprint.svg';
import ItchIo from '#/icons/brands/ItchIo.svg';
import JustGiving from '#/icons/brands/JustGiving.svg';
import Kickstarter from '#/icons/brands/Kickstarter.svg';
import KoFi from '#/icons/brands/KoFi.svg';
import Liberapay from '#/icons/brands/Liberapay.svg';
import OpenCollective from '#/icons/brands/OpenCollective.svg';
import Patreon from '#/icons/brands/Patreon.svg';
import PayPal from '#/icons/brands/PayPal.svg';
import Redbubble from '#/icons/brands/Redbubble.svg';
import Stripe from '#/icons/brands/Stripe.svg';
import Substack from '#/icons/brands/Substack.svg';
import Throne from '#/icons/brands/Throne.svg';
import Venmo from '#/icons/brands/Venmo.svg';
import Vgen from '#/icons/brands/Vgen.svg';
import Zeffy from '#/icons/brands/Zeffy.svg';
import GlobeIcon from '#/icons/central/Globe_round_outlined_radius1_stroke2.svg';

import type { SupportProvider, SupportProviderLogoName } from '../providers';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const SUPPORT_PROVIDER_LOGOS: Record<SupportProviderLogoName, IconComponent> = {
	BigCartel,
	Boosty,
	BuyMeACoffee,
	CashApp,
	Chuffed,
	Crowdfundr,
	Donorbox,
	Etsy,
	Fourthwall,
	Givebutter,
	GoFundMe,
	Gumroad,
	Indiegogo,
	Inprint,
	ItchIo,
	JustGiving,
	Kickstarter,
	KoFi,
	Liberapay,
	OpenCollective,
	Patreon,
	PayPal,
	Redbubble,
	Stripe,
	Substack,
	Throne,
	Venmo,
	Vgen,
	Zeffy,
};

/**
 * @param provider the link's support provider, if any
 * @returns the provider's logo component, or a globe if no provider matches
 */
export const linkIcon = (provider: SupportProvider | undefined): IconComponent => {
	return provider ? SUPPORT_PROVIDER_LOGOS[provider.logo] : GlobeIcon;
};
