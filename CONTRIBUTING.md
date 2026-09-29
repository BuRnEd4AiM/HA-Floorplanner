# Contributing

Thanks for helping! Small, focused pull requests are easiest to review.

1. Fork and create a branch from `main`.
2. `pip install -r requirements-dev.txt` and run `pytest` before you push.
3. Frontend code is plain ES modules without a build step. Keep it that way unless discussed first.
4. Add a line to the `[Unreleased]` section of `CHANGELOG.md`.
5. Open the pull request and describe what changed and how you tested it.

## Reporting bugs

Please include the add-on version, your browser, and the browser console output. Attach the layout (`/data/layout.json`) if it is layout related and contains nothing private.

## Code style

- Python: PEP 8, type hints where they help
- JavaScript: 2 spaces, single quotes, no unused code
