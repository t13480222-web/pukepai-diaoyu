# 推币机物理参数

本文档集中记录 Matter.js 0.19.0 物理原型需要的可调参数。实现时所有参数必须迁移到 `src/config.js`，业务代码只读取配置，不直接写死数值。

## 1. 引擎与世界

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `engine.gravity.x` | 0 | 无量纲 | 世界水平重力，保持 0 |
| `engine.gravity.y` | 1.0 | 无量纲 | 需求指定的初始重力 |
| `engine.gravity.scale` | 0.001 | Matter.js 默认量级 | 配合 60 FPS 的重力缩放 |
| `engine.enableSleeping` | `true` | 布尔 | 让静止代币进入睡眠 |
| `runner.targetFps` | 60 | FPS | 物理目标帧率 |
| `runner.maxDeltaMs` | 50 | ms | 标签页切回时限制最大补偿步长 |
| `world.width` | 900 | px | 设计基准画布宽度，运行时按实际画布缩放 |
| `world.height` | 620 | px | 设计基准画布高度 |
| `world.wallThickness` | 30 | px | 静态边界厚度 |

说明：Matter.js 的重力效果同时受 `gravity.scale` 影响。`y = 1.0` 是逻辑重力方向，`scale = 0.001` 是适合像素世界的初始量级，后续以实际下落速度验收为准。

## 2. 代币刚体

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `token.radius` | 12 | px，建议 10～14 | 圆形代币半径 |
| `token.density` | 0.0012 | Matter.js 密度 | 低密度，避免堆叠过重 |
| `token.friction` | 0.05 | 0～1 | 代币与平台的摩擦 |
| `token.frictionStatic` | 0.08 | 0～1 | 静止时的起动摩擦 |
| `token.frictionAir` | 0.001 | 0～1 | 空气阻力 |
| `token.restitution` | 0.1 | 0～1 | 轻微弹性，避免弹飞 |
| `token.slop` | 0.02 | px | 碰撞容差 |
| `token.inertiaScale` | 1.0 | 比例 | 初始转动惯量比例 |
| `token.initialAngularVelocity` | 0 | rad/s | 默认不主动旋转 |
| `token.spawnVelocity.x` | 0 | px/s | 横向初速度 |
| `token.spawnVelocity.y` | 0 | px/s | 纵向初速度，由重力产生 |
| `token.maxCount` | 150 | 枚 | 场上代币上限 |
| `token.spawnSafeMargin` | 18 | px | 防止从边界重叠生成 |
| `token.sleepThreshold` | 60 | 帧/引擎阈值 | 静止后进入睡眠的参考阈值 |

代币统一设置 `label: 'token'`。三种视觉类型只改变渲染、价值和必要的碰撞过滤，不改变基础碰撞形状。

## 3. 投币口

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `spawn.xMin` | 180 | px | 随机投币最小横坐标 |
| `spawn.xMax` | 720 | px | 随机投币最大横坐标 |
| `spawn.y` | 58 | px | 代币出生纵坐标 |
| `spawn.clickOffset` | 0 | px | 点击投币时相对点击点的横向偏移 |
| `spawn.cooldownMs` | 120 | ms | 连续普通投币最小间隔 |
| `spawn.rewardIntervalMs` | 180 | ms | 奖励代币之间的生成间隔 |
| `spawn.maxPendingRewards` | 5 | 枚 | 同时等待生成的奖励上限 |

## 4. 雨刷

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `wiper.width` | 150 | px | 雨刷碰撞宽度 |
| `wiper.height` | 16 | px | 雨刷碰撞高度 |
| `wiper.y` | 154 | px | 雨刷中心纵坐标 |
| `wiper.minX` | 130 | px | 雨刷中心最小位置 |
| `wiper.maxX` | 770 | px | 雨刷中心最大位置 |
| `wiper.speed` | 360 | px/s | 键盘按住时移动速度 |
| `wiper.edgePadding` | 10 | px | 轨道边界安全距离 |
| `wiper.isSensor` | `false` | 布尔 | 必须参与碰撞，不是传感器 |
| `wiper.restitution` | 0.05 | 0～1 | 轻微反弹 |
| `wiper.friction` | 0.08 | 0～1 | 推动代币的摩擦 |

雨刷为运动学刚体。实现时使用 `Body.setVelocity` 或每帧位置更新，并将位置夹在 `[minX, maxX]`。

