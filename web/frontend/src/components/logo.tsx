import Image from 'next/image';
import { cn } from '@/lib/utils';
import darkLogo from '@/assets/logo/logo-v1.svg';
import logo from '@/assets/logo/logo-v1.svg';
type LogoProps = {
  className?: string;
  textClassName?: string;
  size?: number; // Size of the logo mark
  showText?: boolean; // Useful for collapsed sidebars
};

export function Logo({
  className,
  textClassName,
  size = 40,
  showText = true,
}: LogoProps) {
  // Calculate text size based on icon size to maintain proportion
  const textSizeClass = size < 50 ? 'text-3xl' : 'text-4xl';

  return (
    <div className={cn('flex items-end gap-1 select-none', className)}>
      {/* Logo Mark Container */}
      {/* SaaS Standard: Subtle gradient background + border to make it pop on any bg */}
      <div
        className={cn(
          'relative grid place-items-center rounded-[10px] overflow-hidden shrink-0',
          // 'bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900',
          // 'border border-border/60 shadow-sm',
          'transition-transform duration-300 hover:scale-105'
        )}
        style={{ width: size, height: size }}
      >
        {/* <Image
          src="/images/logo/log-v1.svg"
          alt="Foresto"
          width={size}
          height={size}
          className="p-[15%] object-contain drop-shadow-sm" // p-[15%] gives it breathing room
          priority
        /> */}
        <Image
          src={logo}
          className='dark:hidden p-[5%] object-contain drop-shadow-sm'
          alt='Foresto'
          width={size}
          height={size}
          priority
        />

        <Image
          src={darkLogo}
          className='hidden dark:block p-[5%] object-contain drop-shadow-sm'
          alt='Foresto'
          width={size}
          height={size}
          priority
        />

        {/* Optional: Subtle Shine Effect overlay */}
        <div className='absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none' />
      </div>

      {/* Word Mark */}
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground leading-none mb-1', // Solid color is more legible/professional
            textSizeClass,
            textClassName
          )}
        >
          foresto
          {/* Optional: Add a period or accent color dot for modern flair */}
          <span className='text-primary'>.</span>
        </span>
      )}
    </div>
  );
}
