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
    Paragraph("AI and cyber engineer. LSU computer science, cybersecurity concentration, December 2026. Pentests production web, iOS, and Android. Runs the practice on The Bakery. Publishes supply-chain detections.", body),
    Paragraph("EXPERIENCE", h),
    Paragraph("FarmMind, AI and Cyber Engineer. Baton Rouge, LA. April 2026 to present", job),
]
story += bullets([
    "Pentest the production web, iOS, and Android apps with Burp Suite, ZAP, Invicti, and Wapiti. Host review in Wazuh. Fixes ship in GitHub and GCP CI.",
    "Fraud and account-sharing detection from device and location telemetry. Push over Firebase, APNs, and Android.",
    "Offline speech-to-speech and document translation on device. ONNX, sherpa-onnx, TensorRT, CUDA. FarmMind credited the work in public.",
    "Field auto-draw with SAM on iOS and web. Days of tracing a field by hand, now minutes.",
    "Farmer Al agent harness on LangChain, Langfuse, DSPy, and OpenRouter. AnyFarms support calls on LiveKit. Stripe billing.",
])
story.append(Paragraph("GuideOverride, lead architect. LSU project for Baton Rouge Community College. January 2026 to August 2026", job))
story += bullets([
    "Django and React system of record for course overrides, built with the college's deans. 380,000 equivalency rows. 3,000 past chair decisions.",
    "Replay of 1,046 decisions the engine had not seen. It never approved a case the chair denied. It decided 30% itself, all matching the chair, and sent the rest to a person. Rules decide. The model only reads documents.",
])
story.append(Paragraph("Schliewe Systems, founder. 2025 to present", job))
story += bullets([
    "The network I run: edge VPS, Proxmox, Apple Silicon for inference, WireGuard, Pangolin, Cloudflare. Packet and host monitoring with Zeek, Suricata, and Loki. ATT&CK alerts. LUKS, nftables, Fail2ban.",
    "Up: Gitea, Nextcloud, Vaultwarden, Pi-hole, Uptime Kuma. Client store for L. Ellis Designs on Next.js and Stripe.",
])
story.append(Paragraph("Earlier: Turner Automation, controls contractor, December 2025 to January 2026, Fanuc and Denso cell retrofits on Allen-Bradley. Flexi Solutions, intern, January to March 2024, React.", body))
story.append(Paragraph("PROJECTS", h))
story.append(Paragraph("The Bakery. github.com/thecandylane/thebakery", job))
story += bullets([
    "The harness the practice runs on. Agents, git, files, and the machines, across Claude, Grok, Gemini, and OpenAI. Rust node, Tauri and Electron clients. A room never holds a live key. Still under active build.",
])
story.append(Paragraph("ref-radar. ref.lookit.space", job))
story += bullets([
    "Prior-art catalog for coding agents. MCP server plus llms.txt and catalog.json. Scanner marks risky repos before they go live. Read all 194 flags. 68 were wrong.",
])
story.append(Paragraph("Shai-Hulud. schliewesystems.com/blog/defanging-shai-hulud", job))
story += bullets([
    "defang-specimen.sh, about 1,500 lines of bash, renames the worm's install and agent hooks and leaves the bytes. Ten public waves, September 2025 to October 2026. npm diff check and YARA-X rules, both on schliewesystems.com/lab.",
])
story.append(Paragraph("On schliewesystems.com", job))
story += bullets([
    "The familiar: prompt-injection CTF, tools simulated, nothing reaches a real shell. /you: fingerprint, WebRTC, EXIF, and a k-anonymity breach check. Stored nowhere.",
])
story.append(Paragraph("ImJustABill. github.com/thecandylane/ImJustABill. 2023", job))
story += bullets([
    "RAG over a bill PDF. LlamaIndex vector index, LangChain, text-davinci-003, Streamlit.",
])
story.append(Paragraph("PKM capture. Electron and Tauri", job))
story += bullets([
    "Screen capture into a knowledge base. Vision OCR. MCP server.",
])
story.append(Paragraph("SEC filings", job))
story += bullets([
    "EDGAR in four layers. DeepSeek writes the batch summaries. A second model does the synthesis. No trading.",
])
story.append(Paragraph("SKILLS", h))
for label, text in [
    ("Networks:", "Wireshark, Zeek, Suricata, nmap, packet capture on the wire, nftables, WireGuard"),
    ("Systems:", "Linux kernels and shells I built, Proxmox, LUKS, Docker, Rust"),
    ("Crypto and mobile:", "cryptography, hashcat, John the Ripper, Frida, JADX, iOS and Android pentest"),
    ("Reversing:", "Ghidra, IDA Pro, pwntools, angr, x86 and RISC-V, YARA-X"),
    ("Web and offensive:", "Burp Suite, ZAP, Invicti, Wapiti, nuclei, sqlmap, Metasploit, Sliver, BloodHound, Impacket, Mimikatz, Atomic Red Team"),
    ("Detection:", "Wazuh, Splunk, Sigma, Loki, Grafana, ATT&CK alerts, gitleaks"),
    ("AI:", "LlamaIndex RAG, LangChain, Langfuse, DSPy with Petri nets in pm4py and PySPN, ONNX, TensorRT, CUDA, vLLM, llama.cpp, Ollama, MCP, LiveKit"),
    ("Cloud and infrastructure:", "GCP (Cloud Run, IAM, Firebase), AWS, Cloudflare Workers, Linux, Proxmox VE, Docker/Compose, Coolify, WireGuard, Tailscale, Pangolin, Traefik, Caddy, Nginx, LUKS, nftables/UFW, GitHub Actions"),
    ("Industrial control systems:", "Allen-Bradley PLCs, Studio 5000, ICS software and design; Fanuc and Denso robotic cells, safety interlocks"),
    ("Languages and frameworks:", "Python, TypeScript/JavaScript, Node.js, Rust, Bash, SQL, Dart, Go, C/C++; React, Next.js, Flutter, Django, FastAPI, Streamlit, Postgres"),
]:
    story.append(Paragraph(f"<b>{label}</b> {text}", skill))
story.append(Paragraph("EDUCATION", h))
story.append(Paragraph("<b>Louisiana State University.</b> B.S. Computer Science, Cybersecurity Concentration, College of Engineering. Expected December 2026", body))
story.append(Paragraph("Board of Supervisors Scholarship. S&amp;B Engineers and Constructors Scholarship. President's Honor Roll. President, Web Application Development Club, 2024 to 2025. Security Society.", body))
story.append(Paragraph("<b>Coursework.</b> Networks, packet capture, and monitoring on the wire. Operating systems, shells, and kernels I built. Cryptography. Mobile security on iOS and Android. Reverse engineering and exploitation. CSC 4700: BPE, n-grams, and a SQuAD 2.0 eval of GPT-5-nano and Qwen3-8B. CSC 4101: Scheme and parsing.", body))
story.append(Paragraph("<b>Baton Rouge Community College.</b> CS credits, 2023 to 2024. <b>Flatiron School.</b> Software engineering bootcamp, 2023", body))
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
