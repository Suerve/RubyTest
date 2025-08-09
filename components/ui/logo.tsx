
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  type?: 'square' | 'horizontal' | 'tagline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  href?: string;
}

const sizeMap = {
  sm: { square: 32, horizontal: { w: 120, h: 32 }, tagline: { w: 160, h: 32 } },
  md: { square: 48, horizontal: { w: 180, h: 48 }, tagline: { w: 240, h: 48 } },
  lg: { square: 64, horizontal: { w: 240, h: 64 }, tagline: { w: 320, h: 64 } },
  xl: { square: 80, horizontal: { w: 300, h: 80 }, tagline: { w: 400, h: 80 } }
};

const logoMap = {
  square: '/images/RUBICON-sqlogo.png',
  horizontal: '/images/RUBICONPROGRAMS-horizontal.png',
  tagline: '/images/RUBICON-tagline.png'
};

export function Logo({ type = 'square', size = 'md', className = '', href }: LogoProps) {
  const logoSrc = logoMap[type];
  const dimensions = sizeMap[size];
  
  const imageElement = (
    <div className={`relative ${className}`}>
      {type === 'square' ? (
        <Image
          src={logoSrc}
          alt="Rubicon Programs"
          width={dimensions.square}
          height={dimensions.square}
          className="object-contain"
          priority
        />
      ) : (
        <Image
          src={logoSrc}
          alt="Rubicon Programs"
          width={(dimensions[type] as { w: number; h: number }).w}
          height={(dimensions[type] as { w: number; h: number }).h}
          className="object-contain"
          priority
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
