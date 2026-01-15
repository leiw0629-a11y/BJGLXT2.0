// ================= 数据中心 =================
let students = []; 
let products = [];
let historyData = []; 
let currentFeedName = ''; 
let currentDetailName = ''; 
let docTitle = '萌宠成绩养成记'; 
let isDataDirty = false; 

let CONFIG = { 
    pointsPerLevel: 100, 
    expRate: 0.5,   // 经验换算比例
    pointRate: 1.0,  // 积分换算比例
    password: "888888"  // <--- 新增这一行：默认密码为空
};

let SUBJECT_LIST = ["语文", "数学", "英语", "日常"];
let EVOLUTION_RULES = [3, 6, 10, 20]; 

let PET_LIBRARY = {
    "default": { images: ["🥚", "🐣", "🐔", "🦉", "🐲"], titles: ["神秘的蛋", "呆萌小鸡", "战斗公鸡", "博学猫头鹰", "传说神龙"] },
    "fire": { images: ["🔥", "🦎", "🦖", "🐲", "🌞"], titles: ["初级火苗", "火焰蜥蜴", "喷火霸龙", "烈焰神龙", "太阳神"] }
};

// 强力时间格式化函数 (精确到秒)
function formatAnyTime(timeInput) {
    if (!timeInput && timeInput !== 0) return ""; 
    let date;
    if (timeInput instanceof Date) {
        date = timeInput;
    } else if (typeof timeInput === 'number') {
        date = new Date((timeInput - 25569) * 86400 * 1000); // 处理Excel日期
    } else if (typeof timeInput === 'string') {
        if(timeInput.includes('T')) date = new Date(timeInput);
        else date = new Date(timeInput.replace(/-/g, '/'));
    }
    
    if (!date || isNaN(date.getTime())) return String(timeInput);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hh}:${mm}:${ss}`;
}

window.addEventListener('beforeunload', function (e) {
    if (isDataDirty) { e.preventDefault(); e.returnValue = ''; return ''; }
});

function getPetInfo(student) {
    let pathKey = student.petPath || "default"; 
    if (!PET_LIBRARY[pathKey]) pathKey = "default";
    const libraryItem = PET_LIBRARY[pathKey];
    const pathImages = libraryItem.images || [];
    const pathTitles = libraryItem.titles || [];
    let stageIndex = 0;
    for (let i = 0; i < EVOLUTION_RULES.length; i++) { if (student.level >= EVOLUTION_RULES[i]) stageIndex = i + 1; }
    if (stageIndex >= pathImages.length) stageIndex = pathImages.length - 1;
    let media = pathImages[stageIndex] || "❓";
    let title = pathTitles[stageIndex] || `${pathKey} (阶${stageIndex+1})`;
    let styleClass = ""; if (stageIndex >= 2) styleClass = "mid"; if (stageIndex >= 4) styleClass = "high";
    let htmlContent = '';
    if (media.match(/\.(jpeg|jpg|gif|png|webp)$/i) || media.startsWith('http')) {
        htmlContent = `<img src="${media}" class="pet-avatar" alt="pet" onerror="this.onerror=null;this.parentNode.innerHTML='<span class=\\'pet-avatar\\'>🥚</span>';">`;
    } else { htmlContent = `<span class="pet-avatar">${media}</span>`; }
    return { html: htmlContent, raw: media, title: title, class: styleClass, pathName: pathKey };
}

function changeStudentPath(path) {
    if (!currentDetailName) return;
    const idx = students.findIndex(s => s.name === currentDetailName);
    if (idx !== -1) {
        students[idx].petPath = path;
        saveData(); isDataDirty = true;
        openStudentDetail(currentDetailName); renderMainTable();
    }
}
// ================= 锁屏逻辑 =================
// 触发锁屏
function lockScreen() {
    // 如果还没设密码，提示去Excel设，或者允许用户直接在修改页设（看你需求，这里保持严谨，先设再锁）
    if (!CONFIG.password) {
        // 如果是空密码，直接跳转到修改面板，让用户设初始密码
        document.getElementById('lockScreenOverlay').style.display = 'flex';
        // 自动切换到修改页
        const tabs = document.querySelectorAll('.lock-tab-item');
        switchLockTab('change', tabs[1]); 
        return;
    }
    
    // 正常锁屏，默认显示解锁页
    document.getElementById('unlockPwd').value = '';
    document.getElementById('oldPwdChange').value = '';
    document.getElementById('newPwdChange').value = '';
    
    document.getElementById('lockScreenOverlay').style.display = 'flex';
    
    // 重置回解锁Tab
    const tabs = document.querySelectorAll('.lock-tab-item');
    switchLockTab('unlock', tabs[0]);
}

// 切换 Tab
function switchLockTab(mode, tabEl) {
    // 样式切换
    document.querySelectorAll('.lock-tab-item').forEach(el => el.classList.remove('active'));
    tabEl.classList.add('active');
    
    // 内容切换
    document.querySelectorAll('.lock-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`panel-${mode}`).classList.add('active');
}

// 执行解锁
function checkUnlock() {
    const input = document.getElementById('unlockPwd').value;
    // 兼容 String 比对
    if (String(input) === String(CONFIG.password)) {
        document.getElementById('lockScreenOverlay').style.display = 'none';
    } else {
        alert("❌ 密码错误");
        document.getElementById('unlockPwd').value = '';
        document.getElementById('unlockPwd').focus();
    }
}

 // 执行修改密码
function doChangePassword() {
    const oldPwd = document.getElementById('oldPwdChange').value.trim();
    const newPwd = document.getElementById('newPwdChange').value.trim();

    if (!newPwd) return alert("❌ 新密码不能为空");

    // 验证旧密码 (如果本来就没密码，则允许直接设)
    if (CONFIG.password && String(oldPwd) !== String(CONFIG.password)) {
        return alert("❌ 旧密码错误！无法修改。");
    }

    // 修改并保存
    CONFIG.password = newPwd;
    saveData(); 
    // =========== 核心修复在这里 ===========
    isDataDirty = true;  // 标记数据为“脏数据”，这样关闭网页时就会报警了
    // ======================================
    alert("✅ 密码修改成功！请牢记新密码。");
    
    // 修改成功后，自动清空输入框并切回解锁页
    document.getElementById('oldPwdChange').value = '';
    document.getElementById('newPwdChange').value = '';
    document.getElementById('unlockPwd').value = '';
    
    const tabs = document.querySelectorAll('.lock-tab-item');
    switchLockTab('unlock', tabs[0]); // 切回解锁页，让用户用新密码解一次，体验闭环
}

window.onload = function() {
    const savedData = localStorage.getItem('petGameData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        students = parsed.students || [];
        // 兼容旧数据
        students.forEach(s => { if (s.currentPoints === undefined || s.currentPoints === null) s.currentPoints = s.totalPoints || 0; });
        historyData = parsed.history || [];
        products = parsed.products || [];
        
        // --- 关键修改：读取配置并处理密码 ---
        if(parsed.config) {
            CONFIG = parsed.config;
            // 【补丁】如果旧缓存里没有密码字段，或者密码为空，强制设为 "888888"
            if (!CONFIG.password) {
                CONFIG.password = "888888"; 
                isDataDirty = true; // 标记数据已修改，下次保存时写入
            }
        }
        
        if(parsed.subjects) SUBJECT_LIST = parsed.subjects;
        if(parsed.library) PET_LIBRARY = parsed.library; 
        if(parsed.rules) EVOLUTION_RULES = parsed.rules;
        if(parsed.title) docTitle = parsed.title;
        document.getElementById('mainTitle').innerText = `🔥 ${docTitle} 萌宠养成`;
        refreshUI();

        // --- 自动锁屏逻辑 ---
        // 只要有密码（上面已经强制设了888888），就锁屏
        if (CONFIG.password) {
            lockScreen(); // 直接调用锁屏函数
        }
    } else { 
        initDemoData(); 
        // 如果是第一次初始化，也锁屏
        if(CONFIG.password) lockScreen();
    }
    
    // 每次刷新都重置脏数据标记，防止误报
    setTimeout(() => { isDataDirty = false; }, 500); 
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('batchDate').value = today;
    document.getElementById('singleDate').value = today;
};


function initDemoData() {
    students = [{ name: "示例同学", level: 1, exp: 0, totalPoints: 0, currentPoints: 0, petPath: "default" }];
    products = [{ name: "免作业卡", price: 500, icon: "🎟️" }, { name: "橡皮擦", price: 50, icon: "✏️" }, { name: "棒棒糖", price: 100, icon: "🍭" }];
    historyData = [];
    saveData(); refreshUI();
}

function saveData() {
    const data = { students, history: historyData, config: CONFIG, subjects: SUBJECT_LIST, title: docTitle, library: PET_LIBRARY, rules: EVOLUTION_RULES, products };
    localStorage.setItem('petGameData', JSON.stringify(data));
}

// 2. 修改 UI 刷新显示 (找到原来的 refreshUI 替换)
function refreshUI() {
    renderRankingList(); 
    renderMainTable(); 
    renderSubjectDropdowns(); 
    // 更新顶部显示的配置信息
    document.getElementById('configDisplay').innerText = `[1级=${CONFIG.pointsPerLevel}经验 | 1分=${CONFIG.expRate}经验 / ${CONFIG.pointRate}积分]`;
}

function renderSubjectDropdowns() {
    const ids = ['singleSubject', 'batchSubject'];
    ids.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '';
        SUBJECT_LIST.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub; opt.textContent = sub; select.appendChild(opt);
        });
    });
}

// 3. 修改核心加分逻辑 (替换原来的 addPoints)
function addPoints(studentIndex, score, subject, dateStr, isDirectPoints = false) {
    const student = students[studentIndex];
    
    let pointsChange = 0;
    let expChange = 0;
    let recordScore = 0; // 记录在日志里的原始分数

    if (isDirectPoints) {
        // 情况A：商城兑换或直接扣积分 (不涉及经验，直接扣数值)
        pointsChange = parseInt(score); // 这里的 score 通常是负数
        expChange = 0; 
        recordScore = pointsChange;
    } else {
        // 情况B：日常打分 (应用双重比例)
        const rawScore = parseInt(score);
        recordScore = rawScore;

        // 1. 计算积分变动 (允许负数)
        pointsChange = Math.floor(rawScore * CONFIG.pointRate);

        // 2. 计算经验变动 (经验只增不减，除非是撤销)
        // 如果分数是正的，加经验；如果分数是负的(惩罚)，经验变动为0
        if (rawScore > 0) {
            expChange = Math.floor(rawScore * CONFIG.expRate);
        } else {
            expChange = 0; 
        }
    }

    // --- 执行变动 ---
    
    // 更新积分
    if(student.currentPoints === undefined) student.currentPoints = 0;
    student.currentPoints += pointsChange; 

    // 更新经验和等级
    if (expChange > 0) {
        student.exp += expChange;
        student.totalPoints = (student.totalPoints || 0) + expChange;
        // 升级循环
        while (student.exp >= CONFIG.pointsPerLevel) {
            student.exp -= CONFIG.pointsPerLevel;
            student.level += 1;
        }
    }

    // 记录日志
    const formattedTime = formatAnyTime(dateStr || new Date());
    historyData.unshift({
        time: formattedTime, 
        name: student.name,
        subject: subject, 
        score: recordScore, 
        expChange: expChange,
        pointsChange: pointsChange,
        revoked: false
    });
    
    isDataDirty = true;
    return pointsChange;
}

// 核心撤销逻辑 (严格回滚+降级)
function revokeHistoryItem(index) {
    const record = historyData[index];
    if (!record || record.revoked) return;

    if (!confirm(`⚠️ 确定要撤销这条记录吗？\n\n[${record.time}] ${record.name}\n${record.subject}: ${record.pointsChange > 0 ? '+' : ''}${record.pointsChange}积分\n\n撤销将自动回退积分和经验，如果经验不足将自动降级。`)) return;

    const idx = students.findIndex(s => s.name === record.name);
    if (idx === -1) return alert("找不到该学生，无法撤销");

    const student = students[idx];

    // 1. 回滚积分 (减去当时的变动)
    // 例子：当时+50，现在减50。当时-500，现在减-500(即加500)。
    student.currentPoints -= record.pointsChange;

    // 2. 回滚经验 (严格降级逻辑)
    if (record.expChange > 0) {
        student.exp -= record.expChange;
        student.totalPoints -= record.expChange;

        // 循环降级处理
        while (student.exp < 0) {
            if (student.level > 1) {
                student.level -= 1;
                student.exp += CONFIG.pointsPerLevel;
            } else {
                // 已经1级了还在扣，锁死在0
                student.exp = 0;
                break;
            }
        }
    }

    // 3. 标记为已撤销
    record.revoked = true;
    
    saveData();
    refreshUI();
    
    // 刷新可能打开的弹窗
    if(document.getElementById('logModal').style.display === 'flex') openLogModal();
    if(document.getElementById('detailModal').style.display === 'flex') openStudentDetail(student.name);

    showToast("🗑️ 记录已撤销并回滚");
}

function renderRankingList() {
    const listEl = document.getElementById('rankingList');
    listEl.innerHTML = '';
    const sorted = [...students].sort((a, b) => b.totalPoints - a.totalPoints);
    sorted.slice(0, 10).forEach((stu, index) => {
        const div = document.createElement('div');
        div.className = `student-card`;
        div.onclick = () => openStudentDetail(stu.name);
        let rankClass = index < 3 ? `rank-${index+1}` : '';
        div.innerHTML = `<div class="rank-badge ${rankClass}">${index + 1}</div><div class="card-info"><div class="card-name">${stu.name}</div></div><div class="card-score">${stu.totalPoints}</div>`;
        listEl.appendChild(div);
    });
}

function renderMainTable() {
    const tbody = document.getElementById('mainTableBody');
    const term = document.getElementById('searchInput').value.toLowerCase();
    tbody.innerHTML = '';
    const sorted = [...students].sort((a, b) => b.totalPoints - a.totalPoints);
    sorted.forEach((stu, index) => {
        if (term && !stu.name.toLowerCase().includes(term)) return;
        const pet = getPetInfo(stu);
        const percent = Math.min(100, (stu.exp / CONFIG.pointsPerLevel) * 100);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td style="font-weight:bold;">${stu.name}</td>
            <td>${pet.html}<span class="status-tag ${pet.class}">${pet.title}</span></td>
            <td style="padding: 8px 15px;">
                <div style="width:120px; height:8px; background:#FFE0B2; border-radius:4px; overflow:hidden; margin: 0 auto 6px auto;">
                    <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #FF8A65, #FF5252);"></div>
                </div>
                <div style="font-size: 13px; color: #5D4037;"><span style="font-weight:900; color:#FF8A65; margin-right:5px;">Lv.${stu.level}</span><span style="color:#8D6E63; font-family: monospace;">${stu.exp}/${CONFIG.pointsPerLevel}</span></div>
            </td>
            <td style="color:#FF8A65; font-weight:900; font-size:16px;">🪙 ${stu.currentPoints === undefined ? stu.totalPoints : stu.currentPoints}</td>
            <td style="display: flex; gap: 5px; justify-content: center; align-items: center; border-bottom: 1px solid #FFF3E0; padding: 12px 15px;">
                <button class="action-btn btn-detail" onclick="openStudentDetail('${stu.name}')">详情</button>
                <button class="action-btn btn-feed" onclick="openSingleFeed('${stu.name}')">喂养</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ================== 最终修改版：操作日志逻辑 ==================

// 打开全校操作日志弹窗
function openLogModal() {
    const modal = document.querySelector('#logModal .modal');
    // 1. 设置弹窗大小
    modal.className = "modal modal-normal"; 
    modal.style.width = "850px";            
    modal.style.height = "85vh";        
    modal.style.maxHeight = "85vh";

    const container = document.getElementById('logListContainer');
    
    // --- 关键修改开始：强制去除外层滚动条，使用Flex布局 ---
    container.style.overflow = "hidden";       // 🚫 禁止外层滚动
    container.style.display = "flex";          // ✨ 启用Flex布局
    container.style.flexDirection = "column";  // ⬇️ 垂直排列
    container.style.height = "100%";           // 📏 占满高度
    // --- 关键修改结束 ---

    // 2. 构建界面 (注意下面那个表格容器 div 去掉了 height: calc... 改为了 flex: 1)
    container.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px; gap: 10px; background:#FFFBF7; padding:8px; border-radius:8px; border:1px dashed #FFCCBC; flex-shrink: 0;">
            <div style="flex:1;">
                <input type="text" id="logSearchName" class="form-input" 
                       style="height: 36px; font-size: 13px; width: 100%;" 
                       placeholder="🔍 搜姓名..." oninput="renderLogTable()">
            </div>
            <div style="position: relative;">
                <input type="date" id="logSearchDate" class="form-input" 
                       style="height: 36px; font-size: 13px; width: 130px; cursor: pointer;" 
                       onchange="renderLogTable()" 
                       onclick="try{this.showPicker()}catch(e){}">
            </div>
            <button onclick="document.getElementById('logSearchName').value='';document.getElementById('logSearchDate').value='';renderLogTable()" 
                    style="height: 36px; padding: 0 15px; border-radius: 8px; border: 1px solid #FFCCBC; background: white; color: #FF7043; cursor: pointer; font-size: 13px; white-space:nowrap;">
                重置
            </button>
        </div>
        <div style="flex: 1; overflow-y: auto; border: 1px solid #FFEEE4; border-radius: 12px; min-height: 0;">
            <table class="data-table" style="width:100%">
                <thead style="position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th width="100">时间</th>
                        <th width="100">姓名</th>
                        <th>事项</th>
                        <th>变动</th>
                        <th width="80">操作</th>
                    </tr>
                </thead>
                <tbody id="logTableBody"></tbody>
            </table>
        </div>
    `;
    
    renderLogTable();
    document.getElementById('logModal').style.display = 'flex';
}

