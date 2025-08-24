// Supabase Configuration
const SUPABASE_URL = 'https://ygpkzqivuhuztjityeik.supabase.co';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncGt6cWl2dWh1enRqaXR5ZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODQwNTIsImV4cCI6MjA3MTM2MDA1Mn0.2u5e1XQR1nQNjp9yEPCDukwzgpvLaU0eW5UiJ2ST30I';

// Rank Hierarchy (URUTAN DIPERBAIKI: dari rank tertinggi/termahal ke terendah/termurah)
const RANK_HIERARCHY = ['owner', 'developer', 'moderator', 'builder', 'helper', 'defaultcustom', 'omega', 'epsilon', 'alpha', 'beta', 'rajin', 'default'];

// Rank display mapping
const RANK_DISPLAY_MAP = {
    'default': 'BAKWAN',
    'rajin': 'JAGUNG',
    'beta': 'BETA',
    'alpha': 'ALPHA',
    'epsilon': 'EPSILON',
    'omega': 'OMEGA',
    'defaultcustom': 'CUSTOM',
    'helper': 'STAFF',
    'builder': 'STAFF',
    'moderator': 'STAFF',
    'developer': 'STAFF',
    'owner': 'OWNER'
};

// Rank price mapping (tambahkan harga untuk setiap rank)
const RANK_PRICE_MAP = {
    'default': 0,
    'rajin': 0,
    'beta': 40000,
    'alpha': 80000,
    'epsilon': 120000,
    'omega': 240000,
    'defaultcustom': 350000,
    'admin': 0,
    'helper': 0,
    'builder': 0,
    'moderator': 0,
    'developer': 0,
    'owner': 0
};

// List semua rank staff
const STAFF_RANKS = ['helper', 'builder', 'moderator', 'developer', 'owner'];

// Current user state
let currentUser = {
    username: null,
    rank: null,
    isLoggedIn: false
};

// DOM Elements
const loginModal = document.getElementById('loginModal');
const userInfoBar = document.getElementById('userInfoBar');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const loginButton = document.getElementById('loginButton');
const loginButtonText = document.getElementById('loginButtonText');
const loginSpinner = document.getElementById('loginSpinner');
const usernameError = document.getElementById('usernameError');
const loginStatus = document.getElementById('loginStatus');
const displayUsername = document.getElementById('displayUsername');
const displayRank = document.getElementById('displayRank');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('bakwanjagung_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser.isLoggedIn) {
                hideLoginModal();
                showUserInfo();
                updatePricing();
                return;
            }
        } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('bakwanjagung_user');
        }
    }
    
    // Show login modal if not logged in
    showLoginModal();
}

function setupEventListeners() {
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            // Hide mobile menu if open
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });
    
    // Purchase button handlers
    setupPurchaseButtons();
    
    // FAQ functionality
    setupFAQs();
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    if (!username) {
        showError('Please enter your username');
        return;
    }
    
    setLoadingState(true);
    clearError();
    
    try {
        const userRank = await fetchUserRank(username);
        
        if (userRank) {
            currentUser = {
                username: username,
                rank: userRank,
                isLoggedIn: true
            };
            
            // Save to localStorage
            localStorage.setItem('bakwanjagung_user', JSON.stringify(currentUser));
            
            showSuccess(`Welcome back, ${username}! Your rank: ${getRankDisplay(userRank)}`);
            
            setTimeout(() => {
                hideLoginModal();
                showUserInfo();
                updatePricing();
            }, 1500);
            
        } else {
            showError('Username not found in our data. Please make sure you have joined the server at least once.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again later.');
    } finally {
        setLoadingState(false);
    }
}

