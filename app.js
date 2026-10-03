'use strict';
const KEY='macro-studio-v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topicName=t=>TOPICS.find(x=>x[0]===t)?.[1]||t;
let data={records:{},exam:null}, storageOK=true;
try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(parsed&&parsed.records&&typeof parsed.records==='object')data={records:parsed.records,exam:parsed.exam||null};}}catch{storageOK=false;}
let state={scope:'all',type:'all',topic:'all',wrong:false,index:0};
let toastTimer;
let pendingConfirm=null;
function askConfirm(title,message,action){$('confirmTitle').textContent=title;$('confirmText').textContent=message;pendingConfirm=action;$('confirmPanel').showModal();}
$('confirmCancel').onclick=()=>{$('confirmPanel').close();pendingConfirm=null;};
$('confirmPanel').oncancel=()=>{pendingConfirm=null;};
$('confirmProceed').onclick=()=>{const action=pendingConfirm;pendingConfirm=null;$('confirmPanel').close();action?.();};
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function save(){if(data.exam?.finished)Object.assign(data.records,data.exam.records);try{localStorage.setItem(KEY,JSON.stringify(data));}catch{storageOK=false;}$('storageNote').textContent=storageOK?'记录保存在此浏览器与设备。':'浏览器无法保存记录，请用“课程与题库说明”导出备份。';}
function activeExam(){return !!data.exam&&!data.exam.finished;}
function examView(){return !!data.exam;}
function records(){return examView()?data.exam.records:data.records;}
function record(q){const r=records();return r[q.id]||(r[q.id]={values:{}});}
function numeric(value){if(typeof value!=='string'&&typeof value!=='number')return NaN;let v=String(value).trim();if(!v)return NaN;v=v.replace(/[%€\s]/g,'');if(v.includes(',')&&!v.includes('.'))v=v.replace(',','.');return /^[-+]?\d*(?:\.\d+)?$/.test(v)?Number(v):NaN;}
function evaluate(q,r){
 if(q.type==='mcq')return {correct:Number.isInteger(r.choice)&&r.choice===q.correct,answered:Number.isInteger(r.choice)};
 return q.parts.map((p,i)=>p.answer===undefined?null:{correct:Number.isFinite(numeric(r.values?.[i]))&&Math.abs(numeric(r.values[i])-p.answer)<=p.tol,answered:Number.isFinite(numeric(r.values?.[i]))});
}
function needsManual(q){return q.type==='open'&&(q.graph||q.parts.some(p=>p.answer===undefined));}
function mastered(q,r){if(!r?.checked)return false;if(q.type==='mcq')return evaluate(q,r).correct;return evaluate(q,r).filter(Boolean).every(x=>x.correct)&&(!needsManual(q)||r.self==='mastered');}
function wrong(q,r){if(!r)return false;if(r.marked||r.self==='review')return true;if(!r.checked)return false;return q.type==='mcq'?!evaluate(q,r).correct:evaluate(q,r).filter(Boolean).some(x=>!x.correct);}
function scoped(q){return state.scope==='all'||q.scope===state.scope;}
function list(){if(examView())return data.exam.ids.map(id=>BANK.find(q=>q.id===id)).filter(Boolean);return BANK.filter(q=>scoped(q)&&(state.type==='all'||q.type===state.type)&&(state.topic==='all'||q.topic===state.topic)&&(!state.wrong||wrong(q,data.records[q.id])));}
function current(){return list()[state.index];}
function syncControls(){
 $('scope').value=state.scope;
 document.querySelectorAll('[data-type]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.type===state.type));b.disabled=examView();});
 $('scope').disabled=examView();$('startExam').disabled=examView();$('duration').disabled=examView();$('wrongBtn').disabled=examView();
 $('importFile').disabled=examView();document.querySelector('.import-label').setAttribute('aria-disabled',String(examView()));
 $('wrongBtn').classList.toggle('active',state.wrong);
 $('topics').innerHTML=[['all','全部章节'],...TOPICS.map(t=>[t[0],t[1]])].map(([id,label])=>{
 const count=BANK.filter(q=>scoped(q)&&(id==='all'||q.topic===id)&&(state.type==='all'||q.type===state.type)).length;
 return `<button data-topic="${id}" aria-current="${state.topic===id}" ${examView()||!count?'disabled':''}>${label}<span>${count}</span></button>`;
 }).join('');
 $('topics').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.topic=b.dataset.topic;state.wrong=false;state.index=0;render();});
 $('statDone').textContent=BANK.filter(q=>mastered(q,data.records[q.id])).length;
 $('statTotal').textContent=BANK.length;
 $('wrongCount').textContent=BANK.filter(q=>wrong(q,data.records[q.id])).length;
 $('modeCaption').textContent=examView()?(activeExam()?'SIMULAZIONE · 计时训练':'REVIEW · 训练复盘'):'PRACTICE · 练习';
 $('sectionTitle').textContent=examView()?(data.exam.scope==='all'?'综合训练卷':data.exam.scope==='primo'?'Primo 训练卷':'Secondo 训练卷'):state.wrong?'待复习题目':state.topic==='all'?(state.scope==='all'?'全部章节':state.scope==='primo'?'Primo · 第一次期中':'Secondo · 第二次期中'):topicName(state.topic);
}
function render(){
 syncControls();const items=list();state.index=Math.max(0,Math.min(state.index,items.length-1));
 $('questionSelect').innerHTML=items.map((q,i)=>`<option value="${i}">${q.id} · ${q.title}${mastered(q,records()[q.id])?' ✓':''}</option>`).join('');$('questionSelect').value=state.index;
 $('questionSelect').disabled=!items.length;$('position').textContent=items.length?`${state.index+1} / ${items.length}`:'0 / 0';
 $('prevBtn').disabled=state.index<=0;$('nextBtn').disabled=state.index>=items.length-1;$('markBtn').disabled=!items.length||activeExam();
 renderExam();
 if(!items.length){$('question').innerHTML=`<div class="empty"><span class="eyebrow">PRACTICE</span><h3>${state.wrong?'这个范围暂时没有待复习题':'没有符合条件的题目'}</h3><p>${state.wrong?'做错的选择题、数值小问和主动标记的题目会显示在这里。':'试试切换范围、章节或题型。'}</p></div>`;return;}
 renderQuestion(items[state.index]);
}
function renderQuestion(q){
 const r=record(q),locked=activeExam(),result=r.checked&&!locked?evaluate(q,r):null;
 $('markBtn').textContent=r.marked?'取消待复习标记':'标记待复习';
 let html=`<div class="tags"><span class="tag kind">${q.type==='open'?'开放式大题':'原创选择题'}</span><span class="tag">${q.scope==='primo'?'Primo':'Secondo'}</span><span class="tag">${topicName(q.topic)}</span><span class="tag">${q.id}</span>${q.extension?'<span class="tag">大纲延伸</span>':''}</div><h3>${q.title}</h3><p class="context" lang="it">${esc(q.context)}</p>`;
 if(q.type==='mcq'){
  html+=`<div class="options" role="radiogroup" aria-label="选择答案">`+q.options.map((option,i)=>`<label class="answer-option ${r.choice===i?'selected':''} ${result&&i===q.correct?'correct':''} ${result&&r.choice===i&&!result.correct?'incorrect':''}"><input type="radio" name="answer" value="${i}" ${r.choice===i?'checked':''}><span class="option-letter">${'ABCD'[i]}</span><span lang="it">${esc(option)}</span></label>`).join('')+'</div>';
  if(result)html+=`<div class="result ${result.correct?'':'bad'}" role="status"><strong>${result.correct?'回答正确':result.answered?'再核对一下':'尚未作答'} · 正确选项 ${'ABCD'[q.correct]}</strong><p>${esc(q.explanation)}</p></div>`;
 }else{
  html+=q.parts.map((p,i)=>{
   const f=result?.[i],value=r.values?.[i]??'';
   return `<section class="part"><div class="part-head"><span class="part-letter">${String.fromCharCode(97+i)}</span><label lang="it" for="part-${i}">${esc(p.text)}</label></div>${p.answer!==undefined?`<div class="number-wrap"><input id="part-${i}" data-part="${i}" inputmode="decimal" autocomplete="off" aria-label="第 ${i+1} 小问数值答案" placeholder="填写数值" value="${esc(value)}"><span class="unit">${esc(p.unit||'数值')}</span></div>`:`<textarea id="part-${i}" data-part="${i}" aria-label="第 ${i+1} 小问论述答案" placeholder="写出公式、机制与结论；可用意大利语或中文。">${esc(value)}</textarea>`}${f?`<p class="part-feedback ${f.correct?'good':'bad'}" role="status">${f.correct?'✓ 数值正确':f.answered?'数值需要复核':'请填写数值'}${f.correct?'':` · 参考值 ${format(p.answer)} ${esc(p.unit)}`}</p>`:result?'<p class="part-feedback neutral">论述请对照要点自评。</p>':''}${result?`<div class="solution"><strong>中文解析 · ${String.fromCharCode(97+i)}</strong><p>${esc(p.solution)}</p></div>`:''}</section>`;
  }).join('');
  if(q.graph){html+=`<section class="drawing"><div class="drawing-head"><strong>图形练习 · 自由画图</strong><button id="clearDrawing" class="quiet">清空画布</button></div><canvas id="drawingCanvas" aria-label="图形练习画布，可使用鼠标或手指绘制"></canvas><p>先标坐标轴、曲线与均衡点。也可在论述框描述图形，核对后查看参考示意图。</p>${result?`<div class="reference">${diagram(q)}<p>方向参考示意图，不按本题数值绘制。具体假设和变动请以每问解析为准。</p></div>`:''}</section>`;}
  if(result){const nums=result.filter(Boolean);html+=`<div class="result ${nums.some(x=>!x.correct)?'bad':''}" role="status"><strong>数值小问：${nums.filter(x=>x.correct).length} / ${nums.length} 正确</strong><p>${needsManual(q)?'论述与图形请核对公式、假设、变化方向和结论。':'已显示各小问解析。'}</p></div>`;
   if(needsManual(q))html+=`<div class="self-review"><p>自评：能说明使用的模型、完成计算，并解释或画出正确的传导机制吗？</p><button id="selfMastered" class="quiet ${r.self==='mastered'?'chosen':''}" ${nums.some(x=>!x.correct)?'disabled':''}>已掌握</button><button id="selfReview" class="quiet ${r.self==='review'?'chosen':''}">需要再练</button></div>`;
  }
 }
 html+=locked?'<div class="action-row"><small>答案已自动记录。结束训练后统一核对解析。</small></div>':`<div class="action-row"><button id="checkBtn">${q.type==='mcq'?'核对答案':'核对数值与解析'}</button><small>${q.type==='open'?'论述与绘图按要点自评。':'选一个答案，再核对解释。'}</small></div>`;
 $('question').innerHTML=html;
 $('question').querySelectorAll('input[name=answer]').forEach(el=>el.onchange=()=>{r.choice=Number(el.value);r.checked=false;r.self=null;save();renderQuestion(q);syncControls();});
 $('question').querySelectorAll('[data-part]').forEach(el=>el.oninput=()=>{r.values[el.dataset.part]=el.value;r.self=null;if(r.checked){r.checked=false;document.querySelectorAll('.part-feedback,.solution,.self-review,.reference,.result').forEach(e=>e.remove());}save();syncControls();});
 if(!locked)$('checkBtn').onclick=()=>{if(q.type==='mcq'&&!Number.isInteger(r.choice)){toast('先选择一个答案。');return;}r.checked=true;save();render();};
 if($('selfMastered'))$('selfMastered').onclick=()=>{r.self='mastered';r.marked=false;save();render();};
 if($('selfReview'))$('selfReview').onclick=()=>{r.self='review';save();render();};
 if(q.graph)initDrawing(q,r);
}
function format(n){return Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});}
function initDrawing(q,r){
 const canvas=$('drawingCanvas'),ctx=canvas.getContext('2d');canvas.width=1000;canvas.height=400;
 function grid(){ctx.fillStyle='white';ctx.fillRect(0,0,1000,400);ctx.strokeStyle='#edf1f5';ctx.lineWidth=1;for(let x=0;x<=1000;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,400);ctx.stroke();}for(let y=0;y<=400;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke();}}
 grid();if(r.drawing){const im=new Image();im.onload=()=>{if($('drawingCanvas')===canvas)ctx.drawImage(im,0,0);};im.src=r.drawing;}
 let last=null;const point=e=>{const b=canvas.getBoundingClientRect();return[(e.clientX-b.left)*canvas.width/b.width,(e.clientY-b.top)*canvas.height/b.height];};
 canvas.onpointerdown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();canvas.setPointerCapture(e.pointerId);last=point(e);};
 canvas.onpointermove=e=>{if(!last)return;const p=point(e);ctx.strokeStyle='#132840';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...last);ctx.lineTo(...p);ctx.stroke();last=p;};
 const end=()=>{if(last){last=null;r.drawing=canvas.toDataURL('image/png');save();}};canvas.onpointerup=end;canvas.onpointercancel=end;
 $('clearDrawing').onclick=()=>{grid();delete r.drawing;save();};
}
function diagram(q){
 const text=(x,y,s,color='#132840')=>`<text x="${x}" y="${y}" fill="${color}" font-size="17" font-family="Arial,sans-serif">${s}</text>`;
 const path=(d,color='#132840',dash=false)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="7 5"':''}/>`;
 let shapes=path('M65 30 V270 H510','#687d91')+text(46,27,q.graph==='solow'?'y':q.graph==='debt'?'bₜ':q.graph==='labor'?'W/P':q.graph==='goods'?'Z':q.graph==='pc'?'Δπ':'i')+text(498,296,q.graph==='solow'?'k':q.graph==='debt'?'bₜ₋₁':q.graph==='labor'?'u':q.graph==='money'?'M':q.graph==='yield'?'n':'Y');
 if(q.graph==='goods')shapes+=path('M65 270 L450 45','#9dafbd',true)+path('M65 210 L470 65')+path(q.id==='P07'?'M65 240 L470 95':'M65 175 L470 30','#00836b',true)+text(435,80,'ZZ')+text(430,q.id==='P07'?119:40,'ZZ′','#00836b')+text(420,35,'45°');
 if(q.graph==='money')shapes+=path('M350 40 V270')+path('M100 55 L465 220')+path('M100 105 L420 250','#00836b',true)+text(360,52,'Mˢ')+text(445,204,'Mᵈ')+text(365,249,'Mᵈ′','#00836b');
 if(q.graph==='islm')shapes+=path('M90 60 L460 245')+path('M90 240 L460 55','#00836b')+text(445,255,'IS')+text(453,50,'LM','#00836b')+`<circle cx="275" cy="152" r="5" fill="#132840"/>`+text(290,145,'A');
 if(q.graph==='horizontal'){const right=q.id==='S04';shapes+=path('M110 50 L480 235')+path(right?'M180 50 L510 215':'M75 75 L405 240','#00836b',true)+path('M65 155 H505','#687d91')+text(470,253,'IS')+text(right?480:378,225,'IS′','#00836b')+text(470,145,'LM');}
 if(q.graph==='labor'){
 shapes+=path('M65 145 H500','#00836b')+path('M80 65 L450 245')+text(473,135,'PS','#00836b')+text(435,260,'WS')+path('M244 145 V270','#9dafbd',true)+text(229,296,'uₙ');
 if(q.id==='P14')shapes+=path('M65 180 H500','#a52b39',true)+text(470,201,'PS′','#a52b39')+path('M316 180 V270','#a52b39',true)+text(308,296,'uₙ′','#a52b39');
 if(q.id==='P16')shapes+=path('M80 65 L315 245','#a52b39',true)+text(303,260,'WS′','#a52b39')+path('M184 145 V270','#a52b39',true)+text(160,296,'uₙ′','#a52b39');
 }
 if(q.graph==='pc')shapes+=path('M65 190 H500','#9dafbd',true)+path('M95 260 L445 45','#00836b')+path('M209 30 V270','#9dafbd',true)+text(200,296,'Yₙ')+text(448,47,'PC','#00836b')+text(41,196,'0');
 if(q.graph==='solow'){
 shapes+=path('M65 270 Q170 100 485 65')+path('M65 270 Q170 190 485 155','#00836b')+path('M65 270 L485 70','#8d9dab')+text(470,56,'f(k)')+text(467,174,'sf(k)','#00836b')+text(q.id==='P24'?350:450,93,q.id==='P24'?'(δ+n+gA)k':'δk');
 shapes+=q.id==='P22'?path('M65 270 L365 35','#a52b39',true)+text(348,28,'δ′k','#a52b39'):path(q.id==='P23'?'M65 270 Q170 150 485 110':'M65 270 Q170 225 485 210','#a52b39',true)+text(455,q.id==='P23'?115:230,'s′f(k)','#a52b39');
 }
 if(q.graph==='yield')shapes+=path('M65 70 H500','#9dafbd',true)+path('M65 230 Q145 115 500 95','#00836b')+text(385,58,'prima')+text(400,120,'dopo','#00836b');
 if(q.graph==='debt')shapes+=path('M65 270 L490 35','#9dafbd',true)+path('M105 270 L500 30','#00836b')+text(402,64,'45°')+text(387,121,'(1+r−g)b+d','#00836b');
 return `<svg role="img" aria-label="${esc(topicName(q.topic))}参考示意图" viewBox="0 0 550 315">${shapes}</svg>`;
}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const v=new Uint32Array(1);crypto.getRandomValues(v);const j=v[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function startExam(){
 const pool=BANK.filter(scoped),mcqs=pool.filter(q=>q.type==='mcq'),openPool=pool.filter(q=>q.type==='open');
 const choices=state.scope==='all'?[...shuffle(mcqs.filter(q=>q.scope==='primo')).slice(0,4),...shuffle(mcqs.filter(q=>q.scope==='secondo')).slice(0,4)]:shuffle(mcqs).slice(0,8);
 const groups=state.scope==='primo'?[['accounts','goods','finance'],['islm','labor'],['growth']]:state.scope==='secondo'?[['expectations'],['open'],['fiscal']]:[['accounts','goods','finance'],['islm','labor','growth'],['expectations','open','fiscal']];
 const opens=groups.map(topics=>shuffle(openPool.filter(q=>topics.includes(q.topic)))[0]);
 if(state.scope==='all'){
  // Alternate which half gets two open questions, while always covering both halves.
  const v=new Uint32Array(1);crypto.getRandomValues(v);
  if(v[0]%2)opens[1]=shuffle(openPool.filter(q=>q.scope==='secondo'&&q.topic!==opens[2].topic))[0];
 }
 data.exam={scope:state.scope,ids:[...choices,...opens].map(q=>q.id),records:{},end:Date.now()+Number($('duration').value)*60000,finished:false};state.index=0;save();render();toast('训练已开始，结束后显示解析。');
}
function finishExam(expired=false){if(!activeExam())return;$('confirmPanel').close();pendingConfirm=null;data.exam.finished=true;data.exam.expired=expired;data.exam.ids.forEach(id=>{const r=data.exam.records[id]||(data.exam.records[id]={values:{}});r.checked=true;});save();render();toast(expired?'时间到，已保存作答并显示解析。':'训练结束，开始核对解析。');}
function renderExam(){
 const container=$('examStatus');if(!examView()){container.hidden=true;container.innerHTML='';document.querySelector('.exam-summary')?.remove();return;}
 container.hidden=false;container.innerHTML=activeExam()?'<div>计时训练 · <span id="timer"></span></div><button id="finishExam" class="quiet">结束并查看解析</button><button id="leaveExam" class="quiet">退出训练</button>':'<div>训练已结束 · 答题已保存</div><button id="leaveExam" class="quiet">返回章节练习</button>';
 if(activeExam())$('finishExam').onclick=()=>askConfirm('结束训练？','提交当前作答，显示答案与复盘结果。未答的选择题与数值小问按未完成记录。',()=>finishExam());
 $('leaveExam').onclick=()=>{const leave=()=>{data.exam=null;state.index=0;save();render();};if(activeExam())askConfirm('退出本次训练？','退出会放弃本次模拟卷的作答；已保存的章节练习记录会保留。',leave);else leave();};
 document.querySelector('.exam-summary')?.remove();
 if(!activeExam()){
 const items=list(),mcqs=items.filter(q=>q.type==='mcq'),score=mcqs.filter(q=>evaluate(q,record(q)).correct).length;
 let numTotal=0,numCorrect=0;items.filter(q=>q.type==='open').forEach(q=>evaluate(q,record(q)).filter(Boolean).forEach(x=>{numTotal++;if(x.correct)numCorrect++;}));
 const node=document.createElement('div');node.className='exam-summary';node.innerHTML=`<h3>选择题 ${score} / ${mcqs.length}</h3><p>大题数值小问 ${numCorrect} / ${numTotal} 正确；论述与绘图请逐题自评。</p><p>这是练习结果，不换算为官方考试成绩。</p><div class="exam-links">${items.map((q,i)=>`<button class="quiet" data-exam-index="${i}">${q.id} ${q.type==='mcq'?(evaluate(q,record(q)).correct?'✓':'待复习'):'大题'}</button>`).join('')}</div>`;container.after(node);node.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.index=Number(b.dataset.examIndex);render();});
 }else tick();
}
function tick(){if(!activeExam())return;const ms=data.exam.end-Date.now();if(ms<=0){finishExam(true);return;}const seconds=Math.ceil(ms/1000);if($('timer'))$('timer').textContent=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
$('scope').onchange=()=>{state.scope=$('scope').value;state.topic='all';state.index=0;render();};
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{state.type=b.dataset.type;state.index=0;render();});
$('wrongBtn').onclick=()=>{state.wrong=!state.wrong;state.index=0;render();};
$('questionSelect').onchange=()=>{state.index=Number($('questionSelect').value);render();};
$('prevBtn').onclick=()=>{state.index--;render();};$('nextBtn').onclick=()=>{state.index++;render();};
$('markBtn').onclick=()=>{const q=current();if(!q)return;const r=record(q);r.marked=!r.marked;save();render();};
$('startExam').onclick=startExam;
$('aboutBtn').onclick=()=>{$('backupMessage').textContent=examView()?'训练复盘期间可导出章节记录；请返回章节练习后再导入。':'';$('about').showModal();};$('closeAbout').onclick=()=>$('about').close();
$('about').onclick=e=>{if(e.target===$('about')){const r=$('about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about').close();}};
$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,records:data.records},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='macro-studio-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('backupMessage').textContent='已导出章节练习记录。';};
$('importFile').onchange=async()=>{
 const file=$('importFile').files[0];if(!file)return;
 try{if(file.size>15000000)throw Error();const parsed=JSON.parse(await file.text());if(parsed.version!==1||!parsed.records||typeof parsed.records!=='object'||Array.isArray(parsed.records))throw Error();
 const clean={};BANK.forEach(q=>{const r=parsed.records[q.id];if(!r||typeof r!=='object')return;const c={values:{},checked:r.checked===true,marked:r.marked===true,self:['mastered','review'].includes(r.self)?r.self:null};if(Number.isInteger(r.choice)&&r.choice>=0&&r.choice<4)c.choice=r.choice;if(q.type==='open')q.parts.forEach((p,i)=>{if(typeof r.values?.[i]==='string')c.values[i]=r.values[i].slice(0,20000);});if(typeof r.drawing==='string'&&r.drawing.startsWith('data:image/png;base64,')&&r.drawing.length<1000000)c.drawing=r.drawing;clean[q.id]=c;});
 if(!Object.keys(clean).length)throw Error();Object.assign(data.records,clean);save();render();$('backupMessage').textContent='已合并有效记录；相同题号使用导入的记录。';
 }catch{$('backupMessage').textContent='无法导入：请选择此网站导出的有效 JSON 记录。';}$('importFile').value='';
};
// Keep an interrupted training run; validate persisted identifiers before restoring it.
if(data.exam){const e=data.exam;if(!Array.isArray(e.ids)||!e.ids.length||e.ids.some(id=>!BANK.some(q=>q.id===id))||!e.records||!Number.isFinite(e.end)){data.exam=null;}else state.scope=['all','primo','secondo'].includes(e.scope)?e.scope:'all';}
save();render();setInterval(tick,1000);
