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

// insert・shiftは、要求されたindexそのものではなく、PlaceholderArrayWithIdが
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
	if (contexts.length < chords.length) {
		return { chords, contexts: contexts.pad(chords.length, createId) };
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
	// before/afterの区別は呼び出し側(UI)に持たせず、常にこのinsertだけを公開する。「カードの右を押す」操作は
	// index + 1を渡してこれを呼ぶことで表す。
	insert(index: number, createId: () => number): ProgressionMutationResult {
		if (index < 0 || index > this.chords.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		// contexts.lengthはchords.lengthより1少ないことがあるため、その場合の末尾への挿入(index===chords.length)は
		// contextsにとっての末尾(=contexts.length)に対応させる
		const chordMutation = this.chords.insert(index, createId);
		const contextMutation = this.contexts.insert(index, createId);
		return {
			progression: Progression.normalized(chordMutation.result, contextMutation.result, createId),
			chordIndex: chordMutation.index,
			contextIndex: contextMutation.index
		};
	}

	// index位置がshiftできるかどうか。shiftボタンはchordのプレースホルダーにしか表示されないため、
	// chords[index]は常にplaceholderであり、ここでは「末尾のplaceholderではないか」だけを見れば足りる
	// (末尾のplaceholderは常に「次を追加できる場所」として残す必要があるため)。
	// なお、あわせて取り除かれるcontexts側の要素がplaceholderかどうかはここでは判定しない。
	// 手動設定されたcontextScaleを持っていても、そのままshiftで失われる(shiftはchordのプレースホルダーにしか
	// 出ないためchordが失われることはないが、contextScaleは失われうる。改善の余地はあるが現時点ではこう割り切る)。
	canShift(index: number): boolean {
		return this.chords.canShift(index);
	}

	// index位置のプレースホルダーそのものを取り除く。あわせてcontexts[index - 1]
	// (chords[index-1]とchords[index]の関係)も取り除く。chords[index+1]との関係を表していたcontexts[index]は、
	// 詰められてchords[index]との関係になる。
	shift(index: number, createId: () => number): ProgressionMutationResult {
		const chordMutation = this.chords.shift(index);
		const contextMutation = this.contexts.shift(index);
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

// 未指定(placeholder)のcontextScaleは、指定値が見つかるまでindexから前方向に逐次探索し、直前に
// 指定された値を継承する。1つ目のcontextScaleは常に指定されている前提のため、通常この探索は
// 途中で見つかって止まるが、見つからなければundefinedを返す
export function estimateContextScale(progression: Progression, index: number): ContextScale | undefined {
	for (let i = index; i >= 0; i--) {
		const value = progression.contexts.array[i]?.value;
		if (value !== undefined) return value;
	}
	return undefined;
}
