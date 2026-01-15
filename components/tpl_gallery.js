
// 图鉴模块
window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.gallery = `
<div class="modal-overlay" id="galleryModal">
    <div class="modal modal-normal" style="width: 850px; max-height: 85vh;">
        <div class="modal-header"><span>🖼️ 萌宠进阶路线图</span><span class="close-btn" onclick="closeModal('galleryModal')">×</span></div>
        <div id="galleryContent" class="detail-content" style="align-items: flex-start; overflow-y: auto; width: 100%; box-sizing: border-box;"></div>
    </div>
</div>
<div id="imgPreviewOverlay" onclick="this.style.display='none'" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.1); z-index:9999; display:none; justify-content:center; align-items:center; cursor:zoom-out; backdrop-filter: blur(2px);">
    <img id="imgPreviewTarget" src="" style="max-width:90%; max-height:90%; border-radius:16px; box-shadow:0 0 30px rgba(255,255,255,0.2); animation: zoomIn 0.2s ease-out;">
</div>
`;