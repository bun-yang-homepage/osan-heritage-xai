// 카테고리 내 서브탭(GNB 드롭다운 → 페이지 내 subpanel 전환)
// 드롭다운은 모든 페이지에 동일하게 렌더링되므로, 링크가 "현재 페이지"를 가리킬 때만
// 페이지 이동 없이 JS로 subpanel을 전환하고, 다른 페이지를 가리키면 정상적으로 이동시킨다.
function initSubnav(){
  const panels = document.querySelectorAll('.subpanel');
  // 모바일 햄버거 드로어의 서브링크(.md-sub a)도 데스크톱 드롭다운과 동일하게 동작해야 하므로
  // initMobileNav()가 드로어를 먼저 만들어 둔 뒤(호출 순서 참고) 여기서 함께 조회한다.
  const links = document.querySelectorAll('.gnb-dropdown a[data-panel], .md-sub a[data-panel]');
  const currentFile = location.pathname.split('/').pop() || 'index.html';
  // 프리미엄 페이지는 .subpanel이 아닌 .premium-tabs/.premium-gallery로 구성되어 있어
  // 드롭다운(가격/교통/생활 프리미엄) 클릭·해시 진입 시 별도로 매핑해 활성화한다.
  const premiumMap = {price:'gal-price', new:'gal-new', traffic:'gal-traffic', life:'gal-life'};

  function activate(id){
    if(panels.length) panels.forEach(p => p.classList.toggle('active', p.id === id));
    if(premiumMap[id]){
      const target = premiumMap[id];
      document.querySelectorAll('.premium-tabs button').forEach(b => b.classList.toggle('active', b.dataset.target === target));
      document.querySelectorAll('.premium-gallery').forEach(g => g.classList.toggle('active', g.id === target));
    }
  }

  if(panels.length){
    let start = location.hash ? location.hash.slice(1) : panels[0].id;
    if(![...panels].some(p => p.id === start)) start = panels[0].id;
    activate(start);
  } else if(document.querySelector('.premium-tabs') && location.hash){
    const start = location.hash.slice(1);
    if(premiumMap[start]) activate(start);
  }

  links.forEach(l => {
    const href = l.getAttribute('href') || '';
    const [file, hash] = href.split('#');
    if(!hash) return;
    if(file === '' || file === currentFile){
      l.addEventListener('click', e => {
        e.preventDefault();
        history.replaceState(null, '', '#' + hash);
        activate(hash);
        window.scrollTo({top:0, behavior:'smooth'});
      });
    }
    // file !== currentFile 인 경우는 그대로 두어 브라우저가 해당 페이지로 이동하도록 한다.
    // 이동한 페이지에서는 위 activate(start)가 location.hash를 읽어 올바른 subpanel을 보여준다.
  });
}

// 히어로 슬라이더 (자동 재생 + 하단 점 네비게이션)
// PC용 커버 배경 히어로(.hero)와 모바일 전용 카드형 히어로(.hero-mobile)가
// 별도 마크업으로 공존하므로, 슬라이드/점 셀렉터를 인자로 받아 각각 독립적으로 동작시킨다.
function initHeroSlider(slideSelector, dotsSelector){
  const slides = document.querySelectorAll(slideSelector);
  const dotsWrap = document.querySelector(dotsSelector);
  if(!slides.length) return;

  let i = 0;
  let dots = [];

  if(dotsWrap){
    dotsWrap.innerHTML = '';
    slides.forEach((_, idx) => {
      const b = document.createElement('button');
      if(idx === 0) b.classList.add('active');
      b.addEventListener('click', () => show(idx, true));
      dotsWrap.appendChild(b);
    });
    dots = [...dotsWrap.querySelectorAll('button')];
  }

  function show(idx, manual){
    const prev = slides[i];
    prev.classList.remove('active');
    if(dots[i]) dots[i].classList.remove('active');
    // 모바일 히어로(.hero-slide-m)는 leaving 클래스로 왼쪽으로 빠지는 애니메이션을 타고,
    // 트랜지션이 끝나면 다시 오른쪽 대기 위치로 리셋해 다음 차례에 재사용한다.
    // (PC 히어로는 leaving 클래스에 대응하는 스타일이 없어 그냥 무시된다.)
    prev.classList.add('leaving');
    setTimeout(() => prev.classList.remove('leaving'), 650);

    i = idx;
    slides[i].classList.add('active');
    if(dots[i]) dots[i].classList.add('active');
    if(manual) resetTimer();
  }

  let timer = setInterval(() => show((i + 1) % slides.length), 4500);
  function resetTimer(){
    clearInterval(timer);
    timer = setInterval(() => show((i + 1) % slides.length), 4500);
  }
}

