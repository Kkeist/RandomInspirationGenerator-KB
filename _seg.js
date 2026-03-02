const fs = require('fs');
const s = fs.readFileSync('app.js', 'utf8');
const start = s.indexOf('const emojis = [');
const end = s.indexOf('];', start) + 2;
let inner = s.slice(s.indexOf('[', start) + 1, s.lastIndexOf(']', end));
const blocks = inner.split(/\n\s*\n/).filter(b => b.trim());
let cum = 0;
const bounds = [];
const labels = [];
for (const block of blocks) {
  const matches = block.match(/'[^']*'/g) || [];
  const n = matches.length;
  if (n > 0) {
    cum += n;
    bounds.push(cum);
  }
}
console.log(JSON.stringify(bounds));
console.log('total', cum);
