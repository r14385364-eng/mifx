interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: string;
}

export function AppLogo({ className = "", size = "md", showText = true, textColor }: AppLogoProps) {
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-14 w-14",
  };

  const textSizeMap = {
    sm: "text-sm",
    md: "text-lg font-black",
    lg: "text-2xl font-black",
    xl: "text-3xl font-black",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.jpg"
        alt="Gotrade Logo"
        className={`${sizeMap[size]} rounded-none object-contain`}
        onError={(e) => {
          // Fallback if image fails to render
          e.currentTarget.style.display = "none";
        }}
      />
      {showText && (
        <span
          className={`font-black tracking-tight ${textSizeMap[size]} ${
            textColor || "text-foreground"
          }`}
        >
          Gotrade
        </span>
      )}
    </div>
  );
}
