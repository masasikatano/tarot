interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function WorryInput({ value, onChange }: Props) {
  return (
    <div className="worry-input">
      <label htmlFor="worry" className="worry-label">
        悩みや状況があれば、ここに書いてください
      </label>
      <textarea
        id="worry"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例：最近仕事の方向性に迷っていて…"
        className="worry-textarea"
        rows={3}
        maxLength={1000}
      />
    </div>
  );
}
