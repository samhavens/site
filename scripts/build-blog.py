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
    # The article's example table comes from the same engine as its controls.
    program = 'const M=require(process.argv[1]); const S=require(process.argv[2]); console.log(JSON.stringify(M.simulate(S.historical())))'
    result = json.loads(subprocess.check_output(['node', '-e', program, str(source / 'model.js'), str(source / 'setup.js')], text=True))
    columns = [('illustrativeYear', 'Year'), ('generation', 'Generation'), ('identity', 'Jewish identity'), ('connection', 'Roots + descendants'), ('harediShare', 'Haredi share of Jews'), ('aggregateIntermarriage', 'Intermarriage among Jews')]
    rows = [[str(r[k]) if k in ('generation', 'illustrativeYear') else f'{100*r[k]:.1f}%' for k, _ in columns] for r in result['rows'][:5]]
    md_table = '| ' + ' | '.join(label for _, label in columns) + ' |\n|' + '|'.join('---:' for _ in columns) + '|\n' + '\n'.join('| ' + ' | '.join(row) + ' |' for row in rows)
    table = '<div class="table-scroll static-results" role="region" aria-label="Default model results" tabindex="0"><table><caption>2013 reference inputs; successive generations</caption><thead><tr>' + ''.join(f'<th>{label}</th>' for _, label in columns) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{v}</td>' for v in row) + '</tr>' for row in rows) + '</tbody></table></div>'
    manuscript = (source / 'index.md').read_text()
    if '<!-- DEFAULT-TABLE -->' not in manuscript:
        raise ValueError('The manuscript must retain its computed table marker')
    example = result['rows'][4]
    summary = f"Under the 2013 reference assumptions, generation four ({example['illustrativeYear']}) is {100*example['identity']:.1f}% Jewish-identifying and {100*example['connection']:.1f}% roots + descendants. These are conditional model outputs for that generation."
    article = render_markdown(manuscript.replace('<!-- DEFAULT-SUMMARY -->', summary)).replace('<!-- DEFAULT-TABLE -->', table)
    article = re.sub(r'^<h1>.*?</h1>\s*', '', article, count=1)
    label = 'Draft for review' if draft else date.fromisoformat(post['published']).strftime('%B %-d, %Y')
    body = f'''<main id="main" class="ancestry-essay"><div class="article-header"><p class="post-meta">{escape(post['author'])} · {label} · Interactive essay</p><h1>{escape(post['title'])}</h1><nav class="contents" aria-label="On this page"><a href="#start-in-the-past">Interactive model</a><a href="#why-separate-the-denominations">Why subgroups?</a><a href="#limits">Limits</a><a href="#sources-and-code">Sources + code</a></nav></div>
<noscript><p class="no-js">JavaScript is off. The essay, equations, sources, and default results remain readable; the interactive controls need JavaScript.</p></noscript>
{article}</main><footer class="site-footer">Sam Havens · <a href="/blog/">All posts</a> · Model 4.0.0 · Calculations run in your browser</footer>'''
    script = '<script src="model.js" defer></script><script src="setup.js" defer></script><script src="app.js" defer></script>'
    page = document(post['title'], post['description'], body, f'/blog/{slug}/', draft,
        scripts=script, extra_head='<link rel="stylesheet" href="styles.css">')
    write(dest / 'post.md', manuscript.replace('<!-- DEFAULT-TABLE -->', md_table).replace('<!-- DEFAULT-SUMMARY -->', summary))
    for filename in ['model.js', 'setup.js', 'app.js', 'styles.css', 'METHODS.md', 'SOURCES.md']:
        shutil.copyfile(source / filename, dest / filename)
    write(dest / 'default-results.json', json.dumps(result, indent=2) + '\n')
    portable_body = re.sub(r'<div class="source-links">.*?</div>', '<p class="note">The model and interface code are embedded in this HTML file. The downloadable source archive on the website also contains the tests, methods, and Markdown manuscript.</p>', body)
    portable = document(post['title'], post['description'], portable_body, f'/blog/{slug}/', draft,
        inline_css=CSS + '\n' + (source / 'styles.css').read_text(),
        scripts='<script>' + (source / 'model.js').read_text() + '</script><script>' + (source / 'setup.js').read_text() + '</script><script>' + (source / 'app.js').read_text() + '</script>')
    portable = portable.replace('href="/"', f'href="{ORIGIN}/"').replace('href="/blog/"', f'href="{ORIGIN}/blog/"').replace('href="/resume.html"', f'href="{ORIGIN}/resume.html"')
    # Companion files come with the archive; the standalone HTML itself needs no network.
    write(dest / 'standalone.html', portable)
    archive_files = {name: dest / name for name in ['standalone.html', 'model.js', 'setup.js', 'app.js', 'styles.css', 'post.md', 'METHODS.md', 'SOURCES.md', 'default-results.json']}
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
        archive.writestr(ZipInfo('README.md', (2026, 9, 24, 0, 0, 0)), '# Modeling Jewish Ancestry\n\nOpen standalone.html to read and run the essay offline. Run `node --test tests/*.test.cjs` to check the model. index.md is the editorial source. The site build computes the default-results table from model.js. See METHODS.md and MODEL-AUDIT.md for assumptions. These are conditional cohort scenarios, not population forecasts.\n')
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
