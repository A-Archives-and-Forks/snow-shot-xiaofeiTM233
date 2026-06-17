"use client";

import { useCallback, useEffect, useRef } from "react";
import { hotLoadPageInit } from "@/commands/hotLoadPage";
import {
	pluginGetPluginsStatus,
	pluginInit,
	pluginRegisterPlugin,
} from "@/commands/plugin";
import { BackgroundEventHandler } from "@/components/backgroundEventHandler";
import { GlobalShortcut } from "@/components/globalShortcut";
import { TrayIconLoader } from "@/components/trayIconLoader";
import { usePluginServiceContext } from "@/contexts/pluginServiceContext";
import { useAppSettingsLoad } from "@/hooks/useAppSettingsLoad";
import { getAppConfigBaseDirWithCache } from "@/utils/environment";
import { getPlatform } from "@/utils/platform";
import {
	PLUGIN_ID_AI_CHAT,
	PLUGIN_ID_FFMPEG,
	PLUGIN_ID_RAPID_OCR,
	PLUGIN_ID_TRANSLATE,
} from "@/constants/pluginService";
import { type AppSettingsData, AppSettingsGroup } from "@/types/appSettings";
import * as path from "@tauri-apps/api/path";

/**
 * 后台窗口的入口页面
 *
 * 该窗口作为"持久层"常驻运行，负责：
 * 1. 全局快捷键注册（GlobalShortcut）
 * 2. 系统托盘（TrayIconLoader）
 * 3. 监听事件以触发主窗口的显示（BackgroundEventHandler）
 * 4. 热加载页面池（hotLoadPageInit）—— 供 fixedContent、draw 等窗口复用
 * 5. 主动 init 插件 —— 让 GlobalShortcut 能拿到插件状态（isReadyStatus）
 *
 * 不渲染任何 UI。所有用户可见的页面（主界面/截图画布）都是独立窗口。
 */
export const BackgroundPage: React.FC = () => {
	// 初始化热加载页面池
	useAppSettingsLoad(
		useCallback((settings: AppSettingsData) => {
			hotLoadPageInit(settings[AppSettingsGroup.SystemCore].hotLoadPageCount);
		}, []),
		true,
	);

	// Background 窗口主动 init 插件，使 GlobalShortcut 能正确判断插件状态
	const { refreshPluginStatus } = usePluginServiceContext();
	const hasInitPlugin = useRef(false);
	useEffect(() => {
		if (hasInitPlugin.current) {
			return;
		}
		hasInitPlugin.current = true;

		(async () => {
			try {
				const configDirPath = await getAppConfigBaseDirWithCache();
				const pluginConfig = {
					version: "20251005",
					plugin_install_dir: await path.join(configDirPath, "plugins"),
					plugin_download_dir: await path.join(
						configDirPath,
						"pluginsDownloads",
					),
					plugin_download_service_url: "https://snowshot.top/plugins/",
				};

				await pluginInit(
					pluginConfig.version,
					pluginConfig.plugin_install_dir,
					pluginConfig.plugin_download_dir,
					pluginConfig.plugin_download_service_url,
				);

				const pluginList = [
					{
						id: PLUGIN_ID_RAPID_OCR,
						file_list: [
							"ch_ppocr_mobile_v2.0_cls_infer.onnx",
							"ch_PP-OCRv4_det_infer.onnx",
							"ch_PP-OCRv4_rec_infer.onnx",
							"ch_PP-OCRv5_rec_mobile_infer.onnx",
						],
					},
					{
						id: PLUGIN_ID_FFMPEG,
						file_list:
							getPlatform() === "windows" ? ["ffmpeg.exe"] : ["ffmpeg"],
					},
					{ id: PLUGIN_ID_TRANSLATE, file_list: [] },
					{ id: PLUGIN_ID_AI_CHAT, file_list: [] },
				];

				await Promise.all(
					pluginList.map((plugin) =>
						pluginRegisterPlugin(plugin.id, plugin.file_list),
					),
				);

				await pluginGetPluginsStatus();
				refreshPluginStatus();
			} catch (error) {
				console.error("[BackgroundPage] Failed to init plugins", error);
			}
		})();
	}, [refreshPluginStatus]);

	return (
		<>
			<TrayIconLoader />
			<BackgroundEventHandler />
			<GlobalShortcut />
		</>
	);
};
