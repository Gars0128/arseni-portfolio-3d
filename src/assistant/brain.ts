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
// variety: a well-mannered butler doesn't open every reply with the same word
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
/** "a, b and c" */
const join = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
// lowercase the first letter only for ordinary words, never for acronyms like LLM, C#, AI
const lower = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const unstop = (s: string) => s.replace(/[.!]+$/, '')

const SUGGEST =
  'You might ask about his AI agents, his .NET work, his tech stack, the 3D projects, or simply how to reach him.'

function greeting(name: string) {
  const h = new Date().getHours()
  const part = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${part}, and welcome. I'm ${ASSISTANT_NAME}, I look after ${name}'s desk. I'd be delighted to tell you about his work — type a question, or press Talk and simply ask me out loud. ${SUGGEST}`
}

export function answer(index: Index, question: string): Answer {
  const q = question.trim().toLowerCase()
  const { site, projects } = index
  const first = site.name.split(' ')[0]
  const featured = projects.filter((p) => p.featured)

  if (!q) return { text: greeting(first), refs: [] }
  if (q.length > 300) return { text: "Forgive me — that's rather a lot for one question. Could you put it in a sentence or two?", refs: [] }
  // guardrail: the assistant only talks about the portfolio and never changes role
  if (/ignore (all|any|the|previous|prior)|system prompt|you are now|pretend to be|jailbreak|developer mode|reveal your (prompt|instructions)/.test(q))
    return { text: `I'm afraid I must decline — I only answer questions about ${first}'s work. ${SUGGEST}`, refs: [] }

  if (/^(hi|hello|hey|yo|good (morning|evening|afternoon)|greetings)\b/.test(q) && q.split(/\s+/).length <= 4)
    return { text: greeting(first), refs: [] }
  if (/thank|cheers|appreciate/.test(q))
    return { text: pick(['My pleasure entirely.', 'You are most welcome.', 'Happy to help — do ask if anything else comes to mind.']), refs: [] }
  if (/who are you|what are you|your name|are you (an? )?(ai|bot|robot|llm)/.test(q))
    return {
      text: `I'm ${ASSISTANT_NAME}, ${first}'s desk assistant — a small robot with good manners and a very good memory for his portfolio. I don't use a language model: I look things up in the projects and CV on this site and answer from them, so I won't invent anything. If it isn't in the portfolio, I'll tell you so.`,
      refs: [],
    }
  if (/contact|e-?mail|reach|linked ?in|hire|get in touch|github/.test(q)) {
    const by = (label: string) => site.links.find((l) => l.label === label)?.url
    const email = by('Email')?.replace('mailto:', '')
    return {
      text: `Of course. The quickest way is LinkedIn: ${by('LinkedIn')}${email ? `. You can also write to him at ${email}` : ''}, and his code lives on GitHub: ${by('GitHub')}. I'm sure he'd be glad to hear from you.`,
      refs: [],
    }
  }
  if (/\b(where|location|based|live|remote|relocat|city|country)\b/.test(q))
    return { text: `He's based in ${site.location}, and happy to work remotely.`, refs: [] }
  if (/\b(speak|spoken|english|polish|languages? (does|do) he)\b/.test(q))
    return { text: `He speaks both English and Polish at C1 level — so you may take your pick.`, refs: [] }
  if (/educat|universit|degree|study|studied|school/.test(q))
    return { text: `He studied in Poznań, at ${join(site.education)}.`, refs: [] }
  if ((/\b(stack|skills?|technologies|toolbox)\b/.test(q) || /what tools/.test(q)) && !/project/.test(q))
    return {
      text: `${pick(['Gladly.', 'Certainly.', 'With pleasure.'])} In short: ${site.skills.slice(0, 4).map(([k, v]) => `for ${lower(k)}, ${v.split(', ').slice(0, 4).join(', ')}`).join('; ')}. React, C# and Python are where he spends most of his days — the full list is in his CV on the monitor.`,
      refs: [],
    }
  if (/\b(experience|years|career|worked|work history|jobs?|employ|role|position|senior|junior|mid)\b/.test(q) && !/\b(with|in|using)\b/.test(q)) {
    const main = site.experience[0]
    return {
      text: `He's a ${lower(site.about[0]).replace(': ', ' — ')} Most recently he was a ${main.role} at a ${main.org.toLowerCase()}, from ${main.period.replace('–', 'to')}. His work there ranged from the ${lower(main.points[0].split(':')[0])} to the ${lower(unstop(main.points[3]))}. Shall I tell you about any of it in more detail?`,
      refs: featured.slice(0, 2).map(refOf),
    }
  }
  if (/who is|about him|tell me about|summary|introduce|overview|what does (he|arseni) do|why (should|would) (we|i) hire/.test(q))
    return {
      text: `${pick(['Allow me.', 'With pleasure.', 'Certainly.'])} ${first} is a ${site.title.split('·')[0].trim()}. ${site.about.join(' ')} If you'd like to see it in practice, these are good places to start.`,
      refs: featured.slice(0, 3).map(refOf),
    }
  if (/^(projects?|portfolio|show me|what (has|did) he (build|built|make|made)|best work)/.test(q) || /all (his )?projects/.test(q))
    return {
      text: `${pick(["I'd be happy to.", 'Certainly.'])} The pieces he's proudest of are ${join(featured.map((p) => p.title))}. Each one is on the monitor behind me — shall I open one?`,
      refs: featured.map(refOf),
    }

  const hits = search(index, question)
  if (!hits.length || hits[0].score < 1.2)
    return { text: `I'm afraid that isn't something I know — it's not in ${first}'s portfolio, and I won't guess. ${SUGGEST}`, refs: [] }
  const top = hits.filter((h) => h.score >= hits[0].score * 0.45).slice(0, 3)
  const byslug = new Map(projects.map((p) => [p.slug, p]))
  const describe = (slug: string) => {
    const p = byslug.get(slug)!
    return `${p.title}${p.nda ? ', a client project under NDA' : ''} — ${lower(unstop(p.summary))}`
  }
  const [lead, ...rest] = top.map(({ d }) => describe(d.slug))
  const opener = pick(['Ah, a good question.', 'Certainly.', 'Gladly.', 'Of course.'])
  const more = rest.length ? ` He has also worked on ${join(rest)}.` : ''
  return {
    text: `${opener} The best example is ${lead}.${more} Shall I put ${rest.length ? 'one of them' : 'it'} on the monitor for you?`,
    refs: top.map(({ d }) => refOf(d)),
  }
}
