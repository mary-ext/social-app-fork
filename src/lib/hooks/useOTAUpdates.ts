export function useOTAUpdates() {}
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: (_channel?: string) => {},
    revertToEmbedded: () => {},
    isCurrentlyRunningPullRequestDeployment: false,
    currentChannel: 'web-build',
    pending: false,
  }
}
