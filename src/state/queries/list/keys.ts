import type { Did } from '@atcute/lexicons';

import type { MyListsFilter } from '#/state/queries/list/my-lists';

export const RQKEY_ROOT = 'list';
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri];

export const MEMBERS_RQKEY_ROOT = 'list-members';
export const MEMBERS_ALL_RQKEY_ROOT = 'list-members-all';
export const MEMBERS_RQKEY = (uri: string) => [MEMBERS_RQKEY_ROOT, uri];
export const MEMBERS_ALL_RQKEY = (uri: string) => [MEMBERS_ALL_RQKEY_ROOT, uri];

const RQKEY_WITH_MEMBERSHIP_ROOT = 'lists-with-membership';
export const RQKEY_WITH_MEMBERSHIP = (actor?: Did) => [RQKEY_WITH_MEMBERSHIP_ROOT, actor];

export const MY_LISTS_RQKEY_ROOT = 'my-lists';
export const MY_LISTS_RQKEY = (filter: MyListsFilter) => [MY_LISTS_RQKEY_ROOT, filter];
