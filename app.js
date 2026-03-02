// 哐哐牌灵感生成机 - 主应用
// 双 id 约定：比较是否同一实体一律用 独立 id (id)；关系与系统内部操作一律用 绑定 id (bindingId)
// - 独立 id：导入/合并时「是否同一条」、覆盖/跳过判断
// - 绑定 id：element.libraryIds / elementGroupIds、library.elementIds、group.elementIds、combinationGroupIds、selectedLibraries、UI 传参与查找
// 系统初始词库与默认收藏夹的 bindingId 固定
const SYSTEM_LIBRARY_ID = 'sys_lib_default';
const EMOJI_LIBRARY_ID = 'emoji_lib_default';
const DEFAULT_FAV_ELEMENT_GROUP_ID = 'def_fav_elem';
const DEFAULT_FAV_COMBO_GROUP_ID = 'def_fav_combo';
// 双盲词库：界面隐藏不展示；导出只含「被收藏/他处引用」的元素；读取备份时会把备份里有的并入并隐藏写回本地
const DOUBLEBLIND_LIBRARY_ID = 'doubleblind_lib';
// 恐虫症筛选：除蝴蝶外隐藏的昆虫/节肢类（蝴蝶 🦋 不在此列）。比较时双方都去掉 \uFE0F 再比
const EMOJI_INSECTS_EXCEPT_BUTTERFLY = new Set(['🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷️', '🕸', '🦂', '🦟', '🪰', '🪱', '🦠']);
function _norm(c) { return (c || '').replace(/\uFE0F/g, ''); }
function isInsectExceptButterfly(emojiName) {
    const n = _norm(emojiName);
    if (!n) return false;
    for (const c of EMOJI_INSECTS_EXCEPT_BUTTERFLY) if (_norm(c) === n) return true;
    return false;
}
// Emoji 分类树（可展开勾选）。按 const emojis 内注释分段，每段一小类，再归入大类；叶子 id 对应 EMOJI_CATEGORY_RANGES
const EMOJI_CATEGORY_TREE = [
    { id: 'face', label: '表情', children: [
        { id: 'face_round', label: '圆圆表情' }, { id: 'face_cat', label: '猫咪表情' }, { id: 'face_monkey', label: '猴子表情' }
    ]},
    { id: 'heart_symbol', label: '爱心与符号', children: [
        { id: 'heart', label: '爱心' }, { id: 'symbol_common', label: '常见符号' }
    ]},
    { id: 'gesture_body', label: '手势与身体', children: [
        { id: 'gesture', label: '手势' }, { id: 'organ', label: '器官' }
    ]},
    { id: 'people', label: '人类', children: [
        { id: 'people_adult', label: '人类' }, { id: 'job', label: '职业' }, { id: 'relation', label: '关系' }, { id: 'people_abstract', label: '抽象人类' }
    ]},
    { id: 'activity', label: '活动', children: [
        { id: 'activity_move', label: '活动 出行' }, { id: 'activity_sport', label: '运动' }
    ]},
    { id: 'animal', label: '动物', children: [
        { id: 'animal_land', label: '动物 陆地哺乳' }, { id: 'animal_bird', label: '动物 鸟' }, { id: 'animal_reptile', label: '两栖爬行 龙' }, { id: 'animal_marine', label: '动物 海洋' }, { id: 'animal_insect', label: '动物 昆虫' }
    ]},
    { id: 'plant', label: '植物', children: [
        { id: 'plant_flower', label: '植物 花' }, { id: 'plant_grass', label: '植物 草' }
    ]},
    { id: 'food', label: '食物', children: [
        { id: 'food_fruit_veg', label: '食物 水果蔬菜' }, { id: 'food_staple', label: '食物 主食熟食' }, { id: 'food_sweet', label: '食物 点心饮料' }, { id: 'food_utensil', label: '食物 餐具' }
    ]},
    { id: 'place', label: '地理与场所', children: [
        { id: 'place_geo', label: '地理' }, { id: 'place_building', label: '城市建筑' }
    ]},
    { id: 'transport', label: '交通', children: [
        { id: 'transport_land', label: '陆地交通' }, { id: 'transport_water_air', label: '水上与空中' }
    ]},
    { id: 'time_sky', label: '时间与自然', children: [
        { id: 'time', label: '时间' }, { id: 'time_clock', label: '时间点' }, { id: 'sky', label: '天文' }, { id: 'weather', label: '天气' }
    ]},
    { id: 'festival_medal', label: '节日与奖牌', children: [
        { id: 'festival', label: '节日' }, { id: 'medal', label: '奖牌' }
    ]},
    { id: 'sport_game', label: '运动与爱好', children: [
        { id: 'sport', label: '运动' }, { id: 'game', label: '爱好' }
    ]},
    { id: 'clothes_music', label: '服饰与乐器', children: [
        { id: 'clothes', label: '服饰' }, { id: 'music', label: '乐器' }
    ]},
    { id: 'electronic_office', label: '电子与办公', children: [
        { id: 'electronic', label: '电子' }, { id: 'book', label: '书籍' }, { id: 'money', label: '钱财' }, { id: 'office', label: '办公' }
    ]},
    { id: 'tool_medical', label: '工具与医疗', children: [
        { id: 'tool', label: '工具' }, { id: 'medical', label: '医药' }
    ]},
    { id: 'furniture', label: '家具与生活', children: [
        { id: 'furniture_bath', label: '家具 卫浴' }, { id: 'furniture_other', label: '其他' }
    ]},
    { id: 'symbol', label: '符号', children: [
        { id: 'symbol_mark', label: '符号标志' }, { id: 'symbol_block', label: '方块符号 方向' }, { id: 'symbol_ban', label: '禁止符号' }, { id: 'symbol_math', label: '数学符号' }, { id: 'symbol_abstract', label: '抽象符号' }
    ]},
    { id: 'shape_flag', label: '图形与旗帜', children: [
        { id: 'color_block', label: '颜色块' }, { id: 'flag', label: '旗帜' }
    ]}
];
// 索引区间 [endIndex 不含, categoryId]，按 end 递增；与 const emojis 各段注释一一对应
const EMOJI_CATEGORY_RANGES = [
    [118, 'face_round'], [127, 'face_cat'], [130, 'face_monkey'], [155, 'heart'], [170, 'symbol_common'],
    [213, 'gesture'], [231, 'organ'], [259, 'people_adult'], [405, 'job'], [501, 'activity_move'], [505, 'activity_sport'],
    [547, 'relation'], [554, 'people_abstract'], [618, 'animal_land'], [640, 'animal_bird'], [650, 'animal_reptile'], [667, 'animal_marine'], [682, 'animal_insect'],
    [694, 'plant_flower'], [710, 'plant_grass'],
    [748, 'food_fruit_veg'], [794, 'food_staple'], [812, 'food_sweet'], [839, 'food_utensil'],
    [846, 'place_geo'], [905, 'place_building'], [965, 'transport_land'], [978, 'transport_water_air'],
    [984, 'time'], [1008, 'time_clock'], [1029, 'sky'], [1055, 'weather'], [1074, 'festival'], [1080, 'medal'],
    [1116, 'sport'], [1136, 'game'], [1171, 'clothes'], [1213, 'music'],
    [1248, 'electronic'], [1265, 'book'], [1273, 'money'], [1322, 'office'], [1352, 'tool'], [1365, 'medical'], [1389, 'furniture_bath'], [1399, 'furniture_other'],
    [1413, 'symbol_mark'], [1531, 'symbol_block'], [1538, 'symbol_ban'], [1543, 'symbol_math'], [1563, 'symbol_abstract'], [1597, 'color_block'], [1602, 'flag']
];
function getEmojiCategoryIdForIndex(i) {
    for (let k = 0; k < EMOJI_CATEGORY_RANGES.length; k++) {
        if (i < EMOJI_CATEGORY_RANGES[k][0]) return EMOJI_CATEGORY_RANGES[k][1];
    }
    return EMOJI_CATEGORY_RANGES.length ? EMOJI_CATEGORY_RANGES[EMOJI_CATEGORY_RANGES.length - 1][1] : 'flag';
}
// 按 emoji 字符解析分类（用当前 RANGES，不依赖元素上存的 emojiCategory，避免旧数据 id 不一致）
var EMOJIS_FLAT_CACHE = null;
function getEmojiCategoryForEmojiChar(char) {
    if (!char) return null;
    if (!EMOJIS_FLAT_CACHE) return null;
    const idx = EMOJIS_FLAT_CACHE.indexOf(char);
    if (idx === -1) return null;
    return getEmojiCategoryIdForIndex(idx);
}
// 收集叶子、父→子、子→父、节点→叶子后代（勾选父=全选子，勾选子=勾选父）
function _emojiCategoryMaps() {
    const leaves = [];
    const parentToChildren = {};
    const childToParent = {};
    const nodeToLeafIds = {};
    function walk(n, parentId) {
        if (parentId) childToParent[n.id] = parentId;
        if (n.children) {
            parentToChildren[n.id] = n.children.map(c => c.id);
            n.children.forEach(c => walk(c, n.id));
            const set = new Set();
            n.children.forEach(c => (nodeToLeafIds[c.id] || []).forEach(lid => set.add(lid)));
            nodeToLeafIds[n.id] = [...set];
        } else {
            leaves.push(n.id);
            nodeToLeafIds[n.id] = [n.id];
        }
    }
    EMOJI_CATEGORY_TREE.forEach(n => walk(n, null));
    return { leaves, parentToChildren, childToParent, nodeToLeafIds };
}
function expandEmojiCategorySelectedToLeafIds(selectedIds) {
    const ids = Array.isArray(selectedIds) ? selectedIds : (selectedIds ? [selectedIds] : []);
    if (ids.length === 0) return null;
    const { nodeToLeafIds, leaves } = _emojiCategoryMaps();
    const validLeafSet = new Set(leaves);
    const out = new Set();
    ids.forEach(id => {
        const leafIds = nodeToLeafIds[id] || (validLeafSet.has(id) ? [id] : []);
        leafIds.forEach(lid => { if (validLeafSet.has(lid)) out.add(lid); });
    });
    return out.size > 0 ? out : null;
}
function getAllEmojiCategoryIds() {
    const ids = [];
    function walk(n) {
        ids.push(n.id);
        if (n.children) n.children.forEach(c => walk(c));
    }
    EMOJI_CATEGORY_TREE.forEach(n => walk(n));
    return ids;
}

/** 默认的 settings 值，用于持久化时省略不存 */
function getDefaultSettings() {
    return {
        theme: 'default',
        customThemeComboId: null,
        hideInsectsExceptButterfly: false,
        autoBackupBeforeImport: true,
        emojiSelectedCategoryIds: getAllEmojiCategoryIds(),
        toolOrder: null,
        basicQuickFav: true,
        basicQuickBlacklist: true
    };
}

/** 自定义主题：未选组合或颜色不足时的默认值（与云雨灰 :root 一致） */
const CUSTOM_THEME_DEFAULTS = {
    '--theme-bg': '#ffffff',
    '--theme-bg-secondary': '#f8f9fa',
    '--theme-bg-tertiary': '#e9ecef',
    '--theme-text': '#000000',
    '--theme-text-secondary': '#495057',
    '--theme-text-muted': '#6c757d',
    '--theme-border': '#e9ecef',
    '--theme-border-strong': '#dee2e6',
    '--theme-border-focus': '#000000',
    '--theme-input-bg': '#ffffff',
    '--theme-input-border': '#dee2e6',
    '--theme-btn-bg': '#000000',
    '--theme-btn-hover': '#333333',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-disabled-bg': '#6c757d',
    '--theme-card-bg': '#ffffff',
    '--theme-result-bg': '#ffffff',
    '--theme-result-border': '#dee2e6',
    '--theme-result-hover-bg': '#000000',
    '--theme-result-hover-text': '#ffffff',
    '--theme-checkbox-accent': '#000000',
    '--theme-shadow': '0 2px 10px rgba(0,0,0,0.05)',
    '--theme-shadow-lg': '0 4px 20px rgba(0,0,0,0.1)',
    '--theme-modal-backdrop': 'rgba(0,0,0,0.3)'
};

/** 自定义主题：根据明度返回在背景上可读的文字色（黑或白） */
function getContrastText(hex) {
    if (!hex || typeof hex !== 'string') return '#000000';
    hex = hex.replace(/^#/, '');
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else return '#000000';
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance <= 0.5 ? '#ffffff' : '#000000';
}

/** 自定义主题：取色值数组中最深的一个用作白底上的主文字色，不够深则用黑 */
function getDarkestForText(hexArr) {
    let best = '#000000';
    let minLum = 1;
    for (const hex of (hexArr || [])) {
        if (!hex || typeof hex !== 'string') continue;
        const h = hex.replace(/^#/, '');
        let r, g, b;
        if (h.length === 3) {
            r = parseInt(h[0] + h[0], 16);
            g = parseInt(h[1] + h[1], 16);
            b = parseInt(h[2] + h[2], 16);
        } else if (h.length === 6) {
            r = parseInt(h.slice(0, 2), 16);
            g = parseInt(h.slice(2, 4), 16);
            b = parseInt(h.slice(4, 6), 16);
        } else continue;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < minLum && lum <= 0.6) {
            minLum = lum;
            best = (hex.startsWith('#') ? hex : '#' + hex);
        }
    }
    return minLum <= 0.6 ? best : '#000000';
}

/** 去掉与默认值相同的项，减少备份/本地存储体积 */
function stripDefaultSettings(settings) {
    if (!settings || typeof settings !== 'object') return {};
    const def = getDefaultSettings();
    const out = {};
    Object.keys(settings).forEach(k => {
        const v = settings[k];
        const d = def[k];
        if (d === undefined) { out[k] = v; return; }
        if (v === d) return;
        if (Array.isArray(v) && Array.isArray(d) && v.length === d.length && v.every((x, i) => x === d[i])) return;
        out[k] = v;
    });
    return out;
}

// 工具箱：默认顺序与显示名、图标（弹窗内小方形图标用）
const DEFAULT_TOOL_ORDER = ['basic', 'combo', 'daily', 'blindbox', 'gacha', 'fortune', 'horoscope', 'color', 'pause', 'wheel', 'wordcloud', 'sonnet', 'farming', 'catch', 'quiz', 'shop', 'doubleblind', 'fishmaster', 'fishing', 'gashapon', 'scrollpoem', 'firework', 'jar', 'mining', 'telepathy'];
const TOOL_NAMES = {
    'basic': '基础生成', 'combo': '组合生成', 'daily': '每日元素', 'blindbox': '盲盒', 'gacha': '抽卡',
    'fortune': '抽签', 'horoscope': '星座运势', 'color': '色彩', 'pause': '暂停挑战', 'wheel': '转盘',
    'wordcloud': '词云', 'sonnet': '十四行诗', 'farming': '种菜', 'catch': '接礼物', 'quiz': '心理测试', 'shop': '一掷千金',
    'doubleblind': '双盲', 'fishmaster': '捕鱼达人', 'fishing': '钓鱼', 'gashapon': '扭蛋机', 'scrollpoem': '卷轴与诗',
    'firework': '礼花', 'jar': '敲罐子', 'mining': '挖矿', 'telepathy': '心有灵犀'
};
const TOOL_ICONS = {
    'basic': '✨', 'combo': '🔗', 'daily': '📅', 'blindbox': '📦', 'gacha': '🃏', 'fortune': '🎴',
    'horoscope': '♈', 'color': '🎨', 'pause': '⏸', 'wheel': '🎡', 'wordcloud': '☁️', 'sonnet': '📜',
    'farming': '🌱', 'catch': '🎁', 'quiz': '❓', 'shop': '💰',
    'doubleblind': '💬', 'fishmaster': '🐟', 'fishing': '🎣', 'gashapon': '🥚', 'scrollpoem': '📝',
    'firework': '🎆', 'jar': '🫙', 'mining': '⛏️', 'telepathy': '💫'
};

class InspirationGenerator {
    constructor() {
        this.isAuthenticated = false;
        this.currentTool = 'basic';
        this.toolResults = {};           // 每个工具独立的生成结果 { toolName: [results] }
        this.generationHistory = [];     // 所有生成历史 { tool, results, timestamp }
        this.basicQuickFav = true;       // 基础生成：快捷收藏（默认勾选）
        this.basicQuickBlacklist = true;  // 基础生成：快捷拉黑（默认勾选）
        this.selectedLibraries = [];
        this.selectedElementGroups = [];  // 词语组（元素分组）
        this.selectedGroups = [];          // 元素组合的组
        this.userData = {
            elements: [],           // 元素。每项: { id, name, libraryIds:[], elementGroupIds:[], combinationIds:[], isBlacklisted, ... }
            libraries: [],         // 词库。每项: { id(独立), bindingId(绑定), name, elementIds:[], isSystem?, settings? }
            combinations: [],      // 元素组合。每项: { id, elementIds:[], combinationGroupIds:[], isBlacklisted }
            elementGroups: [],     // 词语组。每项: { id(独立), bindingId(绑定), name, elementIds:[] }
            combinationGroups: [], // 元素组合的组。每项: { id(独立), bindingId(绑定), name, combinationIds:[] }
            quickSwitchCombos: [],
            blacklistedElementIds: [], // 拉黑顺序（按放入顺序）
            systemElementOverrides: {}, // 仅记录用户对系统元素的操作：{ [sysId]: { isBlacklisted?, common?, secondCommon?, negative? } }
            settings: {
                defaultFavoriteElementGroupId: null,     // 默认收藏夹（元素）
                defaultFavoriteCombinationGroupId: null, // 默认收藏夹（元素组合）
                theme: 'default',
                hideInsectsExceptButterfly: false,       // 我有恐虫症，但我不恐蝴蝶：生成/筛选时隐藏除蝴蝶外的昆虫
                toolOrder: null,                         // 工具箱弹窗内工具顺序，null 表示使用 DEFAULT_TOOL_ORDER
                autoBackupBeforeImport: true,            // 导入时自动下载导入前备份，可勾选取消
                toolParams: {}                           // 各生成工具上次使用的参数 { basic: {}, blindbox: {}, combo: {} }
            },
            colorFavorites: [],                          // 色彩收藏夹 [{ id, name?, colors: [{ hsl, hex }], createdAt }]
            emojiOverrides: { deletedChars: [], blacklistedChars: [] }  // 导出只记操作：从词库删除的字符、拉黑的字符
        };
        this.init();
    }

    init() {
        this.loadUserData();
        this.initializeSystemData();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    // 认证系统
    checkAuthentication() {
        const authKey = localStorage.getItem('inspiration_auth');
        if (authKey === 'authenticated') {
            this.isAuthenticated = true;
            this.showMainApp();
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('settings-screen').classList.add('hidden');
        this.applyTheme(this.userData.settings.theme);

        // 恢复上次选择的词库与分组（仅保留仍存在的 id）
        const s = this.userData.settings || {};
        if (Array.isArray(s.lastSelectedLibraries) && s.lastSelectedLibraries.length > 0) {
            const restored = s.lastSelectedLibraries.filter(id => this.getLibraryById(id));
            if (restored.length > 0) this.selectedLibraries = restored;
        }
        if (Array.isArray(s.lastSelectedElementGroups) && s.lastSelectedElementGroups.length > 0) {
            const restored = s.lastSelectedElementGroups.filter(id => this.getElementGroupById(id));
            if (restored.length > 0) this.selectedElementGroups = restored;
        }
        if (Array.isArray(s.lastSelectedGroups) && s.lastSelectedGroups.length > 0) {
            const restored = s.lastSelectedGroups.filter(id => this.getGroupById(id));
            if (restored.length > 0) this.selectedGroups = restored;
        }
        if (this.selectedLibraries.length === 0) {
            const systemLibrary = this.userData.libraries.find(lib => lib.isSystem);
            if (systemLibrary) this.selectedLibraries.push(systemLibrary.bindingId);
        }
        if (s.lastTool && DEFAULT_TOOL_ORDER.includes(s.lastTool)) this.currentTool = s.lastTool;
        const toolboxLabel = document.getElementById('toolbox-btn-label');
        if (toolboxLabel) toolboxLabel.textContent = TOOL_NAMES[this.currentTool] || this.currentTool;

        this.renderSidebar();
        this.renderLibrarySelector();
        this.renderCurrentTool();
        this.refreshResultsArea();
    }

    showSettings() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('settings-screen').classList.remove('hidden');
        const theme = this.getValidTheme(this.userData.settings.theme);
        if (this.userData.settings.theme !== theme) {
            this.userData.settings.theme = theme;
            this.saveUserData();
        }
        const showAsDefault = theme === 'default';
        document.querySelectorAll('.theme-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === theme || (showAsDefault && b.dataset.theme === 'default'));
        });
        const nameEl = document.getElementById('theme-current-name');
        if (nameEl) nameEl.textContent = this.getThemeName(theme);
    }

    /** 配色展示用名：有自定义名则用，否则用具体色值让人知道是什么配色 */
    _getComboDisplayName(fav) {
        const name = (fav.name || '').trim();
        if (name && !name.startsWith('搭配 ') && name !== '未命名') return name;
        const hexes = (fav.colors || []).map(c => c.hex || (c.hsl && c.hsl.startsWith('#') ? c.hsl : '')).filter(Boolean);
        return hexes.length ? hexes.slice(0, 6).join(' ') : (fav.id || '');
    }

    /** 点击「自定义主题」时打开弹窗，选择色彩收藏夹中的组合后应用。展示与收藏夹一致：色条+名称（色值或自定义名）。 */
    _openCustomThemeComboModal(onApplied) {
        const list = this.userData.colorFavorites || [];
        const listHtml = list.length === 0
            ? '<p class="custom-theme-combo-empty">暂无收藏，请先在「色彩」工具中搭配并保存到收藏夹。</p>'
            : list.map(fav => `
                <div class="custom-theme-combo-option color-favorite-item" data-combo-id="${fav.id}" title="点击应用该配色">
                    <div class="color-favorite-bar">${(fav.colors || []).map(c => `<span class="color-preview-swatch" style="background:${c.hsl}" title="${c.hex}"></span>`).join('')}</div>
                    <span class="color-favorite-name">${this._getComboDisplayName(fav)}</span>
                </div>
            `).join('');
        const content = `<div class="custom-theme-combo-modal-list">${listHtml}</div>`;
        const modal = this.createModal('选择色彩组合', content, [
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        modal.querySelectorAll('.custom-theme-combo-option').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.comboId || null;
                if (!this.userData.settings) this.userData.settings = {};
                this.userData.settings.customThemeComboId = id;
                this.userData.settings.theme = 'custom';
                this.saveUserData();
                this.applyTheme('custom');
                const nameEl = document.getElementById('theme-current-name');
                if (nameEl) nameEl.textContent = this.getThemeName('custom');
                this.closeModal();
                this.showToast('已应用该色彩组合为自定义主题');
                if (typeof onApplied === 'function') onApplied();
            });
        });
    }

    changeTheme(theme) {
        this.userData.settings.theme = theme;
        this.saveUserData();
        this.applyTheme(theme);
        const nameEl = document.getElementById('theme-current-name');
        if (nameEl) nameEl.textContent = this.getThemeName(theme);
        this.showToast(`已切换到「${this.getThemeName(theme)}」`);
    }

    /** 有效主题 id 列表；未在此列表中的主题会回退为云与灰（default）。原「晚安好眠」已改为「自定义主题」 */
    getValidTheme(theme) {
        if (theme === 'starry') return 'custom';
        const valid = ['default', 'notes', 'doomsday', 'sea', 'custom', 'spring'];
        return valid.includes(theme) ? theme : 'default';
    }

    applyTheme(theme) {
        const t = this.getValidTheme(theme);
        if (theme !== t) {
            this.userData.settings.theme = t;
            this.saveUserData();
        }
        this._clearCustomThemeVars();
        document.body.className = ''; // 清除现有主题类
        if (t !== 'default') {
            document.body.classList.add(`theme-${t}`);
        }
        if (t === 'custom') {
            this._applyCustomThemeColors();
        }
    }

    /** 清除 body 上由自定义主题注入的 CSS 变量 */
    _clearCustomThemeVars() {
        const vars = [
            '--theme-bg', '--theme-bg-secondary', '--theme-bg-tertiary', '--theme-bg-tertiary-text',
            '--theme-text', '--theme-text-secondary', '--theme-text-muted',
            '--theme-border', '--theme-border-strong', '--theme-border-focus', '--theme-input-bg', '--theme-input-border',
            '--theme-btn-bg', '--theme-btn-hover', '--theme-btn-text', '--theme-btn-disabled-bg', '--theme-card-bg', '--theme-card-text', '--theme-input-text',
            '--theme-result-bg', '--theme-result-border', '--theme-result-hover-bg', '--theme-result-hover-text',
            '--theme-checkbox-accent', '--theme-shadow', '--theme-shadow-lg', '--theme-modal-backdrop'
        ];
        vars.forEach(v => document.body.style.removeProperty(v));
    }

    /** 根据选中的色彩组合绑定全部主题变量（框、按钮、边框、背景等），所有背景上的文字用明度差（黑/白）保证可读。 */
    _applyCustomThemeColors() {
        if (!document.body.classList.contains('theme-custom')) return;
        const id = (this.userData.settings || {}).customThemeComboId;
        const list = this.userData.colorFavorites || [];
        const combo = id ? list.find(f => f.id === id) : null;
        const rawColors = (combo && combo.colors) ? (combo.colors || []).map(c => (c.hex || (c.hsl && c.hsl.startsWith('#') ? c.hsl : null))).filter(Boolean) : [];
        const colors = rawColors.map(h => h.startsWith('#') ? h : '#' + h);
        const d = CUSTOM_THEME_DEFAULTS;
        const c0 = colors[0] || d['--theme-btn-bg'];
        const c1 = colors[1] || d['--theme-border'];
        const c2 = colors[2] || c1;
        const c3 = colors[3] || c2;
        const set = (name, value) => { if (value != null) document.body.style.setProperty(name, value); };
        // 原始色卡颜色也暴露成变量，给扭蛋机等直接吃色卡用
        set('--theme-color-0', c0);
        set('--theme-color-1', c1);
        set('--theme-color-2', c2);
        set('--theme-color-3', c3);
        set('--theme-bg', c0);
        set('--theme-text', getContrastText(c0));
        set('--theme-bg-secondary', c1);
        set('--theme-bg-tertiary', c2);
        set('--theme-bg-tertiary-text', getContrastText(c2));
        set('--theme-card-bg', c1);
        set('--theme-card-text', getContrastText(c1));
        set('--theme-result-bg', c1);
        set('--theme-input-bg', c2);
        set('--theme-input-text', getContrastText(c2));
        set('--theme-text-secondary', getContrastText(c1));
        set('--theme-text-muted', getContrastText(c2));
        /* 边框与背景区分：用 c2/c0 做边框，避免和主背景 c0、卡片 c1 同色 */
        set('--theme-border', c2);
        set('--theme-border-strong', c0);
        set('--theme-border-focus', c0);
        set('--theme-input-border', c2);
        set('--theme-btn-bg', c0);
        set('--theme-btn-hover', c2);
        set('--theme-btn-text', getContrastText(c0));
        set('--theme-btn-disabled-bg', c2);
        set('--theme-result-border', c2);
        set('--theme-result-hover-bg', c0);
        set('--theme-result-hover-text', getContrastText(c0));
        set('--theme-checkbox-accent', c0);
        set('--theme-shadow', d['--theme-shadow']);
        set('--theme-shadow-lg', d['--theme-shadow-lg']);
        set('--theme-modal-backdrop', d['--theme-modal-backdrop']);
    }

    getThemeName(theme) {
        const names = {
            'default': '云与灰',
            'notes': '人生纸条',
            'doomsday': '末日游戏',
            'sea': '温柔海',
            'custom': '自定义主题',
            'spring': '春日烂漫'
        };
        return names[theme] || '云与灰';
    }

    toggleSidebar(open) {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (open !== undefined) {
            if (open) {
                sidebar.classList.add('open');
                backdrop.classList.remove('hidden');
            } else {
                sidebar.classList.remove('open');
                backdrop.classList.add('hidden');
            }
        } else {
            sidebar.classList.toggle('open');
            backdrop.classList.toggle('hidden');
        }
    }

    authenticate(password) {
        if (password === '黑金是真的') {
            this.isAuthenticated = true;
            localStorage.setItem('inspiration_auth', 'authenticated');
            this.showMainApp();
            return true;
        }
        return false;
    }

    // 数据管理
    loadUserData() {
        const saved = localStorage.getItem('inspiration_user_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.libraries && data.libraries.length > 0 && data.libraries[0].elements !== undefined) {
                    this.migrateOldData(data);
                } else {
                    this.userData = { ...this.userData, ...data };
                    if (!Array.isArray(this.userData.elements)) this.userData.elements = [];
                    if (!Array.isArray(this.userData.quickSwitchCombos)) this.userData.quickSwitchCombos = [];
                    if (!Array.isArray(this.userData.elementGroups)) this.userData.elementGroups = [];
                    if (!Array.isArray(this.userData.blacklistedElementIds)) this.userData.blacklistedElementIds = [];
                    if (typeof this.userData.systemElementOverrides !== 'object') this.userData.systemElementOverrides = {};
                    if (!Array.isArray(this.userData.colorFavorites)) this.userData.colorFavorites = [];
                    this.generationHistory = Array.isArray(this.userData.generationHistory) ? this.userData.generationHistory : [];
                    this.basicQuickFav = (this.userData.settings && this.userData.settings.basicQuickFav !== false);
                    this.basicQuickBlacklist = (this.userData.settings && this.userData.settings.basicQuickBlacklist !== false);
                    this.ensureBindingIds();
                    this.ensureBlacklistedElementIdsOrder();
                    this.migrateSystemElementsToOverrides();
                    this.migrateFavoritesToGroup();
                }
            } catch (e) {
                console.error('Failed to load user data:', e);
            }
        }
    }

    migrateOldData(data) {
        const elements = [];
        const elIdToObj = {};
        data.libraries.forEach(lib => {
            (lib.elements || []).forEach(el => {
                if (!elIdToObj[el.id]) {
                    const o = {
                        id: el.id,
                        name: el.name,
                        libraryIds: [],
                        combinationIds: [],
                        isBlacklisted: !!el.isBlacklisted
                    };
                    if (el.common !== undefined) o.common = el.common;
                    if (el.secondCommon !== undefined) o.secondCommon = el.secondCommon;
                    if (el.negative !== undefined) o.negative = el.negative;
                    elements.push(o);
                    elIdToObj[el.id] = o;
                }
                elIdToObj[el.id].libraryIds.push(lib.bindingId != null ? lib.bindingId : lib.id);
            });
        });
        this.userData.elements = elements;
        this.userData.libraries = (data.libraries || []).map(lib => ({
            id: lib.id,
            bindingId: lib.bindingId != null ? lib.bindingId : lib.id,
            name: lib.name,
            elementIds: (lib.elements || []).map(e => e.id),
            isSystem: !!lib.isSystem,
            isFavorites: !!lib.isFavorites,
            settings: lib.settings
        }));
        this.userData.combinations = (data.combinations || []).map(c => ({
            id: c.id,
            elementIds: (c.elements || []).map(e => e.id),
            combinationGroupIds: c.combinationGroupIds || [],
            isBlacklisted: !!c.isBlacklisted
        }));
        this.userData.combinationGroups = (data.combinationGroups || []).map(g => ({
            ...g,
            bindingId: g.bindingId != null ? g.bindingId : g.id
        }));
        this.userData.elementGroups = (data.elementGroups || []).map(g => ({
            ...g,
            bindingId: g.bindingId != null ? g.bindingId : g.id
        }));
        this.userData.quickSwitchCombos = data.quickSwitchCombos || [];
        this.userData.blacklistedElementIds = data.blacklistedElementIds || [];
        this.userData.settings = data.settings || this.userData.settings;
        if (this.userData.settings.defaultFavoriteLibrary && !this.userData.settings.defaultFavoriteLibraryId) {
            this.userData.settings.defaultFavoriteLibraryId = this.userData.settings.defaultFavoriteLibrary;
        }
        this.ensureBlacklistedElementIdsOrder();
        this.migrateFavoritesToGroup();
        this.saveUserData();
    }

    ensureBindingIds() {
        (this.userData.libraries || []).forEach(lib => {
            if (lib.bindingId == null) lib.bindingId = lib.id;
        });
        (this.userData.elementGroups || []).forEach(g => {
            if (g.bindingId == null) g.bindingId = g.id;
        });
        (this.userData.combinationGroups || []).forEach(g => {
            if (g.bindingId == null) g.bindingId = g.id;
        });
    }

    // 将旧数据里混在 elements 中的系统元素迁移到 systemElementOverrides，不再放入 elements
    migrateSystemElementsToOverrides() {
        const sysIds = new Set((this.userData.elements || []).filter(e => String(e.id).startsWith('sys_')).map(e => e.id));
        if (!sysIds.size) return;
        if (!this.userData.systemElementOverrides) this.userData.systemElementOverrides = {};
        this.userData.elements.forEach(el => {
            if (!sysIds.has(el.id)) return;
            this.userData.systemElementOverrides[el.id] = {
                isBlacklisted: !!el.isBlacklisted,
                common: el.common !== undefined ? el.common : 0,
                secondCommon: el.secondCommon !== undefined ? el.secondCommon : 0,
                negative: el.negative !== undefined ? el.negative : 0
            };
        });
        this.userData.elements = (this.userData.elements || []).filter(e => !sysIds.has(e.id));
    }

    // 将旧的“收藏夹词库”迁移为“词语组”，并统一默认收藏夹为元素/组合各一个
    migrateFavoritesToGroup() {
        const s = this.userData.settings;
        if (s.defaultFavoriteGroupId != null && s.defaultFavoriteGroupType != null) {
            if (s.defaultFavoriteGroupType === 'elements') s.defaultFavoriteElementGroupId = s.defaultFavoriteGroupId;
            else s.defaultFavoriteCombinationGroupId = s.defaultFavoriteGroupId;
            delete s.defaultFavoriteGroupId;
            delete s.defaultFavoriteGroupType;
        }
        const hadLibFav = s.defaultFavoriteLibraryId != null || this.userData.libraries.some(l => l.isFavorites);
        if (!hadLibFav) {
            delete this.userData.settings.defaultFavoriteLibraryId;
            if (!(this.userData.elementGroups && this.userData.elementGroups.length > 0)) {
                const gid = this.generateId();
                this.userData.elementGroups = [{ id: gid, bindingId: gid, name: '默认元素收藏夹', elementIds: [] }];
                this.userData.settings.defaultFavoriteElementGroupId = gid;
            }
            if (!(this.userData.combinationGroups && this.userData.combinationGroups.length > 0)) {
                const cgId = this.generateId();
                this.userData.combinationGroups = [{ id: cgId, bindingId: cgId, name: '默认组合收藏夹', combinationIds: [] }];
                this.userData.settings.defaultFavoriteCombinationGroupId = cgId;
            }
            return;
        }
        const favLib = this.userData.libraries.find(l => l.isFavorites || l.id === s.defaultFavoriteLibraryId);
        if (!favLib) return;
        const gid = this.generateId();
        const elementIds = (favLib.elementIds || []).slice();
        this.userData.elementGroups = this.userData.elementGroups || [];
        this.userData.elementGroups.push({ id: gid, bindingId: gid, name: favLib.name || '默认元素收藏夹', elementIds });
        this.userData.settings.defaultFavoriteElementGroupId = gid;
        if (!this.userData.settings.defaultFavoriteCombinationGroupId && this.userData.combinationGroups && this.userData.combinationGroups.length > 0)
            this.userData.settings.defaultFavoriteCombinationGroupId = this.userData.combinationGroups[0].bindingId;
        else if (!(this.userData.combinationGroups && this.userData.combinationGroups.length > 0)) {
            const cgId = this.generateId();
                this.userData.combinationGroups = [{ id: cgId, bindingId: cgId, name: '默认组合收藏夹', combinationIds: [] }];
            this.userData.settings.defaultFavoriteCombinationGroupId = cgId;
        }
        delete this.userData.settings.defaultFavoriteLibraryId;
        this.userData.elements.forEach(el => {
            if (!el.elementGroupIds) el.elementGroupIds = [];
            if (elementIds.includes(el.id)) el.elementGroupIds.push(gid);
            if (el.libraryIds) el.libraryIds = el.libraryIds.filter(id => id !== favLib.bindingId);
        });
        this.userData.libraries = this.userData.libraries.filter(l => l.bindingId !== favLib.bindingId);
        this.saveUserData();
    }

    saveUserData() {
        this._invalidateElementMap();
        try {
            this.userData.generationHistory = this.generationHistory || [];
            if (!this.userData.settings) this.userData.settings = {};
            this.userData.settings.basicQuickFav = this.basicQuickFav;
            this.userData.settings.basicQuickBlacklist = this.basicQuickBlacklist;
            // 默认项不存，减少体积；读取时 initializeSystemData 会补回默认
            const toSave = {
                ...this.userData,
                settings: stripDefaultSettings(this.userData.settings)
            };
            localStorage.setItem('inspiration_user_data', JSON.stringify(toSave));
        } catch (e) {
            console.error('Failed to save user data:', e);
        }
    }

    initializeSystemData() {
        // 系统预设词库：元素不进入 userData.elements，仅词库存 elementIds；用户对系统元素的操作记在 systemElementOverrides；ID 固定
        if (!this.userData.libraries.find(lib => lib.isSystem)) {
            const systemElementIds = (typeof window.ELEMENTS_DATA !== 'undefined')
                ? window.ELEMENTS_DATA.map((_, idx) => 'sys_' + idx)
                : [];
            this.userData.libraries.unshift({
                id: SYSTEM_LIBRARY_ID,
                bindingId: SYSTEM_LIBRARY_ID,
                name: '系统预设词库',
                isSystem: true,
                elementIds: systemElementIds,
                settings: { showCommon: true, showSecondCommon: false, showNegative: false }
            });
        }
        if (!this.userData.systemElementOverrides) this.userData.systemElementOverrides = {};

        // 默认收藏夹：元素和组合各一个，名称不可重名；ID 固定
        if (!(this.userData.elementGroups && this.userData.elementGroups.length > 0)) {
            this.userData.elementGroups = [{ id: DEFAULT_FAV_ELEMENT_GROUP_ID, bindingId: DEFAULT_FAV_ELEMENT_GROUP_ID, name: '默认元素收藏夹', elementIds: [] }];
            this.userData.settings.defaultFavoriteElementGroupId = DEFAULT_FAV_ELEMENT_GROUP_ID;
        }
        if (!(this.userData.combinationGroups && this.userData.combinationGroups.length > 0)) {
            this.userData.combinationGroups = [{ id: DEFAULT_FAV_COMBO_GROUP_ID, bindingId: DEFAULT_FAV_COMBO_GROUP_ID, name: '默认组合收藏夹', combinationIds: [] }];
            this.userData.settings.defaultFavoriteCombinationGroupId = DEFAULT_FAV_COMBO_GROUP_ID;
        }
        // 确保两个默认收藏夹名称不重复（旧数据或重命名后）
        this.ensureDefaultFavNamesDistinct();

        if (!this.userData.emojiOverrides) this.userData.emojiOverrides = { deletedChars: [], blacklistedChars: [] };
        if (this.userData.settings.hideInsectsExceptButterfly === undefined) this.userData.settings.hideInsectsExceptButterfly = false;
        if (this.userData.settings.autoBackupBeforeImport === undefined) this.userData.settings.autoBackupBeforeImport = true;
        if (!Array.isArray(this.userData.settings.emojiSelectedCategoryIds) || this.userData.settings.emojiSelectedCategoryIds.length === 0) {
            this.userData.settings.emojiSelectedCategoryIds = EMOJI_CATEGORY_TREE.map(n => n.id);
        }
        // Emoji 词库：可删除；若已存在则绝不覆盖/清空，仅当缺失时创建
        const existingEmojiLib = this.userData.libraries.find(lib => lib.bindingId === EMOJI_LIBRARY_ID || lib.name === 'Emoji词库');
        if (!existingEmojiLib) {
            const emojiEls = this.generateEmojiElements();
            const emojiIds = emojiEls.map(e => e.id);
            emojiEls.forEach(e => {
                e.libraryIds = [];
                e.combinationIds = [];
            });
            this.userData.elements.push(...emojiEls);
            this.userData.libraries.push({
                id: EMOJI_LIBRARY_ID,
                bindingId: EMOJI_LIBRARY_ID,
                name: 'Emoji词库',
                elementIds: emojiIds
            });
            emojiEls.forEach(e => e.libraryIds.push(EMOJI_LIBRARY_ID));
        } else {
            // 已存在：统一 bindingId 为固定值；先去掉已不存在的 elementIds 引用，若所剩为空则用默认列表恢复
            if (existingEmojiLib.bindingId !== EMOJI_LIBRARY_ID) {
                const oldBindingId = existingEmojiLib.bindingId;
                existingEmojiLib.bindingId = EMOJI_LIBRARY_ID;
                this.userData.elements.forEach(el => {
                    if (el.libraryIds) el.libraryIds = el.libraryIds.map(lid => lid === oldBindingId ? EMOJI_LIBRARY_ID : lid);
                });
                this.selectedLibraries = (this.selectedLibraries || []).map(lid => lid === oldBindingId ? EMOJI_LIBRARY_ID : lid);
                (this.userData.quickSwitchCombos || []).forEach(c => {
                    if (c.libraryIds) c.libraryIds = c.libraryIds.map(lid => lid === oldBindingId ? EMOJI_LIBRARY_ID : lid);
                });
            }
            const elemSet = new Set((this.userData.elements || []).map(e => e.id));
            const validIds = (existingEmojiLib.elementIds || []).filter(id => elemSet.has(id));
            existingEmojiLib.elementIds = validIds;
            if (validIds.length === 0) {
                const emojiEls = this.generateEmojiElements();
                const emojiIds = emojiEls.map(e => e.id);
                emojiEls.forEach(e => { e.libraryIds = []; e.combinationIds = []; });
                this.userData.elements.push(...emojiEls);
                existingEmojiLib.elementIds = emojiIds;
                emojiEls.forEach(e => e.libraryIds.push(EMOJI_LIBRARY_ID));
            } else {
                // 补全：将当前 generateEmojiElements 中有但词库中尚未包含的 emoji 加入词库（修复之前过滤导致缺失的 emoji）
                const libIdSet = new Set(existingEmojiLib.elementIds || []);
                const fullEmojiEls = this.generateEmojiElements();
                const toAdd = fullEmojiEls.filter(e => !libIdSet.has(e.id));
                if (toAdd.length > 0) {
                    toAdd.forEach(e => {
                        e.libraryIds = []; e.combinationIds = [];
                    });
                    const existingIds = new Set(elemSet);
                    toAdd.forEach(e => {
                        if (!existingIds.has(e.id)) {
                            this.userData.elements.push(e);
                            existingIds.add(e.id);
                        }
                        e.libraryIds.push(EMOJI_LIBRARY_ID);
                        existingEmojiLib.elementIds.push(e.id);
                    });
                }
            }
        }

        this.saveUserData();
    }

    generateEmojiElements() {
        const emojis = [
            // 圆圆表情
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '🫠', '😉',
            '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋',
            '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔', '🫡',
            '🤐', '🤨', '😐', '😑', '😶', '🫥', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨',
            '🤥', '🫨', '🙂‍↔️', '🙂‍↕️', '😌', '😔', '😪', '🤤', '😴', '🫩', '😷', '🤒',
            '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', '🥳',
            '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁', '☹️', '😮', '😯', '😲',
            '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
            '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
            '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',

            // 猫咪表情
            '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',

            // 猴子表情
            '🙈', '🙉', '🙊',

            // 爱心
            '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥',
            '❤️‍🩹', '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🤎', '🖤', '🩶',
            '🤍',

            // 常见符号
            '💋', '💯', '💢', '🫯', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️',
            '🗯️', '💭', '💤',

            // 手势
            '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '🫷', '🫸', '👌',
            '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
            '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶',
            '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',

            // 器官
            '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷',
            '🦴', '👀', '👁️', '👅', '👄', '🫦',

            // 人类
            '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '🧔‍♂️', '🧔‍♀️', '👨‍🦰', '👨‍🦱',
            '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱', '🧑‍🦱', '👩‍🦳', '🧑‍🦳', '👩‍🦲', '🧑‍🦲',
            '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵',

            // 职业
            '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆',
            '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦',
            '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️',
            '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭',
            '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤',
            '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒',
            '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '🥷',
            '👷', '👷‍♂️', '👷‍♀️', '🫅', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵',
            '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤱', '👩‍🍼', '👨‍🍼', '🧑‍🍼', '👼', '🤶', '🧑‍🎄',
            '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️',
            '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️',
            '🧟', '🧟‍♂️', '🧟‍♀️', '🧌', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️',

            // 活动 出行
            '🚶', '🚶‍♂️', '🚶‍♀️', '🚶‍➡️', '🚶‍♀️‍➡️', '🚶‍♂️‍➡️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️',
            '🧎‍➡️', '🧎‍♀️‍➡️', '🧎‍♂️‍➡️', '🧑‍🦯', '🧑‍🦯‍➡️', '👨‍🦯', '👨‍🦯‍➡️', '👩‍🦯', '👩‍🦯‍➡️', '🧑‍🦼', '🧑‍🦼‍➡️', '👨‍🦼',
            '👨‍🦼‍➡️', '👩‍🦼', '👩‍🦼‍➡️', '🧑‍🦽', '🧑‍🦽‍➡️', '👨‍🦽', '👨‍🦽‍➡️', '👩‍🦽', '👩‍🦽‍➡️', '🏃', '🏃‍♂️', '🏃‍♀️',
            '🏃‍➡️', '🏃‍♀️‍➡️', '🏃‍♂️‍➡️', '🧑‍🩰', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️',
            '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄',
            '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️',
            '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼',
            '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘',

            // 运动
            '🧘‍♂️', '🧘‍♀️', '🛀', '🛌',

            // 关系
            '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '👩‍❤️‍💋‍👨', '👨‍❤️‍💋‍👨', '👩‍❤️‍💋‍👩', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩',
            '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧',
            '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦',
            '👩‍👧‍👧', '👪', '🧑‍🧑‍🧒', '🧑‍🧑‍🧒‍🧒', '🧑‍🧒', '🧑‍🧒‍🧒',

            // 抽象人类
            '🗣️', '👤', '👥', '🫂', '👣', '🫆', '🐾',

            // 动物 陆地哺乳
            '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝',
            '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🫎', '🫏', '🐎', '🦄',
            '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏',
            '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀',
            '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥',
            '🦦', '🦨', '🦘', '🦡',

            // 动物 鸟
            '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢',
            '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🪽', '🐦‍⬛', '🪿', '🐦‍🔥',

            // 两栖爬行 龙
            '🐸', '🐊', '🐢', '🦎', '🐍', '🐌', '🐲', '🐉', '🦕', '🦖',

            // 动物 海洋
            '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🪼',
            '🦀', '🦞', '🦐', '🦑', '🦪',

            // 动物 昆虫
            '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🪳', '🕷️', '🕸', '🦂', '🦟', '🪰',
            '🪱', '🦠', '🦋',

            // 植物 花
            '💐', '🌸', '💮', '🪷', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🪻',

            // 植物 草
            '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃',
            '🪹', '🪺', '🍄', '🪾',

            // 食物 水果蔬菜
            '🍇', '🍈', '🍉', '🍊', '🍋', '🍋‍🟩', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐',
            '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🥔', '🥕', '🌽',
            '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🥜', '🫘', '🌰', '🫚', '🫛',
            '🍄‍🟫', '🫜',

            // 食物 主食熟食
            '🍞', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓',
            '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳',
            '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙',
            '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮',

            // 食物 点心饮料
            '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁',
            '🥧', '🍫', '🍬', '🍭', '🍮', '🍯',

            // 食物 餐具
            '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻',
            '🥂', '🥃', '🫗', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄',
            '🔪', '🫙', '🏺',

            // 地理
            '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭',

            // 城市建筑
            '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️',
            '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
            '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽',
            '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄',
            '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🛝', '🎡', '🎢', '💈', '🎪',

            // 陆地交通
            '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋',
            '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘',
            '🚙', '🛻', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛺', '🚲',
            '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨', '🚥', '🚦',
            '🛑', '🚧', '⚓', '🛟', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️',

            // 水上与空中
            '🛩️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛎️',
            '🧳',

            // 时间
            '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️',

            // 时间点
            '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
            '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦',

            // 天文
            '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜',
            '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌',

            // 天气
            '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️',
            '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥',
            '💧', '🌊',

            // 节日
            '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏',
            '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️',

            // 奖牌
            '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉',

            // 运动
            '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🎳', '🏑', '🏒', '🥍',
            '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷',
            '🥌', '🎯', '🪀', '🪁', '🔫', '🎱', '🔮', '🪄', '🎮', '🕹️', '🎰', '🎲',

            // 爱好
            '🧩', '🧸', '🪅', '🪩', '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄',
            '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢',

            // 服饰
            '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦',
            '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '🪭', '👛', '👜', '👝',
            '🛍️', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢',

            // 乐器
            '🪮', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '📿', '💄', '💍', '💎',
            '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶',
            '🎙️', '🎚️', '🎛️', '🎤', '🎧', '📻', '🎷', '🎺', '🪗', '🎸', '🎹', '🎻',
            '🪕', '🥁', '🪘', '🪇', '🪈', '🪉',

            // 电子
            '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🪫', '🔌', '💻', '🖥️', '🖨️',
            '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬',
            '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️', '💡', '🔦', '🪔',

            // 书籍
            '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄',
            '📰', '🗞️', '📑', '🔖', '🏷️',

            // 钱财
            '🪙', '💰', '💴', '💵', '💶', '💷', '💸', '💳',

            // 办公
            '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬',
            '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁',
            '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌',
            '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏',
            '🔐',

            // 工具
            '🔑', '🗝️', '🔨', '🪓', '🎫', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💣', '🪃',
            '🏹', '🛡️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️‍💥',
            '⛓️', '🪝', '🧰', '🧲', '🪜', '🪏',

            // 医药
            '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '💉', '🩸', '💊', '🩹', '🩼', '🩺',
            '🩻',

            // 家具 卫浴
            '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤',
            '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🫧', '🪥', '🧽', '🧯',

            // 其他
            '🛒', '🚬', '⚰️', '🪦', '⚱️', '🧿', '🪬', '🗿', '🪧', '🪪',

            // 符号标志
            '⚠️', '🚸', '☢️', '☣️', '🔅', '🔆', '🛜', '🚫', '🉐', '🈚', '🉑', '🈲',
            '㊙️', '⛔',

            // 方块符号 方向
            '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄',
            '🛅', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️',
            '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️',
            '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎', '🔯', '🪯', '♈',
            '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
            '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼',
            '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '📳', '📴', '♀️', '♂️',
            '⚧️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣',
            '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓',
            'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆚',

            // 禁止符号
            '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭',

            // 数学符号
            '✖️', '➕', '➖', '➗', '🟰',

            // 抽象符号
            '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '♻️', '⚜️',
            '🔱', '⭕', '✅', '☑️', '✔️', '❌', '❎', '🫟',

            // 颜色块
            '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨',
            '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️',
            '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲',

            // 旗帜
            '🏁', '🚩', '🏴', '🏳️', '🏴‍☠️',

        ];
        if (!EMOJIS_FLAT_CACHE) EMOJIS_FLAT_CACHE = emojis.filter(e => typeof e === 'string');
        const overrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
        const deletedSet = new Set(overrides.deletedChars || []);
        const blacklistedSet = new Set(overrides.blacklistedChars || []);
        return emojis
            .map((emoji, origIndex) => ({ emoji, origIndex }))
            .filter(({ emoji }) => emoji != null && emoji !== '' && !deletedSet.has(emoji))
            .map(({ emoji, origIndex }) => {
                const stableId = 'emoji_' + Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join('_');
                return {
                    id: stableId,
                    name: emoji,
                    emojiCategory: getEmojiCategoryIdForIndex(origIndex),
                    libraryIds: [],
                    combinationIds: [],
                    isBlacklisted: !!blacklistedSet.has(emoji)
                };
            });
    }

    _invalidateElementMap() {
        this._elementMapCache = null;
    }

    _buildSystemElement(id, systemLibId) {
        const idx = parseInt(String(id).replace('sys_', ''), 10);
        if (isNaN(idx) || !window.ELEMENTS_DATA || !window.ELEMENTS_DATA[idx]) return null;
        const base = window.ELEMENTS_DATA[idx];
        const overrides = (this.userData.systemElementOverrides || {})[id] || {};
        const elementGroupIds = (this.userData.elementGroups || [])
            .filter(g => (g.elementIds || []).includes(id))
            .map(g => g.bindingId);
        const libraryIds = [systemLibId];
        (this.userData.libraries || []).forEach(lib => {
            if (lib.isSystem) return;
            if ((lib.elementIds || []).includes(id) && !libraryIds.includes(lib.bindingId))
                libraryIds.push(lib.bindingId);
        });
        const el = {
            id,
            name: base.name,
            libraryIds,
            elementGroupIds,
            combinationIds: [],
            isBlacklisted: overrides.isBlacklisted !== undefined ? overrides.isBlacklisted : false,
            common: overrides.common !== undefined ? overrides.common : (base.common || 0),
            secondCommon: overrides.secondCommon !== undefined ? overrides.secondCommon : (base.secondCommon || 0),
            negative: overrides.negative !== undefined ? overrides.negative : (base.negative || 0)
        };
        const self = this;
        return new Proxy(el, {
            set(target, key, value) {
                if (['isBlacklisted', 'common', 'secondCommon', 'negative'].includes(key)) {
                    if (!self.userData.systemElementOverrides) self.userData.systemElementOverrides = {};
                    if (!self.userData.systemElementOverrides[id]) self.userData.systemElementOverrides[id] = {};
                    self.userData.systemElementOverrides[id][key] = value;
                    self._invalidateElementMap();
                }
                target[key] = value;
                return true;
            }
        });
    }

    _getElementMap() {
        if (!this._elementMapCache) {
            this._elementMapCache = {};
            (this.userData.elements || []).forEach(e => { this._elementMapCache[e.id] = e; });
            const systemLib = (this.userData.libraries || []).find(l => l.isSystem);
            if (systemLib && (systemLib.elementIds || []).length && typeof window.ELEMENTS_DATA !== 'undefined') {
                (systemLib.elementIds || []).forEach(sid => {
                    const built = this._buildSystemElement(sid, systemLib.bindingId);
                    if (built) this._elementMapCache[sid] = built;
                });
            }
        }
        return this._elementMapCache;
    }

    getElementById(id) {
        return this._getElementMap()[id] || null;
    }

    getElementsByIds(ids) {
        if (!ids || !ids.length) return [];
        const m = this._getElementMap();
        return ids.map(id => m[id]).filter(Boolean);
    }

    /** 一位一位比较排序（字典序）*/
    _naturalCompare(strA, strB, descending = false) {
        const a = String(strA || '');
        const b = String(strB || '');
        const c = a.localeCompare(b, 'zh-CN');
        return descending ? -c : c;
    }

    getLibraryById(ref) {
        return (this.userData.libraries || []).find(l => l.bindingId === ref || l.id === ref);
    }

    getCombinationById(id) {
        return this.userData.combinations.find(c => c.id === id);
    }

    getGroupById(ref) {
        return (this.userData.combinationGroups || []).find(g => g.bindingId === ref || g.id === ref);
    }

    getElementGroupById(ref) {
        return (this.userData.elementGroups || []).find(g => g.bindingId === ref || g.id === ref);
    }

    // 确保两个默认收藏夹名称不重复（开局与保存时共用）
    ensureDefaultFavNamesDistinct() {
        const elemId = this.userData.settings.defaultFavoriteElementGroupId;
        const comboId = this.userData.settings.defaultFavoriteCombinationGroupId;
        const elemFav = elemId ? this.getElementGroupById(elemId) : null;
        const comboFav = comboId ? this.getGroupById(comboId) : null;
        if (elemFav && comboFav && elemFav.name === comboFav.name) {
            const base = (elemFav.name || '').replace(/（[^）]+）$/, '').trim() || elemFav.name;
            elemFav.name = base + '（元素）';
            comboFav.name = base + '（组合）';
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 事件监听器设置
    setupEventListeners() {
        // 认证相关
        document.getElementById('auth-submit').addEventListener('click', () => {
            const password = document.getElementById('password-input').value;
            if (!this.authenticate(password)) {
                document.getElementById('auth-error').textContent = '口令错误，请重新输入';
            }
        });

        document.getElementById('password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('auth-submit').click();
            }
        });

        // 主界面导航：侧边栏与遮罩（桌面与移动端一致，均为覆盖层）
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.toggleSidebar(true);
        });

        document.getElementById('close-sidebar').addEventListener('click', () => {
            this.toggleSidebar(false);
        });

        document.getElementById('sidebar-backdrop').addEventListener('click', () => {
            this.toggleSidebar(false);
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        const historyBtn = document.getElementById('history-btn');
        if (historyBtn) historyBtn.addEventListener('click', () => this.showHistoryModal());

        const resetDataBtn = document.getElementById('reset-data-btn');
        if (resetDataBtn) resetDataBtn.addEventListener('click', () => {
            this.showConfirmModal('确定要一键初始化吗？将恢复为默认词库与分组，此操作不可恢复！建议先导出备份。', () => this.resetDataToDefault());
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.showMainApp();
        });

        // 工具箱：点击打开弹窗选择工具（弹窗内可拖拽排序）
        document.getElementById('toolbox-btn').addEventListener('click', () => {
            this.showToolboxModal();
        });

        // 词库选择
        document.getElementById('add-library-btn').addEventListener('click', () => {
            this.showLibrarySelector();
        });

        document.getElementById('save-switch-btn').addEventListener('click', () => {
            this.showPromptModal('保存为一键开关', '输入名称（覆盖按钮在一键开关内）', (name) => {
                if (!name) return;
                const list = this.userData.quickSwitchCombos || [];
                const existing = list.find(c => c.name === name);
                const emojiFilter = {
                    categoryIds: [...(this.userData.settings.emojiSelectedCategoryIds || [])],
                    hideInsects: !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly)
                };
                if (existing) {
                    existing.libraryIds = [...this.selectedLibraries];
                    existing.elementGroupIds = [...(this.selectedElementGroups || [])];
                    existing.combinationGroupIds = [...this.selectedGroups];
                    existing.emojiFilter = emojiFilter;
                    this.showToast('已覆盖一键开关');
                } else {
                    list.push({
                        id: this.generateId(),
                        name: name,
                        libraryIds: [...this.selectedLibraries],
                        elementGroupIds: [...(this.selectedElementGroups || [])],
                        combinationGroupIds: [...this.selectedGroups],
                        emojiFilter: emojiFilter
                    });
                    this.showToast('已保存一键开关');
                }
                this.saveUserData();
                this.renderLibrarySelector();
            });
        });

        // 侧边栏按钮事件
        document.getElementById('new-library-btn').addEventListener('click', () => {
            this.showNewLibraryModal();
        });

        document.getElementById('new-element-group-btn').addEventListener('click', () => {
            this.showNewElementGroupModal();
        });
        document.getElementById('new-group-btn').addEventListener('click', () => {
            this.showNewGroupModal();
        });

        document.getElementById('blacklist-btn').addEventListener('click', () => {
            this.showBlacklistModal();
        });

        // 快捷复制
        document.querySelectorAll('.copyable').forEach(element => {
            element.addEventListener('click', () => {
                const text = element.dataset.text;
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast(`已复制: ${text}`);
                });
            });
        });

        // 设置相关
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (theme === 'custom') {
                    this._openCustomThemeComboModal(() => {
                        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                    return;
                }
                this.changeTheme(theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.body.addEventListener('click', (e) => {
            if (!document.body.classList.contains('theme-spring')) return;
            if (!e.target.closest('button')) return;
            this._springFlowerBubble(e.clientX, e.clientY);
        });
    }

    _springFlowerBubble(clientX, clientY) {
        const el = document.createElement('span');
        el.className = 'spring-flower-bubble';
        el.textContent = '🌸';
        el.style.left = clientX + 'px';
        el.style.top = clientY + 'px';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('spring-flower-bubble-float'));
        setTimeout(() => el.remove(), 1200);
    }

    // 当前工具顺序（用于弹窗展示与拖拽保存）
    getToolOrder() {
        const order = this.userData.settings.toolOrder;
        if (Array.isArray(order) && order.length > 0) {
            const set = new Set(DEFAULT_TOOL_ORDER);
            return order.filter(id => set.has(id)).concat(DEFAULT_TOOL_ORDER.filter(id => !order.includes(id)));
        }
        return [...DEFAULT_TOOL_ORDER];
    }

    // 工具箱弹窗：标题「也许人生需要一定仪式感……」，小方形图标网格，可拖拽排序，点击选中工具；
    // 移动端保留自定义纵向滚动条（bar），隐藏系统默认滚动条
    showToolboxModal() {
        const order = this.getToolOrder();
        const currentTool = this.currentTool;
        const content = `
            <div class="toolbox-modal-scroll-wrap" id="toolbox-scroll-wrap">
                <div class="toolbox-grid" id="toolbox-grid">
                    ${order.map(toolId => `
                        <div class="toolbox-tool-icon ${toolId === currentTool ? 'active' : ''}" data-tool="${toolId}" draggable="true">
                            <span class="tool-icon-emoji">${TOOL_ICONS[toolId] || '🔧'}</span>
                            <span class="tool-icon-label">${TOOL_NAMES[toolId] || toolId}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="toolbox-scroll-bar-wrap" id="toolbox-scroll-bar-wrap">
                <div class="toolbox-scroll-bar" id="toolbox-scroll-bar"></div>
            </div>
        `;
        const modal = this.createModal('也许人生需要一定仪式感……', content, []);
        modal.classList.add('toolbox-modal');

        const grid = modal.querySelector('#toolbox-grid');
        const scrollWrap = modal.querySelector('#toolbox-scroll-wrap');
        const barWrap = modal.querySelector('#toolbox-scroll-bar-wrap');
        const bar = modal.querySelector('#toolbox-scroll-bar');
        if (!grid) return;

        // 移动端自定义滚动条：只在内容高度超出时显示，可拖拽控制滚动
        if (scrollWrap && barWrap && bar) {
            const updateBar = () => {
                const sh = scrollWrap.scrollHeight;
                const ch = scrollWrap.clientHeight;
                if (sh <= ch) {
                    bar.style.display = 'none';
                    return;
                }
                bar.style.display = 'block';
                const trackH = barWrap.getBoundingClientRect().height;
                const barH = Math.max(32, (ch / sh) * trackH);
                bar.style.height = barH + 'px';
                const maxScroll = sh - ch;
                const maxBarTop = trackH - barH;
                bar.style.transform = `translateY(${(scrollWrap.scrollTop / maxScroll) * maxBarTop}px)`;
            };
            const onScroll = () => { updateBar(); };
            scrollWrap.addEventListener('scroll', onScroll);
            let barStartY = 0, scrollStartTop = 0;
            const onBarPointerMove = (e) => {
                if (e.touches) e.preventDefault();
                const y = e.touches ? e.touches[0].clientY : e.clientY;
                const trackRect = barWrap.getBoundingClientRect();
                const barRect = bar.getBoundingClientRect();
                const trackH = trackRect.height;
                const barH = barRect.height;
                const maxBarTop = trackH - barH;
                const deltaY = y - barStartY;
                const maxScroll = scrollWrap.scrollHeight - scrollWrap.clientHeight;
                const ratio = maxBarTop > 0 ? maxScroll / maxBarTop : 0;
                let newTop = scrollStartTop + deltaY * ratio;
                newTop = Math.max(0, Math.min(maxScroll, newTop));
                scrollWrap.scrollTop = newTop;
            };
            const onBarPointerUp = () => {
                document.body.classList.remove('drag-active');
                document.removeEventListener('pointermove', onBarPointerMove);
                document.removeEventListener('pointerup', onBarPointerUp);
                document.removeEventListener('pointercancel', onBarPointerUp);
                document.removeEventListener('touchmove', onBarPointerMove);
                document.removeEventListener('touchend', onBarPointerUp);
                document.removeEventListener('touchcancel', onBarPointerUp);
            };
            bar.addEventListener('pointerdown', (e) => {
                if (e.button !== 0 && e.pointerType !== 'touch') return;
                e.preventDefault();
                barStartY = e.touches ? e.touches[0].clientY : e.clientY;
                scrollStartTop = scrollWrap.scrollTop;
                document.body.classList.add('drag-active');
                document.addEventListener('pointermove', onBarPointerMove);
                document.addEventListener('pointerup', onBarPointerUp);
                document.addEventListener('pointercancel', onBarPointerUp);
            });
            bar.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return;
                e.preventDefault();
                barStartY = e.touches[0].clientY;
                scrollStartTop = scrollWrap.scrollTop;
                document.body.classList.add('drag-active');
                document.addEventListener('touchmove', onBarPointerMove, { passive: false });
                document.addEventListener('touchend', onBarPointerUp);
                document.addEventListener('touchcancel', onBarPointerUp);
            }, { passive: false });
            updateBar();
            const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateBar) : null;
            if (ro) ro.observe(scrollWrap);
        }

        // 点击图标：选中该工具并关闭弹窗
        grid.querySelectorAll('.toolbox-tool-icon').forEach(el => {
            el.addEventListener('click', (e) => {
                if (el.classList.contains('dragging')) return;
                const tool = el.dataset.tool;
                if (tool) {
                    this.selectTool(tool);
                    this.closeModal();
                }
            });
        });

        // 拖拽排序
        let draggedEl = null;
        grid.addEventListener('dragstart', (e) => {
            if (!e.target.classList.contains('toolbox-tool-icon')) return;
            draggedEl = e.target;
            e.target.classList.add('dragging');
            document.body.classList.add('drag-active');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.dataset.tool);
            e.dataTransfer.setData('text/html', e.target.outerHTML);
        });
        grid.addEventListener('dragend', (e) => {
            document.body.classList.remove('drag-active');
            if (e.target.classList.contains('toolbox-tool-icon')) e.target.classList.remove('dragging');
            draggedEl = null;
            grid.querySelectorAll('.toolbox-tool-icon').forEach(el => el.classList.remove('drag-over'));
        });
        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.toolbox-tool-icon');
            if (target && target !== draggedEl) {
                grid.querySelectorAll('.toolbox-tool-icon').forEach(el => el.classList.remove('drag-over'));
                target.classList.add('drag-over');
            }
        });
        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            const target = e.target.closest('.toolbox-tool-icon');
            if (!target || !draggedEl || target === draggedEl) return;
            target.classList.remove('drag-over');
            const all = [...grid.querySelectorAll('.toolbox-tool-icon')];
            const fromIdx = all.indexOf(draggedEl);
            const toIdx = all.indexOf(target);
            if (fromIdx === -1 || toIdx === -1) return;
            if (fromIdx < toIdx) target.parentNode.insertBefore(draggedEl, target.nextSibling);
            else target.parentNode.insertBefore(draggedEl, target);
            // 保存新顺序
            const newOrder = [...grid.querySelectorAll('.toolbox-tool-icon')].map(el => el.dataset.tool);
            this.userData.settings.toolOrder = newOrder;
            this.saveUserData();
        });
        grid.addEventListener('dragleave', (e) => {
            if (!e.target.closest('#toolbox-grid')) return;
            const related = e.relatedTarget;
            if (!related || !grid.contains(related)) grid.querySelectorAll('.toolbox-tool-icon').forEach(el => el.classList.remove('drag-over'));
        });
    }

    // 工具选择
    selectTool(toolName) {
        this.currentTool = toolName;
        if (!this.userData.settings) this.userData.settings = {};
        this.userData.settings.lastTool = toolName;
        this.saveUserData();
        const label = document.getElementById('toolbox-btn-label');
        if (label) label.textContent = TOOL_NAMES[toolName] || toolName;
        this.renderCurrentTool();
        this.refreshResultsArea();
    }

    // 渲染当前工具
    renderCurrentTool() {
        const generationArea = document.getElementById('generation-area');
        
        switch (this.currentTool) {
            case 'basic':
                this.renderBasicGenerator();
                break;
            case 'combo':
                this.renderComboGenerator();
                break;
            case 'daily':
                this.renderDailyElement();
                break;
            case 'blindbox':
                this.renderBlindBox();
                break;
            case 'gacha':
                this.renderGacha();
                break;
            case 'fortune':
                this.renderFortune();
                break;
            case 'horoscope':
                this.renderHoroscope();
                break;
            case 'color':
                this.renderColorGenerator();
                break;
            case 'pause':
                this.renderPauseChallenge();
                break;
            case 'wheel':
                this.renderWheel();
                break;
            case 'wordcloud':
                this.renderWordCloud();
                break;
            case 'sonnet':
                this.renderSonnet();
                break;
            case 'farming':
                this.renderFarming();
                break;
            case 'catch':
                this.renderCatchGame();
                break;
            case 'quiz':
                this.renderQuiz();
                break;
            case 'shop':
                this.renderShop();
                break;
            case 'doubleblind':
                this.renderDoubleBlind();
                break;
            case 'fishmaster':
                this.renderFishMaster();
                break;
            case 'fishing':
                this.renderFishing();
                break;
            case 'gashapon':
                this.renderGashapon();
                break;
            case 'scrollpoem':
                this.renderScrollPoem();
                break;
            case 'firework':
                this.renderFirework();
                break;
            case 'jar':
                this.renderJar();
                break;
            case 'mining':
                this.renderMining();
                break;
            case 'telepathy':
                this.renderTelepathy();
                break;
            default:
                this.renderBasicGenerator();
        }
    }

    // 基础生成器
    renderBasicGenerator() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>基础生成</h3>
                <div class="form-group">
                    <label>生成类型：</label>
                    <select id="basic-type" class="form-control">
                        <option value="elements">元素</option>
                        <option value="combinations">元素组合</option>
                    </select>
                </div>
                <div id="elements-config" class="form-group">
                    <label>每个组合的元素数量：</label>
                    <input type="number" id="elements-per-combo" class="form-control" value="3" min="1" max="10">
                </div>
                <div class="form-group">
                    <label>生成数量：</label>
                    <input type="number" id="generation-count" class="form-control" value="5" min="1" max="50">
                </div>
                <div class="form-group basic-quick-actions">
                    <label class="checkbox-label"><input type="checkbox" id="basic-quick-fav" ${this.basicQuickFav ? 'checked' : ''}> 快捷收藏</label>
                    <label class="checkbox-label"><input type="checkbox" id="basic-quick-blacklist" ${this.basicQuickBlacklist ? 'checked' : ''}> 快捷拉黑</label>
                </div>
                <button id="basic-generate" class="btn generate-btn">生成灵感</button>
            </div>
        `;

        // 事件监听
        document.getElementById('basic-quick-fav').addEventListener('change', (e) => {
            this.basicQuickFav = !!e.target.checked;
            if (this.currentTool === 'basic') this.refreshResultsArea();
        });
        document.getElementById('basic-quick-blacklist').addEventListener('change', (e) => {
            this.basicQuickBlacklist = !!e.target.checked;
            if (this.currentTool === 'basic') this.refreshResultsArea();
        });
        document.getElementById('basic-type').addEventListener('change', (e) => {
            const elementsConfig = document.getElementById('elements-config');
            if (e.target.value === 'elements') {
                elementsConfig.style.display = 'block';
            } else {
                elementsConfig.style.display = 'none';
            }
        });

        document.getElementById('basic-generate').addEventListener('click', () => {
            this.generateBasic();
        });

        const tp = (this.userData.settings.toolParams = this.userData.settings.toolParams || {});
        const bp = tp.basic || {};
        if (bp.generationCount != null) document.getElementById('generation-count').value = bp.generationCount;
        if (bp.elementsPerCombo != null) document.getElementById('elements-per-combo').value = bp.elementsPerCombo;
        if (bp.type != null) {
            const typeEl = document.getElementById('basic-type');
            const elementsConfig = document.getElementById('elements-config');
            if (typeEl && (bp.type === 'elements' || bp.type === 'combinations')) {
                typeEl.value = bp.type;
                if (elementsConfig) elementsConfig.style.display = bp.type === 'elements' ? 'block' : 'none';
            }
        }
        const saveBasicParams = () => {
            this.userData.settings.toolParams = this.userData.settings.toolParams || {};
            this.userData.settings.toolParams.basic = {
                type: document.getElementById('basic-type').value,
                generationCount: parseInt(document.getElementById('generation-count').value, 10) || 5,
                elementsPerCombo: parseInt(document.getElementById('elements-per-combo').value, 10) || 3
            };
            this.saveUserData();
        };
        document.getElementById('generation-count').addEventListener('change', saveBasicParams);
        document.getElementById('elements-per-combo').addEventListener('change', saveBasicParams);
        document.getElementById('basic-type').addEventListener('change', saveBasicParams);
    }

    generateBasic() {
        const type = document.getElementById('basic-type').value;
        const count = parseInt(document.getElementById('generation-count').value);
        const elementsPerCombo = parseInt(document.getElementById('elements-per-combo').value);

        let results = [];

        if (type === 'elements') {
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('数量不足：请先选择词库或元素分组。');
                return;
            }
            if (available.length < elementsPerCombo) {
                this.showToast('因数量不足，无法生成不重复组合。');
                return;
            }
            const seenKeys = new Set();
            const maxAttempts = Math.max(count * 50, 500);
            let attempts = 0;
            while (results.length < count && attempts < maxAttempts) {
                const combo = this.generateRandomElements(elementsPerCombo);
                if (combo.length < elementsPerCombo) break;
                const key = combo.map(e => e.id).sort().join(',');
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    const id = this.generateId();
                    if (combo.length === 1) results.push({ type: 'element', element: combo[0], id });
                    else results.push({ type: 'combination', elements: combo, id });
                }
                attempts++;
            }
            if (results.length < count && results.length > 0)
                this.showToast('因数量不足，仅生成 ' + results.length + ' 条不重复结果。');
            else if (results.length === 0)
                this.showToast('因数量不足，无法生成不重复组合。');
        } else {
            const availableCombinations = this.getAvailableCombinations();
            if (availableCombinations.length === 0) {
                this.showToast('数量不足：请先选择元素组合分组。');
                return;
            }
            const shuffled = [...availableCombinations].sort(() => Math.random() - 0.5);
            const take = Math.min(count, shuffled.length);
            for (let i = 0; i < take; i++) {
                results.push({
                    type: 'existing_combination',
                    combination: shuffled[i],
                    id: this.generateId()
                });
            }
            if (count > availableCombinations.length)
                this.showToast('因数量不足，仅生成 ' + take + ' 条不重复结果。');
        }

        this.displayResults(results);
    }

    generateRandomElements(count) {
        const availableElements = this.getAvailableElements();
        if (availableElements.length === 0) return [];

        const selected = [];
        const used = new Set();

        for (let i = 0; i < count && selected.length < availableElements.length; i++) {
            let element;
            do {
                element = availableElements[Math.floor(Math.random() * availableElements.length)];
            } while (used.has(element.id) && used.size < availableElements.length);
            
            if (!used.has(element.id)) {
                selected.push(element);
                used.add(element.id);
            }
        }

        return selected;
    }

    getAvailableElements() {
        const seen = new Set();
        const out = [];
        const hideInsects = !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly);
        const emojiCategoryIds = this.userData.settings && this.userData.settings.emojiSelectedCategoryIds;
        const emojiLeafSet = expandEmojiCategorySelectedToLeafIds(emojiCategoryIds && emojiCategoryIds.length ? emojiCategoryIds : null);
        this.selectedLibraries.forEach(libraryId => {
            const lib = this.getLibraryById(libraryId);
            if (!lib) return;
            let els = this.getLibraryElements(lib);
            if (lib.bindingId === EMOJI_LIBRARY_ID) {
                if (hideInsects) els = els.filter(el => !isInsectExceptButterfly(el.name));
                if (emojiLeafSet) els = els.filter(el => emojiLeafSet.has(getEmojiCategoryForEmojiChar(el.name) || ''));
            }
            els.forEach(el => {
                if (el && !el.isBlacklisted && !seen.has(el.id)) { seen.add(el.id); out.push(el); }
            });
        });
        this.selectedElementGroups.forEach(groupId => {
            const group = this.getElementGroupById(groupId);
            if (!group) return;
            this.getElementsByIds(group.elementIds || []).forEach(el => {
                if (el && !el.isBlacklisted && !seen.has(el.id)) { seen.add(el.id); out.push(el); }
            });
        });
        return out;
    }

    getLibraryElements(library) {
        const elements = this.getElementsByIds(library.elementIds || []);
        if (library.isSystem && library.settings) {
            const s = library.settings;
            return elements.filter(el => {
                if (el.isBlacklisted) return false;
                if (el.negative && !s.showNegative) return false; // 负面：勾选才包含负面
                if (s.showSecondCommon) return !!(el.common || el.secondCommon); // 次常见勾选 = 常见+次常见
                if (s.showCommon) return !!el.common; // 只勾常见 = 仅常见
                return true; // 都不勾 = 什么都可以（常见、次常见、剩下的都包含）
            });
        }
        return elements.filter(el => !el.isBlacklisted);
    }

    getAvailableCombinations() {
        const out = [];
        this.selectedGroups.forEach(groupId => {
            const group = this.getGroupById(groupId);
            if (!group) return;
            (group.combinationIds || []).forEach(cid => {
                const c = this.getCombinationById(cid);
                if (!c) return;
                const hasBlacklisted = (c.elementIds || []).some(eid => {
                    const el = this.getElementById(eid);
                    return !el || el.isBlacklisted;
                });
                if (!hasBlacklisted) out.push(c);
            });
        });
        return out;
    }

    // 显示结果（仅当前工具，并写入历史）
    displayResults(results) {
        this.toolResults[this.currentTool] = results || [];
        if (results && results.length > 0) {
            this.generationHistory.push({
                tool: this.currentTool,
                results: JSON.parse(JSON.stringify(results)),
                timestamp: Date.now()
            });
            this.saveUserData();
        }
        this.refreshResultsArea();
    }

    refreshResultsArea() {
        const resultsContent = document.getElementById('results-content');
        const resultsBox = document.getElementById('results-content-box');
        const copyHint = document.getElementById('results-copy-hint');
        if (!resultsContent || !resultsBox) return;
        const results = this.toolResults[this.currentTool];
        if (!results || results.length === 0) {
            resultsContent.innerHTML = '';
            resultsBox.classList.add('results-content-box-empty');
            if (copyHint) copyHint.classList.add('hidden');
            return;
        }
        resultsBox.classList.remove('results-content-box-empty');
        const hasCombo = results.some(r => {
            if (r.type === 'combination' && r.elements && r.elements.length === 1) return false;
            if (r.type === 'existing_combination' && r.combination && r.combination.elementIds && r.combination.elementIds.length === 1) return false;
            if (r.type === 'combo_by_source' && r.elements && r.elements.length === 1) return false;
            return r.type === 'combination' || r.type === 'existing_combination' || r.type === 'combo_by_source';
        });
        if (copyHint) {
            if (hasCombo) {
                copyHint.classList.remove('hidden');
            } else {
                copyHint.classList.add('hidden');
            }
        }
        resultsContent.innerHTML = '';
        const tool = this.currentTool;
        const quickFav = tool === 'basic' && this.basicQuickFav;
        const quickBlacklist = tool === 'basic' && this.basicQuickBlacklist;
        results.forEach((result, idx) => {
            const onUpdate = (newResult) => {
                if (!result.id) return;
                const arr = this.toolResults[tool];
                if (arr && idx >= 0 && idx < arr.length) arr[idx] = { ...newResult, id: result.id };
                this.generationHistory.forEach(entry => {
                    (entry.results || []).forEach((r, i) => {
                        if (r.id === result.id) entry.results[i] = { ...newResult, id: result.id };
                    });
                });
            };
            const resultElement = this.createResultElement(result, false, { resultId: result.id, tool, onUpdate, quickFav, quickBlacklist });
            resultsContent.appendChild(resultElement);
        });
        resultsContent.classList.add('fade-in');
        setTimeout(() => resultsContent.classList.remove('fade-in'), 300);
    }

    createResultElement(result, isHistory = false, opts = null) {
        // 仅含一个元素的组合统一视为「只有元素、没有组合」
        if (result.type === 'combination' && result.elements && result.elements.length === 1) {
            result = { type: 'element', element: result.elements[0], id: result.id };
        } else if (result.type === 'existing_combination' && result.combination && result.combination.elementIds && result.combination.elementIds.length === 1) {
            const el = this.getElementById(result.combination.elementIds[0]);
            if (el) result = { type: 'element', element: el, id: result.id };
        } else if (result.type === 'combo_by_source' && result.elements && result.elements.length === 1) {
            result = { type: 'element', element: result.elements[0], id: result.id };
        }

        const wrap = document.createElement('div');
        const isCombo = result.type === 'combination' || result.type === 'existing_combination' || result.type === 'combo_by_source';
        wrap.className = 'result-item-wrap' + (isCombo ? ' result-item-wrap-combo' : '') + (result.type === 'combo_by_source' ? ' result-item-wrap-combo-by-source' : '');
        const resultId = result.id || (opts && opts.resultId);
        if (resultId) wrap.dataset.resultId = resultId;
        const onUpdate = opts && opts.onUpdate;
        const quickFav = opts && opts.quickFav;
        const quickBlacklist = opts && opts.quickBlacklist;

        const getComboText = () => {
            if (result.type === 'combination' && result.elements) return result.elements.map(e => e.name).join(' + ');
            if (result.type === 'existing_combination' && result.combination) {
                const els = this.getElementsByIds(result.combination.elementIds || []);
                return els.map(e => e.name).join(' + ');
            }
            if (result.type === 'combo_by_source' && result.elements) return result.elements.map(e => e.name).join(' + ');
            return '';
        };

        const tool = opts && opts.tool;
        const fromResults = !!(onUpdate || (opts && opts.fromResults)); // 生成结果或历史：与生成结果一致（移除=新组合、不写回、无保存）
        const openEdit = (comboId, elIds) => {
            const onClose = (quickFav || quickBlacklist) && resultId && tool != null ? () => this._updateResultRowQuickButtons(resultId, tool) : null;
            this.showEditCombinationModal(comboId, elIds, fromResults, null, onClose);
        };

        if (result.type === 'combination') {
            const els = result.elements || [];
            els.forEach((e, i) => {
                if (i > 0) {
                    const sep = document.createElement('span');
                    sep.className = 'result-item-sep';
                    sep.textContent = ' + ';
                    wrap.appendChild(sep);
                }
                const chip = document.createElement('span');
                chip.className = 'result-item';
                chip.textContent = e.name;
                chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(chip.dataset.id); });
                chip.dataset.id = e.id;
                wrap.appendChild(chip);
            });
            if (els.length > 1) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn result-action-btn result-combo-edit';
                editBtn.textContent = '编辑';
                editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(null, els.map(e => e.id)); });
                wrap.appendChild(editBtn);
                const ids = els.map(e => e.id);
                if (quickFav) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                    favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                    favBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this._quickFavCombo(null, ids);
                        favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                        if (wrap.querySelector('.result-quick-blacklist')) wrap.querySelector('.result-quick-blacklist').textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    });
                    wrap.appendChild(favBtn);
                }
                if (quickBlacklist) {
                    const blackBtn = document.createElement('button');
                    blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                    blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    blackBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                        if (nowAllBlack) this._quickUnblacklistIds(ids);
                        else this._quickBlacklistIds(ids);
                        blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                        if (wrap.querySelector('.result-quick-fav')) wrap.querySelector('.result-quick-fav').textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                    });
                    wrap.appendChild(blackBtn);
                }
            }
        } else if (result.type === 'existing_combination') {
            const combo = result.combination;
            const els = this.getElementsByIds(combo.elementIds || []);
            els.forEach((e, i) => {
                if (i > 0) {
                    const sep = document.createElement('span');
                    sep.className = 'result-item-sep';
                    sep.textContent = ' + ';
                    wrap.appendChild(sep);
                }
                const chip = document.createElement('span');
                chip.className = 'result-item';
                chip.textContent = e.name;
                chip.dataset.id = e.id;
                chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(e.id); });
                wrap.appendChild(chip);
            });
            const editBtn = document.createElement('button');
            editBtn.className = 'btn result-action-btn result-combo-edit';
            editBtn.textContent = '编辑';
            editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(combo.id, combo.elementIds || []); });
            wrap.appendChild(editBtn);
            const ids = combo.elementIds || [];
            if (quickFav) {
                const favBtn = document.createElement('button');
                favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                favBtn.textContent = this._isComboInFav(combo.id, ids) ? '已收藏' : '收藏';
                favBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this._quickFavCombo(combo.id, ids);
                    favBtn.textContent = this._isComboInFav(combo.id, ids) ? '已收藏' : '收藏';
                    const otherBlack = wrap.querySelector('.result-quick-blacklist');
                    if (otherBlack) otherBlack.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                });
                wrap.appendChild(favBtn);
            }
            if (quickBlacklist) {
                const blackBtn = document.createElement('button');
                blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                blackBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                    if (nowAllBlack) this._quickUnblacklistIds(ids);
                    else this._quickBlacklistIds(ids);
                    blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    const otherFav = wrap.querySelector('.result-quick-fav');
                    if (otherFav) otherFav.textContent = this._isComboInFav(combo.id, ids) ? '已收藏' : '收藏';
                });
                wrap.appendChild(blackBtn);
            }
        } else if (result.type === 'combo_by_source') {
            const lines = result.lines || [];
            const els = result.elements || [];
            const listWrap = document.createElement('div');
            listWrap.className = 'combo-list-wrap';
            lines.forEach(line => {
                const lineEl = document.createElement('div');
                lineEl.className = 'combo-source-line';
                const label = document.createElement('span');
                label.className = 'combo-source-label';
                label.textContent = line.sourceName + '：';
                lineEl.appendChild(label);
                const value = document.createElement('span');
                value.className = 'combo-source-value';
                (line.elements || []).forEach((e, i) => {
                    if (i > 0) {
                        const sep = document.createElement('span');
                        sep.className = 'combo-source-sep';
                        sep.textContent = ' + ';
                        value.appendChild(sep);
                    }
                    const chip = document.createElement('span');
                    chip.className = 'result-item';
                    chip.textContent = e.name;
                    chip.dataset.id = e.id;
                    chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(e.id); });
                    value.appendChild(chip);
                });
                lineEl.appendChild(value);
                listWrap.appendChild(lineEl);
            });
            wrap.appendChild(listWrap);
            const ids = els.map(e => e.id);
            const editBtn = document.createElement('button');
            editBtn.className = 'btn result-action-btn result-combo-edit';
            editBtn.textContent = '编辑';
            editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(null, ids); });
            wrap.appendChild(editBtn);
            if (quickFav) {
                const favBtn = document.createElement('button');
                favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                favBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this._quickFavCombo(null, ids);
                    favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                    const blackBtn = wrap.querySelector('.result-quick-blacklist');
                    if (blackBtn) blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                });
                wrap.appendChild(favBtn);
            }
            if (quickBlacklist) {
                const blackBtn = document.createElement('button');
                blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                blackBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                    if (nowAllBlack) this._quickUnblacklistIds(ids);
                    else this._quickBlacklistIds(ids);
                    blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    const favBtn = wrap.querySelector('.result-quick-fav');
                    if (favBtn) favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                });
                wrap.appendChild(blackBtn);
            }
        } else if (result.type === 'element') {
            const el = result.element;
            const chip = document.createElement('span');
            chip.className = 'result-item';
            chip.textContent = el.name;
            chip.addEventListener('click', () => this.showElementModalById(el.id));
            wrap.appendChild(chip);
        }

        if (isCombo) {
            this._attachLongPressCopy(wrap, getComboText, wrap);
        }
        return wrap;
    }

    _attachLongPressCopy(outerEl, getText, innerEl) {
        let timer = null;
        const delay = 500;
        const start = (e) => {
            if (e.target !== outerEl && !outerEl.contains(e.target)) return;
            if (e.target.closest('.result-item') || e.target.closest('.result-combo-edit')) return;
            timer = setTimeout(() => {
                const text = getText();
                if (text && navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => this.showToast('已复制到剪贴板'));
                }
                timer = null;
            }, delay);
        };
        const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
        outerEl.addEventListener('mousedown', start);
        outerEl.addEventListener('mouseup', cancel);
        outerEl.addEventListener('mouseleave', cancel);
        outerEl.addEventListener('touchstart', start, { passive: true });
        outerEl.addEventListener('touchend', cancel);
        outerEl.addEventListener('touchcancel', cancel);
    }

    // 词库选择器：词库 + 词语组（元素分组）+ 元素组合的组，均可选（双盲词库不展示）
    showLibrarySelector() {
        const libList = (this.userData.libraries || []).filter(l => l.bindingId !== DOUBLEBLIND_LIBRARY_ID).map(l => `
            <label class="selector-item ${l.isSystem ? 'lib-cb-system' : ''}"><input type="checkbox" class="lib-cb" value="${l.bindingId}" ${this.selectedLibraries.includes(l.bindingId) ? 'checked' : ''}> ${l.name}${l.isSystem ? '（系统）' : ''}</label>
        `).join('');
        const elementGroupList = (this.userData.elementGroups || []).map(g => `
            <label class="selector-item"><input type="checkbox" class="element-group-cb" value="${g.bindingId}" ${this.selectedElementGroups.includes(g.bindingId) ? 'checked' : ''}> ${g.name}</label>
        `).join('');
        const groupList = (this.userData.combinationGroups || []).map(g => `
            <label class="selector-item"><input type="checkbox" class="group-cb" value="${g.bindingId}" ${this.selectedGroups.includes(g.bindingId) ? 'checked' : ''}> ${g.name}</label>
        `).join('');
        const modal = this.createModal('选择词库 / 分组', `
            <div class="single-column-selector">
                <div class="selector-section">
                    <div class="column-title">词库</div>
                    <div class="column-list">${libList}</div>
                </div>
                <div class="selector-section">
                    <div class="column-title">元素分组</div>
                    <div class="column-list">${elementGroupList}</div>
                </div>
                <div class="selector-section">
                    <div class="column-title">元素组合分组</div>
                    <div class="column-list">${groupList}</div>
                </div>
            </div>
        `, [
            { text: '保存', class: 'btn-primary', action: () => this.applyLibrarySelection() },
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showQuickSwitchModal() {
        const combos = this.userData.quickSwitchCombos || [];
        if (combos.length === 0) {
            this.showToast('暂无保存的一键开关，请先保存当前选择');
            return;
        }
        const content = `<div class="quick-switch-list">${combos.map(c => {
            const libNames = (c.libraryIds || []).map(id => this.getLibraryById(id)).filter(Boolean).map(l => l.name);
            const elemGroupNames = (c.elementGroupIds || []).map(id => this.getElementGroupById(id)).filter(Boolean).map(g => g.name);
            const comboGroupNames = (c.combinationGroupIds || []).map(id => this.getGroupById(id)).filter(Boolean).map(g => g.name);
            const bindText = [libNames.length ? '词库: ' + libNames.join('、') : '', elemGroupNames.length ? '元素分组: ' + elemGroupNames.join('、') : '', comboGroupNames.length ? '组合分组: ' + comboGroupNames.join('、') : ''].filter(Boolean).join('；') || '未绑定';
            const bindEsc = (bindText || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            return `
            <div class="quick-switch-row">
                <div class="quick-switch-item-wrap">
                    <button type="button" class="btn quick-switch-item" data-id="${c.id}">${(c.name || '').replace(/</g, '&lt;')}</button>
                    <div class="quick-switch-binding text-muted small">${bindEsc}</div>
                </div>
                <div class="quick-switch-row-actions">
                    <button type="button" class="btn btn-sm btn-secondary quick-switch-overwrite" data-id="${c.id}">覆盖</button>
                    <button type="button" class="btn btn-sm btn-danger quick-switch-delete" data-id="${c.id}">删除</button>
                </div>
            </div>
        `;
        }).join('')}</div>`;
        const modal = this.createModal('一键开关', content, [{ text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }]);
        modal.querySelectorAll('.quick-switch-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = combos.find(x => x.id === btn.dataset.id);
                if (c) {
                    this.selectedLibraries = (c.libraryIds || []).filter(id => this.getLibraryById(id));
                    this.selectedElementGroups = (c.elementGroupIds || []).filter(id => this.getElementGroupById(id));
                    this.selectedGroups = (c.combinationGroupIds || []).filter(id => this.getGroupById(id));
                    if (c.emojiFilter) {
                        this.userData.settings.emojiSelectedCategoryIds = Array.isArray(c.emojiFilter.categoryIds) ? [...c.emojiFilter.categoryIds] : [];
                        this.userData.settings.hideInsectsExceptButterfly = !!c.emojiFilter.hideInsects;
                        this.saveUserData();
                    }
                    this.renderLibrarySelector();
                    this.closeModal();
                    this.showToast('已切换');
                }
            });
        });
        modal.querySelectorAll('.quick-switch-overwrite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const c = combos.find(x => x.id === btn.dataset.id);
                if (c) {
                    c.libraryIds = [...this.selectedLibraries];
                    c.elementGroupIds = [...(this.selectedElementGroups || [])];
                    c.combinationGroupIds = [...this.selectedGroups];
                    c.emojiFilter = {
                        categoryIds: [...(this.userData.settings.emojiSelectedCategoryIds || [])],
                        hideInsects: !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly)
                    };
                    this.saveUserData();
                    this.showToast('已覆盖');
                }
            });
        });
        modal.querySelectorAll('.quick-switch-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const c = combos.find(x => x.id === id);
                if (!c) return;
                this.showConfirmModal(`确定删除一键开关「${c.name}」吗？`, () => {
                    this.userData.quickSwitchCombos = (this.userData.quickSwitchCombos || []).filter(x => x.id !== id);
                    this.saveUserData();
                    this.closeModal();
                    this.showQuickSwitchModal();
                });
            });
        });
    }

    renderLibrarySelectorContent() {}

    applyLibrarySelection() {
        this.selectedLibraries = Array.from(document.querySelectorAll('.lib-cb:checked')).map(cb => cb.value);
        this.selectedElementGroups = Array.from(document.querySelectorAll('.element-group-cb:checked')).map(cb => cb.value);
        this.selectedGroups = Array.from(document.querySelectorAll('.group-cb:checked')).map(cb => cb.value);
        if (!this.userData.settings) this.userData.settings = {};
        this.userData.settings.lastSelectedLibraries = [...this.selectedLibraries];
        this.userData.settings.lastSelectedElementGroups = [...this.selectedElementGroups];
        this.userData.settings.lastSelectedGroups = [...this.selectedGroups];
        this.saveUserData();
        this.closeModal();
        this.renderLibrarySelector();
    }

    // 渲染侧边栏内容（默认收藏夹：元素和元素组合各一个）
    renderSidebar() {
        const favElementId = this.userData.settings.defaultFavoriteElementGroupId;
        const favComboId = this.userData.settings.defaultFavoriteCombinationGroupId;

        const defaultFavElementSelect = document.getElementById('default-favorite-element-select');
        if (defaultFavElementSelect) {
            const opts = (this.userData.elementGroups || []).map(g =>
                `<option value="${g.bindingId}" ${g.bindingId === favElementId ? 'selected' : ''}>${g.name}</option>`
            ).join('');
            defaultFavElementSelect.innerHTML = opts || '<option value="">无</option>';
            defaultFavElementSelect.value = favElementId || '';
            defaultFavElementSelect.onchange = () => {
                const newId = defaultFavElementSelect.value || null;
                this.userData.settings.defaultFavoriteElementGroupId = newId;
                if (newId) {
                    const arr = this.userData.elementGroups || [];
                    const idx = arr.findIndex(g => g.bindingId === newId);
                    if (idx > 0) {
                        const [g] = arr.splice(idx, 1);
                        arr.unshift(g);
                    }
                }
                this.saveUserData();
                this.renderSidebar();
                this.showToast('已更换默认元素收藏夹');
            };
        }
        const defaultFavComboSelect = document.getElementById('default-favorite-combination-select');
        if (defaultFavComboSelect) {
            const opts = (this.userData.combinationGroups || []).map(g =>
                `<option value="${g.bindingId}" ${g.bindingId === favComboId ? 'selected' : ''}>${g.name}</option>`
            ).join('');
            defaultFavComboSelect.innerHTML = opts || '<option value="">无</option>';
            defaultFavComboSelect.value = favComboId || '';
            defaultFavComboSelect.onchange = () => {
                const newId = defaultFavComboSelect.value || null;
                this.userData.settings.defaultFavoriteCombinationGroupId = newId;
                if (newId) {
                    const arr = this.userData.combinationGroups || [];
                    const idx = arr.findIndex(g => g.bindingId === newId);
                    if (idx > 0) {
                        const [g] = arr.splice(idx, 1);
                        arr.unshift(g);
                    }
                }
                this.saveUserData();
                this.renderSidebar();
                this.showToast('已更换默认组合收藏夹');
            };
        }

        const librariesList = document.getElementById('libraries-list');
        librariesList.dataset.listType = 'libraries';

        // 词库列表（收藏夹已改为分组，词库不再显示星标；双盲词库隐藏不展示）
        librariesList.innerHTML = '';
        this.userData.libraries.forEach(library => {
            if (library.isFavorites) return;
            if (library.bindingId === DOUBLEBLIND_LIBRARY_ID) return;
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.dataset.id = library.bindingId;
            if (library.isSystem) item.dataset.system = 'true';
            item.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${library.name}</span>
                    <span class="item-count">${library.elementIds ? library.elementIds.length : 0}个元素</span>
                </div>
                <div class="item-actions">
                    <button class="action-btn-sm" onclick="window.app.editLibrary('${library.bindingId}')">编辑</button>
                    ${!library.isSystem && library.bindingId !== EMOJI_LIBRARY_ID && library.name !== 'Emoji词库' ? `<button class="action-btn-sm" onclick="window.app.showAddToLibraryModal('${library.bindingId}')">增加</button><button class="action-btn-sm delete" onclick="window.app.deleteLibrary('${library.bindingId}')">删除</button>` : ''}
                </div>
            `;
            librariesList.appendChild(item);
        });
        this._attachSidebarListDrag(librariesList, 'libraries');

        // 两个版块：词语组（元素默认收藏夹用⭐）、元素组合的组（组合默认收藏夹用❤）
        const elementGroupsList = document.getElementById('element-groups-list');
        const combinationGroupsList = document.getElementById('combination-groups-list');
        if (elementGroupsList) {
            elementGroupsList.dataset.listType = 'elementGroups';
            elementGroupsList.innerHTML = '';
            const sortedElementGroups = [...(this.userData.elementGroups || [])].sort((a, b) => {
                if (a.bindingId === favElementId) return -1;
                if (b.bindingId === favElementId) return 1;
                return 0;
            });
            sortedElementGroups.forEach(group => {
                const isDefaultFav = favElementId === group.bindingId;
                const item = document.createElement('div');
                item.className = 'sidebar-item';
                item.dataset.id = group.bindingId;
                item.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${isDefaultFav ? '⭐ ' : ''}${group.name}</span>
                        <span class="item-count">${group.elementIds ? group.elementIds.length : 0}个元素</span>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn-sm" onclick="window.app.editElementGroup('${group.bindingId}')">编辑</button>
                        <button class="action-btn-sm delete" onclick="window.app.deleteElementGroup('${group.bindingId}')">删除</button>
                    </div>
                `;
                elementGroupsList.appendChild(item);
            });
            this._attachSidebarListDrag(elementGroupsList, 'elementGroups', favElementId);
        }
        if (combinationGroupsList) {
            combinationGroupsList.dataset.listType = 'combinationGroups';
            combinationGroupsList.innerHTML = '';
            const sortedComboGroups = [...(this.userData.combinationGroups || [])].sort((a, b) => {
                if (a.bindingId === favComboId) return -1;
                if (b.bindingId === favComboId) return 1;
                return 0;
            });
            sortedComboGroups.forEach(group => {
                const isDefaultFav = favComboId === group.bindingId;
                const item = document.createElement('div');
                item.className = 'sidebar-item';
                item.dataset.id = group.bindingId;
                item.innerHTML = `
                    <div class="item-info">
                        <span class="item-name">${isDefaultFav ? '❤ ' : ''}${group.name}</span>
                        <span class="item-count">${group.combinationIds ? group.combinationIds.length : 0}个组合</span>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn-sm" onclick="window.app.editGroup('${group.bindingId}')">编辑</button>
                        <button class="action-btn-sm delete" onclick="window.app.deleteGroup('${group.bindingId}')">删除</button>
                    </div>
                `;
                combinationGroupsList.appendChild(item);
            });
            this._attachSidebarListDrag(combinationGroupsList, 'combinationGroups', favComboId);
        }
    }

    _attachSidebarListDrag(containerEl, listKey, sortFirstId = null) {
        // 按你的要求：完全关闭侧边栏拖拽功能。
        // 保留空实现以兼容现有调用，但不再绑定任何事件。
        return;
    }

    renderLibrarySelector() {
        const selectedItems = document.getElementById('selected-items');
        if (!selectedItems) return;
        selectedItems.innerHTML = '';

        this.selectedLibraries.forEach(libraryId => {
            const library = this.getLibraryById(libraryId);
            if (library) {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `<span>${library.name}</span><button class="remove-btn" data-type="library" data-id="${libraryId}">×</button>`;
                selectedItems.appendChild(item);
            }
        });
        this.selectedElementGroups.forEach(groupId => {
            const group = this.getElementGroupById(groupId);
            if (group) {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `<span>${group.name}</span><button class="remove-btn" data-type="elementGroup" data-id="${groupId}">×</button>`;
                selectedItems.appendChild(item);
            }
        });
        this.selectedGroups.forEach(groupId => {
            const group = this.getGroupById(groupId);
            if (group) {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `<span>${group.name}</span><button class="remove-btn" data-type="group" data-id="${groupId}">×</button>`;
                selectedItems.appendChild(item);
            }
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type, id = btn.dataset.id;
                if (type === 'library') this.selectedLibraries = this.selectedLibraries.filter(lid => lid !== id);
                else if (type === 'elementGroup') this.selectedElementGroups = this.selectedElementGroups.filter(gid => gid !== id);
                else if (type === 'group') this.selectedGroups = this.selectedGroups.filter(gid => gid !== id);
                if (!this.userData.settings) this.userData.settings = {};
                this.userData.settings.lastSelectedLibraries = [...this.selectedLibraries];
                this.userData.settings.lastSelectedElementGroups = [...(this.selectedElementGroups || [])];
                this.userData.settings.lastSelectedGroups = [...(this.selectedGroups || [])];
                this.saveUserData();
                this.renderLibrarySelector();
            });
        });

        const sysOptRow = document.getElementById('system-options-row');
        const systemLib = this.userData.libraries.find(l => l.isSystem);
        if (sysOptRow && systemLib && this.selectedLibraries.includes(systemLib.bindingId)) {
            sysOptRow.classList.remove('hidden');
            if (systemLib.settings) {
                const optCommon = document.getElementById('opt-common');
                const optSecond = document.getElementById('opt-second-common');
                const optNegative = document.getElementById('opt-negative');
                if (optSecond && systemLib.settings.showSecondCommon) {
                    systemLib.settings.showCommon = true;
                }
                if (optCommon) optCommon.checked = systemLib.settings.showCommon;
                if (optSecond) optSecond.checked = systemLib.settings.showSecondCommon;
                if (optNegative) optNegative.checked = systemLib.settings.showNegative;
                if (optCommon) optCommon.disabled = !!(optSecond && optSecond.checked);
                if (optCommon) {
                    optCommon.onchange = () => {
                        if (optSecond && optSecond.checked && !optCommon.checked) {
                            optCommon.checked = true;
                            return;
                        }
                        systemLib.settings.showCommon = optCommon.checked;
                        this.saveUserData();
                    };
                }
                if (optSecond) {
                    optSecond.onchange = () => {
                        systemLib.settings.showSecondCommon = optSecond.checked;
                        if (optSecond.checked) {
                            systemLib.settings.showCommon = true;
                            if (optCommon) { optCommon.checked = true; optCommon.disabled = true; }
                        } else {
                            if (optCommon) optCommon.disabled = false;
                        }
                        this.saveUserData();
                    };
                }
                if (optNegative) {
                    optNegative.onchange = () => { systemLib.settings.showNegative = optNegative.checked; this.saveUserData(); };
                }
            }
        } else if (sysOptRow) {
            sysOptRow.classList.add('hidden');
        }

        const emojiOptRow = document.getElementById('emoji-options-row');
        const emojiLib = this.userData.libraries.find(l => l.bindingId === EMOJI_LIBRARY_ID);
        if (emojiOptRow && emojiLib && this.selectedLibraries.includes(emojiLib.bindingId)) {
            emojiOptRow.classList.remove('hidden');
            if (!Array.isArray(this.userData.settings.emojiSelectedCategoryIds) || this.userData.settings.emojiSelectedCategoryIds.length === 0) {
                this.userData.settings.emojiSelectedCategoryIds = EMOJI_CATEGORY_TREE.map(n => n.id);
            }
            const optHideInsects = document.getElementById('opt-emoji-hide-insects');
            if (optHideInsects) {
                optHideInsects.checked = !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly);
                optHideInsects.onchange = () => {
                    this.userData.settings.hideInsectsExceptButterfly = !!optHideInsects.checked;
                    this.saveUserData();
                };
            }
            const wrap = document.getElementById('emoji-category-filter-wrap');
            const treeEl = document.getElementById('emoji-category-tree');
            const toggleBtn = document.getElementById('emoji-category-toggle-btn');
            if (toggleBtn && wrap) {
                toggleBtn.onclick = () => {
                    const wasOpen = !wrap.classList.contains('hidden');
                    wrap.classList.toggle('hidden', wasOpen);
                    toggleBtn.textContent = wasOpen ? '▾ 收起分类' : '▸ 分类筛选';
                };
            }
            const selectedIds = () => this.userData.settings.emojiSelectedCategoryIds || [];
            const setSelectedIds = (arr) => { this.userData.settings.emojiSelectedCategoryIds = arr; this.saveUserData(); };
            const maps = _emojiCategoryMaps();
            const collectDescendantIds = (pid) => {
                const out = [pid];
                (maps.parentToChildren[pid] || []).forEach(cid => { out.push(...collectDescendantIds(cid)); });
                return out;
            };
            const allCategoryIds = getAllEmojiCategoryIds();
            const isAllCategoriesSelected = () => {
                const leafSet = new Set();
                selectedIds().forEach(id => { (maps.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
                return maps.leaves.length > 0 && maps.leaves.every(lid => leafSet.has(lid));
            };
            let refreshTree = () => {};
            const toggleAllBtn = document.getElementById('emoji-category-toggle-all');
            const updateToggleAllBtn = () => { if (toggleAllBtn) toggleAllBtn.textContent = isAllCategoriesSelected() ? '取消全选' : '全选'; };
            if (treeEl) {
                const renderTree = (nodes, depth = 0) => {
                    const leafSet = new Set();
                    selectedIds().forEach(id => { (maps.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
                    let html = '';
                    nodes.forEach(n => {
                        const hasChildren = n.children && n.children.length > 0;
                        const leaves = maps.nodeToLeafIds[n.id] || [n.id];
                        const checked = hasChildren ? leaves.every(lid => leafSet.has(lid)) : leafSet.has(n.id);
                        const someChildrenChecked = hasChildren && leaves.some(lid => leafSet.has(lid));
                        const indeterminate = hasChildren && someChildrenChecked && !checked;
                        const indent = depth ? ` style="margin-left: ${depth * 1.2}em"` : '';
                        if (hasChildren) {
                            html += `<div class="emoji-cat-group" data-id="${n.id}"><div class="emoji-cat-parent-row"><span class="emoji-cat-fold" title="收起/展开">▾</span><label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-cat-cb" data-id="${n.id}" data-has-children="true" ${checked ? 'checked' : ''} ${indeterminate ? 'data-indeterminate="true"' : ''}> ${n.label}</label></div><div class="emoji-cat-children">${renderTree(n.children, depth + 1)}</div></div>`;
                        } else {
                            html += `<label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-cat-cb" data-id="${n.id}" data-has-children="false" ${checked ? 'checked' : ''}> ${n.label}</label>`;
                        }
                    });
                    return html;
                };
                refreshTree = () => {
                    treeEl.innerHTML = renderTree(EMOJI_CATEGORY_TREE);
                    treeEl.querySelectorAll('.emoji-cat-fold').forEach(fold => {
                        fold.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const g = fold.closest('.emoji-cat-group'); if (g) g.classList.toggle('emoji-cat-group-collapsed'); fold.textContent = g.classList.contains('emoji-cat-group-collapsed') ? '▸' : '▾'; });
                    });
                    treeEl.querySelectorAll('.emoji-cat-cb').forEach(cb => {
                        cb.onchange = () => {
                            const id = cb.dataset.id;
                            const hasChildren = cb.dataset.hasChildren === 'true';
                            let arr = selectedIds().slice();
                            if (cb.checked) {
                                if (hasChildren) {
                                    collectDescendantIds(id).forEach(x => { if (!arr.includes(x)) arr.push(x); });
                                } else {
                                    if (!arr.includes(id)) arr.push(id);
                                }
                            } else {
                                if (hasChildren && maps.parentToChildren[id]) {
                                    const toRemove = new Set(collectDescendantIds(id));
                                    arr = arr.filter(x => !toRemove.has(x));
                                } else {
                                    const toRemove = new Set([id]);
                                    let pid = maps.childToParent[id];
                                    while (pid) { toRemove.add(pid); pid = maps.childToParent[pid]; }
                                    arr = arr.filter(x => !toRemove.has(x));
                                }
                            }
                            setSelectedIds(arr);
                            refreshTree();
                            updateToggleAllBtn();
                        };
                    });
                    treeEl.querySelectorAll('.emoji-cat-cb[data-indeterminate="true"]').forEach(cb => { cb.indeterminate = true; });
                    updateToggleAllBtn();
                };
                refreshTree();
            }
            toggleAllBtn?.addEventListener('click', () => {
                if (isAllCategoriesSelected()) setSelectedIds([]);
                else setSelectedIds([...allCategoryIds]);
                refreshTree();
                updateToggleAllBtn();
            });
        } else if (emojiOptRow) {
            emojiOptRow.classList.add('hidden');
        }

        document.getElementById('quick-switch-btn').onclick = () => this.showQuickSwitchModal();
    }

    // 模态框系统（栈：关闭返回上一个）。onRequestClose：点击 X 或遮罩时调用，可在此做未保存确认再 closeModal
    createModal(title, content, buttons = [], onClose = null, onRequestClose = null) {
        const modalContainer = document.getElementById('modal-container');
        const prevModals = modalContainer.querySelectorAll('.modal');
        prevModals.forEach(m => m.classList.add('modal-stack-hidden'));

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn modal-close">&times;</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
            <div class="modal-footer">
                ${buttons.map(btn => `<button class="btn ${btn.class}">${btn.text}</button>`).join('')}
            </div>
        `;

        modalContainer.appendChild(modal);
        modalContainer.classList.remove('hidden');

        const doClose = () => {
            if (typeof onRequestClose === 'function') onRequestClose();
            else this.closeModal();
        };

        const buttonElements = modal.querySelectorAll('.modal-footer .btn');
        buttons.forEach((btn, index) => {
            if (buttonElements[index] && btn.action) {
                buttonElements[index].addEventListener('click', btn.action);
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => doClose());

        const boundBackdrop = (e) => {
            if (e.target === modalContainer && e.target.lastElementChild === modal) {
                doClose();
                modalContainer.removeEventListener('click', boundBackdrop);
            }
        };
        modalContainer.addEventListener('click', boundBackdrop);

        if (onClose) modal._onClose = onClose;
        return modal;
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        const modals = modalContainer.querySelectorAll('.modal');
        if (modals.length === 0) {
            modalContainer.classList.add('hidden');
            return;
        }
        const top = modals[modals.length - 1];
        if (top._onClose) { try { top._onClose(); } catch (e) {} }
        top.remove();
        if (modals.length > 1) {
            modals[modals.length - 2].classList.remove('modal-stack-hidden');
        } else {
            modalContainer.classList.add('hidden');
        }
    }

    showConfirmModal(message, onConfirm, onCancel) {
        const modal = this.createModal('确认', `<p>${message}</p>`, [
            { text: '确定', class: 'btn-primary', action: () => { this.closeModal(); if (onConfirm) onConfirm(); } },
            { text: '取消', class: 'btn-secondary', action: () => { this.closeModal(); if (onCancel) onCancel(); } }
        ]);
    }

    showHistoryModal() {
        const list = (this.generationHistory || []).slice().reverse();
        const content = `
            <div class="history-list-area">
                ${list.length === 0 ? '<p class="text-muted">暂无历史记录</p>' : `
                <div class="history-pagination-bar">
                    <label>每页</label>
                    <select id="history-page-size" class="history-page-size">
                        <option value="10">10</option>
                        <option value="20" selected>20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <span>条</span>
                    <span class="history-page-info" id="history-page-info"></span>
                    <span class="history-jump-wrap">
                        <label>跳转</label>
                        <input type="number" id="history-page-jump" class="history-page-jump" min="1" placeholder="页" title="输入页码回车跳转">
                    </span>
                    <button type="button" class="btn-sm history-page-prev" id="history-page-prev">上一页</button>
                    <button type="button" class="btn-sm history-page-next" id="history-page-next">下一页</button>
                </div>
                <div id="history-entries-list" class="history-entries-list"></div>
                `}
            </div>
        `;
        const modal = this.createModal('生成历史', content, [
            { text: '清空历史', class: 'btn-secondary', action: () => {
                this.showConfirmModal('确定要清空所有历史记录吗？', () => {
                    this.generationHistory = [];
                    this.saveUserData();
                    this.closeModal();
                    this.showHistoryModal();
                    this.showToast('已清空历史');
                });
            }},
            { text: '关闭', class: 'btn-primary', action: () => this.closeModal() }
        ]);
        const container = modal.querySelector('#history-entries-list');
        if (!container || list.length === 0) return;

        let page = 1;
        let pageSize = 20;
        const pageSizeEl = modal.querySelector('#history-page-size');
        const pageInfoEl = modal.querySelector('#history-page-info');
        const prevBtn = modal.querySelector('#history-page-prev');
        const nextBtn = modal.querySelector('#history-page-next');

        // 按条展平：每条结果带所属的 次(entry) 与 realIdx，用于按条分页且一次可拆到多页
        const buildFlatList = () => {
            const flat = [];
            list.forEach((entry, i) => {
                const realIdx = this.generationHistory.length - 1 - i;
                (entry.results || []).forEach((r) => flat.push({ result: r, entry, realIdx }));
            });
            return flat;
        };

        const renderPage = () => {
            const flatList = buildFlatList();
            const totalItems = flatList.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            if (page > totalPages) page = Math.max(1, totalPages);
            const start = (page - 1) * pageSize;
            const pageItems = flatList.slice(start, start + pageSize);
            container.innerHTML = '';

            // 本页内按连续同一次分组，每组一个 block（标题 + 条）
            let groups = [];
            pageItems.forEach(({ result, entry, realIdx }) => {
                if (groups.length > 0 && groups[groups.length - 1].realIdx === realIdx)
                    groups[groups.length - 1].results.push(result);
                else
                    groups.push({ entry, realIdx, results: [result] });
            });

            groups.forEach(({ entry, realIdx, results: groupResults }) => {
                const block = document.createElement('div');
                block.className = 'history-entry-block';
                const ts = entry.timestamp != null ? new Date(entry.timestamp) : null;
                const timeStr = (ts && !isNaN(ts.getTime())) ? ts.toLocaleString('zh-CN') : '';
                const toolLabel = TOOL_NAMES[entry.tool] || entry.tool;
                const metaText = timeStr ? `${toolLabel} · ${timeStr}` : toolLabel;
                const head = document.createElement('div');
                head.className = 'history-entry-head';
                head.innerHTML = `<span class="history-entry-meta">${metaText}</span><button type="button" class="btn-sm history-entry-delete">删除</button>`;
                const resultsWrap = document.createElement('div');
                resultsWrap.className = 'history-entry-results';
                groupResults.forEach((r) => {
                    const el = this.createResultElement(r, false, { resultId: r.id, fromResults: true });
                    resultsWrap.appendChild(el);
                });
                block.appendChild(head);
                block.appendChild(resultsWrap);
                head.querySelector('.history-entry-delete').addEventListener('click', () => {
                    this.generationHistory.splice(realIdx, 1);
                    this.saveUserData();
                    list.length = 0;
                    list.push(...(this.generationHistory || []).slice().reverse());
                    const flat = buildFlatList();
                    const newTotalPages = Math.max(1, Math.ceil(flat.length / pageSize));
                    if (page > newTotalPages) page = Math.max(1, newTotalPages);
                    renderPage();
                    this.showToast('已删除');
                });
                container.appendChild(block);
            });

            if (pageInfoEl) pageInfoEl.textContent = totalItems > 0 ? `第 ${page} / ${totalPages} 页（共 ${totalItems} 条）` : '';
            if (prevBtn) prevBtn.disabled = page <= 1;
            if (nextBtn) nextBtn.disabled = page >= totalPages;
            const jumpInp = modal.querySelector('#history-page-jump');
            if (jumpInp) { jumpInp.min = '1'; jumpInp.max = String(totalPages); jumpInp.placeholder = totalPages > 0 ? `1-${totalPages}` : '页'; }
        };

        if (pageSizeEl) pageSizeEl.value = String(pageSize);
        pageSizeEl.addEventListener('change', () => {
            pageSize = parseInt(pageSizeEl.value, 10) || 20;
            page = 1;
            renderPage();
        });
        const jumpInput = modal.querySelector('#history-page-jump');
        if (jumpInput) {
            const doJump = () => {
                const flatList = buildFlatList();
                const totalPages = Math.max(1, Math.ceil(flatList.length / pageSize));
                const val = parseInt(jumpInput.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                    page = val;
                    renderPage();
                    jumpInput.value = '';
                }
            };
            jumpInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJump(); });
            jumpInput.addEventListener('change', doJump);
        }
        if (prevBtn) prevBtn.addEventListener('click', () => { if (page > 1) { page--; renderPage(); } });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            const flatList = buildFlatList();
            const totalPages = Math.max(1, Math.ceil(flatList.length / pageSize));
            if (page < totalPages) { page++; renderPage(); }
        });
        renderPage();
    }

    /** 清空本应用在浏览器 localStorage 中使用的所有 key（初始化时调用） */
    _clearAllAppLocalStorage() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key === 'inspiration_auth' || key === 'inspiration_user_data' || key === 'gacha_pity_count' || key.startsWith('daily_element_'))
                keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    }

    resetDataToDefault() {
        const systemLib = this.userData.libraries.find(l => l.isSystem);
        const keepBindingIds = systemLib ? [systemLib.bindingId] : [];
        // 只保留系统词库，清空所有其他词库（含双盲词库）
        this.userData.libraries = this.userData.libraries.filter(l => l === systemLib);
        this.userData.elements = this.userData.elements.filter(el =>
            (el.libraryIds || []).some(lid => keepBindingIds.includes(lid))
        );
        this.userData.elements.forEach(el => {
            el.elementGroupIds = [];
            el.combinationIds = [];
            el.isBlacklisted = false;
        });
        this.userData.systemElementOverrides = {};
        this.userData.blacklistedElementIds = [];
        this.userData.elementGroups = [{ id: DEFAULT_FAV_ELEMENT_GROUP_ID, bindingId: DEFAULT_FAV_ELEMENT_GROUP_ID, name: '默认元素收藏夹', elementIds: [] }];
        this.userData.combinationGroups = [{ id: DEFAULT_FAV_COMBO_GROUP_ID, bindingId: DEFAULT_FAV_COMBO_GROUP_ID, name: '默认组合收藏夹', combinationIds: [] }];
        this.userData.settings.defaultFavoriteElementGroupId = DEFAULT_FAV_ELEMENT_GROUP_ID;
        this.userData.settings.defaultFavoriteCombinationGroupId = DEFAULT_FAV_COMBO_GROUP_ID;
        this.userData.combinations = [];
        this.userData.quickSwitchCombos = [];
        this.userData.colorFavorites = [];
        this.userData.emojiOverrides = { deletedChars: [], blacklistedChars: [] };
        this.userData.settings.hideInsectsExceptButterfly = false;
        this.userData.settings.emojiSelectedCategoryIds = getAllEmojiCategoryIds();
        this.userData.settings.toolParams = {}; // 清空各工具参数（双盲聊天、卷轴诗、十四行诗等）
        this.userData.settings.lastSelectedLibraries = systemLib ? [systemLib.bindingId] : [];
        this.userData.settings.lastSelectedElementGroups = [];
        this.userData.settings.lastSelectedGroups = [];
        this.toolResults = {};
        this.generationHistory = [];
        this.selectedLibraries = systemLib ? [systemLib.bindingId] : [];
        this.selectedElementGroups = [];
        this.selectedGroups = [];
        this.initializeSystemData();
        this._clearAllAppLocalStorage(); // 清空浏览器里本应用所有保存项（口令、每日一签、抽卡保底等）
        this.saveUserData();            // 再写入初始化后的数据
        // 若当前在双盲页，清空内存中的聊天状态并重绘，否则界面仍显示旧记录且下次保存会写回
        if (this.currentTool === 'doubleblind' && this.doubleblindState) {
            this.doubleblindState.messages = [];
            this.renderDoubleBlind();
        }
        this.showToast('已一键初始化');
        document.getElementById('settings-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        this.renderSidebar();
        this.renderLibrarySelector();
        this.refreshResultsArea();
    }

    showPromptModal(title, placeholder, onSubmit) {
        const id = 'prompt-input-' + Date.now();
        const content = `<input type="text" id="${id}" class="form-control" placeholder="${placeholder || ''}" style="width:100%;padding:0.5rem;">`;
        const modal = this.createModal(title, content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const val = document.getElementById(id) && document.getElementById(id).value;
                this.closeModal();
                if (onSubmit && val != null) onSubmit(val.trim());
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 100);
    }

    showElementModal(elements) {
        if (!elements || elements.length === 0) return;
        if (elements.length === 1) {
            this.showElementModalById(elements[0].id);
            return;
        }
        this.showEditCombinationModal(null, elements.map(e => e.id), false);
    }

    getElementLibraries(element) {
        return (element.libraryIds || []).map(lid => this.getLibraryById(lid)).filter(Boolean).map(l => l.name);
    }

    getElementGroupNames(element) {
        return (element.elementGroupIds || []).map(gid => this.getElementGroupById(gid)).filter(Boolean).map(g => g.name);
    }

    getCombinationGroupNames(combo) {
        if (!combo) return [];
        const fromGroups = (this.userData.combinationGroups || [])
            .filter(g => (g.combinationIds || []).includes(combo.id))
            .map(g => g.name);
        const fromSelf = (combo.combinationGroupIds || [])
            .map(gid => this.getGroupById(gid)).filter(Boolean).map(g => g.name);
        return [...new Set([...fromGroups, ...fromSelf])];
    }

    getElementCombinations(element) {
        return (element.combinationIds || []).map(cid => this.getCombinationById(cid)).filter(Boolean).map(c => '组合 ' + (c.id || '').slice(-6));
    }

    getFavoriteElementGroup() {
        const id = this.userData.settings.defaultFavoriteElementGroupId;
        if (!id) return null;
        return this.getElementGroupById(id) || null;
    }

    getFavoriteCombinationGroup() {
        const id = this.userData.settings.defaultFavoriteCombinationGroupId;
        if (!id) return null;
        return this.getGroupById(id) || null;
    }

    _isComboInFav(comboId, elementIds) {
        const g = this.getFavoriteCombinationGroup();
        if (!g || !(g.combinationIds || []).length) return false;
        if (comboId) return g.combinationIds.includes(comboId);
        const setA = new Set(elementIds || []);
        return (g.combinationIds || []).some(cid => {
            const c = this.getCombinationById(cid);
            if (!c || !c.elementIds) return false;
            if (c.elementIds.length !== setA.size) return false;
            return c.elementIds.every(id => setA.has(id));
        });
    }

    /** 按元素 id 集合查找已有组合（同一组元素只对应一个 combo，不重复创建） */
    _findComboByElementIds(elementIds) {
        if (!elementIds || !elementIds.length) return null;
        const setA = new Set(elementIds);
        const list = this.userData.combinations || [];
        return list.find(c => {
            if (!c || !c.elementIds) return false;
            if (c.elementIds.length !== setA.size) return false;
            return c.elementIds.every(id => setA.has(id));
        }) || null;
    }

    _quickFavCombo(comboId, elementIds) {
        const g = this.getFavoriteCombinationGroup();
        if (!g) { this.showToast('请先在侧边栏选择默认组合收藏夹'); return; }
        if (!elementIds || elementIds.length === 0) { this.showToast('无元素可收藏'); return; }
        const alreadyInFav = this._isComboInFav(comboId, elementIds);
                if (alreadyInFav) {
                    if (comboId) {
                        const c = this.getCombinationById(comboId);
                        if (c) {
                            g.combinationIds = (g.combinationIds || []).filter(id => id !== c.id);
                            if (c.combinationGroupIds) c.combinationGroupIds = c.combinationGroupIds.filter(id => id !== g.bindingId);
                        }
                    } else {
                        const setA = new Set(elementIds);
                        const foundId = (g.combinationIds || []).find(cid => {
                            const c = this.getCombinationById(cid);
                            return c && c.elementIds && c.elementIds.length === setA.size && c.elementIds.every(id => setA.has(id));
                        });
                        if (foundId) {
                            g.combinationIds = (g.combinationIds || []).filter(id => id !== foundId);
                            const c = this.getCombinationById(foundId);
                            if (c && c.combinationGroupIds) c.combinationGroupIds = c.combinationGroupIds.filter(id => id !== g.bindingId);
                        }
                    }
                    g.id = this.generateId();
                    this.saveUserData();
                    this.renderSidebar();
                    this.showToast('已取消收藏');
                    return;
                }
        let c;
        if (comboId) {
            c = this.getCombinationById(comboId);
            if (!c) return;
        } else {
            c = this._findComboByElementIds(elementIds);
            if (!c) {
                c = { id: this.generateId(), elementIds: [...elementIds], combinationGroupIds: [g.bindingId], isBlacklisted: false };
                this.userData.combinations.push(c);
                elementIds.forEach(eid => {
                    const el = this.getElementById(eid);
                    if (el) { el.combinationIds = el.combinationIds || []; el.combinationIds.push(c.id); }
                });
            } else {
                c.combinationGroupIds = c.combinationGroupIds || [];
                if (!c.combinationGroupIds.includes(g.bindingId)) c.combinationGroupIds.push(g.bindingId);
            }
        }
        g.combinationIds = g.combinationIds || [];
        if (!g.combinationIds.includes(c.id)) { g.combinationIds.push(c.id); c.combinationGroupIds = c.combinationGroupIds || []; if (!c.combinationGroupIds.includes(g.bindingId)) c.combinationGroupIds.push(g.bindingId); }
        g.id = this.generateId();
        this.saveUserData();
        this.renderSidebar();
        this.showToast('已加入「' + (g && g.name ? g.name : '默认组合收藏夹') + '」');
    }

    _quickBlacklistIds(elementIds) {
        if (!elementIds || elementIds.length === 0) return;
        const arr = this.userData.blacklistedElementIds || [];
        let count = 0;
        elementIds.forEach(eid => {
            const el = this.getElementById(eid);
            if (el && !el.isBlacklisted) { el.isBlacklisted = true; if (!arr.includes(eid)) arr.push(eid); count++; }
        });
        this.userData.blacklistedElementIds = arr;
        this.saveUserData();
        this.showToast(count ? `已拉黑 ${count} 个元素` : '当前元素已在黑名单中');
    }

    _quickUnblacklistIds(elementIds) {
        if (!elementIds || elementIds.length === 0) return;
        const arr = this.userData.blacklistedElementIds || [];
        let count = 0;
        elementIds.forEach(eid => {
            const el = this.getElementById(eid);
            if (el && el.isBlacklisted) { el.isBlacklisted = false; const idx = arr.indexOf(eid); if (idx !== -1) arr.splice(idx, 1); count++; }
        });
        this.userData.blacklistedElementIds = arr.filter(id => this.getElementById(id) && this.getElementById(id).isBlacklisted);
        this.saveUserData();
        this.showToast(count ? `已取消拉黑 ${count} 个元素` : '已取消');
    }

    /** 刷新某条结果行的快捷收藏/拉黑按钮文字（弹窗关闭后或数据变更后调用） */
    _updateResultRowQuickButtons(resultId, tool) {
        if (!resultId || tool == null) return;
        const wrap = document.querySelector(`[data-result-id="${resultId}"]`);
        if (!wrap) return;
        const results = this.toolResults[tool];
        const result = results && results.find(r => r.id === resultId);
        if (!result || (result.type !== 'combination' && result.type !== 'existing_combination' && result.type !== 'combo_by_source')) return;
        const ids = result.type === 'existing_combination'
            ? (result.combination && result.combination.elementIds) || []
            : result.type === 'combo_by_source'
                ? (result.elements && result.elements.map(e => e.id)) || []
                : (result.elements && result.elements.map(e => e.id)) || [];
        const comboId = result.type === 'existing_combination' && result.combination ? result.combination.id : null;
        const favBtn = wrap.querySelector('.result-quick-fav');
        const blackBtn = wrap.querySelector('.result-quick-blacklist');
        if (favBtn) favBtn.textContent = this._isComboInFav(comboId, ids) ? '已收藏' : '收藏';
        if (blackBtn) blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
    }

    isElementFavorited(element) {
        const g = this.getFavoriteElementGroup();
        if (!g) return false;
        return (g.elementIds || []).includes(element.id) || (element.elementGroupIds || []).includes(g.bindingId);
    }

    toggleElementFavorite(element) {
        const g = this.getFavoriteElementGroup();
        if (!g) {
            this.showToast('请先在侧边栏选择默认元素收藏夹');
            return;
        }
        const id = element.id;
        const idx = (g.elementIds || []).indexOf(id);
        if (!element.elementGroupIds) element.elementGroupIds = [];
        if (idx >= 0) {
            g.elementIds.splice(idx, 1);
            const i2 = element.elementGroupIds.indexOf(g.bindingId);
            if (i2 >= 0) element.elementGroupIds.splice(i2, 1);
        } else {
            if (!g.elementIds) g.elementIds = [];
            g.elementIds.push(id);
            if (!element.elementGroupIds.includes(g.bindingId)) element.elementGroupIds.push(g.bindingId);
        }
        g.id = this.generateId();
        this.saveUserData();
        this.renderSidebar();
    }

    showElementModalById(elementId) {
        this._invalidateElementMap();
        const element = this.getElementById(elementId);
        if (!element) return;
        const libNames = this.getElementLibraries(element);
        const groupNames = this.getElementGroupNames(element);
        const systemLib = this.userData.libraries.find(l => l.isSystem);
        const isSystemElement = systemLib && (systemLib.elementIds || []).includes(element.id);
        const tagRow = isSystemElement ? `
            <div class="element-tags-row">
                <span class="element-tags-label">标签：</span>
                <button type="button" class="btn btn-tag-inline ${element.common ? 'on' : ''}" data-key="common">常见</button>
                <button type="button" class="btn btn-tag-inline ${element.secondCommon ? 'on' : ''}" data-key="secondCommon">次常见</button>
                <button type="button" class="btn btn-tag-inline ${element.negative ? 'on' : ''}" data-key="negative">负面</button>
            </div>
        ` : '';
        const content = `
            <div class="element-detail">
                <h4 class="element-detail-title copyable-title">${element.name}</h4>
                <div class="element-detail-row">
                    <span class="element-detail-label">所属词库：</span>
                    <span class="element-detail-value">${libNames.length ? libNames.join('、') : '无'}</span>
                    <button type="button" class="btn btn-sm elem-edit-libs-btn" id="elem-edit-libs-btn">编辑</button>
                </div>
                <div class="element-detail-row">
                    <span class="element-detail-label">所属分组：</span>
                    <span class="element-detail-value">${groupNames.length ? groupNames.join('、') : '无'}</span>
                    <button type="button" class="btn btn-sm elem-edit-groups-btn" id="elem-edit-groups-btn">编辑</button>
                </div>
                ${tagRow}
            </div>
        `;
        const modal = this.createModal('元素', content, [
            { text: this.isElementFavorited(element) ? '已收藏' : '收藏', class: 'btn-primary', action: () => {
                this.toggleElementFavorite(element);
                this._invalidateElementMap();
                const el = this.getElementById(elementId);
                const favBtn = modal.querySelectorAll('.modal-footer .btn')[0];
                if (favBtn) { favBtn.textContent = this.isElementFavorited(el) ? '已收藏' : '收藏'; favBtn.className = 'btn btn-primary'; }
                const groupRow = modal.querySelectorAll('.element-detail-row')[1];
                if (groupRow) {
                    const valueSpan = groupRow.querySelector('.element-detail-value');
                    if (valueSpan) valueSpan.textContent = this.getElementGroupNames(el).length ? this.getElementGroupNames(el).join('、') : '无';
                }
                const eg = this.getFavoriteElementGroup();
                this.showToast(this.isElementFavorited(el) ? ('已加入「' + (eg && eg.name ? eg.name : '默认元素收藏夹') + '」') : '已取消收藏');
            }},
            { text: element.isBlacklisted ? '已拉黑' : '拉黑', class: 'btn-primary', action: () => {
                this.toggleElementBlacklist(element.id);
                const el = this.getElementById(element.id);
                const blackBtn = modal.querySelectorAll('.modal-footer .btn')[1];
                if (blackBtn) { blackBtn.textContent = el.isBlacklisted ? '已拉黑' : '拉黑'; blackBtn.className = 'btn btn-primary'; }
                this.showToast(el.isBlacklisted ? '已拉黑' : '已取消拉黑');
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        modal.querySelector('#elem-edit-libs-btn').addEventListener('click', () => { this.closeModal(); this.showEditElementLibrariesModal(elementId); });
        modal.querySelector('#elem-edit-groups-btn').addEventListener('click', () => { this.closeModal(); this.showEditElementGroupsModal(elementId); });
        const titleEl = modal.querySelector('.element-detail-title');
        if (titleEl) titleEl.addEventListener('click', () => {
            const text = element.name;
            if (text && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => this.showToast('已复制'));
            }
        });
        if (titleEl) titleEl.style.cursor = 'pointer';
        if (titleEl) titleEl.title = '点击复制';
        if (isSystemElement) {
            modal.querySelectorAll('.btn-tag-inline').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    element[key] = !element[key];
                    this.saveUserData();
                    btn.classList.toggle('on', element[key]);
                });
            });
        }
    }

    showEditElementLibrariesModal(elementId) {
        const element = this.getElementById(elementId);
        if (!element) return;
        const allLibs = this.userData.libraries;
        const content = `
            <p>勾选要加入的词库（系统词库固定）：</p>
            <div class="checkbox-list">
                ${allLibs.map(lib => {
                    const checked = (element.libraryIds || []).includes(lib.bindingId);
                    const isSystem = !!lib.isSystem;
                    return `<label class="${isSystem ? 'lib-cb-system' : ''}"><input type="checkbox" class="lib-cb" data-id="${lib.bindingId}" ${checked ? 'checked' : ''} ${isSystem ? 'disabled' : ''}> ${lib.name}${isSystem ? '（系统）' : ''}</label>`;
                }).join('')}
            </div>
        `;
        this.createModal('所属词库', content, [
            { text: '保存', class: 'btn-primary', action: () => {
                const checked = Array.from(document.querySelectorAll('.lib-cb:not(:disabled):checked')).map(cb => cb.dataset.id);
                const systemLib = allLibs.find(l => l.isSystem);
                if (systemLib && (element.libraryIds || []).includes(systemLib.bindingId)) checked.push(systemLib.bindingId);
                allLibs.forEach(lib => {
                    const inLib = (lib.elementIds || []).includes(elementId);
                    const want = checked.includes(lib.bindingId);
                    if (lib.isSystem) return;
                    if (!inLib && want) {
                        lib.elementIds = lib.elementIds || [];
                        lib.elementIds.push(elementId);
                        element.libraryIds = element.libraryIds || [];
                        if (!element.libraryIds.includes(lib.bindingId)) element.libraryIds.push(lib.bindingId);
                    } else if (inLib && !want) {
                        if (lib.bindingId === EMOJI_LIBRARY_ID && element.name) {
                            const ov = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
                            ov.deletedChars = ov.deletedChars || [];
                            if (!ov.deletedChars.includes(element.name)) ov.deletedChars.push(element.name);
                        }
                        lib.elementIds = lib.elementIds.filter(id => id !== elementId);
                        element.libraryIds = (element.libraryIds || []).filter(id => id !== lib.bindingId);
                    }
                });
                this.saveUserData();
                this.renderSidebar();
                this.renderLibrarySelector();
                this.closeModal();
                this.showElementModalById(elementId);
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showEditElementGroupsModal(elementId) {
        const element = this.getElementById(elementId);
        if (!element) return;
        const groups = this.userData.elementGroups || [];
        const content = `
            <p>勾选要加入的元素分组：</p>
            <div class="checkbox-list">
                ${groups.map(g => {
                    const checked = (element.elementGroupIds || []).includes(g.bindingId);
                    return `<label><input type="checkbox" class="eg-cb" data-id="${g.bindingId}" ${checked ? 'checked' : ''}> ${g.name}</label>`;
                }).join('')}
            </div>
        `;
        this.createModal('所属分组', content, [
            { text: '保存', class: 'btn-primary', action: () => {
                const checked = Array.from(document.querySelectorAll('.eg-cb:checked')).map(cb => cb.dataset.id);
                groups.forEach(g => {
                    const inGroup = (g.elementIds || []).includes(elementId);
                    const want = checked.includes(g.bindingId);
                    if (!inGroup && want) {
                        g.elementIds = g.elementIds || [];
                        g.elementIds.push(elementId);
                        element.elementGroupIds = element.elementGroupIds || [];
                        if (!element.elementGroupIds.includes(g.bindingId)) element.elementGroupIds.push(g.bindingId);
                    } else if (inGroup && !want) {
                        g.elementIds = (g.elementIds || []).filter(id => id !== elementId);
                        element.elementGroupIds = (element.elementGroupIds || []).filter(id => id !== g.bindingId);
                    }
                });
                this.saveUserData();
                this.renderSidebar();
                this.renderLibrarySelector();
                this.closeModal();
                this.showElementModalById(elementId);
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showEditElementCombinationsModal(elementId) {
        const element = this.getElementById(elementId);
        if (!element) return;
        const combos = this.userData.combinations;
        const content = `
            <p>勾选要加入的元素组合：</p>
            <div class="checkbox-list">
                ${combos.map(c => {
                    const checked = (element.combinationIds || []).includes(c.id);
                    const names = this.getElementsByIds(c.elementIds || []).map(e => e.name).join(' + ');
                    return `<label><input type="checkbox" class="combo-cb" data-id="${c.id}" ${checked ? 'checked' : ''}> ${names || c.id}</label>`;
                }).join('')}
            </div>
        `;
        this.createModal('所属元素组合', content, [
            { text: '保存', class: 'btn-primary', action: () => {
                const checked = Array.from(document.querySelectorAll('.combo-cb:checked')).map(cb => cb.dataset.id);
                combos.forEach(c => {
                    const inCombo = (c.elementIds || []).includes(elementId);
                    const want = checked.includes(c.id);
                    if (!inCombo && want) {
                        c.elementIds = c.elementIds || [];
                        c.elementIds.push(elementId);
                        element.combinationIds = element.combinationIds || [];
                        if (!element.combinationIds.includes(c.id)) element.combinationIds.push(c.id);
                    } else if (inCombo && !want) {
                        c.elementIds = (c.elementIds || []).filter(id => id !== elementId);
                        element.combinationIds = (element.combinationIds || []).filter(id => id !== c.id);
                    }
                });
                this.saveUserData();
                this.closeModal();
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showEditCombinationGroupsModal(comboId, onAfterSave = null) {
        const combo = this.getCombinationById(comboId);
        if (!combo) return;
        const groups = this.userData.combinationGroups || [];
        const content = `
            <p>勾选要加入的元素组合分组：</p>
            <div class="checkbox-list">
                ${groups.map(g => {
                    const checked = (combo.combinationGroupIds || []).includes(g.bindingId);
                    return `<label><input type="checkbox" class="combo-group-cb" data-id="${g.bindingId}" ${checked ? 'checked' : ''}> ${g.name}</label>`;
                }).join('')}
            </div>
        `;
        this.createModal('所属分组（元素组合分组）', content, [
            { text: '保存', class: 'btn-primary', action: () => {
                const checked = Array.from(document.querySelectorAll('.combo-group-cb:checked')).map(cb => cb.dataset.id);
                groups.forEach(g => {
                    const inGroup = (g.combinationIds || []).includes(comboId);
                    const want = checked.includes(g.bindingId);
                    if (!inGroup && want) {
                        g.combinationIds = g.combinationIds || [];
                        g.combinationIds.push(comboId);
                        combo.combinationGroupIds = combo.combinationGroupIds || [];
                        if (!combo.combinationGroupIds.includes(g.bindingId)) combo.combinationGroupIds.push(g.bindingId);
                    } else if (inGroup && !want) {
                        g.combinationIds = (g.combinationIds || []).filter(id => id !== comboId);
                        combo.combinationGroupIds = (combo.combinationGroupIds || []).filter(id => id !== g.bindingId);
                    }
                });
                this.saveUserData();
                this.renderSidebar();
                this.closeModal();
                if (typeof onAfterSave === 'function') onAfterSave();
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showEditCombinationModal(combinationId, elementIds, fromResults = false, onResultUpdate = null, onModalClose = null) {
        const combo = combinationId ? this.getCombinationById(combinationId) : null;
        const ids = combo ? [...(combo.elementIds || [])] : [...(elementIds || [])];
        const initialGroupNames = this.getCombinationGroupNames(combo);
        const content = `
            <p>元素组合（点击元素编辑详情）：</p>
            <div id="combo-element-list" class="combo-element-list"></div>
            <div class="element-detail-row combo-groups-row" style="margin-top: 0.75rem;">
                <span class="element-detail-label">所属分组：</span>
                <span class="element-detail-value" id="combo-modal-group-names">${initialGroupNames.length ? initialGroupNames.join('、') : '无'}</span>
                <button type="button" class="btn btn-sm" id="combo-edit-groups-btn">编辑</button>
            </div>
        `;
        let initialIds = [...ids];
        const favGroup = this.getFavoriteCombinationGroup();
        const isFav = combo
            ? (favGroup && (favGroup.combinationIds || []).includes(combo.id))
            : (favGroup && this._isComboInFav(null, ids));
        let didFavOrBlacklist = false;
        const buttons = [
            { text: isFav ? '已收藏' : '收藏', class: 'btn-primary', action: () => {
                const g = this.getFavoriteCombinationGroup();
                if (!g) { this.showToast('请先在侧边栏选择默认组合收藏夹'); return; }
                const remainingIds = getRemainingIds();
                if (!remainingIds.length) { this.showToast('当前无元素'); return; }
                let c = currentCombo;
                const alreadyInFav = c ? (g.combinationIds || []).includes(c.id) : this._isComboInFav(null, remainingIds);
                if (alreadyInFav) {
                    if (c) {
                        g.combinationIds = (g.combinationIds || []).filter(id => id !== c.id);
                        if (c.combinationGroupIds) c.combinationGroupIds = c.combinationGroupIds.filter(id => id !== g.bindingId);
                    } else {
                        const setA = new Set(remainingIds);
                        const foundId = (g.combinationIds || []).find(cid => {
                            const x = this.getCombinationById(cid);
                            return x && x.elementIds && x.elementIds.length === setA.size && x.elementIds.every(id => setA.has(id));
                        });
                        if (foundId) {
                            g.combinationIds = (g.combinationIds || []).filter(id => id !== foundId);
                            const x = this.getCombinationById(foundId);
                            if (x && x.combinationGroupIds) x.combinationGroupIds = x.combinationGroupIds.filter(id => id !== g.bindingId);
                        }
                    }
                    didFavOrBlacklist = true;
                    g.id = this.generateId();
                    this.saveUserData();
                    this.renderSidebar();
                    this.showToast('已取消收藏');
                    updateFavButtonText();
                    return;
                }
                c = c || ensureComboExists();
                if (!c) return;
                g.combinationIds = g.combinationIds || [];
                g.combinationIds.push(c.id);
                c.combinationGroupIds = c.combinationGroupIds || [];
                if (!c.combinationGroupIds.includes(g.bindingId)) c.combinationGroupIds.push(g.bindingId);
                didFavOrBlacklist = true;
                g.id = this.generateId();
                this.saveUserData();
                this.renderSidebar();
                this.showToast('已加入「' + (g && g.name ? g.name : '默认组合收藏夹') + '」');
                updateFavButtonText();
            }},
            { text: '全部拉黑', class: 'btn-primary', action: () => {
                didFavOrBlacklist = true;
                const remainingIds = getRemainingIds();
                if (!remainingIds.length) { this.showToast('当前没有元素'); return; }
                const allBlacklisted = remainingIds.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                const arr = this.userData.blacklistedElementIds || [];
                if (allBlacklisted) {
                    let count = 0;
                    remainingIds.forEach(eid => {
                        const el = this.getElementById(eid);
                        if (el && el.isBlacklisted) { el.isBlacklisted = false; const idx = arr.indexOf(eid); if (idx !== -1) arr.splice(idx, 1); count++; }
                    });
                    this.userData.blacklistedElementIds = arr.filter(id => this.getElementById(id) && this.getElementById(id).isBlacklisted);
                    this.saveUserData();
                    this.showToast(count ? `已取消拉黑 ${count} 个元素` : '已取消');
                } else {
                    let count = 0;
                    remainingIds.forEach(eid => {
                        const el = this.getElementById(eid);
                        if (el && !el.isBlacklisted) { el.isBlacklisted = true; if (!arr.includes(eid)) arr.push(eid); count++; }
                    });
                    this.userData.blacklistedElementIds = arr;
                    this.saveUserData();
                    this.showToast(count ? `已拉黑 ${count} 个元素` : '当前元素已在黑名单中');
                }
                updateAllBlackButtonText();
            }},
            { text: '复制', class: 'btn-secondary', action: () => {
                const remainingIds = getRemainingIds();
                const text = remainingIds.map(eid => { const el = this.getElementById(eid); return el ? el.name : eid; }).join(' + ');
                if (!text) { this.showToast('当前无元素可复制'); return; }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => this.showToast('已复制到剪贴板')).catch(() => this.showToast('复制失败'));
                } else { this.showToast('复制失败'); }
            }},
        ];
        if (!fromResults) {
            buttons.push({ text: '保存', class: 'btn-primary', action: () => {
                const c = currentCombo;
                if (c) { syncListToCombo(c); }
                this.saveUserData();
                this.renderSidebar();
                this.showToast('已保存');
                this.closeModal();
            }});
        }
        buttons.push({ text: '取消', class: 'btn-secondary', action: () => {
            const current = getRemainingIds();
            const listChanged = current.length !== initialIds.length || current.some((id, i) => id !== initialIds[i]);
            const comboChanged = currentCombo !== combo;
            if ((listChanged || comboChanged) && !didFavOrBlacklist) {
                this.showConfirmModal('有更改且未收藏或拉黑，确定取消吗？', () => this.closeModal());
            } else {
                this.closeModal();
            }
        }});
        const modal = this.createModal('编辑组合', content, buttons, onModalClose);
        const listEl = modal.querySelector('#combo-element-list');
        let currentCombo = combo; // 未保存时先为 null，拉黑/收藏到时会创建并赋值
        const getRemainingIds = () => Array.from(listEl.querySelectorAll('.combo-element-row')).map(row => row.dataset.id).filter(Boolean);

        const updateComboGroupNamesRow = () => {
            const c = currentCombo || combo;
            const names = this.getCombinationGroupNames(c);
            const valueEl = modal.querySelector('#combo-modal-group-names');
            if (valueEl) valueEl.textContent = names.length ? names.join('、') : '无';
        };

        const updateFavButtonText = () => {
            const favBtn = modal.querySelectorAll('.modal-footer .btn')[0];
            if (!favBtn) return;
            const c = currentCombo;
            const g = this.getFavoriteCombinationGroup();
            const inFav = c
                ? (g && (g.combinationIds || []).includes(c.id))
                : (g && this._isComboInFav(null, getRemainingIds()));
            favBtn.textContent = inFav ? '已收藏' : '收藏';
            updateComboGroupNamesRow();
        };

        const updateAllBlackButtonText = () => {
            const allBlackBtn = modal.querySelectorAll('.modal-footer .btn')[1];
            if (!allBlackBtn) return;
            const remainingIds = getRemainingIds();
            if (!remainingIds.length) { allBlackBtn.textContent = '全部拉黑'; return; }
            const allBlacklisted = remainingIds.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
            allBlackBtn.textContent = allBlacklisted ? '取消全部拉黑' : '全部拉黑';
        };

        const syncListToCombo = (c) => {
            const remainingIds = getRemainingIds();
            c.elementIds = remainingIds;
            this.userData.elements.forEach(el => {
                const had = (el.combinationIds || []).includes(c.id);
                const has = remainingIds.includes(el.id);
                if (had && !has) el.combinationIds = (el.combinationIds || []).filter(id => id !== c.id);
                if (!had && has) { el.combinationIds = el.combinationIds || []; el.combinationIds.push(c.id); }
            });
            this.saveUserData();
        };

        const ensureComboExists = () => {
            if (currentCombo) {
                syncListToCombo(currentCombo);
                return currentCombo;
            }
            const remainingIds = getRemainingIds();
            const existing = this._findComboByElementIds(remainingIds);
            if (existing) {
                currentCombo = existing;
                return existing;
            }
            const newCombo = { id: this.generateId(), elementIds: remainingIds, combinationGroupIds: [], isBlacklisted: false };
            this.userData.combinations.push(newCombo);
            remainingIds.forEach(eid => {
                const el = this.getElementById(eid);
                if (el) { el.combinationIds = el.combinationIds || []; el.combinationIds.push(newCombo.id); }
            });
            this.saveUserData();
            currentCombo = newCombo;
            return newCombo;
        };

        const render = () => {
            listEl.innerHTML = ids.map(eid => {
                const el = this.getElementById(eid);
                const name = el ? el.name : eid;
                return `<div class="combo-element-row" data-id="${eid}"><span class="entry-chip clickable" data-id="${eid}">${name}</span> <button type="button" class="btn-sm remove-from-combo" data-id="${eid}">移除</button></div>`;
            }).join('');
            listEl.querySelectorAll('.clickable').forEach(n => n.addEventListener('click', () => this.showElementModalById(n.dataset.id)));
            listEl.querySelectorAll('.remove-from-combo').forEach(btn => btn.addEventListener('click', () => {
                ids.splice(ids.indexOf(btn.dataset.id), 1);
                render();
                const current = getRemainingIds();
                const listChanged = current.length !== initialIds.length || current.some((id, i) => id !== initialIds[i]);
                if (listChanged) {
                    if (!fromResults && currentCombo) {
                        // 从分组编辑打开：在原组合上就地修改，不新建
                        syncListToCombo(currentCombo);
                        initialIds = getRemainingIds().slice();
                    } else if (current.length > 0) {
                        // 从生成结果打开：视为新组合，新建 id
                        const newCombo = { id: this.generateId(), elementIds: [...current], combinationGroupIds: [], isBlacklisted: false };
                        this.userData.combinations.push(newCombo);
                        current.forEach(eid => {
                            const el = this.getElementById(eid);
                            if (el) { el.combinationIds = el.combinationIds || []; el.combinationIds.push(newCombo.id); }
                        });
                        currentCombo = newCombo;
                        this.saveUserData();
                        if (onResultUpdate) onResultUpdate(newCombo);
                    }
                }
                updateFavButtonText();
                updateAllBlackButtonText();
            }));
            updateFavButtonText();
            updateAllBlackButtonText();
        };
        render();
        const editGroupsBtn = modal.querySelector('#combo-edit-groups-btn');
        if (editGroupsBtn) {
            editGroupsBtn.addEventListener('click', () => {
                ensureComboExists();
                if (currentCombo) {
                    this.showEditCombinationGroupsModal(currentCombo.id, () => updateFavButtonText());
                } else {
                    this.showToast('请先保存或收藏以创建组合');
                }
            });
        }
    }

    showAddElementToComboPicker(currentIds, onAdd) {
        const all = this.userData.elements.filter(e => !e.isBlacklisted && !currentIds.includes(e.id));
        const content = `<div class="picker-list">${all.slice(0, 100).map(e => `<span class="entry-chip picker-item" data-id="${e.id}">${e.name}</span>`).join('')}</div>`;
        const m = this.createModal('选择元素', content, [{ text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }]);
        m.querySelectorAll('.picker-item').forEach(n => n.addEventListener('click', () => {
            currentIds.push(n.dataset.id);
            this.closeModal();
            if (onAdd) onAdd();
        }));
    }

    _rebuildEmojiLibraryFromOverrides() {
        if (!this.userData.emojiOverrides) this.userData.emojiOverrides = { deletedChars: [], blacklistedChars: [] };
        // 移除所有 emoji 元素（按 id 前缀），避免备份中混入的旧 emoji 元素残留；重建后 id 按当前规则生成
        this.userData.elements = (this.userData.elements || []).filter(e => !String(e.id).startsWith('emoji_'));
        const emojiLib = (this.userData.libraries || []).find(l => l.bindingId === EMOJI_LIBRARY_ID || l.isEmojiLibrary);
        if (!emojiLib) return;
        if (emojiLib.isEmojiLibrary) {
            emojiLib.isEmojiLibrary = undefined;
            emojiLib.bindingId = EMOJI_LIBRARY_ID;
            emojiLib.id = emojiLib.id || EMOJI_LIBRARY_ID;
        }
        const emojiEls = this.generateEmojiElements();
        const emojiIds = emojiEls.map(e => e.id);
        emojiEls.forEach(e => { e.libraryIds = [EMOJI_LIBRARY_ID]; e.combinationIds = e.combinationIds || []; });
        this.userData.elements.push(...emojiEls);
        emojiLib.elementIds = emojiIds;
        this._invalidateElementMap();
    }

    // 数据导入导出
    exportData() {
        const id = 'export-history-count-' + Date.now();
        const modal = this.createModal('导出数据', `
            <p>导出时包含的<strong>最近历史生成次数</strong>：</p>
            <p class="export-backup-hint">文件将保存到浏览器默认下载目录</p>
            <div class="form-group">
                <label>最近生成次数（0 表示不导出历史）：</label>
                <input type="number" id="${id}" class="form-control" value="0" min="0" step="1" placeholder="0">
            </div>
        `, [
            { text: '导出', class: 'btn-primary', action: () => {
                const el = document.getElementById(id);
                const val = el ? parseInt(el.value, 10) : 0;
                const historyCount = isNaN(val) || val < 0 ? 0 : val;
                this.closeModal();
                this._doExport(historyCount);
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    _doExport(historyCount, filenamePrefix) {
        const namePrefix = filenamePrefix || '备份';
        // 不导出系统词库（内置）；只导出用户自建元素与仅「有改动的」系统元素操作
        // Emoji：不导出 emoji 元素本身；仅导出「操作」：删除(deletedChars)、拉黑(blacklistedChars)，用 emojiBackup 标明
        // 双盲词库为隐藏词库：只导出被收藏的元素（在词语组中）或所属组合被收藏的元素，其余不导出
        const favoritedElementIds = new Set();
        (this.userData.elements || []).forEach(e => {
            if ((e.elementGroupIds || []).length > 0) favoritedElementIds.add(e.id);
        });
        (this.userData.combinations || []).forEach(c => {
            if ((c.combinationGroupIds || []).length > 0)
                (c.elementIds || []).forEach(eid => favoritedElementIds.add(eid));
        });
        const isOnlyInDoubleblind = (e) => {
            const libIds = e.libraryIds || [];
            return libIds.length === 1 && libIds[0] === DOUBLEBLIND_LIBRARY_ID;
        };
        const elementsExport = (this.userData.elements || []).filter(e => {
            if (String(e.id).startsWith('sys_')) return false;
            if (String(e.id).startsWith('emoji_')) return false;
            const libIds = e.libraryIds || [];
            if (libIds.length === 1 && libIds[0] === EMOJI_LIBRARY_ID) return false;
            if (isOnlyInDoubleblind(e) && !favoritedElementIds.has(e.id)) return false;
            return true;
        });
        const exportedElementIds = new Set(elementsExport.map(e => e.id));
        const overrides = this.userData.systemElementOverrides || {};
        const systemElementOverridesExport = {};
        if (typeof window.ELEMENTS_DATA !== 'undefined') {
            Object.keys(overrides).forEach(id => {
                const idx = parseInt(String(id).replace('sys_', ''), 10);
                if (Number.isNaN(idx) || !window.ELEMENTS_DATA[idx]) return;
                const base = window.ELEMENTS_DATA[idx];
                const def = { isBlacklisted: false, common: base.common || 0, secondCommon: base.secondCommon || 0, negative: base.negative || 0 };
                const ov = overrides[id];
                if (ov.isBlacklisted !== def.isBlacklisted || ov.common !== def.common || ov.secondCommon !== def.secondCommon || ov.negative !== def.negative)
                    systemElementOverridesExport[id] = ov;
            });
        }
        const librariesExport = (this.userData.libraries || []).filter(l => !l.isSystem).map(l => {
            if (l.bindingId === EMOJI_LIBRARY_ID)
                return { ...l, isEmojiLibrary: true, elementIds: [] };
            if (l.bindingId === DOUBLEBLIND_LIBRARY_ID)
                return { ...l, elementIds: (l.elementIds || []).filter(id => exportedElementIds.has(id)) };
            return l;
        });
        const emojiOv = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
        // 备份只保留一份 emoji 操作（重置/恢复默认后的当前状态），不重复写 emojiOverrides/emojiBackupFromImport 等
        const emojiBackupExport = {
            deletedChars: [...(emojiOv.deletedChars || [])],
            blacklistedChars: [...(emojiOv.blacklistedChars || [])]
        };
        const historyExport = historyCount > 0 && Array.isArray(this.generationHistory)
            ? this.generationHistory.slice(-historyCount)
            : [];
        const now = new Date();
        const pad = n => (n < 10 ? '0' : '') + n;
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const backupName = `${dateStr} ${timeStr.replace(/-/g, ':')}`;
        const s = this.userData.settings || {};
        const { toolParams, ...settingsForBackup } = s;
        const settingsExport = stripDefaultSettings(settingsForBackup);
        const { emojiOverrides: _eo, emojiBackup: _eb, emojiBackupFromImport: _ebi, ...userDataRest } = this.userData;
        const exportData = {
            version: '1.0',
            timestamp: now.toISOString(),
            backupName,
            userData: {
                ...userDataRest,
                elements: elementsExport,
                libraries: librariesExport,
                systemElementOverrides: systemElementOverridesExport,
                emojiBackup: emojiBackupExport,
                generationHistory: historyExport,
                settings: settingsExport
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${namePrefix}_${dateStr}_${timeStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (namePrefix === '备份') this.showToast('数据导出成功！');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                const backupChecked = this.userData.settings.autoBackupBeforeImport !== false;
                const modal = this.createModal('导入数据', `
                    <p>检测到备份文件，请选择导入方式：</p>
                    <div class="import-options">
                        <label><input type="radio" name="import-mode" value="replace" checked> 覆盖现有数据</label>
                        <label><input type="radio" name="import-mode" value="merge"> 合并到现有数据</label>
                    </div>
                    <div class="import-options" style="margin-top:0.75rem;">
                        <label><input type="checkbox" id="import-backup-before-cb" ${backupChecked ? 'checked' : ''}> 导入前自动下载当前数据备份</label>
                    </div>
                    <p class="import-backup-hint">备份说明：可以通过导出下载备份文件。正常会保存在浏览器内，但为防止数据丢失，建议定期手动导出个人数据~</p>
                `, [
                    { text: '导入', class: 'btn-primary', action: () => this.processImport(importData) },
                    { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
                ]);
                const backupCb = modal.querySelector('#import-backup-before-cb');
                if (backupCb) backupCb.addEventListener('change', () => {
                    this.userData.settings.autoBackupBeforeImport = !!backupCb.checked;
                    this.saveUserData();
                });

            } catch (error) {
                this.showToast('文件格式错误，导入失败！');
            }
        };
        reader.readAsText(file);
    }

    processImport(importData) {
        const mode = document.querySelector('input[name="import-mode"]:checked').value;
        const backupCb = document.getElementById('import-backup-before-cb');
        if (backupCb && backupCb.checked) this._doExport(0, '导入前备份');
        if (mode === 'replace') {
            const systemLibrary = this.userData.libraries.find(lib => lib.isSystem);
            this.userData = importData.userData;
            this.userData.systemElementOverrides = this.userData.systemElementOverrides || {};
            this.generationHistory = Array.isArray(this.userData.generationHistory) ? this.userData.generationHistory : [];
            this.migrateSystemElementsToOverrides();

            // 备份中的双盲词库（仅含「他处用到」的元素）会一并恢复，写回本地时也是隐藏写回

            // 备份中若有 emoji 元素（旧格式）：不恢复，只保留「操作」；导入后用操作重建词库（id 会按当前规则重新生成）
            this.userData.elements = (this.userData.elements || []).filter(e => !String(e.id).startsWith('emoji_'));
            const emojiSrc = this.userData.emojiBackup || this.userData.emojiOverrides;
            if (emojiSrc && typeof emojiSrc === 'object') {
                this.userData.emojiOverrides = {
                    deletedChars: [...(emojiSrc.deletedChars || [])],
                    blacklistedChars: [...(emojiSrc.blacklistedChars || [])]
                };
            } else {
                this.userData.emojiOverrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
            }

            // 恢复系统词库如果被覆盖（使用固定 bindingId）
            if (systemLibrary && !this.userData.libraries.find(lib => lib.isSystem)) {
                this.userData.libraries.unshift({ ...systemLibrary, id: SYSTEM_LIBRARY_ID, bindingId: SYSTEM_LIBRARY_ID });
            }
            this._rebuildEmojiLibraryFromOverrides();
        } else {
            // 合并模式：只添加不重复ID的内容
            this.mergeUserData(importData.userData);
            // 合并历史：按「标题」(tool + timestamp) 去重，不重复导入
            if (Array.isArray(importData.userData && importData.userData.generationHistory)) {
                const existingKeys = new Set((this.generationHistory || []).map(e => `${e.tool}_${e.timestamp}`));
                (importData.userData.generationHistory || []).forEach(entry => {
                    const key = `${entry.tool}_${entry.timestamp}`;
                    if (!existingKeys.has(key)) {
                        existingKeys.add(key);
                        this.generationHistory.push(entry);
                    }
                });
            }
            // 合并系统设置：加入导入的设置，有冲突时优先保留本地
            const importedSettings = importData.userData && importData.userData.settings;
            if (importedSettings && typeof importedSettings === 'object')
                this.userData.settings = { ...importedSettings, ...(this.userData.settings || {}) };
            // 合并系统元素用户操作记录：加入导入的，有冲突时优先保留本地
            const overrides = importData.userData && importData.userData.systemElementOverrides;
            if (overrides && typeof overrides === 'object')
                this.userData.systemElementOverrides = { ...overrides, ...(this.userData.systemElementOverrides || {}) };
            // 合并黑名单：加入导入的拉黑 id，去重保留顺序，并同步元素的 isBlacklisted
            const importedBlacklist = importData.userData && importData.userData.blacklistedElementIds;
            if (Array.isArray(importedBlacklist) && importedBlacklist.length > 0) {
                this._invalidateElementMap();
                const cur = this.userData.blacklistedElementIds || [];
                const seen = new Set(cur);
                importedBlacklist.forEach(eid => {
                    if (!seen.has(eid)) { seen.add(eid); cur.push(eid); }
                });
                this.userData.blacklistedElementIds = cur;
                cur.forEach(eid => {
                    const el = this.getElementById(eid);
                    if (el) el.isBlacklisted = true;
                });
            }
            // 合并模式：emoji 与覆盖一致，直接用导入的覆盖当前设置并重建
            const impEmojiSrc = (importData.userData && importData.userData.emojiBackup) || (importData.userData && importData.userData.emojiOverrides);
            if (impEmojiSrc && typeof impEmojiSrc === 'object') {
                this.userData.emojiOverrides = {
                    deletedChars: [...(impEmojiSrc.deletedChars || [])],
                    blacklistedChars: [...(impEmojiSrc.blacklistedChars || [])]
                };
            }
            this._rebuildEmojiLibraryFromOverrides();
        }

        this.initializeSystemData();
        this.saveUserData();
        this.closeModal();
        this.showToast('数据导入成功！');
        
        // 重新渲染界面
        this.renderLibrarySelector();
        this.renderCurrentTool();
    }

    /** 导入时用：新加项一律加「（备份）」避免重名 */
    _ensureUniqueBackupName(baseName, existingNames) {
        const names = new Set(existingNames || []);
        let name = (baseName || '').trim() + '（备份）';
        if (!names.has(name)) return name;
        let n = 1;
        while (names.has(name + ' ' + n)) n++;
        return name + ' ' + n;
    }

    /** 本地新建时用：重名时加「（1）」「（2）」 */
    _ensureUniqueNumberedName(baseName, existingNames) {
        const names = new Set(existingNames || []);
        const base = (baseName || '').trim();
        if (!names.has(base)) return base;
        let n = 1;
        while (names.has(base + '（' + n + '）')) n++;
        return base + '（' + n + '）';
    }

    mergeUserData(newData) {
        if (!newData) return;
        // 比较是否同一实体一律用独立 id；关系与引用一律用 bindingId（此处 existing 用 id 比较，新增项的引用用 bindingId）
        const libs = this.userData.libraries || [];
        const elemGroups = this.userData.elementGroups || [];
        const comboGroups = this.userData.combinationGroups || [];
        const elements = this.userData.elements || [];
        const combinations = this.userData.combinations || [];

        const libNames = () => libs.map(l => l.name);
        const elemGroupNames = () => elemGroups.map(g => g.name);
        const comboGroupNames = () => comboGroups.map(g => g.name);

        // 先合并元素：仅添加 id 不存在的；不合并备份中的 emoji 元素（emoji 仅通过 emojiBackup/emojiOverrides 操作恢复）
        (newData.elements || []).forEach(el => {
            if (String(el.id).startsWith('emoji_')) return;
            if (!elements.some(e => e.id === el.id)) elements.push(el);
        });
        this.userData.elements = elements;

        // 合并词库：同 id 即同一实体不备份；仅名字相同且 id 不同时才以备份形式加入
        // 备份中的 Emoji 词库不是普通词库，是「带筛选的操作格式」；不在此合并，仅通过 emojiBackup/emojiOverrides 在 processImport 中处理
        (newData.libraries || []).forEach(newLib => {
            if (newLib.isSystem) return;
            if (newLib.isEmojiLibrary || newLib.bindingId === EMOJI_LIBRARY_ID || newLib.name === 'Emoji词库') return;
            // 双盲词库合并时：备份里有的（仅他处用到的）会并入本地，界面仍隐藏
            const existing = libs.find(l => l.id === newLib.id);
            if (existing) {
                const isEmpty = !(existing.elementIds && existing.elementIds.length > 0);
                if (isEmpty) {
                    const idx = libs.indexOf(existing);
                    libs[idx] = { ...newLib, id: existing.id, bindingId: existing.bindingId };
                }
                return;
            }
            const nameConflict = libNames().includes(newLib.name || '未命名词库');
            const uniqueName = nameConflict ? this._ensureUniqueBackupName(newLib.name || '未命名词库', libNames()) : (newLib.name || '未命名词库');
            const bindingId = newLib.bindingId != null ? newLib.bindingId : this.generateId();
            libs.push({ ...newLib, name: uniqueName, bindingId });
        });
        this.userData.libraries = libs;

        // 合并元素分组：同 id 不重复加；仅名字相同且 id 不同时才加「（备份）」命名
        (newData.elementGroups || []).forEach(newGrp => {
            const existing = elemGroups.find(g => g.id === newGrp.id);
            if (existing) {
                const isEmpty = !(existing.elementIds && existing.elementIds.length > 0);
                if (isEmpty) {
                    const idx = elemGroups.indexOf(existing);
                    elemGroups[idx] = { ...newGrp, id: existing.id, bindingId: existing.bindingId };
                }
                return;
            }
            const names = elemGroupNames();
            const nameConflict = names.includes(newGrp.name || '未命名分组');
            const uniqueName = nameConflict ? this._ensureUniqueBackupName(newGrp.name || '未命名分组', names) : (newGrp.name || '未命名分组');
            let bindingId = newGrp.bindingId != null ? newGrp.bindingId : this.generateId();
            if (bindingId === DEFAULT_FAV_ELEMENT_GROUP_ID) bindingId = this.generateId();
            elemGroups.push({ ...newGrp, name: uniqueName, bindingId });
        });
        this.userData.elementGroups = elemGroups;

        // 合并组合：仅添加 id 不存在的
        (newData.combinations || []).forEach(c => {
            if (!combinations.some(x => x.id === c.id)) combinations.push(c);
        });
        this.userData.combinations = combinations;

        // 合并组合分组：同 id 不重复加；仅名字相同且 id 不同时才加「（备份）」命名
        (newData.combinationGroups || []).forEach(newGrp => {
            const existing = comboGroups.find(g => g.id === newGrp.id);
            if (existing) {
                const isEmpty = !(existing.combinationIds && existing.combinationIds.length > 0);
                if (isEmpty) {
                    const idx = comboGroups.indexOf(existing);
                    comboGroups[idx] = { ...newGrp, id: existing.id, bindingId: existing.bindingId };
                }
                return;
            }
            const names = comboGroupNames();
            const nameConflict = names.includes(newGrp.name || '未命名分组');
            const uniqueName = nameConflict ? this._ensureUniqueBackupName(newGrp.name || '未命名分组', names) : (newGrp.name || '未命名分组');
            let bindingId = newGrp.bindingId != null ? newGrp.bindingId : this.generateId();
            if (bindingId === DEFAULT_FAV_COMBO_GROUP_ID) bindingId = this.generateId();
            comboGroups.push({ ...newGrp, name: uniqueName, bindingId });
        });
        this.userData.combinationGroups = comboGroups;

        // 合并色彩收藏夹：按 id 去重，导入的追加到末尾
        const curFav = this.userData.colorFavorites || [];
        const favIds = new Set(curFav.map(f => f.id));
        (newData.colorFavorites || []).forEach(f => {
            if (!favIds.has(f.id)) {
                favIds.add(f.id);
                curFav.push(f);
            }
        });
        this.userData.colorFavorites = curFav;
    }

    // 工具提示
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    // 组合生成器：当前已选词库/分组，每个来源生成一条，输出「词库/分组：元素」；保存结果为全部元素合并
    renderComboGenerator() {
        const generationArea = document.getElementById('generation-area');
        const hasLibs = (this.selectedLibraries || []).length > 0;
        const hasElemGroups = (this.selectedElementGroups || []).length > 0;
        const hasComboGroups = (this.selectedGroups || []).length > 0;
        const hasAny = hasLibs || hasElemGroups || hasComboGroups;

        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>组合生成</h3>
                <div class="form-group">
                    <label>每个词库/组合生成的元素数量</label>
                    <input type="number" id="combo-per-source-count" class="form-control" value="1" min="1" max="10">
                </div>
                ${hasAny ? '<button id="combo-generate" class="btn generate-btn">生成组合</button>' : '<p class="text-muted">请先选择词库或分组</p>'}
            </div>
        `;

        if (hasAny) {
            document.getElementById('combo-generate').addEventListener('click', () => {
                this.generateCombo();
            });
            const tp = (this.userData.settings.toolParams = this.userData.settings.toolParams || {});
            const cp = tp.combo || {};
            const perEl = document.getElementById('combo-per-source-count');
            if (perEl && cp.perSourceCount != null) perEl.value = cp.perSourceCount;
            const saveComboParams = () => {
                this.userData.settings.toolParams = this.userData.settings.toolParams || {};
                this.userData.settings.toolParams.combo = {
                    perSourceCount: parseInt(perEl?.value, 10) || 1
                };
                this.saveUserData();
            };
            if (perEl) perEl.addEventListener('change', saveComboParams);
        }
    }

    generateCombo() {
        const perSourceCount = Math.min(10, Math.max(1, parseInt(document.getElementById('combo-per-source-count')?.value, 10) || 1));
        const lines = [];
        const allElementIds = new Set();
        let hadInsufficient = false;

        // 词库：每个选中的词库一条
        (this.selectedLibraries || []).forEach(libId => {
            const lib = this.getLibraryById(libId);
            if (!lib) return;
            const available = this.getLibraryElements(lib);
            const { picked, insufficient } = this.selectRandomElements(available, perSourceCount);
            if (insufficient) hadInsufficient = true;
            if (picked.length > 0) {
                lines.push({ sourceName: lib.name, elements: picked });
                picked.forEach(e => allElementIds.add(e.id));
            }
        });

        // 元素分组：每个选中的分组一条
        (this.selectedElementGroups || []).forEach(gid => {
            const group = this.getElementGroupById(gid);
            if (!group) return;
            const raw = this.getElementsByIds(group.elementIds || []);
            const available = raw.filter(el => el && !el.isBlacklisted);
            const { picked, insufficient } = this.selectRandomElements(available, perSourceCount);
            if (insufficient) hadInsufficient = true;
            if (picked.length > 0) {
                lines.push({ sourceName: group.name, elements: picked });
                picked.forEach(e => allElementIds.add(e.id));
            }
        });

        // 元素组合分组：每个选中的组合分组随机取一个已有组合，一条
        (this.selectedGroups || []).forEach(gid => {
            const group = this.getGroupById(gid);
            if (!group || !(group.combinationIds && group.combinationIds.length)) return;
            const combos = (group.combinationIds || [])
                .map(cid => this.getCombinationById(cid))
                .filter(c => c && (!c.elementIds || !c.elementIds.some(eid => {
                    const el = this.getElementById(eid);
                    return !el || el.isBlacklisted;
                })));
            if (combos.length === 0) return;
            const combo = combos[Math.floor(Math.random() * combos.length)];
            const els = this.getElementsByIds(combo.elementIds || []);
            if (els.length > 0) {
                lines.push({ sourceName: group.name, elements: els });
                els.forEach(e => allElementIds.add(e.id));
            }
        });

        if (lines.length === 0) {
            this.showToast('当前没有可用的词库或分组，或元素不足');
            return;
        }
        if (hadInsufficient) this.showToast('数量不足，已重复抽取');

        const allElements = this.getElementsByIds(Array.from(allElementIds));
        const result = {
            type: 'combo_by_source',
            lines,
            elements: allElements,
            id: this.generateId()
        };
        this.displayResults([result]);
    }

    /** 随机抽取，数量不足时允许重复并返回 insufficient: true */
    selectRandomElements(elements, count) {
        if (elements.length === 0) return { picked: [], insufficient: false };
        const allowRepeat = count > elements.length;
        const selected = [];
        if (allowRepeat) {
            for (let i = 0; i < count; i++)
                selected.push(elements[Math.floor(Math.random() * elements.length)]);
        } else {
            const shuffled = [...elements].sort(() => Math.random() - 0.5);
            for (let i = 0; i < count && i < shuffled.length; i++) selected.push(shuffled[i]);
        }
        return { picked: selected, insufficient: allowRepeat };
    }

    renderDailyElement() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>每日元素</h3>
                <div class="daily-crystal">
                    <div class="daily-magic-ball" id="daily-magic-ball" title="长按可换今日元素">
                        <span class="daily-magic-emoji">🔮</span>
                        <div class="daily-magic-ball-bubbles" id="daily-magic-ball-bubbles"></div>
                    </div>
                    <div class="daily-element" id="daily-element"></div>
                    <p class="daily-element-hint">长按刷新元素</p>
                </div>
            </div>
        `;

        this.initDailyElement();
    }

    initDailyElement() {
        const today = new Date().toDateString();
        const savedDaily = localStorage.getItem('daily_element_' + today);

        let dailyElement;
        if (savedDaily) {
            try {
                dailyElement = JSON.parse(savedDaily);
            } catch (_) { dailyElement = null; }
        }
        if (!dailyElement) {
            const availableElements = this.getAvailableElements();
            if (availableElements.length > 0) {
                dailyElement = availableElements[Math.floor(Math.random() * availableElements.length)];
                localStorage.setItem('daily_element_' + today, JSON.stringify(dailyElement));
                const result = { type: 'combination', elements: [{ id: dailyElement.id, name: dailyElement.name }], id: this.generateId() };
                this.generationHistory.push({ tool: 'daily', results: [result], timestamp: Date.now() });
                this.saveUserData();
            }
        }

        this._dailyCurrentElement = dailyElement || null;
        const el = document.getElementById('daily-element');
        if (el) {
            if (dailyElement) {
                el.textContent = dailyElement.name;
                el.classList.remove('daily-element-reveal');
                void el.offsetWidth;
                el.classList.add('daily-element-reveal');
                el.style.cursor = 'pointer';
                el.title = '点击查看/编辑';
            } else {
                el.textContent = '';
                el.style.cursor = '';
                el.title = '';
            }
            el.onclick = () => {
                if (this._dailyCurrentElement && this._dailyCurrentElement.id) this.showElementModalById(this._dailyCurrentElement.id);
            };
        }

        const DAILY_BUBBLE_EMOJIS = ['✨', '🌟', '⭐', '💫', '✨'];
        let pressTimer;
        let bubbleInterval;
        const ball = document.getElementById('daily-magic-ball');
        const bubblesWrap = document.getElementById('daily-magic-ball-bubbles');
        if (!ball || !bubblesWrap) return;

        const spawnBubble = () => {
            const b = document.createElement('span');
            b.className = 'daily-magic-bubble';
            b.textContent = DAILY_BUBBLE_EMOJIS[Math.floor(Math.random() * DAILY_BUBBLE_EMOJIS.length)];
            b.style.left = (20 + Math.random() * 60) + '%';
            b.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
            bubblesWrap.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
        };

        const startBubbles = () => {
            if (bubbleInterval) return;
            bubbleInterval = setInterval(spawnBubble, 120);
        };
        const stopBubbles = () => {
            clearInterval(bubbleInterval);
            bubbleInterval = null;
        };

        const triggerChange = () => {
            stopBubbles();
            ball.classList.add('daily-magic-flash');
            setTimeout(() => ball.classList.remove('daily-magic-flash'), 400);
            this.changeDailyElement();
        };

        ball.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startBubbles();
            pressTimer = setTimeout(triggerChange, 800);
        });
        ball.addEventListener('mouseup', (e) => { e.stopPropagation(); clearTimeout(pressTimer); stopBubbles(); });
        ball.addEventListener('mouseleave', (e) => { e.stopPropagation(); clearTimeout(pressTimer); stopBubbles(); });
        ball.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            startBubbles();
            pressTimer = setTimeout(triggerChange, 800);
        }, { passive: false });
        ball.addEventListener('touchend', (e) => { e.stopPropagation(); clearTimeout(pressTimer); stopBubbles(); }, { passive: true });
    }

    changeDailyElement() {
        const availableElements = this.getAvailableElements();
        const el = document.getElementById('daily-element');
        if (availableElements.length > 0 && el) {
            const newElement = availableElements[Math.floor(Math.random() * availableElements.length)];
            this._dailyCurrentElement = newElement;
            el.textContent = newElement.name;
            el.classList.remove('daily-element-reveal');
            void el.offsetWidth;
            el.classList.add('daily-element-reveal');
            const today = new Date().toDateString();
            localStorage.setItem('daily_element_' + today, JSON.stringify(newElement));
            const result = { type: 'combination', elements: [{ id: newElement.id, name: newElement.name }], id: this.generateId() };
            this.generationHistory.push({ tool: 'daily', results: [result], timestamp: Date.now() });
            this.saveUserData();
        }
    }

    // 盲盒功能：设置可展开收起，白色抽取区，单抽/端盒，随机盒子 emoji，居中摇一摇后点击打开
    renderBlindBox() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>盲盒</h3>
                <details class="blindbox-settings" id="blindbox-settings" open>
                    <summary>设置</summary>
                    <div class="blindbox-config blindbox-config-compact">
                        <div class="blindbox-config-line">
                            <div class="blindbox-config-row">
                                <label>端盒数</label>
                                <input type="number" id="blindbox-box-count" class="form-control form-control-sm" value="10" min="5" max="20">
                            </div>
                            <div class="blindbox-config-row">
                                <label>隐藏%</label>
                                <input type="number" id="blindbox-rare-rate" class="form-control form-control-sm" value="10" min="1" max="50">
                            </div>
                        </div>
                        <div class="blindbox-config-line">
                            <div class="blindbox-config-row">
                                <label>普通数</label>
                                <input type="number" id="blindbox-normal-count" class="form-control form-control-sm" value="2" min="1" max="5">
                            </div>
                            <div class="blindbox-config-row">
                                <label>隐藏数</label>
                                <input type="number" id="blindbox-rare-count" class="form-control form-control-sm" value="3" min="1" max="5">
                            </div>
                        </div>
                    </div>
                </details>
                <div class="blindbox-result-area">
                    <div id="blindbox-stage" class="blindbox-stage"></div>
                    <div id="blindbox-slip" class="blindbox-slip hidden">
                        <div class="blindbox-slip-sparkles" aria-hidden="true"></div>
                        <div class="blindbox-slip-inner">
                            <div class="blindbox-slip-title">抽到的元素</div>
                            <div id="blindbox-slip-elements" class="blindbox-slip-elements"></div>
                            <button type="button" id="blindbox-slip-close" class="btn btn-sm btn-secondary blindbox-slip-btn">收起</button>
                        </div>
                    </div>
                </div>
                <div class="blindbox-bottom">
                    <div class="blindbox-draw-row">
                        <button type="button" id="blindbox-single" class="btn generate-btn">单抽</button>
                        <button type="button" id="blindbox-box" class="btn generate-btn">端盒</button>
                    </div>
                    <div id="blindbox-open-actions" class="blindbox-open-actions hidden">
                        <button type="button" id="blindbox-open-all" class="btn btn-primary">一键全部打开</button>
                        <button type="button" id="blindbox-change-batch" class="btn btn-secondary blindbox-change-batch hidden">换一端</button>
                    </div>
                </div>
            </div>
        `;

        const tp = (this.userData.settings.toolParams = this.userData.settings.toolParams || {});
        const blp = tp.blindbox || {};
        const boxCountEl = document.getElementById('blindbox-box-count');
        const rareRateEl = document.getElementById('blindbox-rare-rate');
        const normalCountEl = document.getElementById('blindbox-normal-count');
        const rareCountEl = document.getElementById('blindbox-rare-count');
        if (boxCountEl && blp.boxCount != null) boxCountEl.value = blp.boxCount;
        if (rareRateEl && blp.rareRate != null) rareRateEl.value = blp.rareRate;
        if (normalCountEl && blp.normalCount != null) normalCountEl.value = blp.normalCount;
        if (rareCountEl && blp.rareCount != null) rareCountEl.value = blp.rareCount;
        const saveBlindboxParams = () => {
            this.userData.settings.toolParams = this.userData.settings.toolParams || {};
            this.userData.settings.toolParams.blindbox = {
                boxCount: parseInt(boxCountEl?.value, 10) || 10,
                rareRate: parseInt(rareRateEl?.value, 10) || 10,
                normalCount: parseInt(normalCountEl?.value, 10) || 2,
                rareCount: parseInt(rareCountEl?.value, 10) || 3
            };
            this.saveUserData();
        };
        [boxCountEl, rareRateEl, normalCountEl, rareCountEl].forEach(el => { if (el) el.addEventListener('change', saveBlindboxParams); });

        document.getElementById('blindbox-single').addEventListener('click', () => this.drawBlindBox('single'));
        document.getElementById('blindbox-box').addEventListener('click', () => this.drawBlindBox('box'));
        document.getElementById('blindbox-open-all').addEventListener('click', () => this.openAllBlindBoxes());
        document.getElementById('blindbox-change-batch').addEventListener('click', () => this.drawBlindBox('box'));
        document.getElementById('blindbox-slip-close').addEventListener('click', () => this.hideBlindboxSlip());
        const slipInner = document.querySelector('#blindbox-slip .blindbox-slip-inner');
        if (slipInner) {
            slipInner.style.cursor = 'pointer';
            slipInner.title = '点击打开组合';
            slipInner.addEventListener('click', (e) => {
                if (e.target.closest('.blindbox-slip-chip') || e.target.closest('.blindbox-slip-btn')) return;
                e.stopPropagation();
                const ids = this._blindboxSlipElementIds;
                if (!ids || !ids.length) return;
                if (ids.length === 1) this.showElementModalById(ids[0]);
                else this.showEditCombinationModal(null, ids);
            });
        }
        const resultArea = document.querySelector('.blindbox-result-area');
        if (resultArea) {
            resultArea.addEventListener('click', (e) => {
                const slip = document.getElementById('blindbox-slip');
                if (slip && !slip.classList.contains('hidden') && !slip.contains(e.target)) this.hideBlindboxSlip();
            });
        }
    }

    drawBlindBox(type) {
        const available = this.getAvailableElements();
        if (available.length === 0) {
            this.showToast('没有可用的元素，请先选择词库或元素分组');
            return;
        }
        const needCount = type === 'box' ? Math.min(20, Math.max(5, parseInt(document.getElementById('blindbox-box-count').value) || 10)) * 3 : 3;
        if (available.length < needCount) this.showToast('因数量不足，可能出现重复');

        const rareRate = parseInt(document.getElementById('blindbox-rare-rate').value) || 10;
        const normalCount = Math.max(1, parseInt(document.getElementById('blindbox-normal-count').value) || 2);
        const rareCount = Math.max(1, parseInt(document.getElementById('blindbox-rare-count').value) || 3);
        const boxCount = type === 'box' ? Math.min(20, Math.max(5, parseInt(document.getElementById('blindbox-box-count').value) || 10)) : 1;

        this._blindboxCurrentType = type;

        const results = [];
        for (let i = 0; i < boxCount; i++) {
            const isRare = Math.random() * 100 < rareRate;
            const elementCount = isRare ? rareCount : normalCount;
            const elements = this.generateRandomElements(elementCount);
            results.push({ type: 'blindbox', elements, isRare, id: this.generateId() });
        }
        for (let i = results.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [results[i], results[j]] = [results[j], results[i]];
        }

        this._blindboxCurrentResults = results;
        const historyResults = results.map(r => ({ type: 'combination', elements: (r.elements || []).map(e => ({ id: e.id, name: e.name })), id: r.id }));
        if (historyResults.length > 0) {
            this.generationHistory.push({ tool: this.currentTool, results: historyResults, timestamp: Date.now() });
            this.saveUserData();
        }
        this.displayBlindBoxResults(results);
    }

    displayBlindBoxResults(results) {
        this.hideBlindboxSlip();
        const stage = document.getElementById('blindbox-stage');
        const openActions = document.getElementById('blindbox-open-actions');
        const changeBtn = document.getElementById('blindbox-change-batch');
        const openAllBtn = document.getElementById('blindbox-open-all');
        if (!stage) return;

        stage.innerHTML = '';
        stage.classList.remove('blindbox-stage-shake');
        const type = this._blindboxCurrentType || 'single';

        results.forEach((result, index) => {
            const box = document.createElement('div');
            box.className = 'blindbox-item';
            box.dataset.index = String(index);
            box.dataset.rare = result.isRare ? '1' : '0';
            box.innerHTML = `
                <div class="blindbox-cover" data-index="${index}">
                    <span class="blindbox-emoji">📦</span>
                </div>
                <div class="blindbox-content hidden">
                    ${result.elements.map(e => `<span class="box-element">${e.name}</span>`).join('')}
                </div>
                <div class="blindbox-rare-bubbles"></div>
            `;
            stage.appendChild(box);
        });

        stage.classList.add('blindbox-stage-visible');

        if (openActions) openActions.classList.remove('hidden');
        if (openAllBtn) openAllBtn.classList.remove('hidden');
        if (changeBtn) changeBtn.classList.toggle('hidden', type !== 'box');

        stage.querySelectorAll('.blindbox-cover').forEach(cover => {
            cover.addEventListener('click', () => {
                const idx = parseInt(cover.dataset.index, 10);
                const box = stage.querySelector(`.blindbox-item[data-index="${idx}"]`);
                if (!box || cover.classList.contains('opened')) return;
                box.classList.add('blindbox-item--shake');
                void box.offsetWidth;
                setTimeout(() => {
                    box.classList.remove('blindbox-item--shake');
                    this.openBlindBox(idx, { showSlip: true });
                }, 800);
            });
        });
    }

    _bindBlindboxContentClick(boxEl, index) {
        const content = boxEl.querySelector('.blindbox-content');
        if (!content) return;
        content.style.cursor = 'pointer';
        content.title = '点击查看/编辑';
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            if (content.classList.contains('hidden')) return;
            const result = this._blindboxCurrentResults && this._blindboxCurrentResults[index];
            if (!result || !result.elements || !result.elements.length) return;
            const ids = result.elements.map(e => e.id);
            if (ids.length === 1) this.showElementModalById(ids[0]);
            else this.showEditCombinationModal(null, ids);
        });
    }

    openBlindBox(index, opts = {}) {
        const { showSlip = false } = opts;
        const stage = document.getElementById('blindbox-stage');
        if (!stage) return;
        const box = stage.querySelector(`.blindbox-item[data-index="${index}"]`);
        if (!box) return;
        const cover = box.querySelector('.blindbox-cover');
        const content = box.querySelector('.blindbox-content');
        if (cover.classList.contains('opened')) return;
        const isRare = box.dataset.rare === '1';
        cover.classList.add('opened');
        content.classList.remove('hidden');
        box.classList.add('blindbox-item-opened');
        if (isRare) {
            box.classList.add('rare');
            this.playBlindboxRareBubbles(box);
        }
        this._bindBlindboxContentClick(box, index);
        if (showSlip && this._blindboxCurrentResults && this._blindboxCurrentResults[index]) {
            const result = this._blindboxCurrentResults[index];
            this.showBlindboxSlip(result.elements || [], result.isRare);
        }
    }

    showBlindboxSlip(elements, isRare = false) {
        const slip = document.getElementById('blindbox-slip');
        const listEl = document.getElementById('blindbox-slip-elements');
        if (!slip || !listEl) return;
        this._blindboxSlipElementIds = elements.map(el => el.id);
        listEl.innerHTML = elements.map(e => `<span class="blindbox-slip-chip" data-id="${e.id}">${e.name}</span>`).join('');
        listEl.querySelectorAll('.blindbox-slip-chip').forEach(chip => {
            chip.style.cursor = 'pointer';
            chip.title = '点击打开元素';
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showElementModalById(chip.dataset.id);
            });
        });
        slip.classList.toggle('blindbox-slip--rare', !!isRare);
        slip.classList.remove('hidden');
        if (isRare) this.playBlindboxSlipSparkles(slip);
    }

    playBlindboxSlipSparkles(slipEl) {
        const wrap = slipEl && slipEl.querySelector('.blindbox-slip-sparkles');
        if (!wrap) return;
        wrap.innerHTML = '';
        const sparkles = ['✨', '🌟', '⭐', '💫'];
        let count = 0;
        const maxBubbles = 10;
        const t = setInterval(() => {
            const b = document.createElement('span');
            b.className = 'blindbox-slip-sparkle';
            b.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            b.style.left = (10 + Math.random() * 80) + '%';
            b.style.animationDuration = (0.4 + Math.random() * 0.2) + 's';
            wrap.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
            count++;
            if (count >= maxBubbles) clearInterval(t);
        }, 60);
    }

    hideBlindboxSlip() {
        const slip = document.getElementById('blindbox-slip');
        if (slip) slip.classList.add('hidden');
    }

    playBlindboxRareBubbles(boxEl) {
        const wrap = boxEl.querySelector('.blindbox-rare-bubbles');
        if (!wrap) return;
        const sparkles = ['✨', '🌟', '⭐', '💫'];
        let count = 0;
        const maxBubbles = 12;
        const t = setInterval(() => {
            const b = document.createElement('span');
            b.className = 'blindbox-rare-bubble';
            b.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            b.style.left = (20 + Math.random() * 60) + '%';
            b.style.animationDuration = (0.5 + Math.random() * 0.3) + 's';
            wrap.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
            count++;
            if (count >= maxBubbles) clearInterval(t);
        }, 80);
    }

    openAllBlindBoxes() {
        const stage = document.getElementById('blindbox-stage');
        if (!stage) return;
        this.hideBlindboxSlip();
        stage.querySelectorAll('.blindbox-cover:not(.opened)').forEach(cover => {
            const idx = parseInt(cover.dataset.index, 10);
            this.openBlindBox(idx, { showSlip: false });
        });
    }
    // 抽卡功能（与盲盒类似：设置可展开、白底结果区、单抽/十连、牌背点击翻开、纸条）
    renderGacha() {
        const generationArea = document.getElementById('generation-area');
        const tp = (this.userData.settings.toolParams = this.userData.settings.toolParams || {});
        const gp = tp.gacha || {};
        const pityCount = parseInt(localStorage.getItem('gacha_pity_count') || '0');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>抽卡</h3>
                <details class="gacha-settings" id="gacha-settings" open>
                    <summary>设置</summary>
                    <div class="gacha-config gacha-config-compact">
                        <div class="gacha-config-line">
                            <div class="gacha-config-row">
                                <label>普通元素数</label>
                                <input type="number" id="normal-elements" class="form-control form-control-sm" value="1" min="1" max="5">
                            </div>
                            <div class="gacha-config-row">
                                <label>稀有%</label>
                                <input type="number" id="rare-probability" class="form-control form-control-sm" value="5" min="1" max="20">
                            </div>
                        </div>
                        <div class="gacha-config-line">
                            <div class="gacha-config-row">
                                <label>稀有名称</label>
                                <input type="text" id="rare-name" class="form-control form-control-sm" value="SR" placeholder="SR">
                            </div>
                            <div class="gacha-config-row">
                                <label>稀有元素数</label>
                                <input type="number" id="rare-elements" class="form-control form-control-sm" value="2" min="1" max="5">
                            </div>
                        </div>
                        <div class="gacha-config-line">
                            <div class="gacha-config-row">
                                <label>保底抽数</label>
                                <input type="number" id="pity-limit" class="form-control form-control-sm" value="90" min="10" max="200">
                            </div>
                        </div>
                    </div>
                </details>
                <div class="gacha-pity-display">距保底 <strong id="pity-remaining">${Math.max(0, (gp.pityLimit != null ? gp.pityLimit : 90) - pityCount)}</strong> 抽</div>
                <div class="gacha-result-area">
                    <div id="gacha-stage" class="gacha-stage"></div>
                    <div id="gacha-slip" class="gacha-slip hidden">
                        <div class="gacha-slip-sparkles" aria-hidden="true"></div>
                        <div class="gacha-slip-inner">
                            <div class="gacha-slip-title">抽到的元素</div>
                            <div id="gacha-slip-elements" class="gacha-slip-elements"></div>
                            <button type="button" id="gacha-slip-close" class="btn btn-sm btn-secondary gacha-slip-btn">收起</button>
                        </div>
                    </div>
                </div>
                <div class="gacha-bottom">
                    <div class="gacha-draw-row">
                        <button type="button" id="gacha-single" class="btn generate-btn">单抽</button>
                        <button type="button" id="gacha-ten" class="btn generate-btn">十连</button>
                    </div>
                    <div id="gacha-open-actions" class="gacha-open-actions hidden">
                        <button type="button" id="gacha-open-all" class="btn btn-primary">一键全部翻开</button>
                    </div>
                </div>
            </div>
        `;

        if (gp.normalElements != null) document.getElementById('normal-elements').value = gp.normalElements;
        if (gp.rareElements != null) document.getElementById('rare-elements').value = gp.rareElements;
        if (gp.rareName != null) document.getElementById('rare-name').value = gp.rareName;
        if (gp.rareProbability != null) document.getElementById('rare-probability').value = gp.rareProbability;
        if (gp.pityLimit != null) document.getElementById('pity-limit').value = gp.pityLimit;
        this.updatePityDisplay();

        const saveGachaParams = () => {
            this.userData.settings.toolParams = this.userData.settings.toolParams || {};
            this.userData.settings.toolParams.gacha = {
                normalElements: parseInt(document.getElementById('normal-elements').value, 10) || 1,
                rareElements: parseInt(document.getElementById('rare-elements').value, 10) || 2,
                rareName: String(document.getElementById('rare-name').value || 'SR').trim() || 'SR',
                rareProbability: parseInt(document.getElementById('rare-probability').value, 10) || 5,
                pityLimit: parseInt(document.getElementById('pity-limit').value, 10) || 90
            };
            this.saveUserData();
        };
        ['normal-elements', 'rare-elements', 'rare-name', 'rare-probability', 'pity-limit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', saveGachaParams);
        });
        document.getElementById('pity-limit')?.addEventListener('input', () => this.updatePityDisplay());

        document.getElementById('gacha-single').addEventListener('click', () => this.drawGacha('single'));
        document.getElementById('gacha-ten').addEventListener('click', () => this.drawGacha('ten'));
        document.getElementById('gacha-open-all').addEventListener('click', () => this.openAllGachaCards());
        document.getElementById('gacha-slip-close').addEventListener('click', () => this.hideGachaSlip());
        const gachaSlipInner = document.querySelector('#gacha-slip .gacha-slip-inner');
        if (gachaSlipInner) {
            gachaSlipInner.style.cursor = 'pointer';
            gachaSlipInner.title = '点击打开组合';
            gachaSlipInner.addEventListener('click', (e) => {
                if (e.target.closest('.gacha-slip-chip') || e.target.closest('.gacha-slip-btn')) return;
                e.stopPropagation();
                const ids = this._gachaSlipElementIds || [];
                if (!ids.length) return;
                if (ids.length === 1) this.showElementModalById(ids[0]);
                else this.showEditCombinationModal(null, ids);
            });
        }
        const gachaResultArea = document.querySelector('.gacha-result-area');
        if (gachaResultArea) {
            gachaResultArea.addEventListener('click', (e) => {
                const slip = document.getElementById('gacha-slip');
                if (slip && !slip.classList.contains('hidden') && !slip.contains(e.target)) this.hideGachaSlip();
            });
        }
    }

    updatePityDisplay() {
        const pityLimitEl = document.getElementById('pity-limit');
        const pityLimit = pityLimitEl ? parseInt(pityLimitEl.value, 10) || 90 : 90;
        const pityCount = parseInt(localStorage.getItem('gacha_pity_count') || '0', 10);
        const remaining = Math.max(0, pityLimit - pityCount);
        const remainingElement = document.getElementById('pity-remaining');
        if (remainingElement) remainingElement.textContent = remaining;
    }

    drawGacha(type) {
        const stage = document.getElementById('gacha-stage');
        if (stage && stage.querySelector('.gacha-cover:not(.opened)')) this.openAllGachaCards();

        const available = this.getAvailableElements();
        if (available.length === 0) {
            this.showToast('没有可用的元素，请先选择词库或元素分组');
            return;
        }
        const drawCount = type === 'ten' ? 10 : 1;
        if (available.length < drawCount * 3) this.showToast('因数量不足，可能出现重复');

        const normalElements = Math.max(1, parseInt(document.getElementById('normal-elements').value, 10) || 1);
        const rareElements = Math.max(1, parseInt(document.getElementById('rare-elements').value, 10) || 2);
        const rareName = String(document.getElementById('rare-name').value || 'SR').trim() || 'SR';
        const rareProbability = Math.min(20, Math.max(1, parseInt(document.getElementById('rare-probability').value, 10) || 5));
        const pityLimit = Math.min(200, Math.max(10, parseInt(document.getElementById('pity-limit').value, 10) || 90));
        let pityCount = parseInt(localStorage.getItem('gacha_pity_count') || '0', 10);

        this.updatePityDisplay();

        const results = [];
        for (let i = 0; i < drawCount; i++) {
            pityCount++;
            const isRare = (pityCount >= pityLimit) || (Math.random() * 100 < rareProbability);
            if (isRare) pityCount = 0;
            const elementCount = isRare ? rareElements : normalElements;
            const elements = this.generateRandomElements(elementCount);
            results.push({
                type: 'gacha_card',
                elements,
                isRare,
                rarity: isRare ? rareName : 'N',
                id: this.generateId()
            });
        }
        localStorage.setItem('gacha_pity_count', pityCount.toString());
        this.updatePityDisplay();

        for (let i = results.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [results[i], results[j]] = [results[j], results[i]];
        }
        this._gachaCurrentResults = results;
        this._gachaCurrentType = type;
        const historyResults = results.map(r => ({ type: 'combination', elements: (r.elements || []).map(e => ({ id: e.id, name: e.name })), id: r.id }));
        if (historyResults.length > 0) {
            this.generationHistory.push({ tool: this.currentTool, results: historyResults, timestamp: Date.now() });
            this.saveUserData();
        }
        this.displayGachaResults(results);
    }

    displayGachaResults(results) {
        this.hideGachaSlip();
        const stage = document.getElementById('gacha-stage');
        const openActions = document.getElementById('gacha-open-actions');
        const openAllBtn = document.getElementById('gacha-open-all');
        if (!stage) return;

        stage.innerHTML = '';
        results.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'gacha-item';
            card.dataset.index = String(index);
            card.dataset.rare = result.isRare ? '1' : '0';
            const coverClass = result.isRare ? 'gacha-cover rare' : 'gacha-cover';
            card.innerHTML = `
                <div class="gacha-item-inner">
                    <div class="${coverClass}" data-index="${index}">
                        <span class="gacha-cover-icon">🃏</span>
                    </div>
                    <div class="gacha-content">
                        <span class="gacha-badge">${result.rarity}</span>
                        <div class="gacha-content-inner">
                            ${result.elements.map(e => `<span class="gacha-element">${e.name}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="gacha-rare-bubbles"></div>
            `;
            stage.appendChild(card);
        });

        stage.classList.add('gacha-stage-visible');
        if (openActions) openActions.classList.remove('hidden');
        if (openAllBtn) openAllBtn.classList.remove('hidden');

        stage.querySelectorAll('.gacha-cover').forEach(cover => {
            cover.addEventListener('click', () => {
                const idx = parseInt(cover.dataset.index, 10);
                const cardEl = stage.querySelector(`.gacha-item[data-index="${idx}"]`);
                if (!cardEl || cover.classList.contains('opened')) return;
                cardEl.classList.add('flipped');
                void cardEl.offsetWidth;
                const inner = cardEl.querySelector('.gacha-item-inner');
                const onFlipEnd = () => {
                    inner.removeEventListener('transitionend', onFlipEnd);
                    this.openGachaCard(idx, { showSlip: true });
                };
                if (inner) inner.addEventListener('transitionend', onFlipEnd);
                setTimeout(() => {
                    if (cardEl.classList.contains('flipped') && !cardEl.classList.contains('gacha-item-opened')) {
                        if (inner) inner.removeEventListener('transitionend', onFlipEnd);
                        this.openGachaCard(idx, { showSlip: true });
                    }
                }, 650);
            });
        });
    }

    openGachaCard(index, opts = {}) {
        const { showSlip = false } = opts;
        const stage = document.getElementById('gacha-stage');
        if (!stage) return;
        const card = stage.querySelector(`.gacha-item[data-index="${index}"]`);
        if (!card) return;
        const cover = card.querySelector('.gacha-cover');
        if (cover.classList.contains('opened')) return;
        const isRare = card.dataset.rare === '1';
        card.classList.add('flipped');
        cover.classList.add('opened');
        card.classList.add('gacha-item-opened');
        if (isRare) {
            card.classList.add('rare');
            this.playGachaRareBubbles(card);
        }
        this._bindGachaContentClick(card, index);
        if (showSlip && this._gachaCurrentResults && this._gachaCurrentResults[index]) {
            const result = this._gachaCurrentResults[index];
            this.showGachaSlip(result.elements || [], result.isRare);
        }
    }

    _bindGachaContentClick(cardEl, index) {
        const content = cardEl.querySelector('.gacha-content');
        if (!content) return;
        content.style.cursor = 'pointer';
        content.title = '点击查看/编辑';
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            const result = this._gachaCurrentResults && this._gachaCurrentResults[index];
            if (!result || !result.elements || !result.elements.length) return;
            const ids = result.elements.map(el => el.id);
            if (ids.length === 1) this.showElementModalById(ids[0]);
            else this.showEditCombinationModal(null, ids);
        });
    }

    showGachaSlip(elements, isRare = false) {
        const slip = document.getElementById('gacha-slip');
        const listEl = document.getElementById('gacha-slip-elements');
        if (!slip || !listEl) return;
        this._gachaSlipElementIds = elements.map(el => el.id);
        listEl.innerHTML = elements.map(e => `<span class="gacha-slip-chip" data-id="${e.id}">${e.name}</span>`).join('');
        listEl.querySelectorAll('.gacha-slip-chip').forEach(chip => {
            chip.style.cursor = 'pointer';
            chip.title = '点击打开元素';
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showElementModalById(chip.dataset.id);
            });
        });
        slip.classList.toggle('gacha-slip--rare', !!isRare);
        slip.classList.remove('hidden');
        if (isRare) this.playGachaSlipSparkles(slip);
    }

    playGachaSlipSparkles(slipEl) {
        const wrap = slipEl && slipEl.querySelector('.gacha-slip-sparkles');
        if (!wrap) return;
        wrap.innerHTML = '';
        const sparkles = ['✨', '🌟', '⭐', '💫'];
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const b = document.createElement('span');
                b.className = 'gacha-slip-sparkle';
                b.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
                b.style.left = (10 + Math.random() * 80) + '%';
                b.style.animationDuration = (0.4 + Math.random() * 0.2) + 's';
                wrap.appendChild(b);
                b.addEventListener('animationend', () => b.remove());
            }, i * 60);
        }
    }

    hideGachaSlip() {
        const slip = document.getElementById('gacha-slip');
        if (slip) slip.classList.add('hidden');
    }

    playGachaRareBubbles(cardEl) {
        const wrap = cardEl && cardEl.querySelector('.gacha-rare-bubbles');
        if (!wrap) return;
        const sparkles = ['✨', '🌟', '⭐', '💫'];
        let count = 0;
        const t = setInterval(() => {
            const b = document.createElement('span');
            b.className = 'gacha-rare-bubble';
            b.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            b.style.left = (20 + Math.random() * 60) + '%';
            b.style.animationDuration = (0.5 + Math.random() * 0.3) + 's';
            wrap.appendChild(b);
            b.addEventListener('animationend', () => b.remove());
            if (++count >= 12) clearInterval(t);
        }, 80);
    }

    openAllGachaCards() {
        const stage = document.getElementById('gacha-stage');
        if (!stage) return;
        this.hideGachaSlip();
        stage.querySelectorAll('.gacha-cover:not(.opened)').forEach(cover => {
            const idx = parseInt(cover.dataset.index, 10);
            this.openGachaCard(idx, { showSlip: false });
        });
    }
    // 抽签功能：选择元素/元素组合，点击签筒小动画出签（大吉/凶等），吉概率更大，结果区显示生成内容可点击编辑
    renderFortune() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>抽签</h3>
                <div class="fortune-config">
                    <div class="form-group">
                        <label>类型：</label>
                        <select id="fortune-type" class="form-control">
                            <option value="elements">元素</option>
                            <option value="combinations">元素组合</option>
                        </select>
                    </div>
                    <div id="fortune-elements-config" class="form-group">
                        <label>元素数量：</label>
                        <input type="number" id="fortune-elements" class="form-control" value="3" min="1" max="5">
                    </div>
                </div>
                <div class="fortune-area">
                    <div class="fortune-box" id="fortune-box">
                        <div class="fortune-sticks">📜</div>
                        <div class="fortune-text" id="fortune-text">点击抽签</div>
                    </div>
                </div>
                <div id="fortune-result" class="fortune-result"></div>
            </div>
        `;

        const typeSelect = document.getElementById('fortune-type');
        const elementsConfig = document.getElementById('fortune-elements-config');
        if (elementsConfig) elementsConfig.style.display = typeSelect?.value === 'elements' ? 'block' : 'none';
        typeSelect?.addEventListener('change', (e) => {
            const el = document.getElementById('fortune-elements-config');
            if (el) el.style.display = e.target.value === 'elements' ? 'block' : 'none';
        });
        document.getElementById('fortune-box').addEventListener('click', () => this.drawFortune());
    }

    /** 签文等级：大吉/中吉/小吉/平/小凶/中凶/凶，吉系概率更大 */
    _pickFortuneLabel() {
        const labels = ['大吉', '中吉', '小吉', '平', '小凶', '中凶', '凶'];
        const weights = [18, 22, 20, 15, 10, 8, 7];
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) return labels[i];
        }
        return labels[0];
    }

    drawFortune() {
        const type = document.getElementById('fortune-type').value;
        const elementCount = Math.max(1, parseInt(document.getElementById('fortune-elements').value, 10) || 3);
        const fortuneText = document.getElementById('fortune-text');
        if (!fortuneText) return;

        if (type === 'elements') {
            const available = this.getAvailableElements();
            if (available.length < elementCount) {
                this.showToast('元素不足，请先选择词库或元素分组');
                return;
            }
            if (available.length < elementCount * 2) this.showToast('因数量不足，可能出现重复');
        } else {
            const combos = this.getAvailableCombinations();
            if (combos.length === 0) {
                this.showToast('请先添加元素组合');
                return;
            }
            if (combos.length < 3) this.showToast('因数量不足，可能出现重复');
        }

        this.playFortuneAnimation();

        setTimeout(() => {
            const fortuneLabel = this._pickFortuneLabel();
            let result = null;

            if (type === 'elements') {
                const elements = this.generateRandomElements(elementCount);
                result = { type: 'fortune_elements', elements, fortuneLabel, id: this.generateId() };
            } else {
                const combos = this.getAvailableCombinations();
                if (combos.length > 0) {
                    const combo = combos[Math.floor(Math.random() * combos.length)];
                    result = { type: 'fortune_combination', combination: combo, fortuneLabel, id: this.generateId() };
                }
            }

            if (result) {
                fortuneText.textContent = fortuneLabel;
                this.displayFortuneResult(result);
            } else {
                fortuneText.textContent = '点击抽签';
            }
        }, 1800);
    }

    playFortuneAnimation() {
        const fortuneBox = document.getElementById('fortune-box');
        const fortuneText = document.getElementById('fortune-text');
        if (!fortuneBox || !fortuneText) return;
        fortuneBox.classList.add('shaking');
        fortuneText.textContent = '抽签中...';
        setTimeout(() => fortuneBox.classList.remove('shaking'), 1800);
    }

    displayFortuneResult(result) {
        const resultArea = document.getElementById('fortune-result');
        if (!resultArea) return;

        let elements = [];
        if (result.type === 'fortune_elements' && result.elements) elements = result.elements;
        if (result.type === 'fortune_combination' && result.combination) {
            elements = this.getElementsByIds(result.combination.elementIds || []);
        }
        const ids = elements.map(e => e.id);
        const comboId = result.type === 'fortune_combination' && result.combination ? result.combination.id : null;
        const openCombo = () => {
            if (!ids.length) return;
            if (ids.length === 1) this.showElementModalById(ids[0]);
            else this.showEditCombinationModal(comboId, ids);
        };

        const contentHtml = elements.length
            ? `<div class="fortune-result-content" title="点击打开组合">${elements.map(e => `<span class="fortune-result-chip" data-id="${e.id}" title="点击打开元素">${e.name}</span>`).join(' + ')}</div>`
            : '';

        resultArea.innerHTML = `
            <div class="fortune-card fade-in">
                <div class="fortune-sign">${result.fortuneLabel || '—'}</div>
                ${contentHtml}
                <div class="fortune-footer">
                    <button type="button" class="btn btn-primary" id="fortune-draw-again">再抽一签</button>
                </div>
            </div>
        `;

        const contentEl = resultArea.querySelector('.fortune-result-content');
        if (contentEl) {
            contentEl.style.cursor = 'pointer';
            contentEl.addEventListener('click', (e) => {
                if (e.target.closest('.fortune-result-chip')) return;
                e.stopPropagation();
                openCombo();
            });
        }
        resultArea.querySelectorAll('.fortune-result-chip').forEach(chip => {
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showElementModalById(chip.dataset.id);
            });
        });
        const againBtn = document.getElementById('fortune-draw-again');
        if (againBtn) againBtn.addEventListener('click', () => this.drawFortune());
    }
    // 星座运势功能
    renderHoroscope() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>星座运势</h3>
                <div class="horoscope-config">
                    <div class="form-group">
                        <label>运势类型：</label>
                        <select id="horoscope-type" class="form-control">
                            <option value="elements">元素</option>
                            <option value="combinations">元素组合</option>
                        </select>
                    </div>
                    <div id="elements-config" class="form-group">
                        <label>每个星座的元素数量：</label>
                        <input type="number" id="horoscope-elements" class="form-control" value="2" min="1" max="5">
                    </div>
                    <button id="horoscope-generate" class="btn generate-btn">生成星座运势</button>
                </div>
                <div id="horoscope-result" class="horoscope-result"></div>
            </div>
        `;

        // 事件监听
        document.getElementById('horoscope-type').addEventListener('change', (e) => {
            const elementsConfig = document.getElementById('elements-config');
            if (e.target.value === 'elements') {
                elementsConfig.style.display = 'block';
            } else {
                elementsConfig.style.display = 'none';
            }
        });

        document.getElementById('horoscope-generate').addEventListener('click', () => {
            this.generateHoroscope();
        });
    }

    generateHoroscope() {
        const type = document.getElementById('horoscope-type').value;
        const elementCount = Math.max(1, parseInt(document.getElementById('horoscope-elements').value, 10) || 2);
        const available = this.getAvailableElements();
        const combos = this.getAvailableCombinations();
        if (type === 'elements' && available.length === 0) {
            this.showToast('没有可用的元素，请先选择词库或元素分组');
            return;
        }
        if (type === 'combinations' && combos.length === 0) {
            this.showToast('请先添加元素组合');
            return;
        }
        if (type === 'elements' && available.length < 12) this.showToast('因数量不足，可能出现重复');
        if (type === 'combinations' && combos.length < 12) this.showToast('因数量不足，可能出现重复');

        const zodiacs = [
            { name: '白羊座', symbol: '♈', dates: '3.21-4.19' },
            { name: '金牛座', symbol: '♉', dates: '4.20-5.20' },
            { name: '双子座', symbol: '♊', dates: '5.21-6.21' },
            { name: '巨蟹座', symbol: '♋', dates: '6.22-7.22' },
            { name: '狮子座', symbol: '♌', dates: '7.23-8.22' },
            { name: '处女座', symbol: '♍', dates: '8.23-9.22' },
            { name: '天秤座', symbol: '♎', dates: '9.23-10.23' },
            { name: '天蝎座', symbol: '♏', dates: '10.24-11.22' },
            { name: '射手座', symbol: '♐', dates: '11.23-12.21' },
            { name: '摩羯座', symbol: '♑', dates: '12.22-1.19' },
            { name: '水瓶座', symbol: '♒', dates: '1.20-2.18' },
            { name: '双鱼座', symbol: '♓', dates: '2.19-3.20' }
        ];

        const shuffledZodiacs = [...zodiacs].sort(() => Math.random() - 0.5);

        const horoscopeData = shuffledZodiacs.map((zodiac, index) => {
            let elements = [];
            let combinationId = null;
            if (type === 'elements') {
                elements = this.generateRandomElements(elementCount);
            } else {
                const combo = combos[Math.floor(Math.random() * combos.length)];
                combinationId = combo.id;
                elements = this.getElementsByIds(combo.elementIds || []);
            }
            const fortune = elements.length ? elements.map(e => e.name).join(' + ') : '—';
            return {
                ...zodiac,
                fortune,
                elements,
                combinationId,
                rank: index + 1,
                isTop3: index < 3
            };
        });

        this._horoscopeData = horoscopeData;
        this.displayHoroscopeResults(horoscopeData);
    }

    displayHoroscopeResults(horoscopeData) {
        const resultArea = document.getElementById('horoscope-result');
        const rankEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };
        const horoscopeHTML = horoscopeData.map((zodiac, index) => {
            const rankDisplay = zodiac.rank <= 3 ? rankEmoji[zodiac.rank] : `#${zodiac.rank}`;
            const itemRankClass = zodiac.rank <= 3 ? `horoscope-rank-${zodiac.rank}` : '';
            const chipsHtml = (zodiac.elements || []).map(e => `<span class="horoscope-fortune-chip" data-id="${e.id}" title="点击打开元素">${e.name}</span>`).join('');
            const fortuneInner = chipsHtml || '<span class="horoscope-fortune-empty">—</span>';
            return `
            <div class="horoscope-item ${itemRankClass}" data-rank="${zodiac.rank}" data-index="${index}">
                <div class="horoscope-header">
                    <div class="zodiac-info">
                        <span class="zodiac-symbol">${zodiac.symbol}</span>
                        <div class="zodiac-details">
                            <h4>${zodiac.name}</h4>
                            <small>${zodiac.dates}</small>
                        </div>
                    </div>
                    <div class="zodiac-rank">
                        <span class="rank-display${zodiac.rank > 3 ? ' rank-num' : ''}">${rankDisplay}</span>
                    </div>
                </div>
                <div class="horoscope-fortune" title="点击空白处打开组合">
                    ${fortuneInner}
                </div>
            </div>
        `;
        }).join('');

        resultArea.innerHTML = `
            <div class="horoscope-list">
                <div class="horoscope-title">
                    <h4>今日星座运势排行</h4>
                </div>
                ${horoscopeHTML}
            </div>
        `;

        resultArea.querySelectorAll('.horoscope-fortune-chip').forEach(chip => {
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showElementModalById(chip.dataset.id);
            });
        });
        resultArea.querySelectorAll('.horoscope-fortune').forEach((el, index) => {
            const data = this._horoscopeData && this._horoscopeData[index];
            if (!data || !data.elements || !data.elements.length) return;
            el.style.cursor = 'pointer';
            el.addEventListener('click', (e) => {
                if (e.target.closest('.horoscope-fortune-chip')) return;
                e.stopPropagation();
                const ids = data.elements.map(x => x.id);
                if (ids.length === 1) this.showElementModalById(ids[0]);
                else this.showEditCombinationModal(data.combinationId || null, ids);
            });
        });

        const items = resultArea.querySelectorAll('.horoscope-item');
        items.forEach((item, index) => {
            setTimeout(() => item.classList.add('fade-in'), index * 100);
        });
    }
    // 色彩生成器：色块方框，点击显示详情可复制；左侧随机生成，右侧自定义选色固定；多种搭配展示
    renderColorGenerator() {
        this._colorFixed = this._colorFixed || new Set();
        this._colorCurrentResults = this._colorCurrentResults || [];
        this._colorCustomList = this._colorCustomList || [];
        this._colorSelectedIndex = null;
        this._colorComboOrder = [];
        this._colorViewingFavoriteId = this._colorViewingFavoriteId || null; // 当前搭配效果是否在显示某条收藏，再次点击同一条则取消
        this._colorFavoritesPage = this._colorFavoritesPage || 0;
        this._colorFavoritesPageSize = 10;

        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content color-tool-content">
                <h3>色彩生成器</h3>
                <div class="form-group">
                    <label>生成数量</label>
                    <input type="number" id="color-count" class="form-control" value="5" min="1" max="20">
                </div>
                <button id="color-generate" class="btn generate-btn">生成</button>
                <p class="color-hint">点击色块显示详情并复制；长按色块可固定。</p>
                <div id="color-blocks" class="color-blocks"></div>
                <div id="color-detail" class="color-detail hidden">
                    <div class="color-detail-title">详情（点击复制）</div>
                    <div id="color-detail-hsl" class="color-detail-row" title="点击复制">—</div>
                    <div id="color-detail-hex" class="color-detail-row" title="点击复制">—</div>
                </div>
                <section class="color-fixed-section">
                    <div class="color-fixed-head">
                        <span class="color-sidebar-title">自定义颜色</span>
                        <div class="color-current-swatch" id="color-current-swatch" title="当前颜色"></div>
                    </div>
                    <div class="color-wheel-wrap" id="color-wheel-wrap" title="点击或拖动选色（色相+饱和度）">
                        <div class="color-wheel-bg" id="color-wheel-bg"></div>
                        <div class="color-wheel-handle" id="color-wheel-handle"></div>
                    </div>
                    <div class="color-sliders">
                        <div class="color-slider-row">
                            <label>H</label>
                            <input type="range" id="color-h" min="0" max="360" value="210">
                            <input type="number" id="color-h-num" class="color-slider-num" min="0" max="360" value="210">
                        </div>
                        <div class="color-slider-row">
                            <label>S</label>
                            <input type="range" id="color-s" min="0" max="100" value="55">
                            <input type="number" id="color-s-num" class="color-slider-num" min="0" max="100" value="55">
                        </div>
                        <div class="color-slider-row">
                            <label>L</label>
                            <input type="range" id="color-l" min="0" max="100" value="55">
                            <input type="number" id="color-l-num" class="color-slider-num" min="0" max="100" value="55">
                        </div>
                    </div>
                    <div class="color-values-display">
                        <span id="color-hsl-display" class="color-copy-value" title="点击复制 HSL">—</span>
                    </div>
                    <div class="color-hex-row">
                        <input type="text" id="color-hex-input" class="color-hex-input" placeholder="HEX #000000" maxlength="7">
                        <button type="button" id="color-add-btn" class="color-btn color-btn-add">添加</button>
                    </div>
                    <div id="color-custom-list" class="color-custom-list"></div>
                </section>
                <div id="color-combo" class="color-combo hidden">
                    <div class="color-combo-head">
                        <span class="color-combo-title">搭配效果</span>
                        <div class="color-combo-actions">
                            <button type="button" id="color-combo-save" class="color-btn color-btn-save">保存到收藏夹</button>
                            <button type="button" id="color-combo-shuffle" class="color-btn color-btn-shuffle">随机顺序</button>
                        </div>
                    </div>
                    <div class="color-previews">
                        <div class="color-preview-item">
                            <div class="color-preview-label">横条</div>
                            <div id="color-preview-bar" class="color-preview-bar"></div>
                        </div>
                        <div class="color-preview-item">
                            <div class="color-preview-label">渐变</div>
                            <div id="color-preview-gradient" class="color-preview-gradient"></div>
                        </div>
                        <div class="color-preview-item">
                            <div class="color-preview-label">圆环</div>
                            <div id="color-preview-ring" class="color-preview-ring"></div>
                        </div>
                        <div class="color-preview-item color-preview-item-circles">
                            <div class="color-preview-label">圆形叠叠乐</div>
                            <div id="color-preview-circles" class="color-preview-circles"></div>
                        </div>
                    </div>
                </div>
                <section class="color-favorites-section">
                    <div class="color-favorites-title">色彩收藏夹</div>
                    <p class="color-favorites-hint">点击收藏条目在上方搭配效果显示，再次点击恢复。</p>
                    <div id="color-favorites-list" class="color-favorites-list"></div>
                    <div id="color-favorites-pagination" class="color-favorites-pagination hidden"></div>
                </section>
            </div>
        `;

        document.getElementById('color-generate').addEventListener('click', () => this.generateColors());
        document.getElementById('color-combo-shuffle').addEventListener('click', () => this.shuffleColorComboOrder());
        document.getElementById('color-combo-save').addEventListener('click', () => this._colorSaveToFavorites());
        document.getElementById('color-add-btn').addEventListener('click', () => this._colorAddCustom());
        this._colorPick = { h: 210, s: 55, l: 55 };
        const hexInput = document.getElementById('color-hex-input');
        const hEl = document.getElementById('color-h');
        const sEl = document.getElementById('color-s');
        const lEl = document.getElementById('color-l');
        const hNum = document.getElementById('color-h-num');
        const sNum = document.getElementById('color-s-num');
        const lNum = document.getElementById('color-l-num');
        const hslDisplay = document.getElementById('color-hsl-display');
        const wheelWrap = document.getElementById('color-wheel-wrap');
        const wheelHandle = document.getElementById('color-wheel-handle');
        const wheelBg = document.getElementById('color-wheel-bg');
        const currentSwatch = document.getElementById('color-current-swatch');
        const WHEEL_R = 60; // 与 .color-wheel-wrap 半径一致，点击位置即手柄位置
        const syncFromPick = () => {
            const { h, s, l } = this._colorPick;
            const hslStr = `hsl(${h}, ${s}%, ${l}%)`;
            const hexStr = this.hslToHex(h, s, l);
            if (hexInput) hexInput.value = hexStr;
            if (hEl) hEl.value = h;
            if (sEl) sEl.value = s;
            if (lEl) lEl.value = l;
            if (hNum) hNum.value = h;
            if (sNum) sNum.value = s;
            if (lNum) lNum.value = l;
            if (hslDisplay) { hslDisplay.textContent = hslStr; hslDisplay.dataset.copy = hslStr; }
            if (wheelHandle) {
                const angleRad = ((h - 90) * Math.PI) / 180;
                const dx = (s / 100) * WHEEL_R * Math.cos(angleRad);
                const dy = (s / 100) * WHEEL_R * Math.sin(angleRad);
                wheelHandle.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px)`;
            }
            if (wheelBg) wheelBg.style.setProperty('--pick-l', `${l}%`);
            if (currentSwatch) currentSwatch.style.backgroundColor = hslStr;
        };
        const setPickFromHSL = (h, s, l) => {
            this._colorPick = { h: h ?? this._colorPick.h, s: s ?? this._colorPick.s, l: l ?? this._colorPick.l };
            syncFromPick();
        };
        const bindSliderWithNum = (rangeEl, numEl, min, max, setter) => {
            if (!rangeEl || !numEl) return;
            rangeEl.addEventListener('input', () => setter(parseInt(rangeEl.value, 10)));
            numEl.addEventListener('input', () => {
                let v = parseInt(numEl.value, 10);
                if (isNaN(v)) return;
                v = Math.max(min, Math.min(max, v));
                numEl.value = v;
                setter(v);
            });
            numEl.addEventListener('change', () => {
                let v = parseInt(numEl.value, 10);
                if (isNaN(v)) v = min;
                v = Math.max(min, Math.min(max, v));
                numEl.value = v;
                rangeEl.value = v;
                setter(v);
            });
            const row = rangeEl.closest('.color-slider-row');
            if (row) {
                row.addEventListener('click', (e) => {
                    if (e.target === numEl) return;
                    const rect = rangeEl.getBoundingClientRect();
                    if (e.clientX < rect.left || e.clientX > rect.right) return;
                    const percent = (e.clientX - rect.left) / rect.width;
                    const val = Math.round(min + percent * (max - min));
                    const clamped = Math.max(min, Math.min(max, val));
                    rangeEl.value = clamped;
                    numEl.value = clamped;
                    setter(clamped);
                });
            }
        };
        bindSliderWithNum(hEl, hNum, 0, 360, (v) => setPickFromHSL(v, null, null));
        bindSliderWithNum(sEl, sNum, 0, 100, (v) => setPickFromHSL(null, v, null));
        bindSliderWithNum(lEl, lNum, 0, 100, (v) => setPickFromHSL(null, null, v));
        if (hslDisplay) hslDisplay.addEventListener('click', () => { const t = hslDisplay.dataset.copy; if (t) navigator.clipboard.writeText(t).then(() => this.showToast('已复制 HSL')); });
        hexInput && hexInput.addEventListener('input', () => {
            let hex = hexInput.value.trim();
            if (!hex.startsWith('#')) hex = '#' + hex;
            const hsl = this.hexToHsl(hex);
            if (hsl) setPickFromHSL(hsl.h, hsl.s, hsl.l);
        });
        syncFromPick();
        this._bindColorWheelDrag(wheelWrap, (h, s) => {
            this._colorPick.h = Math.round(h);
            this._colorPick.s = Math.round(s);
            syncFromPick();
        });

        const params = (this.userData && this.userData.settings && this.userData.settings.toolParams && this.userData.settings.toolParams.color) || {};
        if (params.count != null) {
            const countEl = document.getElementById('color-count');
            if (countEl) countEl.value = params.count;
        }
        this._renderColorCustomList();
        this._renderColorFavorites();
        if (this._colorCurrentResults.length > 0 || this._colorCustomList.length > 0) this.displayColors(this._colorCurrentResults);
    }

    _colorSaveToFavorites() {
        const ordered = this._getAllColorsForPreview();
        if (!ordered.length) {
            this.showToast('当前没有可保存的搭配');
            return;
        }
        const list = this.userData.colorFavorites || [];
        const id = 'cf_' + Date.now();
        const name = '搭配 ' + new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        list.push({
            id,
            name,
            colors: ordered.map(c => ({ hsl: c.hsl, hex: c.hex })),
            createdAt: Date.now()
        });
        this.userData.colorFavorites = list;
        this.saveUserData();
        this._renderColorFavorites();
        this.showToast('已保存到色彩收藏夹');
    }

    _renderColorFavorites() {
        const listEl = document.getElementById('color-favorites-list');
        const paginationEl = document.getElementById('color-favorites-pagination');
        if (!listEl) return;
        const list = this.userData.colorFavorites || [];
        const pageSize = this._colorFavoritesPageSize || 10;
        const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
        if (this._colorFavoritesPage >= totalPages) this._colorFavoritesPage = Math.max(0, totalPages - 1);
        const start = this._colorFavoritesPage * pageSize;
        const pageList = list.slice(start, start + pageSize);

        listEl.innerHTML = list.length === 0
            ? '<p class="color-favorites-empty">暂无收藏，在搭配效果处点击「保存到收藏夹」即可保存当前横条顺序。</p>'
            : pageList.map(fav => {
                const isActive = this._colorViewingFavoriteId === fav.id;
                return `
                <div class="color-favorite-item ${isActive ? 'color-favorite-item--active' : ''}" data-favorite-id="${fav.id}" title="点击在搭配效果中显示，再次点击取消">
                    <div class="color-favorite-bar">${(fav.colors || []).map(c => `<span class="color-preview-swatch" style="background:${c.hsl}" title="${c.hex}"></span>`).join('')}</div>
                    <span class="color-favorite-name">${this._getComboDisplayName(fav)}</span>
                    <button type="button" class="color-favorite-remove" data-favorite-id="${fav.id}" aria-label="删除">×</button>
                </div>
            `;
            }).join('');

        if (paginationEl) {
            if (list.length === 0) {
                paginationEl.classList.add('hidden');
                paginationEl.innerHTML = '';
            } else {
                paginationEl.classList.remove('hidden');
                const page = this._colorFavoritesPage + 1;
                paginationEl.innerHTML = `
                    <span class="color-favorites-total">共 ${list.length} 条</span>
                    <button type="button" class="color-btn color-btn-pagination" id="color-fav-prev" ${this._colorFavoritesPage === 0 ? 'disabled' : ''}>上一页</button>
                    <span class="color-favorites-page-info">第</span>
                    <input type="number" id="color-fav-page-input" class="color-fav-page-input" min="1" max="${totalPages}" value="${page}" title="输入页码回车跳转">
                    <span class="color-favorites-page-info">/ ${totalPages} 页</span>
                    <button type="button" class="color-btn color-btn-pagination" id="color-fav-next" ${this._colorFavoritesPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
                `;
                const prevBtn = document.getElementById('color-fav-prev');
                const nextBtn = document.getElementById('color-fav-next');
                const pageInput = document.getElementById('color-fav-page-input');
                if (prevBtn) prevBtn.addEventListener('click', () => {
                    if (this._colorFavoritesPage > 0) {
                        this._colorFavoritesPage--;
                        this._renderColorFavorites();
                    }
                });
                if (nextBtn) nextBtn.addEventListener('click', () => {
                    if (this._colorFavoritesPage < totalPages - 1) {
                        this._colorFavoritesPage++;
                        this._renderColorFavorites();
                    }
                });
                if (pageInput) {
                    const jumpToPage = () => {
                        let n = parseInt(pageInput.value, 10);
                        if (isNaN(n) || n < 1) n = 1;
                        if (n > totalPages) n = totalPages;
                        this._colorFavoritesPage = n - 1;
                        this._renderColorFavorites();
                    };
                    pageInput.addEventListener('change', jumpToPage);
                    pageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') jumpToPage(); });
                }
            }
        }

        listEl.querySelectorAll('.color-favorite-item').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('color-favorite-remove')) return;
                const id = row.dataset.favoriteId;
                const fav = (this.userData.colorFavorites || []).find(f => f.id === id);
                if (!fav || !fav.colors || !fav.colors.length) return;
                const comboEl = document.getElementById('color-combo');
                if (this._colorViewingFavoriteId === id) {
                    this._colorViewingFavoriteId = null;
                    if (comboEl) comboEl.classList.remove('hidden');
                    this._updateColorComboPreview();
                    this._renderColorFavorites();
                    this.showToast('已恢复显示当前结果');
                } else {
                    this._colorViewingFavoriteId = id;
                    if (comboEl) comboEl.classList.remove('hidden');
                    this._updateColorComboPreview(fav.colors);
                    this._renderColorFavorites();
                    this.showToast('已在搭配效果中显示');
                }
            });
        });
        listEl.querySelectorAll('.color-favorite-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.favoriteId;
                this.userData.colorFavorites = (this.userData.colorFavorites || []).filter(f => f.id !== id);
                this.saveUserData();
                if (this._colorViewingFavoriteId === id) this._colorViewingFavoriteId = null;
                const totalPages = Math.max(1, Math.ceil(this.userData.colorFavorites.length / (this._colorFavoritesPageSize || 10)));
                if (this._colorFavoritesPage >= totalPages) this._colorFavoritesPage = Math.max(0, totalPages - 1);
                this._renderColorFavorites();
                if (this._colorViewingFavoriteId === null && (this._colorCurrentResults || []).length + (this._colorCustomList || []).length > 0)
                    this._updateColorComboPreview();
                this.showToast('已删除');
            });
        });
    }

    _bindColorWheelDrag(wheelEl, onHSChange) {
        if (!wheelEl) return;
        const getHSFromEvent = (e) => {
            const rect = wheelEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
            const ex = e.touches ? e.touches[0].clientX : e.clientX;
            const ey = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = ex - cx, dy = ey - cy;
            const r = Math.min(rect.width, rect.height) / 2;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > r) distance = r;
            const angle = Math.atan2(dy, dx);
            const h = Math.round((angle * 180 / Math.PI + 90 + 360) % 360);
            const s = Math.round((distance / r) * 100);
            return { h, s };
        };
        const applyAt = (e) => {
            const { h, s } = getHSFromEvent(e);
            onHSChange(h, s);
        };
        const onDown = (e) => {
            e.preventDefault();
            applyAt(e);
            const onMove = (ev) => {
                ev.preventDefault();
                applyAt(ev);
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onMove, { passive: false });
                document.removeEventListener('touchend', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        };
        wheelEl.addEventListener('mousedown', onDown);
        wheelEl.addEventListener('touchstart', onDown, { passive: false });
    }

    _colorAddCustom() {
        const hexInput = document.getElementById('color-hex-input');
        let hex = (hexInput && hexInput.value.trim()) || '';
        if (!hex.startsWith('#')) hex = hex ? '#' + hex : '';
        let hsl = hex ? this.hexToHsl(hex) : null;
        if (!hsl && this._colorPick) hsl = this._colorPick;
        if (!hsl) { this.showToast('请选色或输入有效的 HEX'); return; }
        const h = hsl.h, s = hsl.s, l = hsl.l;
        hex = hex || this.hslToHex(h, s, l);
        const color = {
            hsl: `hsl(${h}, ${s}%, ${l}%)`,
            hex: hex.toLowerCase(),
            name: this.getColorName(h)
        };
        this._colorCustomList = this._colorCustomList || [];
        this._colorCustomList.push(color);
        this._renderColorCustomList();
        this._colorComboOrder = null;
        this._refreshColorComboFromAll();
        this.showToast('已添加');
    }

    _renderColorCustomList() {
        const listEl = document.getElementById('color-custom-list');
        if (!listEl) return;
        const list = this._colorCustomList || [];
        listEl.innerHTML = list.map((c, i) => `
            <div class="color-custom-chip" data-custom-index="${i}" style="background-color: ${c.hsl};">
                <button type="button" class="color-custom-remove" data-custom-index="${i}" aria-label="删除">×</button>
            </div>
        `).join('');
        listEl.querySelectorAll('.color-custom-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const i = parseInt(btn.dataset.customIndex, 10);
                this._colorCustomList.splice(i, 1);
                this._renderColorCustomList();
                this._refreshColorComboFromAll();
            });
        });
        listEl.querySelectorAll('.color-custom-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('color-custom-remove')) return;
                const i = parseInt(chip.dataset.customIndex, 10);
                const c = this._colorCustomList[i];
                const detailEl = document.getElementById('color-detail');
                const hslEl = document.getElementById('color-detail-hsl');
                const hexEl = document.getElementById('color-detail-hex');
                if (detailEl && hslEl && hexEl) {
                    detailEl.classList.remove('hidden');
                    hslEl.textContent = c.hsl; hslEl.dataset.copy = c.hsl;
                    hexEl.textContent = c.hex; hexEl.dataset.copy = c.hex;
                }
            });
        });
    }

    _getAllColorsForPreview() {
        const generated = this._colorCurrentResults || [];
        const custom = this._colorCustomList || [];
        const order = this._colorComboOrder;
        const combined = [...generated, ...custom];
        if (!combined.length) return [];
        const indices = order && order.length === combined.length ? order : combined.map((_, i) => i);
        return indices.map(i => combined[i]).filter(Boolean);
    }

    _refreshColorComboFromAll() {
        const ordered = this._getAllColorsForPreview();
        if (ordered.length) {
            const comboEl = document.getElementById('color-combo');
            if (comboEl) comboEl.classList.remove('hidden');
            this._colorComboOrder = ordered.map((_, i) => i);
            this._updateColorComboPreview();
        }
    }

    _saveColorToolParam(key, value) {
        if (!this.userData.settings.toolParams) this.userData.settings.toolParams = {};
        if (!this.userData.settings.toolParams.color) this.userData.settings.toolParams.color = {};
        this.userData.settings.toolParams.color[key] = value;
        this.saveUserData();
    }

    generateColors() {
        const countEl = document.getElementById('color-count');
        if (!countEl) return;
        const count = Math.max(1, Math.min(20, parseInt(countEl.value, 10) || 5));
        countEl.value = count;
        this._saveColorToolParam('count', count);

        const colors = [];
        const prev = this._colorCurrentResults || [];
        const fixed = this._colorFixed || new Set();
        for (let i = 0; i < count; i++) {
            if (fixed.has(i) && prev[i]) colors.push(prev[i]);
            else colors.push(this.generateRandomColor());
        }
        this._colorCurrentResults = colors;
        const combinedLen = colors.length + (this._colorCustomList || []).length;
        this._colorComboOrder = Array.from({ length: combinedLen }, (_, i) => i);
        this.displayColors(colors);
    }

    generateRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 101);   // 0-100%，包含灰与纯色
        const lightness = Math.floor(Math.random() * 101);   // 0-100%，包含黑与白
        
        const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        const hex = this.hslToHex(hue, saturation, lightness);
        
        return {
            hsl: hsl,
            hex: hex,
            name: this.getColorName(hue)
        };
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    hexToHsl(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length !== 6 && hex.length !== 3) return null;
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    getColorName(hue) {
        const colorNames = [
            { range: [0, 15], name: '红色' },
            { range: [15, 45], name: '橙色' },
            { range: [45, 75], name: '黄色' },
            { range: [75, 150], name: '绿色' },
            { range: [150, 210], name: '青色' },
            { range: [210, 270], name: '蓝色' },
            { range: [270, 330], name: '紫色' },
            { range: [330, 360], name: '红色' }
        ];

        for (const color of colorNames) {
            if (hue >= color.range[0] && hue < color.range[1]) {
                return color.name;
            }
        }
        return '未知色';
    }

    displayColors(colors) {
        const blocksEl = document.getElementById('color-blocks');
        const detailEl = document.getElementById('color-detail');
        const comboEl = document.getElementById('color-combo');
        if (!blocksEl) return;

        const fixed = this._colorFixed || new Set();
        const blocksHTML = colors.map((color, i) => {
            const isFixed = fixed.has(i);
            return `<div class="color-block ${isFixed ? 'color-block--fixed' : ''}" data-index="${i}" style="background-color: ${color.hsl};" title="${color.name}${isFixed ? '（已固定，长按取消）' : '（长按固定）'}"></div>`;
        }).join('');

        blocksEl.innerHTML = `<div class="color-blocks-grid">${blocksHTML}</div>`;

        blocksEl.querySelectorAll('.color-block').forEach(block => {
            const index = parseInt(block.dataset.index, 10);
            const color = colors[index];
            block.addEventListener('click', (e) => {
                if (this._colorLongPressHandled) return;
                this._colorSelectedIndex = index;
                detailEl.classList.remove('hidden');
                const hslEl = document.getElementById('color-detail-hsl');
                const hexEl = document.getElementById('color-detail-hex');
                if (hslEl) { hslEl.textContent = color.hsl; hslEl.dataset.copy = color.hsl; }
                if (hexEl) { hexEl.textContent = color.hex; hexEl.dataset.copy = color.hex; }
            });
            this._attachColorBlockLongPress(block, index);
        });

        if (this._colorSelectedIndex != null && colors[this._colorSelectedIndex]) {
            const c = colors[this._colorSelectedIndex];
            detailEl.classList.remove('hidden');
            const hslEl = document.getElementById('color-detail-hsl');
            const hexEl = document.getElementById('color-detail-hex');
            if (hslEl) { hslEl.textContent = c.hsl; hslEl.dataset.copy = c.hsl; }
            if (hexEl) { hexEl.textContent = c.hex; hexEl.dataset.copy = c.hex; }
        } else {
            detailEl.classList.add('hidden');
        }

        const hslRow = document.getElementById('color-detail-hsl');
        const hexRow = document.getElementById('color-detail-hex');
        if (hslRow) hslRow.onclick = () => { const t = hslRow.dataset.copy; if (t) navigator.clipboard.writeText(t).then(() => this.showToast(`已复制: ${t}`)); };
        if (hexRow) hexRow.onclick = () => { const t = hexRow.dataset.copy; if (t) navigator.clipboard.writeText(t).then(() => this.showToast(`已复制: ${t}`)); };

        const combined = [...(this._colorCurrentResults || []), ...(this._colorCustomList || [])];
        if (combined.length > 0) {
            comboEl.classList.remove('hidden');
            if (!this._colorComboOrder || this._colorComboOrder.length !== combined.length)
                this._colorComboOrder = combined.map((_, i) => i);
            this._colorViewingFavoriteId = null;
            this._updateColorComboPreview();
            this._renderColorFavorites();
        } else {
            comboEl.classList.add('hidden');
        }
    }

    _attachColorBlockLongPress(block, index) {
        let timer = null;
        const threshold = 500;
        const start = () => {
            this._colorLongPressHandled = false;
            timer = setTimeout(() => {
                timer = null;
                this._colorLongPressHandled = true;
                if (!this._colorFixed) this._colorFixed = new Set();
                if (this._colorFixed.has(index)) this._colorFixed.delete(index);
                else this._colorFixed.add(index);
                if (this._colorCurrentResults && this._colorCurrentResults.length) this.displayColors(this._colorCurrentResults);
                this.showToast(this._colorFixed.has(index) ? '已固定该色块' : '已取消固定');
            }, threshold);
        };
        const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
        block.addEventListener('mousedown', (e) => { e.preventDefault(); start(); });
        block.addEventListener('mouseup', cancel);
        block.addEventListener('mouseleave', cancel);
        block.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
        block.addEventListener('touchend', cancel);
        block.addEventListener('touchcancel', cancel);
    }

    _updateColorComboPreview(orderedOverride) {
        const ordered = orderedOverride && orderedOverride.length > 0 ? orderedOverride : this._getAllColorsForPreview();
        if (!ordered.length) return;

        const barEl = document.getElementById('color-preview-bar');
        const gradientEl = document.getElementById('color-preview-gradient');
        const ringEl = document.getElementById('color-preview-ring');
        const circlesEl = document.getElementById('color-preview-circles');

        const maxCircles = 8;

        if (barEl) barEl.innerHTML = ordered.map(c => `<span class="color-preview-swatch" style="background:${c.hsl}" title="${c.hex}"></span>`).join('');
        if (gradientEl) {
            const n = ordered.length;
            const stops = n === 1 ? `${ordered[0].hsl} 0%, ${ordered[0].hsl} 100%` : ordered.map((c, i) => `${c.hsl} ${(i / (n - 1)) * 100}%`).join(', ');
            gradientEl.style.background = `linear-gradient(to right, ${stops})`;
        }
        if (ringEl) {
            const n = ordered.length;
            const stops = n === 1 ? `${ordered[0].hsl} 0%, ${ordered[0].hsl} 100%` : ordered.map((c, i) => `${c.hsl} ${(i / n) * 100}%`).join(', ');
            ringEl.style.background = `conic-gradient(${stops})`;
        }
        if (circlesEl) {
            const limited = ordered.slice(0, maxCircles);
            circlesEl.innerHTML = limited.map((c, i) => `<span class="color-preview-circle" style="background:${c.hsl}; z-index:${i}" title="${c.hex}"></span>`).join('');
        }
    }

    shuffleColorComboOrder() {
        const combined = [...(this._colorCurrentResults || []), ...(this._colorCustomList || [])];
        if (!combined.length) return;
        const order = combined.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        this._colorComboOrder = order;
        this._colorViewingFavoriteId = null;
        this._updateColorComboPreview();
        this._renderColorFavorites();
        this.showToast('已随机调整顺序');
    }

    // 暂停挑战：点击屏幕开始/停止，底下重置与截图，截到的在下方可点击操作；快速变化时灰色简洁
    renderPauseChallenge() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>暂停挑战</h3>
                <p class="pause-hint">元素来自词库与元素分组，组合来自元素组合分组。点击屏幕开始，截图后可在下方操作。</p>
                <div class="pause-config">
                    <div class="form-group">
                        <label>类型</label>
                        <select id="pause-type" class="form-control">
                            <option value="elements">元素</option>
                            <option value="combinations">元素组合</option>
                        </select>
                    </div>
                    <div id="pause-elements-config" class="form-group">
                        <label>每次数量</label>
                        <input type="number" id="pause-elements" class="form-control" value="1" min="1" max="5">
                    </div>
                    <div class="pause-display">
                        <div class="pause-screen" id="pause-screen" title="点击开始 / 再次点击停止">
                            <div class="pause-text" id="pause-text">点击屏幕开始</div>
                        </div>
                        <div class="pause-controls">
                            <button type="button" id="pause-reset" class="btn btn-secondary">重置</button>
                            <button type="button" id="pause-capture" class="btn btn-primary">截图</button>
                        </div>
                    </div>
                    <div id="pause-captured-wrap" class="pause-captured-wrap hidden">
                        <div class="pause-captured-label">截取结果</div>
                        <div id="pause-captured" class="pause-captured"></div>
                    </div>
                </div>
            </div>
        `;

        this.pauseInterval = null;
        this.pauseRunning = false;
        this._pauseCurrentData = null;
        this._pauseCaptured = this._pauseCaptured || [];

        document.getElementById('pause-type').addEventListener('change', (e) => {
            const el = document.getElementById('pause-elements-config');
            if (el) el.style.display = e.target.value === 'elements' ? 'block' : 'none';
        });

        const screen = document.getElementById('pause-screen');
        screen.addEventListener('click', () => {
            if (this.pauseRunning) this.stopPauseChallenge();
            else this.startPauseChallenge();
        });

        document.getElementById('pause-reset').addEventListener('click', () => {
            this.stopPauseChallenge();
            this._pauseCaptured = [];
            const txt = document.getElementById('pause-text');
            const wrap = document.getElementById('pause-captured-wrap');
            if (txt) txt.textContent = '点击屏幕开始';
            if (wrap) wrap.classList.add('hidden');
            this._renderPauseCaptured();
            this.showToast('已清除下方截取');
        });

        document.getElementById('pause-capture').addEventListener('click', () => {
            if (this._pauseCurrentData) {
                if (this.pauseRunning) this.stopPauseChallenge();
                this._pauseCaptured = this._pauseCaptured || [];
                this._pauseCaptured.push(this._pauseCurrentData);
                const txt = document.getElementById('pause-text');
                if (txt) txt.textContent = this._pauseCurrentData.text || '—';
                this._renderPauseCaptured();
                const wrap = document.getElementById('pause-captured-wrap');
                if (wrap) wrap.classList.remove('hidden');
                this.showToast('已截取，已加到下方');
            } else {
                this.showToast('请先点击屏幕开始');
            }
        });
    }

    startPauseChallenge() {
        const type = document.getElementById('pause-type').value;
        const elementCount = Math.max(1, Math.min(5, parseInt(document.getElementById('pause-elements').value, 10) || 1));

        let available = [];
        let combos = [];
        if (type === 'elements') {
            available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            if (elementCount > available.length) {
                this.showToast('可选元素不足');
                return;
            }
            if (available.length < elementCount * 2) this.showToast('数量不足，可能出现重复');
        } else {
            combos = this.getAvailableCombinations();
            if (combos.length === 0) {
                this.showToast('请先选择元素组合分组');
                return;
            }
            if (combos.length < 3) this.showToast('数量不足，可能出现重复');
        }

        this.pauseRunning = true;
        const pauseText = document.getElementById('pause-text');
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.classList.add('running');

        const PAUSE_INTERVAL_MS = 55;

        this.pauseInterval = setInterval(() => {
            let displayText = '';
            let data = null;
            if (type === 'elements') {
                const elements = this.generateRandomElements(elementCount);
                displayText = elements.length ? elements.map(e => e.name).join(' + ') : '—';
                data = { type: 'elements', elements, text: displayText };
            } else {
                const combinations = this.getAvailableCombinations();
                if (combinations.length > 0) {
                    const combo = combinations[Math.floor(Math.random() * combinations.length)];
                    const els = this.getElementsByIds(combo.elementIds || []);
                    displayText = els.length ? els.map(e => e.name).join(' + ') : '—';
                    data = { type: 'combination', combination: combo, elements: els, text: displayText };
                }
            }
            this._pauseCurrentData = data;
            if (pauseText) pauseText.textContent = displayText;
        }, PAUSE_INTERVAL_MS);
    }

    stopPauseChallenge() {
        if (!this.pauseRunning) return;
        this.pauseRunning = false;
        if (this.pauseInterval) clearInterval(this.pauseInterval);
        this.pauseInterval = null;
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) pauseScreen.classList.remove('running');
    }

    _renderPauseCaptured() {
        const container = document.getElementById('pause-captured');
        if (!container) return;
        container.innerHTML = '';
        const list = this._pauseCaptured || [];
        const quickFav = this.basicQuickFav;
        const quickBlacklist = this.basicQuickBlacklist;
        const openEdit = (comboId, elIds) => {
            this.showEditCombinationModal(comboId, elIds, false, null, () => this._renderPauseCaptured());
        };

        list.forEach((cap) => {
            const wrap = document.createElement('div');
            wrap.className = 'result-item-wrap pause-result-row';

            if (cap.type === 'elements' && cap.elements && cap.elements.length) {
                const els = cap.elements;
                els.forEach((e, i) => {
                    if (i > 0) {
                        const sep = document.createElement('span');
                        sep.className = 'result-item-sep';
                        sep.textContent = ' + ';
                        wrap.appendChild(sep);
                    }
                    const chip = document.createElement('span');
                    chip.className = 'result-item';
                    chip.textContent = e.name;
                    chip.dataset.id = e.id;
                    chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(e.id); });
                    wrap.appendChild(chip);
                });
                if (els.length > 1) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'btn result-action-btn result-combo-edit';
                    editBtn.textContent = '编辑';
                    editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(null, els.map(e => e.id)); });
                    wrap.appendChild(editBtn);
                    const ids = els.map(e => e.id);
                    if (quickFav) {
                        const favBtn = document.createElement('button');
                        favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                        favBtn.textContent = this._isComboInFav(null, ids) ? '已收藏' : '收藏';
                        favBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            this._quickFavCombo(null, ids);
                            this._renderPauseCaptured();
                        });
                        wrap.appendChild(favBtn);
                    }
                    if (quickBlacklist) {
                        const blackBtn = document.createElement('button');
                        blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                        blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                        blackBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                            if (nowAllBlack) this._quickUnblacklistIds(ids);
                            else this._quickBlacklistIds(ids);
                            this._renderPauseCaptured();
                        });
                        wrap.appendChild(blackBtn);
                    }
                }
            } else if (cap.type === 'combination' && cap.elements && cap.combination) {
                const els = cap.elements;
                const combo = cap.combination;
                els.forEach((e, i) => {
                    if (i > 0) {
                        const sep = document.createElement('span');
                        sep.className = 'result-item-sep';
                        sep.textContent = ' + ';
                        wrap.appendChild(sep);
                    }
                    const chip = document.createElement('span');
                    chip.className = 'result-item';
                    chip.textContent = e.name;
                    chip.dataset.id = e.id;
                    chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(e.id); });
                    wrap.appendChild(chip);
                });
                const editBtn = document.createElement('button');
                editBtn.className = 'btn result-action-btn result-combo-edit';
                editBtn.textContent = '编辑';
                editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(combo.id, combo.elementIds || []); });
                wrap.appendChild(editBtn);
                const ids = combo.elementIds || [];
                if (quickFav) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                    favBtn.textContent = this._isComboInFav(combo.id, ids) ? '已收藏' : '收藏';
                    favBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this._quickFavCombo(combo.id, ids);
                        this._renderPauseCaptured();
                    });
                    wrap.appendChild(favBtn);
                }
                if (quickBlacklist) {
                    const blackBtn = document.createElement('button');
                    blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                    blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    blackBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                        if (nowAllBlack) this._quickUnblacklistIds(ids);
                        else this._quickBlacklistIds(ids);
                        this._renderPauseCaptured();
                    });
                    wrap.appendChild(blackBtn);
                }
            }

            container.appendChild(wrap);
        });
    }
    // 转盘功能
    renderWheel() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>幸运转盘</h3>
                <div class="wheel-config">
                    <div class="form-group">
                        <label>转盘类型：</label>
                        <select id="wheel-type" class="form-control">
                            <option value="elements">元素</option>
                            <option value="combinations">元素组合</option>
                        </select>
                    </div>
                    <div id="elements-config" class="form-group">
                        <label>每个选项的元素数量：</label>
                        <input type="number" id="wheel-elements" class="form-control" value="1" min="1" max="3">
                    </div>
                    <div class="form-group">
                        <label>转盘选项数量：</label>
                        <input type="number" id="wheel-options" class="form-control" value="8" min="4" max="12">
                    </div>
                    <button id="wheel-refresh" class="btn btn-secondary">刷新转盘内容</button>
                </div>
                <div class="wheel-container">
                    <div class="wheel-wrapper">
                        <canvas id="wheel-canvas" width="300" height="300"></canvas>
                        <div class="wheel-pointer">▼</div>
                    </div>
                    <button id="wheel-spin" class="btn generate-btn">转动转盘</button>
                </div>
                <div id="wheel-result" class="wheel-result"></div>
            </div>
        `;

        this.wheelOptions = [];
        this.wheelSpinning = false;

        // 事件监听
        document.getElementById('wheel-type').addEventListener('change', (e) => {
            const elementsConfig = document.getElementById('elements-config');
            if (e.target.value === 'elements') {
                elementsConfig.style.display = 'block';
            } else {
                elementsConfig.style.display = 'none';
            }
            this.generateWheelOptions();
        });

        document.getElementById('wheel-elements').addEventListener('change', () => {
            this.generateWheelOptions();
        });

        document.getElementById('wheel-options').addEventListener('change', () => {
            this.generateWheelOptions();
        });

        document.getElementById('wheel-refresh').addEventListener('click', () => {
            this.generateWheelOptions();
        });

        document.getElementById('wheel-spin').addEventListener('click', () => {
            this.spinWheel();
        });

        // 初始化转盘
        this.generateWheelOptions();
    }

    generateWheelOptions() {
        const type = document.getElementById('wheel-type').value;
        const elementCount = Math.max(1, Math.min(3, parseInt(document.getElementById('wheel-elements').value, 10) || 1));
        const optionCount = Math.max(4, Math.min(12, parseInt(document.getElementById('wheel-options').value, 10) || 8));

        this.wheelOptions = [];

        if (type === 'elements') {
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                this.drawWheel();
                return;
            }
            if (available.length < optionCount * 2) this.showToast('因数量不足，可能出现重复');
            for (let i = 0; i < optionCount; i++) {
                const elements = this.generateRandomElements(elementCount);
                this.wheelOptions.push({
                    text: elements.map(e => e.name).join('+'),
                    elements: elements
                });
            }
        } else {
            const combinations = this.getAvailableCombinations();
            if (combinations.length === 0) {
                this.showToast('请先选择元素组合分组');
                this.drawWheel();
                return;
            }
            if (combinations.length < optionCount) this.showToast('因数量不足，可能出现重复');
            for (let i = 0; i < optionCount; i++) {
                const combo = combinations[Math.floor(Math.random() * combinations.length)];
                const els = this.getElementsByIds(combo.elementIds || []);
                this.wheelOptions.push({
                    text: els.length ? els.map(e => e.name).join('+') : '—',
                    combination: combo,
                    elements: els
                });
            }
        }

        this.drawWheel();
    }

    drawWheel() {
        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 140;
        const n = this.wheelOptions.length;
        if (n === 0) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const anglePerSection = (2 * Math.PI) / n;
        const colors = this.generateWheelColors(n);
        const topAngle = -Math.PI / 2;

        this.wheelOptions.forEach((option, index) => {
            const startAngle = topAngle + index * anglePerSection;
            const endAngle = topAngle + (index + 1) * anglePerSection;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSection / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            const text = option.text;
            if (text.length > 8) {
                const words = text.split('+');
                words.forEach((word, i) => {
                    ctx.fillText(word, radius * 0.7, -5 + i * 15);
                });
            } else {
                ctx.fillText(text, radius * 0.7, 0);
            }
            ctx.restore();
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    generateWheelColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 360 / count) % 360;
            colors.push(`hsl(${hue}, 70%, 80%)`);
        }
        return colors;
    }

    spinWheel() {
        if (this.wheelSpinning || this.wheelOptions.length === 0) return;

        const n = this.wheelOptions.length;
        // 先随机定答案，转盘只是展示动画，最后指针一定指到这一格
        const selectedIndex = Math.floor(Math.random() * n);
        const anglePerSection = 360 / n;
        // 指针在顶部(12点)；顺时针转时用负角度，顶部显示的是画布上 270° + R 的位置，要落在第 selectedIndex 扇区内
        const finalAngle = (selectedIndex + Math.random()) * anglePerSection;
        const spins = 6 + Math.floor(Math.random() * 4);
        const totalRotation = -(spins * 360 + finalAngle);

        this.wheelSpinning = true;
        document.getElementById('wheel-spin').disabled = true;
        const canvas = document.getElementById('wheel-canvas');
        const duration = 2400;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // 开头先猛转一阵（很快），后面逐渐减速停到答案，不要匀速
            const easeProgress = 1 - Math.pow(1 - progress, 2.2);
            const rotation = totalRotation * easeProgress;
            canvas.style.transform = `rotate(${rotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                canvas.style.transform = `rotate(${totalRotation}deg)`;
                this.wheelSpinning = false;
                document.getElementById('wheel-spin').disabled = false;
                this.showWheelResult(selectedIndex);
            }
        };

        animate();
    }

    showWheelResult(selectedIndex) {
        const n = this.wheelOptions.length;
        if (n === 0 || selectedIndex < 0 || selectedIndex >= n) return;
        const selectedOption = this.wheelOptions[selectedIndex];

        const resultArea = document.getElementById('wheel-result');
        resultArea.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'wheel-result-row result-item-wrap';

        const quickFav = this.basicQuickFav;
        const quickBlacklist = this.basicQuickBlacklist;
        const openEdit = (comboId, elIds) => {
            this.showEditCombinationModal(comboId, elIds, false, null, () => this._renderWheelResultRow(resultArea, selectedOption));
        };

        if (selectedOption.elements && selectedOption.elements.length) {
            const els = selectedOption.elements;
            els.forEach((e, i) => {
                if (i > 0) {
                    const sep = document.createElement('span');
                    sep.className = 'result-item-sep';
                    sep.textContent = ' + ';
                    wrap.appendChild(sep);
                }
                const chip = document.createElement('span');
                chip.className = 'result-item';
                chip.textContent = e.name;
                chip.dataset.id = e.id;
                chip.addEventListener('click', (ev) => { ev.stopPropagation(); this.showElementModalById(e.id); });
                wrap.appendChild(chip);
            });
            if (els.length > 1) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn result-action-btn result-combo-edit';
                editBtn.textContent = '编辑';
                editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openEdit(selectedOption.combination ? selectedOption.combination.id : null, els.map(e => e.id)); });
                wrap.appendChild(editBtn);
                const ids = els.map(e => e.id);
                if (quickFav) {
                    const favBtn = document.createElement('button');
                    favBtn.className = 'btn result-action-btn result-combo-edit result-quick-fav';
                    favBtn.textContent = this._isComboInFav(selectedOption.combination ? selectedOption.combination.id : null, ids) ? '已收藏' : '收藏';
                    favBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this._quickFavCombo(selectedOption.combination ? selectedOption.combination.id : null, ids);
                        this._renderWheelResultRow(resultArea, selectedOption);
                    });
                    wrap.appendChild(favBtn);
                }
                if (quickBlacklist) {
                    const blackBtn = document.createElement('button');
                    blackBtn.className = 'btn result-action-btn result-combo-edit result-quick-blacklist';
                    blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
                    blackBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const nowAllBlack = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; });
                        if (nowAllBlack) this._quickUnblacklistIds(ids);
                        else this._quickBlacklistIds(ids);
                        this._renderWheelResultRow(resultArea, selectedOption);
                    });
                    wrap.appendChild(blackBtn);
                }
            }
        }

        const label = document.createElement('div');
        label.className = 'wheel-result-label';
        label.textContent = '指针指向结果：';
        resultArea.appendChild(label);
        resultArea.appendChild(wrap);
    }

    _renderWheelResultRow(container, selectedOption) {
        if (!container || !selectedOption) return;
        const wrap = container.querySelector('.result-item-wrap');
        if (!wrap) return;
        const quickFav = this.basicQuickFav;
        const quickBlacklist = this.basicQuickBlacklist;
        const ids = (selectedOption.elements || []).map(e => e.id);
        const favBtn = wrap.querySelector('.result-quick-fav');
        const blackBtn = wrap.querySelector('.result-quick-blacklist');
        if (favBtn) favBtn.textContent = this._isComboInFav(selectedOption.combination ? selectedOption.combination.id : null, ids) ? '已收藏' : '收藏';
        if (blackBtn) blackBtn.textContent = ids.every(eid => { const el = this.getElementById(eid); return el && el.isBlacklisted; }) ? '已拉黑' : '拉黑';
    }
    // 词云功能：默认黑字、横竖填满壁纸，元素不足时允许重复并提示，不可下载壁纸
    renderWordCloud() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>词云壁纸</h3>
                <div class="wordcloud-config">
                    <div class="form-group">
                        <label>元素数量：</label>
                        <input type="number" id="wordcloud-count" class="form-control" value="30" min="10" max="100">
                    </div>
                    <button id="wordcloud-generate" class="btn generate-btn">生成词云</button>
                </div>
                <div id="wordcloud-result" class="wordcloud-result"></div>
            </div>
        `;

        document.getElementById('wordcloud-generate').addEventListener('click', () => {
            this.generateWordCloud();
        });
    }

    generateWordCloud() {
        const count = parseInt(document.getElementById('wordcloud-count').value, 10) || 30;
        const availableElements = this.getAvailableElements();
        if (availableElements.length === 0) {
            this.showToast('没有可用的元素，请检查词库选择');
            return;
        }

        const needRepeat = availableElements.length < count;
        if (needRepeat) this.showToast('因元素不足，已允许重复');

        const words = [];
        for (let i = 0; i < count; i++) {
            const element = availableElements[Math.floor(Math.random() * availableElements.length)];
            const r = Math.random();
            const sizeTier = r < 0.35 ? 0 : r < 0.7 ? 1 : 2;
            const sizeBase = sizeTier === 0 ? 0.05 + Math.random() * 0.18 : sizeTier === 1 ? 0.38 + Math.random() * 0.22 : 0.72 + Math.random() * 0.28;
            const vertical = Math.random() > 0.5;
            words.push({
                text: element.name,
                size: Math.min(1, sizeBase),
                vertical: vertical,
                element: element
            });
        }

        this.displayWordCloud(words);
    }

    _wordcloudMeasureText(text, fontSizePx, vertical) {
        const el = document.createElement('span');
        el.className = 'wordcloud-word wordcloud-word--black';
        el.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-weight:600;line-height:1.2;';
        el.style.fontSize = fontSizePx + 'px';
        if (vertical) {
            el.style.writingMode = 'vertical-rl';
            el.style.letterSpacing = '0.05em';
        }
        el.textContent = text;
        document.body.appendChild(el);
        const w = Math.ceil(el.offsetWidth) + 2;
        const h = Math.ceil(el.offsetHeight) + 2;
        document.body.removeChild(el);
        return { w, h };
    }

    _wordcloudOverlaps(rect, occupied, gap) {
        const [x, y, w, h] = [rect.x, rect.y, rect.w, rect.h];
        for (const o of occupied) {
            if (x + w + gap <= o.x || o.x + o.w + gap <= x) continue;
            if (y + h + gap <= o.y || o.y + o.h + gap <= y) continue;
            return true;
        }
        return false;
    }

    displayWordCloud(words) {
        const resultArea = document.getElementById('wordcloud-result');
        resultArea.innerHTML = `
            <div class="wordcloud-container">
                <div class="wordcloud-canvas" id="wordcloud-canvas"></div>
                <div class="wordcloud-controls">
                    <button class="btn btn-primary" onclick="window.app.generateWordCloud()">重新生成</button>
                </div>
            </div>
        `;

        const canvas = document.getElementById('wordcloud-canvas');
        if (!canvas) return;

        const runLayout = () => {
            const gap = 6;
            const minFont = 12;
            const maxFont = 32;
            const step = 5;
            const size = canvas.offsetWidth || 520;
            const pad = 16;
            const cluster = Math.max(200, size - pad * 2);
            const left = pad;
            const top = pad;
            const right = left + cluster;
            const bottom = top + cluster;
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;

            const wordInfos = words.map((w) => {
                const fontSize = Math.round(minFont + (maxFont - minFont) * w.size);
                const fs = Math.max(minFont, Math.min(maxFont, fontSize));
                const hor = this._wordcloudMeasureText(w.text, fs, false);
                const ver = this._wordcloudMeasureText(w.text, fs, true);
                return {
                    text: w.text,
                    element: w.element,
                    vertical: w.vertical,
                    fontSize: fs,
                    width: w.vertical ? ver.w : hor.w,
                    height: w.vertical ? ver.h : hor.h
                };
            });

            const small = wordInfos.filter((wi) => wi.fontSize <= 18);
            const medium = wordInfos.filter((wi) => wi.fontSize > 18 && wi.fontSize <= 24);
            const large = wordInfos.filter((wi) => wi.fontSize > 24);
            const ordered = [];
            const buckets = [large, small, medium];
            let bi = 0;
            while (ordered.length < wordInfos.length) {
                const b = buckets[bi % 3];
                if (b.length) ordered.push(b.shift());
                bi++;
            }

            const candidates = [];
            for (let py = top; py <= bottom; py += step) {
                for (let px = left; px <= right; px += step) {
                    const d = (px - centerX) ** 2 + (py - centerY) ** 2;
                    candidates.push({ x: px, y: py, d });
                }
            }
            candidates.sort((a, b) => a.d - b.d);

            const occupied = [];
            const placed = [];
            for (const wi of ordered) {
                let w = wi.width + gap, h = wi.height + gap;
                let x = -1, y = -1;
                for (const c of candidates) {
                    const px = Math.max(left, Math.min(right - w, c.x));
                    const py = Math.max(top, Math.min(bottom - h, c.y));
                    if (!this._wordcloudOverlaps({ x: px, y: py, w, h }, occupied, gap)) {
                        x = px;
                        y = py;
                        break;
                    }
                }
                if (x < 0) {
                    const vert = !wi.vertical;
                    const nw = vert ? this._wordcloudMeasureText(wi.text, wi.fontSize, true) : this._wordcloudMeasureText(wi.text, wi.fontSize, false);
                    w = nw.w + gap;
                    h = nw.h + gap;
                    for (const c of candidates) {
                        const px = Math.max(left, Math.min(right - w, c.x));
                        const py = Math.max(top, Math.min(bottom - h, c.y));
                        if (!this._wordcloudOverlaps({ x: px, y: py, w, h }, occupied, gap)) {
                            x = px;
                            y = py;
                            wi.width = nw.w;
                            wi.height = nw.h;
                            wi.vertical = vert;
                            break;
                        }
                    }
                }
                if (x >= 0) {
                    occupied.push({ x, y, w, h });
                    placed.push({ ...wi, x, y });
                }
            }

            let minX = size, minY = size, maxX = 0, maxY = 0;
            placed.forEach((p) => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x + p.width);
                maxY = Math.max(maxY, p.y + p.height);
            });
            const contentW = maxX - minX;
            const contentH = maxY - minY;
            const edgePad = 16;
            const canvasPadding = 40;
            const canvasSize = Math.max(200, Math.max(contentW, contentH) + 2 * edgePad + canvasPadding);
            canvas.style.width = canvasSize + 'px';
            canvas.style.height = canvasSize + 'px';

            const offsetX = edgePad - minX;
            const offsetY = edgePad - minY;

            canvas.innerHTML = '';
            placed.forEach((p) => {
                const span = document.createElement('span');
                span.className = 'wordcloud-word wordcloud-word--black wordcloud-word--placed';
                span.style.fontSize = p.fontSize + 'px';
                span.style.left = (p.x + offsetX) + 'px';
                span.style.top = (p.y + offsetY) + 'px';
                if (p.vertical) {
                    span.style.writingMode = 'vertical-rl';
                    span.style.letterSpacing = '0.05em';
                }
                span.textContent = p.text;
                span.dataset.elementId = p.element.id;
                span.addEventListener('click', () => {
                    if (p.element.id) this.showElementModalById(p.element.id);
                });
                canvas.appendChild(span);
            });
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(runLayout);
        });
    }
    // 十四行诗功能：可自定义分隔符，点击页面出下一行，每行可点击查看/编辑组合，支持历史
    renderSonnet() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>十四行诗</h3>
                <div class="sonnet-config">
                    <div class="form-group">
                        <label>分隔符（默认空格）：</label>
                        <input type="text" id="sonnet-sep" class="form-control" value=" " placeholder="留空或输入如 · 、|" maxlength="4">
                    </div>
                    <div class="form-group">
                        <label>每行元素数量范围：</label>
                        <div class="range-inputs">
                            <input type="number" id="sonnet-min" class="form-control" value="2" min="1" max="5" placeholder="最少">
                            <span>到</span>
                            <input type="number" id="sonnet-max" class="form-control" value="4" min="1" max="8" placeholder="最多">
                        </div>
                    </div>
                    <div class="sonnet-controls">
                        <label class="sonnet-check-label"><input type="checkbox" id="sonnet-show-num" checked> 显示行号</label>
                        <button id="sonnet-erase" class="btn btn-secondary">擦除本页</button>
                    </div>
                </div>
                <div id="sonnet-result" class="sonnet-result">
                    <div class="sonnet-paper" id="sonnet-paper">
                        <div class="sonnet-title">下一句诗从这里写下</div>
                        <div class="sonnet-lines" id="sonnet-lines"></div>
                        <div class="sonnet-footer">
                            <span class="line-counter" id="line-counter">第 0 行 · 点击页面添加下一行</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.sonnetLines = [];

        document.getElementById('sonnet-erase').addEventListener('click', () => {
            this.sonnetErasePage();
        });

        const paper = document.getElementById('sonnet-paper');
        paper.addEventListener('click', (e) => {
            if (e.target.closest('.sonnet-line')) return;
            if (e.target.closest('.sonnet-controls') || e.target.closest('.sonnet-config')) return;
            this.addSonnetLine();
        });

        document.getElementById('sonnet-show-num').addEventListener('change', () => {
            if (this.sonnetLines && this.sonnetLines.length > 0) this.renderSonnetLines();
        });
    }

    sonnetErasePage() {
        const count = this.sonnetLines ? this.sonnetLines.length : 0;
        this.sonnetLines = [];
        const linesEl = document.getElementById('sonnet-lines');
        const counterEl = document.getElementById('line-counter');
        if (linesEl) linesEl.innerHTML = '';
        if (counterEl) counterEl.textContent = '第 0 行 · 点击页面添加下一行';
        if (count > 0 && this.currentTool === 'sonnet') {
            const results = this.toolResults['sonnet'];
            if (Array.isArray(results) && results.length >= count) {
                this.toolResults['sonnet'] = results.slice(0, results.length - count);
            }
            let removed = 0;
            for (let i = (this.generationHistory || []).length - 1; i >= 0 && removed < count; i--) {
                if (this.generationHistory[i].tool === 'sonnet') {
                    this.generationHistory.splice(i, 1);
                    removed++;
                }
            }
            this.saveUserData();
        }
    }

    addSonnetLine() {
        const minElements = parseInt(document.getElementById('sonnet-min').value) || 2;
        const maxElements = parseInt(document.getElementById('sonnet-max').value) || 4;
        if (minElements > maxElements) {
            this.showToast('最小值不能大于最大值');
            return;
        }

        const elementCount = Math.floor(Math.random() * (maxElements - minElements + 1)) + minElements;
        const elements = this.generateRandomElements(elementCount);
        if (elements.length === 0) {
            this.showToast('没有可用的元素');
            return;
        }

        const sepEl = document.getElementById('sonnet-sep');
        const sep = (sepEl && sepEl.value !== undefined) ? sepEl.value : ' ';
        const line = {
            number: this.sonnetLines.length + 1,
            elements: elements,
            text: elements.map(e => e.name).join(sep || ' ')
        };

        this.sonnetLines.push(line);
        this.renderSonnetLines();

        const result = {
            type: 'combination',
            elements: elements.map(e => ({ id: e.id, name: e.name })),
            id: this.generateId()
        };
        this.toolResults[this.currentTool] = this.toolResults[this.currentTool] || [];
        this.toolResults[this.currentTool].push(result);
        this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
        this.saveUserData();
    }

    renderSonnetLines() {
        const linesContainer = document.getElementById('sonnet-lines');
        const lineCounter = document.getElementById('line-counter');
        const showNum = document.getElementById('sonnet-show-num') && document.getElementById('sonnet-show-num').checked;

        const linesHTML = this.sonnetLines.map(line => `
            <div class="sonnet-line fade-in" data-line="${line.number}">
                ${showNum ? `<span class="line-number">${line.number}.</span>` : ''}
                <span class="line-text">${line.text}</span>
            </div>
        `).join('');

        linesContainer.innerHTML = linesHTML;
        if (lineCounter) lineCounter.textContent = `第 ${this.sonnetLines.length} 行 · 点击页面添加下一行`;
        linesContainer.querySelectorAll('.sonnet-line').forEach(lineEl => {
            lineEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const lineNum = parseInt(lineEl.dataset.line, 10);
                const line = this.sonnetLines.find(l => l.number === lineNum);
                if (line && line.elements && line.elements.length) {
                    if (line.elements.length === 1) this.showElementModalById(line.elements[0].id);
                    else this.showEditCombinationModal(null, line.elements.map(x => x.id), false);
                }
            });
        });
    }

    // 种菜功能：种子按类分栏可收起、当前种子显示、农民自选几×几、生长动画含番茄、果篮简约白
    renderFarming() {
        const FARMING_SEED_CATEGORIES = [
            { name: '水果', emojis: ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝'] },
            { name: '蔬菜', emojis: ['🍄', '🍅', '🫒', '🥥', '🥑', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🥜', '🫘', '🌰'] },
            { name: '主食', emojis: ['🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮'] },
            { name: '面包', emojis: ['🍞', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇'] },
            { name: '点心饮料', emojis: ['🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯'] }
        ];
        const seedTabsHtml = FARMING_SEED_CATEGORIES.map((cat, idx) =>
            `<button type="button" class="seed-tab ${idx === 0 ? 'active' : ''}" data-tab="${idx}">${cat.name}</button>`
        ).join('');
        const seedPanelsHtml = FARMING_SEED_CATEGORIES.map((cat, idx) =>
            `<div class="seed-tab-panel ${idx === 0 ? '' : 'hidden'}" data-tab="${idx}">${cat.emojis.map(s => `<span class="seed-emoji" data-seed="${s}" title="${s}">${s}</span>`).join('')}</div>`
        ).join('');
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>种地大师</h3>
                <div class="farming-config">
                    <div class="form-group farming-mode-btns">
                        <label>模式：</label>
                        <div class="farming-mode-btn-group">
                            <button type="button" class="farming-mode-btn active" id="farming-mode-single" data-mode="single">精心培育</button>
                            <button type="button" class="farming-mode-btn" id="farming-mode-grid" data-mode="grid">我是农民</button>
                        </div>
                    </div>
                    <div class="form-group farming-grid-size hidden" id="farming-grid-size">
                        <label>土地：</label>
                        <input type="number" id="farming-rows" class="form-control" value="2" min="1" max="24" placeholder="行" style="width:4em"> ×
                        <input type="number" id="farming-cols" class="form-control" value="2" min="1" max="5" placeholder="列" style="width:4em">
                    </div>
                    <div class="form-group">
                        <label>生长时间（秒）：</label>
                        <input type="number" id="grow-time" class="form-control" value="10" min="5" max="60">
                    </div>
                    <div class="form-group">
                        <label>果子数量范围：</label>
                        <div class="range-inputs">
                            <input type="number" id="fruit-min" class="form-control" value="2" min="1" max="5" placeholder="最少">
                            <span>到</span>
                            <input type="number" id="fruit-max" class="form-control" value="4" min="1" max="8" placeholder="最多">
                        </div>
                    </div>
                </div>
                <div class="farming-tools">
                    <button type="button" class="farming-tool-btn" id="tool-shovel" title="点击后点土地开垦">🔨 铲子</button>
                    <button type="button" class="farming-tool-btn" id="tool-seed" title="点击展开选种子，选好后点土地播种"><span id="tool-seed-emoji">🍅</span> 种子</button>
                    <button type="button" class="farming-tool-btn" id="tool-water" title="点击后点土地浇水">🫗 水壶</button>
                    <button type="button" class="farming-tool-btn" id="farming-harvest-all" title="一键收获所有可收获的地块">🍅 一键收获</button>
                </div>
                <div class="farming-tool-hint" id="farming-tool-hint"></div>
                <div class="farming-seed-panel hidden" id="farming-seed-panel">
                    <div class="farming-current-seed">当前种子：<span id="farming-current-seed-emoji">🍅</span></div>
                    <div class="seed-tabs">${seedTabsHtml}</div>
                    <div class="seed-tab-panels">${seedPanelsHtml}</div>
                </div>
                <div class="farming-area">
                    <div class="farming-field-wrap">
                        <div class="farm-field" id="farm-field"></div>
                    </div>
                    <div class="farming-basket">
                        <div class="basket-summary" id="farming-basket-summary">总共 0 个果实</div>
                        <div class="basket-items" id="farming-basket"></div>
                        <div class="farming-basket-actions">
                            <button type="button" class="btn btn-secondary" id="farming-clear-basket">清空果篮</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.farmingState = {
            mode: 'single',
            tool: null,
            selectedSeed: '🍅',
            plots: [],
            basket: [],
            growTimeSec: 10,
            fruitMin: 2,
            fruitMax: 4,
            timers: [],
            growthIntervals: []
        };

        const gridSizeEl = document.getElementById('farming-grid-size');
        document.getElementById('farming-mode-single').addEventListener('click', () => {
            document.querySelectorAll('.farming-mode-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('farming-mode-single').classList.add('active');
            gridSizeEl.classList.add('hidden');
            this.farmingRebuildGrid();
        });
        document.getElementById('farming-mode-grid').addEventListener('click', () => {
            document.querySelectorAll('.farming-mode-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('farming-mode-grid').classList.add('active');
            gridSizeEl.classList.remove('hidden');
            this.farmingRebuildGrid();
        });
        gridSizeEl.classList.add('hidden');
        document.getElementById('farming-rows').addEventListener('change', () => this.farmingRebuildGrid());
        document.getElementById('farming-cols').addEventListener('change', () => this.farmingRebuildGrid());

        document.getElementById('tool-shovel').addEventListener('click', () => this.farmingSetTool('shovel'));
        document.getElementById('tool-seed').addEventListener('click', (e) => {
            if (e.target.closest('.seed-emoji')) return;
            const panel = document.getElementById('farming-seed-panel');
            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');
                this.farmingUpdateCurrentSeedLabel();
                this.farmingSetTool('seed');
            } else {
                panel.classList.add('hidden');
                if (this.farmingState.tool === 'seed') this.farmingSetTool(null);
            }
        });
        document.getElementById('tool-water').addEventListener('click', () => this.farmingSetTool('water'));
        document.getElementById('farming-harvest-all').addEventListener('click', () => this.farmingHarvestAll());
        document.getElementById('farming-clear-basket').addEventListener('click', () => { this.farmingState.basket = []; this.farmingRenderBasket(); });
        const hintEl = document.getElementById('farming-tool-hint');
        if (hintEl) hintEl.textContent = '点击拿取工具';

        document.querySelectorAll('.seed-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabIdx = tab.dataset.tab;
                document.querySelectorAll('.seed-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.seed-tab-panel').forEach(p => {
                    p.classList.toggle('hidden', p.dataset.tab !== tabIdx);
                });
            });
        });
        document.getElementById('farming-seed-panel').addEventListener('click', (e) => {
            const el = e.target.closest('.seed-emoji');
            if (!el) return;
            e.stopPropagation();
            this.farmingState.selectedSeed = el.dataset.seed;
            document.querySelectorAll('.farming-seed-panel .seed-emoji.selected').forEach(s => s.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('tool-seed-emoji').textContent = this.farmingState.selectedSeed;
            document.getElementById('farming-current-seed-emoji').textContent = this.farmingState.selectedSeed;
        });

        this.farmingRebuildGrid();
        this.farmingRenderBasket();
    }

    farmingUpdateCurrentSeedLabel() {
        const el = document.getElementById('farming-current-seed-emoji');
        if (el) el.textContent = this.farmingState.selectedSeed;
        document.querySelectorAll('.farming-seed-panel .seed-emoji.selected').forEach(s => s.classList.remove('selected'));
        const current = document.querySelector(`.farming-seed-panel .seed-emoji[data-seed="${this.farmingState.selectedSeed}"]`);
        if (current) current.classList.add('selected');
    }

    farmingRebuildGrid() {
        const modeBtn = document.querySelector('.farming-mode-btn.active');
        const mode = modeBtn ? modeBtn.dataset.mode : 'single';
        const isGrid = mode === 'grid';
        let size = 1, rows = 1, cols = 1;
        if (isGrid) {
            const rowsEl = document.getElementById('farming-rows');
            const colsEl = document.getElementById('farming-cols');
            rows = Math.max(1, Math.min(24, parseInt(rowsEl && rowsEl.value, 10) || 2));
            cols = Math.max(1, Math.min(5, parseInt(colsEl && colsEl.value, 10) || 2));
            if (rowsEl && parseInt(rowsEl.value, 10) > 24) rowsEl.value = 24;
            if (colsEl && parseInt(colsEl.value, 10) > 5) colsEl.value = 5;
            size = rows * cols;
        }
        const field = document.getElementById('farm-field');
        this.farmingState.timers.forEach(t => clearTimeout(t));
        this.farmingState.timers = [];
        (this.farmingState.growthIntervals || []).forEach(i => clearInterval(i));
        this.farmingState.growthIntervals = [];
        this.farmingState.plots = [];
        this.farmingState.mode = mode;
        field.innerHTML = '';
        field.className = 'farm-field' + (isGrid ? ' farm-field-grid' : '');
        if (isGrid) {
            const cellPx = size >= 25 ? 44 : size >= 16 ? 58 : size >= 9 ? 80 : 100;
            field.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
            field.classList.remove('farm-field-grid--medium', 'farm-field-grid--small', 'farm-field-grid--tiny');
            if (size >= 25) field.classList.add('farm-field-grid--tiny');
            else if (size >= 16) field.classList.add('farm-field-grid--small');
            else if (size >= 9) field.classList.add('farm-field-grid--medium');
        }
        for (let i = 0; i < size; i++) {
            const plot = document.createElement('div');
            plot.className = 'field-plot plot-wasteland';
            plot.dataset.index = String(i);
            plot.innerHTML = `<div class="plot-content">🪨</div><div class="plot-status">荒地</div>`;
            this.farmingState.plots.push({ state: 'wasteland', seed: null, wateredAt: null, timer: null, growthInterval: null });
            plot.addEventListener('click', () => this.farmingOnPlotClick(i));
            field.appendChild(plot);
        }
        this.farmingSetTool(null);
    }

    farmingSetTool(tool) {
        this.farmingState.tool = this.farmingState.tool === tool ? null : tool;
        document.querySelectorAll('.farming-tool-btn').forEach(b => b.classList.remove('active'));
        const hint = document.getElementById('farming-tool-hint');
        const seedPanel = document.getElementById('farming-seed-panel');
        if (seedPanel && tool !== 'seed') seedPanel.classList.add('hidden');
        if (this.farmingState.tool === 'shovel') {
            document.getElementById('tool-shovel').classList.add('active');
            hint.textContent = '开垦中：点击土地块开垦';
        } else if (this.farmingState.tool === 'seed') {
            document.getElementById('tool-seed').classList.add('active');
            hint.textContent = '播种中：先选下方种子，再点击土地块播种';
        } else if (this.farmingState.tool === 'water') {
            document.getElementById('tool-water').classList.add('active');
            hint.textContent = '浇水中：点击已播种的土地浇水';
        } else {
            if (hint) hint.textContent = '点击拿取工具';
        }
    }

    farmingOnPlotClick(index) {
        const plotState = this.farmingState.plots[index];
        const plotEl = document.getElementById('farm-field').children[index];
        if (!plotEl || !plotState) return;

        if (plotState.state === 'ready') {
            this.farmingHarvestOne(index);
            return;
        }
        if (this.farmingState.tool === 'shovel' && plotState.state === 'wasteland') {
            plotState.state = 'empty';
            plotEl.classList.remove('plot-wasteland');
            plotEl.querySelector('.plot-content').textContent = '🟫';
            plotEl.querySelector('.plot-status').textContent = '空地';
        } else if (this.farmingState.tool === 'seed') {
            if (plotState.state !== 'empty') return;
            plotState.state = 'planted';
            plotState.seed = this.farmingState.selectedSeed;
            plotEl.querySelector('.plot-content').textContent = this.farmingState.selectedSeed;
            plotEl.querySelector('.plot-status').innerHTML = '<span class="plot-status-nowrap">需浇水 💧</span>';
        } else if (this.farmingState.tool === 'water') {
            if (plotState.state !== 'planted') return;
            if (plotState.growthInterval) {
                clearInterval(plotState.growthInterval);
                plotState.growthInterval = null;
            }
            const growSec = parseInt(document.getElementById('grow-time').value) || 10;
            plotState.state = 'growing';
            plotState.wateredAt = Date.now();
            const contentEl = plotEl.querySelector('.plot-content');
            const stages = ['🌱', '🌿', '🌾', '🍅'];
            let stageIdx = 0;
            contentEl.textContent = stages[0];
            plotEl.querySelector('.plot-status').textContent = '生长中...';
            const timer = setTimeout(() => this.farmingCropReady(index), growSec * 1000);
            this.farmingState.timers.push(timer);
            plotState.timer = timer;
            const growthInterval = setInterval(() => {
                if (this.farmingState.plots[index].state !== 'growing') {
                    clearInterval(growthInterval);
                    return;
                }
                stageIdx = (stageIdx + 1) % stages.length;
                contentEl.textContent = stages[stageIdx];
            }, 800);
            this.farmingState.growthIntervals.push(growthInterval);
            plotState.growthInterval = growthInterval;
        }
    }

    farmingCropReady(index) {
        const plotState = this.farmingState.plots[index];
        const plotEl = document.getElementById('farm-field').children[index];
        if (!plotEl || plotState.state !== 'growing') return;
        plotState.state = 'ready';
        plotEl.querySelector('.plot-content').textContent = plotState.seed || '🍎';
        plotEl.querySelector('.plot-status').textContent = '可收获！';
        plotEl.classList.add('ready-to-harvest');
    }

    farmingHarvestOne(index) {
        const plotState = this.farmingState.plots[index];
        const plotEl = document.getElementById('farm-field').children[index];
        if (!plotEl || plotState.state !== 'ready') return;
        const minF = parseInt(document.getElementById('fruit-min').value) || 2;
        const maxF = parseInt(document.getElementById('fruit-max').value) || 4;
        const count = Math.floor(Math.random() * (maxF - minF + 1)) + minF;
        const elements = this.generateRandomElements(count);
        const seedEmoji = plotState.seed || '🍎';
        plotState.state = 'empty';
        plotState.seed = null;
        plotState.wateredAt = null;
        plotEl.classList.remove('ready-to-harvest');
        plotEl.querySelector('.plot-content').textContent = '🟫';
        plotEl.querySelector('.plot-status').textContent = '空地';
        this.farmingState.basket.push({ elements, count, seedEmoji });
        this.farmingRenderBasket();
        this.farmingShowHarvestBubble(plotEl, seedEmoji);
        const result = { type: 'combination', elements: elements.map(e => ({ id: e.id, name: e.name })), id: this.generateId() };
        this.toolResults[this.currentTool] = this.toolResults[this.currentTool] || [];
        this.toolResults[this.currentTool].push(result);
        this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
        this.saveUserData();
        this.showToast(`你收获了 ${count} 个果实！`);
    }

    farmingShowHarvestBubble(plotEl, emoji) {
        const b = document.createElement('div');
        b.className = 'harvest-bubble';
        b.textContent = emoji;
        plotEl.appendChild(b);
        setTimeout(() => b.remove(), 800);
    }

    farmingRenderBasket() {
        const container = document.getElementById('farming-basket');
        const summaryEl = document.getElementById('farming-basket-summary');
        if (!container) return;
        const basket = this.farmingState.basket;
        const totalCount = basket.reduce((s, item) => s + (item.count || 0), 0);
        if (summaryEl) summaryEl.textContent = `总共 ${totalCount} 个果实`;
        if (basket.length === 0) {
            container.innerHTML = '<span class="basket-empty">暂无果实</span>';
            return;
        }
        container.innerHTML = basket.map((item, i) => {
            const emoji = item.seedEmoji || '🍎';
            const els = item.elements || [];
            const parts = els.map((e, j) => (j > 0 ? '<span class="basket-combo-sep"> + </span>' : '') + `<span class="basket-combo-element" data-id="${e.id}">${e.name}</span>`).join('');
            return `<div class="basket-item-combo" data-idx="${i}"><span class="basket-item-emoji">${emoji}：</span><span class="basket-item-combo-inner">${parts || '—'}</span></div>`;
        }).join('');
        container.querySelectorAll('.basket-item-combo').forEach(wrap => {
            wrap.addEventListener('click', (e) => {
                const idx = parseInt(wrap.dataset.idx, 10);
                const item = this.farmingState.basket[idx];
                if (!item || !item.elements || !item.elements.length) return;
                const el = e.target.closest('.basket-combo-element');
                if (el) {
                    e.stopPropagation();
                    this.showElementModalById(el.dataset.id);
                } else {
                    this.showEditCombinationModal(null, item.elements.map(x => x.id), false);
                }
            });
        });
    }

    farmingHarvestAll() {
        const readyIndexes = [];
        this.farmingState.plots.forEach((p, i) => { if (p.state === 'ready') readyIndexes.push(i); });
        if (readyIndexes.length === 0) {
            this.showToast('没有可收获的土地');
            return;
        }
        let totalCount = 0;
        const allElements = [];
        readyIndexes.forEach(index => {
            const plotState = this.farmingState.plots[index];
            const plotEl = document.getElementById('farm-field').children[index];
            const minF = parseInt(document.getElementById('fruit-min').value) || 2;
            const maxF = parseInt(document.getElementById('fruit-max').value) || 4;
            const count = Math.floor(Math.random() * (maxF - minF + 1)) + minF;
            const elements = this.generateRandomElements(count);
            totalCount += count;
            const seedEmoji = plotState.seed || '🍎';
            plotState.state = 'empty';
            plotState.seed = null;
            plotEl.classList.remove('ready-to-harvest');
            plotEl.querySelector('.plot-content').textContent = '🟫';
            plotEl.querySelector('.plot-status').textContent = '空地';
            this.farmingState.basket.push({ elements, count, seedEmoji });
            const result = { type: 'combination', elements: elements.map(e => ({ id: e.id, name: e.name })), id: this.generateId() };
            this.toolResults[this.currentTool] = this.toolResults[this.currentTool] || [];
            this.toolResults[this.currentTool].push(result);
            this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
        });
        this.saveUserData();
        this.farmingRenderBasket();
        this.showToast(`收获了 ${totalCount} 个果实！`);
    }

    renderCatchGame() {
        const CATCH_THEMES = {
            fruit: { label: '水果', emojis: ['🍎', '🍌', '🍇', '🍓', '🥝', '🍑', '🥭', '🍍', '🥥', '🍊', '🍋', '🥑', '🍐', '🍒', '🫐', '🍈', '🍉'] },
            vegetable: { label: '蔬菜', emojis: ['🥕', '🥬', '🥦', '🌽', '🥒', '🍅', '🫑', '🧄', '🧅', '🥔', '🫒', '🥗'] },
            dessert: { label: '甜品', emojis: ['🍰', '🎂', '🧁', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍦', '🍧', '🍨', '🥧', '🍯'] },
            food: { label: '美食', emojis: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🍱', '🍣', '🥟', '🍜', '🍝', '🍲', '🥘', '🍛', '🍡'] },
            emoji: { label: '表情', emojis: ['😀', '😊', '🥰', '😎', '🤩', '😇', '🥳', '🤗', '😺', '🐶', '🐱', '🐻', '🐼', '🦊', '🐰', '🐨', '⭐', '🌈', '🎁', '🎀'] }
        };
        const themeBtns = Object.entries(CATCH_THEMES).map(([k, v]) =>
            `<button type="button" class="catch-theme-btn" data-theme="${k}" title="${v.label}">${k === 'fruit' ? '🍎' : k === 'vegetable' ? '🥕' : k === 'dessert' ? '🍰' : k === 'food' ? '🍔' : '😀'}</button>`
        ).join('');
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>接礼物</h3>
                <div class="catch-game-area">
                    <div class="catch-theme-row">
                        <span class="catch-theme-label">掉落主题：</span>
                        <div class="catch-theme-btns">${themeBtns}</div>
                    </div>
                    <div class="catch-speed-row">
                        <span class="catch-theme-label">掉落速度：</span>
                        <div class="catch-speed-btns">
                            <button type="button" class="catch-speed-btn active" data-speed="slow">慢</button>
                            <button type="button" class="catch-speed-btn" data-speed="medium">中</button>
                            <button type="button" class="catch-speed-btn" data-speed="fast">快</button>
                        </div>
                    </div>
                    <div class="game-canvas game-canvas-theme-bg" id="game-canvas">
                        <div class="falling-items" id="falling-items"></div>
                        <div class="basket basket-draggable" id="basket">🧺</div>
                    </div>
                    <div class="game-controls">
                        <button id="start-game-btn" class="btn btn-primary">开始</button>
                        <button id="stop-game-btn" class="btn btn-secondary" disabled>停止</button>
                        <button id="collect-btn" class="btn btn-success" disabled>收获结束</button>
                    </div>
                    <div class="game-stats">
                        <span class="stat-label">接到：</span>
                        <span id="caught-count" class="stat-value">0</span>
                        <span class="stat-label ml-2">时间：</span>
                        <span id="game-time" class="stat-value">0s</span>
                    </div>
                    <div class="catch-gift-box-area">
                        <div class="catch-gift-box-label">礼物盒子</div>
                        <div class="catch-gift-box-items" id="catch-gift-box"></div>
                        <button type="button" class="btn btn-outline-secondary catch-clear-box-btn" id="catch-clear-gift-box">清空盒子</button>
                    </div>
                </div>
            </div>
        `;
        this.catchGameState = this.catchGameState || { theme: 'fruit', speed: 'slow', caughtItems: [], caughtElements: [], giftBox: [], basketPosition: 50 };
        document.querySelectorAll('.catch-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.catchGameState.theme = btn.dataset.theme;
                document.querySelectorAll('.catch-theme-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
        document.querySelector('.catch-theme-btn[data-theme="fruit"]').classList.add('selected');
        document.querySelectorAll('.catch-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.catchGameState.speed = btn.dataset.speed;
                document.querySelectorAll('.catch-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (this.catchGameState.isRunning) this.resetCatchGame();
            else this.startCatchGame();
        });
        document.getElementById('stop-game-btn').addEventListener('click', () => {
            if (this.catchGameState.isPaused) this.resumeCatchGame();
            else this.stopCatchGame();
        });
        document.getElementById('collect-btn').addEventListener('click', () => this.finishCatchAndCollect());
        document.getElementById('catch-clear-gift-box').addEventListener('click', () => {
            this.catchGameState.giftBox = [];
            this.renderCatchGiftBox();
        });
        const canvas = document.getElementById('game-canvas');
        const basket = document.getElementById('basket');
        if (canvas && basket) {
            const getClientX = (e) => (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
            const onPointerDown = (e) => {
                if (e.type === 'mousedown' && e.button !== 0) return;
                this.catchGameState.dragStartX = getClientX(e);
                this.catchGameState.dragStartLeft = this.catchGameState.basketPosition;
                document.body.classList.add('drag-active');
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
                document.addEventListener('touchcancel', onTouchEnd);
            };
            const onMouseMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                const delta = (e.clientX - this.catchGameState.dragStartX) / rect.width * 100;
                let pct = (this.catchGameState.dragStartLeft || 50) + delta;
                pct = Math.max(5, Math.min(95, pct));
                this.catchGameState.basketPosition = pct;
                basket.style.left = pct + '%';
            };
            const onTouchMove = (e) => {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const x = e.touches[0].clientX;
                const delta = (x - this.catchGameState.dragStartX) / rect.width * 100;
                let pct = (this.catchGameState.dragStartLeft || 50) + delta;
                pct = Math.max(5, Math.min(95, pct));
                this.catchGameState.basketPosition = pct;
                this.catchGameState.dragStartX = x;
                this.catchGameState.dragStartLeft = pct;
                basket.style.left = pct + '%';
            };
            const onMouseUp = () => {
                document.body.classList.remove('drag-active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                document.removeEventListener('touchcancel', onTouchEnd);
            };
            const onTouchEnd = () => {
                document.body.classList.remove('drag-active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                document.removeEventListener('touchcancel', onTouchEnd);
            };
            basket.addEventListener('mousedown', (e) => { if (e.button === 0) onPointerDown(e); });
            basket.addEventListener('touchstart', (e) => { if (e.touches.length === 1) onPointerDown(e); }, { passive: true });
        }
        this.renderCatchGiftBox();
    }

    getCatchThemeEmojis() {
        const themes = { fruit: ['🍎','🍌','🍇','🍓','🥝','🍑','🥭','🍍','🥥','🍊','🍋','🥑','🍐','🍒','🫐','🍈','🍉'], vegetable: ['🥕','🥬','🥦','🌽','🥒','🍅','🫑','🧄','🧅','🥔','🫒','🥗'], dessert: ['🍰','🎂','🧁','🍩','🍪','🍫','🍬','🍭','🍮','🍦','🍧','🍨','🥧','🍯'], food: ['🍕','🍔','🍟','🌭','🥪','🌮','🌯','🥙','🍱','🍣','🥟','🍜','🍝','🍲','🥘','🍛','🍡'], emoji: ['😀','😊','🥰','😎','🤩','😇','🥳','🤗','😺','🐶','🐱','🐻','🐼','🦊','🐰','🐨','⭐','🌈','🎁','🎀'] };
        return themes[this.catchGameState.theme] || themes.fruit;
    }

    renderCatchGiftBox() {
        const box = document.getElementById('catch-gift-box');
        if (!box) return;
        const list = (this.catchGameState && this.catchGameState.giftBox) || [];
        if (list.length === 0) {
            box.innerHTML = '<span class="catch-gift-box-empty">暂无</span>';
            return;
        }
        box.innerHTML = list.map((r, i) => {
            const els = r.elements || [];
            const parts = els.map((e, j) => (j > 0 ? '<span class="catch-gift-sep"> + </span>' : '') + `<span class="catch-gift-element" data-id="${e.id}">${e.name}</span>`).join('');
            return `<div class="catch-gift-combo" data-idx="${i}" title="点击元素查看详情、点击组合编辑">${parts}</div>`;
        }).join('');
        box.querySelectorAll('.catch-gift-combo').forEach(wrap => {
            wrap.addEventListener('click', (e) => {
                const idx = parseInt(wrap.dataset.idx, 10);
                const r = this.catchGameState.giftBox[idx];
                if (!r || !r.elements || !r.elements.length) return;
                const el = e.target.closest('.catch-gift-element');
                if (el) {
                    e.stopPropagation();
                    this.showElementModalById(el.dataset.id);
                } else {
                    this.showEditCombinationModal(null, r.elements.map(x => x.id), false);
                }
            });
        });
    }

    getCatchSpawnInterval() {
        const s = this.catchGameState.speed || 'slow';
        if (s === 'fast') return 500;
        if (s === 'medium') return 800;
        return 1200;
    }

    startCatchGame() {
        this.catchGameState.isRunning = true;
        this.catchGameState.isPaused = false;
        this.catchGameState.startTime = Date.now();
        this.catchGameState.caughtElements = [];
        document.getElementById('start-game-btn').textContent = '重置';
        document.getElementById('stop-game-btn').textContent = '停止';
        document.getElementById('stop-game-btn').disabled = false;
        document.getElementById('caught-count').textContent = '0';
        document.getElementById('falling-items').innerHTML = '';
        const collectBtn = document.getElementById('collect-btn');
        if (collectBtn) collectBtn.disabled = true;
        this.catchGameState.gameTimer = setInterval(() => {
            if (!this.catchGameState.isPaused) this.updateGameTime();
        }, 100);
        const interval = this.getCatchSpawnInterval();
        this.catchGameState.spawnTimer = setInterval(() => {
            if (!this.catchGameState.isPaused) this.spawnFallingItem();
        }, interval);
    }

    resumeCatchGame() {
        this.catchGameState.isPaused = false;
        document.getElementById('stop-game-btn').textContent = '停止';
    }

    stopCatchGame() {
        this.catchGameState.isPaused = true;
        document.getElementById('stop-game-btn').textContent = '继续';
        document.querySelectorAll('.falling-item').forEach(item => { item.style.animationPlayState = 'paused'; });
    }

    updateGameTime() {
        const elapsed = Math.floor((Date.now() - this.catchGameState.startTime) / 1000);
        document.getElementById('game-time').textContent = elapsed + 's';
    }

    spawnFallingItem() {
        if (!this.catchGameState.isRunning || this.catchGameState.isPaused) return;
        const container = document.getElementById('falling-items');
        if (!container) return;
        const emojis = this.getCatchThemeEmojis();
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const leftPosition = Math.random() * 90 + 5;
        const speed = this.catchGameState.speed || 'slow';
        const duration = speed === 'fast' ? (1.2 + Math.random() * 2.2) : (2 + Math.random() * 2.5);
        const item = document.createElement('div');
        item.className = 'falling-item';
        item.textContent = emoji;
        item.style.left = leftPosition + '%';
        item.style.animationDuration = duration + 's';
        item.dataset.emoji = emoji;
        container.appendChild(item);
        const removeItem = () => { if (item.parentNode) item.remove(); };
        const checkCollision = () => {
            if (!this.catchGameState.isRunning) return;
            const itemRect = item.getBoundingClientRect();
            const basketRect = document.getElementById('basket').getBoundingClientRect();
            if (this.catchGameState.isPaused) { requestAnimationFrame(checkCollision); return; }
            const overlap = Math.min(20, itemRect.height * 0.4);
            const horizontalOverlap = itemRect.left < basketRect.right && itemRect.right > basketRect.left;
            const verticalInside = itemRect.bottom >= basketRect.top + overlap;
            if (verticalInside && horizontalOverlap) {
                this.catchItem(emoji);
                removeItem();
                return;
            }
            if (itemRect.top > window.innerHeight) {
                removeItem();
                return;
            }
            requestAnimationFrame(checkCollision);
        };
        requestAnimationFrame(checkCollision);
        setTimeout(() => { if (item.parentNode) removeItem(); }, (duration + 0.5) * 1000);
        setTimeout(() => { if (item.parentNode) item.remove(); }, 5000);
    }

    moveBasket(percentage) {
        this.catchGameState.basketPosition = percentage;
        document.getElementById('basket').style.left = percentage + '%';
    }

    catchItem(emoji) {
        const elements = this.generateRandomElements(1);
        if (elements.length === 0) return;
        const refs = elements.map(e => ({ id: e.id, name: e.name }));
        this.catchGameState.caughtElements = this.catchGameState.caughtElements || [];
        this.catchGameState.caughtElements.push(...refs);
        const countEl = document.getElementById('caught-count');
        if (countEl) countEl.textContent = String(this.catchGameState.caughtElements.length);
        const collectBtn = document.getElementById('collect-btn');
        if (collectBtn) collectBtn.disabled = false;
    }

    finishCatchAndCollect() {
        const els = (this.catchGameState && this.catchGameState.caughtElements) || [];
        if (els.length === 0) {
            this.showToast('还没有接到任何礼物');
            return;
        }
        const result = { type: 'combination', elements: els.map(e => ({ id: e.id, name: e.name })), id: this.generateId() };
        this.catchGameState.giftBox = this.catchGameState.giftBox || [];
        this.catchGameState.giftBox.push(result);
        this.toolResults[this.currentTool] = this.toolResults[this.currentTool] || [];
        this.toolResults[this.currentTool].push(result);
        this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
        this.saveUserData();
        this.renderCatchGiftBox();
        this.showToast('收获完成，本次接到 ' + els.length + ' 个元素');
        this.resetCatchGame();
    }

    resetCatchGame() {
        this.catchGameState = this.catchGameState || {};
        this.catchGameState.isRunning = false;
        this.catchGameState.isPaused = false;
        this.catchGameState.caughtElements = [];
        if (this.catchGameState.gameTimer) clearInterval(this.catchGameState.gameTimer);
        this.catchGameState.gameTimer = null;
        if (this.catchGameState.spawnTimer) clearInterval(this.catchGameState.spawnTimer);
        this.catchGameState.spawnTimer = null;
        const fallEl = document.getElementById('falling-items');
        if (fallEl) fallEl.innerHTML = '';
        document.getElementById('caught-count').textContent = '0';
        document.getElementById('game-time').textContent = '0s';
        document.getElementById('basket').style.left = '50%';
        this.catchGameState.basketPosition = 50;
        document.getElementById('start-game-btn').textContent = '开始';
        document.getElementById('start-game-btn').disabled = false;
        document.getElementById('stop-game-btn').disabled = true;
        document.getElementById('stop-game-btn').textContent = '停止';
        const collectBtn = document.getElementById('collect-btn');
        if (collectBtn) collectBtn.disabled = true;
    }

    // 捕鱼达人：很多鱼随便走，点击池塘撒网，该位置的鱼被网走作为元素组合；鱼篓
    renderFishMaster() {
        const FISH_EMOJIS = ['🐟', '🐠', '🐡', '🦈', '🐋', '🐳', '🐬'];
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>捕鱼达人</h3>
                <div class="catch-game-area fishmaster-area">
                    <div class="game-canvas game-canvas-white fishmaster-pond" id="fishmaster-pond">
                        <div class="fishmaster-fishes" id="fishmaster-fishes"></div>
                        <div class="fishmaster-net hidden" id="fishmaster-net">🕸️</div>
                    </div>
                    <p class="fishmaster-hint">点击池塘任意位置撒网，该位置的鱼会被网走</p>
                    <div class="catch-gift-box-area">
                        <div class="catch-gift-box-label">本网捕获 / 鱼篓</div>
                        <div class="catch-gift-box-items" id="fishmaster-gift-box"></div>
                        <button type="button" class="btn btn-outline-secondary catch-clear-box-btn" id="fishmaster-clear-box">清空鱼篓</button>
                    </div>
                </div>
            </div>
        `;
        this.fishmasterState = this.fishmasterState || { fishes: [], giftBox: [], moveInterval: null };
        if (this.fishmasterState.moveInterval) {
            clearInterval(this.fishmasterState.moveInterval);
            this.fishmasterState.moveInterval = null;
        }
        this.fishmasterState.fishes = [];
        const pond = document.getElementById('fishmaster-pond');
        const fishesEl = document.getElementById('fishmaster-fishes');
        const netEl = document.getElementById('fishmaster-net');

        const spawnOneFish = () => {
            const available = this.getAvailableElements();
            if (available.length === 0) return null;
            const element = available[Math.floor(Math.random() * available.length)];
            const emoji = FISH_EMOJIS[Math.floor(Math.random() * FISH_EMOJIS.length)];
            const fish = document.createElement('div');
            fish.className = 'fishmaster-fish';
            fish.textContent = emoji;
            fish.dataset.elementId = element.id;
            fish.dataset.elementName = element.name;
            const x = Math.random() * 85 + 5;
            const y = Math.random() * 70 + 15;
            let vx = (Math.random() - 0.5) * 1.2;
            let vy = (Math.random() - 0.5) * 1.2;
            fish.style.left = x + '%';
            fish.style.top = y + '%';
            const data = { el: fish, x, y, vx, vy, element: { id: element.id, name: element.name } };
            this.fishmasterState.fishes.push(data);
            fishesEl.appendChild(fish);
            return data;
        };

        const moveFishes = () => {
            if (!pond || !document.contains(pond)) {
                if (this.fishmasterState.moveInterval) clearInterval(this.fishmasterState.moveInterval);
                this.fishmasterState.moveInterval = null;
                return;
            }
            this.fishmasterState.fishes.forEach(f => {
                if (!f.el.parentNode) return;
                f.x += f.vx;
                f.y += f.vy;
                if (f.x <= 2 || f.x >= 88) f.vx = -f.vx;
                if (f.y <= 2 || f.y >= 83) f.vy = -f.vy;
                f.x = Math.max(2, Math.min(88, f.x));
                f.y = Math.max(2, Math.min(83, f.y));
                f.el.style.left = f.x + '%';
                f.el.style.top = f.y + '%';
            });
        };

        const renderFishMasterGiftBox = () => {
            const box = document.getElementById('fishmaster-gift-box');
            if (!box) return;
            const list = (this.fishmasterState && this.fishmasterState.giftBox) || [];
            if (list.length === 0) {
                box.innerHTML = '<span class="catch-gift-box-empty">暂无</span>';
                return;
            }
            const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
            box.innerHTML = list.map((r, i) => {
                const els = r.elements || [];
                const parts = els.map((e, j) => (j > 0 ? '<span class="basket-combo-sep"> + </span>' : '') + `<span class="basket-combo-element" data-id="${escapeHtml(e.id)}">${escapeHtml(e.name)}</span>`).join('');
                return `<div class="basket-item-combo fishmaster-gift-combo" data-idx="${i}"><span class="basket-item-combo-inner">${parts || '—'}</span></div>`;
            }).join('');
            box.querySelectorAll('.basket-item-combo.fishmaster-gift-combo').forEach(wrap => {
                wrap.addEventListener('click', (e) => {
                    const idx = parseInt(wrap.dataset.idx, 10);
                    const r = this.fishmasterState.giftBox[idx];
                    if (!r || !r.elements || !r.elements.length) return;
                    const el = e.target.closest('.basket-combo-element');
                    if (el) {
                        e.stopPropagation();
                        this.showElementModalById(el.dataset.id);
                    } else {
                        this.showElementModal(r.elements);
                    }
                });
            });
        };

        const FISH_COUNT = 18;
        for (let i = 0; i < FISH_COUNT; i++) setTimeout(() => spawnOneFish(), i * 80);
        this.fishmasterState.moveInterval = setInterval(moveFishes, 120);

        pond.addEventListener('click', (e) => {
            if (netEl.classList.contains('casting')) return;
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            const rect = pond.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left) / rect.width) * 100;
            const yPct = ((e.clientY - rect.top) / rect.height) * 100;
            netEl.classList.remove('hidden');
            netEl.classList.add('casting');
            netEl.style.left = xPct + '%';
            netEl.style.top = yPct + '%';
            netEl.style.transform = 'translate(-50%,-50%)';
            setTimeout(() => {
                const netRect = netEl.getBoundingClientRect();
                const netCenterX = netRect.left + netRect.width / 2;
                const netCenterY = netRect.top + netRect.height / 2;
                const netRadius = Math.max(netRect.width, netRect.height) * 0.6;
                const caught = [];
                const toRemove = [];
                this.fishmasterState.fishes.forEach((f, i) => {
                    if (!f.el.parentNode) return;
                    const fr = f.el.getBoundingClientRect();
                    const cx = fr.left + fr.width / 2;
                    const cy = fr.top + fr.height / 2;
                    const dist = Math.hypot(cx - netCenterX, cy - netCenterY);
                    if (dist <= netRadius) {
                        caught.push(f.element);
                        toRemove.push(i);
                    }
                });
                toRemove.sort((a, b) => b - a).forEach(i => {
                    const f = this.fishmasterState.fishes[i];
                    if (f && f.el.parentNode) f.el.remove();
                    this.fishmasterState.fishes.splice(i, 1);
                });
                for (let i = 0; i < toRemove.length; i++) spawnOneFish();
                netEl.classList.remove('casting');
                netEl.classList.add('hidden');
                if (caught.length > 0) {
                    const result = { type: 'combination', elements: caught, id: this.generateId() };
                    this.fishmasterState.giftBox = this.fishmasterState.giftBox || [];
                    this.fishmasterState.giftBox.push(result);
                    this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
                    this.saveUserData();
                    this.showToast('网住 ' + caught.length + ' 条鱼，已加入鱼篓');
                } else {
                    this.showToast('没网到鱼，再试一次');
                }
                renderFishMasterGiftBox();
            }, 350);
        });

        document.getElementById('fishmaster-clear-box').addEventListener('click', () => {
            this.fishmasterState.giftBox = [];
            renderFishMasterGiftBox();
            this.showToast('已清空鱼篓');
        });

        renderFishMasterGiftBox();
    }

    // 钓鱼：元素数量=鱼大小（小鱼/普通/大鱼范围），大鱼需连续点击才能抓住，可能海草（单元素），可设最长等鱼时间；鱼篓同种地篮子可点组合/单元素，可清空
    renderFishing() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>钓鱼</h3>
                <details class="fishing-settings" id="fishing-settings" open>
                    <summary>设置</summary>
                    <div class="fishing-config fishing-config-compact">
                        <div class="fishing-config-line">
                            <div class="fishing-config-row"><label>最长等鱼(秒)</label><input type="number" id="fishing-wait-max" class="form-control form-control-sm" value="8" min="2" max="30"></div>
                        </div>
                        <div class="fishing-config-line">
                            <div class="fishing-config-row"><label>小鱼</label><input type="number" id="fishing-small-min" class="form-control form-control-sm" value="1" min="1" max="5"><span>～</span><input type="number" id="fishing-small-max" class="form-control form-control-sm" value="2" min="1" max="5"><span class="fishing-pct-sep">概率</span><input type="number" id="fishing-small-pct" class="form-control form-control-sm" value="35" min="0" max="100" title="%"></div>
                        </div>
                        <div class="fishing-config-line">
                            <div class="fishing-config-row"><label>普通鱼</label><input type="number" id="fishing-mid-min" class="form-control form-control-sm" value="3" min="2" max="8"><span>～</span><input type="number" id="fishing-mid-max" class="form-control form-control-sm" value="5" min="2" max="8"><span class="fishing-pct-sep">概率</span><input type="number" id="fishing-mid-pct" class="form-control form-control-sm" value="40" min="0" max="100" title="%"></div>
                        </div>
                        <div class="fishing-config-line">
                            <div class="fishing-config-row"><label>大鱼</label><input type="number" id="fishing-large-min" class="form-control form-control-sm" value="6" min="4" max="15"><span>～</span><input type="number" id="fishing-large-max" class="form-control form-control-sm" value="10" min="4" max="15"><span class="fishing-pct-sep">概率</span><input type="number" id="fishing-large-pct" class="form-control form-control-sm" value="25" min="0" max="100" title="%"></div>
                        </div>
                    </div>
                </details>
                <div class="fishing-area">
                    <div class="fishing-pond-row">
                        <div class="fishing-pond" id="fishing-pond">
                            <div class="fishing-bobber" id="fishing-bobber">🎣</div>
                            <div class="fishing-hint" id="fishing-hint">点击「钓鱼」</div>
                        </div>
                        <div class="fishing-stats" id="fishing-stats">
                            <div class="fishing-stats-title">钓鱼统计</div>
                            <div class="fishing-stats-row"><span>钓鱼</span><span id="fishing-stat-total">0</span> 次</div>
                            <div class="fishing-stats-row"><span>空军</span><span id="fishing-stat-escaped">0</span> 次</div>
                            <div class="fishing-stats-row"><span>小鱼</span><span id="fishing-stat-small">0</span> 次</div>
                            <div class="fishing-stats-row"><span>普通鱼</span><span id="fishing-stat-mid">0</span> 次</div>
                            <div class="fishing-stats-row"><span>大鱼</span><span id="fishing-stat-large">0</span> 次</div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary fishing-start-btn" id="fishing-start">钓鱼</button>
                    <div class="fishing-basket-area">
                        <div class="fishing-basket-label">鱼篓</div>
                        <div class="fishing-basket-items" id="fishing-basket"></div>
                        <button type="button" class="btn btn-outline-secondary fishing-clear-basket-btn" id="fishing-clear-basket">清空鱼篓</button>
                    </div>
                </div>
            </div>
        `;
        this.fishingState = {
            phase: 'idle',
            basket: [],
            clicksNeeded: 0,
            clicksDone: 0,
            timer: null,
            escapeTimer: null,
            countdownInterval: null,
            totalCasts: 0,
            escapedCount: 0,
            countByType: { '海草': 0, '小鱼': 0, '普通鱼': 0, '大鱼': 0 }
        };
        const pond = document.getElementById('fishing-pond');
        const bobber = document.getElementById('fishing-bobber');
        const hint = document.getElementById('fishing-hint');
        const basketEl = document.getElementById('fishing-basket');
        const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

        const renderFishingStats = () => {
            const s = this.fishingState;
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            set('fishing-stat-total', s.totalCasts != null ? s.totalCasts : 0);
            const seaweed = (s.countByType && s.countByType['海草']) || 0;
            const escaped = s.escapedCount != null ? s.escapedCount : 0;
            set('fishing-stat-escaped', escaped + seaweed);
            set('fishing-stat-small', (s.countByType && s.countByType['小鱼']) || 0);
            set('fishing-stat-mid', (s.countByType && s.countByType['普通鱼']) || 0);
            set('fishing-stat-large', (s.countByType && s.countByType['大鱼']) || 0);
        };

        const renderFishingBasket = () => {
            if (!basketEl) return;
            const list = (this.fishingState && this.fishingState.basket) || [];
            if (list.length === 0) {
                basketEl.innerHTML = '<span class="basket-empty">暂无</span>';
                return;
            }
            basketEl.innerHTML = list.map((item, i) => {
                const els = item.elements || [];
                const label = item.sizeType === '海草' ? '🌿' : (item.sizeType === '小鱼' ? '🐟' : item.sizeType === '普通鱼' ? '🐠' : '🦈');
                const parts = els.map((e, j) => (j > 0 ? '<span class="basket-combo-sep"> + </span>' : '') + `<span class="basket-combo-element" data-id="${escapeHtml(e.id)}">${escapeHtml(e.name)}</span>`).join('');
                return `<div class="basket-item-combo" data-idx="${i}"><span class="basket-item-emoji">${label}：</span><span class="basket-item-combo-inner">${parts || '—'}</span></div>`;
            }).join('');
            basketEl.querySelectorAll('.basket-item-combo').forEach(wrap => {
                wrap.addEventListener('click', (e) => {
                    const idx = parseInt(wrap.dataset.idx, 10);
                    const item = this.fishingState.basket[idx];
                    if (!item || !item.elements || !item.elements.length) return;
                    const el = e.target.closest('.basket-combo-element');
                    if (el) {
                        e.stopPropagation();
                        this.showElementModalById(el.dataset.id);
                    } else {
                        this.showElementModal(item.elements);
                    }
                });
            });
        };

        document.getElementById('fishing-clear-basket').addEventListener('click', () => {
            this.fishingState.basket = [];
            this.fishingState.totalCasts = 0;
            this.fishingState.escapedCount = 0;
            this.fishingState.countByType = { '海草': 0, '小鱼': 0, '普通鱼': 0, '大鱼': 0 };
            this.fishingState.justCaught = false;
            renderFishingBasket();
            renderFishingStats();
            if (hint) hint.textContent = '点击「钓鱼」';
            this.showToast('已清空鱼篓与统计');
        });

        document.getElementById('fishing-start').addEventListener('click', () => {
            if (this.fishingState.phase === 'waiting' || this.fishingState.phase === 'catching') return;
            const smallMin = parseInt(document.getElementById('fishing-small-min').value, 10) || 1;
            const smallMax = parseInt(document.getElementById('fishing-small-max').value, 10) || 2;
            const midMin = parseInt(document.getElementById('fishing-mid-min').value, 10) || 3;
            const midMax = parseInt(document.getElementById('fishing-mid-max').value, 10) || 5;
            const largeMin = parseInt(document.getElementById('fishing-large-min').value, 10) || 6;
            const largeMax = parseInt(document.getElementById('fishing-large-max').value, 10) || 10;
            const waitMax = Math.max(2, parseInt(document.getElementById('fishing-wait-max').value, 10) || 8);
            let smallPct = Math.max(0, parseInt(document.getElementById('fishing-small-pct').value, 10) || 35);
            let midPct = Math.max(0, parseInt(document.getElementById('fishing-mid-pct').value, 10) || 40);
            let largePct = Math.max(0, parseInt(document.getElementById('fishing-large-pct').value, 10) || 25);
            const seaweedPct = Math.max(0, 100 - smallPct - midPct - largePct);
            const total = seaweedPct + smallPct + midPct + largePct;
            if (total > 0) { smallPct /= total; midPct /= total; largePct /= total; } else { smallPct = 0.35; midPct = 0.4; largePct = 0.25; }
            const seaweedRatio = total > 0 ? seaweedPct / total : 0;
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            this.fishingState.justCaught = false;
            if (pond) pond.classList.add('fishing-cast');
            if (bobber) bobber.classList.add('fishing-cast');
            setTimeout(() => {
                if (pond) pond.classList.remove('fishing-cast');
                if (bobber) bobber.classList.remove('fishing-cast');
            }, 600);
            this.fishingState.totalCasts = (this.fishingState.totalCasts || 0) + 1;
            renderFishingStats();
            this.fishingState.phase = 'waiting';
            const waitSec = Math.floor(Math.random() * waitMax) + 1;
            const waitEndAt = Date.now() + waitSec * 1000;
            this.fishingState.waitEndAt = waitEndAt;
            const updateCountdown = () => {
                if (this.fishingState.phase !== 'waiting' || !this.fishingState.waitEndAt) return;
                const remaining = Math.max(0, Math.ceil((this.fishingState.waitEndAt - Date.now()) / 1000));
                if (hint) hint.textContent = remaining + ' 秒后上钩…';
                if (remaining <= 0 && this.fishingState.countdownInterval) {
                    clearInterval(this.fishingState.countdownInterval);
                    this.fishingState.countdownInterval = null;
                }
            };
            updateCountdown();
            if (this.fishingState.countdownInterval) clearInterval(this.fishingState.countdownInterval);
            this.fishingState.countdownInterval = setInterval(updateCountdown, 500);
            this.fishingState.timer = setTimeout(() => {
                if (this.fishingState.countdownInterval) {
                    clearInterval(this.fishingState.countdownInterval);
                    this.fishingState.countdownInterval = null;
                }
                let sizeType, count, clicksNeeded;
                const r = Math.random();
                if (r < seaweedRatio) {
                    sizeType = '海草';
                    count = 1;
                    clicksNeeded = 1;
                } else if (r < seaweedRatio + smallPct) {
                    sizeType = '小鱼';
                    count = Math.floor(Math.random() * (smallMax - smallMin + 1)) + smallMin;
                    clicksNeeded = 1;
                } else if (r < seaweedRatio + smallPct + midPct) {
                    sizeType = '普通鱼';
                    count = Math.floor(Math.random() * (midMax - midMin + 1)) + midMin;
                    clicksNeeded = 2;
                } else {
                    sizeType = '大鱼';
                    count = Math.floor(Math.random() * (largeMax - largeMin + 1)) + largeMin;
                    clicksNeeded = 3;
                }
                const elements = this.generateRandomElements(count);
                this.fishingState.phase = 'catching';
                this.fishingState.clicksNeeded = clicksNeeded;
                this.fishingState.clicksDone = 0;
                this.fishingState.currentCatch = { sizeType, elements: elements.map(e => ({ id: e.id, name: e.name })) };
                hint.textContent = '快点击 ' + clicksNeeded + ' 次抓住！';
                if (this.fishingState.escapeTimer) clearTimeout(this.fishingState.escapeTimer);
                this.fishingState.escapeTimer = setTimeout(() => {
                    if (this.fishingState.phase === 'catching') {
                        this.fishingState.escapedCount = (this.fishingState.escapedCount || 0) + 1;
                        renderFishingStats();
                        this.fishingState.phase = 'idle';
                        this.fishingState.justCaught = false;
                        hint.textContent = '鱼跑掉了… 点击「钓鱼」';
                        this.showToast('鱼跑掉了');
                    }
                }, 2500);
            }, waitSec * 1000);
        });

        pond.addEventListener('click', () => {
            if (this.fishingState.phase !== 'catching') return;
            this.fishingState.clicksDone++;
            if (this.fishingState.clicksDone >= this.fishingState.clicksNeeded) {
                if (this.fishingState.escapeTimer) clearTimeout(this.fishingState.escapeTimer);
                this.fishingState.escapeTimer = null;
                const st = this.fishingState.currentCatch.sizeType;
                if (this.fishingState.countByType && st) this.fishingState.countByType[st] = (this.fishingState.countByType[st] || 0) + 1;
                renderFishingStats();
                this.fishingState.basket.push(this.fishingState.currentCatch);
                renderFishingBasket();
                const result = { type: 'combination', elements: this.fishingState.currentCatch.elements, id: this.generateId() };
                this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
                this.saveUserData();
                this.fishingState.phase = 'idle';
                this.fishingState.justCaught = true;
                hint.textContent = '钓到了！';
                this.showToast('钓到了 ' + this.fishingState.currentCatch.elements.length + ' 个元素');
            } else {
                hint.textContent = '再点 ' + (this.fishingState.clicksNeeded - this.fishingState.clicksDone) + ' 次！';
            }
        });

        renderFishingBasket();
        renderFishingStats();
    }

    // 扭蛋机：类似抽签，扭蛋机动画 + 掉出扭蛋圆圈可点击打开看元素
    renderGashapon() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>扭蛋机</h3>
                <div class="gashapon-config">
                    <div class="form-group">
                        <label>类型：</label>
                        <select id="gashapon-type" class="form-control">
                            <option value="elements">元素</option>
                            <option value="combinations">元素组合</option>
                        </select>
                    </div>
                    <div id="gashapon-elements-config" class="form-group">
                        <label>每个组合的元素数量：</label>
                        <input type="number" id="gashapon-count" class="form-control" value="3" min="1" max="5">
                    </div>
                </div>
                <div class="gashapon-machine-wrap">
                    <div class="gashapon-machine" id="gashapon-machine">
                        <div class="gashapon-machine-body">扭蛋机</div>
                        <div class="gashapon-balls-window" id="gashapon-balls-window">
                            <!-- 球由 JS 动态填充 -->
                        </div>
                        <div class="gashapon-handle" id="gashapon-handle">转</div>
                    </div>
                    <div class="gashapon-chute" id="gashapon-chute"></div>
                </div>
            </div>
        `;
        const typeSelect = document.getElementById('gashapon-type');
        const elementsConfig = document.getElementById('gashapon-elements-config');
        if (elementsConfig) elementsConfig.style.display = typeSelect && typeSelect.value === 'elements' ? 'block' : 'none';
        typeSelect && typeSelect.addEventListener('change', (e) => {
            const el = document.getElementById('gashapon-elements-config');
            if (el) el.style.display = e.target.value === 'elements' ? 'block' : 'none';
        });
        const handle = document.getElementById('gashapon-handle');
        const chute = document.getElementById('gashapon-chute');
        const machine = document.getElementById('gashapon-machine');
        const ballsWindow = document.getElementById('gashapon-balls-window');
        const initBalls = () => {
            if (!ballsWindow) return;
            ballsWindow.innerHTML = '';
            const colors = ['gashapon-dot-white', 'gashapon-dot-black', 'gashapon-dot-gray'];
            const w = 76 - 12, h = 92 - 12;
            const ballSize = 18;
            const count = 14;
            const bottomYMax = h - ballSize;
            const bottomYMin = Math.max(0, bottomYMax - ballSize * 2.2);
            for (let i = 0; i < count; i++) {
                const ball = document.createElement('span');
                ball.className = 'gashapon-dot gashapon-dot-big ' + colors[Math.floor(Math.random() * colors.length)];
                const x = Math.random() * Math.max(0, w - ballSize);
                const y = bottomYMin + Math.random() * (bottomYMax - bottomYMin);
                ball.style.setProperty('--gx', x + 'px');
                ball.style.setProperty('--gy', y + 'px');
                ball.style.setProperty('--gashapon-delay', (i * 0.03) + 's');
                ballsWindow.appendChild(ball);
            }
        };
        initBalls();
        handle && handle.addEventListener('click', () => {
            const type = typeSelect ? typeSelect.value : 'elements';
            const count = Math.max(1, parseInt(document.getElementById('gashapon-count').value, 10) || 3);
            let elements = [];
            if (type === 'elements') {
                elements = this.generateRandomElements(count);
                if (elements.length === 0) {
                    this.showToast('请先选择词库或元素分组');
                    return;
                }
            } else {
                const combos = this.getAvailableCombinations();
                if (combos.length === 0) {
                    this.showToast('请先添加元素组合');
                    return;
                }
                const combo = combos[Math.floor(Math.random() * combos.length)];
                elements = this.getElementsByIds(combo.elementIds || []);
            }
            if (machine) machine.classList.add('gashapon-machine-spin');
            handle.classList.add('gashapon-rotating');
            if (ballsWindow) {
                ballsWindow.classList.add('gashapon-balls-tumble');
            }
            chute.innerHTML = '';
            const dropBall = () => {
                if (machine) machine.classList.remove('gashapon-machine-spin');
                handle.classList.remove('gashapon-rotating');
                if (ballsWindow) {
                    ballsWindow.classList.remove('gashapon-balls-tumble');
                    initBalls();
                }
                const ballColors = ['gashapon-ball-white', 'gashapon-ball-black', 'gashapon-ball-gray'];
                const ballClass = ballColors[Math.floor(Math.random() * ballColors.length)];
                const cap = document.createElement('div');
                cap.className = 'gashapon-capsule gashapon-ball closed ' + ballClass;
                cap.dataset.elements = JSON.stringify(elements.map(e => ({ id: e.id, name: e.name })));
                cap.innerHTML = '';
                chute.appendChild(cap);
                cap.addEventListener('click', () => {
                    if (cap.classList.contains('opened')) return;
                    cap.classList.remove('closed');
                    cap.classList.add('opened');
                    const data = JSON.parse(cap.dataset.elements || '[]');
                    const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
                    const chipsHtml = data.map(e => `<span class="fortune-result-chip" data-id="${esc(e.id)}" title="点击打开元素">${esc(e.name)}</span>`).join(' + ');
                    cap.innerHTML = `
                        <div class="gashapon-result-card fortune-card fade-in">
                            <div class="gashapon-result-content fortune-result-content" title="点击打开组合">${chipsHtml || '—'}</div>
                        </div>
                    `;
                    cap.querySelectorAll('.fortune-result-chip').forEach(chip => {
                        chip.style.cursor = 'pointer';
                        chip.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.showElementModalById(chip.dataset.id);
                        });
                    });
                    const contentEl = cap.querySelector('.gashapon-result-content');
                    if (contentEl && data.length) {
                        contentEl.style.cursor = 'pointer';
                        contentEl.addEventListener('click', (e) => {
                            if (e.target.closest('.fortune-result-chip')) return;
                            e.stopPropagation();
                            if (data.length === 1) this.showElementModalById(data[0].id);
                            else this.showElementModal(data);
                        });
                    }
                    const result = { type: 'combination', elements: data, id: this.generateId() };
                    this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
                    this.saveUserData();
                });
            };
            setTimeout(dropBall, 700);
        });
    }

    // 卷轴与诗：白便签可自由输入；「灵感来吧！」插入带外框的随机元素（点击元素打开详情）；可复制全文；新卷轴清空当前并历史只保存所有已插元素为一个组合。临时内容与元素列表会保存到浏览器和存档。
    renderScrollPoem() {
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();
        const params = (this.userData.settings.toolParams && this.userData.settings.toolParams.scrollpoem) || {};
        this.scrollpoemState = { elements: Array.isArray(params.elements) ? params.elements.slice() : [] };
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>卷轴与诗</h3>
                <p class="scrollpoem-desc">随便输入一些内容……然后点击「灵感来吧！」插入随机元素！点击元素可查看详情。</p>
                <div class="scrollpoem-note" id="scrollpoem-note">
                    <div class="scrollpoem-paper" id="scrollpoem-paper" contenteditable="true" data-placeholder="在这里输入..."></div>
                </div>
                <div class="scrollpoem-actions">
                    <button type="button" class="btn btn-primary" id="scrollpoem-inspire">灵感来吧！</button>
                    <button type="button" class="btn btn-outline-secondary" id="scrollpoem-copy">复制全文</button>
                    <button type="button" class="btn btn-outline-secondary" id="scrollpoem-new">新卷轴</button>
                </div>
            </div>
        `;
        const paper = document.getElementById('scrollpoem-paper');
        const inspireBtn = document.getElementById('scrollpoem-inspire');
        const copyBtn = document.getElementById('scrollpoem-copy');
        const newBtn = document.getElementById('scrollpoem-new');
        const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

        const saveScrollpoem = () => {
            this.userData.settings.toolParams = this.userData.settings.toolParams || {};
            this.userData.settings.toolParams.scrollpoem = {
                content: paper ? paper.innerHTML : '',
                elements: (this.scrollpoemState && this.scrollpoemState.elements) ? this.scrollpoemState.elements.slice() : []
            };
            this.saveUserData();
        };

        const attachChipHandlers = () => {
            if (!paper) return;
            paper.querySelectorAll('.scrollpoem-chip').forEach(chip => {
                if (chip.dataset.handled) return;
                chip.contentEditable = 'false';
                chip.dataset.handled = '1';
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (chip.dataset.id) this.showElementModalById(chip.dataset.id);
                });
            });
        };

        if (paper && params.content) {
            paper.innerHTML = params.content;
            attachChipHandlers();
        }
        if (paper && !paper.textContent.trim()) paper.setAttribute('data-placeholder', '在这里输入...');

        const addInspireElement = () => {
            const el = this.generateRandomElements(1)[0];
            if (!el) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            const chip = document.createElement('span');
            chip.className = 'scrollpoem-chip';
            chip.contentEditable = 'false';
            chip.dataset.id = el.id;
            chip.dataset.name = el.name;
            chip.textContent = el.name;
            chip.title = '点击查看元素详情';
            this.scrollpoemState.elements.push({ id: el.id, name: el.name });
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (chip.dataset.id) this.showElementModalById(chip.dataset.id);
            });
            const space = () => document.createTextNode('\u00A0');
            const breakBefore = () => document.createTextNode('\u200B');
            const sel = window.getSelection();
            const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            const cursorInPaper = paper && range && paper.contains(range.commonAncestorContainer);
            if (cursorInPaper && range) {
                range.deleteContents();
                range.insertNode(breakBefore());
                range.collapse(false);
                range.insertNode(chip);
                range.setStartAfter(chip);
                range.setEndAfter(chip);
                range.insertNode(space());
                range.setStartAfter(chip.nextSibling);
                range.setEndAfter(chip.nextSibling);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                paper.appendChild(breakBefore());
                paper.appendChild(chip);
                paper.appendChild(space());
            }
            saveScrollpoem();
        };

        inspireBtn && inspireBtn.addEventListener('click', addInspireElement);
        let scrollpoemSaveTimer = null;
        paper && paper.addEventListener('input', () => {
            if (scrollpoemSaveTimer) clearTimeout(scrollpoemSaveTimer);
            scrollpoemSaveTimer = setTimeout(saveScrollpoem, 400);
        });

        const self = this;
        copyBtn && copyBtn.addEventListener('click', () => {
            const text = paper ? (paper.innerText || paper.textContent || '').trim() : '';
            if (!text) {
                self.showToast('暂无内容可复制');
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => self.showToast('已复制到剪贴板')).catch(() => fallbackCopy(text));
            } else {
                fallbackCopy(text);
            }
            function fallbackCopy(str) {
                const ta = document.createElement('textarea');
                ta.value = str;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                    self.showToast('已复制到剪贴板');
                } catch (err) {
                    self.showToast('复制失败');
                }
                document.body.removeChild(ta);
            }
        });

        newBtn && newBtn.addEventListener('click', () => {
            const els = this.scrollpoemState.elements || [];
            if (els.length > 0) {
                const result = { type: 'combination', elements: els.map(e => ({ id: e.id, name: e.name })), id: this.generateId() };
                this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
                this.saveUserData();
            }
            this.scrollpoemState.elements = [];
            if (paper) {
                paper.innerHTML = '';
                paper.setAttribute('data-placeholder', '在这里输入...');
            }
            saveScrollpoem();
            this.showToast('已新卷轴，当前内容已清空');
        });

        if (paper && !paper.textContent.trim()) paper.setAttribute('data-placeholder', '在这里输入...');
    }

    // 礼花：放礼花喷射、点中捕获；波次自动结束；你获得了用组合展示；重置清空。
    renderFirework() {
        this.fireworkState = this.fireworkState || { captured: [], waveActive: false, timers: [] };

        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content firework-tool">
                <h3>礼花</h3>
                <p class="firework-desc">点击「放礼花」，点击飞行中的元素抓住它们！波次自动结束。</p>
                <div class="firework-play">
                    <button type="button" class="btn firework-trigger-btn" id="firework-trigger">放礼花</button>
                    <div class="firework-canvas" id="firework-canvas">
                        <div class="firework-items" id="firework-items"></div>
                    </div>
                    <div class="firework-bar">
                        <span class="firework-count">已捕获：<span id="firework-captured-count">0</span></span>
                        <button type="button" class="btn firework-reset-btn" id="firework-reset">重置</button>
                    </div>
                </div>
                <div class="firework-got" id="firework-got-wrap">
                    <div class="firework-got-title" id="firework-got-title"></div>
                    <div class="firework-got-list" id="firework-got-list"></div>
                </div>
            </div>
        `;
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();

        const triggerBtn = document.getElementById('firework-trigger');
        const resetBtn = document.getElementById('firework-reset');
        const container = document.getElementById('firework-items');
        const gotTitle = document.getElementById('firework-got-title');
        const gotList = document.getElementById('firework-got-list');

        const clearWaveTimers = () => {
            (this.fireworkState.timers || []).forEach(t => clearTimeout(t));
            this.fireworkState.timers = [];
        };

        const updateCount = () => {
            const el = document.getElementById('firework-captured-count');
            if (el) el.textContent = String((this.fireworkState.captured || []).length);
        };

        const renderGot = (elements) => {
            if (!gotTitle || !gotList) return;
            if (!elements || elements.length === 0) {
                gotTitle.textContent = '';
                gotList.innerHTML = '';
                return;
            }
            gotTitle.textContent = '你获得了：';
            const ids = elements.map(e => e.id);
            if (elements.length === 1) {
                gotList.innerHTML = '<span class="result-item firework-got-item" data-id="' + elements[0].id + '">' + elements[0].name + '</span>';
                gotList.querySelector('.firework-got-item').addEventListener('click', () => this.showElementModalById(elements[0].id));
                return;
            }
            const parts = elements.map((e, i) => (i > 0 ? '<span class="firework-got-sep"> + </span>' : '') + `<span class="result-item firework-got-item" data-id="${e.id}">${e.name}</span>`).join('');
            gotList.innerHTML = '<div class="result-item-wrap-combo firework-got-combo-inner" title="点击编辑组合">' + parts + '<button type="button" class="btn generate-btn firework-got-edit">编辑</button></div>';
            const comboWrap = gotList.querySelector('.firework-got-combo-inner');
            comboWrap.addEventListener('click', (e) => {
                if (e.target.closest('.firework-got-item') || e.target.closest('.firework-got-edit')) return;
                this.showEditCombinationModal(null, ids, false);
            });
            gotList.querySelectorAll('.firework-got-item').forEach(span => {
                span.addEventListener('click', (e) => { e.stopPropagation(); this.showElementModalById(span.dataset.id); });
            });
            const editBtn = gotList.querySelector('.firework-got-edit');
            if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); this.showEditCombinationModal(null, ids, false); });
        };

        const endWave = () => {
            if (!this.fireworkState.waveActive) return;
            const captured = (this.fireworkState.captured || []).slice();
            this.fireworkState.waveActive = false;
            this.fireworkState.captured = [];
            clearWaveTimers();
            updateCount();
            renderGot(captured);
        };

        const doClear = () => {
            this.fireworkState.captured = [];
            this.fireworkState.waveActive = false;
            if (container) container.innerHTML = '';
            clearWaveTimers();
            updateCount();
            renderGot([]);
        };

        triggerBtn.addEventListener('click', () => {
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            doClear();
            this.fireworkState.waveActive = true;
            const count = 25 + Math.floor(Math.random() * 15);
            let maxEnd = 0;
            for (let i = 0; i < count; i++) {
                const el = available[Math.floor(Math.random() * available.length)];
                const item = document.createElement('div');
                item.className = 'firework-item';
                item.textContent = el.name;
                item.dataset.elementId = el.id;
                item.dataset.elementName = el.name;
                const left = Math.random() * 82 + 5;
                const top = Math.random() * 35 + 5;
                const duration = 2.2 + Math.random() * 1.8;
                const angle = Math.random() * 360;
                item.style.left = left + '%';
                item.style.top = top + '%';
                item.style.animationDuration = duration + 's';
                item.style.setProperty('--fw-angle', angle + 'deg');
                if (container) container.appendChild(item);
                const endAt = duration * 1000 + 300;
                maxEnd = Math.max(maxEnd, endAt);
                const t = setTimeout(() => {
                    if (item.parentNode && !item.classList.contains('firework-captured')) item.remove();
                }, endAt);
                this.fireworkState.timers = this.fireworkState.timers || [];
                this.fireworkState.timers.push(t);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (item.classList.contains('firework-captured')) return;
                    item.classList.add('firework-captured');
                    this.fireworkState.captured = this.fireworkState.captured || [];
                    this.fireworkState.captured.push({ id: el.id, name: el.name });
                    updateCount();
                });
            }
            this.fireworkState.timers.push(setTimeout(() => endWave(), maxEnd + 400));
        });

        resetBtn.addEventListener('click', () => doClear());

        updateCount();
        renderGot([]);
    }

    // 敲罐子：设置外观参考盲盒；点击打碎有渣渣动画，碎后才显示词条且无边框；只有重新开始+一键打碎；每罐至多单个元素；概率默认较低。
    renderJar() {
        const params = (this.userData.settings.toolParams = this.userData.settings.toolParams || {}).jar || {};
        const probHasContent = Math.min(100, Math.max(0, params.probHasContent != null ? params.probHasContent : 25));
        const numJars = Math.min(12, Math.max(3, params.numJars != null ? params.numJars : 6));
        this.jarState = this.jarState || { jars: [] };
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();

        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content jar-tool-content">
                <h3>敲罐子</h3>
                <details class="jar-settings blindbox-settings" id="jar-settings" open>
                    <summary>设置</summary>
                    <div class="blindbox-config blindbox-config-compact">
                        <div class="blindbox-config-line">
                            <div class="blindbox-config-row">
                                <label>有东西概率%</label>
                                <input type="number" id="jar-prob" class="form-control form-control-sm" value="${probHasContent}" min="0" max="100">
                            </div>
                            <div class="blindbox-config-row">
                                <label>罐子数</label>
                                <input type="number" id="jar-num" class="form-control form-control-sm" value="${numJars}" min="3" max="12">
                            </div>
                        </div>
                    </div>
                </details>
                <div class="jar-result-area blindbox-result-area">
                    <div class="jar-jars-wrap blindbox-stage" id="jar-jars-wrap"></div>
                </div>
                <div class="jar-bottom blindbox-bottom">
                    <div class="jar-actions blindbox-draw-row">
                        <button type="button" class="btn generate-btn" id="jar-restart">重新开始</button>
                        <button type="button" class="btn generate-btn" id="jar-smash-all">一键打碎</button>
                    </div>
                </div>
            </div>
        `;
        const jarWrap = document.getElementById('jar-jars-wrap');
        const restartBtn = document.getElementById('jar-restart');
        const smashAllBtn = document.getElementById('jar-smash-all');
        const probInput = document.getElementById('jar-prob');
        const numInput = document.getElementById('jar-num');

        [probInput, numInput].forEach(el => {
            if (el) el.addEventListener('change', () => {
                const p = Math.min(100, Math.max(0, parseInt(probInput.value, 10) || 25));
                const n = Math.min(12, Math.max(3, parseInt(numInput.value, 10) || 6));
                this.userData.settings.toolParams.jar = { probHasContent: p, numJars: n };
                this.saveUserData();
            });
        });

        const startRound = () => {
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            const prob = Math.min(100, Math.max(0, parseInt(probInput.value, 10) || 25)) / 100;
            const n = Math.min(12, Math.max(3, parseInt(numInput.value, 10) || 6));
            this.jarState.jars = [];
            for (let i = 0; i < n; i++) {
                const hasContent = Math.random() < prob;
                const element = hasContent ? available[Math.floor(Math.random() * available.length)] : null;
                this.jarState.jars.push({
                    id: this.generateId(),
                    broken: false,
                    element: element ? { id: element.id, name: element.name } : null
                });
            }
            renderJars();
        };

        const SHATTER_DURATION = 520;

        const shrinkJarTextToFit = (spanEl) => {
            const wrap = spanEl && spanEl.closest('.jar-content-wrap');
            if (!wrap || !spanEl || !spanEl.textContent) return;
            const wrapW = wrap.clientWidth;
            let fs = parseFloat(getComputedStyle(spanEl).fontSize) || 16;
            const minFs = 10;
            spanEl.style.whiteSpace = 'nowrap';
            while (fs > minFs && spanEl.scrollWidth > wrapW) {
                fs -= 1;
                spanEl.style.fontSize = fs + 'px';
            }
        };

        const renderJars = () => {
            if (!jarWrap) return;
            jarWrap.innerHTML = '';
            const jars = this.jarState.jars || [];
            jars.forEach((j, idx) => {
                const div = document.createElement('div');
                div.className = 'jar-item' + (j.broken ? ' jar-broken' : '');
                div.dataset.idx = String(idx);
                if (!j.broken) {
                    div.innerHTML = '<div class="jar-jar-wrap"><span class="jar-emoji">🫙</span></div>';
                    div.querySelector('.jar-jar-wrap').addEventListener('click', () => breakOneJar(idx));
                } else {
                    div.innerHTML = j.element
                        ? '<div class="jar-content-wrap"><span class="result-item jar-result-item" data-id="' + j.element.id + '">' + j.element.name + '</span></div>'
                        : '<div class="jar-content-wrap"></div>';
                    const chip = div.querySelector('.jar-result-item');
                    if (j.element && chip) {
                        chip.addEventListener('click', (e) => { e.stopPropagation(); this.showElementModalById(j.element.id); });
                        requestAnimationFrame(() => shrinkJarTextToFit(chip));
                    }
                }
                jarWrap.appendChild(div);
            });
        };

        const breakOneJar = (idx) => {
            const j = this.jarState.jars[idx];
            if (!j || j.broken) return;
            const itemEl = jarWrap.querySelector('.jar-item[data-idx="' + idx + '"]');
            if (!itemEl) return;
            const wrap = itemEl.querySelector('.jar-jar-wrap');
            if (!wrap) return;
            j.broken = true;
            if (j.element) {
                const result = { type: 'combination', elements: [j.element], id: this.generateId() };
                this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
                this.saveUserData();
            }
            const contentWrap = document.createElement('div');
            contentWrap.className = 'jar-content-wrap';
            if (j.element) {
                const span = document.createElement('span');
                span.className = 'result-item jar-result-item';
                span.dataset.id = j.element.id;
                span.textContent = j.element.name;
                span.addEventListener('click', (e) => { e.stopPropagation(); this.showElementModalById(j.element.id); });
                contentWrap.appendChild(span);
                requestAnimationFrame(() => shrinkJarTextToFit(span));
            }
            itemEl.insertBefore(contentWrap, wrap);
            itemEl.classList.add('jar-broken');
            wrap.classList.add('jar-jar-wrap-overlay', 'jar-shatter');
            for (let d = 0; d < 8; d++) {
                const debris = document.createElement('span');
                debris.className = 'jar-debris';
                wrap.appendChild(debris);
            }
            setTimeout(() => {
                wrap.remove();
            }, SHATTER_DURATION);
        };

        restartBtn.addEventListener('click', () => startRound());
        smashAllBtn.addEventListener('click', () => {
            if (!this.jarState.jars.length) {
                this.showToast('请先点击重新开始');
                return;
            }
            const unbroken = this.jarState.jars.map((j, i) => ({ j, i })).filter(x => !x.j.broken);
            unbroken.forEach((x, k) => {
                setTimeout(() => breakOneJar(x.i), k * 80);
            });
        });

        if (this.jarState.jars.length > 0) {
            renderJars();
        } else {
            startRound();
        }
    }

    // 挖矿：地图式网格，点击挖土；💎=矿石（元素），连在一起的钻石=一条矿脉，挖完整条矿脉才获得元素组合；可设最长组合长度；挖到的进背包可编辑、可清空
    renderMining() {
        const params = (this.userData.settings.toolParams = this.userData.settings.toolParams || {}).mining || {};
        const maxComboLength = Math.min(10, Math.max(1, params.maxComboLength != null ? params.maxComboLength : 3));
        const backpack = Array.isArray(params.backpack) ? params.backpack : [];
        if (!this.miningState || Array.isArray(this.miningState.rows)) {
            this.miningState = { grid: null, veins: [], rows: 8, cols: 10, backpack: this.miningState && this.miningState.backpack ? this.miningState.backpack : backpack };
        }
        this.miningState.backpack = this.miningState.backpack || backpack;
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();

        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content mining-tool-content">
                <h3>挖矿</h3>
                <p class="mining-hint">点击地图上的格子挖土，挖到💎即矿石；连在一起的钻石是一条矿脉，需全部挖出才能获得该元素组合。</p>
                <details class="mining-settings blindbox-settings" id="mining-settings" open>
                    <summary>设置</summary>
                    <div class="blindbox-config blindbox-config-compact">
                        <div class="blindbox-config-line">
                            <div class="blindbox-config-row">
                                <label>最长元素组合长度</label>
                                <input type="number" id="mining-max-combo" class="form-control form-control-sm" value="${maxComboLength}" min="1" max="10">
                            </div>
                        </div>
                    </div>
                </details>
                <div class="mining-stamina-area">
                    <span class="mining-stamina-label">体力</span>
                    <div class="mining-stamina-bar-wrap"><div class="mining-stamina-bar" id="mining-stamina-bar"></div></div>
                    <span class="mining-stamina-text" id="mining-stamina-text">0 / 50</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary mining-refill-btn" id="mining-refill">就差一点</button>
                </div>
                <div class="mining-map-area">
                    <div class="mining-map-label">矿脉地图（点击格子挖土）</div>
                    <div class="mining-map" id="mining-map"></div>
                    <button type="button" class="btn btn-outline-secondary mining-new-btn" id="mining-new">新矿洞</button>
                </div>
                <div class="mining-backpack-area">
                    <div class="mining-backpack-label">背包</div>
                    <div class="mining-backpack-items" id="mining-backpack"></div>
                    <button type="button" class="btn btn-outline-secondary mining-clear-backpack-btn" id="mining-clear-backpack">清空背包</button>
                </div>
            </div>
        `;

        const mapEl = document.getElementById('mining-map');
        const newBtn = document.getElementById('mining-new');
        const clearBackpackBtn = document.getElementById('mining-clear-backpack');
        const maxComboInput = document.getElementById('mining-max-combo');
        const staminaBarEl = document.getElementById('mining-stamina-bar');
        const staminaTextEl = document.getElementById('mining-stamina-text');
        const refillBtn = document.getElementById('mining-refill');
        const ROWS = this.miningState.rows || 8;
        const COLS = this.miningState.cols || 10;
        const MAX_STAMINA = 50;

        const saveBackpack = () => {
            this.userData.settings.toolParams.mining = this.userData.settings.toolParams.mining || {};
            this.userData.settings.toolParams.mining.backpack = (this.miningState.backpack || []).map(item => ({
                id: item.id,
                elements: (item.elements || []).map(e => ({ id: e.id, name: e.name }))
            }));
            this.saveUserData();
        };

        maxComboInput.addEventListener('change', () => {
            const v = Math.min(10, Math.max(1, parseInt(maxComboInput.value, 10) || 3));
            this.userData.settings.toolParams.mining = { ...(this.userData.settings.toolParams.mining || {}), maxComboLength: v };
            this.saveUserData();
        });

        const buildGrid = () => {
            const available = this.getAvailableElements();
            if (!available.length) return null;
            const maxLen = Math.min(10, Math.max(1, parseInt(maxComboInput.value, 10) || 3));
            const grid = [];
            for (let r = 0; r < ROWS; r++) {
                grid[r] = [];
                for (let c = 0; c < COLS; c++) {
                    grid[r][c] = { type: 'soil', revealed: false, veinId: null, elementIndex: null };
                }
            }
            const freeCells = [];
            for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) freeCells.push([r, c]);
            const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
            const key = (r, c) => r + ',' + c;
            const unassigned = new Set();
            freeCells.forEach(([r, c]) => unassigned.add(key(r, c)));
            const diamondSet = new Set();
            const fourNeighbors = (r, c) => [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
            const availableForStart = new Set();
            freeCells.forEach(([r, c]) => availableForStart.add(key(r, c)));
            const removeFromAvailableForStart = (r, c) => {
                availableForStart.delete(key(r, c));
                fourNeighbors(r, c).forEach(([nr, nc]) => availableForStart.delete(key(nr, nc)));
            };
            const getUnassignedNeighbors = (r, c) => {
                return fourNeighbors(r, c).filter(([nr, nc]) => {
                    if (!unassigned.has(key(nr, nc))) return false;
                    const others = fourNeighbors(nr, nc).filter(([ar, ac]) => ar !== r || ac !== c);
                    return others.every(([ar, ac]) => !diamondSet.has(key(ar, ac)));
                });
            };
            const veins = [];
            const numVeins = 5 + Math.floor(Math.random() * 11);
            shuffle(freeCells);
            let veinId = 0;
            let cellIdx = 0;
            for (let v = 0; v < numVeins && cellIdx < freeCells.length; v++) {
                let startCell = null;
                while (cellIdx < freeCells.length) {
                    const [sr, sc] = freeCells[cellIdx++];
                    const sk = key(sr, sc);
                    if (unassigned.has(sk) && availableForStart.has(sk)) {
                        startCell = [sr, sc];
                        break;
                    }
                }
                if (!startCell) break;
                const [sr, sc] = startCell;
                const veinLen = 1 + Math.floor(Math.random() * maxLen);
                const path = [[sr, sc]];
                unassigned.delete(key(sr, sc));
                diamondSet.add(key(sr, sc));
                removeFromAvailableForStart(sr, sc);
                let r = sr, c = sc;
                for (let step = 1; step < veinLen; step++) {
                    const neighbors = getUnassignedNeighbors(r, c);
                    if (neighbors.length === 0) break;
                    const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
                    path.push([nr, nc]);
                    unassigned.delete(key(nr, nc));
                    diamondSet.add(key(nr, nc));
                    removeFromAvailableForStart(nr, nc);
                    r = nr; c = nc;
                }
                const elements = [];
                for (let k = 0; k < path.length; k++) {
                    elements.push(available[Math.floor(Math.random() * available.length)]);
                }
                veins.push(elements.map(el => ({ id: el.id, name: el.name })));
                path.forEach(([pr, pc], i) => {
                    grid[pr][pc] = { type: 'diamond', revealed: false, veinId, elementIndex: i };
                });
                veinId++;
            }
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (grid[r][c].type === 'soil') {
                        grid[r][c].type = Math.random() < 0.2 ? 'rock' : 'soil';
                    }
                }
            }
            return { grid, veins };
        };

        const checkVeinComplete = (veinId) => {
            if (!this.miningState.grid || !this.miningState.veins[veinId]) return false;
            const grid = this.miningState.grid;
            let allRevealed = true;
            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    const cell = grid[r][c];
                    if (cell.veinId === veinId && !cell.revealed) { allRevealed = false; break; }
                }
                if (!allRevealed) break;
            }
            return allRevealed;
        };

        const flushVeinToBackpack = (veinId) => {
            const elements = this.miningState.veins[veinId];
            if (!elements || !elements.length) return;
            const combo = { id: this.generateId(), elements: elements.slice() };
            this.miningState.backpack.push(combo);
            this.generationHistory.push({ tool: this.currentTool, results: [{ type: 'combination', ...combo }], timestamp: Date.now() });
            saveBackpack();
        };

        const getStaminaCost = (cell) => {
            if (cell.type === 'rock') return 3;
            if (cell.type === 'diamond') return 2;
            return 1;
        };

        const renderStamina = () => {
            const stamina = this.miningState.stamina != null ? this.miningState.stamina : 0;
            const max = this.miningState.maxStamina != null ? this.miningState.maxStamina : MAX_STAMINA;
            if (staminaBarEl) {
                staminaBarEl.style.width = Math.max(0, Math.min(100, (stamina / max) * 100)) + '%';
            }
            if (staminaTextEl) staminaTextEl.textContent = stamina + ' / ' + max;
        };

        const renderMap = () => {
            if (!mapEl) return;
            const grid = this.miningState.grid;
            if (!grid) {
                mapEl.innerHTML = '<div class="mining-map-empty">点击「新矿洞」生成地图</div>';
                return;
            }
            mapEl.innerHTML = '';
            mapEl.style.setProperty('--mining-cols', COLS);
            const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = grid[r][c];
                    const div = document.createElement('div');
                    div.className = 'mining-map-cell mining-map-cell-' + cell.type + (cell.revealed ? ' mining-map-cell-revealed' : '');
                    div.dataset.r = r;
                    div.dataset.c = c;
                    if (!cell.revealed) {
                        div.innerHTML = '<span class="mining-map-dirt">🟫</span>';
                        div.title = '点击挖土';
                    } else {
                        if (cell.type === 'diamond') {
                            div.innerHTML = '<span class="mining-diamond">💎</span>';
                        } else if (cell.type === 'rock') {
                            div.innerHTML = '<span class="mining-rock">🪨</span>';
                        } else {
                            div.innerHTML = '';
                        }
                    }
                    mapEl.appendChild(div);
                }
            }
            mapEl.querySelectorAll('.mining-map-cell:not(.mining-map-cell-revealed)').forEach(div => {
                div.addEventListener('click', () => {
                    const stamina = this.miningState.stamina != null ? this.miningState.stamina : 0;
                    if (stamina <= 0) {
                        this.showToast('没有体力了，再来一局吧');
                        return;
                    }
                    const r = parseInt(div.dataset.r, 10), c = parseInt(div.dataset.c, 10);
                    const cell = this.miningState.grid[r][c];
                    if (cell.revealed) return;
                    const cost = getStaminaCost(cell);
                    if (stamina < cost) {
                        this.showToast('体力不足，无法挖掘');
                        return;
                    }
                    this.miningState.stamina = Math.max(0, stamina - cost);
                    cell.revealed = true;
                    if (cell.type === 'diamond' && cell.veinId != null) {
                        if (checkVeinComplete(cell.veinId)) flushVeinToBackpack(cell.veinId);
                    }
                    renderStamina();
                    renderMap();
                    renderBackpack();
                });
            });
        };

        const renderBackpack = () => {
            const el = document.getElementById('mining-backpack');
            if (!el) return;
            const list = this.miningState.backpack || [];
            if (list.length === 0) {
                el.innerHTML = '<span class="mining-backpack-empty">暂无</span>';
                return;
            }
            const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
            el.innerHTML = list.map((item, idx) => {
                const parts = (item.elements || []).map(e => '<span class="mining-backpack-chip" data-id="' + escapeHtml(e.id) + '">' + escapeHtml(e.name) + '</span>').join('<span class="mining-backpack-sep"> + </span>');
                return '<div class="mining-backpack-item" data-idx="' + idx + '"><span class="mining-backpack-item-inner">' + (parts || '—') + '</span> <button type="button" class="btn btn-sm mining-backpack-edit">编辑</button></div>';
            }).join('');
            el.querySelectorAll('.mining-backpack-chip').forEach(chip => {
                chip.addEventListener('click', (e) => { e.stopPropagation(); this.showElementModalById(chip.dataset.id); });
            });
            el.querySelectorAll('.mining-backpack-edit').forEach((btn, idx) => {
                const item = list[idx];
                if (!item || !item.elements || !item.elements.length) return;
                btn.addEventListener('click', () => this.showEditCombinationModal(null, item.elements.map(e => e.id)));
            });
        };

        const startNewMine = () => {
            const available = this.getAvailableElements();
            if (available.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            const built = buildGrid();
            if (!built) return;
            this.miningState.grid = built.grid;
            this.miningState.veins = built.veins;
            this.miningState.stamina = MAX_STAMINA;
            this.miningState.maxStamina = MAX_STAMINA;
            renderStamina();
            renderMap();
        };

        if (refillBtn) refillBtn.addEventListener('click', () => {
            if (!this.miningState.grid) {
                this.showToast('请先开新矿洞');
                return;
            }
            const max = this.miningState.maxStamina != null ? this.miningState.maxStamina : MAX_STAMINA;
            this.miningState.stamina = Math.min(max, (this.miningState.stamina || 0) + 10);
            renderStamina();
            this.showToast('恢复了 10 体力');
        });

        newBtn.addEventListener('click', () => startNewMine());
        clearBackpackBtn.addEventListener('click', () => {
            this.miningState.backpack = [];
            this.userData.settings.toolParams.mining = this.userData.settings.toolParams.mining || {};
            this.userData.settings.toolParams.mining.backpack = [];
            this.saveUserData();
            renderBackpack();
            this.showToast('背包已清空');
        });

        if (!this.miningState.grid) {
            renderStamina();
            renderMap();
            renderBackpack();
        } else {
            if (this.miningState.stamina == null) {
                this.miningState.stamina = MAX_STAMINA;
                this.miningState.maxStamina = MAX_STAMINA;
            }
            renderStamina();
            renderMap();
            renderBackpack();
        }
    }

    // 心有灵犀：猜词，随机一组合+含答案的元素池；可设答案数、迷惑词数、顺序是否重要；顺序不重要则猜对固定位继续猜；顺序重要则 Wordle 式（灰/黑框/正确）；回退、历史
    renderTelepathy() {
        const params = (this.userData.settings.toolParams = this.userData.settings.toolParams || {}).telepathy || {};
        const answerSource = params.answerSource === 'combinations' ? 'combinations' : 'elements';
        const answerCount = Math.min(6, Math.max(1, params.answerCount != null ? params.answerCount : 3));
        const decoyCount = Math.min(20, Math.max(0, params.decoyCount != null ? params.decoyCount : 6));
        this.telepathyState = this.telepathyState || { answerIds: [], pool: [], slotCount: 0, inputSlots: [], fixedSlots: [], poolFeedback: {}, guessCount: 0, history: [], orderMatters: true, gameOver: false };
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();

        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content telepathy-tool-content">
                <h3>心有灵犀</h3>
                <div class="form-group">
                    <label>答案来源：</label>
                    <select id="telepathy-source" class="form-control">
                        <option value="elements" ${answerSource === 'elements' ? 'selected' : ''}>元素</option>
                        <option value="combinations" ${answerSource === 'combinations' ? 'selected' : ''}>元素组合</option>
                    </select>
                </div>
                <div class="form-group" id="telepathy-elements-count-row">
                    <label>答案数量：</label>
                    <input type="number" id="telepathy-answer-count" class="form-control" value="${answerCount}" min="1" max="6">
                </div>
                <div class="form-group">
                    <label>迷惑词数量：</label>
                    <input type="number" id="telepathy-decoy-count" class="form-control" value="${decoyCount}" min="0" max="20">
                </div>
                <div class="telepathy-slots-area">
                    <div class="telepathy-slots-header">
                        <span class="telepathy-slots-label">你的答案</span>
                        <span class="telepathy-guess-count" id="telepathy-guess-count"></span>
                    </div>
                    <div class="telepathy-slots-row">
                        <div class="telepathy-slots" id="telepathy-slots"></div>
                        <button type="button" class="btn btn-outline-secondary telepathy-submit-btn" id="telepathy-submit">提交</button>
                        <button type="button" class="btn btn-outline-secondary telepathy-clear-btn" id="telepathy-clear">清空</button>
                    </div>
                </div>
                <div class="telepathy-pool-area">
                    <div class="telepathy-pool-hint">点击元素，猜猜这个组合是什么吧~</div>
                    <div class="telepathy-pool-legend">加粗边框代表顺序不对词语对，灰色代表完全不对。</div>
                    <div class="telepathy-pool" id="telepathy-pool"></div>
                </div>
                <div class="telepathy-result" id="telepathy-result"></div>
                <button type="button" class="btn btn-primary telepathy-new-game" id="telepathy-new-game">新一局</button>
            </div>
        `;

        const poolEl = document.getElementById('telepathy-pool');
        const slotsEl = document.getElementById('telepathy-slots');
        const resultEl = document.getElementById('telepathy-result');
        const submitBtn = document.getElementById('telepathy-submit');
        const newGameBtn = document.getElementById('telepathy-new-game');
        const answerCountInput = document.getElementById('telepathy-answer-count');
        const decoyCountInput = document.getElementById('telepathy-decoy-count');
        const guessCountEl = document.getElementById('telepathy-guess-count');
        const sourceSelect = document.getElementById('telepathy-source');
        const elementsCountRow = document.getElementById('telepathy-elements-count-row');

        const saveTelepathyParams = () => {
            const src = (sourceSelect && sourceSelect.value === 'combinations') ? 'combinations' : 'elements';
            this.userData.settings.toolParams.telepathy = {
                ...(this.userData.settings.toolParams.telepathy || {}),
                answerSource: src,
                answerCount: Math.min(6, Math.max(1, parseInt(answerCountInput.value, 10) || 3)),
                decoyCount: Math.min(20, Math.max(0, parseInt(decoyCountInput.value, 10) || 6))
            };
            this.saveUserData();
        };
        const toggleElementsCountRow = () => {
            if (elementsCountRow) elementsCountRow.style.display = (sourceSelect && sourceSelect.value === 'elements') ? '' : 'none';
        };
        if (sourceSelect) {
            sourceSelect.addEventListener('change', () => { saveTelepathyParams(); toggleElementsCountRow(); });
        }
        [answerCountInput, decoyCountInput].forEach(el => {
            if (el) el.addEventListener('change', saveTelepathyParams);
        });
        toggleElementsCountRow();

        const startNewGame = () => {
            const combos = this.getAvailableCombinations();
            const elements = this.getAvailableElements();
            const fromCombinations = sourceSelect && sourceSelect.value === 'combinations';
            if (elements.length === 0) {
                this.showToast('请先选择词库或元素分组');
                return;
            }
            if (fromCombinations && combos.length === 0) {
                this.showToast('选元素组合需要先选择组合分组');
                return;
            }
            const decoys = Math.min(20, Math.max(0, parseInt(decoyCountInput.value, 10) || 6));
            const orderMatters = true;

            let answerIds = [];
            let slotCount;
            if (fromCombinations) {
                const c = combos[Math.floor(Math.random() * combos.length)];
                answerIds = (c.elementIds || []).slice();
                if (answerIds.length === 0) {
                    const set = new Set();
                    while (set.size < 3) {
                        const el = elements[Math.floor(Math.random() * elements.length)];
                        set.add(el.id);
                    }
                    answerIds = [...set];
                }
                slotCount = answerIds.length;
            } else {
                slotCount = Math.min(6, Math.max(1, parseInt(answerCountInput.value, 10) || 3));
                const set = new Set();
                while (set.size < slotCount) {
                    const el = elements[Math.floor(Math.random() * elements.length)];
                    set.add(el.id);
                }
                answerIds = [...set];
            }

            const answerSet = new Set(answerIds);
            const poolIds = [...answerIds];
            const rest = elements.filter(e => !answerSet.has(e.id));
            for (let i = 0; i < decoys && rest.length > 0; i++) {
                const idx = Math.floor(Math.random() * rest.length);
                poolIds.push(rest[idx].id);
                rest.splice(idx, 1);
            }
            for (let i = poolIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [poolIds[i], poolIds[j]] = [poolIds[j], poolIds[i]];
            }
            const pool = poolIds.map(id => this.getElementById(id)).filter(Boolean);

            this.telepathyState = {
                answerIds,
                pool,
                slotCount,
                inputSlots: [],
                fixedSlots: Array(slotCount).fill(null),
                poolFeedback: {},
                guessCount: 0,
                history: this.telepathyState.history || [],
                orderMatters,
                gameOver: false
            };
            renderPool();
            renderSlots();
            renderGuessCount();
            resultEl.innerHTML = '';
        };

        const renderGuessCount = () => {
            if (!guessCountEl) return;
            const n = this.telepathyState.guessCount != null ? this.telepathyState.guessCount : 0;
            guessCountEl.textContent = n > 0 ? '当前已猜 ' + n + ' 次' : '';
        };

        const renderPool = () => {
            if (!poolEl) return;
            const st = this.telepathyState;
            const pool = st.pool || [];
            const fixedIds = new Set((st.fixedSlots || []).filter(Boolean).map(f => f.id));
            const poolFeedback = st.poolFeedback || {};
            const visible = pool.filter(el => el && !fixedIds.has(el.id));
            poolEl.innerHTML = visible.map(el => {
                const name = (el && el.name) ? String(el.name).replace(/</g, '&lt;') : '';
                const idKey = el ? String(el.id) : '';
                const fb = poolFeedback[idKey];
                let cls = 'telepathy-pool-chip';
                if (fb === 'absent') cls += ' telepathy-pool-absent';
                else if (fb === 'wrong_pos') cls += ' telepathy-pool-wrong-pos';
                return '<span class="' + cls + '" data-id="' + idKey + '">' + name + '</span>';
            }).join('');
            poolEl.querySelectorAll('.telepathy-pool-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    if (this.telepathyState.gameOver) return;
                    const fixedSlots = this.telepathyState.fixedSlots || [];
                    const slotCount = this.telepathyState.slotCount || 0;
                    let unfixedCount = 0;
                    for (let i = 0; i < slotCount; i++) if (!fixedSlots[i]) unfixedCount++;
                    if ((this.telepathyState.inputSlots || []).length >= unfixedCount) return;
                    this.telepathyState.inputSlots = this.telepathyState.inputSlots || [];
                    this.telepathyState.inputSlots.push(this.getElementById(chip.dataset.id));
                    renderSlots();
                });
            });
        };

        const renderSlots = () => {
            if (!slotsEl) return;
            const slotCount = this.telepathyState.slotCount;
            const fixedSlots = this.telepathyState.fixedSlots || [];
            let inputSlots = this.telepathyState.inputSlots || [];
            const orderMatters = this.telepathyState.orderMatters;
            let unfixed = 0;
            for (let i = 0; i < slotCount; i++) if (!fixedSlots[i]) unfixed++;
            if (inputSlots.length > unfixed) {
                this.telepathyState.inputSlots = inputSlots = inputSlots.slice(0, unfixed);
            }
            slotsEl.innerHTML = '';
            let inputIdx = 0;
            for (let i = 0; i < slotCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'telepathy-slot';
                const fixed = fixedSlots[i];
                if (fixed) {
                    slot.innerHTML = '<span class="telepathy-slot-chip telepathy-slot-fixed">' + String(fixed.name).replace(/</g, '&lt;') + '</span>';
                } else if (orderMatters) {
                    if (inputIdx < inputSlots.length) {
                        const el = inputSlots[inputIdx++];
                        slot.innerHTML = '<span class="telepathy-slot-chip" data-idx="' + (inputIdx - 1) + '">' + (el ? String(el.name).replace(/</g, '&lt;') : '') + '</span>';
                        slot.querySelector('.telepathy-slot-chip').addEventListener('click', () => {
                            if (this.telepathyState.gameOver) return;
                            this.telepathyState.inputSlots.splice(parseInt(slot.querySelector('.telepathy-slot-chip').dataset.idx, 10), 1);
                            renderSlots();
                        });
                    } else {
                        slot.textContent = '—';
                    }
                } else {
                    let unfixedIdx = 0;
                    for (let k = 0; k < i; k++) if (!fixedSlots[k]) unfixedIdx++;
                    if (unfixedIdx < inputSlots.length) {
                        const el = inputSlots[unfixedIdx];
                        slot.innerHTML = '<span class="telepathy-slot-chip" data-pos="' + unfixedIdx + '">' + (el ? String(el.name).replace(/</g, '&lt;') : '') + '</span>';
                        slot.querySelector('.telepathy-slot-chip').addEventListener('click', () => {
                            if (this.telepathyState.gameOver) return;
                            this.telepathyState.inputSlots.splice(unfixedIdx, 1);
                            renderSlots();
                        });
                    } else {
                        slot.textContent = '—';
                    }
                }
                slotsEl.appendChild(slot);
            }
        };

        const checkAnswer = () => {
            const st = this.telepathyState;
            const orderMatters = st.orderMatters;
            const slotCount = Math.max(0, Number(st.slotCount) || 0);
            const fixedSlots = st.fixedSlots || [];
            const answerIds = st.answerIds || [];

            if (st.gameOver) {
                this.showToast('本局已结束，请点「新一局」');
                return;
            }

            let submitted = [];
            const inputLen = Array.isArray(st.inputSlots) ? st.inputSlots.length : 0;
            let unfixedCount = 0;
            for (let i = 0; i < slotCount; i++) if (!fixedSlots[i]) unfixedCount++;

            if (orderMatters) {
                if (inputLen < unfixedCount) {
                    this.showToast('请先填满 ' + unfixedCount + ' 个空位再提交');
                    return;
                }
                const usedInput = (st.inputSlots || []).slice(0, unfixedCount);
                let j = 0;
                for (let i = 0; i < slotCount; i++) {
                    if (fixedSlots[i]) submitted[i] = fixedSlots[i];
                    else submitted[i] = usedInput[j++] || null;
                }
            } else {
                if (inputLen < unfixedCount) {
                    this.showToast('请填满剩余空位再提交');
                    return;
                }
                const usedInput = (st.inputSlots || []).slice(0, unfixedCount);
                let j = 0;
                for (let i = 0; i < slotCount; i++) {
                    if (fixedSlots[i]) submitted[i] = fixedSlots[i];
                    else submitted[i] = usedInput[j++];
                }
            }

            const submittedIds = submitted.map(e => e ? String(e.id) : null);

            let feedback = [];
            if (orderMatters) {
                const used = new Set();
                feedback = submittedIds.map((id, i) => {
                    const ansId = answerIds[i];
                    if (id != null && ansId != null && String(id) === String(ansId)) {
                        used.add(String(id));
                        return 'correct';
                    }
                    return null;
                });
                submittedIds.forEach((id, i) => {
                    if (feedback[i] !== null) return;
                    const idStr = id != null ? String(id) : null;
                    const inAnswer = idStr != null && answerIds.some(a => String(a) === idStr);
                    if (!inAnswer) feedback[i] = 'absent';
                    else {
                        if (used.has(idStr)) feedback[i] = 'absent';
                        else {
                            feedback[i] = 'wrong_pos';
                            used.add(idStr);
                        }
                    }
                });
            } else {
                feedback = submitted.map((e, i) => {
                    if (!e) return 'absent';
                    const eid = String(e.id);
                    if (eid === String(answerIds[i])) return 'correct';
                    return answerIds.some(a => String(a) === eid) ? 'wrong_pos' : 'absent';
                });
            }

            st.poolFeedback = st.poolFeedback || {};
            submitted.forEach((el, i) => {
                if (!el) return;
                const f = feedback[i];
                if (f === 'wrong_pos' || f === 'absent') st.poolFeedback[String(el.id)] = f;
            });

            const correct = orderMatters
                ? submittedIds.every((id, i) => id != null && answerIds[i] != null && String(id) === String(answerIds[i]))
                : (() => {
                    const a = submittedIds.filter(Boolean).map(String).sort();
                    const b = answerIds.slice().sort();
                    return a.length === b.length && a.every((x, i) => x === b[i]);
                })();

            st.guessCount++;
            st.inputSlots = [];

            if (correct) {
                st.gameOver = true;
                for (let i = 0; i < slotCount; i++) st.fixedSlots[i] = submitted[i] || null;
                renderGuessCount();
                renderSlots();
                renderPool();
                const comboResult = { type: 'combination', id: this.generateId(), elements: this.getElementsByIds(answerIds).map(e => ({ id: e.id, name: e.name })) };
                const entry = { answerIds: answerIds.slice(), comboText: comboResult.elements.map(e => e.name).join(' + '), guessCount: st.guessCount };
                st.history.unshift(entry);
                resultEl.innerHTML = '<div class="telepathy-win">猜对了！共 ' + st.guessCount + ' 次</div>';
                const resultRow = this.createResultElement(comboResult, false, { tool: this.currentTool });
                resultEl.appendChild(resultRow);
                this.generationHistory.push({
                    tool: this.currentTool,
                    results: [comboResult],
                    timestamp: Date.now()
                });
                this.saveUserData();
            } else if (orderMatters) {
                for (let i = 0; i < slotCount; i++) {
                    if (feedback[i] === 'correct' && submitted[i]) st.fixedSlots[i] = submitted[i];
                }
                renderSlots();
                renderPool();
            } else {
                for (let i = 0; i < slotCount; i++) {
                    if (submitted[i] && submitted[i].id === answerIds[i]) st.fixedSlots[i] = submitted[i];
                }
                renderSlots();
                renderPool();
            }
            renderSlots();
            renderPool();
            renderGuessCount();
        };

        const clearBtn = document.getElementById('telepathy-clear');
        submitBtn.addEventListener('click', () => checkAnswer());
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (this.telepathyState.gameOver) return;
            this.telepathyState.inputSlots = [];
            renderSlots();
        });
        newGameBtn.addEventListener('click', () => startNewGame());

        if (!this.telepathyState.pool || this.telepathyState.pool.length === 0) {
            startNewGame();
        } else {
            this.telepathyState.orderMatters = true;
            renderPool();
            renderSlots();
        }
    }

    // 双盲：手机聊天页面，用户灰色气泡靠右、系统白色气泡靠左，上滑看历史；无结果单，历史=每次「用户消息+随机回复」为一条组合；用户消息自动入双盲词库。聊天记录与历史会保存到浏览器 localStorage 和导出/备份文件中，不会自动清除。
    renderDoubleBlind() {
        this.toolResults[this.currentTool] = [];
        this.refreshResultsArea();
        const params = (this.userData.settings.toolParams && this.userData.settings.toolParams.doubleblind) || {};
        const savedMessages = params.messages || [];
        const elementCount = params.elementCount != null ? params.elementCount : 3;
        const separator = params.separator != null ? params.separator : ' ';
        const sepOptions = [
            { value: ' ', label: '空格' },
            { value: '、', label: '顿号' },
            { value: '·', label: '中点' },
            { value: '|', label: '竖线' },
            { value: '__custom__', label: '自定义' }
        ];
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content doubleblind-content">
                <h3>双盲</h3>
                <div class="doubleblind-settings">
                    <div class="doubleblind-setting-item">
                        <label>回复元素数</label>
                        <input type="number" id="doubleblind-count" class="form-control" value="${elementCount}" min="1" max="10">
                    </div>
                    <div class="doubleblind-setting-item">
                        <label>分隔符</label>
                        <select id="doubleblind-sep-select" class="form-control">
                            ${sepOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                        </select>
                        <input type="text" id="doubleblind-sep-custom" class="form-control doubleblind-sep-custom hidden" placeholder="自定义" maxlength="4">
                    </div>
                </div>
                <div class="doubleblind-phone-frame">
                    <div class="doubleblind-phone-status">
                        <span class="doubleblind-phone-time" id="doubleblind-phone-time">9:41</span>
                        <span class="doubleblind-phone-icons">
                            <span class="doubleblind-phone-signal"></span>
                            <span class="doubleblind-phone-wifi"></span>
                            <span class="doubleblind-phone-battery"></span>
                        </span>
                    </div>
                    <div class="doubleblind-phone">
                        <div class="doubleblind-messages" id="doubleblind-messages"></div>
                        <div class="doubleblind-input-bar">
                            <input type="text" id="doubleblind-input" class="doubleblind-input" placeholder="输入内容..." maxlength="200" autocomplete="off">
                            <button type="button" class="doubleblind-send-btn" id="doubleblind-send">发送</button>
                        </div>
                        <button type="button" class="doubleblind-clear-btn" id="doubleblind-clear">清空聊天历史</button>
                    </div>
                </div>
            </div>
        `;
        this.doubleblindState = { messages: savedMessages.slice(), elementCount, separator };
        const messagesEl = document.getElementById('doubleblind-messages');
        const inputEl = document.getElementById('doubleblind-input');
        const sendBtn = document.getElementById('doubleblind-send');
        const countEl = document.getElementById('doubleblind-count');
        const sepSelect = document.getElementById('doubleblind-sep-select');
        const sepCustom = document.getElementById('doubleblind-sep-custom');
        if (sepSelect) sepSelect.value = (separator === ' ' || separator === '、' || separator === '·' || separator === '|') ? separator : '__custom__';
        if (sepCustom && sepSelect && sepSelect.value === '__custom__') { sepCustom.value = separator; sepCustom.classList.remove('hidden'); }

        const getSep = () => {
            const v = sepSelect ? sepSelect.value : ' ';
            if (v === '__custom__') return (sepCustom && sepCustom.value ? sepCustom.value : ' ').trim() || ' ';
            return v;
        };
        if (sepSelect) sepSelect.addEventListener('change', () => {
            if (sepCustom) sepCustom.classList.toggle('hidden', sepSelect.value !== '__custom__');
        });

        const saveParams = () => {
            this.userData.settings.toolParams = this.userData.settings.toolParams || {};
            this.userData.settings.toolParams.doubleblind = {
                messages: this.doubleblindState.messages,
                elementCount: parseInt(countEl ? countEl.value : 3, 10) || 3,
                separator: getSep()
            };
            this.saveUserData();
        };

        const escapeHtml = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
        const renderDoubleBlindMessages = () => {
            if (!messagesEl) return;
            messagesEl.innerHTML = this.doubleblindState.messages.map(m => {
                const isUser = m.role === 'user';
                return `<div class="doubleblind-bubble-wrap doubleblind-bubble-${isUser ? 'user' : 'bot'}">
                    <div class="doubleblind-bubble">${escapeHtml(m.text)}</div>
                </div>`;
            }).join('');
            messagesEl.scrollTop = messagesEl.scrollHeight;
        };
        const updateDoubleblindPhoneTime = () => {
            const timeEl = document.getElementById('doubleblind-phone-time');
            if (timeEl) {
                const now = new Date();
                timeEl.textContent = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            }
        };
        renderDoubleBlindMessages();
        updateDoubleblindPhoneTime();
        const doubleblindTimeInterval = setInterval(updateDoubleblindPhoneTime, 60000);
        const stopDoubleblindTimeInterval = () => { clearInterval(doubleblindTimeInterval); };
        if (messagesEl && messagesEl.closest('.doubleblind-content')) {
            const observer = new MutationObserver(() => {
                if (!document.getElementById('doubleblind-messages')) stopDoubleblindTimeInterval();
            });
            observer.observe(generationArea, { childList: true, subtree: true });
        }

        const ensureDoubleblindLibrary = () => {
            let lib = this.getLibraryById(DOUBLEBLIND_LIBRARY_ID);
            if (!lib) {
                lib = {
                    id: this.generateId(),
                    bindingId: DOUBLEBLIND_LIBRARY_ID,
                    name: '双盲词库',
                    elementIds: []
                };
                this.userData.libraries = this.userData.libraries || [];
                this.userData.libraries.push(lib);
            }
            return lib;
        };

        const sendMessage = () => {
            const text = (inputEl && inputEl.value ? inputEl.value : '').trim();
            if (!text) return;
            this.doubleblindState.messages.push({ role: 'user', text });
            const count = Math.max(1, Math.min(10, parseInt(countEl ? countEl.value : 3, 10) || 3));
            const elements = this.generateRandomElements(count);
            if (elements.length === 0) { this.showToast('请先选择词库或元素分组'); return; }
            const sep = getSep();
            const botText = elements.map(e => e.name).join(sep);
            this.doubleblindState.messages.push({ role: 'bot', text: botText, elements: elements.map(e => ({ id: e.id, name: e.name })) });
            this.doubleblindState.elementCount = count;
            this.doubleblindState.separator = sep;
            saveParams();
            renderDoubleBlindMessages();
            if (inputEl) inputEl.value = '';

            const lib = ensureDoubleblindLibrary();
            const userEl = {
                id: this.generateId(),
                name: text,
                libraryIds: [lib.bindingId],
                combinationIds: [],
                isBlacklisted: false
            };
            this.userData.elements = this.userData.elements || [];
            this.userData.elements.push(userEl);
            lib.elementIds = lib.elementIds || [];
            lib.elementIds.push(userEl.id);

            const comboElements = [{ id: userEl.id, name: userEl.name }, ...elements.map(e => ({ id: e.id, name: e.name }))];
            const result = { type: 'combination', elements: comboElements, id: this.generateId() };
            this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
            this.saveUserData();
        };

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
        const clearBtn = document.getElementById('doubleblind-clear');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            this.doubleblindState.messages = [];
            saveParams();
            renderDoubleBlindMessages();
            this.showToast('已清空聊天历史');
        });
        if (countEl) countEl.addEventListener('change', saveParams);
        if (sepSelect) sepSelect.addEventListener('change', saveParams);
        if (sepCustom) sepCustom.addEventListener('change', saveParams);
    }

    // 心理测试功能
    renderQuiz() {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content quiz-tool-content">
                <h3>心理测试</h3>
                <div class="quiz-setup">
                    <div class="quiz-setup-row">
                        <label>题目数量：<input type="number" id="quiz-questions" class="form-control" value="5" min="3" max="10"></label>
                        <label>每题答案数量：<input type="number" id="quiz-option-count" class="form-control" value="4" min="3" max="6"></label>
                    </div>
                    <div class="quiz-setup-btn-row">
                        <button id="start-quiz-btn" class="btn quiz-start-btn">开始测试</button>
                    </div>
                </div>
                <div id="quiz-area" class="quiz-area hidden">
                    <div class="quiz-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <span class="progress-text" id="progress-text">1/5</span>
                    </div>
                    <div id="quiz-question-block" class="quiz-question">
                        <h4 id="quiz-question-text">选择最喜欢的一个：</h4>
                        <div class="quiz-options" id="quiz-options-container"></div>
                    </div>
                </div>
            </div>
        `;

        this.quizState = {
            questions: [],
            currentQuestion: 0,
            selectedElements: [],
            totalQuestions: 0
        };

        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            this.startQuiz();
        });
    }

    startQuiz() {
        const questionCount = parseInt(document.getElementById('quiz-questions').value, 10) || 5;
        const optionCount = parseInt(document.getElementById('quiz-option-count').value, 10) || 4;
        
        const availableElements = this.getAvailableElements();
        if (availableElements.length < optionCount * questionCount) {
            this.showToast('可用元素不足，请增加词库或减少题目数量');
            return;
        }

        // 生成题目
        this.quizState.questions = [];
        this.quizState.currentQuestion = 0;
        this.quizState.totalQuestions = questionCount;
        const usedElements = new Set();
        for (let i = 0; i < questionCount; i++) {
            const options = [];
            for (let j = 0; j < optionCount; j++) {
                let element;
                do {
                    element = availableElements[Math.floor(Math.random() * availableElements.length)];
                } while (usedElements.has(element.id) && usedElements.size < availableElements.length);
                usedElements.add(element.id);
                options.push(element);
            }
            this.quizState.questions.push({ question: '选择你最喜欢的元素~', options });
        }
        document.getElementById('quiz-area').classList.remove('hidden');
        this.showQuestion();
    }

    showQuestion() {
        const currentQ = this.quizState.questions[this.quizState.currentQuestion];
        
        // 更新进度
        const progress = ((this.quizState.currentQuestion + 1) / this.quizState.totalQuestions) * 100;
        document.getElementById('progress-fill').style.width = progress + '%';
        document.getElementById('progress-text').textContent = 
            `${this.quizState.currentQuestion + 1}/${this.quizState.totalQuestions}`;
        
        // 显示题目
        const questionEl = document.getElementById('quiz-question-text');
        if (questionEl) questionEl.textContent = currentQ.question;
        
        // 显示选项
        const optionsContainer = document.getElementById('quiz-options-container');
        if (!optionsContainer) return;
        optionsContainer.innerHTML = '';
        
        currentQ.options.forEach((element, index) => {
            const option = document.createElement('div');
            option.className = 'quiz-option';
            option.innerHTML = `
                <div class="option-content">
                    <span class="option-text">${element.name}</span>
                </div>
            `;
            
            option.addEventListener('click', () => {
                this.selectOption(element);
            });
            
            optionsContainer.appendChild(option);
        });
    }

    selectOption(element) {
        this.quizState.selectedElements.push(element);
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(opt => {
            if (opt.querySelector('.option-text').textContent === element.name) opt.classList.add('selected');
        });
        if (this.quizState.currentQuestion + 1 < this.quizState.totalQuestions) {
            this.quizState.currentQuestion++;
            this.showQuestion();
            return;
        }
        const els = this.quizState.selectedElements;
        const result = { type: 'combination', elements: els.map(e => ({ id: e.id, name: e.name })), id: this.generateId() };
        this.toolResults[this.currentTool] = this.toolResults[this.currentTool] || [];
        this.toolResults[this.currentTool].push(result);
        this.generationHistory.push({ tool: this.currentTool, results: [result], timestamp: Date.now() });
        this.saveUserData();
        const questionBlock = document.getElementById('quiz-question-block');
        if (!questionBlock) return;
        questionBlock.innerHTML = `
            <div class="quiz-result-card fade-in quiz-result-inline">
                <h4>和你最有缘分的元素组合是：</h4>
                <div class="quiz-result-combo-wrapper" data-combo="1">${els.map((e, i) => `<span class="quiz-element" data-id="${e.id}">${e.name}</span>${i < els.length - 1 ? '<span class="quiz-sep"> + </span>' : ''}`).join('')}</div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" id="quiz-restart-btn">再测一次</button>
                </div>
            </div>
        `;
        const wrapper = questionBlock.querySelector('.quiz-result-combo-wrapper');
        if (wrapper) wrapper.addEventListener('click', (e) => {
            const el = e.target.closest('.quiz-element');
            if (el) {
                e.stopPropagation();
                this.showElementModalById(el.dataset.id);
            } else {
                this.showEditCombinationModal(null, els.map(x => x.id), false);
            }
        });
        const restartBtn = questionBlock.querySelector('#quiz-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', (e) => { e.stopPropagation(); this.restartQuiz(); });
    }

    restartQuiz() {
        const questionBlock = document.getElementById('quiz-question-block');
        if (questionBlock) {
            questionBlock.innerHTML = '<h4 id="quiz-question-text">选择最喜欢的一个：</h4><div class="quiz-options" id="quiz-options-container"></div>';
        }
        this.quizState.selectedElements = [];
        this.quizState.currentQuestion = 0;
        this.startQuiz();
    }

    // 一掷千金功能：收藏架可存元素与组合，组合不可拆分，2列商城，刷新费用，初始资金可设置
    renderShop() {
        const initialMoney = (this.userData.settings && this.userData.settings.shopInitialMoney != null)
            ? Number(this.userData.settings.shopInitialMoney) : 1000;
        const money = (this.shopState && this.shopState.playerMoney != null) ? this.shopState.playerMoney : initialMoney;
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content shop-tool-content">
                <h3>一掷千金</h3>
                <div class="shop-settings-panel">
                    <h4 class="shop-settings-title">设置</h4>
                    <div class="shop-settings-grid">
                        <label class="shop-setting-row">商店格子数 <input type="number" id="shop-grid-size" min="4" max="24" value="12"></label>
                        <label class="shop-setting-row">初始资金 <input type="number" id="shop-initial-money" min="100" step="100" value="1000">（新开局生效）</label>
                        <label class="shop-setting-row">事件概率 <input type="number" id="shop-event-total-prob" min="0" max="100" value="30">%（其余为商品）</label>
                    </div>
                    <div class="shop-event-weights-title">各事件占比（在事件中，默认均分 12.5%）</div>
                    <div class="shop-prob-grid">
                        <label>随机打折 <input type="number" id="shop-prob-discount" min="0" max="100" value="12">%</label>
                        <label>拍卖(参与) <input type="number" id="shop-prob-auction" min="0" max="100" value="13">%</label>
                        <label>拍卖(挂卖) <input type="number" id="shop-prob-auction-sell" min="0" max="100" value="12">%</label>
                        <label>免费送 <input type="number" id="shop-prob-free" min="0" max="100" value="13">%</label>
                        <label>捡钱 <input type="number" id="shop-prob-money" min="0" max="100" value="12">%</label>
                        <label>命运刮刮乐 <input type="number" id="shop-prob-scratch" min="0" max="100" value="13">%</label>
                        <label>盲盒 <input type="number" id="shop-prob-blindbox" min="0" max="100" value="12">%</label>
                        <label>以物换物 <input type="number" id="shop-prob-trade" min="0" max="100" value="13">%</label>
                    </div>
                </div>
                <div class="shop-header">
                    <div class="player-money">
                        <span class="money-label">💰 资金：</span>
                        <span id="player-money" class="money-amount">${money}</span>
                    </div>
                    <button type="button" id="refresh-shop-btn" class="btn btn-secondary shop-refresh-btn"><span id="refresh-btn-icon">🪙</span> <span id="refresh-btn-cost">50金币刷新</span></button>
                </div>
                <div id="shop-game-over" class="shop-game-over hidden">
                    <span id="shop-game-over-text"></span>
                    <button type="button" class="btn btn-sm btn-primary ml-2" id="shop-restart-btn">用初始资金重新开始</button>
                </div>
                <div class="shop-area">
                    <div class="shop-items shop-items-2col" id="shop-items"></div>
                </div>
                <div class="inventory-area">
                    <h4>📦 我的收藏架</h4>
                    <div class="inventory-items" id="inventory-items">
                        <div class="empty-inventory">收藏架空空如也...</div>
                    </div>
                    <div class="inventory-actions">
                        <button id="combine-items-btn" class="btn btn-primary" disabled>组合元素</button>
                        <button id="sell-all-btn" class="btn btn-danger" disabled>全部出售</button>
                    </div>
                </div>
            </div>
        `;

        this.shopState = this.shopState || { inventory: [], shopItems: [] };
        this.shopState.playerMoney = money;
        if (!Array.isArray(this.shopState.inventory)) this.shopState.inventory = [];

        document.getElementById('refresh-shop-btn').addEventListener('click', () => {
            this.shopRefresh();
        });
        document.getElementById('combine-items-btn').addEventListener('click', () => this.combineInventoryItems());
        document.getElementById('sell-all-btn').addEventListener('click', () => this.sellAllItems());
        this.shopUpdateRefreshHint();

        const sp = (this.userData.settings && this.userData.settings.toolParams && this.userData.settings.toolParams.shop) || {};
        ['discount', 'auction', 'auction_sell', 'free', 'money', 'scratch', 'blindbox', 'trade'].forEach(key => {
            const el = document.getElementById('shop-prob-' + (key === 'auction_sell' ? 'auction-sell' : key));
            if (el && sp[key] != null) el.value = sp[key];
        });
        const gridSizeEl = document.getElementById('shop-grid-size');
        if (gridSizeEl && sp.gridSize != null) gridSizeEl.value = Math.min(24, Math.max(4, sp.gridSize));
        const initialMoneyEl = document.getElementById('shop-initial-money');
        if (initialMoneyEl) {
            const v = (this.userData.settings && this.userData.settings.shopInitialMoney != null) ? Number(this.userData.settings.shopInitialMoney) : 1000;
            initialMoneyEl.value = Math.max(100, Math.min(999999, isNaN(v) ? 1000 : v));
        }
        const eventTotalEl = document.getElementById('shop-event-total-prob');
        if (eventTotalEl && sp.eventTotalProb != null) eventTotalEl.value = Math.min(100, Math.max(0, sp.eventTotalProb));
        ['shop-grid-size', 'shop-initial-money', 'shop-event-total-prob', 'shop-prob-discount', 'shop-prob-auction', 'shop-prob-auction-sell', 'shop-prob-free', 'shop-prob-money', 'shop-prob-scratch', 'shop-prob-blindbox', 'shop-prob-trade'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.shopSaveEventProbs());
        });

        const restartBtn = document.getElementById('shop-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.shopRestart());

        this.generateShopItems();
        this.updateMoneyDisplay();
        this.updateInventoryDisplay();
    }

    updateMoneyDisplay() {
        const el = document.getElementById('player-money');
        if (el && this.shopState && this.shopState.playerMoney != null) el.textContent = String(this.shopState.playerMoney);
    }

    shopRestart() {
        const initialMoneyEl = document.getElementById('shop-initial-money');
        let initialMoney = (this.userData.settings && this.userData.settings.shopInitialMoney != null)
            ? Number(this.userData.settings.shopInitialMoney) : 1000;
        if (initialMoneyEl) {
            const v = parseInt(initialMoneyEl.value, 10);
            if (!isNaN(v) && v >= 100) initialMoney = Math.min(999999, v);
            this.userData.settings = this.userData.settings || {};
            this.userData.settings.shopInitialMoney = initialMoney;
            this.saveUserData();
        }
        this.shopState.playerMoney = initialMoney;
        const goEl = document.getElementById('shop-game-over');
        if (goEl) { goEl.classList.add('hidden'); const t = goEl.querySelector('#shop-game-over-text'); if (t) t.textContent = ''; }
        this.updateMoneyDisplay();
        const refreshBtn = document.getElementById('refresh-shop-btn');
        if (refreshBtn) refreshBtn.disabled = false;
        this.shopState.shopItems = [];
        this.generateShopItems();
    }

    shopUpdateRefreshHint() {
        const btn = document.getElementById('refresh-shop-btn');
        const iconSpan = document.getElementById('refresh-btn-icon');
        const costSpan = document.getElementById('refresh-btn-cost');
        if (!btn) return;
        const isEmpty = !this.shopState.shopItems || this.shopState.shopItems.length === 0;
        const isSlotDone = (i) => i.type === 'product' ? i.purchased : (i.triggered === true);
        const allGone = this.shopState.shopItems && this.shopState.shopItems.every(isSlotDone);
        const isFree = isEmpty || allGone;
        if (iconSpan) iconSpan.textContent = isFree ? '🔄' : '🪙';
        if (costSpan) costSpan.textContent = isFree ? '免费刷新' : '50金币刷新';
        btn.title = isFree ? '刷新商城（当前免费）' : '刷新商城（消耗 50 金币）';
    }

    getShopEventProbs() {
        const eventTotalEl = document.getElementById('shop-event-total-prob');
        const eventTotalProb = Math.min(100, Math.max(0, parseInt(eventTotalEl && eventTotalEl.value, 10) || 30));
        const ids = ['discount', 'auction', 'auction_sell', 'free', 'money', 'scratch', 'blindbox', 'trade'];
        const defaults = { discount: 12, auction: 13, auction_sell: 12, free: 13, money: 12, scratch: 13, blindbox: 12, trade: 13 };
        const elId = k => 'shop-prob-' + (k === 'auction_sell' ? 'auction-sell' : k);
        const eventWeights = {};
        let weightSum = 0;
        ids.forEach(k => {
            const el = document.getElementById(elId(k));
            const v = el ? (parseInt(el.value, 10) || 0) : defaults[k];
            eventWeights[k] = Math.max(0, Math.min(100, v));
            weightSum += eventWeights[k];
        });
        if (weightSum <= 0) { eventWeights.discount = 100; weightSum = 100; }
        return { eventTotalProb, eventWeights, weightSum };
    }

    shopSaveEventProbs() {
        const { eventTotalProb, eventWeights } = this.getShopEventProbs();
        const gridEl = document.getElementById('shop-grid-size');
        const gridSize = gridEl ? Math.min(24, Math.max(4, parseInt(gridEl.value, 10) || 12)) : 12;
        const initialMoneyEl = document.getElementById('shop-initial-money');
        const initialMoney = initialMoneyEl ? Math.max(100, Math.min(999999, parseInt(initialMoneyEl.value, 10) || 1000)) : 1000;
        this.userData.settings = this.userData.settings || {};
        this.userData.settings.shopInitialMoney = initialMoney;
        this.userData.settings.toolParams = this.userData.settings.toolParams || {};
        this.userData.settings.toolParams.shop = { eventTotalProb, ...eventWeights, gridSize };
        this.saveUserData();
    }

    shopRollEventType() {
        const { eventTotalProb, eventWeights, weightSum } = this.getShopEventProbs();
        if (Math.random() * 100 >= eventTotalProb) return 'normal';
        let r = Math.random() * weightSum;
        const keys = ['discount', 'auction', 'auction_sell', 'free', 'money', 'scratch', 'blindbox', 'trade'];
        for (const k of keys) {
            r -= eventWeights[k] || 0;
            if (r <= 0) return k;
        }
        return keys[0];
    }

    shopRefresh() {
        const isEmpty = !this.shopState.shopItems || this.shopState.shopItems.length === 0;
        const isSlotDone = (i) => i.type === 'product' ? i.purchased : (i.triggered === true);
        const allGone = this.shopState.shopItems && this.shopState.shopItems.every(isSlotDone);
        const cost = (isEmpty || allGone) ? 0 : 50;
        if (this.shopState.playerMoney < cost) {
            this.showToast('资金不足');
            return;
        }
        if (cost > 0) this.shopState.playerMoney -= cost;
        this.updateMoneyDisplay();
        this.shopCheckGameOver();
        this.generateShopItems();
        this.shopUpdateRefreshHint();
    }

    shopOpenEvent(eventType) {
        const handlers = {
            discount: () => this.shopEventDiscount(),
            auction: () => this.shopEventAuction(),
            auction_sell: () => this.shopEventAuctionSell(),
            free: () => this.shopEventFree(),
            money: () => this.shopEventMoney(),
            scratch: () => this.shopEventScratch(),
            blindbox: () => this.shopEventBlindbox(),
            trade: () => this.shopEventTrade()
        };
        if (handlers[eventType]) handlers[eventType]();
    }

    shopEventFree() {
        const available = this.getAvailableElements();
        if (available.length === 0) { this.showToast('没有可用元素'); return; }
        const el = available[Math.floor(Math.random() * available.length)];
        this.shopState.inventory.push({ type: 'element', element: el, purchasePrice: 0, actualValue: this.calculateActualValue(50) });
        this.updateInventoryDisplay();
        this.showToast('🎁 免费获得：' + el.name);
    }

    shopEventMoney() {
        const amount = Math.floor(Math.random() * 181 + 20); // 20-200
        this.shopState.playerMoney += amount;
        this.updateMoneyDisplay();
        this.showToast('💰 捡到 ' + amount + ' 金币！');
    }

    shopEventDiscount() {
        const available = this.getAvailableElements();
        if (available.length === 0) { this.showToast('没有可用元素'); return; }
        const discounts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const count = Math.min(5, Math.max(3, Math.floor(Math.random() * 3) + 3), available.length);
        const items = [];
        const used = new Set();
        for (let i = 0; i < count; i++) {
            let el;
            do { el = available[Math.floor(Math.random() * available.length)]; } while (used.has(el.id) && used.size < available.length);
            used.add(el.id);
            const basePrice = Math.floor(Math.random() * 19 + 1) * 10;
            const off = discounts[Math.floor(Math.random() * discounts.length)];
            const price = Math.floor(basePrice * (100 - off) / 100 / 10) * 10;
            items.push({ id: this.generateId(), element: el, basePrice, off, price, actualValue: this.calculateActualValue(basePrice), bought: false });
        }
        const renderList = () => {
            const listHtml = items.map(it => `
                <div class="shop-event-discount-item" data-id="${it.id}">
                    <span class="item-name">${it.element.name}</span>
                    <span class="item-original">原价 ${it.basePrice}</span>
                    <span class="item-off">-${it.off}%</span>
                    <span class="item-now">💰 ${it.price}</span>
                    <button type="button" class="btn btn-sm btn-primary shop-event-buy-discount" data-id="${it.id}" ${it.bought || this.shopState.playerMoney < it.price ? 'disabled' : ''}>${it.bought ? '已购' : '购买'}</button>
                </div>
            `).join('');
            return listHtml;
        };
        const money = this.shopState.playerMoney;
        const modal = this.createModal('🏷️ 随机打折', `<p class="shop-modal-balance">当前余额：<span id="shop-discount-balance">${money}</span></p><p>限时折扣，可多选购买：</p><div class="shop-event-discount-list" id="shop-discount-list">${renderList()}</div>`, [{ text: '不买了', class: 'btn-secondary', action: () => this.closeModal() }]);
        const listEl = modal.querySelector('#shop-discount-list');
        const balanceEl = modal.querySelector('#shop-discount-balance');
        const updateBalance = () => { if (balanceEl) balanceEl.textContent = this.shopState.playerMoney; };
        listEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.shop-event-buy-discount');
            if (!btn || btn.disabled) return;
            const it = items.find(x => x.id === btn.dataset.id);
            if (!it || it.bought || this.shopState.playerMoney < it.price) return;
            it.bought = true;
            this.shopState.playerMoney -= it.price;
            this.shopState.inventory.push({ type: 'element', element: it.element, purchasePrice: it.price, actualValue: it.actualValue });
            this.updateMoneyDisplay();
            this.updateInventoryDisplay();
            updateBalance();
            listEl.innerHTML = renderList();
            this.showToast('购买成功！' + it.element.name + ' 价值 ' + it.actualValue);
        });
    }

    shopEventAuction() {
        const available = this.getAvailableElements();
        if (available.length === 0) { this.showToast('没有可用元素'); return; }
        const el = available[Math.floor(Math.random() * available.length)];
        const basePrice = Math.floor(Math.random() * 15 + 1) * 10;
        const actualValue = this.calculateActualValue(basePrice);
        let currentBid = basePrice;
        let myBidAmount = currentBid;
        let isFirstBid = true;
        const getOtherBidIncrease = () => {
            const r = Math.random();
            if (r < 0.7) return 10 + Math.floor(Math.random() * 2) * 10;
            return 30 + Math.floor(Math.random() * 3) * 10;
        };
        const getOutbidProb = () => Math.max(0.08, 0.5 - currentBid / 1200);
        const modal = this.createModal('🔨 拍卖', `
            <p class="shop-modal-balance">当前余额：<span id="shop-auction-balance">${this.shopState.playerMoney}</span></p>
            <p>竞拍：<strong>${el.name}</strong>（估价约 ${actualValue}）</p>
            <div class="shop-event-auction-row">
                <span id="shop-auction-price-label">起拍价</span><span>：</span>
                <span id="shop-auction-current">${currentBid}</span>
            </div>
            <div class="shop-event-auction-row">
                <span>你出价：</span>
                <button type="button" class="btn btn-sm btn-secondary" id="shop-auction-minus10">-10</button>
                <span id="shop-auction-my-bid">${myBidAmount}</span>
                <button type="button" class="btn btn-sm btn-secondary" id="shop-auction-plus10">+10</button>
            </div>
        `, [
            { text: '放弃', class: 'btn-secondary', action: () => this.closeModal() },
            { text: '出价', class: 'btn-primary', action: () => {
                const myBid = myBidAmount;
                const minBid = isFirstBid ? currentBid : currentBid + 10;
                if (myBid < minBid) { this.showToast(isFirstBid ? '出价不能低于起拍价' : '出价至少为当前价+10'); return; }
                if (this.shopState.playerMoney < myBid) { this.showToast('资金不足，需 ' + myBid + ' 金币'); return; }
                if (Math.random() < getOutbidProb()) {
                    isFirstBid = false;
                    const add = getOtherBidIncrease();
                    currentBid = myBid + add;
                    myBidAmount = currentBid + 10;
                    const span = modal.querySelector('#shop-auction-current');
                    if (span) span.textContent = currentBid;
                    const myBidSpan = modal.querySelector('#shop-auction-my-bid');
                    if (myBidSpan) myBidSpan.textContent = myBidAmount;
                    const labelEl = modal.querySelector('#shop-auction-price-label');
                    if (labelEl) labelEl.textContent = '当前价';
                    this.showToast('当前最高价 ' + currentBid + '，请继续出价或放弃');
                    return;
                }
                this.shopState.playerMoney -= myBid;
                this.shopState.inventory.push({ type: 'element', element: el, purchasePrice: myBid, actualValue });
                this.updateMoneyDisplay();
                this.updateInventoryDisplay();
                this.closeModal();
                this.showToast('拍得 ' + el.name + '！');
            } }
        ]);
        const getMinBid = () => isFirstBid ? currentBid : currentBid + 10;
        const refreshMyBidDisplay = () => {
            const el = modal.querySelector('#shop-auction-my-bid');
            if (el) el.textContent = myBidAmount;
        };
        modal.querySelector('#shop-auction-plus10').addEventListener('click', () => {
            myBidAmount += 10;
            refreshMyBidDisplay();
        });
        modal.querySelector('#shop-auction-minus10').addEventListener('click', () => {
            const minBid = getMinBid();
            myBidAmount = Math.max(minBid, myBidAmount - 10);
            refreshMyBidDisplay();
        });
    }

    shopEventAuctionSell() {
        if (!this.shopState.inventory || this.shopState.inventory.length === 0) { this.showToast('收藏架为空，无法挂卖'); return; }
        const list = this.shopState.inventory.map((it, i) => {
            const name = it.type === 'combination' ? (this.getElementsByIds(it.elementIds || []).map(e => e.name).join(' + ') || '组合') : it.element.name;
            const suggest = Math.max(0, Math.floor(it.actualValue * 0.8 / 10) * 10);
            return { index: i, name, value: it.actualValue, suggest, item: it };
        });
        const optionsHtml = list.map((it, i) => `<option value="${i}" data-suggest="${it.suggest}">${it.name}（价值${it.value}，建议起拍价${it.suggest}）</option>`).join('');
        const content = `
            <p>选择要上拍的物品并设置起拍价（建议价=价值×80%，起拍价越高越容易流拍）：</p>
            <select id="shop-auction-sell-select" class="form-control mb-2">${optionsHtml}</select>
            <label>起拍价 <input type="number" id="shop-auction-sell-price" class="form-control" value="${list[0].suggest}" min="0"></label>
        `;
        const modal = this.createModal('🔨 挂卖拍卖', content, [
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() },
            { text: '上拍', class: 'btn-primary', action: () => {
                const idx = parseInt(modal.querySelector('#shop-auction-sell-select').value, 10);
                const price = parseInt(modal.querySelector('#shop-auction-sell-price').value, 10) || 0;
                const entry = list[idx];
                if (!entry || price < 0) return;
                const overValue = price / Math.max(1, entry.value);
                const flowProb = Math.min(0.9, (overValue - 0.8) * 1.5);
                const flow = Math.random() < flowProb;
                if (flow) {
                    this.closeModal();
                    this.showToast('流拍，' + entry.name + ' 已归还收藏架');
                    return;
                }
                const finalPrice = Math.floor(entry.value * (0.7 + Math.random() * 0.6) / 10) * 10;
                this.shopState.playerMoney += finalPrice;
                this.shopState.inventory.splice(entry.index, 1);
                this.updateMoneyDisplay();
                this.updateInventoryDisplay();
                this.closeModal();
                this.showToast('拍出成功！获得 ' + finalPrice + ' 金币');
            } }
        ]);
        modal.querySelector('#shop-auction-sell-select').addEventListener('change', () => {
            const opt = modal.querySelector('#shop-auction-sell-select option:checked');
            const suggest = opt ? parseInt(opt.dataset.suggest, 10) : 0;
            const priceInput = modal.querySelector('#shop-auction-sell-price');
            if (priceInput) priceInput.value = suggest;
        });
    }

    shopEventScratch() {
        const cardTypes = [
            { name: '豪华型', tiers: [{ name: '一等奖', amount: 500 }, { name: '二等奖', amount: 200 }, { name: '三等奖', amount: 100 }, { name: '参与奖', amount: 20 }], price: 60 },
            { name: '标准型', tiers: [{ name: '一等奖', amount: 300 }, { name: '二等奖', amount: 150 }, { name: '三等奖', amount: 80 }, { name: '参与奖', amount: 10 }], price: 40 },
            { name: '实惠型', tiers: [{ name: '一等奖', amount: 200 }, { name: '二等奖', amount: 100 }, { name: '三等奖', amount: 50 }, { name: '参与奖', amount: 5 }], price: 25 },
            { name: '迷你型', tiers: [{ name: '一等奖', amount: 100 }, { name: '二等奖', amount: 50 }, { name: '三等奖', amount: 20 }, { name: '参与奖', amount: 5 }], price: 15 },
            { name: '体验型', tiers: [{ name: '一等奖', amount: 50 }, { name: '二等奖', amount: 20 }, { name: '三等奖', amount: 10 }, { name: '参与奖', amount: 5 }], price: 8 }
        ];
        const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const price = cardType.price;
        const tiers = cardType.tiers;
        let bought = false;
        let resultAmount = 0;
        let resultTierName = '';
        const rollResult = () => {
            const tierIndex = Math.floor(Math.random() * tiers.length);
            const tier = tiers[tierIndex];
            const isThanks = Math.random() < 0.5;
            resultTierName = isThanks ? '谢谢惠顾' : tier.name;
            return isThanks ? 0 : tier.amount;
        };
        const awardsHtml = tiers.map(t => `<div class="shop-scratch-award-row">${t.name}：${t.amount} 金币</div>`).join('');
        const container = document.createElement('div');
        container.className = 'shop-scratch-wrap';
        container.innerHTML = `
            <p class="shop-modal-balance">当前余额：<span id="shop-scratch-balance">${this.shopState.playerMoney}</span></p>
            <div class="shop-scratch-body">
                <div class="shop-scratch-card" id="shop-scratch-card">
                    <span class="shop-scratch-placeholder" id="shop-scratch-placeholder">点击购买</span>
                    <span class="shop-scratch-price-inline">${price} 金币</span>
                    <span class="shop-scratch-reveal hidden" id="shop-scratch-reveal"></span>
                </div>
                <div class="shop-scratch-awards">
                    <div class="shop-scratch-awards-title">${cardType.name} · 本张奖项</div>
                    ${awardsHtml}
                    <div class="shop-scratch-price">价格：<strong>${price}</strong> 金币</div>
                </div>
            </div>
        `;
        const modal = this.createModal('🎫 命运刮刮乐', '<div id="shop-scratch-container"></div>', [{ text: '关闭', class: 'btn-primary', action: () => this.closeModal() }]);
        const wrap = modal.querySelector('#shop-scratch-container');
        if (wrap) wrap.appendChild(container);
        const card = container.querySelector('#shop-scratch-card');
        const placeholder = container.querySelector('#shop-scratch-placeholder');
        const priceInline = container.querySelector('.shop-scratch-price-inline');
        const reveal = container.querySelector('#shop-scratch-reveal');
        const balanceEl = container.querySelector('#shop-scratch-balance');
        const updateBalance = () => { if (balanceEl) balanceEl.textContent = this.shopState.playerMoney; };
        card.addEventListener('click', () => {
            if (card.classList.contains('scratch-done')) return;
            if (!bought) {
                if (this.shopState.playerMoney < price) { this.showToast('余额不足，需要 ' + price + ' 金币'); return; }
                this.shopState.playerMoney -= price;
                this.updateMoneyDisplay();
                updateBalance();
                bought = true;
                card.classList.add('scratch-bought');
                placeholder.textContent = '点击刮开';
                if (priceInline) priceInline.classList.add('hidden');
                this.showToast('已购买，点击卡面刮开');
                return;
            }
            resultAmount = rollResult();
            this.shopState.playerMoney += resultAmount;
            this.updateMoneyDisplay();
            updateBalance();
            placeholder.classList.add('hidden');
            reveal.classList.remove('hidden');
            reveal.textContent = resultTierName;
            card.classList.add('scratch-done');
            if (resultAmount > 0) this.showToast('获得 ' + resultAmount + ' 金币');
            else this.showToast('谢谢惠顾');
        });
    }

    shopEventBlindbox() {
        const available = this.getAvailableElements();
        if (available.length === 0) { this.showToast('没有可用元素'); return; }
        const el = available[Math.floor(Math.random() * available.length)];
        const basePrice = 50;
        const price = Math.floor(basePrice * (0.5 + Math.random()) / 10) * 10;
        const actualValue = this.calculateActualValue(price);
        const modal = this.createModal('📦 盲盒', `<p class="shop-modal-balance">当前余额：<span id="shop-blindbox-balance">${this.shopState.playerMoney}</span></p><p>不知道这是什么，不过买了就知道了。价格：💰 ${price}</p>`, [
            { text: '不买', class: 'btn-secondary', action: () => this.closeModal() },
            { text: '购买', class: 'btn-primary', action: () => {
                if (this.shopState.playerMoney < price) { this.showToast('资金不足'); return; }
                this.shopState.playerMoney -= price;
                this.shopState.inventory.push({ type: 'element', element: el, purchasePrice: price, actualValue });
                this.updateMoneyDisplay();
                this.updateInventoryDisplay();
                this.closeModal();
                this.showToast('已放入收藏架');
            } }
        ]);
    }

    shopEventTrade() {
        if (!this.shopState.inventory || this.shopState.inventory.length === 0) { this.showToast('收藏架为空'); return; }
        const options = this.shopState.inventory.map((it, i) => {
            const name = it.type === 'combination' ? (this.getElementsByIds(it.elementIds || []).map(e => e.name).join(' + ') || '组合') : it.element.name;
            return { index: i, name, item: it };
        });
        const optionsHtml = options.map((o, i) => `<option value="${i}">${o.name}</option>`).join('');
        const modal = this.createModal('🔄 以物换物', `<p>选一件物品，随机换回一件：</p><select id="shop-trade-select" class="form-control">${optionsHtml}</select>`, [
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() },
            { text: '换', class: 'btn-primary', action: () => {
                const idx = parseInt(modal.querySelector('#shop-trade-select').value, 10);
                const give = options[idx];
                if (!give) return;
                const available = this.getAvailableElements();
                if (available.length === 0) { this.closeModal(); this.showToast('没有可换元素'); return; }
                const newEl = available[Math.floor(Math.random() * available.length)];
                const newValue = this.calculateActualValue(50);
                this.shopState.inventory.splice(give.index, 1);
                this.shopState.inventory.push({ type: 'element', element: newEl, purchasePrice: newValue, actualValue: newValue });
                this.updateInventoryDisplay();
                this.closeModal();
                this.showToast('用 ' + give.name + ' 换到了 ' + newEl.name);
            } }
        ]);
    }

    shopCheckGameOver() {
        if (this.shopState.playerMoney > 0) return;
        const el = document.getElementById('shop-game-over');
        const textEl = el && el.querySelector('#shop-game-over-text');
        if (el) el.classList.remove('hidden');
        if (textEl) textEl.textContent = '💰 资金用尽，游戏结束。可在本页调整初始资金后点击重新开始。';
        document.querySelectorAll('.buy-btn').forEach(b => b.disabled = true);
        const refreshBtn = document.getElementById('refresh-shop-btn');
        if (refreshBtn) refreshBtn.disabled = true;
    }

    getShopGridSize() {
        const el = document.getElementById('shop-grid-size');
        const v = el ? parseInt(el.value, 10) : 12;
        return Math.min(24, Math.max(4, isNaN(v) ? 12 : v));
    }

    generateShopItems() {
        const availableElements = this.getAvailableElements();
        if (availableElements.length === 0) {
            this.showToast('没有可用元素，请选择词库');
            return;
        }

        const gridSize = this.getShopGridSize();
        this.shopState.shopItems = [];

        for (let i = 0; i < gridSize; i++) {
            const eventType = this.shopRollEventType();
            if (eventType === 'normal') {
                const element = availableElements[Math.floor(Math.random() * availableElements.length)];
                const basePrice = Math.floor(Math.random() * 19 + 1) * 10; // 10-190
                this.shopState.shopItems.push({
                    type: 'product',
                    id: this.generateId(),
                    element: element,
                    price: basePrice,
                    actualValue: this.calculateActualValue(basePrice),
                    purchased: false
                });
            } else {
                this.shopState.shopItems.push({
                    type: 'event',
                    eventType: eventType,
                    triggered: false
                });
            }
        }

        this.renderShopItems();
        this.shopUpdateRefreshHint();
    }

    calculateActualValue(basePrice) {
        const rand = Math.random();
        
        if (rand < 0.05) { // 5% 概率价值为0
            return 0;
        } else if (rand < 0.25) { // 20% 概率亏损 (-50% 到 -10%)
            const lossPercent = Math.random() * 0.4 + 0.1; // 0.1 到 0.5
            return Math.floor(basePrice * (1 - lossPercent) / 10) * 10;
        } else if (rand < 0.75) { // 50% 概率小幅波动 (-10% 到 +50%)
            const changePercent = (Math.random() - 0.5) * 0.6; // -0.3 到 0.3
            return Math.floor(basePrice * (1 + changePercent) / 10) * 10;
        } else { // 25% 概率大幅增值 (+50% 到 +1000%)
            const gainPercent = Math.random() * 9.5 + 0.5; // 0.5 到 10
            return Math.floor(basePrice * gainPercent / 10) * 10;
        }
    }

    getShopEventLabel(eventType) {
        const labels = {
            discount: '🏷️ 随机打折',
            auction: '🔨 拍卖',
            auction_sell: '📤 挂卖',
            free: '🎁 免费送',
            money: '💰 捡钱',
            scratch: '🎫 刮刮乐',
            blindbox: '📦 盲盒',
            trade: '🔄 以物换物'
        };
        return labels[eventType] || eventType;
    }

    renderShopItems() {
        const shopContainer = document.getElementById('shop-items');
        if (!shopContainer) return;
        shopContainer.innerHTML = '';

        this.shopState.shopItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            if (item.type === 'product') {
                itemElement.className = `shop-item ${item.purchased ? 'purchased' : ''}`;
                itemElement.innerHTML = `
                    <div class="item-name">${item.element.name}</div>
                    <div class="item-price">💰 ${item.price}</div>
                    <button class="buy-btn ${item.purchased ? 'hidden' : ''}" 
                            data-item-id="${item.id}">${item.purchased ? '已购买' : '购买'}</button>`;
                shopContainer.appendChild(itemElement);
                const buyBtn = itemElement.querySelector('.buy-btn');
                if (buyBtn && !buyBtn.classList.contains('hidden')) {
                    buyBtn.addEventListener('click', () => this.buyItem(buyBtn.dataset.itemId));
                }
            } else {
                const triggered = item.triggered === true;
                itemElement.className = `shop-item shop-item-event ${triggered ? 'triggered' : ''}`;
                itemElement.dataset.slotIndex = String(index);
                itemElement.innerHTML = `
                    <div class="item-name shop-event-placeholder">${this.getShopEventLabel(item.eventType)}</div>
                    <div class="item-event-hint">${triggered ? '已使用' : '点击参与'}</div>`;
                shopContainer.appendChild(itemElement);
                if (!triggered) {
                    itemElement.addEventListener('click', () => this.shopTriggerEventSlot(index));
                }
            }
        });
    }

    shopTriggerEventSlot(index) {
        const item = this.shopState.shopItems[index];
        if (!item || item.type !== 'event' || item.triggered) return;
        item.triggered = true;
        this.renderShopItems();
        this.shopOpenEvent(item.eventType);
        this.shopUpdateRefreshHint();
    }

    buyItem(itemId) {
        const item = this.shopState.shopItems.find(i => i.id === itemId);
        if (!item || item.purchased || this.shopState.playerMoney < item.price) return;
        item.purchased = true;
        this.shopState.inventory.push({
            type: 'element',
            element: item.element,
            purchasePrice: item.price,
            actualValue: item.actualValue
        });
        this.updateMoneyDisplay();
        this.renderShopItems();
        this.updateInventoryDisplay();
        this.shopCheckGameOver();
        const profit = item.actualValue - item.price;
        const profitText = profit > 0 ? `+${profit}` : `${profit}`;
        this.showToast(`购买成功！实际价值：${item.actualValue} (${profitText})`, 3000);
    }

    updateInventoryDisplay() {
        const inventoryContainer = document.getElementById('inventory-items');
        if (!inventoryContainer) return;
        if (!this.shopState.inventory || this.shopState.inventory.length === 0) {
            inventoryContainer.innerHTML = '<div class="empty-inventory">收藏架空空如也...</div>';
            const cb = document.getElementById('combine-items-btn');
            const sb = document.getElementById('sell-all-btn');
            if (cb) cb.disabled = true;
            if (sb) sb.disabled = true;
            return;
        }

        inventoryContainer.innerHTML = '';
        this.shopState.inventory.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            const isCombo = item.type === 'combination';
            const name = isCombo
                ? (this.getElementsByIds(item.elementIds || []).map(e => e.name).join(' + ') || '组合')
                : item.element.name;
            const purchasePrice = item.purchasePrice != null ? item.purchasePrice : 0;
            const profit = item.actualValue - purchasePrice;
            const profitText = profit > 0 ? `+${profit}` : `${profit}`;
            const profitClass = profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
            itemEl.innerHTML = `
                <div class="inventory-item-name clickable-inv" data-index="${index}" title="点击查看">${name}</div>
                <div class="inventory-item-value">
                    <span class="actual-value">价值: ${item.actualValue}</span>
                    ${!isCombo ? `<span class="profit ${profitClass}">(${profitText})</span>` : ''}
                </div>
                <button class="sell-btn" data-index="${index}">出售</button>
            `;
            inventoryContainer.appendChild(itemEl);
            itemEl.querySelector('.clickable-inv').addEventListener('click', () => {
                if (isCombo) this.showEditCombinationModal(null, item.elementIds || [], false);
                else this.showElementModalById(item.element.id);
            });
            itemEl.querySelector('.sell-btn').addEventListener('click', () => this.sellItem(index));
        });

        const cb = document.getElementById('combine-items-btn');
        const sb = document.getElementById('sell-all-btn');
        if (cb) cb.disabled = this.shopState.inventory.length < 2;
        if (sb) sb.disabled = false;
    }

    sellItem(index) {
        const item = this.shopState.inventory && this.shopState.inventory[index];
        if (!item) return;
        this.shopState.playerMoney += item.actualValue;
        this.shopState.inventory.splice(index, 1);
        this.updateMoneyDisplay();
        this.updateInventoryDisplay();
        this.showToast('已出售，获得 ' + item.actualValue + ' 金币');
    }

    sellAllItems() {
        if (!this.shopState.inventory || this.shopState.inventory.length === 0) return;
        let totalEarned = 0;
        let totalCost = 0;
        this.shopState.inventory.forEach(item => {
            totalEarned += item.actualValue;
            totalCost += (item.purchasePrice != null ? item.purchasePrice : 0);
        });
        this.shopState.playerMoney += totalEarned;
        this.shopState.inventory = [];
        this.updateMoneyDisplay();
        this.updateInventoryDisplay();
        const profit = totalEarned - totalCost;
        const profitText = profit > 0 ? `净赚${profit}` : profit < 0 ? `净亏${Math.abs(profit)}` : '不赚不亏';
        this.showToast(`全部出售完成！${profitText}`);
    }

    combineInventoryItems() {
        if (!this.shopState.inventory || this.shopState.inventory.length < 2) return;
        const items = this.shopState.inventory.map((it, i) => ({
            index: i,
            name: it.type === 'combination'
                ? this.getElementsByIds(it.elementIds || []).map(e => e.name).join(' + ') || '组合'
                : it.element.name,
            value: it.actualValue,
            elementIds: it.type === 'combination' ? (it.elementIds || []) : [it.element.id]
        }));
        const listHtml = items.map((it, i) =>
            `<label class="shop-combine-option"><input type="checkbox" class="shop-combine-cb" data-index="${i}"> ${it.name}（价值${it.value}）</label>`
        ).join('');
        const content = `
            <p>选择要合成的收藏架物品（至少 2 项）：</p>
            <div class="shop-combine-list">${listHtml}</div>
            <p class="mt-2">组合方式：</p>
            <div class="shop-combine-type">
                <button type="button" class="btn btn-secondary" id="shop-combine-stable">稳定组合（价值波动小）</button>
                <button type="button" class="btn btn-warning" id="shop-combine-alchemy">炼金组合（可能大赚或大亏）</button>
            </div>
        `;
        const modal = this.createModal('组合元素', content, [{ text: '取消', class: 'btn-secondary', action: () => this.closeModal() }]);
        const doCombine = (stable) => {
            const checked = Array.from(modal.querySelectorAll('.shop-combine-cb:checked')).map(cb => parseInt(cb.dataset.index, 10));
            if (checked.length < 2) {
                this.showToast('请至少选择 2 项');
                return;
            }
            let totalValue = 0;
            const allElementIds = [];
            const toRemove = new Set(checked.sort((a, b) => b - a));
            checked.forEach(idx => {
                const it = this.shopState.inventory[idx];
                if (!it) return;
                totalValue += it.actualValue;
                if (it.type === 'combination') (it.elementIds || []).forEach(id => allElementIds.push(id));
                else allElementIds.push(it.element.id);
            });
            const mult = stable ? (0.9 + Math.random() * 0.2) : (0.2 + Math.random() * 2.3);
            const combinedValue = Math.max(0, Math.floor(totalValue * mult / 10) * 10);
            checked.sort((a, b) => b - a).forEach(idx => this.shopState.inventory.splice(idx, 1));
            this.shopState.inventory.push({
                type: 'combination',
                elementIds: allElementIds,
                actualValue: combinedValue,
                purchasePrice: 0
            });
            this.updateMoneyDisplay();
            this.updateInventoryDisplay();
            this.closeModal();
            this.showToast(stable ? `稳定组合完成，价值：${combinedValue}` : `炼金组合完成，价值：${combinedValue}`);
        };
        modal.querySelector('#shop-combine-stable').addEventListener('click', () => doCombine(true));
        modal.querySelector('#shop-combine-alchemy').addEventListener('click', () => doCombine(false));
    }

    displayCombinationResult(elements, combinedValue, originalValue) {
        const difference = combinedValue - originalValue;
        const diffText = difference > 0 ? `额外获得${difference}` : difference < 0 ? `损失了${Math.abs(difference)}` : '价值不变';
        
        const modal = this.createModal('组合完成', `
            <div class="combination-result">
                <h4>🎉 元素组合成功！</h4>
                <div class="combined-elements">
                    ${elements.map(e => `<span class="combined-element">${e.name}</span>`).join(' + ')}
                </div>
                <div class="combination-value">
                    <p>原始价值：${originalValue}</p>
                    <p>组合价值：${combinedValue}</p>
                    <p class="${difference >= 0 ? 'profit' : 'loss'}">${diffText}</p>
                </div>
            </div>
        `, [
            { text: '确定', class: 'btn-primary', action: () => this.closeModal() }
        ]);
    }

    renderPlaceholder(toolName) {
        const generationArea = document.getElementById('generation-area');
        generationArea.innerHTML = `
            <div class="tool-content">
                <h3>${toolName}</h3>
                <p>功能开发中，敬请期待...</p>
            </div>
        `;
    }

    // 编辑词库：系统词库仅恢复+常见勾选不可查看；用户词库为列表+Enter搜索+多选复制移动。引用/查找一律用 bindingId；独立 id 仅导入合并时用
    editLibrary(libraryId) {
        const library = this.getLibraryById(libraryId);
        if (!library) return;

        if (library.isSystem) {
            this.createModal(`编辑词库 - ${library.name}`, `
                <div class="form-group">
                    <label>词库名称：</label>
                    <input type="text" class="form-control" value="${library.name}" readonly>
                </div>
                <p class="text-muted">系统元素条目过多，为防止卡死，不支持在此查看或搜索。可以在生成结果中进行编辑修改标签。</p>
            `, [
                { text: '恢复默认', class: 'btn-primary', action: () => this.resetSystemLibrary(libraryId) },
                { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
            ]);
            return;
        }

        const initialElementIds = [...(library.elementIds || [])];
        let currentElementIds = [...initialElementIds];
        const pendingCopies = [];
        const pendingMoves = [];
        const pendingFavorites = [];
        const pendingBlacklist = [];

        const tryClose = () => {
            const nameEl = document.getElementById('edit-library-name');
            const nameChanged = nameEl && nameEl.value.trim() !== library.name;
            const same = currentElementIds.length === initialElementIds.length && currentElementIds.every((id, i) => id === initialElementIds[i]);
            if (!same || nameChanged || pendingCopies.length || pendingMoves.length || pendingFavorites.length || pendingBlacklist.length) {
                this.showConfirmModal('有未保存的修改，确定取消吗？', () => this.closeModal());
            } else {
                this.closeModal();
            }
        };
        const isEmojiLib = library.bindingId === EMOJI_LIBRARY_ID;
        const emojiOptionsHtml = isEmojiLib ? `
            <div class="form-group emoji-edit-options">
                <label class="checkbox-label"><input type="checkbox" id="edit-lib-emoji-phobia" ${(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly) ? 'checked' : ''}> 我有恐虫症，但我不恐蝴蝶</label>
                <div class="emoji-filter-in-edit">
                    <button type="button" id="edit-lib-emoji-cat-toggle" class="btn-emoji-filter-toggle">▸ 分类筛选</button>
                    <div id="edit-lib-emoji-cat-wrap" class="emoji-category-filter-wrap hidden">
                        <div class="emoji-category-actions">
                            <button type="button" id="edit-lib-emoji-toggle-all" class="btn btn-sm">全选</button>
                            <button type="button" id="edit-lib-emoji-apply-filter" class="btn btn-sm btn-primary">应用筛选</button>
                        </div>
                        <div id="edit-lib-emoji-cat-tree" class="emoji-category-tree"></div>
                    </div>
                </div>
            </div>
        ` : '';
        const modal = this.createModal(`编辑词库 - ${library.name}`, `
            <div class="form-group">
                <label>词库名称：</label>
                <input type="text" id="edit-library-name" class="form-control" value="${library.name}" ${library.isSystem ? 'readonly' : ''}>
            </div>
            ${emojiOptionsHtml}
            <div class="form-group search-row">
                <label>搜索：</label>
                <div class="search-input-wrap">
                    <input type="text" id="search-elements" class="form-control" placeholder="输入关键词">
                    <button type="button" id="search-elements-btn" class="btn btn-primary">搜索</button>
                </div>
            </div>
            <div class="form-group library-sort-row">
                <label class="library-sort-label">排序</label>
                <select id="library-sort-select" class="library-sort-select">
                    <option value="default">默认</option>
                    <option value="asc">升序</option>
                    <option value="desc">降序</option>
                </select>
            </div>
            <div class="form-group library-filter-checkboxes">
                <label><input type="radio" name="lib-filter" id="show-all-in-lib" value="all" checked> 全部</label>
                <label><input type="radio" name="lib-filter" id="show-favorited-in-lib" value="favorited"> 只显示已收藏</label>
                <label><input type="radio" name="lib-filter" id="show-blacklisted-in-lib" value="blacklisted"> 只显示已拉黑</label>
            </div>
            <div class="form-group library-bulk-actions library-bulk-actions-inline">
                <button type="button" id="toggle-select-mode" class="btn btn-secondary">选择</button>
                <span id="library-bulk-actions" style="display: none;">
                    <button type="button" id="select-all-entries" class="btn btn-secondary">全选</button>
                    <button type="button" id="copy-selected-to-lib" class="btn btn-secondary">复制到</button>
                    <button type="button" id="move-selected-to-lib" class="btn btn-secondary">移动到</button>
                    <button type="button" id="favorite-selected-to-group" class="btn btn-secondary">收藏到</button>
                    <button type="button" id="blacklist-selected" class="btn btn-secondary btn-danger">拉黑</button>
                    <button type="button" id="delete-selected-entries" class="btn btn-secondary btn-danger">删除</button>
                </span>
            </div>
            <div class="form-group">
                <div id="library-entries-list" class="library-entries-list"></div>
            </div>
        `, isEmojiLib ? [
            { text: '保存', class: 'btn-primary', action: () => this.applyLibraryEditAndSave(libraryId, library, currentElementIds, pendingCopies, pendingMoves, pendingFavorites, pendingBlacklist, () => { this.renderSidebar(); this.closeModal(); }) },
            { text: '恢复默认', class: 'btn-secondary', action: () => {
                this.showConfirmModal('确定恢复？之前从词库删除的 emoji 会重新出现，当前筛选与拉黑状态不变。', () => {
                    this.userData.emojiOverrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
                    this.userData.emojiOverrides.deletedChars = [];
                    this.saveUserData();
                    this._rebuildEmojiLibraryFromOverrides();
                    this.closeModal();
                    this.renderSidebar();
                    this.renderLibrarySelector();
                    this.showToast('已恢复：之前删除的 emoji 已加回词库');
                });
            }},
            { text: '取消', class: 'btn-secondary', action: tryClose }
        ] : [
            { text: '保存', class: 'btn-primary', action: () => this.applyLibraryEditAndSave(libraryId, library, currentElementIds, pendingCopies, pendingMoves, pendingFavorites, pendingBlacklist, () => { this.renderSidebar(); this.closeModal(); }) },
            { text: '取消', class: 'btn-secondary', action: tryClose }
        ], null, tryClose);

        let onEmojiFilterChange = () => {};
        if (isEmojiLib) {
            const phobiaCb = modal.querySelector('#edit-lib-emoji-phobia');
            if (phobiaCb) phobiaCb.onchange = () => {
                this.userData.settings.hideInsectsExceptButterfly = !!phobiaCb.checked;
                this.saveUserData();
                onEmojiFilterChange();
            };
            const wrap = modal.querySelector('#edit-lib-emoji-cat-wrap');
            const toggleBtn = modal.querySelector('#edit-lib-emoji-cat-toggle');
            if (toggleBtn && wrap) toggleBtn.onclick = () => {
                const open = wrap.classList.contains('hidden');
                wrap.classList.toggle('hidden', !open);
                toggleBtn.textContent = open ? '▾ 收起分类' : '▸ 分类筛选';
            };
            const selectedIds = () => this.userData.settings.emojiSelectedCategoryIds || [];
            const setSelectedIds = (arr) => { this.userData.settings.emojiSelectedCategoryIds = arr; this.saveUserData(); };
            const maps = _emojiCategoryMaps();
            const collectDescendantIdsEdit = (pid) => {
                const out = [pid];
                (maps.parentToChildren[pid] || []).forEach(cid => { out.push(...collectDescendantIdsEdit(cid)); });
                return out;
            };
            const treeEl = modal.querySelector('#edit-lib-emoji-cat-tree');
            const allCategoryIdsEdit = getAllEmojiCategoryIds();
            const isAllCategoriesSelectedEdit = () => {
                const leafSet = new Set();
                selectedIds().forEach(id => { (maps.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
                return maps.leaves.length > 0 && maps.leaves.every(lid => leafSet.has(lid));
            };
            const toggleAllBtnEdit = modal.querySelector('#edit-lib-emoji-toggle-all');
            const updateToggleAllBtnEdit = () => { if (toggleAllBtnEdit) toggleAllBtnEdit.textContent = isAllCategoriesSelectedEdit() ? '取消全选' : '全选'; };
            let refreshTree = () => {};
            if (treeEl) {
                const renderTree = (nodes, depth = 0) => {
                    const leafSet = new Set();
                    selectedIds().forEach(id => { (maps.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
                    let html = '';
                    nodes.forEach(n => {
                        const hasChildren = n.children && n.children.length > 0;
                        const leaves = maps.nodeToLeafIds[n.id] || [n.id];
                        const checked = hasChildren ? leaves.every(lid => leafSet.has(lid)) : leafSet.has(n.id);
                        const someChildrenChecked = hasChildren && leaves.some(lid => leafSet.has(lid));
                        const indeterminate = hasChildren && someChildrenChecked && !checked;
                        const indent = depth ? ` style="margin-left: ${depth * 1.2}em"` : '';
                        if (hasChildren) {
                            html += `<div class="emoji-cat-group" data-id="${n.id}"><div class="emoji-cat-parent-row"><span class="emoji-cat-fold" title="收起/展开">▾</span><label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-cat-cb" data-id="${n.id}" data-has-children="true" ${checked ? 'checked' : ''} ${indeterminate ? 'data-indeterminate="true"' : ''}> ${n.label}</label></div><div class="emoji-cat-children">${renderTree(n.children, depth + 1)}</div></div>`;
                        } else {
                            html += `<label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-cat-cb" data-id="${n.id}" data-has-children="false" ${checked ? 'checked' : ''}> ${n.label}</label>`;
                        }
                    });
                    return html;
                };
                refreshTree = () => {
                    treeEl.innerHTML = renderTree(EMOJI_CATEGORY_TREE);
                    treeEl.querySelectorAll('.emoji-cat-fold').forEach(fold => {
                        fold.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const g = fold.closest('.emoji-cat-group'); if (g) g.classList.toggle('emoji-cat-group-collapsed'); fold.textContent = g.classList.contains('emoji-cat-group-collapsed') ? '▸' : '▾'; });
                    });
                    treeEl.querySelectorAll('.emoji-cat-cb').forEach(cb => {
                        cb.onchange = () => {
                            const id = cb.dataset.id;
                            const hasChildren = cb.dataset.hasChildren === 'true';
                            let arr = selectedIds().slice();
                            if (cb.checked) {
                                if (hasChildren) collectDescendantIdsEdit(id).forEach(x => { if (!arr.includes(x)) arr.push(x); });
                                else { if (!arr.includes(id)) arr.push(id); }
                            } else {
                                if (hasChildren && maps.parentToChildren[id]) {
                                    const toRemove = new Set(collectDescendantIdsEdit(id));
                                    arr = arr.filter(x => !toRemove.has(x));
                                } else {
                                    const toRemove = new Set([id]);
                                    let pid = maps.childToParent[id];
                                    while (pid) { toRemove.add(pid); pid = maps.childToParent[pid]; }
                                    arr = arr.filter(x => !toRemove.has(x));
                                }
                            }
                            setSelectedIds(arr);
                            refreshTree();
                            updateToggleAllBtnEdit();
                        };
                    });
                    treeEl.querySelectorAll('.emoji-cat-cb[data-indeterminate="true"]').forEach(cb => { cb.indeterminate = true; });
                    updateToggleAllBtnEdit();
                };
                refreshTree();
            }
            toggleAllBtnEdit?.addEventListener('click', () => {
                if (isAllCategoriesSelectedEdit()) setSelectedIds([]);
                else setSelectedIds([...allCategoryIdsEdit]);
                refreshTree();
                updateToggleAllBtnEdit();
            });
            modal.querySelector('#edit-lib-emoji-apply-filter')?.addEventListener('click', () => {
                // 应用筛选 = 按当前树里已勾选的分类过滤；全不选时保持为空，不自动全选
                const checkedIds = [];
                treeEl.querySelectorAll('.emoji-cat-cb:checked').forEach(cb => { checkedIds.push(cb.dataset.id); });
                setSelectedIds(checkedIds.length > 0 ? checkedIds : []);
                onEmojiFilterChange();
            });
        }

        const searchInput = modal.querySelector('#search-elements');
        const listEl = modal.querySelector('#library-entries-list');
        const toggleSelectBtn = modal.querySelector('#toggle-select-mode');
        const sortSelect = modal.querySelector('#library-sort-select');
        if (!library.sortOrder) library.sortOrder = 'default';
        if (sortSelect) {
            sortSelect.value = library.sortOrder === 'asc' ? 'asc' : library.sortOrder === 'desc' ? 'desc' : 'default';
            sortSelect.addEventListener('change', () => {
                library.sortOrder = sortSelect.value || 'default';
                this.saveUserData();
                renderList();
            });
        }
        let currentSearch = '';
        let selectMode = false;
        const selectedIds = new Set();
        const bulkActions = modal.querySelector('#library-bulk-actions');

        const selectAllBtn = modal.querySelector('#select-all-entries');
        const updateBulkVisibility = () => {
            bulkActions.style.display = selectMode ? 'inline-flex' : 'none';
        };
        const updateSelectAllButtonText = () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length > 0 && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        };

        const renderList = () => {
            let baseElements;
            if (isEmojiLib) {
                // 用本地 currentElementIds，删除/移走后立即刷新列表显示，保存后才持久化
                const fullIds = currentElementIds;
                baseElements = this.getElementsByIds(fullIds);
                if (this.userData.settings && this.userData.settings.hideInsectsExceptButterfly) {
                    baseElements = baseElements.filter(e => !isInsectExceptButterfly(e.name));
                }
                const catIds = Array.isArray(this.userData.settings.emojiSelectedCategoryIds) ? this.userData.settings.emojiSelectedCategoryIds : [];
                if (catIds.length > 0) {
                    const leafSet = expandEmojiCategorySelectedToLeafIds(catIds);
                    if (leafSet && leafSet.size > 0) baseElements = baseElements.filter(e => leafSet.has(getEmojiCategoryForEmojiChar(e.name) || ''));
                }
                if (library.sortOrder === 'asc') baseElements = [...baseElements].sort((a, b) => { const nameA = (a || {}).name || ''; const nameB = (b || {}).name || ''; const cmp = this._naturalCompare(nameA, nameB, false); return cmp !== 0 ? cmp : this._naturalCompare(String(a.id), String(b.id), false); });
                else if (library.sortOrder === 'desc') baseElements = [...baseElements].sort((a, b) => { const nameA = (a || {}).name || ''; const nameB = (b || {}).name || ''; const cmp = this._naturalCompare(nameA, nameB, true); return cmp !== 0 ? cmp : this._naturalCompare(String(a.id), String(b.id), true); });
            } else {
                let ids = currentElementIds;
                if (library.sortOrder === 'asc') {
                    ids = [...ids].sort((a, b) => {
                        const nameA = (this.getElementById(a) || {}).name || '';
                        const nameB = (this.getElementById(b) || {}).name || '';
                        const cmp = this._naturalCompare(nameA, nameB, false);
                        return cmp !== 0 ? cmp : this._naturalCompare(String(a), String(b), false);
                    });
                } else if (library.sortOrder === 'desc') {
                    ids = [...ids].sort((a, b) => {
                        const nameA = (this.getElementById(a) || {}).name || '';
                        const nameB = (this.getElementById(b) || {}).name || '';
                        const cmp = this._naturalCompare(nameA, nameB, true);
                        return cmp !== 0 ? cmp : this._naturalCompare(String(a), String(b), true);
                    });
                }
                baseElements = this.getElementsByIds(ids);
            }
            const filterVal = modal.querySelector('input[name="lib-filter"]:checked');
            const filter = filterVal ? filterVal.value : 'all';
            if (filter === 'favorited') baseElements = baseElements.filter(e => this.isElementFavorited(e));
            else if (filter === 'blacklisted') baseElements = baseElements.filter(e => e.isBlacklisted);
            const filtered = !currentSearch.trim() ? baseElements : baseElements.filter(e => e.name.toLowerCase().includes(currentSearch.toLowerCase()));
            listEl.innerHTML = '';
            filtered.forEach(el => {
                const wrap = document.createElement('div');
                wrap.className = 'library-entry-row';
                const chip = document.createElement('span');
                chip.className = 'entry-chip' + (selectedIds.has(el.id) ? ' entry-chip-selected' : '');
                chip.dataset.id = el.id;
                chip.textContent = el.name;
                chip.addEventListener('click', () => {
                    if (selectMode) {
                        if (selectedIds.has(el.id)) selectedIds.delete(el.id);
                        else selectedIds.add(el.id);
                        chip.classList.toggle('entry-chip-selected', selectedIds.has(el.id));
                        updateBulkVisibility();
                        updateSelectAllButtonText();
                    } else {
                        this.showElementModalById(el.id);
                    }
                });
                wrap.appendChild(chip);
                listEl.appendChild(wrap);
            });
            updateBulkVisibility();
            updateSelectAllButtonText();
        };

        modal.querySelectorAll('input[name="lib-filter"]').forEach(radio => radio.addEventListener('change', renderList));

        toggleSelectBtn.addEventListener('click', () => {
            selectMode = !selectMode;
            toggleSelectBtn.textContent = selectMode ? '取消选择' : '选择';
            if (!selectMode) {
                selectedIds.clear();
            }
            renderList();
        });

        const doSearch = () => { currentSearch = searchInput.value; renderList(); };
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
        modal.querySelector('#search-elements-btn').addEventListener('click', doSearch);
        if (isEmojiLib) onEmojiFilterChange = () => renderList();
        renderList();
        // 筛选不自动应用，仅点击「应用筛选」时刷新列表

        selectAllBtn.addEventListener('click', () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            chips.forEach(c => {
                const id = c.dataset.id;
                if (allSelected) selectedIds.delete(id);
                else selectedIds.add(id);
                c.classList.toggle('entry-chip-selected', selectedIds.has(id));
            });
            updateBulkVisibility();
            updateSelectAllButtonText();
        });
        modal.querySelector('#copy-selected-to-lib').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showCopyOrMoveModal(checked, libraryId, false, (targetIds) => {
                pendingCopies.push({ targetIds, elementIds: checked });
                selectedIds.clear();
                renderList();
            }, true);
        });
        modal.querySelector('#move-selected-to-lib').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showCopyOrMoveModal(checked, libraryId, true, (targetIds) => {
                pendingMoves.push({ targetIds, elementIds: checked });
                checked.forEach(eid => {
                    const idx = currentElementIds.indexOf(eid);
                    if (idx !== -1) currentElementIds.splice(idx, 1);
                });
                selectedIds.clear();
                renderList();
            }, true);
        });
        modal.querySelector('#favorite-selected-to-group').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showAddToElementGroupsModal(checked, (targetIds) => {
                pendingFavorites.push({ targetIds, elementIds: checked });
                selectedIds.clear();
                renderList();
                this.showToast('已加入待办，保存后生效');
            }, true);
        });
        modal.querySelector('#blacklist-selected').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            checked.forEach(eid => pendingBlacklist.push(eid));
            selectedIds.clear();
            renderList();
            this.showToast('已加入待办，保存后生效');
        });
        modal.querySelector('#delete-selected-entries').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showConfirmModal(`确定从本词库移除已选 ${checked.length} 个元素？（保存后生效）`, () => {
                checked.forEach(eid => {
                    selectedIds.delete(eid);
                    const idx = currentElementIds.indexOf(eid);
                    if (idx !== -1) currentElementIds.splice(idx, 1);
                });
                renderList();
            });
        });
    }

    applyLibraryEditAndSave(libraryId, library, currentElementIds, pendingCopies, pendingMoves, pendingFavorites, pendingBlacklist, onDone) {
        const newName = document.getElementById('edit-library-name') && document.getElementById('edit-library-name').value.trim();
        if (!newName) { this.showToast('请输入词库名称'); return; }
        let finalName = newName;
        let counter = 1;
        while (this.userData.libraries.find(lib => lib.name === finalName && lib.bindingId !== library.bindingId)) { finalName = `${newName}(${counter})`; counter++; }
        library.name = finalName;
        const oldElementIds = library.elementIds || [];
        library.elementIds = [...currentElementIds];
        if (library.bindingId === EMOJI_LIBRARY_ID) {
            this.userData.emojiOverrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
            oldElementIds.forEach(eid => {
                if (currentElementIds.includes(eid)) return;
                const el = this.getElementById(eid);
                if (el && el.name && !this.userData.emojiOverrides.deletedChars.includes(el.name))
                    this.userData.emojiOverrides.deletedChars.push(el.name);
            });
        }
        this.userData.elements.forEach(el => {
            if (el.libraryIds && el.libraryIds.includes(library.bindingId) && !currentElementIds.includes(el.id)) {
                el.libraryIds = el.libraryIds.filter(id => id !== library.bindingId);
            }
        });
        // 编辑保存后只更换独立 id（仅系统词库不改），绑定 id 不变；Emoji 词库若被改也会变独立 id
        if (!library.isSystem) library.id = this.generateId();
        const currentLibId = library.bindingId;
        pendingCopies.forEach(({ targetIds, elementIds }) => {
            targetIds.forEach(libId => {
                const lib = this.getLibraryById(libId);
                if (!lib) return;
                lib.elementIds = lib.elementIds || [];
                elementIds.forEach(eid => {
                    if (!lib.elementIds.includes(eid)) lib.elementIds.push(eid);
                    const el = this.getElementById(eid);
                    if (el && !el.libraryIds.includes(libId)) el.libraryIds.push(libId);
                });
            });
        });
        pendingMoves.forEach(({ targetIds, elementIds }) => {
            elementIds.forEach(eid => {
                const el = this.getElementById(eid);
                if (el) el.libraryIds = (el.libraryIds || []).filter(id => id !== currentLibId);
            });
            targetIds.forEach(libId => {
                const lib = this.getLibraryById(libId);
                if (!lib) return;
                lib.elementIds = lib.elementIds || [];
                elementIds.forEach(eid => {
                    if (!lib.elementIds.includes(eid)) lib.elementIds.push(eid);
                    const el = this.getElementById(eid);
                    if (el && !el.libraryIds.includes(libId)) el.libraryIds.push(libId);
                });
            });
        });
        (pendingFavorites || []).forEach(({ targetIds, elementIds }) => {
            targetIds.forEach(gid => {
                const g = this.getElementGroupById(gid);
                if (!g) return;
                g.elementIds = g.elementIds || [];
                elementIds.forEach(eid => {
                    if (!g.elementIds.includes(eid)) g.elementIds.push(eid);
                    const el = this.getElementById(eid);
                    if (el) {
                        if (!el.elementGroupIds) el.elementGroupIds = [];
                        if (!el.elementGroupIds.includes(gid)) el.elementGroupIds.push(gid);
                    }
                });
            });
        });
        const arr = this.userData.blacklistedElementIds || [];
        (pendingBlacklist || []).forEach(eid => {
            const el = this.getElementById(eid);
            if (el && !el.isBlacklisted) {
                el.isBlacklisted = true;
                if (!arr.includes(eid)) arr.push(eid);
            }
        });
        this.userData.blacklistedElementIds = arr;
        this.saveUserData();
        if (onDone) onDone();
        this.showToast(`词库"${finalName}"已保存`);
    }

    showCopyOrMoveModal(elementIds, fromLibraryId, isMove, onDone, deferApply) {
        const libs = this.userData.libraries.filter(l => !l.isSystem && l.bindingId !== fromLibraryId && l.bindingId !== DOUBLEBLIND_LIBRARY_ID);
        if (!libs.length) { this.showToast('没有其他词库可选'); return; }
        const content = `<p>选择目标词库：</p><div class="checkbox-list">${libs.map(l => `<label><input type="checkbox" class="copy-target-cb" value="${l.bindingId}"> ${l.name}</label>`).join('')}</div>`;
        const modal = this.createModal(isMove ? '移动到词库' : '复制到词库', content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const targetIds = Array.from(document.querySelectorAll('.copy-target-cb:checked')).map(cb => cb.value);
                if (!targetIds.length) { this.showToast('请选择目标词库'); return; }
                if (deferApply) {
                    this.closeModal();
                    if (onDone) onDone(targetIds);
                    return;
                }
                const fromLib = this.getLibraryById(fromLibraryId);
                targetIds.forEach(libId => {
                    const lib = this.getLibraryById(libId);
                    if (!lib) return;
                    lib.elementIds = lib.elementIds || [];
                    elementIds.forEach(eid => {
                        if (!lib.elementIds.includes(eid)) lib.elementIds.push(eid);
                        const el = this.getElementById(eid);
                        if (el && !el.libraryIds.includes(libId)) el.libraryIds.push(libId);
                    });
                });
                if (isMove && fromLib) {
                    elementIds.forEach(eid => {
                        fromLib.elementIds = (fromLib.elementIds || []).filter(id => id !== eid);
                        const el = this.getElementById(eid);
                        if (el) el.libraryIds = (el.libraryIds || []).filter(id => id !== fromLibraryId);
                    });
                }
                this.saveUserData();
                this.renderSidebar();
                this.closeModal();
                if (onDone) onDone();
                this.showToast(isMove ? '已移动' : '已复制');
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    // 选择目标词语组（复制/移动元素到其他词语组）
    showCopyOrMoveToElementGroupModal(elementIds, fromGroupId, isMove, onDone) {
        const otherGroups = (this.userData.elementGroups || []).filter(g => g.bindingId !== fromGroupId);
        if (!otherGroups.length) { this.showToast('没有其他元素分组可选'); return; }
        const content = `<p>选择目标元素分组：</p><div class="checkbox-list">${otherGroups.map(g => `<label><input type="checkbox" class="copy-target-eg-cb" value="${g.bindingId}"> ${g.name}</label>`).join('')}</div>`;
        this.createModal(isMove ? '移动到元素分组' : '复制到元素分组', content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const targetIds = Array.from(document.querySelectorAll('.copy-target-eg-cb:checked')).map(cb => cb.value);
                if (!targetIds.length) { this.showToast('请选择目标元素分组'); return; }
                this.closeModal();
                if (onDone) onDone(targetIds);
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    // 批量收藏：选择分组，将选中元素加入这些分组。deferApply 为 true 时不立即写入，仅回调 targetIds 供调用方保存时生效
    showAddToElementGroupsModal(elementIds, onDone, deferApply = false) {
        const groups = this.userData.elementGroups || [];
        if (!groups.length) { this.showToast('暂无分组，请先新建元素分组'); return; }
        const content = `<p>选择要加入的分组（可多选）：</p><div class="checkbox-list">${groups.map(g => `<label><input type="checkbox" class="add-to-eg-cb" value="${g.bindingId}"> ${g.name}</label>`).join('')}</div>`;
        this.createModal('收藏到分组', content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const targetIds = Array.from(document.querySelectorAll('.add-to-eg-cb:checked')).map(cb => cb.value);
                if (!targetIds.length) { this.showToast('请选择至少一个分组'); return; }
                this.closeModal();
                if (deferApply && onDone) {
                    onDone(targetIds);
                    return;
                }
                targetIds.forEach(gid => {
                    const g = this.getElementGroupById(gid);
                    if (!g) return;
                    g.elementIds = g.elementIds || [];
                    elementIds.forEach(eid => {
                        if (!g.elementIds.includes(eid)) g.elementIds.push(eid);
                        const el = this.getElementById(eid);
                        if (el) {
                            if (!el.elementGroupIds) el.elementGroupIds = [];
                            if (!el.elementGroupIds.includes(gid)) el.elementGroupIds.push(gid);
                        }
                    });
                });
                this.saveUserData();
                if (onDone) onDone();
                this.showToast('已加入所选分组');
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    showCopyToLibraryModal(elementIds, onDone) {
        const libs = this.userData.libraries.filter(l => !l.isSystem && l.bindingId !== DOUBLEBLIND_LIBRARY_ID);
        const content = `<div class="checkbox-list">${libs.map(l => `<label><input type="checkbox" class="copy-lib-cb" value="${l.bindingId}"> ${l.name}</label>`).join('')}</div>`;
        const modal = this.createModal('复制到词库', content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const targetIds = Array.from(document.querySelectorAll('.copy-lib-cb:checked')).map(cb => cb.value);
                targetIds.forEach(libId => {
                    const lib = this.getLibraryById(libId);
                    if (!lib) return;
                    lib.elementIds = lib.elementIds || [];
                    elementIds.forEach(eid => {
                        if (!lib.elementIds.includes(eid)) lib.elementIds.push(eid);
                        const el = this.getElementById(eid);
                        if (el && !el.libraryIds.includes(libId)) el.libraryIds.push(libId);
                    });
                });
                this.saveUserData();
                this.renderSidebar();
                this.closeModal();
                if (onDone) onDone();
                this.showToast('已复制到所选词库');
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    saveLibraryEditFromList(libraryId) {
        const library = this.getLibraryById(libraryId);
        if (!library || library.isSystem) return;
        const newName = document.getElementById('edit-library-name') && document.getElementById('edit-library-name').value.trim();
        if (!newName) { this.showToast('请输入词库名称'); return; }
        let finalName = newName;
        let counter = 1;
        while (this.userData.libraries.find(lib => lib.name === finalName && lib.bindingId !== library.bindingId)) { finalName = `${newName}(${counter})`; counter++; }
        library.name = finalName;
        if (!library.isSystem) library.id = this.generateId();
        this.saveUserData();
        this.closeModal();
        this.renderSidebar();
        this.showToast(`词库"${finalName}"已保存`);
    }

    searchElements(library, query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        if (!query.trim()) {
            resultsContainer.innerHTML = '';
            return;
        }

        const libEls = this.getElementsByIds(library.elementIds || []);
        const matchingElements = libEls.filter(e => 
            e.name.toLowerCase().includes(query.toLowerCase())
        );

        if (matchingElements.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">未找到匹配的元素</div>';
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-results-header">找到 ${matchingElements.length} 个匹配元素：</div>
            <div class="elements-grid">
                ${matchingElements.map(element => `
                    <div class="element-item ${element.isBlacklisted ? 'blacklisted' : ''}" data-element-id="${element.id}">
                        <span class="element-name">${element.name}</span>
                        <div class="element-actions">
                            <button class="btn-sm ${element.isBlacklisted ? 'btn-success' : 'btn-danger'}" 
                                    onclick="window.app.toggleElementBlacklist('${element.id}')">
                                ${element.isBlacklisted ? '恢复' : '拉黑'}
                            </button>
                            ${!library.isSystem ? `<button class="btn-sm btn-danger" onclick="window.app.removeElement('${library.bindingId}', '${element.id}')">删除</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    resetSystemLibrary(libraryId) {
        const library = this.getLibraryById(libraryId);
        if (!library || !library.isSystem) return;

        // 删掉系统词库并重建为默认，避免遍历大量 elementIds 导致卡死
        const systemElementIds = (typeof window.ELEMENTS_DATA !== 'undefined')
            ? window.ELEMENTS_DATA.map((_, idx) => 'sys_' + idx)
            : [];
        const idx = (this.userData.libraries || []).findIndex(l => l.bindingId === libraryId || l.id === libraryId);
        if (idx !== -1) {
            this.userData.libraries[idx] = {
                id: SYSTEM_LIBRARY_ID,
                bindingId: SYSTEM_LIBRARY_ID,
                name: '系统预设词库',
                isSystem: true,
                elementIds: systemElementIds,
                settings: { showCommon: true, showSecondCommon: false, showNegative: false }
            };
        }
        this.userData.systemElementOverrides = {};
        const sysSet = new Set(systemElementIds);
        this.userData.blacklistedElementIds = (this.userData.blacklistedElementIds || []).filter(id => !sysSet.has(id));
        this._invalidateElementMap();
        this.saveUserData();
        this.closeModal();
        this.renderSidebar();
        this.showToast('系统词库已恢复默认设置');
    }

    ensureBlacklistedElementIdsOrder() {
        const ids = this.userData.blacklistedElementIds || [];
        const current = this.userData.elements.filter(e => e.isBlacklisted).map(e => e.id);
        const seen = new Set(ids);
        current.forEach(id => { if (!seen.has(id)) { ids.push(id); seen.add(id); } });
        this.userData.blacklistedElementIds = ids.filter(id => this.getElementById(id) && this.getElementById(id).isBlacklisted);
    }

    toggleElementBlacklist(elementId) {
        const el = this.getElementById(elementId);
        if (!el) return;
        const arr = this.userData.blacklistedElementIds || [];
        if (el.isBlacklisted) {
            el.isBlacklisted = false;
            const idx = arr.indexOf(elementId);
            if (idx !== -1) arr.splice(idx, 1);
        } else {
            el.isBlacklisted = true;
            if (!arr.includes(elementId)) arr.push(elementId);
        }
        this.saveUserData();
        const searchInput = document.getElementById('search-elements');
        if (searchInput) {
            const currentLibrary = this.userData.libraries.find(lib => (lib.elementIds || []).includes(elementId));
            if (currentLibrary) this.searchElements(currentLibrary, searchInput.value);
        }
        this.showToast('元素状态已更新');
    }

    removeElement(libraryId, elementId, onAfterDelete) {
        const library = this.getLibraryById(libraryId);
        if (!library || library.isSystem) return;

        const elementIndex = (library.elementIds || []).indexOf(elementId);
        if (elementIndex === -1) return;

        const el = this.getElementById(elementId);
        const elementName = el ? el.name : elementId;
        this.showConfirmModal(`确定要删除元素"${elementName}"吗？`, () => {
            if (library.bindingId === EMOJI_LIBRARY_ID && el && el.name) {
                const ov = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
                ov.deletedChars = ov.deletedChars || [];
                if (!ov.deletedChars.includes(el.name)) ov.deletedChars.push(el.name);
            }
            library.elementIds.splice(elementIndex, 1);
            if (el) el.libraryIds = (el.libraryIds || []).filter(id => id !== library.bindingId);
            this.saveUserData();
            this.renderSidebar();
            const searchInput = document.getElementById('search-elements');
            if (searchInput) this.searchElements(library, searchInput.value);
            this.showToast(`元素"${elementName}"已删除`);
            if (typeof onAfterDelete === 'function') onAfterDelete();
        });
    }

    // 删除词库
    deleteLibrary(libraryId) {
        const library = this.getLibraryById(libraryId);
        if (!library || library.isSystem) return;
        if (library.bindingId === EMOJI_LIBRARY_ID || library.name === 'Emoji词库') return;
        this.showConfirmModal(`确定要删除词库"${library.name}"吗？`, () => {
            this.userData.libraries = this.userData.libraries.filter(lib => lib.bindingId !== libraryId);
            this.selectedLibraries = this.selectedLibraries.filter(id => id !== libraryId);
            (this.userData.quickSwitchCombos || []).forEach(c => {
                c.libraryIds = (c.libraryIds || []).filter(id => id !== libraryId);
            });
            this.saveUserData();
            this.renderSidebar();
            this.renderLibrarySelector();
            this.showToast('词库已删除');
        });
    }

    // 编辑分组：与元素收藏夹一致——搜索、选择、全选、复制到、移动到、从本组移除
    editGroup(groupId) {
        this.closeModal();
        const group = this.getGroupById(groupId);
        if (!group) return;
        let currentComboIds = [...(group.combinationIds || [])];
        const initialComboIds = [...currentComboIds];
        const tryClose = () => {
            const nameEl = document.getElementById('edit-group-name');
            const nameChanged = nameEl && nameEl.value.trim() !== group.name;
            const same = currentComboIds.length === initialComboIds.length && currentComboIds.every((id, i) => id === initialComboIds[i]);
            if (!same || nameChanged) this.showConfirmModal('有未保存的修改，确定取消吗？', () => this.closeModal());
            else this.closeModal();
        };

        const modal = this.createModal(`编辑元素组合分组 - ${group.name}`, `
            <div class="form-group">
                <label>分组名称：</label>
                <input type="text" id="edit-group-name" class="form-control" value="${group.name}">
            </div>
            <div class="form-group search-row">
                <label>搜索：</label>
                <div class="search-input-wrap">
                    <input type="text" id="search-combos-in-group" class="form-control" placeholder="输入关键词">
                    <button type="button" id="search-combos-in-group-btn" class="btn btn-primary">搜索</button>
                </div>
            </div>
            <div class="form-group library-sort-row">
                <label class="library-sort-label">排序</label>
                <select id="combo-group-sort-select" class="library-sort-select">
                    <option value="default">默认</option>
                    <option value="asc">升序</option>
                    <option value="desc">降序</option>
                </select>
            </div>
            <div class="form-group library-bulk-actions library-bulk-actions-inline">
                <button type="button" id="toggle-select-mode-combo" class="btn btn-secondary">选择</button>
                <span id="library-bulk-actions-combo" style="display: none;">
                    <button type="button" id="select-all-combos" class="btn btn-secondary">全选</button>
                    <button type="button" id="copy-combos-to-group" class="btn btn-secondary">复制到</button>
                    <button type="button" id="move-combos-to-group" class="btn btn-secondary">移动到</button>
                    <button type="button" id="delete-combos-from-group" class="btn btn-secondary btn-danger">从本组移除</button>
                </span>
            </div>
            <div class="form-group">
                <div id="group-combinations-list" class="library-entries-list"></div>
            </div>
        `, [
            { text: '保存', class: 'btn-primary', action: () => {
                const nameEl = document.getElementById('edit-group-name');
                const name = (nameEl && nameEl.value.trim()) || group.name;
                if (!name) { this.showToast('请输入分组名称'); return; }
                group.name = name;
                group.combinationIds = [...currentComboIds];
                this.userData.combinations.forEach(c => {
                    const inGroup = (c.combinationGroupIds || []).includes(groupId);
                    const has = currentComboIds.includes(c.id);
                    if (inGroup && !has) c.combinationGroupIds = (c.combinationGroupIds || []).filter(id => id !== groupId);
                    if (!inGroup && has) { c.combinationGroupIds = c.combinationGroupIds || []; c.combinationGroupIds.push(groupId); }
                });
                this.ensureDefaultFavNamesDistinct();
                group.id = this.generateId();
                this.saveUserData();
                this.closeModal();
                this.renderSidebar();
                this.showToast('已保存');
            }},
            { text: '取消', class: 'btn-secondary', action: tryClose }
        ], null, tryClose);

        const listEl = modal.querySelector('#group-combinations-list');
        const searchInput = modal.querySelector('#search-combos-in-group');
        const toggleSelectBtn = modal.querySelector('#toggle-select-mode-combo');
        const bulkActions = modal.querySelector('#library-bulk-actions-combo');
        const selectAllBtn = modal.querySelector('#select-all-combos');
        const sortSelectCombo = modal.querySelector('#combo-group-sort-select');
        if (!group.sortOrder) group.sortOrder = 'default';
        if (sortSelectCombo) {
            sortSelectCombo.value = group.sortOrder === 'asc' ? 'asc' : group.sortOrder === 'desc' ? 'desc' : 'default';
            sortSelectCombo.addEventListener('change', () => {
                group.sortOrder = sortSelectCombo.value || 'default';
                this.saveUserData();
                renderList();
            });
        }
        let currentSearch = '';
        let selectMode = false;
        const selectedIds = new Set();

        const getComboDisplayName = (c) => this.getElementsByIds(c.elementIds || []).map(e => e.name).join(' + ') || c.id;
        const updateBulkVisibility = () => { bulkActions.style.display = selectMode ? 'inline-flex' : 'none'; };
        const updateSelectAllText = () => {
            const chips = listEl.querySelectorAll('.entry-chip[data-combo-id]');
            const allSelected = chips.length > 0 && Array.from(chips).every(c => selectedIds.has(c.dataset.comboId));
            if (selectAllBtn) selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        };

        const renderList = () => {
            let comboIds = currentComboIds;
            if (group.sortOrder === 'asc' || group.sortOrder === 'desc') {
                const combos = comboIds.map(cid => this.getCombinationById(cid)).filter(Boolean);
                const isDesc = group.sortOrder === 'desc';
                combos.sort((a, b) => {
                    const nameA = getComboDisplayName(a);
                    const nameB = getComboDisplayName(b);
                    const cmp = this._naturalCompare(nameA, nameB, isDesc);
                    return cmp !== 0 ? cmp : this._naturalCompare(String(a.id || ''), String(b.id || ''), isDesc);
                });
                comboIds = combos.map(c => c.id);
            }
            const combos = comboIds.map(cid => this.getCombinationById(cid)).filter(Boolean);
            const filtered = !currentSearch.trim() ? combos : combos.filter(c => {
                const names = this.getElementsByIds(c.elementIds || []).map(e => e.name).join(' ').toLowerCase();
                return names.includes(currentSearch.toLowerCase());
            });
            listEl.innerHTML = '';
            filtered.forEach(c => {
                const wrap = document.createElement('div');
                wrap.className = 'library-entry-row';
                const chip = document.createElement('span');
                chip.className = 'entry-chip' + (selectedIds.has(c.id) ? ' entry-chip-selected' : '');
                chip.dataset.comboId = c.id;
                chip.textContent = this.getElementsByIds(c.elementIds || []).map(e => e.name).join(' + ') || c.id;
                chip.addEventListener('click', () => {
                    if (selectMode) {
                        if (selectedIds.has(c.id)) selectedIds.delete(c.id);
                        else selectedIds.add(c.id);
                        chip.classList.toggle('entry-chip-selected', selectedIds.has(c.id));
                        updateBulkVisibility();
                        updateSelectAllText();
                    } else {
                        this.showEditCombinationModal(c.id, c.elementIds || [], false, null, () => renderList());
                    }
                });
                wrap.appendChild(chip);
                listEl.appendChild(wrap);
            });
            updateBulkVisibility();
            updateSelectAllText();
        };

        toggleSelectBtn.addEventListener('click', () => {
            selectMode = !selectMode;
            toggleSelectBtn.textContent = selectMode ? '取消选择' : '选择';
            if (!selectMode) selectedIds.clear();
            renderList();
        });
        const doSearchCombo = () => { currentSearch = searchInput.value; renderList(); };
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearchCombo(); });
        modal.querySelector('#search-combos-in-group-btn').addEventListener('click', doSearchCombo);
        selectAllBtn.addEventListener('click', () => {
            const chips = listEl.querySelectorAll('.entry-chip[data-combo-id]');
            const allSelected = chips.length && Array.from(chips).every(c => selectedIds.has(c.dataset.comboId));
            chips.forEach(c => {
                const id = c.dataset.comboId;
                if (allSelected) selectedIds.delete(id);
                else selectedIds.add(id);
                c.classList.toggle('entry-chip-selected', selectedIds.has(id));
            });
            updateSelectAllText();
        });
        modal.querySelector('#copy-combos-to-group').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击组合选择'); return; }
            this.showCopyOrMoveCombosModal(checked, groupId, false, () => {
                checked.forEach(cid => { selectedIds.delete(cid); });
                renderList();
            });
        });
        modal.querySelector('#move-combos-to-group').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击组合选择'); return; }
            this.showCopyOrMoveCombosModal(checked, groupId, true, () => {
                checked.forEach(cid => {
                    currentComboIds = currentComboIds.filter(id => id !== cid);
                });
                selectedIds.clear();
                renderList();
            }, true);
        });
        modal.querySelector('#delete-combos-from-group').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击组合选择'); return; }
            this.showConfirmModal(`确定从本组移除已选 ${checked.length} 个组合？（保存后生效）`, () => {
                checked.forEach(cid => {
                    selectedIds.delete(cid);
                    currentComboIds = currentComboIds.filter(id => id !== cid);
                });
                selectedIds.clear();
                renderList();
            });
        });
        renderList();
    }

    showCopyOrMoveCombosModal(combinationIds, fromGroupId, isMove, onDone, deferSourceUpdate = false) {
        const groups = this.userData.combinationGroups.filter(g => g.bindingId !== fromGroupId);
        if (!groups.length) { this.showToast('没有其他分组可选'); return; }
        const content = `<p>选择目标分组：</p><div class="checkbox-list">${groups.map(g => `<label><input type="checkbox" class="combo-target-cb" value="${g.bindingId}"> ${g.name}</label>`).join('')}</div>`;
        const modal = this.createModal(isMove ? '移动到分组' : '复制到分组', content, [
            { text: '确定', class: 'btn-primary', action: () => {
                const targetIds = Array.from(document.querySelectorAll('.combo-target-cb:checked')).map(cb => cb.value);
                if (!targetIds.length) { this.showToast('请选择目标分组'); return; }
                const fromGroup = this.getGroupById(fromGroupId);
                targetIds.forEach(gid => {
                    const g = this.getGroupById(gid);
                    if (!g) return;
                    g.combinationIds = g.combinationIds || [];
                    combinationIds.forEach(cid => {
                        if (!g.combinationIds.includes(cid)) g.combinationIds.push(cid);
                        const c = this.getCombinationById(cid);
                        if (c) { c.combinationGroupIds = c.combinationGroupIds || []; if (!c.combinationGroupIds.includes(gid)) c.combinationGroupIds.push(gid); }
                    });
                });
                if (isMove && fromGroup && !deferSourceUpdate) {
                    combinationIds.forEach(cid => {
                        fromGroup.combinationIds = (fromGroup.combinationIds || []).filter(id => id !== cid);
                        const c = this.getCombinationById(cid);
                        if (c) c.combinationGroupIds = (c.combinationGroupIds || []).filter(id => id !== fromGroupId);
                    });
                }
                this.saveUserData();
                this.renderSidebar();
                this.closeModal();
                if (onDone) onDone();
                this.showToast(isMove ? '已移动' : '已复制');
            }},
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    // 删除元素组合的组
    deleteGroup(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return;
        this.showConfirmModal(`确定要删除元素组合分组"${group.name}"吗？`, () => {
            this.userData.combinationGroups = this.userData.combinationGroups.filter(g => g.bindingId !== groupId);
            this.selectedGroups = this.selectedGroups.filter(id => id !== groupId);
            (this.userData.quickSwitchCombos || []).forEach(c => {
                c.combinationGroupIds = (c.combinationGroupIds || []).filter(id => id !== groupId);
            });
            if (this.userData.settings.defaultFavoriteCombinationGroupId === groupId) {
                this.userData.settings.defaultFavoriteCombinationGroupId = null;
            }
            this.saveUserData();
            this.renderSidebar();
            this.renderLibrarySelector();
            this.showToast('元素组合分组已删除');
        });
    }

    // 删除元素分组
    deleteElementGroup(groupId) {
        const group = this.getElementGroupById(groupId);
        if (!group) return;
        this.showConfirmModal(`确定要删除元素分组"${group.name}"吗？`, () => {
            this.userData.elementGroups = (this.userData.elementGroups || []).filter(g => g.bindingId !== groupId);
            this.selectedElementGroups = (this.selectedElementGroups || []).filter(id => id !== groupId);
            (this.userData.quickSwitchCombos || []).forEach(c => {
                c.elementGroupIds = (c.elementGroupIds || []).filter(id => id !== groupId);
            });
            this.userData.elements.forEach(el => {
                if (el.elementGroupIds) el.elementGroupIds = el.elementGroupIds.filter(id => id !== groupId);
            });
            if (this.userData.settings.defaultFavoriteElementGroupId === groupId) {
                this.userData.settings.defaultFavoriteElementGroupId = null;
            }
            this.saveUserData();
            this.renderSidebar();
            this.renderLibrarySelector();
            this.showToast('元素分组已删除');
        });
    }

    // 新建词语组（空分组，后续在编辑里添加元素或通过收藏加入）
    showNewElementGroupModal() {
        this.showPromptModal('新建元素分组', '分组名称（如：我的元素分组）', (name) => {
            const n = (name || '').trim();
            if (!n) { this.showToast('请输入名称'); return; }
            const arr = this.userData.elementGroups || [];
            const groupNames = arr.map(g => g.name);
            const finalName = this._ensureUniqueNumberedName(n, groupNames);
            this.userData.elementGroups = arr;
            const bid = this.generateId();
            this.userData.elementGroups.push({ id: bid, bindingId: bid, name: finalName, elementIds: [] });
            this.saveUserData();
            this.renderSidebar();
            this.showToast(`元素分组"${finalName}"已创建`);
        });
    }

    // 编辑词语组：元素列表、选择、复制到/移动到其他词语组、从本组移除
    editElementGroup(groupId) {
        this.closeModal();
        const group = this.getElementGroupById(groupId);
        if (!group) return;
        const initialElementIds = [...(group.elementIds || [])];
        let currentElementIds = [...initialElementIds];
        const pendingCopies = [];
        const pendingMoves = [];
        const tryClose = () => {
            const nameEl = document.getElementById('edit-element-group-name');
            const nameChanged = nameEl && nameEl.value.trim() !== group.name;
            const same = currentElementIds.length === initialElementIds.length && currentElementIds.every((id, i) => id === initialElementIds[i]);
            if (!same || nameChanged || pendingCopies.length || pendingMoves.length) {
                this.showConfirmModal('有未保存的修改，确定取消吗？', () => this.closeModal());
            } else {
                this.closeModal();
            }
        };

        const modal = this.createModal(`编辑元素分组 - ${group.name}`, `
            <div class="form-group">
                <label>分组名称：</label>
                <input type="text" id="edit-element-group-name" class="form-control" value="${group.name}">
            </div>
            <div class="form-group search-row">
                <label>搜索：</label>
                <div class="search-input-wrap">
                    <input type="text" id="search-elements-eg" class="form-control" placeholder="输入关键词">
                    <button type="button" id="search-elements-eg-btn" class="btn btn-primary">搜索</button>
                </div>
            </div>
            <div class="form-group library-sort-row">
                <label class="library-sort-label">排序</label>
                <select id="element-group-sort-select" class="library-sort-select">
                    <option value="default">默认</option>
                    <option value="asc">升序</option>
                    <option value="desc">降序</option>
                </select>
            </div>
            <div class="form-group library-bulk-actions library-bulk-actions-inline">
                <button type="button" id="toggle-select-mode-eg" class="btn btn-secondary">选择</button>
                <span id="library-bulk-actions-eg" style="display: none;">
                    <button type="button" id="select-all-entries-eg" class="btn btn-secondary">全选</button>
                    <button type="button" id="copy-selected-to-eg" class="btn btn-secondary">复制到</button>
                    <button type="button" id="move-selected-to-eg" class="btn btn-secondary">移动到</button>
                    <button type="button" id="delete-selected-from-eg" class="btn btn-secondary btn-danger">从本组移除</button>
                </span>
            </div>
            <div class="form-group">
                <div id="element-group-entries-list" class="library-entries-list"></div>
            </div>
        `, [
            { text: '保存', class: 'btn-primary', action: () => this.applyElementGroupEditAndSave(groupId, group, currentElementIds, pendingCopies, pendingMoves, () => { this.renderSidebar(); this.closeModal(); }) },
            { text: '取消', class: 'btn-secondary', action: tryClose }
        ], null, tryClose);

        const searchInput = modal.querySelector('#search-elements-eg');
        const listEl = modal.querySelector('#element-group-entries-list');
        const toggleSelectBtn = modal.querySelector('#toggle-select-mode-eg');
        const sortSelectEg = modal.querySelector('#element-group-sort-select');
        if (!group.sortOrder) group.sortOrder = 'default';
        if (sortSelectEg) {
            sortSelectEg.value = group.sortOrder === 'asc' ? 'asc' : group.sortOrder === 'desc' ? 'desc' : 'default';
            sortSelectEg.addEventListener('change', () => {
                group.sortOrder = sortSelectEg.value || 'default';
                this.saveUserData();
                renderList();
            });
        }
        let currentSearch = '';
        let selectMode = false;
        const selectedIds = new Set();
        const bulkActions = modal.querySelector('#library-bulk-actions-eg');
        const selectAllBtn = modal.querySelector('#select-all-entries-eg');

        const updateBulkVisibility = () => { bulkActions.style.display = selectMode ? 'inline-flex' : 'none'; };
        const updateSelectAllButtonText = () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length > 0 && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        };

        const renderList = () => {
            let ids = currentElementIds;
            if (group.sortOrder === 'asc') {
                ids = [...ids].sort((a, b) => {
                    const nameA = (this.getElementById(a) || {}).name || '';
                    const nameB = (this.getElementById(b) || {}).name || '';
                    const cmp = this._naturalCompare(nameA, nameB, false);
                    return cmp !== 0 ? cmp : this._naturalCompare(String(a), String(b), false);
                });
            } else if (group.sortOrder === 'desc') {
                ids = [...ids].sort((a, b) => {
                    const nameA = (this.getElementById(a) || {}).name || '';
                    const nameB = (this.getElementById(b) || {}).name || '';
                    const cmp = this._naturalCompare(nameA, nameB, true);
                    return cmp !== 0 ? cmp : this._naturalCompare(String(a), String(b), true);
                });
            }
            const baseElements = this.getElementsByIds(ids);
            const filtered = !currentSearch.trim() ? baseElements : baseElements.filter(e => e.name.toLowerCase().includes(currentSearch.toLowerCase()));
            listEl.innerHTML = '';
            filtered.forEach(el => {
                const wrap = document.createElement('div');
                wrap.className = 'library-entry-row';
                const chip = document.createElement('span');
                chip.className = 'entry-chip' + (selectedIds.has(el.id) ? ' entry-chip-selected' : '');
                chip.dataset.id = el.id;
                chip.textContent = el.name;
                chip.addEventListener('click', () => {
                    if (selectMode) {
                        if (selectedIds.has(el.id)) selectedIds.delete(el.id);
                        else selectedIds.add(el.id);
                        chip.classList.toggle('entry-chip-selected', selectedIds.has(el.id));
                        updateBulkVisibility();
                        updateSelectAllButtonText();
                    } else {
                        this.showElementModalById(el.id);
                    }
                });
                wrap.appendChild(chip);
                listEl.appendChild(wrap);
            });
            updateBulkVisibility();
            updateSelectAllButtonText();
        };

        toggleSelectBtn.addEventListener('click', () => {
            selectMode = !selectMode;
            toggleSelectBtn.textContent = selectMode ? '取消选择' : '选择';
            if (!selectMode) selectedIds.clear();
            renderList();
        });
        const doSearchEg = () => { currentSearch = searchInput.value; renderList(); };
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearchEg(); });
        modal.querySelector('#search-elements-eg-btn').addEventListener('click', doSearchEg);
        renderList();

        selectAllBtn.addEventListener('click', () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            chips.forEach(c => {
                const id = c.dataset.id;
                if (allSelected) selectedIds.delete(id);
                else selectedIds.add(id);
                c.classList.toggle('entry-chip-selected', selectedIds.has(id));
            });
            updateBulkVisibility();
            updateSelectAllButtonText();
        });
        modal.querySelector('#copy-selected-to-eg').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showCopyOrMoveToElementGroupModal(checked, groupId, false, (targetIds) => {
                pendingCopies.push({ targetIds, elementIds: checked });
                selectedIds.clear();
                renderList();
            });
        });
        modal.querySelector('#move-selected-to-eg').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showCopyOrMoveToElementGroupModal(checked, groupId, true, (targetIds) => {
                pendingMoves.push({ targetIds, elementIds: checked });
                checked.forEach(eid => {
                    const idx = currentElementIds.indexOf(eid);
                    if (idx !== -1) currentElementIds.splice(idx, 1);
                });
                selectedIds.clear();
                renderList();
            });
        });
        modal.querySelector('#delete-selected-from-eg').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先点击元素选择'); return; }
            this.showConfirmModal(`确定从本组移除已选 ${checked.length} 个元素？（保存后生效）`, () => {
                checked.forEach(eid => {
                    selectedIds.delete(eid);
                    const idx = currentElementIds.indexOf(eid);
                    if (idx !== -1) currentElementIds.splice(idx, 1);
                });
                renderList();
            });
        });
    }

    applyElementGroupEditAndSave(groupId, group, currentElementIds, pendingCopies, pendingMoves, onDone) {
        const nameEl = document.getElementById('edit-element-group-name');
        const newName = (nameEl && nameEl.value.trim()) || group.name;
        if (!newName) { this.showToast('请输入分组名称'); return; }
        let finalName = newName;
        let counter = 1;
        const arr = this.userData.elementGroups || [];
        while (arr.some(g => g.name === finalName && g.bindingId !== groupId)) { finalName = `${newName}(${counter})`; counter++; }
        group.name = finalName;
        this.ensureDefaultFavNamesDistinct();
        group.elementIds = [...currentElementIds];
        this.userData.elements.forEach(el => {
            if (!el.elementGroupIds) return;
            if (el.elementGroupIds.includes(groupId) && !currentElementIds.includes(el.id)) {
                el.elementGroupIds = el.elementGroupIds.filter(id => id !== groupId);
            }
        });
        group.id = this.generateId();
        pendingCopies.forEach(({ targetIds, elementIds }) => {
            targetIds.forEach(gid => {
                const g = this.getElementGroupById(gid);
                if (!g) return;
                g.elementIds = g.elementIds || [];
                elementIds.forEach(eid => {
                    if (!g.elementIds.includes(eid)) g.elementIds.push(eid);
                    const el = this.getElementById(eid);
                    if (el) {
                        if (!el.elementGroupIds) el.elementGroupIds = [];
                        if (!el.elementGroupIds.includes(gid)) el.elementGroupIds.push(gid);
                    }
                });
            });
        });
        pendingMoves.forEach(({ targetIds, elementIds }) => {
            elementIds.forEach(eid => {
                const el = this.getElementById(eid);
                if (el && el.elementGroupIds) el.elementGroupIds = el.elementGroupIds.filter(id => id !== groupId);
            });
            targetIds.forEach(gid => {
                const g = this.getElementGroupById(gid);
                if (!g) return;
                g.elementIds = g.elementIds || [];
                elementIds.forEach(eid => {
                    if (!g.elementIds.includes(eid)) g.elementIds.push(eid);
                    const el = this.getElementById(eid);
                    if (el) {
                        if (!el.elementGroupIds) el.elementGroupIds = [];
                        if (!el.elementGroupIds.includes(gid)) el.elementGroupIds.push(gid);
                    }
                });
            });
        });
        this.saveUserData();
        if (onDone) onDone();
        this.showToast(`元素分组"${finalName}"已保存`);
    }

    // 新建元素组合分组：只能创建空分组，组合在编辑里添加
    showNewGroupModal() {
        this.createModal('新建元素组合分组', `
            <div class="form-group">
                <label>分组名称：</label>
                <input type="text" id="new-group-name" class="form-control" placeholder="请输入分组名称">
            </div>
            <p class="text-muted">将分组设置为默认组合收藏夹后，可以把生成结果收藏到此分组。</p>
        `, [
            { text: '创建', class: 'btn-primary', action: () => this.createNewGroup() },
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
    }

    createNewGroup() {
        const nameEl = document.getElementById('new-group-name');
        const name = nameEl ? nameEl.value.trim() : '';

        if (!name) {
            this.showToast('请输入分组名称');
            return;
        }

        const groupNames = (this.userData.combinationGroups || []).map(g => g.name);
        const finalName = this._ensureUniqueNumberedName(name, groupNames);

        const newGroupId = this.generateId();
        this.userData.combinationGroups.push({
            id: newGroupId,
            bindingId: newGroupId,
            name: finalName,
            combinationIds: []
        });

        this.saveUserData();
        this.renderSidebar();
        this.closeModal();
        this.showToast(`元素组合分组"${finalName}"已创建（空）`);
    }

    showNewLibraryModal() {
        const content = `
            <div class="form-group">
                <label>词库名称：</label>
                <input type="text" id="new-lib-name" class="form-control" placeholder="请输入词库名称">
            </div>
            <div class="form-group">
                <label>词库内容：</label>
                <textarea id="new-lib-content" class="form-control" rows="6" placeholder="请输入元素，用分隔符分开"></textarea>
            </div>
            <div class="form-group">
                <label>分隔符：</label>
                <select id="new-lib-sep" class="form-control">
                    <option value=" ">空格</option>
                    <option value=",">逗号</option>
                    <option value="\\n">换行</option>
                    <option value="custom">自定义</option>
                </select>
                <input type="text" id="new-lib-custom-sep" class="form-control hidden" placeholder="自定义分隔符">
            </div>
        `;
        this.createModal('新建词库', content, [
            { text: '创建', class: 'btn-primary', action: () => this.createNewLibrary() },
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        document.getElementById('new-lib-sep').addEventListener('change', e => {
            document.getElementById('new-lib-custom-sep').classList.toggle('hidden', e.target.value !== 'custom');
        });
    }

    createNewLibrary() {
        const name = (document.getElementById('new-lib-name') && document.getElementById('new-lib-name').value.trim()) || '';
        const text = (document.getElementById('new-lib-content') && document.getElementById('new-lib-content').value.trim()) || '';
        const sepType = (document.getElementById('new-lib-sep') && document.getElementById('new-lib-sep').value) || '\n';
        let sep = sepType === '\\n' ? '\n' : sepType;
        if (sepType === 'custom') sep = (document.getElementById('new-lib-custom-sep') && document.getElementById('new-lib-custom-sep').value) || '\n';
        if (!name || !text) {
            this.showToast('请填写词库名称和内容');
            return;
        }
        const libNames = (this.userData.libraries || []).map(l => l.name);
        const finalName = this._ensureUniqueNumberedName(name, libNames);
        const words = text.split(sep).map(w => w.trim()).filter(Boolean);
        const libId = this.generateId();
        const elementIds = [];
        words.forEach(word => {
            const el = {
                id: this.generateId(),
                name: word,
                libraryIds: [libId],
                combinationIds: [],
                isBlacklisted: false
            };
            this.userData.elements.push(el);
            elementIds.push(el.id);
        });
        this.userData.libraries.push({
            id: libId,
            bindingId: libId,
            name: finalName,
            elementIds
        });
        this.saveUserData();
        this.closeModal();
        this.renderSidebar();
        this.showToast(`词库"${finalName}"已创建，共${elementIds.length}个元素`);
    }

    // 增加到词库：在词库内点击「增加」时调用，传入 libraryId 则直接向该词库追加
    showAddToLibraryModal(libraryId) {
        const fixedLibrary = libraryId ? this.getLibraryById(libraryId) : null;
        const targetLibs = this.userData.libraries.filter(l => !l.isSystem && l.bindingId !== DOUBLEBLIND_LIBRARY_ID);
        if (!fixedLibrary && !targetLibs.length) {
            this.showToast('没有可追加的词库，请先新建词库');
            return;
        }
        const targetRow = fixedLibrary ? '' : `
            <div class="form-group">
                <label>目标词库：</label>
                <select id="add-to-lib-target" class="form-control">${targetLibs.map(l => `<option value="${l.bindingId}">${l.name}</option>`).join('')}</select>
            </div>`;
        const content = `
            ${fixedLibrary ? `<input type="hidden" id="add-to-lib-target-id" value="${fixedLibrary.bindingId}">` : ''}
            ${targetRow}
            <div class="form-group">
                <label>词库内容：</label>
                <textarea id="add-to-lib-content" class="form-control" rows="6" placeholder="请输入元素，用分隔符分开"></textarea>
            </div>
            <div class="form-group">
                <label>分隔符：</label>
                <select id="add-to-lib-sep" class="form-control">
                    <option value=" ">空格</option>
                    <option value=",">逗号</option>
                    <option value="\\n">换行</option>
                    <option value="custom">自定义</option>
                </select>
                <input type="text" id="add-to-lib-custom-sep" class="form-control hidden" placeholder="自定义分隔符">
            </div>
        `;
        const title = fixedLibrary ? `向「${fixedLibrary.name}」追加元素` : '增加到词库';
        this.createModal(title, content, [
            { text: '追加', class: 'btn-primary', action: () => this.addToLibrary() },
            { text: '取消', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        document.getElementById('add-to-lib-sep').addEventListener('change', e => {
            document.getElementById('add-to-lib-custom-sep').classList.toggle('hidden', e.target.value !== 'custom');
        });
    }

    addToLibrary() {
        const targetIdEl = document.getElementById('add-to-lib-target-id');
        const targetId = targetIdEl ? targetIdEl.value : (document.getElementById('add-to-lib-target') && document.getElementById('add-to-lib-target').value);
        const text = (document.getElementById('add-to-lib-content') && document.getElementById('add-to-lib-content').value.trim()) || '';
        const sepType = (document.getElementById('add-to-lib-sep') && document.getElementById('add-to-lib-sep').value) || '\n';
        let sep = sepType === '\\n' ? '\n' : sepType;
        if (sepType === 'custom') sep = (document.getElementById('add-to-lib-custom-sep') && document.getElementById('add-to-lib-custom-sep').value) || '\n';
        if (!targetId || !text) {
            this.showToast('请填写词库内容');
            return;
        }
        const library = this.getLibraryById(targetId);
        if (!library || library.isSystem) {
            this.showToast('无法向系统词库追加');
            return;
        }
        const words = text.split(sep).map(w => w.trim()).filter(Boolean);
        const elementIds = [];
        words.forEach(word => {
            const el = {
                id: this.generateId(),
                name: word,
                libraryIds: [library.id],
                combinationIds: [],
                isBlacklisted: false
            };
            this.userData.elements.push(el);
            elementIds.push(el.id);
        });
        library.elementIds = library.elementIds || [];
        library.elementIds.push(...elementIds);
        this.saveUserData();
        this.closeModal();
        this.renderSidebar();
        this.showToast(`已向词库"${library.name}"追加 ${elementIds.length} 个元素`);
    }

    // Emoji 设置页：恐虫开关、分类筛选、拉黑管理（仅对 Emoji 词库）
    showEmojiSettingsModal() {
        let emojiLib = this.userData.libraries.find(l => l.bindingId === EMOJI_LIBRARY_ID);
        if (!emojiLib) {
            const noLibModal = this.createModal('编辑 Emoji 词库', `
                <p>Emoji 词库已被删除。</p>
                <p><button type="button" id="restore-emoji-lib-btn" class="btn btn-primary">恢复 Emoji 词库</button> 后可在此管理恐虫筛选与拉黑。</p>
            `, [
                { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
            ]);
            noLibModal.classList.add('modal-emoji');
            const btn = document.getElementById('restore-emoji-lib-btn');
            if (btn) btn.addEventListener('click', () => {
                const emojiEls = this.generateEmojiElements();
                const emojiIds = emojiEls.map(e => e.id);
                emojiEls.forEach(e => { e.libraryIds = []; e.combinationIds = []; });
                this.userData.elements.push(...emojiEls);
                this.userData.libraries.push({
                    id: EMOJI_LIBRARY_ID,
                    bindingId: EMOJI_LIBRARY_ID,
                    name: 'Emoji词库',
                    elementIds: emojiIds
                });
                emojiEls.forEach(e => e.libraryIds.push(EMOJI_LIBRARY_ID));
                this.saveUserData();
                this._invalidateElementMap();
                this.closeModal();
                this.renderSidebar();
                this.renderLibrarySelector();
                this.showToast('已恢复 Emoji 词库');
                this.showEmojiSettingsModal();
            });
            return;
        }
        let els = this.getLibraryElements(emojiLib);
        const overrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
        const hideInsects = !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly);
        const modal = this.createModal('编辑 Emoji 词库', `
            <div class="form-group emoji-settings-row">
                <label class="checkbox-label"><input type="checkbox" id="emoji-phobia-cb" ${hideInsects ? 'checked' : ''}> 我有恐虫症，但我不恐蝴蝶</label>
                <p class="text-muted small">开启后，生成与筛选时将隐藏除蝴蝶外的昆虫/节肢类。</p>
            </div>
            <div class="form-group">
                <label>分类筛选（勾选后仅显示该分类，不勾选=显示全部）：</label>
                <button type="button" id="emoji-settings-cat-toggle" class="btn-emoji-filter-toggle">▸ 分类</button>
                <div id="emoji-settings-cat-wrap" class="emoji-category-filter-wrap hidden">
                    <div class="emoji-category-actions">
                        <button type="button" id="emoji-settings-toggle-all" class="btn btn-sm">全选</button>
                    </div>
                    <div id="emoji-settings-cat-tree" class="emoji-category-tree"></div>
                </div>
            </div>
            <div class="form-group">
                <label>点击 emoji 可拉黑/取消拉黑（当前已拉黑 <span id="emoji-blacklist-count">0</span> 个）</label>
                <div id="emoji-grid" class="emoji-settings-grid"></div>
            </div>
        `, [
            { text: '保存', class: 'btn-primary', action: () => onSave() },
            { text: '恢复默认', class: 'btn-secondary', action: () => onResetDefault() },
            { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
        ]);
        modal.classList.add('modal-emoji');

        let localHideInsects = !!(this.userData.settings && this.userData.settings.hideInsectsExceptButterfly);
        const viewSelectedIds = [...(this.userData.settings.emojiSelectedCategoryIds || [])];
        const localBlacklistedChars = [...(overrides.blacklistedChars || [])];

        const onSave = () => {
            this.userData.settings.hideInsectsExceptButterfly = localHideInsects;
            this.userData.settings.emojiSelectedCategoryIds = viewSelectedIds.length ? [...viewSelectedIds] : [];
            this.userData.emojiOverrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
            this.userData.emojiOverrides.blacklistedChars = [...localBlacklistedChars];
            this.saveUserData();
            this.closeModal();
            this.showToast('已保存');
        };
        const onResetDefault = () => {
            this.showConfirmModal('确定恢复？之前从词库删除的 emoji 会重新出现，当前筛选与拉黑状态不变。', () => {
                this.userData.emojiOverrides = this.userData.emojiOverrides || { deletedChars: [], blacklistedChars: [] };
                this.userData.emojiOverrides.deletedChars = [];
                this.saveUserData();
                this._rebuildEmojiLibraryFromOverrides();
                this.closeModal();
                this.showToast('已恢复：之前删除的 emoji 已加回词库');
                this.showEmojiSettingsModal();
            });
        };

        const phobiaCb = modal.querySelector('#emoji-phobia-cb');
        phobiaCb.checked = localHideInsects;
        phobiaCb.onchange = () => {
            localHideInsects = !!phobiaCb.checked;
            renderGrid();
        };
        const gridEl = modal.querySelector('#emoji-grid');
        const countEl = modal.querySelector('#emoji-blacklist-count');
        const mapsView = _emojiCategoryMaps();
        const collectDescendantIdsView = (pid) => {
            const out = [pid];
            (mapsView.parentToChildren[pid] || []).forEach(cid => { out.push(...collectDescendantIdsView(cid)); });
            return out;
        };
        const allCategoryIdsView = getAllEmojiCategoryIds();
        const isAllCategoriesSelectedView = () => {
            const leafSet = new Set();
            viewSelectedIds.forEach(id => { (mapsView.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
            return mapsView.leaves.length > 0 && mapsView.leaves.every(lid => leafSet.has(lid));
        };
        const toggleAllBtnView = modal.querySelector('#emoji-settings-toggle-all');
        const updateToggleAllBtnView = () => { if (toggleAllBtnView) toggleAllBtnView.textContent = isAllCategoriesSelectedView() ? '取消全选' : '全选'; };
        const renderSettingsCategoryTree = () => {
            const treeContainer = modal.querySelector('#emoji-settings-cat-tree');
            if (!treeContainer) return;
            const renderTree = (nodes, depth = 0) => {
                const leafSet = new Set();
                viewSelectedIds.forEach(id => { (mapsView.nodeToLeafIds[id] || [id]).forEach(lid => leafSet.add(lid)); });
                let html = '';
                nodes.forEach(n => {
                    const hasChildren = n.children && n.children.length > 0;
                    const leaves = mapsView.nodeToLeafIds[n.id] || [n.id];
                    const checked = hasChildren ? leaves.every(lid => leafSet.has(lid)) : leafSet.has(n.id);
                    const someChildrenChecked = hasChildren && leaves.some(lid => leafSet.has(lid));
                    const indeterminate = hasChildren && someChildrenChecked && !checked;
                    const indent = depth ? ` style="margin-left: ${depth * 1.2}em"` : '';
                    if (hasChildren) {
                        html += `<div class="emoji-cat-group" data-id="${n.id}"><div class="emoji-cat-parent-row"><span class="emoji-cat-fold" title="收起/展开">▾</span><label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-settings-cat-cb" data-id="${n.id}" data-has-children="true" ${checked ? 'checked' : ''} ${indeterminate ? 'data-indeterminate="true"' : ''}> ${n.label}</label></div><div class="emoji-cat-children">${renderTree(n.children, depth + 1)}</div></div>`;
                    } else {
                        html += `<label class="emoji-cat-item"${indent}><input type="checkbox" class="emoji-settings-cat-cb" data-id="${n.id}" data-has-children="false" ${checked ? 'checked' : ''}> ${n.label}</label>`;
                    }
                });
                return html;
            };
            treeContainer.innerHTML = renderTree(EMOJI_CATEGORY_TREE);
            treeContainer.querySelectorAll('.emoji-cat-fold').forEach(fold => {
                fold.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const g = fold.closest('.emoji-cat-group'); if (g) g.classList.toggle('emoji-cat-group-collapsed'); fold.textContent = g.classList.contains('emoji-cat-group-collapsed') ? '▸' : '▾'; });
            });
            treeContainer.querySelectorAll('.emoji-settings-cat-cb').forEach(cb => {
                cb.onchange = () => {
                    const id = cb.dataset.id;
                    const hasChildren = cb.dataset.hasChildren === 'true';
                    if (cb.checked) {
                        if (hasChildren) collectDescendantIdsView(id).forEach(x => { if (!viewSelectedIds.includes(x)) viewSelectedIds.push(x); });
                        else { if (!viewSelectedIds.includes(id)) viewSelectedIds.push(id); }
                    } else {
                        if (hasChildren && mapsView.parentToChildren[id]) {
                            const toRemove = new Set(collectDescendantIdsView(id));
                            viewSelectedIds.splice(0, viewSelectedIds.length, ...viewSelectedIds.filter(x => !toRemove.has(x)));
                        } else {
                            const i = viewSelectedIds.indexOf(id);
                            if (i !== -1) viewSelectedIds.splice(i, 1);
                        }
                    }
                    updateToggleAllBtnView();
                    renderSettingsCategoryTree();
                    renderGrid();
                };
            });
            treeContainer.querySelectorAll('.emoji-settings-cat-cb[data-indeterminate="true"]').forEach(cb => { cb.indeterminate = true; });
            updateToggleAllBtnView();
        };
        modal.querySelector('#emoji-settings-cat-toggle')?.addEventListener('click', () => {
            const w = modal.querySelector('#emoji-settings-cat-wrap');
            const btn = modal.querySelector('#emoji-settings-cat-toggle');
            if (w && btn) { w.classList.toggle('hidden'); btn.textContent = w.classList.contains('hidden') ? '▸ 分类' : '▾ 收起分类'; }
        });
        toggleAllBtnView?.addEventListener('click', () => {
            if (isAllCategoriesSelectedView()) viewSelectedIds.length = 0;
            else viewSelectedIds.splice(0, viewSelectedIds.length, ...allCategoryIdsView);
            updateToggleAllBtnView();
            renderSettingsCategoryTree();
            renderGrid();
        });
        renderSettingsCategoryTree();

        const renderGrid = () => {
            let list = els;
            if (localHideInsects) {
                list = list.filter(e => !isInsectExceptButterfly(e.name));
            }
            const leafSet = expandEmojiCategorySelectedToLeafIds(viewSelectedIds.length ? viewSelectedIds : null);
            if (leafSet) list = list.filter(e => leafSet.has(getEmojiCategoryForEmojiChar(e.name) || ''));
            const blacklisted = new Set(localBlacklistedChars);
            if (countEl) countEl.textContent = blacklisted.size;
            gridEl.innerHTML = list.map(el => {
                const isBl = blacklisted.has(el.name);
                return `<button type="button" class="emoji-chip ${isBl ? 'emoji-blacklisted' : ''}" data-name="${String(el.name).replace(/"/g, '&quot;')}" title="${isBl ? '取消拉黑' : '拉黑'}">${el.name}</button>`;
            }).join('');
            gridEl.querySelectorAll('.emoji-chip').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.dataset.name || btn.textContent;
                    const idx = localBlacklistedChars.indexOf(name);
                    if (idx >= 0) {
                        localBlacklistedChars.splice(idx, 1);
                    } else {
                        localBlacklistedChars.push(name);
                    }
                    renderGrid();
                });
            });
        };
        renderGrid();
    }

    // 黑名单管理：仅元素，可搜索、选择、批量取消拉黑
    showBlacklistModal() {
        const orderedIds = [...(this.userData.blacklistedElementIds || [])];
        const count = orderedIds.filter(id => this.getElementById(id) && this.getElementById(id).isBlacklisted).length;

        const modal = this.createModal('黑名单管理', `
            <div class="form-group search-row">
                <label>搜索：</label>
                <div class="search-input-wrap">
                    <input type="text" id="blacklist-search" class="form-control" placeholder="输入关键词">
                    <button type="button" id="blacklist-search-btn" class="btn btn-primary">搜索</button>
                </div>
            </div>
            <div class="form-group library-bulk-actions library-bulk-actions-inline">
                <button type="button" id="blacklist-toggle-select" class="btn btn-secondary">选择</button>
                <span id="blacklist-bulk-actions" style="display: none;">
                    <button type="button" id="blacklist-select-all" class="btn btn-secondary">全选</button>
                    <button type="button" id="blacklist-batch-restore" class="btn btn-success">恢复</button>
                </span>
            </div>
            <div id="blacklist-elements-list" class="library-entries-list"></div>
        `, [
            { text: '关闭', class: 'btn-secondary', action: () => this.closeModal() }
        ]);

        const listEl = modal.querySelector('#blacklist-elements-list');
        const searchInput = modal.querySelector('#blacklist-search');
        const toggleSelectBtn = modal.querySelector('#blacklist-toggle-select');
        const bulkActions = modal.querySelector('#blacklist-bulk-actions');
        const selectAllBtn = modal.querySelector('#blacklist-select-all');
        let currentSearch = '';
        let selectMode = false;
        const selectedIds = new Set();

        const updateBulkVisibility = () => { bulkActions.style.display = selectMode ? 'inline-flex' : 'none'; };
        const updateSelectAllText = () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length > 0 && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            if (selectAllBtn) selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
        };

        const renderElementsList = () => {
            const ids = orderedIds.filter(id => {
                const el = this.getElementById(id);
                return el && el.isBlacklisted;
            });
            const elements = this.getElementsByIds(ids);
            const filtered = !currentSearch.trim() ? elements : elements.filter(e => e.name.toLowerCase().includes(currentSearch.toLowerCase()));
            listEl.innerHTML = '';
            if (filtered.length === 0) {
                listEl.innerHTML = '<div class="empty-list">' + (ids.length === 0 ? '暂无拉黑的元素' : '无匹配结果') + '</div>';
            } else {
                filtered.forEach(el => {
                    const wrap = document.createElement('div');
                    wrap.className = 'library-entry-row';
                    const chip = document.createElement('span');
                    chip.className = 'entry-chip' + (selectedIds.has(el.id) ? ' entry-chip-selected' : '');
                    chip.dataset.id = el.id;
                    chip.textContent = el.name;
                    chip.addEventListener('click', () => {
                        if (selectMode) {
                            if (selectedIds.has(el.id)) selectedIds.delete(el.id);
                            else selectedIds.add(el.id);
                            chip.classList.toggle('entry-chip-selected', selectedIds.has(el.id));
                            updateBulkVisibility();
                            updateSelectAllText();
                        } else {
                            this.showElementModalById(el.id);
                        }
                    });
                    wrap.appendChild(chip);
                    listEl.appendChild(wrap);
                });
            }
            updateBulkVisibility();
            updateSelectAllText();
        };

        toggleSelectBtn.addEventListener('click', () => {
            selectMode = !selectMode;
            toggleSelectBtn.textContent = selectMode ? '取消选择' : '选择';
            if (!selectMode) selectedIds.clear();
            renderElementsList();
        });
        const doSearchBlacklist = () => { currentSearch = searchInput.value; renderElementsList(); };
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearchBlacklist(); });
        modal.querySelector('#blacklist-search-btn').addEventListener('click', doSearchBlacklist);
        selectAllBtn.addEventListener('click', () => {
            const chips = listEl.querySelectorAll('.entry-chip');
            const allSelected = chips.length && Array.from(chips).every(c => selectedIds.has(c.dataset.id));
            chips.forEach(c => {
                const id = c.dataset.id;
                if (allSelected) selectedIds.delete(id);
                else selectedIds.add(id);
                c.classList.toggle('entry-chip-selected', selectedIds.has(id));
            });
            updateSelectAllText();
        });
        modal.querySelector('#blacklist-batch-restore').addEventListener('click', () => {
            const checked = Array.from(selectedIds);
            if (!checked.length) { this.showToast('请先选择元素'); return; }
            const arr = this.userData.blacklistedElementIds || [];
            checked.forEach(eid => {
                const el = this.getElementById(eid);
                if (el && el.isBlacklisted) {
                    el.isBlacklisted = false;
                    const idx = arr.indexOf(eid);
                    if (idx !== -1) arr.splice(idx, 1);
                }
            });
            this.saveUserData();
            selectedIds.clear();
            renderElementsList();
            this.showToast(`已恢复 ${checked.length} 个元素`);
        });

        renderElementsList();
    }

    restoreElement(elementId) {
        const el = this.getElementById(elementId);
        if (el && el.isBlacklisted) {
            el.isBlacklisted = false;
            this.saveUserData();
            this.showToast('元素已恢复');
            this.closeModal();
            this.showBlacklistModal();
        }
    }

    permanentDeleteElement(elementId) {
        this.showConfirmModal('确定要永久删除此元素吗？此操作不可恢复！', () => {
        const el = this.getElementById(elementId);
        const name = el ? el.name : elementId;
        this.userData.libraries.forEach(library => {
            const idx = (library.elementIds || []).indexOf(elementId);
            if (idx !== -1) library.elementIds.splice(idx, 1);
        });
        this.userData.elements = this.userData.elements.filter(e => e.id !== elementId);
        this.userData.combinations.forEach(c => {
            c.elementIds = (c.elementIds || []).filter(id => id !== elementId);
        });
        this.saveUserData();
        this.showToast(`元素"${name}"已永久删除`);
        this.closeModal();
        this.showBlacklistModal();
        });
    }

    restoreCombination(combinationId) {
        const combination = this.userData.combinations.find(c => c.id === combinationId);
        if (combination) {
            combination.isBlacklisted = false;
            this.saveUserData();
            this.showToast('组合已恢复');
            this.closeModal();
            this.showBlacklistModal();
        }
    }

    permanentDeleteCombination(combinationId) {
        this.showConfirmModal('确定要永久删除此组合吗？此操作不可恢复！', () => {
        const index = this.userData.combinations.findIndex(c => c.id === combinationId);
        if (index !== -1) {
            this.userData.combinations.splice(index, 1);
            this.saveUserData();
            this.showToast('组合已永久删除');
            this.closeModal();
            this.showBlacklistModal();
        }
        });
    }

    restoreAllElements() {
        this.showConfirmModal('确定要恢复所有黑名单元素吗？', () => {
        let restoredCount = 0;
        this.userData.elements.forEach(el => {
            if (el.isBlacklisted) {
                el.isBlacklisted = false;
                restoredCount++;
            }
        });
        this.userData.blacklistedElementIds = [];

        this.saveUserData();
        this.showToast(`已恢复 ${restoredCount} 个黑名单项目`);
        this.closeModal();
        this.showBlacklistModal();
        });
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InspirationGenerator();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .selector-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .selector-item input[type="checkbox"] {
        margin-right: 0.5rem;
    }
    
    .selector-item label {
        cursor: pointer;
        flex: 1;
    }
    
    .selector-tabs {
        display: flex;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 1rem;
    }
    
    .tab-btn {
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        cursor: pointer;
        border-bottom: 2px solid transparent;
    }
    
    .tab-btn.active {
        border-bottom-color: #000;
        font-weight: 600;
    }
    
    .daily-crystal {
        text-align: center;
        padding: 2rem;
    }
    
    .daily-magic-ball {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 180px;
        height: 180px;
        margin: 0 auto 1rem;
        border-radius: 50%;
        background: linear-gradient(160deg, #fff 0%, #f5f5f5 100%);
        border: 3px solid rgba(0,0,0,0.08);
        box-shadow: inset 0 0 24px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08);
        cursor: pointer;
        user-select: none;
        overflow: visible;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        animation: daily-magic-pulse 2.5s ease-in-out infinite;
    }
    
    .daily-magic-ball:hover {
        transform: scale(1.05);
        box-shadow: inset 0 0 28px rgba(255,255,255,0.9), 0 6px 24px rgba(0,0,0,0.1);
    }
    
    .daily-magic-ball.daily-magic-flash {
        animation: daily-magic-flash 0.4s ease-out;
    }
    
    .daily-magic-ball-bubbles {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        border-radius: 50%;
        overflow: visible;
    }
    
    .daily-magic-bubble {
        position: absolute;
        bottom: 30%;
        font-size: 1.1rem;
        line-height: 1;
        opacity: 0.9;
        animation: daily-bubble-float 0.8s ease-out forwards;
        pointer-events: none;
    }
    
    .daily-magic-emoji {
        position: relative;
        z-index: 1;
        font-size: 3.8rem;
        line-height: 1;
        filter: drop-shadow(0 0 10px rgba(200,220,255,0.4));
        text-shadow: 0 0 12px rgba(255,255,255,0.6);
    }
    
    
    .daily-element {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
        min-height: 2rem;
    }
    
    .daily-element-hint {
        font-size: 0.85rem;
        color: #999;
        margin: 0.5rem 0 0;
    }
    
    .daily-element.daily-element-reveal {
        animation: daily-element-reveal 0.5s ease-out;
    }
    
    @keyframes daily-magic-pulse {
        0%, 100% { box-shadow: inset 0 0 24px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08); }
        50% { box-shadow: inset 0 0 32px rgba(255,255,255,0.95), 0 4px 24px rgba(0,0,0,0.1); }
    }
    
    @keyframes daily-magic-flash {
        0% { transform: scale(1); opacity: 1; }
        30% { transform: scale(1.1); opacity: 0.95; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes daily-bubble-float {
        0% { transform: translateY(0) scale(0.8); opacity: 0.9; }
        100% { transform: translateY(-70px) scale(1); opacity: 0; }
    }
    
    @keyframes daily-element-reveal {
        0% { opacity: 0; transform: translateY(-6px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    
    .mining-tool-content { display: flex; flex-direction: column; gap: 1rem; background: #f0f0f2; color: #1a1a1a; }
    .mining-hint { color: #404040; font-size: 0.9rem; margin: 0 0 0.5rem 0; }
    .mining-stamina-area { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .mining-stamina-label { font-weight: 500; color: #1a1a1a; }
    .mining-stamina-bar-wrap { flex: 1; min-width: 80px; height: 1.25rem; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .mining-stamina-bar { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.2s; }
    .mining-stamina-text { font-size: 0.9rem; color: #333; }
    .mining-refill-btn { flex-shrink: 0; }
    .mining-map-cell .mining-empty { font-size: 0.85rem; color: #555; }
    .mining-map-area { display: flex; flex-direction: column; gap: 0.5rem; }
    .mining-map-label { font-weight: 500; color: #1a1a1a; }
    .mining-map { display: grid; grid-template-columns: repeat(var(--mining-cols, 10), 1fr); gap: 3px; max-width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 8px; background: #5c4033; }
    .mining-map-empty { grid-column: 1 / -1; text-align: center; padding: 1.5rem; color: #404040; background: #ebebee; border-radius: 6px; }
    .mining-map-cell { aspect-ratio: 1; min-width: 0; min-height: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-size: 1.1rem; flex-wrap: wrap; padding: 2px; }
    .mining-map-cell:not(.mining-map-cell-revealed) { background: #8B4513; border: 1px solid #654321; }
    .mining-map-cell:not(.mining-map-cell-revealed):hover { background: #A0522D; filter: brightness(1.1); }
    .mining-map-cell-revealed { cursor: default; }
    .mining-map-cell-revealed.mining-map-cell-diamond { background: linear-gradient(135deg, #e8f4fc 0%, #d0e8f8 100%); border: 1px solid #b8d4e8; color: #1a1a1a; }
    .mining-map-cell-revealed.mining-map-cell-rock { background: #a0a0a0; color: #222; }
    .mining-map-cell-revealed.mining-map-cell-soil { background: #d2b48c; color: #444; }
    .mining-map-dirt { font-size: 1rem; }
    .mining-map-cell .mining-element-name { font-size: 0.65rem; cursor: pointer; text-decoration: underline dotted; max-width: 100%; overflow: hidden; text-overflow: ellipsis; color: #1a1a1a; }
    .mining-backpack-area { border-top: 1px solid #ddd; padding-top: 0.75rem; color: #1a1a1a; }
    .mining-backpack-label { color: #1a1a1a; }
    .mining-backpack-items { max-height: 160px; overflow-y: auto; margin: 0.5rem 0; color: #1a1a1a; }
    .mining-backpack-item { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; color: #1a1a1a; }
    .mining-backpack-item-inner { color: #1a1a1a; }
    .mining-backpack-empty { color: #404040; }
    .mining-backpack-chip { cursor: pointer; display: inline-block; padding: 0.2rem 0.5rem; border: 1px solid #888; border-radius: 4px; background: #ebebee; color: #1a1a1a; margin: 0.1rem; }
    .mining-backpack-chip:hover { background: #e0e0e4; border-color: #666; color: #1a1a1a; }
    .mining-backpack-sep { color: #555; }
    
    .telepathy-tool-content { display: flex; flex-direction: column; gap: 0.5rem; }
    .telepathy-slots-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; }
    .telepathy-guess-count { font-size: 0.9rem; }
    .telepathy-pool-hint { font-size: 0.9rem; margin-bottom: 0.35rem; }
    .telepathy-pool-legend { font-size: 0.85rem; margin-bottom: 0.5rem; }
    .telepathy-pool { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
    .telepathy-pool-chip { cursor: pointer; padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid #999; }
    .telepathy-pool-chip:hover { }
    .telepathy-pool-chip.telepathy-pool-absent { border-color: #666; cursor: default; }
    .telepathy-pool-chip.telepathy-pool-absent:hover { }
    .telepathy-pool-chip.telepathy-pool-wrong-pos { border: 3px solid #333 !important; font-weight: 700; }
    .telepathy-slots { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; align-items: center; }
    .telepathy-slot { min-width: 3rem; min-height: 2rem; padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; }
    .telepathy-slot-chip { cursor: pointer; }
    .telepathy-slot-fixed { font-weight: 700; cursor: default; }
    .telepathy-submit-btn { flex-shrink: 0; }
    .telepathy-win { padding: 0.75rem; border-radius: 8px; font-weight: 600; margin: 0.5rem 0 0; }
    .telepathy-result .result-item-wrap { margin-top: 0.5rem; }
`;
document.head.appendChild(style);