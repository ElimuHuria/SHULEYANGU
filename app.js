const CLASSES=['I','II','III','IV','V','VI','VII'];
const SUBJ=[['kis','Kiswahili'],['hes','Hisabati'],['eng','English'],['say','Sayansi'],['jog','Jiografia na Mazingira'],['his','Historia ya Tanzania']];
const GC={A:'#16a34a',B:'#2563eb',C:'#ca8a04',D:'#ea580c',E:'#dc2626'};
const KEY='mfumo_shule_v2',OLD='mfumo_shule_v1';
let S=load(),curCls='I',repTab='mwanafunzi',lastEx={};

function norm(d){
 d=d||{};d.students=d.students||[];d.exams=d.exams||[];
 d.exams.forEach(e=>{e.marks=e.marks||{};e.rem=e.rem||{};});
 d.set=Object.assign({school:d.school||'',anwani:'',mwaka:String(new Date().getFullYear()),mkuu:'',walimu:{},logo:'',bounds:{A:81,B:61,C:41,D:21}},d.set||{});
 d.set.bounds=Object.assign({A:81,B:61,C:41,D:21},d.set.bounds||{});
 d.set.walimu=d.set.walimu||{};
 return d;
}
function load(){
 let d=null;
 try{d=JSON.parse(localStorage.getItem(KEY));}catch(e){}
 if(!d){try{d=JSON.parse(localStorage.getItem(OLD));}catch(e){}}
 return norm(d);
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){alert('Hifadhi imeshindikana (nafasi ya kivinjari imejaa?). Pakua nakala ya data.');}}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function f1(x){return x==null?'':x.toFixed(1);}
function gradeOf(v){const b=S.set.bounds;return v>=b.A?'A':v>=b.B?'B':v>=b.C?'C':v>=b.D?'D':'E';}
function keyText(){const b=S.set.bounds;return `Madaraja: A = ${b.A}–100, B = ${b.B}–${b.A-1}, C = ${b.C}–${b.B-1}, D = ${b.D}–${b.C-1}, E = 0–${b.D-1}. Ufaulu = daraja A, B au C.`;}

/* ---------- MIPANGILIO ---------- */
function applySet(){
 const st=S.set;
 document.getElementById('hTitle').textContent=st.school||'Mfumo wa Matokeo ya Shule';
 document.getElementById('hSub').textContent=(st.anwani?st.anwani+' • ':'')+'Mwaka '+st.mwaka;
 const l=document.getElementById('hLogo');
 if(st.logo){l.src=st.logo;l.classList.remove('hidden');}else l.classList.add('hidden');
 document.getElementById('hMark').classList.toggle('hidden',!!st.logo);
}
function openSet(){
 const st=S.set;
 sSchool.value=st.school;sAnwani.value=st.anwani;sMwaka.value=st.mwaka;sMkuu.value=st.mkuu;
 bA.value=st.bounds.A;bB.value=st.bounds.B;bC.value=st.bounds.C;bD.value=st.bounds.D;
 const d=document.getElementById('dlg');if(!d.open)d.showModal();
}
function saveSet(){
 const A=+bA.value,B=+bB.value,C=+bC.value,D=+bD.value;
 if(!(A>B&&B>C&&C>D&&D>0&&A<=100)){alert('Mipaka ya madaraja si sahihi. Lazima A > B > C > D > 0.');return;}
 Object.assign(S.set,{school:sSchool.value.trim(),anwani:sAnwani.value.trim(),mwaka:sMwaka.value.trim(),mkuu:sMkuu.value.trim(),bounds:{A,B,C,D}});
 save();applySet();document.getElementById('dlg').close();refresh();
}
function setLogo(ev){
 const f=ev.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{const im=new Image();im.onload=()=>{
  const s=Math.min(1,160/Math.max(im.width,im.height));
  const c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  S.set.logo=c.toDataURL('image/png');save();applySet();
 };im.src=r.result;};
 r.readAsDataURL(f);
}

function go(p){
 if(p==='watumiaji'&&!isAdmin())p='muhtasari';
 ['muhtasari','darasa','mitihani','ripoti','watumiaji'].forEach(x=>{
  document.getElementById('sec-'+x).classList.toggle('hidden',x!==p);
  document.getElementById('nb-'+x).classList.toggle('active',x===p);
 });
 document.body.dataset.sec=p;
 if(p==='muhtasari')renderOverview();
 if(p==='watumiaji')renderUsers();
 if(p==='darasa')renderClass();
 if(p==='mitihani'){fillClassSelect('exCls',curCls);renderExamPicker();}
 if(p==='ripoti'){fillClassSelect('rpCls',curCls);renderRepPicker();}
}
function refresh(){
 if(!document.getElementById('sec-muhtasari').classList.contains('hidden'))renderOverview();
 else if(!document.getElementById('sec-darasa').classList.contains('hidden'))renderClass();
 else if(!document.getElementById('sec-mitihani').classList.contains('hidden'))renderMarks();
 else if(!document.getElementById('sec-ripoti').classList.contains('hidden'))renderReports();
}

