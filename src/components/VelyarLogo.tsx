interface VelyarLogoProps {
  className?: string;
  size?: number;
}

export const VelyarLogo = ({ className = "", size = 48 }: VelyarLogoProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Octopus body */}
      <ellipse cx="50" cy="40" rx="20" ry="15" fill="currentColor" opacity="0.9"/>
      
      {/* Octopus head */}
      <circle cx="50" cy="35" r="18" fill="currentColor"/>
      
      {/* Eyes */}
      <circle cx="45" cy="32" r="3" fill="white"/>
      <circle cx="55" cy="32" r="3" fill="white"/>
      <circle cx="45" cy="32" r="1.5" fill="black"/>
      <circle cx="55" cy="32" r="1.5" fill="black"/>
      
      {/* Tentacles */}
      <path d="M30 50 Q25 60 30 70 Q35 65 30 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M38 52 Q30 65 35 75 Q42 70 38 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M62 52 Q70 65 65 75 Q58 70 62 58" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M70 50 Q75 60 70 70 Q65 65 70 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      
      {/* More tentacles for depth */}
      <path d="M35 54 Q28 68 33 78 Q40 73 35 60" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M65 54 Q72 68 67 78 Q60 73 65 60" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M45 56 Q38 72 43 82 Q50 77 45 62" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M55 56 Q62 72 57 82 Q50 77 55 62" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      
      {/* Suction cups */}
      <circle cx="32" cy="62" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="34" cy="68" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="66" cy="62" r="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="66" cy="68" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="41" cy="70" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="59" cy="70" r="1" fill="currentColor" opacity="0.6"/>
    </svg>
  );
};