import { createFileRoute } from "@tanstack/react-router";
import { AppRoot } from "@/app/AppRoot";

export const Route = createFileRoute("/")({
  component: AppRoot,
});
