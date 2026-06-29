'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { BracketRound } from '@/types/domain';
import { buildRadialBracketLayout, type RadialEdge, type RadialNode } from '@/lib/radialLayout';
import { MatchCard } from '@/components/match/MatchCard';

interface RadialBracketViewProps {
  rounds: BracketRound[];
}

function edgePoints(edge: RadialEdge) {
  return `${edge.child.x},${edge.child.y} ${edge.shoulder.x},${edge.shoulder.y} ${edge.parent.x},${edge.parent.y}`;
}

function teamInitials(name: string, tla: string) {
  if (tla) return tla.slice(0, 3);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');
}

export function RadialBracketView({ rounds }: RadialBracketViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const thirdPlace = rounds.find(round => round.stage === 'THIRD_PLACE')?.matches[0] ?? null;

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    const measure = () => {
      const width = node.getBoundingClientRect().width || node.clientWidth || 375;
      setContainerWidth(width);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => buildRadialBracketLayout(rounds, containerWidth),
    [rounds, containerWidth],
  );

  const defaultEntryEdges = layout.entryEdges.filter(edge => !edge.isWinnerPath);
  const winnerEntryEdges = layout.entryEdges.filter(edge => edge.isWinnerPath);
  const defaultEdges = layout.edges.filter(edge => !edge.isWinnerPath);
  const winnerEdges = layout.edges.filter(edge => edge.isWinnerPath);
  const visibleParticipants = layout.participants.filter(node => !node.isTBD);
  const entryJunctions = layout.entryEdges.filter((_, index) => index % 2 === 0);
  const visibleDots = layout.dots.filter(dot => dot.stage !== 'FINAL');
  const ready = containerWidth > 0;
  const trophyHeight = Math.max(44, layout.crestSize * 2.25);
  const trophyWidth = trophyHeight * 0.41;
  const trophyYOffset = trophyHeight * 0.065;
  const haloSize = Math.max(64, layout.crestSize * 2.8);
  const selectedNode = [...layout.crests, ...visibleParticipants].find(node => node.key === selectedNodeKey) ?? null;

  const toggleTooltip = (node: RadialNode) => {
    if (!node.team) return;
    setSelectedNodeKey(current => current === node.key ? null : node.key);
  };

  return (
    <div className="px-4 py-4">
      {layout.allEmpty && (
        <p className="mx-auto mb-4 max-w-sm rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-sky-100/70">
          Bracket fills in after the group stage
        </p>
      )}

      <div
        ref={wrapperRef}
        className="relative mx-auto aspect-square w-full max-w-[560px]"
        data-testid="radial-bracket"
      >
        {ready && (
          <>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              width={layout.size}
              height={layout.size}
              viewBox={`0 0 ${layout.size} ${layout.size}`}
            >
              <defs>
                <filter id="bracket-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#12e4c7" floodOpacity="0.9" />
                </filter>
              </defs>

              {[...defaultEntryEdges, ...defaultEdges].map(edge => (
                <polyline
                  key={edge.key}
                  points={edgePoints(edge)}
                  stroke="#12e4c7"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {[...winnerEntryEdges, ...winnerEdges].map(edge => (
                <polyline
                  key={edge.key}
                  points={edgePoints(edge)}
                  stroke="#12e4c7"
                  strokeOpacity="1"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#bracket-glow)"
                />
              ))}

              {entryJunctions.map(edge => (
                <circle
                  key={`entry-junction-${edge.key}`}
                  cx={edge.parent.x}
                  cy={edge.parent.y}
                  r="3"
                  fill="#12e4c7"
                  opacity="1"
                />
              ))}

              {visibleDots.map(dot => (
                <circle
                  key={dot.key}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.size / 2}
                  fill="#12e4c7"
                  opacity="1"
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute inset-0">
              {layout.crests.map(crest => (
                <motion.div
                  key={crest.key}
                  data-testid={crest.isTBD ? 'radial-tbd' : 'radial-crest'}
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: crest.x,
                    top: crest.y,
                    width: crest.size,
                    height: crest.size,
                  }}
                  initial={reduce ? { opacity: crest.isTBD ? 0.5 : 1, scale: 1, x: '-50%', y: '-50%' } : { opacity: 0, scale: 0.6, x: '-50%', y: '-50%' }}
                  animate={{ opacity: crest.isTBD ? 0.5 : 1, scale: 1, x: '-50%', y: '-50%' }}
                  transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : crest.slot * 0.025 }}
                >
                  {crest.isTBD ? (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-black/40 text-xs font-semibold text-white/40 ring-1 ring-white/10">
                      ?
                    </div>
                  ) : (
                    <TeamTooltipButton
                      node={crest}
                      selected={selectedNodeKey === crest.key}
                      onToggle={toggleTooltip}
                      labelClassName={crest.isEliminated ? 'grayscale saturate-0 brightness-75 ring-white/8' : 'ring-white/15'}
                    />
                  )}
                </motion.div>
              ))}

              {visibleParticipants.map(node => (
                <motion.div
                  key={node.key}
                  data-testid="radial-participant"
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.size,
                    height: node.size,
                  }}
                  initial={reduce ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { opacity: 0, scale: 0.72, x: '-50%', y: '-50%' }}
                  animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                  transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : 0.2 + node.slot * 0.02 }}
                >
                  <TeamTooltipButton
                    node={node}
                    selected={selectedNodeKey === node.key}
                    onToggle={toggleTooltip}
                    labelClassName={node.isEliminated ? 'grayscale saturate-0 brightness-75 ring-white/15 shadow-none' : 'ring-cyan-200/50 shadow-[0_0_12px_rgba(18,228,199,0.28)]'}
                    compact
                  />
                </motion.div>
              ))}

              <div
                aria-hidden="true"
                className="absolute"
                style={{
                  left: layout.center.x,
                  top: layout.center.y - trophyYOffset,
                  width: haloSize,
                  height: haloSize,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.div
                  className="h-full w-full rounded-full blur-md"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,209,102,0.45) 0%, rgba(255,209,102,0) 70%)',
                  }}
                  initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.65 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute leading-none drop-shadow-[0_0_18px_rgba(255,209,102,0.75)]"
                style={{
                  left: layout.center.x,
                  top: layout.center.y - trophyYOffset,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.img
                  src="/assets/world-cup-trophy.png"
                  alt=""
                  className="object-contain drop-shadow-[0_0_18px_rgba(255,209,102,0.95)]"
                  style={{
                    width: trophyWidth,
                    height: trophyHeight,
                  }}
                  initial={reduce ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.82, y: trophyHeight * 0.08 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {layout.rings.map(ring => (
                <motion.div
                  key={ring.stage}
                  className="absolute rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/80"
                  style={{
                    left: ring.labelX,
                    top: ring.labelY,
                    transform: 'translate(-50%, -50%)',
                  }}
                  initial={false}
                  animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
                  transition={reduce ? { duration: 0 } : { duration: 3, times: [0, 0.13, 0.66, 1] }}
                >
                  {ring.label}
                </motion.div>
              ))}

              {selectedNode?.team && (
                <TeamTooltip node={selectedNode} layoutSize={layout.size} />
              )}
            </div>
          </>
        )}
      </div>

      <section className="mx-auto mt-6 max-w-sm" aria-label="Third Place">
        <h3 className="font-display mb-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-200/55">
          Third Place
        </h3>
        {thirdPlace ? (
          <MatchCard match={thirdPlace} showDate />
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-cyan-300/25 bg-white/[0.03] p-4 text-center text-sm text-sky-100/60">
            Third place match - TBD
          </div>
        )}
      </section>
    </div>
  );
}

