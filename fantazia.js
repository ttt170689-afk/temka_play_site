'use strict';
// No game download or launch action exists until the author supplies a release.
document.getElementById('projectYear').textContent=String(new Date().getFullYear());
document.querySelectorAll('[data-wishlist]').forEach(button=>{button.hidden=false;});
