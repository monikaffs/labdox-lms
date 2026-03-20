/**
 * LABDOX CAREER OS - CORE ENGINE
 * Features: Supabase Sync, Gamification, Module-based Player, Role Security
 */

// 1. SUPABASE CONFIGURATION
const SUPABASE_URL = "https://jchtprbzaaocnlkbinxk.supabase.co";
const SUPABASE_KEY = "sb_publishable_kTEeJIJjIX3GFyFGcj-jGg_bgmzEMNu";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. MOCK DATA (In a real app, this comes from a database)
const allCourses = [
    {
        id: "web-ai-01",
        title: "Full Stack Web Dev & AI Automation",
        desc: "Learn to build modern apps and automate workflows using OpenAI and n8n.",
        category: "Web Dev",
        modules: [
            {
                id: "m1",
                title: "Introduction to Career OS",
                type: "video",
                content: "Welcome to the future of industry learning.",
                videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU",
                duration: "5 mins"
            },
            {
                id: "m2",
                title: "Database Architecture PDF",
                type: "pdf",
                content: "Study the PostgreSQL schema used in professional SaaS apps.",
                videoUrl: "", // No video for PDF
                duration: "Read"
            },
            {
                id: "m3",
                title: "Knowledge Check: AI & Logic",
                type: "quiz",
                questions: [
                    { type: "mcq", q: "What is a Vector Database?", options: ["Image Storage", "High-dimensional data retrieval"], correct: 1 },
                    { type: "fill", q: "The 'P' in GPT stands for ____-trained.", correct: "pre" }
                ]
            },
            // Copy this structure and paste it inside the 'modules' array of any course
            {
                id: "m4", // Give it a unique ID
                title: "Advanced AI Assessment",
                type: "quiz", // MUST be "quiz"
                questions: [
                    {
                        type: "mcq",
                        q: "Which company created ChatGPT?",
                        options: ["Google", "OpenAI", "Microsoft"],
                        correct: 1 // Index of the correct answer (OpenAI is 1)
                    },
                    {
                        type: "fill",
                        q: "The full form of AI is ____ Intelligence.",
                        correct: "artificial" // Always use lowercase here
                    },
                    {
                        type: "mcq",
                        q: "Is Supabase based on PostgreSQL?",
                        options: ["Yes", "No"],
                        correct: 0
                    }
                ]
            }
        ]
    },
    {
        id: "ds-01",
        title: "Advanced Data Science",
        desc: "Deep dive into Python, Pandas, and predictive modeling.",
        category: "Data Science",
        modules: [
            { id: "d1", title: "Python for Data", type: "video", videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw", duration: "12 mins" }
        ]
    },
    {
        id: "ui-ux-01",
        title: "Product Design & UI/UX Strategy",
        desc: "Master Figma, user research, and high-fidelity prototyping.",
        category: "Design",
        modules: [
            { id: "u1", title: "Design Thinking Basics", type: "video", videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU", duration: "10 mins" },
            { id: "u2", title: "Figma Component Systems", type: "pdf", content: "Advanced component architecture.", duration: "Read" }
        ]
    },
    {
        id: "cyber-01",
        title: "Cyber Security Operations",
        desc: "Protect networks, identify threats, and implement defensive security.",
        category: "Security",
        modules: [
            { id: "s1", title: "Network Security 101", type: "video", videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU", duration: "15 mins" },
            { id: "s2", title: "Threat Detection Quiz", type: "quiz", questions: [{ type: "mcq", q: "What is a firewall?", options: ["A hardware/software barrier", "An operating system"], correct: 0 }] }
        ]
    },
    {
        id: "pm-01",
        title: "Product Management & Growth",
        desc: "Learn product lifecycle, A/B testing, and rapid user acquisition.",
        category: "Business",
        modules: [
            { id: "p1", title: "Agile Product Lifecycle", type: "video", videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU", duration: "8 mins" }
        ]
    },
    {
        id: "fe-01",
        title: "Frontend Masterclass (Advanced React)",
        desc: "Deep dive into React patterns, Framer Motion, and performance tuning.",
        category: "Web Dev",
        modules: [
            { id: "f1", title: "React Context & State", type: "video", videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU", duration: "12 mins" },
            { id: "f2", title: "Performance Quiz", type: "quiz", questions: [{ type: "mcq", q: "What is useMemo for?", options: ["Memoizing values", "Managing state"], correct: 0 }] }
        ]
    }
];

// 3. APP STATE
let currentUser = JSON.parse(localStorage.getItem('labdox_user')) || null;
let activeCourse = null;
let activeModuleIndex = 0;

// 4. INITIALIZATION
window.onload = () => {
    // Data Normalization (Fix for legacy users/sessions)
    if (currentUser) {
        if (!currentUser.enrolled_courses) currentUser.enrolled_courses = currentUser.enrolled || [currentUser.course];
        if (currentUser.xp_points === undefined) currentUser.xp_points = currentUser.xp || 0;
        if (!currentUser.completed_modules) currentUser.completed_modules = currentUser.completedModules || [];
        localStorage.setItem('labdox_user', JSON.stringify(currentUser));

        syncUI();
        showView('dashboard');
    } else {
        showView('home');
    }

    // Initialize AI Typing Animation
    initAITyping();

    // Initialize Registration Form (Waitlist)
    const waitlistForm = document.getElementById('registerForm');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', handleWaitlistSubmit);
    }
    // Initialize Analytics Intersectional Observer
    initAnalyticsObserver();
};

// New: Animate Analytics Progress Bars on Scroll
function initAnalyticsObserver() {
    const bars = document.querySelectorAll('.a-bar-fill');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const fill = entry.target;
                const width = fill.getAttribute('data-width');
                // Ensure width is set to 0 initially to trigger transition
                fill.style.width = '0%';

                // Small timeout to ensure 0% width is registered by the browser
                setTimeout(() => {
                    fill.style.width = width + '%';
                }, 100);

                observer.unobserve(fill);
            }
        });
    }, { threshold: 0.1 });

    bars.forEach(bar => {
        bar.style.width = '0%'; // Reset all bars to 0 on init
        observer.observe(bar);
    });
}

