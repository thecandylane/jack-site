import FlowText from '@/components/FlowText';
import { allPosts } from '@/lib/posts';
import { radarFacts, SAMPLE } from '@/lib/radar';
import { PROJECTS } from '@/lib/site';

export const dynamic = 'force-static'; // built once per deploy: reads src/content and ref-radar at build

const RADAR = 'https://ref.lookit.space';

// The copy follows the owner's LinkedIn wording. Work, security and education copy is factual and resume-style, without
// leading "I"; only the personal ABOUT paragraphs speak in first person.
// Laid out by Pretext around the draggable radar disc (FlowText).
const INTRO = "My recent specialty is improving agent and human collaboration while developing secure software. "
  + "Engineer at FarmMind, builder of ref-radar on the side, graduating in December with a bachelor's in cybersecurity.";

const ABOUT = [
  "I've worked on custom 3D printer and PC builds, Klipper and GPU overclocking, custom MIDI software in Max/MSP and Pure Data, "
  + "Pisound and MODEP pedals, guitar internals and externals, industrial Fanuc robots and Allen-Bradley PLCs (clean builds, "
  + "retrofitting, mastering, iRVision and safety assurance), secure systems for state government, lab and server networks and "
  + "their security, custom software builds and DevOps, custom hardware consulting, lacrosse sticks, bicycles, cars, and "
  + "(I'll try) almost anything else with strings or wires.",
  "I was a speaker at LSU's AI 2026 presentation for GuideOverride. I regularly volunteer with SQL Saturday Baton Rouge, "
  + "and I was fortunate enough to help out at an Anthropic SMB event here in Baton Rouge.",
];

const TOOLS = [
  ['search_refs', 'It finds refs by capability and language, with filters like lang:go or stars:>1k.'],
  ['get_ref', 'It says why a ref is worth reading, where to start, and whether the license lets you copy it.'],
  ['get_context', 'It returns the start-here files and their outlines at a pinned commit, in one call.'],
  ['search_code', "It searches the refs' code by text or symbol, and groups the results by ref."],
];

