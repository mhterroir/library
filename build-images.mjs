// build-images.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageSize } from 'image-size'; // from image-size package [web:176][web:179]

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG: adjust if your folders are different
const FULL_DIR = path.join(__dirname, 'images', 'full');
const THUMB_DIR = path.join(__dirname, 'images', 'thumbs');
const SCRIPT_PATH = path.join(__dirname, 'script.js');

// Helper: get dimensions or null on failure
function getDimensions(filePath) {
  try {
    const { width, height } = imageSize(filePath);
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

// 1. Read full-size images
const fullFiles = fs
  .readdirSync(FULL_DIR, { withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => d.name)
  // basic filter for common image extensions
  .filter((name) => /\.(jpe?g|png|webp|gif|avif)$/i.test(name));

// 2. Build imageFiles array
const imageFiles = [];

for (const name of fullFiles) {
  const fullPath = path.join(FULL_DIR, name);
  const thumbPath = path.join(THUMB_DIR, name); // same filename in thumbs/

  const dims = getDimensions(fullPath);
  if (!dims) {
    console.warn(`Skipping ${name}: could not determine dimensions`);
    continue;
  }

  const item = {
    href: `images/full/${name}`,
    thumb: fs.existsSync(thumbPath) ? `images/thumbs/${name}` : `images/full/${name}`,
    title: name, // you can replace this later with something nicer
    w: dims.width,
    h: dims.height
  };

  imageFiles.push(item);
}

// 3. Generate JS code

const header = `// script.js
// AUTO-GENERATED IN PART BY build-images.mjs
// Do not edit the imageFiles array by hand; run \`node build-images.mjs\` instead.

const imageFiles = ${JSON.stringify(imageFiles, null, 2)};

`;

const footer = `const linksContainer = document.getElementById('links');

imageFiles.forEach((file, index) => {
  const a = document.createElement('a');
  a.href = file.href;
  a.dataset.index = index;

  if (file.title) {
    a.title = file.title;
  }

  const img = document.createElement('img');
  img.src = file.thumb || file.href;
  img.alt = file.title || \`Image \${index + 1}\`;

  linksContainer.appendChild(a);
  a.appendChild(img);
});
`;

// 4. Write script.js
fs.writeFileSync(SCRIPT_PATH, header + footer, 'utf8');

console.log(`Wrote ${imageFiles.length} items to script.js`);
