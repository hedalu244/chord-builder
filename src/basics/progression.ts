import { Chord } from "./chord";
import { ContextScale } from "./contextScale";
import { Interval } from "./pitch";

// Progressionの外部表現(1コード分)。編集セッション中のみ意味を持つid/contextScaleは含まない
export type ChordEntry = {
	readonly chord: Chord;
	// undefined(または空配列) = デフォルトスケール(コード構成音のみ)。それ以外はコード構成音に追加する音(スケールルートからの半音値)
	readonly extraChordScaleTones: readonly Interval[] | undefined;
};

export type ProgressionChord = {
	readonly id: number;
	readonly entry: ChordEntry | undefined; // undefinedはまだ何も選ばれていない状態(プレースホルダー)を意味する
	// このコードの直後との関係を表すコンテクストスケール。undefinedは未選択(自動)を意味する。末尾要素では常にundefined。
	readonly contextScale: ContextScale | undefined;
};

function chordEntryEquals(a: ChordEntry | undefined, b: ChordEntry | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	if (!a.chord.equals(b.chord)) return false;
	const tones = a.extraChordScaleTones ?? [];
	const otherTones = b.extraChordScaleTones ?? [];
	if (tones.length !== otherTones.length) return false;
	return tones.every((tone, i) => tone.equals(otherTones[i]));
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
// idとcontextScaleは編集セッション内だけの付随情報だが、配列がシフトする操作(insertChord/removeItem)では
// 対応するChordEntryと一緒に動く必要があるため、あえて1つのitem配列にまとめて持たせている。
export class Progression {
	readonly items: readonly ProgressionChord[];

	private constructor(items: readonly ProgressionChord[]) {
		this.items = items;
	}

	static create(value: readonly (ChordEntry | undefined)[], createId: () => number): Progression {
		return new Progression(value.map(entry => ({ id: createId(), entry, contextScale: undefined })));
	}

	get chordEntries(): (ChordEntry | undefined)[] {
		return this.items.map(item => item.entry);
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	// 既存のcontextScaleはそのまま引き継がれる。
	sync(value: readonly (ChordEntry | undefined)[], createId: () => number): Progression {
		const current = this.items;
		if (
			value.length === current.length &&
			value.every((entry, index) => chordEntryEquals(entry, current[index].entry))
		) {
			return this;
		}
		return new Progression(value.map((entry, index) => ({
			id: current[index]?.id ?? createId(),
			entry,
			contextScale: current[index]?.contextScale
		})));
	}

	// 未選択(プレースホルダー)を挿入する。実際のコードを挿入したい場合は、挿入後に続けてsetChordを呼ぶこと
	insertChord(index: number, createId: () => number): Progression {
		if (index < 0 || index > this.items.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		const inserted: ProgressionChord = { id: createId(), entry: undefined, contextScale: undefined };
		return new Progression([
			...this.items.slice(0, index),
			inserted,
			...this.items.slice(index)
		]);
	}

	// index位置の要素そのものを取り除く(shrink)。後続要素は詰められる
	removeItem(index: number): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`remove index out of range: ${index}`);
		}
		return new Progression([
			...this.items.slice(0, index),
			...this.items.slice(index + 1)
		]);
	}

	// index位置のコードを未選択(プレースホルダー)に戻す。配列のシフトは行わず、contextScaleにも触れない
	clearChord(index: number): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`clear index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, entry: undefined } : item));
	}

	// index位置のChordを設定する。既存/未選択いずれの場合もスケールをデフォルトにリセットして置き換える
	setChord(index: number, chord: Chord): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`set index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, entry: { chord, extraChordScaleTones: undefined } } : item));
	}

	// Chord以外のプロパティ(extraChordScaleTones)が更新された。コードの実体が変わらないためcontextScaleとの関係にも影響しない。
	setExtraChordScaleTones(index: number, extraChordScaleTones: readonly Interval[] | undefined): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`update index out of range: ${index}`);
		}
		const entry = this.items[index].entry;
		if (!entry) {
			throw new Error(`no chord selected at index: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, entry: { ...entry, extraChordScaleTones } } : item));
	}

	// index位置のコードのcontextScaleを設定/解除(undefinedで解除)する。末尾要素は直後の実体を持たないが、
	// 将来追加されるコードとの関係を先に決めておけるよう対象に含む。
	setContextScale(index: number, contextScale: ContextScale | undefined): Progression {
		if (index < 0 || index >= this.items.length) {
			return this;
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, contextScale } : item));
	}
}
