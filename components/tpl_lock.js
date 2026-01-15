// 锁屏模块
// 1. 确保全局对象存在
window.AppTemplates = window.AppTemplates || {};

// 2. 挂载 'lock' 属性
window.AppTemplates.lock = `
<div id="lockScreenOverlay" class="lock-overlay">
    <div class="lock-box">
        <div class="lock-tabs">
            <div class="lock-tab-item active" onclick="switchLockTab('unlock', this)">🔓 解锁</div>
            <div class="lock-tab-item" onclick="switchLockTab('change', this)">🔑 修改密码</div>
        </div>
        <div id="panel-unlock" class="lock-content active">
            <div class="lock-avatar">🔒</div>
            <input type="password" id="unlockPwd" class="lock-input" placeholder="输入管理密码" onkeyup="if(event.key==='Enter') checkUnlock()">
            <button class="btn-unlock" onclick="checkUnlock()">解 锁</button>
        </div>
        <div id="panel-change" class="lock-content">
            <div style="font-size:12px; color:#999; margin-bottom:10px;">修改密码后将自动保存</div>
            <input type="password" id="oldPwdChange" class="lock-input" placeholder="当前旧密码">
            <input type="text" id="newPwdChange" class="lock-input" placeholder="设置新密码">
            <button class="btn-change" onclick="doChangePassword()">确认修改</button>
        </div>
    </div>
</div>
`;