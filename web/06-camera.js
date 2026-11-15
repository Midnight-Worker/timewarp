const dimensions=()=>level===6?[2300, 1450]:level===-1?[2800, 1640]:level===0?[2600, 1500]:level<=2?[YW+500, YH+410]:level===3?[170+mdays(focus.getFullYear(), focus.getMonth())*209, 1140]:level===4?[2260, 1470]:[140+[people[0], ...people.slice(1).filter(p=>active.has(p.id))].length*389, 1800];
function fit() {
    let [w, h]=dimensions(), aspect=Math.max(.2, svg.clientWidth/svg.clientHeight);
    view.w=Math.max(w+130, (h+110)*aspect);
    view.h=view.w/aspect;
    view.x=level<=0?-view.w/2:(w-view.w)/2;
    view.y=level<=0?-view.h/2:(h-view.h)/2;
    zoomWithin=1;
    camera()
}
function camera() {
    view.h=view.w*svg.clientHeight/svg.clientWidth;
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    document.querySelector('#status').textContent=`${( {
        '-1':'Schreibtisch', 0:'Globus', 1:'11 Jahre', 2:'Jahr', 3:'Monat', 4:'Woche', 5:'Tag · Zeitzonen'})[level]} · Feiner Zoom ${zoomWithin.toFixed(2)}× · Mausrad / Ziehen`; document.querySelector('#zoomfill').style.width=`${((level+1+Math.min(1, Math.max(0, Math.log(zoomWithin)/Math.log(2))))/7)*93+5}%`
    }
function draw() {
        world.replaceChildren(); if(level===-1)desk(); else if(level===0)globe(); else if(level<=2)yearView(); else if(level===3)monthView(); else if(level===4)weekView(); else if(level===5)dayView(); document.querySelector('#range').textContent=level===-1?'Schreibtisch · Ideen sammeln':level===0?`Globus · ${focus.getFullYear()}`:level===1?`${focus.getFullYear()-5} – ${focus.getFullYear()+5}`:level===2?`${focus.getFullYear()}`:level===3?`${MONTH[focus.getMonth()]} ${focus.getFullYear()}`:level===4?`Woche · ${monday(focus).toLocaleDateString('de-DE')}`:focus.toLocaleDateString('de-DE'); document.querySelectorAll('[data-level]').forEach(b=>b.classList.toggle('active', Number(b.dataset.level)===level)); let box=document.querySelector('#people'); box.replaceChildren(); people.forEach(p=> {
            const b=document.createElement('button'); b.className='person'; b.style.borderColor=p.color; b.style.opacity=active.has(p.id)?'1':'.38'; b.innerText=(active.has(p.id)?'● ':'○ ')+p.name+(level===5?' · '+p.place:''); b.title=p.zone+(p.id==='me'?' (eigene Ebene stets sichtbar)':' · Klicken zum Ein-/Ausblenden'); b.onclick=()=> {
                if(p.id==='me')return; active.has(p.id)?active.delete(p.id):active.add(p.id); draw(); if(level===5)fit()
            } ; box.appendChild(b)
        } )
    }
function setLevel(next, date=null) {
        commit(); level=Math.max(-1, Math.min(6, next)); if(date)focus=new Date(date.getFullYear(), date.getMonth(), date.getDate()); if(level===3)selectedWeek=0; draw(); fit(); svg.style.display=level===6?'none':'block'; window.Paper?.activate(level===6, iso(focus))
    }
function point(e) {
        const p=svg.createSVGPoint(); p.x=e.clientX; p.y=e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse())
    }
function dateAt(p) {
        if(level<=2&&level>=1) {
            let m=Math.floor((p.y-TOP)/RH), d=Math.floor((p.x-LEFT)/CW)+1; return m>=0&&m<12&&d>=1&&d<=mdays(focus.getFullYear(), m)?new Date(focus.getFullYear(), m, d):null
        } if(level===3) {
            let d=Math.floor((p.x-150)/209)+1; return d>=1&&d<=mdays(focus.getFullYear(), focus.getMonth())?new Date(focus.getFullYear(), focus.getMonth(), d):null
        } if(level===4) {
            let i=Math.floor((p.x-65)/313); return i>=0&&i<7?dplus(monday(focus), i):null
        } return focus
    }
const targetCard=e=> {
        let t=e.target.closest('[data-card]'); return t?cards.find(c=>String(c.id)===t.dataset.card):null
    } ;
