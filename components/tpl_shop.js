// 商城模块
window.AppTemplates = window.AppTemplates || {};

window.AppTemplates.shop = `
<div class="modal-overlay" id="shopModal">
    <div class="modal" style="width: 850px; height: 650px;">
        <div class="modal-header">
            <span>🎁 积分兑换商城</span>
            <span class="close-btn" onclick="closeModal('shopModal')">×</span>
        </div>
        <div class="shop-container">
            <div class="shop-left">
                <div style="font-weight:bold; color:#FF6B6B; margin-bottom:10px; display:flex; justify-content:space-between;">
                    <span>🛒 选择商品</span><span style="font-size:12px; color:#999;">点击下方 + 号可添加新商品</span>
                </div>
                <div id="shopGoodsGrid" class="shop-goods-grid"></div>
            </div>
            <div class="shop-right">
                <input type="text" id="shopSearchInput" class="form-input" placeholder="🔍 搜名字可多选..." style="height:36px; font-size:13px; margin-bottom: 5px;" oninput="renderShopStudents()">
                <div id="shopStudentList" class="shop-student-list"></div>
                <div class="shop-footer">
                    <div style="font-size: 13px; color: #666;">已选: <span id="selectedCount" style="color:#FF6B6B; font-weight:bold; font-size:16px;">0</span> 人</div>
                    <button id="btnBatchBuy" class="btn-batch-buy" onclick="submitBatchPurchase()">确认兑换</button>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal-overlay" id="addProductModal" style="z-index: 2000;">
    <div class="modal" style="width: 350px;">
        <div class="modal-header">
            <span>🎁 上架新商品</span>
            <span class="close-btn" onclick="closeModal('addProductModal')">×</span>
        </div>
        <div style="padding: 15px 0;">
            <div class="form-group"><label class="form-label">奖品名称</label><input type="text" id="newProdName" class="form-input" placeholder="例如：免作业卡"></div>
            <div class="form-group"><label class="form-label">兑换积分</label><input type="tel" id="newProdPrice" class="form-input" placeholder="输入数字，如 500"></div>
            <button class="btn-submit" onclick="confirmAddProduct()">确认上架</button>
        </div>
    </div>
</div>
`;