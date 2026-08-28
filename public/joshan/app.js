const $ = (id) => document.getElementById(id);
const fa = (value) => new Intl.NumberFormat('fa-IR').format(value);
const faYear = (value) => new Intl.NumberFormat('fa-IR',{useGrouping:false}).format(value);
const storageKey = 'joshan-plan-v1';
let plan = JSON.parse(localStorage.getItem(storageKey) || 'null');
let currentVerse = 1;

const todayISO = () => new Date().toISOString().slice(0, 10);
const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'});
const hijriDate = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-nu-latn',{year:'numeric',month:'long',day:'numeric'});
const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function calendarParts(date, formatter){
  const parts={};
  formatter.formatToParts(date).forEach(p=>{if(['year','month','day'].includes(p.type)) parts[p.type]=Number(p.value)});
  return parts;
}
function jalaliToGregorian(jy,jm,jd){
  const start=new Date(jy+621,1,20);
  for(let i=0;i<390;i++){
    const date=new Date(start); date.setDate(start.getDate()+i);
    const p=calendarParts(date,persianDate);
    if(p.year===jy&&p.month===jm&&p.day===jd) return date;
  }
  return null;
}
function daysInJalaliMonth(year,month){
  if(month<=6)return 31;
  if(month<=11)return 30;
  return jalaliToGregorian(year,12,30)?30:29;
}
function initDatePicker(){
  const now=calendarParts(new Date(),persianDate);
  $('jYear').innerHTML=Array.from({length:16},(_,i)=>now.year-2+i).map(y=>`<option value="${y}">${faYear(y)}</option>`).join('');
  $('jMonth').innerHTML=persianMonths.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
  $('jYear').value=now.year; $('jMonth').value=now.month;
  refreshDays(now.day);
  ['jYear','jMonth'].forEach(id=>$(id).addEventListener('change',()=>refreshDays()));
  $('jDay').addEventListener('change',updateDateEquivalent);
}
function refreshDays(preferred){
  const max=daysInJalaliMonth(Number($('jYear').value),Number($('jMonth').value));
  const selected=Math.min(preferred||Number($('jDay').value)||1,max);
  $('jDay').innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">${fa(i+1)}</option>`).join('');
  $('jDay').value=selected; updateDateEquivalent();
}
function selectedGregorian(){return jalaliToGregorian(Number($('jYear').value),Number($('jMonth').value),Number($('jDay').value));}
function localISO(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function updateDateEquivalent(){
  const date=selectedGregorian();
  $('hijriEquivalent').textContent=date?`معادل قمری: ${hijriDate.format(date)}`:'تاریخ معتبر نیست';
}
initDatePicker();
const periodNames={morning:'صبح',noon:'ظهر',evening:'عصر',night:'شب'};
function periodForHour(hour){
  if(hour>=6&&hour<=11)return 'morning';
  if(hour>=12&&hour<=15)return 'noon';
  if(hour>=16&&hour<=19)return 'evening';
  return 'night';
}
function updateAutomaticPeriod(){
  $('automaticPeriod').textContent=periodNames[periodForHour(Number($('reminderHour').value))];
}
$('reminderHour').innerHTML=Array.from({length:24},(_,i)=>`<option value="${i+1}">${fa(i+1)}</option>`).join('');
$('reminderHour').value=21;
$('reminderHour').addEventListener('change',updateAutomaticPeriod);
updateAutomaticPeriod();

document.querySelectorAll('[name=mode]').forEach(input => input.addEventListener('change', () => {
  $('membersField').classList.toggle('hidden', input.value !== 'group' || !input.checked);
  updateSummary();
}));
['dailyCount','memberCount'].forEach(id => $(id).addEventListener('input', updateSummary));

function updateSummary(){
  const daily = Math.max(1, Number($('dailyCount').value) || 1);
  const days = Math.ceil(100 / daily);
  const group = document.querySelector('[name=mode]:checked').value === 'group';
  $('planSummary').textContent = group
    ? `این ختم حدود ${fa(days)} روز طول می‌کشد و سهم‌ها میان ${fa($('memberCount').value || 2)} عضو تقسیم می‌شوند.`
    : `با روزی ${fa(daily)} فراز، ختم شما در ${fa(days)} روز کامل می‌شود.`;
}

$('planForm').addEventListener('submit', (e) => {
  e.preventDefault();
  plan = {
    name: $('planName').value.trim(), mode: document.querySelector('[name=mode]:checked').value,
    start: localISO(selectedGregorian()), daily: Number($('dailyCount').value),
    hour: Number($('reminderHour').value), period: periodForHour(Number($('reminderHour').value)),
    members: Number($('memberCount').value), completed: [], assignments: []
  };
  if(plan.mode==='group'){
    plan.assignments=Array.from({length:plan.members},(_,i)=>({name:`عضو ${fa(i+1)}`,from:i+1,to:i+1}));
  }
  save(); render(); toast('برنامه ختم ساخته شد');
});

function portion(){
  const elapsed = Math.max(0, Math.floor((new Date(todayISO()) - new Date(plan.start)) / 86400000));
  const start = Math.min(100, elapsed * plan.daily + 1);
  const end = Math.min(100, start + plan.daily - 1);
  return {start, end};
}

function render(){
  $('setupView').classList.toggle('hidden', !!plan);
  $('dashboardView').classList.toggle('hidden', !plan);
  if (!plan) { updateSummary(); return; }
  const p = portion(), count = plan.completed.length, percent = Math.round(count);
  $('modeBadge').textContent = plan.mode === 'group' ? `ختم گروهی · ${fa(plan.members)} عضو` : 'ختم شخصی';
  $('dashboardTitle').textContent = plan.name;
  const startDate=new Date(`${plan.start}T12:00:00`);
  $('todayLabel').textContent = `آغاز: ${persianDate.format(startDate)} شمسی · ${hijriDate.format(startDate)} قمری`;
  $('progressText').textContent = `${fa(percent)}٪`;
  $('readCount').textContent = `${fa(count)} از ${fa(100)}`;
  const savedHour=plan.hour || Number((plan.time||'21:00').split(':')[0]);
  const savedPeriod=periodForHour(savedHour);
  $('timeText').textContent = `${periodNames[savedPeriod]}، ساعت ${fa(savedHour)}`;
  $('progressBar').style.width = `${percent}%`;
  $('portionTitle').textContent = `فرازهای ${fa(p.start)} تا ${fa(p.end)}`;
  $('portionMeta').textContent = plan.mode === 'group' ? 'سهم امروز شما در ختم گروهی' : 'برنامه امروز شما';
  if(plan.mode==='group'&&!Array.isArray(plan.assignments)){
    plan.assignments=Array.from({length:plan.members||2},(_,i)=>({name:`عضو ${fa(i+1)}`,from:i+1,to:i+1})); save();
  }
  const assignedVerses=new Set((plan.assignments||[]).flatMap(a=>Array.from({length:a.to-a.from+1},(_,i)=>a.from+i)));
  $('verseGrid').innerHTML = Array.from({length:100},(_,i)=>{
    const n=i+1, cls=[plan.completed.includes(n)?'done':'',n>=p.start&&n<=p.end?'today':''].join(' ');
    return `<button class="verse ${cls} ${assignedVerses.has(n)?'assigned':''}" data-n="${n}">${fa(n)}</button>`;
  }).join('');
  document.querySelectorAll('.verse').forEach(b=>b.onclick=()=>openReader(Number(b.dataset.n)));
  renderMembers();
}

function assignmentConflicts(){
  const used=new Map(), conflicts=new Set();
  (plan.assignments||[]).forEach((a,index)=>{
    for(let n=a.from;n<=a.to;n++){
      if(used.has(n)){conflicts.add(index);conflicts.add(used.get(n));} else used.set(n,index);
    }
  });
  return conflicts;
}
function renderMembers(){
  const section=$('groupMembersSection');
  section.classList.toggle('hidden',plan.mode!=='group');
  if(plan.mode!=='group')return;
  const conflicts=assignmentConflicts();
  $('membersList').innerHTML=plan.assignments.map((a,i)=>`<div class="member-row ${conflicts.has(i)?'conflict':''}" data-member="${i}">
    <input class="member-name" data-field="name" value="${escapeHtml(a.name)}" aria-label="نام عضو ${i+1}">
    <input type="number" data-field="from" min="1" max="100" value="${a.from}" aria-label="از فراز">
    <input type="number" data-field="to" min="1" max="100" value="${a.to}" aria-label="تا فراز">
    <span class="member-share">${fa(a.to-a.from+1)} فراز</span>
  </div>`).join('');
  $('assignmentStatus').textContent=conflicts.size?`${fa(conflicts.size)} عضو دارای تداخل`:`${fa(plan.assignments.length)} عضو · بدون تداخل`;
  $('assignmentStatus').classList.toggle('warning',conflicts.size>0);
}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
$('membersList').addEventListener('change',e=>{
  const field=e.target.dataset.field;if(!field)return;
  const index=Number(e.target.closest('.member-row').dataset.member);
  if(field==='name')plan.assignments[index].name=e.target.value.trim()||`عضو ${fa(index+1)}`;
  else{
    const value=Math.max(1,Math.min(100,Number(e.target.value)||1));
    plan.assignments[index][field]=value;
    if(plan.assignments[index].to<plan.assignments[index].from){
      if(field==='from')plan.assignments[index].to=value;else plan.assignments[index].from=value;
    }
  }
  save();render();
});

function openReader(n){
  currentVerse=Math.max(1,Math.min(100,n));
  $('reader').classList.remove('hidden');
  $('verseNumber').textContent=`فراز ${fa(currentVerse)} از ${fa(100)}`;
  const verse=JOSHAN_VERSES[currentVerse-1];
  $('verseText').textContent=verse.arabic;
  $('translationText').textContent=verse.translation;
  $('refrainText').textContent=verse.refrain;
  $('completeVerse').textContent=plan.completed.includes(currentVerse)?'خوانده شده ✓':'خواندم';
  $('reader').scrollIntoView({behavior:'smooth',block:'center'});
}
$('readButton').onclick=()=>openReader(portion().start);
$('closeReader').onclick=()=>$('reader').classList.add('hidden');
$('prevVerse').onclick=()=>openReader(currentVerse-1);
$('nextVerse').onclick=()=>openReader(currentVerse+1);
$('completeVerse').onclick=()=>{
  if(!plan.completed.includes(currentVerse)) plan.completed.push(currentVerse);
  save(); render(); openReader(currentVerse); toast('قرائت این فراز ثبت شد');
};
$('resetButton').onclick=()=>{
  if(confirm('برنامه فعلی پاک شود و ختم تازه‌ای بسازید؟')){localStorage.removeItem(storageKey);plan=null;$('reader').classList.add('hidden');render();}
};
$('notifyButton').onclick=async()=>{
  if(!('Notification' in window)) return toast('اعلان در این محیط پشتیبانی نمی‌شود');
  const permission=await Notification.requestPermission();
  if(permission==='granted'){new Notification('همراه جوشن',{body:'یادآوری فعال شد؛ قرار روزانه‌تان محفوظ است.'});toast('یادآوری فعال شد');}
};
function save(){localStorage.setItem(storageKey,JSON.stringify(plan));}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2500);}
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render();
