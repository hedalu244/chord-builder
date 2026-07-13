import { AnimationEvent, ReactNode } from "react";

// progressionEditorの1行(chord行/scale行)分のスロット列。スロットの並びに加えて、
// 挿入直後のプッシュアニメーションと、shiftで取り除かれた要素の退場ゴーストの差し込みを担う。
// 各スロットに何を描くか(カード/プレースホルダーの選択)には関知しない

// shiftで取り除かれた直後の要素は、配列からは既に消えているが、フェードアウト+幅つぶれの
// アニメーションが終わるまでは見た目上その場に残しておきたい。取り除かれる直前の見た目を
// (非操作的なコピーとして)スナップショットして保持し、アニメーション終了で消し去る。
// indexは取り除かれた(=今はその位置に後続の要素が詰めてきている)位置を指す。
export type ExitGhost = {
	readonly id: number;
	readonly index: number;
	readonly node: ReactNode;
} | null;

type SlotRowProps = {
	readonly className: string;
	readonly items: readonly { readonly id: number }[];
	readonly renderContent: (index: number) => ReactNode;
	// プッシュアニメーションの対象スロットのindex。なければnull
	readonly insertAnimationIndex: number | null;
	readonly onInsertAnimationEnd: () => void;
	// ghost.indexの位置(または末尾)に、通常のスロットと同じ見た目で差し込む
	readonly ghost: ExitGhost;
	readonly onGhostAnimationEnd: () => void;
};

export function SlotRow(props: SlotRowProps) {
	const { className, items, renderContent, insertAnimationIndex, onInsertAnimationEnd, ghost, onGhostAnimationEnd } = props;

	// スロット内の子要素のアニメーションに反応しないよう、スロット自身のanimationendだけを拾う
	const onOwnAnimationEnd = (handler: () => void) => (event: AnimationEvent<HTMLDivElement>): void => {
		if (event.currentTarget === event.target) handler();
	};

	const renderGhost = (currentGhost: NonNullable<ExitGhost>): ReactNode => (
		<div
			key={`ghost-${currentGhost.id}`}
			className="progression-editor__slot progression-editor__slot--exiting"
			onAnimationEnd={onOwnAnimationEnd(onGhostAnimationEnd)}
		>
			{currentGhost.node}
		</div>
	);

	const nodes: ReactNode[] = [];
	items.forEach((item, index) => {
		if (ghost && ghost.index === index) {
			nodes.push(renderGhost(ghost));
		}
		nodes.push(
			<div
				key={item.id}
				className={insertAnimationIndex === index
					? "progression-editor__slot progression-editor__slot--insert-push"
					: "progression-editor__slot"}
				onAnimationEnd={onOwnAnimationEnd(onInsertAnimationEnd)}
			>
				{renderContent(index)}
			</div>
		);
	});
	if (ghost && ghost.index === items.length) {
		nodes.push(renderGhost(ghost));
	}

	return <div className={className}>{nodes}</div>;
}
