import { useEffect, useRef, useState } from 'react'
import { findProject, projects } from '../content/projects'
import { site } from '../content/site'

const HELP = 'commands: help, ls projects, open <slug>, whoami, cv, clear, sudo coffee'

export function run(cmd: string): { out: string; open?: string; clear?: boolean } {
  const [name, ...args] = cmd.trim().split(/\s+/)
  const arg = args.join(' ')
  if (!name) return { out: '' }
  if (name === 'help') return { out: HELP }
  if (name === 'ls') return { out: projects.map((p) => `${p.slug.padEnd(32)} ${p.category}`).join('\n') }
  if (name === 'open') {
    const p = findProject(arg)
    return p ? { out: `opening ${p.title}…`, open: p.slug } : { out: `no such project: ${arg || '?'} (try ls projects)` }
  }
  if (name === 'whoami') return { out: `${site.name}: ${site.tagline}` }
  if (name === 'cv') return { out: 'opening CV…', open: 'cv' }
  if (name === 'clear') return { out: '', clear: true }
  if (cmd.trim() === 'sudo coffee') return { out: '☕ brewing… permission granted. The cat approves.' }
  if (name === 'sudo') return { out: 'nice try.' }
  return { out: `command not found: ${name}. ${HELP}` }
}

export function Terminal({ onOpen }: { onOpen: (slug: string) => void }) {
  const [lines, setLines] = useState<string[]>([`${site.name} shell. type "help".`])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [lines])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = run(input)
    setLines((l) => (r.clear ? [] : [...l, `$ ${input}`, ...(r.out ? [r.out] : [])]))
    setInput('')
    if (r.open) onOpen(r.open)
  }

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      {lines.map((l, i) => (
        <pre key={i}>{l}</pre>
      ))}
      <form onSubmit={submit}>
        <span>$</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="terminal input"
          spellCheck={false}
        />
      </form>
      <div ref={endRef} />
    </div>
  )
}
