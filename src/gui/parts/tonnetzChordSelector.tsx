import { PitchClass } from "../../basics/pitch";
import { Triad } from "../../basics/triad";
import { Tonnetz, TonnetzLayer } from "./tonnetz";

type TonnetzChordSelectorProps = {
	readonly triad: Triad | null;
	readonly activeValues: ReadonlySet<number>;
	// 三角形のクリック(ラジオボタン式のトライアド選択)
	readonly onSelectTriad: (triad: Triad) => void;
	// 頂点のクリック(チェックボックス式の構成音トグル)。トライアドの構成音も外せる
	readonly onToggleTone: (value: number) => void;
	// 前後のコードやcontextScaleなど、操作対象ではない参照用のオーバーレイを下層に差し込む
	readonly referenceLayers?: readonly TonnetzLayer[];
};

// トネッツ図でコードのベースとなるトライアドと構成音を選ぶUI。
// 状態は持たず、chordModalと同じ表現(triad + activeValues)をそのまま受け渡しする
export function TonnetzChordSelector(props: TonnetzChordSelectorProps) {
	const { triad, activeValues, onSelectTriad, onToggleTone, referenceLayers } = props;

	const layers: TonnetzLayer[] = [
		...(referenceLayers ?? []),
		...(triad ? [{ className: "triad", triads: [triad] }] : []),
		{ className: "tone", pitchClasses: PitchClass.map([...activeValues]) },
	];

	return (
		<Tonnetz
			layers={layers}
			onTap={target => {
				if (target.onNode) {
					onToggleTone(target.nearestPitchClass.value);
				} else {
					onSelectTriad(target.triad);
				}
			}}
		/>
	);
}
