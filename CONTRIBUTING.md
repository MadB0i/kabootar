# Contributing to Kabootar

Thanks for wanting to help! Here's how:

1. Fork and clone the repo.
2. Create a branch: `git checkout -b feature/my-occasion`
3. Add your occasion as **one file** in `src/templates/`. See [`docs/ADD_OCCASION.md`](../docs/ADD_OCCASION.md).
4. Test locally: `npm run dev` → open http://localhost:5173/kabootar/
5. Open a pull request with a clear description.

## Code style
- Keep components small (<200 LOC per file).
- Use Tailwind classes; avoid custom CSS unless necessary.
- No new npm packages without first opening an issue.

## Commit format
Conventional commits preferred: `feat: add eid occasion`, `fix: mobile viewer overflow`.
