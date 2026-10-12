/* Pure, deliberately conservative comparison of draft requirements. No FPS. */
(function(root){
'use strict';
const requirements={
 temkaworld:{title:'TemkaWorld',min:{cpu:1,gpu:1,ram:8,space:6,os:'win10',drive:'ssd',cpuName:'Intel Core i5-8400',gpuName:'GeForce GTX 1050 Ti'},rec:{cpu:3,gpu:3,ram:16,space:10,os:'win11',drive:'nvme',cpuName:'Intel Core i5-12400F',gpuName:'GeForce RTX 3060 (12GB)'}},
 fantazia:{title:'Fantazia RP 3D',min:{cpu:2,gpu:2,ram:12,space:25,os:'win10',drive:'ssd',cpuName:'Intel Core i5-10400',gpuName:'GeForce GTX 1660 SUPER'},rec:{cpu:4,gpu:4,ram:16,space:40,os:'win11',drive:'nvme',cpuName:'Intel Core i7-12700',gpuName:'GeForce RTX 3070'}}
};
const normalize=s=>String(s||'').toLowerCase().replace(/[®™]/g,'').replace(/\s+/g,' ').trim();
function findModel(catalog,kind,value){const n=normalize(value);return catalog.find(m=>m.kind===kind && normalize(m.name)===n)||null;}
function compare(config,req){
 const hw=(model,target)=>!model || !Number.isInteger(model.tier) || model.form!=='desktop'?'unknown':model.tier>=target?'pass':'below';
 const amount=(value,target)=>typeof value!=='number'||!Number.isFinite(value)||value<0?'unknown':value>=target?'pass':'below';
 const parts={cpu:hw(config.cpu,req.cpu),gpu:hw(config.gpu,req.gpu),ram:amount(config.ram,req.ram),space:amount(config.space,req.space),os:!['win10','win11'].includes(config.os)?'unknown':req.os==='win11'&&config.os!=='win11'?'below':'pass',drive:!['hdd','ssd','nvme'].includes(config.drive)?'unknown':config.drive==='hdd'||req.drive==='nvme'&&config.drive!=='nvme'?'below':'pass'};
 const values=Object.values(parts);
 return {parts,status:values.includes('below')?'below':values.includes('unknown')?'unknown':'pass'};
}
const api={requirements,findModel,compare};
if(typeof module!=='undefined' && module.exports){module.exports=api;return;}
root.TEMKA_CHECKER=api;
const $=id=>document.getElementById(id), catalog=root.TEMKA_HARDWARE||[];
if(!$('pcForm'))return;
const forms={desktop:'Дискретная / настольный ПК',mobile:'Ноутбук',integrated:'Встроенная',workstation:'Профессиональная',server:'Серверная'};
const stats={cpu:catalog.filter(m=>m.kind==='cpu').length,gpu:catalog.filter(m=>m.kind==='gpu').length,assessed:catalog.filter(m=>m.tier!==null).length};
$('catalogCount').textContent=`${stats.gpu} видеокарта · ${stats.cpu} процессора`;
$('catalogNote').textContent=`Каталог: ${stats.cpu+stats.gpu} модели. Ориентировочная группа назначена ${stats.assessed}; остальные доступны для выбора, но вывод будет «недостаточно данных». Это не список протестированного оборудования.`;
function refreshList(kind){
 const brand=$(kind+'Brand').value, form=$(kind+'Form').value, query=normalize($(kind+'Input').value);
 const candidates=catalog.filter(m=>m.kind===kind && (!brand||m.brand===brand) && (!form||m.form===form) && (!query||normalize(m.name).includes(query)));
 $(kind+'List').replaceChildren(...candidates.slice(0,100).map(m=>{const o=document.createElement('option');o.value=m.name;o.label=forms[m.form]+(m.tier===null?' · без оценки':' · черновой ориентир');return o;}));
 $(kind+'Count').textContent=`Найдено: ${candidates.length}${candidates.length>100?' · уточните поиск, показаны первые 100':''}. Не нашли? Оставьте своё название — не будем угадывать.`;
}
function stale(){if(!$('pcResult').hidden){$('pcStale').hidden=false;$('pcResult').setAttribute('aria-label','Предыдущий результат — пересчитайте после изменения');}}
['cpu','gpu'].forEach(kind=>{
 $(kind+'Input').addEventListener('input',()=>{refreshList(kind);stale();});
 ['Brand','Form'].forEach(suffix=>$(kind+suffix).addEventListener('change',()=>{refreshList(kind);stale();}));refreshList(kind);
});
$('pcForm').addEventListener('change',stale);
const labels={cpu:'Процессор',gpu:'Видеокарта',ram:'Оперативная память',space:'Свободное место',os:'Операционная система',drive:'Накопитель'};
const words={pass:'Ориентир соблюдён',below:'Ниже ориентира',unknown:'Недостаточно данных'};
function configFromForm(){
 const num=id=>$(id).value.trim()===''?NaN:Number($(id).value);
 return {cpu:findModel(catalog,'cpu',$('cpuInput').value),gpu:findModel(catalog,'gpu',$('gpuInput').value),ram:num('pcRam'),space:num('pcSpace'),os:$('pcOs').value,drive:$('pcDrive').value};
}
let report='';
$('pcForm').addEventListener('submit',event=>{
 event.preventDefault();const config=configFromForm();const key=$('pcGame').value;const req=requirements[key];const min=compare(config,req.min),rec=compare(config,req.rec);
 $('pcStale').hidden=true;$('pcResult').hidden=false;$('pcResult').removeAttribute('aria-label');
 const status=min.status==='below'?'below':min.status==='unknown'?'unknown':rec.status==='pass'?'recommended':'minimum';
 const titles={below:'Есть несоответствия черновому минимуму',unknown:'Для вывода не хватает данных',recommended:'Ориентировочно: рекомендуемая конфигурация',minimum:'Ориентировочно: минимальная конфигурация'};
 $('pcVerdict').textContent=titles[status];$('pcResult').dataset.verdict=status;
 $('pcResultGame').textContent=req.title+' · предварительная оценка';
 $('pcRows').replaceChildren(...Object.keys(labels).map(key=>{
  const row=document.createElement('tr');const a=document.createElement('th');a.scope='row';a.textContent=labels[key];row.append(a);
  [min.parts[key],rec.parts[key]].forEach(s=>{const cell=document.createElement('td');cell.dataset.status=s;cell.textContent=words[s];row.append(cell);});return row;
 }));
 $('pcReference').textContent=`Минимум: ${req.min.cpuName} / ${req.min.gpuName}, ${req.min.ram} ГБ RAM, ${req.min.space} ГБ на SSD, Windows 10 x64. Рекомендуется: ${req.rec.cpuName} / ${req.rec.gpuName}, ${req.rec.ram} ГБ RAM, ${req.rec.space} ГБ на NVMe, Windows 11 x64.`;
 const picked=[`CPU: ${$('cpuInput').value||'не указан'}`,`GPU: ${$('gpuInput').value||'не указана'}`,`RAM: ${$('pcRam').value||'?'} ГБ`,`Свободно: ${$('pcSpace').value||'?'} ГБ`, `ОС: ${$('pcOs').selectedOptions[0].textContent}`,`Диск: ${$('pcDrive').selectedOptions[0].textContent}`];
 $('pcPicked').textContent=picked.join(' · ');
 report=['Temka Studio — черновая проверка ПК',req.title,titles[status],...picked,$('pcReference').textContent,'\nЭто редакционный ориентир, не тест игры и не гарантия запуска/FPS. Не учитывает драйверы, API, охлаждение, TGP и финальные требования.'].join('\n');
 $('pcVerdict').focus({preventScroll:true});$('pcResult').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
});
$('pcDownload').addEventListener('click',()=>{
 if(!report)return;const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Temka-PC-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
$('pcForm').addEventListener('reset',()=>{$('pcResult').hidden=true;report='';requestAnimationFrame(()=>['cpu','gpu'].forEach(refreshList));});
// Device-local wishlist, intentionally separate from the installed launcher.
const key='temka-site-wishlist-v1';let wishlist=[];
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))wishlist=saved.filter(x=>x==='temkaworld'||x==='fantazia');}catch{}
function paintWishlist(){document.querySelectorAll('[data-wishlist]').forEach(b=>{const active=wishlist.includes(b.dataset.wishlist);b.setAttribute('aria-pressed',String(active));b.textContent=active?'✓ В вишлисте':'♡ В вишлист';});}
document.querySelectorAll('[data-wishlist]').forEach(b=>b.addEventListener('click',()=>{
 const id=b.dataset.wishlist,added=!wishlist.includes(id),next=added?[...wishlist,id]:wishlist.filter(x=>x!==id);
 try{localStorage.setItem(key,JSON.stringify(next));wishlist=next;paintWishlist();$('wishlistStatus').textContent=added?'Добавлено в вишлист ✓ Без почты. Сохранено только в этом браузере.':'Убрано из вишлиста.';}
 catch{$('wishlistStatus').textContent='Не удалось сохранить: локальное хранилище недоступно.';}
}));paintWishlist();
})(typeof window!=='undefined'?window:globalThis);
