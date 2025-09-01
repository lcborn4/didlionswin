// Simple test script
console.log('TEST: Simple script loaded and executing');

try {
    console.log('TEST: About to check document.readyState');
    console.log('TEST: Document ready state:', document.readyState);
    console.log('TEST: Successfully checked document.readyState');
} catch (error) {
    console.error('TEST: Error checking document.readyState:', error);
}

function testDOM() {
    console.log('TEST: Running DOM test');

    const gameResult = document.getElementById('game-result');
    console.log('TEST: gameResult element:', gameResult);

    if (gameResult) {
        console.log('TEST: Found element, updating...');
        gameResult.textContent = 'SIMPLE TEST WORKED!';
        gameResult.style.background = 'yellow';
        gameResult.style.color = 'black';
        console.log('TEST: Element updated successfully');
    } else {
        console.log('TEST: Could not find game-result element');
        console.log('TEST: Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    }
}

// Try immediately if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('TEST: DOM still loading, waiting...');
    document.addEventListener('DOMContentLoaded', testDOM);
} else {
    console.log('TEST: DOM already loaded, running test immediately');
    testDOM();
}
