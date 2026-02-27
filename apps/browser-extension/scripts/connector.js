// connector.js - 注入到 Web Console 页面，用于接收网页发出的指令

// 1. 向网页注入一个标记，告诉 SaaS 平台插件已就绪
// 这让 React 代码能通过 if (window.__DIGITAL_EMPLOYEE_INSTALLED__) 知道插件在不在
const script = document.createElement('script');
script.textContent = "window.__DIGITAL_EMPLOYEE_INSTALLED__ = true;";
(document.head || document.documentElement).appendChild(script);
script.remove();

// 2. 监听来自网页本身的消息 (window.postMessage)
window.addEventListener("message", (event) => {
    // 安全检查：确保只处理我们自己的消息
    if (event.source !== window || !event.data || event.data.type !== "RPA_TRIGGER") {
        return;
    }

    console.log("[Extension Connector] 收到网页指令:", event.data);

    // 转发给 Background Service Worker 去处理 (因为 Content Script 权限有限，无法直接控制 Tabs)
    chrome.runtime.sendMessage({
        action: "START_RPA_TASK",
        data: event.data.payload
    });
});
