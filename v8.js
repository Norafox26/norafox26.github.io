(()=>{
 let generation=0;
 $('#trackMeta').textContent='';
 $('#audioFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const current=++generation;
  audio.pause();if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=URL.createObjectURL(file);audio.src=audioUrl;
  $('#trackTitle').textContent=file.name.replace(/\.[^.]+$/,'');$('#trackMeta').textContent='';
  $('#play').disabled=false;$('#seek').value=0;$('#seek').disabled=true;
  try{const tags=await readAudioTags(file);if(current!==generation)return;
   if(tags.title)$('#trackTitle').textContent=tags.title;
   $('#trackMeta').textContent=tags.artist;$('#trackMeta').title=tags.artist;
  }catch{/* Untagged or unsupported formats keep the filename and blank artist. */}
 };
 const clear=document.querySelector('.clear-track'),original=clear.onclick;
 clear.onclick=()=>{generation++;original();$('#trackMeta').textContent='';$('#trackMeta').title=''};
})();
