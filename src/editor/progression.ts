import { ChordEntry } from "../basics/chordEntry";
import { ContextScale } from "../basics/contextScale";
import { PlaceholderArray } from "./placeholderArray";

// Progressionの外部表現。ChordEntry/ContextScaleにid等の編集セッション固有の情報は含まれない。
// contexts[i]はentries[i]とentries[i+1]の関係を表す(視覚的にもi番目とi+1番目の中間にある、
// いわばインデックスが0.5多いイメージ)。
// entries・contextsはともに末尾に未選択(undefined)の要素を1つ持つ状態を正とする。これは
// 「次に追加できる場所」を表すプレースホルダーで、Progression側が常に維持する。
// そのためentriesとcontextsの長さは常に一致する。
export type ProgressionValue = {
	readonly entries: readonly (ChordEntry | undefined)[];
	readonly contexts: readonly (ContextScale | undefined)[];
};

// entries/contextsはそれぞれ独立にPlaceholderArrayの不変条件(sparseにならない・末尾は常に
// placeholder)を保つ。この2つの配列の間で成り立つべき追加の不変条件(長さが一致する)だけを
// ここで整える。もし崩れていれば、短い方をpadで埋める。
function normalizeLengths(
	entries: PlaceholderArray<ChordEntry>,
	contexts: PlaceholderArray<ContextScale>,
	createId: () => number
): { entries: PlaceholderArray<ChordEntry>; contexts: PlaceholderArray<ContextScale> } {
	if (contexts.length < entries.length) {
		return { entries, contexts: contexts.pad(entries.length, createId) };
	}
	if (entries.length < contexts.length) {
		return { entries: entries.pad(contexts.length, createId), contexts };
	}
	return { entries, contexts };
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
// entriesとcontextsは完全に独立したPlaceholderArrayで、それぞれ別のid列を持つ。contexts[i]は
// entries[i]とentries[i+1]の関係を表す(視覚的にはi番目とi+1番目の中間、インデックスが0.5多いイメージ)。
// 長さの一致(normalizeLengths)以外、entriesとcontextsは互いに独立に扱われる。
export class Progression {
	readonly entries: PlaceholderArray<ChordEntry>;
	readonly contexts: PlaceholderArray<ContextScale>;

	private constructor(entries: PlaceholderArray<ChordEntry>, contexts: PlaceholderArray<ContextScale>) {
		this.entries = entries;
		this.contexts = contexts;
	}

	private static normalized(
		entries: PlaceholderArray<ChordEntry>,
		contexts: PlaceholderArray<ContextScale>,
		createId: () => number
	): Progression {
		const normalized = normalizeLengths(entries, contexts, createId);
		return new Progression(normalized.entries, normalized.contexts);
	}

	static create(value: ProgressionValue, createId: () => number): Progression {
		const entries = PlaceholderArray.fromValues(value.entries, createId);
		const contexts = PlaceholderArray.fromValues(value.contexts, createId);
		return Progression.normalized(entries, contexts, createId);
	}

	get value(): ProgressionValue {
		return {
			entries: this.entries.array.map(entry => entry.value),
			contexts: this.contexts.array.map(context => context.value)
		};
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	sync(value: ProgressionValue, createId: () => number): Progression {
		const currentEntries = this.entries.array;
		const currentContexts = this.contexts.array;
		if (
			value.entries.length === currentEntries.length &&
			value.contexts.length === currentContexts.length &&
			value.entries.every((entry, index) => ChordEntry.equals(entry, currentEntries[index].value)) &&
			value.contexts.every((contextScale, index) => ContextScale.equals(contextScale, currentContexts[index].value))
		) {
			return this;
		}
		const entries = new PlaceholderArray(
			value.entries.map((entry, index) => ({ id: currentEntries[index]?.id ?? createId(), value: entry }))
		).ensureTrailingPlaceholder(createId);
		const contexts = new PlaceholderArray(
			value.contexts.map((contextScale, index) => ({ id: currentContexts[index]?.id ?? createId(), value: contextScale }))
		).ensureTrailingPlaceholder(createId);
		return Progression.normalized(entries, contexts, createId);
	}

	// 未選択(プレースホルダー)をindex位置に挿入する。entry・contextともに同じindex位置に挿入されるため、
	// それまでcontexts[index]が表していたentries[index-1]とentries[index]の関係は、挿入後は
	// entries[index-1]と新しいentryとの関係として読み替えられる。
	// before/afterの区別は呼び出し側(UI)に持たせず、常にこのinsertだけを公開する。「カードの右を押す」操作は
	// index + 1を渡してこれを呼ぶことで表す。
	insert(index: number, createId: () => number): Progression {
		if (index < 0 || index > this.entries.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		return Progression.normalized(
			this.entries.insert(index, createId),
			this.contexts.insert(index, createId),
			createId
		);
	}

	// index位置がshiftできるかどうか。shiftボタンはentryのプレースホルダーにしか表示されないため、
	// entries[index]は常にplaceholderであり、ここでは「末尾のplaceholderではないか」だけを見れば足りる
	// (末尾のplaceholderは常に「次を追加できる場所」として残す必要があるため)。
	canShift(index: number): boolean {
		return this.entries.canShift(index);
	}

	// index位置のプレースホルダーそのものを取り除く。あわせてcontexts[index]
	// (entries[index]とentries[index+1]の関係)も取り除き、後続を詰める。
	// contexts[index]に手動設定されたcontextScaleがあっても、そのままshiftで失われる
	// (改善の余地はあるが現時点ではこう割り切る)。
	shift(index: number, createId: () => number): Progression {
		return Progression.normalized(this.entries.shift(index), this.contexts.shift(index), createId);
	}

	// index位置のエントリを設定する。indexが配列長以上でもエラーにはせず、間がsparseにならないよう
	// placeholderで埋めた上でindex位置を設定する。
	setEntry(index: number, entry: ChordEntry | undefined, createId: () => number): Progression {
		if (index < 0) {
			throw new Error(`setEntry index out of range: ${index}`);
		}
		return Progression.normalized(this.entries.set(index, entry, createId), this.contexts, createId);
	}

	// index位置のエントリを未選択(プレースホルダー)に戻す。存在しない、または既にプレースホルダーなら何もしない。
	deleteEntry(index: number, createId: () => number): Progression {
		return Progression.normalized(this.entries.delete(index, createId), this.contexts, createId);
	}

	// index位置のcontextScaleを設定する。indexが配列長以上でもエラーにはせず、間をplaceholderで
	// 埋めた上でindex位置を設定する。
	setContextScale(index: number, contextScale: ContextScale | undefined, createId: () => number): Progression {
		if (index < 0) {
			throw new Error(`setContextScale index out of range: ${index}`);
		}
		return Progression.normalized(this.entries, this.contexts.set(index, contextScale, createId), createId);
	}

	// index位置のcontextScaleを未選択(自動計算)に戻す。存在しない、または既にプレースホルダーなら何もしない。
	deleteContextScale(index: number, createId: () => number): Progression {
		return Progression.normalized(this.entries, this.contexts.delete(index, createId), createId);
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
