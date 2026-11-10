// Build gate: every project JSON must match the zod schema and be named <slug>.json.
import { readdirSync, readFileSync } from 'node:fs'
import { projectSchema } from '../src/content/schema.ts'

const dir = new URL('../src/content/projects/', import.meta.url)
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
let failed = 0
for (const f of files) {
  const r = projectSchema.safeParse(JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
  const err = !r.success
    ? r.error.message
    : `${r.data.slug}.json` !== f
      ? `slug "${r.data.slug}" does not match filename`
      : null
  if (err) {
    failed++
    console.error(`x ${f}: ${err}`)
  }
}
if (!files.length || failed) process.exit(1)
console.log(`ok: ${files.length} projects valid`)
