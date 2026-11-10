import { z } from 'zod'

export const categories = {
  ai: 'AI & Agents',
  fullstack: 'Full-Stack',
  '3d': '3D / Interactive',
  automation: 'Automation',
} as const

export type Category = keyof typeof categories

export const projectSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    category: z.enum(['ai', 'fullstack', '3d', 'automation']),
    year: z.number().int().min(2000),
    featured: z.boolean().default(false),
    role: z.string().min(1),
    summary: z.string().min(1),
    problem: z.string().min(1),
    solution: z.string().min(1),
    result: z.string().min(1),
    highlights: z.array(z.string()).default([]),
    stack: z.array(z.string()).min(1),
    links: z.object({ github: z.url().nullable(), demo: z.url().nullable() }),
    media: z.array(z.string()).default([]),
    nda: z.boolean().default(false),
  })
  .refine((p) => !p.nda || (p.media.length === 0 && !p.links.github && !p.links.demo), {
    message: 'NDA projects must not have screenshots or public links',
  })

export type Project = z.infer<typeof projectSchema>
