/** stands in for `BroadcastChannel` where the browser has none; every method is inert. */
class BroadcastChannelStub {
	constructor(public name: string) {}
	postMessage(_data: unknown) {}
	close() {}
	onmessage: (event: MessageEvent) => void = () => {};
	addEventListener(_type: string, _listener: (event: MessageEvent) => void) {}
	removeEventListener(_type: string, _listener: (event: MessageEvent) => void) {}
}

export default 'BroadcastChannel' in window ? window.BroadcastChannel : BroadcastChannelStub;
