from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem, KeepTogether

out = "/Users/crumpeteer/Dev/code/jack-site-resume-src/public/Jack_Schliewe_Resume.pdf"

name = ParagraphStyle("name", fontName="Times-Bold", fontSize=14, leading=16, alignment=1, spaceAfter=0)
center = ParagraphStyle("center", fontName="Times-Roman", fontSize=8, leading=9.2, alignment=1, spaceAfter=0)
h = ParagraphStyle("h", fontName="Times-Bold", fontSize=8.2, leading=9.4, spaceBefore=3, spaceAfter=0.6)
body = ParagraphStyle("body", fontName="Times-Roman", fontSize=7.3, leading=8.6, spaceAfter=0.6)
job = ParagraphStyle("job", fontName="Times-Bold", fontSize=7.3, leading=8.6, spaceBefore=1, spaceAfter=0)
bullet = ParagraphStyle("bullet", fontName="Times-Roman", fontSize=7.3, leading=8.6, leftIndent=9, bulletIndent=0, spaceAfter=0)
skill = ParagraphStyle("skill", fontName="Times-Roman", fontSize=7.3, leading=8.6, spaceAfter=0.1)

def bullets(items):
    return [Paragraph("• " + t, bullet) for t in items]

story = [
    Paragraph("JACK SCHLIEWE", name),
    Paragraph("Baton Rouge, LA (open to remote) · jschli3@lsu.edu", center),
    Paragraph("schliewesystems.com · ref.lookit.space · linkedin.com/in/thecandylane · github.com/thecandylane", center),
    Spacer(1, 3),
    HRFlowable(width="100%", thickness=0.6, color="black", spaceAfter=2),
    Paragraph("SUMMARY", h),
    Paragraph("Security-focused software engineer graduating from LSU in December 2026 (computer science, cybersecurity concentration), seeking a remote role in AI/agent security, application security or detection engineering. Pentests a production web, iOS and Android platform, builds agent harnesses that isolate credentials, and publishes supply-chain malware research with working detections.", body),
    Paragraph("EXPERIENCE", h),
    Paragraph("FarmMind — AI and Cyber Engineer · Baton Rouge, LA · April 2026 – Present", job),
]
story += bullets([
    "Run internal penetration tests of the web, iOS and Android platform with Burp Suite, ZAP, Invicti and Wapiti, plus infrastructure review and host monitoring with Wazuh; fixes ship through GitHub and GCP CI/CD workflows.",
    "Built cross-device fraud detection and device and account monitoring that enforce the Terms of Service. Notifications over Firebase, APNs and Android.",
    "Led fully offline speech-to-speech and document translation on on-device speech-to-text, text-to-speech and translation models (ONNX, sherpa-onnx); credited publicly by FarmMind.",
    "Built field auto-draw with SAM in the iOS and web apps, cutting the drawing and mapping of fields by hand from days to minutes.",
    "Harness for Farmer Al, the in-app agent, on LangChain, Langfuse, DSPy/GEPA and OpenRouter. AnyFarms remote support over LiveKit. Stripe and FirstPromoter billing.",
])
story.append(Paragraph("GuideOverride, LSU course project for Baton Rouge Community College — Lead Architect · January 2026 – August 2026", job))
story += bullets([
    "Led the architecture of a system of record for course override requests (Django, React), built with the college's administrators and deans on 380,000 rows of course equivalency and institution records and 3,000 past chair decisions.",
    "Replayed the engine against 1,046 real past decisions it had never seen: it never approved a case the chair had denied, decided 30% on its own with every one matching the chair, and routed the rest to the chair for review.",
    "Kept the decision in deterministic rules and limited AI to reading documents. Spoke on it at LSU's AI 2026 event.",
])
story.append(Paragraph("Schliewe Systems — Founder and Infrastructure Engineer · 2025 – Present", job))
story += bullets([
    "Designed and run a multi-node environment (cloud VPS at the edge, Proxmox VE node for compute, Apple Silicon cluster for inference) joined over WireGuard through Pangolin and Cloudflare; host a client's store (L. Ellis Designs) on Coolify, Next.js, Stripe and Payload.",
    "Ship host and service logs with Grafana Alloy into Loki with alert rules based on MITRE ATT&CK, and metrics in Prometheus and Grafana; hardened every host with SSH hardening, LUKS full-disk encryption, nftables and UFW, and Fail2ban. Services up: Gitea, Nextcloud, Vaultwarden, Pi-hole, Uptime Kuma.",
])
story.append(Paragraph("Earlier: Turner Automation LLC, Controls Engineering Contractor (December 2025 – January 2026), robotic cell retrofits. Flexi Solutions LLC, Software Development Intern (January – March 2024), React and Material UI.", body))
story.append(Paragraph("PROJECTS", h))
story.append(Paragraph("ref-radar · ref.lookit.space · prior-art index for coding agents, built and run solo", job))
story += bullets([
    'Serves a curated catalog of reference repos to coding agents over an MCP server and as plain files (llms.txt, catalog.json); a scanner flags risky repos "dangerous code: read, don\'t run" before they go live.',
    "Audited all 194 flagged repos with a read-only agent and published the result, including 68 harmless repos the scanner had wrongly flagged.",
])
story.append(Paragraph("Shai-Hulud defanger and detection research · schliewesystems.com/blog/defanging-shai-hulud", job))
story += bullets([
    "Wrote defang-specimen.sh (about 1,500 lines of bash), which makes a copy of the npm worm's repo safe to open in an editor or coding agent: renames over 100 manifest, config and agent-file patterns without changing contents and flags high-entropy blobs.",
    "Compared public reports on ten waves of the worm (September 2025 – October 2026) and built two detections for the structure they share, an npm release-diff check and YARA-X rules for install and agent startup hooks, both runnable at schliewesystems.com/lab.",
])
story.append(Paragraph("Security tools on schliewesystems.com", job))
story += bullets([
    "The familiar: a public prompt-injection CTF against a tool-using AI agent with simulated tools. /you: shows what any site learns about a visitor (14-signal browser fingerprint, WebRTC leak check, EXIF stripping, k-anonymity breached-password check) and stores nothing.",
])
story.append(Paragraph("The Bakery · github.com/thecandylane/thebakery · AI agent harness (Rust, Tauri, Electron, SQLite)", job))
story += bullets([
    "One Rust daemon runs Claude, Grok, Gemini and OpenAI agents in sandboxed rooms; a room never holds a real API key, and the daemon swaps the key in at the room's boundary only for that provider's own hosts. Daily driver for Claude Code.",
])
story.append(Paragraph("ImJustABill · github.com/thecandylane/ImJustABill · 2023 hackathon", job))
story += bullets([
    "RAG over a bill PDF: LlamaIndex vector index (Unstructured reader, on-disk GPTVectorStoreIndex), LangChain and text-davinci-003 query engine, Streamlit UI.",
])
story.append(Paragraph("PKM capture · Electron/Tauri", job))
story += bullets([
    "Screen-capture personal knowledge base with Claude vision OCR and an MCP server for Claude Code.",
])
story.append(Paragraph("SEC filings research", job))
story += bullets([
    "Four-layer read of SEC EDGAR: DeepSeek batch summaries, Claude for the synthesis. No trading.",
])
story.append(Paragraph("SKILLS", h))
for label, text in [
    ("Web, API and offensive security:", "Burp Suite, ZAP, Invicti, Wapiti, Strix, nuclei, sqlmap, nmap, OpenVAS, Metasploit, Sliver, BloodHound, Certipy, Impacket, Mimikatz, hashcat, John the Ripper, Atomic Red Team"),
    ("Reversing, mobile and forensics:", "Ghidra, IDA Pro, JADX, Frida, pwntools, angr, z3, binwalk, Volatility, Autopsy, Wireshark, YARA-X; x86 and RISC-V assembly; RISC-V disassembler in C++"),
    ("Detection and monitoring:", "Wazuh, Splunk (SPL), Sigma rules, Suricata, Zeek, Loki, Grafana Alloy, Prometheus, Grafana, MITRE ATT&CK alert rules, Fail2ban, gitleaks"),
    ("AI and agent security:", "RAG (LlamaIndex), prompt-injection testing (garak, PyRIT, promptfoo), Claude Code, OpenAI Batch API, OpenRouter, credential isolation, agent sandboxing, MCP servers, LangChain, Langfuse, DSPy/GEPA with Petri nets (pm4py, PySPN), ONNX, TensorRT, CUDA, vLLM, llama.cpp, Ollama, LiveKit"),
    ("Cloud and infrastructure:", "GCP (Cloud Run, IAM, Firebase), AWS, Cloudflare Workers, Linux, Proxmox VE, Docker/Compose, Coolify, WireGuard, Tailscale, Pangolin, Traefik, Caddy, Nginx, LUKS, nftables/UFW, GitHub Actions"),
    ("Industrial control systems:", "Allen-Bradley PLCs, Studio 5000, ICS software and design; Fanuc and Denso robotic cells, safety interlocks"),
    ("Languages and frameworks:", "Python, TypeScript/JavaScript, Node.js, Rust, Bash, SQL, Dart, Go, C/C++; React, Next.js, Flutter, Django, FastAPI, Streamlit, Postgres"),
]:
    story.append(Paragraph(f"<b>{label}</b> {text}", skill))
