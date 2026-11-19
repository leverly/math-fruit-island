/* ===== 题库：关卡 / 水果 / 出题规则 ===== */
(function () {
  var D = {};

  /* ===== 关卡类型：决定一局用哪些机制 =====
     practice 练习：专注单一知识点，短局、无 Boss、无事件卡
     challenge 挑战：学期末综合，长局、Boss、事件卡、FEVER 全开
     story     情境：数学广角/综合实践，轻压力、允许容错
  */
  D.PLAY_TYPES = {
    practice: {
      id: 'practice', name: '练习',
      count: 8, hearts: 2, boss: false, events: false, fever: true,
      tip: '专注练这一个知识点'
    },
    challenge: {
      id: 'challenge', name: '挑战',
      count: 12, hearts: 3, boss: true, events: true, fever: true,
      tip: '综合检验，最后有 Boss'
    },
    story: {
      id: 'story', name: '情境',
      count: 6, hearts: 3, boss: false, events: false, fever: false,
      tip: '慢慢想，答错不扣心'
    }
  };

  /* 关卡：每关一个水果 + 一个技能 */
  /* ===== 年级 × 学期结构（人教版小学数学 1-6 年级） ===== */
  D.GRADES = [
    { id: 'g1', name: '一年级', short: '1' },
    { id: 'g2', name: '二年级', short: '2' },
    { id: 'g3', name: '三年级', short: '3' },
    { id: 'g4', name: '四年级', short: '4' },
    { id: 'g5', name: '五年级', short: '5' },
    { id: 'g6', name: '六年级', short: '6' }
  ];
  D.TERMS = [
    { id: 'up',   name: '上册' },
    { id: 'down', name: '下册' }
  ];

  D.LEVELS = [
    /* ---- 一年级上册（按人教版 8 个单元） ---- */
    { id: 'lv1', name: '数数岛',   fruit: 'apple',  skill: '数一数',        kinds: ['count'],   max: 10, c1: '#FFD9A0', c2: '#FF9A5C', shadow: '#D96A12', grade: 'g1', term: 'up', unit: '第 1 单元', playType: 'practice' },
    { id: 'lv2', name: '位置岛',   fruit: 'peach',  skill: '位置',          kinds: ['pos'],     max: 0,  c1: '#FFE4C8', c2: '#FFB067', shadow: '#C96A1E', grade: 'g1', term: 'up', unit: '第 2 单元', playType: 'practice' },
    { id: 'lv3', name: '5以内岛',  fruit: 'orange', skill: '1~5 的认识和加减法', kinds: ['num5'], max: 5,  c1: '#FFE9A0', c2: '#FFB33F', shadow: '#D98A00', grade: 'g1', term: 'up', unit: '第 3 单元', playType: 'practice' },
    { id: 'lv4', name: '立体岛',   fruit: 'grape',  skill: '认识图形（一）',  kinds: ['solid3d'], max: 0,  c1: '#E3CCFF', c2: '#B57BF0', shadow: '#7A3FBF', grade: 'g1', term: 'up', unit: '第 4 单元', playType: 'practice' },
    { id: 'lv5', name: '10以内岛', fruit: 'banana', skill: '6~10 的认识和加减法', kinds: ['num10'], max: 10, c1: '#FFF2A8', c2: '#FFD93D', shadow: '#D9A800', grade: 'g1', term: 'up', unit: '第 5 单元', playType: 'practice' },
    { id: 'lv6', name: '十几岛',   fruit: 'melon',  skill: '11~20 各数的认识', kinds: ['num20'],  max: 20, c1: '#B8F0A8', c2: '#5BD44B', shadow: '#2F8A24', grade: 'g1', term: 'up', unit: '第 6 单元', playType: 'practice' },
    { id: 'lv7', name: '时钟岛',   fruit: 'berry',  skill: '认识钟表',       kinds: ['clock1'],  max: 0,  c1: '#FFC8D8', c2: '#FF6B8F', shadow: '#C93E62', grade: 'g1', term: 'up', unit: '第 7 单元', playType: 'practice' },
    { id: 'lv8', name: '进位岛',   fruit: 'star',   skill: '20 以内的进位加法', kinds: ['carry10'], max: 20, c1: '#C8E8FF', c2: '#6FB8F5', shadow: '#2F7BBF', grade: 'g1', term: 'up', unit: '第 8 单元', playType: 'challenge' },

    /* ---- 三年级上册 ---- */
    { id: 'g1', name: '时钟岛',   fruit: 'apple',  skill: '时、分、秒',        kinds: ['time'],        max: 0, c1: '#FFE0B2', c2: '#FFA65C', shadow: '#D2691E', grade: 'g3', term: 'up', book: '三上', unit: '第 1 单元', playType: 'practice' },
    { id: 'g2', name: '算珠岛',   fruit: 'pear',   skill: '万以内的加法',      kinds: ['addbig'],      max: 0, c1: '#D7F0C0', c2: '#7FCB5A', shadow: '#3E8A2E', grade: 'g3', term: 'up', book: '三上', unit: '第 2 单元', playType: 'practice' },
    { id: 'g3', name: '尺子岛',   fruit: 'banana', skill: '测量',              kinds: ['measure'],     max: 0, c1: '#FFF0B8', c2: '#FFD24D', shadow: '#C99A0A', grade: 'g3', term: 'up', book: '三上', unit: '第 3 单元', playType: 'practice' },
    { id: 'g4', name: '算盘岛',   fruit: 'orange', skill: '万以内的减法',      kinds: ['subbig'],      max: 0, c1: '#FFDFC0', c2: '#FFB067', shadow: '#C96A1E', grade: 'g3', term: 'up', book: '三上', unit: '第 4 单元', playType: 'practice' },
    { id: 'g5', name: '双胞胎岛', fruit: 'peach',  skill: '倍的认识',          kinds: ['times'],       max: 0, c1: '#FFD8E4', c2: '#FF8FB0', shadow: '#D2527A', grade: 'g3', term: 'up', book: '三上', unit: '第 5 单元', playType: 'practice' },
    { id: 'g6', name: '齿轮岛',   fruit: 'grape',  skill: '多位数乘一位数',    kinds: ['mul1'],        max: 0, c1: '#E0D0FF', c2: '#A87BE8', shadow: '#6B3FB5', grade: 'g3', term: 'up', book: '三上', unit: '第 6 单元', playType: 'practice' },
    { id: 'g7', name: '方格岛',   fruit: 'melon',  skill: '长方形与正方形',    kinds: ['perimeter'],   max: 0, c1: '#C8F0D8', c2: '#5CC98A', shadow: '#2E8A56', grade: 'g3', term: 'up', book: '三上', unit: '第 7 单元', playType: 'practice' },
    { id: 'g8', name: '分饼岛',   fruit: 'berry',  skill: '分数的初步认识',    kinds: ['fraction'],    max: 0, c1: '#FFD0D8', c2: '#FF7A96', shadow: '#C9425C', grade: 'g3', term: 'up', book: '三上', unit: '第 8 单元', playType: 'challenge' },
    { id: 'g9', name: '交集岛',   fruit: 'star',   skill: '集合',              kinds: ['venn'],        max: 0, c1: '#CFE8FF', c2: '#6FB8F5', shadow: '#2F7BBF', grade: 'g3', term: 'up', book: '三上', unit: '第 9 单元', playType: 'story' },

    /* ---- 三年级下册 ---- */
    { id: 'g10', name: '指南针岛', fruit: 'apple',  skill: '位置与方向',       kinds: ['direction'],   max: 0, c1: '#D0F0FF', c2: '#5FC3F0', shadow: '#1E7FA8', grade: 'g3', term: 'down', book: '三下', unit: '第 1 单元', playType: 'practice' },
    { id: 'g11', name: '分堆岛',   fruit: 'orange', skill: '除数是一位数的除法', kinds: ['div1'],       max: 0, c1: '#FFE4C0', c2: '#FFAE4D', shadow: '#C97A0A', grade: 'g3', term: 'down', book: '三下', unit: '第 2 单元', playType: 'practice' },
    { id: 'g12', name: '统计岛',   fruit: 'grape',  skill: '复式统计表',       kinds: ['table'],       max: 0, c1: '#E4D4FF', c2: '#A87BE8', shadow: '#6B3FB5', grade: 'g3', term: 'down', book: '三下', unit: '第 3 单元', playType: 'practice' },
    { id: 'g13', name: '双层岛',   fruit: 'pear',   skill: '两位数乘两位数',   kinds: ['mul2'],        max: 0, c1: '#DCF0C4', c2: '#8ACF60', shadow: '#448A2C', grade: 'g3', term: 'down', book: '三下', unit: '第 4 单元', playType: 'practice' },
    { id: 'g14', name: '地板岛',   fruit: 'melon',  skill: '面积',             kinds: ['area'],        max: 0, c1: '#C6EFD6', c2: '#56C484', shadow: '#2A8452', grade: 'g3', term: 'down', book: '三下', unit: '第 5 单元', playType: 'practice' },
    { id: 'g15', name: '日历岛',   fruit: 'peach',  skill: '年、月、日',       kinds: ['calendar'],    max: 0, c1: '#FFD8C4', c2: '#FF9268', shadow: '#C9542A', grade: 'g3', term: 'down', book: '三下', unit: '第 6 单元', playType: 'practice' },
    { id: 'g16', name: '小数点岛', fruit: 'berry',  skill: '小数的初步认识',   kinds: ['decimal'],     max: 0, c1: '#FFD4E0', c2: '#FF7FA0', shadow: '#C9405F', grade: 'g3', term: 'down', book: '三下', unit: '第 7 单元', playType: 'challenge' },
    { id: 'g17', name: '搭配岛',   fruit: 'star',   skill: '数学广角·搭配',    kinds: ['combo'],       max: 0, c1: '#CFE8FF', c2: '#6FB8F5', shadow: '#2F7BBF', grade: 'g3', term: 'down', book: '三下', unit: '第 8 单元', playType: 'story' },

    /* ================= 一年级下册 ================= */
    { id: 'a1_1', name: '拼图岛', fruit: 'apple', skill: '认识图形（二）', kinds: ['shape2'], grade: 'g1', term: 'down', unit: '第 1 单元', c1: '#FFD9A0', c2: '#FF9A5C', shadow: '#D96A12', playType: 'practice' },
    { id: 'a1_2', name: '退位岛', fruit: 'orange', skill: '20 以内退位减法', kinds: ['sub20'], grade: 'g1', term: 'down', unit: '第 2 单元', c1: '#FFE9A0', c2: '#FFB33F', shadow: '#D98A00', playType: 'practice' },
    { id: 'a1_3', name: '分类岛', fruit: 'grape', skill: '分类与整理', kinds: ['classify'], grade: 'g1', term: 'down', unit: '第 3 单元', c1: '#E3CCFF', c2: '#B57BF0', shadow: '#7A3FBF', playType: 'practice' },
    { id: 'a1_4', name: '百数岛', fruit: 'banana', skill: '100 以内数的认识', kinds: ['num100'], grade: 'g1', term: 'down', unit: '第 4 单元', c1: '#FFF2A8', c2: '#FFD93D', shadow: '#D9A800', playType: 'practice' },
    { id: 'a1_5', name: '钱币岛', fruit: 'melon', skill: '认识人民币', kinds: ['money'], grade: 'g1', term: 'down', unit: '第 5 单元', c1: '#B8F0A8', c2: '#5BD44B', shadow: '#2F8A24', playType: 'practice' },
    { id: 'a1_6', name: '整十岛', fruit: 'peach', skill: '100 以内加减（一）', kinds: ['add100'], grade: 'g1', term: 'down', unit: '第 6 单元', c1: '#FFD6DE', c2: '#FF8FB8', shadow: '#D9507F', playType: 'practice' },
    { id: 'a1_7', name: '找规律岛', fruit: 'berry', skill: '找规律', kinds: ['pattern'], grade: 'g1', term: 'down', unit: '第 7 单元', c1: '#FFC8D8', c2: '#FF6B8F', shadow: '#C93E62', playType: 'practice' },

    /* ================= 二年级上册 ================= */
    { id: 'a2_1', name: '厘米岛', fruit: 'apple', skill: '长度单位', kinds: ['length'], grade: 'g2', term: 'up', unit: '第 1 单元', c1: '#D0F0FF', c2: '#5FC3F0', shadow: '#1E7FA8', playType: 'practice' },
    { id: 'a2_2', name: '竖式岛', fruit: 'orange', skill: '100 以内加减（二）', kinds: ['add100b'], grade: 'g2', term: 'up', unit: '第 2 单元', c1: '#FFE4C0', c2: '#FFAE4D', shadow: '#C97A0A', playType: 'practice' },
    { id: 'a2_3', name: '角岛', fruit: 'grape', skill: '角的初步认识', kinds: ['angle'], grade: 'g2', term: 'up', unit: '第 3 单元', c1: '#E4D4FF', c2: '#A87BE8', shadow: '#6B3FB5', playType: 'practice' },
    { id: 'a2_4', name: '口诀岛', fruit: 'pear', skill: '表内乘法', kinds: ['multable'], grade: 'g2', term: 'up', unit: '第 4 单元', c1: '#DCF0C4', c2: '#8ACF60', shadow: '#448A2C', playType: 'practice' },
    { id: 'a2_5', name: '镜面岛', fruit: 'melon', skill: '观察物体', kinds: ['observe'], grade: 'g2', term: 'up', unit: '第 5 单元', c1: '#C6EFD6', c2: '#56C484', shadow: '#2A8452', playType: 'practice' },
    { id: 'a2_6', name: '七的口诀岛', fruit: 'peach', skill: '表内乘法（二）', kinds: ['multable2'], grade: 'g2', term: 'up', unit: '第 6 单元', c1: '#FFD8C4', c2: '#FF9268', shadow: '#C9542A', playType: 'practice' },
    { id: 'a2_7', name: '时间岛', fruit: 'berry', skill: '认识时间', kinds: ['clock2'], grade: 'g2', term: 'up', unit: '第 7 单元', c1: '#FFD4E0', c2: '#FF7FA0', shadow: '#C9405F', playType: 'challenge' },
    { id: 'a2_8', name: '搭配岛', fruit: 'star', skill: '数学广角·搭配', kinds: ['combo'], grade: 'g2', term: 'up', unit: '第 8 单元', c1: '#CFE8FF', c2: '#6FB8F5', shadow: '#2F7BBF', playType: 'story' },

    /* ================= 二年级下册 ================= */
    { id: 'b2_1', name: '数据岛', fruit: 'apple', skill: '数据收集整理', kinds: ['classify'], grade: 'g2', term: 'down', unit: '第 1 单元', c1: '#FFD9A0', c2: '#FF9A5C', shadow: '#D96A12', playType: 'practice' },
    { id: 'b2_2', name: '平均分岛', fruit: 'orange', skill: '表内除法（一）', kinds: ['divtable'], grade: 'g2', term: 'down', unit: '第 2 单元', c1: '#FFE9A0', c2: '#FFB33F', shadow: '#D98A00', playType: 'practice' },
    { id: 'b2_3', name: '平移岛', fruit: 'grape', skill: '图形的运动', kinds: ['symmetry'], grade: 'g2', term: 'down', unit: '第 3 单元', c1: '#E3CCFF', c2: '#B57BF0', shadow: '#7A3FBF', playType: 'practice' },
    { id: 'b2_4', name: '除二岛', fruit: 'banana', skill: '表内除法（二）', kinds: ['divtable2'], grade: 'g2', term: 'down', unit: '第 4 单元', c1: '#FFF2A8', c2: '#FFD93D', shadow: '#D9A800', playType: 'practice' },
    { id: 'b2_5', name: '混合岛', fruit: 'melon', skill: '混合运算', kinds: ['mixed'], grade: 'g2', term: 'down', unit: '第 5 单元', c1: '#B8F0A8', c2: '#5BD44B', shadow: '#2F8A24', playType: 'practice' },
    { id: 'b2_6', name: '余数岛', fruit: 'peach', skill: '有余数的除法', kinds: ['remainder'], grade: 'g2', term: 'down', unit: '第 6 单元', c1: '#FFD6DE', c2: '#FF8FB8', shadow: '#D9507F', playType: 'practice' },
    { id: 'b2_7', name: '千数岛', fruit: 'berry', skill: '万以内数的认识', kinds: ['num10000'], grade: 'g2', term: 'down', unit: '第 7 单元', c1: '#FFC8D8', c2: '#FF6B8F', shadow: '#C93E62', playType: 'practice' },
    { id: 'b2_8', name: '克千克岛', fruit: 'star', skill: '克和千克', kinds: ['weight'], grade: 'g2', term: 'down', unit: '第 8 单元', c1: '#C8E8FF', c2: '#6FB8F5', shadow: '#2F7BBF', playType: 'challenge' },

    /* ================= 四年级上册 ================= */
    { id: 'c4_1', name: '大数岛', fruit: 'apple', skill: '大数的认识', kinds: ['bignum'], grade: 'g4', term: 'up', unit: '第 1 单元', c1: '#FFE0B2', c2: '#FFA65C', shadow: '#D2691E', playType: 'practice' },
    { id: 'c4_2', name: '公顷岛', fruit: 'pear', skill: '公顷和平方千米', kinds: ['areaunit'], grade: 'g4', term: 'up', unit: '第 2 单元', c1: '#D7F0C0', c2: '#7FCB5A', shadow: '#3E8A2E', playType: 'practice' },
    { id: 'c4_3', name: '线角岛', fruit: 'banana', skill: '角的度量', kinds: ['angle2'], grade: 'g4', term: 'up', unit: '第 3 单元', c1: '#FFF0B8', c2: '#FFD24D', shadow: '#C99A0A', playType: 'practice' },
    { id: 'c4_4', name: '三位乘两位岛', fruit: 'orange', skill: '三位数乘两位数', kinds: ['mul3'], grade: 'g4', term: 'up', unit: '第 4 单元', c1: '#FFDFC0', c2: '#FFB067', shadow: '#C96A1E', playType: 'practice' },
    { id: 'c4_5', name: '平行岛', fruit: 'peach', skill: '平行四边形和梯形', kinds: ['quad'], grade: 'g4', term: 'up', unit: '第 5 单元', c1: '#FFD8E4', c2: '#FF8FB0', shadow: '#D2527A', playType: 'practice' },
    { id: 'c4_6', name: '除两岛', fruit: 'grape', skill: '除数是两位数的除法', kinds: ['div2'], grade: 'g4', term: 'up', unit: '第 6 单元', c1: '#E0D0FF', c2: '#A87BE8', shadow: '#6B3FB5', playType: 'practice' },
    { id: 'c4_7', name: '统计图岛', fruit: 'melon', skill: '条形统计图', kinds: ['barchart'], grade: 'g4', term: 'up', unit: '第 7 单元', c1: '#C8F0D8', c2: '#5CC98A', shadow: '#2E8A56', playType: 'challenge' },
    { id: 'c4_8', name: '优化岛', fruit: 'berry', skill: '数学广角·优化', kinds: ['optimize'], grade: 'g4', term: 'up', unit: '第 8 单元', c1: '#FFD0D8', c2: '#FF7A96', shadow: '#C9425C', playType: 'story' },

    /* ================= 四年级下册 ================= */
    { id: 'd4_1', name: '四则岛', fruit: 'star', skill: '四则运算', kinds: ['four'], grade: 'g4', term: 'down', unit: '第 1 单元', c1: '#D0F0FF', c2: '#5FC3F0', shadow: '#1E7FA8', playType: 'practice' },
    { id: 'd4_2', name: '观察岛', fruit: 'apple', skill: '观察物体（二）', kinds: ['observe'], grade: 'g4', term: 'down', unit: '第 2 单元', c1: '#FFE4C0', c2: '#FFAE4D', shadow: '#C97A0A', playType: 'practice' },
    { id: 'd4_3', name: '定律岛', fruit: 'orange', skill: '运算定律', kinds: ['law'], grade: 'g4', term: 'down', unit: '第 3 单元', c1: '#E4D4FF', c2: '#A87BE8', shadow: '#6B3FB5', playType: 'practice' },
    { id: 'd4_4', name: '小数岛', fruit: 'grape', skill: '小数的意义和性质', kinds: ['decimal2'], grade: 'g4', term: 'down', unit: '第 4 单元', c1: '#DCF0C4', c2: '#8ACF60', shadow: '#448A2C', playType: 'practice' },
    { id: 'd4_5', name: '三角岛', fruit: 'pear', skill: '三角形', kinds: ['triangle'], grade: 'g4', term: 'down', unit: '第 5 单元', c1: '#C6EFD6', c2: '#56C484', shadow: '#2A8452', playType: 'practice' },
    { id: 'd4_6', name: '小数加减岛', fruit: 'melon', skill: '小数的加法和减法', kinds: ['decimaladd'], grade: 'g4', term: 'down', unit: '第 6 单元', c1: '#FFD8C4', c2: '#FF9268', shadow: '#C9542A', playType: 'practice' },
    { id: 'd4_7', name: '对称岛', fruit: 'peach', skill: '图形的运动（二）', kinds: ['symmetry2'], grade: 'g4', term: 'down', unit: '第 7 单元', c1: '#FFD4E0', c2: '#FF7FA0', shadow: '#C9405F', playType: 'practice' },
    { id: 'd4_8', name: '平均数岛', fruit: 'berry', skill: '平均数与条形统计图', kinds: ['average'], grade: 'g4', term: 'down', unit: '第 8 单元', c1: '#CFE8FF', c2: '#6FB8F5', shadow: '#2F7BBF', playType: 'challenge' },

    /* ================= 五年级上册 ================= */
    { id: 'e5_1', name: '小数乘岛', fruit: 'apple', skill: '小数乘法', kinds: ['decmul'], grade: 'g5', term: 'up', unit: '第 1 单元', c1: '#FFD9A0', c2: '#FF9A5C', shadow: '#D96A12', playType: 'practice' },
    { id: 'e5_2', name: '位置岛', fruit: 'orange', skill: '位置', kinds: ['coords'], grade: 'g5', term: 'up', unit: '第 2 单元', c1: '#FFE9A0', c2: '#FFB33F', shadow: '#D98A00', playType: 'practice' },
    { id: 'e5_3', name: '小数除岛', fruit: 'grape', skill: '小数除法', kinds: ['decdiv'], grade: 'g5', term: 'up', unit: '第 3 单元', c1: '#E3CCFF', c2: '#B57BF0', shadow: '#7A3FBF', playType: 'practice' },
    { id: 'e5_4', name: '可能性岛', fruit: 'banana', skill: '可能性', kinds: ['chance'], grade: 'g5', term: 'up', unit: '第 4 单元', c1: '#FFF2A8', c2: '#FFD93D', shadow: '#D9A800', playType: 'practice' },
    { id: 'e5_5', name: '方程岛', fruit: 'melon', skill: '简易方程', kinds: ['equation'], grade: 'g5', term: 'up', unit: '第 5 单元', c1: '#B8F0A8', c2: '#5BD44B', shadow: '#2F8A24', playType: 'practice' },
    { id: 'e5_6', name: '多边形岛', fruit: 'peach', skill: '多边形的面积', kinds: ['polyarea'], grade: 'g5', term: 'up', unit: '第 6 单元', c1: '#FFD6DE', c2: '#FF8FB8', shadow: '#D9507F', playType: 'challenge' },
    { id: 'e5_7', name: '植树岛', fruit: 'berry', skill: '数学广角·植树问题', kinds: ['planting'], grade: 'g5', term: 'up', unit: '第 7 单元', c1: '#FFC8D8', c2: '#FF6B8F', shadow: '#C93E62', playType: 'story' },

    /* ================= 五年级下册 ================= */
    { id: 'f5_1', name: '观察物体岛', fruit: 'star', skill: '观察物体（三）', kinds: ['observe'], grade: 'g5', term: 'down', unit: '第 1 单元', c1: '#D0F0FF', c2: '#5FC3F0', shadow: '#1E7FA8', playType: 'practice' },
    { id: 'f5_2', name: '因数岛', fruit: 'apple', skill: '因数与倍数', kinds: ['factor'], grade: 'g5', term: 'down', unit: '第 2 单元', c1: '#FFE4C0', c2: '#FFAE4D', shadow: '#C97A0A', playType: 'practice' },
    { id: 'f5_3', name: '长方体岛', fruit: 'orange', skill: '长方体和正方体', kinds: ['cuboid'], grade: 'g5', term: 'down', unit: '第 3 单元', c1: '#E4D4FF', c2: '#A87BE8', shadow: '#6B3FB5', playType: 'practice' },
    { id: 'f5_4', name: '分数意义岛', fruit: 'grape', skill: '分数的意义和性质', kinds: ['frac2'], grade: 'g5', term: 'down', unit: '第 4 单元', c1: '#DCF0C4', c2: '#8ACF60', shadow: '#448A2C', playType: 'practice' },
    { id: 'f5_5', name: '分数加减岛', fruit: 'pear', skill: '分数的加法和减法', kinds: ['fracadd'], grade: 'g5', term: 'down', unit: '第 5 单元', c1: '#C6EFD6', c2: '#56C484', shadow: '#2A8452', playType: 'practice' },
    { id: 'f5_6', name: '旋转岛', fruit: 'melon', skill: '图形的运动（三）', kinds: ['rotation'], grade: 'g5', term: 'down', unit: '第 6 单元', c1: '#FFD8C4', c2: '#FF9268', shadow: '#C9542A', playType: 'practice' },
    { id: 'f5_7', name: '折线岛', fruit: 'peach', skill: '折线统计图', kinds: ['linechart'], grade: 'g5', term: 'down', unit: '第 7 单元', c1: '#FFD4E0', c2: '#FF7FA0', shadow: '#C9405F', playType: 'challenge' },
    { id: 'f5_8', name: '找次品岛', fruit: 'berry', skill: '数学广角·找次品', kinds: ['weigh'], grade: 'g5', term: 'down', unit: '第 8 单元', c1: '#CFE8FF', c2: '#6FB8F5', shadow: '#2F7BBF', playType: 'story' },

    /* ================= 六年级上册 ================= */
    { id: 'g6_1', name: '分数乘岛', fruit: 'apple', skill: '分数乘法', kinds: ['fracmul'], grade: 'g6', term: 'up', unit: '第 1 单元', c1: '#FFD9A0', c2: '#FF9A5C', shadow: '#D96A12', playType: 'practice' },
    { id: 'g6_2', name: '位置方向岛', fruit: 'orange', skill: '位置与方向（二）', kinds: ['bearing'], grade: 'g6', term: 'up', unit: '第 2 单元', c1: '#FFE9A0', c2: '#FFB33F', shadow: '#D98A00', playType: 'practice' },
    { id: 'g6_3', name: '分数除岛', fruit: 'grape', skill: '分数除法', kinds: ['fracdiv'], grade: 'g6', term: 'up', unit: '第 3 单元', c1: '#E3CCFF', c2: '#B57BF0', shadow: '#7A3FBF', playType: 'practice' },
    { id: 'g6_4', name: '比岛', fruit: 'banana', skill: '比', kinds: ['ratio'], grade: 'g6', term: 'up', unit: '第 4 单元', c1: '#FFF2A8', c2: '#FFD93D', shadow: '#D9A800', playType: 'practice' },
    { id: 'g6_5', name: '圆岛', fruit: 'melon', skill: '圆', kinds: ['circle'], grade: 'g6', term: 'up', unit: '第 5 单元', c1: '#B8F0A8', c2: '#5BD44B', shadow: '#2F8A24', playType: 'practice' },
    { id: 'g6_6', name: '百分数岛', fruit: 'peach', skill: '百分数（一）', kinds: ['percent'], grade: 'g6', term: 'up', unit: '第 6 单元', c1: '#FFD6DE', c2: '#FF8FB8', shadow: '#D9507F', playType: 'practice' },
    { id: 'g6_7', name: '扇形岛', fruit: 'berry', skill: '扇形统计图', kinds: ['piechart'], grade: 'g6', term: 'up', unit: '第 7 单元', c1: '#FFC8D8', c2: '#FF6B8F', shadow: '#C93E62', playType: 'challenge' },
    { id: 'g6_8', name: '数与形岛', fruit: 'star', skill: '数学广角·数与形', kinds: ['numbershape'], grade: 'g6', term: 'up', unit: '第 8 单元', c1: '#C8E8FF', c2: '#6FB8F5', shadow: '#2F7BBF', playType: 'story' },

    /* ================= 六年级下册 ================= */
    { id: 'h6_1', name: '负数岛', fruit: 'apple', skill: '负数', kinds: ['negative'], grade: 'g6', term: 'down', unit: '第 1 单元', c1: '#FFE0B2', c2: '#FFA65C', shadow: '#D2691E', playType: 'practice' },
    { id: 'h6_2', name: '折扣岛', fruit: 'orange', skill: '百分数（二）', kinds: ['percent2'], grade: 'g6', term: 'down', unit: '第 2 单元', c1: '#D7F0C0', c2: '#7FCB5A', shadow: '#3E8A2E', playType: 'practice' },
    { id: 'h6_3', name: '圆柱岛', fruit: 'grape', skill: '圆柱与圆锥', kinds: ['cylinder'], grade: 'g6', term: 'down', unit: '第 3 单元', c1: '#FFF0B8', c2: '#FFD24D', shadow: '#C99A0A', playType: 'practice' },
    { id: 'h6_4', name: '比例岛', fruit: 'pear', skill: '比例', kinds: ['proportion'], grade: 'g6', term: 'down', unit: '第 4 单元', c1: '#FFDFC0', c2: '#FFB067', shadow: '#C96A1E', playType: 'practice' },
    { id: 'h6_5', name: '鸽巢岛', fruit: 'melon', skill: '数学广角·鸽巢问题', kinds: ['pigeon'], grade: 'g6', term: 'down', unit: '第 5 单元', c1: '#FFD8E4', c2: '#FF8FB0', shadow: '#D2527A', playType: 'story' },
  ];


  /* ---------- 按年级/学期组织关卡 ---------- */
  D.levelsOf = function (gradeId, termId) {
    return D.LEVELS.filter(function (l) {
      return (l.grade || 'g1') === gradeId && (l.term || 'up') === termId;
    });
  };

  D.countOf = function (gradeId, termId) { return D.levelsOf(gradeId, termId).length; };

  D.gradeOf = function (id) {
    var f = D.GRADES[0];
    D.GRADES.forEach(function (g) { if (g.id === id) f = g; });
    return f;
  };
  D.termOf = function (id) {
    var f = D.TERMS[0];
    D.TERMS.forEach(function (t) { if (t.id === id) f = t; });
    return f;
  };

  /* 下一个学期（跨年级） */
  D.nextTerm = function (gradeId, termId) {
    if (termId === 'up') return { grade: gradeId, term: 'down' };
    var gi = -1;
    D.GRADES.forEach(function (g, i) { if (g.id === gradeId) gi = i; });
    if (gi >= 0 && gi + 1 < D.GRADES.length) return { grade: D.GRADES[gi + 1].id, term: 'up' };
    return null;
  };

  /* 事件卡 */
  D.EVENTS = [
    { id: 'coin2',  emoji: '💰', title: '金币雨',   desc: '接下来 2 题金币翻倍！' },
    { id: 'hint',   emoji: '🔍', title: '透视眼镜', desc: '接下来 3 题帮你划掉一个错项。' },
    { id: 'heart',  emoji: '💖', title: '爱心补给', desc: '立刻补回一颗心！' },
    { id: 'star',   emoji: '✨', title: '星星祝福', desc: '本局结算额外 +1 星！' },
    { id: 'shield', emoji: '🛡️', title: '护盾',     desc: '下一题答错不扣心！' },
    { id: 'freeze', emoji: '🧊', title: '时间冻结', desc: 'Boss 战多给你 5 秒！' }
  ];

  D.levelOf = function (id) {
    var f = D.LEVELS[0];
    D.LEVELS.forEach(function (l) { if (l.id === id) f = l; });
    return f;
  };

  /* ---------- 工具 ---------- */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  D.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* 干扰项：靠近答案但不重复 */
  function distract(ans, n, min, max) {
    var set = {}; set[ans] = true;
    var out = [];
    var span = Math.max(2, Math.round(max * 0.5));
    var guard = 0;
    while (out.length < n && guard++ < 240) {
      var v = ans + ri(1, span) * (Math.random() < 0.5 ? -1 : 1);
      if (v < min || v > max || set[v]) continue;
      set[v] = true; out.push(v);
    }
    var p = min;
    while (out.length < n && p <= max) { if (!set[p]) { set[p] = true; out.push(p); } p++; }
    return out;
  }

  /* ---------- 四种题型 ---------- */
  function makeCount(lv, diff) {
    /* 低难度也要有足够变化：至少覆盖到 4，再随难度增长 */
    var hi = Math.min(lv.max, Math.max(4, 3 + diff * 2));
    var n = ri(1, Math.max(2, hi));
    return {
      kind: 'count', level: lv.id, fruit: lv.fruit,
      a: n, answer: n,
      options: D.shuffle([n].concat(distract(n, 2, 1, Math.max(6, hi + 2)))),
      prompt: '数一数，有几个？',
      layout: 'count'
    };
  }

  function makeAdd(lv, diff) {
    var hi = diff <= 1 ? lv.max : Math.min(lv.max, 4 + diff * 3);
    var a = ri(1, Math.max(1, hi - 1));
    var b = ri(1, Math.max(1, Math.min(hi - a, hi - 1)));
    var ans = a + b;
    return {
      kind: 'add', level: lv.id, fruit: lv.fruit,
      a: a, b: b, answer: ans,
      options: D.shuffle([ans].concat(distract(ans, 2, 1, Math.max(ans + 3, hi + 2)))),
      prompt: '算一算，一共有几个？',
      layout: 'add'
    };
  }

  function makeSub(lv, diff) {
    var hi = diff <= 1 ? lv.max : Math.min(lv.max, 4 + diff * 3);
    var a = ri(2, Math.max(2, hi));
    var b = ri(1, a - 1);
    var ans = a - b;
    return {
      kind: 'sub', level: lv.id, fruit: lv.fruit,
      a: a, b: b, answer: ans,
      options: D.shuffle([ans].concat(distract(ans, 2, 0, Math.max(a, 6)))),
      prompt: '吃掉 ' + b + ' 个，还剩几个？',
      layout: 'sub'
    };
  }

  function makeCompare(lv, diff) {
    var hi = Math.min(lv.max, 3 + diff * 3);
    var a, b;
    do { a = ri(1, hi); b = ri(1, hi); } while (a === b);
    var big = Math.max(a, b), small = Math.min(a, b);
    var uniq = [big, small], seen = {}; seen[big] = true; seen[small] = true;
    var guard = 0;
    while (uniq.length < 3 && guard++ < 50) {
      var v = ri(1, hi + 2);
      if (!seen[v]) { seen[v] = true; uniq.push(v); }
    }
    return {
      kind: 'compare', level: lv.id, fruit: lv.fruit,
      a: a, b: b, answer: big,
      options: D.shuffle(uniq.slice(0, 3)),
      prompt: '哪一边更多？',
      layout: 'compare'
    };
  }

  var GRADE_KINDS = {};
  ['time','addbig','subbig','measure','times','mul1','perimeter','fraction','venn',
   'direction','div1','table','mul2','area','calendar','decimal','combo',
   'shape2','sub20','classify','num100','money','add100','pattern',
   'pos','solid3d','num20','clock1','carry10','num5','num10',
   'length','add100b','angle','multable','multable2','observe','clock2',
   'divtable','divtable2','symmetry','mixed','remainder','num10000','weight',
   'bignum','areaunit','angle2','mul3','quad','div2','barchart','optimize',
   'four','law','decimal2','triangle','decimaladd','symmetry2','average',
   'decmul','coords','decdiv','chance','equation','polyarea','planting',
   'factor','cuboid','frac2','fracadd','rotation','linechart','weigh',
   'fracmul','bearing','fracdiv','ratio','circle','percent','piechart','numbershape',
   'negative','percent2','cylinder','proportion','pigeon'
  ].forEach(function (k) { GRADE_KINDS[k] = 1; });

  D.makeQuestion = function (levelId, diff) {
    var lv = D.levelOf(levelId);
    diff = Math.max(0, Math.min(3, diff == null ? 1 : diff));
    var kind = pick(lv.kinds);

    /* 三年级单元：交给 Units 模块 */
    if (GRADE_KINDS[kind] && MFI.Units) {
      var q = MFI.Units.make(kind, lv, diff);
      if (q) return q;
    }
    if (kind === 'count') return makeCount(lv, diff);
    if (kind === 'add') return makeAdd(lv, diff);
    if (kind === 'sub') return makeSub(lv, diff);
    return makeCompare(lv, diff);
  };

  /* 一局内的难度分布：前易后难，按「易 2 : 中 5 : 难 3」配比 */
  D.planTiers = function (count, baseTier) {
    baseTier = Math.max(1, Math.min(4, baseTier || 2));
    var easy = Math.max(1, Math.round(count * 0.2));
    var hard = Math.max(1, Math.round(count * 0.3));
    var mid = Math.max(0, count - easy - hard);
    var lo = Math.max(1, baseTier - 1);
    var hi = Math.min(4, baseTier + 1);
    if (hi < baseTier) hi = baseTier;
    var tiers = [];
    var i;
    for (i = 0; i < easy; i++) tiers.push(lo);
    for (i = 0; i < mid; i++) tiers.push(baseTier);
    for (i = 0; i < hard; i++) tiers.push(hi);
    tiers.sort(function (a, b) { return a - b; });
    while (tiers.length < count) tiers.push(baseTier);
    return tiers.slice(0, count);
  };

  /* 同一关内的模式难度：越简单的越靠前，让孩子先摸清规则 */
  var MODE_RANK = {
    /* 认读类最简单 */
    count: 1, shape2: 1, classify: 1, money: 1, length: 1, weight: 1, num100: 1, num10000: 1,
    solid3d: 1, pos: 1, num5: 1, num10: 1, num20: 1, clock1: 1, shape: 1,
    /* 基础运算 */
    add: 2, sub: 2, compare: 2, add100: 2, sub20: 2, multable: 2, divtable: 2,
    addbig: 2, subbig: 2, mul1: 2, div1: 2, mul2: 2, div2: 2, mul3: 2,
    carry10: 2, add100b: 2, remainder: 2, mixed: 2, four: 2,
    /* 概念与应用 */
    time: 3, measure: 3, times: 3, perimeter: 3, area: 3, angle: 3, angle2: 3,
    symmetry: 3, symmetry2: 3, quad: 3, triangle: 3, calendar: 3, pattern: 3,
    bignum: 3, areaunit: 3, decimal: 3, decimal2: 3, decimaladd: 3, average: 3,
    coords: 3, rotation: 3, law: 3, volume: 3,
    /* 综合与抽象 */
    fraction: 4, frac2: 4, fracadd: 4, fracmul: 4, fracdiv: 4, ratio: 4,
    percent: 4, percent2: 4, proportion: 4, circle: 4, cuboid: 4, cylinder: 4,
    equation: 4, factor: 4, chance: 4, negative: 4, polyarea: 4,
    /* 数学广角最难 */
    venn: 5, combo: 5, optimize: 5, planting: 5, weigh: 5, pigeon: 5, numbershape: 5,
    direction: 3, bearing: 4, table: 3, barchart: 3, linechart: 3, piechart: 3
  };

  D.modeRank = function (q) {
    return MODE_RANK[q.kind] || 3;
  };

  /* 排序：先按档位（难度）升序，同档内按模式难度升序 */
  D.sortByDifficulty = function (list) {
    return list.slice().sort(function (a, b) {
      var ta = a.tier || 2, tb = b.tier || 2;
      if (ta !== tb) return ta - tb;
      return D.modeRank(a) - D.modeRank(b);
    });
  };

  /* 一局题量：按梯度出题，同局尽量不重复，不够时允许复用 */
  D.makeRound = function (levelId, count, diff) {
    var baseTier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var tiers = D.planTiers(count, baseTier);
    var out = [], seen = {};

    for (var t = 0; t < tiers.length; t++) {
      var tier = tiers[t];
      var picked = null;
      for (var tryN = 0; tryN < 30; tryN++) {
        var cand = D.makeQuestion(levelId, tier - 1);
        var key = cand.sig || (cand.kind + '|' + cand.a + '|' + (cand.b || '') + '|' + cand.fruit);
        if (seen[key] && tryN < 25) continue;
        seen[key] = true;
        cand.tier = tier;
        picked = cand;
        break;
      }
      if (picked) out.push(picked);
    }

    var guard = 0;
    while (out.length < count && guard++ < count * 20) {
      var q2 = D.makeQuestion(levelId, baseTier - 1);
      q2.tier = baseTier;
      if (out.length) {
        var lastSig = out[out.length - 1].sig || '';
        if (lastSig && lastSig === q2.sig) continue;
      }
      out.push(q2);
    }
    return out.slice(0, count);
  };

  /* 把一局题目按难度升序排（同档内保持原有随机顺序），保证「前易后难」 */
  D.sortByDifficulty = function (list) {
    if (!list || !list.length) return list || [];
    return list.slice().sort(function (a, b) {
      var ta = a.tier || 1, tb = b.tier || 1;
      return ta - tb;
    });
  };

  window.MFI = window.MFI || {};
  MFI.Data = D;
})();
