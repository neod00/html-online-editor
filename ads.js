(function () {
  const ADS_CLIENT = 'ca-pub-5907754718994620';
  const CONTENT_MIN_LENGTH = 600; // 게시자 콘텐츠 최소 길이 기준(한글 약 400자 이상 권장)
  const EDITOR_CONTENT_RATIO = 0.3; // 에디터 콘텐츠 대비 게시자 콘텐츠 비율

  function getTextContentLength() {
    // 에디터 영역 제외하고 실제 게시자 콘텐츠만 계산
    const selectors = ['.info-section', '.app-header', '.app-footer'];
    let text = '';
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        text += ' ' + (el.innerText || '').trim();
      });
    });
    return text.replace(/\s+/g, ' ').trim().length;
  }

  function getEditorContentLength() {
    // 에디터 영역의 콘텐츠 길이 계산
    const editor = document.getElementById('htmlEditor');
    if (editor) {
      return (editor.value || '').length;
    }
    return 0;
  }

  function isContentPage() {
    const pathname = (location.pathname || '').toLowerCase();
    // 광고 허용 대상: 가이드/정보/정책 등 설명형 페이지
    const whitelist = ['guide.html', 'about.html', 'privacy.html', 'terms.html', '/'];
    return whitelist.some(name => pathname.endsWith(name)) || pathname === '/' || pathname === '';
  }

  function hasSufficientPublisherContent() {
    // 충분한 설명 텍스트가 있는지 검사
    const publisherLength = getTextContentLength();
    const editorLength = getEditorContentLength();
    
    // 게시자 콘텐츠가 최소 길이 이상이고, 에디터 콘텐츠 대비 적절한 비율을 유지하는지 확인
    return publisherLength >= CONTENT_MIN_LENGTH && 
           (editorLength === 0 || publisherLength / (publisherLength + editorLength) >= EDITOR_CONTENT_RATIO);
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

  function createBottomAd(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 광고 컨테이너 스타일링
    container.style.minHeight = '250px';
    container.style.background = 'var(--bg-tertiary)';
    container.style.border = '2px dashed var(--border-medium)';
    container.style.borderRadius = '12px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.color = 'var(--text-muted)';

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.height = '250px';
    ins.setAttribute('data-ad-client', ADS_CLIENT);
    ins.setAttribute('data-ad-slot', 'auto');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    container.appendChild(ins);

    const push = () => {
      try { 
        (window.adsbygoogle = window.adsbygoogle || []).push({}); 
        container.classList.add('ad-active');
        // 광고 로드 후 플레이스홀더 제거
        const placeholder = container.querySelector('.ad-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
      } catch (e) { 
        console.warn('AdSense 광고 로드 실패:', e);
      }
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
      console.log('광고 표시 조건 미충족: 콘텐츠 부족 또는 도구성 페이지');
      return;
    }

    // 페이지 로드 후 약간의 지연을 두고 광고 로드 (사용자 경험 개선)
    setTimeout(() => {
      loadAdSenseScript();
      
      // 하단 광고 컨테이너 초기화
      createBottomAd('ad-bottom');
    }, 1000);
  }

  // 페이지 로드 완료 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 에디터 콘텐츠 변경 감지하여 광고 표시 조건 재검사
  function checkAdDisplayConditions() {
    if (hasSufficientPublisherContent()) {
      const adContainer = document.getElementById('ad-bottom');
      if (adContainer && !adContainer.classList.contains('ad-active')) {
        createBottomAd('ad-bottom');
      }
    }
  }

  // 에디터 변경 이벤트 감지 (script.js에서 호출)
  window.checkAdDisplayConditions = checkAdDisplayConditions;
})();
