// 指针中心为基准，悬停时向卡片内部轻轻倾斜。
document.querySelectorAll('.bento .card').forEach(card=>{
 card.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--rx',(-y*7).toFixed(2)+'deg');card.style.setProperty('--ry',(x*7).toFixed(2)+'deg')});
 card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})
});
