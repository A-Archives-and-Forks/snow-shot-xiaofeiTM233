"use client";

import { useCallback, useEffect, useRef } from "react";
import { hotLoadPageInit } from "@/commands/hotLoadPage";
import { pluginGetPluginsStatus } from "@/commands/plugin";
import { BackgroundEventHandler } from "@/components/backgroundEventHandler";
import { GlobalShortcut } from "@/components/globalShortcut";
import { TrayIconLoader } from "@/components/trayIconLoader";
import {
	PLUGIN_ID_AI_CHAT,
	PLUGIN_ID_FFMPEG,
	PLUGIN_ID_RAPID_OCR,
	PLUGIN_ID_TRANSLATE,
} from "@/constants/pluginService";
import { usePluginServiceContext } from "@/contexts/pluginServiceContext";
import { useAppSettingsLoad } from "@/hooks/useAppSettingsLoad";
import { type AppSettingsData, AppSettingsGroup } from "@/types/appSettings";

/**
 * 后台窗口的入口页面
 *
 * 该窗口作为"持久层"常驻运行，负责：
 * 1. 全局快捷键注册（GlobalShortcut）
 * 2. 系统托盘（TrayIconLoader）
 * 3. 监听事件以触发主窗口的显示（BackgroundEventHandler）
 * 4. 热加载页面池（hotLoadPageInit）—— 供 fixedContent、draw 等窗口复用
 * 5. 主动检测插件就绪状态（绕过 autoInitPlugin={false}）
 *
 * 不渲染任何 UI。所有用户可见的页面（主界面/截图画布）都是独立窗口。
 */
export const BackgroundPage: React.FC = () => {
	// 初始化热加载页面池（在 background 窗口常驻执行，确保 draw 窗口等可复用）
	useAppSettingsLoad(
		useCallback((settings: AppSettingsData) => {
			hotLoadPageInit(settings[AppSettingsGroup.SystemCore].hotLoadPageCount);
		}, []),
		true,
	);

	// Background 窗口需要监听插件状态（虽然不主动 init 插件）
	// 这里只做一次 pluginGetPluginsStatus，让 PluginServiceContext 拿到初始状态
	// 实际插件 install/download 仍由主窗口完成
	const { refreshPluginStatus } = usePluginServiceContext();
	const hasFetchedStatus = useRef(false);
	useEffect(() => {
		if (hasFetchedStatus.current) {
			return;
		}
		hasFetchedStatus.current = true;

		// 尝试获取插件状态；如果有注册过插件，会返回状态
		pluginGetPluginsStatus()
			.then(() => {
				refreshPluginStatus();
			})
			.catch(() => {
				// 忽略错误：background 窗口可能没有权限调用此命令
			});
	}, [refreshPluginStatus]);

	return (
		<>
			<TrayIconLoader />
			<BackgroundEventHandler />
			<GlobalShortcut />
		</>
	);
};
