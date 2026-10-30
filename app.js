const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// HTML 폼의 값을 req.body에서 읽을 수 있게 합니다.
app.use(express.urlencoded({ extended: false, limit: '2kb' }));
app.use(session({
  name: 'mission404.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const stageNames = ['보관소', '원소 기록', '물성 분석', '정답 입력'];

function page({ title, section, content, tone = '', step = 0 }) {
  const progress = step > 0 ? `
        <div class="progress-panel" aria-label="전체 4단계 중 ${step}단계입니다">
          <div class="progress-heading"><span>MISSION PROGRESS</span><span>${step} / 4</span></div>
          <div class="progress-track">${stageNames.map((name, index) => `<span class="progress-step ${index < step - 1 ? 'is-complete' : ''} ${index === step - 1 ? 'is-active' : ''}" aria-label="${name} ${index < step - 1 ? '완료' : index === step - 1 ? '진행 중' : '대기'}"></span>`).join('')}</div>
          <div class="progress-labels">${stageNames.map((name) => `<span>${name}</span>`).join('')}</div>
        </div>` : `
        <div class="progress-panel" aria-label="전체 4단계 게임입니다">
          <div class="progress-heading"><span>MISSION PROGRESS</span><span>시작 전 / 4</span></div>
          <div class="progress-track">${stageNames.map(() => '<span class="progress-step"></span>').join('')}</div>
          <div class="progress-labels">${stageNames.map((name) => `<span>${name}</span>`).join('')}</div>
        </div>`;
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#080d0f">
    <title>${title} | MISSION 404</title>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <main class="screen ${tone}">
      <header class="topbar">
        <span class="wordmark" aria-label="MISSION 404">M<span>:</span>404</span>
        <div class="connection"><span class="status-dot"></span> 내부망 연결됨</div>
      </header>
      <section class="content" aria-labelledby="page-title">
        <p class="eyebrow">연구 구역 · 보안 등급 04</p>
        ${progress}
        ${section ? `<p class="section-tag">${section}</p>` : ''}
        <h1 id="page-title">${title}</h1>
        ${content}
      </section>
      <footer class="footer"><span>RESEARCH SYSTEMS / NODE 04</span><span>SIMULATION ONLY</span></footer>
    </main>
  </body>
</html>`;
}

function recordCard(label, value) {
  return `<div class="data-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function routeCard(route, explanation) {
  return `<div class="route-card"><div class="route-heading">다음 위치 단서</div><code>${route}</code><p>${explanation}</p></div>`;
}

function answerForm() {
  return `<form class="answer-form" action="/terminal" method="post">
    <label for="answer">원소 이름 또는 기호</label>
    <div class="form-row">
      <input id="answer" name="answer" type="text" maxlength="40" autocomplete="off" placeholder="원소 이름 또는 기호를 입력하십시오" required>
      <button type="submit">정답 제출 <span aria-hidden="true">→</span></button>
    </div>
  </form>`;
}

// 게임 데이터는 여기에서 수정합니다. 화면에는 원소 기호를 출력하지 않습니다.
const elements = [
  {
    id: 'carbon', name: '탄소', aliases: ['탄소', 'carbon', 'c'], atomicNumber: 6, period: 2, group: 14,
    mass: '12.011', classification: '비금속',
    clues: ['흑연과 다이아몬드는 이 원소로 이루어진 서로 다른 형태입니다.', '연필심과 보석에서 서로 다른 모습을 볼 수 있습니다.'],
    hint: '다이아몬드와 연필심의 주요 성분이 같은 원소입니다.'
  },
  {
    id: 'oxygen', name: '산소', aliases: ['산소', 'oxygen', 'o'], atomicNumber: 8, period: 2, group: 16,
    mass: '15.999', classification: '비금속',
    clues: ['지구 대기 부피의 약 21%를 차지하는 기체입니다.', '생물이 호흡할 때 중요한 역할을 합니다.'],
    hint: '공기 중에 약 다섯 분의 일 정도 들어 있는 기체입니다.'
  },
  {
    id: 'neon', name: '네온', aliases: ['네온', 'neon', 'ne'], atomicNumber: 10, period: 2, group: 18,
    mass: '20.180', classification: '비활성 기체',
    clues: ['방전관에서 붉은 주황색 빛을 낼 수 있습니다.', '광고용 조명에 사용되는 것으로 잘 알려져 있습니다.'],
    hint: '붉은빛이 나는 간판의 이름과 같은 원소입니다.'
  },
  {
    id: 'sodium', name: '나트륨', aliases: ['나트륨', '소듐', 'sodium', 'na'], atomicNumber: 11, period: 3, group: 1,
    mass: '22.990', classification: '알칼리 금속',
    clues: ['부드러운 은백색 금속이며 공기와 물에 반응성이 큽니다.', '소금과 가로등의 노란빛을 떠올리게 하는 원소입니다.'],
    hint: '물과 격렬하게 반응하므로 금속 상태로 보관할 때 주의가 필요한 원소입니다.'
  },
  {
    id: 'aluminium', name: '알루미늄', aliases: ['알루미늄', 'aluminium', 'aluminum', 'al'], atomicNumber: 13, period: 3, group: 13,
    mass: '26.982', classification: '금속',
    clues: ['가볍고 은백색이며 표면의 얇은 산화층이 부식을 늦춥니다.', '음료 캔, 포일, 항공기 부품에 널리 사용됩니다.'],
    hint: '가벼운 캔과 항공기 동체에 널리 쓰이는 금속입니다.'
  },
  {
    id: 'silicon', name: '규소', aliases: ['규소', '실리콘', 'silicon', 'si'], atomicNumber: 14, period: 3, group: 14,
    mass: '28.085', classification: '준금속',
    clues: ['컴퓨터의 반도체 소자에 널리 사용됩니다.', '모래와 많은 암석에 화합물 형태로 들어 있습니다.'],
    hint: '반도체와 모래의 주성분이라는 단서가 함께 가리킵니다.'
  },
  {
    id: 'iron', name: '철', aliases: ['철', 'iron', 'fe'], atomicNumber: 26, period: 4, group: 8,
    mass: '55.845', classification: '전이 금속',
    clues: ['습한 공기에 오래 노출되면 녹이 생기는 회색 금속입니다.', '강철과 여러 자성 재료를 만드는 데 널리 쓰입니다.'],
    hint: '산소와 물의 영향을 받아 붉은 녹이 생기기 쉽습니다.'
  },
  {
    id: 'copper', name: '구리', aliases: ['구리', 'copper', 'cu'], atomicNumber: 29, period: 4, group: 11,
    mass: '63.546', classification: '전이 금속',
    clues: ['붉은빛이 도는 금속이며 전기 전도성이 매우 높습니다.', '전선과 회로 연결부에 널리 쓰이며 표면에 녹청이 생길 수 있습니다.'],
    hint: '고대 키프로스섬의 라틴어 이름에서 원소 이름이 유래했습니다.'
  },
  {
    id: 'silver', name: '은', aliases: ['은', 'silver', 'ag'], atomicNumber: 47, period: 5, group: 11,
    mass: '107.868', classification: '전이 금속',
    clues: ['모든 금속 가운데 전기 전도성이 가장 높은 것으로 알려져 있습니다.', '빛나는 흰색 금속이며 황 화합물에 노출되면 검게 변색될 수 있습니다.'],
    hint: '거울과 장신구에 쓰이며 시간이 지나면 표면이 어두워질 수 있습니다.'
  }
];

function pickNewQuestion(req) {
  const candidates = elements.filter((element) => element.id !== req.session.lastQuestionId);
  const pool = candidates.length > 0 ? candidates : elements;
  const element = pool[Math.floor(Math.random() * pool.length)];
  req.session.currentQuestionId = element.id;
  return element;
}

function getCurrentQuestion(req, res) {
  const element = elements.find((item) => item.id === req.session.currentQuestionId);
  if (!element) {
    res.redirect('/');
    return null;
  }
  return element;
}

function localRoute(req, pathname) {
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}${pathname}`;
}

app.get('/', (req, res) => {
  const assigned = !req.session.currentQuestionId;
  if (assigned) pickNewQuestion(req);

  res.send(page({
    title: '연구 기록 복구 작업에 참여하셨습니다',
    section: assigned ? '새 분석 임무가 배정되었습니다' : '진행 중인 분석 임무입니다',
    step: 0,
    content: `
      <p class="intro">시스템 오류로 연구 기록 일부가 손상되었습니다. 남아 있는 단서를 따라가 마지막 실험에 사용된 원소를 찾아내십시오.</p>
      <div class="case-card">
        <div class="case-heading"><span>CASE FILE</span><span>404-A</span></div>
        <p>이번 임무의 시료 정보는 기록 보관소에서 확인할 수 있습니다.</p>
        <div class="case-meta"><span>상태 <b>기록 손상</b></span><span>기록 시각 <b>02:17:44</b></span></div>
      </div>
      ${routeCard(localRoute(req, '/archive'), '브라우저 주소창에 이 경로를 직접 입력하십시오.')}
      <p class="notice">이 게임의 기록과 사건은 연구소 시뮬레이션 안에서 진행됩니다.</p>`
  }));
});

app.get('/archive', (req, res) => {
  const element = getCurrentQuestion(req, res);
  if (!element) return;

  res.send(page({
    title: '기록 보관소',
    section: 'ARCHIVE / 손상된 메모 복구됨',
    step: 1,
    content: `
      <p class="intro">서버 캐시에서 종이 기록 한 장이 복구되었습니다. 잉크가 번졌지만 숫자와 다음 기록의 위치는 읽을 수 있습니다.</p>
      <blockquote>복구된 시료 번호는 <strong>${element.atomicNumber}</strong>입니다. 이 번호를 기준으로 원소 카드 기록을 확인하십시오.</blockquote>
      <p class="body-copy">다음 보관실 이름은 기록을 뜻하는 영문 단어입니다. 영문 위치 단서를 웹 주소 경로로 바꾸어 입력하십시오.</p>
      ${routeCard(localRoute(req, '/records'), '브라우저 주소창에 이 경로를 직접 입력하십시오.')}
      <p class="notice">복구 기록 1 / 3 · 일부 문자는 손상되었을 수 있습니다.</p>`
  }));
});

app.get('/records', (req, res) => {
  const element = getCurrentQuestion(req, res);
  if (!element) return;

  res.send(page({
    title: '원소 카드 기록',
    section: `RECORDS / 원자번호 ${element.atomicNumber}`,
    step: 2,
    content: `
      <p class="intro">원소 카드의 데이터가 복원되었습니다. 주기율표에서 위치와 분류를 확인하십시오.</p>
      <div class="data-card">
        ${recordCard('원자번호', element.atomicNumber)}
        ${recordCard('주기 / 족', `${element.period}주기 / ${element.group}족`)}
        ${recordCard('상대 원자량', `${element.mass} u`)}
        ${recordCard('분류', element.classification)}
      </div>
      <p class="body-copy">카드의 분류와 원자량을 주기율표의 정보와 대조하십시오. 다음 파일은 물성 실험실을 뜻하는 영문 경로에 있습니다.</p>
      ${routeCard(localRoute(req, '/lab'), '브라우저 주소창에 이 경로를 직접 입력하십시오.')}
      <p class="notice">자료 출처: 내부 주기율표 사본 · 원자량은 표기 기준에 따라 반올림될 수 있습니다.</p>`
  }));
});

app.get('/lab', (req, res) => {
  const element = getCurrentQuestion(req, res);
  if (!element) return;

  res.send(page({
    title: '물성 분석실',
    section: 'LAB / 시료 분석 결과',
    step: 3,
    content: `
      <p class="intro">분광 분석과 전도도 측정 결과가 복원되었습니다. 두 결과가 같은 원소를 가리키는지 확인하십시오.</p>
      <div class="clue-list">${element.clues.map((clue, index) => `<div class="clue-card"><span>분석 단서 ${index + 1}</span><p>${clue}</p></div>`).join('')}</div>
      <p class="body-copy">모든 단서를 조합해 원소 이름 또는 기호를 추리하십시오. 최종 입력 장치는 terminal 경로에 있습니다.</p>
      ${routeCard(localRoute(req, '/terminal'), '브라우저 주소창에 이 경로를 직접 입력하십시오.')}
      <p class="notice">분석 완료 · 시료 번호 ${element.atomicNumber}-A</p>`
  }));
});

app.get('/terminal', (req, res) => {
  if (!getCurrentQuestion(req, res)) return;

  res.send(page({
    title: '최종 원소 확인',
    section: 'TERMINAL / 정답 입력 대기',
    step: 4,
    content: `
      <p class="intro">보관소 메모, 원소 카드, 물성 분석 결과를 조합해 마지막 실험에 쓰인 원소를 입력하십시오.</p>
      ${answerForm()}
      ${routeCard(localRoute(req, '/hint'), '힌트가 필요할 때 브라우저 주소창에 이 경로를 직접 입력하십시오. 힌트는 선택 사항입니다.')}
      <p class="notice">입력값은 이 요청에서만 확인되며 저장되지 않습니다.</p>`
  }));
});

app.get('/hint', (req, res) => {
  const element = getCurrentQuestion(req, res);
  if (!element) return;

  res.send(page({
    title: '요청형 힌트',
    section: 'TERMINAL / 보조 데이터 호출됨',
    step: 4,
    content: `
      <p class="intro">요청에 따라 보조 단서를 표시합니다.</p>
      <div class="hint-card"><span>힌트 01</span><p>${element.hint}</p></div>
      ${routeCard(localRoute(req, '/terminal'), '정답을 입력하려면 브라우저 주소창에 이 경로를 직접 입력하십시오.')}`
  }));
});

app.post('/terminal', (req, res) => {
  const element = getCurrentQuestion(req, res);
  if (!element) return;

  const answer = typeof req.body.answer === 'string' ? req.body.answer.trim().toLocaleLowerCase('ko-KR') : '';

  if (!answer || answer.length > 40) {
    return res.status(400).send(page({
      title: '입력값 확인 필요',
      section: 'TERMINAL / 요청 형식 오류',
      tone: 'tone-error',
      step: 4,
      content: `<p class="intro">원소 이름 또는 기호를 1~40자 사이로 입력하십시오.</p>${answerForm()}`
    }));
  }

  if (element.aliases.includes(answer)) {
    req.session.lastQuestionId = element.id;
    req.session.currentQuestionId = null;
    return res.send(page({
      title: '접근 승인',
      section: 'SYSTEM / 숨겨진 결말 복구됨',
      tone: 'tone-success',
      step: 4,
      content: `
        <p class="intro">정답입니다. 입력한 원소는 원자번호 ${element.atomicNumber}와 복구된 물성 기록에 일치합니다.</p>
        <div class="ending-card"><p class="ending-label">FINAL RECORD · 404-A</p>
          <h2>임무를 완료했습니다.</h2>
          <p>손상된 기록의 단서를 조합해 시료를 확인했습니다. 복구된 연구 자료는 다음 감식 단계로 전달되었습니다. 수고하셨습니다.</p>
          <p class="signature">자동 복구 로그가 종료되었습니다.</p>
        </div>
        <a class="action-link" href="/">메인 페이지로 돌아가기 <span aria-hidden="true">→</span></a>`
    }));
  }

  return res.status(200).send(page({
    title: '분석 불일치',
    section: 'TERMINAL / 시료와 결과가 다릅니다',
    tone: 'tone-error',
    step: 4,
    content: `
      <p class="intro">입력한 답은 복구된 원자번호와 물성 기록에 맞지 않습니다. 단서를 다시 대조하십시오.</p>
      <div class="error-stamp">ACCESS DENIED · 답변 불일치</div>
      ${answerForm()}
      ${routeCard(localRoute(req, '/hint'), '추가 단서가 필요하면 브라우저 주소창에 이 경로를 직접 입력하십시오.')}`
  }));
});

app.use((req, res) => {
  res.status(404).send(page({
    title: '경로를 찾을 수 없음',
    section: '404 / 기록 손상',
    tone: 'tone-error',
    content: `<p class="intro">요청한 연구 기록이 존재하지 않거나 복구되지 않았습니다. 메인 화면의 주소 경로는 다음과 같습니다.</p>${routeCard('/', '브라우저 주소창에 이 경로를 직접 입력하십시오.')}`
  }));
});

app.use((err, req, res, next) => {
  console.error('요청 처리 오류:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).send(page({
    title: '시스템 오류',
    section: 'SYSTEM / 요청 처리 실패',
    tone: 'tone-error',
    content: `<p class="intro">요청을 처리하지 못했습니다. 잠시 후 다시 시도하십시오.</p>${routeCard('/', '메인 화면으로 이동하려면 브라우저 주소창에 이 경로를 직접 입력하십시오.')}`
  }));
});

app.listen(PORT, () => {
  console.log(`MISSION 404 서버 실행 중: http://localhost:${PORT}`);
});
