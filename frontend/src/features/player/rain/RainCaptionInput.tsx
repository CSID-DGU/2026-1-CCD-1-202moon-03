interface RainCaptionInputProps {
  beforeText: string;
  afterText: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

function RainCaptionInput({
  beforeText,
  afterText,
  value,
  placeholder,
  onChange,
  onSubmit,
}: RainCaptionInputProps) {
  return (
    <form
      className="flex items-center gap-[9px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-[22px] font-semibold leading-[1.5] text-white">{beforeText}</p>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? ''}
        className="w-[100px] rounded-[8px] border border-[#032E4E] bg-white px-[14px] py-[8px] text-center font-semibold leading-[1.5] text-[#15171C] outline-none placeholder:text-[#9CA3AF]"
      />
      <p className="text-[22px] font-semibold leading-[1.5] text-white">{afterText}</p>
    </form>
  );
}

export default RainCaptionInput;
