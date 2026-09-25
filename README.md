# Personal Site

## Notes

`resume.html` and the homepage `index.html` are raw HTML/CSS. Edit them by hand.

## Blog

The blog extends the existing site at `/blog/`. Its first essay is published at `/blog/modeling-jewish-ancestry/`, by Sam Havens. The engine and its numerical reference tests were recovered from the latest revised ancestry essay, without numerical changes.

Canonical prose, model, and widget code live in `content/modeling-jewish-ancestry/`. The catalog is `content/posts.json`; the shared blog design is `content/blog.css`. Read that content directory's `AGENTS.md`, `METHODS.md`, and `MODEL-AUDIT.md` before changing the model. The original recovered bundle remains outside this repository.

```sh
npm ci
npm test
npm run build
npm run serve
```

The build requires Node.js and `uv`. It pins its Markdown renderer through the build script's inline dependency metadata. It computes the article's example table and numerical example from the JavaScript engine with the 2013 setup in `setup.js` and writes HTML, Markdown, an offline HTML copy, and a source archive. Do not edit generated files in `blog/` directly. The published page has no framework, analytics, CDN, or external JavaScript dependencies.

With the local server running at `http://127.0.0.1:8765`, run the browser checks:

```sh
npx playwright install chromium firefox webkit
npm run test:browser
```

Results, real downloaded exports, and screenshots are written to ignored `artifacts/blog/`. The tests cover real navigation, model controls, sensitivity, saved scenarios, downloads, keyboard scrubbing, mobile layouts, reduced motion, reading without JavaScript, and offline execution. WebKit coverage is not a physical iPhone test. Set `BLOG_TEST_URL` to test another local origin.

The interface begins at generation zero in 2013. Starting population, existing outside ancestry, denomination mix and fertility are visible together. `setup.js` supplies the survey-linked reference; editing the date alone does not load historical demography. The parent/child samples were removed; the timeline and optional random-pairing animation remain.

GitHub Pages currently serves the repository root from `master`, with the custom domain `www.samuelhavens.com`. `.nojekyll` makes the generated HTML and companion Markdown serve as static files. Sam approved the first publication on September 24, 2026. Keep the homepage free of a blog link until he asks for one; `/blog/` and individual posts remain available directly. Publication metadata lives in `content/posts.json`; rebuild and rerun the checks before deployment. Draft posts receive `noindex` metadata, which is not access control.

## Source

https://app.standardresume.co/resumes/QVEJ4QXFwghVVSMU94E0M/share

## PDF

To make the resume into a PDF:

1. Open the page in FireFox
2. Choose Print to PDF
3. Edit margins and scale until it looks good