// 5. NAVIGATION & VIEW CONTROL
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    // Show target view
    const target = document.getElementById(viewId + '-view');
    if (target) target.classList.remove('hidden');

    // Context specific renders
    if (viewId === 'catalog') renderCatalog();
    if (viewId === 'dashboard') {
        renderDashboard();
        // Render Chart explicitly after DOM is un-hidden so it can calculate width/height
        setTimeout(() => renderSkillsRadar(), 100);
    }
    if (viewId === 'home') initAnalyticsObserver();

    // Toggle Global Footer Visibility - Removed hiding for player
    const footer = document.getElementById('global-footer');
    if (footer) footer.classList.remove('hidden');

    window.scrollTo(0, 0);
}

// 6. ONBOARDING & SUPABASE SYNC
async function handleRegistration(e) {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;

    try {
        // 1. Check if user already exists in Supabase
        const { data: existingUser, error: fetchError } = await _supabase
            .from('registrations')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            // User exists, restore their state
            currentUser = existingUser;
            localStorage.setItem('labdox_user', JSON.stringify(currentUser));
            showToast("Welcome back! Synchronizing Career OS...");
            syncUI();
            showView('dashboard');
            return;
        }

        // 2. New User Registration
        const userData = {
            name: document.getElementById('reg-name').value,
            email: email,
            phone: document.getElementById('reg-phone').value,
            role: document.getElementById('reg-role').value,
            college: document.getElementById('reg-college').value,
            year: document.getElementById('reg-year').value,
            course: document.getElementById('reg-course').value,
            enrolled_courses: [document.getElementById('reg-course').value],
            xp_points: 0,
            completed_modules: []
        };

        const { error: insertError } = await _supabase
            .from('registrations')
            .insert([userData]);

        if (insertError) throw insertError;

        currentUser = userData;
        localStorage.setItem('labdox_user', JSON.stringify(currentUser));

        syncUI();
        showView('dashboard');
        showToast("Career OS Initialized Successfully!");

    } catch (err) {
        console.error("Supabase Sync Error:", err.message);
        alert("Sync Failed: " + err.message);
    }
}

