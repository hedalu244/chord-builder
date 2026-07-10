type Mod12 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

function mod12(number: number): Mod12 {
    const normalized = Math.round(mod(number, 12));
    return normalized as Mod12;
}

// NOTE: Key(PitchClass) + Root(Degree) + Interval + ... + Interval = PitchClass を実現したい

// interval + interval = interval
// degree + interval = intreval + degree = degree
// pitchclass + interval = interval + pitchclass = pitchclass
// pitchclass + degree = degree + pitchclass = pitchclass

// degree + degree, pitchclass + pitchclass は定義されない

// interval - interval = interval
// degree - interval = degree
// pitchclass - interval = pitchclass
// degree - degree = interval
// pitchclass - degree = pitchclass

// pitchclass - pitchclass = degree / interval 関数名で区別


// 任意の音の間の相対的な音程　オクターブは無視
export class Interval {
    private static readonly NAMES = ["P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"];
    private static readonly NAMES_RELATIVE = ["P1", "m2 upper", "M2 upper", "m3 upper", "M3 upper", "P5 lower", "TT", "P5 upper", "M3 lower", "m3 lower", "M2 lower", "m2 lower"];

    private readonly _value: Mod12;
    constructor(pitch: number) { this._value = mod12(pitch); }
    get value(): Mod12 { return this._value; }
    equals(other: Interval): boolean { return this.value === other.value; }

    add(other: Interval): Interval { return new Interval(this.value + other.value); }
    sub(other: Interval): Interval { return new Interval(this.value - other.value); }
    invert(): Interval { return new Interval(-this.value); }

    toString(): string {
        return Interval.NAMES[this.value];
    }

    toStringRelative(): string {
        return Interval.NAMES_RELATIVE[this.value];
    }

    static map(intervals: number[]): Interval[] {
        return intervals.map(interval => new Interval(interval));
    }

    static parse(str: string): Interval {
        const index = Interval.NAMES.indexOf(str);
        if (index === -1) {
            throw new Error(`Unknown interval: ${str}`);
        }
        return new Interval(index);
    }

    static readonly all: readonly Interval[] = Array.from({ length: 12 }, (_, value) => new Interval(value));
}

// スケールの主音=Keyとの相対的な音程
export class Degree {
    private static readonly NAMES = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];

    private readonly _value: Mod12;
    constructor(pitch: number) { this._value = mod12(pitch); }
    get value(): Mod12 { return this._value; }
    equals(other: Degree): boolean { return this.value === other.value; }

    add(interval: Interval): Degree { return new Degree(this.value + interval.value); }
    sub(interval: Interval): Degree { return new Degree(this.value - interval.value); }
    delta(other: Degree): Interval { return new Interval(this.value - other.value); }

    toPitchClass(key: PitchClass): PitchClass { return new PitchClass(key.value + this.value); }

    toString(): string {
        return Degree.NAMES[this.value];
    }

    static map(degrees: number[]): Degree[] {
        return degrees.map(degree => new Degree(degree));
    }

    static parse(str: string): Degree {
        const index = Degree.NAMES.indexOf(str);
        if (index === -1) {
            throw new Error(`Unknown degree: ${str}`);
        }
        return new Degree(index);
    }
}

// Cからの絶対的な音程　ただしオクターブは無視
export class PitchClass {
    private static readonly NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    private static readonly NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    private static readonly SHARP_THRESHOLD = [0, 2, 0, 4, 0, 0, 1, 0, 3, 0, 5, 0];

    private readonly _value: Mod12;
    constructor(pitch: number) { this._value = mod12(pitch); }
    get value(): Mod12 { return this._value; }
    equals(other: PitchClass): boolean { return this.value === other.value; }

    add(interval: Interval): PitchClass { return new PitchClass(this.value + interval.value); }
    sub(interval: Interval): PitchClass { return new PitchClass(this.value - interval.value); }
    delta(other: PitchClass): Interval { return new Interval(this.value - other.value); }

    getKey(degree: Degree): PitchClass { return new PitchClass(this.value - degree.value); }
    getDegree(key: PitchClass): Degree { return new Degree(this.value - key.value); }

    toString(preferSharps: number = 0.5): string {
        const nameSharp = PitchClass.NAMES_SHARP[this.value];
        const nameFlat = PitchClass.NAMES_FLAT[this.value];
        const threshold = PitchClass.SHARP_THRESHOLD[this.value] / 6;

        return (preferSharps >= threshold) ? nameSharp : nameFlat;
    }

    static map(pitchClasses: number[]): PitchClass[] {
        return pitchClasses.map(pitchClass => new PitchClass(pitchClass));
    }

    static parse(str: string): PitchClass {
        const sharpIndex = PitchClass.NAMES_SHARP.indexOf(str);
        if (sharpIndex !== -1) {
            return new PitchClass(sharpIndex);
        }
        const flatIndex = PitchClass.NAMES_FLAT.indexOf(str);
        if (flatIndex !== -1) {
            return new PitchClass(flatIndex);
        }
        throw new Error(`Unknown pitch class: ${str}`);
    }

    static readonly all: readonly PitchClass[] = Array.from({ length: 12 }, (_, value) => new PitchClass(value));
}
