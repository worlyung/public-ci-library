'use strict';
const $=id=>document.getElementById(id);
let data,kind='',current,assetIndex=0,selectedType='ci';
const norm=s=>s.toLowerCase().replace(/\s+/g,'');
const typeName=t=>t==='slogan'?'슬로건':'CI';
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function localType(r){return r.localType||(r.kind==='시·군·구'?r.name.slice(-1):r.kind);}
function assets(r,type=''){return r.assets.filter(a=>(!type||(a.assetType||'ci')===type)&&($('history').checked||a.versionStatus!=='historical'));}
function searchable(r){const short=r.region.replace(/특별자치도|특별자치시|통합특별시|특별시|광역시|도$/g,'');const common=r.region.replace('충청남도','충남').replace('충청북도','충북').replace('경상남도','경남').replace('경상북도','경북').replace('전북특별자치도','전북');return norm([r.name,r.region,r.aliases||'',r.parent||'',r.name+'청',r.name.replace(/(특별자치시|특별시|광역시)$/,'시')+'청',short+r.name,common+r.name,(r.parent||'')+r.name].join(' '));}
function render(){
 const terms=$('search').value.trim().split(/\s+/).filter(Boolean).map(norm),region=$('region').value,filter=$('assetFilter').value;
 const rows=data.items.filter(r=>(!kind||localType(r)===kind)&&(!region||r.region===region)&&(!$('ready').checked||assets(r,filter).length)&&terms.every(t=>searchable(r).includes(t)));
 rows.sort((a,b)=>a.name.localeCompare(b.name,'ko')||a.region.localeCompare(b.region,'ko'));
 $('resultTitle').textContent=terms.length?'검색 결과':kind?kind+' 기관':'전체 기관';
 const ci=rows.filter(r=>assets(r,'ci').length).length,sl=rows.filter(r=>assets(r,'slogan').length).length;
 $('resultCount').textContent=`${rows.length}개 기관 · CI ${ci}곳 / 미확보 ${rows.length-ci}곳 · 슬로건 ${sl}곳 / 미확보 ${rows.length-sl}곳`;
 $('grid').replaceChildren();$('empty').hidden=!!rows.length;
 for(const row of rows){
  const visible=assets(row,filter),a=visible.find(x=>x.assetType==='ci'&&!x.previewDark)||visible.find(x=>x.assetType==='ci')||visible[0];
  const card=el('article','card'+(a?'':' missing'));card.dataset.id=row.id;
  const visual=el('button','card-visual '+(a?(a.previewDark?'dark':'checker'):'missing-visual'));
  visual.setAttribute('aria-label',row.name+' 자료 상세 보기');visual.onclick=()=>openDetail(row,filter||(a?.assetType||'ci'));
  if(a){const img=el('img');img.src=a.file;img.alt=row.name+' '+typeName(a.assetType);img.loading='lazy';visual.append(img);visual.append(el('span','visual-type',typeName(a.assetType)));}
  else visual.append(el('span','missing-caption',(filter?typeName(filter)+' ':'')+'자료 미확보'));
  const body=el('div','card-body');body.append(el('p','card-region',row.region+(row.parent?' · '+row.parent:'')+' · '+row.kind),el('h3','',row.name));
  const bottom=el('div','asset-badges');
  for(const t of ['ci','slogan']){const count=assets(row,t).length;const btn=el('button','asset-badge '+(count?'available':'unavailable'),`${typeName(t)} ${count?count+'종 ↓':'미확보'}`);btn.onclick=()=>openDetail(row,t);bottom.append(btn);}
  const more=el('button','card-open','상세 · 출처 보기 ↗');more.onclick=()=>openDetail(row,filter||(a?.assetType||'ci'));
  body.append(bottom,more);card.append(visual,body);$('grid').append(card);
 }
}
function updateAsset(){
 const list=assets(current,selectedType),a=list[assetIndex];
 document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('selected',b.dataset.type===selectedType);b.textContent=typeName(b.dataset.type)+(b.dataset.type==='slogan'?' · 도시브랜드':' · 기관 상징')+' '+assets(current,b.dataset.type).length;});
 $('assetPanel').hidden=!a;$('missingAsset').hidden=!!a;$('sourceImage').hidden=!a;
 $('sourcePage').href=a?.page||current.home;$('checked').textContent=`자료 확인 ${current.checked} · 공식 출처와 사용 지침 확인`;
 if(!a){$('missingAsset').textContent=`${typeName(selectedType)} PNG를 아직 확보하지 못했습니다. 자료가 없거나 미제정됐다는 뜻은 아닙니다. 공식 누리집에서 확인해 주세요.`;$('download').removeAttribute('href');return;}
 $('detailImage').src=a.file;$('detailImage').alt=current.name+' '+typeName(selectedType)+' '+a.label;
 if(a.previewDark&&$('preview').classList.contains('checker'))setBackground('dark');
 $('dimensions').textContent=`${a.width} × ${a.height}px`;
 $('assetNote').textContent=(a.versionStatus==='historical'?'과거 자료입니다. ':'공식 누리집 게시 자료입니다. ')+(a.label?a.label+' · ':'')+a.method;
 $('sourceImage').href=a.source;$('variants').replaceChildren();
 list.forEach((x,i)=>{const b=el('button',i===assetIndex?'selected':'',typeName(selectedType)+' '+(i+1)+(x.versionStatus==='historical'?' · 과거':''));b.title=x.label;b.onclick=()=>{assetIndex=i;updateAsset();};$('variants').append(b);});
 $('variants').hidden=list.length<2;updateDownload();
}
function updateDownload(){const a=assets(current,selectedType)[assetIndex];if(!a)return;$('download').href='./downloads/'+a.id+'/'+$('size').value+'.png';$('download').download=current.region+'_'+current.name+'_'+typeName(selectedType)+'_'+a.id+'_투명.png';$('download').textContent=typeName(selectedType)+' 투명 PNG 다운로드 ↓';}
function openDetail(row,type='ci'){current=row;selectedType=type;assetIndex=0;$('detailName').textContent=row.name;$('detailRegion').textContent=row.region+(row.parent?' · '+row.parent:'')+' · '+row.kind;$('size').value='original';setBackground('checker');updateAsset();$('detail').showModal();}
function setBackground(bg){$('preview').className='preview '+bg;document.querySelectorAll('[data-bg]').forEach(b=>b.classList.toggle('selected',b.dataset.bg===bg));}
function reset(){kind='';$('search').value='';$('region').value='';$('assetFilter').value='';$('ready').checked=false;$('history').checked=false;document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('active',b.dataset.kind===''));render();}
function renderAudit(){const a=data.directoryAudit;if(!a)return;const general=data.items.filter(r=>r.kind==='일반구').length;
 $('coverageSummary').textContent=`공식 목록 대조 · 시 ${a.counts['시']} / 군 ${a.counts['군']} / 자치구 ${a.counts['구']} / 광역 ${a.counts['광역']}`+(general?` · 일반구 ${general} 추가`:'');
 $('coverageNote').textContent=`${a.checked} 행정안전부 지자체 누리집 ${a.officialCount}개와 대조: 누락 ${a.missing.length}개, 중복 ${a.duplicateIds.length}개. 제주시·서귀포시 포함. 목록 확인과 이미지 확보는 별개입니다.`;
 const table=el('table');const head=el('tr');['지역','등록','CI 제공','슬로건 제공'].forEach(t=>head.append(el('th','',t)));table.append(head);
 for(const region of [...new Set(data.items.filter(r=>r.kind!=='관공서').map(r=>r.region))].sort()){
  const rows=data.items.filter(r=>r.region===region),tr=el('tr');[region,rows.length,rows.filter(r=>r.assets.some(a=>a.assetType==='ci')).length,rows.filter(r=>r.assets.some(a=>a.assetType==='slogan'&&a.versionStatus!=='historical')).length].forEach(v=>tr.append(el('td','',v)));table.append(tr);
 }$('coverageTable').replaceChildren(table);
}
$('searchForm').onsubmit=e=>{e.preventDefault();render();};$('search').oninput=()=>{if(data)render();};
for(const id of ['region','ready','history','assetFilter'])$(id).onchange=()=>render();
$('reset').onclick=reset;$('emptyReset').onclick=reset;
document.querySelectorAll('[data-search]').forEach(b=>b.onclick=()=>{reset();$('search').value=b.dataset.search;render();});
document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;document.querySelectorAll('[data-kind]').forEach(n=>n.classList.toggle('active',n===b));render();});
document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>setBackground(b.dataset.bg));
document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{selectedType=b.dataset.type;assetIndex=0;updateAsset();});
$('close').onclick=()=>$('detail').close();$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
$('size').onchange=updateDownload;
fetch('./catalog.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{data=d;$('total').textContent=d.items.length;$('updated').textContent='자료 확인 '+d.updated;$('directory').href=d.directorySource;[...new Set(d.items.map(r=>r.region))].sort((a,b)=>a.localeCompare(b,'ko')).forEach(v=>{const o=el('option','',v);o.value=v;$('region').append(o);});document.querySelectorAll('[data-kind]').forEach(b=>{if(b.dataset.kind)b.append(el('span','',d.items.filter(r=>localType(r)===b.dataset.kind).length));});renderAudit();render();}).catch(()=>{$('resultCount').textContent='자료를 불러오지 못했습니다. 네트워크 연결을 확인하고 새로고침해 주세요.';});
