import fs from 'fs';
import path from 'path';

const results = [];

function searchDir(dir){
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      searchDir(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.html') || p.endsWith('.css')) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const l = line.toLowerCase();
        if (l.includes('bk11') || l.includes('founder') || l.includes('neon') || l.includes('enter password')) {
          results.push(`${p}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('C:\\Users\\Dell\\Downloads\\paymint-vercel');
fs.writeFileSync('C:\\Users\\Dell\\Downloads\\paymint-vercel\\pb\\api\\all_matches.txt', results.join('\n'), 'utf8');
console.log('Found matches:', results.length);
