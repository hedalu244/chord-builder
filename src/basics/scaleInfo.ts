// 既知スケールを一意に特定するID。Intervalの実データは持たず、必要になったとき辞書から引く(getScale)。
// 正データはkeyだが、rootとは相互に一意変換できる(root = key + ペアレントのshift度目の音程)ため、
// 利用側はどちらが正データかを意識せずkey/rootの両方を読み取れる。

import { PitchClass } from "./pitch";
import { Scale } from "./scale";
import { ParentScaleID, resolveParentScale } from "./scaleDictionary";
import { mod } from "./math/mod";

export class ScaleInfo {
    readonly key: PitchClass; // ペアレントスケールの主音
    readonly parentScale: ParentScaleID;
    readonly shift: number; // ペアレントの何度目の構成音を主音(root)にするか。0 <= shift < モード数

    constructor(key: PitchClass, parentScale: ParentScaleID, shift: number) {
        this.key = key;
        this.parentScale = parentScale;
        this.shift = mod(shift, resolveParentScale(parentScale).shiftedNames.length);
    }

    // root(shift後の主音)を指定して生成する。keyは逆算される
    static fromRoot(root: PitchClass, parentScale: ParentScaleID, shift: number): ScaleInfo {
        const rootOffset = resolveParentScale(parentScale).scale.tones[shift];
        return new ScaleInfo(root.sub(rootOffset), parentScale, shift);
    }

    // shift後のスケールの主音
    get root(): PitchClass {
        return this.key.add(resolveParentScale(this.parentScale).scale.tones[this.shift]);
    }

    // shift後の音程集合(rootからの相対)
    getScale(): Scale {
        return resolveParentScale(this.parentScale).scale.shift(this.shift);
    }

    // 構成音を実際のPitchClassに変換する
    getPitchClasses(): PitchClass[] {
        return this.getScale().getPitchClasses(this.root);
    }

    shiftedName(): string {
        return resolveParentScale(this.parentScale).shiftedNames[this.shift];
    }

    // 表示用の名前(root + shift後のスケール名)
    label(): string {
        return `${this.root.toString()} ${this.shiftedName()}`;
    }

    // 由来の説明(key + ペアレントスケール名 + シフト数)
    description(): string {
        return `${this.key.toString()} ${this.parentScale} shift ${this.shift}`;
    }

    // shift=0(contextScaleとして運用する場合)向けの表示用ラベル。モード名(Ionian等)ではなく
    // ペアレント名(Major等)で表示したいため、label()とは別に用意する
    keyLabel(): string {
        return `${this.key.toString()} ${this.parentScale}`;
    }

    equals(other: ScaleInfo): boolean {
        return this.key.equals(other.key) && this.parentScale === other.parentScale && this.shift === other.shift;
    }

    // 片方または両方がundefinedの場合も扱えるequals。配列の差分検出(Progression.sync)で使う
    static equals(a: ScaleInfo | undefined, b: ScaleInfo | undefined): boolean {
        if (a === undefined || b === undefined) return a === b;
        return a.equals(b);
    }
}
