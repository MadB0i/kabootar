# 🕊️ Kabootar

**A zero-backend greeting-link generator.** Create beautiful animated greeting cards for any occasion — Sorry, Birthday, Romantic, Bihu, Diwali, Eid, and more — and share them as a single link. No account, no server, no tracking. Everything lives inside the URL.

## Why this is different

- **Zero backend.** Your message never touches a server — it's encoded directly in the link hash.
- **Encrypted secret questions.** Optionally protect your message with a PBKDF2 + AES-GCM lock that only the right answer can open.
- **Interactive scenes.** A runaway "Nahi" button on Sorry cards, blow-out candles via your phone's microphone on Birthday cards, twinkling star-field forming names on Romantic cards.
- **India-first occasions.** Bihu (with Assamese messages), Diwali, Eid, Rakhi, Karwa Chauth out of the box.
- **Fully offline-capable.** PWA-ready once hosted; works from a file:// link too.

## Live demo

https://madb0i.github.io/kabootar/

*(Screenshot placeholder — add GIFs in PR)*

![Demo GIF](docs/demo.gif)

## Features

| Feature | Details |
|---|---|
| Occasions | Sorry, Romantic, Birthday, New Year, Anniversary, Custom + Bihu, Diwali, Eid, Rakhi, Karwa Chauth |
| Themes | Per-occasion gradient color pickers |
| Animations | Floating particles, confetti, fireworks, petals, stars — toggle off for reduced-motion |
| Time locks | Soft unlock-at date/time countdown |
| Secret questions | Web Crypto AES-GCM encrypted payload behind a question |
| Music | Optional background audio toggle (never autoplay) |
| Mobile & desktop | Responsive layouts — swipe cards on mobile, scroll scenes on desktop |
| Reply via WhatsApp | One-tap reply link built into every viewer |

## Tech stack

- **Vite 8** + **React 19** + **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Framer Motion** (card transitions on mobile, fade-up reveals on desktop)
- **Web Crypto API** (PBKDF2 + AES-GCM, no library needed)
- **Hash-based routing** (`#/`, `#/v/<data>`, no router library)
- **GitHub Pages** deployment via Actions

## Add your own occasion

See [`docs/ADD_OCCASION.md`](docs/ADD_OCCASION.md). Just drop one JS file into `src/templates/`.

## Privacy

Your message exists **only inside the URL**. Nothing is sent to any server. The optional secret-question encryption runs entirely in the browser using the Web Crypto API. We do not collect analytics or set cookies.

## License

[MIT](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Pull requests welcome!
