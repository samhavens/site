# Personal Site

### Dependencies
- Node/npm
- `resume-cli` npm package, *installed globally*
- [wkhtmltopdf](http://wkhtmltopdf.org/). Available for Linux, OSX and Windows.

### Helpful Links
[LinkedIn to JSON resume](https://jmperezperez.com/linkedin-to-json-resume/)
[JSON Resume](https://jsonresume.org/)

### Dev Process
1. Change `resume.json` as appropriate
1. Pick a [theme](https://jsonresume.org/themes/) and set it in `resume settings`
1. Run `npm run build` to generate HTML and PDF (seriously, you need wkhtmltopdf for that to work)
2. Update index.html manually for now (note: I copy and paste the CSS that is generated in resume.html, as should you. I mean, not _should_, what we should do is fork the JSON to HTML compiler from `resume-cli` and have it export the index.html as well, but that is a lot of work. Which, if you feel like doing, great, but I don't.)
1. GO to the GitHub project settings and make the `master` branch publish to GitHub Pages if you want the site to live at githubusername.github.io/site . Or set the CNAME and DNS settings as appropriate to set to a custom domain.
