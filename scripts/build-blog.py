# /// script
# requires-python = ">=3.10"
# dependencies = ["mistune==3.1.3"]
# ///
"""Build the static blog. Prose and model inputs live in content/, not outputs."""
from datetime import date
from html import escape
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

import mistune

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "blog"
ORIGIN = "https://www.samuelhavens.com"
POSTS = json.loads((ROOT / "content/posts.json").read_text())
CSS = (ROOT / "content/blog.css").read_text()


def header():
    return '<a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="name" href="/">Sam Havens</a><nav aria-label="Main navigation"><a href="/blog/">Blog</a><a href="/resume.html">Resume</a></nav></header>'


def document(title, description, body, path, draft, inline_css=None, scripts="", extra_head=""):
    style = f"<style>{inline_css}</style>" if inline_css else '<link rel="stylesheet" href="/blog/blog.css">'
    robots = '<meta name="robots" content="noindex,nofollow">' if draft else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · Sam Havens</title><meta name="description" content="{escape(description, quote=True)}">
<meta name="author" content="Sam Havens">{robots}<link rel="canonical" href="{ORIGIN}{path}">
<meta property="og:type" content="article"><meta property="og:title" content="{escape(title, quote=True)}"><meta property="og:description" content="{escape(description, quote=True)}"><meta property="og:url" content="{ORIGIN}{path}">
{style}{extra_head}</head><body>{header()}{body}{scripts}</body></html>
'''


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def render_markdown(source):
    html = mistune.create_markdown(escape=False, plugins=['table', 'footnotes'])(source)
    # Repeated citations need unique reference IDs; keep the original backlink.
    seen = {}
    def unique(match):
        key = match[1]
        seen[key] = seen.get(key, 0) + 1
        suffix = '' if seen[key] == 1 else f'-{seen[key]}'
        return f'id="{key}{suffix}"'
    html = re.sub(r'id="(fnref-[^"]+)"', unique, html)
    def heading(match):
        text = match[1]
        slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
        return f'<h2 id="{slug}">{text}</h2>'
    return re.sub(r'<h2>(.*?)</h2>', heading, html)


def build_post(post):
    slug = post['slug']
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
        raise ValueError('Invalid post slug')
    if post['status'] not in ('draft', 'published'):
        raise ValueError('Post status must be draft or published')
    draft = post['status'] == 'draft'
    if not draft:
        date.fromisoformat(post['published'])
    source = ROOT / 'content' / slug
    dest = BLOG / slug
    dest.mkdir(parents=True, exist_ok=True)
    # Static prose and downloads use the exact historical engine shown in the UI.
    program = 'const H=require(process.argv[1]); const compact=r=>{delete r.records;return r;}; console.log(JSON.stringify({corrected:compact(H.ensemble(H.defaults())),originalTiming:compact(H.ensemble(H.defaults(),{legacyTiming:true}))}))'
    audit = json.loads(subprocess.check_output(['node', '-e', program, str(source / 'historical.js')], text=True))
    result = audit['corrected']
    p = result['parameters']
    percent = lambda x: f'{100*x:.1f}%'
    q = result['quantiles']
    old_q = audit['originalTiming']['quantiles']
    rows = [
        ['Starting years', '–'.join(map(str, p['startRange']))],
        ['Years per generation', '–'.join(map(str, p['generationRange']))],
        ['Endpoint', str(p['endYear'])],
        ['Scenarios drawn', f"{p['draws']:,}"],
        ['Scenarios retained', f"{result['retained']:,} ({100*result['retained']/p['draws']:.1f}%)"],
        ['Retained median ancestry', percent(q[1])],
        ['Middle 90% of retained ancestry', f'{percent(q[0])}–{percent(q[2])}'],
        ['Random seed', str(p['seed'])],
    ]
    md_table = '| Default historical experiment | Value |\n|---|---:|\n' + '\n'.join('| ' + ' | '.join(row) + ' |' for row in rows)
    table = '<div class="table-scroll static-results" role="region" aria-label="Default historical results" tabindex="0"><table><caption>Corrected historical default; selected scenarios, not a confidence interval</caption><thead><tr><th>Default historical experiment</th><th>Value</th></tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{v}</td>' for v in row) + '</tr>' for row in rows) + '</tbody></table></div>'
    manuscript = (source / 'index.md').read_text()
    if '<!-- DEFAULT-TABLE -->' not in manuscript:
        raise ValueError('The manuscript must retain its computed table marker')
    summary = f"With {p['draws']:,} draws ending in {p['endYear']}, the corrected default gives a retained median of **{percent(q[1])}**, with a middle 90% range of **{percent(q[0])}–{percent(q[2])}**. Applying the old timing rule to the same input draws gives **{percent(old_q[1])}**, with a range of **{percent(old_q[0])}–{percent(old_q[2])}**. Each version applies its own feasibility screen. These are sensitivity results under the stated assumptions, not population confidence intervals."
    article = render_markdown(manuscript.replace('<!-- DEFAULT-SUMMARY -->', summary)).replace('<!-- DEFAULT-TABLE -->', table)
    article = re.sub(r'^<h1>.*?</h1>\s*', '', article, count=1)
    label = 'Draft for review' if draft else date.fromisoformat(post['published']).strftime('%B %-d, %Y')
    body = f'''<main id="main" class="ancestry-essay"><div class="article-header"><p class="post-meta">{escape(post['author'])} · {label} · Updated September 25, 2026</p><h1>{escape(post['title'])}</h1><nav class="contents" aria-label="On this page"><a href="#start-in-the-past-finish-in-the-present">Interactive model</a><a href="#which-scenarios-survived">The screen</a><a href="#what-the-model-leaves-uncertain">Limits</a><a href="#sources-and-code">Sources + code</a></nav></div>
