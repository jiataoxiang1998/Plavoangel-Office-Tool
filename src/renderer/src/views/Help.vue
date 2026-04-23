<template>
  <div class="help-container">
    <h2 class="title">帮助中心</h2>

    <div class="help-sections">
      <div class="help-section" v-for="section in helpSections" :key="section.title">
        <h3 class="section-title">{{ section.title }}</h3>
        <div class="section-content">
          <div class="feature-item" v-for="feature in section.features" :key="feature.name">
            <h4>{{ feature.name }}</h4>
            <p>{{ feature.description }}</p>
            <div class="feature-details" v-if="feature.details">
              <ul>
                <li v-for="detail in feature.details" :key="detail">{{ detail }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-title">常见问题</h3>
        <div class="faq-list">
          <div class="faq-item" v-for="faq in faqs" :key="faq.q">
            <h4>Q: {{ faq.q }}</h4>
            <p>{{ faq.a }}</p>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3 class="section-title">关于</h3>
        <div class="about-info">
          <p><strong>Plavoangel Office Tool</strong></p>
          <p>版本: 1.0.0</p>
          <p>一款企业级办公工具，支持图片处理和销售文档转换。</p>
          <p class="copyright">© 2024 广州办公软件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const helpSections = [
  {
    title: '图片背景移除',
    features: [
      {
        name: '功能说明',
        description: '使用 AI 技术自动移除图片背景，支持批量处理。',
        details: [
          '支持 JPG、PNG 等常见图片格式',
          '可调整边缘平滑度和背景阈值',
          '支持填充背景颜色'
        ]
      },
      {
        name: '使用步骤',
        description: '',
        details: [
          '点击"选择图片"或"选择文件夹"添加图片',
          '设置参数（可选）：填充颜色、边缘平滑、背景阈值',
          '点击"开始处理"进行背景移除',
          '处理完成后点击"保存"导出结果'
        ]
      }
    ]
  },
  {
    title: '产品图片生成',
    features: [
      {
        name: '功能说明',
        description: '根据产品文件夹自动生成标准产品展示图。',
        details: [
          '支持 Plavoangel 和 Mornray 两种模板',
          '自动识别产品图片（OPEN、BACK、MAIN）',
          '自动识别颜色变体图片',
          '生成 PSD 分层文件便于后期编辑'
        ]
      },
      {
        name: '文件夹结构要求',
        description: '',
        details: [
          '每个产品一个独立文件夹',
          '主图命名：OPEN.jpg/png、BACK.jpg/png、MAIN.jpg/png',
          '颜色图：任意命名，程序自动识别',
          '产品信息：INFO.txt（可选）'
        ]
      },
      {
        name: 'INFO.txt 格式',
        description: '',
        details: [
          'SIZE: 产品尺寸',
          'UNIT: 计量单位',
          'BOX: 装箱数量',
          'ITEM NO: 产品编号'
        ]
      }
    ]
  },
  {
    title: '销售合同转装箱单',
    features: [
      {
        name: '功能说明',
        description: '将销售合同 Excel 文件转换为装箱单。',
        details: [
          '支持多合同文件合并',
          '可选择需要装箱的商品',
          '自动计算装箱数量和体积'
        ]
      },
      {
        name: '使用步骤',
        description: '',
        details: [
          '点击"选择合同"添加销售合同 Excel',
          '验证合同内容，勾选需要装箱的商品',
          '点击"生成装箱单"导出结果'
        ]
      }
    ]
  },
  {
    title: '销售合同转生产单',
    features: [
      {
        name: '功能说明',
        description: '将销售合同 Excel 文件转换为生产订单。',
        details: [
          '支持多合同文件合并',
          '可选择需要生产的商品',
          '自动汇总生产数量'
        ]
      },
      {
        name: '使用步骤',
        description: '',
        details: [
          '点击"选择合同"添加销售合同 Excel',
          '验证合同内容，勾选需要生产的商品',
          '点击"生成生产单"导出结果'
        ]
      }
    ]
  }
]

const faqs = [
  {
    q: '处理速度很慢怎么办？',
    a: '图片背景移除功能需要下载 AI 模型，首次运行时会自动下载。后续使用会使用缓存，速度会明显提升。'
  },
  {
    q: '生成的产品图片尺寸不对？',
    a: '确保产品图片分辨率足够高，建议至少 1000x1000 像素。程序会自动缩放到合适的尺寸。'
  },
  {
    q: 'Excel 文件格式不对？',
    a: '确保 Excel 文件包含必要的列：商品名称、数量、单价等。详细格式请参考销售合同模板。'
  },
  {
    q: '软件无法启动？',
    a: '请确保已安装所有必要的运行库。如果问题持续，请重新安装软件。'
  }
]
</script>

<style scoped lang="scss">
.help-container {
  max-width: 900px;
  margin: 0 auto;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-align: center;
}

.help-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.help-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: 13px;
      color: var(--text-secondary);
      padding: 4px 0;
      padding-left: 16px;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--primary);
      }
    }
  }
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  padding: 12px;
  background: var(--bg-main);
  border-radius: var(--radius-md);

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }
}

.about-info {
  text-align: center;

  p {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 4px 0;
  }

  .copyright {
    margin-top: 16px;
    color: var(--text-secondary);
    opacity: 0.7;
  }
}
</style>