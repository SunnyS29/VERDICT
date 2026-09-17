import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScores, answerMissing, ahp, topsis, weightedSum, minimaxRegret, sensitivity, evaluateDecision } from '../src/decision.js';

const options = [{id:'a',name:'Alpha'},{id:'b',name:'Beta'}];
const criteria = [{id:'price',name:'Price',type:'number',lowerBetter:true},{id:'quality',name:'Quality',type:'scale'},{id:'feature',name:'Feature',type:'yesno'}];
const judgments = {'0-1':1,'0-2':1,'1-2':1};
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);
const same = () => ({a:{price:100,quality:5,feature:false},b:{price:100,quality:5,feature:false}});

test('AHP recovers a known consistent weight ratio',()=>{
 const {weights,CR}=ahp(criteria,{'0-1':2,'0-2':6,'1-2':3});
 close(weights.price,.6); close(weights.quality,.3);close(weights.feature,.1);close(CR,0);
});
test('AHP flags a contradictory cycle',()=>{
 assert.ok(ahp(criteria,{'0-1':5,'0-2':.2,'1-2':5}).CR>.1);
});
test('numeric benefits, costs, zero, and tied columns normalize correctly',()=>{
 const raw=same(); raw.a.price='0'; raw.b.price='100';
 let n=normalizeScores(options,criteria,raw);
 close(n.a.price,10);close(n.b.price,0);close(n.a.feature,0);
 n=normalizeScores(options,criteria.map(c=>({...c,lowerBetter:false})),raw);
 close(n.a.price,0);close(n.b.price,10);
 close(normalizeScores(options,criteria,same()).a.price,5);
});
test('finite numbers cannot overflow during normalization',()=>{
 const raw=same();raw.a.price=-1e308;raw.b.price=1e308;
 const n=normalizeScores(options,criteria,raw);
 close(n.a.price,10);close(n.b.price,0);
 const result=evaluateDecision(options,criteria,raw,judgments);
 assert.ok(result.ranked.every(o=>Number.isFinite(o.closeness)));
});
test('TOPSIS matches a hand-calculated two-option example',()=>{
 const c=[{id:'x'},{id:'y'}],w={x:.75,y:.25},scores={a:{x:8,y:2},b:{x:2,y:8}};
 const rank=topsis(options,c,w,scores);
 assert.equal(rank[0].id,'a');close(rank[0].closeness,.75);close(rank[1].closeness,.25);
 close(weightedSum(options,c,w,scores)[0].total,.65);
 close(minimaxRegret(options,c,w,scores)[0].maxRegret,1.5);
});
test('identical options tie at the neutral score, independent of input order',()=>{
 for(const opts of [options,[...options].reverse()]){
  const r=evaluateDecision(opts,criteria,same(),judgments);
  assert.equal(r.top.length,2);r.ranked.forEach(o=>close(o.closeness,.5));
  assert.equal(r.sawLeaders.length,2);assert.equal(r.regretLeaders.length,2);assert.equal(r.sawAgrees,false);
  assert.match(r.rationale.why,/do not select a single winner/);
  assert.doesNotMatch(r.rationale.why,/wins|safest/);
 }
});
test('all-zero scores tie without NaN or a false winner',()=>{
 const c=criteria.map(c=>({...c,type:'scale'}));
 const raw={a:{price:0,quality:0,feature:0},b:{price:0,quality:0,feature:0}};
 const r=evaluateDecision(options,c,raw,judgments);
 assert.equal(r.top.length,2);r.ranked.forEach(o=>close(o.closeness,.5));
});
test('different feature profiles with equal TOPSIS scores are also a tie',()=>{
 const c=criteria.map(c=>({...c,type:'scale'}));
 const raw={a:{price:10,quality:0,feature:5},b:{price:0,quality:10,feature:5}};
 assert.equal(evaluateDecision(options,c,raw,judgments).top.length,2);
});
test('ties in sensitivity tests never count as a surviving sole winner',()=>{
 const stress=sensitivity(options,criteria,{price:1/3,quality:1/3,feature:1/3},normalizeScores(options,criteria,same()),'a');
 assert.deepEqual(stress,{held:0,tied:6,total:6,fraction:0});
});
test('a dominating option remains the sole leader in every tested weight change',()=>{
 const raw={a:{price:100,quality:8,feature:true},b:{price:200,quality:2,feature:false}};
 const r=evaluateDecision(options,criteria,raw,judgments);
 assert.equal(r.top[0].id,'a');assert.equal(r.top.length,1);assert.equal(r.stress.held,6);assert.equal(r.sawAgrees,true);
});
test('missing yes/no answers differ from an explicit No',()=>{
 for(const v of [undefined,null,'',0,'false'])assert.equal(answerMissing(criteria[2],v),true);
 for(const v of [true,false])assert.equal(answerMissing(criteria[2],v),false);
 const raw=same();raw.a.feature=null;
 assert.throws(()=>evaluateDecision(options,criteria,raw,judgments),/Alpha: Feature/);
});
test('blank and non-finite inputs are rejected; zero and decimals are accepted',()=>{
 for(const v of ['', ' ',null,undefined,Infinity,NaN,'1e309',true])assert.equal(answerMissing(criteria[0],v),true);
 for(const v of [0,'0','12.50',-1])assert.equal(answerMissing(criteria[0],v),false);
 assert.equal(answerMissing(criteria[1],11),true);assert.equal(answerMissing(criteria[1],-1),true);
});
test('a missing priority judgment is not silently treated as equal',()=>{
 assert.throws(()=>evaluateDecision(options,criteria,same(),{}),/Complete every priority/);
});
test('ties on a feature are not described as an advantage',()=>{
 const raw={a:{price:100,quality:8,feature:true},b:{price:200,quality:8,feature:true}};
 const r=evaluateDecision(options,criteria,raw,judgments);
 assert.match(r.rationale.why,/scores better on Price/);
 assert.doesNotMatch(r.rationale.why,/scores better on Quality|scores better on Feature/);
});
test('a third tied leader is not described as falling behind',()=>{
 const opts=[...options,{id:'c',name:'Gamma'}], raw={...same(),c:{...same().a}};
 const r=evaluateDecision(opts,criteria,raw,judgments);
 assert.equal(r.top.length,3);assert.deepEqual(r.rationale.whyNot,[]);
});
test('different aggregation methods can select different leaders',()=>{
 const opts=[...options,{id:'c',name:'Gamma'}];
 const c=['x','y','z'].map(id=>({id,name:id,type:'scale'}));
 const raw={a:{x:7,y:2,z:0},b:{x:8,y:2,z:0},c:{x:0,y:3,z:4}};
 const r=evaluateDecision(opts,c,raw,judgments);
 assert.equal(r.top[0].id,'c');assert.equal(r.sawLeaders[0].id,'b');assert.equal(r.sawAgrees,false);
 assert.doesNotMatch(r.rationale.closer,/interchangeable|safe to commit|stop researching/);
});