// 渲染日志表格
function renderLogTable() {
    const tbody = document.getElementById('logTableBody');
    const searchName = document.getElementById('logSearchName').value.trim().toLowerCase();
    const searchDate = document.getElementById('logSearchDate').value; 

    tbody.innerHTML = '';

    const filteredData = historyData.map((item, index) => ({...item, originalIndex: index}))
        .filter(h => {
            // 姓名筛选
            if (searchName && !h.name.toLowerCase().includes(searchName)) return false;
            // 日期筛选
            if (searchDate && !h.time.startsWith(searchDate)) return false;
            return true;
        });

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color: #999; padding: 20px;">没有找到相关记录</td></tr>';
        return;
    }

    filteredData.forEach(h => {
        const tr = document.createElement('tr');

// 新增：如果已撤销，直接加上样式
if (h.revoked) {
    tr.style.color = '#aaa';              // 字体变灰
    tr.style.textDecoration = 'line-through'; // 加上删除线
    tr.style.opacity = '0.6';             // 稍微透明一点，更有“无效”的感觉
}

        let changeText = '';
        if (h.expChange > 0) changeText += `<span style="font-size:12px; color:#795548; margin-right:5px;">Exp+${h.expChange}</span>`;
        if (h.pointsChange !== 0) {
            const color = h.pointsChange > 0 ? '#2E7D32' : '#C62828';
            const sign = h.pointsChange > 0 ? '+' : '';
            changeText += `<span style="font-weight:bold; color:${color}; font-size:13px;">🪙${sign}${h.pointsChange}</span>`;
        }

        const timeParts = h.time.split(' ');
        const dateStr = timeParts[0] || h.time;
        const timeStr = timeParts[1] || '';
        
        const timeDisplay = `
            <div style="line-height: 1.1;">
                <div style=" font-size: 13px;">${dateStr}</div>
                <div style="font-size:13px; ">${timeStr}</div>
            </div>`;

        tr.innerHTML = `
            <td style="padding: 6px 10px;">${timeDisplay}</td>
            <td style="font-size:14px;">${h.name}</td>
            <td style="font-size:13px;">${h.subject}</td>
            <td>${changeText}</td>
            <td>
                ${h.revoked 
                    ? '<span style="color:#ccc; font-size:13px;">已撤销</span>' 
                    : `<button class="btn-revoke" onclick="revokeHistoryItem(${h.originalIndex})" style="margin:0; padding: 6px 15px; font-size: 13px;">撤销</button>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

 function openStudentDetail(name) {
    currentDetailName = name;
    const student = students.find(s => s.name === name);
    if (!student) return;
    const pet = getPetInfo(student);
    const percent = (student.exp / CONFIG.pointsPerLevel) * 100;
    const historyWithIdx = historyData.map((h, i) => ({...h, originalIndex: i})).filter(h => h.name === student.name);
    
    // 弹窗尺寸设置
    const modal = document.querySelector('#detailModal .modal');
    modal.style.width = "900px";
    modal.style.height = "80vh";
    modal.style.maxHeight = "80vh";
    
    const contentContainer = document.getElementById('modalDetailContent');
    contentContainer.style.height = "calc(100% - 50px)";
    contentContainer.style.overflow = "hidden"; 
    contentContainer.style.padding = "0"; 

    document.getElementById('modalTitleText').innerHTML = `${student.name} <span class="badge-small">Lv.${student.level} ${pet.title}</span>`;
    
    let bigImg = pet.html.replace('class="pet-avatar"', 'class="pet-stage-lg" onclick="this.style.transform=\'scale(1.1)\'; setTimeout(()=>this.style.transform=\'scale(1)\', 200);"');
    if(!bigImg.includes('img')) bigImg = `<div class="pet-stage-lg" style="font-size:140px; display:flex; align-items:center; justify-content:center; height:100%;">${pet.raw}</div>`;

    // 表格构建
    let historyRows = historyWithIdx.map(h => {
        let pChange = h.pointsChange !== undefined ? h.pointsChange : h.points;
        let eChange = h.expChange;
        if (eChange === undefined) eChange = (pChange > 0) ? pChange : 0;
        
        const color = pChange >= 0 ? '#2E7D32' : '#C62828';
        const timeParts = h.time.split(' ');
        const timeDisplay = `<div style="font-size:12px; color:#666;">${timeParts[0]}</div><div style="font-size:10px; color:#999;">${timeParts[1] || ''}</div>`;

        let changeHtml = '';
        if(eChange > 0) changeHtml += `<div style="font-size:11px; color:#795548;">Exp+${eChange}</div>`;
        changeHtml += `<div style="font-weight:bold; color:${color}; font-size:13px;">🪙${pChange >= 0 ? '+' : ''}${pChange}</div>`;

        const actionHtml = h.revoked 
            ? '<span style="color:#ccc; font-size:12px;">已撤销</span>' 
            : `<button class="btn-revoke" onclick="revokeHistoryItem(${h.originalIndex})">撤销</button>`;

        const rowStyle = h.revoked ? 'opacity: 0.6; text-decoration: line-through;' : '';

        return `
        <tr style="border-bottom: 1px dashed #FFEEE4; ${rowStyle}">
            <td style="padding: 10px 6px; text-align:center;">${timeDisplay}</td>
            <td style="padding: 10px 6px; text-align:center; font-size:14px; color:#5D4037;">${h.subject}</td>
            <td style="padding: 10px 6px; text-align:center;">${changeHtml}</td>
            <td style="padding: 10px 6px; text-align:center;">${actionHtml}</td>
        </tr>`;
    }).join('');

    if(!historyRows) historyRows = '<tr><td colspan="4" style="text-align:center; color:#ccc; padding:40px;">暂无喂养记录</td></tr>';
    
    const tableHtml = `<table style="width:100%; border-collapse: collapse;"><tbody>${historyRows}</tbody></table>`;
    
    let petOptions = '';
    for(let key in PET_LIBRARY) {
        let label = key === 'default' ? '默认体系' : (PET_LIBRARY[key].titles && PET_LIBRARY[key].titles[4] ? PET_LIBRARY[key].titles[4] : key);
        petOptions += `<option value="${key}" ${student.petPath === key ? 'selected' : ''}>${label}</option>`;
    }

    // 布局渲染
    contentContainer.innerHTML = `
        <div style="display: flex; width: 100%; height: 100%; gap: 20px; box-sizing: border-box; padding: 10px;">
            
            <div style="flex: 0 0 300px; display: flex; flex-direction: column; align-items: center; overflow-x: hidden; overflow-y: auto; box-sizing: border-box; padding-right: 5px;">
                
                <div class="pet-image-container" style="margin-top: 0; aspect-ratio: 1/1; width: 100%; max-width: 280px; box-sizing: border-box;">${bigImg}</div>

                <div style="width: 100%; padding: 0 5px; box-sizing: border-box;">
                    <div class="setting-box" style="margin-bottom: 15px; background:#FFFBF7; width: 100%; box-sizing: border-box;">
                        <div style="font-weight:bold; color:#FF6B6B; font-size:13px; margin-bottom:6px;">🔮 成长体系</div>
                        <select onchange="changeStudentPath(this.value)" class="form-input" style="width:100%; height:40px; line-height:40px; padding:0 10px;">${petOptions}</select>
                    </div>

                    <div class="exp-container" style="background:#FFFBF7; width: 100%; box-sizing: border-box;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#6D4C41; margin-bottom:6px;">
                            <strong>当前等级 Lv.${student.level}</strong>
                            <span>${student.exp} / ${CONFIG.pointsPerLevel}</span>
                        </div>
                        <div class="exp-bar-bg" style="height:16px; border-radius:8px;">
                            <div class="exp-bar-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="flex: 1; border: 2px solid #FFEEE4; border-radius: 16px; background: #fff; display: flex; flex-direction: column; overflow: hidden; height: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="background: #FFF3E0; padding: 12px 20px; font-weight:bold; color:#E65100; font-size:15px; border-bottom:2px solid #FFEEE4; flex-shrink: 0; display:flex; justify-content:space-between;">
                    <span>📅 喂养记录</span>
                    <span style="font-size:12px; color:#FF8A65; font-weight:normal;">共 ${historyWithIdx.length} 条</span>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 0;">
                    ${tableHtml}
                </div>
            </div>
        </div>
    `;
    document.getElementById('detailModal').style.display = 'flex';
}

function showLevelUpModal(idx) {
    const stu = students[idx];
    const pet = getPetInfo(stu);
    document.getElementById('levelUpName').innerText = stu.name;
    document.getElementById('levelUpTitle').innerText = pet.title;
    let bigImgHtml = pet.html;
    if(bigImgHtml.includes('<img')) {
        bigImgHtml = bigImgHtml.replace('class="pet-avatar"', 'style="width:300px; height:300px; object-fit:contain; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.2));"');
    } else {
        bigImgHtml = bigImgHtml.replace('class="pet-avatar"', 'style="font-size:120px;"');
    }
    document.getElementById('levelUpImgContainer').innerHTML = bigImgHtml;
    document.getElementById('levelUpModal').style.display = 'flex';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function openBatchModal() {
    if (students.length === 0) return alert("请先导入名单");
    const table = document.querySelector('#batchModal .data-table');
    table.querySelector('thead').innerHTML = `<tr><th style="width: 20%;">姓名</th><th style="width: 20%;">当前积分</th><th style="width: 20%;">成绩/表现</th><th style="width: 20%;">经验</th><th style="width: 20%;">积分</th></tr>`;
    const tbody = document.getElementById('batchTableBody');
    tbody.innerHTML = '';
    students.forEach((stu, idx) => {
        const cp = stu.currentPoints === undefined ? (stu.totalPoints || 0) : stu.currentPoints;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:bold;">${stu.name}</td><td style="color:#FF8A65; font-weight:bold;">🪙 ${cp}</td><td><input type="tel" class="batch-input score-input form-input" data-name="${stu.name}" data-idx="${idx}" oninput="this.value = this.value.replace(/[^0-9-]/g, '')" placeholder="0" style="width: 80px !important;"></td><td id="prev-exp-${idx}" style="color:#ccc; font-size:13px; font-weight:bold;">-</td><td id="prev-points-${idx}" style="color:#ccc; font-size:13px; font-weight:bold;">-</td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('batchModal').style.display = 'flex';
    setTimeout(() => { const i = document.querySelector('.score-input'); if(i) i.focus(); }, 300);
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = scoreInputs[index + 1];
                if (nextInput) nextInput.focus();
            }
        });
    });
}

