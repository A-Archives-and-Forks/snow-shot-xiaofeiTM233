import { EyeOutlined } from "@ant-design/icons";
import { Image, Tooltip } from "antd";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import type { CaptureHistoryRecordItem } from "../extra";

export const CaptureHistoryItemPreview: React.FC<{
	item: CaptureHistoryRecordItem;
}> = ({ item }) => {
	const [showCaptureResult, setShowCaptureResult] = useState(true);

	const resultUrl = item.capture_result_file_url;
	const fileUrl = item.file_url;

	const mask = (
		<span>
			<EyeOutlined />
			<FormattedMessage id="tools.captureHistory.preview" />
		</span>
	);

	const renderImage = (src: string, visible: boolean) => (
		<Image
			alt="preview"
			loading="lazy"
			src={src}
			width={350}
			height={128}
			style={{
				objectFit: "contain",
				display: visible ? undefined : "none",
			}}
			preview={{ mask }}
			onContextMenu={(e) => {
				e.preventDefault();
				setShowCaptureResult(!showCaptureResult);
			}}
		/>
	);

	const images = [resultUrl, fileUrl].filter(Boolean) as string[];

	// 仅有一张图片：保持原有单图预览逻辑
	if (images.length <= 1) {
		return (
			<Tooltip
				title={
					resultUrl ? (
						<FormattedMessage id="tools.captureHistory.switchImage.tip" />
					) : undefined
				}
			>
				{renderImage(images[0], true)}
			</Tooltip>
		);
	}

	// 多张图片：放入 PreviewGroup，点击预览可左右切换浏览
	return (
		<Tooltip
			title={<FormattedMessage id="tools.captureHistory.switchImage.tip" />}
		>
			<div style={{ display: "inline-block" }}>
				<Image.PreviewGroup preview={{ mask }}>
					{resultUrl && renderImage(resultUrl, showCaptureResult)}
					{fileUrl && renderImage(fileUrl, !showCaptureResult)}
				</Image.PreviewGroup>
			</div>
		</Tooltip>
	);
};