// 13. COURSE REQUESTS (User Feedback)
async function submitCourseRequest() {
    const input = document.getElementById('course-request-input');
    const courseName = input.value.trim();

    if (!courseName) {
        showToast("Please enter a course name.");
        return;
    }

    try {
        const { error } = await _supabase
            .from('course_requests')
            .insert([{
                user_email: currentUser ? currentUser.email : "Guest/Anonymous",
                course_name: courseName
            }]);

        if (error) throw error;

        showToast("Request submitted successfully! 🚀");
        input.value = ""; // Clear input
    } catch (err) {
        console.error("Request failed:", err.message);
        showToast("Submission failed. Check Console.");
    }
}

// 7. CATALOG LOGIC (Guest Access Allowed)
function renderCatalog(filter = "") {
    const grid = document.getElementById('catalog-grid');
    const filtered = allCourses.filter(c =>
        c.title.toLowerCase().includes(filter.toLowerCase()) ||
        c.category.toLowerCase().includes(filter.toLowerCase())
    );

    grid.innerHTML = filtered.map(course => {
        const enrolledList = (currentUser && currentUser.enrolled_courses) ? currentUser.enrolled_courses : [];
        const isEnrolled = enrolledList.includes(course.id) || enrolledList.includes(course.title);

        return `
            <div class="glass-card card-fade">
                <span class="badge-hero">${course.category}</span>
                <h3>${course.title}</h3>
                <p>${course.desc}</p>
                <div style="margin-top:20px">
                    ${!currentUser ?
                `<button class="btn-outline" onclick="showView('login')">Login to Enroll</button>` :
                isEnrolled ?
                    `<div style="display:flex; gap:10px;">
                                <button class="btn-continue" onclick="launchCourse('${course.id}')">Continue Learning ⚡</button>
                                <button class="btn-drop" onclick="dropCourse('${course.id}')">Drop Course</button>
                            </div>` :
                    `<button class="btn-enroll" onclick="enrollInCourse('${course.id}')">Enroll Now →</button>`
            }
                </div>
            </div>
        `;
    }).join('');
}

async function enrollInCourse(courseId) {
    if (!currentUser) {
        showView('login');
        return;
    }

    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    const isAlreadyEnrolled = currentUser.enrolled_courses.includes(course.id) || currentUser.enrolled_courses.includes(course.title);

    if (!isAlreadyEnrolled) {
        currentUser.enrolled_courses.push(courseId);

        // Sync with Supabase
        const { error } = await _supabase
            .from('registrations')
            .update({ enrolled_courses: currentUser.enrolled_courses })
            .eq('email', currentUser.email);

        if (!error) {
            localStorage.setItem('labdox_user', JSON.stringify(currentUser));
            showToast("Enrolled successfully in " + course.title);
            renderCatalog();
        } else {
            console.error("Sync Error:", error.message);
            showToast("Sync Error: " + error.message);
        }
    }
}

async function dropCourse(courseId) {
    if (!currentUser) return;

    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    if (confirm(`Are you sure you want to drop ${course.title}?`)) {
        currentUser.enrolled_courses = currentUser.enrolled_courses.filter(id => id !== courseId && id !== course.title);

        // Sync with Supabase
        const { error } = await _supabase
            .from('registrations')
            .update({ enrolled_courses: currentUser.enrolled_courses })
            .eq('email', currentUser.email);

        if (!error) {
            localStorage.setItem('labdox_user', JSON.stringify(currentUser));
            showToast("Course dropped successfully.");

            if (activeCourse && activeCourse.id === courseId) activeCourse = null;

            renderCatalog();
            renderDashboard();
        } else {
            console.error("Sync Error:", error.message);
            showToast("Sync Error: " + error.message);
        }
    }
}

