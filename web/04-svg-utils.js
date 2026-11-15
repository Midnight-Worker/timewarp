function n(tag, a= {
} , parent=world) {
    const e=document.createElementNS(NS, tag);
    Object.entries(a).forEach(([k, v])=>e.setAttribute(k, v));
    parent.appendChild(e);
    return e
}
function rect(p, x, y, w, h, fill, stroke='none', a= {
} ) {
    return n('rect', {
        x, y, width:w, height:h, rx:8, fill, stroke, ...a
    } , p)
}
function text(p, x, y, s, size=18, color='#d8f6ff', weight=500, a= {
} ) {
    const e=n('text', {
        x, y, fill:color, 'font-size':size, 'font-family':'system-ui,Segoe UI,sans-serif', 'font-weight':weight, ...a
    } , p);
    e.textContent=s;
    return e
}
const person=id=>people.find(p=>p.id===id)||people[0];
function eventsFor(dateKey, owner) {
    return cards.filter(c=>dateInZone(utcOf(c), BASE)===dateKey&&(!owner||c.owner===owner));
}
function card(p, c, x, y, w, h, compact=false) {
    const g=n('g', {
        'data-card':c.id, style:'cursor:grab'
    } , p), co=person(c.owner).color;
    rect(g, x, y, w, h, co, co, {
        'fill-opacity':compact?.48:.17, 'stroke-width':compact?0:2
    } );
    rect(g, x, y, 5, h, co);
    if(!compact) {
        text(g, x+13, y+Math.min(24, h-9), c.title.slice(0, Math.max(6, Math.floor(w/10))), Math.min(17, h*.38), '#f5ffff', 650);
        if(h>55)text(g, x+13, y+49, person(c.owner).name, 12, '#c3d7e5')
    } return g
}