## 5. 移动靶

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `target.width` | 92 | px | 移动靶宽度 |
| `target.height` | 24 | px | 移动靶高度 |
| `target.y` | 250 | px | 移动靶中心纵坐标 |
| `target.minX` | 180 | px | 轨道最小中心位置 |
| `target.maxX` | 720 | px | 轨道最大中心位置 |
| `target.speed` | 135 | px/s | 水平往复速度 |
| `target.restitution` | 0.15 | 0～1 | 轻微弹性 |
| `target.friction` | 0.12 | 0～1 | 碰撞时有方向性摩擦 |
| `target.hitCooldownMs` | 850 | ms | 全局命中冷却 |
| `target.tokenHitCooldownMs` | 1000 | ms | 同一代币命中冷却 |
| `target.isSensor` | `true` | 布尔 | 只检测命中，不阻挡代币；如实测需要可改为实体碰撞 |

第三阶段默认以传感器方式实现，命中由 `collisionStart` 判断，并用代币 ID + 时间戳去重。

## 6. 推盘

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `pusher.width` | 710 | px | 推盘主体宽度 |
| `pusher.height` | 46 | px | 推盘主体厚度 |
| `pusher.y` | 465 | px | 推盘中心纵坐标 |
| `pusher.backX` | 445 | px | 后端中心位置 |
| `pusher.frontX` | 445 | px | 二维近似中保持水平，前后由 `y` 方向表示 |
| `pusher.backY` | 430 | px | 推盘后端位置 |
| `pusher.frontY` | 485 | px | 推盘前端位置 |
| `pusher.speed` | 78 | px/s | 往复速度 |
| `pusher.pauseAtEdgeMs` | 120 | ms | 端点停顿，增强节奏感 |
| `pusher.restitution` | 0.02 | 0～1 | 几乎不弹 |
| `pusher.friction` | 0.18 | 0～1 | 推动代币 |
| `pusher.isSensor` | `false` | 布尔 | 必须参与实体碰撞 |

推盘推荐用单一运动学矩形表示。`backY` 与 `frontY` 为二维游戏中对“前后”的近似：推盘在两个纵向位置间往复，前缘接近回收槽时推动代币掉落。

## 7. 静态边界与回收槽

| 参数 | 初始值 | 单位/范围 | 说明 |
| --- | ---: | --- | --- |
| `bounds.leftX` | 24 | px | 左墙中心位置 |
| `bounds.rightX` | 876 | px | 右墙中心位置 |
| `bounds.topY` | 0 | px | 顶部边界位置 |
| `bounds.bottomY` | 600 | px | 底部视觉边界 |
| `bounds.restitution` | 0.08 | 0～1 | 边界轻微弹性 |
| `chute.x` | 450 | px | 回收槽中心 |
| `chute.y` | 585 | px | 回收槽传感器中心 |
| `chute.width` | 210 | px | 回收槽检测宽度 |
| `chute.height` | 30 | px | 回收槽检测高度 |
| `chute.isSensor` | `true` | 布尔 | 进入后触发回收 |
| `chute.cooldownMs` | 150 | ms | 同一代币重复事件保护 |

回收槽上方需要设置实体边界或导流边，避免代币越过传感器后停留在不可见区域。

## 8. 碰撞分类

建议在 `src/config.js` 中使用位掩码保存分类：

| 分类 | 初始位 | 用途 |
| --- | ---: | --- |
| `TOKEN` | `0x0001` | 所有代币 |
| `WORLD` | `0x0002` | 墙体、底部边界 |
| `WIPER` | `0x0004` | 雨刷 |
| `TARGET` | `0x0008` | 移动靶传感器 |
| `PUSHER` | `0x0010` | 推盘 |
| `CHUTE` | `0x0020` | 回收槽传感器 |

推荐初始碰撞掩码：

- 代币：碰撞 `WORLD | WIPER | PUSHER`，与 `TARGET | CHUTE` 触发传感器事件。
- 雨刷：碰撞 `TOKEN | WORLD`。
- 移动靶：检测 `TOKEN`。
- 推盘：碰撞 `TOKEN | WORLD`。
- 回收槽：检测 `TOKEN`。

## 9. 性能参数

| 参数 | 初始值 | 说明 |
| --- | ---: | --- |
| `performance.maxTokens` | 150 | 场上最大代币数 |
| `performance.removeSleepingAfterMs` | 0 | 第一版不自动删除睡眠代币 |
| `performance.renderPixelRatioMax` | 2 | 高 DPI 屏幕最高像素比 |
| `performance.maxCollisionEventsPerFrame` | 40 | 单帧事件保护阈值 |
| `performance.fixedStepMs` | 16.6667 | 固定物理步长 |
| `performance.debugDraw` | `false` | 是否绘制碰撞体 |

## 10. 初始验收参考

- 代币从顶部落到底部，未出现明显穿透墙体或推盘。
- 推盘前端运动时，堆叠代币能产生可见位移。
- 代币进入回收槽后只计数一次并从世界移除。
- 150 枚上限触发后不会继续创建刚体。
- 切换到后台再回来，不出现几十秒物理瞬移或浏览器卡死。