function submitBatchFeed() {
    const inputs = document.querySelectorAll('.score-input');
    const sub = document.getElementById('batchSubject').value;
    const dateVal = document.getElementById('batchDate').value;
    
    // --- 时间处理逻辑 ---
    let fullDate = new Date();
    if(dateVal) { 
        let parts = dateVal.split('-'); 
        fullDate.setFullYear(parts[0], parts[1]-1, parts[2]); 
    }
    // ------------------

    let count = 0; let levelUpCount = 0;
    inputs.forEach(inp => {
        if(inp.value !== '') {
            const idx = students.findIndex(s => s.name === inp.getAttribute('data-name'));
            if(idx !== -1) { 
                const oldLevel = students[idx].level;
                addPoints(idx, parseInt(inp.value), sub, fullDate); 
                count++; 
                if (students[idx].level > oldLevel) levelUpCount++;
            }
        }
    });
    if(count) { 
        saveData(); refreshUI(); 
        let msg = `⚡ 成功录入 ${count} 条！`;
        if (levelUpCount > 0) msg += `\n🎉 有 ${levelUpCount} 人升级了！`;
        showToast(msg); closeModal('batchModal'); 
    }
}

function triggerImport() {
    const fileInput = document.getElementById('importFile');
    if (!isDataDirty) { fileInput.value = ''; fileInput.click(); return; }
    const userChoice = confirm("⚠️ 警告：当前数据已修改但未保存！\n\n如果现在导入新文件，刚才的操作将丢失。\n\n🟢 点击【确定】-> 放弃保存，继续导入\n🔴 点击【取消】-> 暂不导入，自行去保存");
    if (userChoice) { fileInput.value = ''; fileInput.click(); }
}