<noscript><p class="no-js">JavaScript is off. The essay, equations, sources, and default results remain readable; the interactive controls need JavaScript.</p></noscript>
{article}</main><footer class="site-footer">Sam Havens · <a href="/blog/">All posts</a> · Historical model 1.0.0 · Calculations run in your browser</footer>'''
    runtime = ['historical.js', 'historical-app.js', 'model.js', 'setup.js', 'app.js']
    script = ''.join(f'<script src="{name}?v={hashlib.sha256((source / name).read_bytes()).hexdigest()[:12]}" defer></script>' for name in runtime)
    style_version = hashlib.sha256((source / 'styles.css').read_bytes()).hexdigest()[:12]
    page = document(post['title'], post['description'], body, f'/blog/{slug}/', draft,
        scripts=script, extra_head=f'<link rel="stylesheet" href="styles.css?v={style_version}">')
    write(dest / 'post.md', manuscript.replace('<!-- DEFAULT-TABLE -->', md_table).replace('<!-- DEFAULT-SUMMARY -->', summary))
    for filename in runtime + ['styles.css', 'METHODS.md', 'SOURCES.md', 'historical-reproduction.json']:
        shutil.copyfile(source / filename, dest / filename)
    write(dest / 'default-results.json', json.dumps(audit, indent=2) + '\n')
    portable_body = re.sub(r'<div class="source-links">.*?</div>', '<p class="note">The model and interface code are embedded in this HTML file. The downloadable source archive on the website also contains the tests, methods, and Markdown manuscript.</p>', body)
    portable = document(post['title'], post['description'], portable_body, f'/blog/{slug}/', draft,
        inline_css=CSS + '\n' + (source / 'styles.css').read_text(),
        scripts=''.join('<script>' + (source / name).read_text() + '</script>' for name in runtime))
    portable = portable.replace('href="/"', f'href="{ORIGIN}/"').replace('href="/blog/"', f'href="{ORIGIN}/blog/"').replace('href="/resume.html"', f'href="{ORIGIN}/resume.html"')
    # Companion files come with the archive; the standalone HTML itself needs no network.
    write(dest / 'standalone.html', portable)
    archive_files = {name: dest / name for name in runtime + ['standalone.html', 'styles.css', 'post.md', 'METHODS.md', 'SOURCES.md', 'default-results.json', 'historical-reproduction.json']}
    for pattern in ['tests/*.cjs', 'fixtures/*.json', 'reference/*.py']:
        archive_files.update({str(p.relative_to(source)): p for p in source.glob(pattern)})
    archive_files['index.md'] = source / 'index.md'
    archive_files['MODEL-AUDIT.md'] = source / 'MODEL-AUDIT.md'
    archive_files['blog.css'] = BLOG / 'blog.css'
    with ZipFile(dest / 'source.zip', 'w', ZIP_DEFLATED) as archive:
        for name, path in sorted(archive_files.items()):
            info = ZipInfo(name, (2026, 9, 24, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
        archive.writestr(ZipInfo('README.md', (2026, 9, 24, 0, 0, 0)), '# Modeling Jewish Ancestry\n\nOpen standalone.html to read and run the essay offline. Run `node --test tests/*.test.cjs` to check both models. index.md is the editorial source. historical.js runs the corrected historical screen; model.js is the separate subgroup extension. The recovered original historical Python scripts are unchanged in reference/. Reproduction commands and results are in METHODS.md and historical-reproduction.json. These are selected sensitivity scenarios, not population confidence intervals.\n')
    archive_version = hashlib.sha256((dest / 'source.zip').read_bytes()).hexdigest()[:12]
    write(dest / 'index.html', page.replace('href="source.zip"', f'href="source.zip?v={archive_version}"'))
    return label


def main():
    write(BLOG / 'blog.css', CSS)
    entries = []
    for post in POSTS:
        label = build_post(post)
        entries.append(f'<li><div class="post-meta">{label} · Interactive essay</div><h2><a href="{post["slug"]}/">{escape(post["title"])}</a></h2><p>{escape(post["description"])}</p></li>')
    body = '<main id="main" class="blog-index"><h1>Blog</h1><p class="muted">Essays and interactive models.</p><ul class="post-list">' + ''.join(entries) + '</ul></main><footer class="site-footer"><a href="/">Sam Havens</a></footer>'
    write(BLOG / 'index.html', document('Blog', 'Essays and interactive models by Sam Havens.', body, '/blog/', all(p['status'] == 'draft' for p in POSTS)))
    print(f'Built /blog/ and {len(POSTS)} interactive essay; publication metadata applied.')


if __name__ == '__main__':
    main()
