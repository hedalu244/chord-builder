import { Interval, PitchClass } from "../basics/pitch";

// 構成音を表すセル(locked/active)にのみ、そのPitchClassの色を割り当てる。空セルは無色のまま
function toneCellColorStyle(value: number, locked: boolean, active: boolean) {
	if (!locked && !active) return undefined;
	if (locked) {
		return {
			background: `var(--pc-${value}-basic)`,
			borderColor: `var(--pc-${value}-basic)`,
			color: `var(--color-surface)`,
		};
	}
	if (active) {
		return {
			background: `var(--pc-${value}-light)`,
			borderColor: `var(--pc-${value}-dark)`,
			color: `var(--pc-${value}-dark)`,
		};
	}
}

type ToneRowProps = {
	readonly root: PitchClass;
	readonly tones: readonly PitchClass[];
};

// 12音をクロマチック順に並べ、tonesに含まれる音だけを着色して表示する読み取り専用UI。
// 一番左に何を置くか(オフセット)はrootで外部から指定する。スケールには依存しない汎用的な構成音プレビューとして、他のUIからも再利用できる
export function ToneRow(props: ToneRowProps) {
	const { root, tones } = props;
	const activeValues = new Set(tones.map(tone => tone.value));
	return (
		<div className="tone-row">
			{Interval.all.map(interval => {
				const pitchClass = root.add(interval);
				const active = activeValues.has(pitchClass.value);
				const classNames = ["tone-row__cell"];
				if (active) classNames.push("tone-row__cell--active");
				const style = toneCellColorStyle(pitchClass.value, false, active);
				return (
					<span key={interval.value} className={classNames.join(" ")} style={style}>
						{pitchClass.toString()}
					</span>
				);
			})}
		</div>
	);
}

type EditableToneRowProps = {
	readonly root: PitchClass;
	readonly activeValues: ReadonlySet<number>;
	readonly lockedValues?: ReadonlySet<number>;
	readonly onChange: (nextActiveValues: ReadonlySet<number>) => void;
};

// ToneRowと見た目のセルを共有するが、rootからの相対音程(Interval)の順に12音を並べ、
// チェックボックスによる選択/固定(locked)状態の編集を行う。コードスケール編集専用のUIで、汎用化はしない。
// どの値をトグルしたかではなく、トグル後のactiveValues全体を呼び出し側に通知する(呼び出し側は集合演算を持たない)
export function EditableToneRow(props: EditableToneRowProps) {
	const { root, activeValues, lockedValues, onChange } = props;

	const handleToggle = (value: number): void => {
		if (lockedValues?.has(value)) return;
		const next = new Set(activeValues);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		onChange(next);
	};

	return (
		<div className="tone-row">
			{Interval.all.map(interval => {
				const value = interval.value;
				const locked = lockedValues?.has(value) ?? false;
				const active = activeValues.has(value);
				const classNames = ["tone-row__cell"];
				if (locked) classNames.push("tone-row__cell--locked");
				else if (active) classNames.push("tone-row__cell--active");
				const label = root.add(interval).toString();
				const style = toneCellColorStyle(value, locked, active);
				return (
					<label key={value} className={classNames.join(" ")} style={style}>
						<input type="checkbox" checked={active} disabled={locked} onChange={() => handleToggle(value)} />
						<span>{label}</span>
					</label>
				);
			})}
		</div>
	);
}
