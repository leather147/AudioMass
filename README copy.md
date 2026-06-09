# Deploying AudioMass to Vercel

This folder contains configuration files for deploying the open‑source **AudioMass** project (https://github.com/leather147/AudioMass) on Vercel.

## Files

- `vercel.json` – Tells Vercel how to serve your static AudioMass assets.  It instructs Vercel to treat the `src` directory from the original repository as the public root and to route clean URLs (like `/about`) to their corresponding HTML files under `/src`.  The configuration also applies long‑term caching headers to static assets (JS, CSS, images, WASM) for better performance.

## How to deploy

1. **Fork or clone** the AudioMass repository.
2. Copy the `vercel.json` file from this folder into the **root** of your AudioMass repository.
   - The final structure should look like this:
     ```
     AudioMass/
       vercel.json
       src/
         index.html
         about.html
         eq.html
         …
     ```
3. (Optional) Remove `audiomass-server.go` and `audiomass-server.py` if you don't need them on Vercel.  They are only used for local development and are not required for static hosting.
4. Commit the changes and push to GitHub.
5. Go to the [Vercel dashboard](https://vercel.com/new) and import your repository.
   - When prompted for the **project root**, leave it as `/` because `vercel.json` instructs Vercel to use `src` as the public directory.
   - No build command is necessary; Vercel will treat it as a static site.
6. Deploy.  Vercel will serve the application from the `src` directory and handle pretty routes using the rules defined in `vercel.json`.

## Notes

- The AudioMass project is a pure client‑side application; it doesn't require a backend.  The Go and Python servers included in the repo are simple static file servers for local development.  Vercel automatically serves static content for you.
- If you add more top‑level pages (e.g. `src/help.html`) you should update the `routes` section in `vercel.json` accordingly so that clean URLs map to those pages.
- For dynamic API endpoints you can add Vercel functions in the `api/` directory.  See the [Vercel documentation](https://vercel.com/docs/functions/serverless-functions) for details.
