import { useState } from "react";
import { Home, BarChart3, CheckCircle2, Wrench, BedDouble, ClipboardCheck, BookOpen, Building2, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Search, AlertTriangle, TrendingUp, TrendingDown, Minus, Calendar, Users, Star, Zap, Eye, FileText, MessageSquare, Sparkles, Trophy, Sun, Smartphone, Gift } from "lucide-react";

// ─── BRAND ──────────────────────────────────────────────────────────────────
const C={
  navy:"#1B2A4A",navy2:"#253759",
  sand:"#C8A96E",sand2:"#D4BC8A",sandA:"rgba(200,169,110,0.10)",sandB:"rgba(200,169,110,0.20)",
  bg:"#F5F3EE",card:"#FFFFFF",warm:"#E8E4DD",
  t1:"#1B2A4A",t2:"#5E6B80",t3:"#8E96A4",
  b1:"#E2DDD5",b2:"#EDE9E3",
  ok:"#16A34A",okA:"rgba(22,163,74,0.08)",okB:"rgba(22,163,74,0.14)",
  warn:"#D97706",warnA:"rgba(217,119,6,0.08)",warnB:"rgba(217,119,6,0.14)",
  err:"#DC2626",errA:"rgba(220,38,38,0.08)",errB:"rgba(220,38,38,0.14)",
  info:"#7C3AED",teal:"#0D9488",tealB:"rgba(13,148,136,0.14)",
};
const ff="'Outfit',sans-serif";
const MO=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const BL=3;          // border-left accent width
const RAD=14;        // card border-radius
const BTN_S={w:32,h:28,r:8};  // notation button size

// ─── DATA ───────────────────────────────────────────────────────────────────
const RITUALS=[
  {id:"trustyou",label:"Récolte données TrustYou",icon:BarChart3,freq:"Hebdo",desc:"Se connecter sur TrustYou/VOG. Relever RPS, CompIndex, nombre d'avis, taux de réponse. Annoter les catégories d'impact."},
  {id:"reunion",label:"Réunion qualité équipes",icon:Users,freq:"Hebdo",desc:"Point hebdo avec réception, étages, technique. Retours clients, actions en cours, blocages."},
  {id:"avis",label:"Réponse 100% avis clients",icon:MessageSquare,freq:"Hebdo",desc:"Répondre à tous les avis sur toutes les plateformes. Personnaliser chaque réponse."},
  {id:"maintenance",label:"Contrôle Plan Maintenance",icon:Wrench,freq:"Hebdo",desc:"Vérifier le plan de maintenance préventive : équipements, interventions, tickets."},
  {id:"perso",label:"Personnalisation séjours",icon:Sparkles,freq:"Hebdo",desc:"Sparkles : mot de bienvenue, surclassement, attention chambre selon profil client."},
  {id:"chambres",label:"Contrôle des chambres",icon:BedDouble,freq:"Quotidien",desc:"Auditer toutes les chambres en arrivée. Grille par zone. Min. 2 par DM + autocontrôle."},
  {id:"incentive",label:"Incentive satisfaction",icon:Trophy,freq:"Trimestriel",desc:"Challenge ou prime lié à la satisfaction client."},
  {id:"animation",label:"Animations clients",icon:Gift,freq:"Mensuel",desc:"Au moins une animation/mois selon calendrier Playbook."},
  {id:"saison",label:"Actions haute saison",icon:Sun,freq:"Biannuel",desc:"Avant haute saison : check clim/chauffage, goodies, déco, aménagements."},
  {id:"qrcode",label:"QR Code / NFC",icon:Smartphone,freq:"Constant",desc:"QR code Google visible réception et chambres. Former les équipes."},
  {id:"pa",label:"Mise à jour Plan d'Action",icon:ClipboardCheck,freq:"Bi-mensuel",desc:"Actualiser statuts, ajouter actions, vérifier échéances."},
];

const EVENTS=[{m:0,d:1,n:"Jour de l'An",t:"deco",tip:"Décoration hôtel"},{m:0,d:6,n:"Épiphanie",t:"food",tip:"Galette des rois"},{m:1,d:2,n:"Chandeleur",t:"food",tip:"Crêpes à l'arrivée"},{m:1,d:14,n:"Saint-Valentin",t:"deco",tip:"Déco + package"},{m:2,d:17,n:"Saint-Patrick",t:"event",tip:"Soirée bière"},{m:3,d:5,n:"Pâques",t:"food",tip:"Brunch, chocolat"},{m:4,d:1,n:"Fête du travail",t:"deco",tip:"Muguet"},{m:5,d:11,n:"FIFA 2026",t:"event",tip:"Diffusion matchs"},{m:5,d:21,n:"Fête musique",t:"event",tip:"Concert, blind test"},{m:6,d:14,n:"14 Juillet",t:"food",tip:"Barbecue"},{m:8,d:19,n:"Oktoberfest",t:"event",tip:"Bière + bretzels"},{m:9,d:31,n:"Halloween",t:"deco",tip:"Déco + bonbons"},{m:10,d:19,n:"Beaujolais",t:"food",tip:"Dégustation"},{m:11,d:24,n:"Noël",t:"deco",tip:"Vin chaud, fondue"},{m:11,d:31,n:"Réveillon",t:"event",tip:"Soirée spéciale"}];

const BOOSTS=[{t:"Tombola quotidienne commentaires 5★",e:"low"},{t:"Roue à jeux avec récompenses",e:"med"},{t:"QR code Google à la réception",e:"low"},{t:"Mot d'accueil Booking + relance",e:"low"},{t:"Café + viennoiserie pendant commentaire",e:"med"},{t:"1000 pts IHG / commentaire nominatif",e:"high"},{t:"Prime par commentaire nominatif",e:"high"}];

const PLAYBOOKS={summer:["Jarre boissons rafraîchissantes","Fleurir extérieurs","Goodies été","Check maintenance clim","Anticiper ventilateurs","Check global maintenance","Aménager extérieurs (ping-pong, pétanque)"],winter:["Vin chaud / chocolat chaud","Bougies LED, sapin, déco chalet","Goodies hiver","Check chauffage avant saison","Anticiper convecteurs / plaids"],allYear:["Surclassement offert à l'arrivée","Mot personnalisé en chambre","Marchés artisans locaux","Animations (concerts…)","Goûter enfants + jeux"]};

const ROOM_EQ=["TV/Télécommande","Ampoules","Joints SDB","Peinture","Sols","Robinetterie","WC","Rideaux","Menuiseries"];

const INSPECT_ZONES={"Zone entrée":["Couloir ext.","Portes","Interrupteurs","Murs/plafonds","Miroir","TV","Plateau café","Garde-robe","Bureau","Tiroirs","Fenêtre","Rideaux","Chevet","Lampes","Tête de lit","Thermostat","Odeur"],"Chambre":["Cintres","Oreiller suppl.","Linge","Couvertures","Sous le lit","Fiche info","TV chaînes","DND","Rangement"],"Salle de bain":["Interrupteurs","WC","Tuyaux","Papier toilette","Douche","Robinets","Carrelage","Gel douche","Siphon","Évier","Miroir","Éclairage","Sol/joints","Odeur"],"Installation":["Papier x2","Sac déchets","Savon/verres","Linge de maison","Rangement SDB"]};

