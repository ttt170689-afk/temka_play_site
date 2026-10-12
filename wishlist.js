'use strict';
(()=>{
const $=id=>document.getElementById(id);
// Device-local wishlist, intentionally separate from the installed launcher.
const key='temka-site-wishlist-v1';let wishlist=[];
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))wishlist=saved.filter(x=>x==='temkaworld'||x==='fantazia');}catch{}
function paintWishlist(){document.querySelectorAll('[data-wishlist]').forEach(b=>{const active=wishlist.includes(b.dataset.wishlist);b.setAttribute('aria-pressed',String(active));b.textContent=active?'✓ В вишлисте':'♡ В вишлист';});}
document.querySelectorAll('[data-wishlist]').forEach(b=>b.addEventListener('click',()=>{
 const id=b.dataset.wishlist,added=!wishlist.includes(id),next=added?[...wishlist,id]:wishlist.filter(x=>x!==id);
 try{localStorage.setItem(key,JSON.stringify(next));wishlist=next;paintWishlist();$('wishlistStatus').textContent=added?'Добавлено в вишлист ✓ Без почты. Сохранено только в этом браузере.':'Убрано из вишлиста.';}
 catch{$('wishlistStatus').textContent='Не удалось сохранить: локальное хранилище недоступно.';}
}));paintWishlist();
})();
