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
    Paragraph("AI and cyber engineer. LSU computer science, cybersecurity, December 2026. I pentest production web, iOS, and Android, and I run the software enterprise on The Bakery.", body),
    Paragraph("EXPERIENCE", h),
    Paragraph("FarmMind, Full-Stack AI Security Engineer. Baton Rouge. April 2026 to present", job),
]
story += bullets([
    "Cross-platform agriculture app. I helped build the on-device ONNX and sherpa-onnx suite for speech-to-text, text-to-speech, and translation, on iOS and web. TensorRT and CUDA under the voice models.",
    "mobileSAM in the iOS and web apps for field auto-draw. Flutter work on local caching, GIS state, and event handling.",
    "Cross-platform notifications and device and account monitoring. Stripe and FirstPromoter billing. Farmer Al, the in-app agent. AnyFarms on LiveKit for remote support inside the app.",
    "Internal pentests with ZAP, Burp, Invicti, and Wapiti, plus infrastructure review. GitHub and GCP CI. Conferences and sponsored events for FarmMind.",
])
story.append(Paragraph("GuideOverride, Full-Stack Software Engineer. Baton Rouge Community College. January 2026 to August 2026", job))
story += bullets([
    "Our team built the system of record for BRCC course overrides, in Django and React, on their own data. 380,000 equivalency rows and 3,000 past chair decisions.",
    "Replay of 1,046 decisions it had not seen. It never approved a case the chair denied. It decided 30% on its own, every one matching the chair, and sent the rest to a person. The rules decide. The model only reads the documents.",
])
story.append(Paragraph("Schliewe Systems, founder. 2025 to present", job))
story += bullets([
    "The network I run. Edge VPS, Proxmox, Apple Silicon for inference, WireGuard, Pangolin, Cloudflare. Packet and host monitoring with Zeek, Suricata, and Loki. ATT&CK alerts. LUKS, nftables, Fail2ban.",
    "Already up: Gitea, Nextcloud, Vaultwarden, Pi-hole, Uptime Kuma. L. Ellis Designs, a client store, on Next.js and Stripe.",
])
story.append(Paragraph("Turner Automation, contract, December 2025 to January 2026. Retrofit of a Fanuc M-10iD and a Denso VM-Series for Advanced Molding Solutions, Studio 5000 Logix, Allen-Bradley.", body))
story.append(Paragraph("Modesto, server and bartender, January 2024 to June 2026. Opening, closing, events, and the IT when the floor terminals broke.", body))
story.append(Paragraph("Attorney General's office, Baton Rouge, student worker, May 2024 to August 2024. Inventory, work orders, fleet.", body))
story.append(Paragraph("Flexi Solutions, software intern, January to March 2024. React.", body))
story.append(Paragraph("PROJECTS", h))
story.append(Paragraph("The Bakery. github.com/thecandylane/thebakery", job))
story += bullets([
    "Where the software enterprise runs. Claude, Grok, Gemini, and OpenAI agents, the git repos, the files, and the machines. Rust node, Tauri and Electron clients. A room never holds a live API key. Still being built.",
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
story.append(Paragraph("TryHackMe Cyber Trials 2026. LSU team, 10th of 27 universities, 10 of 12 rooms. Completionist, THM-CHWJAKRCAD. The AI room hit our token limit before the flag. TestOut Security Pro. IBM Cloud Core. IBM SkillsBuild Cybersecurity.", body))

doc = SimpleDocTemplate(
    out, pagesize=letter,
    leftMargin=0.48*inch, rightMargin=0.48*inch,
    topMargin=0.32*inch, bottomMargin=0.28*inch,
    title="Jack Schliewe - Resume", author="Jack Schliewe",
)
doc.build(story)
print("wrote", out)