// ================== 最终修复版导入逻辑 ==================
function handleImport(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
            
            // 1. 读取学生状态
            let targetSheetName = wb.SheetNames.includes("学生状态") ? "学生状态" : wb.SheetNames[0];
            let targetSheet = wb.Sheets[targetSheetName];
            let raw = XLSX.utils.sheet_to_json(targetSheet);
            
            if (raw.length === 0 && !targetSheet['!ref']) { alert("空表格"); return; }

            students = raw.map(s => {
                let name = s['姓名'] || "未命名";
                return {
                    name: name,
                    level: Number(s['等级']) || 1,
                    exp: Number(s['经验']) || 0,
                    totalPoints: Number(s['总经验值']) || 0,
                    currentPoints: (s['可用积分'] !== undefined) ? Number(s['可用积分']) : (Number(s['总经验值']) || 0),
                    petPath: s['路径'] || "default"
                };
            }).filter(s => s.name !== "未命名");

            // 2. 读取喂养记录
            if(wb.Sheets["喂养记录"]) {
                let rawHistory = XLSX.utils.sheet_to_json(wb.Sheets["喂养记录"]);
                historyData = rawHistory.map(h => ({
                    time: formatAnyTime(h['时间']),
                    name: h['姓名'],
                    subject: h['科目'],
                    score: h['分数'],
                    expChange: Number(h['经验变动']) || 0,
                    pointsChange: Number(h['积分变动']) || 0,
                    revoked: h['已撤销'] === '是' || h['已撤销'] === true
                }));
            } else { historyData = []; }

            // 3. 读取商品清单
            if(wb.Sheets["商品清单"]) {
                let rawProd = XLSX.utils.sheet_to_json(wb.Sheets["商品清单"]);
                products = rawProd.map(p => ({
                    name: p['商品名称'], price: Number(p['兑换积分']) || 0, icon: "🎁"
                })).filter(p => p.name);
            }

            // 4. 读取宠物图鉴
            if(wb.Sheets["宠物图鉴"]) {
                let rawLib = XLSX.utils.sheet_to_json(wb.Sheets["宠物图鉴"]);
                let newLib = {};
                rawLib.forEach(row => {
                    let key = row['路径代码'];
                    if(key) {
                        let images = [], titles = [];
                        for(let i=0; i<5; i++) {
                            images.push(row[`阶段${i}`] || "");
                            titles.push(row[`称号${i}`] || "");
                        }
                        newLib[key] = { images: images, titles: titles };
                    }
                });
                if(Object.keys(newLib).length > 0) PET_LIBRARY = newLib;
            }

            // 5. 读取配置 (包含分离的比例)
            if(wb.Sheets["配置"]) {
                let rawConfig = XLSX.utils.sheet_to_json(wb.Sheets["配置"]);
                rawConfig.forEach(item => {
                    if(item['配置项'] === '经验换算比例') CONFIG.expRate = Number(item['值']);
                    if(item['配置项'] === '积分换算比例') CONFIG.pointRate = Number(item['值']);
                    // 兼容旧版
                    if(item['配置项'] === '换算比例') {
                        CONFIG.expRate = Number(item['值']);
                        CONFIG.pointRate = Number(item['值']);
                    }
                    if(item['配置项'] === '管理密码') CONFIG.password = String(item['值']); // <--- 加这一行
                    if(item['配置项'] === '升级经验') CONFIG.pointsPerLevel = Number(item['值']);
                    if(item['配置项'] === '进化等级门槛') EVOLUTION_RULES = String(item['值']).split(',').map(Number);
                });
            }

            // 6. 【新增修复】读取科目设置 (解决科目无法自定义的问题)
            if(wb.Sheets["科目设置"]) {
                let rawSub = XLSX.utils.sheet_to_json(wb.Sheets["科目设置"]);
                // 提取"科目"这一列，并过滤掉空值
                let newSubs = rawSub.map(s => s['科目']).filter(s => s);
                if(newSubs.length > 0) {
                    SUBJECT_LIST = newSubs;
                }
            }

            // 更新界面 (docTitle, 刷新UI会重绘下拉菜单)
            docTitle = file.name.replace(/\.xlsx?$/, '');
            document.getElementById('mainTitle').innerText = `🔥 ${docTitle} 萌宠养成`;
            
            saveData(); 
            refreshUI(); // 这一步会调用 renderSubjectDropdowns()，你的新科目就会出现了
            isDataDirty = false;
            showToast("📂 导入成功！(包含科目设置)");
            input.value = '';
        } catch (error) { 
            console.error(error);
            alert("导入失败，请检查Excel格式"); 
        }
    };
    reader.readAsArrayBuffer(file);
}

