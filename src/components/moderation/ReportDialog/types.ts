import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { $type, Nsid } from '@atcute/lexicons';

export type ReportSubjectConvoMessage = {
	view: 'convo' | 'message';
	convoId: string;
	message: ChatBskyConvoDefs.MessageView;
};

export type ReportSubjectConvo = {
	convoId: string;
	did: string;
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
	| ReportSubjectConvoMessage
	| ReportSubjectConvo;

export type ParsedReportSubject =
	| {
			type: 'post';
			uri: string;
			cid: string;
			nsid: Nsid;
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
			nsid: Nsid;
	  }
	| {
			type: 'list';
			uri: string;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'feed';
			uri: string;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'starterPack';
			uri: string;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'account';
			did: string;
			nsid: Nsid;
	  }
	| ({
			type: 'convoMessage';
	  } & ReportSubjectConvoMessage)
	| ({
			type: 'convo';
	  } & ReportSubjectConvo);
