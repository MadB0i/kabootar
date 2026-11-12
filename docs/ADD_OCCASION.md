# Adding a New Occasion

Each occasion is **one file** in `src/templates/`. The index auto-registers it via `import.meta.glob`.

**Required export:**
```js
export default {
  id: 'unique-id',
  label: 'Display Name',
  emoji: '🎉',
  themes: [{ name: 'Sunset', from: '#f093fb', to: '#f5576c', text: '#fff' }],
  defaultMessages: ['Hello {to}!', 'Love you {from}.'],
  scene: 'default',   // maps to src/components/scenes/<SceneName>.jsx capitalised
}
```

**For regional occasions** (bihu etc.) also add an Assamese/Hindi fallback block with the same shape.

That's it — no other files need changes.
