import { ChordEntry } from "./chordEntry";
import { ScaleInfo } from "../basics/scaleInfo";
import { PlaceholderArray } from "./placeholderArray";

// Progressionの外部表現。ChordEntry/ScaleInfoにid等の編集セッション固有の情報は含まれない。
// scales[i]はentries[i]とentries[i+1]の関係を表す(視覚的にもi番目とi+1番目の中間にある、
// いわばインデックスが0.5多いイメージ)。
// entries・scalesはともに末尾に未選択(undefined)の要素を1つ持つ状態を正とする。これは
// 「次に追加できる場所」を表すプレースホルダーで、Progression側が常に維持する。
// そのためentriesとscalesの長さは常に一致する。
export type ProgressionValue = {
	readonly entries: readonly (ChordEntry | undefined)[];
	readonly scales: readonly (ScaleInfo | undefined)[];
};

// entriesとscalesの長さを揃える。短い方はplaceholderで埋める。長い方はそのまま返す。
function normalizeLengths(
	entries: PlaceholderArray<ChordEntry>,
	scales: PlaceholderArray<ScaleInfo>,
	createId: () => number
): { entries: PlaceholderArray<ChordEntry>; scales: PlaceholderArray<ScaleInfo> } {
	const length = Math.max(entries.length, scales.length);
	return {
		entries: entries.pad(length, createId),
		scales: scales.pad(length, createId)
	};
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
// entriesとscalesは完全に独立したPlaceholderArrayで、それぞれ別のid列を持つ
// (インデックスの対応関係はProgressionValueのコメントを参照)。
export class Progression {
	readonly entries: PlaceholderArray<ChordEntry>;
	readonly scales: PlaceholderArray<ScaleInfo>;

	private constructor(entries: PlaceholderArray<ChordEntry>, scales: PlaceholderArray<ScaleInfo>) {
		this.entries = entries;
		this.scales = scales;
	}

	private static normalized(
		entries: PlaceholderArray<ChordEntry>,
		scales: PlaceholderArray<ScaleInfo>,
		createId: () => number
	): Progression {
		const normalized = normalizeLengths(entries, scales, createId);
		return new Progression(normalized.entries, normalized.scales);
	}

	static create(value: ProgressionValue, createId: () => number): Progression {
		const entries = PlaceholderArray.fromValues(value.entries, createId);
		const scales = PlaceholderArray.fromValues(value.scales, createId);
		return Progression.normalized(entries, scales, createId);
	}

	get value(): ProgressionValue {
		return {
			entries: this.entries.array.map(entry => entry.value),
			scales: this.scales.array.map(scale => scale.value)
		};
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	sync(value: ProgressionValue, createId: () => number): Progression {
		const currentEntries = this.entries.array;
		const currentScales = this.scales.array;
		if (
			value.entries.length === currentEntries.length &&
			value.scales.length === currentScales.length &&
			value.entries.every((entry, index) => ChordEntry.equals(entry, currentEntries[index].value)) &&
			value.scales.every((scale, index) => ScaleInfo.equals(scale, currentScales[index].value))
		) {
			return this;
		}
		const entries = new PlaceholderArray(
			value.entries.map((entry, index) => ({ id: currentEntries[index]?.id ?? createId(), value: entry }))
		).ensureTrailingPlaceholder(createId);
		const scales = new PlaceholderArray(
			value.scales.map((scale, index) => ({ id: currentScales[index]?.id ?? createId(), value: scale }))
		).ensureTrailingPlaceholder(createId);
		return Progression.normalized(entries, scales, createId);
	}

	// 未選択(プレースホルダー)をindex位置に挿入する。
	insert(index: number, createId: () => number): Progression {
		return Progression.normalized(
			this.entries.insert(index, createId),
			this.scales.insert(index, createId),
			createId
		);
	}

	// シフト操作を可能とするか。shiftボタンを表示するかとして利用。
	canShift(index: number): boolean {
		// 末尾のplaceholderはshiftできない。配列外も当然shiftできない
		if (index < 0 || this.entries.length - 1 <= index) return false;
		// index位置が実データを指している場合もshiftできない
		if (this.entries.array[index].value !== undefined) return false;
		return true;
	}

	shift(index: number, createId: () => number): Progression {
		const newEntries = this.entries.shift(index, createId);
		const newScales = this.scales.shift(index, createId);
		return Progression.normalized(newEntries, newScales, createId);
	}

	setEntry(index: number, entry: ChordEntry | undefined, createId: () => number): Progression {
		const newEntries = this.entries.set(index, entry, createId);
		return Progression.normalized(newEntries, this.scales, createId);
	}

	deleteEntry(index: number, createId: () => number): Progression {
		const newEntries = this.entries.delete(index, createId);
		return Progression.normalized(newEntries, this.scales, createId);
	}

	setScale(index: number, scale: ScaleInfo | undefined, createId: () => number): Progression {
		const newScales = this.scales.set(index, scale, createId);
		return Progression.normalized(this.entries, newScales, createId);
	}

	deleteScale(index: number, createId: () => number): Progression {
		const newScales = this.scales.delete(index, createId);
		return Progression.normalized(this.entries, newScales, createId);
	}
}

// 未指定(placeholder)のscaleは、指定値が見つかるまでindexから前方向に逐次探索し、直前に
// 指定された値を継承する。1つ目のscaleは常に指定されている前提のため、通常この探索は
// 途中で見つかって止まるが、見つからなければundefinedを返す
export function estimateScale(progression: Progression, index: number): ScaleInfo | undefined {
	for (let i = index; i >= 0; i--) {
		const value = progression.scales.array[i]?.value;
		if (value !== undefined) return value;
	}
	return undefined;
}
