import { ReactNode } from "react";

type ModalProps = {
	// 個々のモーダル固有の見た目調整用クラス名(例: "quality-modal")
	readonly className?: string;
	readonly title: string;
	readonly children: ReactNode;
	readonly onCancel: () => void;
	readonly onConfirm: () => void;
	readonly confirmLabel?: string;
	readonly confirmDisabled?: boolean;
};

// backdrop/タイトル/確定・キャンセルボタンという、全モーダル共通の外枠。
// タイトル・本体・確定ボタンの挙動を注入して使う
export function Modal(props: ModalProps) {
	const { className, title, children, onCancel, onConfirm, confirmLabel = "OK", confirmDisabled = false } = props;
	return (
		<div className="modal__backdrop">
			<div className={className ? `modal ${className}` : "modal"}>
				<div className="modal__title">{title}</div>
				{children}
				<div className="modal__actions">
					<button type="button" className="modal__cancel-button" onClick={onCancel}>Cancel</button>
					<button type="button" className="modal__confirm-button" disabled={confirmDisabled} onClick={onConfirm}>{confirmLabel}</button>
				</div>
			</div>
		</div>
	);
}
