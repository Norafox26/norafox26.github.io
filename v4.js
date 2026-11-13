const gold=document.createElement('div');gold.className='background-gold';document.querySelector('.atmosphere').append(gold);
const timeLabel=t=>{if(!Number.isFinite(t))return '0:00';return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')};
function refreshTimes(){$('#elapsed').textContent=timeLabel(audio.currentTime);$('#duration').textContent=timeLabel(audio.duration)}
audio.addEventListener('timeupdate',refreshTimes);audio.addEventListener('loadedmetadata',refreshTimes);audio.addEventListener('emptied',refreshTimes);
document.querySelectorAll('img').forEach(img=>img.draggable=false);
const copy=$('#copyEmail');copy.textContent='复制邮箱';copy.setAttribute('aria-label','复制邮箱地址');
const oldCopy=copy.onclick;copy.onclick=async()=>{await oldCopy();if($('#toast').textContent==='邮箱已复制'){copy.textContent='已复制 ✓';setTimeout(()=>copy.textContent='复制邮箱',1800)}};
