import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public/icons/icon.svg'))
const outDir = join(root, 'public/icons')

for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}.png`))
}

await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(join(root, 'public/favicon.ico'))

console.log('PWA icons generated')
