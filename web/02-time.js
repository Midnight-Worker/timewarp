const tzparts=(date, zone)=>Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
} ).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type, Number(p.value)]));
function localToUTC(y, m, d, h, min, zone) {
    let target=Date.UTC(y, m-1, d, h, min), guess=target;
    for(let i=0; i<4; i++) {
        const p=tzparts(new Date(guess), zone);
        const actual=Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
        guess+=target-actual;
    } return new Date(guess).toISOString()
}
function dateInZone(date, zone) {
    const p=tzparts(date, zone);
    return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}
const utcOf=(c)=>new Date(c.at);
