import { useEffect, useState } from 'react'
import { projects } from '../content/projects'
import { categories } from '../content/schema'
import { site } from '../content/site'

/** What the monitor shows from the room: projects cycling like a screensaver; hover adds the call to action. */
export function ScreenSaver({ hovered }: { hovered: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % projects.length), hovered ? 1800 : 3500)
    return () => clearInterval(id)
  }, [hovered])
  const p = projects[i]

  return (
    <div className={hovered ? 'saver hovered' : 'saver'}>
      <div className="saver-top">
        <span>{site.name} / portfolio</span>
        <span>
          {i + 1} / {projects.length}
        </span>
      </div>
      <div className="saver-card" key={p.slug}>
        <span className="saver-cat">{categories[p.category]}</span>
        <h2>{p.title}</h2>
        <p>{p.summary}</p>
        <div className="stack">
          {p.stack.slice(0, 5).map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
      <div className="saver-cta">▶ click to open my projects</div>
    </div>
  )
}
