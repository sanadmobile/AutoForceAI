// apps/web-console/public/rpa-bookmarklet.js

(function() {
    console.log("🤖 Digital Employee 书签助手已启动...");

    // 1. 从 URL Hash 中获取任务数据 (避免跨域 API 调用的复杂性，适合轻量任务)
    // URL 格式示例: https://creator.xiaohongshu.com/publish/publish#rpa_data={"title":"...","content":"..."}
    function getTaskData() {
        try {
            const hash = window.location.hash;
            if (hash.includes('rpa_data=')) {
                const jsonStr = decodeURIComponent(hash.split('rpa_data=')[1]);
                return JSON.parse(jsonStr);
            }
        } catch (e) {
            console.error("解析任务数据失败", e);
        }
        return null;
    }

    // 2. 模拟输入 (React/Vue 通用方案)
    function nativeInputValue(input, value) {
        if (!input) return;
        const lastValue = input.value;
        input.value = value;
        const event = new Event('input', { bubbles: true });
        // React 15/16 hack
        const tracker = input._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        input.dispatchEvent(event);
    }

    const task = getTaskData();
    if (!task) {
        alert("⚠️ 未检测到任务数据！请先从 Web 控制台点击'去发布'跳转过来。");
        return;
    }

    // 3. 执行填充逻辑 (针对小红书)
    if (location.hostname.includes("xiaohongshu")) {
        // 标题
        const titleInput = document.querySelector("input[placeholder*='标题']") || document.querySelector(".title-input");
        if (titleInput) {
            nativeInputValue(titleInput, task.title);
            console.log("标题已填充");
        }

        // 正文 (ContentEditable div)
        const contentDiv = document.querySelector("#post-textarea") || document.querySelector(".c-input_textarea");
        if (contentDiv) {
            contentDiv.innerText = task.content; // 简单赋值
            contentDiv.dispatchEvent(new Event('input', { bubbles: true }));
            console.log("正文已填充");
        }
        
        alert(`✅ 自动填充完毕！\n标题：${task.title.substring(0,10)}...\n\n请检查后点击发布。`);
    } else if (location.hostname.includes("douyin")) {
         // 抖音逻辑...
         alert("抖音填充逻辑待根据页面 ID 适配");
    } else {
        alert("不支持当前平台，请在小红书或抖音创作平台使用。");
    }

})();
