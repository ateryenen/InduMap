const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'app', 'page.tsx');
const s = fs.readFileSync(p,'utf8');
let brace=0;let paren=0;let bracket=0;
const lines = s.split(/\r?\n/);
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(let j=0;j<line.length;j++){
    const ch=line[j];
    if(ch==='{') brace++;
    if(ch==='}') brace--;
    if(ch==='(') paren++;
    if(ch===')') paren--;
    if(ch==='[') bracket++;
    if(ch===']') bracket--;
    if(brace<0 || paren<0 || bracket<0){
      console.log('Unbalanced at', i+1, 'char', j+1, 'line:', line);
      process.exit(1);
    }
  }
  if (i % 50 === 0) console.log('line', i+1, 'brace=', brace);
}
console.log('Totals -> { }:', brace, ' (paren):', paren, ' [ ]:', bracket);
if(brace!==0 || paren!==0 || bracket!==0) process.exit(2);
console.log('All balanced.');
