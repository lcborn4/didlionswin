// Simple test to see if JavaScript executes on deployed site
console.log('Simple test script loaded');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testJavaScript);
} else {
    testJavaScript();
}

function testJavaScript() {
    console.log('DOM is ready, testing JavaScript execution...');

    const gameImagesEl = document.getElementById('game-images');
    if (gameImagesEl) {
        console.log('Found game-images element, updating...');
        gameImagesEl.innerHTML = '<img src="/images/good/aslan-roar.gif" alt="Lions win" style="max-width: 300px; height: auto;" /><p style="margin-top: 1rem; font-size: 1.2rem;">💡 TEST: JavaScript is working!</p>';
        console.log('Updated image to aslan-roar.gif');
    } else {
        console.log('Could not find game-images element');
    }
}