const WORK = [
  {
    role: 'Full-Stack AI Security Engineer', org: 'FarmMind', when: 'April 2026 to present', href: 'https://farmmind.org',
    what: 'A Baton Rouge company making farming and agriculture a more forgiving industry. Platform features, uptime and user protection.',
    points: [
      'Led fully offline speech-to-speech and document translation on on-device speech-to-text, text-to-speech and translation models (ONNX, sherpa-onnx). Credited publicly by FarmMind.',
      'Field auto-draw with SAM in the iOS and web apps: weeks of drawing and mapping fields by hand, cut to hours.',
      'Internal pentests of the web, iOS and Android platform with Burp Suite, ZAP, Invicti and Wapiti, plus infrastructure review. Fixes ship through GitHub and GCP CI/CD workflows, co-improved along the way.',
      'Cross-device fraud detection and device and account monitoring that enforce the Terms of Service. Cross-platform notifications over Firebase, APNs and Android.',
      'The harness for Farmer Al, the in-app agent, on LangChain, Langfuse, DSPy/GEPA and OpenRouter. Stripe and FirstPromoter billing. AnyFarms, a LiveKit tool for remote in-app support.',
      "Flutter app: faster local caching, cleaner GIS state and event handling, simpler code.",
      'Pitching and support at Farm Bureau conferences, LSU AgCenter showcases and other events.',
    ],
  },
  {
    role: 'Founder and infrastructure engineer', org: 'Schliewe Systems', when: '2025 to present',
    what: 'A self-designed, self-run multi-node environment: a cloud VPS at the edge, a Proxmox VE node for compute and an Apple Silicon cluster for inference, joined over WireGuard through Pangolin and Cloudflare.',
    points: [
      'Host and service logs shipped with Grafana Alloy into Loki, alert rules based on MITRE ATT&CK, metrics in Prometheus and Grafana.',
      'Every host hardened: SSH hardening, LUKS full-disk encryption, nftables and UFW, Fail2ban.',
      'brick, a pentest range and team cockpit: scope files and audit logs around agent-driven Strix runs, with nuclei templates and Atomic Red Team in the arsenal. Eight seats played TryHackMe\'s Cyber Trials 2026 from it.',
      'Security overhaul, November 2026: key-only SSH, two-factor on the edge dashboard, tunnel credentials rotated, device approval on the mesh, and DNS and this site moved to Cloudflare.',
      'Sites built and hosted for local clients, such as L. Ellis Designs, a store for custom buttons on Next.js, Stripe and Payload CMS.',
      'In progress: client sites moving to k3s with Flux on OVH, and an isolated malware-analysis lab with no credentials and no route to the rest of the network.',
    ],
  },
  {
    role: 'Lead architect and full-stack engineer', org: 'Baton Rouge Community College, GuideOverride', when: 'January 2026 to August 2026',
    what: "A system of record for BRCC's course override requests, built in Django and React with the college's administrators and deans. "
      + 'Led its architecture; still working with BRCC on their assisted workspace product.',
    points: [
      "Runs on the college's own records: 380,000 rows of course equivalencies and institutions, and 3,000 past decisions by department chairs.",
      'Replayed against 1,046 real past decisions it had never seen: it never approved a case the chair had denied. It decided 30% on its own, every one matching the chair; the rest went to the chair for review.',
      'Deterministic rules make the call; AI reads the documents. With the AI turned on, it still never made a call the chair disagreed with.',
    ],
  },
  {
    role: 'Developer (side project)', org: 'Local Influence', when: 'May 2026 to present', href: 'https://localinfluence.ai',
    what: 'LocalInfluence.ai, with Jack Minnich and Michael Vocke: a marketplace that connects local businesses with influencers.',
    points: [],
  },
  {
    role: 'Controls engineering contractor', org: 'Turner Automation LLC', when: 'December 2025 to January 2026',
    what: 'Helped Advanced Molding Solutions retrofit a Fanuc M-10iD and a Denso VM-series robotic cell on Allen-Bradley PLCs in Studio 5000 Logix, including ladder logic with safety interlocks.',
    points: [],
  },
];

const PRIOR = 'Earlier: software development intern at Flexi Solutions (Lightning Learn), building the marketing site and learning platform in React and Material UI. '
  + 'Controls engineering intern at HighPoint Electrical, programming Allen-Bradley PLCs and Fanuc robots with iRVision. '
  + "Student worker at the Louisiana Attorney General's Office.";

const SECURITY = [
  ['Malware analysis', 'Bash tooling to take apart the Shai-Hulud npm worm, which spread through developer machines and hooked the startup routines of AI coding assistants, so it ran without ever being executed directly.'],
  ['Web and API testing', "FarmMind's own apps, tested with Burp Suite, ZAP, Invicti and Wapiti."],
  ['Exploitation and reversing', 'Stack overflows, format strings and binary analysis with Ghidra and IDA Pro, in LSU coursework and CTFs.'],
  ['Agent security', 'Harnesses that isolate credentials, sandbox agent rooms, and block image exfiltration when rendering markdown.'],
];

const EDUCATION = [
  ['Louisiana State University', "Bachelor's in computer science, cybersecurity concentration, graduating December 2026. Board of Supervisors Scholarship, S&B Engineers and Constructors Scholarship, President's Honor Roll. Co-founded and led the Web Application Development Club, 2024 to 2025. Member of the Security Society."],
  ['Coursework', 'Computer networks, operating systems, cryptography, reverse engineering and software exploitation, and AI and LLM development.'],
  ['Baton Rouge Community College', 'Computer science with a cybersecurity concentration, 2023 to 2024.'],
  ['Flatiron School', 'Software engineering bootcamp in React, JavaScript, Flask and Python, January to May 2023.'],
];

const CERTS = [
  ['TryHackMe Cyber Trials Completionist', 'November 2026', 'THM-CHWJAKRCAD'],
  ['TestOut Security Pro', 'April 2024', '6-2C6-VFU7PH'],
  ['IBM Cloud Core', 'March 2024'],
  ['IBM SkillsBuild Cybersecurity Certificate', 'December 2023'],
  ['TryHackMe Pre Security', 'September 2023', 'THM-SLRP76YGHZ'],
  ['TryHackMe Intro to Cyber Security', 'February 2023', 'THM-K4SLKGBCV9'],
];

