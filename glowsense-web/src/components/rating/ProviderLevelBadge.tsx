"use client";

interface ProviderLevelBadgeProps {
  level: string;
  levelInfo?: {
    name: string;
    color: string;
    icon: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProviderLevelBadge({ 
  level, 
  levelInfo, 
  size = "md",
  className = "" 
}: ProviderLevelBadgeProps) {
  // Default level info if not provided
  const getLevelInfo = () => {
    if (levelInfo) return levelInfo;
    
    switch (level) {
      case "expert":
        return { name: "Expert", color: "purple", icon: "👑" };
      case "skilled":
        return { name: "Skilled", color: "blue", icon: "⭐" };
      default:
        return { name: "Beginner", color: "gray", icon: "🌱" };
    }
  };

  const info = getLevelInfo();
  
  // Color classes based on level
  const colorClasses = {
    purple: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700",
    blue: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
    gray: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
  };

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full border-2
        ${colorClasses[info.color as keyof typeof colorClasses] || colorClasses.gray}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className={iconSize[size]}>{info.icon}</span>
      <span>{info.name}</span>
    </span>
  );
}

