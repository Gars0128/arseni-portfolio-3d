// Personal info / CV shown in the "CV" window and the no-WebGL page. Projects live in ./projects/*.json.
export const site = {
  name: 'Arseni Alioshyn',
  title: 'Full-Stack & AI Engineer · C#/.NET · React/TypeScript · LLM automation',
  location: 'Poznań, Poland',
  photo: 'me.jpg',
  tagline: 'Full-Stack AI Engineer',
  about: [
    'Full-stack software engineer with about three years of commercial experience: C#/.NET backends, React/TypeScript applications and API integrations.',
    'My work spans enterprise document workflows, synchronized multi-screen applications, visual editors, CMS-driven websites and CRM automation — now with a focus on LLM agents and automation.',
    'I design AI systems to be reliable rather than just impressive: schema-validated outputs, deterministic rules with the final say, guardrails, human approval for risky actions and evaluation on test cases.',
  ],
  links: [
    { label: 'Email', url: 'mailto:aleshin2018@gmail.com' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/arsenialioshyn' },
    { label: 'GitHub', url: 'https://github.com/Gars0128' },
  ],
  experience: [
    {
      role: 'Full-Stack Software Engineer (.NET / React)',
      org: 'Digital agency',
      period: 'Jan 2024 – Oct 2026',
      points: [
        'C#/ASP.NET Core backend for processing and co-editing enterprise presentations: EF Core/MySQL, background jobs, SignalR edit locking, roles and permissions.',
        'Synchronized multi-screen React/TypeScript experiences across touch tables, 4K displays and Android controllers; video coordination and Chromium decoding fixes.',
        'React/TypeScript visual editor for complex HTML/CSS/JS templates with content fields, previews and round-trip import/export.',
        'LLM lead-qualification pipeline in n8n with test mode, per-run limits, deduplication and output validation.',
        'Planned and ran a 12-hour Playwright endurance test (107 cycles, 2,461 actions) that surfaced race conditions and decoding issues.',
        'CMS websites and components (Strapi, WordPress, HubSpot), CRM form refactoring and Docker-based deployments; introduced AI coding agents into the team workflow.',
      ],
    },
    { role: '.NET Developer', org: 'Freelance', period: 'Jan 2023 – Apr 2023', points: ['Freelance ASP.NET Core development.'] },
    { role: '.NET Developer Intern', org: 'Training internship', period: 'Apr 2021 – Jun 2021', points: ['.NET Framework fundamentals and ASP.NET web development.'] },
  ],
  skills: [
    ['AI & LLM', 'OpenAI & Anthropic APIs, agents and tool calling, structured outputs, guardrails, human-in-the-loop, local models (Ollama), RAG at prototype level'],
    ['Backend', 'C#, ASP.NET Core, EF Core, REST APIs, SQL/MySQL, Python, FastAPI, Temporal'],
    ['Frontend', 'React, TypeScript, JavaScript, HTML/CSS, Electron, Highcharts, Three.js, Lottie'],
    ['Automation & CMS', 'n8n, webhooks, Google Sheets, CRM integrations, Strapi, WordPress/Gutenberg, HubSpot'],
    ['Delivery', 'Docker, Git, GitHub Actions, Playwright, pytest, Jira, Scrum, Claude Code, Codex'],
  ] as [string, string][],
  education: ['Poznań University of Technology', 'Adam Mickiewicz University'],
  languages: 'English C1 · Polish C1',
}