const CONTACT = [
  ['Email', 'jschli3@lsu.edu', 'mailto:jschli3@lsu.edu'],
  ['GitHub', 'github.com/thecandylane', 'https://github.com/thecandylane'],
  ['LinkedIn', 'linkedin.com/in/thecandylane', 'https://www.linkedin.com/in/thecandylane/'],
  ['ref-radar', 'ref.lookit.space', RADAR],
];

const n = (x) => x.toLocaleString('en-US');

function Section({ id, num, title, children }) {
  return (
    <section id={id} className="sec reveal">
      <h2 className="sec-h"><span className="muted">{num} /</span> {title}</h2>
      {children}
    </section>
  );
}

/** The hero's terminal lines: commands type themselves in turn, and each answer appears after its command. */
function BootLog({ lines }) {
  let at = 0.2;
  const rows = lines.map(([kind, text, mark]) => {
    const d = at;
    at += kind === 'cmd' ? text.length * 0.018 + 0.15 : 0.2;
    return (
      <p key={text} className={kind} style={{ '--n': text.length + 2, '--d': `${d.toFixed(2)}s` }}>
        {kind === 'cmd' ? <span><b>$ </b>{text}</span> : <>{text}{mark && <em> {mark}</em>}</>}
      </p>
    );
  });
  return { rows, end: `${at.toFixed(2)}s` };
}

