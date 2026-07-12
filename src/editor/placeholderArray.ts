/*
配列に操作をするときには、以下の要件が満たされるようにする。

配列はsparse、つまりemptyを含んではならない。indexを飛ばして指定することは許されず、中間にはplaceholderを必ず間に入れる。
配列の末尾はplaceholderである必要がある。もし末尾にsetしたことでそれが崩れた場合、placeholderを追加する。
shiftは末尾以外のplaceholderのみを削除することができ、末尾のplaceholderと、非placeholderデータは削除することができない。
insertはplaceholderを追加することだけができ、実データを追加することはない。

deleteやsetでは配列の要素が移動することはない。

shiftとinsertでは配列の要素が移動する。これらについては、追加の制約がある。
placeholderを区別しなかった場合と同じ結果が得られる限り、できるだけ後方に対して操作をする。これはplaceholderが無駄に動くアニメーションを生まないためである(idがずれなければアニメーションは起きないはず)。
*/

export type PlaceholderItem<T> = {
    readonly value: T | undefined;
    readonly id: number;
};

// insert/shiftは要求されたindexそのものではなく、できるだけ後方にずらした実際の操作位置に対して行われる。
// 呼び出し側(アニメーション対象の特定など)がその実際の位置を知れるよう、resultと一緒に返す。
export type PlaceholderArrayMutation<T> = {
    readonly result: PlaceholderArrayWithId<T>;
    // insertなら新しく挿入されたplaceholderの(挿入後の)index、shiftなら実際に取り除かれたplaceholderの
    // (取り除く前の、かつ取り除いた後にそこへ詰められてくる要素から見た)indexを指す
    readonly index: number;
};

export class PlaceholderArrayWithId<T> {
    readonly array: readonly PlaceholderItem<T>[];

    constructor(array: readonly PlaceholderItem<T>[]) {
        this.array = array;
    }

    // 値の列からid付きの配列を作る。末尾がplaceholderでなければ補う。
    static fromValues<T>(values: readonly (T | undefined)[], createId: () => number): PlaceholderArrayWithId<T> {
        const array = values.map(value => ({ value, id: createId() }));
        return new PlaceholderArrayWithId<T>(array).ensureTrailingPlaceholder(createId);
    }

    get length(): number {
        return this.array.length;
    }

    // 末尾がplaceholderでなければplaceholderを追加する。sync等、外部から渡された値をそのまま
    // idに詰め替えただけの配列に対して不変条件を保証するために使う。
    ensureTrailingPlaceholder(createId: () => number): PlaceholderArrayWithId<T> {
        if (this.array.length === 0 || this.array[this.array.length - 1].value !== undefined) {
            return new PlaceholderArrayWithId([...this.array, { value: undefined, id: createId() }]);
        }
        return this;
    }

    // 配列の末尾に、長さがtargetLengthに達するまでplaceholderを追加する。縮めることはない。
    pad(targetLength: number, createId: () => number): PlaceholderArrayWithId<T> {
        if (this.array.length >= targetLength) {
            return this;
        }
        const padding: PlaceholderItem<T>[] = Array.from(
            { length: targetLength - this.array.length },
            () => ({ value: undefined, id: createId() })
        );
        return new PlaceholderArrayWithId([...this.array, ...padding]);
    }

    // indexが配列内であればその要素を置き換える(idは維持する)。配列外であれば、sparseを避けるため
    // 必要数のplaceholderで埋めてから置き換える。要素の移動は起きない。置き換えた結果末尾が
    // placeholderでなくなった場合は、末尾にplaceholderを追加する。
    set(index: number, value: T | undefined, createId: () => number): PlaceholderArrayWithId<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        const padded = this.pad(index + 1, createId);
        const newArray = [...padded.array];
        newArray[index] = { value, id: newArray[index].id };
        return new PlaceholderArrayWithId(newArray).ensureTrailingPlaceholder(createId);
    }

    // indexが配列外であれば何もしない。配列内であれば、その要素をplaceholderに置き換える
    // (既にplaceholderなら何もしない)。要素の移動は起きない。
    delete(index: number, createId: () => number): PlaceholderArrayWithId<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        if (index >= this.array.length || this.array[index].value === undefined) {
            return this;
        }
        return this.set(index, undefined, createId);
    }

    // index位置にplaceholderを1つ挿入する。
    // 実際に挿入された(要求されたindexとは異なりうる)indexも一緒に返す。
    insert(index: number, createId: () => number): PlaceholderArrayMutation<T> {
        if (index < 0) throw new Error(`index out of range: ${index}`);
        const padded = this.pad(index, createId).array;
        let target = index;
        /*
        // ただし、index位置(にpad後になる要素)がplaceholderであれば、
        // それを動かす代わりに1つ後ろへの挿入とみなして再帰的に判定する。これを繰り返し、実データの手前か
        // 末尾に達したところで実際に挿入する。結果として、挿入によって位置がずれる要素をできるだけ減らす。
        while (target < padded.length && padded[target].value === undefined) {
            target++;
        }*/
        const result = new PlaceholderArrayWithId([
            ...padded.slice(0, target),
            { value: undefined, id: createId() },
            ...padded.slice(target)
        ]);
        return { result, index: target };
    }

    // indexが実データを指しているか、末尾のplaceholderを直接指している場合はshiftできない
    // (末尾のplaceholderは常に「次を追加できる場所」として残す必要があるため)。
    canShift(index: number): boolean {
        if (index < 0 || index >= this.array.length) return false;
        if (this.array[index].value !== undefined) return false;
        if (index === this.array.length - 1) return false;
        return true;
    }

    // index位置のplaceholderを1つ取り除く。
    // (canShiftに直接末尾のindexを渡した場合はfalseになり、ここには到達しない)。
    // 実際に取り除かれた(要求されたindexとは異なりうる)indexも一緒に返す。取り除いた後、そこには
    // 直後にあった要素が詰めて入ってくるため、返すindexは削除後の配列でもそのまま「動いてきた要素の位置」を指す。
    shift(index: number): PlaceholderArrayMutation<T> {
        let target = index;
        /*
        // 直後の要素もplaceholderであれば、そちらを
        // 優先して取り除く(再帰的に、末尾に達するまで)。これにより、取り除かれることで位置がずれる
        // 要素をできるだけ減らす。再帰の結果末尾に達した場合に限り、末尾のplaceholderを取り除ける
        while (target < this.array.length - 1 && this.array[target + 1].value === undefined) {
            target++;
        }*/
        const result = new PlaceholderArrayWithId([...this.array.slice(0, target), ...this.array.slice(target + 1)]);
        return { result, index: target };
    }
}
