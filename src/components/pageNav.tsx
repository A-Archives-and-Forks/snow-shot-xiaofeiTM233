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
	updateActiveKey: () => void;
};

export const PageNav: React.FC<{
	tabItems: RouteMapItem;
	actionRef: React.RefObject<PageNavActionType | null>;
}> = ({ tabItems, actionRef }) => {
	const { token } = theme.useToken();

	const [activeKey, setActiveKey] = useState<string | undefined>(
		tabItems.items?.[0]?.key,
	);
	// 缓存 tabs 引用，避免闭包过期
	const tabItemsRef = useRef<TabsProps["items"]>(tabItems.items);
	useEffect(() => {
		tabItemsRef.current = tabItems.items;
	}, [tabItems]);

	// 记录上一次的 activeKey，避免不必要的 setState
	const prevActiveKeyRef = useRef<string | undefined>(activeKey);

	// 实时检测当前可见的锚点 section，返回应该高亮的 key
	const detectActiveAnchor = useCallback((): string | undefined => {
		const tabs = tabItemsRef.current;
		if (!tabs || tabs.length === 0) return undefined;

		let bestKey: string | undefined;
		let minDistance = Infinity;

		for (const item of tabs) {
			const element = document.getElementById(item.key as string);
			if (!element) continue;

			const rect = element.getBoundingClientRect();
			// 元素顶部相对于视口顶部的距离
			// 负数表示元素已经滚过视口顶部（在上方不可见）
			// 正数表示元素还在视口下方
			const distanceToTop = rect.top;

			if (distanceToTop <= 0) {
				// 元素已经滚过或正在视口顶部附近，它是候选
				// 取距离 0 最接近的（即刚刚滚过视口顶部的）
				if (Math.abs(distanceToTop) < Math.abs(minDistance)) {
					minDistance = distanceToTop;
					bestKey = item.key as string;
				}
			} else if (distanceToTop < 200 && bestKey === undefined) {
				// 元素还在视口内且距离顶部较近（<200px），且还没有更优候选
				// 这种情况是页面还没怎么滚动，第一个 section 还在视野中
				bestKey = item.key as string;
				minDistance = distanceToTop;
			}
		}

		return bestKey ?? (tabs[0]?.key as string);
	}, []);

	// 核心更新逻辑：实时检测 + 防抖
	const updateActiveKey = useCallback(() => {
		const currentKey = detectActiveAnchor();
		if (currentKey && currentKey !== prevActiveKeyRef.current) {
			prevActiveKeyRef.current = currentKey;
			setActiveKey(currentKey);
		}
	}, [detectActiveAnchor]);

	const updateActiveKeyDebounce = useMemo(
		() => debounce(updateActiveKey, 80),
		[updateActiveKey],
	);

	// 初始化时设置默认 activeKey
	useEffect(() => {
		const tabs = tabItems.items;
		if (!tabs || tabs.length === 0) return;

		setActiveKey(tabs[0].key as string);
		prevActiveKeyRef.current = tabs[0].key as string;

		// 延迟做一次检测，确保 DOM 渲染完毕后能正确识别当前位置
		const timer = setTimeout(() => {
			const detected = detectActiveAnchor();
			if (detected) {
				prevActiveKeyRef.current = detected;
				setActiveKey(detected);
			}
		}, 150);

		return () => clearTimeout(timer);
	}, [tabItems, detectActiveAnchor]);

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
					prevActiveKeyRef.current = key;
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
