import { Degree, Interval, PitchClass } from "./pitch";

export type Mode = "M" | "m";

export const allModes: readonly Mode[] = ["M", "m"];

export function ModeToNotation(mode: Mode): string {
    switch (mode) {
        case "M": return "";
        case "m": return "m";
    }
}

export class Triad {
    readonly root: PitchClass;
    readonly mode: Mode;

    constructor(root: PitchClass, mode: Mode) {
        this.root = root;
        this.mode = mode;
    }
    equals(other: Triad): boolean {
        return this.root.equals(other.root) && this.mode === other.mode;
    }

    toString(): string {
        return `${this.root.toString()}${ModeToNotation(this.mode)}`;
    }

    static parse(str: string): Triad {
        const regex = /^([A-G][#b]?)([Mm]?)$/;
        const match = str.match(regex);
        if (!match) {
            throw new Error(`Invalid triad string: ${str}`);
        }

        const root = new PitchClass(PitchClass.parse(match[1]).value);
        const mode = match[2] === "m" ? "m" : "M";
        return new Triad(root, mode);
    }

    getChordTones(): PitchClass[] {
        switch (this.mode) {
            case "M":
                return Interval.map([0, 4, 7]).map(interval => this.root.add(interval));
            case "m":
                return Interval.map([0, 3, 7]).map(interval => this.root.add(interval));
        }
    }

    // 指定キーを主音とみなした度数表記(ローマ数字)へ変換する
    degreeIn(key: PitchClass): DegreeTriad {
        return new DegreeTriad(this.root.getDegree(key), this.mode);
    }
}

// 全ルート×全モードの組み合わせ(24通り)。「直接コードを選ぶ」候補一覧などに使う
export function allTriads(): readonly Triad[] {
    return allModes.flatMap(mode => PitchClass.all.map(root => new Triad(root, mode)));
}

export class DegreeTriad {
    readonly degree: Degree;
    readonly mode: Mode;

    constructor(degree: Degree, mode: Mode) {
        this.degree = degree;
        this.mode = mode;
    }
    equals(other: DegreeTriad): boolean {
        return this.degree.equals(other.degree) && this.mode === other.mode;
    }

    toString(): string {
        return `${this.degree.toString()}${ModeToNotation(this.mode)}`;
    }

    static parse(str: string): DegreeTriad {
        const regex = /^([IV]+)([Mm]?)$/;
        const match = str.match(regex);
        if (!match) {
            throw new Error(`Invalid triad degree string: ${str}`);
        }

        const degree = Degree.parse(match[1]);
        const mode = match[2] === "m" ? "m" : "M";
        return new DegreeTriad(degree, mode);
    }
}