// 8. DASHBOARD (Enrolled Courses)
function renderDashboard() {
    const grid = document.getElementById('my-courses-grid');
    if (!currentUser) return;

    document.getElementById('display-name').innerText = currentUser.name.split(' ')[0];

    // Filter courses the user has access to
    const enrolledList = currentUser.enrolled_courses || [];
    const myCourses = allCourses.filter(c =>
        enrolledList.includes(c.id) ||
        enrolledList.includes(c.title)
    );

    if (myCourses.length === 0) {
        grid.innerHTML = `<div class="full-width"><p>You aren't enrolled in any modules yet. <a href="#" onclick="showView('catalog')">Browse Catalog</a></p></div>`;
        return;
    }

    grid.innerHTML = myCourses.map(course => `
        <div class="glass-card">
            <span class="badge-hero">${course.category}</span>
            <h3>${course.title}</h3>
            <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:20px;">${course.desc.substring(0, 60)}...</p>
            <div style="display:flex; gap:10px;">
                <button class="btn-continue" onclick="launchCourse('${course.id}')">Continue Learning ⚡</button>
                <button class="btn-drop" onclick="dropCourse('${course.id}')">Drop Course</button>
            </div>
        </div>
    `).join('');
}

// 9. LMS PLAYER ENGINE
function launchCourse(courseId) {
    activeCourse = allCourses.find(c => c.id === courseId);
    showView('player');
    renderCurriculum();
    loadModule(0); // Start with first module
}

function renderCurriculum() {
    const list = document.getElementById('curriculum-list');

    // Calculate Progress Bar
    const completedCount = currentUser.completed_modules.length;
    const totalCount = activeCourse.modules.length;
    const progressPercent = (completedCount / totalCount) * 100;
    document.getElementById('course-progress-fill').style.width = progressPercent + "%";

    list.innerHTML = activeCourse.modules.map((mod, index) => {
        // Determine status dot
        let statusHtml = '';
        if (currentUser.completed_modules.includes(mod.id)) {
            statusHtml = '<span class="status-dot dot-done"></span>';
        } else if (localStorage.getItem(`progress_${currentUser.email}_${mod.id}`)) {
            statusHtml = '<span class="status-dot dot-progress"></span>';
        }

        return `
            <button class="curr-item ${index === activeModuleIndex ? 'active' : ''}" onclick="loadModule(${index})">
                <span class="icon">${mod.type === 'video' ? '▶' : mod.type === 'pdf' ? '📄' : '❓'}</span>
                <div class="curr-text">
                    <strong>${index + 1}. ${mod.title}</strong>
                    <small>${mod.duration || 'Assessment'}</small>
                </div>
                ${statusHtml}
            </button>
        `;
    }).join('');
}

function loadModule(index) {
    activeModuleIndex = index;
    const mod = activeCourse.modules[index];

    // 1. Mark as In Progress when clicked
    if (!currentUser.completed_modules.includes(mod.id)) {
        localStorage.setItem(`progress_${currentUser.email}_${mod.id}`, 'active');
    }

    // 2. Handle PDF Download Button visibility
    const downloadBtn = document.getElementById('pdf-download-link');
    if (mod.type === 'pdf') {
        downloadBtn.classList.remove('hidden');
        downloadBtn.href = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; // Replace with real link
    } else {
        downloadBtn.classList.add('hidden');
    }

    // 3. Show Action Area
    document.getElementById('module-action-area').classList.remove('hidden');

    // ... (rest of your existing loadModule code below)
    renderCurriculum();
    document.getElementById('lesson-title').innerText = mod.title;
    // ...
}

