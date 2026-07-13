import { ReactNode } from "react";

// 汎用のタブUI。タブボタンの列とアクティブなタブのコンテンツを描画する。
// どのタブを開いているかは呼び出し側がmodeで管理する制御コンポーネントであり、
// 切り替え操作はonSwitchで呼び出し側に通知する。
// アクティブでないタブのコンテンツはアンマウントされる

export type Tab<T> = {
	readonly label: string;
	readonly mode: T;
	readonly content: ReactNode;
};

type TabsProps<T> = {
	readonly tabs: readonly Tab<T>[];
	readonly mode: T;
	readonly onSwitch: (mode: T) => void;
};

export function Tabs<T>(props: TabsProps<T>) {
	const { tabs, mode, onSwitch } = props;
	return (
		<>
			<div className="tabs" role="tablist">
				{tabs.map(tab => (
					<button
						type="button"
						key={tab.label}
						role="tab"
						aria-selected={tab.mode === mode}
						className={tab.mode === mode ? "tabs__button tabs__button--active" : "tabs__button"}
						onClick={() => tab.mode !== mode && onSwitch(tab.mode)}
					>
						{tab.label}
					</button>
				))}
			</div>
			{tabs.find(tab => tab.mode === mode)?.content}
		</>
	);
}
