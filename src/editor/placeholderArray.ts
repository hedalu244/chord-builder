export type PlaceholderItem<T> = {
    readonly value: T | undefined;
    readonly id: number;
};

// id付き要素の非破壊配列。value === undefinedの要素をplaceholder(未選択)として扱う。
// 常に次の不変条件を保つ:
// - sparse(emptyを含む状態)にならない。配列外へのsetは間をplaceholderで埋める
// - 末尾は常にplaceholder
// set/deleteでは要素は移動しない(idが動かないため、アニメーションも起きない)。
// insert/shiftでは操作位置より後ろの要素が移動する。
export class PlaceholderArray<T> {
    readonly array: readonly PlaceholderItem<T>[];

    constructor(array: readonly PlaceholderItem<T>[]) {
        this.array = array;
    }

    // 値の列からid付きの配列を作る。末尾がplaceholderでなければ補う。
    static fromValues<T>(values: readonly (T | undefined)[], createId: () => number): PlaceholderArray<T> {
        const array = values.map(value => ({ value, id: createId() }));
        return new PlaceholderArray<T>(array).ensureTrailingPlaceholder(createId);
    }

    get length(): number {
        return this.array.length;
    }

    // 末尾がplaceholderでなければplaceholderを追加する。sync等、外部から渡された値をそのまま
    // idに詰め替えただけの配列に対して不変条件を保証するために使う。
    ensureTrailingPlaceholder(createId: () => number): PlaceholderArray<T> {
        if (this.array.length === 0 || this.array[this.array.length - 1].value !== undefined) {
            return new PlaceholderArray([...this.array, { value: undefined, id: createId() }]);
        }
        return this;
    }

    // 配列の末尾に、長さがtargetLengthに達するまでplaceholderを追加する。縮めることはない。
    pad(targetLength: number, createId: () => number): PlaceholderArray<T> {
        if (this.array.length >= targetLength) {
            return this;
        }
        const padding: PlaceholderItem<T>[] = Array.from(
            { length: targetLength - this.array.length },
            () => ({ value: undefined, id: createId() })
        );
        return new PlaceholderArray([...this.array, ...padding]);
    }

    // indexが配列内であればその要素を置き換える(idは維持する)。配列外であれば、sparseを避けるため
    // 必要数のplaceholderで埋めてから置き換える。要素の移動は起きない。置き換えた結果末尾が
    // placeholderでなくなった場合は、末尾にplaceholderを追加する。
    set(index: number, value: T | undefined, createId: () => number): PlaceholderArray<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        const padded = this.pad(index + 1, createId);
        const newArray = [...padded.array];
        newArray[index] = { value, id: newArray[index].id };
        return new PlaceholderArray(newArray).ensureTrailingPlaceholder(createId);
    }

    // indexが配列外であれば何もしない。配列内であれば、その要素をplaceholderに置き換える
    // (既にplaceholderなら何もしない)。要素の移動は起きない。
    delete(index: number, createId: () => number): PlaceholderArray<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        if (index >= this.array.length || this.array[index].value === undefined) {
            return this;
        }
        return this.set(index, undefined, createId);
    }

    // index位置にplaceholderを1つ挿入する。indexが配列外であればsparseを避けるためpadしてから挿入する。
    insert(index: number, createId: () => number): PlaceholderArray<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        const padded = this.pad(index, createId).array;
        return new PlaceholderArray([
            ...padded.slice(0, index),
            { value: undefined, id: createId() },
            ...padded.slice(index)
        ]);
    }

    // index位置の要素を1つ取り除き、後続を詰める。末尾がplaceholderでなくなった場合は、末尾にplaceholderを追加する。
    shift(index: number, createId: () => number): PlaceholderArray<T> {
        const newArray = new PlaceholderArray([...this.array.slice(0, index), ...this.array.slice(index + 1)]);
        return newArray.ensureTrailingPlaceholder(createId);
    }
}
