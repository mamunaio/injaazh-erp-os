const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/(auth)/login/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Github import
content = content.replace(/import \{ Mail, Lock, ArrowRight, Eye, EyeOff, Github, Loader2 \} from 'lucide-react';/, "import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';");

// Define Github SVG component
const githubSvg = `
const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3-.3 6-1.5 6-6.76 0-1.5-.5-2.75-1.5-3.75.5-1.25.5-2.75 0-4 0 0-1.25-.5-3.5 1.25a12.5 12.5 0 0 0-7 0C4.25 1.5 3 2 3 2c-.5 1.25-.5 2.75 0 4-1 1-1.5 2.25-1.5 3.75 0 5.25 3 6.45 6 6.75A4.8 4.8 0 0 0 7 19.1V22"/>
  </svg>
);
`;

content = content.replace(/const GoogleIcon = \(\) => \(/, githubSvg + '\nconst GoogleIcon = () => (');

// Replace <Github ... />
content = content.replace(/<Github size=\{18\} className="text-white" \/>/, '<GithubIcon />');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Github icon error');
