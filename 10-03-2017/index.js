const cheerio = require('cheerio');
const fs = require('fs');

const resume = fs.readFileSync('./resume.html', 'utf8')

const $ = cheerio.load(resume);

$('.header-pic').replaceWith('');

fs.writeFileSync('./modRes.html', $.html(), 'utf8');
