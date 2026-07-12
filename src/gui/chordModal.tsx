import { useState } from "react";
import { allTriads, Triad } from "../basics/triad";
import { Modal } from "./parts/modal";
import { ChordTones } from "./parts/chordTones";
import { ChordEditTrigger } from "./progressionEditor";

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
	readonly initialChord: Triad | null;
	readonly onConfirm: (chord: Triad) => void;
	readonly onCancel: () => void;
};

export function ChordModal(props: ChordModalProps) {
	const { trigger, initialChord, onConfirm, onCancel } = props;
	const [chord, setChord] = useState<Triad | null>(initialChord);

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
						className={directButtonClassName(chord !== null && chord.equals(candidate))}
						onClick={() => setChord(candidate)}
					>
						<span>{candidate.toString()}</span>
						<ChordTones tones={candidate.getChordTones()} />
					</button>
				))}
			</div>
		</Modal>
	);
}