// 10. ASSESSMENT ENGINE (MCQ & Fill-in-blanks)
function renderQuiz(module) {
    const mount = document.getElementById('quiz-mount');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('submit-quiz-btn').classList.remove('hidden');

    mount.innerHTML = module.questions.map((q, i) => `
        <div class="quiz-q-box">
            <p><strong>Question ${i + 1}:</strong> ${q.q}</p>
            ${q.type === 'mcq' ?
            q.options.map((opt, oi) => `
                    <label style="display:block; margin:10px 0;">
                        <input type="radio" name="q${i}" value="${oi}"> ${opt}
                    </label>
                `).join('')
            :
            `<input type="text" id="ans${i}" placeholder="Type answer here..." class="lms-input">`
        }
        </div>
    `).join('');

    document.getElementById('submit-quiz-btn').onclick = () => processAssessment(module);
}

async function processAssessment(module) {
    let score = 0;
    module.questions.forEach((q, i) => {
        if (q.type === 'mcq') {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            if (selected && parseInt(selected.value) === q.correct) score++;
        } else {
            const val = document.getElementById(`ans${i}`).value.toLowerCase().trim();
            if (val === q.correct) score++;
        }
    });

    // Gamification Logic: Award XP points even for partials
    const total = module.questions.length;
    const xpGained = Math.round((score / total) * 100);

    currentUser.xp_points += xpGained;

    // Sync XP with Supabase
    const { error } = await _supabase
        .from('registrations')
        .update({ xp_points: currentUser.xp_points })
        .eq('email', currentUser.email);

    if (!error) {
        localStorage.setItem('labdox_user', JSON.stringify(currentUser));
        syncUI();

        // Show Results
        document.getElementById('quiz-mount').innerHTML = "";
        document.getElementById('submit-quiz-btn').classList.add('hidden');
        const resBox = document.getElementById('quiz-result');
        resBox.classList.remove('hidden');
        document.getElementById('xp-result-text').innerText = `Score: ${score} / ${total}`;
        document.getElementById('xp-added-msg').innerText = `Success! +${xpGained} XP Synchronized to Cloud.`;

        // Gamification: Confetti Celebration
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#d1b3ff', '#ffffff'] });
        }
    } else {
        console.error("Sync Error:", error.message);
        showToast("Sync Error: " + error.message);
    }
}

function resetCurrentModule() {
    loadModule(activeModuleIndex);
}

// 11. UTILITIES
function syncUI() {
    if (!currentUser) return;
    document.getElementById('nav-actions').classList.remove('hidden');
    document.getElementById('auth-btns').classList.add('hidden');
    document.getElementById('xp-count').innerText = currentUser.xp_points;
    document.getElementById('user-avatar').innerText = currentUser.name[0].toUpperCase();

    // NEW: Header XP Progress Bar Animation
    const xpFill = document.getElementById('header-xp-fill');
    if (xpFill) {
        // Milestone logic: Assumes 1000 XP is the next major target for visual filling
        const nextMilestone = 1000;
        const xpPercent = Math.min((currentUser.xp_points / nextMilestone) * 100, 100);
        xpFill.style.width = `${xpPercent}%`;
    }

    // Conditional Footer CTA
    const footerCTA = document.getElementById('footer-cta-section');
    if (footerCTA) footerCTA.style.display = 'none';

    // Role based visibility
    if (['Admin', 'Instructor'].includes(currentUser.role)) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }

    // NEW: Sync Achievement Badges
    syncBadges();

    // NEW: Show AI Mentor only to logged in users
    const aiBtn = document.getElementById('ai-mentor-btn');
    if (aiBtn) aiBtn.classList.remove('hidden');
}