const AUDIT_Z=[{id:"ext",n:"Extérieurs",ic:Building2,items:["Signalétique","Parking","Façade","Éclairage","Propreté","Espaces verts","Terrasse"]},{id:"lobby",n:"Accueil",ic:Home,items:["1ère impression","Propreté","Odeur","Éclairage","Mobilier","Affichage","Documentation","Musique"]},{id:"recep",n:"Réception",ic:Users,items:["Rapidité","Sourire","Tenue","Connaissance","Upsell","Check-in"]},{id:"couloirs",n:"Couloirs",ic:Eye,items:["Propreté","Éclairage","Signalétique","Sol","Peinture","Coupe-feu","Issues"]},{id:"chambre",n:"Chambre",ic:BedDouble,items:["Propreté","Literie","SDB","Équipements","Consommables","Doc.","TV/clim"]},{id:"fb",n:"F&B",ic:Gift,items:["Buffet","Fraîcheur","Présentation","Salle","Service","Horaires","Vaisselle"]},{id:"communs",n:"Communs",ic:Building2,items:["Séminaire","Fitness","Ascenseur","Escaliers","Buanderie"]},{id:"secu",n:"Sécurité",ic:ShieldCheck,items:["Extincteurs","Issues","Affichage","Registre"]}];

const SAFETY=[{id:"moyens",n:"Moyens secours",items:[{l:"Extincteurs",f:"Annuelle"},{l:"RIA / colonnes sèches",f:"Annuelle"},{l:"BAES",f:"Annuelle"},{l:"SSI",f:"Trimestrielle"},{l:"Désenfumage",f:"Annuelle"},{l:"Plans évacuation",f:"Annuelle"}]},{id:"controles",n:"Contrôles réglem.",items:[{l:"Électricité",f:"Annuelle"},{l:"Gaz",f:"Annuelle"},{l:"Ascenseur annuel",f:"Annuelle"},{l:"Ascenseur quinquennal",f:"Quinquennale"},{l:"Commission sécurité",f:"Tri-annuelle"},{l:"Amiante/plomb",f:"Annuelle"}]},{id:"formations",n:"Formations",items:[{l:"Incendie équipiers",f:"Annuelle"},{l:"Évacuation",f:"Semestrielle"},{l:"SST",f:"Annuelle"}]},{id:"observations",n:"Observations",items:[]}];

// ─── UI PRIMITIVES ──────────────────────────────────────────────────────────
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.card,borderRadius:RAD,border:`1px solid ${C.b2}`,padding:16,boxShadow:"0 1px 4px rgba(27,42,74,0.05)",cursor:onClick?"pointer":undefined,...style}}>{children}</div>;

const Btn=({children,variant="primary",onClick,disabled,style,icon:Icon})=>{
  const v={primary:{bg:C.navy,c:"#fff",b:C.navy},secondary:{bg:"transparent",c:C.t2,b:C.b1},sand:{bg:C.sand,c:"#fff",b:C.sand}};
  const s=v[variant]||v.primary;
  return<button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:6,background:s.bg,color:s.c,border:`1.5px solid ${s.b}`,borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:disabled?"default":"pointer",fontFamily:ff,opacity:disabled?.5:1,transition:"all .15s",...style}}>{Icon&&<Icon size={15}/>}{children}</button>;
};

const Input=({value,onChange,placeholder,style,type="text",icon:Icon})=>(
  <div style={{position:"relative"}}>
    {Icon&&<Icon size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.t3}}/>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:C.bg,border:`1px solid ${C.b1}`,borderRadius:10,padding:Icon?"10px 14px 10px 36px":"10px 14px",color:C.t1,fontSize:14,fontFamily:ff,width:"100%",outline:"none",boxSizing:"border-box",transition:"border .15s",...style}}
      onFocus={e=>{e.target.style.borderColor=C.sand}} onBlur={e=>{e.target.style.borderColor=C.b1}}/>
  </div>
);

const DateInput=({value,onChange,style,late})=>(
  <input type="date" value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",background:C.bg,border:`1px solid ${late?`${C.err}60`:C.b1}`,borderRadius:10,padding:"8px 12px",fontSize:13,fontFamily:ff,color:C.t1,boxSizing:"border-box",...style}}/>
);

