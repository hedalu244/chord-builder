// 前後のコード・contextScaleなど、参照対象のトネッツ図への表示切替(目のアイコンのトグルボタン)。
// 対象が存在しない位置ではボタンごと表示しない(呼び出し側でundefinedを渡す)
export function OverlayToggle(props: { readonly label: string; readonly visible: boolean; readonly onToggle: () => void }) {
	const { label, visible, onToggle } = props;
	return (
		<button
			type="button"
			className={visible ? "overlay-toggle overlay-toggle--on" : "overlay-toggle"}
			title={visible ? `Hide ${label} on Tonnetz` : `Show ${label} on Tonnetz`}
			aria-pressed={visible}
			onClick={onToggle}
		>
			<img src={visible ? "icons/eye.svg" : "icons/eye-off.svg"} alt="" />
		</button>
	);
}
