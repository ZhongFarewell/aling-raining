const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
module.exports = {
  entry: "/src/aling/index.tsx",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "webpack.[name].js",
  },
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, "../public"), // 指定 public 目录
        publicPath: "/", // 访问路径为根路径
      },
      {
        directory: path.resolve(__dirname, "../dist"), // 如果需要同时提供 dist 目录
        publicPath: "/dist/",
      },
    ],
    hot: true,
    port: 9000,
  },
  resolve: {
    // 未指定后缀名的文件将尝试使用下列后缀进行拓展查找
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "../src"), // 配置路径别名
      "@@": path.resolve(__dirname, "../src/aling"), // 配置路径别名
    },
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"],
    },
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // 将 JS 字符串生成为 style 节点
          "style-loader",
          // 将 CSS 转化成 CommonJS 模块
          "css-loader",
          // 将 Sass 编译成 CSS
          "sass-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          "style-loader",
          "css-loader",
          "less-loader",
        ],
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              modules: undefined,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Align-lib",
      template: "./public/index.html",
    }),
  ],
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: "all",
    },
  },
}