story.append(Paragraph("EDUCATION", h))
story.append(Paragraph("<b>Louisiana State University —</b> B.S. in Computer Science, Cybersecurity Concentration, College of Engineering · expected December 2026", body))
story.append(Paragraph("Board of Supervisors Scholarship; S&amp;B Engineers and Constructors Scholarship; President's Honor Roll. Co-founder and President, Web Application Development Club (2024 – 2025); member, Security Society.", body))
story.append(Paragraph("<b>Coursework.</b> CSC 4700 AI/LLM development: BPE and n-gram tokenization; SQuAD 2.0 evaluation of GPT-5-nano (OpenAI Batch API) and Qwen3-8B (OpenRouter). CSC 4101: Scheme, grammars, parsing. CSC 4501: sockets and protocols. Also cryptography, operating systems, and reverse engineering.", body))
story.append(Paragraph("<b>Baton Rouge Community College —</b> CS coursework (credits only), 2023 – 2024 · <b>Flatiron School —</b> Software Engineering Bootcamp, 2023", body))
story.append(Paragraph("CERTIFICATIONS", h))
story.append(Paragraph("TryHackMe Cyber Trials 2026 Completionist (THM-CHWJAKRCAD) · TestOut Security Pro · IBM Cloud Core · IBM SkillsBuild Cybersecurity", body))

doc = SimpleDocTemplate(
    out, pagesize=letter,
    leftMargin=0.48*inch, rightMargin=0.48*inch,
    topMargin=0.32*inch, bottomMargin=0.28*inch,
    title="Jack Schliewe - Resume", author="Jack Schliewe",
)
doc.build(story)
print("wrote", out)
