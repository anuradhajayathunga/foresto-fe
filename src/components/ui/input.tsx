import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        // Base
        'w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground/80',
        'shadow-sm transition outline-none',

        // Hover (subtle SaaS polish)
        'hover:bg-muted/60',

        // Focus (clean ring + border)
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15',

        // Invalid
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30',

        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-muted/40',

        // File input
        'file:mr-3 file:rounded-md file:border-0 file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground',
        'file:shadow-sm file:hover:bg-muted',

        className
      )}
      {...props}
    />
  );
}

export { Input };

// import * as React from "react";
// import { cn } from "@/lib/utils";

// type InputProps = React.ComponentProps<"input"> & {
//   startIcon?: React.ReactNode;
//   endIcon?: React.ReactNode;
// };

// function Input({ className, type, startIcon, endIcon, ...props }: InputProps) {
//   return (
//     <div
//       className={cn(
//         "flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3",
//         "shadow-sm transition-colors transition-shadow",
//         "hover:bg-muted/60",
//         "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
//         "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/30",
//         "disabled:opacity-60",
//         className
//       )}
//     >
//       {startIcon ? (
//         <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
//           {startIcon}
//         </span>
//       ) : null}

//       <input
//         type={type}
//         data-slot="input"
//         className={cn(
//           "h-11 w-full bg-transparent py-2 text-sm text-foreground outline-none",
//           "placeholder:text-muted-foreground/80",
//           "disabled:cursor-not-allowed"
//         )}
//         {...props}
//       />

//       {endIcon ? (
//         <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
//           {endIcon}
//         </span>
//       ) : null}
//     </div>
//   );
// }

// export { Input };