// 14. ACHIEVEMENT SYSTEM
function syncBadges() {
    const earnedBadges = currentUser.badges || [];

    // Quick Starter (1st Course)
    if (currentUser.enrolled_courses.length >= 1 && !earnedBadges.includes('quick-starter')) {
        awardBadge('quick-starter');
    }

    // XP Overlord (1000 XP)
    if (currentUser.xp_points >= 1000 && !earnedBadges.includes('xp-overlord')) {
        awardBadge('xp-overlord');
    }

    // Topic Master (5 modules)
    if (currentUser.completed_modules.length >= 5 && !earnedBadges.includes('topic-master')) {
        awardBadge('topic-master');
    }

    // Update UI: Move to correct grids
    const badgeIds = ['quick-starter', 'xp-overlord', 'topic-master'];
    const unlockedGrid = document.getElementById('unlocked-milestones-grid');
    const lockedGrid = document.getElementById('locked-milestones-grid');

    badgeIds.forEach(id => {
        const el = document.getElementById(`milestone-${id}`);
        if (el) {
            if (earnedBadges.includes(id)) {
                el.classList.remove('locked');
                el.classList.add('unlocked');
                if (unlockedGrid) unlockedGrid.appendChild(el);
            } else {
                el.classList.add('locked');
                el.classList.remove('unlocked');
                if (lockedGrid) lockedGrid.appendChild(el);
            }
        }
    });

    // Auto-hide empty sections
    if (unlockedGrid) {
        const earnedHeading = document.getElementById('earned-heading');
        if (unlockedGrid.children.length === 0) {
            unlockedGrid.style.display = 'none';
            if (earnedHeading) earnedHeading.style.display = 'none';
        } else {
            unlockedGrid.style.display = 'grid';
            if (earnedHeading) earnedHeading.style.display = 'block';
        }
    }

    if (lockedGrid) {
        const lockedHeading = document.getElementById('locked-heading');
        if (lockedGrid.children.length === 0) {
            lockedGrid.style.display = 'none';
            if (lockedHeading) lockedHeading.style.display = 'none';
        } else {
            lockedGrid.style.display = 'grid';
            if (lockedHeading) lockedHeading.style.display = 'block';
        }
    }
}

async function awardBadge(badgeId) {
    if (!currentUser.badges) currentUser.badges = [];
    if (currentUser.badges.includes(badgeId)) return;

    currentUser.badges.push(badgeId);

    try {
        const { error } = await _supabase
            .from('registrations')
            .update({ badges: currentUser.badges })
            .eq('email', currentUser.email);

        if (error) throw error;

        showToast(`🏆 New Achievement Unlocked: ${badgeId.replace('-', ' ')}!`);
        localStorage.setItem('labdox_user', JSON.stringify(currentUser));
        syncBadges();
    } catch (err) {
        console.error("Badge Award Failed:", err.message);
    }
}

function logout() {
    localStorage.removeItem('labdox_user');
    location.reload();
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'glass-card toast-fade';
    toast.style.cssText = "position:fixed; bottom:20px; right:20px; padding:15px 25px; background:var(--accent); z-index:9999;";
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Check Auth for Home Redirects
function checkAuthAndRedirect() {
    if (currentUser) showView('dashboard');
    else showView('login');
}

async function markModuleComplete() {
    const mod = activeCourse.modules[activeModuleIndex];

    if (!currentUser.completed_modules.includes(mod.id)) {
        currentUser.completed_modules.push(mod.id);
        currentUser.xp_points += 20; // Bonus XP for completion

        // Sync with Supabase
        const { error } = await _supabase
            .from('registrations')
            .update({
                completed_modules: currentUser.completed_modules,
                xp_points: currentUser.xp_points
            })
            .eq('email', currentUser.email);

        if (!error) {
            // Save to local storage
            localStorage.setItem('labdox_user', JSON.stringify(currentUser));
            // Remove "in progress" status
            localStorage.removeItem(`progress_${currentUser.email}_${mod.id}`);

            showToast("Module Completed! XP Updated.");
            syncUI();
            renderCurriculum();

            // Gamification: Confetti Celebration
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#d1b3ff', '#ffffff'] });
            }
        } else {
            console.error("Sync Error:", error.message);
            showToast("Sync Error: " + error.message);
        }
    }
}

// --- ADMIN / INSTRUCTOR LOGIC ---

