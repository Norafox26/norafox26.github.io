/* Local metadata only. Bounded reads; no upload, network, or executable tag content. */
async function readAudioTags(file) {
 const result={title:'',artist:''}, cap=16*1024*1024;
 const read=async(start,length)=>new Uint8Array(await file.slice(start,Math.min(file.size,start+length)).arrayBuffer());
 const ascii=b=>new TextDecoder('windows-1252').decode(b), utf8=b=>new TextDecoder('utf-8').decode(b);
 const clean=s=>s.replace(/\0+/g,' / ').replace(/[\u0001-\u001f]/g,'').replace(/(?:\s*\/\s*)+$/,'').trim().slice(0,1000);
 const put=(key,text)=>{text=clean(text);if(text&&!result[key])result[key]=text};
 const u32=(b,p,le=false)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(p,le);
 const sync=(b,p)=>(b[p]&127)*2097152+(b[p+1]&127)*16384+(b[p+2]&127)*128+(b[p+3]&127);
 const deunsync=b=>b.filter((v,i)=>!(v===0&&i>0&&b[i-1]===255));
 const text=b=>{if(!b.length)return '';let enc=b[0],data=b.subarray(1);if(enc===1){let be=data[0]===254&&data[1]===255;if((data[0]===255&&data[1]===254)||be)data=data.subarray(2);return new TextDecoder(be?'utf-16be':'utf-16le').decode(data)}return new TextDecoder(enc===2?'utf-16be':enc===3?'utf-8':'windows-1252').decode(data)};
 let head=await read(0,12);
 if(ascii(head.subarray(0,3))==='ID3'&&[2,3,4].includes(head[3])){
  let ver=head[3],size=sync(head,6),b=await read(10,Math.min(size,cap)),p=0;
  if((head[5]&128)&&ver<4)b=deunsync(b);
  if(head[5]&64){if(ver===2)return result;if(b.length<4)return result;p=ver===4?sync(b,0):4+u32(b,0)}
  while(p+(ver===2?6:10)<=b.length){
   let id=ascii(b.subarray(p,p+(ver===2?3:4))),len=ver===2?(b[p+3]<<16)+(b[p+4]<<8)+b[p+5]:ver===4?sync(b,p+4):u32(b,p+4),h=ver===2?6:10;
   if(!/^[A-Z0-9]{3,4}$/.test(id)||len<=0||p+h+len>b.length)break;
   let flags=ver===2?0:b[p+9],data=b.subarray(p+h,p+h+len);p+=h+len;
   if((ver===3&&(flags&192))||(ver===4&&(flags&12)))continue; // compressed/encrypted frames
   if(ver===3&&(flags&32))data=data.subarray(1);
   if(ver===4){if(flags&64)data=data.subarray(1);if(flags&1)data=data.subarray(4);if((head[5]&128)||(flags&2))data=deunsync(data)}
   if(id==='TIT2'||id==='TT2')put('title',text(data));if(id==='TPE1'||id==='TP1')put('artist',text(data));
  }
 }
 if(ascii(head.subarray(0,4))==='fLaC'){
  let offset=4;
  while(offset+4<=file.size&&offset<cap){let h=await read(offset,4),len=(h[1]<<16)+(h[2]<<8)+h[3];offset+=4;if(len>cap||offset+len>file.size)break;
   if((h[0]&127)===4){let b=await read(offset,len),p=0;const next=()=>{if(p+4>b.length)throw Error('Truncated Vorbis comment');let n=u32(b,p,true);p+=4;if(p+n>b.length)throw Error('Truncated Vorbis string');let v=utf8(b.subarray(p,p+n));p+=n;return v};try{next();let count=u32(b,p,true);p+=4;for(let i=0;i<Math.min(count,10000);i++){let v=next(),eq=v.indexOf('='),key=v.slice(0,eq).toUpperCase();if(key==='ARTIST')put('artist',v.slice(eq+1));if(key==='TITLE')put('title',v.slice(eq+1))}}catch{}break}
   offset+=len;if(h[0]&128)break;
  }
 }
 // ISO BMFF: seek across media data rather than reading the entire recording.
 if(ascii(head.subarray(4,8))==='ftyp'){
  let visited=0;
  const walk=async(start,end,depth=0)=>{if(depth>7)return;for(let p=start;p+8<=end&&visited++<2000;){let h=await read(p,16);if(h.length<8)break;let size=u32(h,0),type=ascii(h.subarray(4,8)),header=8;if(size===1){if(h.length<16)break;size=u32(h,8)*4294967296+u32(h,12);header=16}if(size===0)size=end-p;if(size<header||p+size>end)break;
   if(['moov','udta','meta','ilst'].includes(type))await walk(p+header+(type==='meta'?4:0),p+size,depth+1);
   if(type==='©ART'||type==='©nam'){let q=p+header;while(q+16<=p+size){let d=await read(q,16),n=u32(d,0);if(n<16||q+n>p+size||n>cap)break;if(ascii(d.subarray(4,8))==='data'){let value=await read(q+16,n-16);put(type==='©ART'?'artist':'title',d[11]===2?new TextDecoder('utf-16be').decode(value):utf8(value))}q+=n}}
   p+=size;
  }};await walk(0,file.size);
 }
 if(file.size>=128&&(!result.artist||!result.title)){let b=await read(file.size-128,128);if(ascii(b.subarray(0,3))==='TAG'){put('title',ascii(b.subarray(3,33)));put('artist',ascii(b.subarray(33,63)))}}
 return result;
}
if(typeof module!=='undefined')module.exports={readAudioTags};
