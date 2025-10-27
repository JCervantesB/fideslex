import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Botón principal: SIEMPRE bien contrastado en ambos modos
        default: "bg-primary text-primary-foreground hover:bg-primary-light shadow-elegant",
        // Botón destructivo: color de fondo y texto correctos en ambos modos
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: borde e interacción con variable de primary
        outline: "border-2 border-input bg-background text-foreground hover:bg-muted hover:border-primary",
        // Secundario: gradiente adecuado y texto bien contrastado
        secondary: "gradient-accent text-secondary-foreground hover:opacity-90 shadow-md",
        // Ghost: fondo interactivo, texto siempre legible
        ghost: "hover:bg-muted hover:text-foreground bg-transparent text-foreground",
        // Link/acento: texto con variable, hover en acento claro
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-light",
        // Hero: gradiente y texto negro para máxima visibilidad en ambos modos
        hero: "gradient-hero text-primary-foreground shadow-elegant text-lg font-bold hover:opacity-90 hover:shadow-xl transition-opacity transition-shadow",
        // Botón CTA/acento: color llamativo y texto bien contrastado
        cta: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 rounded-md px-4 text-sm",
        lg: "h-14 rounded-lg px-10 text-lg",
        xl: "h-16 rounded-lg px-12 text-xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
