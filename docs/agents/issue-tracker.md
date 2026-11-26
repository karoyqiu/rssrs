# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `karoyqiu/rssrs`.
Use the `gh` CLI from this repository.

## Operations

- Verify the target: `gh repo view --json nameWithOwner`.
- Create: `gh issue create --title "..." --body-file <path>`.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,labels`.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply labels: `gh issue edit <number> --add-label "..."`.
- Remove labels: `gh issue edit <number> --remove-label "..."`.
- Close: post the explanation as a comment, then run `gh issue close <number>`.
  Post the comment separately even when the issue is already closed.

Use UTF-8 files with actual newlines for multiline bodies.
Before the first issue creation in a session, verify the target is
`karoyqiu/rssrs`; stop and resolve any mismatch.

## Relationships

Use GitHub native sub-issues and issue dependencies when available.
Otherwise, put `Part of #<parent>` or `Blocked by: #<number>` at the top
of the child issue body. An issue is unblocked when every blocker is closed.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill conventions

“Publish to the issue tracker” means create a GitHub issue.
“Fetch the relevant ticket” means read the corresponding GitHub issue.
