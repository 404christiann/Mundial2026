import type { Standing } from '@/types/domain';

interface StandingsTableProps {
  standings: Standing[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <table className="w-full border-separate border-spacing-y-1 text-sm font-display tabular-nums">
      <thead>
        <tr>
          <th className="text-left text-sky-200/60 text-xs uppercase tracking-wider">Team</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">P</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">W</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">D</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">L</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">GD</th>
          <th className="text-sky-200/60 text-xs uppercase tracking-wider">Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row, i) => {
          const qualifyingCell = row.qualifying
            ? 'bg-lime-300/[0.14] border-y border-lime-300/25'
            : '';

          return (
            <tr
              key={`${row.team.id ?? row.team.name}-${i}`}
              data-qualifying={row.qualifying ? 'qualifying' : undefined}
              className={row.qualifying ? 'qualifying' : undefined}
            >
              <td className={`py-2 pl-2 pr-2 text-slate-100 ${qualifyingCell} ${row.qualifying ? 'border-l border-lime-300/25' : ''}`}>
                {row.team.name}
              </td>
              {/* P/W/D/L combined to avoid duplicate bare numbers from individual cells */}
              <td colSpan={4} className={`px-2 text-center text-slate-300 ${qualifyingCell}`}>
                {`${row.played} ${row.won}-${row.draw}-${row.lost}`}
              </td>
              <td className={`${qualifyingCell} px-2 ${
                row.goalDifference > 0
                  ? 'text-lime-300'
                  : row.goalDifference < 0
                    ? 'text-red-300'
                    : 'text-slate-400'
              }`}>
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className={`px-2 text-center ${qualifyingCell} ${row.qualifying ? 'border-r border-lime-300/25 font-bold text-yellow-200' : 'text-white'}`}>
                {row.points}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
