import { defineConfig } from "@rsbuild/core";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";

export default defineConfig({
	plugins: [pluginReact(), pluginNodePolyfill()],
	resolve: {
		alias: {
			"@": "./src",
		},
	},
	output: {
		cleanDistPath: true,
	},
	performance: {
		chunkSplit: {
			strategy: "split-by-module",
		},
	},
	html: {
		tags: [
			{
				tag: "script",
				attrs: {
					src:
						import.meta.env.PUBLIC_ONLINE_STATUS === "true"
							? "/scripts/excalidraw.js"
							: "/scripts/excalidraw.offline.js",
				},
			},
			{
				tag: "script",
				attrs: {
					src: "/scripts/markdownItFix.js",
				},
			},
		],
	},
	tools: {
		swc: {
			jsc: {
				experimental: {
					plugins: [["@swc/plugin-styled-jsx", {}]],
				},
			},
		},
		rspack: {
			plugins: [
				tanstackRouter({
					target: "react",
					autoCodeSplitting: true,
				}),
			],
			optimization: {
				minimize: true,
				splitChunks: {
					chunks: "all",
					minSize: 20000,
					maxSize: 500000,
					cacheGroups: {
						vendors: {
							test: /[\\/]node_modules[\\/]/,
							name: "vendors",
							chunks: "all",
						},
						react: {
							test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
							name: "react",
							chunks: "all",
						},
						antd: {
							test: /[\\/]node_modules[\\/]antd[\\/]/,
							name: "antd",
							chunks: "all",
						},
					},
				},
			},
		},
	},
});
