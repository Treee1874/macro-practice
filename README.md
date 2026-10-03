# Macro Studio

2025–26 · Macroeconomia e Politiche Economiche · 2526-2-E3303M010-T2

面向 Luca Corazzini / Lucia Dalla Pellegrina 课程的个人练习网站。意大利语题干、中文解析。题目为依据两套复习资料主题编写的原创变式，并非官方试卷。

## 使用

直接打开 `index.html` 即可，支持离线使用，无需安装。答题与错题记录保存在当前浏览器、当前设备。隐私模式或浏览器清理数据会影响记录。

## 内容

- 37 道开放式大题，保留连续小问、计算、论述和图形练习。
- 40 道原创选择题，覆盖两次期中范围及大纲中的政策延伸。
- 第一场、第二场、综合训练和错题重做。
- 原创综合训练卷：8 道选择题 + 3 道大题；计时可选。不是正式考试题数、分值或时长。
- 数值小问提供误差容限；论述与绘图提供参考答案及自评，不冒充教师评分。

## GitHub Pages

将本目录文件放到 GitHub 仓库根目录。在仓库 Settings → Pages 中选择 Deploy from a branch，选择 main 与 /(root)，然后 Save。文件 `.nojekyll` 跳过 Jekyll 构建。文件 `index.html` 是由其他源文件生成的独立版本，可单独使用。步骤依据 [GitHub 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

仓库中的 `index.html` 可作为 GitHub Pages 首页；它也是可离线使用的独立版本。

## 依据

官方大纲：https://elearning.unimib.it/course/info.php?id=60793

用户提供的复习资料：

1. Esercitazione di ripasso, I esame intermedio.pdf（25 大题）
2. Esercitazione ripasso per secondo esame intermedio - CON SOLUZIONI.pdf（12 大题）

未将原 PDF 发布到网站。修正了变式涉及的计算，不直接复制原答案。汇率题明确采用 E = 一单位本币可兑换的外币数量；利率平价、Fisher、债务动态均按题目说明采用课堂近似。

## 源文件

`bank.js` 题库；`app.js` 交互；`styles.css` 样式；`index.html` 独立网站。修改源文件后可用 `build.py` 更新 index.html（仅构建时需要 Python）。

## 复习方式

先按 Primo / Secondo 分章节练习，再做综合计时卷。每道大题按“模型与假设 → 方程 → 计算 → 经济解释 → 图形”完成；核对后，对论述和图形如实选择“已掌握”或“需要再练”。数值自动核对通过，不代表论述已经达到考试要求。

选择题用于检查概念、单位和政策传导。正式考试是否包含选择题仍以老师当期通知为准。综合训练卷按两个范围抽取 4+4 道选择题，3 道大题覆盖两场；只选一场时则从该场不同章节抽大题。时长可以选择 45、60、90 分钟。大纲中额外的 Ricardian equivalence、Mundell–Fleming 汇率制度、QE 已明确标记为大纲延伸。

数字可用小数点或小数逗号，避免千位分隔符；按输入框旁的单位填写。例如单位为“%”时，5% 填 5，单位为“比例”时填 0.05。保存记录依赖浏览器；建议定期导出 JSON 备份。
