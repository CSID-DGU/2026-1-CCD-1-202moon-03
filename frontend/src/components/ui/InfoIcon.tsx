import questionMarkIcon from '../../assets/icons/questionMark.svg';

interface InfoIconProps {
  className?: string;
}

function InfoIcon({ className = 'h-6 w-6' }: InfoIconProps) {
  return <img src={questionMarkIcon} alt="" aria-hidden="true" className={className} />;
}

export default InfoIcon;
