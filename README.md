# Wedding Invite – Quick Setup Guide

## 1) Where to place images

Create an `images` folder in project root:

`d:\Repos\Personal\MR\images\`

Place files with these names:

- `images\couple.jpeg` → combined couple photo (used in couple section)

You can rename files, but then update paths in `index.html` inside `window.weddingConfig`.

## 2) Where to place audio (MP3)

Put your music file in project root or a subfolder, for example:

- `d:\Repos\Personal\MR\audio\wedding.mp3`

Then update this key in `index.html`:

- `musicUrl: "audio/wedding.mp3"`

## 3) Where to change content

Open `index.html` and edit the `window.weddingConfig` block (near top of file).

Main fields to update:

- Names:
  - `brideName`
  - `groomName`
- Date and venue:
  - `weddingDateText`
  - `weddingDateISO`
  - `venue`
- Intro text:
  - `welcomeTitle`
  - `welcomeMessage`
- Divine section:
  - `divineBlessingTitle`
  - `divineBlessingMessage`
- Images:
  - `heroImage`
  - `couplePhoto`
- Couple fun line under photo:
  - `coupleFunLine`
- Footer message:
  - `footerPresenceMessage`
- Events:
  - `events: [...]`
- Maps:
  - `mapIframeSrc`
  - `receptionMapIframeSrc`

## 4) Minimal local example values

```js
couplePhoto: "images/couple.jpeg",
coupleFunLine: "Praveen G, the calm tech soul, and Subashri S, the graceful professor spirit — together, a perfect blend of heart and brilliance.",
musicUrl: "audio/wedding.mp3",
```
