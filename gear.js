'use strict';
// Equipment and menu presentation. Combat and world rendering remain in game.js.
const BAG_CAP=24, MAX_ENHANCE=3;
let selectedWeapon=null, salvageConfirm=null;
const enhanceLevel=w=>w.enhance||0;
const salvageValue=w=>3+w.rarity*4+Math.max(0,w.tier-1)+enhanceLevel(w)*2;
const enhanceCost=w=>({money:35+enhanceLevel(w)*30+w.rarity*20,cells:3+enhanceLevel(w)*2+w.rarity*2});
const promoteCost=w=>({money:90+w.rarity*130,cells:8+w.rarity*8});
const affordable=c=>state.money>=c.money&&state.cells>=c.cells;
function cellIcon(){return '<svg class="cell-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v3H9zM6 5h12v16H6z" fill="currentColor"/><path d="m13 7-4 6h3l-1 5 5-7h-4z" fill="#252420"/></svg>';}
function weaponIcon(type){if(type===5)return '<svg class="weapon-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M7 23h39v18H7zM15 41h13v12H15z" fill="#8795b7"/><path d="m19 18 38-6-7 13-27 3zM19 46l38 6-7-13-27-3z" fill="#d6d4f5"/><path d="M24 29h35v6H24z" fill="#e2ffff"/><ellipse cx="42" cy="32" rx="6" ry="19" fill="none" stroke="#9be5ff" stroke-width="3"/><circle cx="18" cy="32" r="7" fill="#fff0b7"/></svg>';const shapes=[
 '<path d="M9 23h38v12H29v13H18V35H9z" fill="#aab9b0"/><path d="M32 25h22v8H32z" fill="#d6e7cd"/><path d="M16 26h12v4H16z" fill="#476658"/>',
 '<path d="M9 22h38v20H9zM17 42h12v9H17z" fill="#9d9182"/><path d="M38 18h16v28H38z" fill="#ebba86"/><path d="M14 27h20v10H14z" fill="#5a5149"/><path d="M44 22h6v20h-6z" fill="#fff0d7"/>',
 '<path d="M5 29h51v7H5zM18 36h9v12h-9zM14 24h14v5H14z" fill="#acbcc5"/><path d="M34 29h24v7H34z" fill="#a7d4ea"/><path d="M8 24h5v18H8z" fill="#6f838e"/>',
 '<path d="m19 45 26-32 6-2-1 7-27 31z" fill="#e4bddf"/><path d="m12 41 5-5 13 12-5 5z" fill="#b09bba"/><path d="m10 53 9-12 5 4-9 12z" fill="#6b657c"/>',
 '<path d="M12 27h33v17H12zM19 44h10v9H19z" fill="#aea689"/><path d="M35 13h6v14h-6zM48 17h6v20h-6z" fill="#dccb85"/><path d="m39 14 7 7-8 5 14 9" fill="none" stroke="#fff0b6" stroke-width="3"/><circle cx="24" cy="35" r="6" fill="#e8d595"/>'
 ];return `<svg class="weapon-icon" viewBox="0 0 64 64" aria-hidden="true">${shapes[type]}</svg>`;}