/* ---------- DARASA ---------- */
function studentsOf(c){return S.students.filter(s=>s.cls===c).sort((a,b)=>a.name.localeCompare(b.name));}
function renderClass(){
 clsTabs.innerHTML=CLASSES.map(c=>`<button class="${c===curCls?'active':''}" onclick="curCls='${c}';renderClass()">Darasa la ${c} (${studentsOf(c).length})</button>`).join('');
 tName.value=S.set.walimu[curCls]||'';
 renderList();
}
function renderList(){
 const all=studentsOf(curCls);
 const me=all.filter(s=>s.sex==='ME').length;
 cnt.textContent=`Jumla: ${all.length} (ME ${me}, KE ${all.length-me})`;
 const q=document.getElementById('q').value.trim().toLowerCase();
 const L=all.map((s,i)=>({s,i})).filter(x=>!q||x.s.name.toLowerCase().includes(q));
 stList.innerHTML=all.length?
  `<table><tr><th>#</th><th>Jina la Mwanafunzi</th><th>Jinsia</th><th>Simu ya Mzazi</th><th>Vitendo</th></tr>`+
  L.map(x=>`<tr><td>${x.i+1}</td><td class="l">${esc(x.s.name)}</td><td>${x.s.sex}</td><td>${esc(x.s.simu||'')}</td>
  <td><button class="btn blue sm" onclick="editStudent('${x.s.id}')">Hariri</button>
  <button class="btn red sm" onclick="delStudent('${x.s.id}')">Futa</button></td></tr>`).join('')+`</table>`
  :`<p class="hint">Hakuna mwanafunzi aliyesajiliwa Darasa la ${curCls} bado.</p>`;
}
function addStudent(){
 const n=stName.value.trim().replace(/\s+/g,' ');
 if(!n){alert('Tafadhali andika jina la mwanafunzi.');return;}
 if(S.students.some(s=>s.cls===curCls&&s.name.toLowerCase()===n.toLowerCase())&&!confirm('Jina hili tayari lipo kwenye darasa hili. Sajili tena?'))return;
 S.students.push({id:uid(),cls:curCls,name:n,sex:stSex.value,simu:stSimu.value.trim()});
 stName.value='';stSimu.value='';save();renderClass();stName.focus();
}
function addBulk(){
 const lines=bulk.value.split(/\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length){alert('Bandika majina kwanza.');return;}
 let n=0;
 lines.forEach(l=>{
  const p=l.split(/[,\t;]/).map(x=>x.trim()).filter(Boolean);
  let name=p[0].replace(/^\d+[\.\)\s]+/,'').trim();if(!name)return;
  let sex=bulkSex.value;
  p.slice(1).forEach(t=>{const u=t.toUpperCase();if(u==='ME'||u==='KE')sex=u;});
  if(S.students.some(s=>s.cls===curCls&&s.name.toLowerCase()===name.toLowerCase()))return;
  S.students.push({id:uid(),cls:curCls,name,sex,simu:''});n++;
 });
 bulk.value='';save();renderClass();alert(`Wanafunzi ${n} wamesajiliwa Darasa la ${curCls}.`);
}
function editStudent(id){
 const s=S.students.find(x=>x.id===id);
 const n=prompt('Jina la mwanafunzi:',s.name);if(n===null)return;
 if(n.trim())s.name=n.trim();
 const sx=prompt('Jinsia (ME au KE):',s.sex);
 if(sx&&['ME','KE'].includes(sx.trim().toUpperCase()))s.sex=sx.trim().toUpperCase();
 const sm=prompt('Simu ya mzazi:',s.simu||'');if(sm!==null)s.simu=sm.trim();
 save();renderList();
}
function delStudent(id){
 const s=S.students.find(x=>x.id===id);
 if(!confirm('Futa '+s.name+'? Alama zake zote pia zitafutwa.'))return;
 S.students=S.students.filter(x=>x.id!==id);
 S.exams.forEach(e=>{delete e.marks[id];delete e.rem[id];});
 save();renderClass();
}
function promote(){
 const i=CLASSES.indexOf(curCls);
 if(i>=CLASSES.length-1){alert('Darasa la VII ni wahitimu. Pakua nakala ya data kisha futa wanafunzi mwenyewe inapohitajika.');return;}
 const L=studentsOf(curCls);if(!L.length){alert('Hakuna wanafunzi.');return;}
 if(!confirm(`Pandisha wanafunzi ${L.length} wa Darasa la ${curCls} kwenda Darasa la ${CLASSES[i+1]}?\nMitihani ya zamani itabaki Darasa la ${curCls}. Inashauriwa kupakua nakala kwanza.`))return;
 L.forEach(s=>s.cls=CLASSES[i+1]);save();renderClass();
}

