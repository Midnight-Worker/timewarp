cards=load();
function load() {
    try {
        const v=JSON.parse(localStorage.getItem('midnight.timeplanet.v4')||'null');
        if(Array.isArray(v))return v
    } catch {
    }
const y=year0, m=today.getMonth()+1, d=today.getDate();
    return [ {
        id:1, at:localToUTC(y, m, d, 9, 0, 'Europe/Berlin'), owner:'me', title:'Projekt planen', duration:60
    } , {
        id:2, at:localToUTC(y, m, d, 10, 0, 'Australia/Sydney'), owner:'alex', title:'Sydney-Standup', duration:45
    } , {
        id:3, at:localToUTC(y, m, d, 15, 0, 'America/New_York'), owner:'sam', title:'Design besprechen', duration:60
    } , {
        id:4, at:localToUTC(y, m, d, 11, 0, 'Asia/Tokyo'), owner:'kim', title:'Material prüfen', duration:60
    } , {
        id:5, at:localToUTC(y, m, d+1, 14, 0, 'Europe/Berlin'), owner:'jo', title:'Abstimmung', duration:45
    } ];
}
function save() {
    localStorage.setItem('midnight.timeplanet.v4', JSON.stringify(cards));
}
function saveNotes() {
    localStorage.setItem('midnight.notes.v5', JSON.stringify(notes));
    renderNotes()
}
function renderNotes() {
    const ul=document.querySelector('#noteList');
    ul.replaceChildren();
    document.querySelector('#noteCount').textContent=notes.length;
    for(const note of notes) {
        const li=document.createElement('li'), span=document.createElement('span'), use=document.createElement('button'), remove=document.createElement('button');
        span.textContent=note.text;
        span.draggable=true;
        span.title='Auf einen Tag im Kalender ziehen';
        span.addEventListener('dragstart', e=> {
            e.dataTransfer.setData('text/plain', 'midnight-note:'+note.id); e.dataTransfer.effectAllowed='move'
        } );
        use.textContent='Heute';
        use.title='Als Aufgabe für den gewählten Tag einplanen';
        use.onclick=()=>scheduleNote(note.id, focus);
        remove.textContent='×';
        remove.title='Notiz löschen';
        remove.onclick=()=> {
            notes=notes.filter(n=>n.id!==note.id);
            saveNotes()
        } ;
        li.append(span, use, remove);
        ul.appendChild(li)
    }
}
function scheduleNote(id, date, owner='me') {
    const note=notes.find(n=>n.id===id);
    if(!note)return;
    let d=date||focus;
    cards.push( {
        id:Date.now()+Math.random(), at:localToUTC(d.getFullYear(), d.getMonth()+1, d.getDate(), 10, 0, BASE), owner, title:note.text, duration:60
    } );
    notes=notes.filter(n=>n.id!==id);
    save();
    saveNotes();
    draw();
    document.querySelector('#notepad').style.display='none'
}
