// xiaohongshu_handler.js - 运行在小红书页面内的脚本
console.log("[Digital Employee] 小红书助手已加载");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXECUTE_PUBLISH") {
        console.log("收到发布任务:", request.data);
        performPublish(request.data);
    }
});

async function performPublish(data) {
    const { title, content } = data;

    // 辅助函数：模拟原生输入 (React/Vue 有时需要触发 input 事件)
    const fillInput = (selector, text) => {
        const el = document.querySelector(selector);
        if (el) {
            el.focus();
            // 模拟全选删除
            document.execCommand('selectAll');
            document.execCommand('delete');
            // 粘贴或输入
            document.execCommand('insertText', false, text);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        return false;
    };

    // 1. 检测登录
    if (document.body.innerText.includes("登录") && !document.querySelector(".publish-container")) {
        alert("请先扫码登录，登录后插件将继续自动填写！");
        return; // 用户登录后，可能需要重新触发，或者我们可以写一个轮询检测
    }

    // 2. 填写标题
    // *选择器需要根据实际页面 DOM 调整，这里参考之前的 Python 逻辑*
    let titleSuccess = fillInput("input[placeholder*='标题']", title);
    if (!titleSuccess) titleSuccess = fillInput(".title-input", title);

    if (titleSuccess) console.log("标题填写成功");
    else console.warn("未找到标题输入框");

    await new Promise(r => setTimeout(r, 1000));

    // 3. 填写正文
    let contentSuccess = fillInput("#post-textarea", content); // 常见ID
    if (!contentSuccess) contentSuccess = fillInput(".c-input_textarea", content);
    if (!contentSuccess) contentSuccess = fillInput("div[contenteditable='true']", content);

    if (contentSuccess) console.log("正文填写成功");
    else console.warn("未找到正文输入框");
    
    // 4. 用户微调
    alert("自动化助手已帮您填写内容，请检查是否正确，并手动点击发布！");
}
