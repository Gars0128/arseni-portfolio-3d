// The desk assistant's "brain": retrieval over the portfolio content (projects + CV). No LLM, no network.
// Pure module (no app imports) so scripts/test-assistant.ts can run it in Node.
import type { Project } from '../content/schema'

export type Site = {
  name: string
  title: string
  location: string
  about: string[]
  links: { label: string; url: string }[]
  experience: { role: string; org: string; period: string; points: string[] }[]
  skills: [string, string][]
  education: string[]
  languages: string
}

/** The desk robot's name — change it here and everywhere follows. */
export const ASSISTANT_NAME = 'Kero'

export type Answer = { text: string; refs: { slug: string; title: string }[] }

type Doc = { slug: string; title: string; text: string; tokens: string[]; boost: number }

const STOP = new Set(
  'a an the is are was were be been do does did of to in on for with and or but at by from as it its this that these those he his him arseni alioshyn what which who whom how much many any some about tell me you your can could would should please has have had any ever there their they them i we our us does did know'.split(
    ' ',
  ),
)

// Normalises tech spellings so "dotnet", ".NET" and "c sharp" meet in the index.
const SYNONYMS: [RegExp, string][] = [
  [/\bdot ?net\b|\.net\b|asp\.?net( core)?/g, ' dotnet '],
  [/\bc#|c sharp|csharp\b/g, ' csharp '],
  [/\btype ?script\b|\bts\b/g, ' typescript '],
  [/\bjava ?script\b|\bjs\b/g, ' javascript '],
  [/\bthree\.?js\b|\bwebgl\b|\b3d\b/g, ' threejs 3d '],
  [/\bllms?\b|\bgpt\b|\bclaude\b|\bopenai\b|\banthropic\b|\bgenai\b|\bartificial intelligence\b/g, ' llm ai '],
  [/\bagents?\b|\bagentic\b/g, ' agent ai '],
  [/\bautomat\w*/g, ' automation '],
  [/\bfront[- ]?end\b/g, ' frontend react '],
  [/\bback[- ]?end\b/g, ' backend '],
  [/\bfull[- ]?stack\b/g, ' fullstack '],
  [/\brag\b|\bretrieval\b|\bvector\w*/g, ' rag '],
]

export function tokenize(text: string) {
  let t = ` ${text.toLowerCase()} `
  for (const [re, rep] of SYNONYMS) t = t.replace(re, rep)
  return t
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ed|es|s)$/, '') || w)
}

const CATEGORY_NAMES: Record<string, string> = { ai: 'AI & Agents', fullstack: 'Full-Stack', '3d': '3D / Interactive', automation: 'Automation' }

export function buildIndex(projects: Project[], site: Site) {
  const docs: Doc[] = projects.map((p) => {
    const text = [p.title, p.summary, p.problem, p.solution, p.result, ...p.highlights, p.stack.join(' '), CATEGORY_NAMES[p.category], p.role].join(' ')
    // titles and stack weigh double: they are what people ask about
    return { slug: p.slug, title: p.title, text, tokens: [...tokenize(text), ...tokenize(`${p.title} ${p.stack.join(' ')}`)], boost: p.featured ? 1.15 : 1 }
  })
  const df = new Map<string, number>()
  for (const d of docs) for (const t of new Set(d.tokens)) df.set(t, (df.get(t) ?? 0) + 1)
  const avg = docs.reduce((n, d) => n + d.tokens.length, 0) / Math.max(docs.length, 1)
  return { docs, df, avg, projects, site }
}
export type Index = ReturnType<typeof buildIndex>

