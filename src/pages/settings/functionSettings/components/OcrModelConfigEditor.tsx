import { Input, Select } from "antd";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import type { OcrCustomModel, OcrModel } from "@/types/appSettings";

interface OcrModelConfigEditorProps {
	value?: OcrModel;
	onChange?: (value: OcrModel) => void;
}

export const OcrModelConfigEditor: React.FC<OcrModelConfigEditorProps> = ({
	value,
	onChange,
}) => {
	const intl = useIntl();
	const isCustom = value?.type === "Custom";
	const customValue = isCustom ? (value as OcrCustomModel) : undefined;

	const typeOptions = useMemo(
		() => [
			{
				label: intl.formatMessage({
					id: "settings.systemSettings.screenshotSettings.ocrModel.ppOcrV4",
				}),
				value: "RapidOcrV4",
			},
			{
				label: intl.formatMessage({
					id: "settings.systemSettings.screenshotSettings.ocrModel.custom",
				}),
				value: "Custom",
			},
		],
		[intl],
	);

	return (
		<div>
			<Select
				value={value?.type ?? "RapidOcrV4"}
				onChange={(type) => {
					if (type === "RapidOcrV4") {
						onChange?.({ type: "RapidOcrV4" });
					} else {
						onChange?.({
							type: "Custom",
							name: customValue?.name ?? "",
							detPath:
								customValue?.detPath ?? "ch_PP-OCRv4_det_infer.onnx",
							clsPath:
								customValue?.clsPath ??
								"ch_ppocr_mobile_v2.0_cls_infer.onnx",
							recPath:
								customValue?.recPath ?? "ch_PP-OCRv4_rec_infer.onnx",
						});
					}
				}}
				options={typeOptions}
				style={{ width: "100%" }}
			/>
			{isCustom && (
				<div
					style={{
						marginTop: 12,
						display: "flex",
						flexDirection: "column",
						gap: 8,
					}}
				>
					<Input
						value={customValue?.name}
						onChange={(e) =>
							onChange?.({
								...customValue!,
								name: e.target.value,
							} as OcrCustomModel)
						}
						addonBefore={intl.formatMessage({
							id: "settings.systemSettings.screenshotSettings.ocrModel.customName",
						})}
					/>
					<Input
						value={customValue?.detPath}
						onChange={(e) =>
							onChange?.({
								...customValue!,
								detPath: e.target.value,
							} as OcrCustomModel)
						}
						addonBefore="Det"
					/>
					<Input
						value={customValue?.clsPath}
						onChange={(e) =>
							onChange?.({
								...customValue!,
								clsPath: e.target.value,
							} as OcrCustomModel)
						}
						addonBefore="Cls"
					/>
					<Input
						value={customValue?.recPath}
						onChange={(e) =>
							onChange?.({
								...customValue!,
								recPath: e.target.value,
							} as OcrCustomModel)
						}
						addonBefore="Rec"
					/>
				</div>
			)}
		</div>
	);
};
