import React, { useEffect, useMemo, useState } from "react";

/* ---------- Utils ---------- */
const cls = (...arr) => arr.filter(Boolean).join(" ");
const todayKey = () => new Date().toISOString().slice(0, 10);
const parseIntSafe = (v, def=0) => { const n=parseInt(v,10); return isNaN(n)?def:n; };

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : (typeof initial==="function"?initial():initial); }
    catch { return typeof initial==="function"?initial():initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(state)); }catch{} },[key,state]);
  return [state, setState];
}

/* ---------- UI ---------- */
const Card = ({ className, children }) => (<div className={cls("rounded-2xl shadow-md p-4 md:p-6 bg-white", className)}>{children}</div>);
const H2 = ({ children }) => (<h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">{children}</h2>);
const Label = ({ children }) => (<label className="text-sm font-medium text-gray-700">{children}</label>);
const Input = ({ className = "", ...props }) => (<input {...props} className={cls("w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring", className)} />);
const Button = ({ className = "", ...props }) => (<button {...props} className={cls("px-3 py-2 rounded-xl border bg-gray-50 hover:bg-gray-100 active:scale-[.98] transition", className)} />);

/* ---------- App ---------- */
const tabs = ["Dashboard","Hydratation","Musculation","Nutrition","Sommeil","Notes"];

export default function App(){
  const [tab, setTab] = useLocalState("app.tab", "Dashboard");
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-black text-white grid place-items-center font-bold">∆</div>
            <div className="font-semibold">Self-Discipline</div>
          </div>
          <div className="hidden md:flex gap-2">
            {tabs.map(t => <Button key={t} onClick={()=>setTab(t)} className={cls(tab===t && "bg-black text-white border-black")}>{t}</Button>)}
          </div>
          <div className="md:hidden">
            <select value={tab} onChange={e=>setTab(e.target.value)} className="border rounded-xl px-3 py-2">
              {tabs.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6">
        {tab==="Dashboard" && <Dashboard/>}
        {tab==="Hydratation" && <Hydration/>}
        {tab==="Musculation" && <Musculation/>}
        {tab==="Nutrition" && <Nutrition/>}
        {tab==="Sommeil" && <Sleep/>}
        {tab==="Notes" && <Notes/>}
      </main>
      <footer className="py-8 text-center text-xs text-gray-500">PWA hors ligne • Données locales • v5</footer>
    </div>
  );
}

/* ---------- Hydratation ---------- */
function Hydration(){
  const [goalMl, setGoalMl] = useLocalState("hydr.goal", 2500);
  const [logsByDay, setLogsByDay] = useLocalState("hydr.logs", {});
  const day = todayKey();
  const ml = logsByDay[day]?.ml ?? 0;
  const pct = Math.min(100, Math.round((ml / (goalMl || 1)) * 100));
  function update(value){ setLogsByDay(prev => ({...prev, [day]: { ml: value }})); }
  return (
    <Card>
      <H2>Hydratation</H2>
      <div className="grid gap-3">
        <div><Label>Objectif (mL)</Label><Input type="number" min={500} step={100} value={goalMl} onChange={e=>setGoalMl(parseIntSafe(e.target.value, 0))}/></div>
        <div>
          <Label>Quantité bue aujourd’hui : {ml} mL</Label>
          <input type="range" min="0" max={goalMl} step="50" value={ml} onChange={e=>update(parseIntSafe(e.target.value,0))} className="w-full accent-black" />
          <div className="mt-2 flex justify-between text-sm"><span>0</span><span>{goalMl} mL</span></div>
          <div className="mt-3 w-full h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-black" style={{width: pct+"%"}} /></div>
          <p className="mt-2 text-sm text-gray-600 text-right">{pct}% atteint</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Musculation ---------- */
const EXERCISES = [
  { id:"back-squat", name:"Back Squat", equipment:"Barre", muscles:["Quadriceps","Fessiers","Ischios","Tronc"],
    cues:["Pieds largeur épaules","Genoux suivent orteils","Dos neutre","Descendre sous parallèle si possible"],
    mistakes:["Dos arrondi","Genoux qui rentrent","Talons qui décollent"],
    programming:"3–5 x 3–8 (force) ou 8–12 (hypertrophie)",
    sources:["NSCA – Essentials of Strength Training (4e éd.)","ACSM’s Guidelines (11e éd.)"] },
  { id:"bench-press", name:"Développé couché", equipment:"Barre", muscles:["Pectoraux","Triceps","Épaules ant."],
    cues:["Omoplates serrées","Descente contrôlée","Coudes ~45°"], mistakes:["Fesses qui décollent","Trajectoire instable"],
    programming:"3–5 x 3–8 (force) ou 8–12", sources:["NSCA – Essentials","ACSM’s Guidelines"] },
  { id:"deadlift", name:"Soulevé de terre", equipment:"Barre", muscles:["Chaîne post.","Dos","Tronc"],
    cues:["Barre proche tibias","Hanches en arrière","Pousse le sol"], mistakes:["Dos rond","Barre qui s’éloigne"],
    programming:"2–5 x 2–6 (force) ou 6–10", sources:["McGill – Low Back Disorders","NSCA – Essentials"] },
  { id:"ohp", name:"Développé militaire", equipment:"Barre/Haltères", muscles:["Épaules","Triceps","Haut du dos","Tronc"],
    cues:["Gainage fort","Trajectoire proche du visage","Tête sous la barre en haut"], mistakes:["Cambrure excessive"],
    programming:"3–4 x 5–10", sources:["NSCA – Resistance Training Technique","ACSM’s Guidelines"] },
  { id:"pull-up", name:"Tractions", equipment:"Barre de traction", muscles:["Grand dorsal","Biceps","Scapulas","Tronc"],
    cues:["Épaules basses","Tire coudes vers hanches"], mistakes:["Balancement","Amplitude incomplète"],
    programming:"3–5 x 4–10 (ajoute charge si facile)", sources:["NSCA – Basics of S&C","ACSM’s Guidelines"] },
  { id:"row", name:"Rowing barre/haltères", equipment:"Barre/Haltères", muscles:["Dos","Biceps","Arrière d’épaule"],
    cues:["Dos neutre","Tire coudes près du corps"], mistakes:["Dos qui s’arrondit","Élan"], programming:"3–4 x 6–12",
    sources:["NSCA – Essentials","ACSM’s Guidelines"] },
  { id:"leg-press", name:"Presse à cuisses", equipment:"Machine", muscles:["Quadriceps","Fessiers","Ischios"],
    cues:["Pieds au milieu","Bas du dos collé","Genoux suivent orteils"], mistakes:["Amplitude mal gérée"],
    programming:"3–4 x 8–15", sources:["NSCA – Exercise Technique Manual"] },
  { id:"curl", name:"Curl biceps", equipment:"Haltères/Barre/Câble", muscles:["Biceps","Brachial","Brachioradial"],
    cues:["Coudes serrés","Élan minimal","Descente contrôlée"], mistakes:["Balancement","Coudes qui avancent"],
    programming:"2–4 x 8–15", sources:["NSCA – Exercise Technique Manual"] },
  { id:"triceps-pushdown", name:"Extension triceps à la poulie", equipment:"Machine (poulie)", muscles:["Triceps"],
    cues:["Coudes serrés","Poignets neutres","Contrôle à la remontée"], mistakes:["Coudes qui s’écartent"],
    programming:"2–4 x 8–15", sources:["NSCA – Exercise Technique Manual"] },
  { id:"plank", name:"Gainage (planche)", equipment:"Poids du corps", muscles:["Tronc","Épaules"],
    cues:["Alignement tête-épaules-bassin","Légère rétroversion","Respire"], mistakes:["Bassin qui tombe"],
    programming:"3–5 x 20–60 s", sources:["McGill – Ultimate Back Fitness","ACSM’s Guidelines"] },
];
const ALL_MUSCLES = Array.from(new Set(EXERCISES.flatMap(e => e.muscles))).sort();
const ALL_EQUIP = Array.from(new Set(EXERCISES.map(e => e.equipment))).sort();

function Musculation(){
  const [sessions, setSessions] = useLocalState("muscu.sessions", []);
  const [activeSessionId, setActiveSessionId] = useLocalState("muscu.activeSessionId", "");
  const [sessionNameDraft, setSessionNameDraft] = useState("");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equip, setEquip] = useState("");
  const [restTimers, setRestTimers] = useState({});
  const [banner, setBanner] = useState("");
  useEffect(()=>{ if(!banner) return; const t=setTimeout(()=>setBanner(""),3000); return ()=>clearTimeout(t); },[banner]);

  function createSession(){ const name=sessionNameDraft.trim()||`Séance ${sessions.length+1}`; const id=Math.random().toString(36).slice(2);
    setSessions([...sessions,{id,name,exercises:[]}]); setActiveSessionId(id); setSessionNameDraft(""); }
  function renameSession(id,name){ setSessions(sessions.map(s=>s.id===id?{...s,name}:s)); }
  function duplicateSession(id){ const s=sessions.find(x=>x.id===id); if(!s) return; const nid=Math.random().toString(36).slice(2);
    setSessions([...sessions,{id:nid,name:s.name+" (copie)",exercises:[...s.exercises]}]); setActiveSessionId(nid); setBanner("Séance dupliquée."); }
  function addExerciseToSession(exId,sid=activeSessionId){ if(sessions.length===0) return setBanner("Crée d’abord une séance.");
    if(!sid) return setBanner("Sélectionne une séance."); setSessions(sessions.map(s=>{ if(s.id!==sid) return s; if(s.exercises.includes(exId)) return s; return {...s,exercises:[...s.exercises,exId]}; })); setBanner("Exercice ajouté."); }
  function removeExerciseFromSession(exId,sid){ setSessions(sessions.map(s=> s.id===sid?{...s,exercises:s.exercises.filter(id=>id!==exId)}:s)); }
  function moveExercise(sid,index,dir){ setSessions(sessions.map(s=>{ if(s.id!==sid) return s; const arr=[...s.exercises]; const j=index+dir; if(j<0||j>=arr.length) return s; [arr[index],arr[j]]=[arr[j],arr[index]]; return {...s,exercises:arr}; })); }
  function startRest(exId,sec=60){ setRestTimers(prev=>({...prev,[exId]:sec})); }
  useEffect(()=>{ const any=Object.values(restTimers).some(v=>v>0); if(!any) return; const t=setInterval(()=>{ setRestTimers(prev=>{ const next={...prev}; Object.keys(next).forEach(k=>{ if(next[k]>0) next[k]-=1; }); return next; }); },1000); return ()=>clearInterval(t); },[restTimers]);

  const filtered = EXERCISES.filter(e=>{ const q=query.trim().toLowerCase();
    const mq=!q || e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q) || e.muscles.some(m=>m.toLowerCase().includes(q));
    const mm=!muscle || e.muscles.includes(muscle); const me=!equip || e.equipment===equip; return mq && mm && me; });
  function randomExercise(){ const pool=filtered.length?filtered:EXERCISES; const ex=pool[Math.floor(Math.random()*pool.length)]; setSelected(ex); setView("detail"); }
  const activeSession = sessions.find(s=>s.id===activeSessionId)||null;

  return (
    <Card>
      <H2>Musculation</H2>
      {banner && <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm">{banner}</div>}
      <div className="grid gap-2 mb-4">
        <div className="flex gap-2">
          <Input placeholder="Nom de la séance (ex. Push, Full, Legs...)" value={sessionNameDraft} onChange={e=>setSessionNameDraft(e.target.value)} />
          <Button onClick={createSession} className="bg-black text-white border-black">Créer une séance</Button>
          {activeSession && <Button onClick={()=>duplicateSession(activeSession.id)}>Dupliquer</Button>}
        </div>
        {sessions.length>0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Séances :</span>
            {sessions.map(s=>(
              <div key={s.id} className="flex items-center gap-2 border rounded-xl px-3 py-2">
                <input type="radio" name="activeSession" checked={activeSessionId===s.id} onChange={()=>setActiveSessionId(s.id)} />
                <input className="text-sm border rounded px-2 py-1" value={s.name} onChange={e=>renameSession(s.id,e.target.value)} />
                <span className="text-xs text-gray-500">{s.exercises.length} exos</span>
              </div>
            ))}
          </div>
        )}
        {activeSession && activeSession.exercises.length>0 && (
          <div className="rounded-xl bg-gray-50 border px-3 py-2">
            <div className="text-sm font-medium mb-2">Exos dans « {activeSession.name} »</div>
            <div className="grid gap-2">
              {activeSession.exercises.map((id,idx)=>{
                const e=EXERCISES.find(x=>x.id===id); if(!e) return null; const rest=restTimers[id]||0;
                return (
                  <div key={id} className="flex flex-wrap items-center gap-2 border rounded-xl px-2 py-2">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-xs text-gray-500">• {e.equipment} • {e.muscles.join(", ")}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button onClick={()=>moveExercise(activeSession.id, idx, -1)}>↑</Button>
                      <Button onClick={()=>moveExercise(activeSession.id, idx, +1)}>↓</Button>
                      {rest>0 ? <span className="text-sm">Repos: {rest}s</span> : (<><Button onClick={()=>startRest(id,60)}>60s</Button><Button onClick={()=>startRest(id,90)}>90s</Button></>)}
                      <Button className="text-red-600 border-red-400" onClick={()=>removeExerciseFromSession(id, activeSession.id)}>Retirer</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {view==="list" && (<>
        <div className="grid md:flex gap-2 mb-3">
          <Input placeholder="Rechercher (nom, muscle, matériel)..." value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="border rounded-xl px-3 py-2" value={muscle} onChange={e=>setMuscle(e.target.value)}>
            <option value="">Muscle : tous</option>{ALL_MUSCLES.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={equip} onChange={e=>setEquip(e.target.value)}>
            <option value="">Matériel : tous</option>{ALL_EQUIP.map(eq=><option key={eq} value={eq}>{eq}</option>)}
          </select>
          <Button onClick={randomExercise}>Exercice au hasard 🎲</Button>
        </div>
        <div className="grid gap-2 max-h-[48vh] overflow-auto pr-2">
          {EXERCISES.filter(e=>{ const q=query.trim().toLowerCase(); const mq=!q||e.name.toLowerCase().includes(q)||e.equipment.toLowerCase().includes(q)||e.muscles.some(m=>m.toLowerCase().includes(q)); const mm=!muscle||e.muscles.includes(muscle); const me=!equip||e.equipment===equip; return mq&&mm&&me; }).map(ex=>(
            <div key={ex.id} className="border rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div><div className="font-medium">{ex.name}</div><div className="text-xs text-gray-500">{ex.equipment} • {ex.muscles.join(", ")}</div></div>
                <div className="flex gap-2">
                  <Button onClick={()=>{setSelected(ex); setView("detail");}}>Détails</Button>
                  <Button className="bg-black text-white border-black" onClick={()=>addExerciseToSession(ex.id)}>Ajouter à la séance</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>)}
      {view==="detail" && selected && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between"><div className="text-lg font-semibold">{selected.name}</div><Button onClick={()=>setView("list")}>← Retour</Button></div>
          <div className="text-sm text-gray-600">Matériel : {selected.equipment} • Muscles : {selected.muscles.join(", ")}</div>
          <div className="rounded-xl border p-3"><div className="font-medium mb-1">Conseils pro (cues)</div><ul className="list-disc pl-5 text-sm space-y-1">{selected.cues.map((c,i)=><li key={i}>{c}</li>)}</ul></div>
          <div className="rounded-xl border p-3"><div className="font-medium mb-1">Erreurs fréquentes</div><ul className="list-disc pl-5 text-sm space-y-1">{selected.mistakes.map((c,i)=><li key={i}>{c}</li>)}</ul></div>
          <div className="rounded-xl border p-3"><div className="font-medium mb-1">Programmation</div><div className="text-sm">{selected.programming}</div></div>
          <div className="rounded-xl border p-3"><div className="font-medium mb-1">Sources (références vérifiables)</div><ul className="list-disc pl-5 text-sm space-y-1">{selected.sources.map((s,i)=><li key={i}>{s}</li>)}</ul><div className="text-xs text-gray-500 mt-1">* Références textuelles, pas de liens cliquables.</div></div>
          <div className="flex gap-2">{sessions.length>0?(<><select className="border rounded-xl px-3 py-2" value={activeSessionId} onChange={e=>setActiveSessionId(e.target.value)}><option value="">Choisir une séance…</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><Button className="bg-black text-white border-black" onClick={()=>addExerciseToSession(selected.id, activeSessionId)}>Ajouter à la séance</Button></>):(<Button onClick={()=>setBanner("Crée d’abord une séance pour y ajouter cet exercice.")}>Crée d’abord une séance</Button>)}</div>
        </div>
      )}
    </Card>
  );
}

/* ---------- Nutrition ---------- */
function Nutrition(){
  const [profile, setProfile] = useLocalState("nut.profile", { age:25, sex:"H", height:175, weight:70, unit:"metric", activity:"moderate", goal:"maintain", deltaPerWeekKg:0.0, proteinPerKg:2.0, fatPerKg:0.8 });
  const [goalCals, macros] = useMemo(()=>{
    const w=profile.weight, h=profile.height, a=profile.age, s=profile.sex==="F"?-161:5;
    const bmr=10*w+6.25*h-5*a+s;
    const map={sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9};
    const tdee=bmr*(map[profile.activity]||1.55);
    let target=tdee;
    if(profile.goal==="cut") target-=Math.min(700, Math.max(200, Math.abs(profile.deltaPerWeekKg||0)*7000/7));
    if(profile.goal==="bulk") target+=Math.min(700, Math.max(200, Math.abs(profile.deltaPerWeekKg||0)*7000/7));
    const protein=Math.round(profile.proteinPerKg*w), fat=Math.round(profile.fatPerKg*w);
    const calPF=protein*4+fat*9; const carbs=Math.max(0, Math.round((target-calPF)/4));
    return [Math.round(target), {protein, carbs, fat}];
  },[profile]);
  const [foods, setFoods] = useLocalState("nut.foods", [
    { id:"riz", name:"Riz blanc cuit", per100:{ kcal:130, p:2.4, c:28, f:0.3 } },
    { id:"poulet", name:"Poulet (blanc)", per100:{ kcal:165, p:31, c:0, f:3.6 } },
    { id:"oeuf", name:"Œuf", per100:{ kcal:143, p:13, c:1.1, f:10.3 } },
    { id:"avoine", name:"Flocons d’avoine", per100:{ kcal:389, p:16.9, c:66, f:6.9 } },
    { id:"banane", name:"Banane", per100:{ kcal:89, p:1.1, c:23, f:0.3 } },
    { id:"brocoli", name:"Brocoli", per100:{ kcal:34, p:2.8, c:7, f:0.4 } },
    { id:"huile-olive", name:"Huile d’olive", per100:{ kcal:884, p:0, c:0, f:100 } },
    { id:"pates", name:"Pâtes cuites", per100:{ kcal:157, p:5.8, c:30, f:0.9 } },
    { id:"thon", name:"Thon au naturel", per100:{ kcal:132, p:29, c:0, f:1 } },
  ]);
  const [foodDraft, setFoodDraft] = useState({ name:"", kcal:"", p:"", c:"", f:"" });
  const [recipes, setRecipes] = useLocalState("nut.recipes", []);
  const [recipeDraft, setRecipeDraft] = useState({ name:"", servings:1 });
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [dayLog, setDayLog] = useLocalState("nut.daylog", {});
  const day = todayKey(); if(!dayLog[day]) dayLog[day]={ meals:{ breakfast:[], lunch:[], dinner:[], snacks:[] } };

  function setProfileField(k,v){ setProfile(prev=>({...prev,[k]:v})); }
  function addPersonalFood(){ const name=foodDraft.name.trim(); const kcal=parseIntSafe(foodDraft.kcal), p=parseIntSafe(foodDraft.p), c=parseIntSafe(foodDraft.c), f=parseIntSafe(foodDraft.f);
    if(!name||!kcal) return; const id=name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+Math.random().toString(36).slice(2); setFoods([...foods,{id,name,per100:{kcal,p,c,f}}]); setFoodDraft({name:"",kcal:"",p:"",c:"",f:""}); }
  function caloriesOf(item){ const food=foods.find(f=>f.id===item.foodId); if(!food) return {k:0,p:0,c:0,f:0}; const ratio=(item.grams||0)/100; return { k:Math.round(food.per100.kcal*ratio), p:Math.round(food.per100.p*ratio), c:Math.round(food.per100.c*ratio), f:Math.round(food.per100.f*ratio) }; }
  function createRecipe(){ const name=recipeDraft.name.trim(); const servings=parseIntSafe(recipeDraft.servings,1); if(!name||!servings) return; const id="r-"+Math.random().toString(36).slice(2);
    setRecipes([...recipes,{id,name,photo:null,servings,items:[] }]); setRecipeDraft({name:"",servings:1}); setCurrentRecipe(id); }
  function setRecipeField(id,k,v){ setRecipes(recipes.map(r=> r.id===id?{...r,[k]:v}:r)); }
  function addIngredient(id, foodId, grams){ setRecipes(recipes.map(r=> r.id===id?{...r, items:[...r.items,{foodId,grams:parseIntSafe(grams)}]}:r)); }
  function removeIngredient(id, idx){ setRecipes(recipes.map(r=> r.id===id?{...r, items:r.items.filter((_,i)=>i!==idx)}:r)); }
  async function uploadPhoto(id, file){ if(!file) return; const dataUrl=await fileToCompressedDataUrl(file,800,0.8); setRecipeField(id,"photo",dataUrl); }
  async function fileToCompressedDataUrl(file,maxSize=800,quality=0.8){ return new Promise((resolve,reject)=>{ const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{ const canvas=document.createElement("canvas"); const scale=Math.min(1,maxSize/Math.max(img.width,img.height)); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale); const ctx=canvas.getContext("2d"); ctx.drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL("image/jpeg",quality)); }; img.onerror=reject; img.src=fr.result; }; fr.onerror=reject; fr.readAsDataURL(file); }); }
  function addRecipeToMeal(recipeId, meal, portions=1){ const r=recipes.find(x=>x.id===recipeId); if(!r) return; const item={recipeId, portions}; setDayLog(prev=>{ const next={...prev}; next[day]=next[day]||{meals:{breakfast:[],lunch:[],dinner:[],snacks:[]}}; next[day].meals[meal]=[...next[day].meals[meal], item]; return next; }); }
  function sumRecipe(r, portions){ const base=r.items.reduce((acc,it)=>{ const m=caloriesOf(it); acc.k+=m.k; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc; },{k:0,p:0,c:0,f:0}); const per={ k:Math.round(base.k/(r.servings||1)), p:Math.round(base.p/(r.servings||1)), c:Math.round(base.c/(r.servings||1)), f:Math.round(base.f/(r.servings||1)) }; return { k:per.k*portions, p:per.p*portions, c:per.c*portions, f:per.f*portions }; }
  const totals = Object.entries(dayLog[day].meals).reduce((acc,[_,arr])=>{ arr.forEach(it=>{ const r=recipes.find(x=>x.id===it.recipeId); if(r){ const m=sumRecipe(r, it.portions||1); acc.k+=m.k; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; } }); return acc; },{k:0,p:0,c:0,f:0});

  return (
    <div className="grid gap-6">
      <Card>
        <H2>Objectifs</H2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Sexe</Label><select className="border rounded-xl px-3 py-2" value={profile.sex} onChange={e=>setProfileField("sex", e.target.value)}><option value="H">Homme</option><option value="F">Femme</option></select>
            <Label>Âge</Label><Input type="number" value={profile.age} onChange={e=>setProfileField("age", parseIntSafe(e.target.value, 0))} />
            <Label>Taille (cm)</Label><Input type="number" value={profile.height} onChange={e=>setProfileField("height", parseIntSafe(e.target.value, 0))} />
            <Label>Poids (kg)</Label><Input type="number" value={profile.weight} onChange={e=>setProfileField("weight", parseIntSafe(e.target.value, 0))} />
          </div>
          <div className="grid gap-2">
            <Label>Activité</Label><select className="border rounded-xl px-3 py-2" value={profile.activity} onChange={e=>setProfileField("activity", e.target.value)}><option value="sedentary">Sédentaire</option><option value="light">Légère</option><option value="moderate">Modérée</option><option value="active">Active</option><option value="very">Très active</option></select>
            <Label>Objectif</Label><select className="border rounded-xl px-3 py-2" value={profile.goal} onChange={e=>setProfileField("goal", e.target.value)}><option value="maintain">Maintien</option><option value="cut">Perte de poids</option><option value="bulk">Prise de masse</option></select>
            <Label>Rythme (kg/sem) – optionnel</Label><Input type="number" step="0.1" value={profile.deltaPerWeekKg} onChange={e=>setProfileField("deltaPerWeekKg", parseFloat(e.target.value||0))} />
            <Label>Protéines g/kg • Lipides g/kg</Label><div className="flex gap-2"><Input type="number" step="0.1" value={profile.proteinPerKg} onChange={e=>setProfileField("proteinPerKg", parseFloat(e.target.value||0))} /><Input type="number" step="0.1" value={profile.fatPerKg} onChange={e=>setProfileField("fatPerKg", parseFloat(e.target.value||0))} /></div>
          </div>
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-3 text-sm">
          <div className="border rounded-xl p-3">Objectif calories: <b>{goalCals}</b> kcal</div>
          <div className="border rounded-xl p-3">Protéines: <b>{macros.protein}</b> g</div>
          <div className="border rounded-xl p-3">Glucides: <b>{macros.carbs}</b> g</div>
          <div className="border rounded-xl p-3">Lipides: <b>{macros.fat}</b> g</div>
        </div>
      </Card>

      <Card>
        <H2>Aliments & Recettes</H2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="grid gap-3">
            <div className="font-medium">Ajouter un aliment personnel (pour 100 g)</div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nom" value={foodDraft.name} onChange={e=>setFoodDraft({...foodDraft, name:e.target.value})} />
              <Input placeholder="kcal" type="number" value={foodDraft.kcal} onChange={e=>setFoodDraft({...foodDraft, kcal:e.target.value})} />
              <Input placeholder="Prot (g)" type="number" value={foodDraft.p} onChange={e=>setFoodDraft({...foodDraft, p:e.target.value})} />
              <Input placeholder="Gluc (g)" type="number" value={foodDraft.c} onChange={e=>setFoodDraft({...foodDraft, c:e.target.value})} />
              <Input placeholder="Lip (g)" type="number" value={foodDraft.f} onChange={e=>setFoodDraft({...foodDraft, f:e.target.value})} />
            </div>
            <Button onClick={addPersonalFood} className="bg-black text-white border-black">Ajouter l’aliment</Button>

            <div className="mt-4">
              <div className="font-medium mb-2">Créer une recette</div>
              <div className="grid gap-2">
                <Input placeholder="Nom de la recette" value={recipeDraft.name} onChange={e=>setRecipeDraft({...recipeDraft, name:e.target.value})} />
                <div className="flex items-center gap-2">
                  <Label>Portions</Label>
                  <Input type="number" min="1" value={recipeDraft.servings} onChange={e=>setRecipeDraft({...recipeDraft, servings: e.target.value})} style={{maxWidth:120}} />
                  <Button onClick={createRecipe} className="bg-black text-white border-black">Créer</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="font-medium">Mes recettes</div>
            <div className="grid gap-2 max-h-72 overflow-auto pr-2">
              {recipes.map(r=>(
                <div key={r.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.name} <span className="text-xs text-gray-500">({r.servings} portions)</span></div>
                    <Button onClick={()=>setCurrentRecipe(r.id)}>Éditer</Button>
                  </div>
                  {r.photo && <img src={r.photo} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" />}
                </div>
              ))}
              {recipes.length===0 && <div className="text-sm text-gray-500">Aucune recette pour l’instant.</div>}
            </div>
          </div>
        </div>

        {currentRecipe && (()=>{ const r=recipes.find(x=>x.id===currentRecipe); if(!r) return null;
          function caloriesOf(item){ const f=JSON.parse(localStorage.getItem("nut.foods")||"[]").find(ff=>ff.id===item.foodId); if(!f) return {k:0,p:0,c:0,f:0}; const ratio=(item.grams||0)/100; return {k:Math.round(f.per100.kcal*ratio), p:Math.round(f.per100.p*ratio), c:Math.round(f.per100.c*ratio), f:Math.round(f.per100.f*ratio)}; }
          const base = r.items.reduce((acc,it)=>{ const m=caloriesOf(it); acc.k+=m.k; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc; },{k:0,p:0,c:0,f:0});
          const perPortion = { k: Math.round(base.k/(r.servings||1)), p: Math.round(base.p/(r.servings||1)), c: Math.round(base.c/(r.servings||1)), f: Math.round(base.f/(r.servings||1)) };
          return (
            <div className="mt-6 rounded-2xl border p-4 grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Éditer : {r.name}</div>
                <input type="file" accept="image/*" onChange={e=>uploadPhoto(r.id, e.target.files?.[0])} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <div className="font-medium">Ingrédients</div>
                  <RecipeItemAdder foods={JSON.parse(localStorage.getItem("nut.foods")||"[]")} onAdd={(foodId,grams)=>addIngredient(r.id, foodId, grams)} />
                  <div className="grid gap-2 max-h-48 overflow-auto pr-2">
                    {r.items.map((it,idx)=>{ const foods=JSON.parse(localStorage.getItem("nut.foods")||"[]"); const food=foods.find(f=>f.id===it.foodId);
                      const ratio=(it.grams||0)/100; const m={ k:Math.round((food?.per100.kcal||0)*ratio), p:Math.round((food?.per100.p||0)*ratio), c:Math.round((food?.per100.c||0)*ratio), f:Math.round((food?.per100.f||0)*ratio) };
                      return (<div key={idx} className="flex items-center justify-between border rounded-xl px-3 py-2"><div className="text-sm"><div className="font-medium">{food?food.name:it.foodId}</div><div className="text-xs text-gray-500">{it.grams} g • {m.k} kcal • P{m.p}/G{m.c}/L{m.f}</div></div><Button className="text-red-600 border-red-400" onClick={()=>removeIngredient(r.id, idx)}>Retirer</Button></div>);
                    })}
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="font-medium">Macros</div>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div className="border rounded-xl p-3">Recette entière : <b>{base.k}</b> kcal • P{base.p}/G{base.c}/L{base.f}</div>
                    <div className="border rounded-xl p-3">Par portion : <b>{perPortion.k}</b> kcal • P{perPortion.p}/G{perPortion.c}/L{perPortion.f}</div>
                  </div>
                  <div className="font-medium mt-2">Ajouter au jour</div>
                  <MealAdder onAdd={(meal, portions)=>addRecipeToMeal(r.id, meal, portions)} />
                </div>
              </div>
              {r.photo && <img src={r.photo} alt="" className="w-full h-40 object-cover rounded-2xl" />}
            </div>
          );
        })()}
      </Card>

      <Card>
        <H2>Journal du jour</H2>
        <DayMeals recipes={recipes} dayLog={dayLog[day]} />
        <div className="mt-4 grid md:grid-cols-4 gap-3 text-sm">
          <div className="border rounded-xl p-3">Total kcal: <b>{totals.k}</b> / {goalCals}</div>
          <div className="border rounded-xl p-3">Protéines: <b>{totals.p}</b> / {macros.protein} g</div>
          <div className="border rounded-xl p-3">Glucides: <b>{totals.c}</b> / {macros.carbs} g</div>
          <div className="border rounded-xl p-3">Lipides: <b>{totals.f}</b> / {macros.fat} g</div>
        </div>
      </Card>
    </div>
  );
}

function RecipeItemAdder({ foods, onAdd }){ const [search,setSearch]=useState(""); const [grams,setGrams]=useState(100); const filtered=foods.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())); const [selected,setSelected]=useState(null);
  return (<div className="grid gap-2">
    <Input placeholder="Rechercher un aliment..." value={search} onChange={e=>setSearch(e.target.value)} />
    <div className="grid gap-2 max-h-40 overflow-auto pr-2">
      {filtered.map(f=>(<label key={f.id} className="flex items-center justify-between border rounded-xl px-3 py-2"><span className="text-sm">{f.name}</span><input type="radio" name="foodsel" onChange={()=>setSelected(f.id)} /></label>))}
      {filtered.length===0 && <div className="text-sm text-gray-500">Aucun aliment trouvé.</div>}
    </div>
    <div className="flex items-center gap-2"><Label>Poids (g)</Label><Input type="number" value={grams} onChange={e=>setGrams(parseInt(e.target.value||0))} style={{maxWidth:120}} /><Button onClick={()=> selected && onAdd(selected, grams)} className="bg-black text-white border-black">Ajouter</Button></div>
  </div>);
}

function MealAdder({ onAdd }){ const [meal,setMeal]=useState("lunch"); const [portions,setPortions]=useState(1);
  return (<div className="flex items-center gap-2">
    <select className="border rounded-xl px-3 py-2" value={meal} onChange={e=>setMeal(e.target.value)}>
      <option value="breakfast">Petit-déj</option><option value="lunch">Déjeuner</option><option value="dinner">Dîner</option><option value="snacks">Collation</option>
    </select>
    <Input type="number" min="1" value={portions} onChange={e=>setPortions(parseInt(e.target.value||1))} style={{maxWidth:100}} />
    <Button onClick={()=>onAdd(meal, portions)} className="bg-black text-white border-black">Ajouter au jour</Button>
  </div>);
}

function DayMeals({ recipes, dayLog }){ const meals=dayLog.meals; const nameOf={breakfast:"Petit-déj",lunch:"Déjeuner",dinner:"Dîner",snacks:"Collation"};
  function macroOfItem(it){ const r=recipes.find(x=>x.id===it.recipeId); if(!r) return {k:0,p:0,c:0,f:0};
    const foods=JSON.parse(localStorage.getItem("nut.foods")||"[]");
    const base=r.items.reduce((acc,ing)=>{ const food=foods.find(f=>f.id===ing.foodId); const ratio=(ing.grams||0)/100; acc.k+=Math.round((food?.per100.kcal||0)*ratio); acc.p+=Math.round((food?.per100.p||0)*ratio); acc.c+=Math.round((food?.per100.c||0)*ratio); acc.f+=Math.round((food?.per100.f||0)*ratio); return acc; },{k:0,p:0,c:0,f:0});
    const per={ k:Math.round(base.k/(r.servings||1)), p:Math.round(base.p/(r.servings||1)), c:Math.round(base.c/(r.servings||1)), f:Math.round(base.f/(r.servings||1)) }; const portions=it.portions||1; return { k:per.k*portions, p:per.p*portions, c:per.c*portions, f:per.f*portions }; }
  return (<div className="grid md:grid-cols-2 gap-4">
    {Object.keys(meals).map(key=>{ const arr=meals[key]; return (<div key={key} className="rounded-2xl border p-3"><div className="font-medium mb-2">{nameOf[key]}</div><div className="grid gap-2">
      {arr.map((it,idx)=>{ const r=recipes.find(x=>x.id===it.recipeId); const m=macroOfItem(it);
        return (<div key={idx} className="flex items-center justify-between border rounded-xl px-3 py-2"><div className="text-sm"><div className="font-medium">{r?r.name:it.recipeId}</div><div className="text-xs text-gray-500">{it.portions||1} portion(s) • {m.k} kcal • P{m.p}/G{m.c}/L{m.f}</div></div></div>);
      })}
      {arr.length===0 && <div className="text-sm text-gray-500">Rien pour l’instant.</div>}
    </div></div>); })}
  </div>);
}

/* ---------- Sommeil ---------- */
function Sleep(){
  const [goalH, setGoalH] = useLocalState("sleep.goalH", 8);
  const [wakeTomorrow, setWakeTomorrow] = useLocalState("sleep.wakeTomorrow", "07:00");
  const [sleepLog, setSleepLog] = useLocalState("sleep.log", {});
  const [morningHydrMl, setMorningHydrMl] = useLocalState("sleep.morningHydrMl", 500);
  const day = todayKey(); const slept = sleepLog[day]?.h ?? 0;
  function setSlept(h){ setSleepLog(prev=>({...prev,[day]:{h}})); }
  function bedtimeFromWake(wake, needH){ const [wh,wm]=wake.split(":").map(x=>parseInt(x,10)); const minutes=(wh*60+wm)-Math.round(needH*60); const m=(minutes+24*60)%(24*60); const hh=String(Math.floor(m/60)).padStart(2,"0"); const mm=String(m%60).padStart(2,"0"); return `${hh}:${mm}`; }
  const suggestedBed=bedtimeFromWake(wakeTomorrow, goalH);
  const now=new Date(); const [sh,sm]=suggestedBed.split(":").map(x=>parseInt(x,10));
  const target=new Date(now.getFullYear(),now.getMonth(),now.getDate(),sh,sm,0); const msLeft=target.getTime()-now.getTime(); const hoursLeft=Math.floor(msLeft/3600000); const minsLeft=Math.max(0, Math.floor((msLeft%3600000)/60000));
  const [hydrBanner, setHydrBanner] = useState(true);
  function logMorningHydration(){ const d=todayKey(); const logs=JSON.parse(localStorage.getItem("hydr.logs")||"{}"); const cur=logs[d]?.ml||0; logs[d]={ml:cur+morningHydrMl}; localStorage.setItem("hydr.logs", JSON.stringify(logs)); setHydrBanner(false); }
  const after23 = suggestedBed >= "23:00";
  return (<div className="grid gap-6">
    <Card><H2>Sommeil</H2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Heures visées / nuit</Label><Input type="number" step="0.5" value={goalH} onChange={e=>setGoalH(parseFloat(e.target.value||0))} />
          <Label>Heure de réveil demain</Label><Input type="time" value={wakeTomorrow} onChange={e=>setWakeTomorrow(e.target.value)} />
          <div className="text-sm">Coucher conseillé : <b>{suggestedBed}</b> {after23 && <span className="text-amber-600">• vise avant 23h si possible</span>}</div>
          <div className="text-xs text-gray-500">Astuce : mieux vaut se coucher avant 23h, quitte à te réveiller un peu plus tôt demain.</div>
          <div className="text-sm">Compte à rebours : {hoursLeft>=0 ? `${hoursLeft}h ${minsLeft}min` : "passé"}</div>
        </div>
        <div className="grid gap-2">
          <Label>Sommeil la nuit dernière (h)</Label><Input type="number" step="0.25" value={slept} onChange={e=>setSlept(parseFloat(e.target.value||0))} />
          <Label>Hydratation au réveil (mL)</Label>
          <div className="flex gap-2 items-center"><Input type="number" value={morningHydrMl} onChange={e=>setMorningHydrMl(parseIntSafe(e.target.value,500))} style={{maxWidth:150}} /><Button onClick={logMorningHydration} className="bg-black text-white border-black">J’ai bu</Button></div>
        </div>
      </div>
    </Card>
    {hydrBanner && (<Card className="border-amber-300"><div className="text-sm">💧 Au réveil, pense à boire <b>{morningHydrMl} mL</b> d’eau pour bien démarrer la journée.</div>
      <div className="text-xs text-gray-500">Hier tu as bu {(()=>{ const d=new Date(); d.setDate(d.getDate()-1); const k=d.toISOString().slice(0,10); const logs=JSON.parse(localStorage.getItem("hydr.logs")||"{}"); const ml=logs[k]?.ml||0; return ml+" mL"; })()}.</div></Card>)}
  </div>);
}

/* ---------- Notes ---------- */
function Notes(){
  const [cats, setCats] = useLocalState("notes.cats", ["À faire","À acheter","Idées"]);
  const [active, setActive] = useLocalState("notes.active", "À faire");
  const [itemsByCat, setItemsByCat] = useLocalState("notes.items", {});
  const [newItem, setNewItem] = useState(""); const [catDraft, setCatDraft] = useState("");
  useEffect(()=>{ setItemsByCat(prev=>{ const next={...prev}; cats.forEach(c=>{ if(!next[c]) next[c]=[]; }); return next; }); if(!cats.includes(active)) setActive(cats[0]||"À faire"); },[JSON.stringify(cats)]);
  function addCat(){ const name=catDraft.trim(); if(!name) return; if(!cats.includes(name)) setCats([...cats,name]); setCatDraft(""); }
  function removeCat(name){ const filtered=cats.filter(c=>c!==name); setCats(filtered); const copy={...itemsByCat}; delete copy[name]; setItemsByCat(copy); if(active===name) setActive(filtered[0]||""); }
  function addItem(){ if(!newItem.trim()) return; setItemsByCat(prev=>{ const next={...prev}; next[active]=[...(next[active]||[]), {id:Math.random().toString(36).slice(2), text:newItem.trim(), done:false, created:Date.now()}]; return next; }); setNewItem(""); }
  function toggle(id){ setItemsByCat(prev=>{ const next={...prev}; next[active]=(next[active]||[]).map(it=> it.id===id?{...it,done:!it.done}:it); return next; }); }
  function remove(id){ setItemsByCat(prev=>{ const next={...prev}; next[active]=(next[active]||[]).filter(it=>it.id!==id); return next; }); }
  return (<Card><H2>Notes</H2>
    <div className="flex gap-2 overflow-x-auto pb-2">
      {cats.map(c=>(<div key={c} className="flex items-center gap-2"><Button onClick={()=>setActive(c)} className={cls(active===c && "bg-black text-white border-black")}>{c}</Button>{c!=="À faire"&&c!=="À acheter"&&c!=="Idées"&&<Button className="text-red-600 border-red-400" onClick={()=>removeCat(c)}>x</Button>}</div>))}
      <div className="flex items-center gap-2 ml-auto"><Input placeholder="Nouvelle catégorie" value={catDraft} onChange={e=>setCatDraft(e.target.value)} style={{maxWidth:180}} /><Button onClick={addCat} className="bg-black text-white border-black">Ajouter</Button></div>
    </div>
    <div className="mt-4 grid gap-2">
      <div className="flex gap-2"><Input value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder={`Ajouter à "${active}"...`} /><Button onClick={addItem} className="bg-black text-white border-black">Ajouter</Button></div>
      <div className="grid gap-2 max-h-72 overflow-auto pr-2">
        {(itemsByCat[active]||[]).map(it => (<label key={it.id} className="flex items-center justify-between border rounded-xl px-3 py-2"><span className="flex items-center gap-3"><input type="checkbox" checked={it.done} onChange={()=>toggle(it.id)} /><span className={cls(it.done && "line-through text-gray-400")}>{it.text}</span></span><Button className="text-red-600 border-red-400" onClick={()=>remove(it.id)}>Suppr</Button></label>))}
        {(itemsByCat[active]||[]).length===0 && <div className="text-sm text-gray-500">Aucun élément.</div>}
      </div>
    </div>
  </Card>);
}

/* ---------- Dashboard ---------- */
function Dashboard(){
  const day=todayKey();
  const hydrLogs=JSON.parse(localStorage.getItem("hydr.logs")||"{}");
  const hydrGoal=JSON.parse(localStorage.getItem("hydr.goal")||"2500");
  const ml=hydrLogs[day]?.ml??0; const hydrDone=ml>=hydrGoal;
  const notes=JSON.parse(localStorage.getItem("notes.items")||"{}");
  const notesDone=Object.values(notes).some(list=>(list||[]).some(it=>it.done));
  const sleep=JSON.parse(localStorage.getItem("sleep.log")||"{}");
  const goalSleep=JSON.parse(localStorage.getItem("sleep.goalH")||"8");
  const sleepH=sleep[day]?.h??0; const sleepDone=sleepH>=goalSleep;
  const nutDay=JSON.parse(localStorage.getItem("nut.daylog")||"{}")[day]||{meals:{breakfast:[],lunch:[],dinner:[],snacks:[]}};
  const recipes=JSON.parse(localStorage.getItem("nut.recipes")||"[]"); const foods=JSON.parse(localStorage.getItem("nut.foods")||"[]");
  function macroOfItem(it){ const r=recipes.find(x=>x.id===it.recipeId); if(!r) return {k:0,p:0,c:0,f:0};
    const base=r.items.reduce((acc,ing)=>{ const food=foods.find(f=>f.id===ing.foodId); const ratio=(ing.grams||0)/100; acc.k+=Math.round((food?.per100.kcal||0)*ratio); acc.p+=Math.round((food?.per100.p||0)*ratio); acc.c+=Math.round((food?.per100.c||0)*ratio); acc.f+=Math.round((food?.per100.f||0)*ratio); return acc; },{k:0,p:0,c:0,f:0});
    const per={ k:Math.round(base.k/(r.servings||1)), p:Math.round(base.p/(r.servings||1)), c:Math.round(base.c/(r.servings||1)), f:Math.round(base.f/(r.servings||1)) }; const portions=it.portions||1; return { k:per.k*portions, p:per.p*portions, c:per.c*portions, f:per.f*portions }; }
  const totals=Object.values(nutDay.meals).flat().reduce((acc,it)=>{ const m=macroOfItem(it); acc.k+=m.k; acc.p+=m.p; acc.c+=m.c; acc.f+=m.f; return acc; },{k:0,p:0,c:0,f:0});
  const goalCals=JSON.parse(localStorage.getItem("nut.profile")||"{}");
  const targetK=(()=>{ if(!goalCals||!goalCals.weight) return 0; const w=goalCals.weight,h=goalCals.height,a=goalCals.age||25,s=goalCals.sex==="F"?-161:5; const bmr=10*w+6.25*h-5*a+s; const map={sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very:1.9}; let tdee=bmr*(map[goalCals.activity||"moderate"]||1.55); if(goalCals.goal==="cut") tdee-=300; if(goalCals.goal==="bulk") tdee+=300; return Math.round(tdee); })();
  const nutDone = targetK>0 ? totals.k <= targetK*1.05 && totals.k >= targetK*0.85 : false;
  const score = (hydrDone?20:0) + (notesDone?20:0) + (sleepDone?25:0) + (nutDone?25:0);
  const scorePct=Math.round(score);
  return (<div className="grid gap-6">
    <Card><H2>Score du jour</H2>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full border-8 border-gray-200 grid place-items-center relative">
          <div className="absolute inset-0 rounded-full" style={{background: `conic-gradient(#111 ${scorePct*3.6}deg, #e5e7eb 0deg)`}} />
          <div className="absolute inset-2 rounded-full bg-white grid place-items-center text-2xl font-bold">{scorePct}</div>
        </div>
        <ul className="text-sm space-y-1">
          <li>Hydratation : {hydrDone? "✅" : "❌"} ({ml}/{hydrGoal} mL)</li>
          <li>Sommeil : {sleepDone? "✅" : "❌"} ({sleepH}/{goalSleep} h)</li>
          <li>Nutrition : {nutDone? "✅" : "⚠️"} ({totals.k}/{targetK || "?"} kcal)</li>
          <li>Notes : {notesDone? "✅" : "—"}</li>
        </ul>
      </div>
    </Card>
    <div className="grid md:grid-cols-2 gap-6">
      <Card><H2>Hydratation</H2><div className="text-sm">Aujourd’hui : <b>{ml} mL</b> / {hydrGoal} mL</div></Card>
      <Card><H2>Sommeil</H2><div className="text-sm">Dernière nuit : <b>{sleepH} h</b> • Objectif : {goalSleep} h</div></Card>
      <Card><H2>Nutrition</H2><div className="text-sm">Total kcal : <b>{totals.k}</b> {targetK?`/ ${targetK}`:""}</div></Card>
      <Card><H2>Musculation</H2><div className="text-sm">Va dans l’onglet Musculation pour gérer tes séances. 💪</div></Card>
    </div>
  </div>);
}
