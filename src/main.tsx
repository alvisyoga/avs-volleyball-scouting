
import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";

type Side="HOME"|"AWAY";
type Skill="Attack"|"Serve"|"Reception"|"Set"|"Block"|"Dig"|"Cover"|"Free Ball";
type Player={id:number;number:number;name:string;role:string};
type Action={id:number;side:Side;player:Player;pos:number;rot:number;skill:Skill;result:string;subtype?:string;target?:string;direction?:string;tempo?:string;zoneNote?:string;blockType?:string;timestamp?:string};
type Rally={id:number;set:number;actions:Action[];winner?:Side;pointReason?:string;before:{home:number;away:number};after?:{home:number;away:number};beforeServer?:Side;beforeRot?:{home:number;away:number};beforeHomeCourt?:Player[];beforeAwayCourt?:Player[]};
type ScoutMode="BOTH"|"HOME"|"AWAY";
type MatchConfig={homeName:string;awayName:string;competition:string;date:string;venue:string;referee:string;bestOf:number;scoutingMode:ScoutMode};
type SubEvent={id:number;team:Side;type:"SUBSTITUTION"|"LIBERO IN"|"LIBERO OUT";pos:number;outPlayer?:Player;inPlayer?:Player};

const home:Player[]=[
{id:4,number:4,name:"Raka",role:"OH"},{id:5,number:5,name:"Fajar",role:"S"},
{id:6,number:6,name:"Dimas",role:"MB"},{id:7,number:7,name:"Rizky",role:"OP"},
{id:9,number:9,name:"Bagas",role:"OH"},{id:12,number:12,name:"Ardi",role:"MB"}];
const away:Player[]=[
{id:101,number:1,name:"Player 1",role:"OH"},{id:102,number:2,name:"Player 2",role:"S"},
{id:103,number:3,name:"Player 3",role:"MB"},{id:104,number:4,name:"Player 4",role:"OP"},
{id:105,number:5,name:"Player 5",role:"OH"},{id:106,number:6,name:"Player 6",role:"MB"}];

const emptyCourt=(team:Side):Player[]=>Array.from({length:6},(_,i)=>({id:team==="HOME"?-(i+1):-(i+101),number:0,name:"",role:""}));
const emptyStarterNumbers=()=>["","","","","",""];

const cfg:any={
Attack:{results:["Kill","Positive (+)","Continuation (#)","Error","Blocked"],sub:["Hard Spike","Tip","Roll Shot","Tool / Block Out","Back Row"],target:["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"],dir:["Cross","Line","Tip","Middle"]},
Serve:{results:["Ace","Positive (+)","In Play","Error"],sub:["Float","Jump Float","Jump Serve","Standing"],target:["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"],dir:["Cross","Line","Middle"]},
Reception:{results:["Perfect (3)","Good (2)","Poor (1)","Error (0)"],target:["Setter Target","P1","P2","P3","P4","P5","P6"]},
Set:{results:["Perfect (3)","Good (2)","Poor (1)","Error (0)"],target:["P4 Outside","P3 Middle","P2 Opposite","Back Row","Pipe","Slide"],tempo:["High Ball","Quick","Shoot","Back","Pipe","Slide"]},
Block:{results:["Block Kill","Touch","Control","Error"],sub:["Solo","Double","Triple"],dir:["Line","Cross","Middle","Seam"]},
Dig:{results:["Perfect (3)","Good (2)","Poor (1)","Error (0)"],sub:["Hard Attack","Tip","Roll Shot","Block Deflection","Free Ball"],target:["P1","P2","P3","P4","P5","P6"]},
Cover:{results:["Good","Poor","Error"],target:["P1","P2","P3","P4","P5","P6"]},
"Free Ball":{results:["Good","Poor","Error"],target:["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"]}
};

const css=`
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#06111d;color:#edf5fb}
button,select{font:inherit}button{cursor:pointer}.app{min-height:100vh;display:flex;background:#071320}
.side{position:fixed;left:0;top:0;bottom:0;width:250px;background:#07111e;border-right:1px solid #20364a;padding:22px 12px}
.brand{display:flex;align-items:center;gap:11px;padding:5px 8px 24px}.logo{width:48px;height:48px;border-radius:14px;background:#22cdb0;color:#03151c;display:grid;place-items:center;font-size:25px;font-weight:900}.brand b{display:block}.brand small{color:#7094b0;letter-spacing:2px}
.nav{width:100%;padding:13px 12px;margin:4px 0;border-radius:11px;border:1px solid transparent;background:transparent;color:#91abc0;text-align:left}.nav.active{background:#15283c;border-color:#4c6477;color:#fff;box-shadow:inset 3px 0 #28d4b5}.bottom{position:absolute;bottom:18px;left:20px;color:#7194ad;font-size:11px;line-height:1.8}
.main{margin-left:250px;width:calc(100% - 250px);padding:22px 28px 50px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.head h1{margin:3px 0;font-size:27px}.ey{font-size:10px;color:#70a0bf;letter-spacing:1.5px}.actions{display:flex;gap:7px}
.btn{border:1px solid #2b455c;border-radius:8px;background:#0d1f30;color:#dceaf4;padding:9px 12px;font-weight:800;font-size:11px}.btn:hover{background:#17334a}.primary{background:#18b99d;border-color:#31d9bc;color:#03151b}.danger{background:#321e26;border-color:#74414d;color:#ffbac6}
.score{display:grid;grid-template-columns:1fr 170px 1fr;gap:15px;align-items:center;background:#0a1725;border:1px solid #1d3549;border-radius:14px;padding:15px 20px;margin-bottom:10px}.tm{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center}.tm span{font-size:10px;color:#55d8bd;font-weight:900}.tm strong{font-size:32px}.tm b{font-size:14px}.tm.aw span{color:#ff9999}.mid{text-align:center;color:#8eabc0;font-size:11px}.mid b{display:block;color:#fff;font-size:14px;margin-bottom:5px}
.toolbar,.panel{background:#091725;border:1px solid #1b3449;border-radius:14px;overflow:hidden}.toolbar{padding:10px;display:flex;gap:8px;align-items:center;margin-bottom:10px}.seg button{border:1px solid #294358;background:#0b1b29;color:#91a9bc;padding:9px 13px;font-weight:900}.seg button:first-child{border-radius:8px 0 0 8px}.seg button:last-child{border-radius:0 8px 8px 0}.seg .sel{background:#1d6570;color:#fff}.toolbar label{margin-left:auto;color:#7898b0;font-size:10px}.toolbar select{background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:7px;padding:7px}
.codeScout{background:#0a1d2b;border:1px solid #287969;border-radius:14px;padding:14px;margin:0 0 10px}.codeScoutHead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.codeScoutHead b{color:#7de3cc;font-size:12px;letter-spacing:1px}.codeScoutHead small{color:#8ca9bc}.codeInputRow{display:flex;gap:8px}.codeInput{flex:1;min-width:0;background:#061522;border:1px solid #31566d;border-radius:9px;padding:14px;color:#fff;font: bold 15px Consolas,monospace;outline:none}.codeInput:focus{border-color:#2bd0b5;box-shadow:0 0 0 2px #2bd0b533}.codeHelp{font-size:10px;color:#91aabd;line-height:1.7;margin-top:8px}.codeStatus{margin-top:8px;padding:9px 11px;border-radius:8px;background:#10283b;color:#b9d2e1;font-size:11px}.codeStatus.ok{border:1px solid #2b9c82;color:#9ff1df}.codeStatus.err{border:1px solid #a34b5b;color:#ffc0ca}.codePreview{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.codeChip{padding:5px 8px;border-radius:6px;background:#173448;color:#cce3ef;font: bold 10px Consolas,monospace}.rally{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 14px;background:#092727;border:1px solid #247368;border-radius:11px;margin-bottom:10px}.live{color:#55e1c3}.rallyBtns{display:flex;gap:6px;flex-wrap:wrap}
.ph{padding:12px 15px;border-bottom:1px solid #1b3347;display:flex;justify-content:space-between;align-items:center;color:#79a2c1;font-size:10px;letter-spacing:1px}.ph b{color:#a7bfd0;letter-spacing:0}
.courtBox{padding:24px;display:flex;justify-content:center}.court{position:relative;width:min(850px,92%);height:480px;border:3px solid #cbdce8;background:#102c44;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:14px;padding:13px}.court:after{content:"";position:absolute;left:0;right:0;top:50%;border-top:3px solid #d8e5ed}.net{position:absolute;z-index:8;top:50%;left:50%;transform:translate(-50%,-50%);background:#e1e9ee;color:#081722;padding:4px 10px;border-radius:4px;font-size:9px;font-weight:900}.player{z-index:5;border:1px solid #45647d;border-radius:12px;background:#112b41;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.player:hover{background:#1a425e}.player.sel{background:#276b90;border:3px solid #fff;box-shadow:0 0 0 2px #25c9b0}.player .p{font-size:11px;color:#76dfc8;font-weight:900}.player small{color:#b8cad8;font-weight:800}.p1{grid-area:1/1}.p2{grid-area:1/2}.p3{grid-area:1/3}.p4{grid-area:2/1}.p5{grid-area:2/2}.p6{grid-area:2/3}
.skills{padding:11px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.skill{min-height:56px;border:1px solid #2b4960;border-radius:9px;background:#102437;color:#e8f1f7;font-weight:900}.skill:hover{background:#19384f}.quickResults{border-top:1px solid #1b3347;padding:10px 11px 12px;background:#071522}.quickTitle{font-size:10px;font-weight:900;color:#7edec9;letter-spacing:1px;margin-bottom:7px}.resultBtns{display:flex;flex-wrap:wrap;gap:6px}.result{border:1px solid #31516a;border-radius:8px;background:#10283b;color:#dceaf4;padding:9px 12px;font-size:10px;font-weight:900}.result.good{background:#123c35;border-color:#2bb69e;color:#9ff1df}.result.bad{background:#3b2029;border-color:#b34d61;color:#ffc0ca}.detailLink{margin-top:8px;border:0;background:transparent;color:#78a9c5;font-size:9px;font-weight:800;padding:4px}.activeSkill{outline:2px solid #2bd0b5;transform:translateY(-1px)}
.skill:first-child{border-color:#2e897a;background:#123a3a}.perfGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.tacGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px}.tacCard{background:#0b1b2a;border:1px solid #203b50;border-radius:12px;padding:14px}.tacFilters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.tacTable{overflow:auto}.tacTable .tr{min-width:760px}.tacBars{display:grid;gap:8px}.tacBar{display:grid;grid-template-columns:105px 1fr 42px;gap:8px;align-items:center;font-size:10px}.tacBar span{color:#8ba7bb}.tacBar i{height:9px;background:#172e40;border-radius:8px;display:block;overflow:hidden}.tacBar i::after{content:"";display:block;height:100%;width:var(--w);background:#28cdb0;border-radius:8px}.tacBadge{display:inline-block;padding:4px 7px;border-radius:7px;background:#10283b;border:1px solid #29485f;font-size:9px;font-weight:900}.tacGood{color:#8eead7}.tacBad{color:#ffabb7}.tacEmpty{padding:25px;text-align:center;color:#7896aa}.tacTitle{font-size:11px;color:#72d8c4;font-weight:900;letter-spacing:1px}.tacBig{font-size:25px;font-weight:900;margin-top:4px}.sequenceRow{display:grid;grid-template-columns:38px 1fr auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #183047;font-size:10px}.sequenceRow:last-child{border-bottom:0}.sequenceNo{color:#6f91a8;font-weight:900}.sequenceRow small{display:block;color:#7897ae;margin-top:3px}.sequenceResult{font-weight:900}.tacSelect{background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:7px;padding:8px}.tacKpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.tacKpi .miniStat{min-height:65px}.perfCard{background:#0b1b2a;border:1px solid #203b50;border-radius:12px;padding:14px;position:relative}.perfCard.top{border-color:#27cdb0;box-shadow:0 0 0 1px #27cdb033}.rank{position:absolute;right:12px;top:10px;font-size:10px;color:#7da0b7;font-weight:900}.perfName{font-weight:900;font-size:14px}.perfRole{font-size:9px;color:#75a0ba;margin-top:3px}.perfScore{font-size:27px;font-weight:900;margin:12px 0 8px;color:#fff}.bar{height:6px;background:#162d40;border-radius:9px;overflow:hidden;margin:5px 0 9px}.bar i{display:block;height:100%;background:#25cdb0;border-radius:9px}.miniStatGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.miniStat{background:#0d2233;border-radius:7px;padding:7px 5px;text-align:center}.miniStat small{display:block;color:#6f91a8;font-size:8px}.miniStat b{display:block;font-size:12px;margin-top:3px}.perfControls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.perfControls select{background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:7px;padding:8px}.compareGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.compareCard{background:#0b1b2a;border:1px solid #203b50;border-radius:12px;padding:14px}.compareTitle{font-size:12px;font-weight:900;margin-bottom:12px}.compareMetric{display:grid;grid-template-columns:90px 1fr 45px;gap:8px;align-items:center;margin:8px 0;font-size:10px}.compareMetric span{color:#84a2b7}.compareMetric b{text-align:right}.compareBar{height:7px;background:#172e40;border-radius:8px;overflow:hidden}.compareBar i{display:block;height:100%;background:#3b8fc2}.@media(max-width:900px){.perfGrid,.compareGrid{grid-template-columns:1fr}}.subBar{display:grid;grid-template-columns:1.35fr 120px 1fr auto auto auto;gap:8px;align-items:center;background:#091725;border:1px solid #1b3449;border-radius:14px;padding:10px;margin-bottom:10px}.subBar b{display:block;font-size:10px;color:#55d8bd}.subBar small{display:block;color:#7897ae;font-size:9px;margin-top:3px}.subBar select{background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:7px;padding:8px;min-width:0}.quick{padding:11px;display:grid;grid-template-columns:repeat(8,1fr);gap:7px}.quick button{padding:10px 5px;background:#0d2030;color:#a9c0d0;border:1px solid #29445a;border-radius:8px;font-size:10px;font-weight:900}
.dashGrid{display:grid;grid-template-columns:1.3fr 1fr;gap:10px;margin-top:10px}.setScoreList{padding:8px 12px}.setScoreRow{display:grid;grid-template-columns:55px 1fr 20px 1fr 1.5fr;gap:8px;align-items:center;padding:12px 4px;border-bottom:1px solid #172e41;font-size:11px}.setScoreRow strong{font-size:20px;text-align:center}.setScoreRow i{font-style:normal;color:#718fa5;text-align:center}.setScoreRow small{color:#79a0b8;text-align:right}.compareRow{display:flex;justify-content:space-between;padding:12px 15px;border-bottom:1px solid #172e41;font-size:11px}.compareRow span{color:#82a0b5}.compareRow b{font-size:14px}.reportLine{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #193247;font-size:11px}.reportLine b{color:#fff}.grid{display:grid;grid-template-columns:1.7fr .7fr;gap:10px;margin-top:10px}.timeline{min-height:220px}.empty{padding:30px;text-align:center;color:#7897ae;font-size:12px}.row{display:grid;grid-template-columns:34px 1fr 1fr;gap:8px;padding:9px;border-bottom:1px solid #172e41;font-size:11px}.num{width:27px;height:27px;display:grid;place-items:center;background:#153149;border-radius:7px;color:#7bd8c2;font-size:9px;font-weight:900}.row small{display:block;color:#7898ae;font-size:9px;margin-top:3px}.right{text-align:right}.stat{display:flex;justify-content:space-between;padding:10px 13px;border-bottom:1px solid #162c3e;font-size:11px}.stat span{color:#82a0b5}.stat b{color:#fff}
.overlay{position:fixed;inset:0;background:#020a12c7;backdrop-filter:blur(5px);z-index:20;display:grid;place-items:center;padding:20px}.modal{width:min(850px,96vw);max-height:92vh;overflow:auto;background:#0a1725;border:1px solid #38546b;border-radius:15px}.mh{display:flex;justify-content:space-between;padding:17px 20px;border-bottom:1px solid #1c3549}.mh h2{margin:5px 0 2px}.mh p{margin:0;color:#81a2b9;font-size:11px}.tag{font-size:9px;color:#43d4b8;letter-spacing:1px;font-weight:900}.close{border:0;background:none;color:#a5b8c8;font-size:28px}.mb{padding:17px 20px}.field{margin-bottom:17px}.ft{font-size:10px;color:#79a5c2;letter-spacing:1px;margin-bottom:7px}.choices{display:flex;flex-wrap:wrap;gap:6px}.choice{padding:9px 10px;border:1px solid #2b455b;background:#0e2030;color:#a8becd;border-radius:8px;font-size:10px;font-weight:800}.choice.on{background:#1d6b72;border-color:#37d7bd;color:#fff}.hint{padding:10px;border-radius:8px;background:#0d2432;border:1px solid #29485e;color:#8db0c4;font-size:10px}.hint.end{background:#163a30;border-color:#2c806e;color:#91ead5}.mf{display:flex;justify-content:flex-end;gap:7px;padding:12px 20px;border-top:1px solid #1c3549}
.simple{display:grid;gap:10px}.teamGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.setupGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.setupGrid label{font-size:10px;color:#7fa2ba;font-weight:900}.editInput{width:100%;margin-top:6px;background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:8px;padding:10px}.rosterEdit{display:grid;grid-template-columns:55px 1fr 75px;gap:6px;margin:7px 0}.starterGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.starterField{display:block;color:#83b4d7;font-size:11px;font-weight:900;background:#0b1d2c;border:1px solid #1f4b72;border-radius:9px;padding:9px}.starterField small{display:block;color:#91aabd;font-size:9px;margin-top:4px;min-height:12px}.emptyCourtSlot{cursor:default!important;background:#0b263b!important;border:1px dashed #6a91aa!important;box-shadow:none!important;color:#a5c0d2!important}.emptyCourtSlot:hover{transform:none!important;filter:none!important}.emptyCourtSlot strong{font-size:21px!important;color:#78a1bc}.emptyCourtSlot b{font-size:9px!important;color:#b5c9d8}.emptyCourtSlot small{background:#18364c!important;color:#8eafc5!important}.numInput{width:55px;background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:8px;padding:9px}.matchHero{display:grid;grid-template-columns:1fr 120px 1fr;gap:12px;align-items:center;margin:15px 0}.matchHero>div{padding:18px;background:#0b1c2b;border:1px solid #1b3548;border-radius:11px}.matchHero span{display:block;color:#55d8bd;font-size:9px;font-weight:900}.matchHero b{display:block;margin:7px 0}.matchHero strong{font-size:30px}.matchHero .vs{text-align:center;font-weight:900}.matchHero .vs small{display:block;color:#7897ad;margin-top:5px}.teamGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.setupGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.setupGrid label{font-size:10px;color:#7fa2ba;font-weight:900}.editInput{width:100%;margin-top:6px;background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:8px;padding:10px}.rosterEdit{display:grid;grid-template-columns:55px 1fr 75px;gap:6px;margin:7px 0}.starterGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.starterField{display:block;color:#83b4d7;font-size:11px;font-weight:900;background:#0b1d2c;border:1px solid #1f4b72;border-radius:9px;padding:9px}.starterField small{display:block;color:#91aabd;font-size:9px;margin-top:4px;min-height:12px}.emptyCourtSlot{cursor:default!important;background:#0b263b!important;border:1px dashed #6a91aa!important;box-shadow:none!important;color:#a5c0d2!important}.emptyCourtSlot:hover{transform:none!important;filter:none!important}.emptyCourtSlot strong{font-size:21px!important;color:#78a1bc}.emptyCourtSlot b{font-size:9px!important;color:#b5c9d8}.emptyCourtSlot small{background:#18364c!important;color:#8eafc5!important}.numInput{width:55px;background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:8px;padding:9px}.matchHero{display:grid;grid-template-columns:1fr 120px 1fr;gap:12px;align-items:center;margin:15px 0}.matchHero>div{padding:18px;background:#0b1c2b;border:1px solid #1b3548;border-radius:11px}.matchHero span{display:block;color:#55d8bd;font-size:9px;font-weight:900}.matchHero b{display:block;margin:7px 0}.matchHero strong{font-size:30px}.matchHero .vs{text-align:center;font-weight:900}.matchHero .vs small{display:block;color:#7897ad;margin-top:5px}.hero,.wide{padding:22px;background:#091725;border:1px solid #1b3449;border-radius:14px}.hero{display:flex;justify-content:space-between;align-items:center}.metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.metric{padding:15px;background:#0b1c2b;border:1px solid #1b3548;border-radius:11px}.metric small{color:#7897ad}.metric b{display:block;font-size:24px;margin-top:7px}
.statsTabs{display:flex;gap:22px;padding:12px 15px;background:#0b1b2a;border:1px solid #1b3449;border-radius:10px;color:#7899b0;font-size:10px}.statsTabs b{color:#55d8bd}.sectionTitle{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.sectionTitle h3{margin:0;font-size:13px}.sectionTitle small{color:#6f91aa;font-size:10px}.tableWrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:850px}th,td{text-align:center;padding:10px 8px;border-bottom:1px solid #1a3042;font-size:10px}th{color:#7295af;font-size:9px;letter-spacing:.7px}td:first-child,th:first-child{text-align:left}.positive{color:#4dd8bd}.negative{color:#ff9c9c}.analyticsGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:10px}.attackMap{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;max-width:430px;margin:auto}.zone{height:72px;border:1px solid #34546b;border-radius:8px;background:#10263a;display:flex;flex-direction:column;align-items:center;justify-content:center}.zone span{font-size:10px;color:#82a6bf}.zone b{font-size:22px;margin-top:3px}.zone.hot{background:#154c4a;border-color:#31a991}.mapLegend{display:flex;justify-content:space-between;color:#7194ad;font-size:9px;margin-top:12px}.mapLegend strong{color:#d7e8f2}.directionRows{display:grid;gap:13px;padding-top:8px}.directionRows>div{display:grid;grid-template-columns:65px 1fr 25px;gap:8px;align-items:center;font-size:10px}.directionRows span{color:#91aabd}.directionRows b{text-align:right}.bar{height:8px;border-radius:20px;background:#102536;overflow:hidden}.bar i{display:block;height:100%;background:#2ac9ad;border-radius:20px}.rotationGrid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.rotationCard{background:#0c1f2e;border:1px solid #1d3a4e;border-radius:10px;padding:11px}.rotTitle{font-size:15px;font-weight:900;color:#52d7bd;margin-bottom:8px}.rotationCard div:not(.rotTitle){display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #172e40;font-size:9px}.rotationCard span{color:#7897ad}.rotationCard b{color:#e8f2f7}.wide{padding:18px}

.statTable{width:100%;border:1px solid #1b3548;border-radius:10px;overflow-x:auto}.statTable .tr{min-width:1100px}.tr{width:100%;display:grid;grid-template-columns:2.2fr repeat(12,minmax(58px,1fr));gap:6px;align-items:center;text-align:center;padding:10px 12px;background:#0b1c2b;color:#dbe9f2;border:0;border-bottom:1px solid #173044}.tr span{text-align:left}.tr small{display:block;color:#7897ad;font-size:9px;margin-top:2px}.tr:hover{background:#16334a}.tr.th{background:#0e2434;color:#789bb4;font-size:9px;letter-spacing:.5px}.zoneMap{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:15px}.zone{height:105px;border:1px solid #31516a;border-radius:11px;background:#102b41;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.zone:hover{background:#1a4761;border-color:#35d2b9}.zone strong{font-size:18px;color:#76ddc7}.zone span{font-size:25px;font-weight:900}.zone small{font-size:8px;color:#7899b1}.directionGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.directionGrid button{padding:18px;border:1px solid #2a465c;border-radius:10px;background:#0d2030;color:#dce9f2}.directionGrid button:hover{background:#17384d}.directionGrid b,.directionGrid strong,.directionGrid small{display:block}.directionGrid strong{font-size:24px;margin:6px}.directionGrid small{font-size:9px;color:#7898ae}

.lineupPage{display:grid;gap:10px}.lineupCard{padding:15px}.lineupGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.lineupSlot{padding:12px;background:#0b1d2c;border:1px solid #1d3b50;border-radius:11px}.slotHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.slotHead b{font-size:17px;color:#5fe0c4}.slotHead span{font-size:8px;color:#6f91a9;letter-spacing:.5px}.slotPlayer{margin-top:8px;padding:9px;border-radius:8px;background:#102a3e}.slotPlayer strong{display:block;font-size:11px}.slotPlayer small{color:#77a0b9;font-size:9px}.slotPlayer em{display:block;color:#ff9ca8;font-size:9px;font-style:normal;margin-top:4px}.lineupSummary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.lineupSummary>div{padding:11px;background:#0d2232;border:1px solid #1d3b50;border-radius:9px}.lineupSummary b,.lineupSummary span{display:block}.lineupSummary b{font-size:9px;color:#63d9c0;letter-spacing:.8px}.lineupSummary span{font-size:10px;color:#a4bac9;margin-top:5px;line-height:1.6}.liberoBox{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center}.lineupCard .sectionTitle{margin:-15px -15px 14px;padding:12px 15px}
@media(max-width:1000px){.side{width:210px}.main{margin-left:210px;width:calc(100% - 210px);padding:15px}.quick{grid-template-columns:repeat(4,1fr)}.skills{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(3,1fr)}.rotationGrid{grid-template-columns:repeat(3,1fr)}.analyticsGrid{grid-template-columns:1fr}.lineupGrid{grid-template-columns:repeat(2,1fr)}.lineupSummary{grid-template-columns:1fr}}
@media(max-width:700px){.side{position:relative;width:100%;height:auto}.app{display:block}.main{margin:0;width:100%}.bottom{display:none}.score{grid-template-columns:1fr 1fr}.mid{display:none}.toolbar{flex-wrap:wrap}.toolbar label{margin-left:0}.court{width:100%;height:400px}.lineupGrid{grid-template-columns:1fr}.lineupSummary,.liberoBox,.starterGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.player strong{font-size:11px}.hero{display:block}.metrics{grid-template-columns:repeat(2,1fr)}}

/* V25 professional full-court */
.proCourt{position:relative;width:min(760px,88%);aspect-ratio:1.65/1;border:5px solid #dce8ef;border-radius:3px;background:linear-gradient(180deg,#173b57 0%,#173b57 10%,#d77b3f 10%,#d77b3f 44%,#15334b 44%,#15334b 56%,#d77b3f 56%,#d77b3f 90%,#173b57 90%,#173b57 100%);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:1fr 1fr 16px 1fr 1fr;gap:0;padding:18px 24px;box-shadow:0 16px 35px #0008,inset 0 0 0 2px #ffffff33}
.proCourt:before,.proCourt:after{content:"";position:absolute;left:0;right:0;border-top:3px solid #f4f6f7;opacity:.95}.proCourt:before{top:44%}.proCourt:after{bottom:44%}.netLine{position:absolute;left:-9px;right:-9px;top:50%;height:16px;transform:translateY(-50%);background:repeating-linear-gradient(90deg,#eaf1f4 0 3px,#6e7e89 3px 5px);border-top:2px solid #fff;border-bottom:2px solid #fff;z-index:8;display:grid;place-items:center;box-shadow:0 4px 8px #0007}.netLine span{background:#102333;color:#fff;padding:3px 9px;border-radius:5px;font-size:9px;font-weight:900;letter-spacing:1px}.courtLabel{position:absolute;z-index:3;left:50%;transform:translateX(-50%);font-weight:1000;font-size:13px;letter-spacing:.8px;color:#fff;text-shadow:0 2px 5px #000}.courtLabel small{font-size:8px;opacity:.8;margin-left:6px}.awayLabel{top:3px}.homeLabel{bottom:3px}.courtPlayer{position:relative;z-index:6;justify-self:center;align-self:center;width:min(112px,92%);min-height:82px;border:2px solid #dbe9f2;border-radius:12px;background:#a92731;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;box-shadow:0 6px 13px #0007;transition:.12s}.courtPlayer.home{background:#0869bd}.courtPlayer:hover{transform:translateY(-2px) scale(1.03);filter:brightness(1.1)}.courtPlayer.selected{outline:3px solid #57e0c4;box-shadow:0 0 0 4px #0b1b29,0 0 20px #39d7bcaa}.serverBadge{position:absolute;top:5px;right:6px;background:#f3b33f;color:#211500;border:1px solid #ffe08a;border-radius:5px;padding:2px 4px;font-size:6px;font-weight:1000;letter-spacing:.5px}.courtPlayer strong{font-size:23px}.courtPlayer b{font-size:10px;margin-top:2px;max-width:95%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.courtPlayer small{font-size:9px;background:#081b2b;color:#fff;border-radius:5px;padding:3px 7px;margin-top:5px;font-weight:900}.courtPos{position:absolute;top:5px;left:7px;font-size:8px;color:#cce6f3;font-weight:900}.a5{grid-column:1;grid-row:1}.a6{grid-column:2;grid-row:1}.a1{grid-column:3;grid-row:1}.a4{grid-column:1;grid-row:2}.a3{grid-column:2;grid-row:2}.a2{grid-column:3;grid-row:2}.h4{grid-column:1;grid-row:4}.h3{grid-column:2;grid-row:4}.h2{grid-column:3;grid-row:4}.h5{grid-column:1;grid-row:5}.h6{grid-column:2;grid-row:5}.h1{grid-column:3;grid-row:5}
@media(max-width:700px){.proCourt{width:100%;padding:12px 8px;aspect-ratio:1.2/1}.courtPlayer{min-height:65px;width:92px}.courtPlayer strong{font-size:18px}.courtPlayer b{font-size:8px}.courtPlayer small{font-size:7px}.courtLabel{font-size:9px}}

.analyticsToolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.filterPill{border:1px solid #29465d;background:#0d2030;color:#9db5c6;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800}.filterPill.on{background:#1d6570;color:#fff;border-color:#35d2b9}.clickRow{cursor:pointer}.detailGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.detailCard{padding:12px;background:#0c1f2e;border:1px solid #1d3a4e;border-radius:10px}.detailCard small{display:block;color:#7897ad;font-size:9px}.detailCard b{display:block;font-size:20px;margin-top:5px}.selectedBanner{padding:10px 12px;background:#12352f;border:1px solid #2c806e;border-radius:9px;color:#9be7d6;font-size:10px;margin-bottom:10px}.miniActions{display:flex;gap:6px;flex-wrap:wrap}.miniActions button{padding:7px 9px;border:1px solid #29465d;background:#0d2030;color:#b9cbd7;border-radius:7px;font-size:9px;font-weight:800}.reportBox{display:grid;grid-template-columns:1fr 1fr;gap:10px}.reportCard{padding:16px;background:#0b1c2b;border:1px solid #1b3548;border-radius:11px}.reportCard h3{margin-top:0}.reportCard p{color:#8aa7ba;font-size:11px;line-height:1.6}.exportBtn{margin-left:auto}.

/* ===== V25 COLOR UI — professional volleyball scouting theme ===== */
:root{--navy:#06152b;--navy2:#0a2340;--blue:#0b78f2;--blue2:#18a0ff;--cyan:#22d7e8;--red:#e72f52;--pink:#ff3f70;--card:#0a1d35;--card2:#0e2947;--line:#23496c;--text:#eef7ff;--muted:#91abc5}
body{background:radial-gradient(circle at 72% -10%,#123d72 0,#071a31 32%,#040d1a 78%);color:var(--text)}
.app{background:linear-gradient(135deg,#061327 0%,#071c36 50%,#061326 100%)}
.side{background:linear-gradient(180deg,#061a34 0%,#051326 100%);border-right:1px solid #1d4770;box-shadow:10px 0 35px #00101f88}
.brand{padding-bottom:22px}.logo{background:linear-gradient(135deg,#12c9ff,#2265ff);color:white;box-shadow:0 8px 24px #0878ff55;border:1px solid #5ddcff}.brand b{color:#f4f9ff;font-size:15px}.brand small{color:#6ea8d7}
.nav{color:#9bb8d4}.nav:hover{background:#0d2a49;color:#fff;border-color:#1c5785}.nav.active{background:linear-gradient(90deg,#0878ef,#095fcf);border-color:#2899ff;color:#fff;box-shadow:0 7px 22px #006fff44,inset 3px 0 #7cecff}
.bottom{color:#70a0c7}
.main{padding:18px 22px 42px}.head h1{color:#fff}.ey{color:#5bbcff}
.btn{background:#0b2745;border-color:#24547d;color:#e7f5ff;box-shadow:0 2px 8px #00101f55}.btn:hover{background:#123b62;border-color:#3b82b8}.primary{background:linear-gradient(135deg,#087cf4,#13b4ff);border-color:#42baff;color:#fff;box-shadow:0 6px 18px #0084ff55}.danger{background:linear-gradient(135deg,#7e1f36,#bb2848);border-color:#f05270;color:#fff}
.score{background:linear-gradient(90deg,#08295a 0%,#0a1d35 45%,#1d0e29 100%);border:1px solid #265b90;box-shadow:0 8px 28px #00122577}.tm span{color:#58c8ff}.tm.aw span{color:#ff7995}.tm strong{color:#fff}.mid{color:#91b3d1}.mid b{color:#fff}
.toolbar,.panel{background:linear-gradient(145deg,#0a2039,#08182b);border-color:#1e466b;box-shadow:0 7px 22px #00101f66}.toolbar{background:#0b223c}.seg button{background:#0b2847;border-color:#24527a;color:#9fb9d1}.seg .sel{background:linear-gradient(135deg,#087cf2,#0b5fd1);border-color:#40b5ff;color:#fff;box-shadow:0 4px 14px #0078ff44}.toolbar select,.subBar select,.editInput,.numInput{background:#081e36;border-color:#28577f;color:#fff}
.rally{background:linear-gradient(90deg,#082f36,#0a263d);border-color:#218e93;box-shadow:0 6px 18px #00a6a633}.live{color:#4ee7cf}.muted{color:#82a4bd;font-size:10px}
.ph{border-bottom-color:#1a4267;color:#76b5e5}.ph b{color:#d9ebfb}
.courtBox{padding:18px}.proCourt{background:linear-gradient(180deg,#0c7291 0%,#0b6682 7%,#c96b35 7%,#df8447 45%,#12476a 45%,#12476a 55%,#df8447 55%,#c96b35 93%,#0b6682 93%,#0c7291 100%);border-color:#edf8ff;box-shadow:0 18px 40px #00142699,0 0 0 1px #5dcfff55,inset 0 0 45px #ffffff12}
.proCourt:before,.proCourt:after{border-top-color:#fff}.netLine{background:repeating-linear-gradient(90deg,#f6fbff 0 3px,#8796a3 3px 5px);box-shadow:0 5px 13px #00101f99}.netLine span{background:#061a2d;color:#fff;border:1px solid #8ccff1}.courtLabel{color:#fff;text-shadow:0 2px 5px #00101f}.awayLabel{background:linear-gradient(90deg,#a51f43,#dc3155);padding:5px 28px;border-radius:8px;border:1px solid #ff7590;top:5px}.homeLabel{background:linear-gradient(90deg,#075bb9,#0785ef);padding:5px 28px;border-radius:8px;border:1px solid #52b8ff;bottom:5px}
.courtPlayer{background:linear-gradient(145deg,#b92843,#8f1831);border-color:#ffd9df;box-shadow:0 7px 16px #00101fbb}.courtPlayer.home{background:linear-gradient(145deg,#087fe8,#064eaa);border-color:#ccecff}.courtPlayer.selected{outline-color:#5df0d5;box-shadow:0 0 0 4px #071b30,0 0 24px #2de4c3cc}.courtPlayer small{background:#061a2c;color:#fff;border:1px solid #315b7e}.courtPlayer:hover{filter:brightness(1.15)}
.actionPicker{background:#071a2f;border-color:#2b5d86}.skills{background:#071a2f}.skill{background:#102b49;border-color:#2b5d86;color:#fff;box-shadow:0 4px 10px #00101f44}.skill:nth-child(1){background:linear-gradient(145deg,#087f72,#07554e);border-color:#35d7c4}.skill:nth-child(2){background:linear-gradient(145deg,#a45a18,#71390f);border-color:#f2a94c}.skill:nth-child(3){background:linear-gradient(145deg,#0878c9,#07558f);border-color:#42baff}.skill:nth-child(4){background:linear-gradient(145deg,#a91e45,#71142e);border-color:#ff688b}.skill:nth-child(5){background:linear-gradient(145deg,#7242c5,#4b2788);border-color:#b68cff}.skill:nth-child(6){background:linear-gradient(145deg,#d76a19,#8d3e0e);border-color:#ffb15a}.skill:nth-child(7){background:linear-gradient(145deg,#b11e45,#76132f);border-color:#ff6689}.skill:nth-child(8){background:linear-gradient(145deg,#078f9a,#075e70);border-color:#45e0e8}.skill:nth-child(9){background:linear-gradient(145deg,#9a7810,#68500a);border-color:#e9ca54}.skill:nth-child(10){background:linear-gradient(145deg,#008fa8,#076074);border-color:#4de5ef}.skill:nth-child(11){background:linear-gradient(145deg,#3156bb,#233b83);border-color:#79a0ff}.skill:nth-child(12){background:linear-gradient(145deg,#5d4ab5,#3b2d7b);border-color:#9d8aff}.skill:hover{transform:translateY(-1px);filter:brightness(1.15)}
.subBar{background:linear-gradient(90deg,#091d33,#0b2845);border-color:#1f4b72}.subBar b{color:#4ee5cc}.subBar small{color:#8aaaca}.quick button{background:#0c2946;border-color:#2b5a82;color:#d8ebfa}.quick button:hover{background:#12436e;border-color:#42a7e9}
.row{border-bottom-color:#173a5d}.num{background:linear-gradient(135deg,#0c4b77,#0b2e4f);color:#65e4cf}.row small{color:#82a4c0}.stat{border-bottom-color:#173754}.stat span{color:#8db0cb}.stat b{color:#fff}
.overlay{background:#020b18dd}.modal{background:linear-gradient(145deg,#0b223d,#071629);border-color:#2d5f88;box-shadow:0 20px 70px #000b}.mh{border-bottom-color:#1c466c}.mh p{color:#89abc8}.tag{color:#49e5cb}.choice{background:#0c2946;border-color:#2a587e;color:#b7cee1}.choice.on{background:linear-gradient(135deg,#087cba,#0a5c93);border-color:#4ad9e4;color:#fff;box-shadow:0 4px 12px #00a9c633}.hint{background:#0b2940;border-color:#286086;color:#a6c5dc}.hint.end{background:#0c3b32;border-color:#2a9c84;color:#a0f1dc}
.simple .panel,.hero,.wide,.matchHero>div,.metric,.reportCard,.detailCard,.lineupSlot,.lineupSummary>div{background:linear-gradient(145deg,#0b2340,#08182c);border-color:#1f4b72;box-shadow:0 6px 18px #00101f55}.setupGrid label{color:#82b4d8}.matchHero span,.lineupSummary b{color:#51dfc5}.statsTabs{background:#0b223b;border-color:#204a70}.statsTabs b{color:#51dfc5}.positive{color:#4de3c4}.negative{color:#ff8199}.zone{background:linear-gradient(145deg,#123655,#0b253e);border-color:#2b5b82}.zone.hot{background:linear-gradient(145deg,#116c67,#0b4645);border-color:#39d6bf}.zone:hover{background:#155074;border-color:#49d8bd}.directionGrid button{background:#0d2946;border-color:#2b5b83;color:#e2f0fa}.directionGrid button:hover{background:#15456e}.bar{background:#0b2943}.bar i{background:linear-gradient(90deg,#11aef5,#28d6bd)}.rotationCard{background:#0b2440;border-color:#225075}.rotTitle{color:#4edec4}.tr{background:#0b2440;border-bottom-color:#173e61}.tr.th{background:#0e2d4c;color:#8fb1ca}.tr:hover{background:#123d61}.selectedBanner{background:linear-gradient(90deg,#0e3e37,#0c2c31);border-color:#2c927f;color:#9cebdc}.filterPill{background:#0b2946;border-color:#2b5a80;color:#a9c1d4}.filterPill.on{background:#0876c9;border-color:#45b8ff;color:#fff}.lineupCard .sectionTitle{background:#0c2a48;border-bottom:1px solid #245579}.slotPlayer{background:#102e4c}.liberoBox{background:transparent}.exportBtn{color:#fff}
@media(max-width:1000px){.side{box-shadow:none}.main{padding:15px}.proCourt{width:min(700px,94%);aspect-ratio:1.65/1}}


/* ===== V44 OFFICIAL VOLLEYBALL COURT / ROTATION UI ===== */
.courtPanel{display:grid;grid-template-columns:minmax(0,1fr) 220px;align-items:start}
.courtPanel>.ph{grid-column:1/-1}
.courtPanel>.courtBox{grid-column:1;grid-row:2;padding:10px 8px}
.courtPanel>.actionPicker{grid-column:2;grid-row:2;align-self:start;margin:10px 10px 10px 0!important}
.courtPanel>.rotationGuide{grid-column:1/-1;grid-row:3}
/* Home: P4 P3 P2 at the net, P5 P6 P1 behind the attack line. */
.h4{grid-column:1;grid-row:4}.h3{grid-column:2;grid-row:4}.h2{grid-column:3;grid-row:4}
.h5{grid-column:1;grid-row:5}.h6{grid-column:2;grid-row:5}.h1{grid-column:3;grid-row:5}
/* Away faces the opposite direction: visually mirror the same P4/P3/P2 and P5/P6/P1 arrangement. */
.a2{grid-column:1;grid-row:4}.a3{grid-column:2;grid-row:4}.a4{grid-column:3;grid-row:4}
.a1{grid-column:1;grid-row:1}.a6{grid-column:2;grid-row:1}.a5{grid-column:3;grid-row:1}
.rotationArrow{position:absolute;z-index:4;color:#fff;background:#062039cc;border:1px solid #67d7ff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font-size:13px;font-weight:1000;box-shadow:0 2px 7px #00101f99;pointer-events:none}
.arrow-p1-p6{right:28%;bottom:18%}.arrow-p6-p5{left:24%;bottom:18%}.arrow-p5-p4{left:24%;top:25%}.arrow-p4-p3{left:48%;top:25%}.arrow-p3-p2{right:24%;top:25%}.arrow-p2-p1{right:24%;bottom:18%}
.rotationGuide{margin:0 10px 10px;padding:8px 10px;background:#071b2f;border:1px solid #24577e;border-radius:9px;display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap}
.rgTitle{width:100%;text-align:center;font-size:8px;color:#6fe4cf;font-weight:1000;letter-spacing:1px;margin-bottom:3px}.rgNode{padding:4px 7px;border-radius:6px;background:#0d2946;border:1px solid #2b5b83;color:#dcefff;font-size:9px;font-weight:1000}.rgNode.server{background:#7a5b12;border-color:#f3c84f;color:#fff4bd}.rgArrow{color:#55e6d0;font-weight:1000}
@media(max-width:1050px){.courtPanel{grid-template-columns:1fr}.courtPanel>.courtBox,.courtPanel>.actionPicker,.courtPanel>.rotationGuide{grid-column:1}.courtPanel>.actionPicker{grid-row:3;margin:0 8px 8px!important}.courtPanel>.rotationGuide{grid-row:4}}

/* ===== V28 COMPACT MINIMAL LIVE SCOUTING UI ===== */
body{font-family:Inter,Arial,sans-serif}
.app{min-height:100vh;background:linear-gradient(135deg,#061427 0%,#071b31 55%,#061327 100%)}
.side{width:205px;padding:14px 10px;background:linear-gradient(180deg,#061a32,#051326);}
.brand{gap:8px;padding:3px 7px 16px}.logo{width:38px;height:38px;border-radius:11px;font-size:20px}.brand b{font-size:13px}.brand small{font-size:8px;letter-spacing:1.5px}
.nav{padding:9px 10px;margin:2px 0;border-radius:8px;font-size:11px}.bottom{left:16px;bottom:12px;font-size:9px}
.main{margin-left:205px;width:calc(100% - 205px);padding:12px 15px 28px}.head{margin-bottom:8px}.head h1{font-size:18px;margin:2px 0}.ey{font-size:8px;letter-spacing:1.2px}.actions{gap:5px}.btn{padding:7px 9px;border-radius:7px;font-size:10px}
.score{grid-template-columns:1fr 110px 1fr;gap:8px;border-radius:10px;padding:8px 12px;margin-bottom:7px}.tm{gap:7px}.tm span{font-size:8px}.tm b{font-size:11px}.tm strong{font-size:23px}.mid{font-size:8px}.mid b{font-size:11px;margin-bottom:2px}
.toolbar{padding:7px;gap:6px;margin-bottom:7px;border-radius:9px}.seg button{padding:7px 9px;font-size:9px}.toolbar label{font-size:8px}.toolbar select{padding:6px;font-size:9px}
.subBar{grid-template-columns:1.25fr 100px 1fr auto auto auto;gap:5px;padding:7px;border-radius:9px;margin-bottom:7px}.subBar b{font-size:8px}.subBar small{font-size:7px}.subBar select{padding:6px;font-size:8px}.subBar .btn{padding:6px 7px;font-size:8px}
.rally{padding:7px 9px;border-radius:8px;margin-bottom:7px}.rallyBtns{gap:4px}.rallyBtns .btn{padding:6px 7px;font-size:8px}
.panel{border-radius:10px}.ph{padding:8px 10px;font-size:8px}.ph b{font-size:8px}
/* compact court + action panel side-by-side */
.courtPanel{display:grid;grid-template-columns:minmax(0,1fr) 235px;align-items:start}.courtPanel>.ph{grid-column:1/-1}.courtPanel>.courtBox{grid-column:1;padding:12px 8px}.courtPanel>.actionPicker{grid-column:2;align-self:start;margin:10px 10px 10px 0!important}
.proCourt{width:min(620px,100%);aspect-ratio:2/1;border-width:3px;padding:10px 16px;box-shadow:0 10px 24px #00142699,0 0 0 1px #5dcfff44,inset 0 0 30px #ffffff0d}
.courtLabel{font-size:10px}.courtLabel small{font-size:7px}.awayLabel,.homeLabel{padding:3px 16px;border-radius:6px}.awayLabel{top:4px}.homeLabel{bottom:4px}
.netLine{height:11px;left:-6px;right:-6px}.netLine span{padding:2px 6px;font-size:7px}
.courtPlayer{width:min(78px,90%);min-height:58px;border-radius:8px;box-shadow:0 4px 9px #00101f99}.courtPlayer strong{font-size:17px}.courtPlayer b{font-size:8px}.courtPlayer small{font-size:7px;padding:2px 5px;margin-top:3px}.courtPos{font-size:7px;top:3px;left:5px}
.actionPicker{border-radius:8px}.actionPicker .ph{padding:8px 9px}.actionPicker .skills{padding:8px;grid-template-columns:repeat(3,1fr);gap:5px}.actionPicker .skill{min-height:43px;border-radius:7px;font-size:8px;padding:4px;box-shadow:0 2px 6px #00101f44}
.quick{padding:8px;gap:5px}.quick button{padding:7px 4px;font-size:8px;border-radius:6px}
.grid{grid-template-columns:1.55fr .65fr;gap:7px;margin-top:7px}.timeline{min-height:150px}.row{grid-template-columns:27px 1fr 1fr;gap:6px;padding:7px;font-size:9px}.num{width:23px;height:23px;font-size:8px}.row small{font-size:7px}.stat{padding:7px 9px;font-size:9px}
.overlay{padding:12px}.modal{border-radius:11px}.mh{padding:12px 14px}.mh h2{font-size:17px}.mh p{font-size:9px}.mb{padding:12px 14px}.field{margin-bottom:11px}.ft{font-size:8px;margin-bottom:5px}.choice{padding:7px 8px;font-size:8px}.mf{padding:9px 14px}
.simple .panel,.hero,.wide,.matchHero>div,.metric,.reportCard,.detailCard,.lineupSlot,.lineupSummary>div{border-radius:9px}

.rotationCenter{display:grid;gap:12px}.rotationHero{background:linear-gradient(135deg,#0b2032,#0b2830);border:1px solid #24566a;border-radius:14px;padding:16px;display:flex;justify-content:space-between;gap:12px;align-items:center}.rotationHero h3{margin:0 0 5px;font-size:15px}.rotationHero p{margin:0;color:#7899ae;font-size:10px}.rotationKpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;min-width:430px}.miniStat{background:#0a1725;border:1px solid #1e3b50;border-radius:10px;padding:10px}.miniStat small{display:block;color:#7193aa;font-size:8px}.miniStat b{display:block;font-size:18px;margin-top:3px}.rotationGridPro{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.rotationProCard{background:#0b1b2a;border:1px solid #203b50;border-radius:12px;padding:13px;cursor:pointer;transition:.15s}.rotationProCard:hover{transform:translateY(-1px);border-color:#3b6c82}.rotationProCard.on{border-color:#35d2b9;box-shadow:0 0 0 1px #35d2b933}.rotHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.rotHead strong{font-size:18px}.rotHead span{font-size:9px;color:#80a4ba}.rotMetric{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;margin:7px 0;font-size:9px}.rotMetric span{color:#7897ac}.rotMetric b{font-size:10px}.rotBar{height:5px;background:#142c3e;border-radius:9px;overflow:hidden;grid-column:1/-1}.rotBar i{display:block;height:100%;background:#28cdb0;border-radius:9px}.rotBar.bad i{background:#e25b72}.rotBadge{display:inline-block;padding:3px 6px;border-radius:6px;background:#102c3d;border:1px solid #2a4c62;color:#8fe5d5;font-size:8px;font-weight:900}.rotationTable{overflow:auto}.rotationTable .rtr{display:grid;grid-template-columns:70px repeat(6,minmax(72px,1fr));min-width:520px;border-bottom:1px solid #183047}.rotationTable .rtr>div{padding:9px 7px;font-size:9px}.rotationTable .rtr.head{background:#0e2233;color:#80a1b6;font-weight:900}.rotationTable .rtr:not(.head)>div:not(:first-child){text-align:center}.rotationInsight{display:grid;grid-template-columns:1fr 1fr;gap:10px}.insight{background:#0b1b2a;border:1px solid #203b50;border-radius:12px;padding:13px}.insight h4{margin:0 0 8px;font-size:10px;color:#7bdac6;letter-spacing:1px}.insight p{margin:0;color:#b9cbd7;font-size:10px;line-height:1.6}.emptyState{padding:26px;text-align:center;color:#7896aa;font-size:10px}
.replayGrid{display:grid;grid-template-columns:1.05fr .95fr;gap:10px}.replayList{display:grid;gap:7px;max-height:620px;overflow:auto;padding:10px}.replayItem{width:100%;text-align:left;background:#0b2440;border:1px solid #225075;color:#e8f2f7;border-radius:10px;padding:10px;display:grid;grid-template-columns:42px 1fr auto;gap:8px;align-items:center}.replayItem:hover{background:#123d61;border-color:#3b7da5}.replayItem.sel{border-color:#35d2b9;box-shadow:0 0 0 1px #35d2b933;background:#103b4a}.replayNum{font-weight:900;color:#55dfc5}.replayMain b{font-size:10px}.replayMain small{display:block;color:#7897ad;font-size:9px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.replayScore{font-size:13px;font-weight:900}.replayDetail{padding:14px}.replayHero{display:flex;justify-content:space-between;gap:10px;align-items:center;background:linear-gradient(135deg,#0b2032,#0b2830);border:1px solid #24566a;border-radius:12px;padding:13px;margin-bottom:10px}.replayHero h3{margin:0;font-size:15px}.replayHero p{margin:4px 0 0;color:#7899ae;font-size:9px}.replaySequence{display:grid;gap:6px}.replayAction{display:grid;grid-template-columns:30px 1fr auto;gap:8px;align-items:center;padding:9px;background:#0b1b2a;border:1px solid #203b50;border-radius:9px}.replayActionNo{font-weight:900;color:#58d9c1}.replayAction b{font-size:10px}.replayAction small{display:block;color:#7897ad;font-size:9px;margin-top:2px}.replayTag{font-size:8px;font-weight:900;padding:4px 6px;border-radius:6px;background:#102c3d;border:1px solid #2a4c62;color:#9cebdc}.replayWin{margin-top:10px;padding:11px;border-radius:9px;background:#12352f;border:1px solid #2c927f;color:#a0eedf;font-size:10px}.replayEmpty{padding:35px;text-align:center;color:#7896aa;font-size:10px}.replayFilters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.replayFilters select{background:#0d2030;color:#fff;border:1px solid #29465d;border-radius:7px;padding:7px;font-size:9px}.replayKpi{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}.replayKpi .miniStat{min-height:55px}.replayKpi button{text-align:left;color:#fff}.replayProgress{height:7px;background:#102536;border-radius:9px;overflow:hidden;margin:9px 0}.replayProgress i{display:block;height:100%;background:linear-gradient(90deg,#11aef5,#28d6bd);border-radius:9px}@media(max-width:900px){.replayGrid{grid-template-columns:1fr}.replayKpi{grid-template-columns:repeat(2,1fr)}}

@media(max-width:1050px){.rotationHero{display:grid}.rotationKpi{min-width:0;width:100%}.rotationGridPro{grid-template-columns:repeat(2,1fr)}.rotationInsight{grid-template-columns:1fr}}
@media(max-width:1050px){.side{width:185px}.main{margin-left:185px;width:calc(100% - 185px)}.courtPanel{grid-template-columns:1fr}.courtPanel>.courtBox,.courtPanel>.actionPicker{grid-column:1}.courtPanel>.actionPicker{margin:0 8px 8px!important}.subBar{grid-template-columns:1fr 1fr 1fr}.subBar>div:first-child{grid-column:1/-1}}
@media(max-width:760px){.rotationKpi{grid-template-columns:repeat(2,1fr)}.rotationGridPro{grid-template-columns:1fr}.rotationHero h3{font-size:13px}.rotationHero p{font-size:9px}}
@media(max-width:760px){.side{position:static;width:100%;height:auto}.app{display:block}.main{margin-left:0;width:100%;padding:10px}.nav{display:inline-block;width:auto;margin:2px}.bottom{display:none}.score{grid-template-columns:1fr 75px 1fr}.tm b{font-size:9px}.tm strong{font-size:19px}.toolbar{flex-wrap:wrap}.toolbar label{margin-left:0}.grid{grid-template-columns:1fr}.proCourt{width:100%;aspect-ratio:1.65/1}.courtPlayer{width:68px;min-height:52px}}

/* ===== V35.1 PORTRAIT REAL-VOLLEY COURT + HIGH-CONTRAST UI ===== */
:root{color-scheme:dark}
body{background:#061427;color:#eaf7ff}
body,button,input,select,textarea{font-family:Inter,Arial,sans-serif}
button,select,input{color:#eaf7ff}
.btn,.nav,.seg button,.quick button,.skill,.result,.choice,.directionGrid button,.filterPill,.tacSelect,.perfControls select,.toolbar select,.subBar select{color:#eaf7ff}
.nav{color:#b8d7eb}.nav.active{color:#ffffff}
.ph,.toolbar label,.muted,.ey,.row small,.stat span,.tacBar span,.tacEmpty,.perfRole,.rank,.mid,.mid b{color:#b8d7eb}
.head h1,.tm strong,.tm b,.courtPlayer strong,.courtPlayer b,.score,.simple,.panel,.wide,.hero,.metric,.reportCard,.detailCard,.lineupSlot,.lineupSummary>div{color:#f4fbff}
.simple label,.setupGrid label,.field .ft{color:#bfe0f2}


.liberoCourtLayout{display:grid;grid-template-columns:62px minmax(0,1fr);grid-template-rows:1fr 1fr;gap:3px;align-items:stretch;width:100%;max-width:780px;margin:0 auto}.liberoCourtLayout>.proCourt{grid-column:2;grid-row:1/3}.awayLiberoRail{grid-column:1;grid-row:1}.homeLiberoRail{grid-column:1;grid-row:2}
.liberoRail{display:flex;flex-direction:column;justify-content:space-around;gap:5px;min-width:0}
.liberoCourtSlot{width:100%;min-height:54px;border:2px solid #e8f8ff;border-radius:9px;background:linear-gradient(145deg,#a92731,#8d1733);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:3px 2px;box-shadow:0 4px 8px #0007;cursor:pointer}
.homeLiberoSlot{background:linear-gradient(145deg,#087fe8,#0753aa);border-color:#d6f2ff}
.liberoCourtSlot.hasLibero{outline:1px solid #79e8ff}.liberoCourtSlot.liberoReturning{border-style:dashed;filter:saturate(.85)}
.liberoCourtSlot span{font-size:7px;font-weight:900;letter-spacing:.4px}
.liberoCourtSlot strong{font-size:15px;line-height:1}
.liberoCourtSlot b{font-size:7px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.liberoCourtSlot small{font-size:6px;font-weight:900;background:#062039;border:1px solid #5d9cc4;border-radius:4px;padding:2px}
@media(max-width:760px){.liberoCourtLayout{grid-template-columns:44px minmax(0,1fr);gap:2px}.liberoCourtSlot{min-height:48px;padding:3px 1px}.liberoCourtSlot strong{font-size:14px}.liberoCourtSlot b{font-size:6px}.liberoCourtSlot span,.liberoCourtSlot small{font-size:5px}.proCourt{width:100%;min-width:0}}

/* True volleyball court: 18m long x 9m wide, portrait orientation. */
.proCourt{
  width:min(320px,100%);
  aspect-ratio:10/16;
  height:auto;
  padding:16px 12px;
  border:4px solid #f4fbff;
  border-radius:3px;
  background:linear-gradient(180deg,
    #0b6f8b 0%,#0b6f8b 6%,
    #d98545 6%,#e49a5a 47%,
    #123f60 47%,#123f60 53%,
    #e49a5a 53%,#d98545 94%,
    #0b6f8b 94%,#0b6f8b 100%);
  grid-template-columns:repeat(3,minmax(0,1fr));
  grid-template-rows:1fr 1fr 18px 1fr 1fr;
  column-gap:0;
  row-gap:0;
  box-shadow:0 16px 36px #0009,0 0 0 2px #4dc9f055,inset 0 0 30px #ffffff10;
}
.proCourt:before{top:47%;border-top:3px solid #ffffff}
.proCourt:after{bottom:47%;border-top:3px solid #ffffff}
.netLine{top:50%;height:16px;left:-8px;right:-8px}
.netLine span{font-size:8px;padding:3px 8px;color:#ffffff;background:#08233a;border-color:#8edcff}
.courtLabel{font-size:9px;color:#ffffff;text-shadow:0 2px 5px #00101f;z-index:9}
.courtLabel small{font-size:6px;color:#d9f4ff}
.awayLabel{top:4px;padding:3px 10px;background:linear-gradient(90deg,#b51e46,#e0345c);border:1px solid #ff8aa4}
.homeLabel{bottom:4px;padding:3px 10px;background:linear-gradient(90deg,#075fc0,#0a91f0);border:1px solid #68c7ff}
.courtPlayer{width:min(66px,90%);min-height:50px;border:2px solid #e8f8ff;border-radius:9px;color:#ffffff}
.courtPlayer.home{background:linear-gradient(145deg,#087fe8,#0753aa);border-color:#d6f2ff}
.courtPlayer:not(.home){background:linear-gradient(145deg,#c52b4b,#8d1733);border-color:#ffe0e7}
.courtPlayer strong{font-size:15px;color:#ffffff}
.courtPlayer b{font-size:7px;color:#ffffff}
.courtPlayer small{font-size:7px;color:#ffffff;background:#062039;border-color:#5d9cc4}
.courtPos{font-size:7px;color:#e5f7ff}
.courtPlayer.selected{outline:3px solid #54efd3;box-shadow:0 0 0 4px #061a2d,0 0 24px #35e5c8cc}

/* Keep every interactive control visibly interactive and readable on dark surfaces. */
button:hover,.nav:hover,.seg button:hover,.quick button:hover,.skill:hover,.result:hover,.choice:hover,.filterPill:hover{filter:brightness(1.15)}
button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #55e7ff;outline-offset:2px}
.btn,.skill,.result,.choice,.quick button,.seg button,.filterPill{font-weight:900}

@media(max-width:1050px){
  .courtPanel{grid-template-columns:1fr}
  .courtPanel>.courtBox{display:flex;justify-content:center}
  .proCourt{width:min(410px,100%);aspect-ratio:9/18}
}
@media(max-width:760px){
  .proCourt{width:min(270px,88vw);aspect-ratio:10/16;padding:14px 8px}
  .courtPlayer{width:64px;min-height:48px}
  .courtPlayer strong{font-size:14px}
  .courtPlayer b{font-size:7px}
  .courtLabel{font-size:9px}
}
.advancedGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.zoneMatrix{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.zoneCell{min-height:58px;border:1px solid #29465d;border-radius:8px;background:#0d2030;color:#dceaf4;display:grid;place-items:center;cursor:pointer}.zoneCell strong{font-size:13px}.zoneCell span{font-size:16px;font-weight:900;color:#55d8bd}.zoneCell small{font-size:8px;color:#8daabd}.zoneCell.active{border-color:#2dcdb2;background:#10383b;box-shadow:inset 0 0 0 1px #2dcdb233}.insightGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.insightGrid>div{background:#0d2233;border:1px solid #1f3c51;border-radius:9px;padding:10px}.insightGrid b{display:block;color:#7395ab;font-size:8px}.insightGrid strong{display:block;margin-top:5px;font-size:13px;color:#fff}@media(max-width:900px){.advancedGrid{grid-template-columns:1fr}.insightGrid{grid-template-columns:repeat(2,1fr)}}




/* V45 FINAL ROTATION GEOMETRY
   HOME viewer layout:
   front: P4 P3 P2
   back : P5 P6 P1
   AWAY is mirrored because that team faces the opposite direction.
*/
.rotationArrow,.rotationGuide{display:none!important}
.proCourt{
  width:min(360px,100%);
  aspect-ratio:10/16;
  padding:16px 12px;
  grid-template-columns:repeat(3,minmax(0,1fr));
  grid-template-rows:1fr 1fr 18px 1fr 1fr;
  gap:0;
}
.awayLabel{top:4px}
.homeLabel{bottom:4px}
.a1{grid-column:1;grid-row:1}
.a6{grid-column:2;grid-row:1}
.a5{grid-column:3;grid-row:1}
.a2{grid-column:1;grid-row:2}
.a3{grid-column:2;grid-row:2}
.a4{grid-column:3;grid-row:2}
.h4{grid-column:1;grid-row:4}
.h3{grid-column:2;grid-row:4}
.h2{grid-column:3;grid-row:4}
.h5{grid-column:1;grid-row:5}
.h6{grid-column:2;grid-row:5}
.h1{grid-column:3;grid-row:5}
.courtPlayer{width:min(70px,90%);min-height:52px}
.serverBadge{display:block}
.courtPanel{display:grid;grid-template-columns:minmax(0,1fr) 235px;align-items:start}
.courtPanel>.ph{grid-column:1/-1}
.courtPanel>.courtBox{grid-column:1;padding:12px 8px}
.courtPanel>.actionPicker{grid-column:2;grid-row:2;align-self:start;margin:10px 10px 10px 0!important}
@media(max-width:1050px){
  .courtPanel{grid-template-columns:1fr}
  .courtPanel>.courtBox,.courtPanel>.actionPicker{grid-column:1}
  .courtPanel>.actionPicker{grid-row:auto;margin:0 8px 8px!important}
  .proCourt{width:min(320px,100%);aspect-ratio:10/16}
}
@media(max-width:760px){
  .proCourt{width:min(290px,88vw);aspect-ratio:10/16;padding:14px 8px}
  .courtPlayer{width:62px;min-height:48px}
}

/* V46: authoritative rotation layout, away mirrored across the net */
.proCourt{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:1fr 1fr 18px 1fr 1fr}
.a1{grid-column:1;grid-row:1}
.a6{grid-column:2;grid-row:1}
.a5{grid-column:3;grid-row:1}
.a2{grid-column:1;grid-row:2}
.a3{grid-column:2;grid-row:2}
.a4{grid-column:3;grid-row:2}
.h4{grid-column:1;grid-row:4}
.h3{grid-column:2;grid-row:4}
.h2{grid-column:3;grid-row:4}
.h5{grid-column:1;grid-row:5}
.h6{grid-column:2;grid-row:5}
.h1{grid-column:3;grid-row:5}
`;

function App(){
 useEffect(()=>{document.title="AVS | Alvis Volleyball Scouting";},[]);
 const [page,setPage]=useState("Live Scouting"),[side,setSide]=useState<Side>("HOME");
 const [homePlayers,setHomePlayers]=useState<Player[]>(home.map(p=>({...p})));
 const [awayPlayers,setAwayPlayers]=useState<Player[]>(away.map(p=>({...p})));
 const [homeLineup,setHomeLineup]=useState<Player[]>(emptyCourt("HOME"));
 const [awayLineup,setAwayLineup]=useState<Player[]>(emptyCourt("AWAY"));
 const [homeCourtNumbers,setHomeCourtNumbers]=useState<string[]>(emptyStarterNumbers());
 const [awayCourtNumbers,setAwayCourtNumbers]=useState<string[]>(emptyStarterNumbers());
 const [homeLiberoNumbers,setHomeLiberoNumbers]=useState<string[]>(["",""]);
 const [awayLiberoNumbers,setAwayLiberoNumbers]=useState<string[]>(["",""]);
 const [rosterReady,setRosterReady]=useState(false);
 const [homeLibero,setHomeLibero]=useState<number|null>(null);
 const [awayLibero,setAwayLibero]=useState<number|null>(null);
 const [homeCourt,setHomeCourt]=useState<Player[]>(emptyCourt("HOME"));
 const [awayCourt,setAwayCourt]=useState<Player[]>(emptyCourt("AWAY"));
 const [subPos,setSubPos]=useState(1);
 const [swapPos,setSwapPos]=useState(6);
 const [subIn,setSubIn]=useState<number|null>(null);
 const [subNumber,setSubNumber]=useState("");
 const [subHistory,setSubHistory]=useState<SubEvent[]>([]);
 const [liberoBackup,setLiberoBackup]=useState<{home:Player|null;away:Player|null}>({home:null,away:null});
 const [pendingLibero,setPendingLibero]=useState<{team:Side;index:number;id:number}|null>(null);
 const [match,setMatch]=useState<MatchConfig>({homeName:"UKM VOLI UNESA",awayName:"GENAYO",competition:"Pertandingan Persahabatan",date:new Date().toISOString().slice(0,10),venue:"",referee:"",bestOf:5,scoutingMode:"BOTH"});
 const [score,setScore]=useState({home:0,away:0}),[setNo,setSetNo]=useState(1);
 const [setScores,setSetScores]=useState<{set:number;home:number;away:number}[]>([]);
 const [server,setServer]=useState<Side>("HOME"),[rot,setRot]=useState({home:1,away:1});
 const [firstServers,setFirstServers]=useState<Record<number,Side>>({1:"HOME",2:"HOME",3:"HOME",4:"HOME",5:"HOME"});
 const [selected,setSelected]=useState<number|null>(null),[skill,setSkill]=useState<Skill|null>(null),[quickSkill,setQuickSkill]=useState<Skill|null>(null);
 const [rallies,setRallies]=useState<Rally[]>([]),[open,setOpen]=useState<Rally|null>(null);
 const [rallyCode,setRallyCode]=useState("");
 const [codeStatus,setCodeStatus]=useState<{type:"ok"|"err";text:string}|null>(null);
 const [dark,setDark]=useState(true);
 useEffect(()=>{document.body.classList.toggle("light-mode",!dark);return ()=>document.body.classList.remove("light-mode")},[dark]);
 useEffect(()=>{if(match.scoutingMode==="HOME")setSide("HOME"); if(match.scoutingMode==="AWAY")setSide("AWAY")},[match.scoutingMode]);
 const players=side==="HOME"?homeCourt:awayCourt;
 const player=players.find(p=>p.id===selected)||players[0];
 const pos=Math.max(1,players.findIndex(p=>p.id===selected)+1);
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem("vscout-v12")||"null");if(x&&x.score&&typeof x.score.home==="number"&&typeof x.score.away==="number"&&Array.isArray(x.rallies)){setScore(x.score);setSetNo(typeof x.setNo==="number"?x.setNo:1);if(Array.isArray(x.setScores))setSetScores(x.setScores);setServer(x.server==="AWAY"?"AWAY":"HOME");if(x.firstServers&&typeof x.firstServers==="object")setFirstServers({...{1:"HOME",2:"HOME",3:"HOME",4:"HOME",5:"HOME"},...x.firstServers});setRot(x.rot&&typeof x.rot.home==="number"&&typeof x.rot.away==="number"?x.rot:{home:1,away:1});setRallies(x.rallies);if(Array.isArray(x.subHistory))setSubHistory(x.subHistory);if(x.liberoBackup)setLiberoBackup(x.liberoBackup);if(Array.isArray(x.homePlayers))setHomePlayers(x.homePlayers);if(Array.isArray(x.awayPlayers))setAwayPlayers(x.awayPlayers);if(Array.isArray(x.homeCourtNumbers)&&Array.isArray(x.awayCourtNumbers)){setHomeCourtNumbers(x.homeCourtNumbers);setAwayCourtNumbers(x.awayCourtNumbers);if(Array.isArray(x.homeLiberoNumbers))setHomeLiberoNumbers(x.homeLiberoNumbers);if(Array.isArray(x.awayLiberoNumbers))setAwayLiberoNumbers(x.awayLiberoNumbers);setRosterReady(!!x.rosterReady);const hp=Array.isArray(x.homePlayers)?x.homePlayers:home;const ap=Array.isArray(x.awayPlayers)?x.awayPlayers:away;const h=emptyCourt("HOME").map((slot,i)=>hp.find(p=>p.number===Number(x.homeCourtNumbers[i]))||slot);const a=emptyCourt("AWAY").map((slot,i)=>ap.find(p=>p.number===Number(x.awayCourtNumbers[i]))||slot);setHomeCourt(h);setAwayCourt(a);setHomeLineup(h);setAwayLineup(a)}else{setHomeCourt(emptyCourt("HOME"));setAwayCourt(emptyCourt("AWAY"));setHomeLineup(emptyCourt("HOME"));setAwayLineup(emptyCourt("AWAY"));setHomeCourtNumbers(emptyStarterNumbers());setAwayCourtNumbers(emptyStarterNumbers());setRosterReady(false)}if(typeof x.homeLibero==="number")setHomeLibero(x.homeLibero);if(typeof x.awayLibero==="number")setAwayLibero(x.awayLibero);if(x.match)setMatch(m=>({...m,...x.match,scoutingMode:x.match.scoutingMode||"BOTH"}))}}catch{localStorage.removeItem("vscout-v12")}},[]);
 useEffect(()=>localStorage.setItem("vscout-v12",JSON.stringify({score,setNo,setScores,server,firstServers,rot,rallies,subHistory,liberoBackup,homePlayers,awayPlayers,homeLineup,awayLineup,homeLibero,awayLibero,homeCourt,awayCourt,homeCourtNumbers,awayCourtNumbers,homeLiberoNumbers,awayLiberoNumbers,rosterReady,match})),[score,setNo,setScores,server,firstServers,rot,rallies,subHistory,liberoBackup,homePlayers,awayPlayers,homeLineup,awayLineup,homeLibero,awayLibero,homeCourt,awayCourt,homeCourtNumbers,awayCourtNumbers,homeLiberoNumbers,awayLiberoNumbers,rosterReady,match]);
 const stats=useMemo(()=>{
  const a=rallies.flatMap(r=>Array.isArray(r?.actions)?r.actions:[]).filter(x=>x?.side===side);
  const n=(s:Skill,r?:string)=>a.filter(x=>x?.skill===s&&(!r||x.result===r)).length;
  const attack=n("Attack"),kill=n("Attack","Kill"),error=n("Attack","Error"),blocked=n("Attack","Blocked");
  const serve=n("Serve"),ace=n("Serve","Ace"),serveError=n("Serve","Error");
  const receive=n("Reception"),receivePlus=n("Reception","Perfect (3)")+n("Reception","Good (2)");
  const set=n("Set"),setPlus=n("Set","Perfect (3)")+n("Set","Good (2)");
  const dig=n("Dig"),digPlus=n("Dig","Perfect (3)")+n("Dig","Good (2)");
  const block=n("Block"),blockKill=n("Block","Block Kill");
  const cover=n("Cover"),coverGood=n("Cover","Good");
  const freeBall=n("Free Ball"),freeGood=n("Free Ball","Good");
  const successRate=attack?Math.round(kill/attack*100):0; const serveIn=n("Serve","In Play")+n("Serve","Positive (+)"); const attackPositive=n("Attack","Positive (+)"); const attackContinuation=n("Attack","Continuation (#)");
  return {attack,kill,error,blocked,eff:attack?Math.round((kill-error-blocked)/attack*100):0,successRate,attackPositive,attackContinuation,serve,serveIn,ace,serveError,receive,receivePlus,receiveRate:receive?Math.round(receivePlus/receive*100):0,set,setPlus,setRate:set?Math.round(setPlus/set*100):0,dig,digPlus,digRate:dig?Math.round(digPlus/dig*100):0,block,blockKill,cover,coverGood,freeBall,freeGood};
 },[rallies,side]);

 const playerStats=useMemo(()=>{
  const all=rallies.flatMap(r=>r.actions).filter(a=>a.side===side);
  return players.map(p=>{
   const a=all.filter(x=>x.player.id===p.id); const n=(sk:Skill,res?:string)=>a.filter(x=>x.skill===sk&&(!res||x.result===res)).length;
   const att=n("Attack"); const kill=n("Attack","Kill"),err=n("Attack","Error"),blk=n("Attack","Blocked");
   return {...p,attack:att,kill,error:err,blocked:blk,eff:att?Math.round((kill-err-blk)/att*100):0,successRate:att?Math.round(kill/att*100):0,attackPositive:n("Attack","Positive (+)"),attackContinuation:n("Attack","Continuation (#)"),serve:n("Serve"),serveIn:n("Serve","In Play")+n("Serve","Positive (+)"),ace:n("Serve","Ace"),serveErr:n("Serve","Error"),rec:n("Reception"),recPlus:n("Reception","Perfect (3)")+n("Reception","Good (2)"),dig:n("Dig"),digPlus:n("Dig","Perfect (3)")+n("Dig","Good (2)"),sets:n("Set"),setPlus:n("Set","Perfect (3)")+n("Set","Good (2)"),block:n("Block"),blockKill:n("Block","Block Kill")};
  });
 },[rallies,side,players]);
 const attackMap=useMemo(()=>{
  const m:Record<string,number>={}; ["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"].forEach(z=>m[z]=0);
  rallies.flatMap(r=>r.actions).filter(a=>a.side===side&&a.skill==="Attack").forEach(a=>{if(a.target&&m[a.target]!==undefined)m[a.target]++}); return m;
 },[rallies,side]);
 const rotationStats=useMemo(()=>{
  return [1,2,3,4,5,6].map(r=>{const acts=rallies.flatMap(x=>x.actions).filter(a=>a.side===side&&a.rot===r); const n=(sk:Skill,res?:string)=>acts.filter(a=>a.skill===sk&&(!res||a.result===res)).length; const att=n("Attack"); return {r,attack:att,kill:n("Attack","Kill"),error:n("Attack","Error"),blocked:n("Attack","Blocked"),eff:att?Math.round((n("Attack","Kill")-n("Attack","Error")-n("Attack","Blocked"))/att*100):0,ace:n("Serve","Ace"),recPlus:n("Reception","Perfect (3)")+n("Reception","Good (2)"),digPlus:n("Dig","Perfect (3)")+n("Dig","Good (2)"),blockKill:n("Block","Block Kill")};});
 },[rallies,side]);

 function rotateTeam(team:Side){
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  const active=team==="HOME"?homeLibero:awayLibero;
  const current=team==="HOME"?homeCourt:awayCourt;
  const backup=team==="HOME"?liberoBackup.home:liberoBackup.away;
  if(current.length!==6||current.some(p=>p.id<0)){window.alert("Isi dulu roster awal P1–P6 sebelum melakukan rotasi.");return false;}
  // Jika libero berada di P5, rotasi berikutnya akan membawanya ke P4 (baris depan).
  // Kembalikan pemain yang digantikan ke slot libero SEBELUM menghitung rotasi berikutnya.
  // Ini dibuat dalam satu perhitungan agar state React yang masih lama tidak menimpa pemain kembali.
  let base=[...current];
  if(active && base[4]?.id===active && backup){
    base[4]=backup;
    setLiberoBackup(b=>team==="HOME"?{...b,home:null}:{...b,away:null});
    setSubHistory(h=>[...h,{id:Date.now(),team,type:"LIBERO OUT — AUTO ROTASI",pos:5,outPlayer:rosterPlayer(team,active),inPlayer:backup}]);
  }
  // Rotasi resmi searah jarum jam: P1 → P6 → P5 → P4 → P3 → P2 → P1.
  // Array [P1,P2,P3,P4,P5,P6] menjadi [P2,P3,P4,P5,P6,P1].
  const next: Player[] = [base[1],base[2],base[3],base[4],base[5],base[0]];
  setter(next);
  return true;
 }
 function randomizeCourt(team:Side){
  const lineup=team==="HOME"?homeLineup:awayLineup;
  const current=team==="HOME"?homeCourt:awayCourt;
  if(lineup.length!==6||lineup.some(p=>p.id<0)){window.alert("Isi dulu roster awal P1–P6 sebelum mengacak posisi.");return;}
  const liberoId=team==="HOME"?homeLibero:awayLibero;
  const activeLibero=liberoId?current.find(p=>p.id===liberoId):null;
  const pool=[...lineup].filter(p=>p.id!==liberoId);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  let shuffled:Player[];
  if(activeLibero){
    const currentIdx=current.findIndex(p=>p.id===liberoId);
    const liberoPos=[1,5,6].includes(currentIdx+1)?currentIdx:5;
    shuffled=[]; let k=0;
    for(let i=0;i<6;i++) shuffled.push(i===liberoPos?activeLibero:pool[k++]);
  }else shuffled=[...pool];
  if(team==="HOME")setHomeCourt(shuffled);else setAwayCourt(shuffled);
 }
 function swapCourtPositions(team:Side,a:number,b:number){
  if(a===b)return;
  const current=team==="HOME"?homeCourt:awayCourt;
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  if(!current[a-1]||!current[b-1])return;
  const next=[...current];[next[a-1],next[b-1]]=[next[b-1],next[a-1]];setter(next);
 }
 function substitute(team:Side,posNo:number,inId:number|null){
  if(!inId || ![1,2,3,4,5,6].includes(posNo))return;
  const roster=team==="HOME"?homePlayers:awayPlayers;
  const current=team==="HOME"?homeCourt:awayCourt;
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  const incoming=roster.find(p=>p.id===inId);
  const outgoing=current[posNo-1];
  if(!incoming||!outgoing||outgoing.id<0||incoming.role==="L"||incoming.id===outgoing.id)return;
  if(current.some((p,i)=>i!==posNo-1&&p.id===incoming.id))return;
  setter(current.map((p,i)=>i===posNo-1?incoming:p));
  setSubHistory(h=>[...h,{id:Date.now(),team,type:"SUBSTITUTION",pos:posNo,outPlayer:outgoing,inPlayer:incoming}]);
  setSubIn(null);
 }
 function liberoSwap(team:Side,posNo:number,liberoId?:number){
  const lid=liberoId ?? (team==="HOME"?homeLibero:awayLibero);
  if(!lid || ![1,5,6].includes(posNo))return;
  const roster=team==="HOME"?homePlayers:awayPlayers;
  const current=team==="HOME"?homeCourt:awayCourt;
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  const incoming=roster.find(p=>p.id===lid);
  const outgoing=current[posNo-1];
  if(!incoming||incoming.role!=="L"||!outgoing||outgoing.role==="L")return;
  if(current.some(p=>p.id===incoming.id))return;
  setter(current.map((p,i)=>i===posNo-1?incoming:p));
  setLiberoBackup(b=>team==="HOME"?{...b,home:outgoing}:{...b,away:outgoing});
  setSubHistory(h=>[...h,{id:Date.now(),team,type:"LIBERO IN",pos:posNo,outPlayer:outgoing,inPlayer:incoming}]);
 }

 function clickLiberoSlot(team:Side,index:number){
  // Klik pertama memilih libero; klik berikutnya pada pemain belakang menentukan siapa yang diganti.
  const backup=team==="HOME"?liberoBackup.home:liberoBackup.away;
  if(backup){liberoOut(team);setPendingLibero(null);return;}
  const nums=team==="HOME"?homeLiberoNumbers:awayLiberoNumbers;
  const roster=team==="HOME"?homePlayers:awayPlayers;
  const raw=nums[index]?.trim();
  if(!raw){window.alert(`Isi nomor Libero ${index+1} pada roster awal tim ${team} terlebih dahulu.`);return;}
  const libero=roster.find(p=>p.number===Number(raw));
  if(!libero||libero.role!=="L"){window.alert(`Nomor ${raw} tidak terdaftar sebagai libero (role L) di tim ${team}.`);return;}
  const current=team==="HOME"?homeCourt:awayCourt;
  if(current.some(p=>p.id===libero.id)){window.alert("Libero tersebut sudah berada di lapangan.");return;}
  setPendingLibero({team,index,id:libero.id});
  setSide(team);
  setSelected(null);
  setQuickSkill(null);
  // Tidak menampilkan dialog OK: cukup klik libero, lalu klik pemain belakang yang akan diganti.
 }
 function handleCourtPlayerClick(team:Side,posNo:number,p:Player){
  if(pendingLibero){
   if(pendingLibero.team!==team){window.alert(`Pilih pemain dari tim ${pendingLibero.team} karena libero yang dipilih berasal dari tim tersebut.`);return;}
   if(![1,5,6].includes(posNo)){window.alert("Libero hanya boleh menggantikan pemain baris belakang P1, P5, atau P6.");return;}
   const current=team==="HOME"?homeCourt:awayCourt;
   if(!p||p.id<0){window.alert("Posisi ini masih kosong.");return;}
   const setLib=team==="HOME"?setHomeLibero:setAwayLibero;
   setLib(pendingLibero.id);
   liberoSwap(team,posNo,pendingLibero.id);
   setPendingLibero(null);
   setSelected(null);
   setQuickSkill(null);
   return;
  }
  setSide(team);setSelected(p.id);setQuickSkill(null);
 }
 function liberoOut(team:Side){
  const lid=team==="HOME"?homeLibero:awayLibero;
  const backup=team==="HOME"?liberoBackup.home:liberoBackup.away;
  const current=team==="HOME"?homeCourt:awayCourt;
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  if(!lid||!backup)return;
  const idx=current.findIndex(p=>p.id===lid);
  if(idx<0)return;
  setter(current.map((p,i)=>i===idx?backup:p));
  setLiberoBackup(b=>team==="HOME"?{...b,home:null}:{...b,away:null});
  setSubHistory(h=>[...h,{id:Date.now(),team,type:"LIBERO OUT",pos:idx+1,outPlayer:rosterPlayer(team,lid),inPlayer:backup}]);
 }
 function rosterPlayer(team:Side,id:number){return (team==="HOME"?homePlayers:awayPlayers).find(p=>p.id===id)}
 function checkSetWinner(sc:{home:number;away:number}){
  const target=setNo===5?15:25;
  if(Math.max(sc.home,sc.away)<target)return null;
  if(Math.abs(sc.home-sc.away)<2)return null;
  return sc.home>sc.away?"HOME":"AWAY" as Side;
 }
 function applyPoint(w:Side){
  const sc={...score,[w.toLowerCase()]:score[w.toLowerCase() as "home"|"away"]+1};
  const setWinner=checkSetWinner(sc);
  setScore(sc);
  // Rotation occurs ONLY on side-out: the rally winner was receiving, not serving.
  // The players are not manually reassigned by role; the six position slots rotate clockwise.
  if(w!==server){
   // rotateTeam menangani libero keluar otomatis sebelum rotasi jika pemain penggantinya akan maju ke P4.
   setRot(x=>({...x,[w.toLowerCase()]:x[w.toLowerCase() as "home"|"away"]===6?1:x[w.toLowerCase() as "home"|"away"]+1}));
   rotateTeam(w);
  }
  setServer(w);
  if(setWinner){
   setSetScores(x=>[...x,{set:setNo,home:sc.home,away:sc.away}]);
   // Set selesai: pertahankan skor dan susunan pemain agar hasil set dapat dilihat.
   // Reset baru dilakukan ketika pengguna memilih set berikutnya secara manual.
  }
  return {sc,setWinner};
 }
 function rallySnapshot(){return {beforeServer:server,beforeRot:{...rot},beforeHomeCourt:homeCourt.map(p=>({...p})),beforeAwayCourt:awayCourt.map(p=>({...p}))};}
 function start(){if(setScores.some(x=>x.set===setNo)){window.alert("Set ini sudah selesai. Pilih set berikutnya pada menu SET untuk memulai scouting baru.");return;}if(!open)setOpen({id:Date.now(),set:setNo,actions:[],before:{...score},...rallySnapshot()})}
 function openSkill(s:Skill){start();setSkill(null);setQuickSkill(s)}
 function recordQuickResult(result:string){
  if(!quickSkill||!player)return;
  const r=open||{id:Date.now(),set:setNo,actions:[],before:{...score},...rallySnapshot()};
  const act:Action={id:Date.now(),side,player,pos,rot:rot[side],skill:quickSkill,result,timestamp:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})};
  const next={...r,actions:[...r.actions,act]};
  const terminal=["Kill","Ace","Block Kill","Error","Blocked"].includes(result);
  setQuickSkill(null);
  if(!terminal){setOpen(next);return;}
  const w:(Side)=(["Kill","Ace","Block Kill"].includes(result)?side:(side==="HOME"?"AWAY":"HOME"));
  const point=applyPoint(w);
  setRallies(x=>[...x,{...next,winner:w,pointReason:result,after:point.sc}]);setOpen(null);setSkill(null);
 }
 function saveAction(v:any){
  if(!skill||!player)return;
  const r=open||{id:Date.now(),set:setNo,actions:[],before:{...score},...rallySnapshot()};
  const act:Action={id:Date.now(),side,player,pos,rot:rot[side],skill,result:v.result||"",timestamp:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),...v};
  setOpen({...r,actions:[...r.actions,act]});setSkill(null);setQuickSkill(null);
 }
 function undoAction(){
  if(open?.actions.length){
   const next=open.actions.slice(0,-1);
   setOpen({...open,actions:next});
   return;
  }
  if(open){setOpen(null);setQuickSkill(null);setSkill(null);return;}
  const last=rallies[rallies.length-1];
  if(!last){window.alert("Belum ada aksi yang bisa dibatalkan.");return;}
  if(!window.confirm(`Batalkan rally terakhir (Set ${last.set}, ${last.actions.length} aksi)? Skor dan rotasi akan dikembalikan.`))return;
  setRallies(rows=>rows.slice(0,-1));
  setScore(last.before);
  if(last.beforeServer)setServer(last.beforeServer);
  if(last.beforeRot)setRot(last.beforeRot);
  if(last.beforeHomeCourt)setHomeCourt(last.beforeHomeCourt);
  if(last.beforeAwayCourt)setAwayCourt(last.beforeAwayCourt);
  setSetScores(rows=>rows.filter(x=>x.set!==last.set||!(last.after&&((last.after.home>=25||last.after.away>=25)&&Math.abs(last.after.home-last.after.away)>=2))));
  setRallyCode("");setCodeStatus(null);setQuickSkill(null);setSkill(null);
 }
 function finish(w:Side,reason="Point"){
  if(!open?.actions.length)return;
  const point=applyPoint(w);
  setRallies(x=>[...x,{...open,winner:w,pointReason:reason,after:point.sc}]);setOpen(null);setSkill(null);
 }
 function autoFinish(){
  if(!open?.actions.length)return;
  const last=open.actions[open.actions.length-1];
  if(["Kill","Ace","Block Kill"].includes(last.result))finish(last.side,last.result);
  else if(["Error","Blocked"].includes(last.result))finish(last.side==="HOME"?"AWAY":"HOME",`${last.side} ${last.result}`);
 }
 function processCodeRally(){
  const raw=rallyCode.trim();
  if(!raw){setCodeStatus({type:"err",text:"Masukkan kode rally terlebih dahulu."});return;}
  if(open){setCodeStatus({type:"err",text:"Selesaikan atau batalkan rally manual yang sedang terbuka terlebih dahulu."});return;}
  if(setScores.some(x=>x.set===setNo)){setCodeStatus({type:"err",text:"Set ini sudah selesai. Pilih set berikutnya terlebih dahulu."});return;}
  const tokens=raw.split(/[\s,;]+/).filter(Boolean);
  const parsed:Action[]=[];
  const errors:string[]=[];
  const mapSkill:any={S:"Serve",R:"Reception",A:"Attack",B:"Block",D:"Dig",T:"Set"};
  const resultMap:any={
   S:{"+":"In Play","#":"Ace","-":"Error","!":"In Play"},
   R:{"+":"Good (2)","#":null,"-":"Error","!":"Poor (1)"},
   A:{"+":"Positive (+)","#":"Kill","-":"Error","!":"Blocked"},
   B:{"+":"Touch","#":"Block Kill","-":"Error","!":"Control"},
   D:{"+":"Good (2)","#":null,"-":"Error","!":"Poor (1)"},
   T:{"+":"Good (2)","#":null,"-":"Error","!":"Poor (1)"}
  };
  tokens.forEach((token,index)=>{
   // Format singkat: H8A#5C (zona 5, cross), H8S+1L (zona 1, line), H5T+4Q (tos P4, quick).
   // Format lama dengan @ tetap diterima agar kode scouting sebelumnya tidak rusak.
   let normalized=token.toUpperCase();
   const compact=normalized.match(/^([HA])(\d+)([SRABDT])([+#\-!])(.+)$/);
   if(compact && !compact[5].startsWith("@")){
    const tail=compact[5];
    if((compact[3]==="A"||compact[3]==="S") && /^([1-9])([CLMST])$/.test(tail)){
     const d=tail.match(/^([1-9])([CLMST])$/)!; const dirMap:any={C:"X",L:"L",M:"M",S:"S",T:"T"};
     normalized=`${compact[1]}${compact[2]}${compact[3]}${compact[4]}@Z${d[1]}/${dirMap[d[2]]}`;
    }else if(compact[3]==="T" && /^(2|3|4|B|P|S)(H|Q|SH|B|P|SL)$/.test(tail)){
     const d=tail.match(/^(2|3|4|B|P|S)(H|Q|SH|B|P|SL)$/)!; const targetMap:any={2:"P2",3:"P3",4:"P4",B:"BR",P:"PIPE",S:"SLIDE"};
     normalized=`${compact[1]}${compact[2]}${compact[3]}${compact[4]}@${targetMap[d[1]]}/${d[2]}`;
    }
   }
   const m=normalized.match(/^([HA])(\d+)([SRABDT])([+#\-!])(?:@([A-Z0-9]+)\/([A-Z]+))?$/);
   if(!m){errors.push(`Kode ke-${index+1} "${token}" tidak sesuai. Contoh singkat: H8A#5C, H8S+1L, H5T+4Q.`);return;}
   const team:Side=m[1]==="H"?"HOME":"AWAY";
   const number=Number(m[2]), action=m[3], mark=m[4], detailTarget=m[5]||"", detailCode=m[6]||"";
   const skillName:Skill=mapSkill[action];
   const result=resultMap[action][mark];
   if(!result){errors.push(`Kode ${token}: hasil ${mark} tidak berlaku untuk aksi ${action}.`);return;}
   const roster=team==="HOME"?homePlayers:awayPlayers;
   const court=team==="HOME"?homeCourt:awayCourt;
   const found=roster.find(p=>p.number===number);
   if(!found){errors.push(`Pemain ${team} nomor ${number} tidak ditemukan di roster.`);return;}
   const posNo=court.findIndex(p=>p.id===found.id)+1;
   if(posNo<1){errors.push(`Pemain ${team} nomor ${number} tidak sedang berada di lapangan.`);return;}
   if((team==="HOME"&&match.scoutingMode==="AWAY")||(team==="AWAY"&&match.scoutingMode==="HOME")){errors.push(`Mode scouting saat ini tidak mengizinkan pencatatan tim ${team}.`);return;}
   let target:string|undefined, direction:string|undefined, tempo:string|undefined;
   if(detailTarget||detailCode){
    if(!detailTarget||!detailCode){errors.push(`Kode ${token}: detail harus berisi target dan kode arah/tempo setelah @.`);return;}
    if(action==="A"||action==="S"){
     if(!/^Z[1-9]$/.test(detailTarget)){errors.push(`Kode ${token}: target attack/service harus Z1 sampai Z9.`);return;}
     const dirs:any={X:"Cross",L:"Line",M:"Middle",S:"Seam",T:"Tip"};
     if(!dirs[detailCode]){errors.push(`Kode ${token}: arah harus X (Cross), L (Line), M (Middle), S (Seam), atau T (Tip).`);return;}
     target=detailTarget;direction=dirs[detailCode];
    }else if(action==="T"){
     const targets:any={P4:"P4 Outside",P3:"P3 Middle",P2:"P2 Opposite",BR:"Back Row",PIPE:"Pipe",SLIDE:"Slide"};
     const tempos:any={H:"High Ball",Q:"Quick",SH:"Shoot",B:"Back",P:"Pipe",SL:"Slide"};
     if(!targets[detailTarget]){errors.push(`Kode ${token}: target set harus P4, P3, P2, BR, PIPE, atau SLIDE.`);return;}
     if(!tempos[detailCode]){errors.push(`Kode ${token}: tempo set harus H, Q, SH, B, P, atau SL.`);return;}
     target=targets[detailTarget];tempo=tempos[detailCode];
    }else{errors.push(`Kode ${token}: detail zona/arah hanya untuk Attack, Service, dan Set.`);return;}
   }
   parsed.push({id:Date.now()+index,side:team,player:found,pos:posNo,rot:rot[team.toLowerCase() as "home"|"away"],skill:skillName,result,target,direction,tempo,zoneNote:(action==="A"||action==="S")?(target&&direction?`${target} • ${direction}`:""):(action==="T"?(target&&tempo?`${target} • ${tempo}`:""):""),timestamp:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"})});
  });
  if(errors.length){setCodeStatus({type:"err",text:errors.join(" • ")});return;}
  if(!parsed.length){setCodeStatus({type:"err",text:"Tidak ada kode yang dapat diproses."});return;}
  const last=parsed[parsed.length-1];
  const terminal=(["Ace","Kill","Block Kill","Error","Blocked"].includes(last.result));
  if(!terminal){setCodeStatus({type:"err",text:"Rally belum memiliki kode penutup. Akhiri dengan hasil poin (#) atau error (-), lalu tekan ENTER."});return;}
  const winner:Side=(["Ace","Kill","Block Kill"].includes(last.result)?last.side:(last.side==="HOME"?"AWAY":"HOME"));
  const before={...score};
  const rallySnapshotBefore=rallySnapshot();
  const point=applyPoint(winner);
  const rally:Rally={id:Date.now(),set:setNo,actions:parsed,winner,pointReason:last.result,before,after:point.sc,...rallySnapshotBefore};
  setRallies(old=>[...old,rally]);
  setSide(last.side);setSelected(null);setQuickSkill(null);setSkill(null);
  setRallyCode("");
  setCodeStatus({type:"ok",text:`Rally tersimpan • ${winner==="HOME"?match.homeName:match.awayName} mendapat 1 poin • Skor ${point.sc.home} : ${point.sc.away} • ${parsed.length} aksi tercatat.`});
 }
 // Ekspor statistik lengkap: CSV untuk Excel dan dokumen HTML kompatibel Word.
 const exportMatchCSV=()=>{
  const q=(v:any)=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows:any[][]=[];
  const section=(title:string,header:any[])=>{rows.push([],[],[title],header)};
  const zoneNote=(a:any)=>a.zoneNote||(a.skill==="Attack"||a.skill==="Serve"?(a.target||a.direction?[a.target,a.direction].filter(Boolean).join(" • "):""):a.skill==="Set"?(a.target||a.tempo?[a.target,a.tempo].filter(Boolean).join(" • "):""):"");
  const allActions=rallies.flatMap(r=>r.actions.map(a=>({...a,zoneNote:zoneNote(a),setNo:r.set,rallyId:r.id,winner:r.winner,scoreHome:r.after?.home??"",scoreAway:r.after?.away??""})));
  const teams:[Side,string,Player[]][]=[ ["HOME",match.homeName,homePlayers], ["AWAY",match.awayName,awayPlayers] ];
  rows.push(["AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC - LAPORAN ANALISIS PERTANDINGAN"],["HOME",match.homeName],["AWAY",match.awayName],["Kompetisi",match.competition],["Tanggal",match.date],["Venue",match.venue],["Total rally",rallies.length],["Total aksi",allActions.length]);
  section("REKAP SKOR SET",["Set",`HOME - ${match.homeName}`,`AWAY - ${match.awayName}`]);
  setScores.forEach(x=>rows.push([x.set,x.home,x.away]));
  section("DETAIL SCOUTING - HOME",["Set","Rally","Pemenang Rally","Skor HOME","Skor AWAY","Tim","No Punggung","Nama Pemain","Posisi","Rotasi","Skill","Hasil","Subtipe","Target","Arah","Keterangan Zona/Arah Otomatis","Tempo","Tipe Block","Waktu"]);
  allActions.filter(a=>a.side==="HOME").forEach(a=>rows.push([a.setNo,a.rallyId,a.winner,a.scoreHome,a.scoreAway,a.side,a.player?.number,a.player?.name,a.pos,a.rot,a.skill,a.result,a.subtype,a.target,a.direction,a.zoneNote,a.tempo,a.blockType,a.timestamp]));
  section("DETAIL SCOUTING - AWAY",["Set","Rally","Pemenang Rally","Skor HOME","Skor AWAY","Tim","No Punggung","Nama Pemain","Posisi","Rotasi","Skill","Hasil","Subtipe","Target","Arah","Keterangan Zona/Arah Otomatis","Tempo","Tipe Block","Waktu"]);
  allActions.filter(a=>a.side==="AWAY").forEach(a=>rows.push([a.setNo,a.rallyId,a.winner,a.scoreHome,a.scoreAway,a.side,a.player?.number,a.player?.name,a.pos,a.rot,a.skill,a.result,a.subtype,a.target,a.direction,a.zoneNote,a.tempo,a.blockType,a.timestamp]));
  // Rekap individu: volume setiap skill, rincian hasil, dan metrik advanced.
  teams.forEach(([side,name,roster])=>{
   const teamActions=allActions.filter(a=>a.side===side);
   const resultNames=Array.from(new Set(teamActions.map(a=>a.result).filter(Boolean))).sort();
   const skillNames:[Skill,string][]=[["Serve","SERVE"],["Reception","RECEIVE"],["Set","SET"],["Attack","ATTACK"],["Block","BLOCK"],["Dig","DIG"],["Cover","COVER"],["Free Ball","FREE BALL"]];
   section(`REKAP INDIVIDU PEMAIN - ${side} (${name})`,["No","Nama","Posisi","Total Aksi",...skillNames.map(x=>x[1]),"Attack Kill","Attack Positive","Attack Continuation","Attack Error","Attack Blocked","Attack Efficiency %","Serve Ace","Serve Error","Receive Perfect","Receive Good","Receive Poor","Receive Error","Block Kill","Dig Berhasil",...resultNames.map(x=>`HASIL: ${x}`)]);
   roster.forEach(p=>{
    const pa=teamActions.filter(a=>a.player?.id===p.id); const skillCount=(s:string)=>pa.filter(a=>a.skill===s).length;
    const count=(s:string,r:string)=>pa.filter(a=>a.skill===s&&a.result===r).length;
    const att=skillCount("Attack"), kill=count("Attack","Kill"), err=count("Attack","Error"), blocked=count("Attack","Blocked");
    const eff=att?Math.round((kill-err-blocked)/att*100):0;
    rows.push([p.number,p.name,p.role,pa.length,...skillNames.map(([s])=>skillCount(s)),kill,count("Attack","Positive (+)"),count("Attack","Continuation (#)"),err,blocked,eff,count("Serve","Ace"),count("Serve","Error"),count("Reception","Perfect (3)"),count("Reception","Good (2)"),count("Reception","Poor (1)"),count("Reception","Error (0)"),count("Block","Block Kill"),pa.filter(a=>a.skill==="Dig"&&["Positive (+)","Good (2)","Perfect (3)"].includes(a.result)).length,...resultNames.map(r=>pa.filter(a=>a.result===r).length)]);
   });
   const sumRow:any[]=["TOTAL",name,"",teamActions.length,...skillNames.map(([s])=>teamActions.filter(a=>a.skill===s).length)];
   const teamAtt=teamActions.filter(a=>a.skill==="Attack"), tk=teamAtt.filter(a=>a.result==="Kill").length, te=teamAtt.filter(a=>a.result==="Error").length, tb=teamAtt.filter(a=>a.result==="Blocked").length;
   sumRow.push(tk,teamAtt.filter(a=>a.result==="Positive (+)").length,teamAtt.filter(a=>a.result==="Continuation (#)").length,te,tb,teamAtt.length?Math.round((tk-te-tb)/teamAtt.length*100):0,teamActions.filter(a=>a.skill==="Serve"&&a.result==="Ace").length,teamActions.filter(a=>a.skill==="Serve"&&a.result==="Error").length,...["Perfect (3)","Good (2)","Poor (1)","Error (0)"].map(r=>teamActions.filter(a=>a.skill==="Reception"&&a.result===r).length),teamActions.filter(a=>a.skill==="Block"&&a.result==="Block Kill").length,teamActions.filter(a=>a.skill==="Dig"&&["Positive (+)","Good (2)","Perfect (3)"].includes(a.result)).length,...resultNames.map(r=>teamActions.filter(a=>a.result===r).length));
   rows.push(sumRow);
  });
  // Rotation Center: dihitung dari rotasi pada aksi pertama masing-masing tim di setiap rally.
  teams.forEach(([side,name])=>{
   section(`ROTATION CENTER / ROTATION MATRIX - ${side} (${name})`,["Rotasi","Rally Terlibat","Menang","Kalah","Win Rate %","Side-out Berhasil","Peluang Side-out","Side-out %","Break Point","Serve","Ace","Serve Error","Receive","Attack","Kill","Attack Error","Attack Blocked","Attack Efficiency %","Block Kill","Dig"]);
   [1,2,3,4,5,6].forEach(rot=>{
    const rr=rallies.filter(r=>r.actions.some(a=>a.side===side&&a.rot===rot));
    const won=rr.filter(r=>r.winner===side).length, lost=rr.filter(r=>r.winner&&r.winner!==side).length;
    const sideoutOpp=rr.filter(r=>r.actions.find(a=>a.side===side)?.side===side && r.actions[0]?.side!==side);
    const oppServeRallies=rr.filter(r=>r.actions[0]?.side!==side);
    const so=oppServeRallies.filter(r=>r.winner===side).length;
    const teamA=rr.flatMap(r=>r.actions.filter(a=>a.side===side&&a.rot===rot));
    const at=teamA.filter(a=>a.skill==="Attack"), k=at.filter(a=>a.result==="Kill").length, er=at.filter(a=>a.result==="Error").length, bl=at.filter(a=>a.result==="Blocked").length;
    rows.push([`R${rot}`,rr.length,won,lost,rr.length?Math.round(won/rr.length*100):0,so,oppServeRallies.length,oppServeRallies.length?Math.round(so/oppServeRallies.length*100):0,rr.filter(r=>r.winner===side&&r.actions[0]?.side===side).length,teamA.filter(a=>a.skill==="Serve").length,teamA.filter(a=>a.skill==="Serve"&&a.result==="Ace").length,teamA.filter(a=>a.skill==="Serve"&&a.result==="Error").length,teamA.filter(a=>a.skill==="Reception").length,at.length,k,er,bl,at.length?Math.round((k-er-bl)/at.length*100):0,teamA.filter(a=>a.skill==="Block"&&a.result==="Block Kill").length,teamA.filter(a=>a.skill==="Dig").length]);
   });
  });
  // Analisis teknis per tim dan skill: distribusi hasil dari seluruh aksi.
  teams.forEach(([side,name])=>{
   const ta=allActions.filter(a=>a.side===side); const skills=Array.from(new Set(ta.map(a=>a.skill)));
   section(`TECHNICAL ANALYSIS - ${side} (${name})`,["Skill","Total Percobaan","Hasil","Jumlah","Persentase dari Skill %"]);
   skills.forEach(skill=>{const sa=ta.filter(a=>a.skill===skill);const outcomes=Array.from(new Set(sa.map(a=>a.result)));outcomes.forEach(result=>rows.push([skill,sa.length,result,sa.filter(a=>a.result===result).length,sa.length?Math.round(sa.filter(a=>a.result===result).length/sa.length*100):0]));});
   section(`ADVANCED STATISTICS - ${side} (${name})`,["Metrik","Nilai","Keterangan"]);
   const count=(s:string,r?:string)=>ta.filter(a=>a.skill===s&&(!r||a.result===r)).length;
   const attack=count("Attack"), kills=count("Attack","Kill"), ae=count("Attack","Error"), ab=count("Attack","Blocked"), serve=count("Serve"), ace=count("Serve","Ace"), se=count("Serve","Error"), rec=count("Reception"), perfect=count("Reception","Perfect (3)"), good=count("Reception","Good (2)"), block=count("Block"), bk=count("Block","Block Kill");
   [["Total aksi",ta.length,"Semua aksi scouting"],["Attack kill %",attack?Math.round(kills/attack*100):0,"Kill dibagi total attack × 100"],["Attack efficiency %",attack?Math.round((kills-ae-ab)/attack*100):0,"(Kill - Error - Blocked) dibagi total attack × 100"],["Attack error %",attack?Math.round(ae/attack*100):0,"Attack error dibagi total attack × 100"],["Attack blocked %",attack?Math.round(ab/attack*100):0,"Attack diblok dibagi total attack × 100"],["Serve ace %",serve?Math.round(ace/serve*100):0,"Ace dibagi total serve × 100"],["Serve error %",serve?Math.round(se/serve*100):0,"Error serve dibagi total serve × 100"],["Reception positive %",rec?Math.round((perfect+good)/rec*100):0,"(Perfect + Good) dibagi total receive × 100"],["Block kill %",block?Math.round(bk/block*100):0,"Block kill dibagi total block × 100"],["Kill",kills,"Jumlah attack kill"],["Ace",ace,"Jumlah service ace"],["Block kill",bk,"Jumlah block kill"]].forEach(x=>rows.push(x));
  });
  // Analisis taktis terpisah untuk Attack, Service, dan Set/Tos.
  teams.forEach(([side,name])=>{
   const at=allActions.filter(a=>a.side===side&&a.skill==="Attack");
   section(`TACTICAL ANALYSIS - ATTACK ZONE / DIRECTION - ${side} (${name})`,["Dimensi","Kategori","Total Attack","Kill","Positive","Error","Blocked","Kill %"]);
   const attackGroups:[string,(a:any)=>string][]=[["ZONA SERANGAN",a=>a.target||"Tidak diisi"],["ARAH SERANGAN",a=>a.direction||"Tidak diisi"],["ROTASI",a=>`R${a.rot||"?"}`],["PEMAIN",a=>`#${a.player?.number||"?"} ${a.player?.name||""}`]];
   attackGroups.forEach(([dim,key])=>{const vals=Array.from(new Set(at.map(key)));vals.forEach(val=>{const aa=at.filter(a=>key(a)===val),k=aa.filter(a=>a.result==="Kill").length;rows.push([dim,val,aa.length,k,aa.filter(a=>a.result==="Positive (+)").length,aa.filter(a=>a.result==="Error").length,aa.filter(a=>a.result==="Blocked").length,aa.length?Math.round(k/aa.length*100):0]);});});
   const sv=allActions.filter(a=>a.side===side&&a.skill==="Serve");
   section(`TACTICAL ANALYSIS - SERVICE ZONE / DIRECTION - ${side} (${name})`,["Dimensi","Kategori","Total Service","Ace","Positive","In Play","Error","Ace %"]);
   const serveGroups:[string,(a:any)=>string][]=[["ZONA SASARAN SERVICE",a=>a.target||"Tidak diisi"],["ARAH SERVICE",a=>a.direction||"Tidak diisi"],["ROTASI SERVER",a=>`R${a.rot||"?"}`],["PEMAIN SERVER",a=>`#${a.player?.number||"?"} ${a.player?.name||""}`]];
   serveGroups.forEach(([dim,key])=>{const vals=Array.from(new Set(sv.map(key)));vals.forEach(val=>{const aa=sv.filter(a=>key(a)===val),ace=aa.filter(a=>a.result==="Ace").length;rows.push([dim,val,aa.length,ace,aa.filter(a=>a.result==="Positive (+)").length,aa.filter(a=>a.result==="In Play").length,aa.filter(a=>a.result==="Error").length,aa.length?Math.round(ace/aa.length*100):0]);});});
   const st=allActions.filter(a=>a.side===side&&a.skill==="Set");
   section(`TACTICAL ANALYSIS - SET / TOSS TARGET & TEMPO - ${side} (${name})`,["Dimensi","Kategori","Total Set","Perfect","Good","Poor","Error"]);
   const setGroups:[string,(a:any)=>string][]=[["TARGET TOS",a=>a.target||"Tidak diisi"],["TEMPO TOS",a=>a.tempo||"Tidak diisi"],["ROTASI SETTER",a=>`R${a.rot||"?"}`],["PEMAIN SETTER",a=>`#${a.player?.number||"?"} ${a.player?.name||""}`]];
   setGroups.forEach(([dim,key])=>{const vals=Array.from(new Set(st.map(key)));vals.forEach(val=>{const aa=st.filter(a=>key(a)===val);rows.push([dim,val,aa.length,aa.filter(a=>a.result==="Perfect (3)").length,aa.filter(a=>a.result==="Good (2)").length,aa.filter(a=>a.result==="Poor (1)").length,aa.filter(a=>a.result==="Error (0)").length]);});});
  });
  section("ROTATION / LINEUP NOTES",["Informasi","Nilai"]);
  rows.push(["Urutan rotasi resmi","P1 → P6 → P5 → P4 → P3 → P2 → P1"],["Service pertama per set",...Object.entries(firstServers).sort((a,b)=>Number(a[0])-Number(b[0])).map(([s,v])=>`Set ${s}: ${v}`)],["Catatan interpretasi","Rekap rotasi memakai nilai rotasi yang terekam pada aksi pemain di setiap rally. Akurasi analisis bergantung pada kelengkapan input skill, hasil, target, arah, dan tempo."]);
  const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`volleyball-scout-${match.homeName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-vs-${match.awayName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-full-analysis.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 const exportMatchWord=()=>{const esc=(v:any)=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!));const zoneNote=(a:any)=>a.zoneNote||(a.skill==="Attack"||a.skill==="Serve"?(a.target||a.direction?[a.target,a.direction].filter(Boolean).join(" • "):""):a.skill==="Set"?(a.target||a.tempo?[a.target,a.tempo].filter(Boolean).join(" • "):""):"");const sets=setScores.map(x=>`<tr><td>${x.set}</td><td>${x.home}</td><td>${x.away}</td></tr>`).join("");const acts=rallies.flatMap(r=>r.actions.map(a=>`<tr><td>${r.set}</td><td>${r.id}</td><td>${esc(a.side)}</td><td>${esc(a.player?.number)}</td><td>${esc(a.player?.name)}</td><td>${esc(a.pos)}</td><td>${esc(a.rot)}</td><td>${esc(a.skill)}</td><td>${esc(a.result)}</td><td>${esc(a.target)}</td><td>${esc(a.direction)}</td><td>${esc(zoneNote(a))}</td></tr>`)).join("");const html=`<html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #777;padding:6px;font-size:10pt}th{background:#dce8f2}
/* V74 layout refinement: code input above quick actions; compact action picker; shorter court */
.quickCodeArea{display:flex!important;flex-direction:column!important;gap:10px!important}
.quickCodeArea>.codeScout{order:1!important;margin:0!important}
.quickCodeArea>.quickActionBlock{order:2!important}
.quickActionBlock .ph{display:flex;justify-content:space-between;align-items:center;padding:8px 12px}
.quickActionBlock .quick{margin:0 8px 8px!important}
.courtPanel>.actionPicker{grid-column:1!important;grid-row:2!important;width:min(255px,100%)!important;max-width:255px!important;justify-self:end!important;align-self:end!important;margin:8px 6px 14px!important;min-width:0!important}
.courtPanel>.actionPicker .skills{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;padding:7px!important}
.courtPanel>.actionPicker .skill{min-height:38px!important;font-size:9px!important;padding:4px!important}
.courtPanel>.courtBox{grid-column:2!important;grid-row:2!important}
.courtPanel .liberoCourtLayout{max-width:385px!important;grid-template-columns:42px minmax(0,1fr)!important;gap:4px!important}
.courtPanel .proCourt{width:min(340px,100%)!important;aspect-ratio:10/14!important;padding:11px 7px!important;grid-template-rows:1fr 1fr 12px 1fr 1fr!important}
.courtPanel .courtPlayer{width:min(60px,92%)!important;min-height:44px!important}
@media(max-width:1050px){.courtPanel>.actionPicker{grid-column:1!important;grid-row:3!important;justify-self:center!important;width:min(255px,100%)!important;margin:8px auto!important}.courtPanel>.courtBox{grid-column:1!important;grid-row:2!important}.courtPanel .proCourt{width:min(340px,100%)!important}}
@media(max-width:760px){.courtPanel .proCourt{width:min(320px,100%)!important;aspect-ratio:10/14!important}.courtPanel .courtPlayer{width:52px!important;min-height:40px!important}}
</style></head><body><h1>AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</h1><h2>Laporan Statistik Pertandingan</h2><p>${esc(match.homeName)} vs ${esc(match.awayName)}</p><p>${esc(match.competition)} | ${esc(match.date)} | ${esc(match.venue)}</p><h3>Rekap Skor Set</h3><table><tr><th>Set</th><th>HOME</th><th>AWAY</th></tr>${sets}</table><h3>Detail Scouting</h3><table><tr><th>Set</th><th>Rally</th><th>Tim</th><th>No</th><th>Nama</th><th>Pos</th><th>Rotasi</th><th>Skill</th><th>Hasil</th><th>Target</th><th>Arah</th><th>Keterangan Zona/Arah Otomatis</th></tr>${acts}</table></body></html>`;const blob=new Blob([html],{type:"application/msword"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="volleyball-scout-pro-laporan.doc";a.click();URL.revokeObjectURL(url);};
 const exportMatchPDF=()=>{
  const esc=(v:any)=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]!));
  const all=rallies.flatMap(r=>r.actions.map(a=>({...a,setNo:r.set,rallyId:r.id,winner:r.winner})));
  const teamSummary=(team:Side)=>{
   const a=all.filter(x=>x.side===team);const count=(skill:string,result?:string)=>a.filter(x=>x.skill===skill&&(!result||x.result===result)).length;
   const att=count("Attack"),kill=count("Attack","Kill"),err=count("Attack","Error"),blocked=count("Attack","Blocked"),serve=count("Serve"),ace=count("Serve","Ace"),se=count("Serve","Error"),rec=count("Reception"),recp=count("Reception","Perfect (3)")+count("Reception","Good (2)");
   return `<tr><td>${team}</td><td>${esc(team==="HOME"?match.homeName:match.awayName)}</td><td>${att}</td><td>${kill}</td><td>${att?Math.round((kill-err-blocked)/att*100):0}%</td><td>${ace}</td><td>${se}</td><td>${recp}/${rec}</td><td>${count("Block","Block Kill")}</td></tr>`;
  };
  const playerRows=(["HOME","AWAY"] as Side[]).map(team=>{
   const roster=team==="HOME"?homePlayers:awayPlayers;
   return `<h3>${team} — ${esc(team==="HOME"?match.homeName:match.awayName)}</h3><table><thead><tr><th>No.</th><th>Pemain</th><th>Posisi</th><th>Attack</th><th>Kill</th><th>Error</th><th>Blocked</th><th>Eff.</th><th>Serve</th><th>Ace</th><th>Serv Err</th><th>Receive</th><th>Rec+</th><th>Set</th><th>Set+</th><th>Block Kill</th></tr></thead><tbody>${roster.map(p=>{const a=all.filter(x=>x.side===team&&x.player?.id===p.id);const n=(sk:string,res?:string)=>a.filter(x=>x.skill===sk&&(!res||x.result===res)).length;const at=n("Attack"),k=n("Attack","Kill"),e=n("Attack","Error"),b=n("Attack","Blocked"),rec=n("Reception"),rp=n("Reception","Perfect (3)")+n("Reception","Good (2)"),sets=n("Set"),sp=n("Set","Perfect (3)")+n("Set","Good (2)");return `<tr><td>${p.number}</td><td>${esc(p.name)}</td><td>${esc(p.role)}</td><td>${at}</td><td>${k}</td><td>${e}</td><td>${b}</td><td>${at?Math.round((k-e-b)/at*100):0}%</td><td>${n("Serve")}</td><td>${n("Serve","Ace")}</td><td>${n("Serve","Error")}</td><td>${rec}</td><td>${rp}</td><td>${sets}</td><td>${sp}</td><td>${n("Block","Block Kill")}</td></tr>`}).join("")}</tbody></table>`;
  }).join("");
  const setRows=Array.from(new Set(rallies.map(r=>r.set))).sort((a,b)=>a-b).map(set=>{const rr=rallies.filter(r=>r.set===set);const h=rr.filter(r=>r.winner==="HOME").length,aw=rr.filter(r=>r.winner==="AWAY").length;const saved=setScores.find(x=>x.set===set);return `<tr><td>${set}</td><td>${saved?.home??(rr.at(-1)?.after?.home??"-")}</td><td>${saved?.away??(rr.at(-1)?.after?.away??"-")}</td><td>${rr.length}</td><td>${h}</td><td>${aw}</td></tr>`}).join("");
  const actionRows=all.map(a=>`<tr><td>${a.setNo}</td><td>${a.rallyId}</td><td>${a.side}</td><td>${a.player?.number??""}</td><td>${esc(a.player?.name)}</td><td>${esc(a.player?.role)}</td><td>${esc(a.skill)}</td><td>${esc(a.result)}</td><td>${esc(a.target)}</td><td>${esc(a.direction||a.tempo)}</td><td>${a.rot??""}</td><td>${esc(a.timestamp)}</td></tr>`).join("");
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Volleyball Scout Pro</title><style>body{font:11px Arial,sans-serif;color:#172331;margin:22px}h1{margin:0 0 5px;color:#123b59}h2{margin:22px 0 8px;border-bottom:2px solid #168c91;padding-bottom:5px}h3{margin:16px 0 6px}p{color:#526477}table{border-collapse:collapse;width:100%;margin:7px 0 15px;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #aab7c2;padding:5px;text-align:left;font-size:9px}th{background:#e6eef4} .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px}.note{font-size:9px;color:#607080}@media print{button{display:none}body{margin:12mm}@page{size:A4 landscape;margin:10mm}}</style></head><body><h1>AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</h1><b>LAPORAN ANALISIS PERTANDINGAN</b><div class="meta"><p><b>HOME:</b> ${esc(match.homeName)}<br><b>AWAY:</b> ${esc(match.awayName)}</p><p><b>Kompetisi:</b> ${esc(match.competition)}<br><b>Tanggal:</b> ${esc(match.date)}<br><b>Venue:</b> ${esc(match.venue||"-")}</p></div><h2>Ringkasan Tim</h2><table><thead><tr><th>Tim</th><th>Nama</th><th>Attack</th><th>Kill</th><th>Eff.</th><th>Ace</th><th>Serve Error</th><th>Receive +/Total</th><th>Block Kill</th></tr></thead><tbody>${teamSummary("HOME")}${teamSummary("AWAY")}</tbody></table><h2>Statistik Per Set</h2><table><thead><tr><th>Set</th><th>HOME</th><th>AWAY</th><th>Rally</th><th>HOME W</th><th>AWAY W</th></tr></thead><tbody>${setRows||"<tr><td colspan='6'>Belum ada rally.</td></tr>"}</tbody></table><h2>Statistik Per Pemain</h2>${playerRows}<h2>Distribusi Setter</h2><table><thead><tr><th>Tim</th><th>Setter</th><th>Target Umpan</th><th>Tempo</th><th>Jumlah</th></tr></thead><tbody>${all.filter(a=>a.skill==="Set").map(a=>`<tr><td>${a.side}</td><td>#${a.player?.number} ${esc(a.player?.name)}</td><td>${esc(a.target||"Tidak diisi")}</td><td>${esc(a.tempo||"Tidak diisi")}</td><td>1</td></tr>`).join("")||"<tr><td colspan='5'>Belum ada data set.</td></tr>"}</tbody></table><h2>Detail Input Scouting</h2><table><thead><tr><th>Set</th><th>Rally</th><th>Tim</th><th>No</th><th>Nama</th><th>Role</th><th>Skill</th><th>Hasil</th><th>Target</th><th>Arah/Tempo</th><th>Rotasi</th><th>Waktu</th></tr></thead><tbody>${actionRows}</tbody></table><p class="note">Laporan dibuat dari aksi scouting yang tersimpan. Persentase dihitung berdasarkan total percobaan pada kategori terkait. Untuk menyimpan sebagai PDF, pilih tujuan printer “Save as PDF / Simpan sebagai PDF”.</p><script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`;
  const w=window.open("","_blank");if(!w){window.alert("Popup diblokir browser. Izinkan popup untuk membuat PDF.");return;}w.document.open();w.document.write(html);w.document.close();
 };
 const changeSet=(n:number)=>{if(open){window.alert("Selesaikan atau batalkan rally sebelum berpindah set.");return;}if(n===setNo)return;setSetNo(n);setScore({home:0,away:0});setRot({home:1,away:1});setHomeCourt(homeLineup.map(p=>({...p})));setAwayCourt(awayLineup.map(p=>({...p})));setHomeLibero(null);setAwayLibero(null);setLiberoBackup({home:null,away:null});setSubHistory([]);setServer(firstServers[n]||"HOME");setSelected(null);setQuickSkill(null);setSkill(null);};
 // Roster handlers belong to App because the roster editor is rendered in Live Scouting.
 const addRosterPlayer=(team:Side)=>{
  const list=team==="HOME"?homePlayers:awayPlayers;
  if(list.length>=25){window.alert("Maksimal 25 pemain per tim.");return;}
  const used=new Set(list.map(p=>p.number));let next=1;while(used.has(next))next++;
  const fresh:Player={id:Date.now()+Math.floor(Math.random()*1000),number:next,name:"",role:"OH"};
  if(team==="HOME")setHomePlayers(r=>[...r,fresh]);else setAwayPlayers(r=>[...r,fresh]);
 };
 const finishSetup=()=>{
  if(homePlayers.length<6||awayPlayers.length<6){window.alert("Setiap tim minimal memiliki 6 pemain di roster.");return;}
  if(homePlayers.some(p=>!p.name.trim())||awayPlayers.some(p=>!p.name.trim())){window.alert("Lengkapi nama seluruh pemain roster terlebih dahulu.");return;}
  for(const [team,list] of [["HOME",homePlayers],["AWAY",awayPlayers]] as [string,Player[]][]) {
   if(list.some(p=>!Number.isInteger(p.number)||p.number<=0)){window.alert(`Nomor punggung ${team} harus berupa angka positif.`);return;}
   if(new Set(list.map(p=>p.number)).size!==list.length){window.alert(`Nomor punggung ${team} tidak boleh duplikat.`);return;}
  }
  setHomeCourtNumbers(emptyStarterNumbers());setAwayCourtNumbers(emptyStarterNumbers());setHomeLiberoNumbers(["",""]);setAwayLiberoNumbers(["",""]);
  setHomeLineup(emptyCourt("HOME"));setAwayLineup(emptyCourt("AWAY"));
  setHomeCourt(emptyCourt("HOME"));setAwayCourt(emptyCourt("AWAY"));
  setHomeLibero(null);setAwayLibero(null);setSelected(null);setQuickSkill(null);setRosterReady(true);
  window.alert("Daftar pemain tersimpan. Sekarang masukkan nomor punggung enam pemain awal HOME dan AWAY. Pemain akan muncul di lapangan satu per satu setelah menekan Enter.");
 };
 const selectStartingPlayer=(team:Side,posNo:number,raw:string)=>{
  const number=Number(raw.trim());
  if(!raw.trim()||!Number.isInteger(number)||number<=0){window.alert("Masukkan nomor punggung berupa angka positif.");return;}
  const roster=team==="HOME"?homePlayers:awayPlayers;
  const player=roster.find(p=>p.number===number);
  if(!player){window.alert(`Nomor ${number} tidak ditemukan pada roster ${team}.`);return;}
  if(player.role==="L"){window.alert("Untuk roster awal, pilih enam pemain non-libero. Libero dapat dimasukkan setelah susunan pemain terbentuk.");return;}
  const current=team==="HOME"?homeCourt:awayCourt;
  if(current.some((p,i)=>i!==posNo-1&&p.id===player.id)){window.alert("Pemain ini sudah dipilih di posisi lain.");return;}
  const next=[...current];next[posNo-1]=player;
  if(team==="HOME"){setHomeCourt(next);setHomeLineup(next);setHomeCourtNumbers(a=>a.map((v,i)=>i===posNo-1?String(number):v));}
  else {setAwayCourt(next);setAwayLineup(next);setAwayCourtNumbers(a=>a.map((v,i)=>i===posNo-1?String(number):v));}
  setSide(team);setSelected(player.id);setQuickSkill(null);
 };
 const applyStartingRoster=()=>{
  const build=(team:Side,nums:string[],libNums:string[])=>{
   const roster=team==="HOME"?homePlayers:awayPlayers;
   const selected:Player[]=[];
   for(let i=0;i<6;i++){
    const raw=(nums[i]||"").trim();
    if(!raw){selected.push(emptyCourt(team)[i]);continue;}
    const number=Number(raw);const p=roster.find(x=>x.number===number);
    if(!p){window.alert(`Nomor ${raw} tidak ditemukan pada roster ${team}.`);return null;}
    if(p.role==="L"){window.alert(`Nomor ${raw} adalah libero. Isi libero pada kolom Libero 1 atau Libero 2.`);return null;}
    if(selected.some(x=>x.id===p.id)){window.alert(`Pemain nomor ${raw} dipilih lebih dari satu kali di ${team}.`);return null;}
    selected.push(p);
   }
   const libPlayers:(Player|null)[]=[];
   for(let i=0;i<2;i++){
    const raw=(libNums[i]||"").trim();if(!raw){libPlayers.push(null);continue;}
    const p=roster.find(x=>x.number===Number(raw));
    if(!p){window.alert(`Nomor libero ${raw} tidak ditemukan pada roster ${team}.`);return null;}
    if(p.role!=="L"){window.alert(`Nomor ${raw} bukan pemain dengan role L/libero.`);return null;}
    if(libPlayers.some(x=>x?.id===p.id)){window.alert(`Libero nomor ${raw} dipilih dua kali.`);return null;}
    libPlayers.push(p);
   }
   return {selected,libPlayers};
  };
  const h=build("HOME",homeCourtNumbers,homeLiberoNumbers);if(!h)return;
  const a=build("AWAY",awayCourtNumbers,awayLiberoNumbers);if(!a)return;
  setHomeCourt(h.selected);setHomeLineup(h.selected);setAwayCourt(a.selected);setAwayLineup(a.selected);
  setHomeLibero(h.libPlayers[0]?.id??h.libPlayers[1]?.id??null);setAwayLibero(a.libPlayers[0]?.id??a.libPlayers[1]?.id??null);
  setSelected(null);setQuickSkill(null);
  window.alert("Roster awal diterapkan ke lapangan. Kolom Libero 1 menjadi libero aktif; Libero 2 dicatat sebagai pilihan cadangan.");
 };
 const setLiberoNumber=(team:Side,index:number,raw:string)=>{
  const value=raw.replace(/[^0-9]/g,"");(team==="HOME"?setHomeLiberoNumbers:setAwayLiberoNumbers)(arr=>arr.map((v,i)=>i===index?value:v));
 };
 const substituteByDoubleClick=(team:Side,posNo:number)=>{
  const current=team==="HOME"?homeCourt:awayCourt;
  const roster=team==="HOME"?homePlayers:awayPlayers;
  const outgoing=current[posNo-1];
  if(!outgoing||outgoing.id<0){window.alert("Isi nomor punggung roster awal untuk posisi ini terlebih dahulu.");return;}
  const raw=window.prompt(`Ganti P${posNo} — ${outgoing.number} ${outgoing.name}\nMasukkan nomor punggung pemain pengganti dari tim ${team}:`);
  if(raw===null)return;
  const number=Number(raw.trim());
  if(!raw.trim()||!Number.isInteger(number)){window.alert("Masukkan nomor punggung berupa angka.");return;}
  const incoming=roster.find(p=>p.number===number);
  if(!incoming){window.alert(`Nomor punggung ${number} tidak ditemukan di roster ${team}.`);return;}
  if(incoming.id===outgoing.id){window.alert("Pemain tersebut sudah berada di posisi ini.");return;}
  if(current.some((p,i)=>i!==posNo-1&&p.id===incoming.id)){window.alert("Pemain tersebut sudah berada di lapangan. Pilih pemain cadangan.");return;}
  if(incoming.role==="L"&&![1,5,6].includes(posNo)){window.alert("Libero hanya boleh menggantikan pemain baris belakang: P1, P5, atau P6.");return;}
  if(incoming.role==="L"){
   const liberoId=team==="HOME"?homeLibero:awayLibero;
   if(liberoId!==null&&liberoId!==incoming.id){window.alert("Pilih libero yang sudah ditetapkan di Starting Lineup, atau gunakan pemain non-libero.");return;}
   setLiberoBackup(b=>team==="HOME"?{...b,home:outgoing}:{...b,away:outgoing});
  } else if(outgoing.role==="L") {
   setLiberoBackup(b=>team==="HOME"?{...b,home:null}:{...b,away:null});
  }
  const setter=team==="HOME"?setHomeCourt:setAwayCourt;
  setter(current.map((p,i)=>i===posNo-1?incoming:p));
  setSubHistory(h=>[...h,{id:Date.now(),team,type:incoming.role==="L"?"LIBERO IN":outgoing.role==="L"?"LIBERO OUT":"SUBSTITUTION",pos:posNo,outPlayer:outgoing,inPlayer:incoming}]);
  setSide(team);setSelected(incoming.id);setQuickSkill(null);
 };
 return <div className={dark?"app theme-dark":"app theme-light"}><aside className="side">
  <div className="brand"><div className="logo" aria-label="AVS Alvis Volleyball Scouting"><span>AVS</span><i></i></div><div><b>ALVIS</b><small>VOLLEYBALL SCOUTING</small></div></div>
  {["Live Scouting","Roster Pemain","Dashboard","Matches","Statistics","Tactical Analysis","Rotation Center","Match Replay","Advanced Analysis","Reports","Settings"].map(x=><button className={page===x?"nav active":"nav"} onClick={()=>setPage(x)} key={x}>{x}</button>)}
  <div className="bottom">● Offline-ready<br/>Data tersimpan otomatis<br/>V82 • Quick History & Undo • Rally Code Input + Instant Click Libero Swap + Auto Return + Rear-row Replacement • Bare Jersey Numbers • Advanced Analysis • Replay • Tactical Analysis • Performance • Full Statistics • Substitution • Libero</div>
 </aside><main className="main">
  <div className="head"><div><div className="ey">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</div><h1>{page}</h1></div><div className="actions"><button className="btn themeToggle" aria-label={dark?"Aktifkan mode terang":"Aktifkan mode gelap"} onClick={()=>setDark(v=>!v)}>{dark?"☀ MODE TERANG":"☾ MODE GELAP"}</button></div></div>
  {page==="Roster Pemain"?<div className="rosterPage"><div className="hero"><div><div className="tag">TEAM MANAGEMENT</div><h2>ROSTER PEMAIN</h2><p>Kelola daftar pemain HOME dan AWAY. Perubahan tetap tersimpan otomatis dan digunakan oleh Live Scouting serta Starting Lineup.</p></div><div className="miniActions"><button className="primary" onClick={()=>setPage("Live Scouting")}>KEMBALI KE LIVE SCOUTING</button></div></div>   <details open className="panel liveRoster rosterPageCard" style={{marginTop:10,padding:18}}><summary style={{cursor:"pointer",fontWeight:800,color:"#8fd7ff",fontSize:15}}>👥 ROSTER PEMAIN — EDIT NOMOR, NAMA & POSISI (BUKA/TUTUP)</summary><p style={{color:"#a9c5da",margin:"8px 0 12px"}}>Masukkan daftar lengkap pemain HOME dan AWAY terlebih dahulu. Setelah disimpan, pilih enam pemain awal untuk setiap tim pada bagian ROSTER AWAL dengan mengetik nomor punggung saja. Pemain tidak muncul di lapangan sebelum nomornya dimasukkan dan Enter ditekan.</p><div className="teamGrid"><div className="wide"><div className="sectionTitle"><h3>{match.homeName} — ROSTER HOME</h3><button className="btn primary" disabled={homePlayers.length>=25} onClick={()=>setHomePlayers(r=>[...r,{id:Date.now(),number:r.length+1,name:"",role:"OH"}])}>＋ PEMAIN</button></div><div className="rosterEdit rosterHeader"><b>NO. PUNGGUNG</b><b>NAMA PEMAIN</b><b>POSISI / ROLE</b></div>{homePlayers.map(p=><div className="rosterEdit" key={p.id}><input aria-label="Nomor punggung HOME" className="numInput" value={p.number} onChange={e=>setHomePlayers(r=>r.map(x=>x.id===p.id?{...x,number:Number(e.target.value)||0}:x))}/><input aria-label="Nama pemain HOME" className="editInput" value={p.name} placeholder="Masukkan nama pemain" onChange={e=>setHomePlayers(r=>r.map(x=>x.id===p.id?{...x,name:e.target.value}:x))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addRosterPlayer("HOME")}}}/><select aria-label="Posisi pemain HOME" className="editInput" value={p.role} onChange={e=>setHomePlayers(r=>r.map(x=>x.id===p.id?{...x,role:e.target.value}:x))}><option>OH</option><option>OP</option><option>S</option><option>MB</option><option>L</option></select></div>)}<small>Minimal 6 • Maksimal 25 pemain.</small></div><div className="wide"><div className="sectionTitle"><h3>{match.awayName} — ROSTER AWAY</h3><button className="btn primary" disabled={awayPlayers.length>=25} onClick={()=>setAwayPlayers(r=>[...r,{id:Date.now(),number:r.length+1,name:"",role:"OH"}])}>＋ PEMAIN</button></div><div className="rosterEdit rosterHeader"><b>NO. PUNGGUNG</b><b>NAMA PEMAIN</b><b>POSISI / ROLE</b></div>{awayPlayers.map(p=><div className="rosterEdit" key={p.id}><input aria-label="Nomor punggung AWAY" className="numInput" value={p.number} onChange={e=>setAwayPlayers(r=>r.map(x=>x.id===p.id?{...x,number:Number(e.target.value)||0}:x))}/><input aria-label="Nama pemain AWAY" className="editInput" value={p.name} placeholder="Masukkan nama pemain" onChange={e=>setAwayPlayers(r=>r.map(x=>x.id===p.id?{...x,name:e.target.value}:x))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addRosterPlayer("AWAY")}}}/><select aria-label="Posisi pemain AWAY" className="editInput" value={p.role} onChange={e=>setAwayPlayers(r=>r.map(x=>x.id===p.id?{...x,role:e.target.value}:x))}><option>OH</option><option>OP</option><option>S</option><option>MB</option><option>L</option></select></div>)}<small>Minimal 6 • Maksimal 25 pemain.</small></div></div><div style={{marginTop:12}}><button className="btn primary" onClick={finishSetup}>SIMPAN DAFTAR PEMAIN →</button></div></details></div>:page==="Starting Lineup"?<div className="lineupWrap"><LineupEditor team="HOME" name={match.homeName} roster={homePlayers} lineup={homeLineup} libero={homeLibero} setLineup={setHomeLineup} setLibero={setHomeLibero} otherLineup={awayLineup} onLive={()=>setPage("Live Scouting")}/><LineupEditor team="AWAY" name={match.awayName} roster={awayPlayers} lineup={awayLineup} libero={awayLibero} setLineup={setAwayLineup} setLibero={setAwayLibero} otherLineup={homeLineup} onLive={()=>setPage("Live Scouting")}/></div> : page!=="Live Scouting"?<Simple page={page} score={score} stats={stats} rallies={rallies} setScores={setScores} players={playerStats} attackMap={attackMap} rotationStats={rotationStats} side={side} setNo={setNo} match={match} homePlayers={homePlayers} awayPlayers={awayPlayers} setMatch={setMatch} setHomePlayers={setHomePlayers} setAwayPlayers={setAwayPlayers} homeLineup={homeLineup} awayLineup={awayLineup} homeLibero={homeLibero} awayLibero={awayLibero} setHomeLineup={setHomeLineup} setAwayLineup={setAwayLineup} setHomeLibero={setHomeLibero} setAwayLibero={setAwayLibero} onLive={()=>setPage("Live Scouting")} onSetupDone={()=>setPage("Starting Lineup")}/>:<>

   <section className="panel rosterShortcut"><div><strong>👥 ROSTER PEMAIN</strong><small>Edit nomor punggung, nama, dan posisi pemain HOME/AWAY di halaman khusus agar Live Scouting tetap ringkas.</small></div><button className="btn primary" onClick={()=>setPage("Roster Pemain")}>BUKA ROSTER PEMAIN →</button></section>
   {rosterReady&&<section className="panel" style={{marginTop:10,padding:14}}><div className="sectionTitle"><div><h3>ROSTER AWAL — 6 PEMAIN + 2 LIBERO</h3><small>Isi nomor punggung untuk P1–P6. Dua kolom tambahan khusus libero. Tekan Enter pada kolom untuk memasukkan pemain, atau tekan tombol TERAPKAN ROSTER KE LAPANGAN untuk menerapkan semua input sekaligus.</small></div><button className="btn" onClick={()=>{setHomeCourtNumbers(emptyStarterNumbers());setAwayCourtNumbers(emptyStarterNumbers());setHomeLiberoNumbers(["",""]);setAwayLiberoNumbers(["",""]);setHomeCourt(emptyCourt("HOME"));setAwayCourt(emptyCourt("AWAY"));setHomeLineup(emptyCourt("HOME"));setAwayLineup(emptyCourt("AWAY"));setHomeLibero(null);setAwayLibero(null);setSelected(null);setQuickSkill(null)}}>KOSONGKAN ROSTER AWAL</button></div><div className="teamGrid">{([{team:"HOME" as Side,name:match.homeName,nums:homeCourtNumbers,libNums:homeLiberoNumbers,court:homeCourt,roster:homePlayers},{team:"AWAY" as Side,name:match.awayName,nums:awayCourtNumbers,libNums:awayLiberoNumbers,court:awayCourt,roster:awayPlayers}]).map(t=><div className="wide" key={t.team}><div className="sectionTitle"><h3>{t.name} — INPUT ROSTER AWAL</h3><b className="courtCountBadge">{t.court.filter(p=>p.id>0).length}/6 PEMAIN DI LAPANGAN</b></div><div className="starterGrid">{[1,2,3,4,5,6].map(posNo=><label key={posNo} className="starterField">P{posNo}<input className="editInput" inputMode="numeric" placeholder={`Nomor P${posNo}`} value={t.nums[posNo-1]} onChange={e=>{const value=e.target.value.replace(/[^0-9]/g,"");(t.team==="HOME"?setHomeCourtNumbers:setAwayCourtNumbers)(arr=>arr.map((v,i)=>i===posNo-1?value:v))}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();selectStartingPlayer(t.team,posNo,t.nums[posNo-1])}}}/><small>{t.court[posNo-1]?.id>0?`${t.court[posNo-1].number} • ${t.court[posNo-1].name} • ${t.court[posNo-1].role}`:"Belum diisi"}</small></label>)}</div><h4 style={{margin:"12px 0 8px",color:"#8fd7ff"}}>LIBERO (2 SLOT)</h4><div className="starterGrid">{[0,1].map(i=><label key={i} className="starterField">{`LIBERO ${i+1}`}<input className="editInput" inputMode="numeric" placeholder={`Nomor libero ${i+1}`} value={t.libNums[i]} onChange={e=>setLiberoNumber(t.team,i,e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();const raw=t.libNums[i].trim();if(!raw)return;const p=t.roster.find(x=>x.number===Number(raw));if(!p||p.role!=="L"){window.alert(`Nomor ${raw} harus terdaftar sebagai libero (role L) di tim ${t.team}.`);return;}if(i===0){(t.team==="HOME"?setHomeLibero:setAwayLibero)(p.id);}window.alert(`Libero ${p.number} ${p.name} tercatat.`);}}}/><small>{t.libNums[i]?(()=>{const p=t.roster.find(x=>x.number===Number(t.libNums[i]));return p?`${p.name} • ${p.role}`:"Nomor belum ditemukan"})():"Opsional • role harus L"}</small></label>)}</div><p style={{color:"#9db9cc",fontSize:11,marginBottom:0}}>Masukkan nomor dari roster {t.team}. Enter pada P1–P6 memasukkan pemain ke lapangan; tombol di bawah menerapkan seluruh roster awal.</p></div>)}</div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button className="btn primary" onClick={applyStartingRoster}>✓ TERAPKAN ROSTER KE LAPANGAN</button><button className="btn" onClick={()=>{setHomeCourtNumbers(emptyStarterNumbers());setAwayCourtNumbers(emptyStarterNumbers());setHomeCourt(emptyCourt("HOME"));setAwayCourt(emptyCourt("AWAY"));setHomeLineup(emptyCourt("HOME"));setAwayLineup(emptyCourt("AWAY"));setSelected(null);setQuickSkill(null)}}>RESET 6 PEMAIN LAPANGAN</button></div></section>}
   <div className="subBar"><div><b>SUBSTITUSI / LIBERO</b><small>Ketik nomor punggung pemain masuk lalu tekan Enter atau tombol substitusi. Libero hanya dapat masuk P1, P5, atau P6.</small></div><select value={subPos} onChange={e=>setSubPos(+e.target.value)}>{[1,2,3,4,5,6].map(p=><option key={p} value={p}>P{p} • {players[p-1]?.number} {players[p-1]?.name}</option>)}</select><select value={swapPos} onChange={e=>setSwapPos(+e.target.value)}>{[1,2,3,4,5,6].map(p=><option key={p} value={p}>Tukar dengan P{p}</option>)}</select><input className="editInput" style={{maxWidth:150}} inputMode="numeric" placeholder="Nomor masuk" value={subNumber} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,"");setSubNumber(v);const roster=side==="HOME"?homePlayers:awayPlayers;const found=roster.find(p=>p.number===Number(v)&&!players.some(c=>c.id===p.id)&&p.role!=="L");setSubIn(found?.id??null)}} onKeyDown={e=>{if(e.key==="Enter"&&subIn){substitute(side,subPos,subIn);setSubNumber("");setSubIn(null)}}}/><button className="btn primary" onClick={()=>{substitute(side,subPos,subIn);setSubNumber("");setSubIn(null)}} disabled={!subIn}>SUBSTITUSI → P{subPos}</button><button className="btn" onClick={()=>liberoSwap(side,subPos)} disabled={!(side==="HOME"?homeLibero:awayLibero)||![1,5,6].includes(subPos)||!!(side==="HOME"?liberoBackup.home:liberoBackup.away)}>LIBERO MASUK</button><button className="btn" onClick={()=>liberoOut(side)} disabled={!(side==="HOME"?liberoBackup.home:liberoBackup.away)}>LIBERO KELUAR</button><button className="btn" onClick={()=>rotateTeam(side)}>↻ TES ROTASI</button></div><div className="subPanel"><h4>ROTASI & PENEMPATAN PEMAIN</h4><div className="subGrid"><button onClick={()=>randomizeCourt("HOME")}>🔀 ACAK HOME</button><button onClick={()=>randomizeCourt("AWAY")}>🔀 ACAK AWAY</button><button onClick={()=>swapCourtPositions(side,subPos,swapPos)} disabled={subPos===swapPos}>↔ TUKAR P{swapPos}</button></div><div className="benchList">{(side==="HOME"?homePlayers:awayPlayers).filter(p=>!(side==="HOME"?homeCourt:awayCourt).some(c=>c.id===p.id)).map(p=><span className="benchChip" key={p.id}>BENCH #{p.number} {p.name}</span>)}</div></div>
   {open&&<div className="rally"><div><b className="live">● RALLY #{rallies.length+1} BERLANGSUNG</b> <small>{open.actions.length} aksi</small>{open.actions.length>0&&<span className="muted"> • Terakhir: {open.actions[open.actions.length-1].skill} — {open.actions[open.actions.length-1].result}</span>}</div><div className="rallyBtns"><button className="btn primary" onClick={()=>finish("HOME")}>POINT HOME</button><button className="btn danger" onClick={()=>finish("AWAY")}>POINT AWAY</button><button className="btn" onClick={autoFinish}>FINISH OTOMATIS</button><button className="btn" onClick={undoAction} disabled={!open.actions.length}>↶ UNDO AKSI</button><button className="btn" onClick={()=>{setOpen(null);setSkill(null)}}>BATAL</button></div></div>}
   <section className="panel courtPanel"><div className="ph"><span>FULL COURT • ROTASI HOME R{rot.home} / AWAY R{rot.away}</span><b>{pendingLibero?`LIBERO DIPILIH: klik pemain belakang P1, P5, atau P6 tim ${pendingLibero.team} untuk menggantinya`:(selected?`Pilih aksi untuk ${player.number} ${player.name}`:"Klik 1× untuk aksi • klik 2× untuk ganti pemain dengan nomor punggung")}</b></div>   
<VideoAnalysisPanel/><div className="courtBox"><div className="liberoCourtLayout"><div className="liberoRail awayLiberoRail">{[0,1].map(i=>{const raw=awayLiberoNumbers[i];const libero=awayPlayers.find(x=>x.number===Number(raw)&&x.role==="L");const backup=liberoBackup.away;const p=backup&&i===0?awayPlayers.find(x=>x.id===backup):libero;const active=!!backup&&i===0;return <button type="button" key={i} className={`liberoCourtSlot awayLiberoSlot ${p?"hasLibero":""} ${active?"liberoReturning":""}`} onClick={()=>clickLiberoSlot("AWAY",i)} title={active?"Klik untuk mengembalikan pemain belakang ke lapangan":"Klik, lalu pilih pemain belakang"}><span>{active?"PEMAIN KELUAR":`LIBERO ${i+1}`}</span><strong>{p?p.number:"—"}</strong><b>{p?p.name:"Belum diisi"}</b><small>{active?"KLIK UNTUK KEMBALI":p?"KLIK UNTUK MASUK":"SLOT LIBERO"}</small></button>})}</div><div className="proCourt"><div className="courtLabel awayLabel">{match.awayName} <small>AWAY</small></div><div className="courtLabel homeLabel">{match.homeName} <small>HOME</small></div><div className="netLine"><span>NET</span></div>{match.scoutingMode!=="HOME"&&awayCourt.map((p,i)=><CourtPlayer key={p.id} p={p} pos={i+1} selected={side==="AWAY"&&p.id===selected} team="AWAY" server={server} onClick={()=>handleCourtPlayerClick("AWAY",i+1,p)} onDoubleClick={()=>substituteByDoubleClick("AWAY",i+1)}/>)}{match.scoutingMode!=="AWAY"&&homeCourt.map((p,i)=><CourtPlayer key={p.id} p={p} pos={i+1} selected={side==="HOME"&&p.id===selected} team="HOME" server={server} onClick={()=>handleCourtPlayerClick("HOME",i+1,p)} onDoubleClick={()=>substituteByDoubleClick("HOME",i+1)}/> )}</div><div className="liberoRail homeLiberoRail">{[0,1].map(i=>{const raw=homeLiberoNumbers[i];const libero=homePlayers.find(x=>x.number===Number(raw)&&x.role==="L");const backup=liberoBackup.home;const p=backup&&i===0?homePlayers.find(x=>x.id===backup):libero;const active=!!backup&&i===0;return <button type="button" key={i} className={`liberoCourtSlot homeLiberoSlot ${p?"hasLibero":""} ${active?"liberoReturning":""}`} onClick={()=>clickLiberoSlot("HOME",i)} title={active?"Klik untuk mengembalikan pemain belakang ke lapangan":"Klik, lalu pilih pemain belakang"}><span>{active?"PEMAIN KELUAR":`LIBERO ${i+1}`}</span><strong>{p?p.number:"—"}</strong><b>{p?p.name:"Belum diisi"}</b><small>{active?"KLIK UNTUK KEMBALI":p?"KLIK UNTUK MASUK":"SLOT LIBERO"}</small></button>})}</div></div></div>{selected&&<div className="panel actionPicker" style={{margin:10}}><div className="ph"><span>AKSI PEMAIN</span><b>#{player.number} {player.name} • P{pos} • {player.role}</b></div><div className="skills">{(Object.keys(cfg) as Skill[]).map(s=><button className={quickSkill===s?"skill activeSkill":"skill"} key={s} onClick={()=>openSkill(s)}>{s}</button>)}</div>{quickSkill&&<div className="quickResults"><div className="quickTitle">HASIL {quickSkill.toUpperCase()}</div><div className="resultBtns">{cfg[quickSkill].results.map((r:string)=><button key={r} className={(["Kill","Ace","Block Kill"].includes(r)?"result good":(["Error","Blocked"].includes(r)?"result bad":"result"))} onClick={()=>recordQuickResult(r)}>{r}</button>)}</div><button className="detailLink" onClick={()=>{setSkill(quickSkill);setQuickSkill(null)}}>＋ DETAIL LENGKAP (ZONA / ARAH / JENIS)</button></div>}</div>}</section>
   <section className="panel quickCodeArea" style={{marginTop:10}}>
<section className="codeScout">
    <div className="codeScoutHead"><b>INPUT SCOUTING DENGAN KODE • SATU RALLY</b><small>Masukkan semua aksi, lalu tekan ENTER</small></div>
    <div className="codeInputRow"><input className="codeInput" value={rallyCode} onChange={e=>{setRallyCode(e.target.value);setCodeStatus(null)}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();processCodeRally()}}} placeholder="Contoh: H8S+1C A5R+ A3T+4Q A4A+5C H6D+ H3T+3SH H10A#6L" aria-label="Kode satu rally"/><button className="btn primary" onClick={processCodeRally}>PROSES RALLY ↵</button></div>
    <div className="codeHelp"><b>CARA PALING SINGKAT:</b> Tim + Nomor + Aksi + Hasil + Detail. Pisahkan aksi dengan spasi.<br/><b>Aksi:</b> S=Service, R=Receive, A=Attack, B=Block, D=Dig, T=Tos. <b>Hasil:</b> +=masuk/baik, #=poin, -=error, !=kurang sempurna.<br/><b>Service & Attack:</b> tambah 2 karakter: <b>Zona + Arah</b>. Zona cukup angka 1–9. Arah: C=Cross, L=Line, M=Middle, S=Seam, T=Tip. Contoh <b>H8A#5C</b> = HOME #8 attack kill ke zona 5 arah cross; <b>A7S+1L</b> = AWAY #7 service ke zona 1 arah line.<br/><b>Tos:</b> tambah <b>Target + Tempo</b>. Target: 4=P4, 3=P3, 2=P2, B=Back Row, P=Pipe, S=Slide. Tempo: H=High, Q=Quick, SH=Shoot, B=Back, P=Pipe, SL=Slide. Contoh <b>H5T+4Q</b> = HOME #5 tos ke P4 tempo Quick. Detail boleh dikosongkan jika tidak diketahui.<br/><b>Contoh satu rally:</b> <b>H8S+1C A5R+ A3T+4Q A4A+5C H6D+ H3T+3SH H10A#6L</b>. Tekan ENTER untuk memproses. Format lama seperti @Z5/X tetap bisa digunakan.</div>
    {codeStatus&&<div className={`codeStatus ${codeStatus.type}`}>{codeStatus.text}</div>}
    {rallyCode.trim()&&<div className="codePreview">{rallyCode.trim().split(/[\s,;]+/).filter(Boolean).map((t,i)=><span className="codeChip" key={i}>{t.toUpperCase()}</span>)}</div>}
   </section>
<div className="quickActionBlock"><div className="ph"><span>QUICK ACTION</span><b>Catat cepat dengan detail minimal</b></div><div className="quick">{["KILL","ATTACK +","ACE","RECEIVE +","SET +","BLOCK KILL","DIG +","NEW RALLY"].map((x,i)=><button key={x} onClick={()=>i===7?start():openSkill((["Attack","Attack","Serve","Reception","Set","Block","Dig"] as Skill[])[i])}>{x}</button>)}</div></div>
</section>
   <div className="grid"><section className="panel timeline"><div className="ph"><span>RALLY TIMELINE</span><div style={{display:"flex",gap:8,alignItems:"center"}}><b>{rallies.length} rally selesai</b><button className="btn danger" style={{padding:"5px 9px",fontSize:10}} onClick={undoAction} disabled={!open?.actions.length&&!open&&!rallies.length}>↶ UNDO TERAKHIR</button></div></div>{open?.actions.length?<div>{open.actions.map((a,i)=><Action a={a} i={i+1} key={a.id}/>)}</div>:rallies.length?<div>{rallies.slice(-7).reverse().map(r=><div className="row" key={r.id}><div className="num">R{r.id}</div><div><b>SET {r.set} • {r.winner}</b><small>{r.actions.map(a=>`${a.skill}: ${a.result}`).join(" → ")}{r.pointReason?` • ${r.pointReason}`:""}</small></div><div className="right"><b>{r.after?.home} : {r.after?.away}</b></div></div>)}</div>:<div className="empty">Mulai dengan <b>MULAI RALLY</b> lalu catat Serve → Receive → Set → Attack → Dig → Attack.</div>}</section>
   <section className="panel" style={{marginTop:8}}><div className="ph"><span>RIWAYAT INPUT TERAKHIR</span><b>10 aksi terbaru</b></div>{(()=>{const history=[...rallies.flatMap(r=>r.actions.map(a=>({...a,rallyLabel:`SET ${r.set} • R${r.id}`}))),...(open?.actions||[]).map(a=>({...a,rallyLabel:"RALLY BERJALAN"}))].slice(-10).reverse();return history.length?history.map((a,i)=><div className="row" key={`${a.id}-${i}`}><div className="num">{i+1}</div><div><b>{a.rallyLabel} • {a.side} #{a.player?.number} {a.player?.name}</b><small>{a.skill} • {a.result}{a.target?` • ${a.target}`:""}{a.direction?` • ${a.direction}`:""}</small></div><div className="right"><b>{a.timestamp||"—"}</b></div></div>):<div className="empty">Belum ada aksi yang dicatat.</div>})()}</section>
   <section className="panel substitutionHistoryPanel"><div className="ph"><span>↻ RIWAYAT PERGANTIAN</span><b>{subHistory.length} event</b></div><div className="substitutionHistoryScroll">{subHistory.length?subHistory.slice(-12).reverse().map(x=><div className="row substitutionHistoryRow" key={x.id}><div className="num">P{x.pos}</div><div><b>{x.team} • {x.type}</b><small>{x.outPlayer?`OUT #${x.outPlayer.number} ${x.outPlayer.name}`:""}{x.inPlayer?` → IN #${x.inPlayer.number} ${x.inPlayer.name}`:""}</small></div><div className="right"><b>{x.type==="LIBERO IN"?"LIBERO ↗":x.type==="LIBERO OUT"?"KEMBALI ↗":"SUB ↗"}</b></div></div>):<div className="empty">Belum ada substitusi atau pergantian libero.</div>}</div></section>
   
   <section className="panel"><div className="ph"><span>LIVE STATS • {side}</span><b>SEMUA AKSI</b></div><div className="liveStatGrid">{[["Attack",stats.attack],["Kill",stats.kill],["Error",stats.error],["Blocked",stats.blocked],["Attack Eff.",stats.eff+"%"],["Serve",stats.serve],["Ace",stats.ace],["Serve Error",stats.serveError],["Receive",stats.receive],["Receive +",stats.receivePlus],["Set",stats.set],["Set +",stats.setPlus],["Dig",stats.dig],["Dig +",stats.digPlus],["Block",stats.block],["Block Kill",stats.blockKill],["Cover Good",stats.coverGood],["Free Ball Good",stats.freeGood]].map(x=><div className="stat" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></section></div>

   <div className="liveDock">
    <div className="dockScore">
     <div className="dockTeam home"><span>HOME · {match.homeName}</span><strong>{score.home}</strong></div>
     <div className="dockMid"><b>SET {setNo}</b><span>SERVER: {server==="HOME"?match.homeName:match.awayName}</span></div>
     <div className="dockTeam away"><strong>{score.away}</strong><span>AWAY · {match.awayName}</span></div>
    </div>
    <div className="toolbar dockToolbar"><div className="seg"><button className={side==="HOME"?"sel":""} onClick={()=>{setSide("HOME");setSelected(null);setQuickSkill(null)}}>HOME</button><button className={side==="AWAY"?"sel":""} onClick={()=>{setSide("AWAY");setSelected(null);setQuickSkill(null)}}>AWAY</button></div><label>MODE <select value={match.scoutingMode} onChange={e=>setMatch({...match,scoutingMode:e.target.value as ScoutMode})}><option value="BOTH">SCOUT KEDUA TIM</option><option value="HOME">SCOUT HOME SAJA</option><option value="AWAY">SCOUT AWAY SAJA</option></select></label><label>SET <select value={setNo} onChange={e=>changeSet(+e.target.value)}>{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label><label>SERVICE PERTAMA <select aria-label="Tim yang melakukan service pertama pada set ini" value={firstServers[setNo]||"HOME"} disabled={rallies.some(r=>r.set===setNo)||setScores.some(x=>x.set===setNo)||!!open} onChange={e=>{const v=e.target.value as Side;setFirstServers(old=>({...old,[setNo]:v}));setServer(v)}}><option value="HOME">HOME — {match.homeName}</option><option value="AWAY">AWAY — {match.awayName}</option></select></label><button className="btn primary" onClick={()=>{if(homeCourt.some(p=>p.id<0)||awayCourt.some(p=>p.id<0)){window.alert("Lengkapi roster awal P1–P6 untuk kedua tim sebelum memulai rally.");return;}start()}} disabled={!!open}>＋ MULAI RALLY</button><button className="btn danger" onClick={()=>{setScore({home:0,away:0});setSetScores([]);setSetNo(1);setRallies([]);setOpen(null);setRot({home:1,away:1});setFirstServers({1:"HOME",2:"HOME",3:"HOME",4:"HOME",5:"HOME"});setServer("HOME");setHomeCourt(homeLineup);setAwayCourt(awayLineup);setSubHistory([]);setLiberoBackup({home:null,away:null})}}>RESET</button><button className="btn" onClick={exportMatchCSV}>⬇ SIMPAN EXCEL</button><button className="btn" onClick={exportMatchWord}>⬇ WORD</button><button className="btn" onClick={exportMatchPDF}>⬇ PDF</button></div>
   </div>
  </>}
  {skill&&<Modal skill={skill} player={player} pos={pos} rot={rot[side]} onClose={()=>setSkill(null)} save={saveAction}/>}
 </main></div>
}


function VideoAnalysisPanel(){
 const [url,setUrl]=useState(()=>localStorage.getItem("vscout-video-url")||"");
 const [activeUrl,setActiveUrl]=useState(()=>localStorage.getItem("vscout-video-url")||"");
 const [markers,setMarkers]=useState<{id:number;time:number;label:string}[]>(()=>{try{return JSON.parse(localStorage.getItem("vscout-video-markers")||"[]")}catch{return[]}});
 const [now,setNow]=useState(0);
 const [duration,setDuration]=useState(0);
 const [note,setNote]=useState("");
 const videoRef=React.useRef<HTMLVideoElement|null>(null);
 useEffect(()=>{localStorage.setItem("vscout-video-url",activeUrl)},[activeUrl]);
 useEffect(()=>{localStorage.setItem("vscout-video-markers",JSON.stringify(markers))},[markers]);
 const normalized=activeUrl.trim();
 const isDirect=/\.(mp4|webm|ogg)(\?.*)?$/i.test(normalized);
 const youtube=normalized.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
 const vimeo=normalized.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
 const embedUrl=youtube?`https://www.youtube-nocookie.com/embed/${youtube[1]}`:vimeo?`https://player.vimeo.com/video/${vimeo[1]}`:normalized;
 const format=(sec:number)=>{if(!Number.isFinite(sec))return "00:00";const n=Math.max(0,Math.floor(sec));return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`};
 const addMarker=()=>{const label=note.trim()||`Rally / momen ${markers.length+1}`;setMarkers(m=>[...m,{id:Date.now(),time:now,label}].sort((a,b)=>a.time-b.time));setNote("")};
 const seek=(t:number)=>{if(videoRef.current){const next=Math.max(0,Math.min(duration||Infinity,t));videoRef.current.currentTime=next;setNow(next)}};
 const togglePlayback=()=>{const v=videoRef.current;if(!v)return;if(v.paused)void v.play();else v.pause()};
 const [playbackRate,setPlaybackRate]=useState(1);
 const [isPlaying,setIsPlaying]=useState(false);
 const changeRate=(rate:number)=>{setPlaybackRate(rate);if(videoRef.current)videoRef.current.playbackRate=rate};
 return <section className="videoScout panel">
  <div className="ph"><span>VIDEO ANALYSIS</span><b>VIDEO MATCH & MOMEN PENTING</b></div>
  <div className="videoUrlRow"><input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setActiveUrl(url.trim())}}} placeholder="Tempel URL YouTube / Vimeo / MP4..."/><button className="btn primary" onClick={()=>setActiveUrl(url.trim())}>MUAT</button></div>
  <div className="videoFrame">
   {!normalized?<div className="videoEmpty"><strong>Belum ada video</strong><span>Tempel tautan video pertandingan, lalu tekan MUAT.</span></div>:
    isDirect?<video ref={videoRef} src={normalized} playsInline onTimeUpdate={e=>setNow(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||0)} onDurationChange={e=>setDuration(e.currentTarget.duration||0)} onPlay={()=>setIsPlaying(true)} onPause={()=>setIsPlaying(false)} onEnded={()=>{setIsPlaying(false);setNow(duration)}} />:
    <iframe src={youtube?`${embedUrl}?controls=1&modestbranding=1&rel=0&enablejsapi=1`:vimeo?`${embedUrl}?title=0&byline=0&portrait=0`:embedUrl} title="Video pertandingan" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
  </div>
  {isDirect&&<div className="videoPlayerBar"><div className="videoTransport"><button type="button" onClick={()=>seek(now-10)} title="Mundur / ulang 10 detik">↶ 10s</button><button type="button" className="playPause" onClick={togglePlayback} title="Putar / Pause">{isPlaying?"Ⅱ PAUSE":"▶ PUTAR"}</button><button type="button" onClick={()=>seek(now+10)} title="Maju cepat 10 detik">10s ↷</button><label>Kecepatan<select value={playbackRate} onChange={e=>changeRate(Number(e.target.value))}><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></label></div><input className="videoSeek" aria-label="Geser timeline video" type="range" min="0" max={duration||1} step="0.1" value={Math.min(now,duration||0)} onChange={e=>seek(Number(e.target.value))}/></div>}
  <div className="videoControls"><span>{format(now)}{duration?` / ${format(duration)}`:""}</span>{!isDirect&&<span className="embedHint">Gunakan kontrol pemutar video</span>}<a href={normalized||undefined} target="_blank" rel="noreferrer">BUKA VIDEO ↗</a></div>
  <div className="videoMarkerInput"><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Catatan momen (mis. receive error / rally 12)"/><button className="btn" onClick={addMarker} disabled={!normalized}>＋ CATAT WAKTU</button></div>
  <div className="videoMarkerList">{markers.length?markers.map(m=><div className="videoMarker" key={m.id}><button onClick={()=>seek(m.time)} disabled={!isDirect} title={isDirect?"Pindah ke waktu ini":"Timestamp tersimpan; seek tersedia untuk file video langsung"}>{format(m.time)}</button><span>{m.label}</span><button className="videoRemove" onClick={()=>setMarkers(x=>x.filter(v=>v.id!==m.id))}>×</button></div>):<small>Belum ada timestamp. Saat video berjalan, tambahkan catatan momen di sini.</small>}</div>
  {normalized&&!isDirect&&!youtube&&!vimeo&&<small className="videoNotice">Jika sumber video tidak mengizinkan embed, gunakan tombol BUKA VIDEO. Dukungan embed bergantung pada situs dan izin pemilik video.</small>}
 </section>
}

function CourtPlayer({p,pos,selected,team,server,onClick,onDoubleClick}:{p:Player;pos:number;selected:boolean;team:Side;server:Side;onClick:()=>void;onDoubleClick?:()=>void}){
 // `pos` is the player's actual rotation position P1-P6. Map each position
 // directly to its matching court cell; CSS mirrors AWAY across the net.
 const area=team==="AWAY"
  ? (["a1","a2","a3","a4","a5","a6"] as string[])[pos-1]
  : (["h1","h2","h3","h4","h5","h6"] as string[])[pos-1];
 const isServer=server===team && pos===1;
 if(p.id<0)return <div title={`Posisi P${pos} belum diisi`} className={`courtPlayer emptyCourtSlot ${area} ${team.toLowerCase()}`}><span className="courtPos">P{pos}</span><strong>—</strong><b>Masukkan nomor</b><small>KOSONG</small></div>;
 return <button title="Klik sekali untuk scouting; klik dua kali untuk mengganti pemain dengan nomor punggung" className={`courtPlayer ${area} ${team.toLowerCase()} ${selected?"selected":""}`} onClick={onClick} onDoubleClick={onDoubleClick}><span className="courtPos">P{pos}</span>{isServer&&<span className="serverBadge">SERVE</span>}<strong>{p.number}</strong><b>{p.name||"Tanpa Nama"}</b><small>{p.role}</small></button>
}

function Action({a,i}:{a:Action;i:number}){return <div className="row"><div className="num">{i}</div><div><b>{a.skill}</b><small>#{a.player.number} {a.player.name} • P{a.pos} • R{a.rot}</small></div><div className="right"><b>{a.result}</b><small>{[a.subtype,a.direction,a.target,a.tempo,a.blockType].filter(Boolean).join(" • ")}</small></div></div>}

function Modal({skill,player,pos,rot,onClose,save}:{skill:Skill;player:Player;pos:number;rot:number;onClose:()=>void;save:(v:any)=>void}){
 const c=cfg[skill], [result,setResult]=useState(c.results[0]),[subtype,setSubtype]=useState(c.sub?.[0]||""),[target,setTarget]=useState(c.target?.[0]||""),[direction,setDirection]=useState(c.dir?.[0]||""),[tempo,setTempo]=useState(c.tempo?.[0]||"");
 const terminal=["Kill","Ace","Block Kill","Error","Blocked"].includes(result);
 const Field=({title,items,value,set}:{title:string;items:string[];value:string;set:(x:string)=>void})=><div className="field"><div className="ft">{title}</div><div className="choices">{items.map(x=><button key={x} className={value===x?"choice on":"choice"} onClick={()=>set(x)}>{x}</button>)}</div></div>;
 return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="mh"><div><div className="tag">{skill.toUpperCase()}</div><h2>{skill}</h2><p>#{player.number} {player.name} • P{pos} • Rotasi {rot}</p></div><button className="close" onClick={onClose}>×</button></div><div className="mb">
 <Field title="HASIL AKSI" items={c.results} value={result} set={setResult}/>{c.sub&&<Field title="JENIS AKSI" items={c.sub} value={subtype} set={setSubtype}/>}
 {c.target&&<Field title="TARGET" items={c.target} value={target} set={setTarget}/>} {c.dir&&<Field title="ARAH / DIRECTION" items={c.dir} value={direction} set={setDirection}/>} {c.tempo&&<Field title="TEMPO SET" items={c.tempo} value={tempo} set={setTempo}/>}
 <div className={terminal?"hint end":"hint"}>{terminal?"HASIL TERMINAL • pilih FINISH OTOMATIS untuk memberikan point.":"LANJUTAN RALLY • aksi ini belum memberikan point; lanjutkan aksi berikutnya."}</div>
 </div><div className="mf"><button className="btn" onClick={onClose}>BATAL</button><button className="btn primary" onClick={()=>save({result,subtype,target,direction,tempo})}>SIMPAN & LANJUT RALLY</button></div></div></div>
}

function downloadCSV(filename:string, rows:string[][]){
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);
}

function Simple({page,score,stats,rallies,setScores,setNo,match,homePlayers,awayPlayers,setMatch,setHomePlayers,setAwayPlayers,homeLineup,awayLineup,homeLibero,awayLibero,setHomeLineup,setAwayLineup,setHomeLibero,setAwayLibero,onLive}:{page:string;score:any;stats:any;rallies:any[];setScores:{set:number;home:number;away:number}[];setNo:number;match:MatchConfig;homePlayers:Player[];awayPlayers:Player[];setMatch:(x:MatchConfig)=>void;setHomePlayers:React.Dispatch<React.SetStateAction<Player[]>>;setAwayPlayers:React.Dispatch<React.SetStateAction<Player[]>>;homeLineup:Player[];awayLineup:Player[];homeLibero:number|null;awayLibero:number|null;setHomeLineup:React.Dispatch<React.SetStateAction<Player[]>>;setAwayLineup:React.Dispatch<React.SetStateAction<Player[]>>;setHomeLibero:React.Dispatch<React.SetStateAction<number|null>>;setAwayLibero:React.Dispatch<React.SetStateAction<number|null>>;onLive:()=>void;onSetupDone:()=>void}){
  const [tab,setTab]=useState("OVERVIEW");
  const [setFilter,setSetFilter]=useState("ALL");
  const [sideFilter,setSideFilter]=useState<Side>("HOME");
  const [playerFilter,setPlayerFilter]=useState("ALL");
  const [zoneFilter,setZoneFilter]=useState("ALL");
  const [dirFilter,setDirFilter]=useState("ALL");
  const [rotFilter,setRotFilter]=useState("ALL");
  const actions=rallies.flatMap((r:any)=>Array.isArray(r?.actions)?r.actions:[]).filter((a:any)=>a&&a.player);
  const filtered=actions.filter((a:any)=>{
    const rr=rallies.find((r:any)=>Array.isArray(r?.actions)&&r.actions.some((x:any)=>x?.id===a.id));
    return a.side===sideFilter && (setFilter==="ALL"||String(rr?.set)===setFilter) && (zoneFilter==="ALL"||a.target===zoneFilter) && (dirFilter==="ALL"||a.direction===dirFilter) && (rotFilter==="ALL"||String(a.rot)===rotFilter);
  });
  const roster=sideFilter==="HOME"?homePlayers:awayPlayers;
  const addRosterPlayer=(team:Side)=>{
    const list=team==="HOME"?homePlayers:awayPlayers;
    if(list.length>=25){window.alert("Maksimal 25 pemain per tim.");return;}
    const used=new Set(list.map(p=>p.number));let next=1;while(used.has(next))next++;
    const fresh:Player={id:Date.now()+Math.floor(Math.random()*1000),number:next,name:"",role:"OH"};
    if(team==="HOME")setHomePlayers(r=>[...r,fresh]);else setAwayPlayers(r=>[...r,fresh]);
  };
  const finishSetup=()=>{
    if(homePlayers.length<6||awayPlayers.length<6){window.alert("Setiap tim minimal memiliki 6 pemain di roster.");return;}
    if(homePlayers.some(p=>!p.name.trim())||awayPlayers.some(p=>!p.name.trim())){window.alert("Lengkapi nama seluruh pemain roster terlebih dahulu.");return;}
    onSetupDone();
  };
  const calc=(list:any[])=>{
    const n=(sk:string,res?:string)=>list.filter(a=>a.skill===sk&&(!res||a.result===res)).length;
    const attack=n("Attack"),kill=n("Attack","Kill"),error=n("Attack","Error"),blocked=n("Attack","Blocked");
    const serve=n("Serve"),ace=n("Serve","Ace"),serveError=n("Serve","Error"),serveIn=n("Serve","In Play")+n("Serve","Positive (+)");
    const receive=n("Reception"),receive3=n("Reception","Perfect (3)"),receive2=n("Reception","Good (2)"),receive1=n("Reception","Poor (1)"),receive0=n("Reception","Error (0)");
    const set=n("Set"),set3=n("Set","Perfect (3)"),set2=n("Set","Good (2)"),set1=n("Set","Poor (1)"),set0=n("Set","Error (0)");
    const block=n("Block"),blockKill=n("Block","Block Kill");
    const dig=n("Dig"),dig3=n("Dig","Perfect (3)"),dig2=n("Dig","Good (2)"),dig1=n("Dig","Poor (1)"),dig0=n("Dig","Error (0)");
    const cover=n("Cover"),coverGood=n("Cover","Good");
    const freeBall=n("Free Ball"),freeGood=n("Free Ball","Good");
    return {attack,kill,error,blocked,eff:attack?Math.round((kill-error-blocked)/attack*100):0,successRate:attack?Math.round(kill/attack*100):0,attackPositive:n("Attack","Positive (+)"),attackContinuation:n("Attack","Continuation (#)"),serve,serveIn,ace,serveError,receive,receive3,receive2,receive1,receive0,receivePlus:receive3+receive2,receiveRate:receive?Math.round((receive3+receive2)/receive*100):0,set,set3,set2,set1,set0,setPlus:set3+set2,setRate:set?Math.round((set3+set2)/set*100):0,block,blockKill,dig,dig3,dig2,dig1,dig0,digPlus:dig3+dig2,digRate:dig?Math.round((dig3+dig2)/dig*100):0,cover,coverGood,freeBall,freeGood};
  };
  const filteredStats=calc(filtered);
  const playerStats = roster.map((p: Player) => ({
    p,
    ...calc(filtered.filter((a: any) => a.player && a.player.id === p.id))
  }));
  const zones=Array.from({length:9},(_,i)=>`Z${i+1}`).map(z=>({z,n:filtered.filter((a:any)=>a.skill==="Attack"&&a.target===z).length}));
  const dirs=["Cross","Line","Tip","Middle","Seam"].map(d=>({d,n:filtered.filter((a:any)=>a.skill==="Attack"&&a.direction===d).length}));
  const serviceActions=filtered.filter((a:any)=>a.skill==="Serve");
  const serviceZones=Array.from({length:9},(_,i)=>`Z${i+1}`).map(z=>({z,n:serviceActions.filter((a:any)=>a.target===z).length,ace:serviceActions.filter((a:any)=>a.target===z&&a.result==="Ace").length,err:serviceActions.filter((a:any)=>a.target===z&&a.result==="Error").length}));
  const serviceDirections=["Cross","Line","Middle","Seam","Tip"].map(d=>({d,n:serviceActions.filter((a:any)=>a.direction===d).length,ace:serviceActions.filter((a:any)=>a.direction===d&&a.result==="Ace").length,err:serviceActions.filter((a:any)=>a.direction===d&&a.result==="Error").length}));
  const rots=[1,2,3,4,5,6].map(r=>({r,...calc(filtered.filter((a:any)=>a.rot===r))}));
  const selectedPlayer=playerFilter!=="ALL"?playerStats.find(x=>String(x.p.id)===playerFilter):null;
  const selectedZone=zoneFilter!=="ALL"?zoneFilter:null;
  const selectedRot=rotFilter!=="ALL"?Number(rotFilter):null;  const performancePlayers=playerStats.map((x:any)=>{
    const score=Math.max(0,Math.round(x.kill*4+x.ace*3+x.blockKill*3+x.eff*0.08+x.recPlus*1.2+x.digPlus*1.1+x.setPlus*1.0-x.error*2-x.serveErr*1.5));
    return {...x,performance:score};
  }).sort((a:any,b:any)=>b.performance-a.performance);
  const maxPerf=Math.max(1,...performancePlayers.map((x:any)=>x.performance));
  const compareA=performancePlayers[0]?.p.id??null;
  const [compareId,setCompareId]=useState<number|null>(null);
  const compareB=compareId??performancePlayers[1]?.p.id??null;
  const compareOne=performancePlayers.find((x:any)=>x.p.id===compareA);
  const compareTwo=performancePlayers.find((x:any)=>x.p.id===compareB);

  const exportStats=()=>downloadCSV("volleyball-scout-pro-statistics.csv",[["Player","Role","Attack","Kill","Error","Blocked","Efficiency","Serve","Ace","Serve Error","Reception","Receive+","Receive %","Set","Set+","Set %","Dig","Dig+","Dig %","Block","Block Kill","Cover Good","Free Ball Good"],...playerStats.map(x=>[x.p.name,x.p.role,String(x.attack),String(x.kill),String(x.error),String(x.blocked),x.eff+"%",String(x.serve),String(x.ace),String(x.serveError),String(x.receive),String(x.receivePlus),x.receiveRate+"%",String(x.set),String(x.setPlus),x.setRate+"%",String(x.dig),String(x.digPlus),x.digRate+"%",String(x.block),String(x.blockKill),String(x.coverGood),String(x.freeGood)])]);
  return <div className="simple">
    <div className="hero"><div><div className="tag">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</div><h2>{page}</h2><p>Analisis statistik interaktif: filter set, pemain, zona, arah, dan rotasi.</p></div><div className="miniActions"><button onClick={onLive}>LIVE SCOUTING</button>{(page==="Statistics"||page==="Reports")&&<button onClick={exportStats}>EXPORT CSV</button>}</div></div>
    {page==="Tactical Analysis"&&<TacticalAnalysis rallies={rallies} match={match} homePlayers={homePlayers} awayPlayers={awayPlayers}/>}
    {page==="Dashboard"&&<><div className="metrics">{[["Score",`${score.home} : ${score.away}`],["Set",setScores.length+" / "+match.bestOf],["Rally",rallies.length],["Attack",stats.attack],["Kill",stats.kill],["Eff.",stats.eff+"%"],["Serve",stats.serve],["Ace",stats.ace],["Receive+",stats.receivePlus],["Set+",stats.setPlus],["Dig+",stats.digPlus],["Block Kill",stats.blockKill]].map(x=><button className="metric" key={x[0]} onClick={()=>{if(x[0]==="Attack")setTab("ATTACK")}}><small>{x[0]}</small><b>{x[1]}</b></button>)}</div><div className="dashGrid"><div className="card"><div className="sectionTitle"><div><h3>SET SCORE</h3><small>Riwayat skor setiap set yang sudah selesai.</small></div><b>SET {setNo}</b></div><div className="setScoreList">{setScores.length?setScores.map(x=><div className="setScoreRow" key={x.set}><span>SET {x.set}</span><strong>{x.home}</strong><i>:</i><strong>{x.away}</strong><small>{x.home>x.away?match.homeName:match.awayName}</small></div>):<div className="empty">Belum ada set yang selesai.</div>}</div></div><div className="card"><div className="sectionTitle"><div><h3>PERFORMA TIM</h3><small>Perbandingan aksi utama.</small></div></div><div className="compareRow"><span>Attack</span><b>{stats.attack}</b></div><div className="compareRow"><span>Kill</span><b>{stats.kill}</b></div><div className="compareRow"><span>Ace</span><b>{stats.ace}</b></div><div className="compareRow"><span>Block Kill</span><b>{stats.blockKill}</b></div><div className="compareRow"><span>Receive+</span><b>{stats.receivePlus}</b></div><div className="compareRow"><span>Dig+</span><b>{stats.digPlus}</b></div></div></div></>}
    {page==="Statistics" && <>
      <div className="toolbar">
        <div className="seg">
          <button className={tab==="OVERVIEW" ? "sel" : ""} onClick={()=>setTab("OVERVIEW")}>OVERVIEW</button>
          <button className={tab==="PLAYERS" ? "sel" : ""} onClick={()=>setTab("PLAYERS")}>PLAYER STATISTICS</button><button className={tab==="PERFORMANCE" ? "sel" : ""} onClick={()=>setTab("PERFORMANCE")}>PERFORMANCE</button>
          <button className={tab==="ATTACK" ? "sel" : ""} onClick={()=>setTab("ATTACK")}>ATTACK MAP</button>
          <button className={tab==="SETTER" ? "sel" : ""} onClick={()=>setTab("SETTER")}>SETTER ANALYSIS</button>
          <button className={tab==="ROTATION" ? "sel" : ""} onClick={()=>setTab("ROTATION")}>ROTATION</button>
        </div>
        <div className="seg"><button className={sideFilter==="HOME"?"sel":""} onClick={()=>{setSideFilter("HOME");setPlayerFilter("ALL")}}>HOME</button><button className={sideFilter==="AWAY"?"sel":""} onClick={()=>{setSideFilter("AWAY");setPlayerFilter("ALL")}}>AWAY</button></div>
        <label>SET <select value={setFilter} onChange={e=>setSetFilter(e.target.value)}>
          <option value="ALL">ALL</option>
          {[1,2,3,4,5].map(x=><option key={x} value={String(x)}>{x}</option>)}
        </select></label>
      </div>

      {(tab==="PLAYERS" || tab==="PERFORMANCE" || tab==="ATTACK" || tab==="ROTATION") && <div className="analyticsToolbar">
        <span className="ey">FILTER</span>
        <button className={zoneFilter==="ALL" ? "filterPill on" : "filterPill"} onClick={()=>setZoneFilter("ALL")}>ALL ZONE</button>
        {zones.map(z=><button key={z.z} className={zoneFilter===z.z ? "filterPill on" : "filterPill"} onClick={()=>setZoneFilter(zoneFilter===z.z ? "ALL" : z.z)}>{z.z}</button>)}
        <button className={dirFilter==="ALL" ? "filterPill on" : "filterPill"} onClick={()=>setDirFilter("ALL")}>ALL DIR</button>
        {dirs.map(d=><button key={d.d} className={dirFilter===d.d ? "filterPill on" : "filterPill"} onClick={()=>setDirFilter(dirFilter===d.d ? "ALL" : d.d)}>{d.d}</button>)}
      </div>}

      {selectedPlayer && <div className="selectedBanner">PEMAIN TERPILIH: <b>#{selectedPlayer.p.number} {selectedPlayer.p.name}</b> • {selectedPlayer.p.role} — klik nama lagi untuk kembali ke ALL.</div>}
      {selectedZone && <div className="selectedBanner">ZONA TERPILIH: <b>{selectedZone}</b> — {zones.find(z=>z.z===selectedZone)?.n || 0} attack.</div>}

      {tab==="OVERVIEW" && <div className="metrics">
        {[['Attack',filteredStats.attack],['Kill',filteredStats.kill],['Error',filteredStats.error],['Blocked',filteredStats.blocked],['Attack Eff.',filteredStats.eff+'%'],['Success Rate',filteredStats.successRate+'%'],['Positive',filteredStats.attackPositive],['Continuation',filteredStats.attackContinuation],['Serve',filteredStats.serve],['Serve In',filteredStats.serveIn],['Ace',filteredStats.ace],['Serve Error',filteredStats.serveError],['Receive+',filteredStats.receivePlus],['Receive %',filteredStats.receiveRate+'%'],['Dig+',filteredStats.digPlus],['Dig %',filteredStats.digRate+'%'],['Set+',filteredStats.setPlus],['Set %',filteredStats.setRate+'%'],['Block',filteredStats.block],['Block Kill',filteredStats.blockKill]].map(x=><button className="metric" key={x[0]} onClick={()=>setTab(x[0]==="Attack" ? "ATTACK" : "PERFORMANCE")}><small>{x[0]}</small><b>{x[1]}</b></button>)}
      </div>}

      {tab==="PLAYERS" && <div className="wide">
        <div className="sectionTitle">
          <div><h3>PLAYER STATISTICS</h3><small>Klik baris pemain untuk filter detail.</small></div>
          <select value={playerFilter} onChange={e=>setPlayerFilter(e.target.value)}>
            <option value="ALL">SEMUA PEMAIN</option>
            {roster.map(p=><option key={p.id} value={String(p.id)}>#{p.number} {p.name}</option>)}
          </select>
        </div>
        {selectedPlayer && <div className="detailGrid">
          {[['ATTACK',selectedPlayer.attack],['KILL',selectedPlayer.kill],['ERROR',selectedPlayer.error],['EFF',selectedPlayer.eff+'%']].map(x=><div className="detailCard" key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}
        </div>}
        <div className="statTable">
          <div className="tr th"><b>PLAYER</b><b>ATT</b><b>K</b><b>ERR</b><b>BLK</b><b>EFF</b><b>SERV</b><b>ACE</b><b>S-ERR</b><b>REC</b><b>REC+</b><b>SET</b><b>SET+</b><b>DIG</b></div>
          {playerStats.filter(x=>playerFilter==="ALL" || String(x.p.id)===playerFilter).map(x=><button className="tr clickRow" key={x.p.id} onClick={()=>setPlayerFilter(String(x.p.id)===playerFilter && playerFilter!=="ALL" ? "ALL" : String(x.p.id))}>
            <span><b>#{x.p.number} {x.p.name}</b><small>{x.p.role}</small></span><b>{x.attack}</b><b>{x.kill}</b><b>{x.error}</b><b>{x.blocked}</b><b>{x.eff}%</b><b>{x.serve}</b><b>{x.ace}</b><b>{x.serveErr}</b><b>{x.rec}</b><b>{x.recPlus}</b><b>{x.sets}</b><b>{x.setPlus}</b><b>{x.dig}</b>
          </button>)}
          {!playerStats.length && <div className="empty">Belum ada data pemain pada filter ini.</div>}
        </div>
      </div>}

      {tab==="PERFORMANCE" && <div className="wide">
        <div className="sectionTitle"><div><h3>PLAYER PERFORMANCE CENTER</h3><small>Ranking performa dari data scouting aktif. Bukan rating resmi.</small></div><div className="perfControls"><span className="filterPill on">{sideFilter}</span><span className="filterPill">SET {setFilter}</span><select value={compareId??""} onChange={e=>setCompareId(e.target.value?Number(e.target.value):null)}><option value="">PILIH PEMBANDING</option>{playerStats.filter((x:any)=>x.p.id!==compareA).map((x:any)=><option key={x.p.id} value={x.p.id}>#{x.p.number} {x.p.name}</option>)}</select></div></div>
        {!performancePlayers.length?<div className="empty">Belum ada data pemain.</div>:<div className="perfGrid">{performancePlayers.map((x:any,i:number)=><div className={"perfCard "+(i===0?"top":"")} key={x.p.id}><span className="rank">#{i+1}</span><div className="perfName">#{x.p.number} {x.p.name}</div><div className="perfRole">{x.p.role}</div><div className="perfScore">{x.performance}</div><small>PERFORMANCE SCORE</small><div className="bar"><i style={{width:Math.min(100,Math.round(x.performance/maxPerf*100))+"%"}}/></div><div className="miniStatGrid"><div className="miniStat"><small>KILL</small><b>{x.kill}</b></div><div className="miniStat"><small>EFF</small><b>{x.eff}%</b></div><div className="miniStat"><small>ACE</small><b>{x.ace}</b></div><div className="miniStat"><small>BLOCK</small><b>{x.blockKill}</b></div></div><div className="miniStatGrid" style={{marginTop:6}}><div className="miniStat"><small>REC+</small><b>{x.recPlus}</b></div><div className="miniStat"><small>DIG+</small><b>{x.digPlus}</b></div><div className="miniStat"><small>SET+</small><b>{x.setPlus}</b></div><div className="miniStat"><small>ERROR</small><b>{x.error}</b></div></div></div>)}</div>}
        {compareOne&&compareTwo&&<div className="wide" style={{marginTop:10}}><div className="sectionTitle"><h3>PLAYER COMPARISON</h3><small>Perbandingan kontribusi berdasarkan kategori scouting.</small></div><div className="compareGrid">{[compareOne,compareTwo].map((x:any)=><div className="compareCard" key={x.p.id}><div className="compareTitle">#{x.p.number} {x.p.name} • {x.p.role}</div>{[["Kill",x.kill],["Efficiency",x.eff+"%"],["Ace",x.ace],["Block Kill",x.blockKill],["Receive+",x.recPlus],["Dig+",x.digPlus],["Set+",x.setPlus]].map((m:any)=><div className="compareMetric" key={m[0]}><span>{m[0]}</span><div className="compareBar"><i style={{width:(typeof m[1]==="number"?Math.min(100,m[1]*10):Math.min(100,parseInt(m[1])||0))+"%"}}/></div><b>{m[1]}</b></div>)}</div>)}</div></div>}
      </div>}

      {tab==="ATTACK" && <div className="analyticsGrid">
        <div className="wide">
          <div className="sectionTitle"><h3>ATTACK MAP • Z1–Z9</h3><small>Klik zona untuk filter.</small></div>
          <div className="zoneMap">
            {zones.map(z=><button key={z.z} className={zoneFilter===z.z ? "zone hot" : "zone"} onClick={()=>setZoneFilter(zoneFilter===z.z ? "ALL" : z.z)}><strong>{z.z}</strong><span>{z.n}</span><small>ATTACK</small></button>)}
          </div>
        </div>
        <div className="wide">
          <div className="sectionTitle"><h3>ATTACK DIRECTION</h3><small>Klik arah untuk filter.</small></div>
          <div className="directionGrid">
            {dirs.map(d=><button key={d.d} className={dirFilter===d.d ? "choice on" : "choice"} onClick={()=>setDirFilter(dirFilter===d.d ? "ALL" : d.d)}><b>{d.d}</b><strong>{d.n}</strong><small>attacks</small></button>)}
          </div>
          <div className="mapLegend"><span>Filter aktif</span><strong>{zoneFilter==="ALL" ? "Semua zona" : zoneFilter} • {dirFilter==="ALL" ? "Semua arah" : dirFilter}</strong></div>
        </div>
        <div className="wide" style={{gridColumn:"1 / -1",marginTop:10}}>
          <div className="sectionTitle"><div><h3>SERVICE TARGET ZONE • Z1–Z9</h3><small>Service yang diarahkan ke setiap zona, termasuk Ace dan Error.</small></div><b>{serviceActions.length} SERVICE</b></div>
          <div className="zoneMap">{serviceZones.map(z=><button key={z.z} className={zoneFilter===z.z?"zone hot":"zone"} onClick={()=>setZoneFilter(zoneFilter===z.z?"ALL":z.z)}><strong>{z.z}</strong><span>{z.n}</span><small>{z.ace} ACE • {z.err} ERROR</small></button>)}</div>
          <div className="sectionTitle" style={{marginTop:16}}><div><h3>SERVICE DIRECTION</h3><small>Rekap arah service yang sudah diinput.</small></div></div>
          <div className="directionGrid">{serviceDirections.map(d=><button key={d.d} className={dirFilter===d.d?"choice on":"choice"} onClick={()=>setDirFilter(dirFilter===d.d?"ALL":d.d)}><b>{d.d}</b><strong>{d.n}</strong><small>{d.ace} ACE • {d.err} ERROR</small></button>)}</div>
        </div>
      </div>}

      {tab==="SETTER" && (() => {
        const teamActions=rallies.filter((r:any)=>setFilter==="ALL"||String(r.set)===setFilter).flatMap((r:any)=>Array.isArray(r.actions)?r.actions:[]).filter((a:any)=>a&&a.player&&a.side===sideFilter);
        const setActions=teamActions.filter((a:any)=>a.skill==="Set");
        const attackActions=teamActions.filter((a:any)=>a.skill==="Attack");
        const targetRole=(target:string)=>{
          if(target==="P4 Outside") return "OH";
          if(target==="P2 Opposite") return "OPP";
          if(target==="P3 Middle") return "MB";
          if(target==="Back Row"||target==="Pipe"||target==="Slide") return "BACK ROW / SPECIAL";
          return "TANPA TARGET";
        };
        const roleCounts=["OH","OPP","MB","BACK ROW / SPECIAL","TANPA TARGET"].map(role=>({role,n:setActions.filter((a:any)=>targetRole(a.target||"")===role).length}));
        const setters=roster.map((p:Player)=>({p,sets:setActions.filter((a:any)=>a.player?.id===p.id)})).filter(x=>x.sets.length).sort((a,b)=>b.sets.length-a.sets.length);
        const count=(result:string)=>attackActions.filter((a:any)=>a.result===result).length;
        return <div className="wide">
          <div className="sectionTitle"><div><h3>SETTER DISTRIBUTION</h3><small>Rekap otomatis dari kode Set yang sudah dimasukkan. Tidak mengubah format input scouting.</small></div><b>{setActions.length} SET TERCATAT</b></div>
          <div className="metrics" style={{gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",marginBottom:14}}>
            <div className="metric"><small>TOTAL SET</small><b>{setActions.length}</b></div>
            <div className="metric"><small>SETTER AKTIF</small><b>{setters.length}</b></div>
            <div className="metric"><small>ATTACK KILL</small><b>{count("Kill")}</b></div>
            <div className="metric"><small>ATTACK ERROR</small><b>{count("Error")}</b></div>
            <div className="metric"><small>ATTACK BLOCKED</small><b>{count("Blocked")}</b></div>
          </div>
          <div className="sectionTitle"><div><h3>DISTRIBUSI TARGET SET</h3><small>Kategori posisi berdasarkan target yang tertulis pada kode set.</small></div></div>
          <div className="rotationGrid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))"}}>
            {roleCounts.map(x=><div className="rotationCard" key={x.role}><div className="rotTitle">{x.role}</div><div><span>Jumlah set</span><b>{x.n}</b></div><div><span>Persentase</span><b>{setActions.length?Math.round(x.n/setActions.length*100):0}%</b></div></div>)}
          </div>
          <div className="sectionTitle" style={{marginTop:18}}><div><h3>REKAP PER SETTER</h3><small>Jumlah umpan yang dicatat oleh setiap pemain.</small></div></div>
          <div className="statTable">
            <div className="tr th" style={{gridTemplateColumns:"minmax(120px,1.6fr) repeat(5,minmax(65px,1fr))"}}><b>SETTER</b><b>TOTAL</b><b>OH</b><b>OPP</b><b>MB</b><b>LAINNYA</b></div>
            {setters.map(x=><div className="tr" key={x.p.id} style={{gridTemplateColumns:"minmax(120px,1.6fr) repeat(5,minmax(65px,1fr))"}}><span><b>#{x.p.number} {x.p.name}</b><small>{x.p.role}</small></span><b>{x.sets.length}</b><b>{x.sets.filter((a:any)=>targetRole(a.target||"")==="OH").length}</b><b>{x.sets.filter((a:any)=>targetRole(a.target||"")==="OPP").length}</b><b>{x.sets.filter((a:any)=>targetRole(a.target||"")==="MB").length}</b><b>{x.sets.filter((a:any)=>["BACK ROW / SPECIAL","TANPA TARGET"].includes(targetRole(a.target||""))).length}</b></div>)}
            {!setters.length&&<div className="empty">Belum ada aksi Set untuk tim dan filter yang dipilih.</div>}
          </div>
          <div className="mapLegend" style={{marginTop:12}}><span>Catatan</span><strong>Kill / Error / Blocked dihitung dari seluruh attack tim pada filter aktif, bukan diklaim sebagai hasil langsung dari umpan tertentu.</strong></div>
        </div>;
      })()}

      {tab==="ROTATION" && <div className="wide">
        <div className="sectionTitle">
          <div><h3>ROTATION ANALYSIS</h3><small>Klik R1–R6 untuk melihat performa rotasi.</small></div>
          <button className="btn" onClick={()=>setRotFilter("ALL")}>RESET ROTASI</button>
        </div>
        <div className="rotationGrid">
          {rots.map(x=><button className="rotationCard" key={x.r} onClick={()=>setRotFilter(rotFilter===String(x.r) ? "ALL" : String(x.r))} style={{textAlign:"left",cursor:"pointer",outline:rotFilter===String(x.r) ? "2px solid #35d2b9" : "none"}}>
            <div className="rotTitle">R{x.r}</div><div><span>Attack</span><b>{x.attack}</b></div><div><span>Kill</span><b>{x.kill}</b></div><div><span>Error</span><b>{x.error}</b></div><div><span>Eff.</span><b>{x.eff}%</b></div><div><span>Ace</span><b>{x.ace}</b></div><div><span>Block Kill</span><b>{x.block}</b></div>
          </button>)}
        </div>
        {selectedRot && <div className="selectedBanner">ROTASI TERPILIH: <b>R{selectedRot}</b> — {rots.find(x=>x.r===selectedRot)?.attack || 0} attack, {rots.find(x=>x.r===selectedRot)?.kill || 0} kill.</div>}
      </div>}
    </>}
    {page==="Matches"&&<div className="wide"><div className="sectionTitle"><div><h3>MATCH CENTER</h3><small>{match.competition} • {match.date}</small></div><button className="btn primary" onClick={onLive}>LANJUT SCOUTING</button></div><div className="matchHero"><div><span>HOME</span><b>{match.homeName}</b><strong>{score.home}</strong></div><div className="vs">SET {setNo}<small>BEST OF {match.bestOf}</small></div><div><span>AWAY</span><b>{match.awayName}</b><strong>{score.away}</strong></div></div><p>Venue: {match.venue||"Belum diisi"} • Wasit: {match.referee||"Belum diisi"} • {rallies.length} rally selesai.</p></div>}
    {page==="Matches"&&<div className="card">
<h2>{page==="Matches"?"Match Setup":page==="Teams"?"Teams":"Roster Pemain"}</h2><p style={{color:"#9db9cc"}}>Alur setup: nama tim → roster HOME/AWAY → Enter untuk tambah pemain → lanjut ke Starting Lineup → Live Scouting.</p>
{page==="Matches"&&<div className="setupGrid">
<label>HOME TEAM<input className="editInput" value={match.homeName} onChange={e=>setMatch({...match,homeName:e.target.value})}/></label>
<label>AWAY TEAM<input className="editInput" value={match.awayName} onChange={e=>setMatch({...match,awayName:e.target.value})}/></label>
<label>KOMPETISI<input className="editInput" value={match.competition} onChange={e=>setMatch({...match,competition:e.target.value})}/></label>
<label>TANGGAL<input className="editInput" type="date" value={match.date} onChange={e=>setMatch({...match,date:e.target.value})}/></label>
<label>VENUE<input className="editInput" value={match.venue} onChange={e=>setMatch({...match,venue:e.target.value})}/></label>
<label>WASIT<input className="editInput" value={match.referee} onChange={e=>setMatch({...match,referee:e.target.value})}/></label>
<label>FORMAT<select className="editInput" value={match.bestOf} onChange={e=>setMatch({...match,bestOf:Number(e.target.value)})}><option value={3}>BEST OF 3</option><option value={5}>BEST OF 5</option></select></label><label>MODE SCOUTING<select className="editInput" value={match.scoutingMode} onChange={e=>setMatch({...match,scoutingMode:e.target.value as ScoutMode})}><option value="BOTH">SCOUT KEDUA TIM</option><option value="HOME">SCOUT HOME SAJA</option><option value="AWAY">SCOUT AWAY SAJA</option></select></label>
</div>}
{page==="Matches"&&<div className="sectionTitle" style={{marginTop:14}}><div><h3>ALUR PERTANDINGAN</h3><small>Atur nama tim dan detail pertandingan di sini. Roster diinput dari menu Live Scouting.</small></div><button className="btn primary" onClick={onLive}>BUKA LIVE SCOUTING & INPUT ROSTER →</button></div>}
</div>}
{page==="Rotation Center"&&<RotationCenter rallies={rallies} match={match} homePlayers={homePlayers} awayPlayers={awayPlayers}/>}
    {page==="Match Replay"&&<MatchReplay rallies={rallies} match={match} homePlayers={homePlayers} awayPlayers={awayPlayers}/>}
    {page==="Advanced Analysis"&&<AdvancedAnalysis rallies={rallies} match={match} homePlayers={homePlayers} awayPlayers={awayPlayers}/>}
    {page==="Reports"&&<PerformanceReport rallies={rallies} match={match} score={score} setScores={setScores} homePlayers={homePlayers} awayPlayers={awayPlayers}/>}
    {page==="Settings"&&<div className="wide"><div className="sectionTitle"><div><h3>MATCH SETUP</h3><small>Data pertandingan tersimpan otomatis.</small></div><button className="btn primary" onClick={onLive}>BUKA LIVE SCOUTING</button></div><div className="setupGrid"><label>HOME TEAM<input className="editInput" value={match.homeName} onChange={e=>setMatch({...match,homeName:e.target.value})}/></label><label>AWAY TEAM<input className="editInput" value={match.awayName} onChange={e=>setMatch({...match,awayName:e.target.value})}/></label><label>KOMPETISI<input className="editInput" value={match.competition} onChange={e=>setMatch({...match,competition:e.target.value})}/></label><label>TANGGAL<input className="editInput" type="date" value={match.date} onChange={e=>setMatch({...match,date:e.target.value})}/></label><label>VENUE<input className="editInput" value={match.venue} onChange={e=>setMatch({...match,venue:e.target.value})}/></label><label>WASIT<input className="editInput" value={match.referee} onChange={e=>setMatch({...match,referee:e.target.value})}/></label><label>FORMAT<select className="editInput" value={match.bestOf} onChange={e=>setMatch({...match,bestOf:Number(e.target.value)})}><option value={3}>BEST OF 3</option><option value={5}>BEST OF 5</option></select></label><label>MODE SCOUTING<select className="editInput" value={match.scoutingMode} onChange={e=>setMatch({...match,scoutingMode:e.target.value as ScoutMode})}><option value="BOTH">SCOUT KEDUA TIM</option><option value="HOME">SCOUT HOME SAJA</option><option value="AWAY">SCOUT AWAY SAJA</option></select></label></div></div>}
  </div>
}



function PerformanceReport({rallies,match,score,setScores,homePlayers,awayPlayers}:{rallies:Rally[];match:MatchConfig;score:{home:number;away:number};setScores:{set:number;home:number;away:number}[];homePlayers:Player[];awayPlayers:Player[]}){
 const allActions=rallies.flatMap(r=>r.actions||[]).filter(a=>a&&a.player);
 const calc=(team:Side)=>{
  const a=allActions.filter(x=>x.side===team);
  const n=(skill:string,res?:string)=>a.filter(x=>x.skill===skill&&(!res||x.result===res)).length;
  const attack=n("Attack"),kill=n("Attack","Kill"),err=n("Attack","Error"),blocked=n("Attack","Blocked");
  const serve=n("Serve"),ace=n("Serve","Ace"),serveErr=n("Serve","Error");
  const rec=n("Reception"),recPlus=n("Reception","Perfect (3)")+n("Reception","Good (2)");
  const sets=n("Set"),setPlus=n("Set","Perfect (3)")+n("Set","Good (2)");
  const dig=n("Dig"),digPlus=n("Dig","Perfect (3)")+n("Dig","Good (2)");
  const block=n("Block"),blockKill=n("Block","Block Kill");
  const won=rallies.filter(r=>r.winner===team).length;
  return {attack,kill,err,blocked,eff:attack?Math.round((kill-err-blocked)/attack*100):0,serve,ace,serveErr,rec,recPlus,recRate:rec?Math.round(recPlus/rec*100):0,sets,setPlus,setRate:sets?Math.round(setPlus/sets*100):0,dig,digPlus,digRate:dig?Math.round(digPlus/dig*100):0,block,blockKill,won};
 };
 const H=calc("HOME"),A=calc("AWAY");
 const playerRows=(team:Side)=>{
  const roster=team==="HOME"?homePlayers:awayPlayers;
  return roster.map(p=>{const a=allActions.filter(x=>x.side===team&&x.player?.id===p.id);const at=a.filter(x=>x.skill==="Attack");const k=at.filter(x=>x.result==="Kill").length;const e=at.filter(x=>x.result==="Error").length;const b=at.filter(x=>x.result==="Blocked").length;const ac=a.filter(x=>x.skill==="Serve"&&x.result==="Ace").length;const bk=a.filter(x=>x.skill==="Block"&&x.result==="Block Kill").length;return {p,actions:a.length,attack:at.length,kill:k,eff:at.length?Math.round((k-e-b)/at.length*100):0,ace:ac,blockKill:bk};}).filter(x=>x.actions>0).sort((a,b)=>b.kill-a.kill||b.actions-a.actions);
 };
 const hp=playerRows("HOME"),ap=playerRows("AWAY");
 const rotation=(team:Side)=>[1,2,3,4,5,6].map(r=>{const rr=rallies.filter(x=>x.actions?.some(a=>a.side===team&&a.rot===r));const won=rr.filter(x=>x.winner===team).length;const oppStart=rr.filter(x=>x.actions?.[0]?.side!==team).length;const so=rr.filter(x=>x.winner===team&&x.actions?.[0]?.side!==team).length;return {r,n:rr.length,won,soPct:oppStart?Math.round(so/oppStart*100):0};});
 const hr=rotation("HOME"),ar=rotation("AWAY");
 const teamLabel=(t:Side)=>t==="HOME"?match.homeName:match.awayName;
 const winner=score.home===score.away?null:(score.home>score.away?"HOME":"AWAY");
 const top=(rows:any[])=>rows[0];
 const downloadReport=()=>{const lines=["AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC — MATCH PERFORMANCE REPORT",`${match.homeName} vs ${match.awayName}`,`Kompetisi: ${match.competition} | Tanggal: ${match.date} | Venue: ${match.venue}`,`Skor: ${score.home} : ${score.away}`,`Rally: ${rallies.length}`,"","TEAM SUMMARY",`${match.homeName}: Attack ${H.attack}, Kill ${H.kill}, Eff ${H.eff}%, Ace ${H.ace}, Receive+ ${H.recPlus}, Set+ ${H.setPlus}, Dig+ ${H.digPlus}, Block Kill ${H.blockKill}, Rally W ${H.won}`,`${match.awayName}: Attack ${A.attack}, Kill ${A.kill}, Eff ${A.eff}%, Ace ${A.ace}, Receive+ ${A.recPlus}, Set+ ${A.setPlus}, Dig+ ${A.digPlus}, Block Kill ${A.blockKill}, Rally W ${A.won}`,"","SET SCORES",...setScores.map(x=>`Set ${x.set}: ${x.home} : ${x.away}`),"","PLAYER ATTACK LEADERS",...[["HOME",hp], ["AWAY",ap]].flatMap(([lab,rows]:any)=>[String(lab),...rows.slice(0,8).map((x:any)=>`#${x.p.number} ${x.p.name}: ${x.kill} K, ${x.attack} ATT, ${x.eff}% Eff`)])].join("\n");downloadText("volleyball-scout-pro-match-report.txt",lines)};
 return <div className="reportV41">
  <div className="reportHero"><div><div className="tag">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC • V84</div><h2>AUTOMATIC PERFORMANCE REPORT</h2><p>Laporan pertandingan otomatis berdasarkan seluruh data rally yang sudah direkam.</p></div><button className="btn primary" onClick={downloadReport}>DOWNLOAD REPORT</button></div>
  <div className="reportMeta"><div><small>PERTANDINGAN</small><b>{match.homeName} <span>vs</span> {match.awayName}</b></div><div><small>KOMPETISI</small><b>{match.competition||"-"}</b></div><div><small>VENUE</small><b>{match.venue||"-"}</b></div><div><small>DATA RALLY</small><b>{rallies.length}</b></div></div>
  <div className="reportScore"><div className="reportTeam home"><small>HOME</small><b>{match.homeName}</b><strong>{score.home}</strong></div><div className="reportVs">{winner?`LEADING • ${teamLabel(winner)}`:"SCORE SEIMBANG"}<span>{setScores.length} SET SELESAI</span></div><div className="reportTeam away"><small>AWAY</small><b>{match.awayName}</b><strong>{score.away}</strong></div></div>
  <div className="reportSection"><div className="sectionTitle"><div><h3>TEAM PERFORMANCE</h3><small>Perbandingan statistik utama tanpa mengubah data scouting.</small></div></div><div className="reportTeamGrid">{[["HOME",H,match.homeName],["AWAY",A,match.awayName]].map(([lab,x,name]:any)=><div className={'reportTeamCard '+String(lab).toLowerCase()} key={lab}><div className="reportTeamTitle"><span>{lab}</span><b>{name}</b></div><div className="reportKpis">{[["ATTACK",x.attack],["KILL",x.kill],["EFF",x.eff+"%"],["ACE",x.ace],["SERV ERR",x.serveErr],["REC+",x.recPlus],["SET+",x.setPlus],["DIG+",x.digPlus],["BLOCK KILL",x.blockKill]].map((z:any)=><div key={z[0]}><small>{z[0]}</small><b>{z[1]}</b></div>)}</div></div>)}</div></div>
  <div className="reportGrid2"><div className="reportSection"><div className="sectionTitle"><div><h3>SET SUMMARY</h3><small>Riwayat skor set yang sudah selesai.</small></div></div>{setScores.length?setScores.map(x=><div className="reportLine" key={x.set}><span>SET {x.set}</span><b>{x.home} : {x.away}</b><small>{x.home>x.away?match.homeName:x.away> x.home?match.awayName:"IMBANG"}</small></div>):<div className="empty">Belum ada set selesai.</div>}</div>
   <div className="reportSection"><div className="sectionTitle"><div><h3>ROTATION SNAPSHOT</h3><small>Rally menang dan side-out per rotasi.</small></div></div><div className="reportRotGrid">{[["HOME",hr],["AWAY",ar]].map(([lab,rows]:any)=><div key={lab}><b>{lab}</b>{rows.map((x:any)=><div className="reportRotRow" key={x.r}><span>R{x.r}</span><i><em style={{width:`${x.n?Math.round(x.won/x.n*100):0}%`}}/></i><small>{x.won} W • {x.soPct}% SO</small></div>)}</div>)}</div></div></div>
  <div className="reportGrid2"><div className="reportSection"><div className="sectionTitle"><div><h3>PLAYER HIGHLIGHTS</h3><small>Pemain dengan data aksi terbanyak dan hasil attack.</small></div></div><div className="highlightCols">{[["HOME",hp],["AWAY",ap]].map(([lab,rows]:any)=><div key={lab}><b>{lab}</b>{rows.slice(0,5).map((x:any,i:number)=><div className="highlightRow" key={x.p.id}><span>#{x.p.number}</span><strong>{x.p.name}</strong><small>{x.kill} K • {x.attack} ATT • {x.eff}%</small></div>)}</div>)}</div></div>
   <div className="reportSection"><div className="sectionTitle"><div><h3>DATA QUALITY</h3><small>Ringkasan kelengkapan data yang tersimpan.</small></div></div><div className="qualityList"><div><span>Rally selesai</span><b>{rallies.length}</b></div><div><span>Total aksi</span><b>{allActions.length}</b></div><div><span>Attack tercatat</span><b>{H.attack+A.attack}</b></div><div><span>Serve tercatat</span><b>{H.serve+A.serve}</b></div><div><span>Target zona terisi</span><b>{allActions.filter(a=>a.target).length}</b></div><div><span>Direction terisi</span><b>{allActions.filter(a=>a.direction).length}</b></div></div></div></div>
 </div>;
}

function RotationCenter({rallies,match,homePlayers,awayPlayers}:{rallies:Rally[];match:MatchConfig;homePlayers:Player[];awayPlayers:Player[]}){
 const [team,setTeam]=useState<Side>("HOME");
 const [selected,setSelected]=useState<number|null>(null);
 const teamName=team==="HOME"?match.homeName:match.awayName;
 const rows=[1,2,3,4,5,6].map(r=>{
   const rr=rallies.filter(x=>{
     const teamAction=x.actions.find(a=>a.side===team);
     return teamAction && teamAction.rot===r;
   });
   const won=rr.filter(x=>x.winner===team).length;
   const lost=rr.filter(x=>x.winner && x.winner!==team).length;
   const serverSide=rr.map(x=>x.actions[0]?.side).filter(Boolean) as Side[];
   const sideout=rr.filter(x=>x.winner===team && x.actions[0]?.side!==team).length;
   const breakPts=rr.filter(x=>x.winner===team && x.actions[0]?.side===team).length;
   const serve=rr.filter(x=>x.actions.some(a=>a.side===team&&a.skill==="Serve")).length;
   const ace=rr.filter(x=>x.actions.some(a=>a.side===team&&a.skill==="Serve"&&a.result==="Ace")).length;
   const receive=rr.filter(x=>x.actions.some(a=>a.side===team&&a.skill==="Reception")).length;
   const attack=rr.filter(x=>x.actions.some(a=>a.side===team&&a.skill==="Attack")).length;
   const kill=rr.filter(x=>x.actions.some(a=>a.side===team&&a.skill==="Attack"&&a.result==="Kill")).length;
   const soOpp=rr.filter(x=>x.actions[0]?.side!==team).length;
   return {r,n:rr.length,won,lost,sideout,breakPts,serve,ace,receive,attack,kill,soPct:soOpp?Math.round(sideout/soOpp*100):0,winPct:rr.length?Math.round(won/rr.length*100):0};
 });
 const total=rows.reduce((a,x)=>({...a,n:a.n+x.n,won:a.won+x.won,lost:a.lost+x.lost,sideout:a.sideout+x.sideout,breakPts:a.breakPts+x.breakPts}),{n:0,won:0,lost:0,sideout:0,breakPts:0});
 const best=rows.reduce((a,b)=>b.winPct>a.winPct?b:a,rows[0]);
 const selectedRow=selected?rows.find(x=>x.r===selected):null;
 return <div className="rotationCenter">
  <div className="rotationHero"><div><div className="tag">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</div><h3>ROTATION & SIDE-OUT CENTER</h3><p>Analisis R1–R6: side-out, break point, kemenangan rally, serve, receive, dan attack.</p></div><div className="rotationKpi"><button className="miniStat" onClick={()=>setTeam("HOME")}><small>TEAM AKTIF</small><b>{teamName}</b></button><div className="miniStat"><small>WIN RALLY</small><b>{total.won}</b></div><div className="miniStat"><small>WIN RATE</small><b>{total.n?Math.round(total.won/total.n*100):0}%</b></div><div className="miniStat"><small>BEST ROTATION</small><b>R{best?.r||1}</b></div></div></div>
  <div className="toolbar"><div className="seg"><button className={team==="HOME"?"sel":""} onClick={()=>{setTeam("HOME");setSelected(null)}}>HOME</button><button className={team==="AWAY"?"sel":""} onClick={()=>{setTeam("AWAY");setSelected(null)}}>AWAY</button></div><span style={{marginLeft:8,color:"#7e9db2",fontSize:10}}>Klik kartu R1–R6 untuk detail rotasi.</span></div>
  {!rallies.length?<div className="emptyState">Belum ada data rally. Rekam rally di Live Scouting terlebih dahulu.</div>:<><div className="rotationGridPro">{rows.map(x=><button className={"rotationProCard "+(selected===x.r?"on":"")} key={x.r} onClick={()=>setSelected(selected===x.r?null:x.r)}><div className="rotHead"><strong>R{x.r}</strong><span>{x.n} rally</span></div><div className="rotMetric"><span>Rally menang</span><b>{x.won}</b></div><div className="rotBar"><i style={{width:`${x.n?Math.round(x.won/x.n*100):0}%`}}/></div><div className="rotMetric"><span>Side-out</span><b>{x.soPct}%</b></div><div className="rotBar"><i style={{width:`${x.soPct}%`}}/></div><div className="rotMetric"><span>Break point</span><b>{x.breakPts}</b></div><div className="rotMetric"><span>Attack / Kill</span><b>{x.attack} / {x.kill}</b></div><div className="rotMetric"><span>Serve / Ace</span><b>{x.serve} / {x.ace}</b></div><span className="rotBadge">{x.won} W • {x.lost} L</span></button>)}</div>
   <div className="wide"><div className="sectionTitle"><div><h3>ROTATION MATRIX</h3><small>Perbandingan R1–R6 untuk {teamName}.</small></div></div><div className="rotationTable"><div className="rtr head"><div>METRIK</div>{rows.map(x=><div key={x.r}>R{x.r}</div>)}</div>{[["Rally",x=>x.n],["Menang",x=>x.won],["Kalah",x=>x.lost],["Side-out %",x=>x.soPct+"%"],["Break point",x=>x.breakPts],["Attack",x=>x.attack],["Kill",x=>x.kill],["Ace",x=>x.ace]].map(([name,get])=><div className="rtr" key={String(name)}><div><b>{String(name)}</b></div>{rows.map(x=><div key={x.r}>{(get as any)(x)}</div>)}</div>)}</div></div>
   {selectedRow&&<div className="rotationInsight"><div className="insight"><h4>DETAIL R{selectedRow.r}</h4><p><b>{selectedRow.n}</b> rally tercatat, <b>{selectedRow.won}</b> menang dan <b>{selectedRow.lost}</b> kalah. Side-out <b>{selectedRow.soPct}%</b>, break point <b>{selectedRow.breakPts}</b>.</p></div><div className="insight"><h4>PROFIL AKSI</h4><p>Attack <b>{selectedRow.attack}</b> dengan <b>{selectedRow.kill}</b> kill • Serve <b>{selectedRow.serve}</b> dengan <b>{selectedRow.ace}</b> ace • Receive <b>{selectedRow.receive}</b>.</p></div></div>}
  </>}
 </div>
}


function MatchReplay({rallies,match,homePlayers,awayPlayers}:{rallies:Rally[];match:MatchConfig;homePlayers:Player[];awayPlayers:Player[]}){
 const [setFilter,setSetFilter]=useState("ALL");
 const [team,setTeam]=useState<"ALL"|Side>("ALL");
 const [playerFilter,setPlayerFilter]=useState("ALL");
 const [skillFilter,setSkillFilter]=useState("ALL");
 const [resultFilter,setResultFilter]=useState("ALL");
 const [rotationFilter,setRotationFilter]=useState("ALL");
 const [selected,setSelected]=useState<number|null>(rallies.length?rallies[rallies.length-1].id:null);
 const [step,setStep]=useState(0);
 const allPlayers=useMemo(()=>[...homePlayers,...awayPlayers].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i),[homePlayers,awayPlayers]);
 const skills=["Serve","Reception","Set","Attack","Block","Dig","Cover","Free Ball"];
 const results=["Perfect (3)","Good (2)","Positive (1)","Error","Kill","Blocked","Ace","Block Kill","Dig+","Receive+","Set Good"];
 const filtered=useMemo(()=>rallies.filter(r=>{
   if(setFilter!=="ALL"&&String(r.set)!==setFilter)return false;
   if(team!=="ALL"&&!r.actions.some(a=>a.side===team))return false;
   if(rotationFilter!=="ALL"&&!r.actions.some(a=>String(a.rot)===rotationFilter))return false;
   if(playerFilter!=="ALL"&&!r.actions.some(a=>String(a.player?.id)===playerFilter))return false;
   if(skillFilter!=="ALL"&&!r.actions.some(a=>a.skill===skillFilter))return false;
   if(resultFilter!=="ALL"&&!r.actions.some(a=>a.result===resultFilter))return false;
   return true;
 }),[rallies,setFilter,team,rotationFilter,playerFilter,skillFilter,resultFilter]);
 useEffect(()=>{if(filtered.length&&!filtered.some(r=>r.id===selected)){setSelected(filtered[filtered.length-1].id);setStep(0)}},[filtered,selected]);
 const rally=filtered.find(r=>r.id===selected)||null;
 const actions=rally?.actions||[];
 const visibleCount=rally?Math.min(actions.length,step):0;
 const visible=actions.slice(0,visibleCount);
 const homeWins=filtered.filter(r=>r.winner==="HOME").length;
 const awayWins=filtered.filter(r=>r.winner==="AWAY").length;
 const choose=(id:number)=>{setSelected(id);setStep(0)};
 const next=()=>setStep(x=>Math.min(actions.length,x+1));
 const prev=()=>setStep(x=>Math.max(0,x-1));
 return <div className="rotationCenter">
  <div className="replayHero"><div><div className="tag">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC • V38</div><h3>MATCH REPLAY & RALLY TIMELINE</h3><p>Buka kembali setiap rally dan lihat urutan aksi, pemain, posisi, rotasi, zona, arah, serta hasilnya.</p></div><div className="miniActions"><button onClick={()=>{setSetFilter("ALL");setTeam("ALL");setPlayerFilter("ALL");setSkillFilter("ALL");setResultFilter("ALL");setRotationFilter("ALL")}}>RESET FILTER</button></div></div>
  <div className="replayKpi"><div className="miniStat"><small>RALLY FILTERED</small><b>{filtered.length}</b></div><div className="miniStat"><small>HOME POINT</small><b>{homeWins}</b></div><div className="miniStat"><small>AWAY POINT</small><b>{awayWins}</b></div><div className="miniStat"><small>AKSI RALLY</small><b>{actions.length}</b></div></div>
  <div className="toolbar replayFilters"><div className="seg"><button className={team==="ALL"?"sel":""} onClick={()=>setTeam("ALL")}>SEMUA</button><button className={team==="HOME"?"sel":""} onClick={()=>setTeam("HOME")}>HOME</button><button className={team==="AWAY"?"sel":""} onClick={()=>setTeam("AWAY")}>AWAY</button></div><label>SET <select value={setFilter} onChange={e=>setSetFilter(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>SET {x}</option>)}</select></label><label>ROTASI <select value={rotationFilter} onChange={e=>setRotationFilter(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>R{x}</option>)}</select></label><label>PEMAIN <select value={playerFilter} onChange={e=>setPlayerFilter(e.target.value)}><option value="ALL">SEMUA PEMAIN</option>{allPlayers.map(p=><option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}</select></label><label>SKILL <select value={skillFilter} onChange={e=>setSkillFilter(e.target.value)}><option value="ALL">SEMUA SKILL</option>{skills.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>RESULT <select value={resultFilter} onChange={e=>setResultFilter(e.target.value)}><option value="ALL">SEMUA RESULT</option>{results.map(x=><option key={x} value={x}>{x}</option>)}</select></label></div>
  {!filtered.length?<div className="replayEmpty">Belum ada rally yang cocok dengan filter. Rekam rally di Live Scouting terlebih dahulu.</div>:<div className="replayGrid">
   <div className="wide" style={{padding:0}}><div className="ph"><span>DAFTAR RALLY</span><b>{filtered.length} rally</b></div><div className="replayList">{filtered.slice().reverse().map(r=><button className={"replayItem "+(selected===r.id?"sel":"")} key={r.id} onClick={()=>choose(r.id)}><div className="replayNum">R{r.id}</div><div className="replayMain"><b>SET {r.set} • {r.winner||"BELUM"}</b><small>{r.actions.length} aksi • {r.actions.map(a=>`${a.skill}: ${a.result}`).join(" → ")||"Tidak ada aksi"}</small></div><div className="replayScore">{r.after?.home??"-"}:{r.after?.away??"-"}</div></button>)}</div></div>
   <div className="wide replayDetail"><div className="sectionTitle"><div><h3>{rally?`RALLY #${rally.id}`:"PILIH RALLY"}</h3><small>{rally?`SET ${rally.set} • ${rally.actions.length} aksi`:`Pilih rally dari daftar.`}</small></div>{rally&&<span className="replayTag">{rally.pointReason||"RALLY"}</span>}</div>
    {rally?<><div className="detailGrid"><div className="detailCard"><small>SKOR SEBELUM</small><b>{rally.before.home}:{rally.before.away}</b></div><div className="detailCard"><small>SKOR SESUDAH</small><b>{rally.after?.home??rally.before.home}:{rally.after?.away??rally.before.away}</b></div><div className="detailCard"><small>PEMENANG</small><b>{rally.winner||"-"}</b></div><div className="detailCard"><small>AKSI</small><b>{actions.length}</b></div></div><div className="replayProgress"><i style={{width:`${actions.length?Math.round(visibleCount/actions.length*100):0}%`}}/></div><div className="miniActions" style={{marginBottom:10}}><button onClick={()=>setStep(0)}>⏮ AWAL</button><button onClick={prev} disabled={step===0}>← SEBELUM</button><button className="primary" onClick={next} disabled={step>=actions.length}>LANGKAH BERIKUT →</button><button onClick={()=>setStep(actions.length)}>TAMPILKAN SEMUA</button></div><div className="replaySequence">{visible.length?visible.map((a,i)=><div className="replayAction" key={a.id}><div className="replayActionNo">{i+1}</div><div><b>#{a.player?.number} {a.player?.name} • {a.skill}</b><small>{a.side} • P{a.pos} • R{a.rot}{a.target?` • ${a.target}`:""}{a.direction?` • ${a.direction}`:""}{a.tempo?` • ${a.tempo}`:""}{a.timestamp?` • ${a.timestamp}`:""}</small></div><span className={a.result==="Kill"||a.result==="Ace"||a.result==="Block Kill"?"replayTag":"replayTag"}>{a.result}</span></div>):<div className="replayEmpty">Tekan <b>LANGKAH BERIKUT</b> untuk memulai replay sequence.</div>}</div>{visibleCount===actions.length&&<div className="replayWin"><b>{rally.winner?`${rally.winner} MENANG RALLY`:"RALLY SELESAI"}</b> • {rally.pointReason||"Tidak ada point reason"}</div>}</>:<div className="replayEmpty">Pilih satu rally dari daftar.</div>}
   </div>
  </div>}
 </div>
}

function TacticalAnalysis({rallies,match,homePlayers,awayPlayers}:{rallies:Rally[];match:MatchConfig;homePlayers:Player[];awayPlayers:Player[]}){
 const [team,setTeam]=useState<Side>("HOME");
 const [setFilter,setSetFilter]=useState("ALL");
 const [rotation,setRotation]=useState("ALL");
 const [playerId,setPlayerId]=useState("ALL");
 const [zone,setZone]=useState("ALL");
 const [direction,setDirection]=useState("ALL");
 const roster=team==="HOME"?homePlayers:awayPlayers;
 const actions=useMemo(()=>rallies.flatMap(r=>Array.isArray(r.actions)?r.actions.map(a=>({...a,set:r.set,rallyId:r.id,winner:r.winner,pointReason:r.pointReason} as any)):[]).filter(a=>a.side===team && (setFilter==="ALL"||String(a.set)===setFilter) && (rotation==="ALL"||String(a.rot)===rotation) && (playerId==="ALL"||String(a.player.id)===playerId) && (zone==="ALL"||a.target===zone) && (direction==="ALL"||a.direction===direction)),[rallies,team,setFilter,rotation,playerId,zone,direction]);
 const attacks=actions.filter(a=>a.skill==="Attack");
 const services=actions.filter(a=>a.skill==="Serve");
 const attackByPlayer=roster.map(p=>{const a=attacks.filter(x=>x.player?.id===p.id);const k=a.filter(x=>x.result==="Kill").length;const e=a.filter(x=>x.result==="Error").length;const b=a.filter(x=>x.result==="Blocked").length;return {p,n:a.length,k,e,b,eff:a.length?Math.round((k-e-b)/a.length*100):0}}).filter(x=>x.n);
 const attackByRotation=[1,2,3,4,5,6].map(r=>{const a=attacks.filter(x=>x.rot===r);const k=a.filter(x=>x.result==="Kill").length;return {r,n:a.length,k,eff:a.length?Math.round((k-a.filter(x=>x.result==="Error").length-a.filter(x=>x.result==="Blocked").length)/a.length*100):0}});
 const zoneRows=["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"].map(z=>{const a=attacks.filter(x=>x.target===z);return {z,n:a.length,k:a.filter(x=>x.result==="Kill").length,e:a.filter(x=>x.result==="Error").length,b:a.filter(x=>x.result==="Blocked").length}});
 const dirRows=["Cross","Line","Tip","Middle","Seam"].map(d=>{const a=attacks.filter(x=>x.direction===d);return {d,n:a.length,k:a.filter(x=>x.result==="Kill").length,e:a.filter(x=>x.result==="Error").length}});
 const serviceZoneRows=["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"].map(z=>{const a=services.filter(x=>x.target===z);return {z,n:a.length,ace:a.filter(x=>x.result==="Ace").length,err:a.filter(x=>x.result==="Error").length}});
 const serviceDirRows=["Cross","Line","Middle","Seam","Tip"].map(d=>{const a=services.filter(x=>x.direction===d);return {d,n:a.length,ace:a.filter(x=>x.result==="Ace").length,err:a.filter(x=>x.result==="Error").length}});
 const serviceByPlayer=roster.map(p=>{const a=services.filter(x=>x.player?.id===p.id);return {p,n:a.length,ace:a.filter(x=>x.result==="Ace").length,err:a.filter(x=>x.result==="Error").length}}).filter(x=>x.n);
 const maxZone=Math.max(1,...zoneRows.map(x=>x.n));
 const maxDir=Math.max(1,...dirRows.map(x=>x.n));
 const maxServiceZone=Math.max(1,...serviceZoneRows.map(x=>x.n));
 const maxServiceDir=Math.max(1,...serviceDirRows.map(x=>x.n));
 const recent=rallies.filter(r=>r.actions.some(a=>a.side===team && (setFilter==="ALL"||String(r.set)===setFilter))).slice(-8).reverse();
 const experienceRallies=rallies.filter(r=>setFilter==="ALL"||String(r.set)===setFilter).slice().sort((a,b)=>a.id-b.id);
 const experienceActions=experienceRallies.flatMap(r=>r.actions.filter(a=>a.side===team));
 const playerExperience=roster.map(p=>{
  const pa=experienceActions.filter(a=>a.player?.id===p.id);
  const count=(skill:string,result?:string)=>pa.filter(a=>a.skill===skill&&(!result||a.result===result)).length;
  return {p,actions:pa.length,attack:count("Attack"),kill:count("Attack","Kill"),attackError:count("Attack","Error"),blocked:count("Attack","Blocked"),serve:count("Serve"),ace:count("Serve","Ace"),blockKill:count("Block","Block Kill"),dig:count("Dig"),receive:count("Reception"),sets:count("Set")};
 }).filter(x=>x.actions>0);
 const topBy=(key:"kill"|"ace"|"blockKill"|"dig")=>playerExperience.filter(x=>x[key]>0).sort((a,b)=>b[key]-a[key])[0]||null;
 const spotlight=[{label:"ATTACK POINT",row:topBy("kill"),key:"kill",unit:"kill"},{label:"ACE SERVICE",row:topBy("ace"),key:"ace",unit:"ace"},{label:"BLOCK POINT",row:topBy("blockKill"),key:"blockKill",unit:"block kill"},{label:"DIG TERBANYAK",row:topBy("dig"),key:"dig",unit:"dig"}];
 const [cardPlayerId,setCardPlayerId]=useState<string>("ALL");
 const cardPlayer=playerExperience.find(x=>String(x.p.id)===cardPlayerId)||playerExperience.slice().sort((a,b)=>b.actions-a.actions)[0]||null;
 const momentumRows=experienceRallies.filter(r=>r.after&&typeof r.after.home==="number"&&typeof r.after.away==="number");
 const momentumStart=momentumRows.length?momentumRows[0].before:{home:0,away:0};
 const momentumPoints=[momentumStart,...momentumRows.map(r=>r.after!)];
 const momentumW=640,momentumH=190,momentumPad=22;
 const momentumMax=Math.max(1,...momentumPoints.map(x=>Math.max(x.home,x.away)));
 const momentumX=(i:number)=>momentumPad+(momentumPoints.length<=1?0:i*(momentumW-2*momentumPad)/(momentumPoints.length-1));
 const momentumY=(v:number)=>momentumH-momentumPad-(v/momentumMax)*(momentumH-2*momentumPad);
 const homeLine=momentumPoints.map((x,i)=>`${momentumX(i)},${momentumY(x.home)}`).join(" ");
 const awayLine=momentumPoints.map((x,i)=>`${momentumX(i)},${momentumY(x.away)}`).join(" ");
 const winners=momentumRows.map(r=>r.winner).filter(Boolean) as Side[];
 let currentRun:Side|null=null,runLength=0,bestRun:{side:Side;length:number}|null=null;
 winners.forEach(w=>{if(w===currentRun)runLength++;else{currentRun=w;runLength=1;}if(!bestRun||runLength>bestRun.length)bestRun={side:w,length:runLength};});
 let comebackCount=0,previousLead=0;
 momentumRows.forEach(r=>{const lead=r.after!.home-r.after!.away;const sign=Math.sign(lead);if(sign&&previousLead&&sign!==previousLead)comebackCount++;if(sign)previousLead=sign;});
 const exportPlayerCard=()=>{
  if(!cardPlayer)return;
  const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=720;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  const g=ctx.createLinearGradient(0,0,1200,720);g.addColorStop(0,"#071725");g.addColorStop(1,"#123b50");ctx.fillStyle=g;ctx.fillRect(0,0,1200,720);
  ctx.fillStyle="#53dfc3";ctx.font="bold 24px Arial";ctx.fillText("AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC",70,75);
  ctx.fillStyle="#ffffff";ctx.font="bold 54px Arial";ctx.fillText(`#${cardPlayer.p.number}  ${cardPlayer.p.name||"TANPA NAMA"}`,70,165);
  ctx.fillStyle="#9cc3d5";ctx.font="bold 25px Arial";ctx.fillText(`${cardPlayer.p.role||"-"}  •  ${team==="HOME"?match.homeName:match.awayName}  •  ${setFilter==="ALL"?"SEMUA SET":`SET ${setFilter}`}`,70,215);
  const metrics=[["TOTAL AKSI",cardPlayer.actions],["ATTACK",cardPlayer.attack],["KILL",cardPlayer.kill],["ATTACK ERROR",cardPlayer.attackError],["BLOCKED",cardPlayer.blocked],["SERVICE",cardPlayer.serve],["ACE",cardPlayer.ace],["BLOCK KILL",cardPlayer.blockKill],["DIG",cardPlayer.dig],["RECEIVE",cardPlayer.receive],["SET",cardPlayer.sets]];
  metrics.forEach((m,i)=>{const col=i%3,row=Math.floor(i/3),x=70+col*365,y=285+row*105;ctx.fillStyle="#102b3e";ctx.fillRect(x,y,320,78);ctx.fillStyle="#8eb4c8";ctx.font="bold 17px Arial";ctx.fillText(String(m[0]),x+20,y+28);ctx.fillStyle="#ffffff";ctx.font="bold 32px Arial";ctx.fillText(String(m[1]),x+20,y+63);});
  ctx.fillStyle="#6f9ab0";ctx.font="16px Arial";ctx.fillText("Statistik berdasarkan aksi yang benar-benar tercatat pada scouting.",70,665);
  const link=document.createElement("a");link.download=`player-card-${cardPlayer.p.number}-${(cardPlayer.p.name||"player").replace(/[^a-z0-9]+/gi,"-")}.png`;link.href=canvas.toDataURL("image/png");link.click();
 };
 return <div className="wide">
   <div className="hero"><div><div className="tag">TACTICAL ANALYSIS • {team}</div><h2>ANALISIS TAKTIS</h2><p>Lihat hubungan <b>pemain → rotasi → zona → arah → hasil</b> dari data scouting yang sudah direkam.</p></div><div className="miniActions"><button onClick={()=>{setTeam(team==="HOME"?"AWAY":"HOME");setPlayerId("ALL")}}>{team==="HOME"?match.awayName:match.homeName}</button></div></div>
   <div className="toolbar"><div className="seg"><button className={team==="HOME"?"sel":""} onClick={()=>{setTeam("HOME");setPlayerId("ALL")}}>HOME</button><button className={team==="AWAY"?"sel":""} onClick={()=>{setTeam("AWAY");setPlayerId("ALL")}}>AWAY</button></div><label>SET <select value={setFilter} onChange={e=>setSetFilter(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>SET {x}</option>)}</select></label><label>ROTASI <select value={rotation} onChange={e=>setRotation(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>R{x}</option>)}</select></label><label>PEMAIN <select value={playerId} onChange={e=>setPlayerId(e.target.value)}><option value="ALL">SEMUA</option>{roster.map(p=><option key={p.id} value={p.id}>#{p.number} {p.name}</option>)}</select></label></div>
   <div className="tacKpi"><div className="miniStat"><small>ATTACK</small><b>{attacks.length}</b></div><div className="miniStat"><small>KILL</small><b>{attacks.filter(a=>a.result==="Kill").length}</b></div><div className="miniStat"><small>EFFICIENCY</small><b>{attacks.length?Math.round((attacks.filter(a=>a.result==="Kill").length-attacks.filter(a=>a.result==="Error").length-attacks.filter(a=>a.result==="Blocked").length)/attacks.length*100):0}%</b></div><div className="miniStat"><small>SERVICE / ACE</small><b>{services.length} / {services.filter(a=>a.result==="Ace").length}</b></div><div className="miniStat"><small>FILTERED ACTIONS</small><b>{actions.length}</b></div></div>
   <div className="tacFilters" style={{marginTop:10}}><span className="tacBadge">TARGET</span>{["ALL","Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"].map(z=><button key={z} className={zone===z?"filterPill on":"filterPill"} onClick={()=>setZone(z)}>{z}</button>)}<span className="tacBadge">ARAH</span>{["ALL","Cross","Line","Middle","Seam"].map(d=><button key={d} className={direction===d?"filterPill on":"filterPill"} onClick={()=>setDirection(d)}>{d}</button>)}</div>
   <div className="tacGrid">
    <div className="tacCard"><div className="sectionTitle"><div><h3>ATTACK BY PLAYER</h3><small>Pemain mana yang paling efektif dalam kondisi filter aktif?</small></div></div><div className="statTable tacTable"><div className="tr th"><b>PLAYER</b><b>ATT</b><b>KILL</b><b>ERR</b><b>BLK</b><b>EFF</b></div>{attackByPlayer.length?attackByPlayer.sort((a,b)=>b.k-a.k).map(x=><div className="tr" key={x.p.id}><span><b>#{x.p.number} {x.p.name}</b><small>{x.p.role}</small></span><b>{x.n}</b><b className="tacGood">{x.k}</b><b className="tacBad">{x.e}</b><b>{x.b}</b><b>{x.eff}%</b></div>):<div className="tacEmpty">Belum ada data attack pada filter ini.</div>}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>ATTACK BY ROTATION</h3><small>R1–R6</small></div></div><div className="tacBars">{attackByRotation.map(x=><div className="tacBar" key={x.r}><span>R{x.r}</span><i style={{["--w" as any]:`${Math.round(x.n/Math.max(1,...attackByRotation.map(y=>y.n))*100)}%`}}></i><b>{x.n} / {x.k}</b></div>)}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>ATTACK TARGET</h3><small>Distribusi serangan Z1–Z9</small></div></div><div className="tacBars">{zoneRows.map(x=><div className="tacBar" key={x.z}><span>{x.z}</span><i style={{["--w" as any]:`${Math.round(x.n/maxZone*100)}%`}}></i><b>{x.n} <small>({x.k}K)</small></b></div>)}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>ATTACK DIRECTION</h3><small>Arah serangan yang paling sering dipakai</small></div></div><div className="tacBars">{dirRows.map(x=><div className="tacBar" key={x.d}><span>{x.d}</span><i style={{["--w" as any]:`${Math.round(x.n/maxDir*100)}%`}}></i><b>{x.n} <small>({x.k}K)</small></b></div>)}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>SERVICE TARGET ZONE</h3><small>Jumlah service ke setiap zona • Ace dan error</small></div><span className="tacBadge">{services.length} SERVICE</span></div><div className="tacBars">{serviceZoneRows.map(x=><div className="tacBar" key={x.z}><span>{x.z}</span><i style={{["--w" as any]:`${Math.round(x.n/maxServiceZone*100)}%`}}></i><b>{x.n} <small>({x.ace} ACE / {x.err} ERR)</small></b></div>)}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>SERVICE DIRECTION</h3><small>Arah service • Ace dan error</small></div></div><div className="tacBars">{serviceDirRows.map(x=><div className="tacBar" key={x.d}><span>{x.d}</span><i style={{["--w" as any]:`${Math.round(x.n/maxServiceDir*100)}%`}}></i><b>{x.n} <small>({x.ace} ACE / {x.err} ERR)</small></b></div>)}</div></div>
    <div className="tacCard"><div className="sectionTitle"><div><h3>SERVICE BY PLAYER</h3><small>Rekap service per pemain</small></div></div><div className="statTable tacTable"><div className="tr th"><b>PLAYER</b><b>SERVICE</b><b>ACE</b><b>ERROR</b></div>{serviceByPlayer.length?serviceByPlayer.map(x=><div className="tr" key={x.p.id}><span><b>#{x.p.number} {x.p.name}</b><small>{x.p.role}</small></span><b>{x.n}</b><b className="tacGood">{x.ace}</b><b className="tacBad">{x.err}</b></div>):<div className="tacEmpty">Belum ada data service pada filter ini.</div>}</div></div>
   </div>
   <div className="tacCard" style={{marginTop:10}}><div className="sectionTitle"><div><h3>RALLY TACTICAL SEQUENCE</h3><small>Urutan aksi yang terekam untuk membaca pola permainan.</small></div><span className="tacBadge">{recent.length} RALLY</span></div>{recent.length?recent.map(r=><div className="sequenceRow" key={r.id}><div className="sequenceNo">R{r.id}</div><div><b>SET {r.set}</b><small>{r.actions.map(a=>`${a.player?.name||"?"} • ${a.skill} • ${a.result}${a.target?` • ${a.target}`:""}${a.direction?` • ${a.direction}`:""}`).join(" → ")}</small></div><div className="sequenceResult">{r.winner===team?"POINT +":"POINT LAWAN"}</div></div>):<div className="tacEmpty">Belum ada rally untuk tim/filter ini.</div>}</div>
   <div className="tacCard" style={{marginTop:12}}>
    <div className="sectionTitle"><div><h3>PLAYER SPOTLIGHT</h3><small>Pemain unggulan berdasarkan kategori statistik yang tercatat. Tidak memakai skor gabungan buatan.</small></div><span className="tacBadge">{playerExperience.length} PEMAIN AKTIF</span></div>
    <div className="perfGrid">{spotlight.map(item=><div className="perfCard" key={item.label}><div className="tacTitle">{item.label}</div>{item.row?<><div className="perfName" style={{marginTop:10}}>#{item.row.p.number} {item.row.p.name||"Tanpa nama"}</div><div className="perfRole">{item.row.p.role||"-"}</div><div className="perfScore">{(item.row as any)[item.key]} <span style={{fontSize:12}}>{item.unit}</span></div></>:<div className="tacEmpty">Belum ada data kategori ini.</div>}</div>)}</div>
   </div>
   <div className="tacCard" style={{marginTop:12}}>
    <div className="sectionTitle"><div><h3>MOMENTUM TRACKER</h3><small>Perubahan skor per rally berdasarkan snapshot skor sebelum dan sesudah rally.</small></div><span className="tacBadge">{momentumRows.length} RALLY BERSKOR</span></div>
    {momentumRows.length?<>
     <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:10,marginBottom:8}}><b style={{color:"#54d9bf"}}>● {match.homeName}</b><b style={{color:"#f0b35a"}}>● {match.awayName}</b><span>Perubahan keunggulan: <b>{comebackCount}</b></span><span>Streak terpanjang: <b>{bestRun?.length||0} rally ({bestRun?.side==="HOME"?match.homeName:match.awayName})</b></span></div>
     <div style={{overflowX:"auto"}}><svg viewBox={`0 0 ${momentumW} ${momentumH}`} style={{width:"100%",minWidth:420,height:"auto",background:"#081725",borderRadius:9}} role="img" aria-label="Grafik momentum skor per rally"><line x1={momentumPad} y1={momentumH-momentumPad} x2={momentumW-momentumPad} y2={momentumH-momentumPad} stroke="#365166"/><polyline points={homeLine} fill="none" stroke="#53dfc3" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/><polyline points={awayLine} fill="none" stroke="#f0b35a" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>{momentumPoints.map((x,i)=><g key={i}><circle cx={momentumX(i)} cy={momentumY(x.home)} r="3.5" fill="#53dfc3"/><circle cx={momentumX(i)} cy={momentumY(x.away)} r="3.5" fill="#f0b35a"/></g>)}<text x={momentumPad} y="15" fill="#91adbf" fontSize="10">SKOR</text><text x={momentumW-momentumPad} y={momentumH-5} textAnchor="end" fill="#91adbf" fontSize="10">URUTAN RALLY →</text></svg></div>
     <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#9bb4c4",marginTop:8}}><span>Awal: {momentumStart.home} – {momentumStart.away}</span><span>Terakhir: {momentumPoints[momentumPoints.length-1].home} – {momentumPoints[momentumPoints.length-1].away}</span></div>
    </>:<div className="tacEmpty">Belum tersedia riwayat skor per rally. Grafik momentum akan muncul setelah rally disimpan dengan snapshot skor.</div>}
   </div>
   <div className="tacCard" style={{marginTop:12}}>
    <div className="sectionTitle"><div><h3>PLAYER PERFORMANCE CARD</h3><small>Pilih pemain untuk melihat ringkasan dan menyimpan kartu performa sebagai PNG.</small></div></div>
    <div className="perfControls"><select value={cardPlayerId} onChange={e=>setCardPlayerId(e.target.value)}><option value="ALL">Pemain dengan data terbanyak</option>{playerExperience.map(x=><option key={x.p.id} value={x.p.id}>#{x.p.number} {x.p.name}</option>)}</select><button className="btn primary" onClick={exportPlayerCard} disabled={!cardPlayer}>EXPORT KARTU PNG</button></div>
    {cardPlayer?<div className="perfCard" style={{marginTop:10,maxWidth:700}}><div className="perfName">#{cardPlayer.p.number} {cardPlayer.p.name||"Tanpa nama"}</div><div className="perfRole">{cardPlayer.p.role||"-"} • {team==="HOME"?match.homeName:match.awayName}</div><div className="miniStatGrid" style={{marginTop:12}}>{[["TOTAL AKSI",cardPlayer.actions],["ATTACK",cardPlayer.attack],["KILL",cardPlayer.kill],["ERROR",cardPlayer.attackError],["BLOCKED",cardPlayer.blocked],["SERVICE",cardPlayer.serve],["ACE",cardPlayer.ace],["BLOCK KILL",cardPlayer.blockKill],["DIG",cardPlayer.dig],["RECEIVE",cardPlayer.receive],["SET",cardPlayer.sets]].map(x=><div className="miniStat" key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}</div></div>:<div className="tacEmpty">Belum ada aksi pemain yang tercatat pada filter ini.</div>}
   </div>
 </div>
}


function AdvancedAnalysis({rallies,match,homePlayers,awayPlayers}:{rallies:Rally[];match:MatchConfig;homePlayers:Player[];awayPlayers:Player[]}){
 const [team,setTeam]=useState<Side>("HOME");
 const [setFilter,setSetFilter]=useState("ALL");
 const [rotation,setRotation]=useState("ALL");
 const [skill,setSkill]=useState("ALL");
 const [selected,setSelected]=useState<string>("ALL");
 const players=team==="HOME"?homePlayers:awayPlayers;
 const filtered=rallies.filter(r=>{
   if(setFilter!=="ALL"&&String(r.set)!==setFilter)return false;
   return r.actions.some(a=>a.side===team&&(rotation==="ALL"||String(a.rot)===rotation)&&(skill==="ALL"||a.skill===skill)&&(selected==="ALL"||String(a.player?.id)===selected));
 });
 const actions=filtered.flatMap(r=>r.actions.filter(a=>a.side===team&&(rotation==="ALL"||String(a.rot)===rotation)&&(skill==="ALL"||a.skill===skill)&&(selected==="ALL"||String(a.player?.id)===selected)));
 const attacks=actions.filter(a=>a.skill==="Attack");
 const kills=attacks.filter(a=>a.result==="Kill").length;
 const errors=attacks.filter(a=>a.result==="Error").length;
 const blocked=attacks.filter(a=>a.result==="Blocked").length;
 const eff=attacks.length?Math.round((kills-errors-blocked)/attacks.length*100):0;
 const points=filtered.filter(r=>r.winner===team).length;
 const losses=filtered.filter(r=>r.winner&&r.winner!==team).length;
 const zones=["Z1","Z2","Z3","Z4","Z5","Z6","Z7","Z8","Z9"].map(z=>{const a=attacks.filter(x=>x.target===z);return {z,n:a.length,k:a.filter(x=>x.result==="Kill").length,e:a.filter(x=>x.result==="Error").length}});
 const dirs=["Cross","Line","Tip","Middle"].map(d=>{const a=attacks.filter(x=>x.direction===d);return {d,n:a.length,k:a.filter(x=>x.result==="Kill").length}});
 const rots=[1,2,3,4,5,6].map(r=>{const a=actions.filter(x=>x.rot===r);const at=a.filter(x=>x.skill==="Attack");const k=at.filter(x=>x.result==="Kill").length;return {r,n:a.length,attack:at.length,kill:k,eff:at.length?Math.round((k-at.filter(x=>x.result==="Error").length-at.filter(x=>x.result==="Blocked").length)/at.length*100):0}});
 const playersRows=players.map(p=>{const a=actions.filter(x=>x.player?.id===p.id);const at=a.filter(x=>x.skill==="Attack");const k=at.filter(x=>x.result==="Kill").length;return {p,n:a.length,attack:at.length,kill:k,eff:at.length?Math.round((k-at.filter(x=>x.result==="Error").length-at.filter(x=>x.result==="Blocked").length)/at.length*100):0}}).filter(x=>x.n>0).sort((a,b)=>b.kill-a.kill||b.n-a.n);
 const maxZone=Math.max(1,...zones.map(x=>x.n)); const maxDir=Math.max(1,...dirs.map(x=>x.n)); const maxRot=Math.max(1,...rots.map(x=>x.attack));
 return <div className="wide advancedPage">
  <div className="hero"><div><div className="tag">AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC • V40</div><h2>ADVANCED MATCH ANALYSIS</h2><p>Hubungkan <b>pemain → rotasi → skill → zona → arah → hasil</b> untuk membaca pola pertandingan dari data rally.</p></div><div className="miniActions"><button onClick={()=>{setSetFilter("ALL");setRotation("ALL");setSkill("ALL");setSelected("ALL")}}>RESET FILTER</button></div></div>
  <div className="toolbar"><div className="seg"><button className={team==="HOME"?"sel":""} onClick={()=>{setTeam("HOME");setSelected("ALL")}}>HOME</button><button className={team==="AWAY"?"sel":""} onClick={()=>{setTeam("AWAY");setSelected("ALL")}}>AWAY</button></div><label>SET <select value={setFilter} onChange={e=>setSetFilter(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>SET {x}</option>)}</select></label><label>ROTASI <select value={rotation} onChange={e=>setRotation(e.target.value)}><option value="ALL">ALL</option>{[1,2,3,4,5,6].map(x=><option key={x} value={x}>R{x}</option>)}</select></label><label>SKILL <select value={skill} onChange={e=>setSkill(e.target.value)}><option value="ALL">SEMUA SKILL</option>{["Serve","Reception","Set","Attack","Block","Dig","Cover","Free Ball"].map(x=><option key={x}>{x}</option>)}</select></label><label>PEMAIN <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="ALL">SEMUA PEMAIN</option>{players.map(p=><option key={p.id} value={p.id}>#{p.number} {p.name||"Tanpa nama"}</option>)}</select></label></div>
  <div className="tacKpi"><div className="miniStat"><small>RALLY FILTERED</small><b>{filtered.length}</b></div><div className="miniStat"><small>POINT MENANG</small><b>{points}</b></div><div className="miniStat"><small>ATTACK / KILL</small><b>{attacks.length} / {kills}</b></div><div className="miniStat"><small>ATTACK EFF.</small><b>{eff}%</b></div></div>
  <div className="advancedGrid">
   <div className="tacCard"><div className="sectionTitle"><div><h3>ROTATION × ATTACK</h3><small>Volume, kill, dan efficiency setiap R1–R6.</small></div></div><div className="tacBars">{rots.map(x=><div className="tacBar" key={x.r}><span>R{x.r}</span><i style={{["--w" as any]:`${Math.round(x.attack/maxRot*100)}%`}}></i><b>{x.attack} / {x.kill}</b></div>)}</div></div>
   <div className="tacCard"><div className="sectionTitle"><div><h3>ATTACK ZONE MAP</h3><small>Z1–Z9 dari filter aktif.</small></div></div><div className="zoneMatrix">{zones.map(x=><button key={x.z} className={x.n?"zoneCell active":"zoneCell"} onClick={()=>{}}><strong>{x.z}</strong><span>{x.n}</span><small>{x.k} K</small></button>)}</div></div>
   <div className="tacCard"><div className="sectionTitle"><div><h3>DIRECTION × RESULT</h3><small>Cross, Line, Tip, Middle.</small></div></div><div className="tacBars">{dirs.map(x=><div className="tacBar" key={x.d}><span>{x.d}</span><i style={{["--w" as any]:`${Math.round(x.n/maxDir*100)}%`}}></i><b>{x.n} / {x.k}</b></div>)}</div></div>
   <div className="tacCard"><div className="sectionTitle"><div><h3>PLAYER IMPACT</h3><small>Pemain dengan kontribusi pada filter aktif.</small></div></div><div className="statTable tacTable">{playersRows.length?playersRows.slice(0,8).map(x=><div className="tr" key={x.p.id}><span><b>#{x.p.number} {x.p.name||"Tanpa nama"}</b><small>{x.p.role}</small></span><b>{x.n}</b><b>{x.attack}</b><b className="tacGood">{x.kill}</b><b>{x.eff}%</b></div>):<div className="tacEmpty">Belum ada kontribusi pemain pada filter ini.</div>}</div></div>
  </div>
  <div className="tacCard" style={{marginTop:10}}><div className="sectionTitle"><div><h3>TACTICAL INSIGHT DATA</h3><small>Ringkasan angka dari kombinasi filter aktif.</small></div><span className="tacBadge">{team} • {actions.length} ACTION</span></div><div className="insightGrid"><div><b>RALLY</b><strong>{points} W / {losses} L</strong></div><div><b>ATTACK</b><strong>{attacks.length} ATT • {kills} K</strong></div><div><b>ERROR</b><strong>{errors} ERR • {blocked} BLK</strong></div><div><b>EFFICIENCY</b><strong>{eff}%</strong></div></div></div>
 </div>
}


function LineupEditor({team,name,roster,lineup,libero,setLineup,setLibero,otherLineup,onLive}:{team:Side;name:string;roster:Player[];lineup:Player[];libero:number|null;setLineup:React.Dispatch<React.SetStateAction<Player[]>>;setLibero:React.Dispatch<React.SetStateAction<number|null>>;otherLineup:Player[];onLive:()=>void}){
 const [draft,setDraft]=useState<Player[]>(lineup.length===6?lineup:roster.slice(0,6));
 const [lib,setLib]=useState<number|null>(libero);
 useEffect(()=>{setDraft(lineup.length===6?lineup:roster.slice(0,6));setLib(libero)},[lineup,libero,roster.length]);
 const choose=(i:number,id:number)=>{const p=roster.find(x=>x.id===id);if(!p)return;setDraft(d=>d.map((x,idx)=>idx===i?p:x))};
 const duplicate=(id:number,i:number)=>draft.some((p,idx)=>idx!==i&&p.id===id);
 const randomize=()=>{
   const pool=roster.filter(p=>p.role!=="L");
   if(pool.length<6){window.alert("Roster minimal 6 pemain non-libero untuk mengacak posisi.");return;}
   setDraft([...pool].sort(()=>Math.random()-0.5).slice(0,6));
 };
 const save=()=>{
   if(draft.length!==6||new Set(draft.map(p=>p.id)).size!==6){window.alert("P1–P6 harus diisi 6 pemain yang berbeda.");return;}
   if(draft.some(p=>p.role==="L")){window.alert("Libero dipilih terpisah. Jangan menempatkan L di P1–P6.");return;}
   setLineup(draft);setLib(lib);
 };
 const roleText=(p:Player)=>p.role||"-";
 return <div className="lineupPage">
  <div className="hero"><div><div className="tag">STARTING LINEUP • {team}</div><h2>{name}</h2><p>P1–P6 adalah posisi rotasi. Posisi pemain tetap OH / OP / S / MB / L.</p></div><div className="miniActions"><button onClick={onLive}>LIVE SCOUTING</button><button className="primary" onClick={save}>SIMPAN LINEUP</button></div></div>
  <div className="wide lineupCard"><div className="sectionTitle"><div><h3>STARTING SIX</h3><small>Pilih 6 pemain dari roster dan tempatkan bebas ke P1–P6.</small></div><div className="miniActions"><button className="btn" onClick={randomize}>🔀 ACAK POSISI</button><span className="filterPill on">{draft.length}/6 TERISI</span></div></div>
   <div className="lineupGrid">{[1,2,3,4,5,6].map((pos,i)=><div className="lineupSlot" key={pos}><div className="slotHead"><b>P{pos}</b><span>{pos===1?"BACK RIGHT":pos===2?"FRONT RIGHT":pos===3?"FRONT MIDDLE":pos===4?"FRONT LEFT":pos===5?"BACK LEFT":"BACK MIDDLE"}</span></div><select className="editInput" value={draft[i]?.id||""} onChange={e=>choose(i,Number(e.target.value))}>{roster.map(p=><option key={p.id} value={p.id}>#{p.number} {p.name||"Tanpa nama"} • {roleText(p)}</option>)}</select>{draft[i]&&<div className="slotPlayer"><strong>#{draft[i].number} {draft[i].name||"Tanpa nama"}</strong><small>{draft[i].role} • P{pos}</small>{duplicate(draft[i].id,i)&&<em>Pemain dipakai 2×</em>}</div>}</div>)}</div>
   <div className="lineupSummary"><div><b>URUTAN ROTASI</b><span>{draft.map((p,i)=>`P${i+1} ${p.role}`).join("  •  ")}</span></div><div><b>STARTING SIX</b><span>{draft.map(p=>`#${p.number} ${p.name||"Tanpa nama"}`).join(" • ")}</span></div></div>
  </div>
  <div className="wide lineupCard"><div className="sectionTitle"><div><h3>LIBERO</h3><small>Libero dipilih terpisah dari enam pemain starter.</small></div></div><div className="liberoBox"><select className="editInput" value={lib||""} onChange={e=>setLib(e.target.value?Number(e.target.value):null)}><option value="">TANPA LIBERO</option>{roster.filter(p=>p.role==="L"&&!draft.some(s=>s.id===p.id)).map(p=><option key={p.id} value={p.id}>#{p.number} {p.name||"Tanpa nama"} • L</option>)}</select>{lib&&<div className="selectedBanner">LIBERO: <b>#{roster.find(p=>p.id===lib)?.number} {roster.find(p=>p.id===lib)?.name||"Tanpa nama"}</b></div>}</div></div>
  <div className="wide lineupCard"><div className="sectionTitle"><div><h3>CATATAN ROTASI</h3><small>Setelah lineup disimpan, Live Scouting memakai urutan P1–P6 ini. Rotasi resmi: P1→P6→P5→P4→P3→P2→P1. Substitusi dapat ditempatkan ke P1–P6 sesuai target posisi; libero dikelola terpisah.</small></div><button className="btn primary" onClick={save}>SIMPAN & TERAPKAN</button></div></div>
 </div>
}

class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string|null}>{state:{error:string|null}={error:null};static getDerivedStateFromError(e:any){return {error:e?.message||String(e)}};componentDidCatch(e:any){console.error(e)}render(){if(this.state.error)return <div style={{minHeight:"100vh",background:"#06111d",color:"#fff",padding:"40px",fontFamily:"Arial"}}><h1>AVS VOLLEYBALL PERFORMANCE & MATCH ANALYTIC</h1><h2>Terjadi error saat membuka aplikasi</h2><p style={{color:"#ff9ca8"}}>{this.state.error}</p><button style={{padding:"12px",marginTop:"12px"}} onClick={()=>{localStorage.removeItem("vscout-v12");location.reload()}}>RESET DATA & MUAT ULANG</button></div>;return this.props.children}}

const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
const v79DockStyle=document.createElement("style");v79DockStyle.textContent=`
/* V79: fixed bottom live score/control dock */
.liveDock{position:fixed;z-index:1000;left:205px;right:0;bottom:0;padding:7px 12px calc(7px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#07182beF,#04101ff7);border-top:1px solid #3473a6;box-shadow:0 -8px 28px #0008;backdrop-filter:blur(12px)}
.dockScore{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px;max-width:1500px;margin:0 auto 5px;padding:0 8px}
.dockTeam{display:flex;align-items:center;gap:10px;min-width:0;color:#eaf7ff;font-weight:800}.dockTeam span{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dockTeam strong{font-size:25px;line-height:1;color:#fff}.dockTeam.home{justify-content:flex-end}.dockTeam.away{justify-content:flex-start}.dockTeam.home strong{order:2;color:#64caff}.dockTeam.away strong{color:#ff8ca4}.dockMid{text-align:center;display:flex;align-items:center;gap:10px;white-space:nowrap}.dockMid b{font-size:15px;color:#fff;background:#0d4777;border:1px solid #4aa8ed;border-radius:7px;padding:5px 10px}.dockMid span{font-size:10px;color:#a9cce6;font-weight:800}
.dockToolbar{max-width:1500px;margin:0 auto!important;padding:5px 7px!important;display:flex;justify-content:center;gap:6px;flex-wrap:nowrap;overflow-x:auto}.dockToolbar label{margin:0!important;display:flex;align-items:center;gap:4px;white-space:nowrap}.dockToolbar select{padding:5px 6px!important;font-size:10px!important;max-width:170px}.dockToolbar .btn{padding:6px 9px;font-size:10px;white-space:nowrap}.dockToolbar .seg button{padding:6px 9px;font-size:10px}
.main{padding-bottom:155px!important}
@media(max-width:1050px){.liveDock{left:185px}.dockToolbar{justify-content:flex-start}}
@media(max-width:760px){.liveDock{left:0;padding:6px}.dockScore{gap:5px}.dockTeam span{font-size:9px}.dockTeam strong{font-size:20px}.dockMid{gap:4px}.dockMid span{font-size:8px}.dockMid b{font-size:12px;padding:4px 6px}.dockToolbar{flex-wrap:wrap;justify-content:center}.main{padding-bottom:210px!important}}
`;document.head.appendChild(v79DockStyle);
const styleFix=document.createElement("style");styleFix.textContent=`
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tableWrap{overflow:auto}.smallInput{width:90px}.muted{opacity:.7}
 .courtPanel{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(420px,1fr)!important;align-items:start;gap:8px}
.courtPanel>.ph{grid-column:1/-1!important;grid-row:1!important}
/* Aksi pemain di kiri-bawah lapangan; lapangan tetap di kanan. */
.courtPanel>.actionPicker{grid-column:1!important;grid-row:2!important;align-self:end;justify-self:stretch;margin:8px 6px 18px!important;width:calc(100% - 12px)!important;min-width:0}
.courtPanel>.courtBox{grid-column:2!important;grid-row:2!important;display:flex;justify-content:center;align-items:center;padding:6px 4px 12px!important;min-width:0}
.courtPanel .liberoCourtLayout{width:100%;max-width:405px;grid-template-columns:44px minmax(0,1fr);grid-template-rows:1fr 1fr;gap:4px;margin:0 auto}
.courtPanel .proCourt{width:min(355px,100%)!important;min-width:0!important;height:auto!important;aspect-ratio:10/15!important;padding:13px 7px!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;grid-template-rows:1fr 1fr 14px 1fr 1fr!important}
.courtPanel .courtPlayer{width:min(62px,92%)!important;min-height:46px!important}
.quickCodeArea{margin-top:12px;border-top:1px solid #254a65;padding-top:10px}
.quickCodeArea .codeScout{margin:0!important;padding:10px 12px!important;border-radius:9px!important}
.quickCodeArea .codeScoutHead{margin-bottom:6px}.quickCodeArea .codeInput{padding:10px 12px;font-size:14px}.quickCodeArea .codeHelp{font-size:9px;line-height:1.45}
@media(max-width:1050px){.courtPanel{grid-template-columns:minmax(0,1fr)!important}.courtPanel>.ph{grid-column:1!important;grid-row:1!important}.courtPanel>.actionPicker{grid-column:1!important;grid-row:2!important;margin:8px auto!important;width:calc(100% - 16px)!important}.courtPanel>.courtBox{grid-column:1!important;grid-row:3!important;justify-content:center}.courtPanel .liberoCourtLayout{max-width:400px}.courtPanel .proCourt{width:min(355px,100%)!important}}
@media(max-width:760px){.courtPanel .liberoCourtLayout{grid-template-columns:42px minmax(0,1fr);max-width:100%}.courtPanel .proCourt{width:min(340px,100%)!important;aspect-ratio:10/15!important}.courtPanel .courtPlayer{width:54px!important;min-height:42px!important}.quickCodeArea .codeInputRow{flex-wrap:wrap}.quickCodeArea .codeInputRow .btn{width:100%}}
/* V74: input kode di atas Quick Action; panel aksi lebih ramping; court sedikit lebih pendek */
.quickCodeArea{display:flex!important;flex-direction:column!important;gap:10px!important}
.quickCodeArea>.codeScout{order:1!important;margin:0!important}
.quickCodeArea>.quickActionBlock{order:2!important}
.quickActionBlock .ph{display:flex;justify-content:space-between;align-items:center;padding:8px 12px}
.quickActionBlock .quick{margin:0 8px 8px!important}
.courtPanel>.actionPicker{grid-column:1!important;grid-row:2!important;width:min(250px,100%)!important;max-width:250px!important;justify-self:end!important;align-self:end!important;margin:8px 6px 14px!important;min-width:0!important}
.courtPanel>.actionPicker .skills{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;padding:7px!important}
.courtPanel>.actionPicker .skill{min-height:37px!important;font-size:9px!important;padding:4px!important}
.courtPanel>.courtBox{grid-column:2!important;grid-row:2!important}
.courtPanel .liberoCourtLayout{max-width:385px!important;grid-template-columns:42px minmax(0,1fr)!important;gap:4px!important}
.courtPanel .proCourt{width:min(340px,100%)!important;aspect-ratio:10/14!important;padding:11px 7px!important;grid-template-rows:1fr 1fr 12px 1fr 1fr!important}
.courtPanel .courtPlayer{width:min(58px,92%)!important;min-height:43px!important}
@media(max-width:1050px){.courtPanel>.actionPicker{grid-column:1!important;grid-row:3!important;justify-self:center!important;width:min(250px,100%)!important;margin:8px auto!important}.courtPanel>.courtBox{grid-column:1!important;grid-row:2!important}.courtPanel .proCourt{width:min(340px,100%)!important}}
@media(max-width:760px){.courtPanel .proCourt{width:min(320px,100%)!important;aspect-ratio:10/14!important}.courtPanel .courtPlayer{width:52px!important;min-height:40px!important}}

 /* V75: panel analisis video di kiri lapangan */
 .courtPanel{grid-template-columns:minmax(260px,330px) minmax(0,1fr)!important;grid-template-rows:auto auto auto!important;align-items:start!important}
 .courtPanel>.ph{grid-column:1/-1!important;grid-row:1!important}
 .courtPanel>.videoScout{grid-column:1!important;grid-row:2!important;align-self:start!important;margin:8px 6px!important;min-width:0!important;padding:0!important;overflow:hidden}
 .courtPanel>.courtBox{grid-column:2!important;grid-row:2!important}
 .courtPanel>.actionPicker{grid-column:1!important;grid-row:3!important;justify-self:stretch!important;align-self:start!important;width:auto!important;max-width:none!important;margin:8px 6px 14px!important}
 .videoScout .ph{padding:10px 12px}.videoScout .ph span{font-size:10px}.videoScout .ph b{font-size:10px}
 .videoUrlRow,.videoMarkerInput{display:flex;gap:6px;padding:8px}.videoUrlRow input,.videoMarkerInput input{min-width:0;flex:1;background:#071827;border:1px solid #29465d;border-radius:7px;color:#eaf5fb;padding:9px;font-size:11px}
 .videoUrlRow .btn,.videoMarkerInput .btn{white-space:nowrap;padding:8px;font-size:9px}
 .videoFrame{width:100%;aspect-ratio:16/9;background:#02070c;display:grid;place-items:center}
 .videoFrame iframe,.videoFrame video{width:100%;height:100%;border:0;object-fit:contain}
 .videoEmpty{display:flex;flex-direction:column;gap:7px;text-align:center;padding:15px;color:#8eabc0;font-size:11px}.videoEmpty strong{color:#d9edf8;font-size:13px}
 .videoControls{display:flex;align-items:center;gap:8px;padding:7px 9px;color:#8eabc0;font-size:10px}.videoControls input{flex:1;min-width:30px}.videoControls a{color:#5dddc2;text-decoration:none;font-weight:800;font-size:9px;white-space:nowrap}
 .videoMarkerList{max-height:150px;overflow:auto;padding:0 8px 9px}.videoMarkerList>small{display:block;padding:6px;color:#819eb2;font-size:10px}
 .videoMarker{display:flex;align-items:center;gap:7px;padding:6px 4px;border-top:1px solid #20384b;font-size:10px}.videoMarker>button:first-child{background:#17394a;border:1px solid #2b6672;color:#75e4d1;border-radius:5px;padding:4px 6px;font-weight:800}.videoMarker span{flex:1;min-width:0;overflow-wrap:anywhere;color:#d5e6ef}.videoMarker .videoRemove{background:transparent;border:0;color:#ff9ba8;font-size:17px}.videoNotice{display:block;padding:0 9px 9px;color:#e5c58a;font-size:9px;line-height:1.4}
 @media(max-width:1050px){.courtPanel{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto auto!important}.courtPanel>.ph{grid-column:1!important;grid-row:1!important}.courtPanel>.videoScout{grid-column:1!important;grid-row:2!important;width:min(100%,560px)!important;margin:8px auto!important}.courtPanel>.courtBox{grid-column:1!important;grid-row:3!important}.courtPanel>.actionPicker{grid-column:1!important;grid-row:4!important;width:min(100%,560px)!important;margin:8px auto!important}}


/* V76: mode input satu layar laptop — video, lapangan, dan aksi berdampingan */
@media (min-width: 1051px) {
  .main { min-width: 0 !important; }
  .courtPanel {
    display: grid !important;
    grid-template-columns: minmax(300px, 0.92fr) minmax(390px, 1.22fr) minmax(190px, 0.58fr) !important;
    grid-template-rows: auto minmax(0, 1fr) !important;
    gap: 8px !important;
    align-items: start !important;
    min-width: 0 !important;
  }
  .courtPanel > .ph { grid-column: 1 / -1 !important; grid-row: 1 !important; }
  .courtPanel > .videoScout { grid-column: 1 !important; grid-row: 2 !important; margin: 0 !important; min-width: 0 !important; }
  .courtPanel > .courtBox { grid-column: 2 !important; grid-row: 2 !important; min-width: 0 !important; padding: 4px !important; }
  .courtPanel > .actionPicker { grid-column: 3 !important; grid-row: 2 !important; width: auto !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; align-self: start !important; }
  .courtPanel .liberoCourtLayout { width: 100% !important; max-width: 100% !important; grid-template-columns: 38px minmax(0, 1fr) !important; gap: 3px !important; }
  .courtPanel .proCourt { width: min(100%, 370px) !important; min-width: 0 !important; aspect-ratio: 10 / 13.5 !important; height: auto !important; padding: 9px 5px !important; grid-template-rows: 1fr 1fr 10px 1fr 1fr !important; }
  .courtPanel .courtPlayer { width: min(62px, 94%) !important; min-height: 39px !important; padding: 3px !important; }
  .courtPanel .liberoCourtSlot { min-width: 0 !important; padding: 4px 2px !important; font-size: 8px !important; }
  .videoScout { min-width: 0 !important; }
  .videoScout .videoFrame { aspect-ratio: 16 / 9 !important; }
  .videoScout .videoMarkerList { max-height: 92px !important; }
  .videoScout .videoMarkerInput { padding: 5px !important; }
  .videoScout .videoMarkerInput input { font-size: 10px !important; padding: 7px !important; }
  .videoScout .videoMarkerInput .btn { font-size: 8px !important; padding: 6px !important; }
  .courtPanel > .actionPicker .skills { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 5px !important; padding: 6px !important; }
  .courtPanel > .actionPicker .skill { min-height: 37px !important; font-size: 9px !important; padding: 3px !important; }
  .quickCodeArea { display: grid !important; grid-template-columns: minmax(0, 1.2fr) minmax(250px, 0.8fr) !important; gap: 8px !important; margin-top: 7px !important; padding-top: 7px !important; align-items: start !important; }
  .quickCodeArea .codeScout { padding: 7px 9px !important; }
  .quickCodeArea .codeScoutHead { margin-bottom: 5px !important; }
  .quickCodeArea .codeHelp { display: none !important; }
  .quickCodeArea .codeInputRow { display: flex !important; gap: 6px !important; }
  .quickCodeArea .codeInput { min-width: 0 !important; padding: 8px 10px !important; font-size: 12px !important; }
  .quickCodeArea .codeInputRow .btn { padding: 7px 10px !important; font-size: 9px !important; white-space: nowrap !important; }
  .quickActionBlock .ph { padding: 6px 9px !important; }
  .quickActionBlock .quick { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 4px !important; margin: 0 6px 6px !important; }
  .quickActionBlock .quick button { min-height: 30px !important; padding: 4px !important; font-size: 8px !important; }
}
@media (min-width: 1051px) and (max-height: 900px) {
  .courtPanel .proCourt { width: min(100%, 330px) !important; aspect-ratio: 10 / 12.8 !important; }
  .videoScout .videoMarkerList { max-height: 65px !important; }
  .quickCodeArea .codeScoutHead small { display: none !important; }
}
@media (max-width: 1050px) {
  .courtPanel { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto auto auto auto !important; }
  .courtPanel > .ph { grid-column: 1 !important; grid-row: 1 !important; }
  .courtPanel > .videoScout { grid-column: 1 !important; grid-row: 2 !important; width: min(100%, 620px) !important; margin: 8px auto !important; }
  .courtPanel > .courtBox { grid-column: 1 !important; grid-row: 3 !important; }
  .courtPanel > .actionPicker { grid-column: 1 !important; grid-row: 4 !important; width: min(100%, 620px) !important; margin: 8px auto !important; }
  .quickCodeArea { display: flex !important; flex-direction: column !important; }
}


/* V77: video dan lapangan prioritas, aksi pemain satu baris ringkas */
@media (min-width: 1051px) {
  .courtPanel { grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr) !important; grid-template-rows: auto minmax(0,1fr) auto !important; gap: 9px !important; }
  .courtPanel > .ph { grid-column: 1 / -1 !important; grid-row: 1 !important; }
  .courtPanel > .videoScout { grid-column: 1 !important; grid-row: 2 !important; width:100% !important; min-width:0 !important; }
  .courtPanel > .courtBox { grid-column: 2 !important; grid-row: 2 !important; min-width:0 !important; }
  .courtPanel > .actionPicker { grid-column: 1 / -1 !important; grid-row: 3 !important; width:100% !important; max-width:none !important; margin:2px 0 5px !important; }
  .courtPanel > .actionPicker .ph { padding:5px 9px !important; }
  .courtPanel > .actionPicker .skills { display:grid !important; grid-template-columns:repeat(12,minmax(0,1fr)) !important; gap:4px !important; padding:5px 7px !important; }
  .courtPanel > .actionPicker .skill { min-height:32px !important; font-size:8px !important; padding:3px 2px !important; }
  .courtPanel .liberoCourtLayout { grid-template-columns:42px minmax(0,1fr) 42px !important; gap:4px !important; }
  .courtPanel .proCourt { width:min(100%,440px) !important; aspect-ratio:10 / 12.5 !important; }
  .videoScout .videoFrame { aspect-ratio:16 / 10 !important; min-height:300px !important; }
  .videoScout .videoMarkerList { max-height:80px !important; }
}
.videoPlayerBar { padding:7px 9px 3px; background:#061827; border-top:1px solid #1e3b51; }
.videoTransport { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:7px; }
.videoTransport button { border:1px solid #315a76; border-radius:7px; background:#102d45; color:#eaf7ff; font-weight:900; font-size:11px; padding:7px 11px; cursor:pointer; }
.videoTransport .playPause { background:#087f72; border-color:#35d7c4; min-width:92px; }
.videoTransport label { display:flex; align-items:center; gap:5px; color:#9bb9cb; font-size:10px; font-weight:800; }
.videoTransport select { border:1px solid #315a76; border-radius:6px; background:#102d45; color:#fff; padding:6px; }
.videoSeek { display:block; width:100%; margin:7px 0 3px; accent-color:#27d6b7; cursor:pointer; }
.embedHint { color:#9bb9cb; font-size:9px; }
@media (min-width:1051px) and (max-height:820px) { .videoScout .videoFrame { min-height:250px !important; } .courtPanel .proCourt { width:min(100%,390px) !important; } }
@media (max-width:1050px) { .courtPanel > .actionPicker .skills { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:5px !important; } .courtPanel > .actionPicker .skill { min-height:36px !important; } .videoScout .videoFrame { aspect-ratio:16/9 !important; min-height:0 !important; } }

/* V78: video diperpanjang, lapangan lebih ramping dan digeser ke kanan */
@media (min-width:1051px) {
  .courtPanel {
    width:100% !important;
    grid-template-columns:minmax(0, 1.48fr) minmax(300px, .82fr) !important;
    gap:12px !important;
  }
  .courtPanel > .videoScout {
    grid-column:1 !important;
    width:100% !important;
    max-width:none !important;
    justify-self:stretch !important;
  }
  .courtPanel > .courtBox {
    grid-column:2 !important;
    justify-self:end !important;
    width:100% !important;
    max-width:440px !important;
    padding:3px 0 3px 5px !important;
  }
  .courtPanel .liberoCourtLayout {
    width:100% !important;
    max-width:100% !important;
    grid-template-columns:36px minmax(0,1fr) 36px !important;
    gap:3px !important;
  }
  .courtPanel .proCourt {
    width:min(100%,350px) !important;
    max-width:350px !important;
    margin-left:auto !important;
    margin-right:0 !important;
    aspect-ratio:10 / 13.2 !important;
  }
  .videoScout .videoFrame {
    width:100% !important;
    aspect-ratio:16 / 9 !important;
    min-height:340px !important;
  }
  .videoScout .videoPlayerBar { padding:9px 12px 5px !important; }
  .videoScout .videoTransport { gap:9px !important; }
  .videoScout .videoTransport button { min-width:64px !important; padding:9px 13px !important; font-size:12px !important; }
  .videoScout .videoTransport .playPause { min-width:105px !important; }
  .videoScout .videoSeek { height:17px !important; }
}
@media (min-width:1051px) and (max-height:850px) {
  .videoScout .videoFrame { min-height:290px !important; }
  .courtPanel .proCourt { width:min(100%,320px) !important; }
}


/* V83: lapangan kanan, aksi tepat di bawah lapangan, dock skor lebih rapi */
@media (min-width:1051px) {
  .courtPanel { grid-template-columns:minmax(0,1.42fr) minmax(360px,.9fr) !important; gap:14px !important; }
  .courtPanel > .courtBox { grid-column:2 !important; justify-self:end !important; transform:translateX(12px); max-width:460px !important; }
  .courtPanel .liberoCourtLayout { grid-template-columns:36px minmax(0,1fr) 36px !important; gap:3px !important; }
  .courtPanel .proCourt { margin-left:auto !important; margin-right:0 !important; }
  .courtPanel + .actionPicker, section > .actionPicker { width:min(460px,42%) !important; max-width:460px !important; margin:8px 0 12px auto !important; }
  section > .actionPicker .ph { padding:5px 9px !important; }
  section > .actionPicker .skills { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:5px !important; padding:6px !important; }
  section > .actionPicker .skill { min-height:34px !important; font-size:9px !important; padding:3px 4px !important; }
  .dockScore { grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) !important; }
  .dockMid { flex-direction:column !important; gap:3px !important; }
  .dockMid span { font-size:10px !important; }
  .dockTeam.away { gap:8px !important; }
  .dockTeam.away strong { order:0 !important; }
  .dockTeam.away span { order:1 !important; }
}
@media (max-width:1050px) {
  section > .actionPicker { width:min(100%,620px) !important; margin:8px auto !important; }
  section > .actionPicker .skills { grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
}


/* V85 — GLOBAL VISUAL REDESIGN: Clean Minimalist Sports Analytics
   Visual layer only. Existing React state, event handlers, scouting codes,
   direction codes, rally flow, score logic and data structures are untouched. */
:root{color-scheme:light;--vp-bg:#f4f7f8;--vp-surface:#ffffff;--vp-surface-soft:#f8fafb;--vp-border:#e2e9ec;--vp-text:#24343d;--vp-muted:#71818a;--vp-navy:#19313d;--vp-teal:#168b83;--vp-teal-soft:#e5f4f1;--vp-shadow:0 5px 18px rgba(28,53,65,.055)}
html,body{background:var(--vp-bg)!important;color:var(--vp-text)!important;font-family:Inter,"Segoe UI",Arial,sans-serif!important}
body{min-width:320px}
.app{background:var(--vp-bg)!important;color:var(--vp-text)!important}
.side{width:238px!important;background:#19313d!important;border-right:1px solid #29434e!important;padding:22px 14px!important;box-shadow:5px 0 24px rgba(25,49,61,.06)}
.brand{padding:5px 10px 28px!important;gap:12px!important}
.logo{width:42px!important;height:42px!important;border-radius:13px!important;background:#d8f0eb!important;color:#176d68!important;font-size:22px!important;box-shadow:0 5px 12px #071c2530}
.brand b{color:#f4fbfa!important;font-size:13px!important;letter-spacing:1.1px}
.brand small{display:block;color:#9bb9b8!important;font-size:9px!important;letter-spacing:2.5px!important;margin-top:4px}
.nav{display:flex!important;align-items:center!important;gap:11px!important;width:100%!important;min-height:43px!important;padding:10px 12px!important;margin:3px 0!important;border:1px solid transparent!important;border-radius:10px!important;background:transparent!important;color:#b4c7c8!important;text-align:left!important;font-size:12px!important;font-weight:650!important;letter-spacing:.1px!important;transition:background .18s,border-color .18s,color .18s,transform .18s}
.nav::before{display:inline-grid;place-items:center;width:20px;height:20px;flex:0 0 20px;border-radius:6px;color:#9ab8b7;font-size:13px}
.nav:nth-of-type(1)::before{content:"◉"}.nav:nth-of-type(2)::before{content:"⌂"}.nav:nth-of-type(3)::before{content:"▣"}.nav:nth-of-type(4)::before{content:"♙"}.nav:nth-of-type(5)::before{content:"▦"}.nav:nth-of-type(6)::before{content:"⌁"}.nav:nth-of-type(7)::before{content:"↻"}.nav:nth-of-type(8)::before{content:"◫"}.nav:nth-of-type(9)::before{content:"▤"}.nav:nth-of-type(10)::before{content:"⚙"}
.nav:hover{background:#ffffff0d!important;color:#fff!important;transform:translateX(2px);filter:none!important}
.nav.active{background:#d8f0eb!important;border-color:#d8f0eb!important;color:#155f5b!important;box-shadow:none!important;font-weight:800!important}
.nav.active::before{color:#167d75}
.bottom{left:22px!important;right:16px!important;bottom:18px!important;color:#9ab4b4!important;font-size:10px!important;line-height:1.9!important;border-top:1px solid #ffffff20;padding-top:12px}
.main{margin-left:238px!important;width:calc(100% - 238px)!important;padding:26px 30px 170px!important;max-width:1800px}
.head{margin-bottom:20px!important;min-height:48px}
.ey{color:#168b83!important;font-size:9px!important;letter-spacing:2px!important;font-weight:800}
.head h1{color:#24343d!important;font-size:25px!important;font-weight:750!important;letter-spacing:-.7px!important}
.actions .btn{min-width:40px}
.btn{border:1px solid #dce6e8!important;border-radius:9px!important;background:#fff!important;color:#40545d!important;padding:9px 13px!important;font-size:11px!important;font-weight:750!important;box-shadow:0 2px 5px rgba(28,53,65,.035);transition:all .16s}
.btn:hover{background:#f4faf9!important;border-color:#b8d9d3!important;color:#176d68!important;filter:none!important;transform:translateY(-1px)}
.btn.primary{background:#168b83!important;border-color:#168b83!important;color:#fff!important;box-shadow:0 4px 10px #168b8324}
.btn.primary:hover{background:#11776f!important;border-color:#11776f!important;color:#fff!important}
.btn.danger,.danger{background:#fff1f1!important;border-color:#f0cdcd!important;color:#b84d55!important}
.panel,.toolbar,.tacCard,.insight,.card,.wide,.hero,.metric,.reportCard,.detailCard,.lineupSlot,.lineupSummary>div,.simple .panel,.matchHero>div,.rotationProCard,.replayItem{background:var(--vp-surface)!important;border:1px solid var(--vp-border)!important;border-radius:13px!important;box-shadow:var(--vp-shadow)!important;color:var(--vp-text)!important}
.ph{background:#fbfcfc!important;border-bottom:1px solid var(--vp-border)!important;color:#74858d!important;padding:13px 16px!important;font-size:10px!important;font-weight:800!important;letter-spacing:1.1px!important}
.ph b,.sectionTitle h3,.sectionTitle h4,.card h3,.tacCard h3{color:#2b414a!important}
.sectionTitle{color:#2b414a!important}
.sectionTitle small,.muted,.ey+p,.row small,.stat span,.tacBar span,.simple p,.hero p,.wide p{color:var(--vp-muted)!important}
.hero{padding:22px 24px!important;margin-bottom:14px!important;background:linear-gradient(120deg,#fff,#f5faf9)!important}
.hero .tag{color:#168b83!important;font-weight:800;letter-spacing:1.4px}
.hero h2{color:#243941!important;font-size:22px!important;letter-spacing:-.5px}
.hero p{font-size:12px!important}
.metrics{gap:10px!important}
.metric{padding:15px 16px!important;text-align:left!important;transition:transform .16s,box-shadow .16s}
.metric:hover{transform:translateY(-2px);box-shadow:0 9px 22px rgba(28,53,65,.09)!important}
.metric small{color:#74858d!important;font-size:10px!important;font-weight:700}
.metric b{color:#243941!important;font-size:23px!important;font-weight:800!important}
.dashGrid,.grid,.tacGrid,.perfGrid,.replayGrid{gap:13px!important}
.compareRow,.stat,.reportLine,.setScoreRow,.row{border-bottom:1px solid #edf1f2!important;color:#344951!important}
.compareRow span,.stat span,.reportLine span{color:#74858d!important}
.compareRow b,.stat b,.reportLine b{color:#263b44!important}
.setScoreRow strong{color:#243941!important}
.toolbar{background:#fff!important;border-color:var(--vp-border)!important;padding:10px 12px!important}
.toolbar label{color:#71818a!important}
.toolbar select,.editInput,.numInput,.replayFilters select,.perfControls select,.tacSelect,.videoUrlRow input,.videoMarkerInput input{background:#fff!important;color:#293e47!important;border:1px solid #d8e2e5!important;border-radius:8px!important}
input::placeholder{color:#a1adb2!important}
.codeScout{background:#f1f8f6!important;border:1px solid #c8e5df!important;border-radius:12px!important}
.codeScoutHead b,.quickTitle{color:#167a72!important}
.codeScoutHead small,.codeHelp{color:#6f8586!important}
.codeInput{background:#fff!important;color:#203840!important;border:1px solid #bfd8d3!important;border-radius:9px!important}
.codeInput:focus{border-color:#168b83!important;box-shadow:0 0 0 3px #168b831c!important}
.codeStatus{background:#eaf4f2!important;color:#47615f!important}
.codeStatus.ok{border-color:#8bc8ba!important;color:#176c61!important}
.codeStatus.err{background:#fff0f0!important;border-color:#e7b4b8!important;color:#a43e4c!important}
.codeChip{background:#dcefeb!important;color:#27645f!important}
.rally{background:#e9f5f2!important;border-color:#b8ddd5!important;color:#275e58!important}
.live{color:#168b83!important}
.seg button,.result,.skill,.choice,.filterPill,.directionGrid button{background:#f7f9fa!important;border:1px solid #dce6e8!important;color:#50636b!important;border-radius:8px!important}
.seg .sel,.filterPill.on{background:#e1f2ee!important;border-color:#9fd0c6!important;color:#176d66!important}
.skill:first-child{background:#e6f3f0!important;border-color:#b8dcd4!important;color:#176d66!important}
.skill:hover,.result:hover,.choice:hover,.directionGrid button:hover{background:#edf7f5!important;border-color:#9ecfc5!important;color:#176d66!important;filter:none!important}
.result.good{background:#e9f6ef!important;border-color:#b7dfc8!important;color:#26784c!important}
.result.bad{background:#fff0f1!important;border-color:#efc3c8!important;color:#b44854!important}
.tacBadge,.tacBadge,.replayTag,.rotBadge{background:#edf5f3!important;border-color:#d3e8e3!important;color:#26776e!important}
.tacBar i,.bar{background:#e8eeee!important}
.tacBar i::after,.bar i{background:#168b83!important}
.tr{background:#fff!important;border-bottom:1px solid #edf1f2!important;color:#334850!important}
.tr.th{background:#f3f7f7!important;color:#65777e!important}
.tr:hover{background:#f5faf9!important}
.tableWrap,.tacTable,.rotationTable{border:1px solid var(--vp-border);border-radius:10px;overflow:auto}
.empty,.emptyState,.replayEmpty{color:#87969c!important}
.matchHero>div{background:#fff!important}
.matchHero span,.lineupSummary b{color:#168b83!important}
.starterField{background:#f7faf9!important;border:1px solid #dce8e5!important;color:#54716e!important}
.starterField small{color:#82928f!important}
.rosterEdit input,.rosterEdit select{background:#fff!important;color:#344951!important;border-color:#d9e3e5!important}
.lineupCard .sectionTitle{background:#f3f8f7!important;border-bottom:1px solid #e1ebea!important}
.slotPlayer{background:#edf5f3!important;color:#334c4b!important}
.liveDock{left:238px!important;background:rgba(255,255,255,.96)!important;border-top:1px solid #dce7e8!important;box-shadow:0 -8px 24px rgba(32,55,63,.08)!important;backdrop-filter:blur(14px)}
.dockTeam{color:#344951!important}.dockTeam strong{color:#243941!important}.dockTeam.home strong{color:#168b83!important}.dockTeam.away strong{color:#c45b6b!important}
.dockMid b{background:#e8f3f1!important;border:1px solid #c4dfd9!important;color:#24665f!important}.dockMid span{color:#71818a!important}
.dockToolbar .btn{background:#fff!important;color:#40545d!important;border-color:#dce6e8!important}.dockToolbar .btn.primary{background:#168b83!important;color:#fff!important;border-color:#168b83!important}
.dockToolbar .seg button{background:#f7f9fa!important;color:#50636b!important;border-color:#dce6e8!important}.dockToolbar .seg .sel{background:#e1f2ee!important;color:#176d66!important}
.videoPlayerBar{background:#f7faf9!important;border-top:1px solid #e2e9ec!important}.videoTransport button{background:#fff!important;border-color:#d5e1e3!important;color:#40545d!important}.videoTransport .playPause{background:#168b83!important;border-color:#168b83!important;color:#fff!important}.videoTransport label{color:#71818a!important}.videoTransport select{background:#fff!important;color:#40545d!important;border-color:#d5e1e3!important}.videoSeek{accent-color:#168b83!important}.embedHint{color:#71818a!important}
/* Keep the court itself vivid and high-contrast for fast match reading. */
.courtPanel .proCourt{box-shadow:0 12px 28px rgba(28,53,65,.15),0 0 0 1px #d4e1e5!important}
.courtPanel .courtPlayer,.courtPanel .liberoCourtSlot{color:#fff!important}
.courtPanel .courtLabel{color:#fff!important}
.courtPanel .actionPicker .ph{background:#fbfcfc!important}
/* Responsive navigation and spacing */
@media(max-width:1050px){.side{width:190px!important}.main{margin-left:190px!important;width:calc(100% - 190px)!important;padding:20px 18px 180px!important}.liveDock{left:190px!important}}
@media(max-width:760px){.side{position:relative!important;width:100%!important;height:auto!important;padding:12px!important;border-right:0!important;border-bottom:1px solid #29434e!important}.brand{padding:2px 8px 10px!important}.side .nav{display:inline-flex!important;width:auto!important;min-height:36px!important;padding:7px 9px!important;margin:2px!important;font-size:10px!important}.nav::before{width:16px;height:16px;flex-basis:16px}.bottom{display:none!important}.main{margin-left:0!important;width:100%!important;padding:15px 12px 230px!important}.head h1{font-size:21px!important}.liveDock{left:0!important}.hero{padding:16px!important}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}.teamGrid,.setupGrid,.dashGrid,.tacGrid,.grid2{grid-template-columns:1fr!important}}

`;document.head.appendChild(styleFix);

/* V88 — full navy surfaces, bright readable accents, and corrected sidebar spacing. Visual-only overrides. */
const v88NavyTheme=document.createElement("style");v88NavyTheme.textContent=`
:root{color-scheme:dark;--n0:#07182b;--n1:#0b223b;--n2:#123451;--n3:#19496b;--blue:#3198e8;--cyan:#48c9df;--mint:#4bd0b0;--ink:#f2f8ff;--muted:#b5c9dc;--line:#285271}
html,body,#root,.app{background:linear-gradient(135deg,#07182b 0%,#0a2440 58%,#0b1d34 100%)!important;color:var(--ink)!important}
body{font-family:Inter,"Segoe UI",Arial,sans-serif!important}
/* Sidebar: compact, scroll-safe navigation. Footer no longer overlaps menu labels. */
.side{width:246px!important;padding:16px 12px 14px!important;display:flex!important;flex-direction:column!important;gap:2px!important;overflow-y:auto!important;overflow-x:hidden!important;background:linear-gradient(180deg,#061629 0%,#0a2038 100%)!important;border-right:1px solid #214563!important;box-shadow:8px 0 28px #020c1880!important}
.brand{flex:0 0 auto!important;padding:4px 8px 15px!important;margin-bottom:5px!important;border-bottom:1px solid #1c3d59!important;gap:10px!important}
.logo{width:42px!important;height:42px!important;border-radius:12px!important;background:linear-gradient(135deg,#45c9e0,#328de0)!important;color:#062039!important;box-shadow:0 5px 16px #168bd044!important}
.brand b{color:#f4f9ff!important;font-size:14px!important;letter-spacing:.5px!important}.brand small{display:block!important;color:#8fc8e8!important;font-size:9px!important;letter-spacing:2px!important;margin-top:3px!important}
.nav{flex:0 0 auto!important;width:100%!important;min-height:39px!important;height:auto!important;padding:9px 12px!important;margin:2px 0!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#b8cde0!important;text-align:left!important;font-size:12px!important;font-weight:700!important;line-height:1.25!important;white-space:normal!important;overflow-wrap:anywhere!important;transition:background .15s,border-color .15s!important}
.nav:hover{background:#153b5b!important;border-color:#286187!important;color:#fff!important}
.nav.active{background:linear-gradient(100deg,#1679c7,#17649f)!important;border-color:#49b7e9!important;color:#fff!important;box-shadow:inset 3px 0 #68e0e9,0 4px 12px #00101f66!important}
.bottom{position:static!important;left:auto!important;bottom:auto!important;flex:0 0 auto!important;margin-top:auto!important;padding:12px 8px 2px!important;border-top:1px solid #1c3d59!important;color:#8faec7!important;font-size:9px!important;line-height:1.55!important;overflow-wrap:anywhere!important}
.main{margin-left:246px!important;width:calc(100% - 246px)!important;background:transparent!important;color:#f2f8ff!important;padding:20px 24px 48px!important}
.head h1,h1,h2,h3,h4,h5,.sectionTitle h3,.sectionTitle h4{color:#f4f9ff!important}.ey{color:#71c9ef!important}
/* Main surfaces stay navy/blue; only small emphasis components use bright fills. */
.panel,.toolbar,.tacCard,.insight,.card,.wide,.hero,.metric,.reportCard,.detailCard,.lineupSlot,.lineupSummary>div,.simple .panel,.matchHero>div,.rotationProCard,.replayItem,.videoScout,.subBar,.score,.rally,.codeScout,.perfCard,.compareCard,.rotationCard,.reportSection,.reportHero,.reportV41,.replayHero,.replayMain,.replayList,.zoneMap,.subPanel,.tacCard,.tacCard>div{background:linear-gradient(145deg,#123451 0%,#0d2944 100%)!important;border:1px solid #285473!important;color:#edf6ff!important;box-shadow:0 6px 18px #020d1c55!important}
.ph{background:#19496b!important;border-bottom:1px solid #2c5c7b!important;color:#bde7fb!important}.ph b{color:#f4faff!important}
.panel p,.panel span,.panel label,.panel small,.toolbar p,.toolbar span,.toolbar label,.tacCard p,.tacCard span,.tacCard small,.hero p,.hero span,.hero small,.reportCard p,.reportCard span,.detailCard small,.metric span,.metric small,.score span,.score small,.rally span,.rally small,.codeScout span,.codeScout small,.subBar span,.subBar small,.muted,.sectionTitle small,.row small,.stat span,.tacBar span,.sequenceRow small,.perfRole,.rank{color:#b5c9dc!important}
.stat b,.compareRow b,.reportLine b,.setScoreRow strong,.perfName,.perfScore,.detailCard b,.metric b{color:#f5faff!important}
.btn,.result,.skill,.choice,.filterPill,.directionGrid button,.seg button,.quick button,.videoTransport button,.miniActions button{background:#1a496c!important;border:1px solid #39749b!important;color:#eaf7ff!important;box-shadow:0 2px 7px #020d1c55!important}
.btn:hover,.result:hover,.skill:hover,.choice:hover,.directionGrid button:hover,.quick button:hover,.miniActions button:hover{background:#23618b!important;border-color:#5aa8d4!important;color:#fff!important}
.btn.primary,.primary,.videoTransport .playPause{background:linear-gradient(135deg,#278bd7,#24b7d0)!important;border-color:#64d6ed!important;color:#fff!important;box-shadow:0 5px 14px #087ab344!important}
.btn.danger,.danger,.result.bad{background:#762f48!important;border-color:#d66a85!important;color:#fff!important}
.result.good{background:#145c50!important;border-color:#4bd0b0!important;color:#d9fff4!important}
.seg .sel,.filterPill.on,.choice.on{background:#287cb7!important;border-color:#64c9ec!important;color:#fff!important}
input,textarea,select,.editInput,.numInput,.tacSelect,.perfControls select,.replayFilters select,.rosterEdit input,.rosterEdit select,.videoUrlRow input,.videoMarkerInput input{background:#0a2037!important;color:#f3f9ff!important;border:1px solid #397095!important}
input::placeholder,textarea::placeholder{color:#91abc0!important;opacity:1!important}input:focus,textarea:focus,select:focus{outline:none!important;border-color:#55c9e6!important;box-shadow:0 0 0 3px #36a9df30!important}
.codeScout{background:linear-gradient(135deg,#104b53,#10364e)!important;border-color:#37a99f!important}.codeScoutHead b,.quickTitle{color:#83f0d9!important}.codeScoutHead small,.codeHelp{color:#c0d8e8!important}.codeInput{background:#071a2e!important;color:#fff!important;border-color:#4b8da9!important}.codeStatus{background:#123b53!important;color:#d7eaf6!important}.codeStatus.ok{background:#145747!important;color:#d4fff1!important}.codeStatus.err{background:#6c2d42!important;color:#ffe3e9!important}.codeChip{background:#1b5875!important;color:#e5f7ff!important}
.rally{background:linear-gradient(90deg,#104d4a,#103b55)!important;border-color:#319b91!important;color:#e5fff8!important}.live{color:#6ce8cf!important}
.tr{background:#102f4a!important;border-bottom:1px solid #28506d!important;color:#e4f0f8!important}.tr.th{background:#1b4969!important;color:#cce9f8!important}.tr:hover{background:#194365!important}
.stat,.compareRow,.reportLine,.setScoreRow,.row,.sequenceRow{border-color:#28506d!important;color:#e4f0f8!important}.miniStat,.slotPlayer,.starterField,.tacBadge,.replayTag,.rotBadge,.sequenceNo{background:#1a4968!important;color:#e9f6ff!important;border-color:#39749a!important}
.tacBar i,.bar,.compareBar{background:#0a2037!important}.tacBar i::after,.bar i,.compareBar i{background:linear-gradient(90deg,#2d94df,#4bd0d8)!important}.tacGood{color:#75e3bb!important}.tacBad{color:#ff9dad!important}
.liveDock{background:rgba(8,29,50,.98)!important;border-top:1px solid #2b5878!important;box-shadow:0 -6px 22px #020d1c99!important}.dockTeam,.dockTeam span{color:#c1d6e7!important}.dockTeam strong{color:#fff!important}.dockTeam.home strong{color:#66c5f2!important}.dockTeam.away strong{color:#ff9eb0!important}.dockMid b{background:#1a5278!important;border:1px solid #4b9ac3!important;color:#f3fbff!important}.dockMid span{color:#b5c9dc!important}.dockToolbar .btn{background:#1a496c!important;color:#eaf7ff!important;border-color:#39749b!important}.dockToolbar .btn.primary{background:linear-gradient(135deg,#278bd7,#24b7d0)!important;color:#fff!important}
.videoPlayerBar{background:#102f4a!important;border-top:1px solid #2a5574!important}.videoTransport button{color:#e9f6ff!important}.videoTransport label,.videoControls,.embedHint,.videoEmpty{color:#b5c9dc!important}.videoEmpty strong{color:#f3f9ff!important}.videoSeek{accent-color:#3bb4df!important}.videoMarker{border-color:#2c5776!important}.videoMarker span{color:#d6e8f5!important}.videoMarker>button:first-child{background:#1a5278!important;color:#fff!important;border-color:#4b9ac3!important}
/* Court remains deliberately brighter and distinct for fast player recognition. */
.courtPanel .proCourt{box-shadow:0 10px 26px #020d1c99,0 0 0 2px #5bbde5!important}.courtPanel .courtPlayer,.courtPanel .liberoCourtSlot{color:#fff!important}.courtPanel .courtLabel{color:#fff!important}.courtPanel .actionPicker .ph{background:#19496b!important}.serverBadge{background:#ffd166!important;color:#342500!important}
@media(max-height:720px){.side{gap:0!important}.brand{padding-bottom:10px!important}.nav{min-height:34px!important;padding:7px 10px!important;margin:1px 0!important}.bottom{font-size:8px!important;line-height:1.35!important}}
@media(max-width:760px){.side{width:210px!important}.main{margin-left:210px!important;width:calc(100% - 210px)!important;padding:14px!important}.liveDock{left:0!important}}
`;
document.head.appendChild(v88NavyTheme);


/* V89: high-contrast status badges, dedicated roster page, and a working light/dark switch. */
const v89Usability=document.createElement("style");v89Usability.textContent=`
/* Status must never disappear into a dark green surface. */
.courtCountBadge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:7px 12px!important;border-radius:9px!important;background:linear-gradient(135deg,#67e8f9,#38bdf8)!important;border:1px solid #a5f3fc!important;color:#06263d!important;font-size:11px!important;font-weight:1000!important;letter-spacing:.35px!important;box-shadow:0 3px 12px #22b8df44!important;white-space:nowrap!important}
.rosterShortcut{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:14px 16px!important;margin:0 0 10px!important;border-color:#3b83ae!important;background:linear-gradient(110deg,#153f5e,#174c70)!important}
.rosterShortcut>div{display:grid!important;gap:5px!important}.rosterShortcut strong{color:#f4fbff!important;font-size:13px!important;letter-spacing:.5px!important}.rosterShortcut small{color:#c4e2f3!important;font-size:11px!important;line-height:1.5!important}.rosterShortcut .btn{flex:0 0 auto!important}
.rosterPage{max-width:1180px!important}.rosterPage .hero{margin-bottom:12px!important}.rosterPageCard{overflow:visible!important}.rosterPageCard summary{color:#eaf8ff!important}.rosterPageCard .teamGrid{gap:14px!important}.rosterPageCard .wide{min-width:0!important}
.themeToggle{min-width:145px!important;font-weight:900!important;background:linear-gradient(135deg,#1d5b82,#287eaa)!important;border-color:#63c9ed!important;color:#fff!important}
/* Dark mode: brighten green-on-green and low-contrast utility elements. */
.app.theme-dark .skill:first-child,.app .skill:first-child{background:#176b78!important;border-color:#53d7e6!important;color:#fff!important}
.app .result.good{background:#16745f!important;border-color:#6be5c2!important;color:#f0fff9!important}
.app .codeScout{background:linear-gradient(135deg,#176b78,#1b587c)!important;border-color:#65d9e6!important}.app .rally{background:linear-gradient(90deg,#176b68,#1b587c)!important;border-color:#65d9c9!important}
.app .miniStat,.app .slotPlayer,.app .starterField,.app .tacBadge,.app .replayTag,.app .rotBadge,.app .sequenceNo{background:#24628a!important;border-color:#66b8e4!important;color:#f5fbff!important}
/* Light mode is a real alternate palette, not just a decorative button state. */
html:has(body.light-mode),body.light-mode{color-scheme:light!important;background:#e8f1f8!important;color:#16324a!important}
body.light-mode #root,body.light-mode .app{background:linear-gradient(135deg,#edf5fb 0%,#dceaf5 58%,#e8f1f8 100%)!important;color:#16324a!important}
body.light-mode .side{background:linear-gradient(180deg,#123451,#19496b)!important;border-right:1px solid #6c9dbd!important}
body.light-mode .brand b,body.light-mode .head h1,body.light-mode .ey{color:#f4faff!important}
body.light-mode .nav{color:#d5e9f7!important}body.light-mode .nav:hover{background:#28658e!important;color:#fff!important}body.light-mode .nav.active{background:#2c86bb!important;color:#fff!important;border-color:#79d5f0!important}
body.light-mode .bottom{color:#c1d9e9!important;border-color:#477391!important}
body.light-mode .main{background:transparent!important;color:#16324a!important}
body.light-mode .panel,body.light-mode .toolbar,body.light-mode .tacCard,body.light-mode .insight,body.light-mode .card,body.light-mode .wide,body.light-mode .hero,body.light-mode .metric,body.light-mode .reportCard,body.light-mode .detailCard,body.light-mode .lineupSlot,body.light-mode .lineupSummary>div,body.light-mode .simple .panel,body.light-mode .matchHero>div,body.light-mode .rotationProCard,body.light-mode .replayItem,body.light-mode .videoScout,body.light-mode .subBar,body.light-mode .score,body.light-mode .perfCard,body.light-mode .compareCard,body.light-mode .rotationCard,body.light-mode .reportSection,body.light-mode .reportHero,body.light-mode .reportV41,body.light-mode .replayHero,body.light-mode .replayMain,body.light-mode .replayList,body.light-mode .zoneMap,body.light-mode .subPanel,body.light-mode .rosterShortcut{background:linear-gradient(145deg,#f8fcff,#e5f1f9)!important;border:1px solid #a9c8dc!important;color:#173650!important;box-shadow:0 5px 16px #315a7518!important}
body.light-mode h1,body.light-mode h2,body.light-mode h3,body.light-mode h4,body.light-mode .sectionTitle h3,body.light-mode .sectionTitle h4,body.light-mode .stat b,body.light-mode .compareRow b,body.light-mode .reportLine b,body.light-mode .perfName,body.light-mode .perfScore,body.light-mode .detailCard b,body.light-mode .metric b{color:#123451!important}
body.light-mode .panel p,body.light-mode .panel span,body.light-mode .panel label,body.light-mode .panel small,body.light-mode .sectionTitle small,body.light-mode .row small,body.light-mode .stat span,body.light-mode .tacBar span,body.light-mode .perfRole{color:#47677f!important}
body.light-mode .ph{background:#c9e2f2!important;border-bottom:1px solid #a2c6dc!important;color:#164263!important}body.light-mode .ph b{color:#123451!important}
body.light-mode .btn,body.light-mode .result,body.light-mode .skill,body.light-mode .choice,body.light-mode .filterPill,body.light-mode .directionGrid button,body.light-mode .seg button,body.light-mode .quick button,body.light-mode .videoTransport button,body.light-mode .miniActions button{background:#d5eaf7!important;border:1px solid #8bbbd8!important;color:#153b58!important;box-shadow:0 2px 7px #315a7518!important}
body.light-mode .btn.primary,body.light-mode .primary,body.light-mode .themeToggle{background:linear-gradient(135deg,#167ac0,#19a9c2)!important;border-color:#55c8e3!important;color:#fff!important}
body.light-mode .btn.danger,body.light-mode .danger,body.light-mode .result.bad{background:#ffe0e6!important;border-color:#e58da0!important;color:#8b2941!important}
body.light-mode .result.good{background:#c8f4e7!important;border-color:#50c6a4!important;color:#075b48!important}
body.light-mode input,body.light-mode textarea,body.light-mode select,body.light-mode .editInput,body.light-mode .numInput,body.light-mode .tacSelect,body.light-mode .perfControls select,body.light-mode .replayFilters select,body.light-mode .rosterEdit input,body.light-mode .rosterEdit select{background:#fff!important;color:#173650!important;border:1px solid #9dbfd3!important}
body.light-mode input::placeholder,body.light-mode textarea::placeholder{color:#7894a8!important}
body.light-mode .skill:first-child{background:#d5edf8!important;border-color:#82c5e3!important;color:#174767!important}
body.light-mode .codeScout{background:linear-gradient(135deg,#d4f4f2,#dceefa)!important}
body.light-mode .starterField{background:#d8edf9!important;border:1px solid #8abbd7!important;color:#174767!important}body.light-mode .starterField small{color:#47677f!important}
body.light-mode .courtCountBadge{background:linear-gradient(135deg,#a5f3fc,#67e8f9)!important;color:#07334a!important;border-color:#36b9d5!important}
body.light-mode .rosterShortcut strong{color:#123451!important}body.light-mode .rosterShortcut small{color:#47677f!important}
body.light-mode .tr{background:#edf6fc!important;color:#173650!important;border-color:#bdd4e3!important}body.light-mode .tr.th{background:#c9e2f2!important;color:#123451!important}
body.light-mode .liveDock{background:rgba(222,238,248,.98)!important;border-top:1px solid #8eb7d0!important}body.light-mode .dockTeam,body.light-mode .dockTeam span,body.light-mode .dockMid span{color:#315a75!important}body.light-mode .dockTeam strong{color:#123451!important}
body.light-mode .codeScout{background:linear-gradient(135deg,#d4f4f2,#dceefa)!important;border-color:#58bcb6!important}body.light-mode .codeScoutHead b,body.light-mode .quickTitle{color:#087568!important}body.light-mode .codeHelp,body.light-mode .codeScoutHead small{color:#42677f!important}body.light-mode .codeStatus{background:#e1f0f8!important;color:#204a66!important}
body.light-mode .rally{background:linear-gradient(90deg,#d4f4ed,#dceefa)!important;border-color:#67bca9!important;color:#164c49!important}body.light-mode .live{color:#087d69!important}
body.light-mode .courtCountBadge{box-shadow:0 2px 8px #1687a533!important}
@media(max-width:760px){.rosterShortcut{align-items:flex-start!important;flex-direction:column!important}.rosterShortcut .btn{width:100%!important}}
`;document.head.appendChild(v89Usability);

/* V90: substitution history is brought next to its controls and gets its own scroll area. */
const v90HistoryAccents=document.createElement("style");v90HistoryAccents.textContent=`
.substitutionHistoryPanel{margin:9px 0 12px!important;overflow:hidden!important;position:relative!important;border:1px solid #3b83ae!important;background:linear-gradient(125deg,#123451 0%,#143d5c 58%,#164866 100%)!important;box-shadow:0 7px 20px #020d1c55,0 0 0 1px #2b709333!important}
.substitutionHistoryPanel:before{content:"";display:block;height:3px;background:linear-gradient(90deg,#43c6e8,#55dfc5,#f2bd65);opacity:.95}
.substitutionHistoryPanel .ph{background:linear-gradient(90deg,#19496b,#1a5477)!important;border-bottom:1px solid #39769b!important;color:#eaf8ff!important}
.substitutionHistoryPanel .ph span{font-weight:1000!important;color:#eaf8ff!important;letter-spacing:1.1px!important}
.substitutionHistoryPanel .ph b{background:#237e9c!important;border:1px solid #61c8df!important;color:#fff!important;border-radius:20px!important;padding:4px 9px!important;font-size:10px!important}
.substitutionHistoryScroll{max-height:190px!important;overflow-y:auto!important;overflow-x:hidden!important;padding:4px 12px 8px!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;scrollbar-color:#4b9dc5 #102c44!important}
.substitutionHistoryScroll::-webkit-scrollbar{width:9px!important}.substitutionHistoryScroll::-webkit-scrollbar-track{background:#102c44!important;border-radius:9px!important}.substitutionHistoryScroll::-webkit-scrollbar-thumb{background:linear-gradient(#4db8d9,#2878a5)!important;border:2px solid #102c44!important;border-radius:9px!important}
.substitutionHistoryRow{display:grid!important;grid-template-columns:42px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;padding:9px 5px!important;border-bottom:1px solid #2b5572!important;color:#eff8ff!important}
.substitutionHistoryRow:last-child{border-bottom:0!important}
.substitutionHistoryRow .num{display:grid!important;place-items:center!important;min-width:34px!important;height:30px!important;border-radius:8px!important;background:linear-gradient(135deg,#36a9d4,#2678ae)!important;color:#fff!important;font-weight:1000!important;box-shadow:0 2px 8px #020d1c55!important}
.substitutionHistoryRow b{color:#f3fbff!important;font-size:11px!important}.substitutionHistoryRow small{display:block!important;color:#c1d9e9!important;font-size:10px!important;margin-top:3px!important;line-height:1.4!important}.substitutionHistoryRow .right b{color:#75dfd0!important;font-size:9px!important;white-space:nowrap!important}
body.light-mode .substitutionHistoryPanel{background:linear-gradient(125deg,#e5f4fc,#d5eaf7 58%,#c9e4f3)!important;border-color:#78b5d4!important;box-shadow:0 6px 18px #315a7518!important}
body.light-mode .substitutionHistoryPanel .ph{background:linear-gradient(90deg,#c6e3f3,#b6dced)!important;border-color:#91bfd8!important;color:#173e5a!important}
body.light-mode .substitutionHistoryPanel .ph span{color:#173e5a!important}body.light-mode .substitutionHistoryPanel .ph b{background:#2789ad!important;color:#fff!important;border-color:#62c4df!important}
body.light-mode .substitutionHistoryScroll{scrollbar-color:#6ba8c8 #d7eaf5!important}body.light-mode .substitutionHistoryScroll::-webkit-scrollbar-track{background:#d7eaf5!important}body.light-mode .substitutionHistoryScroll::-webkit-scrollbar-thumb{background:#6ba8c8!important;border-color:#d7eaf5!important}
body.light-mode .substitutionHistoryRow{border-color:#c1dce9!important;color:#173650!important}body.light-mode .substitutionHistoryRow b{color:#173650!important}body.light-mode .substitutionHistoryRow small{color:#47677f!important}body.light-mode .substitutionHistoryRow .right b{color:#087d78!important}
@media(max-width:760px){.substitutionHistoryScroll{max-height:165px!important}.substitutionHistoryRow{grid-template-columns:38px minmax(0,1fr)!important}.substitutionHistoryRow .right{grid-column:2!important;text-align:left!important}}
`;
document.head.appendChild(v90HistoryAccents);


/* V91: restore natural document scrolling and keep the fixed score dock from covering Live Stats. */
const v91ScrollLayout=document.createElement("style");v91ScrollLayout.textContent=`
html,body,#root{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important}
body{overflow-y:auto!important;overscroll-behavior-y:auto!important}
.app{height:auto!important;min-height:100vh!important;overflow:visible!important;align-items:stretch!important}
.main{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;overflow-y:visible!important;padding-bottom:190px!important;box-sizing:border-box!important}
.grid{overflow:visible!important;min-height:0!important;align-items:start!important}
.substitutionHistoryPanel{scroll-margin-top:14px!important}
@media(max-width:760px){.main{padding-bottom:250px!important}.grid{grid-template-columns:minmax(0,1fr)!important}}
`;
document.head.appendChild(v91ScrollLayout);



/* V92: high-visibility section labels and responsive content width safeguards. */
const v92VisibilityAndWidth=document.createElement("style");v92VisibilityAndWidth.textContent=`
/* Prevent analytical cards/grids from forcing the page beyond the right edge. */
*,*::before,*::after{box-sizing:border-box}
.main,.simple,.simple>*,.wide,.hero,.panel,.card,.tacCard,.reportSection,.rotationProCard,.replayMain,.replayList{min-width:0!important;max-width:100%!important}
.main{width:calc(100% - 246px)!important;overflow-x:hidden!important}
.simple{width:100%!important;grid-template-columns:minmax(0,1fr)!important}
.dashGrid,.grid,.analyticsGrid,.tacGrid,.perfGrid,.compareGrid,.replayGrid,.grid2,.rotationGridPro{grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;min-width:0!important}
.metrics{grid-template-columns:repeat(6,minmax(0,1fr))!important;width:100%!important}
.tacCard,.card,.reportSection,.rotationProCard{min-width:0!important;overflow:hidden!important}
.tacTable,.tableWrap,.rotationTable,.statTable{display:block!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain!important;scrollbar-width:thin!important}
.tacTable .tr{min-width:640px!important}
.tableWrap table{min-width:760px!important;width:max-content!important}
.toolbar,.analyticsToolbar,.tacFilters,.statsTabs,.perfControls{max-width:100%!important;min-width:0!important;flex-wrap:wrap!important;overflow-wrap:anywhere!important}
.toolbar>* ,.analyticsToolbar>*{min-width:0!important;max-width:100%!important}
.sectionTitle{min-width:0!important;flex-wrap:wrap!important;gap:8px!important}
.sectionTitle>div{min-width:0!important;max-width:100%!important}
.sequenceRow{grid-template-columns:38px minmax(0,1fr) auto!important;min-width:0!important}
.sequenceRow>div{min-width:0!important;overflow-wrap:anywhere!important}
/* Headings and active set labels get the same bright cyan/blue visual cue as 6/6 players. */
.hero h2,.simple>.hero h2,.head h1,.sectionTitle h3,.sectionTitle h4{display:inline-flex!important;align-items:center!important;gap:7px!important;padding:6px 10px!important;border-radius:8px!important;background:linear-gradient(120deg,#164e70,#176b82)!important;border:1px solid #55c9e7!important;color:#eafaff!important;text-shadow:0 1px 2px #06263b!important;box-shadow:0 3px 12px #22b8df22!important;letter-spacing:.25px!important}
.hero .tag,.ey{color:#83e6f5!important;font-weight:900!important}
.sectionTitle> b,.sectionTitle>span,.setScoreRow>span,.setScoreRow small{color:#8deaff!important;font-weight:900!important}
.tacBadge,.rotBadge,.replayTag,.sequenceNo{background:linear-gradient(135deg,#2b91b9,#226b9d)!important;border:1px solid #72d9f0!important;color:#f3fcff!important;box-shadow:0 2px 8px #1687a533!important}
body.light-mode .hero h2,body.light-mode .simple>.hero h2,body.light-mode .head h1,body.light-mode .sectionTitle h3,body.light-mode .sectionTitle h4{background:linear-gradient(120deg,#b9eaf8,#d7f4fb)!important;border:1px solid #55b8d8!important;color:#12415d!important;text-shadow:none!important;box-shadow:0 3px 10px #1687a51c!important}
body.light-mode .hero .tag,body.light-mode .ey{color:#087d9c!important}
body.light-mode .sectionTitle>b,body.light-mode .sectionTitle>span,body.light-mode .setScoreRow>span,body.light-mode .setScoreRow small{color:#087d9c!important}
body.light-mode .tacBadge,body.light-mode .rotBadge,body.light-mode .replayTag,body.light-mode .sequenceNo{background:linear-gradient(135deg,#d0f2fb,#b9e5f5)!important;border-color:#64bad7!important;color:#12415d!important}
@media(max-width:1200px){.metrics{grid-template-columns:repeat(4,minmax(0,1fr))!important}.dashGrid,.grid,.analyticsGrid,.tacGrid,.perfGrid,.compareGrid,.replayGrid,.grid2,.rotationGridPro{grid-template-columns:minmax(0,1fr)!important}}
@media(max-width:1050px){.main{width:calc(100% - 190px)!important}.metrics{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media(max-width:760px){.main{width:100%!important;margin-left:0!important}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hero{align-items:flex-start!important;flex-wrap:wrap!important}.hero h2,.head h1{max-width:100%!important;overflow-wrap:anywhere!important}.sequenceRow{grid-template-columns:34px minmax(0,1fr)!important}.sequenceResult{grid-column:2!important}}
`;
document.head.appendChild(v92VisibilityAndWidth);



/* V94: improve dark-mode roster readability and give the AVS monogram a distinctive badge. */
const v94BrandAndRoster=document.createElement("style");v94BrandAndRoster.textContent=`
/* The roster's selected-player names must stay crisp against the navy cards. */
body:not(.light-mode) .starterField small{color:#ffffff!important;font-weight:800!important;text-shadow:0 1px 2px #061522!important}
/* Strong contrast for the six-player count badge in dark mode. */
body:not(.light-mode) .courtCountBadge{background:linear-gradient(135deg,#63e6f5 0%,#36c5e8 52%,#49d8c4 100%)!important;color:#061522!important;border:1px solid #a5f3fc!important;box-shadow:0 3px 12px #24bfe855, inset 0 1px 0 #ffffff66!important;text-shadow:none!important;font-weight:1000!important}
/* AVS: compact performance-tech crest with a volleyball-inspired orbit. */
.brand .logo{position:relative;isolation:isolate;overflow:hidden;display:grid;place-items:center;width:48px!important;height:48px!important;flex:0 0 48px;border-radius:15px!important;background:linear-gradient(145deg,#071c34 0%,#10517a 48%,#087f9b 100%)!important;border:1px solid #63e5f2!important;color:#f4fdff!important;box-shadow:0 0 0 3px #1bbbd522,0 8px 22px #020c18aa,inset 0 1px 0 #ffffff44!important}
.brand .logo:before{content:"";position:absolute;z-index:-1;width:37px;height:37px;border:1.5px solid #7cecf0;border-radius:50%;transform:rotate(-32deg) scaleX(.72);opacity:.72;box-shadow:0 0 10px #38d9e866}
.brand .logo:after{content:"";position:absolute;z-index:-1;width:58px;height:13px;left:-8px;top:17px;border-top:2px solid #55dce8;border-bottom:1px solid #55dce855;transform:rotate(-38deg);opacity:.9}
.brand .logo span{position:relative;z-index:2;font-size:15px!important;font-weight:1000!important;letter-spacing:-.7px!important;line-height:1;text-shadow:0 2px 5px #03101c;transform:translateY(1px)}
.brand .logo i{position:absolute;right:6px;top:6px;width:5px;height:5px;border-radius:50%;background:#a7fff0;box-shadow:0 0 8px #a7fff0}
body.light-mode .brand .logo{background:linear-gradient(145deg,#0a2947 0%,#176b9b 52%,#0a9baa 100%)!important;border-color:#83e8f2!important;box-shadow:0 0 0 3px #1bbbd522,0 7px 18px #123c5a33,inset 0 1px 0 #ffffff55!important}
body.light-mode .starterField small{color:#47677f!important}
body.light-mode .courtCountBadge{color:#07334a!important}
`;
document.head.appendChild(v94BrandAndRoster);

createRoot(document.getElementById("root")!).render(<ErrorBoundary><App/></ErrorBoundary>);
