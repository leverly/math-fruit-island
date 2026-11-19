/* ===== 手绘 SVG 资产库：气球 / 苹果 / 苹果核 / 礼物 / 糖果 / 小狮子 / 特效 =====
   全部为内联 SVG，多层渐变 + 高光 + 柔影，追求参考图那种立体质感。 */
(function () {
  var A = {};
  var _uid = 0;
  function uid(p) { return p + (++_uid); }

  /* 让同一页内多个实例的渐变 id 不冲突 */
  function svg(inner, w, h, cls) {
    return '<svg class="art ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h +
      '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>';
  }

  /* ---------------- 通用水果（含各自的配色与形状） ---------------- */
  A.fruit = function (kind) {
    var K = kind || 'apple';
    /* 统一 100x114 画布，果身占主体，顶部带梗叶 */
    var pal = {
      apple:  ['#FF8B78', '#F4472F', '#CC1B10', '#9C0E07', '#6E0502', '#54BE2E', '#2A7A18'],
      orange: ['#FFD08A', '#FFA326', '#E8760A', '#C25A00', '#9A4400', '#54BE2E', '#2A7A18'],
      grape:  ['#D8B4F0', '#A55FD8', '#7B32B0', '#5A1D88', '#3E0F62', '#54BE2E', '#2A7A18'],
      banana: ['#FFF6A8', '#FFDF4A', '#E8B41A', '#C08E00', '#946C00', '#54BE2E', '#2A7A18'],
      melon:  ['#B6F08A', '#6FCB3E', '#3F9420', '#2A6C14', '#1A4A0C', '#FF5A5A', '#C42020'],
      peach:  ['#FFD0B4', '#FF9E72', '#E8623C', '#C03E1E', '#8E2A10', '#54BE2E', '#2A7A18'],
      berry:  ['#FF9AA8', '#F0354E', '#C41026', '#94000F', '#6A0008', '#54BE2E', '#2A7A18'],
      pear:   ['#E8F59A', '#BED84A', '#8FAE1E', '#6A850E', '#4A5F00', '#54BE2E', '#2A7A18'],
      star:   ['#FFF3B0', '#FFC82E', '#F08A00', '#C06500', '#8F4700', '#54BE2E', '#2A7A18']
    }[K] || ['#FF8B78', '#F4472F', '#CC1B10', '#9C0E07', '#6E0502', '#54BE2E', '#2A7A18'];

    var g = uid('fr'), gl = uid('fl'), st = uid('fs');

    /* 星星：单独画 */
    if (K === 'star') {
      return svg(
        '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="52%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="100%" stop-color="' + pal[2] + '"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="107" rx="26" ry="5" fill="rgba(70,40,8,.24)"/>' +
        '<path d="M50 12 L62 44 L96 47 L70 69 L78 102 L50 84 L22 102 L30 69 L4 47 L38 44 Z" ' +
          'fill="url(#' + g + ')" stroke="#C97A00" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M50 24 L58 46 L80 48 L63 63 L68 84 L50 73 L32 84 L37 63 L20 48 L42 46 Z" fill="#fff" opacity=".32"/>',
        100, 114, 'art-fruit');
    }

    /* 葡萄：一串圆 */
    if (K === 'grape') {
      var balls = '';
      var pos = [[50, 46], [38, 54], [62, 54], [44, 66], [56, 66], [50, 78], [50, 90], [42, 84], [58, 84]];
      for (var i = 0; i < pos.length; i++) {
        var px = pos[i][0], py = pos[i][1];
        balls += '<circle cx="' + px + '" cy="' + py + '" r="11.5" fill="url(#' + g + ')"/>' +
          '<circle cx="' + (px - 3.5) + '" cy="' + (py - 4) + '" r="3.2" fill="#fff" opacity=".45"/>';
      }
      return svg(
        '<defs><radialGradient id="' + g + '" cx="34%" cy="26%" r="80%">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="34%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="74%" stop-color="' + pal[2] + '"/><stop offset="100%" stop-color="' + pal[4] + '"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + gl + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + pal[5] + '"/><stop offset="100%" stop-color="' + pal[6] + '"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="106" rx="24" ry="5" fill="rgba(60,20,60,.24)"/>' +
        balls +
        '<path d="M50 36 C50 26 51 20 54 14" stroke="' + pal[4] + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M54 20 C64 8 82 9 84 16 C86 25 70 34 56 29 Z" fill="url(#' + gl + ')"/>',
        100, 114, 'art-fruit');
    }

    /* 香蕉：弯月 + 双弧 */
    if (K === 'banana') {
      return svg(
        '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="40%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="100%" stop-color="' + pal[3] + '"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="106" rx="26" ry="5" fill="rgba(70,50,0,.22)"/>' +
        '<path d="M20 34 C22 68 40 92 70 96 C84 98 92 90 90 80 C88 72 78 72 70 74 C50 78 38 62 36 34 Z" ' +
          'fill="url(#' + g + ')" stroke="' + pal[4] + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M30 40 C32 66 46 84 68 90" stroke="#fff" stroke-width="4" fill="none" opacity=".42" stroke-linecap="round"/>' +
        '<path d="M22 32 C19 25 20 19 24 15 C28 20 30 26 30 32 Z" fill="' + pal[4] + '"/>',
        100, 114, 'art-fruit');
    }

    /* 西瓜：三角形切片 */
    if (K === 'melon') {
      return svg(
        '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FF7A7A"/><stop offset="70%" stop-color="#F03B3B"/>' +
          '<stop offset="100%" stop-color="#C81E1E"/></linearGradient>' +
          '<linearGradient id="' + gl + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#7FD85A"/><stop offset="100%" stop-color="#2F8A24"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="106" rx="26" ry="5" fill="rgba(30,60,20,.24)"/>' +
        '<path d="M8 34 C30 30 70 30 92 34 C78 74 60 94 50 98 C40 94 22 74 8 34 Z" fill="url(#' + gl + ')"/>' +
        '<path d="M14 38 C34 34 66 34 86 38 C74 70 58 88 50 92 C42 88 26 70 14 38 Z" fill="url(#' + g + ')"/>' +
        '<g fill="#3A2318">' +
          '<ellipse cx="34" cy="50" rx="2.4" ry="3.4" transform="rotate(-16 34 50)"/>' +
          '<ellipse cx="50" cy="48" rx="2.4" ry="3.4"/>' +
          '<ellipse cx="66" cy="50" rx="2.4" ry="3.4" transform="rotate(16 66 50)"/>' +
          '<ellipse cx="42" cy="64" rx="2.4" ry="3.4" transform="rotate(-12 42 64)"/>' +
          '<ellipse cx="58" cy="64" rx="2.4" ry="3.4" transform="rotate(12 58 64)"/>' +
          '<ellipse cx="50" cy="78" rx="2.4" ry="3.4"/>' +
        '</g>' +
        '<path d="M20 40 C36 37 64 37 80 40" stroke="#fff" stroke-width="2.6" fill="none" opacity=".4"/>',
        100, 114, 'art-fruit');
    }

    /* 草莓 */
    if (K === 'berry') {
      return svg(
        '<defs><radialGradient id="' + g + '" cx="34%" cy="24%" r="82%">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="32%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="72%" stop-color="' + pal[2] + '"/><stop offset="100%" stop-color="' + pal[4] + '"/>' +
        '</radialGradient></defs>' +
        '<ellipse cx="50" cy="107" rx="25" ry="5" fill="rgba(70,10,20,.24)"/>' +
        '<path d="M50 26 C68 26 84 40 82 58 C80 80 62 100 50 104 C38 100 20 80 18 58 C16 40 32 26 50 26 Z" ' +
          'fill="url(#' + g + ')"/>' +
        '<ellipse cx="34" cy="48" rx="9" ry="13" fill="#fff" opacity=".3" transform="rotate(-20 34 48)"/>' +
        '<g fill="#FFE9A8" opacity=".95">' +
          '<ellipse cx="38" cy="46" rx="1.8" ry="2.6"/><ellipse cx="50" cy="42" rx="1.8" ry="2.6"/>' +
          '<ellipse cx="62" cy="46" rx="1.8" ry="2.6"/><ellipse cx="44" cy="58" rx="1.8" ry="2.6"/>' +
          '<ellipse cx="56" cy="58" rx="1.8" ry="2.6"/><ellipse cx="38" cy="68" rx="1.8" ry="2.6"/>' +
          '<ellipse cx="50" cy="70" rx="1.8" ry="2.6"/><ellipse cx="62" cy="68" rx="1.8" ry="2.6"/>' +
          '<ellipse cx="50" cy="84" rx="1.8" ry="2.6"/>' +
        '</g>' +
        '<path d="M50 28 C44 18 32 14 26 18 C33 24 41 27 50 28 Z" fill="#3FA82A"/>' +
        '<path d="M50 28 C56 18 68 14 74 18 C67 24 59 27 50 28 Z" fill="#4FBE38"/>' +
        '<path d="M50 30 C50 22 51 17 53 12" stroke="#2F8A24" stroke-width="4" fill="none" stroke-linecap="round"/>',
        100, 114, 'art-fruit');
    }

    /* 梨 */
    if (K === 'pear') {
      return svg(
        '<defs><radialGradient id="' + g + '" cx="36%" cy="22%" r="84%">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="34%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="74%" stop-color="' + pal[2] + '"/><stop offset="100%" stop-color="' + pal[4] + '"/>' +
        '</radialGradient></defs>' +
        '<ellipse cx="50" cy="107" rx="26" ry="5" fill="rgba(60,70,10,.24)"/>' +
        '<path d="M50 26 C56 26 62 34 64 46 C66 58 82 66 84 82 C86 98 70 108 50 108 ' +
          'C30 108 14 98 16 82 C18 66 34 58 36 46 C38 34 44 26 50 26 Z" fill="url(#' + g + ')"/>' +
        '<ellipse cx="36" cy="60" rx="8" ry="13" fill="#fff" opacity=".34" transform="rotate(-16 36 60)"/>' +
        '<path d="M50 27 C50 18 51 13 54 8" stroke="#6B4A12" stroke-width="4.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M54 14 C64 4 82 5 84 12 C86 21 70 30 56 25 Z" fill="#5AC63A"/>',
        100, 114, 'art-fruit');
    }

    /* 桃 */
    if (K === 'peach') {
      return svg(
        '<defs><radialGradient id="' + g + '" cx="34%" cy="24%" r="82%">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="30%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="70%" stop-color="' + pal[2] + '"/><stop offset="100%" stop-color="' + pal[4] + '"/>' +
        '</radialGradient></defs>' +
        '<ellipse cx="50" cy="107" rx="26" ry="5" fill="rgba(80,30,10,.22)"/>' +
        '<path d="M50 30 C64 20 88 30 88 56 C88 82 68 106 50 106 C32 106 12 82 12 56 C12 30 36 20 50 30 Z" ' +
          'fill="url(#' + g + ')"/>' +
        '<path d="M50 32 C50 52 50 78 50 104" stroke="rgba(190,60,30,.4)" stroke-width="2.6" fill="none"/>' +
        '<ellipse cx="34" cy="52" rx="10" ry="14" fill="#fff" opacity=".3" transform="rotate(-18 34 52)"/>' +
        '<path d="M50 30 C50 22 51 17 54 12" stroke="#6B4A12" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M54 17 C64 7 82 8 84 15 C86 24 70 33 56 28 Z" fill="#5AC63A"/>',
        100, 114, 'art-fruit');
    }

    /* 橘子 / 苹果：圆形果身 + 各自配色 */
    var isOrange = K === 'orange';
    return svg(
      '<defs>' +
        '<radialGradient id="' + g + '" cx="34%" cy="24%" r="82%">' +
          '<stop offset="0" stop-color="' + pal[0] + '"/>' +
          '<stop offset="' + (isOrange ? 30 : 26) + '%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="58%" stop-color="' + pal[2] + '"/>' +
          '<stop offset="84%" stop-color="' + pal[3] + '"/>' +
          '<stop offset="100%" stop-color="' + pal[4] + '"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + gl + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#9DE86A"/><stop offset="55%" stop-color="' + pal[5] + '"/>' +
          '<stop offset="100%" stop-color="' + pal[6] + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<ellipse cx="50" cy="107" rx="29" ry="5.5" fill="rgba(70,20,8,.26)"/>' +
      (isOrange
        /* 橘子：更圆，带表面纹理 */
        ? '<circle cx="50" cy="66" r="41" fill="url(#' + g + ')"/>' +
          '<circle cx="50" cy="66" r="41" fill="none" stroke="rgba(150,70,0,.22)" stroke-width="2" stroke-dasharray="3 5"/>' +
          '<ellipse cx="34" cy="46" rx="13" ry="17" fill="#fff" opacity=".34" transform="rotate(-20 34 46)"/>' +
          '<ellipse cx="30" cy="40" rx="6" ry="9" fill="#fff" opacity=".6" transform="rotate(-20 30 40)"/>' +
          '<path d="M79 44 C86 58 84 76 74 90" stroke="rgba(255,230,180,.5)" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M50 26 C50 18 51 14 53 10" stroke="#8A5A18" stroke-width="4.2" fill="none" stroke-linecap="round"/>' +
          '<path d="M53 15 C63 6 80 7 82 14 C84 23 68 31 55 26 Z" fill="url(#' + gl + ')"/>'
        /* 苹果：心形果身 */
        : '<path d="M50 28 C46 15 33 9 23 16 C11 24 7 43 10 61 C13 81 26 99 40 102 ' +
          'C46 103 49 99 50 94 C51 99 54 103 60 102 C74 99 87 81 90 61 ' +
          'C93 43 89 24 77 16 C67 9 54 15 50 28 Z" fill="url(#' + g + ')"/>' +
          '<path d="M34 96 C42 104 58 104 66 96 C58 100 42 100 34 96 Z" fill="rgba(80,4,0,.5)"/>' +
          '<ellipse cx="33" cy="44" rx="13.5" ry="19" fill="#fff" opacity=".32" transform="rotate(-20 33 44)"/>' +
          '<ellipse cx="29" cy="37" rx="6" ry="9.5" fill="#fff" opacity=".62" transform="rotate(-20 29 37)"/>' +
          '<path d="M79 44 C85 58 82 76 72 90" stroke="rgba(255,180,160,.55)" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M50 30 C50 21 51.5 15 54 9" stroke="#A9723C" stroke-width="4.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M54 15 C64 3 83 4 85 11 C87 20 70 29 56 24 Z" fill="url(#' + gl + ')"/>' +
          '<path d="M57 17 C68 12 78 10 83 11" stroke="rgba(255,255,255,.45)" stroke-width="1.4" fill="none"/>'),
      100, 114, 'art-fruit');
  };

  /* ---------------- 苹果核（减法「吃掉」后） ---------------- */
  A.core = function () {
    var g1 = uid('cr'), g2 = uid('cr2'), g3 = uid('cr3');
    return svg(
      '<defs>' +
        '<linearGradient id="' + g1 + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#D9B478"/><stop offset="22%" stop-color="#FFF3DA"/>' +
          '<stop offset="72%" stop-color="#F6DFB4"/><stop offset="100%" stop-color="#C9A167"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + g2 + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FF6A50"/><stop offset="52%" stop-color="#D8281A"/>' +
          '<stop offset="100%" stop-color="#8C0A04"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + g3 + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F2D8A8"/><stop offset="100%" stop-color="#B08A4E"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<ellipse cx="50" cy="109" rx="24" ry="4.5" fill="rgba(70,20,8,.22)"/>' +
      /* 核身：中间细、两头粗的沙漏轮廓 */
      '<path d="M36 30 C33 30 31 34 31 40 C31 52 38 60 38 68 C38 76 31 82 31 90 ' +
        'C31 98 35 102 50 102 C65 102 69 98 69 90 C69 82 62 76 62 68 ' +
        'C62 60 69 52 69 40 C69 34 67 30 64 30 Z" fill="url(#' + g1 + ')"/>' +
      /* 左侧内阴影 */
      '<path d="M38 34 C35 44 42 54 42 68 C42 82 35 90 36 98" stroke="rgba(150,110,55,.35)" stroke-width="3" fill="none"/>' +
      /* 顶部红皮（带缺口） */
      '<path d="M34 20 C40 13 60 13 66 20 C72 26 72 36 65 38 C58 40 42 40 35 38 C28 36 28 26 34 20 Z" fill="url(#' + g2 + ')"/>' +
      '<path d="M38 22 C44 18 56 18 62 22" stroke="rgba(255,255,255,.45)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      /* 底部红皮 */
      '<path d="M34 94 C40 100 60 100 66 94 C70 98 68 106 62 108 C54 111 46 111 38 108 C32 106 30 98 34 94 Z" fill="url(#' + g2 + ')"/>' +
      /* 果肉纹理（细丝） */
      '<path d="M44 44 C42 54 42 62 45 70" stroke="rgba(170,130,70,.42)" stroke-width="1.6" fill="none"/>' +
      '<path d="M56 44 C58 54 58 62 55 70" stroke="rgba(170,130,70,.42)" stroke-width="1.6" fill="none"/>' +
      /* 籽 */
      '<ellipse cx="50" cy="52" rx="2.8" ry="4.6" fill="#4A2C10" transform="rotate(-12 50 52)"/>' +
      '<ellipse cx="50" cy="66" rx="2.8" ry="4.6" fill="#4A2C10" transform="rotate(12 50 66)"/>' +
      '<ellipse cx="49.2" cy="50.8" rx="1" ry="1.6" fill="#fff" opacity=".5"/>' +
      /* 果柄 */
      '<path d="M50 19 C50 13 51 9 53 5" stroke="#6B3F16" stroke-width="4.2" fill="none" stroke-linecap="round"/>',
      100, 114, 'art-core');
  };

  /* ---------------- 气球数字 ---------------- */
  var BALLOON_COLORS = {
    pink:   ['#FF9AD0', '#F0207E', '#A9004F'],
    green:  ['#A8F07A', '#42B62A', '#1C6E12'],
    blue:   ['#93DAFF', '#1E8FDA', '#0A4E80'],
    purple: ['#D6ACFF', '#9339DA', '#4E1274'],
    orange: ['#FFD08A', '#F08512', '#8F4400'],
    gray:   ['#CFC6DE', '#8B7BA8', '#4E4270']
  };

  A.balloon = function (text, color, opt) {
    opt = opt || {};
    var c = BALLOON_COLORS[color] || BALLOON_COLORS.pink;
    var g = uid('bl');
    var isQ = text === '?';
    var fs = String(text).length > 1 ? 40 : 50;
    return svg(
      '<defs>' +
        '<radialGradient id="' + g + '" cx="33%" cy="22%" r="86%">' +
          '<stop offset="0" stop-color="' + c[0] + '"/>' +
          '<stop offset="34%" stop-color="' + c[1] + '"/>' +
          '<stop offset="100%" stop-color="' + c[2] + '"/>' +
        '</radialGradient>' +
      '</defs>' +
      /* 气球主体 */
      '<path d="M50 6 C26 6 8 26 8 53 C8 80 27 102 50 102 C73 102 92 80 92 53 C92 26 74 6 50 6 Z" fill="url(#' + g + ')"/>' +
      /* 底部收口 */
      '<path d="M43 98 C45 108 47 112 50 116 C53 112 55 108 57 98 Z" fill="' + c[2] + '"/>' +
      /* 打结 */
      '<path d="M50 116 C45 116 43 120 44 124 C45 128 55 128 56 124 C57 120 55 116 50 116 Z" fill="' + c[1] + '"/>' +
      '<path d="M46 118 C48 120 52 120 54 118" stroke="rgba(0,0,0,.22)" stroke-width="1.6" fill="none"/>' +
      /* 主高光 */
      '<ellipse cx="33" cy="38" rx="14" ry="21" fill="#fff" opacity=".38" transform="rotate(-24 33 38)"/>' +
      '<ellipse cx="29" cy="30" rx="6" ry="10" fill="#fff" opacity=".72" transform="rotate(-24 29 30)"/>' +
      /* 边缘反光 */
      '<path d="M78 36 C86 52 85 74 74 90" stroke="rgba(255,255,255,.42)" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      /* 底部反光 */
      '<ellipse cx="50" cy="88" rx="18" ry="7" fill="#fff" opacity=".12"/>' +
      /* 数字 */
      (opt.noText ? '' :
        '<text x="50" y="' + (isQ ? 72 : 70) + '" text-anchor="middle" ' +
        'font-family="inherit" font-size="' + fs + '" font-weight="900" ' +
        'fill="#fff" stroke="rgba(0,0,0,.16)" stroke-width="1.2" paint-order="stroke">' + text + '</text>'),
      100, 130, 'art-balloon');
  };

  /* ---------------- 运算符块 ---------------- */
  A.opChip = function (sym) {
    var g = uid('op');
    var d = {
      '+': 'M50 26 V74 M26 50 H74',
      '−': 'M26 50 H74',
      '=': 'M26 39 H74 M26 61 H74',
      '×': 'M32 32 L68 68 M68 32 L32 68',
      '?': ''
    }[sym] || 'M26 50 H74';
    return svg(
      '<defs>' +
        '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#D07BF7"/><stop offset="48%" stop-color="#A93FE4"/>' +
          '<stop offset="100%" stop-color="#7C1CC0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect x="4" y="4" width="92" height="92" rx="24" fill="url(#' + g + ')"/>' +
      /* 顶面高光 */
      '<rect x="10" y="8" width="80" height="38" rx="20" fill="#fff" opacity=".26"/>' +
      '<rect x="4" y="4" width="92" height="92" rx="24" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="4"/>' +
      '<rect x="6.5" y="6.5" width="87" height="87" rx="22" fill="none" stroke="rgba(60,10,90,.35)" stroke-width="2"/>' +
      (sym === '?'
        ? '<text x="50" y="70" text-anchor="middle" font-family="inherit" font-size="52" font-weight="900" fill="#fff">?</text>'
        : '<path d="' + d + '" stroke="#fff" stroke-width="13" stroke-linecap="round" fill="none"/>') ,
      100, 100, 'art-op');
  };

  /* ---------------- 礼物盒 ---------------- */
  A.gift = function (color) {
    var pal = {
      green: ['#B6F58A', '#5CC93A', '#2C8A16', '#E8FFD6'],
      blue:  ['#9BDCFF', '#2FA0E0', '#0E5F96', '#DFF4FF']
    }[color] || ['#B6F58A', '#5CC93A', '#2C8A16', '#E8FFD6'];
    var gb = uid('gf'), gl = uid('gfl'), rb = uid('gr');
    return svg(
      '<defs>' +
        '<linearGradient id="' + gb + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="' + pal[2] + '"/><stop offset="22%" stop-color="' + pal[1] + '"/>' +
          '<stop offset="62%" stop-color="' + pal[1] + '"/><stop offset="100%" stop-color="' + pal[2] + '"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + gl + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="' + pal[2] + '"/><stop offset="30%" stop-color="' + pal[0] + '"/>' +
          '<stop offset="70%" stop-color="' + pal[0] + '"/><stop offset="100%" stop-color="' + pal[2] + '"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + rb + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="' + pal[3] + '"/><stop offset="50%" stop-color="#FFFFFF"/>' +
          '<stop offset="100%" stop-color="' + pal[3] + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<ellipse cx="50" cy="112" rx="32" ry="5.5" fill="rgba(30,60,20,.24)"/>' +
      /* 盒身 */
      '<rect x="16" y="48" width="68" height="62" rx="6" fill="url(#' + gb + ')"/>' +
      /* 竖向缎带 */
      '<rect x="43" y="48" width="14" height="62" fill="url(#' + rb + ')" opacity=".95"/>' +
      /* 盒盖 */
      '<rect x="10" y="30" width="80" height="24" rx="7" fill="url(#' + gl + ')"/>' +
      '<rect x="10" y="30" width="80" height="24" rx="7" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>' +
      '<rect x="43" y="30" width="14" height="24" fill="url(#' + rb + ')" opacity=".95"/>' +
      /* 蝴蝶结 */
      '<path d="M50 30 C38 18 22 20 26 28 C29 35 42 32 50 30 Z" fill="' + pal[0] + '"/>' +
      '<path d="M50 30 C62 18 78 20 74 28 C71 35 58 32 50 30 Z" fill="' + pal[0] + '"/>' +
      '<path d="M50 30 C40 20 26 22 28 28" stroke="' + pal[2] + '" stroke-width="1.6" fill="none" opacity=".5"/>' +
      '<path d="M50 30 C60 20 74 22 72 28" stroke="' + pal[2] + '" stroke-width="1.6" fill="none" opacity=".5"/>' +
      '<circle cx="50" cy="30" r="5" fill="' + pal[3] + '"/>' +
      '<circle cx="50" cy="30" r="5" fill="none" stroke="' + pal[2] + '" stroke-width="1.2" opacity=".5"/>' +
      /* 高光 */
      '<rect x="22" y="54" width="10" height="48" rx="5" fill="#fff" opacity=".22"/>' +
      '<rect x="16" y="34" width="12" height="14" rx="4" fill="#fff" opacity=".3"/>',
      100, 118, 'art-gift');
  };

  /* ---------------- 糖果答案块 ---------------- */
  var CANDY = {
    pink:   ['#FFB3D8', '#F52C8E', '#A8005C'],
    green:  ['#BCF58C', '#4FC62E', '#1F7412'],
    blue:   ['#A6DEFF', '#2794DD', '#0A5590'],
    purple: ['#DCB4FF', '#9B44E2', '#521480'],
    orange: ['#FFD79A', '#F2921A', '#8F4700']
  };

  A.candy = function (text, color) {
    var c = CANDY[color] || CANDY.pink;
    var g = uid('cd');
    return svg(
      '<defs>' +
        '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + c[0] + '"/>' +
          '<stop offset="46%" stop-color="' + c[1] + '"/>' +
          '<stop offset="100%" stop-color="' + c[2] + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect x="5" y="5" width="90" height="90" rx="22" fill="url(#' + g + ')"/>' +
      /* 顶部玻璃反光 */
      '<path d="M14 30 C14 16 30 11 50 11 C70 11 86 16 86 30 C86 40 70 44 50 44 C30 44 14 40 14 30 Z" fill="#fff" opacity=".3"/>' +
      '<rect x="5" y="5" width="90" height="90" rx="22" fill="none" stroke="#fff" stroke-width="6" opacity=".95"/>' +
      '<rect x="5" y="5" width="90" height="90" rx="22" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="10"/>' +
      '<text x="50" y="72" text-anchor="middle" font-family="inherit" font-size="46" font-weight="900" ' +
        'fill="#fff" stroke="rgba(0,0,0,.14)" stroke-width="1" paint-order="stroke">' + text + '</text>',
      100, 100, 'art-candy');
  };

  /* ---------------- 小狮子 Bobo ---------------- */
  A.lion = function (opt) {
    opt = opt || {};
    var mane = uid('mn'), mane2 = uid('mn2'), body = uid('bd'), shirt = uid('sh'), muz = uid('mz');
    var armUp = opt.thumb !== false;
    return svg(
      '<defs>' +
        '<radialGradient id="' + mane + '" cx="36%" cy="26%" r="78%">' +
          '<stop offset="0" stop-color="#FFC46B"/><stop offset="42%" stop-color="#FF9E2E"/>' +
          '<stop offset="100%" stop-color="#D2620A"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + mane2 + '" cx="40%" cy="30%" r="70%">' +
          '<stop offset="0" stop-color="#FFE0AE"/><stop offset="45%" stop-color="#FFB152"/>' +
          '<stop offset="100%" stop-color="#E27A12"/>' +
        '</radialGradient>' +
        '<radialGradient id="' + body + '" cx="38%" cy="26%" r="78%">' +
          '<stop offset="0" stop-color="#FFD79A"/><stop offset="55%" stop-color="#F9A93C"/>' +
          '<stop offset="100%" stop-color="#CE6C08"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + shirt + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#5B9BF5"/><stop offset="55%" stop-color="#2A6FD8"/>' +
          '<stop offset="100%" stop-color="#17418C"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + muz + '" cx="42%" cy="34%" r="72%">' +
          '<stop offset="0" stop-color="#FFF8EC"/><stop offset="100%" stop-color="#FFDDB8"/>' +
        '</radialGradient>' +
      '</defs>' +
      /* 鬃毛（花瓣状） */
      '<g>' +
        (function () {
          var out = '';
          for (var i = 0; i < 14; i++) {
            var a = (i * 360 / 14) * Math.PI / 180;
            var x = 50 + 30 * Math.cos(a);
            var y = 40 + 29 * Math.sin(a);
            out += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
              '" rx="13" ry="15" fill="url(#' + (i % 2 ? mane : mane2) + ')" ' +
              'transform="rotate(' + (i * 360 / 14).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
          }
          return out;
        })() +
      '</g>' +
      /* 耳朵 */
      '<ellipse cx="27" cy="24" rx="9" ry="9" fill="#F0952A"/>' +
      '<ellipse cx="73" cy="24" rx="9" ry="9" fill="#F0952A"/>' +
      '<ellipse cx="27" cy="24" rx="4.5" ry="4.5" fill="#FFD9B0"/>' +
      '<ellipse cx="73" cy="24" rx="4.5" ry="4.5" fill="#FFD9B0"/>' +
      /* 头 */
      '<ellipse cx="50" cy="42" rx="27" ry="26" fill="url(#' + body + ')"/>' +
      /* 额头高光 */
      '<ellipse cx="40" cy="30" rx="11" ry="8" fill="#fff" opacity=".3" transform="rotate(-18 40 30)"/>' +
      /* 眼白 */
      '<ellipse cx="39" cy="40" rx="8.5" ry="9.5" fill="#fff"/>' +
      '<ellipse cx="61" cy="40" rx="8.5" ry="9.5" fill="#fff"/>' +
      /* 瞳孔 */
      '<circle cx="40" cy="41" r="5.4" fill="#3A2A18"/>' +
      '<circle cx="62" cy="41" r="5.4" fill="#3A2A18"/>' +
      '<circle cx="38.2" cy="38.6" r="2.1" fill="#fff"/>' +
      '<circle cx="60.2" cy="38.6" r="2.1" fill="#fff"/>' +
      /* 腮红 */
      '<ellipse cx="27" cy="50" rx="6.5" ry="4" fill="#FF7B6B" opacity=".42"/>' +
      '<ellipse cx="73" cy="50" rx="6.5" ry="4" fill="#FF7B6B" opacity=".42"/>' +
      /* 口鼻 */
      '<ellipse cx="50" cy="54" rx="15" ry="11.5" fill="url(#' + muz + ')"/>' +
      '<ellipse cx="50" cy="49.5" rx="5.4" ry="3.9" fill="#5A3A22"/>' +
      '<ellipse cx="48.6" cy="48.4" rx="1.7" ry="1.1" fill="#fff" opacity=".55"/>' +
      /* 嘴 */
      '<path d="M50 53 L50 57 M50 57 C46 62 40 60 39 56 M50 57 C54 62 60 60 61 56" ' +
        'stroke="#5A3A22" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      /* 舌头 */
      '<path d="M44 58 C47 63 53 63 56 58 C53 61 47 61 44 58 Z" fill="#FF8A7A"/>' +
      /* 身体（蓝衣服） */
      '<path d="M28 74 C28 68 36 64 50 64 C64 64 72 68 72 74 L74 104 C74 110 66 112 50 112 ' +
        'C34 112 26 110 26 104 Z" fill="url(#' + shirt + ')"/>' +
      /* 衣领 */
      '<path d="M42 66 C46 72 54 72 58 66" stroke="#17418C" stroke-width="3" fill="none"/>' +
      /* 胸前徽章 */
      '<path d="M50 80 L53 88 L61 88 L55 93 L57 101 L50 96 L43 101 L45 93 L39 88 L47 88 Z" ' +
        'fill="#FFD23F" stroke="#C98A00" stroke-width="1.2"/>' +
      /* 左手（竖大拇指，从身侧伸出，不挡脸） */
      (armUp
        ? '<path d="M29 84 C20 86 14 92 15 99 C16 104 24 104 26 99 L30 88 Z" fill="#F0952A"/>' +
          '<ellipse cx="17" cy="92" rx="7.5" ry="8.5" fill="#FFC98A"/>' +
          '<path d="M13 86 L12 78 C11.5 74.5 17 73.5 17.5 77 L19 86 Z" fill="#FFC98A"/>' +
          '<path d="M13.5 85 C13 82 18 81.5 18.5 84.5" fill="#FFE0BC"/>'
        : '<path d="M29 84 C21 86 18 92 20 98 L31 96 Z" fill="#F0952A"/>') +
      /* 右手 */
      '<path d="M72 84 C79 86 82 92 80 98 L70 96 Z" fill="#F0952A"/>' +
      /* 脚 */
      '<ellipse cx="40" cy="112" rx="11" ry="6" fill="#E5841E"/>' +
      '<ellipse cx="60" cy="112" rx="11" ry="6" fill="#E5841E"/>',
      100, 120, 'art-lion');
  };

  /* ---------------- 勋章 ---------------- */
  var TIER = {
    bronze:  { d: '#8A4B12', m: '#D98A2B', l: '#FFC987', rim: '#5E2E06' },
    silver:  { d: '#5B6472', m: '#AEB8C6', l: '#EEF3F9', rim: '#3A4250' },
    gold:    { d: '#8F6100', m: '#F0B21B', l: '#FFE98A', rim: '#6B4700' },
    rainbow: { d: '#7B2FA8', m: '#C15FE0', l: '#B9F0FF', rim: '#4E1274' }
  };

  function badgeIcon(kind) {
    switch (kind) {
      case 'flame':
        return '<path d="M50 20 C58 36 74 42 72 60 C70 78 60 88 50 88 C40 88 30 78 28 60 C26 46 38 42 42 32 C46 42 46 50 50 54 C56 46 50 32 50 20 Z" fill="#fff" opacity=".95"/>' +
               '<path d="M50 52 C54 62 60 66 58 74 C56 82 52 84 50 84 C48 84 44 82 42 74 C40 66 46 62 50 52 Z" fill="rgba(255,255,255,.5)"/>';
      case 'week':
        return '<rect x="26" y="30" width="48" height="44" rx="7" fill="#fff" opacity=".95"/>' +
               '<rect x="26" y="30" width="48" height="12" rx="6" fill="rgba(0,0,0,.18)"/>' +
               '<path d="M38 56 L46 66 L64 46" stroke="rgba(60,40,10,.75)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'moon':
        return '<path d="M62 26 C46 30 34 42 34 58 C34 74 46 84 60 84 C52 78 48 70 48 58 C48 44 54 34 62 26 Z" fill="#fff" opacity=".95"/>' +
               '<circle cx="70" cy="38" r="3.4" fill="#fff" opacity=".8"/>' +
               '<circle cx="76" cy="52" r="2.2" fill="#fff" opacity=".65"/>';
      case 'crown':
        return '<path d="M26 66 L24 34 L38 46 L50 28 L62 46 L76 34 L74 66 Z" fill="#fff" opacity=".95"/>' +
               '<rect x="26" y="66" width="48" height="8" rx="3" fill="rgba(0,0,0,.2)"/>' +
               '<circle cx="50" cy="45" r="4" fill="rgba(200,120,0,.6)"/>';
      case 'gem':
        return '<path d="M50 24 L72 42 L62 78 L38 78 L28 42 Z" fill="#fff" opacity=".95"/>' +
               '<path d="M50 24 L62 78 L38 78 Z" fill="rgba(255,255,255,.45)"/>' +
               '<path d="M28 42 L72 42" stroke="rgba(90,20,120,.35)" stroke-width="2.5"/>';
      case 'star':
        return '<path d="M50 24 L58 48 L84 50 L64 65 L70 88 L50 75 L30 88 L36 65 L16 50 L42 48 Z" fill="#fff" opacity=".95"/>';
      case 'flag':
        return '<path d="M34 24 L34 84" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".95"/>' +
               '<path d="M36 27 L72 36 L36 50 Z" fill="#fff" opacity=".95"/>';
      case 'medal':
        return '<circle cx="50" cy="52" r="24" fill="#fff" opacity=".95"/>' +
               '<path d="M50 38 L55 48 L66 49 L58 57 L60 68 L50 63 L40 68 L42 57 L34 49 L45 48 Z" fill="rgba(90,60,10,.55)"/>' +
               '<path d="M38 26 L44 44 M62 26 L56 44" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>';
      case 'trophy':
        return '<path d="M34 28 L66 28 L64 52 C62 66 54 72 50 72 C46 72 38 66 36 52 Z" fill="#fff" opacity=".95"/>' +
               '<path d="M34 32 C24 32 22 46 34 50 M66 32 C76 32 78 46 66 50" stroke="#fff" stroke-width="5" fill="none" opacity=".85"/>' +
               '<rect x="42" y="72" width="16" height="8" rx="3" fill="#fff" opacity=".95"/>' +
               '<rect x="34" y="80" width="32" height="7" rx="3.5" fill="#fff" opacity=".95"/>';
      case 'leaf':
        return '<path d="M68 26 C44 30 30 46 32 66 C50 70 68 56 68 26 Z" fill="#fff" opacity=".95"/>' +
               '<path d="M36 64 C46 54 56 44 66 30" stroke="rgba(30,90,20,.5)" stroke-width="3.5" fill="none"/>';
      case 'path':
        return '<path d="M34 80 C34 60 46 56 50 46 C54 36 44 32 62 26" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>' +
               '<circle cx="62" cy="26" r="6" fill="#fff"/>';
      case 'gate':
        return '<path d="M32 80 L32 46 C32 32 68 32 68 46 L68 80" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".95"/>' +
               '<path d="M42 80 L42 60 C42 52 58 52 58 60 L58 80" fill="#fff" opacity=".95"/>';
      case 'bolt':
        return '<path d="M56 22 L34 56 L48 56 L42 82 L68 44 L52 44 Z" fill="#fff" opacity=".95"/>';
      case 'diamond':
        return '<path d="M50 22 L74 42 L50 82 L26 42 Z" fill="#fff" opacity=".95"/>' +
               '<path d="M50 22 L62 42 L50 82 L38 42 Z" fill="rgba(255,255,255,.5)"/>' +
               '<path d="M26 42 L74 42" stroke="rgba(90,20,120,.3)" stroke-width="2.5"/>';
      default:
        return '<circle cx="50" cy="52" r="20" fill="#fff" opacity=".95"/>';
    }
  }

  A.badge = function (id, locked) {
    var B = (window.MFI && MFI.Badges) ? MFI.Badges : null;
    var def = (B && B.BY_ID && B.BY_ID[id]) || { icon: 'star', tier: 'bronze' };
    var t = TIER[def.tier] || TIER.bronze;
    var gid = uid('bd'), gd = uid('bdd'), gs = uid('bds');
    var c1 = locked ? '#D6D0E2' : t.l;
    var c2 = locked ? '#B0A8C2' : t.m;
    var c3 = locked ? '#8F87A3' : t.d;
    var rim = locked ? '#6E6683' : t.rim;
    var teeth = '';
    if (!locked) {
      for (var i = 0; i < 16; i++) {
        var a = i * 22.5 * Math.PI / 180;
        teeth += '<circle cx="' + (50 + 37 * Math.cos(a)).toFixed(1) + '" cy="' +
          (50 + 37 * Math.sin(a)).toFixed(1) + '" r="5.2" fill="url(#' + gid + ')" stroke="' + rim + '" stroke-width="1.5"/>';
      }
    }
    return svg(
      '<defs>' +
        '<radialGradient id="' + gid + '" cx="34%" cy="26%" r="82%">' +
          '<stop offset="0" stop-color="' + c1 + '"/>' +
          '<stop offset="46%" stop-color="' + c2 + '"/>' +
          '<stop offset="100%" stop-color="' + c3 + '"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + gs + '" x1="0" y1="0" x2="0.4" y2="1">' +
          '<stop offset="0" stop-color="#fff" stop-opacity=".5"/>' +
          '<stop offset="58%" stop-color="#fff" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<radialGradient id="' + gd + '" cx="40%" cy="32%" r="72%">' +
          '<stop offset="0" stop-color="rgba(0,0,0,.16)"/>' +
          '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>' +
        '</radialGradient>' +
      '</defs>' +
      teeth +
      '<circle cx="50" cy="50" r="37" fill="url(#' + gid + ')" stroke="' + rim + '" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="30.5" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/>' +
      '<g' + (locked ? ' opacity=".5"' : '') + '>' + badgeIcon(def.icon) + '</g>' +
      '<circle cx="50" cy="50" r="37" fill="url(#' + gs + ')"/>' +
      '<ellipse cx="36" cy="30" rx="12" ry="8.5" fill="#fff" opacity="' + (locked ? '.16' : '.4') + '" transform="rotate(-24 36 30)"/>' +
      '<circle cx="50" cy="50" r="37" fill="url(#' + gd + ')"/>' +
      (locked
        ? '<circle cx="75" cy="75" r="14.5" fill="rgba(48,40,66,.88)"/>' +
          '<rect x="68.4" y="73.6" width="13.2" height="10.4" rx="2.6" fill="#fff"/>' +
          '<path d="M71.6 73.6 L71.6 70 C71.6 66.2 78.4 66.2 78.4 70 L78.4 73.6" stroke="#fff" stroke-width="2.2" fill="none"/>'
        : ''),
      100, 100, 'art art-badge');
  };

  /* ---------------- 云 ---------------- */
  A.cloud = function (op) {
    return '<svg class="art art-cloud" viewBox="0 0 120 60" style="opacity:' + (op || .9) + '">' +
      '<ellipse cx="38" cy="40" rx="30" ry="18" fill="#fff"/>' +
      '<ellipse cx="66" cy="32" rx="26" ry="20" fill="#fff"/>' +
      '<ellipse cx="92" cy="42" rx="22" ry="15" fill="#fff"/>' +
      '<ellipse cx="60" cy="46" rx="42" ry="13" fill="#fff"/>' +
      '</svg>';
  };

  window.MFI = window.MFI || {};
  MFI.Art = A;
})();
