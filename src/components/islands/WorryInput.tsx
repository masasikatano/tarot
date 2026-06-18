interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function WorryInput({ value, onChange }: Props) {
  return (
    <div className="worry-input">
      {/* <label htmlFor="worry" className="worry-label">
        
      </label> */}
      <textarea
        id="worry"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="タロットに聞きたいことがあれば記入（任意）"
        className="worry-textarea"
        rows={1}
        maxLength={1000}
      />
    </div>
  );
}
