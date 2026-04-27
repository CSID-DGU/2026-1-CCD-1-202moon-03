interface TypingInputProps {
  value: string;
  onChange: (value: string) => void;
}

function TypingInput({ value, onChange }: TypingInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm uppercase tracking-[0.3em] text-emerald-300">Typing Input</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type the falling keyword here"
        className="w-full rounded-[16px] border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition-colors focus:border-emerald-400"
      />
    </label>
  );
}

export default TypingInput;
