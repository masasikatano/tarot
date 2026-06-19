interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function WorryInput({ value, onChange }: Props) {
  return (
    <div className="worry-panel">
      <div className="worry-input">
        <label htmlFor="worry" className="worry-label">
          タロットに聞きたいこと
        </label>
        <textarea
          id="worry"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="気になることや悩みがあれば、ここに書いてください（任意）"
          className="worry-textarea"
          rows={2}
          maxLength={1000}
        />
      </div>
    </div>
  );
}
