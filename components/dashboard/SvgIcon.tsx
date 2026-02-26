type SvgIconProps = {
  svgContent: string;
  className?: string;
};

export default function SvgIcon({ svgContent, className }: SvgIconProps) {
  return (
    <span
      className={`inline-block [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
