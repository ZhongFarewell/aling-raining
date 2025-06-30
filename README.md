# Aling Rain

一个基于 WebGL 的雨滴效果库，支持 TypeScript。

## 安装

```bash
npm install aling-rain
```

## 基本使用

### 1. 使用默认图片资源

```typescript
import { loadTextures } from 'aling-rain'

// 使用默认图片路径
loadTextures('#my-canvas')
```

### 2. 自定义图片路径

```typescript
import { loadTextures } from 'aling-rain'

// 指定自定义图片路径
loadTextures('#my-canvas', {
  basePath: '/assets/images/', // 基础路径
  bg: 'custom-bg.png',         // 背景图片
  fg: 'custom-fg.png',         // 前景图片
  dropAlpha: 'drop-alpha.png', // 水滴透明度图片
  dropColor: 'drop-color.png', // 水滴颜色图片
  onInit: () => {
    console.log('雨滴效果初始化完成')
  },
  onAbort: () => {
    console.log('雨滴效果已停止')
  }
})
```

### 3. 使用 CDN 资源

```typescript
import { loadTextures } from 'aling-rain'

loadTextures('#my-canvas', {
  basePath: 'https://cdn.example.com/aling-rain/',
  bg: 'texture-rain-bg.png',
  fg: 'texture-rain-fg.png',
  dropAlpha: 'drop-alpha.png',
  dropColor: 'drop-color.png'
})
```

### 4. 使用类实例

```typescript
import CommonRain from 'aling-rain'

const rain = new CommonRain()
await rain.loadTextures('#my-canvas', {
  basePath: '/assets/',
  bg: 'rain-bg.png',
  fg: 'rain-fg.png'
})

// 停止效果
rain.abort()
```

## 图片资源结构

默认情况下，库期望以下图片资源：

```
assets/
├── img/
│   ├── drop-alpha.png      # 水滴透明度纹理
│   ├── drop-color.png      # 水滴颜色纹理
│   └── weather/
│       ├── texture-rain-fg.png    # 雨滴前景纹理
│       └── texture-rain-bg.png    # 雨滴背景纹理
```

## 打包配置

### Webpack 配置

```javascript
// webpack.config.js
module.exports = {
  // ... 其他配置
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]'
        }
      }
    ]
  }
}
```

### Vite 配置

```javascript
// vite.config.js
export default {
  // ... 其他配置
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
}
```

### 作为 NPM 包发布

如果你要将此库作为 NPM 包发布，建议：

1. **将图片资源作为独立包发布**：
```bash
npm publish aling-rain-assets
```

2. **在库中提供默认资源**：
```typescript
// 提供默认资源路径
export const DEFAULT_ASSETS = {
  basePath: 'https://unpkg.com/aling-rain-assets@latest/',
  bg: 'texture-rain-bg.png',
  fg: 'texture-rain-fg.png',
  dropAlpha: 'drop-alpha.png',
  dropColor: 'drop-color.png'
}
```

3. **使用示例**：
```typescript
import { loadTextures, DEFAULT_ASSETS } from 'aling-rain'

loadTextures('#my-canvas', DEFAULT_ASSETS)
```

## API 参考

### BaseCommonRainOptions

```typescript
interface BaseCommonRainOptions {
  bg?: string              // 背景图片路径
  fg?: string              // 前景图片路径
  dropAlpha?: string       // 水滴透明度图片路径
  dropColor?: string       // 水滴颜色图片路径
  basePath?: string        // 基础路径
  onInit?: () => void      // 初始化完成回调
  onAbort?: () => void     // 停止时回调
}
```

### 函数

- `loadTextures(selector?: string, options?: LoadTexturesOptions): void`
- `abort(): void`

### 类

- `CommonRain` - 主要的雨滴效果类

## 注意事项

1. **图片资源路径**：确保所有图片资源都能正确访问
2. **CORS 问题**：如果使用 CDN，确保图片支持跨域访问
3. **性能优化**：图片资源建议进行适当压缩
4. **兼容性**：需要支持 WebGL 的浏览器

## 许可证

MIT