async function fetchUserRank(username) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/player_ranks?username=eq.${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_API_KEY,
                'Authorization': `Bearer ${SUPABASE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return data[0].rank;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error fetching user rank:', error);
        throw error;
    }
}

// Helper function to get rank display text
function getRankDisplay(rank) {
    return RANK_DISPLAY_MAP[rank.toLowerCase()] || rank.toUpperCase();
}

// Helper function to get rank price
function getRankPrice(rank) {
    return RANK_PRICE_MAP[rank.toLowerCase()] || 0;
}

// Helper function to get rank index in hierarchy (0 = highest rank)
function getRankIndex(rank) {
    const normalizedRank = rank.toLowerCase();
    return RANK_HIERARCHY.indexOf(normalizedRank);
}

// Helper function to check if user is staff
function isStaffRank(rank) {
    return STAFF_RANKS.includes(rank.toLowerCase());
}

function updatePricing() {
    if (!currentUser.isLoggedIn || !currentUser.rank) return;
    
    const userRank = currentUser.rank.toLowerCase();
    console.log("User rank:", userRank, "Price:", getRankPrice(userRank), "Is staff:", isStaffRank(userRank));
    
    const userRankIndex = getRankIndex(userRank);
    console.log("User rank index:", userRankIndex);
    
    if (userRankIndex === -1) {
        console.log("Rank not found in hierarchy");
        return;
    }
    
    const userIsStaff = isStaffRank(userRank);
    
    // Update rank pricing
    document.querySelectorAll('[data-rank]').forEach(card => {
        const cardRank = card.getAttribute('data-rank').toLowerCase();
        const cardRankIndex = getRankIndex(cardRank);
        const cardOriginalPrice = parseInt(card.getAttribute('data-price'));
        
        console.log("Card rank:", cardRank, "Index:", cardRankIndex, "Original price:", cardOriginalPrice);
        
        if (cardRankIndex !== -1) {
            const priceElement = card.querySelector('.rank-price');
            const buyButton = card.querySelector('.buy-button');
            
            if (priceElement && buyButton) {
                // Check if user is staff - jika staff, semua rank gratis
                if (userIsStaff) {
                    priceElement.classList.add('free');
                    priceElement.textContent = '0RP';
                    buyButton.textContent = 'OWNED';
                    buyButton.disabled = true;
                    buyButton.classList.remove('btn-primary');
                    buyButton.classList.add('bg-green-600', 'cursor-not-allowed');
                    card.setAttribute('data-discounted-price', 0);
                } 
                // Check if user already owns this rank or higher (lower index = higher rank)
                else if (cardRankIndex >= userRankIndex) {
                    // User already owns this rank or higher
                    priceElement.classList.add('free');
                    priceElement.textContent = '0RP';
                    buyButton.textContent = 'OWNED';
                    buyButton.disabled = true;
                    buyButton.classList.remove('btn-primary');
                    buyButton.classList.add('bg-green-600', 'cursor-not-allowed');
                    card.setAttribute('data-discounted-price', 0);
                } else {
                    // User doesn't own this rank yet, calculate discounted price
                    priceElement.classList.remove('free');
                    const userRankPrice = getRankPrice(userRank);
                    const targetRankPrice = getRankPrice(cardRank);
                    
                    // Calculate discounted price (target price minus user's current rank price)
                    const discountedPrice = Math.max(0, targetRankPrice - userRankPrice);
                    
                    priceElement.textContent = `RP ${discountedPrice.toLocaleString('id-ID')}`;
                    buyButton.textContent = 'BUY NOW';
                    buyButton.disabled = false;
                    buyButton.classList.remove('bg-green-600', 'cursor-not-allowed');
                    buyButton.classList.add('btn-primary');
                    
                    // Store the prices for use in WhatsApp message
                    card.setAttribute('data-discounted-price', discountedPrice);
                    card.setAttribute('data-original-price', targetRankPrice);
                }
            }
        }
    });
}

function setupPurchaseButtons() {
    // Rank purchase buttons
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.disabled) return;
            
            const card = this.closest('.card');
            const rankName = card.querySelector('h3').textContent;
            const rankValue = card.getAttribute('data-rank').toLowerCase();
            const discountedPrice = card.getAttribute('data-discounted-price');
            const originalPrice = card.getAttribute('data-original-price');
            
            // Format harga untuk ditampilkan
            const formattedPrice = parseInt(discountedPrice).toLocaleString('id-ID');
            
            // Membuat pesan sesuai format yang diminta
            let message = `Hi saya ingin membeli rank ${rankName} dengan harga ${formattedPrice} RP\n`;
            message += `IGN : ${currentUser.username}\n`;
            message += `Rank saat ini : ${getRankDisplay(currentUser.rank)}`;
            
            const whatsappUrl = `https://wa.me/6287804812992?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    });
    
    // Permission purchase buttons (jika diperlukan)
    document.querySelectorAll('.buy-permission-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.card');
            const permissionName = card.querySelector('h3').textContent;
            const price = card.getAttribute('data-price');
            
            // Format pesan untuk permission
            let message = `Hi saya ingin membeli permission ${permissionName} dengan harga ${parseInt(price).toLocaleString('id-ID')} RP\n`;
            message += `IGN ${currentUser.username}\n`;
            message += `Rank ${getRankDisplay(currentUser.rank)}`;
            
            const whatsappUrl = `https://wa.me/6287804812992?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    });
}

// ... (fungsi-fungsi lainnya tetap sama seperti sebelumnya)

function setupFAQs() {
    // FAQ toggle functionality remains the same as original
    window.toggleFAQ = function(button) {
        button.classList.add('faq-click-animation');
        setTimeout(() => {
            button.classList.remove('faq-click-animation');
        }, 300);

        const faqItem = button.closest('.faq-item');
        const content = faqItem.querySelector('.faq-content');
        const icon = faqItem.querySelector('.faq-icon');
        
        content.classList.toggle('show');
        icon.classList.toggle('rotate');
        
        if (content.classList.contains('show')) {
            faqItem.style.boxShadow = '0 15px 35px rgba(255,140,0,0.2)';
            faqItem.style.transform = 'translateY(-5px)';
        } else {
            faqItem.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
            faqItem.style.transform = 'translateY(0)';
        }
    };
    
    // Close FAQs when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.faq-item') && !e.target.closest('.faq-button')) {
            document.querySelectorAll('.faq-content').forEach(content => {
                content.classList.remove('show');
            });
            document.querySelectorAll('.faq-icon').forEach(icon => {
                icon.classList.remove('rotate');
            });
            document.querySelectorAll('.faq-item').forEach(item => {
                item.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                item.style.transform = 'translateY(0)';
            });
        }
    });
}

// Feature toggle function
window.toggleFeatures = function(button) {
    const featuresList = button.closest('.card').querySelector('.features-list');
    featuresList.classList.toggle('hidden');
    button.textContent = featuresList.classList.contains('hidden') ? '▼ See Features' : '▲ Hide Features';
};

function showLoginModal() {
    loginModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        usernameInput.focus();
    }, 300);
}

function hideLoginModal() {
    loginModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showUserInfo() {
    if (currentUser.isLoggedIn) {
        displayUsername.textContent = currentUser.username;
        displayRank.textContent = getRankDisplay(currentUser.rank);
        userInfoBar.classList.remove('hidden');
    }
}

function logout() {
    currentUser = {
        username: null,
        rank: null,
        isLoggedIn: false
    };
    
    localStorage.removeItem('bakwanjagung_user');
    userInfoBar.classList.add('hidden');
    
    // Reset all pricing to original
    document.querySelectorAll('[data-rank]').forEach(card => {
        const priceElement = card.querySelector('.rank-price');
        const buyButton = card.querySelector('.buy-button');
        const originalPrice = card.getAttribute('data-price');
        
        if (priceElement) {
            priceElement.classList.remove('free');
            priceElement.textContent = `RP ${parseInt(originalPrice).toLocaleString('id-ID')}`;
        }
        
        if (buyButton) {
            buyButton.disabled = false;
            buyButton.textContent = 'BUY NOW';
            buyButton.classList.remove('bg-green-600', 'cursor-not-allowed');
            buyButton.classList.add('btn-primary');
        }
    });
    
    showLoginModal();
}

// Expose logout function globally
window.logout = logout;

function setLoadingState(loading) {
    if (loading) {
        loginButton.disabled = true;
        loginButtonText.textContent = 'LOGGING IN...';
        loginSpinner.classList.remove('hidden');
        loginButton.classList.add('loading');
    } else {
        loginButton.disabled = false;
        loginButtonText.textContent = 'LOGIN';
        loginSpinner.classList.add('hidden');
        loginButton.classList.remove('loading');
    }
}

function showError(message) {
    usernameError.textContent = message;
    usernameError.classList.remove('hidden');
    usernameInput.classList.add('error');
    loginStatus.classList.add('hidden');
}

function showSuccess(message) {
    loginStatus.textContent = message;
    loginStatus.className = 'text-center mt-4 text-sm text-green-400';
    loginStatus.classList.remove('hidden');
    usernameError.classList.add('hidden');
    usernameInput.classList.remove('error');
    usernameInput.classList.add('success');
}

function clearError() {
    usernameError.classList.add('hidden');
    usernameInput.classList.remove('error', 'success');
    loginStatus.classList.add('hidden');
}

// Add glow effect to purchase buttons
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('button.btn-primary').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('glow-effect');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('glow-effect');
        });
    });
});