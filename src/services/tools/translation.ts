import type { CustomApiConfig } from "@/types/appSettings";
import type {
	DeepLTranslateResult,
	TranslateData,
	TranslateParams,
	TranslationTypeOption,
} from "@/types/servies/translation";
import { withCache } from "@/utils/cache";
import { ServiceResponse, serviceBaseFetch, serviceFetch } from ".";

export type CustomTranslateResult = {
	translations: {
		detected_source_lang: string;
		text: string;
	}[];
};

/**
 * 速率限制器 - 控制每秒最大请求数
 */
class RateLimiter {
	private requestsThisSecond = 0;
	private currentSecond = Math.floor(Date.now() / 1000);
	private queue: Array<{ resolve: () => void; timer: NodeJS.Timeout }> = [];

	constructor(private maxRequestsPerSecond: number) {}

	async acquire(): Promise<void> {
		const now = Math.floor(Date.now() / 1000);

		// 新的一秒开始，重置计数器
		if (now > this.currentSecond) {
			this.currentSecond = now;
			this.requestsThisSecond = 0;
		}

		// 如果当前秒内请求数未达上限，直接执行
		if (this.requestsThisSecond < this.maxRequestsPerSecond) {
			this.requestsThisSecond++;
			return;
		}

		// 计算需要等待的时间（到下一秒开始的毫秒数）
		const msUntilNextSecond = 1000 - (Date.now() % 1000);

		// 加入队列等待下一秒
		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				// 从队列中移除自己
				const index = this.queue.findIndex((item) => item.resolve === resolve);
				if (index !== -1) {
					this.queue.splice(index, 1);
				}
				// 重置计数器并执行
				const nowInner = Math.floor(Date.now() / 1000);
				if (nowInner > this.currentSecond) {
					this.currentSecond = nowInner;
					this.requestsThisSecond = 0;
				}
				this.requestsThisSecond++;
				resolve();
			}, msUntilNextSecond);

			this.queue.push({ resolve, timer });
		});
	}
}

// 存储每个 API URI 对应的速率限制器
const rateLimiters = new Map<string, RateLimiter>();

/**
 * 获取或创建速率限制器
 */
const getRateLimiter = (
	apiUri: string,
	maxRequestsPerSecond: number,
): RateLimiter => {
	let limiter = rateLimiters.get(apiUri);
	if (!limiter) {
		limiter = new RateLimiter(maxRequestsPerSecond);
		rateLimiters.set(apiUri, limiter);
	}
	return limiter;
};

/**
 * 根据 maxParagraphCount 拆分文本
 * 返回拆分后的文本块数组，每个块包含原始索引信息
 */
const splitTextForTranslation = (
	texts: string[],
	maxParagraphCount: number,
): Array<{ texts: string[]; originalIndices: number[] }> => {
	if (texts.length === 0) {
		return [];
	}

	const chunks: Array<{ texts: string[]; originalIndices: number[] }> = [];
	let currentChunk: string[] = [];
	let currentIndices: number[] = [];

	for (let i = 0; i < texts.length; i++) {
		// 检查是否需要开始新块
		if (currentChunk.length >= maxParagraphCount) {
			chunks.push({
				texts: currentChunk,
				originalIndices: currentIndices,
			});
			currentChunk = [];
			currentIndices = [];
		}

		currentChunk.push(texts[i]);
		currentIndices.push(i);
	}

	// 保存最后一块
	if (currentChunk.length > 0) {
		chunks.push({
			texts: currentChunk,
			originalIndices: currentIndices,
		});
	}

	return chunks;
};

export const translate = async (params: TranslateParams) => {
	return serviceFetch<TranslateData>("/api/v2/translation/translate", {
		method: "POST",
		data: params,
	});
};

export const getTranslationTypes = async () => {
	return serviceFetch<TranslationTypeOption[]>("/api/v2/translation/types", {
		method: "GET",
	});
};

const fetchTranslationTypes = async (): Promise<
	TranslationTypeOption[] | undefined
> => {
	const resp = await getTranslationTypes();
	if (resp.success()) {
		return resp.data ?? [];
	}
	return undefined;
};

