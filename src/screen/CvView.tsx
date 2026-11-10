import { projects } from '../content/projects'
import { site } from '../content/site'

/** The CV, rendered as a page inside the monitor. Projects link to their windows. */
export function CvView({ onOpen }: { onOpen: (slug: string) => void }) {
  return (
    <article className="cv">
      <div className="cv-head">
        <img src={`${import.meta.env.BASE_URL}${site.photo}`} alt={site.name} />
        <div>
          <h2>{site.name}</h2>
          <p className="cv-title">{site.title}</p>
          <p className="cv-meta">
            {site.location} ·{' '}
            {site.links.map((l, i) => (
              <span key={l.url}>
                {i > 0 && ' · '}
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>

      <h3>Profile</h3>
      {site.about.map((t) => (
        <p key={t}>{t}</p>
      ))}

      <h3>Experience</h3>
      {site.experience.map((e) => (
        <section key={e.role} className="cv-job">
          <p className="cv-row">
            <strong>{e.role}</strong> <em>{e.org}</em>
            <span>{e.period}</span>
          </p>
          <ul>
            {e.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </section>
      ))}

      <h3>Selected projects</h3>
      <ul className="cv-projects">
        {projects
          .filter((p) => p.featured)
          .map((p) => (
            <li key={p.slug}>
              <button onClick={() => onOpen(p.slug)}>{p.title} →</button> {p.summary}
            </li>
          ))}
      </ul>

      <h3>Skills</h3>
      <dl className="cv-skills">
        {site.skills.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <h3>Education & languages</h3>
      <p>
        {site.education.join(' · ')}
        <br />
        {site.languages}
      </p>
    </article>
  )
}
