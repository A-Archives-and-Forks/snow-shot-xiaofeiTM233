"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { showMainWindow } from "@/commands/videoRecord";

/**
 * Background 窗口的事件处理器
 *
 * 该处理器只在 background 窗口中运行，负责接收 Tauri 事件后：
 * - 显示主窗口（按需创建）
 * - 其它窗口相关操作
 *
 * 具体的业务逻辑（路由跳转、状态处理）由主窗口的 React 树负责。
 * 事件源：全局快捷键（GlobalShortcut）、系统托盘（TrayIconLoader）、Rust 端等。
 */
export const BackgroundEventHandler: React.FC = () => {
	useEffect(() => {
		const currentWindow = getCurrentWindow();
		const unlistenPromises: Array<Promise<() => void>> = [];

		// 截图相关事件 - 显示主窗口（如果需要）
		const eventsToShowMainWindow = [
			"execute-chat",
			"execute-chat-selected-text",
			"execute-translate",
			"execute-translate-selected-text",
			"open-capture-history",
		];

		for (const eventName of eventsToShowMainWindow) {
			unlistenPromises.push(
				currentWindow.listen(eventName, () => {
					// 这些事件由主窗口的 GlobalEventHandler 实际处理
					// background 窗口只需要确保主窗口存在
					showMainWindow(false);
				}),
			);
		}

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
