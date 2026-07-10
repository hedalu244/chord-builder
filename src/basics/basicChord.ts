import { Degree, PitchClass } from "./pitch";

export type Mode = "M" | "m";

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
}