const Pill=({children,active,onClick,color,count})=>(
  <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,background:active?(color||C.navy):"transparent",color:active?"#fff":C.t2,border:`1.5px solid ${active?(color||C.navy):C.b1}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:ff,whiteSpace:"nowrap",transition:"all .12s"}}>
    {children}{count!==undefined&&<span style={{background:active?"rgba(255,255,255,0.25)":C.b2,borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>{count}</span>}
  </button>
);

const Tag=({children,color=C.t3,bg})=><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:bg||`${color}15`,color,letterSpacing:.2}}>{children}</span>;

const Label=({children})=><div style={{fontSize:11,color:C.t3,marginBottom:4,fontWeight:500}}>{children}</div>;

const Section=({title,sub,right,children})=>(
  <div style={{marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
      <div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.navy,letterSpacing:-.5}}>{title}</h2>{sub&&<p style={{margin:"3px 0 0",fontSize:13,color:C.t3}}>{sub}</p>}</div>
      {right}
    </div>
    {children}
  </div>
);

const SectionLabel=({children})=><div style={{fontSize:11,fontWeight:700,color:C.t3,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{children}</div>;

const Progress=({value,max=100,color=C.sand,h=6})=><div style={{background:C.warm,borderRadius:h,height:h,overflow:"hidden"}}><div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:h,transition:"width .4s ease"}}/></div>;

const Toast=({msg,show})=>show?<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",background:C.navy,color:"#fff",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:600,fontFamily:ff,zIndex:200,boxShadow:"0 8px 24px rgba(0,0,0,0.2)",animation:"fadeUp .3s ease"}}>{msg}</div>:null;

const Empty=({icon:Icon,title,sub})=><div style={{textAlign:"center",padding:"40px 20px"}}><div style={{width:56,height:56,borderRadius:16,background:C.sandA,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Icon size={24} color={C.sand}/></div><div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:4}}>{title}</div><div style={{fontSize:13,color:C.t3}}>{sub}</div></div>;

const KPI=({label,value,sub,color,icon:Icon})=>(
  <div style={{textAlign:"center",padding:"12px 8px",background:C.card,borderRadius:RAD,border:`1px solid ${C.b2}`}}>
    {Icon&&<Icon size={16} color={color||C.navy} style={{marginBottom:4}}/>}
    <div style={{fontSize:22,fontWeight:800,color:color||C.navy,letterSpacing:-1,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:color||C.t3,marginTop:2}}>{sub}</div>}
    <div style={{fontSize:10,color:C.t3,marginTop:4,fontWeight:500}}>{label}</div>
  </div>
);

const NoteBtn=({active,color,children,onClick})=>(
  <button onClick={onClick} style={{width:BTN_S.w,height:BTN_S.h,borderRadius:BTN_S.r,border:`1.5px solid ${active?color:C.b1}`,background:active?`${color}18`:"transparent",color:active?color:C.t3,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:ff,transition:"all .12s"}}>{children}</button>
);

const AlertRow=({icon:Icon,label,count,color,onClick,last})=>(
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:last?"none":`1px solid ${C.b2}`,cursor:onClick?"pointer":"default"}}>
    <div style={{width:36,height:36,borderRadius:10,background:count>0?`${color}12`:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={18} color={count>0?color:C.ok}/></div>
    <div style={{flex:1,fontSize:14,fontWeight:500,color:C.t1}}>{label}</div>
    <div style={{fontSize:18,fontWeight:800,color:count>0?color:C.ok}}>{count}</div>
    {onClick&&<ChevronRight size={14} color={C.t3}/>}
  </div>
);

// ─── NAV ────────────────────────────────────────────────────────────────────
const NAV=[
  {id:"hub",label:"Hub",icon:Home},
  {id:"chambres",label:"Chambres",icon:BedDouble},
  {id:"actions",label:"Actions",icon:CheckCircle2},
  {id:"rituals",label:"Rituels",icon:ClipboardCheck},
  {id:"tech",label:"Technique",icon:Wrench},
];

// ─── APP ────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("hub");
  const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2000);};
  const go=id=>setTab(id);

  const [hotel,setHotel]=useState({name:"",rooms:"",city:""});
  const [rpsTarget]=useState("80");
  const [monthly,setMonthly]=useState(MO.map(()=>({rps:"",rpsN1:"",compIndex:"",nbAvis:"",tauxReponse:"",neg1:"",neg2:"",neg3:"",pos1:"",pos2:"",pos3:""})));
  const [selMonth,setSelMonth]=useState(new Date().getMonth());
  const [actions,setActions]=useState([
    {cat:"Chambre",score:34.69,text:"Contrôle chambres arrivées par la gouvernante",date:"2025-01-15",owner:"DM",status:"done"},
    {cat:"Propreté",score:32,text:"Contrôler autocontrôles — min. 2 chambres/jour",date:"2025-01-01",owner:"DM",status:"progress"},
    {cat:"Équipement",score:37.74,text:"Revoir accueil : système chauffage/clim",date:"",owner:"DM",status:"todo"},
    {cat:"Maintenance",score:24.53,text:"Changement télévisions HS",date:"2025-08-01",owner:"GM",status:"done"},
    {cat:"Maintenance",score:null,text:"Peinture couloirs 1er et 2e étage",date:"2025-12-31",owner:"Tech",status:"todo"},
  ]);
  const [ritCk,setRitCk]=useState({});
  const toggleRit=id=>{setRitCk(p=>({...p,[id]:!p[id]}));showToast(ritCk[id]?"Rituel déchoché":"Rituel validé ✓");};
  const ritDone=Object.values(ritCk).filter(Boolean).length;

  const [dailyMaint,setDailyMaint]=useState([
    {date:"2026-03-30",zone:"Ch. 102",equip:"Douche",problem:"Joint noirci",priority:"Haute",status:"A faire",cost:"15"},
    {date:"2026-03-03",zone:"Cuisine",equip:"Four n°1",problem:"Ne chauffe plus",priority:"Faible",status:"Terminé",cost:"450"},
  ]);
  const [suppliers]=useState([
    {equip:"Chaufferie",date:"2025-02-28",freq:"Semestrielle"},{equip:"Ascenseur",date:"2025-03-11",freq:"Annuelle"},
    {equip:"SSI",date:"2025-03-16",freq:"Tri-annuelle"},{equip:"Climatisation",date:"",freq:"Annuelle"},
    {equip:"Extincteurs",date:"",freq:"Annuelle"},{equip:"Mousseurs",date:"2026-03-16",freq:"Trimestrielle"},
  ]);
  const [roomChecks,setRoomChecks]=useState([
    {room:101,states:{"TV/Télécommande":"BON","Joints SDB":"DEGRADE",Peinture:"DEGRADE"},date:"2026-03-03",action:"Refaire joints SDB",status:"A FAIRE"},
    {room:102,states:{},date:"2023-10-02",action:"Robinet douche",status:"A FAIRE"},
  ]);
  const [auditScores,setAuditScores]=useState({});
  const [auditMeta,setAuditMeta]=useState({date:"",auditor:""});
  const [auditComments,setAuditComments]=useState({});
  const [safetyData,setSafetyData]=useState({});
  const [customEvents,setCustomEvents]=useState([]);
  const [customSeasons,setCustomSeasons]=useState({summer:[],winter:[],allYear:[]});
  const [customBoosts,setCustomBoosts]=useState([]);

  // Computed
  const latestRps=monthly.map((m,i)=>({mo:MO[i],v:parseFloat(m.rps)})).filter(d=>!isNaN(d.v));
  const curRps=latestRps.length?latestRps[latestRps.length-1].v:null;
  const rpsC=v=>v>=80?C.ok:v>=65?C.warn:C.err;
  const actionsDone=actions.filter(a=>a.status==="done").length;
  const actionsUrgent=actions.filter(a=>a.status==="todo").length;
  const isLate=(ds,fs)=>{if(!ds)return true;const d=new Date(ds),now=new Date(),fm={Mensuelle:1,Trimestrielle:3,Semestrielle:6,Annuelle:12,"Tri-annuelle":36,Quinquennale:60},lim=new Date(d);lim.setMonth(lim.getMonth()+(fm[fs]||12));return now>lim;};
  const isOld=ds=>{if(!ds)return false;return(new Date()-new Date(ds))/864e5>90;};
  const urgD=dailyMaint.filter(t=>t.priority==="Haute"&&t.status==="A faire").length;
  const lateS=suppliers.filter(s=>isLate(s.date,s.freq)).length;
  const lateR=roomChecks.filter(r=>isOld(r.date)).length;
  const totalAlerts=urgD+lateS+lateR;
  const stC=s=>s==="BON"?C.ok:s==="DEGRADE"?C.warn:s==="HS"?C.err:C.t3;
  const stB=s=>s==="BON"?C.okB:s==="DEGRADE"?C.warnB:s==="HS"?C.errB:C.bg;
  const ST=["BON","DEGRADE","HS"];
  const prC=p=>p==="Haute"?C.err:p==="Moyenne"?C.warn:C.ok;

  // ═══════════════════════════════════════════════════════════════════════════
  // HUB
  // ═══════════════════════════════════════════════════════════════════════════
  function HubPage(){
    const now=new Date().getMonth();
    const nextEv=EVENTS.filter(e=>e.m>=now).slice(0,2);
    const filled=monthly.filter(m=>m.rps);
    const last=filled.length?monthly.map((m,i)=>({...m,idx:i})).filter(m=>m.rps).pop():null;
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.navy2})`,borderRadius:18,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(200,169,110,0.06)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:C.sand2,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>somnOO Quality</div>
            <input value={hotel.name} onChange={e=>setHotel({...hotel,name:e.target.value})} placeholder="Nom de l'hôtel"
              style={{background:"transparent",border:"none",color:"#fff",fontSize:22,fontWeight:800,fontFamily:ff,width:"100%",outline:"none",padding:0,letterSpacing:-.5}}/>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <input value={hotel.city} onChange={e=>setHotel({...hotel,city:e.target.value})} placeholder="Ville"
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.8)",fontSize:12,fontFamily:ff,padding:"5px 10px",width:110,outline:"none"}}/>
              <input value={hotel.rooms} onChange={e=>setHotel({...hotel,rooms:e.target.value})} placeholder="Nb ch."
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.8)",fontSize:12,fontFamily:ff,padding:"5px 10px",width:70,outline:"none"}}/>
            </div>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{position:"relative",width:64,height:64}}>
              <svg width="64" height="64" viewBox="0 0 64 64" style={{transform:"rotate(-90deg)"}}>
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5"/>
                <circle cx="32" cy="32" r="27" fill="none" stroke={curRps?rpsC(curRps):C.sand} strokeWidth="5"
                  strokeDasharray={2*Math.PI*27} strokeDashoffset={2*Math.PI*27*(1-(curRps||0)/100)} strokeLinecap="round" style={{transition:"all .8s"}}/>
              </svg>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:18,fontWeight:800,color:"#fff"}}>{curRps??<Minus size={16}/>}</div>
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:3}}>RPS · Obj. {rpsTarget}</div>
          </div>
        </div>
      </div>

      {totalAlerts>0&&<Card onClick={()=>go("tech")} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderColor:`${C.err}30`,background:C.errA}}>
        <AlertTriangle size={20} color={C.err}/>
        <div style={{flex:1}}><span style={{fontSize:14,fontWeight:700,color:C.err}}>{totalAlerts} alerte{totalAlerts>1?"s":""}</span><span style={{fontSize:12,color:C.t2,marginLeft:6}}>à traiter</span></div>
        <ChevronRight size={16} color={C.err}/>
      </Card>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <KPI label="Actions" value={`${actionsDone}/${actions.length}`} sub={actionsUrgent>0?`${actionsUrgent} à faire`:undefined} color={C.ok} icon={CheckCircle2}/>
        <KPI label="Rituels" value={`${ritDone}/${RITUALS.length}`} color={ritDone===RITUALS.length?C.ok:C.warn} icon={ClipboardCheck}/>
        <KPI label="RPS" value={curRps??<Minus size={14}/>} sub={curRps?curRps>=80?"Excellent":curRps>=65?"Correct":"Attention":undefined} color={curRps?rpsC(curRps):C.t3} icon={TrendingUp}/>
      </div>

      <SectionLabel>Accès rapide</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {id:"perf",label:"Performance",sub:last?`RPS ${last.rps}`:"Saisir données",ic:BarChart3,c:C.navy},
          {id:"playbook",label:"Playbook",sub:nextEv.length?nextEv[0].n:"—",ic:BookOpen,c:C.info},
          {id:"audit",label:"Audit Global",sub:Object.keys(auditScores).length>0?`${Math.round((Object.values(auditScores).reduce((s,v)=>s+parseInt(v),0)/Object.keys(auditScores).length)*25)}%`:"Lancer un audit",ic:Eye,c:C.teal},
          {id:"safety",label:"Commission Sécu.",sub:lateS>0?`${lateS} retard`:"À jour",ic:ShieldCheck,c:lateS>0?C.err:C.ok},
        ].map(m=>(
          <Card key={m.id} onClick={()=>go(m.id)} style={{padding:16,borderLeft:`${BL}px solid ${m.c}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <m.ic size={20} color={m.c}/><ChevronRight size={14} color={C.t3}/>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:C.t1}}>{m.label}</div>
            <div style={{fontSize:11,color:C.t3,marginTop:2}}>{m.sub}</div>
          </Card>
        ))}
      </div>

      {latestRps.length>1&&<Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <SectionLabel>Évolution RPS</SectionLabel>
          <Tag color={C.sand}>obj. {rpsTarget}</Tag>
        </div>
        <svg width="100%" height={90} viewBox={`0 0 ${Math.max(latestRps.length*54,180)} 90`} style={{overflow:"visible"}}>
          {rpsTarget&&<line x1="0" y1={80-((parseFloat(rpsTarget)-40)/60)*72} x2={latestRps.length*54} y2={80-((parseFloat(rpsTarget)-40)/60)*72} stroke={C.sand} strokeWidth="1" strokeDasharray="4 3" opacity=".4"/>}
          <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navy} stopOpacity=".1"/><stop offset="100%" stopColor={C.navy} stopOpacity="0"/></linearGradient></defs>
          <path d={`M${latestRps.map((d,i)=>`${i*54+20},${80-((d.v-40)/60)*72}`).join(" L")} L${(latestRps.length-1)*54+20},86 L20,86 Z`} fill="url(#rg)"/>
          <polyline points={latestRps.map((d,i)=>`${i*54+20},${80-((d.v-40)/60)*72}`).join(" ")} fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinejoin="round"/>
          {latestRps.map((d,i)=>{const x=i*54+20,y=80-((d.v-40)/60)*72;return<g key={i}><circle cx={x} cy={y} r={4.5} fill={C.card} stroke={rpsC(d.v)} strokeWidth={2.5}/><text x={x} y={y-10} textAnchor="middle" fill={C.t1} fontSize={10} fontWeight={700} fontFamily={ff}>{d.v}</text><text x={x} y={88} textAnchor="middle" fill={C.t3} fontSize={9} fontFamily={ff}>{d.mo}</text></g>;})}
        </svg>
      </Card>}

      {nextEv.length>0&&<Card>
        <SectionLabel>À venir</SectionLabel>
        {nextEv.map((e,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<nextEv.length-1?`1px solid ${C.b2}`:"none"}}>
          <Calendar size={16} color={C.sand}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{e.n}</div><div style={{fontSize:11,color:C.t3}}>{e.tip}</div></div>
          <Tag color={C.t3}>{e.d}/{e.m+1}</Tag>
        </div>)}
      </Card>}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAMBRES
  // ═══════════════════════════════════════════════════════════════════════════
  function ChambresPage(){
    const [mode,setMode]=useState("rapide"),[room,setRoom]=useState(""),[rType,setRType]=useState("blanc"),[ck,setCk]=useState({}),[advZ,setAdvZ]=useState(Object.keys(INSPECT_ZONES)[0]),[advS,setAdvS]=useState({}),[history,setHistory]=useState([]);
    const rapI=["Propreté générale","Literie faite","SDB propre","Consommables OK","TV fonctionne","Clim/chauffage OK","Pas d'odeur","Poubelles vidées","Serviettes","Rideaux","Sol propre","Pas de dégât","Documentation","Porte OK","Fenêtre propre"];
    const ok=Object.values(ck).filter(v=>v==="ok").length,ko=Object.values(ck).filter(v=>v==="ko").length;
    const save=()=>{if(!room)return;setHistory(p=>[{room,type:rType,mode,score:mode==="rapide"?Math.round(ok/rapI.length*100):0,date:new Date().toLocaleDateString("fr-FR"),items:mode==="rapide"?ok:Object.keys(advS).length},...p]);setCk({});setAdvS({});setRoom("");showToast(`Chambre ${room} enregistrée ✓`);};
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Contrôle Chambres" sub="Audit propreté & présentation"/>
      <Card>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <Input value={room} onChange={setRoom} placeholder="N° chambre" icon={BedDouble} style={{width:120}}/>
          <select value={rType} onChange={e=>setRType(e.target.value)} style={{background:C.bg,border:`1px solid ${C.b1}`,borderRadius:10,padding:"8px 12px",fontSize:13,fontFamily:ff,color:C.t1}}>
            <option value="blanc">À blanc</option><option value="recouche">Recouche</option><option value="dnd">DND</option>
          </select>
          <Btn onClick={save} disabled={!room} icon={CheckCircle2} style={{flexShrink:0}}>OK</Btn>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Pill active={mode==="rapide"} onClick={()=>setMode("rapide")} color={C.ok}>Rapide</Pill>
          <Pill active={mode==="avance"} onClick={()=>setMode("avance")}>Avancé</Pill>
        </div>
      </Card>
      {mode==="rapide"&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <KPI label="OK" value={ok} color={C.ok}/><KPI label="KO" value={ko} color={C.err}/><KPI label="Restant" value={rapI.length-ok-ko} color={C.t3}/>
        </div>
        <Progress value={ok+ko} max={rapI.length} color={ko>0?C.warn:C.ok} h={4}/>
        <Card style={{padding:0}}>
          {rapI.map((item,i)=>{const v=ck[item]||"";return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",borderBottom:i<rapI.length-1?`1px solid ${C.b2}`:"none",background:v==="ok"?C.okA:v==="ko"?C.errA:"transparent",transition:"background .15s"}}>
              <span style={{fontSize:13,color:v==="ok"?C.ok:v==="ko"?C.err:C.t1,fontWeight:v?600:400}}>{item}</span>
              <div style={{display:"flex",gap:6}}>
                <NoteBtn active={v==="ok"} color={C.ok} onClick={()=>setCk(p=>({...p,[item]:"ok"}))}><CheckCircle2 size={14}/></NoteBtn>
                <NoteBtn active={v==="ko"} color={C.err} onClick={()=>setCk(p=>({...p,[item]:"ko"}))}><X size={14}/></NoteBtn>
              </div>
            </div>
          );})}
        </Card>
      </>}
      {mode==="avance"&&<>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>{Object.keys(INSPECT_ZONES).map(z=><Pill key={z} active={advZ===z} onClick={()=>setAdvZ(z)} count={INSPECT_ZONES[z].length}>{z}</Pill>)}</div>
        <Card style={{padding:0}}>
          {INSPECT_ZONES[advZ].map((item,i)=>{const v=advS[`${advZ}-${item}`]||"";return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:i<INSPECT_ZONES[advZ].length-1?`1px solid ${C.b2}`:"none"}}>
              <span style={{fontSize:13,flex:1}}>{item}</span>
              <div style={{display:"flex",gap:4}}>{["0","1","2"].map(s=><NoteBtn key={s} active={v===s} color={s==="0"?C.ok:s==="1"?C.warn:C.err} onClick={()=>setAdvS(p=>({...p,[`${advZ}-${item}`]:s}))}>{s}</NoteBtn>)}</div>
            </div>
          );})}
        </Card>
      </>}
      {history.length>0&&<Card>
        <SectionLabel>Historique du jour</SectionLabel>
        {history.map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<history.length-1?`1px solid ${C.b2}`:"none"}}>
          <div><span style={{fontSize:14,fontWeight:700,color:C.navy}}>Ch. {h.room}</span><span style={{fontSize:11,color:C.t3,marginLeft:8}}>{h.type} · {h.mode}</span></div>
          <Tag color={h.score>=80?C.ok:h.score>=50?C.warn:C.err}>{h.score}%</Tag>
        </div>)}
      </Card>}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  function ActionsPage(){
    const [fl,setFl]=useState("all");
    const fd=fl==="all"?actions:actions.filter(a=>a.status===fl);
    const cycle=i=>{const st=["todo","progress","done"],idx=actions.indexOf(fd[i]),n=[...actions];n[idx]={...n[idx],status:st[(st.indexOf(n[idx].status)+1)%3]};setActions(n);showToast("Statut mis à jour ✓");};
    const add=()=>setActions(p=>[...p,{cat:"Chambre",score:null,text:"",date:"",owner:"",status:"todo"}]);
    const upd=(i,k,v)=>{const idx=actions.indexOf(fd[i]),n=[...actions];n[idx]={...n[idx],[k]:v};setActions(n);};
    const sc={todo:{l:"À faire",c:C.err},progress:{l:"En cours",c:C.warn},done:{l:"Fait",c:C.ok}};
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Plan d'Action" sub="Actions correctives & améliorations" right={<Btn onClick={add} icon={Plus}>Action</Btn>}/>
      <Card style={{padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.t3,marginBottom:6}}><span>{actionsDone} / {actions.length} réalisées</span></div>
        <Progress value={actionsDone} max={actions.length||1} color={C.ok}/>
      </Card>
      <div style={{display:"flex",gap:6}}>{[["all","Toutes",actions.length],["todo","À faire",actionsUrgent],["progress","En cours",actions.filter(a=>a.status==="progress").length],["done","Fait",actionsDone]].map(([k,l,c])=><Pill key={k} active={fl===k} onClick={()=>setFl(k)} count={c}>{l}</Pill>)}</div>
      {fd.length===0&&<Empty icon={CheckCircle2} title="Aucune action" sub="Toutes les actions sont réalisées"/>}
      {fd.map((a,i)=>{const s=sc[a.status];return<Card key={i} style={{borderLeft:`${BL}px solid ${s.c}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Tag color={C.sand}>{a.cat}</Tag>{a.score&&<Tag color={C.err}>{a.score}</Tag>}</div>
          <Btn variant="secondary" onClick={()=>cycle(i)} style={{padding:"4px 12px",fontSize:11,borderColor:s.c,color:s.c}}>{s.l}</Btn>
        </div>
        <textarea value={a.text} onChange={e=>upd(i,"text",e.target.value)} placeholder="Description de l'action…"
          style={{width:"100%",minHeight:40,background:C.bg,border:`1px solid ${C.b1}`,borderRadius:10,padding:"10px 14px",color:C.t1,fontSize:13,fontFamily:ff,resize:"vertical",marginBottom:10,boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div><Label>Date</Label><DateInput value={a.date} onChange={v=>upd(i,"date",v)}/></div>
          <div><Label>Responsable</Label><Input value={a.owner} onChange={v=>upd(i,"owner",v)} placeholder="Initiales" style={{fontSize:12,padding:"8px 12px"}}/></div>
          <div><Label>Catégorie</Label><select value={a.cat} onChange={e=>upd(i,"cat",e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.b1}`,borderRadius:10,padding:"8px 12px",fontSize:12,fontFamily:ff}}>{["Chambre","Propreté","Équipement","Maintenance"].map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
      </Card>;})}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RITUELS
  // ═══════════════════════════════════════════════════════════════════════════
  function RitualsPage(){
    const [exp,setExp]=useState(null);
    const freqs=["Quotidien","Hebdo","Mensuel","Trimestriel","Biannuel","Bi-mensuel","Constant"];
    const grouped=freqs.map(f=>({f,items:RITUALS.filter(r=>r.freq===f)})).filter(g=>g.items.length>0);
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Rituels Qualité" sub={`${ritDone}/${RITUALS.length} réalisés cette semaine`}/>
      <Card style={{padding:14}}>
        <Progress value={ritDone} max={RITUALS.length} color={ritDone===RITUALS.length?C.ok:C.sand}/>
        <div style={{textAlign:"center",fontSize:12,color:C.t3,marginTop:8}}>{ritDone===RITUALS.length?<span style={{color:C.ok,fontWeight:700}}>Tous les rituels sont à jour</span>:`${RITUALS.length-ritDone} restant${RITUALS.length-ritDone>1?"s":""}`}</div>
      </Card>
      {grouped.map(g=><div key={g.f}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:4}}>
          <SectionLabel>{g.f}</SectionLabel><div style={{flex:1,height:1,background:C.b2}}/>
        </div>
        {g.items.map(item=>{const ck=ritCk[item.id],op=exp===item.id;const Icon=item.icon;return(
          <Card key={item.id} style={{padding:0,marginBottom:8,borderColor:ck?C.ok:C.b2,background:ck?C.okA:C.card,overflow:"hidden",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
              <div onClick={()=>setExp(op?null:item.id)} style={{display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer"}}>
                <div style={{width:36,height:36,borderRadius:10,background:ck?C.okB:C.bg,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}><Icon size={18} color={ck?C.ok:C.t3}/></div>
                <div><div style={{fontSize:14,fontWeight:600,color:ck?C.ok:C.t1}}>{item.label}</div><Tag color={C.t3}>{item.freq}</Tag></div>
              </div>
              <ChevronDown size={16} color={C.t3} style={{transition:"transform .2s",transform:op?"rotate(180deg)":"rotate(0)",cursor:"pointer"}} onClick={()=>setExp(op?null:item.id)}/>
              <div onClick={()=>toggleRit(item.id)} style={{width:26,height:26,borderRadius:8,border:`2px solid ${ck?C.ok:C.b1}`,background:ck?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .15s",flexShrink:0}}>
                {ck&&<CheckCircle2 size={16} color="#fff"/>}
              </div>
            </div>
            {op&&<div style={{padding:"0 16px 16px 64px",animation:"fadeIn .2s ease"}}>
              <div style={{fontSize:13,lineHeight:1.7,color:C.t2,background:C.bg,borderRadius:10,padding:"14px 16px",borderLeft:`${BL}px solid ${C.sand}`}}>{item.desc}</div>
            </div>}
          </Card>
        );})}
      </div>)}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  function TechPage(){
    const [tt,setTt]=useState("alerts"),[search,setSearch]=useState(""),[exR,setExR]=useState(null);
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Suivi Technique" sub="Maintenance préventive & corrective"/>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
        {[["alerts","Alertes",totalAlerts],["rooms","Chambres",lateR],["daily","Tickets",urgD],["suppliers","Fourn.",lateS]].map(([k,l,c])=>
          <Pill key={k} active={tt===k} onClick={()=>setTt(k)} count={c}>{l}</Pill>)}
      </div>

      {tt==="alerts"&&<>
        <Card style={{background:totalAlerts>0?`linear-gradient(135deg,#7C2D12,#991B1B)`:`linear-gradient(135deg,${C.navy},${C.navy2})`,border:"none",padding:24,textAlign:"center"}}>
          <div style={{fontSize:48,fontWeight:800,color:"#fff",lineHeight:1}}>{totalAlerts}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.7)",fontWeight:500,marginTop:4}}>alerte{totalAlerts!==1?"s":""} active{totalAlerts!==1?"s":""}</div>
        </Card>
        <Card style={{padding:0}}>
          <AlertRow icon={Zap} label="Urgences maintenance" count={urgD} color={C.err} onClick={()=>setTt("daily")}/>
          <AlertRow icon={FileText} label="Fournisseurs en retard" count={lateS} color={C.warn} onClick={()=>setTt("suppliers")}/>
          <AlertRow icon={BedDouble} label="Contrôle chambres > 3 mois" count={lateR} color={C.warn} onClick={()=>setTt("rooms")} last/>
        </Card>
      </>}

      {tt==="rooms"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <Input value={search} onChange={setSearch} placeholder="Rechercher une chambre…" icon={Search}/>
        {roomChecks.filter(r=>!search||String(r.room).includes(search)).map((r,i)=>{const late=isOld(r.date),open=exR===i,deg=Object.values(r.states).filter(s=>s==="DEGRADE"||s==="HS").length;return(
          <Card key={i} style={{padding:0,borderColor:late?`${C.err}40`:C.b2,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer"}} onClick={()=>setExR(open?null:i)}>
              <div style={{width:42,height:42,borderRadius:10,background:late?C.errA:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:late?C.err:C.navy}}>{r.room}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:4}}>{late&&<Tag color={C.err}>+3 mois</Tag>}{deg>0&&<Tag color={C.warn}>{deg} pt{deg>1?"s":""}</Tag>}{!late&&!deg&&r.date&&<Tag color={C.ok}>OK</Tag>}</div>
                <div style={{fontSize:11,color:C.t3,marginTop:2}}>{r.date?new Date(r.date).toLocaleDateString("fr-FR"):"Non contrôlé"}</div>
              </div>
              <ChevronDown size={16} color={C.t3} style={{transition:"transform .15s",transform:open?"rotate(180deg)":"rotate(0)"}}/>
            </div>
            {open&&<div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.b2}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.t3,margin:"12px 0 8px",textTransform:"uppercase",letterSpacing:.5}}>État équipements</div>
              {ROOM_EQ.map(eq=>{const v=r.states[eq]||"";return<div key={eq} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0"}}>
                <span style={{fontSize:13}}>{eq}</span>
                <div style={{display:"flex",gap:4}}>{ST.map(s=><NoteBtn key={s} active={v===s} color={stC(s)} onClick={()=>{const n=[...roomChecks];n[i]={...n[i],states:{...n[i].states,[eq]:s}};setRoomChecks(n);showToast(`${eq} → ${s}`);}}>{s}</NoteBtn>)}</div>
              </div>;})}
              <div style={{marginTop:10}}><Label>Date contrôle</Label><DateInput value={r.date} onChange={v=>{const n=[...roomChecks];n[i]={...n[i],date:v};setRoomChecks(n);}}/></div>
            </div>}
          </Card>
        );})}
      </div>}

      {tt==="daily"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <Btn onClick={()=>{setDailyMaint(p=>[{date:new Date().toISOString().split("T")[0],zone:"",equip:"",problem:"",priority:"Moyenne",status:"A faire",cost:""},...p]);showToast("Ticket créé");}} icon={Plus}>Ticket</Btn>
        {dailyMaint.map((t,i)=><Card key={i} style={{borderLeft:`${BL}px solid ${prC(t.priority)}`,opacity:t.status==="Terminé"?.55:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",gap:6}}><Tag color={prC(t.priority)}>{t.priority}</Tag><Tag color={t.status==="Terminé"?C.ok:C.warn}>{t.status}</Tag></div>
            {t.cost&&<span style={{fontSize:13,fontWeight:700,color:C.navy}}>{t.cost} €</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><Label>Zone</Label><Input value={t.zone} onChange={v=>{const n=[...dailyMaint];n[i].zone=v;setDailyMaint(n);}} placeholder="Ch. 102…" icon={Building2}/></div>
            <div><Label>Équipement</Label><Input value={t.equip} onChange={v=>{const n=[...dailyMaint];n[i].equip=v;setDailyMaint(n);}} placeholder="Douche…" icon={Wrench}/></div>
          </div>
          <Label>Problème</Label>
          <Input value={t.problem} onChange={v=>{const n=[...dailyMaint];n[i].problem=v;setDailyMaint(n);}} placeholder="Problème constaté…"/>
        </Card>)}
      </div>}

      {tt==="suppliers"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {suppliers.map((s,i)=>{const late=isLate(s.date,s.freq);return<Card key={i} style={{borderLeft:`${BL}px solid ${late?C.err:s.date?C.ok:C.t3}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{s.equip}</div>
            <Tag color={late?C.err:C.ok}>{late?(s.date?"RETARD":"À saisir"):"OK"}</Tag>
          </div>
          <div style={{fontSize:12,color:C.t3,marginTop:4}}>{s.date?new Date(s.date).toLocaleDateString("fr-FR"):"—"} · {s.freq}</div>
        </Card>;})}
      </div>}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE (sous-page Hub)
  // ═══════════════════════════════════════════════════════════════════════════
  function PerfPage(){
    const m=monthly[selMonth],upd=(k,v)=>{const n=[...monthly];n[selMonth]={...n[selMonth],[k]:v};setMonthly(n);};
    const diff=m.rps&&m.rpsN1?(parseFloat(m.rps)-parseFloat(m.rpsN1)).toFixed(1):null;
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Performance" sub="Données TrustYou mensuelles"/>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>{MO.map((mo,i)=>{const has=!!monthly[i].rps;return<Pill key={i} active={selMonth===i} onClick={()=>setSelMonth(i)} color={has?C.navy:undefined}>{mo}{has&&<div style={{width:5,height:5,borderRadius:3,background:selMonth===i?"#fff":C.ok,marginLeft:2}}/>}</Pill>;})}</div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:C.navy}}>Score de réputation</div>
          {diff!==null&&<Tag color={diff>0?C.ok:diff<0?C.err:C.t3} bg={diff>0?C.okB:diff<0?C.errB:C.warm}>{diff>0?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {Math.abs(diff)} pts</Tag>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <div><Label>RPS</Label><Input value={m.rps} onChange={v=>upd("rps",v)} placeholder="—" style={{fontSize:20,fontWeight:800,textAlign:"center",padding:"8px"}}/></div>
          <div><Label>N-1</Label><Input value={m.rpsN1} onChange={v=>upd("rpsN1",v)} placeholder="—" style={{textAlign:"center"}}/></div>
          <div><Label>CompIndex</Label><Input value={m.compIndex} onChange={v=>upd("compIndex",v)} placeholder="—" style={{textAlign:"center"}}/></div>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:10}}>Avis clients</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><Label>Nombre</Label><Input value={m.nbAvis} onChange={v=>upd("nbAvis",v)} placeholder="—"/></div>
          <div><Label>Taux réponse</Label><Input value={m.tauxReponse} onChange={v=>upd("tauxReponse",v)} placeholder="%"/>{m.tauxReponse&&<div style={{marginTop:4}}><Progress value={parseFloat(m.tauxReponse)||0} color={parseFloat(m.tauxReponse)>=100?C.ok:C.warn} h={3}/></div>}</div>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:C.err,marginBottom:10}}>Impacts négatifs</div>
        {[1,2,3].map(n=><div key={n} style={{marginBottom:8}}><Input value={m[`neg${n}`]} onChange={v=>upd(`neg${n}`,v)} placeholder={`Impact négatif ${n}`}/></div>)}
        <div style={{fontSize:14,fontWeight:700,color:C.ok,marginTop:16,marginBottom:10}}>Impacts positifs</div>
        {[1,2,3].map(n=><div key={n} style={{marginBottom:8}}><Input value={m[`pos${n}`]} onChange={v=>upd(`pos${n}`,v)} placeholder={`Impact positif ${n}`}/></div>)}
      </Card>
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAYBOOK (sous-page Hub)
  // ═══════════════════════════════════════════════════════════════════════════
  function PlaybookPage(){
    const [st,setSt]=useState("events"),[showF,setShowF]=useState(false),[ne,setNe]=useState(""),[ne2,setNe2]=useState(""),[sT,setST]=useState("summer");
    const now=new Date().getMonth();
    const allEv=[...EVENTS,...customEvents];
    const efC={low:{l:"Facile",c:C.ok},med:{l:"Moyen",c:C.warn},high:{l:"Invest.",c:C.err}};
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Playbook" sub="Animations, saisons & boosters" right={<Btn variant={showF?"secondary":"primary"} onClick={()=>{setShowF(!showF);setNe("");}}>{showF?"Annuler":"+ Proposer"}</Btn>}/>
      <div style={{display:"flex",gap:6}}>{[["events","Animations"],["seasons","Saisons"],["boost","Booster"]].map(([k,l])=><Pill key={k} active={st===k} onClick={()=>{setSt(k);setShowF(false);}}>{l}</Pill>)}</div>

      {showF&&<Card style={{border:`2px solid ${C.sand}`,background:C.sandA}}>
        <div style={{fontSize:13,fontWeight:700,color:C.sand,marginBottom:10}}>Proposer</div>
        <Input value={ne} onChange={setNe} placeholder={st==="events"?"Événement":st==="seasons"?"Action saisonnière":"Idée booster"}/>
        {st==="events"&&<div style={{marginTop:8}}><Input value={ne2} onChange={setNe2} placeholder="Animation associée (optionnel)"/></div>}
        {st==="seasons"&&<div style={{display:"flex",gap:6,marginTop:8}}>{[["summer","Été"],["winter","Hiver"],["allYear","Toute l'année"]].map(([k,l])=><Pill key={k} active={sT===k} onClick={()=>setST(k)} color={C.sand}>{l}</Pill>)}</div>}
        <Btn onClick={()=>{if(!ne.trim())return;if(st==="events")setCustomEvents(p=>[...p,{m:0,d:0,n:ne,t:"custom",tip:ne2||"Proposition"}]);else if(st==="seasons")setCustomSeasons(p=>({...p,[sT]:[...p[sT],ne]}));else setCustomBoosts(p=>[...p,{t:ne,e:"med"}]);setNe("");setNe2("");setShowF(false);showToast("Ajouté ✓");}} disabled={!ne.trim()} style={{width:"100%",marginTop:10}}>Ajouter</Btn>
      </Card>}

      {st==="events"&&allEv.map((e,i)=>{const past=e.t!=="custom"&&e.m<now;return<Card key={i} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:past?.5:1,borderLeft:e.m===now?`${BL}px solid ${C.sand}`:e.t==="custom"?`${BL}px solid ${C.info}`:"none"}}>
        <Calendar size={18} color={e.t==="custom"?C.info:e.m===now?C.sand:C.t3}/>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{e.n}{e.t==="custom"&&<Tag color={C.info}> Proposition</Tag>}</div><div style={{fontSize:11,color:C.t3}}>{e.tip}</div></div>
        {e.t!=="custom"&&<Tag color={C.t3}>{e.d}/{e.m+1}</Tag>}
      </Card>;})}

      {st==="seasons"&&[["summer","Été",PLAYBOOKS.summer],["winter","Hiver",PLAYBOOKS.winter],["allYear","Toute l'année",PLAYBOOKS.allYear]].map(([k,t,items])=>{const all=[...items,...customSeasons[k]];return<Card key={k}><div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:10}}>{k==="summer"?"☀️":k==="winter"?"❄️":"🔄"} {t}</div>{all.map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<all.length-1?`1px solid ${C.b2}`:"none"}}><div style={{width:5,height:5,borderRadius:3,background:i>=items.length?C.sand:C.navy}}/><span style={{fontSize:13}}>{item}{i>=items.length&&<span style={{fontSize:9,color:C.sand,fontWeight:700,marginLeft:6}}>NOUVEAU</span>}</span></div>)}</Card>;})}

      {st==="boost"&&<>{[...BOOSTS,...customBoosts].map((b,i)=>{const ef=efC[b.e];return<Card key={i} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderLeft:i>=BOOSTS.length?`${BL}px solid ${C.info}`:"none"}}><div style={{flex:1,fontSize:13}}>{b.t}{i>=BOOSTS.length&&<div style={{fontSize:9,color:C.info,fontWeight:700,marginTop:2}}>PROPOSITION</div>}</div><Tag color={ef.c}>{ef.l}</Tag></Card>;})
        }<Card style={{background:C.errA,borderColor:`${C.err}20`}}><div style={{display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={16} color={C.err}/><div><div style={{fontSize:13,fontWeight:700,color:C.err}}>Vigilance</div><div style={{fontSize:12,color:C.err}}>Ne pas mentionner l'offre contre commentaire</div></div></div></Card>
      </>}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT GLOBAL (sous-page Hub)
  // ═══════════════════════════════════════════════════════════════════════════
  function AuditPage(){
    const [zone,setZone]=useState(AUDIT_Z[0].id);
    const az=AUDIT_Z.find(z=>z.id===zone);
    const NOTES=["1","2","3","4"],nC=n=>n==="1"?C.err:n==="2"?C.warn:n==="3"?C.ok:C.teal,nL=["Non conforme","Acceptable","Conforme","Excellent"];
    const scored=Object.keys(auditScores).length;
    const avg=scored?Math.round((Object.values(auditScores).reduce((s,v)=>s+parseInt(v),0)/scored)*25):0;
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Audit Global Hôtel" sub="Vision client · Trimestriel"/>
      <Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div><Label>Date de l'audit</Label><DateInput value={auditMeta.date} onChange={v=>setAuditMeta(p=>({...p,date:v}))}/></div>
          <div><Label>Auditeur</Label><Input value={auditMeta.auditor} onChange={v=>setAuditMeta(p=>({...p,auditor:v}))} placeholder="Nom" icon={Users}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <KPI label="Score" value={`${avg}%`} color={avg>=75?C.ok:avg>=50?C.warn:C.err}/>
          <KPI label="Audités" value={scored} color={C.navy}/>
          <KPI label="Total" value={AUDIT_Z.reduce((s,z)=>s+z.items.length,0)} color={C.t3}/>
        </div>
      </Card>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
        {AUDIT_Z.map(z=>{const Icon=z.ic;const done=z.items.filter(it=>auditScores[`${z.id}-${it}`]).length;return<Pill key={z.id} active={zone===z.id} onClick={()=>setZone(z.id)} count={`${done}/${z.items.length}`}><Icon size={14}/></Pill>;})}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>{NOTES.map((n,i)=><div key={n} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:nC(n)}}/><span style={{fontSize:10,color:C.t3}}>{n} {nL[i]}</span></div>)}</div>
      <Card style={{padding:0}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.b2}`,background:C.bg,borderRadius:`${RAD}px ${RAD}px 0 0`}}>
          {(()=>{const Icon=az.ic;return<div style={{display:"flex",alignItems:"center",gap:8}}><Icon size={18} color={C.navy}/><span style={{fontSize:14,fontWeight:700,color:C.navy}}>{az.n}</span></div>;})()}
        </div>
        {az.items.map((item,i)=>{const k=`${zone}-${item}`,v=auditScores[k]||"",cmt=auditComments[k]||"";return(
          <div key={i} style={{borderBottom:i<az.items.length-1?`1px solid ${C.b2}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px"}}>
              <span style={{fontSize:13,flex:1,color:v?C.t1:C.t2}}>{item}</span>
              <div style={{display:"flex",gap:4}}>{NOTES.map(n=><NoteBtn key={n} active={v===n} color={nC(n)} onClick={()=>{setAuditScores(p=>({...p,[k]:n}));showToast(`${item} → ${nL[parseInt(n)-1]}`);}}>{n}</NoteBtn>)}</div>
            </div>
            {v&&<div style={{padding:"0 16px 10px"}}><input value={cmt} onChange={e=>setAuditComments(p=>({...p,[k]:e.target.value}))} placeholder="Commentaire (optionnel)" style={{width:"100%",background:C.bg,border:`1px solid ${C.b2}`,borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:ff,color:C.t2,boxSizing:"border-box"}}/></div>}
          </div>
        );})}
      </Card>
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMISSION SÉCURITÉ (sous-page Hub)
  // ═══════════════════════════════════════════════════════════════════════════
  function SafetyPage(){
    const [cat,setCat]=useState(SAFETY[0].id);
    const ac=SAFETY.find(c=>c.id===cat);
    const totalI=SAFETY.reduce((s,c)=>s+c.items.length,0);
    const filledI=Object.values(safetyData).filter(v=>v.date).length;
    const lateI=Object.entries(safetyData).filter(([,v])=>v.date&&isLate(v.date,v.freq)).length;
    return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Section title="Commission de Sécurité" sub="Registre & suivi réglementaire"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <KPI label="Équipements" value={totalI} color={C.navy} icon={ShieldCheck}/>
        <KPI label="À jour" value={filledI-lateI} color={C.ok} icon={CheckCircle2}/>
        <KPI label="En retard" value={lateI} color={lateI>0?C.err:C.ok} icon={AlertTriangle}/>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>{SAFETY.map(c=><Pill key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} count={c.items.length}>{c.n}</Pill>)}</div>
      {ac.items.length===0?<Empty icon={FileText} title="Registre des observations" sub="Prescriptions, réserves, actions correctives — Phase 2"/>
      :<div style={{display:"flex",flexDirection:"column",gap:8}}>{ac.items.map((item,i)=>{const key=`${cat}-${item.l}`,data=safetyData[key]||{date:"",freq:item.f},late=data.date?isLate(data.date,data.freq):false,missing=!data.date;return(
        <Card key={i} style={{borderLeft:`${BL}px solid ${late?C.err:missing?C.warn:C.ok}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{item.l}</div>
            <Tag color={late?C.err:missing?C.warn:C.ok}>{late?"RETARD":missing?"À saisir":"OK"}</Tag>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><Label>Dernier contrôle</Label><DateInput value={data.date||""} late={late} onChange={v=>{setSafetyData(p=>({...p,[key]:{...data,date:v}}));showToast("Date enregistrée ✓");}}/></div>
            <div><Label>Fréquence</Label><div style={{padding:"10px 12px",fontSize:13,color:C.t2,background:C.bg,borderRadius:10,border:`1px solid ${C.b1}`}}>{data.freq}</div></div>
          </div>
        </Card>
      );})}
      </div>}
    </div>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  const pages={hub:HubPage,perf:PerfPage,actions:ActionsPage,rituals:RitualsPage,tech:TechPage,chambres:ChambresPage,playbook:PlaybookPage,audit:AuditPage,safety:SafetyPage};
  const Page=pages[tab];
  const isSubPage=!NAV.find(n=>n.id===tab);

  return(<div style={{fontFamily:ff,background:C.bg,color:C.t1,minHeight:"100vh",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{display:none}`}</style>

    {isSubPage&&<div style={{padding:"14px 16px 0",display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>go("hub")}>
      <ChevronLeft size={20} color={C.navy}/><span style={{fontSize:14,fontWeight:700,color:C.navy}}>Hub</span>
    </div>}

    <div style={{flex:1,padding:"14px 16px 90px"}}><Page/></div>
    <Toast msg={toast} show={!!toast}/>

    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.card,borderTop:`1px solid ${C.b2}`,display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom,8px)",boxShadow:"0 -4px 20px rgba(27,42,74,0.08)",zIndex:100}}>
      {NAV.map(n=>{const Icon=n.icon;const active=tab===n.id;return(
        <button key={n.id} onClick={()=>go(n.id)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 12px",cursor:"pointer",position:"relative"}}>
          <Icon size={20} color={active?C.sand:C.t3} strokeWidth={active?2.5:1.8}/>
          <span style={{fontSize:9,fontWeight:active?700:500,color:active?C.sand:C.t3,letterSpacing:.3}}>{n.label}</span>
          {active&&<div style={{position:"absolute",top:-1,width:20,height:3,borderRadius:2,background:C.sand}}/>}
        </button>
      );})}
    </div>
  </div>);
}
