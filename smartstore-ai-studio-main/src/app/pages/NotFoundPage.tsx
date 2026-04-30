import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-display font-bold text-gradient-gold">404</div>
        <h1 className="mt-2 text-xl font-display font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-2">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="mt-6 bg-gradient-gold text-primary-foreground">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
