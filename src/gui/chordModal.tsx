import { useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Chord } from "../basics/chord";
import { PitchClass } from "../basics/pitch";
import { Modal } from "./parts/modal";
import { ChordTones } from "./parts/chordTones";
import { EditableToneRow } from "./parts/toneRow";

// 構成音チェックボックスの並びはCに固定し、トライアドを切り替えても位置が動かないようにする
const TONE_ROW_ROOT = new PitchClass(0);

function optionButtonClassName(selected: boolean): string {
	return selected ? "option-button option-button--selected" : "option-button";
}

function setEquals(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
	return a.size === b.size && [...a].every(value => b.has(value));
}

type ChordModalProps = {
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(プレースホルダーへの新規設定向け)
	readonly initialChord: Chord | null;
	readonly onConfirm: (chord: Chord) => void;
	readonly onCancel: () => void;
};

export function ChordModal(props: ChordModalProps) {
	const { initialChord, onConfirm, onCancel } = props;
	const [triad, setTriad] = useState<Triad | null>(initialChord?.triad ?? null);
	const [activeValues, setActiveValues] = useState<ReadonlySet<number>>(
		() => new Set((initialChord?.chordTones ?? []).map(tone => tone.value))
	);

	// 新規設定(initialChordなし)か既存コードの変更かで、タイトルと確定ボタンの表示を分ける
	const isNewChord = initialChord === null;

	// トライアドの選び直しでは基本的に構成音の選択に触れない（デフォルトに戻したい場合は明示的にリセットボタンを押す）が、
	// 未選択状態からの初回選択時と、現在の構成音が選択中トライアドのデフォルトと完全に一致している時は自動的にリセットする
	const handleSelectTriad = (candidate: Triad): void => {
		const matchesCurrentTriadTones = triad !== null && setEquals(
			activeValues,
			new Set(triad.getChordTones().map(tone => tone.value))
		);
		if (triad === null || matchesCurrentTriadTones) {
			setActiveValues(new Set(candidate.getChordTones().map(tone => tone.value)));
		}
		setTriad(candidate);
	};

	const handleReset = (): void => {
		if (!triad) return;
		setActiveValues(new Set(triad.getChordTones().map(tone => tone.value)));
	};

	const chord = triad ? new Chord(triad, PitchClass.map(Array.from(activeValues))) : null;

	return (
		<Modal
			className="chord-modal"
			title={isNewChord ? "Insert Chord" : "Select Chord"}
			onCancel={onCancel}
			onConfirm={() => chord && onConfirm(chord)}
			confirmLabel={isNewChord ? "Add" : "OK"}
			confirmDisabled={chord === null}
		>
			<div className="chord-modal__direct-grid">
				{allTriads().map(candidate => (
					<button
						type="button"
						key={candidate.toString()}
						className={optionButtonClassName(triad !== null && triad.equals(candidate))}
						onClick={() => handleSelectTriad(candidate)}
					>
						<span>{candidate.toString()}</span>
						<ChordTones tones={candidate.getChordTones()} />
					</button>
				))}
			</div>
			{triad && chord && (
				<div className="chord-modal__tones">
					<h4>{chord.getSyntheticNotation()}</h4>
					{chord.getKnownNotations().length > 0 && (
						<span className="alt-notations">{chord.getKnownNotations().join(" / ")}</span>
					)}
					<EditableToneRow root={TONE_ROW_ROOT} activeValues={activeValues} onChange={setActiveValues} />
					<button type="button" className="chord-modal__reset-button" onClick={handleReset}>Reset to triad tones</button>
				</div>
			)}
		</Modal>
	);
}