/* ---------- HESABU ---------- */
function stats(exam,studs){
 const rows=studs.map(s=>{
  const m=exam.marks[s.id]||{};let tot=0,cnt=0;
  SUBJ.forEach(([k])=>{const v=m[k];if(v!==undefined&&v!==''&&!isNaN(v)){tot+=Number(v);cnt++;}});
  const avg=cnt?tot/SUBJ.length:null;
  return {s,m,cnt,has:cnt>0,tot:cnt?tot:null,avg,gr:cnt?gradeOf(avg):'',sp:{}};
 });
 const rk=rows.filter(r=>r.has);
 rows.forEach(r=>{r.pos=r.has?rk.filter(x=>x.tot>r.tot).length+1:'';});
 const sub={};
 SUBJ.forEach(([k])=>{
  const vals=rows.filter(r=>r.m[k]!==undefined&&r.m[k]!=='').map(r=>({r,v:Number(r.m[k])}));
  const n=vals.length,dist={A:0,B:0,C:0,D:0,E:0};
  vals.forEach(x=>{dist[gradeOf(x.v)]++;x.r.sp[k]=vals.filter(y=>y.v>x.v).length+1;});
  sub[k]={n,avg:n?vals.reduce((a,x)=>a+x.v,0)/n:null,max:n?Math.max(...vals.map(x=>x.v)):null,min:n?Math.min(...vals.map(x=>x.v)):null,dist,pass:n?(dist.A+dist.B+dist.C)/n*100:null};
 });
 const n=rk.length,dist={A:0,B:0,C:0,D:0,E:0};rk.forEach(r=>dist[r.gr]++);
 return {rows,n,sub,dist,cavg:n?rk.reduce((a,r)=>a+r.avg,0)/n:null,pass:n?(dist.A+dist.B+dist.C)/n*100:null,best:rk.slice().sort((a,b)=>b.tot-a.tot)};
}
function remT(g){return {A:'Hongera sana! Umefanya vizuri mno. Endelea na bidii hii.',B:'Matokeo mazuri. Ukijituma zaidi utafika kileleni.',C:'Matokeo ya wastani. Ongeza juhudi hasa kwenye masomo dhaifu.',D:'Matokeo hafifu. Unahitaji kujituma zaidi na kuomba msaada wa walimu.',E:'Matokeo duni. Unahitaji msaada wa karibu na juhudi kubwa zaidi.'}[g]||'';}
function remH(g){return {A:'Mwanafunzi bora. Shule inajivunia matokeo haya.',B:'Anaendelea vizuri. Aendelee kuhamasishwa.',C:'Ana uwezo wa kufanya vizuri zaidi kwa ufuatiliaji wa karibu.',D:'Wazazi/walezi washirikiane na walimu kumsaidia mwanafunzi.',E:'Tunaomba mzazi/mlezi afike shuleni kujadili maendeleo ya mtoto.'}[g]||'';}

