interface PitchTextHighlightProps {
  text: string;
  compact?: boolean;
}

export function PitchTextHighlight({ text, compact = false }: PitchTextHighlightProps) {
  const parts = text.split(/(\[[^\]]+\])/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <mark
              key={idx}
              className={
                compact
                  ? 'bg-sky-400/20 text-sky-200 font-medium px-0.5 rounded-[2px]'
                  : 'bg-sky-400/20 text-sky-200 font-semibold px-1.5 py-0.5 rounded'
              }
            >
              {part}
            </mark>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}
