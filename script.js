const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Contact Modal Logic
const contactModal = document.getElementById('contactModal');
const contactBtn = document.querySelector('a[href="#contact"].btn-outline');
const closeModal = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        contactModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

const closeFunc = () => {
    contactModal.classList.remove('active');
    document.body.style.overflow = '';
    formStatus.style.display = 'none';
};

closeModal.addEventListener('click', closeFunc);
contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeFunc();
});

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const message = document.getElementById('message').value;
    
    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending...';
    formStatus.style.display = 'block';
    formStatus.style.color = 'var(--muted)';
    formStatus.innerText = 'Transmitting sequence...';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, message })
        });

        const result = await response.json();

        if (response.ok) {
            formStatus.style.color = '#4ade80';
            formStatus.innerText = 'Transmission received. Talk soon.';
            contactForm.reset();
            setTimeout(closeFunc, 2000);
        } else {
            throw new Error(result.error || 'Transmission failed.');
        }
    } catch (error) {
        formStatus.style.color = '#f87171';
        formStatus.innerText = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Send Transmission';
    }
});

// Status Widgets Refresh (Music & Reading)
const musicWidget = document.getElementById('music-widget');
const musicTitle = musicWidget.querySelector('.music-title');
const musicArtist = musicWidget.querySelector('.music-artist');
const musicArt = document.getElementById('music-art');
const musicArtFallback = document.getElementById('music-art-fallback');

const readingWidget = document.getElementById('reading-widget');
const readingTitle = readingWidget.querySelector('.reading-title');
const readingAuthor = readingWidget.querySelector('.reading-author');
const readingArt = document.getElementById('reading-art');
const readingArtFallback = document.getElementById('reading-art-fallback');

let readingBooks = [];
let currentBookIndex = 0;

// Image error handling
musicArt.onerror = () => {
    musicArt.style.display = 'none';
    musicArtFallback.style.display = 'flex';
};

readingArt.onerror = () => {
    readingArt.style.display = 'none';
    if (readingArtFallback) readingArtFallback.style.display = 'flex';
};

async function updateMusic() {
    try {
        const res = await fetch('/api/now-playing');
        const data = await res.json();

        if (data.isPlaying) {
            musicTitle.innerText = data.title;
            musicArtist.innerText = data.artist;
            musicWidget.href = data.songUrl;
            
            // Reset art state
            musicArt.style.display = 'block';
            musicArtFallback.style.display = 'none';
            musicArt.src = data.albumImageUrl;
            
            musicWidget.classList.add('visible');
        } else {
            musicWidget.classList.remove('visible');
        }
    } catch (err) {
        console.error('Music update error:', err);
        musicWidget.classList.remove('visible');
    }
}

async function updateReading() {
    try {
        const res = await fetch('/api/reading');
        const data = await res.json();

        if (data.isReading && data.books.length > 0) {
            readingBooks = data.books;
            renderBook();
            readingWidget.classList.add('visible');
        } else {
            readingWidget.classList.remove('visible');
        }
    } catch (err) {
        console.error('Reading update error:', err);
        readingWidget.classList.remove('visible');
    }
}

function renderBook() {
    if (readingBooks.length === 0) return;
    const book = readingBooks[currentBookIndex];
    
    // Subtle transition
    readingWidget.style.opacity = '0.4';
    readingWidget.style.transform = 'translateY(5px)';
    
    setTimeout(() => {
        readingTitle.innerText = book.title;
        readingAuthor.innerText = book.author;
        readingArt.style.display = 'block';
        if (readingArtFallback) readingArtFallback.style.display = 'none';
        readingArt.src = book.imageUrl;
        readingWidget.href = book.bookUrl;
        
        readingWidget.style.opacity = '1';
        readingWidget.style.transform = 'translateY(0)';
    }, 300);
}

function changeBook(direction) {
    if (readingBooks.length <= 1) return;
    currentBookIndex = (currentBookIndex + direction + readingBooks.length) % readingBooks.length;
    renderBook();
}

// Initial fetch
updateMusic();
updateReading();

// Poll Music every 45s, Reading every 10 minutes
setInterval(updateMusic, 45000);
setInterval(updateReading, 600000);
