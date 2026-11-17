// Data shared by the home page and the terminal.
export const PROJECTS = [
  {
    name: 'WorldDrop', kind: 'Terraria server network', stack: 'Python · JavaScript', href: 'https://worlds.lookit.space', go: 'Visit WorldDrop',
    what: 'WorldDrop is a Terraria server portal that feels like the game. Players sign in with Steam, upload their worlds and join with a short address. Each world runs on its own port on machines I host, saves and stops when the last player leaves, and wakes up when someone joins.',
  },
  {
    name: 'flipnotes', kind: 'Notes app', stack: 'Node standard library · Quill',
    what: "flipnotes is a self-hosted notes app with a Docs-style editor. A hidden hotkey flips any note into an AI chat about that note. Every account's notes stay isolated, and the server uses only Node's standard library.",
  },
  {
    name: 'brick', kind: 'CTF cockpit', stack: 'Bun · SQLite',
    what: "brick is the cockpit my team used for TryHackMe's Cyber Trials 2026. It is one process and one SQLite file, with eight seats and a live board for a jeopardy CTF. It runs on the local network only.",
  },
  {
    name: 'The Bakery', kind: 'Agent harness', stack: 'Rust · Tauri · Electron · SQLite', href: 'https://github.com/thecandylane/thebakery', go: 'Read the code',
    what: "The Bakery is a harness for AI agents. One Rust daemon runs Claude, Grok, Gemini and OpenAI agents in sandboxed rooms. A room never holds a real API key: the daemon swaps the key in at the room's boundary, and only for that provider's own hosts.",
  },
];
