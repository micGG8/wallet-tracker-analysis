import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconMap = Record<string, React.FC<LucideProps>>;

export function Icon({
  name,
  ...props
}: { name: string } & LucideProps): React.ReactElement | null {
  const icons = LucideIcons as unknown as IconMap;
  const Cmp = icons[name];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