export const getTranslationTypesWithCache = withCache(fetchTranslationTypes, {
	key: "getTranslationTypes",
	duration: 60 * 60 * 1000, // 缓存 1 小时
});

export const translateTextDeepL = async (
	apiUri: string,
	apiKey: string,
	sourceContent: string[],
	sourceLanguage: string | null,
	targetLanguage: string,
	preferQualityOptimized: boolean,
): Promise<DeepLTranslateResult | undefined> => {
	const response = await serviceBaseFetch(apiUri, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `DeepL-Auth-Key ${apiKey}`,
		},
		data: {
			text: sourceContent,
			source_lang: sourceLanguage,
			target_lang: targetLanguage,
			preserve_formatting: true,
			model_type: preferQualityOptimized
				? "prefer_quality_optimized"
				: "latency_optimized",
		},
	});

	if (response instanceof ServiceResponse) {
		response.success();
		return undefined;
	}

	return (await response.json()) as DeepLTranslateResult;
};

/**
 * 自定义翻译 API 语言代码映射
 */
const customLanguageCodeMap: Record<string, string> = {
	auto: "auto",
	"zh-CHS": "zh-CN",
	"zh-CHT": "zh-TW",
	en: "en",
	ja: "ja",
};

/**
 * 将语言代码转换为自定义翻译 API 支持的格式
 */
const convertToCustomLanguageCode = (lang: string): string => {
	return customLanguageCodeMap[lang] ?? lang;
};

/**
 * 单次翻译请求
 */
const translateTextCustomOnce = async (
	apiUri: string,
	sourceContent: string[],
	sourceLanguage: string,
	targetLanguage: string,
): Promise<CustomTranslateResult | undefined> => {
	const response = await serviceBaseFetch(apiUri, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		data: {
			source_lang: convertToCustomLanguageCode(sourceLanguage),
			target_lang: convertToCustomLanguageCode(targetLanguage),
			text_list: sourceContent,
		},
	});

	if (response instanceof ServiceResponse) {
		response.success();
		return undefined;
	}

	return (await response.json()) as CustomTranslateResult;
};

/**
 * 带速率限制和段落拆分的自定义翻译
 * 返回与输入数组对应的翻译结果（保持原始顺序）
 */
export const translateTextCustomWithLimits = async (
	config: CustomApiConfig,
	sourceContent: string[],
	sourceLanguage: string,
	targetLanguage: string,
): Promise<CustomTranslateResult | undefined> => {
	const maxRequestsPerSecond = config.max_requests_per_second ?? 5;
	const maxParagraphCount = config.max_paragraph_count ?? 1;

	const rateLimiter = getRateLimiter(config.api_uri, maxRequestsPerSecond);

	// 拆分文本
	const chunks = splitTextForTranslation(sourceContent, maxParagraphCount);

	if (chunks.length === 0) {
		return { translations: [] };
	}

	// 如果只有一个块，直接翻译
	if (chunks.length === 1) {
		await rateLimiter.acquire();
		return translateTextCustomOnce(
			config.api_uri,
			chunks[0].texts,
			sourceLanguage,
			targetLanguage,
		);
	}

	// 存储翻译结果，按原始索引
	const results: Array<{ text: string; detected_source_lang: string } | null> =
		new Array(sourceContent.length).fill(null);

	// 逐个处理每个块
	for (const chunk of chunks) {
		await rateLimiter.acquire();
		const result = await translateTextCustomOnce(
			config.api_uri,
			chunk.texts,
			sourceLanguage,
			targetLanguage,
		);

		if (result) {
			for (let j = 0; j < chunk.originalIndices.length; j++) {
				const originalIdx = chunk.originalIndices[j];
				const translation = result.translations[j];
				if (translation) {
					results[originalIdx] = translation;
				}
			}
		}
	}

	// 过滤掉 null 值并保持原始顺序
	const translations: CustomTranslateResult["translations"] = [];
	for (const result of results) {
		if (result) {
			translations.push(result);
		}
	}

	return { translations };
};

export const translateTextCustom = translateTextCustomOnce;
