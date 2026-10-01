// App mark: Lucide Satellite, painted in currentColor so it follows the theme
// like the rest of the ink. The wordmark sits beside it in TopBar.

import { Satellite } from "lucide-react";

export function AppLogo({ size = 26, ...props }: React.ComponentProps<"svg"> & { size?: number }) {
  return (
    <Satellite
      size={size}
      strokeWidth={2}
      role='img'
      aria-label='Painel Órbita'
      {...props}
    />
  );
}
