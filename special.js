'use strict';
// A local redemption code, not server authentication. Persist one claim per save.
const ORBITAL_CODE='CLOCKOUT-0333',ORBITAL_TYPE=5;
function codeMenu(){showModal('code',`<div class="eyebrow">HEAD OFFICE · SPECIAL DELIVERY</div><h2>본사 지급 코드</h2><p>수령 코드를 입력하면 특수 장비가 가방에 지급됩니다.<br>현재 장비는 유지되며, I에서 직접 장착할 수 있습니다.</p><form id="redeem-form"><label for="redeem-code">지급 코드</label><input id="redeem-code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="64" placeholder="코드를 입력하세요"><p id="redeem-result" role="status">저장 기록당 한 번 수령할 수 있습니다.</p><div class="actions"><button class="primary" type="submit">장비 수령</button><button type="button" data-action="close">닫기</button></div></form>`);$('redeem-code').focus();}
function redeemCode(input){if(String(input).trim().toUpperCase()!==ORBITAL_CODE)return {ok:false,message:'일치하는 지급 코드가 없습니다.'};if(state.orbitalClaimed||state.inventory.some(w=>w.type===ORBITAL_TYPE))return {ok:false,message:'이 저장 기록에서 이미 수령한 장비입니다.'};if(state.inventory.length>=BAG_CAP)return {ok:false,message:'가방에 빈칸이 필요합니다. 무기 하나를 정리한 뒤 다시 입력하세요.'};const w=makeWeapon(ORBITAL_TYPE,3,5);w.enhance=3;state.inventory.push(w);state.orbitalClaimed=true;save();updateUI();beep(1000,.25);return {ok:true,message:'「퇴근 승인」 전설 MK.5 +3 지급 완료! I에서 장착하세요.'};}
document.addEventListener('submit',e=>{if(e.target.id!=='redeem-form')return;e.preventDefault();const result=redeemCode($('redeem-code').value);$('redeem-result').textContent=result.message;if(result.ok){$('redeem-code').value='';toast(result.message);}});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="redeem-menu"]')&&!modal)codeMenu();});
function fireOrbital(a,d){const origin={x:player.x,y:player.y},dx=Math.cos(a),dy=Math.sin(a),range=TYPES[ORBITAL_TYPE].range;const live=enemies.filter(e=>!e.dead);const primary=live.filter(e=>{const x=e.x-origin.x,y=e.y-origin.y;return x*dx+y*dy>0&&x*dx+y*dy<range&&Math.abs(x*dy-y*dx)<e.r+52;});
 effects.push({kind:'orbital',x:origin.x,y:origin.y,a,r:range,life:.62,max:.62,color:'#a7f1ff'});
 const impacts=primary.map(e=>({x:e.x,y:e.y}));if(!impacts.length)impacts.push({x:origin.x+dx*470,y:origin.y+dy*470});
 for(const p of impacts.slice(0,10)){effects.push({kind:'nova',x:p.x,y:p.y,r:145,life:.6,max:.6,color:'#abeaff'});particles(p.x,p.y,'#cff7ff',12);particles(p.x,p.y,'#ffce86',6);}
 const hits=live.filter(e=>primary.includes(e)||impacts.some(p=>dist(e,p)<145+e.r));for(const e of hits)hurtEnemy(e,primary.includes(e)?d:d*.7);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)shake=5;beep(55,.3,'sawtooth',.035);beep(1200,.18,'sine',.02);
}
function drawOrbital(e){const progress=1-e.life/e.max,fade=Math.pow(1-progress,1.2);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade;
 if(e.kind==='orbital'){ctx.translate(e.x,e.y);ctx.rotate(e.a);const width=16+34*Math.sin(Math.PI*Math.min(1,progress*1.8));
 const beam=ctx.createLinearGradient(0,0,e.r,0);beam.addColorStop(0,'#b0fbff');beam.addColorStop(.3,'#66baff');beam.addColorStop(.75,'#a392ff');beam.addColorStop(1,'#ffcf8300');ctx.strokeStyle=beam;ctx.lineCap='round';
 for(const [mult,alpha] of [[3,.07],[1.8,.16],[1,.55]]){ctx.globalAlpha=fade*alpha;ctx.lineWidth=width*mult;ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(e.r,0);ctx.stroke();}
 ctx.globalAlpha=fade;line(25,0,e.r,0,'#f1feff',Math.max(2,width*.25));
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(10,side*35);ctx.quadraticCurveTo(180,side*(70-40*progress),470,0);ctx.strokeStyle='#d8b6ff';ctx.lineWidth=2;ctx.stroke();for(let i=0;i<8;i++){const x=50+((i*133+progress*1100)%1050);line(x,side*(width+10),x+40,side*(width+10),'#8acbff',2);}}
 for(let i=0;i<2;i++){ctx.save();ctx.translate(25,0);ctx.rotate(progress*(i?4:-4));ctx.scale(.45,1);ctx.strokeStyle=i?'#ffda91':'#a3efff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,45+i*17,0,TAU);ctx.stroke();ctx.restore();}
 }else{const radius=e.r*(.2+progress*.8);glow(e.x,e.y,radius,'#72cfff30');for(let i=0;i<3;i++){ctx.strokeStyle=['#e7fcff','#97cfff','#edc6ff'][i];ctx.lineWidth=5-i*1.5;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(2,radius-i*14),0,TAU);ctx.stroke();}for(let i=0;i<8;i++){const a=i*TAU/8+progress*.4;line(e.x+Math.cos(a)*radius*.65,e.y+Math.sin(a)*radius*.65,e.x+Math.cos(a)*radius*1.2,e.y+Math.sin(a)*radius*1.2,'#e5e9ff',2);}line(e.x-radius*.5,e.y,e.x+radius*.5,e.y,'#fff3c9',3);line(e.x,e.y-radius*.5,e.x,e.y+radius*.5,'#cffaff',3);}
 ctx.restore();
}
