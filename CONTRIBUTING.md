# Contributing

Thanks for helping! Small, focused pull requests are easiest to review.

1. Fork and create a branch from `main`.
2. `pip install -r requirements-dev.txt` and run `pytest` before you push.
3. Frontend code is plain ES modules without a build step. Keep it that way unless discussed first.
4. Add a line to the `[Unreleased]` section of `CHANGELOG.md` and copy the file to `floorplan3d/CHANGELOG.md` (Home Assistant shows that copy in the update dialog; a test checks both are identical).
5. Open the pull request and describe what changed and how you tested it.

## Reporting bugs

Please include the add-on version, your browser, and the browser console output. Attach the layout (`/data/layout.json`) if it is layout related and contains nothing private.

## Code style

- Python: PEP 8, type hints where they help
- JavaScript: 2 spaces, single quotes, no unused code

## AI-assisted development

This project is developed together with an AI assistant (Claude). Contributions are judged on quality, not on who or what wrote them: please make sure anything you submit is tested and that you understand it.

The single-file demo is rebuilt automatically by the *Demo* workflow whenever the app or `demo/` changes on `main` (committed as `demo/floorplan3d-demo.html` and swapped into the latest release), so no manual step is needed; to try it locally run `cd demo && npm run build`.
