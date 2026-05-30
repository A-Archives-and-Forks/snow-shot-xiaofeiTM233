import { Tabs, type TabsProps, theme } from "antd";
import { debounce } from "es-toolkit";
import {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import type { RouteMapItem } from "@/types/components/menuLayout";

export type PageNavActionType = {
	updateActiveKey: (scrollTop: number) => void;
};

export const PageNav: React.FC<{
	tabItems: RouteMapItem;
	actionRef: React.RefObject<PageNavActionType | null>;
	scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}> = ({ tabItems, actionRef, scrollContainerRef }) => {
	const { token } = theme.useToken();

	const [activeKey, setActiveKey] = useState<string | undefined>(
		tabItems.items?.[0]?.key,
	);
	const tabItemsRef = useRef<TabsProps["items"]>(tabItems.items);
	useEffect(() => {
		tabItemsRef.current = tabItems.items;
	}, [tabItems]);

	const anchorTopListRef = useRef<{ key: string; offsetTop: number }[]>([]);

	// 使用 getBoundingClientRect 计算锚点相对于滚动容器的精确偏移
	const computeAnchorOffsets = useCallback(
		(tabs: TabsProps["items"], container: HTMLDivElement) => {
			if (!tabs || !container) return [];
			const containerRect = container.getBoundingClientRect();
			return tabs.map((item) => {
				const element = document.getElementById(item.key as string);
				if (!element) {
					return {
						key: item.key as string,
						offsetTop: Number.MAX_SAFE_INTEGER,
					};
				}
				const elRect = element.getBoundingClientRect();
				// 元素顶部相对于滚动容器顶部的偏移 + 当前 scrollTop
				// 减去 clientHeight 作为提前切换的阈值（元素顶部到达容器顶部时即切换）
				return {
					key: item.key as string,
					offsetTop:
						container.scrollTop +
						elRect.top -
						containerRect.top -
						element.clientHeight,
				};
			});
		},
		[],
	);

	// 根据 scrollTop 更新当前激活的 Tab
	const updateActiveKey = useCallback((scrollTop: number) => {
		const anchorTopList = anchorTopListRef.current;
		if (anchorTopList.length === 0) {
			return;
		}

		let targetKey = "";
		for (const anchor of anchorTopList) {
			if (anchor.offsetTop <= scrollTop) {
				targetKey = anchor.key;
			} else {
				break;
			}
		}

		if (!targetKey) {
			return;
		}

		setActiveKey(targetKey);
	}, []);

	const updateActiveKeyDebounce = useMemo(
		() => debounce(updateActiveKey, 128),
		[updateActiveKey],
	);

	// 初始化锚点位置（延迟确保 DOM 已渲染）
	useEffect(() => {
		if (!document) {
			return;
		}

		const tabs = tabItems.items;
		if (!tabs || tabs.length === 0) {
			return;
		}
		setActiveKey(tabs[0].key as string);

		// 延迟计算，确保页面内容已渲染完成
		const timer = setTimeout(() => {
			const container = scrollContainerRef.current;
			if (container) {
				anchorTopListRef.current = computeAnchorOffsets(tabs, container);
			} else {
				// 降级方案：如果没有容器引用，使用 offsetTop
				anchorTopListRef.current = tabs.map((item) => {
					const element = document.getElementById(item.key as string);
					return {
						key: item.key as string,
						offsetTop: element
							? element.offsetTop - element.clientHeight
							: Number.MAX_SAFE_INTEGER,
					};
				});
			}
			updateActiveKeyDebounce(0);
		}, 100);

		return () => clearTimeout(timer);
	}, [
		tabItems,
		updateActiveKeyDebounce,
		computeAnchorOffsets,
		scrollContainerRef,
	]);

	// 窗口大小变化时重新计算锚点位置
	useEffect(() => {
		const handleResize = debounce(() => {
			const container = scrollContainerRef.current;
			const tabs = tabItemsRef.current;
			if (container && tabs && tabs.length > 0) {
				anchorTopListRef.current = computeAnchorOffsets(tabs, container);
			}
		}, 256);

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [computeAnchorOffsets, scrollContainerRef]);

	useImperativeHandle(
		actionRef,
		() => ({
			updateActiveKey: updateActiveKeyDebounce,
		}),
		[updateActiveKeyDebounce],
	);

	return (
		<div
			className="page-nav"
			style={{ display: tabItems.hideTabs ? "none" : undefined }}
		>
			<Tabs
				activeKey={activeKey}
				items={tabItems.items}
				size="small"
				onChange={(key) => {
					const target = document.getElementById(key);
					if (!target) {
						return;
					}
					target.scrollIntoView({ behavior: "smooth" });
					setActiveKey(key);
				}}
			/>

			<style jsx>{`
                .page-nav :global(.ant-tabs) {
                    margin-top: -12px !important;
                    padding: 0 ${token.padding}px !important;
                }

                .page-nav :global(.ant-tabs-nav-wrap) {
                    height: 32px !important;
                }
            `}</style>
		</div>
	);
};
