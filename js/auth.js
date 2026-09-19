// ═══════════════════════════════════════════════════════════
//                   تسجيل الدخول/الخروج
// ═══════════════════════════════════════════════════════════

let currentStudent = null;
let currentSubject = null;
let currentExamData = null;
let examTimer = null;

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.add('active');
    const input = document.getElementById('loginCode');
    if (!input) return;
    input.value = '';
    const err = document.getElementById('loginError');
    if (err) err.classList.remove('show');

    input.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    };
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            attemptLogin();
        }
    };

    setTimeout(() => input.focus(), 300);
}

function attemptLogin() {
    const input = document.getElementById('loginCode');
    if (!input) return;
    const code = input.value.trim().replace(/\s/g, '');
    const err = document.getElementById('loginError');

    console.log('محاولة تسجيل الدخول بالكود:', code);

    if (code.length !== 6) {
        if (err) {
            err.textContent = '⚠️ يجب أن يكون الكود 6 أرقام';
            err.classList.add('show');
        }
        return;
    }

    const student = students.find(s => String(s.code).trim() === code);

    if (student) {
        currentStudent = student;
        localStorage.setItem('loggedInStudent', btoa(unescape(encodeURIComponent(JSON.stringify(student)))));
        hideLoginModal();
        updateUIForLogin();
        showToast('مرحباً ' + student.name + '! 🎉', 'success');
        if (typeof renderSubjectsGrid === 'function') renderSubjectsGrid();
    } else {
        if (err) {
            err.innerHTML = '<i class="fas fa-exclamation-circle"></i> كود غير صحيح، حاول مرة أخرى';
            err.classList.add('show');
        }
        input.value = '';
        input.focus();
    }
}

function checkLoginState() {
    const saved = localStorage.getItem('loggedInStudent');
    if (saved) {
        try {
            currentStudent = JSON.parse(decodeURIComponent(escape(atob(saved))));
            if (!students.find(s => s.code === currentStudent.code)) {
                currentStudent = null;
                localStorage.removeItem('loggedInStudent');
            }
        } catch(e) {
            console.error('خطأ في قراءة بيانات الطالب:', e);
            currentStudent = null;
            localStorage.removeItem('loggedInStudent');
        }
    }
    updateUIForLogin();
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('active');
}

function logout() {
    currentStudent = null;
    localStorage.removeItem('loggedInStudent');
    updateUIForLogin();
    if (typeof renderSubjectsGrid === 'function') renderSubjectsGrid();
    location.hash = '#home';
    showToast('تم تسجيل الخروج بنجاح', 'success');
}

function updateUIForLogin() {
    const isLoggedIn = currentStudent !== null;

    const loginBtn = document.getElementById('headerLoginBtn');
    const logoutBtn = document.getElementById('headerLogoutBtn');
    const userInfo = document.getElementById('headerUserInfo');
    const resultsBtn = document.getElementById('headerResultsBtn');
    const heroLoginBtn = document.getElementById('heroLoginBtn');
    const userName = document.getElementById('headerUserName');

    if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
    if (userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';
    if (resultsBtn) resultsBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
    if (heroLoginBtn) heroLoginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';

    if (isLoggedIn && userName) {
        userName.textContent = currentStudent.name;
    }
}