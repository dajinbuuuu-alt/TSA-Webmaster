# TSA-Webmaster

Hey! So if you are seeing this... A bit of background information,
 this is the repository for a website on learning about ai. This is for a competition
 Please don't do anything bad yo. DO NOT TOUCH THE PREVIEW FILE

## Run it

Needs Node.js 20.19+ or 22.12+ (built and tested on 24). No env vars, no accounts, no database.

```bash
npm install
npm run dev
```

Open http://localhost:3000

Builds:

```bash
npm run build          # production build into dist/
npm run preview        # serves dist/ and prints its localhost URL

npm run build:preview  # regenerates ./Preview from the current build
```

`Preview` is the whole site in one file: CSS, JS and fonts inlined, generated from the Vite build so it always matches the app. Copy it to `Preview.html` if you want to open it by double-clicking.

Progress is saved in the browser with localStorage, so guest mode stays on the machine you use.
