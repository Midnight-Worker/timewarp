// Gezeichnete Globus-Grafik: bewusst schematisch, keine geographisch präzise Erdkarte.
function desk() {
    const g=n('g');
    rect(g, -1400, -820, 2800, 1640, '#382a28', '#7a6150', {
        'stroke-width':20
    } );
    for(let k=0; k<23; k++)n('line', {
        x1:-1390, y1:-800+k*72, x2:1390, y2:-800+k*72, stroke:'#96705a', 'stroke-opacity':'.12', 'stroke-width':3
    } , g);
    rect(g, -850, -540, 1180, 890, '#164157', '#83a9ad', {
        'stroke-width':7, filter:'url(#shadow)'
    } );
    text(g, -762, -450, 'MIDNIGHT · ZEITWELT', 55, '#b8ffee', 800);
    text(g, -762, -395, 'Ein Jahr wählen und in die Zeit eintauchen', 25, '#b9dce5');
    const mini=n('g', {
        transform:'translate(-250 -30) scale(.38)', style:'cursor:pointer', 'data-desk':'planet'
    } , g);
    n('circle', {
        cx:0, cy:0, r:360, fill:'url(#ocean)', stroke:'#8af1db', 'stroke-width':9
    } , mini);
    for(let j=-2; j<=2; j++)n('ellipse', {
        cx:0, cy:0, rx:Math.abs(350*Math.cos(j*.42)), ry:349, fill:'none', stroke:'#aef7f0', 'stroke-opacity':'.32', 'stroke-width':3
    } , mini);
    text(mini, 0, 13, '◎', 220, '#d3fff3', 500, {
        'text-anchor':'middle'
    } );
    text(g, -735, 245, '◀  '+selectedYear+'  ▶', 53, '#d5fff1', 700, {
        'data-desk':'planet', style:'cursor:pointer'
    } );
    text(g, -735, 293, 'Globus anklicken → Jahre auswählen', 21, '#a8c9d7');
    const paper=n('g', {
        'data-desk':'notes', style:'cursor:pointer', transform:'rotate(-4 660 -220)'
    } , g);
    rect(paper, 435, -625, 710, 780, '#f9ecca', '#dfbf8a', {
        'stroke-width':6, filter:'url(#shadow)'
    } );
    for(let j=0; j<13; j++)n('line', {
        x1:485, y1:-470+j*45, x2:1090, y2:-470+j*45, stroke:'#8daabc', 'stroke-opacity':'.42', 'stroke-width':2
    } , paper);
    text(paper, 505, -535, 'NOTIZBLOCK', 46, '#3d5660', 700);
    notes.slice(0, 7).forEach((v, i)=>text(paper, 505, -443+i*45, '• '+v.text.slice(0, 29), 26, '#435360', 500));
    text(paper, 535, 108, '✎ Anklicken zum Schreiben', 22, '#46736c');
    const pen=n('g', {
        transform:'rotate(-36 1230 -370)', 'pointer-events':'none'
    } , g);
    rect(pen, 1209, -625, 23, 470, '#c2b2a0', '#f5dbb2', {
        'stroke-width':4
    } );
    n('path', {
        d:'M1209 -155 L1232 -155 L1220 -112 Z', fill:'#a3a8ac'
    } , pen);
    const news=n('g', {
        'data-desk':'news', style:'cursor:pointer', transform:'rotate(7 560 540)'
    } , g);
    rect(news, 345, 370, 970, 370, '#ded6c3', '#9d9b91', {
        'stroke-width':5, filter:'url(#shadow)'
    } );
    text(news, 395, 448, 'MIDNIGHT WORKER', 69, '#253743', 850);
    n('line', {
        x1:395, y1:468, x2:1255, y2:468, stroke:'#253743', 'stroke-width':4
    } , news);
    text(news, 405, 534, 'DIE WERKSTATT-ZEITUNG', 37, '#354451', 650);
    text(news, 405, 583, 'Website · Projekte · Veröffentlichungen', 23, '#5b6266');
    for(let k=0; k<5; k++)rect(news, 410, 607+k*20, 800-k*60, 6, '#a9a596');
    text(g, -1100, 660, 'SCHREIBTISCH · GEDANKEN SAMMELN · ZEIT REISEN', 29, '#d9c7aa', 700);
}
function globe() {
    let g=n('g');
    n('circle', {
        cx:0, cy:0, r:540, fill:'#0b5971', 'fill-opacity':'.09', stroke:'#248b9c', 'stroke-opacity':'.4', 'stroke-width':2
    } , g);
    n('circle', {
        cx:0, cy:0, r:435, fill:'none', stroke:'#9ce9d2', 'stroke-opacity':'.28', 'stroke-width':2, 'stroke-dasharray':'12 15'
    } , g);
    let o=n('g', {
        transform:'rotate(-13)'
    } , g);
    n('circle', {
        cx:0, cy:0, r:350, fill:'url(#ocean)', stroke:'#92d8e4', 'stroke-width':4, filter:'url(#shadow)'
    } , o);
    let s=n('g', {
        'clip-path':'url(#earthClip)'
    } , o);
    n('circle', {
        r:350, fill:'url(#light)'
    } , s);
    for(let k=-4; k<=4; k++) {
        n('ellipse', {
            cx:0, cy:0, rx:350*Math.cos(k*Math.PI/12), ry:350, fill:'none', stroke:'#a3e3e8', 'stroke-opacity':'.2', 'stroke-width':1
        } , s);
        n('ellipse', {
            cx:0, cy:0, rx:350, ry:350*Math.cos(k*Math.PI/12), fill:'none', stroke:'#b3f5ef', 'stroke-opacity':'.17', 'stroke-width':1
        } , s)
    } for(const path of ['M -250 -225 L -156 -273 -95 -245 -52 -180 -79 -120 -35 -78 -99 -19 -153 -26 -204 -94 -282 -135 Z', 'M -132 4 L -79 38 -43 113 -80 218 -134 266 -159 191 -204 108 Z', 'M 40 -250 L 170 -275 285 -215 255 -130 168 -99 144 -28 88 -52 28 -124 Z', 'M 25 -62 L 112 -52 148 48 93 163 33 199 -10 117 Z', 'M 219 178 L 290 196 317 240 259 275 201 244 Z'])n('path', {
        d:path, fill:'#5dbca1', 'fill-opacity':'.7', stroke:'#b2edc5', 'stroke-opacity':'.32', 'stroke-width':3
    } , s);
    const season=focus.getMonth(), northWarm=season>=3&&season<=8;
    rect(s, -360, -350, 720, 350, northWarm?'url(#northTint)':'url(#southTint)');
    rect(s, -360, 0, 720, 350, northWarm?'url(#southTint)':'url(#northTint)');
    text(g, 0, 3, String(focus.getFullYear()), 85, '#f4ffff', 800, {
        'text-anchor':'middle'
    } );
    text(g, 0, 49, 'ZEITPLANET', 26, '#b3f0e2', 650, {
        'text-anchor':'middle'
    } );
    text(g, 0, 595, 'NORD · '+(northWarm?'SOMMER':'WINTER')+'     /     SÜD · '+(northWarm?'WINTER':'SOMMER'), 20, '#91bdcf', 600, {
        'text-anchor':'middle'
    } );
    for(let i=-5; i<=5; i++) {
        const yy=focus.getFullYear()+i, angle=(-Math.PI/2)+i*.37, depth=1-Math.abs(i)*.115, x=Math.cos(angle)*950, y=Math.sin(angle)*495+120;
        const pg=n('g', {
            transform:`translate(${x} ${y}) rotate(${i*6})`, 'data-year':yy, style:'cursor:pointer', opacity:Math.max(.09, depth)
        } , g);
        rect(pg, -118, -85, 236, 170, yy===selectedYear?'#236d69':'#163e50', yy===selectedYear?'#e7ffd0':'#78d5c6', {
            'stroke-width':yy===selectedYear?9:3, filter:'url(#shadow)'
        } );
        text(pg, -91, -34, String(yy), 39, '#d8fff5', 800);
        for(let r=0; r<6; r++)rect(pg, -91, -12+r*13, 178, 6, r%2?'#2a5c70':'#447e89')
    }
}
const YW=5170, YH=2660, LEFT=205, TOP=185, CW=155, RH=195;
function yearGhost(y, offset) {
    const fade=Math.pow((6-Math.abs(offset))/6, 2);
    const g=n('g', {
        opacity:fade*.65, transform:`translate(${offset*63} ${-Math.abs(offset)*41}) scale(${1-Math.abs(offset)*.018})`, 'pointer-events':'none'
    } );
    rect(g, 0, 0, YW, YH, '#113a50', '#7bd9d2', {
        'stroke-width':10
    } );
    text(g, 110, 126, String(y), 95, '#bdffef', 750);
    for(let m=0; m<12; m++) {
        rect(g, 40, TOP+m*RH, YW-80, RH-14, m%2?'#1c4a5c':'#153b51');
        text(g, 70, TOP+m*RH+80, MONTH[m].toUpperCase(), 28, '#b1ead8', 700)
    }
}
function yearView() {
    if(level===1)for(let i=5; i>=1; i--) {
        yearGhost(focus.getFullYear()-i, -i);
        yearGhost(focus.getFullYear()+i, i)
    }
const g=n('g');
    rect(g, 0, 0, YW, YH, '#0d2b40', '#5091a0', {
        'stroke-width':7, filter:'url(#shadow)'
    } );
    rect(g, 35, 30, YW-70, 128, '#164458');
    text(g, 90, 118, String(focus.getFullYear()), 105, '#a9ffe0', 800);
    text(g, 805, 115, 'JANUAR — DEZEMBER · ZEITBALKEN', 35, '#bad9e1', 650);
    for(let m=0; m<12; m++) {
        let yy=TOP+m*RH, y=focus.getFullYear();
        rect(g, 43, yy, YW-86, RH-14, m%2?'#19374d':'#163046', '#345e75');
        text(g, 65, yy+53, MONTH[m].toUpperCase(), 27, '#85e8ce', 700);
        for(let d=1; d<=mdays(y, m); d++) {
            const x=LEFT+(d-1)*CW, date=new Date(y, m, d), key=iso(date);
            let p=n('g', {
                'data-date':key, style:'cursor:pointer'
            } , g);
            rect(p, x, yy+10, CW-6, RH-32, key===iso(today)?'#27565a':'#1d3d53', '#37576a');
            text(p, x+11, yy+37, String(d).padStart(2, '0'), 23, '#e4f3fa', 700);
            text(p, x+CW-15, yy+37, WD[date.getDay()], 13, '#9abccd', 500, {
                'text-anchor':'end'
            } );
            const ev=eventsFor(key);
            const count= {
            } ;
            ev.forEach(c=>count[c.owner]=(count[c.owner]||0)+1);
            people.forEach((person, i)=> {
                if(count[person.id])rect(p, x+8, yy+61+i*17, Math.min(CW-18, 20+count[person.id]*28), 10, person.color)
            } )
        }
    }
}
function monthWeeks() {
    let weeks=[], y=focus.getFullYear(), m=focus.getMonth();
    for(let d=1; d<=mdays(y, m); d++) {
        let mon=monday(new Date(y, m, d));
        if(!weeks.some(w=>iso(w)===iso(mon)))weeks.push(mon)
    } return weeks
}
function monthView() {
    const y=focus.getFullYear(), m=focus.getMonth(), days=mdays(y, m), w=170+days*209, g=n('g');
    rect(g, 0, 0, w, 1100, '#102c41', '#68a9b2', {
        'stroke-width':6, filter:'url(#shadow)'
    } );
    text(g, 67, 95, `${MONTH[m]} ${y}`, 70, '#afffe4', 800);
    text(g, 69, 148, '← → Nebelrahmen verschieben · Enter öffnet die Woche', 23, '#abc9d5');
    for(let d=1; d<=days; d++) {
        let x=150+(d-1)*209, date=new Date(y, m, d), key=iso(date);
        let p=n('g', {
            'data-date':key, style:'cursor:pointer'
        } , g);
        rect(p, x, 191, 198, 840, date.getDay()===0||date.getDay()===6?'#19384b':'#1c4357', '#43687d', {
            'stroke-width':2
        } );
        text(p, x+13, 238, `${WD[date.getDay()]} ${d}`, 27, '#e8f8ff', 650);
        eventsFor(key).slice(0, 9).forEach((c, i)=>card(p, c, x+8, 270+i*76, 182, 69))
    }
let weeks=monthWeeks();
    selectedWeek=Math.max(0, Math.min(selectedWeek, weeks.length-1));
    let first=weeks[selectedWeek], firstDay=Math.max(1, (first-new Date(y, m, 1))/86400000+1), lastDay=Math.min(days, firstDay+6+(firstDay===1?(new Date(y, m, 1).getDay()+6)%7:0));
    let x=150+(firstDay-1)*209, width=Math.max(209, (lastDay-firstDay+1)*209);
    rect(g, x, 179, width, 863, '#b1ffdf', '#a9ffe8', {
        'fill-opacity':'.075', 'stroke-width':7, 'stroke-dasharray':'16 13', 'pointer-events':'none'
    } );
    text(g, x+20, 1081, 'AUSGEWÄHLTE WOCHE  ↵', 20, '#a4f9df', 700)
}
function weekView() {
    const g=n('g'), start=monday(focus), w=2260;
    rect(g, 0, 0, w, 1470, '#112f42', '#649fa9', {
        'stroke-width':6, filter:'url(#shadow)'
    } );
    text(g, 65, 96, `Woche · ${start.toLocaleDateString('de-DE')}`, 68, '#a5ffe0', 800);
    text(g, 69, 145, 'Alle Kalender · Karten direkt bearbeiten', 23, '#b0d3dd');
    for(let i=0; i<7; i++) {
        const day=dplus(start, i), key=iso(day), x=65+i*313, p=n('g', {
            'data-date':key, style:'cursor:pointer'
        } , g);
        rect(p, x, 196, 296, 1190, i%2?'#18394d':'#194257', '#41687b', {
            'stroke-width':2
        } );
        text(p, x+18, 247, `${WD[day.getDay()]} ${day.getDate()}.${day.getMonth()+1}.`, 28, '#f0ffff', 700);
        eventsFor(key).filter(c=>active.has(c.owner)).slice(0, 14).forEach((c, j)=>card(p, c, x+12, 282+j*77, 270, 69))
    }
}
// Tagesraster: Jede Zeile steht für EINEN Zeitpunkt (Basis Europe/Berlin).
// Jede persönliche Spalte zeigt denselben Zeitpunkt in ihrer jeweiligen Zeitzone.
function dayView() {
    let selected=[people[0], ...people.slice(1).filter(p=>active.has(p.id))], w=140+selected.length*389, h=1800, g=n('g');
    rect(g, 0, 0, w, h, '#102b40', '#5da1ac', {
        'stroke-width':6, filter:'url(#shadow)'
    } );
    text(g, 70, 100, focus.toLocaleDateString('de-DE', {
        weekday:'long', day:'2-digit', month:'long', year:'numeric'
    } ), 65, '#adffe2', 800);
    text(g, 70, 146, 'Gleicher Zeitpunkt · verschiedene lokale Uhrzeiten / Datumswechsel', 22, '#bbd6e3');
    const dayKey=iso(focus);
    for(let i=0; i<selected.length; i++) {
        const p=selected[i], x=75+i*389, y=196+i*25, lane=n('g', {
            'data-user':p.id, style:'cursor:pointer'
        } , g);
        rect(lane, x, y, 370, 1465, '#15364b', p.color, {
            'stroke-width':i===0?5:2, filter:'url(#shadow)'
        } );
        rect(lane, x, y, 370, 77, p.color, 'none', {
            'fill-opacity':'.24'
        } );
        text(lane, x+15, y+34, `${i===0?'★ ':''}${p.name}`, 27, '#f5ffff', 750);
        text(lane, x+15, y+59, `${p.place} · ${p.zone}`, 15, '#c7dce4', 500);
        for(let hour=0; hour<24; hour++) {
            const yy=y+100+hour*53.7;
            let instant=new Date(localToUTC(focus.getFullYear(), focus.getMonth()+1, focus.getDate(), hour, 0, BASE)), local=tzparts(instant, p.zone), localDate=dateInZone(instant, p.zone);
            n('line', {
                x1:x+10, y1:yy, x2:x+359, y2:yy, stroke:'#698a98', 'stroke-opacity':'.3'
            } , lane);
            text(lane, x+12, yy+20, `${String(local.hour).padStart(2, '0')}:00`, 15, '#d0ecf3', 600);
            if(hour%4===0||localDate!==dayKey)text(lane, x+93, yy+19, localDate===dayKey?'':localDate.slice(5).replace('-', '.'), 11, '#8cbacb');
            if(local.hour>=22||local.hour<7)rect(lane, x+82, yy, 275, 53.5, '#040e23', 'none', {
                'fill-opacity':'.4', 'pointer-events':'none'
            } );
            if(local.hour>=9&&local.hour<17)rect(lane, x+82, yy, 275, 53.5, '#4ce0a4', 'none', {
                'fill-opacity':'.055', 'pointer-events':'none'
            } )
        }
// Karten nach tatsächlichem UTC-Zeitpunkt auf die Basis-Zeitskala legen.
        const start=new Date(localToUTC(focus.getFullYear(), focus.getMonth()+1, focus.getDate(), 0, 0, BASE));
        const end=new Date(localToUTC(focus.getFullYear(), focus.getMonth()+1, focus.getDate()+1, 0, 0, BASE));
        cards.filter(c=>c.owner===p.id).forEach(c=> {
            const at=utcOf(c), finish=new Date(at.getTime()+c.duration*60000); if(finish<=start||at>=end)return; const minutes=(Math.max(at, start)-start)/60000, minsVisible=(Math.min(finish, end)-Math.max(at, start))/60000; const cy=y+100+minutes/60*53.7; card(lane, c, x+113, cy, 244, Math.max(32, minsVisible/60*53.7))
        } );
    } text(g, 75, h-50, 'DUNKEL = NACHT  ·  GRÜNSCHATTEN = ARBEITSZEIT 09–17 UHR (LOKAL)', 18, '#a6cfcd', 600)
}
