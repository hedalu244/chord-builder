import { useState } from "react";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { PitchClass } from "../basics/pitch";
import { Modal } from "./parts/modal";

type ContextScaleModalProps = {
	readonly value: ContextScale;
	readonly onConfirm: (contextScale: ContextScale) => void;
	readonly onCancel: () => void;
};

// 仮実装: キーとスケール名をプルダウンで選ぶだけのシンプルなモーダル
export function ContextScaleModal(props: ContextScaleModalProps) {
	const { value, onConfirm, onCancel } = props;
	const [key, setKey] = useState<PitchClass>(value.key);
	const [name, setName] = useState<string>(value.name);

	return (
		<Modal className="context-scale-modal" title="Edit Context Scale" onCancel={onCancel} onConfirm={() => onConfirm({ key, name })}>
			<div className="context-scale-modal__controls">
				<select
					className="context-scale-modal__select"
					value={String(key.value)}
					onChange={event => setKey(PitchClass.all[Number(event.target.value)])}
				>
					{PitchClass.all.map(pc => (
						<option key={pc.value} value={pc.value}>{pc.toString()}</option>
					))}
				</select>
				<select
					className="context-scale-modal__select"
					value={name}
					onChange={event => setName(event.target.value)}
				>
					{knownScaleNames.map(scaleName => (
						<option key={scaleName} value={scaleName}>{scaleName}</option>
					))}
				</select>
			</div>
		</Modal>
	);
}
