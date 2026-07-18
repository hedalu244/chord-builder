import { PointerEvent as ReactPointerEvent, useState } from "react";
import { Chord } from "../../basics/chord";
import { generateVoicing, noteName, Voicing } from "../../basics/voicing";
import { IconButton } from "../parts/iconButton";

// ピアノロールの1半音分の行の高さ(px)。行背景・ノートブロックの配置はすべてこの値から計算する
const ROW_HEIGHT = 12;
// 左端のオクターブラベル(C2, C3, ...)用ガターの幅(px)
const GUTTER_WIDTH = 24;
// 既定の表示音域(C2..C6)。ボイシングがはみ出す場合はオクターブ単位で拡張する
const BASE_MIN_NOTE = 36;
const BASE_MAX_NOTE = 84;
// この距離(px)を超えて動いたらクリック(削除)ではなくドラッグ(オクターブ移動)とみなす
const DRAG_THRESHOLD = 5;

const BLACK_KEY_VALUES = new Set([1, 3, 6, 8, 10]);

// アクティブなノートブロックのドラッグ中の状態。オクターブ移動のプレビューに使う
type DragState = {
    readonly note: number;
    readonly startClientY: number;
    readonly octaveShift: number; // 現在のドラッグ位置に対応する移動量(オクターブ数、上方向が正)
    readonly moved: boolean;
};

type VoicingPanelProps = {
    readonly chord: Chord;
    readonly voicing: Voicing;
    readonly onChange: (next: Voicing) => void;
};

export function VoicingPanel(props: VoicingPanelProps) {
    const { chord, voicing, onChange } = props;
    const [drag, setDrag] = useState<DragState | null>(null);

    // 表示音域。オクターブ境界(C)に揃える
    const minNote = 12 * Math.floor(Math.min(BASE_MIN_NOTE, ...voicing) / 12);
    const maxNote = 12 * Math.ceil(Math.max(BASE_MAX_NOTE, ...voicing) / 12);
    const noteToTop = (note: number): number => (maxNote - note) * ROW_HEIGHT;

    const activeNotes = new Set(voicing);

    // コードトーンの候補 = 各構成音のピッチクラスを表示音域内の全オクターブに展開したもの
    const candidates: number[] = [];
    for (const tone of chord.chordTones) {
        for (let note = minNote + tone.value; note <= maxNote; note += 12) {
            candidates.push(note);
        }
    }

    const commit = (notes: readonly number[]): void => {
        onChange([...new Set(notes)].sort((a, b) => a - b));
    };

    // ドラッグ先が表示音域からはみ出さないようオクターブ移動量を制限する
    const clampOctaveShift = (note: number, rawShift: number): number => {
        const lowest = -Math.floor((note - minNote) / 12);
        const highest = Math.floor((maxNote - note) / 12);
        return Math.max(lowest, Math.min(highest, rawShift));
    };

    const handlePointerDown = (note: number) => (event: ReactPointerEvent<HTMLButtonElement>): void => {
        if (!event.isPrimary) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrag({ note, startClientY: event.clientY, octaveShift: 0, moved: false });
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>): void => {
        if (drag === null) return;
        const deltaY = event.clientY - drag.startClientY;
        setDrag({
            ...drag,
            moved: drag.moved || Math.abs(deltaY) > DRAG_THRESHOLD,
            octaveShift: clampOctaveShift(drag.note, Math.round(-deltaY / ROW_HEIGHT / 12)),
        });
    };

    const handlePointerUp = (): void => {
        if (drag === null) return;
        setDrag(null);
        const isActive = activeNotes.has(drag.note);
        // 動かさずに離した場合はタップ = トグル(アクティブなら削除、候補なら追加)
        if (!drag.moved) {
            commit(isActive ? voicing.filter(note => note !== drag.note) : [...voicing, drag.note]);
            return;
        }
        // オクターブ移動はアクティブなノートのみ
        if (!isActive) return;
        const target = drag.note + drag.octaveShift * 12;
        // 移動先に同じノートがすでにある場合は、マージで音が消えてしまわないよう何もしない
        if (target === drag.note || activeNotes.has(target)) return;
        commit([...voicing.filter(note => note !== drag.note), target]);
    };

    // 行背景(黒鍵行の縞・オクターブ境界線)を上(maxNote)から順に描く
    const rows = [];
    for (let note = maxNote; note >= minNote; note--) {
        const rowClass = [
            "voicing-panel__row",
            BLACK_KEY_VALUES.has(note % 12) ? "voicing-panel__row--black" : "",
            note % 12 === 0 ? "voicing-panel__row--octave" : "",
        ].filter(name => name !== "").join(" ");
        rows.push(<div key={note} className={rowClass} style={{ height: ROW_HEIGHT }} />);
    }

    return (
        <div className="voicing-panel">
            <span className="voicing-panel__label">Voicing</span>
            <IconButton icon="icons/reroll.svg" label="Reroll voicing" onClick={() => onChange(generateVoicing(chord))} />
            <div className="voicing-panel__roll" style={{ height: (maxNote - minNote + 1) * ROW_HEIGHT }}>
                {rows}
                {Array.from({ length: maxNote / 12 - minNote / 12 + 1 }, (_, i) => minNote + i * 12).map(note => (
                    <span key={note} className="voicing-panel__octave-label" style={{ top: noteToTop(note) - 2 }}>
                        {noteName(note)}
                    </span>
                ))}
                {candidates.map(note => {
                    const active = activeNotes.has(note);
                    const pitchClassValue = note % 12;
                    const dragging = active && drag !== null && drag.note === note && drag.moved;
                    const className = [
                        "voicing-panel__note",
                        active ? "voicing-panel__note--active" : "",
                        dragging ? "voicing-panel__note--dragging" : "",
                    ].filter(name => name !== "").join(" ");
                    return (
                        <button
                            type="button"
                            key={note}
                            className={className}
                            title={active ? `${noteName(note)} (click: remove, drag: move octave)` : `${noteName(note)} (click: add)`}
                            style={{
                                // 行の上下1pxを空けて、隣接する半音のブロックと区切って見せる
                                top: noteToTop(note) + 1,
                                left: GUTTER_WIDTH,
                                height: ROW_HEIGHT - 2,
                                background: active ? `var(--pc-${pitchClassValue}-basic)` : `var(--pc-${pitchClassValue}-light)`,
                                transform: dragging ? `translateY(${-drag.octaveShift * 12 * ROW_HEIGHT}px)` : undefined,
                            }}
                            onPointerDown={handlePointerDown(note)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={() => setDrag(null)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
