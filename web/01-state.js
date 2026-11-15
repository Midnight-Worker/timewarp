'use strict';
const svg=document.querySelector('#space'), world=document.querySelector('#world'), input=document.querySelector('#editor');
const NS='http://www.w3.org/2000/svg', MONTH=['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'], WD=['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const people=[ {
    id:'me', name:'Ich', zone:'Europe/Berlin', place:'Berlin', color:'#75f0d2'
} , {
    id:'alex', name:'Alex', zone:'Australia/Sydney', place:'Sydney', color:'#ffba6e'
} , {
    id:'sam', name:'Sam', zone:'America/New_York', place:'New York', color:'#91b9ff'
} , {
    id:'kim', name:'Kim', zone:'Asia/Tokyo', place:'Tokio', color:'#dc9afa'
} , {
    id:'jo', name:'Jo', zone:'Europe/London', place:'London', color:'#f492a3'
} ];
const BASE=people[0].zone, year0=new Date().getFullYear(), today=new Date();
let level=-1, focus=new Date(), selectedWeek=0, zoomWithin=1, view= {
    x:-1300, y:-700, w:2600, h:1480
} , pointer=null, blockClick=false, editing=null;
let active=new Set(people.map(p=>p.id)), cards;
let notes=[];
try {
    notes=JSON.parse(localStorage.getItem('midnight.notes.v5')||'[]')
} catch {
}
let selectedYear=new Date().getFullYear();
// load() erst nach Initialisierung der Zeitzonen-Helfer
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dplus=(d, n)=>new Date(d.getFullYear(), d.getMonth(), d.getDate()+n), monday=d=>dplus(d, -(d.getDay()+6)%7);
const mdays=(y, m)=>new Date(y, m+1, 0).getDate();
