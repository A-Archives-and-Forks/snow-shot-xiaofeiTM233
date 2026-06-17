import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RouterContainer } from "@/components/routerContainer";

export const Route = createFileRoute("/_noLayout")({
	component: PathlessLayoutComponent,
});

function PathlessLayoutComponent() {
	// _noLayout 默认 autoInitPlugin={false}
	// background 路由在 BackgroundPage 中主动 init 插件
	return (
		<RouterContainer autoInitPlugin={false}>
			<Outlet />
		</RouterContainer>
	);
}