function createNewModule() {
    // 1. Get values from the Admin Form in index.html
    const title = document.getElementById('new-module-name').value;
    const desc = document.getElementById('new-module-desc').value;
    const link = document.getElementById('new-module-video').value;

    if (!title || !desc) {
        alert("Please fill in the Module Title and Description.");
        return;
    }

    // 2. Create the new module object
    // It detects if it's a video or PDF based on the link
    const newMod = {
        id: "mod-" + Date.now(),
        title: title,
        content: desc,
        type: link.includes('youtube') || link.includes('embed') ? "video" : "pdf",
        videoUrl: link,
        duration: "10 mins"
    };

    // 3. Add it to the first course (Web Dev & AI) for testing
    // In a real LMS, you'd select which course to add it to.
    allCourses[0].modules.push(newMod);

    // 4. Success feedback
    showToast("Module Successfully Published!");

    // 5. Clear the form
    document.getElementById('new-module-name').value = "";
    document.getElementById('new-module-desc').value = "";
    document.getElementById('new-module-video').value = "";

    // 6. If the user is currently looking at the dashboard, refresh it
    renderDashboard();
}

// --- 15. AI MENTOR LOGIC ---
function toggleAIChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    chatWindow.classList.toggle('hidden');
}

function sendAIMessage() {
    const inputField = document.getElementById('ai-chat-input');
    const msg = inputField.value.trim();
    if (!msg) return;

    const chatBody = document.getElementById('ai-chat-body');

    // 1. Add User Msg
    const userDiv = document.createElement('div');
    userDiv.className = 'ai-msg user-msg';
    userDiv.innerText = msg;
    chatBody.appendChild(userDiv);

    inputField.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Simulate AI Typing / Response
    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'ai-msg bot-msg';
        botDiv.innerText = getBotResponse(msg);
        chatBody.appendChild(botDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 800);
}

function getBotResponse(userMsg) {
    const lower = userMsg.toLowerCase();

    // Greetings & Small Talk
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) return "Hello there! I'm your Labdox AI Mentor. How can I help you accelerate your engineering career today?";
    if (lower.includes('thanks') || lower.includes('thank you')) return "You're very welcome! Keep up the great work.";
    if (lower.includes('who are you')) return "I am the Labdox AI Mentor! I exist to help you navigate courses, understand tech concepts, and level up your skills.";
    if (lower.includes('bye')) return "Goodbye! Keep coding, and see you back on the dashboard soon!";
    if (lower.includes('joke')) return "Why do programmers prefer dark mode? Because light bugs them! 🐛";

    // Gamification & System
    if (lower.includes('xp') || lower.includes('points')) return "XP (Experience Points) show your overall progress. You earn +20 XP every time you complete a module, plus extra XP for scoring well on quizzes. Hit 1000 XP to become an XP Overlord!";
    if (lower.includes('badge') || lower.includes('milestone')) return "Badges are professional milestones. You can unlock them by completing courses, reaching 1000 XP, or mastering multiple modules. They look great on your profile!";
    if (lower.includes('profile') || lower.includes('avatar')) return "Your profile displays your total XP, unlocked achievements, and enrolled courses. As you learn, your virtual portfolio grows!";
    if (lower.includes('login') || lower.includes('auth')) return "You are already logged into the Learning Management OS! That's why you can see me securely.";

    // Tech Stack & Languages
    if (lower.includes('react')) return "React is a fantastic UI library! Remember that it uses a Virtual DOM and a unidirectional data flow. If you're stuck, try breaking your UI into smaller, reusable components.";
    if (lower.includes('javascript') || lower.includes('js')) return "JavaScript forms the core of modern web development! A great tip: master Promises and async/await for smooth API calls.";
    if (lower.includes('python')) return "Python is amazing for Backend, AI, and Automation. Make sure you understand dictionaries, list comprehensions, and basic OOP principles!";
    if (lower.includes('html') || lower.includes('css')) return "HTML and CSS are the building blocks! For modern UI layouts, CSS Flexbox and CSS Grid are absolute game-changers.";
    if (lower.includes('backend') || lower.includes('database') || lower.includes('sql') || lower.includes('supabase')) return "For backends, understanding databases (like PostgreSQL/Supabase) is crucial. Always normalize your data and use indexes on frequently searched columns.";
    if (lower.includes('ai') || lower.includes('machine learning')) return "AI is the future! Focus on learning Python, basics of linear algebra, and getting comfortable using APIs like OpenAI or Gemini.";

    // Career & Learning Advice
    if (lower.includes('resume') || lower.includes('cv')) return "A great engineering resume should focus on *impact*. Instead of 'used React', say 'Built a React dashboard that reduced loading times by 40%'.";
    if (lower.includes('interview')) return "For interviews, practice speaking your thoughts out loud while coding. Interviewers care more about *how* you solve problems than getting the exact right syntax.";
    if (lower.includes('internship') || lower.includes('job')) return "To get a job or internship, build 2-3 polished, real-world projects, put them on GitHub, and deploy them live. Then start networking actively on LinkedIn!";
    if (lower.includes('portfolio')) return "Your portfolio is your proof of work! Include your best projects, a clean UI, live links, and the source code link.";
    if (lower.includes('stuck') || lower.includes('error') || lower.includes('bug')) return "Everyone gets stuck! Try rubber-duck debugging (explaining the code out loud), Googling the exact error message, or taking a 10-minute walk away from the screen.";

    // Course navigation
    if (lower.includes('course') || lower.includes('enroll')) return "You can find all available learning tracks in the 'Course Catalog'. Click 'Enroll Now' on any course to add it to your active dashboard.";
    if (lower.includes('module') || lower.includes('lesson')) return "Each course is split into bite-sized modules. Watch the video, then hit 'Mark as Completed' to trigger confetti and earn your XP!";
    if (lower.includes('quiz') || lower.includes('test')) return "Quizzes test your understanding at the end of modules. Answer correctly to earn bonus XP and boost your rank!";

    // Help / Fallback
    if (lower.includes('help')) return "I'm here to help! You can ask me for coding advice (like React or Python tips), career advice (resumes or interviews), or how to navigate the platform.";

    return "That's an interesting question! I am currently pulling from a pre-programmed knowledge base. I'd love to discuss that more once I'm hooked up to a live LLM backend!";
}

