function period(dir) {
    let d=new Date(focus);
    if(level<=0) {
        selectedYear+=dir;
        focus=new Date(selectedYear, focus.getMonth(), focus.getDate());
        draw();
        return
    } if(level<=2)d.setFullYear(d.getFullYear()+dir);
    else if(level===3)d.setMonth(d.getMonth()+dir);
    else if(level===4)d.setDate(d.getDate()+dir*7);
    else d.setDate(d.getDate()+dir);
    focus=d;
    draw();
    fit()
}
function commit() {
    if(!editing)return;
    editing.title=input.value.trim()||'Ohne Titel';
    editing=null;
    input.style.display='none';
    save();
    draw()
}
function edit(c, e) {
    editing=c;
    input.value=c.title;
    input.style.left=Math.max(12, Math.min(innerWidth-290, e.clientX))+'px';
    input.style.top=Math.max(12, Math.min(innerHeight-65, e.clientY))+'px';
    input.style.display='block';
    input.focus();
    input.select()
}
// Feinere Zoomschritte, kontinuierlich um den Mauszeiger; erst bei Faktor 2.4 / 0.42 Stufe wechseln.
svg.addEventListener('wheel', e=> {
    e.preventDefault(); commit(); const p=point(e), factor=Math.exp(Math.max(-100, Math.min(100, e.deltaY))*.00125), next=zoomWithin/factor; if(next>2.4&&level<6) {
        setLevel(level+1, dateAt(p)||focus); return
    } if(next<.42&&level>-1) {
        setLevel(level-1); return
    }
const ratio=factor; view.x=p.x-(p.x-view.x)*ratio; view.y=p.y-(p.y-view.y)*ratio; view.w*=ratio; zoomWithin=next; camera()
} , {
    passive:false
} );
svg.addEventListener('pointerdown', e=> {
    if(e.button!==0)return; commit(); const p=point(e); pointer= {
        id:e.pointerId, last:p, start:p, card:targetCard(e), object:e.target.closest('[data-desk],[data-year]'), moved:false
    } ; svg.setPointerCapture(e.pointerId); svg.classList.add('moving')
} );
svg.addEventListener('pointermove', e=> {
    if(!pointer||e.pointerId!==pointer.id)return; const p=point(e), dx=p.x-pointer.last.x, dy=p.y-pointer.last.y; if(Math.hypot(p.x-pointer.start.x, p.y-pointer.start.y)>12)pointer.moved=true; if(pointer.object) {
        /* Objekt anklicken statt Kamera bewegen. */
    } else if(pointer.card&&pointer.moved) {
        let d=dateAt(p); if(d&&level>=2&&level<=4) {
            const c=pointer.card, oldDate=dateInZone(utcOf(c), BASE); if(iso(d)!==oldDate) {
                const old=tzparts(utcOf(c), BASE); c.at=localToUTC(d.getFullYear(), d.getMonth()+1, d.getDate(), old.hour, old.minute, BASE); draw()
            }
        }
    } else {
        view.x-=dx; view.y-=dy; camera()
    } pointer.last=p
} );
function release(e) {
    if(!pointer||pointer.id!==e.pointerId)return;
    blockClick=pointer.moved;
    if(pointer.card&&pointer.moved)save();
    pointer=null;
    svg.classList.remove('moving')
}
svg.addEventListener('pointerup', release);
svg.addEventListener('pointercancel', release);
svg.addEventListener('click', e=> {
    if(blockClick) {
        blockClick=false; return
    }
let c=targetCard(e); if(c) {
        edit(c, e); return
    }
let deskTarget=e.target.closest('[data-desk]'); if(deskTarget) {
        if(deskTarget.dataset.desk==='notes')document.querySelector('#notepad').style.display='block'; if(deskTarget.dataset.desk==='planet')setLevel(0); if(deskTarget.dataset.desk==='news')alert('Zeitung: Später öffnet sich hier dein Website-Editor.'); return
    }
let yr=e.target.closest('[data-year]'); if(yr) {
        let y=Number(yr.dataset.year); selectedYear=y; focus=new Date(y, focus.getMonth(), focus.getDate()); setLevel(1); return
    }
let u=e.target.closest('[data-user]'); if(u&&u.dataset.user!=='me') {
        active.has(u.dataset.user)?active.delete(u.dataset.user):active.add(u.dataset.user); draw(); if(level===5)fit()
    }
} );
svg.addEventListener('dblclick', e=> {
    if(targetCard(e))return; const d=dateAt(point(e)); if(level<=2) {
        setLevel(level+1, d); return
    } if(level===3) {
        setLevel(4, d); return
    } if(level===4) {
        setLevel(5, d); return
    }
const owner=e.target.closest('[data-user]')?.dataset.user||'me', p=point(e); const y=focus.getFullYear(), m=focus.getMonth()+1, day=focus.getDate(); const lx=75+[people[0], ...people.slice(1).filter(q=>active.has(q.id))].findIndex(q=>q.id===owner)*389; const localHour=Math.max(0, Math.min(23, Math.round((p.y-296-(owner==='me'?0:25))/53.7))); const newCard= {
        id:Date.now()+Math.random(), at:localToUTC(y, m, day, localHour, 0, BASE), owner, title:'Neue Aufgabe', duration:60
    } ; cards.push(newCard); save(); draw(); edit(newCard, e)
} );
input.addEventListener('blur', commit);
input.addEventListener('keydown', e=> {
    if(e.key==='Enter')input.blur(); if(e.key==='Escape') {
        editing=null; input.style.display='none'; draw()
    }
} );
