import fs from 'fs';

function replaceInFiles(dir: string) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = dir + '/' + item.name;
    if (item.isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let text = fs.readFileSync(fullPath, 'utf8');
      
      text = text.replace(/bg-\[#f2f2f7\]/g, 'bg-[var(--bg-app)]');
      text = text.replace(/divide-\[#f2f2f7\]/g, 'divide-[var(--bg-app)]');
      text = text.replace(/bg-white/g, 'bg-[var(--th-white)]');
      
      fs.writeFileSync(fullPath, text);
    }
  }
}

replaceInFiles('./src');
console.log('Refactoring complete');
