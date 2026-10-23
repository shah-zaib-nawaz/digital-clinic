import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buildCloudinaryUrl } from '@/lib/cloudinary-client';

interface DoctorAvatarProps {
  avatarUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAcceptingPatients?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    avatar: 'h-9 w-9',
    pixels: 72,
    initials: 'text-xs',
    dot: 'h-2 w-2 right-0 bottom-0',
  },
  md: {
    avatar: 'h-12 w-12',
    pixels: 96,
    initials: 'text-sm font-semibold',
    dot: 'h-2.5 w-2.5 right-0.5 bottom-0.5',
  },
  lg: {
    avatar: 'h-16 w-16',
    pixels: 128,
    initials: 'text-base font-bold',
    dot: 'h-3 w-3 right-0.5 bottom-0.5',
  },
  xl: {
    avatar: 'h-24 w-24',
    pixels: 200,
    initials: 'text-xl font-bold',
    dot: 'h-4 w-4 right-1 bottom-1',
  },
};

export function DoctorAvatar({
  avatarUrl,
  name,
  size = 'md',
  isAcceptingPatients,
  className = '',
}: DoctorAvatarProps) {
  const currentSize = SIZE_MAP[size];

  const getInitials = (fullName: string) => {
    const parts = fullName
      .replace(/^(Dr\.|Doctor)\s+/i, '')
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const optimizedUrl = avatarUrl
    ? buildCloudinaryUrl(avatarUrl, {
        width: currentSize.pixels * 2,
        height: currentSize.pixels * 2,
        crop: 'thumb',
        gravity: 'face',
      })
    : undefined;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <Avatar className={`${currentSize.avatar} border border-border shadow-xs`}>
        {optimizedUrl && (
          <AvatarImage
            src={optimizedUrl}
            alt={name}
            className="object-cover"
          />
        )}
        <AvatarFallback className={`bg-primary/10 text-primary ${currentSize.initials}`}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {isAcceptingPatients !== undefined && (
        <span
          className={`absolute rounded-full ring-2 ring-background ${currentSize.dot} ${
            isAcceptingPatients
              ? 'bg-emerald-500'
              : 'bg-muted-foreground/50'
          }`}
          title={isAcceptingPatients ? 'Accepting Patients' : 'Not Accepting Patients'}
        />
      )}
    </div>
  );
}