async function downloadTemplateWithPicker() {
    const wb = XLSX.utils.book_new();

    // 1. 学生状态 (示例)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { "姓名": "示例学生", "等级": 1, "经验": 0, "总经验值": 0, "可用积分": 0, "路径": "xiongmao" }
    ]), "学生状态");

    // 2. 喂养记录 (空表头)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["时间", "姓名", "科目", "分数", "经验变动", "积分变动", "已撤销"]
    ]), "喂养记录");

    // 3. 配置 (修复：拆分比例 + 增加管理密码)
    const configData = [
        { "配置项": "经验换算比例", "值": 0.5 },
        { "配置项": "积分换算比例", "值": 1.0 },
        { "配置项": "升级经验", "值": 100 },
        { "配置项": "进化等级门槛", "值": "3,6,10,20" },
        { "配置项": "管理密码", "值": "888888" } // 默认密码
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configData), "配置");

    // 4. 科目设置 (修复：增加更多默认科目)
    const subjectData = [
        { "科目": "语文" },
        { "科目": "数学" },
        { "科目": "英语" },
        { "科目": "日常" },
        { "科目": "不交作业" },
        { "科目": "上课说话" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subjectData), "科目设置");

    // 5. 商品清单
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
        { "商品名称": "免作业卡", "兑换积分": 500 },
        { "商品名称": "橡皮擦", "兑换积分": 50 },
        { "商品名称": "棒棒糖", "兑换积分": 100 }
    ]), "商品清单");

    // 6. 宠物图鉴 (修复：确保写入完整的图片路径数据)
    const fullLibraryData = [
        { 
            "路径代码": "xiongmao", "说明": "功夫熊猫", 
            "阶段0": "img/xiongmao/1.png", "称号0": "翡翠青竹", 
            "阶段1": "img/xiongmao/2.png", "称号1": "功夫学徒",
            "阶段2": "img/xiongmao/3.png", "称号2": "竹林侠客",
            "阶段3": "img/xiongmao/4.png", "称号3": "宗师风范",
            "阶段4": "img/xiongmao/5.png", "称号4": "神龙尊者" 
        },
        { 
            "路径代码": "jingling", "说明": "魔法精灵", 
            "阶段0": "img/jingling/1.png", "称号0": "魔法之心", 
            "阶段1": "img/jingling/2.png", "称号1": "森林微光",
            "阶段2": "img/jingling/3.png", "称号2": "元素使者",
            "阶段3": "img/jingling/4.png", "称号3": "月光贤者",
            "阶段4": "img/jingling/5.png", "称号4": "水晶天使" 
        },
        { 
            "路径代码": "linghu", "说明": "祈愿灵狐", 
            "阶段0": "img/linghu/1.png", "称号0": "祈愿宝珠", 
            "阶段1": "img/linghu/2.png", "称号1": "灵山幼狐",
            "阶段2": "img/linghu/3.png", "称号2": "九尾灵狐",
            "阶段3": "img/linghu/4.png", "称号3": "青丘国主",
            "阶段4": "img/linghu/5.png", "称号4": "祥瑞天女" 
        },
        { 
            "路径代码": "renyu", "说明": "深海人鱼", 
            "阶段0": "img/renyu/1.png", "称号0": "深海灵珠", 
            "阶段1": "img/renyu/2.png", "称号1": "人鱼公主",
            "阶段2": "img/renyu/3.png", "称号2": "海潮歌者",
            "阶段3": "img/renyu/4.png", "称号3": "深蓝女皇",
            "阶段4": "img/renyu/5.png", "称号4": "海洋天使" 
        },
        { 
            "路径代码": "konglong", "说明": "机甲神龙", 
            "阶段0": "img/konglong/1.png", "称号0": "远古龙蛋", 
            "阶段1": "img/konglong/2.png", "称号1": "机甲幼龙",
            "阶段2": "img/konglong/3.png", "称号2": "合金暴龙",
            "阶段3": "img/konglong/4.png", "称号3": "机械领主",
            "阶段4": "img/konglong/5.png", "称号4": "机甲龙神" 
        }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullLibraryData), "宠物图鉴");

    await saveWorkbookByUser(wb, "萌宠配置模板.xlsx");
}