export default async function Home() {
  const [facts, posts] = await Promise.all([radarFacts(), allPosts()]);
  const boot = BootLog({
    lines: [
      ['cmd', 'whoami'],
      ['out', 'Jack Schliewe · AI developer & security engineer · Baton Rouge, LA'],
      ...(facts ? [
        ['cmd', 'ref search "who already built this?"'],
        ['out', `${n(facts.refs)} refs · ${n(facts.topics)} topics · catalog built ${facts.built}`, '[OK]'],
      ] : []),
    ],
  });

  return (
    <main className="home">
      <header className="hero">
        <div className="hero-in" style={{ '--boot': boot.end }}>
          <div className="bootlog">{boot.rows}</div>
          <h1>I build custom, secure hardware and software.</h1>
          <FlowText text={INTRO} />
          <p className="hint muted">Press ~ for the terminal.</p>
          <nav className="cta" aria-label="Start here">
            <a href={RADAR}>Open ref-radar</a>
            <a href="#work">Work</a>
            <a href="#projects">Projects</a>
            <a href="#terminal">Terminal</a>
            <a href="/blog">Blog</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <Section id="ref-radar" num="01" title="ref-radar">
        <p className="big">Prior art for coding agents.</p>
        <p className="lead">
          Context7 tells your agent how to call a library. ref-radar tells it who already built the thing,
          where to start reading, and whether it can reuse the code. Built and run solo, with new refs every day.
        </p>
        {facts && (
          <dl className="stats">
            <div><dt>Refs</dt><dd>{n(facts.refs)}</dd></div>
            <div><dt>Repos</dt><dd>{n(facts.repos)}</dd></div>
            <div><dt>Papers</dt><dd>{n(facts.papers)}</dd></div>
            <div><dt>Topics</dt><dd>{n(facts.topics)}</dd></div>
          </dl>
        )}
        {facts && <p className="muted small built">The catalog was built on {facts.built}. These numbers refresh each time this site deploys.</p>}
        <div className="term">
          <p className="term-bar"><span>Claude Code</span><span className="muted">No install and no account.</span></p>
          <pre><code><span className="muted">$ </span>claude mcp add --transport http ref-radar {RADAR}/mcp</code></pre>
          <p className="muted small">For Codex, Gemini CLI, Cursor or any other MCP client, point it at <code>{RADAR}/mcp</code>. The catalog is also plain files: <a href={`${RADAR}/llms.txt`}>llms.txt</a> and <a href={`${RADAR}/catalog.json`}>catalog.json</a>.</p>
        </div>
        {facts?.hits.length > 0 && (
          <div className="term">
            <p className="term-bar"><span>search_refs</span><span className="muted">A real answer from the last build.</span></p>
            <pre><code>
              <span className="muted">&gt; </span>{SAMPLE}{'\n'}
              {facts.hits.map((r) => (
                <span key={r.id}>{'\n'}<a href={`${RADAR}/ref/${r.id.replace(':', '/')}/`}>{r.id}</a>{'  '}<span className={`reuse-${r.reuse}`}>{r.reuse}</span> <span className="muted">{[r.lang, r.license, r.maturity].filter(Boolean).join(' · ')}</span>{'\n'}<span className="muted">  {r.why}</span>{'\n'}</span>
              ))}
            </code></pre>
          </div>
        )}
        <ol className="tools">
          {TOOLS.map(([tool, does]) => <li key={tool}><code>{tool}</code><span>{does}</span></li>)}
        </ol>
        <nav className="cta" aria-label="ref-radar">
          <a href={RADAR}>Open ref-radar</a>
          <a href={`${RADAR}/add`}>Suggest a ref</a>
          <a href="https://github.com/thecandylane/ref-radar-data">Nightly export</a>
        </nav>
      </Section>

      <Section id="work" num="02" title="Work">
        <ul className="jobs">
          {WORK.map((j) => (
            <li key={j.org}>
              <h3>{j.role} <span className="muted">@</span> {j.href ? <a className="org" href={j.href}>{j.org}</a> : <span className="org">{j.org}</span>}</h3>
              <p className="when muted">{j.when}</p>
              <p className="what">{j.what}</p>
              {j.points.length > 0 && <ul>{j.points.map((p) => <li key={p}>{p}</li>)}</ul>}
            </li>
          ))}
        </ul>
        <p className="muted small">{PRIOR}</p>
      </Section>

      <Section id="projects" num="03" title="Projects">
        <div className="cards">
          {PROJECTS.map((p) => (
            <article key={p.name} className="card">
              <p className="muted small">{p.kind}</p>
              <h3>{p.name}</h3>
              <p>{p.what}</p>
              <p className="muted small">{p.stack}</p>
              {p.href && <a className="go" href={p.href}>{p.go} →</a>}
            </article>
          ))}
        </div>
      </Section>

      <Section id="about" num="04" title="About">
        <div className="about">{ABOUT.map((p) => <p key={p}>{p}</p>)}</div>
      </Section>

      <Section id="security" num="05" title="Security">
        <ul className="facts">
          {SECURITY.map(([k, v]) => <li key={k}><span>{k}</span><span className="muted">{v}</span></li>)}
        </ul>
      </Section>

      <Section id="education" num="06" title="Education">
        <ul className="facts">
          {EDUCATION.map(([k, v]) => <li key={k}><span>{k}</span><span className="muted">{v}</span></li>)}
        </ul>
        <h3 className="sub">Certifications</h3>
        <ul className="facts">
          {CERTS.map(([name, when, id]) => <li key={name}><span>{name}</span><span className="muted">{when}{id && <> · credential ID <code>{id}</code></>}</span></li>)}
        </ul>
      </Section>

      <Section id="writing" num="07" title="Writing">
        <ul className="posts">
          {posts.slice(0, 5).map((p) => (
            <li key={p.slug}><a href={`/blog/${p.slug}`}><time className="muted">{p.date}</time><span>{p.title}</span></a></li>
          ))}
        </ul>
        <nav className="cta"><a href="/blog">All posts</a></nav>
      </Section>

      <Section id="contact" num="08" title="Contact">
        <p className="lead">Email is the best way to reach me.</p>
        <ul className="facts">
          {CONTACT.map(([k, v, href]) => <li key={k}><span>{k}</span><a href={href}>{v}</a></li>)}
        </ul>
      </Section>

      <footer className="foot muted small">© 2026 Jack Schliewe · Baton Rouge, LA</footer>
    </main>
  );
}
