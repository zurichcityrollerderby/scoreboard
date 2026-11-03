const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function display(fields) {
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, { hidden: false, textContent: '' });
    return elements.get(selector);
  }
  const state = {};
  for (const [field, value] of Object.entries(fields)) state['ScoreBoard.CurrentGame.' + field] = value;
  let render;
  const context = {
    document: {
      body: { dataset: { display: 'scoreboard' } },
      getElementById: element,
      querySelectorAll(selector) {
        if (selector === '.inter-score .name' || selector === '.inter-score strong') {
          return [element(selector + '1'), element(selector + '2')];
        }
        if (['.inter-subtitle', '.inter-content h2', '.bar-status'].includes(selector)) return [element(selector)];
        return [];
      }
    },
    window: { addEventListener() {} },
    WS: {
      state,
      Register() {},
      AfterLoad(callback) { render = callback; }
    },
    _include() {},
    _getUrlParam() {},
    isTrue: value => value === true || value === 'true',
    _timeConversions: { msToMinSec: () => '0:00' },
    setInterval() {}
  };
  element('intermission').querySelectorAll = context.document.querySelectorAll;
  vm.runInNewContext(fs.readFileSync('html/views/halloween/theme.js', 'utf8'), context);
  render();
  return { element };
}

const secondHalf = {
  'Clock(Period).Number': 2,
  'Clock(Intermission).Number': 2,
  'Rule(Period.Number)': 2,
  OfficialScore: false
};

for (const clock of ['Jam', 'Lineup', 'Timeout', 'NoClock']) {
  test('second half stays live during ' + clock, () => {
    const fields = { ...secondHalf, ['Clock(' + clock + ').Running']: true, InJam: clock === 'Jam' };
    const view = display(fields);
    assert.equal(view.element('scoreboard').hidden, false);
    assert.equal(view.element('intermission').hidden, true);
  });
}

for (const [number, official, title, subtitle] of [
  [0, false, 'The bout awaits.', 'PreGame'],
  [1, false, "We'll be fright back.", 'Intermission'],
  [2, false, 'Final score.', 'Unofficial'],
  [2, true, 'Final score.', 'Official']
]) {
  test('intermission ' + subtitle, () => {
    const view = display({ ...secondHalf, 'Clock(Intermission).Number': number, 'Clock(Intermission).Running': true, OfficialScore: official });
    assert.equal(view.element('scoreboard').hidden, true);
    assert.equal(view.element('intermission').hidden, false);
    assert.equal(view.element('.inter-content h2').textContent, title);
    assert.equal(view.element('.inter-subtitle').textContent, subtitle);
  });
}

test('official results can retain their clock', () => {
  const view = display({ ...secondHalf, OfficialScore: true, ClockDuringFinalScore: true });
  assert.equal(view.element('intermission').hidden, false);
  assert.equal(view.element('.inter-subtitle').textContent, 'OfficialWithClock');
});

test('a live jam takes priority over a lingering intermission clock', () => {
  const view = display({ ...secondHalf, InJam: true, 'Clock(Intermission).Running': true });
  assert.equal(view.element('scoreboard').hidden, false);
  assert.equal(view.element('intermission').hidden, true);
});
