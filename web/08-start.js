document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>setLevel(Number(b.dataset.level)));
document.querySelector('#prev').onclick=()=>period(-1);
document.querySelector('#next').onclick=()=>period(1);
document.querySelector('#today').onclick=()=> {
    focus=new Date();
    draw();
    fit()
} ;
window.addEventListener('keydown', e=> {
    if(document.activeElement===input)return; if(e.key==='Escape') {
        setLevel(level-1); return
    } if(e.key==='PageUp'||e.key==='PageDown') {
        e.preventDefault(); period(e.key==='PageUp'?-1:1); return
    } if(e.key==='ArrowLeft'||e.key==='ArrowRight') {
        e.preventDefault(); let dir=e.key==='ArrowLeft'?-1:1; if(level===0||level===-1) {
            selectedYear+=dir; focus=new Date(selectedYear, focus.getMonth(), focus.getDate()); draw()
        } else if(level===3) {
            selectedWeek=Math.max(0, Math.min(monthWeeks().length-1, selectedWeek+dir)); draw()
        } else period(dir); return
    } if(e.key==='Enter'&&level===0) {
        focus=new Date(selectedYear, focus.getMonth(), focus.getDate()); setLevel(1); return
    } if(e.key==='Enter'&&level===3) {
        setLevel(4, monthWeeks()[selectedWeek]); return
    } if(e.key==='+'||e.key==='=')setLevel(level+1); if(e.key==='-')setLevel(level-1)
} );
document.querySelector('#openNotes').onclick=()=> {
    document.querySelector('#notepad').style.display='block';
    renderNotes()
} ;
document.querySelector('#closeNotes').onclick=()=>document.querySelector('#notepad').style.display='none';
document.querySelector('#addNote').onclick=addNote;
document.querySelector('#noteInput').addEventListener('keydown', e=> {
    if(e.key==='Enter'&&!e.shiftKey) {
        e.preventDefault(); addNote()
    }
} );
function addNote() {
    const field=document.querySelector('#noteInput'), value=field.value.trim();
    if(!value)return;
    notes.unshift( {
        id:Date.now()+Math.random(), text:value
    } );
    field.value='';
    saveNotes();
    field.focus()
}
document.querySelector('#noteCalendar').onclick=()=> {
    document.querySelector('#notepad').style.display='none';
    setLevel(2)
} ;
svg.addEventListener('dragover', e=> {
    if(e.dataTransfer.types.includes('text/plain'))e.preventDefault()
} );
svg.addEventListener('drop', e=> {
    e.preventDefault(); const val=e.dataTransfer.getData('text/plain'); if(!val.startsWith('midnight-note:'))return; const id=Number(val.slice(14)); if(level===-1||level===0)return; const d=dateAt(point(e)); if(d)scheduleNote(id, d)
} );
renderNotes();
window.addEventListener('resize', fit);
window.paperAPI= {
    back:()=>setLevel(5), chooseDate:(date)=> {
        let d=new Date(date+'T12:00:00');
        if(!isNaN(d))focus=d
    }
} ;
draw();
fit();
