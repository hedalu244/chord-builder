import { ReactNode } from "react";

// method-tab系モーダル(BasicChordModal/NexusChangeModal)で共通の「3択タブ切替」の骨格。
// タブごとにボタンの中身/スタイルとコンテンツを自由に注入できるようにし、
// 「どのコンテンツを表示するか」の判定だけをここで担う。
// タブ切替時の状態更新(selectedNexusの再検証やchordの再計算など)は親の責務とし、
// MethodTabはonChangeで切替イベントを通知するだけにとどめる

export type MethodTabItem<Key extends string> = {
	readonly key: Key;
	// 非活性タブ(隣接コードが存在せず選択できない先頭/末尾のformerNexus/latterNexusタブなど)
	readonly disabled?: boolean;
	readonly button: ReactNode;
	// 非活性タブは選択されえないのでcontentはundefinedでよい
	readonly content?: ReactNode;
	// ボタンのクラス名。省略時はactive/inactiveの標準スタイルを使う
	readonly buttonClassName?: (active: boolean) => string;
};

type MethodTabProps<Key extends string> = {
	readonly tabs: readonly MethodTabItem<Key>[];
	readonly active: Key;
	readonly onChange: (key: Key) => void;
};

// 標準スタイルのボタンクラス名。中央タブなど装飾を追加したい場合はこれを合成して使う
export function methodTabButtonClassName(active: boolean): string {
	return active ? "method-tab-button method-tab-button--active" : "method-tab-button";
}

const disabledMethodTabButtonClassName = "method-tab-button method-tab-button--disabled";

export function MethodTab<Key extends string>(props: MethodTabProps<Key>) {
	const { tabs, active, onChange } = props;

	return (
		<>
			<div className="method-tab-row">
				{tabs.map(tab => (
					tab.disabled ? (
						<button key={tab.key} type="button" className={disabledMethodTabButtonClassName} disabled></button>
					) : (
						<button
							key={tab.key}
							type="button"
							className={(tab.buttonClassName ?? methodTabButtonClassName)(tab.key === active)}
							onClick={() => onChange(tab.key)}
						>
							{tab.button}
						</button>
					)
				))}
			</div>
			<div className="method-tab-content">
				{tabs.find(tab => tab.key === active)?.content}
			</div>
		</>
	);
}
