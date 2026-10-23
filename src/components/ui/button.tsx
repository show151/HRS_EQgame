import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]", {
  variants: {
    variant: {
      default: "bg-forest text-white shadow-sm hover:bg-[#24634d]",
      secondary: "bg-lime text-forest hover:bg-[#cbe779]",
      outline: "border border-line bg-white text-ink hover:border-[#b8c9be] hover:bg-[#fbfcfa]",
      ghost: "text-muted hover:bg-[#eff2ed] hover:text-ink",
    },
    size: { default: "h-12 px-6", sm: "h-10 px-4 text-xs", icon: "h-10 w-10" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";
