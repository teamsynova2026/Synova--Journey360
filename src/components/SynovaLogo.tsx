import React from "react";

const SYNOVA_LOGO_SRC =
  "/assets/aistudio/logo-synova-only.png_7f8eae68.png";

const JOURNEY360_LOGO_SRC =
  "/assets/aistudio/logo-journey360-only.png_43c67344.png";

type SynovaLogoVariant = "signin" | "header" | "footer";

const SYNOVA_VARIANT_CLASSES: Record<SynovaLogoVariant, string> = {
  signin: "w-[140px] h-auto",
  header: "h-[32px] w-auto",
  footer: "h-[20px] w-auto",
};

interface SynovaLogoProps {
  variant?: SynovaLogoVariant;
  className?: string;
}

export const SynovaLogo: React.FC<SynovaLogoProps> = ({
  variant = "header",
  className = "",
}) => {
  return (
    <img
      src={SYNOVA_LOGO_SRC}
      alt="Synova"
      className={`block object-contain shrink-0 ${SYNOVA_VARIANT_CLASSES[variant]} ${className}`}
    />
  );
};

type Journey360LogoVariant = "signin" | "header";

const JOURNEY360_VARIANT_CLASSES: Record<Journey360LogoVariant, string> = {
  signin: "w-[260px] max-w-full h-auto",
  header: "h-[32px] w-auto",
};

interface Journey360LogoProps {
  variant?: Journey360LogoVariant;
  className?: string;
}

export const Journey360Logo: React.FC<Journey360LogoProps> = ({
  variant = "header",
  className = "",
}) => {
  return (
    <img
      src={JOURNEY360_LOGO_SRC}
      alt="Journey360"
      className={`block object-contain shrink-0 ${JOURNEY360_VARIANT_CLASSES[variant]} ${className}`}
    />
  );
};
