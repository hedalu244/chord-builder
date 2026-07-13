import { useState } from "react";
import { ContextScale, knownScaleNames } from "../basics/contextScale";
import { PitchClass } from "../basics/pitch";
import { Triad } from "../basics/triad";
import { Modal } from "./parts/modal";
import { TonnetzLayer } from "./parts/tonnetz";
import { TonnetzScaleSelector } from "./parts/tonnetzScaleSelector";

type ContextScaleModalProps = {
	readonly value: ContextScale;
	// 参照表示用: このcontextScaleの前後のコードのトライアド。あればトネッツ図の下層にオーバーレイ表示する
	readonly formerTriad?: Triad;
	readonly latterTriad?: Triad;
	readonly onConfirm: (contextScale: ContextScale) => void;
	readonly onCancel: () => void;
};

// スケール名はプルダウンで選び、key(スケールを置く位置)はトネッツ図上で選ぶ。
// keyのプルダウンも同等の操作として残してある
export function ContextScaleModal(props: ContextScaleModalProps) {
	const { value, formerTriad, latterTriad, onConfirm, onCancel } = props;
	const [key, setKey] = useState<PitchClass>(value.key);
	const [name, setName] = useState<string>(value.name);

	const referenceTriads = [formerTriad, latterTriad].filter((triad): triad is Triad => triad !== undefined);
	const referenceLayers: TonnetzLayer[] = referenceTriads.length > 0
		? [{ className: "neighbor", triads: referenceTriads }]
		: [];

	return (
		<Modal className="context-scale-modal" title="Edit Context Scale" onCancel={onCancel} onConfirm={() => onConfirm(new ContextScale(key, name))}>
			<div className="context-scale-modal__controls">
				<select
					value={String(key.value)}
					onChange={event => setKey(PitchClass.all[Number(event.target.value)])}
				>
					{PitchClass.all.map(pc => (
						<option key={pc.value} value={pc.value}>{pc.toString()}</option>
					))}
				</select>
				<select
					value={name}
					onChange={event => setName(event.target.value)}
				>
					{knownScaleNames.map(scaleName => (
						<option key={scaleName} value={scaleName}>{scaleName}</option>
					))}
				</select>
			</div>
			<TonnetzScaleSelector
				scale={new ContextScale(key, name).getScale()}
				value={key}
				onChange={setKey}
				referenceLayers={referenceLayers}
			/>
		</Modal>
	);
}
