import { BasicChord } from "./basicChord";
import { ContextScale } from "./contextScale";
import { FullChordInfo } from "./fullChordInfo";

export type ProgressionChord = {
	readonly id: number;
	readonly chordInfo: FullChordInfo;
	// このコードの直前との関係を表すコンテクストスケール。undefinedは未選択(自動)を意味する。先頭要素では常にundefined。
	readonly contextScale: ContextScale | undefined;
};

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
export class Progression {
	readonly items: readonly ProgressionChord[];

	private constructor(items: readonly ProgressionChord[]) {
		this.items = items;
	}

	static create(value: readonly FullChordInfo[], createId: () => number): Progression {
		return new Progression(value.map(chordInfo => ({ id: createId(), chordInfo, contextScale: undefined })));
	}

	get chordInfos(): FullChordInfo[] {
		return this.items.map(item => item.chordInfo);
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	// 既存のcontextScaleはそのまま引き継がれる。
	sync(value: readonly FullChordInfo[], createId: () => number): Progression {
		const current = this.items;
		if (
			value.length === current.length &&
			value.every((chordInfo, index) => chordInfo.equals(current[index].chordInfo))
		) {
			return this;
		}
		return new Progression(value.map((chordInfo, index) => ({
			id: current[index]?.id ?? createId(),
			chordInfo,
			contextScale: current[index]?.contextScale
		})));
	}

	// コードが挿入された。挿入されたコードのcontextScaleは常に未選択から始まる
	insertChord(index: number, chordInfo: FullChordInfo, createId: () => number): Progression {
		if (index < 0 || index > this.items.length) {
			throw new Error(`insert index out of range: ${index}`);
		}
		const inserted: ProgressionChord = { id: createId(), chordInfo, contextScale: undefined };
		return new Progression([
			...this.items.slice(0, index),
			inserted,
			...this.items.slice(index)
		]);
	}

	removeChord(index: number): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`remove index out of range: ${index}`);
		}
		return new Progression([
			...this.items.slice(0, index),
			...this.items.slice(index + 1)
		]);
	}

	changeChord(index: number, chord: BasicChord): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`change index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) =>
			i === index ? { ...item, chordInfo: item.chordInfo.withChord(chord) } : item
		));
	}

	// BasicChord以外のプロパティ(クオリティ/スケール)が更新された。コードの実体が変わらないためcontextScaleとの関係にも影響しない。
	updateChordInfo(index: number, chordInfo: FullChordInfo): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`update index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, chordInfo } : item));
	}

	// index位置のコードのcontextScaleを設定/解除(undefinedで解除)する。先頭要素は直前を持たないため対象にならない。
	setContextScale(index: number, contextScale: ContextScale | undefined): Progression {
		if (index <= 0 || index >= this.items.length) {
			return this;
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, contextScale } : item));
	}
}
