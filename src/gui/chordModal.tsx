import { useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Chord } from "../basics/chord";
import { PitchClass } from "../basics/pitch";
import { Modal } from "./parts/modal";
import { ChordTones } from "./parts/chordTones";
import { EditableToneRow } from "./parts/toneRow";
import { ChordEditTrigger } from "./progressionEditor";

// 構成音チェックボックスの並びはCに固定し、トライアドを切り替えても位置が動かないようにする
const TONE_ROW_ROOT = new PitchClass(0);

// このモーダルのタイトル。挿入操作か既存コードの編集かで表示を分ける
function modalTitle(trigger: ChordEditTrigger): string {
	return trigger === "changeChord" ? "Select Chord" : "Insert Chord";
}

// 確定ボタンのラベル。挿入操作ではAdd、既存コードの編集ではOKにする
function confirmButtonLabel(trigger: ChordEditTrigger): string {
	return trigger === "changeChord" ? "OK" : "Add";
}

function directButtonClassName(active: boolean): string {
	return active ? "chord-modal__direct-button chord-modal__direct-button--active" : "chord-modal__direct-button";
}

type ChordModalProps = {
	readonly trigger: ChordEditTrigger;
	// nullの場合は「まだ何も選択していない」状態でモーダルを開く(挿入操作向け)
	readonly initialChord: Chord | null;
	readonly onConfirm: (chord: Chord) => void;
	readonly onCancel: () => void;
};

export function ChordModal(props: ChordModalProps) {
	const { trigger, initialChord, onConfirm, onCancel } = props;
	const [triad, setTriad] = useState<Triad | null>(initialChord?.triad ?? null);
	const [activeValues, setActiveValues] = useState<ReadonlySet<number>>(
		() => new Set((initialChord?.chordTones ?? []).map(tone => tone.value))
	);

	// トライアドの選び直しでは構成音の選択に触れない。デフォルトに戻したい場合は明示的にリセットボタンを押す
	const handleSelectTriad = (candidate: Triad): void => {
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
			title={modalTitle(trigger)}
			onCancel={onCancel}
			onConfirm={() => chord && onConfirm(chord)}
			confirmLabel={confirmButtonLabel(trigger)}
			confirmDisabled={chord === null}
		>
			<div className="chord-modal__direct-grid">
				{allTriads().map(candidate => (
					<button
						type="button"
						key={candidate.toString()}
						className={directButtonClassName(triad !== null && triad.equals(candidate))}
						onClick={() => handleSelectTriad(candidate)}
					>
						<span>{candidate.toString()}</span>
						<ChordTones tones={candidate.getChordTones()} />
					</button>
				))}
			</div>
			{triad && chord && (
				<div className="chord-modal__tones">
					<h4 className="chord-modal__notation">{chord.getSyntheticNotation()}</h4>
					{chord.getKnownNotations().length > 0 && (
						<span className="chord-modal__alt-notations">{chord.getKnownNotations().join(" / ")}</span>
					)}
					<EditableToneRow root={TONE_ROW_ROOT} activeValues={activeValues} onChange={setActiveValues} />
					<button type="button" className="chord-modal__reset-button" onClick={handleReset}>Reset to triad tones</button>
				</div>
			)}
		</Modal>
	);
}