// 5. 修改导出逻辑 (替换原来的 exportDataWithPicker)
async function exportDataWithPicker() {
    const wb = XLSX.utils.book_new();
    
    // 1. 学生状态
    const exportStudents = students.map(s => ({ "姓名": s.name, "等级": s.level, "经验": s.exp, "总经验值": s.totalPoints, "可用积分": s.currentPoints, "路径": s.petPath }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportStudents), "学生状态");
    
    // 2. 喂养记录
    const exportHistory = historyData.map(h => ({
        "时间": h.time, "姓名": h.name, "科目": h.subject, "分数": h.score, "经验变动": h.expChange, "积分变动": h.pointsChange, "已撤销": h.revoked ? '是' : '否'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportHistory), "喂养记录");
    
    // 3. 商品清单
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map(p => ({ "商品名称": p.name, "兑换积分": p.price }))), "商品清单");
    
    // 4. 配置 (增加默认值 ||，防止导出为空)
    const configData = [ 
        { "配置项": "经验换算比例", "值": (CONFIG.expRate !== undefined ? CONFIG.expRate : 0.5) }, 
        { "配置项": "积分换算比例", "值": (CONFIG.pointRate !== undefined ? CONFIG.pointRate : 1.0) }, 
        { "配置项": "升级经验", "值": (CONFIG.pointsPerLevel || 100) }, 
        { "配置项": "进化等级门槛", "值": (EVOLUTION_RULES ? EVOLUTION_RULES.join(',') : "3,6,10,20") } ,
        { "配置项": "管理密码", "值": CONFIG.password || "888888" }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configData), "配置");
    
    // 5. 科目
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(SUBJECT_LIST.map(s => ({ "科目": s }))), "科目设置");
    
    // 6. 图鉴
    let libraryData = [];
    for (let key in PET_LIBRARY) {
        const lib = PET_LIBRARY[key];
        let row = { "路径代码": key, "说明": (lib.titles && lib.titles.length > 0) ? lib.titles[lib.titles.length - 1] : key };
        if (lib.images) { lib.images.forEach((img, i) => { row[`阶段${i}`] = img; }); }
        if (lib.titles) { lib.titles.forEach((title, i) => { row[`称号${i}`] = title; }); }
        libraryData.push(row);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(libraryData), "宠物图鉴");

    try {
        const handle = await getExportFileHandle(`${docTitle}_存档.xlsx`, wb);
        if (!handle) return; 
        await writeExcelToFile(handle, wb);
        isDataDirty = false; showToast("💾 完整存档导出成功！");
    } catch (error) { console.error(error); showToast("❌ 导出失败"); }
}

