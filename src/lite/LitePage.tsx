import { projects } from '../content/projects'
import { categories, type Category } from '../content/schema'
import { site } from '../content/site'
import { ProjectView } from '../screen/ProjectView'
import '../screen/screen.css'
import './lite.css'

/** No-WebGL version: plain, fast, indexable list of projects. */
export function LitePage() {
  return (
    <main className="lite">
      <header>
        <h1>{site.name}</h1>
        <p>{site.tagline}</p>
        <p>
          <a href="./">▶ Open the 3D room</a> ·{' '}
          {site.links.map((l) => (
            <a key={l.url} href={l.url}>
              {l.label}
            </a>
          ))}
        </p>
      </header>
      {site.about.map((t) => (
        <p key={t}>{t}</p>
      ))}
      {(Object.keys(categories) as Category[]).map((c) => (
        <section key={c}>
          <h2>{categories[c]}</h2>
          {projects
            .filter((p) => p.category === c)
            .map((p) => (
              <details key={p.slug}>
                <summary>
                  <strong>{p.title}</strong> · {p.summary}
                </summary>
                <ProjectView slug={p.slug} />
              </details>
            ))}
        </section>
      ))}
    </main>
  )
}
