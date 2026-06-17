"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { showMainWindow } from "@/commands/videoRecord";

/**
 * Background 窗口的事件处理器
 *
 * background 窗口作为常驻层，监听一些需要触发主窗口显示的事件：
 * - 用户点击系统托盘中的"显示主窗口"菜单项
 * - 用户通过快捷键（ShowOrHideMainWindow）触发主窗口
 *
 * 具体的业务逻辑（如路由跳转）由主窗口的 React 树负责。
 */
export const BackgroundEventHandler: React.FC = () => {
	useEffect(() => {
		const currentWindow = getCurrentWindow();
		const unlistenPromises: Array<Promise<() => void>> = [];

		// 主窗口显示/隐藏事件
		unlistenPromises.push(
			currentWindow.listen("show-or-hide-main-window", () => {
				showMainWindow(true);
			}),
		);

		return () => {
			unlistenPromises.forEach((promise) => {
				promise.then((unlisten) => {
					try {
						unlisten();
					} catch (error) {
						console.error("[BackgroundEventHandler] unlisten error", error);
					}
				});
			});
		};
	}, []);

	return null;
};
