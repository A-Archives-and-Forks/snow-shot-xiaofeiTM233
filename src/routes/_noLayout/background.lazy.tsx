import { createLazyFileRoute } from "@tanstack/react-router";
import { BackgroundPage } from "@/pages/background/page";

export const Route = createLazyFileRoute("/_noLayout/background")({
	component: RouteComponent,
});

function RouteComponent() {
	return <BackgroundPage />;
}
