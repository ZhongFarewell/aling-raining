const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
module.exports = {
  entry: "/src/index.ts",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "dist/aling.[name].js",
    library: {
      name: "Aling",
      type: "umd",
    },
  },
  resolve: {
    // 未指定后缀名的文件将尝试使用下列后缀进行拓展查找
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": path.resolve(__dirname, "../src"), // 配置路径别名
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
  externals: {
    react: {
      root: "React",
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
    },
    antd: {
      root: "Antd",
      commonjs: "antd",
      commonjs2: "antd",
      amd: "antd",
    },
    "antd-mobile": {
      root: "AntdMobile",
      commonjs: "antd-mobile",
      commonjs2: "antd-mobile",
      amd: "antd-mobile",
    },
    "@mui/system": {
      root: "@mui/system",
      commonjs: "@mui/system",
      commonjs2: "@mui/system",
      amd: "@mui/system",
    },
    "@emotion/styled": {
      root: "@emotion/styled",
      commonjs: "@emotion/styled",
      commonjs2: "@emotion/styled",
      amd: "@emotion/styled",
    },
    "@emotion/react": {
      root: "@emotion/react",
      commonjs: "@emotion/react",
      commonjs2: "@emotion/react",
      amd: "@emotion/react",
    },
    "antd-mobile-icons": {
      root: "antd-mobile-icons",
      commonjs: "antd-mobile-icons",
      commonjs2: "antd-mobile-icons",
      amd: "antd-mobile-icons",
    },
  },
  plugins: [new CleanWebpackPlugin()],
  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: "all",
    },
  },
};
