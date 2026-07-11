import { BasicChord } from "./basicChord";
import { FullChordInfo } from "./fullChordInfo";
import { DegreeNexus } from "./nexus";

export type ProgressionChord = {
	readonly id: number;
	readonly chordInfo: FullChordInfo;
	// このコードの直前とのnexus優先指定。undefinedは自動計算へのフォールバックを意味する。先頭要素では常にundefined。
	readonly preferredNexus: DegreeNexus | undefined;
};

export type ProgressionNeighbors = {
	readonly formerChord: FullChordInfo | null;
	readonly latterChord: FullChordInfo | null;
};

// item.preferredNexusが実際にitems[i-1]とitem自身のコードを結びつけるかどうか
function isPreferredNexusConsistent(items: readonly ProgressionChord[], index: number): boolean {
	const nexus = items[index].preferredNexus;
	if (nexus === undefined) return true;
	if (index === 0) return false;
	const formerChord = items[index - 1].chordInfo.chord;
	const latterChord = items[index].chordInfo.chord;
	return nexus.match(formerChord, latterChord);
}

// 「preferredNexusがundefinedでないなら、それは必ず前後のコードと矛盾しない」という不変条件を回復する。
// 追加/削除/変更によって前後関係が変わったコードのpreferredNexusは、ここを通すことで自動的にundefinedへフォールする。
function reconcile(items: readonly ProgressionChord[]): ProgressionChord[] {
	return items.map((item, index) => isPreferredNexusConsistent(items, index) ? item : { ...item, preferredNexus: undefined });
}

// 編集対象のコード進行を保持する非破壊データ。各コードは直前のコードとのnexus優先指定を併せ持つ。
// 各編集操作は、それがUI上のどの操作(モーダルやタブ)を通じて行われたかに関知せず、結果として何が変わるかだけを表す新しいProgressionを返す。
export class Progression {
	readonly items: readonly ProgressionChord[];

	private constructor(items: readonly ProgressionChord[]) {
		this.items = items;
	}

	static create(value: readonly FullChordInfo[], createId: () => number): Progression {
		return new Progression(value.map(chordInfo => ({ id: createId(), chordInfo, preferredNexus: undefined })));
	}

	get chordInfos(): FullChordInfo[] {
		return this.items.map(item => item.chordInfo);
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	// 既存のnexus優先指定は、変わらず成立するものだけ引き継がれ、矛盾するものはreconcileがフォールする。
	sync(value: readonly FullChordInfo[], createId: () => number): Progression {
		const current = this.items;
		if (
			value.length === current.length &&
			value.every((chordInfo, index) => chordInfo.equals(current[index].chordInfo))
		) {
			return this;
		}
		return new Progression(reconcile(value.map((chordInfo, index) => ({
			id: current[index]?.id ?? createId(),
			chordInfo,
			preferredNexus: current[index]?.preferredNexus
		}))));
	}

	// index位置にコードを挿入する場合の前後のコード
	insertionNeighbors(index: number): ProgressionNeighbors {
		const items = this.items;
		if (index < 0 || index > items.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		return {
			formerChord: index === 0 ? null : items[index - 1].chordInfo,
			latterChord: index === items.length ? null : items[index].chordInfo
		};
	}

	// index位置の既存コードを変更する場合の前後のコード
	changeNeighbors(index: number): ProgressionNeighbors {
		const items = this.items;
		if (index < 0 || index >= items.length) {
			throw new Error(`change index out of range: ${index}`);
		}
		return {
			formerChord: index === 0 ? null : items[index - 1].chordInfo,
			latterChord: index === items.length - 1 ? null : items[index + 1].chordInfo
		};
	}

	// コードが挿入された。挿入位置の前後の隣接関係はreconcileが自動的に自動計算へフォールする。
	insertChord(index: number, chordInfo: FullChordInfo, createId: () => number): Progression {
		if (index < 0 || index > this.items.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		const inserted: ProgressionChord = { id: createId(), chordInfo, preferredNexus: undefined };
		return new Progression(reconcile([
			...this.items.slice(0, index),
			inserted,
			...this.items.slice(index)
		]));
	}

	// コードが削除された。削除によって新たに隣接することになる関係はreconcileが自動的に自動計算へフォールする。
	removeChord(index: number): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`remove index out of range: ${index}`);
		}
		return new Progression(reconcile([
			...this.items.slice(0, index),
			...this.items.slice(index + 1)
		]));
	}

	// BasicChordが変更された。前後どちらの隣接関係も、なお成立していればreconcileがそのまま残す
	changeChord(index: number, chord: BasicChord): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`change index out of range: ${index}`);
		}
		return new Progression(reconcile(this.items.map((item, i) =>
			i === index ? { ...item, chordInfo: item.chordInfo.withChord(chord) } : item
		)));
	}

	// BasicChord以外のプロパティ(クオリティ/スケール)が更新された。コードの実体が変わらないためnexusとの関係にも影響しない。
	updateChordInfo(index: number, chordInfo: FullChordInfo): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`update index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, chordInfo } : item));
	}

	// gapIndexのコードを基準(固定)に、その直後のコードをnexusが成立するよう捻じ曲げて指定する。
	setNexusFromFormerChord(gapIndex: number, nexus: DegreeNexus): Progression {
		const basis = this.items[gapIndex].chordInfo.chord;
		const derivedChord = nexus.resolveFromFormerChord(basis).latterChord;
		return new Progression(reconcile(this.items.map((item, i) =>
			i === gapIndex + 1 ? { ...item, chordInfo: item.chordInfo.withChord(derivedChord), preferredNexus: nexus } : item
		)));
	}

	// gapIndex+1のコードを基準(固定)に、その直前のコードをnexusが成立するよう捻じ曲げて指定する。
	setNexusFromLatterChord(gapIndex: number, nexus: DegreeNexus): Progression {
		const basis = this.items[gapIndex + 1].chordInfo.chord;
		const derivedChord = nexus.resolveFromLatterChord(basis).formerChord;
		return new Progression(reconcile(this.items.map((item, i) => {
			if (i === gapIndex) return { ...item, chordInfo: item.chordInfo.withChord(derivedChord) };
			if (i === gapIndex + 1) return { ...item, preferredNexus: nexus };
			return item;
		})));
	}

	// 両側のコードは動かさず、gapIndexのnexus優先指定だけを記録/解除する(undefinedで解除)。
	setPreferredNexus(gapIndex: number, nexus: DegreeNexus | undefined): Progression {
		const targetIndex = gapIndex + 1;
		if (targetIndex < 0 || targetIndex >= this.items.length) {
			return this;
		}
		return new Progression(reconcile(this.items.map((item, i) => i === targetIndex ? { ...item, preferredNexus: nexus } : item)));
	}
}
