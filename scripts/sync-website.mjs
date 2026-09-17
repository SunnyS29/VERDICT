// Build the app and copy that build into the existing portfolio checkout.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const argument=process.argv[2];
if(!argument)throw new Error('Usage: pnpm sync:website /path/to/portfolio');
const website=realpathSync(argument);
if(!existsSync(resolve(website,'index.html')) || !existsSync(resolve(website,'.git')) || website===root)
  throw new Error('Choose the existing portfolio repository, containing index.html and .git.');
execFileSync(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'build'],{cwd:root,stdio:'inherit'});
const destination=resolve(website,'VERDICT');
mkdirSync(destination,{recursive:true});
// Keep previous hashed assets available for visitors whose HTML is still cached.
cpSync(resolve(root,'dist'),destination,{recursive:true});
console.log(`Copied the built app to ${destination}. Review and commit these files in the portfolio repository.`);
