#!/usr/bin/env bash

main_root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
toplevel="$(git rev-parse --show-toplevel)"
session="$(git symbolic-ref --short -q HEAD)"

# on a detached HEAD there is no branch to name the session after, so fall back to the worktree path
if [ -z "$session" ]; then
	session="$toplevel"

	# zed nests its worktrees as <root>/worktrees/<repo>/<name>/<repo>, where the full path makes for
	# a poor session name -- use <name> whenever the layout matches
	repo="${toplevel##*/}"
	parent="${toplevel%/*}"

	case "${parent%/*}" in
		*/worktrees/"$repo") session="worktree-${parent##*/}" ;;
	esac
fi

session="${session//[![:alnum:]._-]/__}"

export AGENT_BROWSER_NAMESPACE="social-app-fork"
export AGENT_BROWSER_SESSION="$session"
