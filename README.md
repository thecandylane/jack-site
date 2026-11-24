# schliewesystems.com

Source for [schliewesystems.com](https://schliewesystems.com): my site, blog and a few things to break. It shares a phosphor terminal look with [ref-radar](https://ref.lookit.space), and the two sites link to each other.

## What's on it

| Path | What it is |
|---|---|
| `/` | Work, projects, security and writing, with ref-radar's live numbers fetched at build |
| `/blog` | Posts in MDX, with ref-radar cards, diagrams and editable fix-the-bug exercises |
| `/lab` | Small security tools that run in the browser: an agent config checker, an npm release diff, a YARA-X playground and a RISC-V disassembler |
| `/forge` | A small JavaScript VM written here, with exploit labs planted on purpose and a defended mode that runs the same exploit against the fixes |
| `/you` | What your browser and connection reveal to every site you visit, shown back to you and never stored |
| `/headers` | The site's security headers, read from the same module the Worker sends |
| `~` | A terminal: `ref` searches ref-radar, `familiar` starts an agent CTF |

The labs and the CTF have bugs on purpose. If you find one that isn't part of a challenge, please open an issue.

## Stack

Next.js 15 and React 19 in plain JavaScript, running on Cloudflare Workers through OpenNext. Every page is prerendered. Code blocks are highlighted by Shiki at build time and diagrams are drawn by Pele. The hero text is laid out with Pretext. The CSP has no `unsafe-eval` and requires Trusted Types.

## Run it

```sh
npm install
npm run dev       # localhost:3000
npm test          # logic checks in src/lib and the exercises
npm run preview   # the Cloudflare build, served locally in workerd
```

The agent CTF needs a Gemini API key and a flag as Worker secrets. Without them `/api/agent` answers 503 and the rest of the site works.
