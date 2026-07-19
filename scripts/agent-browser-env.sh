#!/usr/bin/env bash

main_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"

export AGENT_BROWSER_NAMESPACE="social-app-fork"
export AGENT_BROWSER_PROFILE="$main_root/.claude/agent-browser/profile"
export AGENT_BROWSER_SESSION="$(basename "$(git rev-parse --show-toplevel)")"