async function getExportFileHandle(filename, wb) {
    try {
        if (window.showSaveFilePicker) { return await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] }); }
        XLSX.writeFile(wb, filename); return { traditional: true };
    } catch (err) { if (err.name === 'AbortError') return null; throw err; }
}

async function writeExcelToFile(handle, wb) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    if (handle.traditional) return;
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

async function saveWorkbookByUser(wb, filename) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
            const writable = await handle.createWritable(); await writable.write(blob); await writable.close(); return true;
        }
    } catch (err) { if (err.name === 'AbortError') return false; }
    XLSX.writeFile(wb, filename); return true;
}

 document.addEventListener('input', function(e){
    if(e.target.classList.contains('score-input')) {
        const input = e.target;
        const scoreStr = input.value;
        const idx = input.getAttribute('data-idx'); 
        const expEl = document.getElementById(`prev-exp-${idx}`);
        const pointsEl = document.getElementById(`prev-points-${idx}`);
        
        if (expEl && pointsEl) {
            if (scoreStr === '' || scoreStr === '-') {
                expEl.innerText = '-'; expEl.style.color = '#ccc';
                pointsEl.innerText = '-'; pointsEl.style.color = '#ccc';
                return;
            }
            const score = parseInt(scoreStr);
            
            // --- 修改计算逻辑 ---
            // 1. 积分：直接乘积分比例
            const pointsChange = Math.floor(score * CONFIG.pointRate);
            
            // 2. 经验：正分乘经验比例，负分不扣经验
            let expChange = 0;
            if (score > 0) {
                expChange = Math.floor(score * CONFIG.expRate);
            }
            // ------------------

            // 渲染经验预览
            if (expChange > 0) { 
                expEl.innerText = `+${expChange}`; expEl.style.color = '#2E7D32'; 
            } else { 
                expEl.innerText = '0'; expEl.style.color = '#ccc'; 
            }

            // 渲染积分预览
            if (pointsChange > 0) { 
                pointsEl.innerText = `+${pointsChange}`; pointsEl.style.color = '#2E7D32'; 
            } else if (pointsChange < 0) { 
                pointsEl.innerText = `${pointsChange}`; pointsEl.style.color = '#C62828'; 
            } else { 
                pointsEl.innerText = '0'; pointsEl.style.color = '#ccc'; 
            }
        }
    }
});

