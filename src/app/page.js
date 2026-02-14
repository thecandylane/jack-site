'use client';

import { useState, useEffect, useRef } from 'react';

const SECTIONS = ['home', 'narrative', 'services', 'projects', 'expertise', 'contact'];

function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function RevealSection({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,10,10,0.92)' : 'rgba(10,10,10,0.6)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid rgba(200,155,80,${scrolled ? 0.15 : 0.05})`,
      padding: '0 clamp(1rem, 4vw, 3rem)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: 64,
      }}>
        <a href="#home" style={{
          fontFamily: "var(--font-jetbrains), 'Fira Code', monospace",
          fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em',
          color: '#c89b50', textDecoration: 'none', textTransform: 'uppercase',
        }}>
          JS<span style={{ color: '#fff' }}>://</span>SCHLIEWE
        </a>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {SECTIONS.filter(s => s !== 'home').map(s => (
            <a key={s} href={`#${s}`}
              className="nav-link"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                transition: 'color 0.3s',
                display: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#c89b50'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              {s}
            </a>
          ))}
          <a href="#contact" style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.7rem', letterSpacing: '0.1em',
            padding: '10px 20px',
            minHeight: 44,
            display: 'inline-flex', alignItems: 'center',
            border: '1px solid #c89b50',
            color: '#c89b50',
            textDecoration: 'none',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#c89b50';
            e.currentTarget.style.color = '#0a0a0a';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#c89b50';
          }}
          >WORK WITH ME</a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <section id="home" style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 'clamp(2rem, 8vw, 6rem) clamp(1rem, 4vw, 3rem)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(rgba(200,155,80,1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,155,80,1) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      <div style={{
        position: 'absolute', top: 0, right: '15%', width: 1, height: '100%',
        background: 'linear-gradient(to bottom, transparent, rgba(200,155,80,0.3), transparent)',
        transform: 'rotate(15deg)', transformOrigin: 'top center',
      }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', position: 'relative' }}>
        <div style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.6s ease 0.2s',
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
          marginBottom: '2rem', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 12px rgba(74,222,128,0.5)',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          Baton Rouge, Louisiana
        </div>

        <h1 style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: 'clamp(2.5rem, 7vw, 6rem)',
          fontWeight: 400, lineHeight: 1.05,
          color: '#fff', margin: 0,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease 0.4s',
        }}>
          I build the tools<br />
          <span style={{ color: '#c89b50', fontStyle: 'italic' }}>that build</span> the future.
        </h1>

        <p style={{
          fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.3rem)',
          lineHeight: 1.7, color: 'rgba(255,255,255,0.55)',
          maxWidth: 620, marginTop: '2rem',
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease 0.7s',
        }}>
          Software. Industrial controls. Cybersecurity. AI. Hardware.
          If it runs on code or current, I build it, fix it, or secure it.
          Baton Rouge&apos;s complete technology resource.
        </p>

        <div style={{
          display: 'flex', gap: 'clamp(1rem, 3vw, 3rem)',
          marginTop: '3.5rem', flexWrap: 'wrap',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease 1s',
        }}>
          {[
            'Systems Architecture',
            'Industrial Controls',
            'Web Platforms',
            'AI Integration',
            'Cybersecurity',
            'Hardware & Repair',
          ].map((label, i) => (
            <div key={i} style={{
              borderLeft: '1px solid rgba(200,155,80,0.3)',
              paddingLeft: '1.5rem',
            }}>
              <div style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: '0.65rem', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: '2rem', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: loaded ? 0.4 : 0, transition: 'opacity 1.5s ease 1.5s',
      }}>
        <div style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: '0.6rem', letterSpacing: '0.15em', color: '#fff',
          textTransform: 'uppercase',
        }}>Scroll</div>
        <div style={{
          width: 1, height: 40,
          background: 'linear-gradient(to bottom, #c89b50, transparent)',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}

function NarrativeSection() {
  const stages = [
    {
      year: '2018–2023',
      tag: 'INDUSTRIAL SYSTEMS',
      title: 'Safety-Critical Foundations',
      body: 'Started where bugs cause physical harm. Programmed Fanuc M-10id and Denso VM-Series robotic systems. Wrote ladder logic for Allen-Bradley PLCs with safety interlocks. Wired electrical panels. Learned that in controls engineering, every line of code has consequences measured in steel and speed.',
      accent: '#ef4444',
    },
    {
      year: '2023',
      tag: 'SOFTWARE ENGINEERING',
      title: 'Full-Stack Expansion',
      body: 'Flatiron School, then straight to production — e-commerce platforms, marketing sites, learning management systems. Built the stack from TypeScript and Python to C/C++, covering everything between the browser and the bare metal.',
      accent: '#3b82f6',
    },
    {
      year: '2024–NOW',
      tag: 'CYBERSECURITY + AI',
      title: 'Adversarial Intelligence',
      body: 'B.S. Computer Science, Cybersecurity Concentration at LSU. TestOut Security Pro certified. Building AI-powered document processing systems. Co-founded LSU\'s Web Application Development Club. The adversarial mindset that secures systems is the same mindset needed to verify AI.',
      accent: '#c89b50',
    },
  ];

  return (
    <section id="narrative" style={{
      padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem)',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <RevealSection>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>The Arc</div>
          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400, color: '#fff', margin: 0,
            maxWidth: 700,
          }}>
            From industrial robots to<br />
            <span style={{ fontStyle: 'italic', color: '#c89b50' }}>artificial intelligence.</span>
          </h2>
        </RevealSection>

        <div style={{ marginTop: '4rem' }}>
          {stages.map((s, i) => (
            <RevealSection key={i} delay={i * 0.15}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'clamp(80px, 12vw, 160px) 1fr',
                gap: 'clamp(1rem, 3vw, 3rem)',
                paddingBottom: '3rem',
                marginBottom: '3rem',
                borderBottom: i < stages.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div>
                  <div style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.05em',
                  }}>{s.year}</div>
                  <div style={{
                    width: 32, height: 2, background: s.accent,
                    marginTop: 12, borderRadius: 1,
                  }} />
                </div>
                <div>
                  <div style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.6rem', letterSpacing: '0.15em',
                    color: s.accent, marginBottom: 8, textTransform: 'uppercase',
                  }}>{s.tag}</div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                    fontWeight: 600, color: '#fff', margin: '0 0 1rem 0',
                  }}>{s.title}</h3>
                  <p style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: '0.95rem', lineHeight: 1.8,
                    color: 'rgba(255,255,255,0.5)', margin: 0,
                    maxWidth: 600,
                  }}>{s.body}</p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const [hovered, setHovered] = useState(null);
  const services = [
    {
      num: '01',
      title: 'Software Development',
      subtitle: 'Full-Stack Engineering & E-Commerce',
      items: [
        'Next.js / React production applications',
        'E-commerce platforms (Stripe, Square, Payload CMS)',
        'Python backends (Flask, Django)',
        'Mobile development (React Native, Flutter)',
        'Database architecture & API design',
      ],
      icon: '⚡',
    },
    {
      num: '02',
      title: 'AI & Automation',
      subtitle: 'Agents, Verification & Safety',
      items: [
        'LLM-powered workflow automation',
        'AI agent architecture & document processing',
        'Model evaluation & red-teaming',
        'AI-assisted development training',
        'Safety-critical AI system design',
      ],
      icon: '◆',
    },
    {
      num: '03',
      title: 'Hardware & Repair',
      subtitle: 'Diagnostics, Repair & Custom Builds',
      items: [
        'Computer diagnostics & repair',
        'Component-level board repair & soldering',
        'Custom PC builds & upgrades',
        'Firmware & embedded systems',
        'Industrial controls & PLC programming',
      ],
      icon: '⬡',
    },
    {
      num: '04',
      title: 'Networks & Infrastructure',
      subtitle: 'Setup, Security & Administration',
      items: [
        'Network design & installation',
        'System administration (Linux, Windows Server)',
        'Cloud infrastructure & deployment',
        'Security hardening & monitoring',
        'Remote access & VPN configuration',
      ],
      icon: '⬢',
    },
    {
      num: '05',
      title: 'Training & Consulting',
      subtitle: 'Education, Workshops & Strategy',
      items: [
        'AI-assisted development workshops',
        'Modern web development training',
        'Cybersecurity awareness & best practices',
        'Technical consulting for non-technical teams',
        'Technology strategy & vendor evaluation',
      ],
      icon: '△',
    },
  ];

  return (
    <section id="services" style={{
      padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem)',
      background: 'linear-gradient(180deg, rgba(200,155,80,0.03) 0%, transparent 100%)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <RevealSection>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>Services</div>
          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400, color: '#fff', margin: '0 0 4rem 0',
          }}>
            Whatever the problem,<br />
            <span style={{ fontStyle: 'italic', color: '#c89b50' }}>one call.</span>
          </h2>
        </RevealSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.5rem',
        }}>
          {services.map((s, i) => (
            <RevealSection key={i} delay={i * 0.12}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === i
                    ? 'rgba(200,155,80,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hovered === i ? 'rgba(200,155,80,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                  transition: 'all 0.4s ease',
                  cursor: 'default',
                  height: '100%',
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                }}>
                  <span style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.1em',
                  }}>{s.num}</span>
                  <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>{s.icon}</span>
                </div>
                <h3 style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: '1.3rem', fontWeight: 600,
                  color: '#fff', margin: '0 0 0.3rem 0',
                }}>{s.title}</h3>
                <div style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: '0.65rem', letterSpacing: '0.1em',
                  color: '#c89b50', marginBottom: '1.5rem',
                  textTransform: 'uppercase',
                }}>{s.subtitle}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {s.items.map((item, j) => (
                    <li key={j} style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)',
                      padding: '0.45rem 0',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'rgba(200,155,80,0.4)',
                        flexShrink: 0,
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  const [hovered, setHovered] = useState(null);
  const projects = [
    {
      tag: 'AI + EDUCATION',
      title: 'BRCC Course Override System',
      desc: 'Built through CSC 4700: AI & LLM Development with Henry Hayes and Dr. Keith Mills. Working with the Dean of Engineering to rebuild Baton Rouge Community College\'s course override system. Architecting a custom AI agent for automated document processing, course equivalency lookup, and intelligent form routing.',
      tech: ['Next.js', 'Python', 'LangChain', 'AI Agents'],
      status: 'In Development',
      statusColor: '#4ade80',
    },
    {
      tag: 'E-COMMERCE',
      title: 'L. Ellis Designs',
      desc: 'Production e-commerce platform for a local Baton Rouge business. Next.js frontend with Payload CMS dashboard, product catalog with categories, custom order flow, and Stripe payment management. Live and generating revenue.',
      tech: ['Next.js', 'Payload CMS', 'Stripe', 'Vercel'],
      status: 'Live',
      statusColor: '#c89b50',
      link: 'https://lellisdesigns.com',
    },
    {
      tag: 'EDTECH PLATFORM',
      title: 'Socratic Analytics',
      desc: 'Core developer on a proprietary tutoring and exam intelligence platform. Building question banks, adaptive pacing, timing controls, and performance analytics dashboards.',
      tech: ['Django', 'Python', 'PostgreSQL', 'Analytics'],
      status: 'Live',
      statusColor: '#c89b50',
      link: 'https://socraticanalyticsllc.com',
    },
    {
      tag: 'LOW-LEVEL SYSTEMS',
      title: 'RISC-V Disassembler',
      desc: 'RISC-V instruction set disassembler in C++, translating binary machine code back to human-readable assembly. Computer architecture, instruction encoding, and low-level systems programming.',
      tech: ['C++', 'RISC-V', 'Assembly', 'Systems'],
      status: 'Complete',
      statusColor: '#3b82f6',
      link: 'https://github.com/thecandylane/RISC-V_Disassembler',
    },
    {
      tag: 'AI HACKATHON',
      title: 'ImJustABill',
      desc: 'AI-powered legislative analysis tool built at a hackathon. Uses natural language processing to make government bills accessible and understandable to everyday citizens.',
      tech: ['Python', 'AI/NLP', 'LLM APIs'],
      status: 'Complete',
      statusColor: '#3b82f6',
      link: 'https://github.com/thecandylane/ImJustABill',
    },
    {
      tag: 'FULL-STACK',
      title: 'Candiboard V2',
      desc: 'Full-stack application built with TypeScript, React, Next.js on the frontend and Flask/Python on the backend. The TypeScript + Python dual-stack that defines modern AI-augmented development.',
      tech: ['TypeScript', 'React', 'Next.js', 'Flask'],
      status: 'Complete',
      statusColor: '#3b82f6',
      link: 'https://github.com/thecandylane/Candiboard-V2',
    },
  ];

  return (
    <section id="projects" style={{
      padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <RevealSection>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>Selected Work</div>
          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400, color: '#fff', margin: '0 0 4rem 0',
          }}>
            Projects that <span style={{ fontStyle: 'italic', color: '#c89b50' }}>speak for themselves.</span>
          </h2>
        </RevealSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: '1.5rem',
        }}>
          {projects.map((p, i) => {
            const Wrapper = p.link ? 'a' : 'div';
            const wrapperProps = p.link ? { href: p.link, target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <RevealSection key={i} delay={i * 0.08}>
                <Wrapper
                  {...wrapperProps}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    background: hovered === i ? 'rgba(200,155,80,0.04)' : 'rgba(255,255,255,0.015)',
                    border: `1px solid ${hovered === i ? 'rgba(200,155,80,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    padding: 'clamp(1.5rem, 2.5vw, 2rem)',
                    height: '100%',
                    transition: 'all 0.3s',
                    textDecoration: 'none',
                    cursor: p.link ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <span style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.6rem', letterSpacing: '0.15em',
                      color: '#c89b50', textTransform: 'uppercase',
                    }}>{p.tag}</span>
                    <span style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.6rem', letterSpacing: '0.05em',
                      color: p.statusColor,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: p.statusColor,
                      }} />
                      {p.status}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair), serif",
                    fontSize: '1.25rem', fontWeight: 600,
                    color: '#fff', margin: '0 0 0.75rem 0',
                  }}>{p.title}</h3>
                  <p style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: '0.85rem', lineHeight: 1.75,
                    color: 'rgba(255,255,255,0.45)',
                    margin: '0 0 1.25rem 0', flex: 1,
                  }}>{p.desc}</p>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '1rem',
                    alignItems: 'center',
                  }}>
                    {p.tech.map((t, j) => (
                      <span key={j} style={{
                        fontFamily: "var(--font-jetbrains), monospace",
                        fontSize: '0.6rem', letterSpacing: '0.05em',
                        padding: '4px 10px',
                        background: 'rgba(200,155,80,0.08)',
                        border: '1px solid rgba(200,155,80,0.15)',
                        color: 'rgba(255,255,255,0.5)',
                      }}>{t}</span>
                    ))}
                    {p.link && (
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: "var(--font-jetbrains), monospace",
                        fontSize: '0.6rem', color: '#c89b50',
                        opacity: hovered === i ? 1 : 0,
                        transition: 'opacity 0.3s',
                      }}>→ VIEW</span>
                    )}
                  </div>
                </Wrapper>
              </RevealSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ExpertiseSection() {
  const domains = [
    {
      category: 'Languages',
      items: [
        { name: 'TypeScript / JavaScript', level: 'Primary' },
        { name: 'Python', level: 'Primary' },
        { name: 'C / C++', level: 'Proficient' },
        { name: 'SQL', level: 'Proficient' },
        { name: 'Java', level: 'Working' },
        { name: 'C# / .NET', level: 'Working' },
        { name: 'Assembly / RISC-V', level: 'Academic' },
      ],
    },
    {
      category: 'Frontend',
      items: [
        { name: 'React / Next.js', level: 'Primary' },
        { name: 'Tailwind CSS', level: 'Primary' },
        { name: 'React Native', level: 'Proficient' },
        { name: 'Angular', level: 'Working' },
        { name: 'Flutter / Swift', level: 'Working' },
      ],
    },
    {
      category: 'Backend & Infrastructure',
      items: [
        { name: 'Node.js', level: 'Primary' },
        { name: 'Flask / Django', level: 'Primary' },
        { name: 'MongoDB / PostgreSQL', level: 'Proficient' },
        { name: 'AWS / Azure / Firebase', level: 'Proficient' },
        { name: 'Docker / Linux / SSH', level: 'Proficient' },
      ],
    },
    {
      category: 'AI & Machine Learning',
      items: [
        { name: 'LangChain / LlamaIndex', level: 'Active' },
        { name: 'OpenAI / Claude APIs', level: 'Active' },
        { name: 'TensorFlow / PyTorch', level: 'Working' },
        { name: 'YOLO / OpenCV', level: 'Working' },
        { name: 'pandas / NumPy', level: 'Proficient' },
      ],
    },
    {
      category: 'Hardware & Industrial',
      items: [
        { name: 'Allen-Bradley PLCs', level: 'Professional' },
        { name: 'Studio 5000 Logix', level: 'Professional' },
        { name: 'Fanuc Robotics', level: 'Professional' },
        { name: 'Computer Repair & Diagnostics', level: 'Professional' },
        { name: 'Soldering & Board Repair', level: 'Proficient' },
        { name: 'Raspberry Pi / Embedded', level: 'Proficient' },
        { name: 'Klipper Firmware / 3D Print', level: 'Hobbyist' },
      ],
    },
    {
      category: 'Networking & Systems',
      items: [
        { name: 'Linux Administration', level: 'Proficient' },
        { name: 'Windows Server / Active Directory', level: 'Proficient' },
        { name: 'Network Configuration & Setup', level: 'Proficient' },
        { name: 'SSH / Remote Administration', level: 'Proficient' },
        { name: 'Troubleshooting & Diagnostics', level: 'Professional' },
      ],
    },
    {
      category: 'Security',
      items: [
        { name: 'TestOut Security Pro', level: 'Certified' },
        { name: 'IBM Cloud Core', level: 'Certified' },
        { name: 'Network Security', level: 'Proficient' },
        { name: 'Applied Cryptography', level: 'Academic' },
        { name: 'Mobile Security', level: 'Academic' },
      ],
    },
  ];

  const levelColor = (level) => {
    const map = {
      Primary: '#c89b50', Active: '#c89b50', Professional: '#c89b50', Certified: '#c89b50',
      Proficient: 'rgba(200,155,80,0.6)', Hobbyist: 'rgba(200,155,80,0.6)',
      Working: 'rgba(255,255,255,0.3)', Academic: 'rgba(255,255,255,0.3)',
    };
    return map[level] || 'rgba(255,255,255,0.3)';
  };

  return (
    <section id="expertise" style={{
      padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem)',
      background: 'linear-gradient(180deg, transparent 0%, rgba(200,155,80,0.02) 50%, transparent 100%)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <RevealSection>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
            textTransform: 'uppercase', marginBottom: '1rem',
          }}>Technical Depth</div>
          <h2 style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 400, color: '#fff', margin: '0 0 1rem 0',
          }}>
            The full <span style={{ fontStyle: 'italic', color: '#c89b50' }}>toolkit.</span>
          </h2>
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: '0.95rem', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.45)', maxWidth: 600,
            margin: '0 0 3rem 0',
          }}>
            Primary means daily production use. Working means actively building proficiency.
          </p>
        </RevealSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.5rem',
        }}>
          {domains.map((d, i) => (
            <RevealSection key={i} delay={i * 0.08}>
              <div style={{
                borderTop: '2px solid rgba(200,155,80,0.3)',
                paddingTop: '1.25rem',
              }}>
                <h4 style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: '0.7rem', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
                  margin: '0 0 1rem 0',
                }}>{d.category}</h4>
                {d.items.map((item, j) => (
                  <div key={j} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <span style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)',
                    }}>{item.name}</span>
                    <span style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: '0.55rem', letterSpacing: '0.08em',
                      color: levelColor(item.level),
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      border: `1px solid ${levelColor(item.level)}33`,
                    }}>{item.level}</span>
                  </div>
                ))}
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" style={{
      padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 4vw, 3rem)',
      borderTop: '1px solid rgba(200,155,80,0.1)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <RevealSection>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: 'clamp(2rem, 6vw, 4rem)',
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: '0.7rem', letterSpacing: '0.2em', color: '#c89b50',
                textTransform: 'uppercase', marginBottom: '1rem',
              }}>Get In Touch</div>
              <h2 style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 400, color: '#fff', margin: '0 0 1.5rem 0',
              }}>
                One call for every<br />
                <span style={{ fontStyle: 'italic', color: '#c89b50' }}>tech problem.</span>
              </h2>
              <p style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: '0.95rem', lineHeight: 1.8,
                color: 'rgba(255,255,255,0.45)', maxWidth: 480,
                margin: 0,
              }}>
                Software, hardware, networking, AI, security, training — whatever the
                technology challenge, I handle it personally. Based in Baton Rouge,
                serving businesses, teams, and individuals across Louisiana.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                { label: 'Email', value: 'jschli3@lsu.edu', href: 'mailto:jschli3@lsu.edu' },
                { label: 'Phone', value: '225-572-3924', href: 'tel:2255723924' },
                { label: 'GitHub', value: 'github.com/thecandylane', href: 'https://github.com/thecandylane' },
                { label: 'LinkedIn', value: 'linkedin.com/in/jack-schliewe', href: 'https://linkedin.com/in/jack-schliewe' },
              ].map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', flexDirection: 'column',
                    textDecoration: 'none',
                    padding: '1rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(200,155,80,0.3)';
                    e.currentTarget.style.background = 'rgba(200,155,80,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: '0.6rem', letterSpacing: '0.15em',
                    color: '#c89b50', textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>{c.label}</span>
                  <span style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)',
                  }}>{c.value}</span>
                </a>
              ))}
            </div>
          </div>
        </RevealSection>

        <div style={{
          marginTop: '6rem', paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <span style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.65rem', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
          }}>
            © 2026 JACK SCHLIEWE — BATON ROUGE, LA
          </span>
          <span style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: '0.65rem', letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.35)',
          }}>
            BUILT WITH NEXT.JS
          </span>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <NarrativeSection />
      <ServicesSection />
      <ProjectsSection />
      <ExpertiseSection />
      <ContactSection />
    </main>
  );
}
