import type { AppBskyActorDefs, AppBskyFeedDefs, AppBskyGraphDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { $type, Did, Nsid, ResourceUri } from '@atcute/lexicons';

export type ReportSubjectConvoMessage = {
	view: 'convo' | 'message';
	convoId: string;
	message: ChatBskyConvoDefs.MessageView;
};

export type ReportSubjectConvo = {
	convoId: string;
	did: Did;
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
			uri: ResourceUri;
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
			uri: ResourceUri;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'list';
			uri: ResourceUri;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'feed';
			uri: ResourceUri;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'starterPack';
			uri: ResourceUri;
			cid: string;
			nsid: Nsid;
	  }
	| {
			type: 'account';
			did: Did;
			nsid: Nsid;
	  }
	| ({
			type: 'convoMessage';
	  } & ReportSubjectConvoMessage)
	| ({
			type: 'convo';
	  } & ReportSubjectConvo);
