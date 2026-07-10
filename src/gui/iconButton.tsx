type IconButtonProps = {
	readonly icon: string;
	readonly label: string;
	readonly className?: string;
	readonly onClick: () => void;
};

export function IconButton(props: IconButtonProps) {
	const { icon, label, className, onClick } = props;
	return (
		<button type="button" className={className ? `icon-button ${className}` : "icon-button"} onClick={onClick} title={label}>
			<img className="icon-button__icon" src={icon} alt={label} />
		</button>
	);
}
