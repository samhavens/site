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
2. Update index.html manually for now.
1. Push to branch `gh-pages` if you want the site to live at githubusername.github.io/site, or set the CNAME and DNS settings as appropriate to set to a custom domain.
