// Catch-all route that hands routing over to React Router DOM (SPA mode).
// All app pages live under src/app/ and use react-router-dom's APIs.
import { createFileRoute } from "@tanstack/react-router";
import { AppRoot } from "@/app/AppRoot";

export const Route = createFileRoute("/$")({
  component: AppRoot,
});
