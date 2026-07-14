import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { COLOR_SCHEMES, ColorSchemeId, colorSchemeClassName } from "./colorSchemeSelect";

const STORAGE_KEY = "chord-builder:color-scheme";
const DEFAULT_SCHEME: ColorSchemeId = "chromatic";

function isColorSchemeId(value: string | null): value is ColorSchemeId {
	return COLOR_SCHEMES.some(scheme => scheme.id === value);
}

function loadStoredScheme(): ColorSchemeId {
	const stored = localStorage.getItem(STORAGE_KEY);
	return isColorSchemeId(stored) ? stored : DEFAULT_SCHEME;
}

type ColorSchemeContextValue = {
	readonly colorScheme: ColorSchemeId;
	readonly setColorScheme: (scheme: ColorSchemeId) => void;
};

const ColorSchemeContext = createContext<ColorSchemeContextValue | undefined>(undefined);

export function ColorSchemeProvider(props: { readonly children: ReactNode }) {
	const [colorScheme, setColorScheme] = useState<ColorSchemeId>(loadStoredScheme);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, colorScheme);
	}, [colorScheme]);

	// カラースキームのCSS変数はbodyに付与する。body直下にポータルで描画されるモーダルにも継承させるため
	useEffect(() => {
		const className = colorSchemeClassName(colorScheme);
		document.body.classList.add(className);
		return () => document.body.classList.remove(className);
	}, [colorScheme]);

	return (
		<ColorSchemeContext.Provider value={{ colorScheme, setColorScheme }}>
			{props.children}
		</ColorSchemeContext.Provider>
	);
}

export function useColorScheme(): ColorSchemeContextValue {
	const context = useContext(ColorSchemeContext);
	if (!context) throw new Error("useColorScheme must be used within a ColorSchemeProvider");
	return context;
}
