# Plavoangel Office Tool

一款企业级办公工具，支持图片处理和销售文档转换。

## 功能特性

### 图片背景移除
- 使用 AI 技术自动移除图片背景
- 支持批量处理
- 可调整边缘平滑度和背景阈值
- 支持填充背景颜色

### 产品图片生成
- 根据产品文件夹自动生成标准产品展示图
- 支持 Plavoangel 和 Mornray 两种模板
- 自动识别产品图片（OPEN、BACK、MAIN）
- 自动识别颜色变体图片
- 生成 PSD 分层文件便于后期编辑

### 销售合同转装箱单
- 将销售合同 Excel 转换为装箱单
- 支持多合同文件合并
- 可选择需要装箱的商品

### 销售合同转生产单
- 将销售合同 Excel 转换为生产订单
- 支持多合同文件合并
- 可选择需要生产的商品

## 系统要求

- 操作系统：Windows 10 及以上
- 内存：建议 8GB 及以上
- 硬盘空间：约 500MB

## 安装

1. 下载最新版本的安装包 `Plavoangel Setup x.x.x.exe`
2. 运行安装程序
3. 按照安装向导完成安装

## 使用方法

### 图片背景移除
1. 点击"选择图片"或"选择文件夹"添加图片
2. 设置参数（可选）：填充颜色、边缘平滑、背景阈值
3. 点击"开始处理"进行背景移除
4. 处理完成后点击"保存"导出结果

### 产品图片生成
产品文件夹结构要求：
```
产品文件夹/
├── OPEN.jpg          # 开盒图
├── BACK.jpg          # 背面图
├── MAIN.jpg          # 主图
├── 颜色1.jpg          # 颜色变体
├── 颜色2.jpg          # 颜色变体
└── INFO.txt          # 产品信息（可选）
```

INFO.txt 格式：
```
SIZE: 10x20x30cm
UNIT: PCS
BOX: 24
ITEM NO: PA001
```

### 销售合同转装箱单
1. 点击"选择合同"添加销售合同 Excel
2. 验证合同内容，勾选需要装箱的商品
3. 点击"生成装箱单"导出结果

### 销售合同转生产单
1. 点击"选择合同"添加销售合同 Excel
2. 验证合同内容，勾选需要生产的商品
3. 点击"生成生产单"导出结果

## 技术栈

- 前端：Vue 3 + TypeScript + SCSS
- 桌面框架：Electron
- Python 处理脚本：Pillow、psd-tools、rembg

## 开发

### 环境要求
- Node.js 18+
- Python 3.11+
- npm

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 打包
```bash
npm run package
```

## 许可证

© 2024 广州办公软件

## 联系方式

- 邮箱：support@plavoangel.com
- 网站：https://github.com/jiataoxiang1998/Plavoangel-Office-Tool