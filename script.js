// HTML Online Editor - JavaScript
class HTMLEditor {
    constructor() {
        this.editor = null;
        this.previewFrame = null;
        this.isFullscreen = false;
        this.autoSaveInterval = null;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.initializeEditor();
        this.initializeEventListeners();
        this.initializeTheme();
        this.loadAutoSave();
        this.updateStats();
    }

    // CodeMirror 에디터 초기화
    initializeEditor() {
        const textarea = document.getElementById('htmlEditor');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'htmlmixed',
            theme: this.currentTheme === 'dark' ? 'monokai' : 'default',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseTags: true,
            matchTags: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            extraKeys: {
                'Ctrl-S': () => this.saveToLocal(),
                'F11': () => this.toggleFullscreen(),
                'Alt-1': () => this.previewInNewTab(),
                'Alt-2': () => this.formatCode(),
                'Alt-3': () => this.clearEditor(),
                'Alt-4': () => this.saveToLocal(),
                'Alt-5': () => this.loadFromLocal(),
                'Alt-6': () => this.uploadFile(),
                'Alt-7': () => this.downloadFile(),
                'Alt-8': () => this.loadSample(),
                'Alt-9': () => this.toggleFullscreen()
            }
        });

        this.previewFrame = document.getElementById('previewFrame');

        // 에디터 변경 이벤트
        this.editor.on('change', () => {
            this.updatePreview();
            this.updateStats();
            this.autoSave();
        });

        // 커서 위치 변경 이벤트
        this.editor.on('cursorActivity', () => {
            this.updateStats();
        });
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 툴바 버튼들
        document.getElementById('previewBtn').addEventListener('click', () => this.previewInNewTab());
        document.getElementById('formatBtn').addEventListener('click', () => this.formatCode());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToLocal());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromLocal());
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadFile());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadFile());
        document.getElementById('sampleBtn').addEventListener('click', () => this.loadSample());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // 미리보기 패널 컨트롤
        document.getElementById('refreshPreview').addEventListener('click', () => this.updatePreview());
        document.getElementById('openInNewTab').addEventListener('click', () => this.previewInNewTab());

        // 파일 입력
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // 모달 관련
        document.getElementById('aboutBtn').addEventListener('click', () => this.showModal('aboutModal'));
        document.getElementById('helpBtn').addEventListener('click', () => this.showModal('helpModal'));

        // 모달 닫기
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 모달 외부 클릭시 닫기
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });

        // 창 크기 변경시 에디터 새로고침
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.editor.refresh();
            }, 100);
        });
    }

    // 테마 초기화
    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    // 실시간 미리보기 업데이트
    updatePreview() {
        const htmlContent = this.editor.getValue();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;
        
        // 이전 URL 정리
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // 새 탭에서 미리보기
    previewInNewTab() {
        const htmlContent = this.editor.getValue();
        const newWindow = window.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();
    }

    // 코드 포맷팅
    formatCode() {
        try {
            const htmlContent = this.editor.getValue();
            const formatted = html_beautify(htmlContent, {
                indent_size: 2,
                indent_char: ' ',
                max_preserve_newlines: 2,
                preserve_newlines: true,
                keep_array_indentation: false,
                break_chained_methods: false,
                indent_scripts: 'normal',
                brace_style: 'collapse',
                space_before_conditional: true,
                unescape_strings: false,
                jslint_happy: false,
                end_with_newline: true,
                wrap_line_length: 0,
                indent_inner_html: false,
                comma_first: false,
                e4x: false,
                indent_empty_lines: false
            });
            this.editor.setValue(formatted);
            this.showNotification('코드가 포맷팅되었습니다.', 'success');
        } catch (error) {
            this.showNotification('포맷팅 중 오류가 발생했습니다.', 'error');
        }
    }

    // 에디터 내용 지우기
    clearEditor() {
        if (confirm('정말로 모든 내용을 지우시겠습니까?')) {
            this.editor.setValue('');
            this.showNotification('내용이 지워졌습니다.', 'info');
        }
    }

    // 로컬 스토리지에 저장
    saveToLocal() {
        const content = this.editor.getValue();
        const timestamp = new Date().toISOString();
        const saveData = {
            content: content,
            timestamp: timestamp
        };
        localStorage.setItem('htmlEditor_save', JSON.stringify(saveData));
        this.showNotification('로컬에 저장되었습니다.', 'success');
    }

    // 로컬 스토리지에서 불러오기
    loadFromLocal() {
        const saveData = localStorage.getItem('htmlEditor_save');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.editor.setValue(data.content);
                this.showNotification(`저장된 내용을 불러왔습니다. (${new Date(data.timestamp).toLocaleString()})`, 'success');
            } catch (error) {
                this.showNotification('저장된 데이터를 읽는 중 오류가 발생했습니다.', 'error');
            }
        } else {
            this.showNotification('저장된 내용이 없습니다.', 'warning');
        }
    }

    // 파일 업로드
    uploadFile() {
        document.getElementById('fileInput').click();
    }

    // 파일 업로드 처리
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.editor.setValue(e.target.result);
                this.showNotification(`파일 "${file.name}"이 업로드되었습니다.`, 'success');
            };
            reader.readAsText(file);
        }
    }

    // 파일 다운로드
    downloadFile() {
        const content = this.editor.getValue();
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('파일이 다운로드되었습니다.', 'success');
    }

    // 샘플 코드 로드
    loadSample() {
        const sampleHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>샘플 HTML 페이지</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #fff;
            text-align: center;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .card {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        button {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .highlight {
            background: rgba(255, 255, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 HTML Online Editor 샘플 페이지</h1>
        
        <div class="card">
            <h2>환영합니다!</h2>
            <p>이것은 <span class="highlight">HTML Online Editor</span>의 샘플 페이지입니다.</p>
            <p>이 에디터를 사용하여 실시간으로 HTML을 편집하고 미리보기를 확인할 수 있습니다.</p>
        </div>

        <div class="card">
            <h3>주요 기능</h3>
            <ul>
                <li>실시간 HTML 미리보기</li>
                <li>코드 하이라이팅 및 포맷팅</li>
                <li>파일 업로드/다운로드</li>
                <li>로컬 저장/불러오기</li>
                <li>다크/라이트 테마</li>
                <li>전체화면 모드</li>
            </ul>
        </div>

        <div class="card">
            <h3>인터랙티브 요소</h3>
            <button onclick="showAlert()">클릭해보세요!</button>
            <p id="demo">이 텍스트는 JavaScript로 변경할 수 있습니다.</p>
        </div>
    </div>

    <script>
        function showAlert() {
            alert('안녕하세요! HTML Online Editor입니다.');
            document.getElementById('demo').innerHTML = '텍스트가 변경되었습니다! 🎉';
            document.getElementById('demo').style.color = '#ffeb3b';
            document.getElementById('demo').style.fontWeight = 'bold';
        }
        
        // 페이지 로드시 애니메이션
        window.addEventListener('load', function() {
            document.querySelector('.container').style.animation = 'fadeIn 1s ease-in';
        });
    </script>
</body>
</html>`;
        
        this.editor.setValue(sampleHTML);
        this.showNotification('샘플 코드가 로드되었습니다.', 'success');
    }

    // 전체화면 토글
    toggleFullscreen() {
        const container = document.querySelector('.container');
        this.isFullscreen = !this.isFullscreen;
        
        if (this.isFullscreen) {
            container.classList.add('fullscreen');
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i> 전체화면 해제';
        } else {
            container.classList.remove('fullscreen');
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
        
        // 에디터 새로고침
        setTimeout(() => {
            this.editor.refresh();
        }, 100);
    }

    // 테마 토글
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // CodeMirror 테마 변경
        this.editor.setOption('theme', this.currentTheme === 'dark' ? 'monokai' : 'default');
        
        this.updateThemeIcon();
        this.showNotification(`${this.currentTheme === 'dark' ? '다크' : '라이트'} 테마로 변경되었습니다.`, 'info');
    }

    // 테마 아이콘 업데이트
    updateThemeIcon() {
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // 통계 업데이트 (줄 수, 문자 수)
    updateStats() {
        const content = this.editor.getValue();
        const lines = this.editor.lineCount();
        const chars = content.length;
        const cursor = this.editor.getCursor();
        
        document.querySelector('.line-count').textContent = `줄: ${cursor.line + 1}/${lines}`;
        document.querySelector('.char-count').textContent = `문자: ${chars}`;
    }

    // 자동 저장
    autoSave() {
        clearTimeout(this.autoSaveInterval);
        this.autoSaveInterval = setTimeout(() => {
            const content = this.editor.getValue();
            if (content.trim()) {
                localStorage.setItem('htmlEditor_autoSave', content);
            }
        }, 2000);
    }

    // 자동 저장된 내용 로드
    loadAutoSave() {
        const autoSaved = localStorage.getItem('htmlEditor_autoSave');
        if (autoSaved && !localStorage.getItem('htmlEditor_save')) {
            this.editor.setValue(autoSaved);
        }
    }

    // 모달 표시
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideInRight 0.3s ease',
            backgroundColor: this.getNotificationColor(type)
        });

        // 닫기 버튼 스타일
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            marginLeft: 'auto',
            padding: '0',
            lineHeight: '1'
        });

        document.body.appendChild(notification);

        // 닫기 버튼 이벤트
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    // 알림 아이콘 반환
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 알림 색상 반환
    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || '#17a2b8';
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 페이지 로드시 에디터 초기화
document.addEventListener('DOMContentLoaded', () => {
    new HTMLEditor();
});

