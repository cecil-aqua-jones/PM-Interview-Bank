import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import ScreenshotProtection from "@/components/ScreenshotProtection";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ScreenshotProtection 
        enabled={true} 
        blurOnInactive={true}
        watermark="PM Interview Bank - Confidential"
      >
        <AppShell>{children}</AppShell>
      </ScreenshotProtection>
    </AuthGuard>
  );
}
