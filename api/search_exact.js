import fs from 'fs';
import path from 'path';

function searchDir(dir){
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f === 'node_modules' || f === '.git' || f === 'dist') return;
    if (fs.statSync(p).isDirectory()) {
      searchDir(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.html') || p.endsWith('.json')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('default: BK11') || content.includes('Access Neon') || content.includes('Founder Access')) {
        console.log('FOUND IN:', p);
        content.split('\n').forEach((line, idx) => {
          if (line.includes('default: BK11') || line.includes('Access Neon') || line.includes('Founder Access') || line.includes('FOUNDER ACCESS')) {
            console.log((idx + 1) + ': ' + line);
          }
        });
      }
    }
  });
}

searchDir('C:\\Users\\Dell\\Downloads\\paymint-vercel');
