import { projectSchema, type Project } from './schema'

const files = import.meta.glob('./projects/*.json', { eager: true, import: 'default' })

export const projects: Project[] = Object.entries(files)
  .map(([path, data]) => {
    const r = projectSchema.safeParse(data)
    if (!r.success) throw new Error(`${path}: ${r.error.message}`)
    return r.data
  })
  .sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year)

export const findProject = (slug: string) => projects.find((p) => p.slug === slug)
