// 日志模块

window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.logs = `
<div class="modal-overlay" id="logModal">
    <div class="modal" style="width: 750px; height: 600px;">
        <div class="modal-header">
            <span>📝 操作日志</span>
            <span class="close-btn" onclick="closeModal('logModal')">×</span>
        </div>
        <div class="log-list" id="logListContainer">
            </div>
    </div>
</div>

`;
