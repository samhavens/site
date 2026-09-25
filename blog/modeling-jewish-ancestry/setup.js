/* Survey-linked starting values. The v4 engine and its reference fixtures stay unchanged. */
(function(root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.AncestrySetup = factory(root.AncestryModel);
})(typeof globalThis !== 'undefined' ? globalThis : this, function(M) {
  'use strict';
  const VERSION = '1.0.0';
  const REFERENCES = [
    'https://www.pewresearch.org/religion/2013/10/01/chapter-1-population-estimates/',
    'https://www.pewresearch.org/religion/2013/10/01/jewish-american-beliefs-attitudes-culture-survey/',
    'https://www.pewresearch.org/religion/2013/10/01/chapter-2-intermarriage-and-other-demographics/',
    'https://www.pewresearch.org/religion/2015/08/26/a-portrait-of-american-orthodox-jews/'
  ];
  function historical() {
    const p = M.defaults();
    p.referenceYear = 2013;
    p.initialJewish = p.initialConnection = .022;
    // 10% Orthodox × 62% Haredi; the other Orthodox category includes the remainder.
    p.jewishMix = [.062, .038, .18, .35, .37];
    // Apply the published Orthodox aggregate to both Orthodox groups; no invented split.
    // Other-Jewish 1.6 is stipulated; general-public 2.2 proxies both non-Jewish groups.
    p.fertility = [4.1, 4.1, 1.8, 1.7, 1.6, 2.2, 2.2];
    // Unaffiliated marriage rate proxies the broader residual category.
    p.intermarriage = [.02, .02, .27, .5, .69];
    // Arrivals mirroring the starting community are an assumption, not survey findings.
    p.arrivalJewish = p.initialJewish;
    p.arrivalMix = p.jewishMix.slice();
    return p;
  }
  function isHistorical(p) {
    const reference = historical();
    return ['referenceYear', 'initialJewish', 'initialConnection', 'jewishMix', 'fertility', 'intermarriage']
      .every(key => JSON.stringify(p[key]) === JSON.stringify(reference[key]));
  }
  return { VERSION, REFERENCES, historical, isHistorical };
});
