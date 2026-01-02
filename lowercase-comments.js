const fs = require('fs');
const path = require('path');

// Convert uppercase letters to lowercase, but only if NOT preceded by another letter
// This preserves camelCase like "lastSynced" but converts "HELLO" to "hello"
function lowercaseNonCamelCase(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : '';

    // If current char is uppercase and previous char is a letter, keep it uppercase (camelCase)
    if (/[A-Z]/.test(char) && /[a-zA-Z]/.test(prevChar)) {
      result += char;
    } else {
      result += char.toLowerCase();
    }
  }
  return result;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Process // comments
  content = content.replace(/(\/\/)(.*?)$/gm, (match, slashes, commentText) => {
    const newText = lowercaseNonCamelCase(commentText);
    if (newText !== commentText) modified = true;
    return slashes + newText;
  });

  // Process {/* */} JSX comments
  content = content.replace(/(\{\/\*)([\s\S]*?)(\*\/\})/g, (match, open, commentText, close) => {
    const newText = lowercaseNonCamelCase(commentText);
    if (newText !== commentText) modified = true;
    return open + newText + close;
  });

  // Process /* */ block comments
  content = content.replace(/(\/\*)([\s\S]*?)(\*\/)/g, (match, open, commentText, close) => {
    // Skip if it's a JSX comment (already processed)
    if (match.startsWith('{/*')) return match;
    const newText = lowercaseNonCamelCase(commentText);
    if (newText !== commentText) modified = true;
    return open + newText + close;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Modified: ${filePath}`);
  }
}

function findTsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      files.push(...findTsxFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Run on current directory
const tsxFiles = findTsxFiles('.');
console.log(`Found ${tsxFiles.length} .tsx files`);

for (const file of tsxFiles) {
  processFile(file);
}

console.log('Done!');
