import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CheckEnvironment } from "@/components/checkEnvironment";
import { CheckVersion } from "@/components/checkVersion";
import { InitService } from "@/components/initService";
import { MenuLayout } from "@/components/menuLayout";
import { RouterContainer } from "@/components/routerContainer";
import { ThemeSkin } from "@/components/themeSkin";

export const Route = createFileRoute("/_layout")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<RouterContainer autoInitPlugin={true}>
			<ThemeSkin />
			<InitService />
			<CheckEnvironment />
			<CheckVersion />
			<MenuLayout>
				<Outlet />
			</MenuLayout>
		</RouterContainer>
	);
}
