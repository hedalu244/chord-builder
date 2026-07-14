import { ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
	// 個々のモーダル固有の見た目調整用クラス名(例: "chord-modal")
	readonly className?: string;
	readonly title: string;
	readonly children: ReactNode;
	readonly onCancel: () => void;
	readonly onConfirm: () => void;
	readonly confirmLabel?: string;
	readonly confirmDisabled?: boolean;
};

// backdrop/タイトル/確定・キャンセルボタンという、全モーダル共通の外枠。
// タイトル・本体・確定ボタンの挙動を注入して使う。
// 呼び出し元のスタッキングコンテキスト(カード等のz-index)に閉じ込められないよう、body直下にポータルで描画する
export function Modal(props: ModalProps) {
	const { className, title, children, onCancel, onConfirm, confirmLabel = "OK", confirmDisabled = false } = props;
	return createPortal(
		<div className="modal__backdrop">
			<div className={className ? `modal ${className}` : "modal"}>
				<div className="modal__title">{title}</div>
				{children}
				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel}</button>
				</div>
			</div>
		</div>,
		document.body
	);
}