function showToast(msg) {
    const toast = document.getElementById('centerToast');
    document.getElementById('toastMsg').innerText = msg;
    toast.style.display = 'block'; toast.style.opacity = '0';
    toast.animate([{opacity: 0, transform: 'translate(-50%, -40%)'}, {opacity: 1, transform: 'translate(-50%, -50%)'}], {duration: 300, fill: 'forwards'});
    if (msg !== "📤 数据导出中，请稍候...") setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function openGalleryModal() {
    const container = document.getElementById('galleryContent');
    container.innerHTML = '';
    for (let key in PET_LIBRARY) {
        const lib = PET_LIBRARY[key];
        let groupName = key === 'default' ? '默认体系' : (lib.titles && lib.titles.length > 0 ? lib.titles[lib.titles.length - 1] : key);
        let html = `<div class="gallery-group"><div class="gallery-title">🔮 ${groupName}</div><div class="gallery-row">`;
        lib.images.forEach((img, idx) => {
            let title = lib.titles[idx] || `第${idx}阶`;
            let needLv = idx === 0 ? 1 : (EVOLUTION_RULES[idx-1] || 'Max');
            let imgTag = img.match(/\.(jpeg|jpg|gif|png|webp)$/i) || img.startsWith('http') ? `<img src="${img}" class="gallery-img" onclick="showBigImage('${img}')" style="cursor:zoom-in;">` : `<div class="gallery-img" style="font-size:40px; display:flex; align-items:center; justify-content:center;">${img}</div>`;
            html += `<div class="gallery-item"><span class="gallery-level">Lv.${needLv}</span>${imgTag}<span class="gallery-name">${title}</span></div>`;
            if (idx < lib.images.length - 1) html += `<div class="gallery-arrow">→</div>`;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    }
    document.getElementById('galleryModal').style.display = 'flex';
}

function showBigImage(src) {
    const overlay = document.getElementById('imgPreviewOverlay');
    document.getElementById('imgPreviewTarget').src = src;
    overlay.style.display = 'flex';
}

// ================= 积分商城逻辑 (双向牵制+直接扣分最终版) =================
let selectedProductIdx = -1;
let selectedStudentNames = new Set(); 

function openShopModal() {
    selectedProductIdx = -1; selectedStudentNames.clear(); 
    
    // 1. 设置弹窗高度与图鉴一致
    const modal = document.querySelector('#shopModal .modal');
    modal.style.width = "850px";
    modal.style.height = "85vh";       // 统一高度
    modal.style.maxHeight = "85vh";

    // 2. 这里的 shop-container 原本在 CSS 里写死了 height: 500px，我们需要用 JS 覆盖它
    // 为了保证内部布局自适应，设置为 flex:1 或 100%
    const shopContainer = document.querySelector('.shop-container');
    if(shopContainer) {
        shopContainer.style.height = "calc(100% - 50px)"; // 减去头部高度
    }

    updateBatchBtnState(); renderShopProducts(); renderShopStudents(); 
    document.getElementById('shopModal').style.display = 'flex';
}

function getMinPointsOfSelectedStudents() {
    if (selectedStudentNames.size === 0) return Infinity; 
    let min = Infinity;
    selectedStudentNames.forEach(name => {
        const s = students.find(stu => stu.name === name);
        if (s) { const cp = s.currentPoints !== undefined ? s.currentPoints : (s.totalPoints || 0); if (cp < min) min = cp; }
    });
    return min;
}

function renderShopProducts() {
    const container = document.getElementById('shopGoodsGrid');
    container.innerHTML = '';
    const minStudentPoints = getMinPointsOfSelectedStudents();
    products.forEach((p, idx) => {
        const div = document.createElement('div');
        const isTooExpensive = p.price > minStudentPoints;
        div.className = `good-card ${selectedProductIdx === idx ? 'active' : ''} ${isTooExpensive ? 'disabled' : ''}`;
        div.onclick = (e) => {
            if(e.target.className.includes('btn-del')) return;
            if(isTooExpensive) return; 
            if (selectedProductIdx === idx) { selectedProductIdx = -1; } else { selectedProductIdx = idx; }
            updateBatchBtnState(); renderShopProducts(); renderShopStudents(); 
        };
        div.innerHTML = `<span class="btn-del-good" onclick="deleteProduct(${idx})">×</span><div class="good-icon">${p.icon || '🎁'}</div><div class="good-name">${p.name}</div><div class="good-price">🪙 ${p.price}</div>`;
        container.appendChild(div);
    });
    const addBtn = document.createElement('div');
    addBtn.className = 'good-card add-good-card';
    addBtn.innerHTML = '<span style="font-size:24px;">+</span><span style="font-size:12px;">添加商品</span>';
    addBtn.onclick = addNewProduct;
    container.appendChild(addBtn);
}

function renderShopStudents() {
    const container = document.getElementById('shopStudentList');
    const term = document.getElementById('shopSearchInput').value.toLowerCase();
    container.innerHTML = '';
    const product = selectedProductIdx !== -1 ? products[selectedProductIdx] : null;
    const sorted = [...students].sort((a, b) => (b.currentPoints||0) - (a.currentPoints||0));
    sorted.forEach((stu) => {
        if (term && !stu.name.toLowerCase().includes(term)) return;
        const cp = stu.currentPoints !== undefined ? stu.currentPoints : (stu.totalPoints || 0);
        let canBuy = true;
        if (product && cp < product.price) { canBuy = false; }
        const isSelected = selectedStudentNames.has(stu.name);
        const div = document.createElement('div');
        div.className = `shop-stu-item ${!canBuy ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
        if (canBuy) {
            div.onclick = () => {
                if (selectedStudentNames.has(stu.name)) { selectedStudentNames.delete(stu.name); } 
                else { selectedStudentNames.add(stu.name); }
                renderShopStudents(); renderShopProducts(); updateBatchBtnState();
            };
        }
        div.innerHTML = `<div style="font-weight:bold;">${stu.name}</div><div class="shop-stu-coin" style="color:${canBuy ? '#E65100' : '#ccc'}">🪙 ${cp}</div>`;
        container.appendChild(div);
    });
}

function updateBatchBtnState() {
    const count = selectedStudentNames.size;
    const countEl = document.getElementById('selectedCount');
    if(countEl) countEl.innerText = count;
    const btn = document.getElementById('btnBatchBuy');
    if(!btn) return;
    const product = selectedProductIdx !== -1 ? products[selectedProductIdx] : null;
    if (count > 0 && product) {
        btn.classList.add('active');
        const totalPrice = count * product.price;
        btn.innerText = `兑换 (消耗 ${totalPrice})`;
    } else {
        btn.classList.remove('active');
        if (count === 0 && !product) btn.innerText = '请选择商品和学生';
        else if (!product) btn.innerText = '请选择商品';
        else if (count === 0) btn.innerText = '请选择学生';
        else btn.innerText = '确认兑换';
    }
}

function submitBatchPurchase() {
    const product = products[selectedProductIdx];
    const names = Array.from(selectedStudentNames);
    if (!product || names.length === 0) return;
    if (!confirm(`确认要为这 ${names.length} 位同学兑换 [${product.name}] 吗？\n总计将消耗 ${names.length * product.price} 积分。`)) return;
    let successCount = 0;
    names.forEach(name => {
        const idx = students.findIndex(s => s.name === name);
        if (idx !== -1) {
            if ((students[idx].currentPoints || 0) >= product.price) {
                addPoints(idx, -product.price, `兑换：${product.name}`, new Date(), true);
                successCount++;
            }
        }
    });
    if(successCount > 0) {
        saveData();
        selectedStudentNames.clear(); selectedProductIdx = -1; 
        updateBatchBtnState(); refreshUI(); renderShopProducts(); renderShopStudents(); 
        showToast(`🎉 成功兑换 ${successCount} 个 [${product.name}]！`);
    }
}

function addNewProduct() {
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('addProductModal').style.display = 'flex';
    setTimeout(() => document.getElementById('newProdName').focus(), 100);
}

function confirmAddProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const priceVal = document.getElementById('newProdPrice').value.trim();
    if (!name) return alert("请填写奖品名称");
    if (!priceVal || isNaN(priceVal)) return alert("请填写有效的积分数值");
    products.push({ name: name, price: parseInt(priceVal), icon: "🎁" });
    saveData(); renderShopProducts(); closeModal('addProductModal'); showToast("✅ 商品上架成功！");
}

function deleteProduct(idx) {
    if(confirm("确定删除这个商品吗？")) {
        products.splice(idx, 1);
        if(selectedProductIdx === idx) selectedProductIdx = -1;
        saveData(); renderShopProducts(); renderShopStudents(); 
    }
}

// ================= 补全缺失的喂养功能 =================

// 打开单个喂养弹窗
function openSingleFeed(name) {
    currentFeedName = name;
    document.getElementById('singleFeedName').innerText = name;
    document.getElementById('singleScore').value = '';
    
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('singleDate');
    if(dateEl) dateEl.value = today;
    
    document.getElementById('singleFeedModal').style.display = 'flex';
    
    // 自动聚焦输入框
    setTimeout(() => {
        const input = document.getElementById('singleScore');
        if(input) input.focus();
    }, 100);
}

// 提交单个喂养
function submitSingleFeed() {
    const scoreStr = document.getElementById('singleScore').value;
    const subject = document.getElementById('singleSubject').value;
    const dateStr = document.getElementById('singleDate').value;
    
    if (!scoreStr) return alert("请输入分数");
    
    const idx = students.findIndex(s => s.name === currentFeedName);
    if (idx === -1) return;

    // 调用加分逻辑
    addPoints(idx, parseInt(scoreStr), subject, dateStr);
    saveData();
    refreshUI();
    
    // 如果是从详情页打开的喂养，也刷新详情页
    if(currentDetailName === currentFeedName && document.getElementById('detailModal').style.display === 'flex') {
         openStudentDetail(currentDetailName);
    }

    closeModal('singleFeedModal');
    showToast(`🥕 投喂成功！`);
}