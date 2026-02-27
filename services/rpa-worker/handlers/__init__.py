
from .zhihu_handler import ZhihuHandler
from .media_handler import MediaHandler
from .social_platform_handler import SocialHandler
from .baike_handler import BaikeHandler

def get_handler(platform_type: str, page):
    if platform_type in ["social_qa", "zhihu"]:
        return ZhihuHandler(page)
    elif platform_type == "media":
        return MediaHandler(page)
    elif platform_type in ["redbook", "tiktok", "linkedin", "wechat", "douyin", "xiaohongshu"]:
        return SocialHandler(page)
    elif platform_type in ["baidu_baike", "baike", "wiki"]:
        return BaikeHandler(page)
    return None
