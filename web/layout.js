// Keep card positions stable while fitting each new deck to the viewport.
const CardLayout = (() => {
  let total = 0, frame = 0;
  function dimensions(count, width, height) {
    const gap = 4;
    let best;
    for (let cols = 2; cols <= Math.min(12, count); cols++) {
      const w = (width - gap * (cols - 1)) / cols;
      if (w < 48) continue;
      const rows = Math.ceil(count / cols);
      const h = Math.min(160, (height - gap * (rows - 1)) / rows);
      const quality = Math.min(w / 95, h / 85);
      if (!best || quality > best.quality) best = { cols, rows, w, h, quality };
    }
    return best || { cols: 2, rows: Math.ceil(count / 2), w: width / 2, h: 44 };
  }
  function fit() {
    if (!document.body.classList.contains('play-focus')) return;
    const board = document.getElementById('board');
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--play-height', height + 'px');
    const room = Math.max(44, height - board.getBoundingClientRect().top - 10);
    if(board.classList.contains('table-board')){board.classList.remove('tiny-cards');return;}
    const d = dimensions(total, board.clientWidth, room);
    board.style.setProperty('--fit-cols', d.cols);
    board.style.setProperty('--fit-height', Math.max(44, Math.floor(d.h)) + 'px');
    board.style.setProperty('--fit-font', Math.max(9, Math.min(15, d.w / 7)) + 'px');
    board.classList.toggle('tiny-cards', d.h < 85 || d.w < 80);
  }
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }
  function enter(count = total) {
    total = count;
    document.body.classList.add('play-focus');
    document.getElementById('focusToggle').textContent = '設定・全体に戻る';
    document.getElementById('focusToggle').setAttribute('aria-pressed', 'true');
    schedule();
  }
  function leave() {
    document.body.classList.remove('play-focus');
    document.getElementById('focusToggle').textContent = 'カードを1画面に表示';
    document.getElementById('focusToggle').setAttribute('aria-pressed', 'false');
  }
  document.getElementById('focusToggle').onclick = () => {
    if (document.body.classList.contains('play-focus')) { leave(); document.getElementById('practice').scrollIntoView({ block: 'start' }); }
    else enter(total || document.getElementById('board').children.length);
  };
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  return { enter, finish() { leave(); requestAnimationFrame(() => document.getElementById('result').scrollIntoView({ block: 'center' })); }, dimensions };
})();
