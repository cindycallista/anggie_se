# Week 7 / StudySlot

[Open the live demo](https://anggie0707.github.io/_se/hw7/)

StudySlot is a small study-room booking board. The browser page works on GitHub Pages, while the Node.js server exposes the same booking flow through a JSON API.

The required test layers are kept separate:

- `tests/unit`: validation, time calculation, and collision rules
- `tests/system`: HTTP health, create, list, and conflict responses
- `tests/e2e`: the booking flow in headless Playwright

```bash
npm install
npx playwright install chromium
npm run test:all
```