// --- 16. SKILLS RADAR CHART ---
let skillsChart = null;
function renderSkillsRadar() {
    const ctx = document.getElementById('skillsRadar');
    if (!ctx || !currentUser) return;

    // Dynamic calculation mapping to 100 max per skill
    const mods = currentUser.completed_modules.length;
    const xp = currentUser.xp_points;
    const badges = (currentUser.badges || []).length;

    // Algorithm for skill levels
    let frontend = Math.min(30 + (mods * 10), 100);
    let backend = Math.min(20 + (xp / 30), 100);
    let ds = Math.min(40 + Math.floor(xp / 100), 100);
    let ai = Math.min(10 + (badges * 20), 100);
    let uiux = Math.min(45 + (mods * 5), 100);

    const data = {
        labels: ['Frontend Dev', 'Backend Dev', 'Data Structures', 'AI / Prompting', 'UI/UX Design'],
        datasets: [{
            label: 'Current Skill Level',
            data: [frontend, backend, ds, ai, uiux],
            backgroundColor: 'rgba(139, 92, 246, 0.25)', // Glass purple fill
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                    grid: { color: 'rgba(255, 255, 255, 0.15)' },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: { size: 13, family: "'Outfit', sans-serif" }
                    },
                    ticks: {
                        display: false, // Hide numeric rings
                        min: 0,
                        max: 100,
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 29, 0.9)',
                    titleFont: { size: 14, family: "'Outfit', sans-serif" },
                    bodyFont: { size: 13, family: "'Outfit', sans-serif" },
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            }
        }
    };

    if (skillsChart) {
        skillsChart.data = data;
        skillsChart.update();
    } else {
        // Must set parent height explicitly if maintainAspectRatio is false
        ctx.parentNode.style.height = '400px';
        skillsChart = new Chart(ctx, config);
    }
}