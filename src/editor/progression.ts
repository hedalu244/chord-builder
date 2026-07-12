import { ChordEntry } from "../basics/chordEntry";
import { ContextScale } from "../basics/contextScale";
import { PlaceholderArrayWithId, PlaceholderItem } from "./placeholderArray";

export type ChordWithId = PlaceholderItem<ChordEntry>;
export type ContextWithId = PlaceholderItem<ContextScale>;

// Progressionの外部表現。contexts[i]はentries[i]とentries[i+1]の関係を表す
// (視覚的にもi番目とi+1番目の中間にある、いわばインデックスが0.5多いイメージ)。
// entriesは末尾に1つ未選択(undefined)の要素を持つ状態を正とする。これは「次に追加できる場所」を表す
// プレースホルダーで、Progression側が常に維持する。そのためcontextsの長さはentries.length - 1になる。
// ChordEntry/ContextScaleにid等の編集セッション固有の情報は含まれない。
export type ProgressionValue = {
	readonly entries: readonly (ChordEntry | undefined)[];
	readonly contexts: readonly (ContextScale | undefined)[];
};

// insertBefore/After・shiftBefore/Afterは、要求されたindexそのものではなく、PlaceholderArrayWithIdが
// 実際に操作した(できるだけ後方にずらされた)位置に対して行われる。chordsとcontextsは独立に動くため、
// 実際に操作された位置もそれぞれ別のindexになりうる。呼び出し側(アニメーション対象の特定など)が
// その実際の位置を知れるよう、結果のProgressionと一緒に返す。
export type ProgressionMutationResult = {
	readonly progression: Progression;
	readonly chordIndex: number;
	readonly contextIndex: number;
};

