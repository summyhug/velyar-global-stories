interface VelyarLogoProps {
  className?: string;
  size?: number;
}

export const VelyarLogo = ({ className = "", size = 48 }: VelyarLogoProps) => {
  return (
    <img 
      src="/lovable-uploads/1f594a6c-a474-4917-ab72-71c584ff430e.png"
      alt="Velyar Logo"
      width={size}
      height={size}
      className={className}
    />
  );
};