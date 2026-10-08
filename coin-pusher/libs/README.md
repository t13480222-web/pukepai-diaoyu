# Matter.js 依赖说明

第二阶段需要本地依赖文件：

```text
libs/matter.min.js
```

要求版本：**Matter.js 0.19.0**。

当前开发环境无法通过 npm 或网络下载该文件，因此暂时没有生成物理原型代码。请手动获取官方 Matter.js 0.19.0 构建文件，并将压缩版复制到：

```text
/Users/liuyuxuan09/Documents/ChatGPT/codex6制作游戏/libs/matter.min.js
```

可以从 Matter.js 0.19.0 的发行包中找到：

```text
build/matter.min.js
```

放置完成后回复我“已放置 Matter.js”，我会继续第二阶段实现。实现会通过普通 `<script src="libs/matter.min.js">` 加载，支持直接双击 `index.html`，不会使用 CDN、ES Module 或 `fetch`。

