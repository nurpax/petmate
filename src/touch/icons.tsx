import React from 'react';

// Stroke icons for the touch UI, drawn on a 24x24 grid.

type IconProps = { size?: number };

function Svg (props: { size?: number, children: React.ReactNode }) {
  const size = props.size || 22;
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.8}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {props.children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => <Svg {...p}><path d='M4 7h16M4 12h16M4 17h16' /></Svg>;
export const UndoIcon = (p: IconProps) => <Svg {...p}><path d='M9 14 4 9l5-5' /><path d='M4 9h10a6 6 0 0 1 0 12h-3' /></Svg>;
export const RedoIcon = (p: IconProps) => <Svg {...p}><path d='M15 14l5-5-5-5' /><path d='M20 9H10a6 6 0 0 0 0 12h3' /></Svg>;
export const CursorIcon = (p: IconProps) => <Svg {...p}><circle cx='12' cy='12' r='6' /><path d='M12 2v5M12 17v5M2 12h5M17 12h5' /></Svg>;
export const ChevronDownIcon = (p: IconProps) => <Svg {...p}><path d='M6 9l6 6 6-6' /></Svg>;
export const ChevronRightIcon = (p: IconProps) => <Svg {...p}><path d='M9 6l6 6-6 6' /></Svg>;
export const ChevronLeftIcon = (p: IconProps) => <Svg {...p}><path d='M15 6l-6 6 6 6' /></Svg>;
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d='M12 5v14M5 12h14' /></Svg>;

export const DrawIcon = (p: IconProps) => <Svg {...p}><path d='M4 20l4-1 11-11-3-3L5 16z' /><path d='M14 6l3 3' /></Svg>;
export const ColorizeIcon = (p: IconProps) => <Svg {...p}><path d='M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z' /></Svg>;
export const CharIcon = (p: IconProps) => <Svg {...p}><rect x='4' y='4' width='16' height='16' rx='2' /><path d='M9 16l3-8 3 8M10 13.5h4' /></Svg>;
export const BrushIcon = (p: IconProps) => <Svg {...p}><rect x='4' y='4' width='16' height='16' rx='1' strokeDasharray='3 2.5' /></Svg>;
export const TextIcon = (p: IconProps) => <Svg {...p}><path d='M5 7V4h14v3M12 4v16M9 20h6' /></Svg>;

export const MirrorXIcon = (p: IconProps) => <Svg {...p}><path d='M12 3v18' strokeDasharray='2 2' /><path d='M9 7 4 12l5 5z' /><path d='M15 7l5 5-5 5z' /></Svg>;
export const MirrorYIcon = (p: IconProps) => <Svg {...p}><path d='M3 12h18' strokeDasharray='2 2' /><path d='M7 9l5-5 5 5z' /><path d='M7 15l5 5 5-5z' /></Svg>;
export const InvertIcon = (p: IconProps) => <Svg {...p}><circle cx='12' cy='12' r='8' /><path d='M12 4a8 8 0 0 1 0 16z' fill='currentColor' /></Svg>;
export const RotateIcon = (p: IconProps) => <Svg {...p}><path d='M20 12a8 8 0 1 1-2.3-5.7' /><path d='M20 4v5h-5' /></Svg>;
export const AxisLockIcon = (p: IconProps) => <Svg {...p}><path d='M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4' /></Svg>;
export const PickIcon = (p: IconProps) => <Svg {...p}><path d='M14 4l6 6-2 2-6-6z' /><path d='M12 8l-7 7v4h4l7-7' /></Svg>;
export const GridIcon = (p: IconProps) => <Svg {...p}><rect x='4' y='4' width='16' height='16' rx='1' /><path d='M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16' /></Svg>;
export const CrtIcon = (p: IconProps) => <Svg {...p}><rect x='3' y='5' width='18' height='12' rx='2' /><path d='M8 21h8M12 17v4' /></Svg>;
export const MoveIcon = (p: IconProps) => <Svg {...p}><path d='M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3' /></Svg>;
export const FolderIcon = (p: IconProps) => <Svg {...p}><path d='M3 7h6l2 2h10v10H3z' /></Svg>;
export const SaveIcon = (p: IconProps) => <Svg {...p}><path d='M12 15V3M7 10l5 5 5-5M4 15v5h16v-5' /></Svg>;
