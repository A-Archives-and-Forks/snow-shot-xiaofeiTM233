import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	DeleteOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import { Button, Input, Space } from "antd";
import { useCallback } from "react";

interface PluginDownloadSourcesProps {
	value?: string[];
	onChange?: (value: string[]) => void;
}

export const PluginDownloadSources: React.FC<PluginDownloadSourcesProps> = ({
	value = [],
	onChange,
}) => {
	const sources = value;

	const moveUp = useCallback(
		(index: number) => {
			if (index <= 0) return;
			const newSources = [...sources];
			[newSources[index - 1], newSources[index]] = [
				newSources[index],
				newSources[index - 1],
			];
			onChange?.(newSources);
		},
		[sources, onChange],
	);

	const moveDown = useCallback(
		(index: number) => {
			if (index >= sources.length - 1) return;
			const newSources = [...sources];
			[newSources[index], newSources[index + 1]] = [
				newSources[index + 1],
				newSources[index],
			];
			onChange?.(newSources);
		},
		[sources, onChange],
	);

	const updateUrl = useCallback(
		(index: number, newUrl: string) => {
			const newSources = [...sources];
			newSources[index] = newUrl;
			onChange?.(newSources);
		},
		[sources, onChange],
	);

	const remove = useCallback(
		(index: number) => {
			if (sources.length <= 1) return;
			const newSources = sources.filter((_, i) => i !== index);
			onChange?.(newSources);
		},
		[sources, onChange],
	);

	const add = useCallback(() => {
		onChange?.([...sources, ""]);
	}, [sources, onChange]);

	return (
		<div>
			{sources.map((url, index) => (
				<div
					key={index}
					style={{
						display: "flex",
						alignItems: "center",
						marginBottom: 8,
						gap: 8,
					}}
				>
					<Space.Compact>
						<Button
							size="small"
							icon={<ArrowUpOutlined />}
							disabled={index === 0}
							onClick={() => moveUp(index)}
						/>
						<Button
							size="small"
							icon={<ArrowDownOutlined />}
							disabled={index === sources.length - 1}
							onClick={() => moveDown(index)}
						/>
					</Space.Compact>

					<Input
						value={url}
						onChange={(e) => updateUrl(index, e.target.value)}
						placeholder="https://example.com/plugins/"
						style={{ flex: 1 }}
					/>

					<Button
						size="small"
						danger
						icon={<DeleteOutlined />}
						disabled={sources.length <= 1}
						onClick={() => remove(index)}
					/>
				</div>
			))}

			<Button
				type="dashed"
				icon={<PlusOutlined />}
				onClick={add}
				style={{ width: "100%" }}
			/>
		</div>
	);
};