function acquireWeapon(w){
 if(state.inventory.length>=BAG_CAP){toast('가방이 가득 찼습니다. I에서 무기를 분해하세요.');return false;}
 w.enhance=enhanceLevel(w);state.inventory.push(w);save();updateUI();toast(`${TYPES[w.type].name} 획득 · ${RARITIES[w.rarity].name}`);beep(740,.08);return true;
}
function costHTML(c){return `<span>₩${c.money}</span><span>${cellIcon()} ${c.cells}</span>`;}
function changedStat(value,base,suffix=''){const delta=value-base;return `<strong>${value}${suffix}</strong>${Math.abs(delta)>.01?`<small class="${delta>0?'better':'worse'}">${delta>0?'+':''}${Number(delta.toFixed(1))}</small>`:'<small class="neutral">—</small>'}`;}
function detailHTML(w){const t=TYPES[w.type],r=RARITIES[w.rarity],eq=equipped(),isEquipped=w.id===eq.id,enh=enhanceLevel(w),cost=enhanceCost(w),promotion=promoteCost(w),atHome=zone===0;
 const next={...w,enhance:enh+1},promoted={...w,rarity:Math.min(3,w.rarity+1)};
 return `<div class="detail-head"><div class="detail-icon">${weaponIcon(w.type)}</div><div><span class="rarity-tag rarity-${w.rarity}">${r.name}</span><h3>${t.name} <em>+${enh}</em></h3><span class="detail-meta">MK.${w.tier} ${isEquipped?'· 현재 장착 중':''}</span></div></div>
 <p class="weapon-desc">${t.desc}</p><div class="stat-grid"><div><span>공격력</span>${changedStat(damage(w),damage(eq))}</div><div><span>초당 공격</span>${changedStat(Number((1/cooldown(w)).toFixed(1)),Number((1/cooldown(eq)).toFixed(1)),'회')}</div><div><span>사거리</span>${changedStat(t.range,TYPES[eq.type].range)}</div></div><p class="compare-note">${isEquipped?'이 무기를 장착하고 있습니다.':`현재 장착: ${TYPES[eq.type].name} +${enhanceLevel(eq)}와 비교`}</p>
 <button class="wide ${isEquipped?'subtle':'primary'}" data-action="equip:${w.id}" ${isEquipped?'disabled':''}>${isEquipped?'장착 중':'이 무기 장착'}</button>
 <div class="forge-block"><div class="forge-title"><strong>무기 강화</strong><span>+${enh} / +${MAX_ENHANCE}</span></div>${enh<MAX_ENHANCE?`<p>+${enh} → +${enh+1} <b>공격력 ${damage(w)} → ${damage(next)}</b>${[0,3].includes(w.type)?'<small>공격 속도도 증가합니다.</small>':''}</p><button class="cost-button" data-action="enhance:${w.id}" ${!atHome||!affordable(cost)?'disabled':''}><span>강화</span><span class="cost">${costHTML(cost)}</span></button>`:'<p class="muted">최대 강화에 도달했습니다.</p>'}
 ${w.rarity<3?`<div class="promotion"><p>${r.name} → <b>${RARITIES[w.rarity+1].name}</b><span>공격력 ${damage(w)} → ${damage(promoted)}</span></p><button class="cost-button" data-action="promote:${w.id}" ${!atHome||enh<MAX_ENHANCE||!affordable(promotion)?'disabled':''}><span>${enh<MAX_ENHANCE?'+3 달성 후 승급':'등급 상승'}</span><span class="cost">${costHTML(promotion)}</span></button><small>승급해도 강화 +3과 MK는 유지됩니다.</small></div>`:'<p class="legend-note">최고 등급 · 전설</p>'}${!atHome?'<p class="location-note">편의점에서 강화·등급 상승이 가능합니다.</p>':'<small class="forge-foot">실패 없이 확정 강화 · 돈과 잔류 전지 사용</small>'}</div>
 <div class="salvage-row">${TYPES[w.type].codeOnly?'<small>특수 지급 무기는 분해할 수 없습니다.</small>':isEquipped?'<small>장착 중인 무기는 분해할 수 없습니다.</small>':salvageConfirm===w.id?`<p>이 무기를 분해할까요? 되돌릴 수 없습니다.</p><div class="actions">${button('취소','cancel-salvage')}${button('분해 확정 · 전지 '+salvageValue(w),'salvage:'+w.id,'danger')}</div>`:`<button class="text-button" data-action="ask-salvage:${w.id}">분해</button><small>${cellIcon()} 잔류 전지 +${salvageValue(w)}</small>`}</div>`;
}
function inventory(id=selectedWeapon){
 const selected=state.inventory.find(w=>w.id===id);selectedWeapon=selected?.id||null;
 showModal('bag',`<div class="modal-heading"><div><div class="eyebrow">PERSONAL LOCKER</div><h2>내 장비</h2></div>${button('닫기 · Esc','close','close-button')}</div><div class="inventory-top"><span>보유 무기 <b>${state.inventory.length}</b> / ${BAG_CAP}</span><div class="resources"><span>₩${state.money.toLocaleString()}</span><span>${cellIcon()} ${state.cells} <small>잔류 전지</small></span></div></div><div class="inventory-layout"><div class="inventory-list"><div class="weapon-grid">${state.inventory.map(w=>`<button class="weapon-slot ${selectedWeapon===w.id?'selected':''}" data-action="select:${w.id}" aria-label="${TYPES[w.type].name} ${RARITIES[w.rarity].name} 강화 ${enhanceLevel(w)} 상세" aria-pressed="${selectedWeapon===w.id}"><div class="slot-art">${weaponIcon(w.type)}${w.id===state.equipped?'<span class="equipped-mark">장착</span>':''}<b>+${enhanceLevel(w)}</b></div><strong>${TYPES[w.type].name}</strong><span class="rarity-tag rarity-${w.rarity}">${RARITIES[w.rarity].name}</span><small>MK.${w.tier}</small></button>`).join('')}</div><p class="bag-hint">무기를 선택하면 상세 정보가 표시됩니다.<br>사용하지 않는 무기는 분해해 잔류 전지로 바꾸세요.</p></div><section class="weapon-detail" aria-label="무기 상세 정보">${selected?detailHTML(selected):`<div class="empty-detail">${weaponIcon(equipped().type)}<h3>어떤 무기를 쓸까요?</h3><p>왼쪽에서 무기를 선택하세요.<br>비교 · 장착 · 강화 · 분해</p><small>${zone===0?'편의점 작업대 이용 가능':'강화는 편의점에서 가능합니다.'}</small></div>`}</section></div>`);
}
function equipWeapon(id){const w=state.inventory.find(w=>w.id===id);if(!w)return;state.equipped=id;salvageConfirm=null;save();updateUI();inventory(id);beep(600);}
function salvageWeapon(id){const w=state.inventory.find(w=>w.id===id);if(!w||TYPES[w.type].codeOnly||w.id===state.equipped||salvageConfirm!==id)return false;const value=salvageValue(w);state.cells+=value;state.inventory=state.inventory.filter(a=>a!==w);salvageConfirm=null;selectedWeapon=null;save();updateUI();inventory();toast(`무기 분해 · 잔류 전지 +${value}`);return true;}
function improveWeapon(id,promote=false){const w=state.inventory.find(w=>w.id===id);if(!w||zone!==0)return false;const enh=enhanceLevel(w);if(promote?(enh<MAX_ENHANCE||w.rarity>=3):enh>=MAX_ENHANCE)return false;const cost=promote?promoteCost(w):enhanceCost(w);if(!affordable(cost)){toast('돈 또는 잔류 전지가 부족합니다.');return false;}state.money-=cost.money;state.cells-=cost.cells;if(promote)w.rarity++;else w.enhance=enh+1;save();updateUI();inventory(id);toast(promote?`${TYPES[w.type].name} · ${RARITIES[w.rarity].name} 승급`:`${TYPES[w.type].name} +${w.enhance} 강화 완료`);beep(900,.15);return true;}
function equipmentAction(action){const split=action.indexOf(':'),verb=split<0?action:action.slice(0,split),id=action.slice(split+1);
 if(verb==='select'){salvageConfirm=null;inventory(id);return true;}
 if(verb==='equip'){equipWeapon(id);return true;}
 if(verb==='ask-salvage'){salvageConfirm=id;inventory(id);return true;}
 if(verb==='cancel-salvage'){salvageConfirm=null;inventory();return true;}
 if(verb==='salvage'){salvageWeapon(id);return true;}
 if(verb==='enhance'||verb==='promote'){improveWeapon(id,verb==='promote');return true;}
 if(verb==='workbench'){salvageConfirm=null;inventory(state.equipped);return true;}
 return false;
}
