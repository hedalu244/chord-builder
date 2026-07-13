import { useState } from "react";
import { PitchClass } from "../../basics/pitch";
import { Scale } from "../../basics/scale";
import { Tonnetz, TonnetzLayer } from "./tonnetz";

type TonnetzScaleSelectorProps = {
	// 選択対象のスケールの形(keyからの相対)
	readonly scale: Scale;
	// 現在のkey
	readonly value: PitchClass;
	readonly onChange: (key: PitchClass) => void;
	// 前後のコードなど、操作対象ではない参照用のオーバーレイを下層に差し込む
	readonly referenceLayers?: readonly TonnetzLayer[];
};

// トネッツ図でスケールのkeyを選ぶUI。スケールの形(構成音のノードを隣接関係で繋いだ図形)を
// マウスの最寄りの頂点にスナップさせてゴースト表示し、クリックでそのkeyに確定する
export function TonnetzScaleSelector(props: TonnetzScaleSelectorProps) {
	const { scale, value, onChange, referenceLayers } = props;
	// ホバー中の最寄り頂点のピッチクラス値。プリミティブで持ち、同値のsetStateで再レンダリングしない
	const [hoverKeyValue, setHoverKeyValue] = useState<number | null>(null);

	const layers: TonnetzLayer[] = [
		...(referenceLayers ?? []),
		{ className: "scale", pitchClasses: scale.getPitchClasses(value), connect: true },
		...(hoverKeyValue !== null && hoverKeyValue !== value.value
			? [{ className: "ghost", pitchClasses: scale.getPitchClasses(new PitchClass(hoverKeyValue)), connect: true }]
			: []),
	];

	return (
		<Tonnetz
			layers={layers}
			onTap={target => onChange(target.nearestPitchClass)}
			onHover={target => setHoverKeyValue(target === null ? null : target.nearestPitchClass.value)}
		/>
	);
}