// chords/contextsはそれぞれ独立にPlaceholderArrayWithIdの不変条件(sparseにならない・末尾は常に
// placeholder)を保つ。この2つの配列の間で成り立つべき追加の不変条件(contexts.lengthはchords.length
// と同じかちょうど1少ない)だけをここで整える。もし崩れていれば、足りない方をpadで埋める。
function normalizeLengths(
	chords: PlaceholderArrayWithId<ChordEntry>,
	contexts: PlaceholderArrayWithId<ContextScale>,
	createId: () => number
): { chords: PlaceholderArrayWithId<ChordEntry>; contexts: PlaceholderArrayWithId<ContextScale> } {
	if (contexts.length < chords.length - 1) {
		return { chords, contexts: contexts.pad(chords.length - 1, createId) };
	}
	if (chords.length < contexts.length) {
		return { chords: chords.pad(contexts.length, createId), contexts };
	}
	return { chords, contexts };
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
// chordsとcontextsは完全に独立したPlaceholderArrayWithIdで、それぞれ別のid列を持つ。contexts[i]は
// chords[i]とchords[i+1]の関係を表す(視覚的にはi番目とi+1番目の中間、インデックスが0.5多いイメージ)。
// 個数の大小関係(normalizeLengths)以外、chordsとcontextsは互いに独立に扱われる。
export class Progression {
	readonly chords: PlaceholderArrayWithId<ChordEntry>;
	readonly contexts: PlaceholderArrayWithId<ContextScale>;

	private constructor(chords: PlaceholderArrayWithId<ChordEntry>, contexts: PlaceholderArrayWithId<ContextScale>) {
		this.chords = chords;
		this.contexts = contexts;
	}

	private static normalized(
		chords: PlaceholderArrayWithId<ChordEntry>,
		contexts: PlaceholderArrayWithId<ContextScale>,
		createId: () => number
	): Progression {
		const normalized = normalizeLengths(chords, contexts, createId);
		return new Progression(normalized.chords, normalized.contexts);
	}

	static create(value: ProgressionValue, createId: () => number): Progression {
		const chords = PlaceholderArrayWithId.fromValues(value.entries, createId);
		const contexts = PlaceholderArrayWithId.fromValues(value.contexts, createId);
		return Progression.normalized(chords, contexts, createId);
	}

	get value(): ProgressionValue {
		return {
			entries: this.chords.array.map(chord => chord.value),
			contexts: this.contexts.array.map(context => context.value)
		};
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	sync(value: ProgressionValue, createId: () => number): Progression {
		const currentChords = this.chords.array;
		const currentContexts = this.contexts.array;
		if (
			value.entries.length === currentChords.length &&
			value.contexts.length === currentContexts.length &&
			value.entries.every((entry, index) => ChordEntry.equals(entry, currentChords[index].value)) &&
			value.contexts.every((contextScale, index) => ContextScale.equals(contextScale, currentContexts[index].value))
		) {
			return this;
		}
		const chords = new PlaceholderArrayWithId(
			value.entries.map((entry, index) => ({ id: currentChords[index]?.id ?? createId(), value: entry }))
		).ensureTrailingPlaceholder(createId);
		const contexts = new PlaceholderArrayWithId(
			value.contexts.map((contextScale, index) => ({ id: currentContexts[index]?.id ?? createId(), value: contextScale }))
		).ensureTrailingPlaceholder(createId);
		return Progression.normalized(chords, contexts, createId);
	}

	// 未選択(プレースホルダー)をindex位置に挿入する。entry・contextともにindex位置に挿入されるため、
	// それまでcontexts[index]が表していたchords[index-1]とchords[index]の関係は、挿入後は
	// chords[index-1]と新しいentryとの関係として読み替えられる。
	insertBefore(index: number, createId: () => number): ProgressionMutationResult {
		if (index < 0 || index > this.chords.length) {
			throw new Error(`insertBefore index out of range: ${index}`);
		}
		// contexts.lengthはchords.lengthより1少ないことがあるため、その場合の末尾への挿入(index===chords.length)は
		// contextsにとっての末尾(=contexts.length)に対応させる
		const contextIndex = Math.min(index, this.contexts.length);
		const chordMutation = this.chords.insert(index, createId);
		const contextMutation = this.contexts.insert(contextIndex, createId);
		return {
			progression: Progression.normalized(chordMutation.result, contextMutation.result, createId),
			chordIndex: chordMutation.index,
			contextIndex: contextMutation.index
		};
	}

	// 未選択(プレースホルダー)をindex位置の直後に挿入する。entryはindex + 1位置に、contextはindex位置に
	// 挿入されるため、それまでcontexts[index]が表していたchords[index]とchords[index+1]の関係は、
	// 挿入後は新しいentryとchords[index+1]だった要素との関係として読み替えられる。
	insertAfter(index: number, createId: () => number): ProgressionMutationResult {
		if (index < 0 || index >= this.chords.length) {
			throw new Error(`insertAfter index out of range: ${index}`);
		}
		const chordMutation = this.chords.insert(index + 1, createId);
		const contextMutation = this.contexts.insert(index, createId);
		return {
			progression: Progression.normalized(chordMutation.result, contextMutation.result, createId),
			chordIndex: chordMutation.index,
			contextIndex: contextMutation.index
		};
	}

	// shiftAfter(index)が可能かどうか。chords[index]自体がplaceholderであることに加え、
	// あわせて取り除かれるcontexts[index](chords[index]とchords[index+1]の関係)も
	// placeholderである(=非undefinedな値を失わない)必要がある。
	canShiftAfter(index: number): boolean {
		return this.chords.canShift(index) && this.contexts.canShift(index);
	}

	// shiftBefore(index)が可能かどうか。chords[index]自体がplaceholderであることに加え、
	// あわせて取り除かれるcontexts[index-1](chords[index-1]とchords[index]の関係)も
	// placeholderである(=非undefinedな値を失わない)必要がある。
	canShiftBefore(index: number): boolean {
		const contextIndex = index - 1 >= 0 ? index - 1 : index;
		return this.chords.canShift(index) && this.contexts.canShift(contextIndex);
	}

	// index位置の要素そのものを取り除く。あわせてcontexts[index](chords[index]とchords[index+1]の関係)
	// も取り除く。chords[index-1]との関係を表すcontexts[index-1]はそのまま残る。
	shiftAfter(index: number, createId: () => number): ProgressionMutationResult {
		if (!this.canShiftAfter(index)) {
			throw new Error(`cannot shiftAfter index: ${index}`);
		}
		const chordMutation = this.chords.shift(index);
		const contextMutation = this.contexts.shift(index);
		return {
			progression: Progression.normalized(chordMutation.result, contextMutation.result, createId),
			chordIndex: chordMutation.index,
			contextIndex: contextMutation.index
		};
	}

	// index位置の要素そのものを取り除く。あわせてcontexts[index - 1](chords[index-1]とchords[index]の関係)
	// も取り除く。chords[index+1]との関係を表していたcontexts[index]は、詰められてchords[index]との関係になる。
	shiftBefore(index: number, createId: () => number): ProgressionMutationResult {
		if (!this.canShiftBefore(index)) {
			throw new Error(`cannot shiftBefore index: ${index}`);
		}
		const contextIndex = index - 1 >= 0 ? index - 1 : index;
		const chordMutation = this.chords.shift(index);
		const contextMutation = this.contexts.shift(contextIndex);
		return {
			progression: Progression.normalized(chordMutation.result, contextMutation.result, createId),
			chordIndex: chordMutation.index,
			contextIndex: contextMutation.index
		};
	}

	// index位置のコードを設定する。indexが配列長以上でもエラーにはせず、間がsparseにならないよう
	// placeholderで埋めた上でindex位置を設定する。
	setChord(index: number, entry: ChordEntry | undefined, createId: () => number): Progression {
		if (index < 0) {
			throw new Error(`setChord index out of range: ${index}`);
		}
		return Progression.normalized(this.chords.set(index, entry, createId), this.contexts, createId);
	}

	// index位置のコードを未選択(プレースホルダー)に戻す。存在しない、または既にプレースホルダーなら何もしない。
	deleteChord(index: number, createId: () => number): Progression {
		return Progression.normalized(this.chords.delete(index, createId), this.contexts, createId);
	}

	// index位置のコードのcontextScaleを設定する。indexが配列長以上でもエラーにはせず、間をplaceholderで
	// 埋めた上でindex位置を設定する。
	setContextScale(index: number, contextScale: ContextScale | undefined, createId: () => number): Progression {
		if (index < 0) {
			throw new Error(`setContextScale index out of range: ${index}`);
		}
		return Progression.normalized(this.chords, this.contexts.set(index, contextScale, createId), createId);
	}

	// index位置のcontextScaleを未選択(自動計算)に戻す。存在しない、または既にプレースホルダーなら何もしない。
	deleteContextScale(index: number, createId: () => number): Progression {
		return Progression.normalized(this.chords, this.contexts.delete(index, createId), createId);
	}
}
