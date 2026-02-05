/**
 * 内存监控使用示例
 *
 * 将此代码集成到你的应用入口组件中，例如 App.tsx
 */

import { useEffect } from "react";
import { memoryMonitor } from "./memoryMonitor";

export function MemoryMonitorExample() {
	useEffect(() => {
		// 仅在开发环境启用内存监控
		if (import.meta.env.DEV) {
			// 每 5 秒监控一次内存使用情况
			memoryMonitor.startMonitoring(5000, (memoryUsage) => {
				// 可以在这里添加自定义逻辑，例如：
				// 1. 发送日志到服务器
				// 2. 显示内存使用警告
				// 3. 触发清理操作
				if (memoryUsage.usagePercentage > 75) {
					console.warn("内存使用过高，建议清理缓存");
					// memoryMonitor.forceGC(); // 可选：手动触发垃圾回收
				}
			});

			return () => {
				memoryMonitor.stopMonitoring();
			};
		}
	}, []);

	return null; // 这个组件不渲染任何内容
}

// 使用方法：
// 在 App.tsx 中添加：
// import { MemoryMonitorExample } from './utils/memoryMonitor.example';
//
// export default function App() {
//   return (
//     <>
//       <MemoryMonitorExample />
//       {/* 其他应用代码 */}
//     </>
//   );
// }
