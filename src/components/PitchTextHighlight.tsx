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
                  ? 'bg-[#F28C38]/15 text-[#9A3412] font-medium px-0.5 rounded-[2px]'
                  : 'bg-[#F28C38]/15 text-[#9A3412] font-semibold px-1 py-0.5 rounded'
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
