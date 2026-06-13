import { describe, it, expect } from 'vitest';
import { detectStage, formatStageLabel } from '@/lib/stage';
import { makeMatch, makeFinishedMatch } from '../fixtures';
import type { Match } from '@/types/domain';

function groupMatches(count: number, matchday: number, status: Match['status'] = 'TIMED'): Match[] {
  return Array.from({ length: count }, (_, i) =>
    makeMatch({ id: i + 1, stage: 'GROUP_STAGE', matchday, status, isLive: status === 'IN_PLAY' })
  );
}

describe('detectStage', () => {
  it('returns GROUP_STAGE when some matchday-1 matches are not FINISHED', () => {
    const matches = [
      makeFinishedMatch({ stage: 'GROUP_STAGE', matchday: 1 }),
      makeMatch({ stage: 'GROUP_STAGE', matchday: 1, status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('GROUP_STAGE');
    expect(ctx.stageLabel).toBe('Group Stage');
    expect(ctx.defaultTab).toBe('schedule');
  });

  it('keeps the label stage-only when all matchday-1 matches are finished', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeFinishedMatch({ id: 2, stage: 'GROUP_STAGE', matchday: 1 }),
      makeMatch({ id: 3, stage: 'GROUP_STAGE', matchday: 2, status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('GROUP_STAGE');
    expect(ctx.stageLabel).toBe('Group Stage');
  });

  it('keeps the label stage-only when only postponed matchday-1 matches remain', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeMatch({ id: 2, stage: 'GROUP_STAGE', matchday: 1, status: 'POSTPONED' }),
      makeMatch({ id: 3, stage: 'GROUP_STAGE', matchday: 2, status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('GROUP_STAGE');
    expect(ctx.stageLabel).toBe('Group Stage');
  });

  it('returns ROUND_OF_32 when all group matches are finished and R32 exists', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeMatch({ id: 2, stage: 'ROUND_OF_32', matchday: null, status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('ROUND_OF_32');
    expect(ctx.defaultTab).toBe('bracket');
  });

  it('returns QUARTER_FINALS when R32 and R16 are all finished', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeFinishedMatch({ id: 2, stage: 'ROUND_OF_32' }),
      makeFinishedMatch({ id: 3, stage: 'ROUND_OF_16' }),
      makeMatch({ id: 4, stage: 'QUARTER_FINALS', status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('QUARTER_FINALS');
    expect(ctx.defaultTab).toBe('bracket');
  });

  it('returns FINAL when only final match is not finished', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeFinishedMatch({ id: 2, stage: 'ROUND_OF_32' }),
      makeFinishedMatch({ id: 3, stage: 'ROUND_OF_16' }),
      makeFinishedMatch({ id: 4, stage: 'QUARTER_FINALS' }),
      makeFinishedMatch({ id: 5, stage: 'SEMI_FINALS' }),
      makeMatch({ id: 6, stage: 'FINAL', status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('FINAL');
    expect(ctx.defaultTab).toBe('bracket');
  });

  it('returns FINAL with defaultTab bracket when everything including FINAL is finished', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeFinishedMatch({ id: 2, stage: 'ROUND_OF_32' }),
      makeFinishedMatch({ id: 3, stage: 'FINAL' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('FINAL');
    expect(ctx.defaultTab).toBe('bracket');
  });

  it('ignores POSTPONED matches when determining stage completion', () => {
    const matches = [
      makeFinishedMatch({ id: 1, stage: 'GROUP_STAGE', matchday: 1 }),
      makeMatch({ id: 2, stage: 'GROUP_STAGE', matchday: 1, status: 'POSTPONED' }),
      makeMatch({ id: 3, stage: 'ROUND_OF_32', status: 'TIMED' }),
    ];
    const ctx = detectStage(matches);
    expect(ctx.currentStage).toBe('ROUND_OF_32');
  });

  it('returns safe default (GROUP_STAGE, schedule) for empty match list', () => {
    const ctx = detectStage([]);
    expect(ctx.currentStage).toBe('GROUP_STAGE');
    expect(ctx.defaultTab).toBe('schedule');
    expect(ctx.stageLabel).toBe('Group Stage');
  });

  it('defaultTab is schedule during GROUP_STAGE', () => {
    const matches = groupMatches(3, 1, 'TIMED');
    expect(detectStage(matches).defaultTab).toBe('schedule');
  });

  it('defaultTab is bracket during all knockout stages', () => {
    const knockoutStages = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'] as const;
    for (const stage of knockoutStages) {
      const matches = [makeMatch({ stage, status: 'TIMED', matchday: null })];
      expect(detectStage(matches).defaultTab).toBe('bracket');
    }
  });
});

describe('formatStageLabel', () => {
  it('formats GROUP_STAGE without matchday text', () => {
    expect(formatStageLabel('GROUP_STAGE', 1)).toBe('Group Stage');
    expect(formatStageLabel('GROUP_STAGE', 2)).toBe('Group Stage');
    expect(formatStageLabel('GROUP_STAGE', null)).toBe('Group Stage');
  });

  it('formats ROUND_OF_32', () => {
    expect(formatStageLabel('ROUND_OF_32', null)).toBe('Round of 32');
  });

  it('formats ROUND_OF_16', () => {
    expect(formatStageLabel('ROUND_OF_16', null)).toBe('Round of 16');
  });

  it('formats QUARTER_FINALS', () => {
    expect(formatStageLabel('QUARTER_FINALS', null)).toBe('Quarter Finals');
  });

  it('formats SEMI_FINALS', () => {
    expect(formatStageLabel('SEMI_FINALS', null)).toBe('Semi Finals');
  });

  it('formats THIRD_PLACE', () => {
    expect(formatStageLabel('THIRD_PLACE', null)).toBe('Third Place');
  });

  it('formats FINAL', () => {
    expect(formatStageLabel('FINAL', null)).toBe('Final');
  });

  it('formats GROUP_STAGE without matchday gracefully', () => {
    const label = formatStageLabel('GROUP_STAGE', null);
    expect(label).toContain('Group Stage');
  });
});
