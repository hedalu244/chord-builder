import { BasicChord } from "./basicChord";
import { ContextScale } from "./contextScale";
import { FullChordInfo } from "./fullChordInfo";

export type ProgressionChord = {
	readonly id: number;
	readonly chordInfo: FullChordInfo | undefined; // undefinedはまだ何も選ばれていない状態を意味する
	// このコードの直後との関係を表すコンテクストスケール。undefinedは未選択(自動)を意味する。末尾要素では常にundefined。
	readonly contextScale: ContextScale | undefined;
};

function chordInfoEquals(a: FullChordInfo | undefined, b: FullChordInfo | undefined): boolean {
	if (a === undefined || b === undefined) return a === b;
	return a.equals(b);
}

// 編集対象のコード進行を保持する非破壊データ。各編集操作は、それがUI上のどの操作を通じて行われたかに関知せず、
// 結果として何が変わるかだけを表す新しいProgressionを返す。
export class Progression {
	readonly items: readonly ProgressionChord[];

	private constructor(items: readonly ProgressionChord[]) {
		this.items = items;
	}

	static create(value: readonly (FullChordInfo | undefined)[], createId: () => number): Progression {
		return new Progression(value.map(chordInfo => ({ id: createId(), chordInfo, contextScale: undefined })));
	}

	get chordInfos(): (FullChordInfo | undefined)[] {
		return this.items.map(item => item.chordInfo);
	}

	// 外部から渡されたvalueとの差分をidを保ったまま取り込む。中身が同じなら同一インスタンスを返す。
	// 既存のcontextScaleはそのまま引き継がれる。
	sync(value: readonly (FullChordInfo | undefined)[], createId: () => number): Progression {
		const current = this.items;
		if (
			value.length === current.length &&
			value.every((chordInfo, index) => chordInfoEquals(chordInfo, current[index].chordInfo))
		) {
			return this;
		}
		return new Progression(value.map((chordInfo, index) => ({
			id: current[index]?.id ?? createId(),
			chordInfo,
			contextScale: current[index]?.contextScale
		})));
	}

	// 未選択(プレースホルダー)を含めて、コードが挿入された。挿入された要素のcontextScaleは常に未選択から始まる
	insertChord(index: number, chordInfo: FullChordInfo | undefined, createId: () => number): Progression {
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
		return new Progression(this.items.map((item, i) => i === index ? { ...item, chordInfo: undefined } : item));
	}

	// index位置のBasicChordを設定する。既存のコードがあればクオリティ/スケールを維持したまま置き換え、
	// 未選択(プレースホルダー)であれば新規にFullChordInfoを作る
	setChord(index: number, chord: BasicChord): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`set index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) =>
			i === index ? { ...item, chordInfo: item.chordInfo ? item.chordInfo.withChord(chord) : new FullChordInfo(chord, undefined) } : item
		));
	}

	// BasicChord以外のプロパティ(クオリティ/スケール)が更新された。コードの実体が変わらないためcontextScaleとの関係にも影響しない。
	updateChordInfo(index: number, chordInfo: FullChordInfo): Progression {
		if (index < 0 || index >= this.items.length) {
			throw new Error(`update index out of range: ${index}`);
		}
		return new Progression(this.items.map((item, i) => i === index ? { ...item, chordInfo } : item));
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