interface TeamTooltipButtonProps {
  node: RadialNode;
  selected: boolean;
  onToggle: (node: RadialNode) => void;
  labelClassName: string;
  compact?: boolean;
}

function TeamTooltipButton({ node, selected, onToggle, labelClassName, compact = false }: TeamTooltipButtonProps) {
  if (!node.team) return null;

  return (
    <button
      type="button"
      aria-label={node.team.name}
      aria-describedby={selected ? `${node.key}-tooltip` : undefined}
      className="pointer-events-auto relative flex h-full w-full items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-200/80"
      onClick={() => onToggle(node)}
    >
      <span className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black/70 text-[0.55rem] font-black text-cyan-100 ring-1 ${labelClassName}`}>
        {node.team.crest ? (
          <img src={node.team.crest} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{teamInitials(node.team.name, node.team.tla)}</span>
        )}
      </span>
    </button>
  );
}

interface TeamTooltipProps {
  node: RadialNode;
  layoutSize: number;
}

function TeamTooltip({ node, layoutSize }: TeamTooltipProps) {
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);

  useLayoutEffect(() => {
    const width = tooltipRef.current?.offsetWidth ?? 0;
    setTooltipWidth(width);
  }, [node.team?.name]);

  if (!node.team) return null;

  const halfWidth = (tooltipWidth || 74) / 2;
  const left = Math.min(Math.max(node.x, halfWidth + 8), layoutSize - halfWidth - 8);
  const showAbove = node.y > 56;
  const top = showAbove ? node.y - node.size / 2 - 8 : node.y + node.size / 2 + 8;

  return (
    <span
      ref={tooltipRef}
      id={`${node.key}-tooltip`}
      role="tooltip"
      className="pointer-events-none absolute z-[80] whitespace-nowrap rounded-full border border-cyan-200/30 bg-black/90 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-cyan-100 shadow-[0_0_18px_rgba(18,228,199,0.25)] backdrop-blur-md"
      style={{
        left,
        top,
        transform: showAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      }}
    >
      {node.team.name}
    </span>
  );
}
