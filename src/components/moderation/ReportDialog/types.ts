import { type AppBskyActorDefs, type AppBskyFeedDefs, type AppBskyGraphDefs } from '@atcute/bluesky';
import { type ChatBskyConvoDefs } from '@atcute/bluesky';
import { type $type } from '@atcute/lexicons';

import type * as Dialog from '#/components/Dialog';

export type ReportSubjectConvo = {
	view: 'convo' | 'message';
	convoId: string;
	message: ChatBskyConvoDefs.MessageView;
};

export type ReportSubject =
	| $type.enforce<AppBskyActorDefs.ProfileViewBasic>
	| $type.enforce<AppBskyActorDefs.ProfileView>
	| $type.enforce<AppBskyActorDefs.ProfileViewDetailed>
	| $type.enforce<AppBskyActorDefs.StatusView>
	| $type.enforce<AppBskyGraphDefs.ListView>
	| $type.enforce<AppBskyFeedDefs.GeneratorView>
	| $type.enforce<AppBskyGraphDefs.StarterPackView>
	| $type.enforce<AppBskyFeedDefs.PostView>
	| ReportSubjectConvo;

export type ParsedReportSubject =
	| {
			type: 'post';
			uri: string;
			cid: string;
			nsid: string;
			attributes: {
				reply: boolean;
				image: boolean;
				video: boolean;
				link: boolean;
				quote: boolean;
			};
	  }
	| {
			type: 'status';
			uri: string;
			cid: string;
			nsid: string;
	  }
	| {
			type: 'list';
			uri: string;
			cid: string;
			nsid: string;
	  }
	| {
			type: 'feed';
			uri: string;
			cid: string;
			nsid: string;
	  }
	| {
			type: 'starterPack';
			uri: string;
			cid: string;
			nsid: string;
	  }
	| {
			type: 'account';
			did: string;
			nsid: string;
	  }
	| ({
			type: 'convoMessage';
	  } & ReportSubjectConvo);

export type ReportDialogProps = {
	control: Dialog.DialogOuterProps['control'];
	subject: ParsedReportSubject;
	/** Called if the report was successfully submitted. */
	onAfterSubmit?: () => void;
};
