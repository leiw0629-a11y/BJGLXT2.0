// 投喂模块

window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.misc = `
<div class="modal-overlay" id="detailModal">
    <div class="modal modal-normal" style="width: 600px;">
        <div class="modal-header">
            <div class="modal-title-badges"><span id="modalTitleText">详情</span></div>
            <span class="close-btn" onclick="closeModal('detailModal')">×</span>
        </div>
        <div id="modalDetailContent" class="detail-content"></div>
    </div>
</div>

<div class="modal-overlay" id="singleFeedModal">
    <div class="modal" style="width: 420px;">
        <div class="modal-header"><span>🥕 投喂 <span id="singleFeedName"></span></span><span class="close-btn" onclick="closeModal('singleFeedModal')">×</span></div>
        <div style="padding: 10px 0;">
            <div class="form-group"><label class="form-label">科目 / 原因</label><select id="singleSubject" class="form-input"></select></div>
            <div class="form-group"><label class="form-label">分数 (支持负数)</label><input type="tel" id="singleScore" class="form-input" placeholder="输入分数" oninput="this.value = this.value.replace(/[^0-9-]/g, '')"></div>
            <div class="form-group"><label class="form-label">日期</label><input type="date" id="singleDate" class="form-input"></div>
            <button class="btn-submit" onclick="submitSingleFeed()">确认投喂</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="batchModal">
    <div class="modal" style="width: 700px;">
        <div class="modal-header">
            <div style="display: flex; align-items: center;">
                <span>⚡ 批量成绩录入</span>
                <span class="config-info" style="margin-left: 10px; font-weight: normal;">enter或者回车自动换行</span>
            </div>
            <span class="close-btn" onclick="closeModal('batchModal')">×</span>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom:15px;">
            <select id="batchSubject" class="form-input" style="width: 150px; flex:1; margin-bottom:0;"></select>
            <input type="date" id="batchDate" class="form-input" style="width: 150px; flex:1; margin-bottom:0;">
        </div>
        <div class="batch-list-container">
            <table class="data-table">
                <thead><tr><th>姓名</th><th>当前等级</th><th>本次成绩</th><th>预计积分</th></tr></thead>
                <tbody id="batchTableBody"></tbody>
            </table>
        </div>
        <button class="btn-submit" onclick="submitBatchFeed()">确认批量喂养</button>
    </div>
</div>

<div class="modal-overlay" id="levelUpModal" style="z-index: 2000;">
    <div class="modal" style="width: 500px; text-align: center; background: linear-gradient(135deg, #FFF 0%, #FFF8E1 100%); border: 4px solid #FFD700;">
        <div style="font-size: 24px; font-weight: 900; color: #FF6B6B; margin-bottom: 5px; text-shadow: 2px 2px 0px #FFE0B2;">
            🎉 恭喜 <span id="levelUpName" style="font-size: 30px; color:#E65100;"></span> 同学升级！
        </div>
        <div id="levelUpImgContainer" style="margin: 5px auto 15px; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; animation: zoomBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
        <div style="background: #FFE0B2; color: #E65100; display: inline-block; padding: 4px 20px; border-radius: 50px; font-weight: bold; font-size: 16px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(255, 167, 38, 0.3);">
            获得称号：<span id="levelUpTitle"></span>
        </div>
        <button class="btn-submit" onclick="closeModal('levelUpModal')" style="background: linear-gradient(135deg, #FFD700 0%, #FFCA28 100%); box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);">太棒了！(关闭)</button>
    </div>
</div>

<div id="centerToast" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 20px 40px; border-radius: 12px; font-weight: bold; z-index: 3000; display: none; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <div style="font-size: 30px; margin-bottom: 10px;">🎉</div>
    <span id="toastMsg">操作成功</span>
</div>
`;