import { useEffect, useState } from 'react'
import { projects } from '../content/projects'
import { categories, type Category } from '../content/schema'
import { site } from '../content/site'
import { useStore } from '../store'
import { ProjectView } from './ProjectView'
import { Terminal } from './Terminal'
import './screen.css'

export type Win =
  | { kind: 'folder'; category: Category }
  | { kind: 'project'; slug: string }
  | { kind: 'about' | 'contact' | 'terminal' }

const ICONS: { label: string; glyph: string; win: Win }[] = [
  ...(Object.keys(categories) as Category[]).map((c) => ({
    label: categories[c],
    glyph: '📁',
    win: { kind: 'folder', category: c } as Win,
  })),
  { label: 'About me', glyph: '🙂', win: { kind: 'about' } },
  { label: 'Contact', glyph: '✉️', win: { kind: 'contact' } },
  { label: 'terminal', glyph: '>_', win: { kind: 'terminal' } },
]

function title(w: Win) {
  if (w.kind === 'folder') return categories[w.category]
  if (w.kind === 'project') return projects.find((p) => p.slug === w.slug)?.title ?? w.slug
  return w.kind
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  return <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
}

export function Desktop() {
  const [win, setWin] = useState<Win | null>(null)
  const [back, setBack] = useState<Win | null>(null)
  const setMode = useStore((s) => s.setMode)
  const open = (w: Win) => {
    setBack(win)
    setWin(w)
  }

  return (
    <div className="desktop">
      <div className="icons">
        {ICONS.map((i) => (
          <button key={i.label} className="icon" onClick={() => open(i.win)}>
            <span className="glyph">{i.glyph}</span>
            {i.label}
          </button>
        ))}
      </div>

      <div className="wallpaper-note">
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
        <p className="muted">open a folder, or type `help` in the terminal</p>
      </div>

      {win && (
        <section className="window" key={JSON.stringify(win)}>
          <header>
            {back && (
              <button onClick={() => (setWin(back), setBack(null))} aria-label="Back">
                ←
              </button>
            )}
            <span>{title(win)}</span>
            <button onClick={() => setWin(null)} aria-label="Close window">
              ✕
            </button>
          </header>
          <div className="body">
            {win.kind === 'folder' && (
              <ul className="list">
                {projects
                  .filter((p) => p.category === win.category)
                  .map((p) => (
                    <li key={p.slug}>
                      <button onClick={() => open({ kind: 'project', slug: p.slug })}>
                        <strong>{p.title}</strong>
                        {p.nda && <em className="nda">Client work · NDA</em>}
                        <span>{p.summary}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
            {win.kind === 'project' && <ProjectView slug={win.slug} />}
            {win.kind === 'about' && site.about.map((t) => <p key={t}>{t}</p>)}
            {win.kind === 'contact' && (
              <ul>
                {site.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {win.kind === 'terminal' && <Terminal onOpen={(slug) => open({ kind: 'project', slug })} />}
          </div>
        </section>
      )}

      <footer className="taskbar">
        <button onClick={() => setMode('room')}>⏏ room</button>
        <span className="spacer" />
        <Clock />
      </footer>
    </div>
  )
}
