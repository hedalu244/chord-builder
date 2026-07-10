import { Degree, Interval, PitchClass } from "./pitch";

export type Mode = "M" | "m";

export const allModes: readonly Mode[] = ["M", "m"];

export function ModeToNotation(mode: Mode): string {
    switch (mode) {
        case "M": return "";
        case "m": return "m";
    }
}

export class BasicChord {
    readonly root: PitchClass;
    readonly mode: Mode;

    constructor(root: PitchClass, mode: Mode) {
        this.root = root;
        this.mode = mode;
    }
    equals(other: BasicChord): boolean {
        return this.root.equals(other.root) && this.mode === other.mode;
    }

    toString(): string {
        return `${this.root.toString()}${ModeToNotation(this.mode)}`;
    }

    parse(str: string): BasicChord {
        const regex = /^([A-G][#b]?)([Mm]?)$/;
        const match = str.match(regex);
        if (!match) {
            throw new Error(`Invalid basic chord string: ${str}`);
        }

        const root = new PitchClass(PitchClass.parse(match[1]).value);
        const mode = match[2] === "m" ? "m" : "M";
        return new BasicChord(root, mode);
    }

    getChordTones(): PitchClass[] {
        switch (this.mode) {
            case "M":
                return Interval.map([0, 4, 7]).map(interval => this.root.add(interval));
            case "m":
                return Interval.map([0, 3, 7]).map(interval => this.root.add(interval));
        }
    }
}

export class ChordDegree {
    readonly degree: Degree;
    readonly mode: Mode;

    constructor(degree: Degree, mode: Mode) {
        this.degree = degree;
        this.mode = mode;
    }
    equals(other: ChordDegree): boolean {
        return this.degree.equals(other.degree) && this.mode === other.mode;
    }

    toString(): string {
        return `${this.degree.toString()}${ModeToNotation(this.mode)}`;
    }

    static parse(str: string): ChordDegree {
        const regex = /^([IV]+)([Mm]?)$/;
        const match = str.match(regex);
        if (!match) {
            throw new Error(`Invalid chord degree string: ${str}`);
        }

        const degree = Degree.parse(match[1]);
        const mode = match[2] === "m" ? "m" : "M";
        return new ChordDegree(degree, mode);
    }
}