function initHero(){
  initHeroSlider('.hero-slide', '.hero-dots');
  initHeroSlider('.hero-slide-m', '.hero-dots-m');
}

// 모바일 햄버거 메뉴 (슬라이드 드로어)
// .gnb-main의 실제 카테고리/드롭다운 구조를 그대로 읽어와 드로어를 만들기 때문에,
// 각 페이지 GNB 마크업만 유지하면 모바일 메뉴는 항상 최신 카테고리 구성과 일치한다.
function initMobileNav(){
  const gnbMain = document.querySelector('.gnb-main');
  const wrap = document.querySelector('.gnb-top .wrap');
  if(!gnbMain || !wrap) return;

  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', '메뉴 열기');
  btn.innerHTML = '<span></span><span></span><span></span>';
  wrap.insertBefore(btn, wrap.firstChild);

  const overlay = document.createElement('div');
  overlay.className = 'mobile-drawer-overlay';

  const drawer = document.createElement('nav');
  drawer.className = 'mobile-drawer';

  let html = '<div class="md-head"><b>오산헤리티지자이</b><button type="button" class="md-close" aria-label="메뉴 닫기">×</button></div><ul class="md-list">';
  gnbMain.querySelectorAll(':scope > li').forEach(li => {
    const topLink = li.querySelector(':scope > a');
    const dropdown = li.querySelector('.gnb-dropdown');
    const subLinks = dropdown ? [...dropdown.querySelectorAll('a')] : [];
    html += '<li class="md-cat"><div class="md-cat-row"><a href="' + topLink.getAttribute('href') + '">' + topLink.textContent + '</a>';
    if(subLinks.length) html += '<span class="md-arrow">▾</span>';
    html += '</div>';
    if(subLinks.length){
      html += '<div class="md-sub">';
      subLinks.forEach(a => {
        html += '<a href="' + a.getAttribute('href') + '" data-panel="' + (a.dataset.panel || '') + '">' + a.textContent + '</a>';
      });
      html += '</div>';
    }
    html += '</li>';
  });
  html += '</ul><div class="md-cta"><a href="interest.html">📝 관심고객등록</a></div>';
  drawer.innerHTML = html;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  function openDrawer(){
    drawer.classList.add('open');
    overlay.classList.add('open');
    btn.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    btn.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  btn.addEventListener('click', () => {
    if(drawer.classList.contains('open')) closeDrawer(); else openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  drawer.querySelector('.md-close').addEventListener('click', closeDrawer);

  // 카테고리별 아코디언 토글 - 하위메뉴가 있는 카테고리는 이름(행 전체)을 눌렀을 때 바로 이동하지 않고 펼쳐진다.
  drawer.querySelectorAll('.md-cat').forEach(cat => {
    const row = cat.querySelector('.md-cat-row');
    const sub = cat.querySelector('.md-sub');
    if(!sub) return; // 하위메뉴가 없는 카테고리는 그대로 페이지 이동
    row.addEventListener('click', e => {
      e.preventDefault();
      cat.classList.toggle('open');
    });
  });

  // 하위 링크·관심고객등록 클릭 시 드로어 닫기 (실제 이동/해시전환은 initSubnav 및 브라우저가 처리)
  drawer.querySelectorAll('.md-sub a, .md-cta a').forEach(a => {
    a.addEventListener('click', closeDrawer);
  });
}

// 하단 고정 모바일 액션바 (관심고객등록/카카오톡 상담/문자 상담하기)
// 우측 hero-banner는 데스크톱 전용이며(모바일에서 display:none), 모바일에서는
// 화면 폭이 좁아 세로 패널 대신 하단 가로형 3버튼 바로 대체한다.
function initMobileActionBar(){
  const bar = document.createElement('div');
  bar.className = 'mobile-action-bar';
  bar.innerHTML =
    '<a href="interest.html" class="mab-item mab-interest"><span class="ic">📝</span>관심고객등록</a>' +
    '<a href="#" id="mabKakaoBtn" class="mab-item mab-kakao"><span class="ic">💬</span>카카오톡 상담</a>' +
    '<a href="sms:1866-1156" class="mab-item mab-sms"><span class="ic">✉️</span>문자 상담하기</a>';
  document.body.appendChild(bar);

  bar.querySelector('#mabKakaoBtn').addEventListener('click', e => {
    e.preventDefault();
    if(window.confirm('성함, 연락처, 문의사항 남겨주시면 빠른 상담이 가능합니다.')){
      window.open('https://open.kakao.com/o/sG7q3nHi', '_blank', 'noopener');
    }
  });
}

// 우측 퀵메뉴 배너 (관심고객등록/카카오톡 상담/문자 상담/영상보기)
// 특정 페이지 마크업이 아니라 모든 페이지 공통 스크립트에서 직접 생성해 주입하므로,
// index.html뿐 아니라 사이트의 모든 페이지에서 동일하게 떠 있는다.
function initFloatingBanner(){
  const wrap = document.createElement('div');
  wrap.className = 'hero-banner';
  wrap.innerHTML =
    '<a href="interest.html" class="interest"><span class="ic">📝</span>관심고객등록</a>' +
    '<a href="#" id="kakaoConsultBtn" class="kakao"><span class="ic">💬</span>카카오톡 상담</a>' +
    '<a href="sms:1866-1156" class="sms"><span class="ic">✉️</span>문자 상담</a>' +
    '<a href="promo.html#promov" class="video"><span class="ic">▶</span>영상보기</a>';
  document.body.appendChild(wrap);

  wrap.querySelector('#kakaoConsultBtn').addEventListener('click', e => {
    e.preventDefault();
    if(window.confirm('성함, 연락처, 문의사항 남겨주시면 빠른 상담이 가능합니다.')){
      window.open('https://open.kakao.com/o/sG7q3nHi', '_blank', 'noopener');
    }
  });
}

// 이미지 라이트박스 - 카테고리 본문(.content) 안의 이미지를 클릭하면 원본 화질 그대로 크게 확대해서 본다.
function initImageLightbox(){
  const targets = document.querySelectorAll('.content img');
  if(!targets.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<button type="button" class="lightbox-close" aria-label="닫기">×</button><img class="lightbox-img" alt="">';
  document.body.appendChild(overlay);
  const lbImg = overlay.querySelector('.lightbox-img');

  function openLightbox(src, alt){
    lbImg.src = src;
    lbImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeLightbox(){
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    lbImg.src = '';
  }

  targets.forEach(img => {
    img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
  });
  overlay.addEventListener('click', e => {
    if(e.target === overlay) closeLightbox();
  });
  overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeLightbox();
  });
}

// 관심고객등록 폼 제출 처리 - interest.html의 정식 폼과 index.html에 임베드된 간편폼이
// 둘 다 동일한 class(.interest-form)를 사용하므로, id 대신 "가장 가까운 부모 안의 done-box"를
// 찾는 방식으로 두 군데 모두에서 각각 독립적으로 동작한다.
//
// 제출된 데이터는 구글 시트에 누적 저장된다 (Google Apps Script 웹앱 경유).
// 아래 GAS_ENDPOINT를 본인의 Apps Script 배포 URL로 교체해야 실제로 저장된다.
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx0IdUM5FR2n0nC8tggTsp-1vC2g6EjydiMghfemvy2xdpvRb9_tHdzw9Cc-2PYdIOaGA/exec';

function initInterestForms(){
  document.querySelectorAll('form.interest-form').forEach(form => {
    const doneBox = form.parentElement ? form.parentElement.querySelector('.done-box') : null;
    const submitBtn = form.querySelector('.submit-btn');
    const submitLabel = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', e => {
      e.preventDefault();

      if(!GAS_ENDPOINT || GAS_ENDPOINT.indexOf('PASTE_YOUR') === 0){
        // 아직 구글시트 연동 URL이 설정되지 않은 상태 - 개발 중 확인용으로만 완료 화면을 보여준다.
        console.warn('GAS_ENDPOINT가 설정되지 않았습니다. 구글시트에 데이터가 저장되지 않습니다.');
        form.style.display = 'none';
        if(doneBox) doneBox.style.display = 'block';
        return;
      }

      if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = '제출 중...'; }

      // Apps Script 웹앱은 응답에 CORS 헤더를 안정적으로 실어주지 않는 경우가 있어,
      // no-cors로 전송하고 응답 내용은 읽지 않는다(요청이 정상 도달하면 시트엔 그대로 저장됨).
      fetch(GAS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        body: new FormData(form)
      })
        .then(() => {
          form.style.display = 'none';
          if(doneBox) doneBox.style.display = 'block';
        })
        .catch(() => {
          alert('제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
        });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initSubnav();
  initHero();
  initFloatingBanner();
  initMobileActionBar();
  initImageLightbox();
  initInterestForms();

  // 프리미엄 상세 탭 (가격/교통/생활)
  document.querySelectorAll('.premium-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      document.querySelectorAll('.premium-tabs button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.premium-gallery').forEach(g => g.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // 평형/타입 탭 공용
  document.querySelectorAll('.type-tabs').forEach(tabgroup => {
    const buttons = tabgroup.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const panelGroup = tabgroup.dataset.panels;
        buttons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.type-panel[data-group="' + panelGroup + '"]').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
      });
    });
  });
});