/* ---------- MITIHANI ---------- */
function fillClassSelect(id,val){document.getElementById(id).innerHTML=CLASSES.map(c=>`<option value="${c}" ${c===val?'selected':''}>Darasa la ${c}</option>`).join('');}
function examsOf(c){return S.exams.filter(e=>e.cls===c);}
function ensureExam(c){
 if(!examsOf(c).length){S.exams.push({id:uid(),cls:c,name:'Mtihani wa Kwanza',mwaka:S.set.mwaka,marks:{},rem:{}});save();}
}
function renderExamPicker(keep){
 const c=exCls.value;curCls=c;ensureExam(c);
 const L=examsOf(c);keep=keep||lastEx[c];
 const sel=L.some(e=>e.id===keep)?keep:L[0].id;lastEx[c]=sel;
 exSel.innerHTML=L.map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${esc(examLabel(e))}</option>`).join('');
 renderMarks();
}
function examLabel(e){return e.name+(e.muhula?' – '+e.muhula:'')+(e.mwaka?' ('+e.mwaka+')':'');}
function fmtDate(iso){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||'');return m?m[3]+'/'+m[2]+'/'+m[1]:'';}
function todayIso(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function newExam(){
 const c=exCls.value;
 const e={id:uid(),cls:c,name:'Mtihani Mpya',muhula:'',mwaka:S.set.mwaka,tarehe:todayIso(),marks:{},rem:{}};
 S.exams.push(e);lastEx[c]=e.id;save();renderExamPicker(e.id);
 exName.focus();exName.select();
}
function fillExMeta(e){
 [exName,exMuhula,exMwaka,exTarehe].forEach(x=>x.disabled=!e);
 exName.value=e?e.name:'';exMuhula.value=e?(e.muhula||''):'';exMwaka.value=e?(e.mwaka||''):'';exTarehe.value=e?(e.tarehe||''):'';
}
function saveExMeta(){
 const e=curExam();if(!e)return;
 const n=exName.value.trim();
 if(!n){alert('Jina la mtihani haliwezi kuwa tupu.');exName.value=e.name;return;}
 e.name=n;e.muhula=exMuhula.value;e.mwaka=exMwaka.value.trim();e.tarehe=exTarehe.value;save();
 const o=exSel.selectedOptions[0];if(o)o.textContent=examLabel(e);
}
function curExam(){return S.exams.find(x=>x.id===exSel.value);}
function renameExam(){
 const e=curExam();if(!e)return;
 const n=prompt('Jina jipya la mtihani:',e.name);if(n&&n.trim()){e.name=n.trim();save();renderExamPicker(e.id);}
}
function delExam(){
 const e=curExam();if(!e)return;
 if(!confirm('Futa mtihani "'+e.name+'" pamoja na alama zake zote?'))return;
 S.exams=S.exams.filter(x=>x.id!==e.id);save();renderExamPicker();
}
function renderMarks(){
 gkey.textContent=keyText();
 const e=curExam(),c=exCls.value;
 fillExMeta(e);
 if(!e){marksBox.innerHTML='<p class="hint" style="padding:10px">Bonyeza "+ Mtihani Mpya" ili kuanza.</p>';exSummary.innerHTML='';return;}
 const L=studentsOf(c);
 if(!L.length){marksBox.innerHTML='<p class="hint" style="padding:10px">Hakuna wanafunzi katika darasa hili. Wasajili kwanza kwenye menyu ya DARASA.</p>';exSummary.innerHTML='';return;}
 const st=stats(e,L);let rows=st.rows;
 if(sortPos.checked)rows=rows.slice().sort((a,b)=>(a.pos||9999)-(b.pos||9999));
 marksBox.innerHTML=`<table><tr><th>#</th><th>Jina</th>${SUBJ.map(s=>`<th>${s[1]}</th>`).join('')}<th>Jumla</th><th>Wastani</th><th>Daraja</th><th>Nafasi</th></tr>`+
 rows.map((r,i)=>`<tr><td>${i+1}</td><td class="nm">${esc(r.s.name)} <span class="warn" id="w-${r.s.id}"></span></td>`+
  SUBJ.map(([k],j)=>`<td><input class="m" type="number" min="0" max="100" data-r="${i}" data-c="${j}" data-s="${r.s.id}" data-k="${k}" value="${r.m[k]??''}" oninput="setMark(this)" onkeydown="nav(event,this)" onfocus="this.select()"></td>`).join('')+
  `<td id="t-${r.s.id}"></td><td id="a-${r.s.id}"></td><td id="g-${r.s.id}"></td><td id="p-${r.s.id}"></td></tr>`).join('')+
  `<tr><th colspan="2">Wastani wa Somo</th>${SUBJ.map(([k])=>`<th id="sa-${k}"></th>`).join('')}<th colspan="4"></th></tr></table>`;
 updateLive();
}
function nav(ev,inp){
 let r=+inp.dataset.r,c=inp.dataset.c,t=null;
 if(ev.key==='Enter'||ev.key==='ArrowDown')t=r+1;else if(ev.key==='ArrowUp')t=r-1;else return;
 ev.preventDefault();
 const n=marksBox.querySelector(`input[data-r="${t}"][data-c="${c}"]`);if(n)n.focus();
}
function setMark(inp){
 const e=curExam();if(!e)return;
 let v=inp.value;
 if(v!==''){v=Math.max(0,Math.min(100,Math.round(Number(v)*10)/10));if(String(v)!==inp.value)inp.value=v;}
 const sid=inp.dataset.s,k=inp.dataset.k;
 e.marks[sid]=e.marks[sid]||{};
 if(v==='')delete e.marks[sid][k];else e.marks[sid][k]=v;
 save();updateLive();
}
function updateLive(){
 const e=curExam();if(!e)return;
 const st=stats(e,studentsOf(exCls.value));
 st.rows.forEach(r=>{
  const id=r.s.id;
  document.getElementById('t-'+id).innerHTML='<b>'+(r.tot==null?'':r.tot)+'</b>';
  document.getElementById('a-'+id).textContent=f1(r.avg);
  const g=document.getElementById('g-'+id);g.innerHTML='<b>'+r.gr+'</b>';g.className=r.gr?'g'+r.gr:'';
  document.getElementById('p-'+id).innerHTML='<b>'+r.pos+'</b>';
  document.getElementById('w-'+id).textContent=(r.has&&r.cnt<SUBJ.length)?'⚠ pungufu':'';
 });
 SUBJ.forEach(([k])=>{document.getElementById('sa-'+k).textContent=f1(st.sub[k].avg);});
 const b=st.best[0];
 exSummary.innerHTML=`<div class="stats">
  <div class="stat"><b>${st.n}/${st.rows.length}</b><span>Wenye alama</span></div>
  <div class="stat"><b>${f1(st.cavg)||'-'}</b><span>Wastani wa darasa</span></div>
  <div class="stat"><b>${st.pass==null?'-':st.pass.toFixed(0)+'%'}</b><span>Ufaulu (A–C)</span></div>
  <div class="stat"><b style="font-size:15px">${b?esc(b.s.name):'-'}</b><span>Wa kwanza ${b?'('+f1(b.avg)+')':''}</span></div>
 </div>`;
}
function exportCsv(withMarks){
 const e=curExam();if(!e){alert('Chagua mtihani kwanza.');return;}
 const studs=studentsOf(exCls.value);
 if(!studs.length){alert('Hakuna wanafunzi kwenye darasa hili. Wasajili kwanza kwenye menyu ya DARASA.');return;}
 const st=stats(e,studs);
 const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
 const head=['Na','Jina la Mwanafunzi','Jinsia',...SUBJ.map(s=>s[1])];
 if(withMarks)head.push('Jumla','Wastani','Daraja','Nafasi');
 const out=[head.map(q).join(',')];
 st.rows.forEach((r,i)=>{
  const row=[i+1,r.s.name,r.s.sex,...SUBJ.map(([k])=>withMarks?(r.m[k]??''):'')];
  if(withMarks)row.push(r.tot,f1(r.avg),r.gr,r.pos);
  out.push(row.map(q).join(','));
 });
 const b=new Blob(['\ufeff'+out.join('\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(b);
 a.download=`${withMarks?'matokeo':'template'}_darasa_${exCls.value}_${e.name.replace(/\W+/g,'_')}.csv`;a.click();
}

function importText(txt){
 const e=curExam();if(!e){alert('Chagua mtihani kwanza.');return;}
 const studs=studentsOf(exCls.value);
 if(!studs.length){alert('Hakuna wanafunzi kwenye darasa hili. Wasajili kwanza.');return;}
 if(Object.keys(e.marks).some(id=>Object.keys(e.marks[id]||{}).length)&&!confirm('Mtihani huu tayari una alama. Alama zilizo kwenye faili zitabadilisha zilizopo (masanduku tupu hayabadilishi chochote). Endelea?'))return;
 const key=x=>String(x).toLowerCase().replace(/\s+/g,' ').trim();
 const num=x=>String(x).replace(',','.');
 const found=new Set(),bad=[],badVal=[];let okc=0;
 txt.split(/\r?\n/).forEach(line=>{
  if(!line.trim())return;
  const d=line.includes('\t')?'\t':line.includes(';')?';':',';
  const cells=(d===','?line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/):line.split(d)).map(x=>x.replace(/^"|"$/g,'').trim());
  const ni=cells.findIndex(x=>x&&isNaN(num(x)));if(ni<0)return;
  let st=ni+1;if(/^(ME|KE)$/i.test(cells[st]||''))st++;
  const vals=cells.slice(st,st+SUBJ.length);
  if(!vals.some(v=>v!==''&&!isNaN(num(v))))return;
  const s=studs.find(x=>key(x.name)===key(cells[ni]));
  if(!s){bad.push(cells[ni]);return;}
  SUBJ.forEach(([k,nm],i)=>{
   const raw=vals[i];if(raw===undefined||raw==='')return;
   const v=Number(num(raw));
   if(isNaN(v)||v<0||v>100){badVal.push(s.name+' – '+nm+': "'+raw+'"');return;}
   e.marks[s.id]=e.marks[s.id]||{};e.marks[s.id][k]=v;okc++;
  });
  found.add(s.id);
 });
 save();renderMarks();
 if(!found.size&&!okc){alert('Hakuna alama zilizopatikana kwenye faili. Tumia template iliyopakuliwa kwenye ukurasa huu, na hakikisha majina yanalingana na yaliyosajiliwa.'+(bad.length?'\n\nMajina yasiyopatikana:\n'+bad.slice(0,10).join('\n'):''));return;}
 let m='✔ Template imepakiwa.\nWanafunzi waliopatikana: '+found.size+'\nAlama zilizopakiwa: '+okc;
 if(bad.length)m+='\n\n⚠ Majina '+bad.length+' hayapo kwenye Darasa la '+exCls.value+' (hayakupakiwa):\n'+bad.slice(0,10).join('\n');
 if(badVal.length)m+='\n\n⚠ Alama '+badVal.length+' si sahihi (lazima ziwe 0–100):\n'+badVal.slice(0,10).join('\n');
 alert(m);
}
function importMarks(ev){
 const f=ev.target.files[0];if(!f)return;
 if(/\.xlsx?$/i.test(f.name)){alert('Hifadhi faili la Excel kama CSV kwanza (Faili > Hifadhi Kama > CSV), kisha lipakie.');ev.target.value='';return;}
 const r=new FileReader();
 r.onload=()=>importText(String(r.result).replace(/^\ufeff/,''));
 r.readAsText(f);ev.target.value='';
}

/* ---------- RIPOTI ---------- */
const RT=[['mwanafunzi','Ripoti za Wanafunzi'],['darasa','Matokeo ya Darasa (Broadsheet)'],['masomo','Uchambuzi wa Masomo']];
function renderRepPicker(){
 rTabs.innerHTML=RT.map(t=>`<button class="${t[0]===repTab?'active':''}" onclick="repTab='${t[0]}';renderRepPicker()">${t[1]}</button>`).join('');
 const c=rpCls.value;curCls=c;ensureExam(c);
 const ex=examsOf(c);
 const sel=ex.some(e=>e.id===lastEx[c])?lastEx[c]:ex[0].id;lastEx[c]=sel;
 rpEx.innerHTML=ex.map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${esc(examLabel(e))}</option>`).join('');
 rpSt.innerHTML='<option value="all">Wanafunzi wote</option>'+studentsOf(c).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
 stWrap.style.display=repTab==='mwanafunzi'?'':'none';
 renderReports();
}
function doPrint(){
 let st=document.getElementById('pgst');if(!st){st=document.createElement('style');st.id='pgst';document.head.appendChild(st);}
 st.textContent='@page{size:A4 '+(repTab==='mwanafunzi'?'portrait':'landscape')+';margin:10mm}';
 window.print();
}
function saveRem(sid,key,txt){
 const e=S.exams.find(x=>x.id===rpEx.value);if(!e)return;
 e.rem[sid]=e.rem[sid]||{};e.rem[sid][key]=txt.trim();save();
}
function header(e,c,title){
 const st=S.set;
 return `<div class="rh">${st.logo?`<img src="${st.logo}" alt="">`:''}<div><h3>${esc(st.school||'JINA LA SHULE')}</h3><div>${esc(st.anwani||'')}</div></div>${st.logo?`<img src="${st.logo}" alt="" style="visibility:hidden">`:''}</div>
 <div class="rt">${title}<br>${esc(e.name)}${e.muhula?' — '+esc(e.muhula):''} — Darasa la ${c} — Mwaka ${esc(e.mwaka||st.mwaka)}${e.tarehe?'<br><span style="font-weight:normal;font-size:13px">Tarehe ya mtihani: '+fmtDate(e.tarehe)+'</span>':''}</div>`;
}
function renderReports(){
 const area=repArea,c=rpCls.value;
 const e=S.exams.find(x=>x.id===rpEx.value);
 rHint.textContent=repTab==='mwanafunzi'?'Maoni ya mwalimu na mkuu wa shule yanaweza kuhaririwa moja kwa moja kwenye ripoti (bonyeza maandishi) kabla ya kuchapisha.':'';
 if(!e){area.innerHTML='<div class="card"><p class="hint">Hakuna mtihani uliochaguliwa. Tengeneza mtihani kwenye menyu ya MITIHANI.</p></div>';return;}
 const studs=studentsOf(c);
 if(!studs.length){area.innerHTML='<div class="card"><p class="hint">Hakuna wanafunzi katika darasa hili.</p></div>';return;}
 const st=stats(e,studs);
 if(repTab==='mwanafunzi')area.innerHTML=repStudents(e,c,st,studs);
 else if(repTab==='darasa')area.innerHTML=repClass(e,c,st);
 else area.innerHTML=repSubjects(e,c,st);
}
function repStudents(e,c,st,studs){
 const pick=rpSt.value,list=examsOf(c),idx=list.findIndex(x=>x.id===e.id),prev=idx>0?list[idx-1]:null;
 const pst=prev?stats(prev,studs):null;
 const teacher=S.set.walimu[c]||'';
 return st.rows.filter(r=>pick==='all'||r.s.id===pick).map(r=>{
  const rem=e.rem[r.s.id]||{};
  let prog='';
  if(pst){const p=pst.rows.find(x=>x.s.id===r.s.id);
   if(p&&p.avg!=null&&r.avg!=null){const d=r.avg-p.avg;
    prog=`<p style="font-size:13px;margin:6px 0"><b>Maendeleo:</b> Wastani wa mtihani uliopita (${esc(prev.name)}) ulikuwa ${f1(p.avg)}, sasa ${f1(r.avg)} — <span class="${d>=0?'up':'dn'}">${d>=0?'▲ ongezeko':'▼ upungufu'} la ${Math.abs(d).toFixed(1)}</span>.</p>`;}}
  return `<div class="rep">
  ${header(e,c,'RIPOTI YA MAENDELEO YA MWANAFUNZI')}
  <div class="info"><span><b>Jina:</b> ${esc(r.s.name)}</span><span><b>Jinsia:</b> ${r.s.sex}</span><span><b>Idadi ya wanafunzi:</b> ${st.n}</span></div>
  <table><tr><th>Somo</th><th>Alama</th><th>Daraja</th><th>Wastani wa Darasa</th><th>Nafasi</th></tr>`+
  SUBJ.map(([k,n])=>{const v=r.m[k],has=v!==undefined&&v!=='';const g=has?gradeOf(Number(v)):'';
   return `<tr><td class="l">${n}</td><td><b>${has?v:'-'}</b></td><td class="g${g}">${g||'-'}</td><td>${f1(st.sub[k].avg)||'-'}</td><td>${has?r.sp[k]:'-'}</td></tr>`;}).join('')+
  `</table>
  <div class="sum"><div><b>${r.tot==null?'-':r.tot}</b>JUMLA (kati ya ${SUBJ.length*100})</div><div><b>${f1(r.avg)||'-'}</b>WASTANI</div><div><b>${r.gr||'-'}</b>DARAJA</div><div><b>${r.pos?r.pos+'/'+st.n:'-'}</b>NAFASI</div></div>
  ${r.has&&r.cnt<SUBJ.length?`<p class="warn">Tahadhari: mwanafunzi hana alama za masomo yote, kwa hiyo wastani unaweza kuwa chini.</p>`:''}
  ${prog}
  <p style="margin:8px 0 2px;font-size:14px"><b>Maoni ya Mwalimu wa Darasa${teacher?' ('+esc(teacher)+')':''}:</b></p>
  <div class="rm" contenteditable="true" onblur="saveRem('${r.s.id}','t',this.textContent)">${esc(rem.t!==undefined?rem.t:remT(r.gr))}</div>
  <p style="margin:8px 0 2px;font-size:14px"><b>Maoni ya Mkuu wa Shule${S.set.mkuu?' ('+esc(S.set.mkuu)+')':''}:</b></p>
  <div class="rm" contenteditable="true" onblur="saveRem('${r.s.id}','h',this.textContent)">${esc(rem.h!==undefined?rem.h:remH(r.gr))}</div>
  <div class="key">${keyText()}</div>
  <div class="sign"><div>Sahihi ya Mwalimu wa Darasa</div><div>Sahihi ya Mkuu wa Shule / Muhuri</div></div>
  </div>`;}).join('');
}
function repClass(e,c,st){
 const rows=st.rows.slice().sort((a,b)=>(a.pos||9999)-(b.pos||9999));
 return `<div class="card pr rep" style="border:none;page-break-after:auto">
 ${header(e,c,'MATOKEO YA DARASA (BROADSHEET)')}
 <table><tr><th>Nafasi</th><th>Jina</th><th>Jinsia</th>${SUBJ.map(s=>`<th>${s[1]}</th>`).join('')}<th>Jumla</th><th>Wastani</th><th>Daraja</th></tr>`+
 rows.map(r=>`<tr><td><b>${r.pos}</b></td><td class="l">${esc(r.s.name)}</td><td>${r.s.sex}</td>${SUBJ.map(([k])=>{const v=r.m[k];const has=v!==undefined&&v!=='';return `<td class="${has?'g'+gradeOf(Number(v)):''}">${has?v:'-'}</td>`;}).join('')}<td><b>${r.tot??'-'}</b></td><td>${f1(r.avg)||'-'}</td><td class="g${r.gr}"><b>${r.gr||'-'}</b></td></tr>`).join('')+
 `<tr><th colspan="3">Wastani wa Somo</th>${SUBJ.map(([k])=>`<th>${f1(st.sub[k].avg)||'-'}</th>`).join('')}<th></th><th>${f1(st.cavg)||'-'}</th><th></th></tr></table>
 <p style="font-size:14px"><b>Idadi:</b> ${st.rows.length} &nbsp; <b>Wenye matokeo:</b> ${st.n} &nbsp; <b>Ufaulu (A–C):</b> ${st.pass==null?'-':st.pass.toFixed(1)+'%'} &nbsp; <b>Madaraja:</b> ${['A','B','C','D','E'].map(g=>g+' = '+st.dist[g]).join(', ')}</p>
 <div class="key">${keyText()}</div>
 <div class="sign"><div>Mwalimu wa Darasa${S.set.walimu[c]?': '+esc(S.set.walimu[c]):''}</div><div>Mkuu wa Shule${S.set.mkuu?': '+esc(S.set.mkuu):''}</div></div></div>`;
}
function repSubjects(e,c,st){
 const ranked=SUBJ.map(([k,n])=>({k,n,s:st.sub[k]})).filter(x=>x.s.n).sort((a,b)=>b.s.avg-a.s.avg);
 const need=st.rows.filter(r=>r.has&&(r.gr==='D'||r.gr==='E')).sort((a,b)=>a.tot-b.tot);
 const grp=sx=>{const L=st.rows.filter(r=>r.has&&r.s.sex===sx);return L.length?f1(L.reduce((a,r)=>a+r.avg,0)/L.length)+' ('+L.length+')':'-';};
 return `<div class="card pr rep" style="border:none;page-break-after:auto">
 ${header(e,c,'UCHAMBUZI WA MATOKEO KWA MASOMO')}
 <div class="stats"><div class="stat"><b>${f1(st.cavg)||'-'}</b><span>Wastani wa darasa</span></div>
 <div class="stat"><b>${st.pass==null?'-':st.pass.toFixed(0)+'%'}</b><span>Ufaulu (A–C)</span></div>
 <div class="stat"><b style="font-size:16px">${grp('ME')}</b><span>Wastani ME (idadi)</span></div>
 <div class="stat"><b style="font-size:16px">${grp('KE')}</b><span>Wastani KE (idadi)</span></div></div>
 <h3>Wastani wa Masomo (kuanzia somo lililofanya vizuri zaidi)</h3>
 ${ranked.map(x=>`<div class="hbar"><span class="lb">${x.n}</span><div class="tr"><i style="width:${x.s.avg}%;background:${GC[gradeOf(x.s.avg)]}"></i></div><b>${f1(x.s.avg)}</b></div>`).join('')||'<p class="hint">Hakuna alama bado.</p>'}
 <h3>Takwimu za Kila Somo</h3>
 <table><tr><th>Somo</th><th>Waliofanya</th><th>Wastani</th><th>Juu</th><th>Chini</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>Ufaulu %</th></tr>`+
 SUBJ.map(([k,n])=>{const s=st.sub[k];return `<tr><td class="l">${n}</td><td>${s.n}</td><td>${f1(s.avg)||'-'}</td><td>${s.max??'-'}</td><td>${s.min??'-'}</td>${['A','B','C','D','E'].map(g=>`<td>${s.dist[g]}</td>`).join('')}<td>${s.pass==null?'-':s.pass.toFixed(0)}</td></tr>`;}).join('')+
 `</table>
 <h3>Wanafunzi 5 Bora</h3>
 <table><tr><th>Nafasi</th><th>Jina</th><th>Jumla</th><th>Wastani</th><th>Daraja</th></tr>${st.best.slice(0,5).map(r=>`<tr><td>${r.pos}</td><td class="l">${esc(r.s.name)}</td><td>${r.tot}</td><td>${f1(r.avg)}</td><td class="g${r.gr}">${r.gr}</td></tr>`).join('')}</table>
 <h3>Wanaohitaji Msaada wa Ziada (daraja D au E)</h3>
 ${need.length?`<table><tr><th>Jina</th><th>Wastani</th><th>Daraja</th></tr>${need.map(r=>`<tr><td class="l">${esc(r.s.name)}</td><td>${f1(r.avg)}</td><td class="g${r.gr}">${r.gr}</td></tr>`).join('')}</table>`:'<p class="hint">Hakuna mwanafunzi mwenye daraja D au E.</p>'}
 <div class="key">${keyText()}</div></div>`;
}

/* ---------- BACKUP ---------- */
function exportData(){
 const b=new Blob([JSON.stringify(S)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(b);
 a.download='nakala_mfumo_wa_shule_'+new Date().toISOString().slice(0,10)+'.json';a.click();
}
function importData(ev){
 const f=ev.target.files[0];if(!f)return;
 const r=new FileReader();
 r.onload=()=>{try{
  const d=JSON.parse(r.result);if(!d.students||!d.exams)throw 0;
  if(!confirm('Data ya sasa itabadilishwa na nakala hii. Endelea?'))return;
  S=norm(d);save();applySet();renderClass();
 }catch(e){alert('Faili si sahihi.');}};
 r.readAsText(f);ev.target.value='';
}

/* Huitwa na auth.js baada ya mtumiaji kuingia */
function startApp(){
 applySet();syncThemeBtn();
 go('muhtasari');
}

/* ---------- MUHTASARI (dashboard) ---------- */
function renderOverview(){
 const tot=S.students.length,me=S.students.filter(s=>s.sex==='ME').length;
 const withMarks=S.exams.filter(e=>Object.keys(e.marks).some(id=>Object.keys(e.marks[id]||{}).length));
 ovStats.innerHTML=[
  [tot,'Wanafunzi wote'],[me+' / '+(tot-me),'ME / KE'],
  [CLASSES.filter(c=>studentsOf(c).length).length+'/'+CLASSES.length,'Madarasa yenye wanafunzi'],
  [S.exams.length,'Mitihani'],[withMarks.length,'Mitihani yenye alama']
 ].map(x=>`<div class="stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
 const max=Math.max(1,...CLASSES.map(c=>studentsOf(c).length));
 ovClasses.innerHTML=tot?CLASSES.map(c=>{const n=studentsOf(c).length;
  return `<div class="hbar"><span class="lb" style="width:110px">Darasa la ${c}</span><div class="tr"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`;}).join('')
  :'<p class="hint">Bado hakuna wanafunzi. Anza kwa kusajili kwenye menyu ya DARASA.</p>';
 const rows=withMarks.slice().reverse().slice(0,6).map(e=>{
  const st=stats(e,studentsOf(e.cls));
  return `<tr><td class="l">${esc(e.name)}</td><td>${e.cls}</td><td>${f1(st.cavg)||'-'}</td><td>${st.pass==null?'-':st.pass.toFixed(0)+'%'}</td></tr>`;}).join('');
 ovExams.innerHTML=rows?`<table><tr><th>Mtihani</th><th>Darasa</th><th>Wastani</th><th>Ufaulu</th></tr>${rows}</table>`
  :'<p class="hint">Bado hakuna mtihani wenye alama.</p>';
}

/* ---------- MANDHARI (dark / light) ---------- */
function syncThemeBtn(){
 const b=document.getElementById('themeBtn');if(!b)return;
 const dark=document.documentElement.dataset.theme!=='light';
 b.textContent=dark?'🌙':'☀️';
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#0b1120':'#eef2fa';
}
function toggleTheme(){
 const n=document.documentElement.dataset.theme==='light'?'dark':'light';
 document.documentElement.dataset.theme=n;
 try{localStorage.setItem('mfumo_theme',n);}catch(e){}
 syncThemeBtn();
}
