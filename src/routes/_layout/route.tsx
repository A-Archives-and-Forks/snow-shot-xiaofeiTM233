import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CheckEnvironment } from "@/components/checkEnvironment";
import { CheckVersion } from "@/components/checkVersion";
import { GlobalShortcut } from "@/components/globalShortcut";
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
			{/*
			 * 主窗口挂载 GlobalShortcut 时设置 registerShortcuts={false}，
			 * 仅作为 GlobalShortcutContext Provider 使用，不注册 OS 快捷键
			 * （OS 快捷键由 background 窗口的 GlobalShortcut 注册）
			 */}
			<GlobalShortcut registerShortcuts={false}>
				<MenuLayout>
					<Outlet />
				</MenuLayout>
			</GlobalShortcut>
		</RouterContainer>
	);
}
