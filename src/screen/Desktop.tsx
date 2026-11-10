import { useEffect, useState } from 'react'
import { projects } from '../content/projects'
import { categories, type Category } from '../content/schema'
import { site } from '../content/site'
import { useStore } from '../store'
import { CvView } from './CvView'
import { Game } from './Game'
import { NowPlaying, Player } from './Player'
import { ProjectView } from './ProjectView'
import { Terminal } from './Terminal'
import './screen.css'

// macOS-style abstract wallpaper, drawn with gradients (no image file).
const WALLPAPER = {
  background: [
    'radial-gradient(ellipse 60% 70% at 18% 85%, #ff6a3d 0%, #ff6a3d00 60%)',
    'radial-gradient(ellipse 55% 60% at 80% 20%, #6a5cff 0%, #6a5cff00 65%)',
    'radial-gradient(ellipse 50% 55% at 60% 90%, #c13584 0%, #c1358400 60%)',
    'radial-gradient(ellipse 45% 50% at 35% 25%, #2a8cff 0%, #2a8cff00 60%)',
    'linear-gradient(160deg, #1b1446, #3a1850 55%, #12102a)',
  ].join(', '),
}

export type Win =
  | { kind: 'folder'; category: Category }
  | { kind: 'project'; slug: string }
  | { kind: 'cv' | 'contact' | 'terminal' | 'music' | 'game' }

const ICONS: { label: string; glyph: string; win: Win }[] = [
  ...(Object.keys(categories) as Category[]).map((c) => ({
    label: categories[c],
    glyph: '📁',
    win: { kind: 'folder', category: c } as Win,
  })),
  { label: 'CV · About me', glyph: '📄', win: { kind: 'cv' } },
  { label: 'Contact', glyph: '✉️', win: { kind: 'contact' } },
  { label: 'Music', glyph: '🎧', win: { kind: 'music' } },
  { label: 'Game', glyph: '🎮', win: { kind: 'game' } },
  { label: 'terminal', glyph: '>_', win: { kind: 'terminal' } },
]

function title(w: Win) {
  if (w.kind === 'folder') return categories[w.category]
  if (w.kind === 'project') return projects.find((p) => p.slug === w.slug)?.title ?? w.slug
  return w.kind === 'cv' ? `CV — ${site.name}` : w.kind === 'game' ? 'Cat Climb' : w.kind
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
  // a project requested by the desk assistant opens straight away
  const [win, setWin] = useState<Win | null>(() => {
    const slug = useStore.getState().pendingProject
    return slug ? { kind: 'project', slug } : null
  })
  const [back, setBack] = useState<Win | null>(null)
  const setMode = useStore((s) => s.setMode)
  const open = (w: Win) => {
    setBack(win)
    setWin(w)
  }

  useEffect(() => {
    if (useStore.getState().pendingProject) useStore.setState({ pendingProject: null })
    return useStore.subscribe((s) => {
      if (!s.pendingProject) return
      setBack(null)
      setWin({ kind: 'project', slug: s.pendingProject })
      useStore.setState({ pendingProject: null })
    })
  }, [])

  return (
    <div className="desktop" style={WALLPAPER}>
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
            {win.kind === 'cv' && <CvView onOpen={(slug) => open({ kind: 'project', slug })} />}
            {win.kind === 'music' && <Player />}
            {win.kind === 'game' && <Game />}
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
            {win.kind === 'terminal' && <Terminal onOpen={(slug) => open(slug === 'cv' ? { kind: 'cv' } : { kind: 'project', slug })} />}
          </div>
        </section>
      )}

      <footer className="taskbar">
        <button onClick={() => setMode('room')}>⏏ room</button>
        <NowPlaying onOpen={() => open({ kind: 'music' })} />
        <span className="spacer" />
        <Clock />
      </footer>
    </div>
  )
}
