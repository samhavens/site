# Personal Site

## Notes

`resume.html` and the homepage `index.html` are raw HTML/CSS. Edit them by hand.

## Blog

The blog extends the existing site at `/blog/`. Its first essay is published at `/blog/modeling-jewish-ancestry/`, by Sam Havens. It has two sections: historical to present, treating Jewish identity as one group, and projection, distinguishing denominations. Both interactives are visible by default. The historical scenario screen includes a correction for a short final interval; the projection uses its own 2013 survey baseline and retains its original numerical tests.

Canonical prose, model, and widget code live in `content/modeling-jewish-ancestry/`. The catalog is `content/posts.json`; the shared blog design is `content/blog.css`. Read that content directory's `AGENTS.md`, `METHODS.md`, and `MODEL-AUDIT.md` before changing the model. The original recovered bundle remains outside this repository.

```sh
npm ci
npm test
npm run build
npm run serve
```

The build requires Node.js and `uv`. It pins its Markdown renderer through the build script's inline dependency metadata. It computes the article's default table and old/new timing comparison from `historical.js` and writes HTML, Markdown, an offline HTML copy, and a source archive. Do not edit generated files in `blog/` directly. The published page has no framework, analytics, CDN, or external JavaScript dependencies.

With the local server running at `http://127.0.0.1:8765`, run the browser checks:

```sh
npx playwright install chromium firefox webkit
npm run test:browser
npm run test:historical-browser
```

Results, real downloaded exports, and screenshots are written to ignored `artifacts/blog/`. The tests cover real navigation, model controls, sensitivity, saved scenarios, downloads, keyboard scrubbing, mobile layouts, reduced motion, reading without JavaScript, and offline execution. WebKit coverage is not a physical iPhone test. Set `BLOG_TEST_URL` to test another local origin.

The historical interface samples starts from 1877–1927, matches the starting Jewish share, and runs to a visible 2026 endpoint. Readers can change date and generation ranges, existing ancestry and fertility, then inspect retained/rejected scenarios and one accepted trajectory. `historical-reproduction.json` records the two recovered Python experiments. The projection uses the independent 2013 `setup.js` and preserves old saved links. It does not inherit the historical model's endpoint. The parent/child samples remain removed.

Check historical scalar calculations against the recovered Python function with:

```sh
uv run --no-project --with numpy python content/modeling-jewish-ancestry/reference/verify_historical.py
```

GitHub Pages currently serves the repository root from `master`, with the custom domain `www.samuelhavens.com`. `.nojekyll` makes the generated HTML and companion Markdown serve as static files. Sam approved the first publication on September 24, 2026. Keep the homepage free of a blog link until he asks for one; `/blog/` and individual posts remain available directly. Publication metadata lives in `content/posts.json`; rebuild and rerun the checks before deployment. Draft posts receive `noindex` metadata, which is not access control.

## Source

https://app.standardresume.co/resumes/QVEJ4QXFwghVVSMU94E0M/share

## PDF

To make the resume into a PDF:

1. Open the page in FireFox
2. Choose Print to PDF
3. Edit margins and scale until it looks good
