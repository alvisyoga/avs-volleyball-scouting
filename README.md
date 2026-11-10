# AVS — Alvis Volleyball Scouting

Project scaffold prepared from the supplied `src2222.zip` source archive. The main application source is preserved in `src/main.tsx`.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The production output is generated in `dist/` and can be deployed to static hosting such as Vercel or Netlify.

## Important data note

The current application stores scouting data in browser LocalStorage. Data remains in the browser profile/device where it was entered; it is not automatically synchronized across devices. Deploying the app online does not itself add cloud database synchronization.

## Deployment

Import this project folder/repository into Vercel. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
