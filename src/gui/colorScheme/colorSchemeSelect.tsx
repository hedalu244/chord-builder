import { useColorScheme } from "./colorSchemeContext";
// 構成音の配色パターン。各スキームはCSS側の .color-scheme-{id} クラスに対応し、
// PitchClass.value (0-11) ごとの色をCSS変数として定義する
export type ColorSchemeId = "chromatic" | "fifths" | "axisSystem";

export const COLOR_SCHEMES: readonly { readonly id: ColorSchemeId; readonly label: string }[] = [
	{ id: "chromatic", label: "Chromatic" },
	{ id: "fifths", label: "Circle of Fifths" },
	{ id: "axisSystem", label: "Axis System" },
];

export function colorSchemeClassName(id: ColorSchemeId): string {
	return `color-scheme-${id}`;
}

export function ColorSchemeSelect() {
	const { colorScheme, setColorScheme } = useColorScheme();
	return (
		<label className="color-scheme-select">
			<span className="color-scheme-select__label">Color Scheme</span>
			<select
				className="color-scheme-select__control"
				value={colorScheme}
				onChange={event => setColorScheme(event.target.value as ColorSchemeId)}
			>
				{COLOR_SCHEMES.map(scheme => (
					<option key={scheme.id} value={scheme.id}>{scheme.label}</option>
				))}
			</select>
		</label>
	);
}
