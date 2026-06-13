interface StageBannerProps {
  label: string;
  sublabel?: string;
}

export function StageBanner({ label, sublabel }: StageBannerProps) {
  return (
    <div className="brand-pattern stage-banner-surface px-4 pt-4 pb-3">
      <div aria-hidden="true" className="stage-banner-corner">
        <span className="stage-banner-corner__tile stage-banner-corner__tile--lime" />
        <span className="stage-banner-corner__tile stage-banner-corner__tile--violet" />
        <span className="stage-banner-corner__tile stage-banner-corner__tile--navy" />
        <span className="stage-banner-corner__tile stage-banner-corner__tile--blue" />
        <span className="stage-banner-corner__tile stage-banner-corner__tile--mint" />
        <span className="stage-banner-corner__tile stage-banner-corner__tile--red" />
      </div>
      <h1 className="font-display text-[0.8rem] font-bold tracking-[0.32em] brand-accent-text uppercase">
        Mundial 2026
      </h1>
      <p className="mt-0.5 font-display text-2xl font-bold tracking-tight text-white leading-none">
        {label}
      </p>
      {sublabel && <p className="text-xs text-sky-200/75 mt-1">{sublabel}</p>}
    </div>
  );
}
