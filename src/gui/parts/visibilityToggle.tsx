// 前後のコード・スケールなど、参照対象のトネッツ図への表示切替(目のアイコンのトグルボタン)
export function VisibilityToggle(props: { readonly label: string; readonly visible: boolean; readonly onToggle: () => void }) {
	const { label, visible, onToggle } = props;
	return (
		<button
			type="button"
			className={visible ? "visibility-toggle visibility-toggle--on" : "visibility-toggle"}
			title={visible ? `Hide ${label} on Tonnetz` : `Show ${label} on Tonnetz`}
			aria-pressed={visible}
			onClick={onToggle}
		>
			<img src={visible ? "icons/eye.svg" : "icons/eye-off.svg"} alt="" />
		</button>
	);
}
