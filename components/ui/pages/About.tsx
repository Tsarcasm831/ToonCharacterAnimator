import React, { useEffect, useMemo, useState } from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import './about.css';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

const TypewriterText: React.FC<{ text: string; delay?: number; onComplete?: () => void }> = ({
    text,
    delay = 30,
    onComplete,
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, delay);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, delay, text, onComplete]);

    return <>{displayedText}</>;
};

const Badge: React.FC<{ color: 'cyan' | 'emerald' | 'amber' | 'blue'; children: React.ReactNode }> = ({ color, children }) => {
    const palette = {
        cyan: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40',
        emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
        amber: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
        blue: 'bg-blue-500/15 text-blue-200 border-blue-500/40',
    } as const;
    return (
        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-full ${palette[color]}`}>
            {children}
        </span>
    );
};

export const About: React.FC = () => {
    const isIphoneLayout = useIsIphoneLayout();
    const datastream = useMemo(
        () => [
            { text: 'Initializing secure uplink...', status: 'OK', delay: 400 },
            { text: 'Packet sniffer active: intercepting regional traffic...', status: 'OK', delay: 300 },
            { text: 'Signal locked. Routing through orbital relay [GEO-SYNC-04]', status: 'WAIT', delay: 800 },
            { text: 'ERR: Quantum decoherence detected in Node-7. Re-routing...', status: 'RETRY', delay: 1200 },
            { text: 'Establishing handshake with neural-net node...', status: 'OK', delay: 600 },
            { text: 'Accessing encrypted archives [LEVEL 7 CLEARANCE]', status: 'AUTH', delay: 1000 },
            { text: 'Bypassing biometric firewall... [94% SUCCESS]', status: 'BYPASS', delay: 700 },
            { text: 'Routing credentials: @lordtsarcasm', status: 'OK', delay: 500 },
            { text: 'Searching dossier database for "Anton Vasilyev"...', status: 'SEARCH', delay: 1200 },
            { text: 'Match found. Decrypting personality matrix...', status: 'PROCESS', delay: 1500 },
            { text: 'Injecting dossier into local buffer...', status: 'LOAD', delay: 900 },
            { text: 'Warning: Unidentified trace detected on uplink.', status: 'ALERT', delay: 600 },
            { text: 'COMPILING DOSSIER: LORD TSARCASM', status: 'COMPLETE', delay: 400 },
        ],
        []
    );

    const dossierSections = useMemo(
        () => [
            {
                title: 'Identity Assessment [DECRYPTING...]',
                items: [
                    { label: 'Primary Alias', value: 'Lord Tsarcasm' },
                    {
                        label: 'Legal Name',
                        value: (
                            <span className="redacted group inline-flex items-center gap-2">
                                <span className="redacted-label">[REDACTED]</span>
                                <span className="true-name">Anton Vasilyev</span>
                            </span>
                        ),
                    },
                    {
                        label: 'Psych Profile',
                        value: 'INFJ (The Architect / The Agitator). Empath core with analytical shell; prone to spirals and bursts of creation.',
                    },
                    {
                        label: 'Personal Log',
                        value: (
                            <span>
                                "I make stuff because I have to — songs, stories, games, whatever helps me make sense of things. Writing helps me
                                sort the noise, singing reminds me I’m still here, and building worlds is how I stay connected when real life feels too
                                far away. I’m constantly stuck somewhere between fixing myself and falling apart again. If you’re reading this, you probably
                                get it. Stick around if you want — there’s room here for all the in-between."
                            </span>
                        ),
                        fullWidth: true,
                    },
                ],
            },
            {
                title: 'Operational Directives [ACTIVE]',
                items: [
                    { label: 'Primary Function', value: 'Narrative Weaver. Building worlds from code, chaos, and caffeine.' },
                    { label: 'Secondary Function', value: 'Sonic Alchemist. Transmuting noise into anthems for the digital ghost.' },
                    { label: 'Tertiary Function', value: 'Community Conduit. Forging connections in the static between worlds.' },
                ],
            },
            {
                title: 'Core Matrix (Influences) [SOURCE_LOAD]',
                items: [
                    {
                        label: 'Sonic Imprints',
                        value: (
                            <ul className="space-y-2 list-none">
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Heavy Metal</li>
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Industrial</li>
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Cinematic Scores</li>
                            </ul>
                        ),
                    },
                    {
                        label: 'Literary/Visual Schema',
                        value: (
                            <ul className="space-y-2 list-none">
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Dark Fantasy & Cyberpunk</li>
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Dystopian Cinema</li>
                                <li className="relative pl-4 before:absolute before:left-0 before:text-cyan-300 before:content-['>']">Anime (e.g., Naruto)</li>
                            </ul>
                        ),
                        fullWidth: true,
                    },
                ],
            },
            {
                title: 'Status & Anomalies [ANALYZING...]',
                items: [
                    {
                        label: 'Current State',
                        value: 'Stable, fluctuating between focused output and system introspection.',
                    },
                    {
                        label: 'Known Anomaly',
                        value: "'Resting Bitch Face' protocol is passive default; not indicative of internal state.",
                    },
                    {
                        label: 'Central Paradox',
                        value: 'Seeks deep connection while requiring operational solitude — walking contradiction.',
                        fullWidth: true,
                    },
                ],
            },
        ],
        []
    );

    const [streamStep, setStreamStep] = useState(0);
    const [showContent, setShowContent] = useState(false);
    const [datastreamVisible, setDatastreamVisible] = useState(true);
    const [revealDossier, setRevealDossier] = useState(false);

    const panelClassName = isIphoneLayout
        ? 'about-panel w-full max-w-[94vw] bg-slate-950/80 border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden'
        : 'about-panel w-full max-w-6xl bg-slate-950/80 border border-cyan-500/30 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden';
    const headerClassName = isIphoneLayout
        ? 'px-5 py-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10'
        : 'px-8 md:px-12 py-10 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10';
    const contentClassName = isIphoneLayout ? 'px-5 py-6 space-y-6' : 'px-6 md:px-12 py-10 space-y-8';

    useEffect(() => {
        // Reset sequence on mount so the animation always plays when entering the page
        setStreamStep(0);
        setShowContent(false);
        setDatastreamVisible(true);
        setRevealDossier(false);
    }, []);

    useEffect(() => {
        let currentStep = 0;
        const processStream = () => {
            if (currentStep < datastream.length) {
                const step = datastream[currentStep];
                const timer = setTimeout(() => {
                    setStreamStep(currentStep + 1);
                    currentStep++;
                    processStream();
                }, step.delay);
                return timer;
            }
        };

        const timer = processStream();
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [datastream]);

    useEffect(() => {
        if (streamStep === datastream.length) {
            const t = setTimeout(() => setShowContent(true), 800);
            return () => clearTimeout(t);
        }
    }, [datastream.length, streamStep]);

    useEffect(() => {
        if (showContent) {
            const hideTimer = setTimeout(() => setDatastreamVisible(false), 4000);
            const dossierTimer = setTimeout(() => setRevealDossier(true), 4600);
            return () => {
                clearTimeout(hideTimer);
                clearTimeout(dossierTimer);
            };
        }
    }, [showContent]);

    return (
        <div className="about-page w-full h-full flex flex-col items-center justify-start relative">
            <div className="w-full flex-1 bg-slate-950 border-x border-t border-white/10 shadow-2xl overflow-hidden relative">
                <MenuBackground />

                <div className="absolute inset-0 z-10 flex items-center justify-center p-5 md:p-10">
                    <div className={panelClassName}>
                        <div className={`about-header ${headerClassName}`}>
                            <div className={`about-kicker flex flex-col gap-2 text-cyan-200/80 font-mono uppercase ${isIphoneLayout ? 'text-[11px] tracking-[0.3em]' : 'text-sm md:text-base tracking-[0.35em]'}`}>
                                <span className="text-cyan-200/80">@lordtsarcasm</span>
                                <span>Transmission Log: Identity</span>
                            </div>
                            <h1 className={`about-title mt-4 font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.45)] ${isIphoneLayout ? 'text-3xl' : 'text-4xl md:text-5xl'}`}>
                                Lord Tsarcasm
                            </h1>
                            <p className={`about-subtitle mt-3 text-slate-300 max-w-3xl leading-relaxed ${isIphoneLayout ? 'text-sm' : 'text-sm md:text-base'}`}>
                                Hi I’m Anton and welcome to LordTsarcasm.com — I build all manner of crazy to realize a dream. I’m a vibe coder
                                who could use “real” tools but prefers the chaos. Check out the AI music, game, and experiments while the signal holds.
                            </p>
                        </div>

                        <div className={contentClassName}>
                            <div
                                className={`border border-cyan-500/20 bg-black/40 rounded-2xl p-5 md:p-8 shadow-inner shadow-cyan-500/10 transition-all duration-500 ${
                                    datastreamVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none absolute'
                                }`}
                            >
                                <h2 className={`text-center font-black text-cyan-200 tracking-wide mb-5 ${isIphoneLayout ? 'text-xl' : 'text-2xl'}`}>
                                    Datastream
                                </h2>
                                <div className={`space-y-2 text-left font-mono text-slate-300 ${isIphoneLayout ? 'text-[11px]' : 'text-xs md:text-sm'}`}>
                                    {datastream.map((line, idx) => (
                                        <div
                                            key={idx}
                                            className={`datastream-line flex items-center justify-between transition-all duration-300 ${
                                                idx < streamStep ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-cyan-500 font-bold shrink-0">[{idx.toString().padStart(2, '0')}]</span>
                                                <span className="text-cyan-100/90">
                                                    {idx < streamStep - 1 ? (
                                                        line.text
                                                    ) : idx === streamStep - 1 ? (
                                                        <TypewriterText text={line.text} delay={20} />
                                                    ) : (
                                                        ''
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`h-px bg-cyan-500/20 hidden sm:block ${isIphoneLayout ? 'w-8' : 'w-8 md:w-16'}`}></span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${
                                                    line.status === 'OK' || line.status === 'COMPLETE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    line.status === 'WAIT' || line.status === 'PROCESS' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                                                    line.status === 'AUTH' || line.status === 'BYPASS' ? 'bg-blue-500/20 text-blue-400' :
                                                    line.status === 'RETRY' || line.status === 'ALERT' ? 'bg-red-500/20 text-red-400 animate-bounce' :
                                                    'bg-cyan-500/20 text-cyan-400'
                                                }`}>
                                                    {line.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {showContent && (
                                    <div className={`mt-6 text-left text-slate-200 leading-relaxed space-y-2 ${isIphoneLayout ? 'text-sm' : 'text-sm md:text-base'}`}>
                                        <p>
                                            Bio uplink complete. Vibe-coding node online: songs, stories, games, worlds — built fast, loud, and honest.
                                        </p>
                                        <p>
                                            Data stream may glitch; that’s part of the charm. Stay tuned for incoming drops.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {revealDossier && (
                                <div className="border border-cyan-500/20 bg-black/50 rounded-2xl p-5 md:p-8 shadow-inner shadow-blue-500/10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-cyan-400 text-xs font-mono uppercase tracking-[0.3em]"># dossier</span>
                                        <div className="h-px flex-1 bg-cyan-500/30" />
                                    </div>

                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${isIphoneLayout ? 'gap-4' : ''}`}>
                                        {dossierSections.map((section, sIdx) => (
                                            <div
                                                key={section.title}
                                                className={`dossier-card md:col-span-2 border border-white/5 bg-white/5 rounded-2xl p-4 md:p-6 transition-all duration-500 ${
                                                    revealDossier ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                                }`}
                                                style={{ animationDelay: `${sIdx * 120}ms`, transitionDelay: `${sIdx * 120}ms` }}
                                            >
                                                <h3 className={`flex items-center gap-3 text-cyan-200 font-black uppercase tracking-wide mb-4 ${isIphoneLayout ? 'text-base' : 'text-lg'}`}>
                                                    <span className="text-cyan-400/70 font-mono text-xs">[{sIdx + 1}]</span>
                                                    {section.title}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {section.items.map((item) => (
                                                        <div
                                                            key={item.label}
                                                            className={`dossier-entry border-l-4 border-cyan-400/60 bg-black/40 rounded-xl px-4 py-3 transition-all duration-500 ${
                                                                revealDossier ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                                                            } ${item.fullWidth ? 'md:col-span-2' : ''}`}
                                                            style={{ animationDelay: `${sIdx * 120 + 80}ms` }}
                                                        >
                                                            <span className="block text-[11px] uppercase tracking-[0.25em] text-cyan-200/80 font-black">
                                                                {item.label}
                                                            </span>
                                                            <span className="block mt-2 text-sm md:text-base text-slate-100 leading-relaxed font-mono">
                                                                {item.value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-slate-400 text-xs uppercase tracking-[0.3em]">
                                <p className="font-black">Built with React • Three.js • Custom animation stack</p>
                                <p className="font-mono text-[11px] text-cyan-200">v1.0.0 • Toon Character Animator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
