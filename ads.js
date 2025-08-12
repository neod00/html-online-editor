(function () {
  const ADS_CLIENT = 'ca-pub-5907754718994620';
  const CONTENT_MIN_LENGTH = 400; // 게시자 콘텐츠 최소 길이 기준(한글 약 250~300자 이상 권장)

  function getTextContentLength() {
    const selectors = ['.content-section', 'main', 'article'];
    let text = '';
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        text += ' ' + (el.innerText || '').trim();
      });
    });
    return text.replace(/\s+/g, ' ').trim().length;
  }

  function isContentPage() {
    const pathname = (location.pathname || '').toLowerCase();
    // 광고 허용 대상: 가이드/정보/정책 등 설명형 페이지
    const whitelist = ['guide.html', 'about.html', 'privacy.html', 'terms.html', '/'];
    return whitelist.some(name => pathname.endsWith(name)) || pathname === '/' || pathname === '';
  }

  function hasSufficientPublisherContent() {
    // 충분한 설명 텍스트가 있는지 검사
    const length = getTextContentLength();
    return length >= CONTENT_MIN_LENGTH;
  }

  function loadAdSenseScript() {
    if (document.getElementById('adsbygooglejs')) return;
    const s = document.createElement('script');
    s.id = 'adsbygooglejs';
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }

  function createInlineAd(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', ADS_CLIENT);
    ins.setAttribute('data-ad-slot', 'auto');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(ins);

    const push = () => {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); container.classList.add('ad-active'); } catch (e) { /* noop */ }
    };

    if (window.adsbygoogle) {
      push();
    } else {
      // 스크립트 로드 이후 실행
      const onLoad = () => push();
      const check = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(check);
          onLoad();
        }
      }, 300);
      setTimeout(() => clearInterval(check), 5000);
    }
  }

  function init() {
    // 도구성 화면에서 게시자 콘텐츠가 부족한 경우 광고 미노출
    if (!isContentPage() || !hasSufficientPublisherContent()) {
      return;
    }

    loadAdSenseScript();

    // 페이지에 배치된 광고 컨테이너 초기화
    ['ad-inline-1', 'ad-inline-2'].forEach(createInlineAd);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
