# Contributing

Thanks for wanting to add something! This repo collects iOS automations of two
kinds, and each has its own layout.

## Repo layout

Every project is a folder containing a `README.md`:

```
shortcuts/<project-slug>/README.md      # Shortcuts app automations
scriptable/<project-slug>/README.md     # Scriptable widgets & scripts
scriptable/<project-slug>/<script>.js   # ...plus the source
<category>/<project-slug>/preview.jpg   # optional screenshot (.png or .jpg)
```

Use lowercase-kebab-case for folder names (`cellular-data-usage-monitor`).

Screenshots live in the project folder and are named `preview` (`.png`
preferred, `.jpg` fine), embedded near the top of the project's README.

## Adding a Shortcut

1. **Fork** the repo and create a branch.
2. Create `shortcuts/<your-slug>/README.md`. Copy the structure of an existing
   one — [Cellular Data Usage Monitor](shortcuts/cellular-data-usage-monitor/README.md)
   is a good template. Cover:
   - A **Download** link to the shortcut on iCloud
   - **Setup** — what the user must do after installing
   - **Compatibility** — the device and iOS version you actually tested on
   - **Usage** — what it's for and how to trigger it
   - **How It Works** — a step-by-step walkthrough
3. Make sure your iCloud share link is public and actually installs.
4. Add a row to the index table in the root [README.md](README.md).
5. Open a Pull Request.

## Adding a Scriptable script

Same as above, under `scriptable/`, with these differences:

- Commit the `.js` source alongside the README. It should be the real script,
  runnable as-is after any documented configuration.
- Document any **API keys, endpoints, or config** the user must fill in, and
  keep secrets out of the committed source — use a clearly marked placeholder
  constant at the top of the file.
- Note whether it's a **widget**, an in-app script, or both, and which widget
  sizes it supports.

## Guidelines

- One project per pull request.
- Only document compatibility you've personally tested — don't guess at
  device or iOS version support.
- Don't commit credentials, API keys, personal locations, or account
  identifiers. Scrub screenshots too.
- Keep documentation in your own words.

## Questions

Open an issue — happy to help you get a contribution over the line.
