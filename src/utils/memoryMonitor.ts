/**
 * WebView 内存监控工具
 */

interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
	memory?: PerformanceMemory;
}

interface ExtendedWindow extends Window {
	gc?: () => void;
}

export class MemoryMonitor {
	private static instance: MemoryMonitor;
	private intervalId: number | null = null;

	private constructor() {}

	public static getInstance(): MemoryMonitor {
		if (!MemoryMonitor.instance) {
			MemoryMonitor.instance = new MemoryMonitor();
		}
		return MemoryMonitor.instance;
	}

	/**
	 * 获取当前内存使用情况
	 */
	public getMemoryUsage(): {
		usedJSHeapSize: number;
		totalJSHeapSize: number;
		jsHeapSizeLimit: number;
		usagePercentage: number;
	} | null {
		const extendedPerformance = performance as ExtendedPerformance;
		if (extendedPerformance.memory) {
			const memory = extendedPerformance.memory;
			return {
				usedJSHeapSize: memory.usedJSHeapSize,
				totalJSHeapSize: memory.totalJSHeapSize,
				jsHeapSizeLimit: memory.jsHeapSizeLimit,
				usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
			};
		}
		return null;
	}

	/**
	 * 格式化内存大小
	 */
	public formatMemorySize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	/**
	 * 开始监控内存使用情况
	 * @param interval 监控间隔（毫秒）
	 * @param callback 回调函数
	 */
	public startMonitoring(
		interval: number = 5000,
		callback?: (memoryUsage: {
			usedJSHeapSize: number;
			totalJSHeapSize: number;
			jsHeapSizeLimit: number;
			usagePercentage: number;
		}) => void,
	): void {
		if (this.intervalId !== null) {
			console.warn("[MemoryMonitor] 监控已在运行中");
			return;
		}

		const checkMemory = () => {
			const memoryUsage = this.getMemoryUsage();
			if (memoryUsage) {
				console.log(
					`[MemoryMonitor] 内存使用: ${this.formatMemorySize(memoryUsage.usedJSHeapSize)} / ${this.formatMemorySize(memoryUsage.jsHeapSizeLimit)} (${memoryUsage.usagePercentage.toFixed(2)}%)`,
				);
				callback?.(memoryUsage);

				// 内存使用超过 80% 时发出警告
				if (memoryUsage.usagePercentage > 80) {
					console.warn(
						`[MemoryMonitor] 内存使用过高: ${memoryUsage.usagePercentage.toFixed(2)}%`,
					);
				}
			}
		};

		checkMemory();
		this.intervalId = window.setInterval(checkMemory, interval);
		console.log("[MemoryMonitor] 开始监控内存使用");
	}

	/**
	 * 停止监控
	 */
	public stopMonitoring(): void {
		if (this.intervalId !== null) {
			window.clearInterval(this.intervalId);
			this.intervalId = null;
			console.log("[MemoryMonitor] 停止监控");
		}
	}

	/**
	 * 强制垃圾回收（仅在支持的环境中有效）
	 */
	public forceGC(): void {
		const extendedWindow = window as ExtendedWindow;
		if (extendedWindow.gc) {
			extendedWindow.gc();
			console.log("[MemoryMonitor] 已触发垃圾回收");
		} else {
			console.warn("[MemoryMonitor] 当前环境不支持手动触发垃圾回收");
		}
	}
}

// 导出单例
export const memoryMonitor = MemoryMonitor.getInstance();
