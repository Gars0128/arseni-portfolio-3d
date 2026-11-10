import { findProject } from '../content/projects'

export function ProjectView({ slug }: { slug: string }) {
  const p = findProject(slug)
  if (!p) return <p>Project not found: {slug}</p>
  return (
    <article className="project">
      <p className="meta">
        {p.year} · {p.role} {p.nda && <em className="nda">Client work · NDA</em>}
      </p>
      <p className="summary">{p.summary}</p>
      <div className="stack">
        {p.stack.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <h3>Problem</h3>
      <p>{p.problem}</p>
      <h3>Solution</h3>
      <p>{p.solution}</p>
      <h3>Result</h3>
      <p>{p.result}</p>
      {/* media loads lazily: only when the project window is open */}
      {p.media.map((m) => (
        <img key={m} loading="lazy" src={`${import.meta.env.BASE_URL}projects/${p.slug}/${m}`} alt={`${p.title} screenshot`} />
      ))}
      <p className="links">
        {p.links.github && (
          <a href={p.links.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        )}
        {p.links.demo && (
          <a href={p.links.demo} target="_blank" rel="noreferrer">
            Live demo ↗
          </a>
        )}
      </p>
    </article>
  )
}
