import { Chord } from "../../basics/chord";

type ChordNotationProps = {
	readonly chord: Chord;
};

// コード表記のうちテンション・省略の括弧書きを添え字(sup)として小さく表示する。
// フォントサイズは持たず、置かれた場所の文字サイズに追従する
export function ChordNotation(props: ChordNotationProps) {
	const { chord } = props;
	const parts = chord.getSyntheticNotationParts();
	return (
		<span className="chord-notation">
			{parts.base}
			{parts.tension && <sup>{parts.tension}</sup>}
			{parts.omit && <sup>{parts.omit}</sup>}
		</span>
	);
}