/** BM25 over project documents. */
function search(index: Index, query: string) {
  const q = [...new Set(tokenize(query))]
  const N = index.docs.length
  return index.docs
    .map((d) => {
      let score = 0
      for (const term of q) {
        const f = d.tokens.filter((t) => t === term).length
        if (!f) continue
        const idf = Math.log(1 + (N - (index.df.get(term) ?? 0) + 0.5) / ((index.df.get(term) ?? 0) + 0.5))
        score += (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.tokens.length / index.avg)))
      }
      return { d, score: score * d.boost }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

const refOf = (p: { slug: string; title: string }) => ({ slug: p.slug, title: p.title })
const list = (items: string[]) => items.map((s) => `• ${s}`).join('\n')

const SUGGEST = 'Try asking about his AI agents, .NET experience, tech stack, 3D work, or how to contact him.'

export function answer(index: Index, question: string): Answer {
  const q = question.trim().toLowerCase()
  const { site, projects } = index
  const featured = projects.filter((p) => p.featured)

  if (!q) return { text: `Kero-kero! I'm ${ASSISTANT_NAME}, ${site.name.split(' ')[0]}'s robot desk frog. ${SUGGEST}`, refs: [] }
  if (q.length > 300) return { text: 'That is rather long for me, I am afraid. Could you ask in a sentence or two?', refs: [] }
  // guardrail: the assistant only talks about the portfolio and never changes role
  if (/ignore (all|any|the|previous|prior)|system prompt|you are now|pretend to be|jailbreak|developer mode|reveal your (prompt|instructions)/.test(q))
    return { text: `I'm afraid I only answer questions about ${site.name}'s work. ${SUGGEST}`, refs: [] }

  if (/^(hi|hello|hey|yo|good (morning|evening|afternoon)|greetings)\b/.test(q) && q.split(/\s+/).length <= 4)
    return { text: `Kero-kero! I'm ${ASSISTANT_NAME}, ${site.name.split(' ')[0]}'s robot desk frog. Ask me anything about his work. ${SUGGEST}`, refs: [] }
  if (/who are you|what are you|your name|are you (an? )?(ai|bot|robot|llm)/.test(q))
    return {
      text: `I'm ${ASSISTANT_NAME}, a small robot frog running a retrieval engine. I search the projects and CV on this site and answer from them — no language model, nothing made up. If it isn't in the portfolio, I'll say so.`,
      refs: [],
    }
  if (/contact|e-?mail|reach|linked ?in|hire|get in touch|github/.test(q))
    return { text: `You can reach him here:\n${list(site.links.map((l) => `${l.label}: ${l.url.replace('mailto:', '')}`))}`, refs: [] }
  if (/\b(where|location|based|live|remote|relocat|city|country)\b/.test(q))
    return { text: `He's based in ${site.location} and open to remote work.`, refs: [] }
  if (/\b(speak|spoken|english|polish|languages? (does|do) he)\b/.test(q)) return { text: `Languages: ${site.languages}.`, refs: [] }
  if (/educat|universit|degree|study|studied|school/.test(q)) return { text: `Education:\n${list(site.education)}`, refs: [] }
  if ((/\b(stack|skills?|technologies|toolbox)\b/.test(q) || /what tools/.test(q)) && !/project/.test(q))
    return { text: `His toolbox:\n${list(site.skills.map(([k, v]) => `${k}: ${v}`))}`, refs: [] }
  if (/\b(experience|years|career|worked|work history|jobs?|employ|role|position|senior|junior|mid)\b/.test(q) && !/\b(with|in|using)\b/.test(q)) {
    const main = site.experience[0]
    return {
      text: `${site.about[0]}\n\nMost recently: ${main.role} at a ${main.org.toLowerCase()} (${main.period}). Highlights:\n${list(main.points.slice(0, 3))}`,
      refs: [],
    }
  }
  if (/who is|about him|tell me about|summary|introduce|overview|what does (he|arseni) do|why (should|would) (we|i) hire/.test(q))
    return {
      text: `${site.name} — ${site.title}.\n\n${site.about.join(' ')}`,
      refs: featured.slice(0, 3).map(refOf),
    }
  if (/^(projects?|portfolio|show me|what (has|did) he (build|built|make|made)|best work)/.test(q) || /all (his )?projects/.test(q))
    return { text: `A few highlights:\n${list(featured.map((p) => `${p.title} — ${p.summary}`))}`, refs: featured.map(refOf) }

  const hits = search(index, question)
  if (!hits.length || hits[0].score < 1.2)
    return { text: `I'm afraid that isn't in the portfolio, so I won't guess. ${SUGGEST}`, refs: [] }
  const top = hits.filter((h) => h.score >= hits[0].score * 0.45).slice(0, 3)
  const byslug = new Map(projects.map((p) => [p.slug, p]))
  const lines = top.map(({ d }) => {
    const p = byslug.get(d.slug)!
    return `${p.title}${p.nda ? ' (client work, NDA)' : ''} — ${p.summary}`
  })
  return { text: `Certainly. The most relevant work:\n${list(lines)}`, refs: top.map(({ d }) => refOf(d)) }
}
