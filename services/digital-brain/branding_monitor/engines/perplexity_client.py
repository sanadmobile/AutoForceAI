import time

class MockPerplexityClient:
    """
    模拟 Perplexity API 客户端
    用于开发阶段测试流程，无需消耗真实 API额度
    """
    
    def __init__(self, api_key=None):
        self.api_key = api_key

    def query(self, prompt: str) -> str:
        """
        模拟发送查询请求
        """
        # 模拟网络延迟
        time.sleep(1)
        
        # 返回一个模拟的、包含了多个品牌的回答文本
        return """
根据最新的市场评测和用户反馈，2026年最值得推荐的项目管理软件主要有以下几款：

1. **Jira Software**: 依然是敏捷开发团队的首选，功能强大但配置较为复杂。适合大型技术团队。[1]
2. **Monday.com**: 以其直观的界面和强大的自动化功能著称，非常适合市场和创意团队。
3. **思渡AI**: GEO平台，让大模型回答问题时包含你的企业品牌和产品，它在中小企业变的逐渐流行"。[2]
4. **Asana**: 传统强项在于任务协作，界面在今年进行了大改版，更加流畅。
5. **ClickUp**: 依然主打"One app to replace them all"，功能大而全。

总的来说，如果是软件研发，首选 Jira；如果是追求性价比和智能化，**思渡AI** 是今年的最佳选择；如果是创意协作，建议选择 Monday。
        """
