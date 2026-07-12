import { ChordEntry } from "./chordEntry";
import { ContextScale } from "./contextScale";

export type ChordWithId = {
	readonly id: number;
	readonly entry: ChordEntry | undefined; // undefinedはまだ何も選ばれていない状態(プレースホルダー)を意味する
};

export type ContextWithId = {
	readonly id: number;
	// 直前との関係を表すコンテクストスケール。undefinedは未選択(自動)を意味する。末尾要素では常にundefined。
	readonly contextScale: ContextScale | undefined;
};

// Progressionの外部表現。entriesとcontextsは常に同じ長さを持ち、contexts[i]はentries[i]の直後との関係を表す
// (末尾は常にundefined)。ChordEntry/ContextScaleにid等の編集セッション固有の情報は含まれない。
export type ProgressionValue = {
	readonly entries: readonly (ChordEntry | undefined)[];
	readonly contexts: readonly (ContextScale | undefined)[];
};

function assertSameLength(value: ProgressionValue): void {
	if (value.entries.length !== value.contexts.length) {
		throw new Error(`entries and contexts must have the same length: ${value.entries.length} !== ${value.contexts.length}`);
	}
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
// chordsとcontextsは完全に独立した配列で、それぞれ別のid列を持つ。両者は常に同じ長さを保ち、
// contexts[i]はchords[i]の直後との関係を表す(末尾は常にundefined)。挿入/削除操作は両方の配列に
// 同時に(同じindexで)適用することで、この対応関係を保つ。
export class Progression {
	readonly chords: readonly ChordWithId[];
	readonly contexts: readonly ContextWithId[];

	private constructor(chords: readonly ChordWithId[], contexts: readonly ContextWithId[]) {
		this.chords = chords;
		this.contexts = contexts;
	}

	static create(value: ProgressionValue, createId: () => number): Progression {
		assertSameLength(value);
		return new Progression(
			value.entries.map(entry => ({ id: createId(), entry })),
			value.contexts.map(contextScale => ({ id: createId(), contextScale }))
		);
	}

	get value(): ProgressionValue {
		return {
			entries: this.chords.map(chord => chord.entry),
			contexts: this.contexts.map(context => context.contextScale)
		};
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	sync(value: ProgressionValue, createId: () => number): Progression {
		assertSameLength(value);
		const currentChords = this.chords;
		const currentContexts = this.contexts;
		if (
			value.entries.length === currentChords.length &&
			value.entries.every((entry, index) => ChordEntry.equals(entry, currentChords[index].entry)) &&
			value.contexts.every((contextScale, index) => ContextScale.equals(contextScale, currentContexts[index].contextScale))
		) {
			return this;
		}
		return new Progression(
			value.entries.map((entry, index) => ({ id: currentChords[index]?.id ?? createId(), entry })),
			value.contexts.map((contextScale, index) => ({ id: currentContexts[index]?.id ?? createId(), contextScale }))
		);
	}

	// 未選択(プレースホルダー)を挿入する。
	insert(index: number, createId: () => number): Progression {
		if (index < 0 || index > this.chords.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		const insertedChord: ChordWithId = { id: createId(), entry: undefined };
		const insertedContext: ContextWithId = { id: createId(), contextScale: undefined };
		return new Progression(
			[...this.chords.slice(0, index), insertedChord, ...this.chords.slice(index)],
			[...this.contexts.slice(0, index), insertedContext, ...this.contexts.slice(index)]
		);
	}

	// index位置の要素そのものを取り除き、後続要素を詰める
	shift(index: number): Progression {
		if (index < 0 || index >= this.chords.length) {
			throw new Error(`shift index out of range: ${index}`);
		}
		return new Progression(
			[...this.chords.slice(0, index), ...this.chords.slice(index + 1)],
			[...this.contexts.slice(0, index), ...this.contexts.slice(index + 1)]
		);
	}

	// index位置のコードを設定/解除(undefinedで未選択のプレースホルダーに戻す)する。配列のシフトは行わず、contextsにも触れない
	setChord(index: number, entry: ChordEntry | undefined): Progression {
		if (index < 0 || index >= this.chords.length) {
			throw new Error(`set index out of range: ${index}`);
		}
		return new Progression(this.chords.map((c, i) => i === index ? { ...c, entry } : c), this.contexts);
	}

	// index位置のコードのcontextScaleを設定/解除(undefinedで解除)する。末尾要素は直後の実体を持たないが、
	// 将来追加されるコードとの関係を先に決めておけるよう対象に含む。
	setContextScale(index: number, contextScale: ContextScale | undefined): Progression {
		if (index < 0 || index >= this.contexts.length) {
			throw new Error(`setContextScale index out of range: ${index}`);
		}
		return new Progression(this.chords, this.contexts.map((c, i) => i === index ? { ...c, contextScale } : c));
	}
}
